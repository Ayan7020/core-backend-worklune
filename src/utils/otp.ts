import crypto from "crypto";
import redisClient from "@/services/redis.service";
import { TooManyRequestError } from "./errors/HttpErrors";
import { OTP_LUA_SCRIPT } from "./Constants/lua_script";
import { OtpInterface } from "@/types/common";

export class OtpService {
  private static readonly OTP_TTL = 300; // 5 min
  private static readonly WINDOW_TTL = 300; // 5 min
  private static readonly BLOCK_TTL = 600; // 10 min
  private static readonly MAX_ATTEMPTS = 3; // 3 max attempt in 5 min
  private static readonly OTP_COOLDOWN_TTL = 60; // 1 min of cool down

  static generateOtp(): string {
    return crypto.randomInt(100000, 999999).toString();
  }

  static async sendOtp(email: string, payload: OtpInterface): Promise<true> {
    if (!email || !payload) {
      throw new Error("Invalid payload");
    }

    const result = await redisClient.eval(
      OTP_LUA_SCRIPT,
      4,
      `otp:req:${email}`,
      `otp:block:${email}`,
      `otp:data:${email}`,
      `otp:cooldown:${email}`,
      this.MAX_ATTEMPTS,
      this.WINDOW_TTL,
      this.BLOCK_TTL,
      this.OTP_TTL,
      this.OTP_COOLDOWN_TTL,
      payload.hash,
      payload.salt,
      payload.retry_limit,
    );

    if (result === "BLOCKED") {
      throw new TooManyRequestError("Too many requests", {
        validationError: [{ field: "otp", message: "Account temporarily blocked" }],
      });
    }

    if (result === "RATE_LIMIT") {
      throw new TooManyRequestError("Too many requests", {
        validationError: [{ field: "otp", message: "OTP limit exceeded" }],
      });
    }

    if (result === "COOL_DOWN") {
      throw new TooManyRequestError("Too many requests", {
        validationError: [{ field: "otp", message: "Wait before requesting another OTP" }],
      });
    }

    return true;
  }

  static async getOtp(email: string): Promise<OtpInterface | null> {
    const data = await redisClient.hgetall(`otp:data:${email}`);

    if (!data || Object.keys(data).length === 0) return null;

    return {
      hash: data.hash,
      salt: data.salt,
      retry_limit: Number(data.retry_limit),
    };
  }

  static async deleteOtp(email: string): Promise<boolean> {
    const deleted = await redisClient.del(`otp:data:${email}`);
    return Boolean(deleted);
  }

  static async decrementRetry(email: string): Promise<number> {
    const key = `otp:data:${email}`;

    const remaining = await redisClient.hincrby(key, "retry_limit", -1);

    return remaining;
  }
}
