// Leaky Bucket Approach for global system capacity
import { RateLimiterRedis, RateLimiterQueue } from "rate-limiter-flexible";
import redisClient from "@/services/redis.service";

const globalBaseLimiter = new RateLimiterRedis({
  storeClient: redisClient,
  keyPrefix: "rl:global",
  points: Number(process.env.GLOBAL_SERVER_RATE_LIMIT) || 500,
  duration: Number(process.env.GLOBAL_SERVER_RATE_LIMIT_SEC) || 30,
});

export const globalLimiter = new RateLimiterQueue(globalBaseLimiter, {
  maxQueueSize: Number(process.env.GLOBAL_SERVER_RATE_LIMIT_MAX_QUEUE_SIZE) || 100,
});
