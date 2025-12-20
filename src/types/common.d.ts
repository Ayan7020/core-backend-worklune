export interface SendEmailPayload {
    name: string;
    otp: string;
    email: string;
    subject?: string;
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