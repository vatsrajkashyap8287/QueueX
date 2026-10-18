import dotenv from "dotenv";
import { createClient } from "redis";

dotenv.config();

const redis = createClient({
  url: process.env.REDIS_URL
});

redis.on("error", (error) => {
  console.error("Redis Error:", error.message);
});

const clearRedis = async () => {
  try {
    await redis.connect();

    console.log("Redis Connected");

    let deleted = 0;

    for await (const key of redis.scanIterator({
      MATCH: "queue:*:waiting",
      COUNT: 100
    })) {
      await redis.del(key);
      deleted++;
    }

    console.log(`Deleted ${deleted} old QueueX waiting lists`);

  } catch (error) {
    console.error("Error:", error.message);
  } finally {
    if (redis.isOpen) {
      await redis.quit();
    }
  }
};

clearRedis();