export const OTP_LUA_SCRIPT = `
local reqKey = KEYS[1]
local blockKey = KEYS[2]
local otpKey = KEYS[3]
local otpCoolDownKey = KEYS[4]

local maxAttempts = tonumber(ARGV[1])
local windowTTL = tonumber(ARGV[2])
local blockTTL = tonumber(ARGV[3])
local otpTTL = tonumber(ARGV[4])
local OTP_COOLDOWN_TTL = tonumber(ARGV[5])


local hash             = ARGV[6]
local salt           = ARGV[7]
local retry_limit       = ARGV[8]

-- Check block
if redis.call("EXISTS", blockKey) == 1 then
  return "BLOCKED" 
end

-- Check Cooldown
if redis.call("EXISTS",otpCoolDownKey) == 1 then 
    return "COOL_DOWN" 
end

-- Increase request count
local count = redis.call("INCR", reqKey)

if count == 1 then
  redis.call("EXPIRE", reqKey, windowTTL)
end

if count > maxAttempts then
  redis.call("SET", blockKey, "1", "EX", blockTTL)
  return  "RATE_LIMIT" 
end

-- Store OTP
redis.call("HSET", otpKey, "hash", hash, "salt", salt,"retry_limit",retry_limit)
redis.call("EXPIRE",otpKey,otpTTL)
redis.call("SET",otpCoolDownKey,"1","EX",OTP_COOLDOWN_TTL)
return "OK"
`;
