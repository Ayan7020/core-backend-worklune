// Token bucket rate limiter for the user level per api 
import redisClient from "@/services/redis.service";
import { RateLimiterRedis } from "rate-limiter-flexible";

export const anomLimiter = new RateLimiterRedis({
  storeClient: redisClient,
  keyPrefix: "rl:UnAuthuser",
  points: Number(process.env.UNAUTHORIZED_USER_RATE_LIMIT) || 5,      
  duration: Number(process.env.UNAUTHORIZED_USER_RATE_LIMIT_SEC) || 30    
});