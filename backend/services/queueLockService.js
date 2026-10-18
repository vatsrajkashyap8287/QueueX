import { randomUUID } from "crypto";

import { redisClient } from "../config/redis.js";

// ==========================================
// CONFIGURATION
// ==========================================

const LOCK_TTL_MS = 15000;
const LOCK_RENEW_INTERVAL_MS = 5000;
const LOCK_RETRY_DELAY_MS = 100;
const LOCK_MAX_WAIT_MS = 5000;

// ==========================================
// HELPERS
// ==========================================

const getLockKey = (queueId) => {
  return `queue:${queueId}:lock`;
};

const sleep = (ms) => {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
};

const createLockLostError = () => {
  const error = new Error(
    "Queue lock was lost. Please refresh and try again."
  );

  error.statusCode = 409;

  return error;
};

// ==========================================
// LUA SCRIPTS
// ==========================================

const RENEW_LOCK_SCRIPT = `
  if redis.call("GET", KEYS[1]) == ARGV[1] then
    return redis.call("PEXPIRE", KEYS[1], ARGV[2])
  end

  return 0
`;

const RELEASE_LOCK_SCRIPT = `
  if redis.call("GET", KEYS[1]) == ARGV[1] then
    return redis.call("DEL", KEYS[1])
  end

  return 0
`;

// ==========================================
// ACQUIRE REDIS LOCK
// ==========================================

export const acquireQueueLock = async (queueId) => {
  const key = getLockKey(queueId);
  const lockToken = randomUUID();

  const startTime = Date.now();

  while (Date.now() - startTime < LOCK_MAX_WAIT_MS) {
    const result = await redisClient.set(
      key,
      lockToken,
      {
        NX: true,
        PX: LOCK_TTL_MS
      }
    );

    if (result === "OK") {
      return {
        key,
        token: lockToken
      };
    }

    await sleep(LOCK_RETRY_DELAY_MS);
  }

  return null;
};

// ==========================================
// RENEW LOCK
// ==========================================

export const renewQueueLock = async (lock) => {
  if (!lock?.key || !lock?.token) {
    return false;
  }

  const result = await redisClient.eval(
    RENEW_LOCK_SCRIPT,
    {
      keys: [lock.key],
      arguments: [
        lock.token,
        LOCK_TTL_MS.toString()
      ]
    }
  );

  return Number(result) === 1;
};

// ==========================================
// VERIFY LOCK OWNERSHIP
// ==========================================

export const verifyQueueLock = async (lock) => {
  if (!lock?.key || !lock?.token) {
    return false;
  }

  const currentToken = await redisClient.get(
    lock.key
  );

  return currentToken === lock.token;
};

// ==========================================
// RELEASE LOCK SAFELY
// ==========================================

export const releaseQueueLock = async (lock) => {
  if (!lock?.key || !lock?.token) {
    return;
  }

  try {
    await redisClient.eval(
      RELEASE_LOCK_SCRIPT,
      {
        keys: [lock.key],
        arguments: [lock.token]
      }
    );
  } catch (error) {
    console.error(
      "Redis lock release error:",
      error.message
    );
  }
};

// ==========================================
// RUN OPERATION WITH AUTO-RENEWING LOCK
// ==========================================

export const withQueueLock = async (
  queueId,
  operation
) => {
  const lock = await acquireQueueLock(queueId);

  if (!lock) {
    const error = new Error(
      "Queue is busy. Please try again."
    );

    error.statusCode = 409;

    throw error;
  }

  let renewalStopped = false;
  let renewalInProgress = false;
  let lockLost = false;

  const renewalTimer = setInterval(async () => {
    if (renewalStopped || renewalInProgress) {
      return;
    }

    renewalInProgress = true;

    try {
      const renewed = await renewQueueLock(lock);

      if (!renewed) {
        lockLost = true;
        renewalStopped = true;

        console.error(
          `Redis lock ownership lost: ${lock.key}`
        );

        clearInterval(renewalTimer);
      }
    } catch (error) {
      console.error(
        "Redis lock renewal error:",
        error.message
      );

      // Redis may recover before the next renewal.
      // Ownership will be verified before returning.
    } finally {
      renewalInProgress = false;
    }
  }, LOCK_RENEW_INTERVAL_MS);

  renewalTimer.unref?.();

  try {
    // Pass the lock to operations that need it.
    // Existing callbacks without parameters still work.
    const result = await operation(lock);

    if (lockLost) {
      throw createLockLostError();
    }

    // Verify ownership before completing the operation.
    const stillOwned = await verifyQueueLock(lock);

    if (!stillOwned) {
      throw createLockLostError();
    }

    return result;
  } finally {
    renewalStopped = true;

    clearInterval(renewalTimer);

    await releaseQueueLock(lock);
  }
};