import { createClient } from "redis";

const redisClient = createClient({
  url: process.env.REDIS_URL
});

// Redis error handler
redisClient.on("error", (err) => {
  console.error("Redis Error:", err.message);
});

// Redis ready event
redisClient.on("ready", () => {
  console.log("Redis Client Ready");
});

// Connect Redis
const connectRedis = async () => {
  try {
    await redisClient.connect();

    console.log("Redis Connected Successfully!");

  } catch (error) {
    console.error("Redis Connection Failed:", error.message);
    process.exit(1);
  }
};

export { redisClient, connectRedis };