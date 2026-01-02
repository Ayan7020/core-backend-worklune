// Token bucket rate limiter for the user level per api
import redisClient from "@/services/redis.service";
import { RateLimiterRedis } from "rate-limiter-flexible";

export const userLimiter = new RateLimiterRedis({
  storeClient: redisClient,
  keyPrefix: "rl:Authuser",
  points: Number(process.env.AUTHORIZED_USER_RATE_LIMIT) || 10,
  duration: Number(process.env.AUTHORIZED_USER_RATE_LIMIT_SEC) || 30,
});
