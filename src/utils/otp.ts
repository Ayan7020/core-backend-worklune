import crypto from "crypto";

export function generate4DigitOTP(): number {
  return crypto.randomInt(1000, 10000);
}
