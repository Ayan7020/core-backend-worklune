export interface SendEmailPayload {
    name: string;
    otp: string;
    email: string;
    subject?: string;
}