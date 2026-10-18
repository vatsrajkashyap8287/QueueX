import { redisClient } from "../config/redis.js";

const getQueueKey = (queueId) => {
  return `queue:${queueId}:waiting`;
};

// Add token to waiting queue
export const addToQueue = async (queueId, entryId) => {
  const key = getQueueKey(queueId);

  await redisClient.rPush(key, entryId.toString());
};

// Remove token from waiting queue
export const removeFromQueue = async (queueId, entryId) => {
  const key = getQueueKey(queueId);

  await redisClient.lRem(
    key,
    0,
    entryId.toString()
  );
};

// Get next waiting entry
export const getNextEntry = async (queueId) => {
  const key = getQueueKey(queueId);

  return await redisClient.lIndex(key, 0);
};

// Get queue position
export const getQueuePosition = async (queueId, entryId) => {
  const key = getQueueKey(queueId);

  const position = await redisClient.lPos(
    key,
    entryId.toString()
  );

  if (position === null) {
    return null;
  }

  return position + 1;
};

// Get waiting count
export const getWaitingCount = async (queueId) => {
  const key = getQueueKey(queueId);

  return await redisClient.lLen(key);
};