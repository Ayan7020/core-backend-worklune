import Redis from "ioredis";

if (!process.env.REDIS_URL) {
  throw new Error("REDIS_URL is not defined");
}

const redisClient = new Redis(process.env.REDIS_URL, {
  maxRetriesPerRequest: Number(process.env.REDIS_MAX_RETRIES ?? 3),
  connectTimeout: Number(process.env.REDIS_CONNECT_TIMEOUT ?? 10_000),
  enableReadyCheck: true,
  lazyConnect: false,

  retryStrategy(times) {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
});

redisClient.on("connect", () => {
  console.info("Redis connected");
});

redisClient.on("ready", () => {
  console.info("Redis ready");
});

redisClient.on("reconnecting", (time: Number) => {
  console.warn(`Redis reconnecting in ${time}ms`);
});

redisClient.on("error", (err) => {
  console.error("Redis error", err);
});

redisClient.on("close", () => {
  console.warn("Redis connection closed");
});

export default redisClient;
