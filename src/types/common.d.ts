export interface SendEmailPayload {
    name: string;
    otp: string;
    email: string;
    subject?: string;
}

 const OtpObj = {
            salt: saltOtp,
            hash: hashOtp,
            retry_limit: 3
        };
        redisClient.set(`otp:${resp.id}`, JSON.stringify(OtpObj), "EX", 300);

export interface OtpInterface {
    salt: string,
    hash: string
    retry_limit: number
}

type PrismaDriverAdapterMeta = {
    modelName?: string;
    driverAdapterError?: {
        cause?: {
            originalCode?: string;
            originalMessage?: string;
            kind?: string;
            constraint?: {
                fields?: string[];
            };
        };
    };
};