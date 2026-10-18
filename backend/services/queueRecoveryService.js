import QueueEntry from "../models/QueueEntry.js";

import { redisClient } from "../config/redis.js";

// ==========================================
// HELPERS
// ==========================================

const getQueueKey = (queueId) => {
  return `queue:${queueId}:waiting`;
};

const getExpectedWaitingIds = async (queueId) => {
  const waitingEntries = await QueueEntry.find({
    queue: queueId,
    status: "waiting"
  })
    .sort({
      tokenNumber: 1,
      _id: 1
    })
    .select("_id");

  return waitingEntries.map((entry) =>
    entry._id.toString()
  );
};

const validateLock = (queueId, lock) => {
  const expectedLockKey = `queue:${queueId}:lock`;

  if (
    !lock?.key ||
    !lock?.token ||
    lock.key !== expectedLockKey
  ) {
    const error = new Error(
      "A valid queue lock is required for recovery."
    );

    error.statusCode = 409;

    throw error;
  }
};

// ==========================================
// ATOMIC REDIS REBUILD LUA SCRIPT
// ==========================================

// KEYS[1] = lock key
// KEYS[2] = waiting list key
//
// ARGV[1] = lock token
// ARGV[2...] = ordered waiting entry IDs

const REBUILD_QUEUE_SCRIPT = `
  if redis.call("GET", KEYS[1]) ~= ARGV[1] then
    return -1
  end

  redis.call("DEL", KEYS[2])

  if #ARGV > 1 then
    redis.call(
      "RPUSH",
      KEYS[2],
      unpack(ARGV, 2)
    )
  end

  return #ARGV - 1
`;

// ==========================================
// REBUILD REDIS WAITING QUEUE FROM MONGODB
// ==========================================

export const rebuildWaitingQueue = async (
  queueId,
  lock
) => {
  validateLock(queueId, lock);

  const entryIds =
    await getExpectedWaitingIds(queueId);

  const waitingKey = getQueueKey(queueId);

  const result = await redisClient.eval(
    REBUILD_QUEUE_SCRIPT,
    {
      keys: [
        lock.key,
        waitingKey
      ],
      arguments: [
        lock.token,
        ...entryIds
      ]
    }
  );

  if (Number(result) === -1) {
    const error = new Error(
      "Queue lock was lost during recovery. Please retry."
    );

    error.statusCode = 409;

    throw error;
  }

  return {
    queueId: queueId.toString(),
    waitingCount: entryIds.length,
    rebuilt: true
  };
};

// ==========================================
// CHECK REDIS AND MONGODB CONSISTENCY
// ==========================================

export const checkQueueConsistency = async (
  queueId
) => {
  const expectedIds =
    await getExpectedWaitingIds(queueId);

  const actualIds = await redisClient.lRange(
    getQueueKey(queueId),
    0,
    -1
  );

  const consistent =
    expectedIds.length === actualIds.length &&
    expectedIds.every(
      (id, index) => id === actualIds[index]
    );

  return {
    queueId: queueId.toString(),
    consistent,
    mongoWaitingCount: expectedIds.length,
    redisWaitingCount: actualIds.length
  };
};

// ==========================================
// REPAIR ONLY WHEN INCONSISTENCY IS FOUND
// ==========================================

export const ensureQueueConsistency = async (
  queueId,
  lock
) => {
  validateLock(queueId, lock);

  const result =
    await checkQueueConsistency(queueId);

  if (result.consistent) {
    return {
      ...result,
      repaired: false
    };
  }

  console.warn(
    `Queue inconsistency detected for ${queueId}. Rebuilding Redis FIFO.`
  );

  await rebuildWaitingQueue(
    queueId,
    lock
  );

  return {
    ...result,
    repaired: true
  };
};