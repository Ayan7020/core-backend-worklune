import { prisma } from "@/services/prisma.service";
import redisClient from "@/services/redis.service";
import { SendEmailPayload } from "@/types/common";
import { BadRequestError, InternalServerError } from "@/utils/errors/HttpErrors";
import { generate4DigitOTP } from "@/utils/otp";
import { getPasswordHash } from "@/utils/Password";
import { emailQueueService } from "@/utils/Queue";
import { SignupSchema } from "@/utils/schemas/login.schema";
import { Request, Response } from "express";
import z from "zod"; 


export class AuthService {
    public static Login = async (req: Request, res: Response) => {
        const body = req.body;
        if (!body || typeof body !== "object") {
            throw new BadRequestError("body didnt' found")
        }
        const signupBody = z.parse(SignupSchema, body);

        const { salt, hash } = getPasswordHash(signupBody.password);

        const resp = await prisma.user.create({
            data: {
                name: signupBody.name,
                email: signupBody.email,
                passwordHash: hash,
                salt: salt
            }
        });

        if (!resp.id) {
            throw new InternalServerError();
        }

        const newOtp = generate4DigitOTP().toString();
        const OtpHash = getPasswordHash(newOtp);
        redisClient.set(`otp:${resp.id}`, JSON.stringify(OtpHash), "EX", 300);

        const payload: SendEmailPayload = {
            email: signupBody.email,
            name: signupBody.name,
            otp: newOtp
        }; 
        const dataToSend = JSON.stringify(payload);
        await emailQueueService.insertDataToQueue(dataToSend);

        return res.status(201).json({
            success: true,
            message: "Signup successful. OTP sent to your email.",
            data: {
                userId: resp.id,
                email: resp.email
            }
        })
    }
}