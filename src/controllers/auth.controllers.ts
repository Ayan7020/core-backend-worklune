import { prisma } from "@/services/prisma.service";
import redisClient from "@/services/redis.service";
import { OtpInterface, SendEmailPayload } from "@/types/common";
import { BadRequestError, InternalServerError, TooManyRequestError, UnauthorizedError } from "@/utils/errors/HttpErrors";
import { generate4DigitOTP } from "@/utils/otp";
import { getPasswordHash, getPasswordHashReturn, verifyPassword } from "@/utils/Password";
import { emailQueueService } from "@/utils/Queue";
import { LoginSchema, SignupSchema } from "@/utils/schemas/auth.schema";
import { Request, Response } from "express";
import z from "zod";


export class AuthService {
    public static Signup = async (req: Request, res: Response) => {
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
        const { hash: newHash, salt: newSalt } = getPasswordHash(newOtp);
        const OtpObj = {
            salt: newSalt,
            hash: newHash,
            retry_limit: 3
        };
        await redisClient.multi().hset(`otp:${resp.id}`, OtpObj).expire(`otp:${resp.id}`, 300).exec();

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

    public static verifyOtpHandler = async (req: Request, res: Response) => {
        const body = req.body;
        if (!body || typeof body !== "object" || !body?.otp || !body?.id) {
            throw new BadRequestError("Invalid Request!")
        }
        const REDIS_USER_KEY = `otp:${body.id}`;

        const userOtp = String(body.otp);

        const existingUserOtp = await redisClient.hgetall(REDIS_USER_KEY); 
        if (!existingUserOtp || Object.keys(existingUserOtp).length === 0) {
            throw new UnauthorizedError("This OTP has expired. Please request a new one.!")
        }

        if (Number(existingUserOtp?.retry_limit) === 0) {
            await redisClient.del(REDIS_USER_KEY);
            throw new TooManyRequestError("You've reached the maximum number of OTP attempts. Please request a new OTP.")
        }  

        const isVerifiedOtp = verifyPassword(userOtp, existingUserOtp.hash, existingUserOtp.salt);
        if (!isVerifiedOtp) {
            redisClient.hincrby(REDIS_USER_KEY, 'retry_limit', -1)
            throw new UnauthorizedError("The OTP you entered is incorrect. Please try again.");
        } 

        await prisma.user.update({
            where: {
                id: body.id
            }, data: {
                emailVerified: new Date().toISOString()
            }
        })
        await redisClient.del(REDIS_USER_KEY);
        return res.status(201).json({
            success: true,
            message: "Otp Verify sucessfully!",
        })
    }

    public static Login = async (req: Request, res: Response) => {
        const body = req.body;
        if (!body || typeof body !== "object") {
            throw new BadRequestError("body didn't found")
        }
        const LoginBody = z.parse(LoginSchema, body);
        const existingUser = await prisma.user.findFirst({
            where: {
                email: LoginBody.email
            }
        })

        if (!existingUser) {
            throw new BadRequestError("User didn't found!");
        }

        if (!existingUser.emailVerified) {
            throw new UnauthorizedError("Please verify the account!!");
        }

        if (!existingUser.passwordHash || !existingUser.salt) {
            throw new UnauthorizedError("Invalid authentication method!");
        }

        const isUserVerify = verifyPassword(LoginBody.password, existingUser.passwordHash, existingUser.salt);
        if (!isUserVerify) {
            throw new UnauthorizedError("Wrong Password. Try again!");
        }

        
    }
}