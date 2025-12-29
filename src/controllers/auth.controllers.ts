import { prisma } from "@/services/prisma.service";
import redisClient from "@/services/redis.service";
import { OtpInterface, SendOtpPayload } from "@/types/common";
import { BadRequestError, InternalServerError, TooManyRequestError, UnauthorizedError, ValidationError } from "@/utils/errors/HttpErrors";
import { OtpService } from "@/utils/otp";
import { getHash, hashWithoutSalt, verifyHash } from "@/utils/hashing";
import { OtpQueueService } from "@/utils/Queue";
import { LoginSchema, SignupSchema } from "@/utils/schemas/auth.schema";
import { Request, Response } from "express";
import z, { success } from "zod";
import { generateRefreshToken, signAccessToken, storedRefreshToken } from "@/utils/jwtHelper";
import { addTime } from "@/utils/clock";
import { ERROR_CODES } from "@/utils/errors/errorCodes";


export class AuthService {
    public static Signup = async (req: Request, res: Response) => {
        const body = req.body;
        if (!body || typeof body !== "object") {
            throw new BadRequestError("Invalid Request")
        }
        const signupBody = z.parse(SignupSchema, body);

        const { salt, hash } = getHash(signupBody.password);

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

        const newOtp = OtpService.generateOtp();
        const { hash: newHash, salt: newSalt } = getHash(newOtp);

        const OtpObj = {
            salt: newSalt,
            hash: newHash,
            retry_limit: 3
        };
        await OtpService.sendOtp(signupBody.email, OtpObj);

        const payload: SendOtpPayload = {
            email: signupBody.email,
            name: signupBody.name,
            otp: newOtp
        };
        const dataToSend = JSON.stringify(payload);
        await OtpQueueService.insertDataToQueue(dataToSend);

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
        if (!body || typeof body !== "object" || !body?.otp || !body?.email) {
            throw new BadRequestError("Invalid Request!")
        }

        const userOtp = String(body.otp);

        const existingUserOtp = await OtpService.getOtp(body.email);
        if (!existingUserOtp || Object.keys(existingUserOtp).length === 0) {
            throw new UnauthorizedError("Unauthorized", ERROR_CODES.UNAUTHORIZED, {
                validationError: [{
                    field: "otp",
                    message: "This OTP has expired. Please request a new one.!"
                }]
            })
        }

        if (Number(existingUserOtp.retry_limit) === 0) {
            await OtpService.deleteOtp(body.email);
            throw new TooManyRequestError("You've reached the maximum number of OTP attempts. Please request a new OTP.")
        }

        const isVerifiedOtp = verifyHash(userOtp, existingUserOtp.hash, existingUserOtp.salt);
        if (!isVerifiedOtp) {
            await OtpService.decrementRetry(body.email);
            throw new UnauthorizedError("Unauthorized", ERROR_CODES.UNAUTHORIZED, {
                validationError: [{
                    field: "otp",
                    message: "The OTP you entered is incorrect. Please try again."
                }]
            })
        }

        await prisma.user.update({
            where: {
                email: body.email
            }, data: {
                emailVerified: addTime({})
            }
        })
        await OtpService.deleteOtp(body.email);
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
            },
            include: {
                _count: {
                    select: {
                        memberships: true,
                        invitations: true
                    }
                }
            }
        })

        if (!existingUser) {
            throw new BadRequestError("Bad Request", {
                validationError: [{
                    field: "email",
                    message: "User not found"
                }]
            });
        }

        if (!existingUser.passwordHash || !existingUser.salt || !existingUser.name) {
            throw new UnauthorizedError("Unauthorized", ERROR_CODES.INVALID_AUTH_TYPE);
        }

        const isUserVerify = verifyHash(LoginBody.password, existingUser.passwordHash, existingUser.salt);
        if (!isUserVerify) {
            throw new UnauthorizedError("Unauthorized", ERROR_CODES.WRONG_PASSWORD, {
                validationError: [{
                    field: "password",
                    message: "Wrong Password"
                }]
            });
        };

        if (!existingUser.emailVerified) {
            const newOtp = OtpService.generateOtp()
            const { hash, salt } = getHash(newOtp);
            const payload: OtpInterface = {
                hash: hash,
                salt: salt,
                retry_limit: 3
            };
            await OtpService.sendOtp(existingUser.email, payload);
            const payloadQueue: SendOtpPayload = {
                email: existingUser.email,
                name: existingUser.name,
                otp: newOtp
            };
            const dataToSend = JSON.stringify(payloadQueue);
            await OtpQueueService.insertDataToQueue(dataToSend);
            throw new UnauthorizedError("Unauthorized", ERROR_CODES.VERIFY_ACCOUNT);
        }



        const payload = {
            aud: "worklune-api",
            sub: existingUser.id
        };

        const accessToken = signAccessToken(payload);
        const refreshToken = generateRefreshToken();

        await storedRefreshToken(refreshToken, existingUser.id);

        res.cookie("access_token", accessToken, {
            httpOnly: true,
            secure: false,
            sameSite: "lax",
            path: "/",
            maxAge: 15 * 60 * 1000
        });

        res.cookie("refresh_token", refreshToken, {
            httpOnly: true,
            secure: false, // MUST be false on localhost
            sameSite: "lax", // allows cross-port on same site
            path: "/",
            maxAge: 30 * 24 * 60 * 60 * 1000
        });

        req.user = {
            id: existingUser.id
        }

        return res.status(201).json({
            success: true,
            message: "Login Successfull",
            data: {
                isWorkSpace: existingUser._count.memberships > 0 ? true : false,
                isInvitaion: existingUser._count.invitations > 0 ? true : false
            }
        });
    }

    public static refreshToken = async (req: Request, res: Response) => {
        const refresh_token = req.cookies.refresh_token;

        if (!refresh_token) {
            throw new UnauthorizedError("Login Required! refresh token didnt found")
        }
        const refreshTokenHash = hashWithoutSalt(refresh_token)
        const existingRefreshToken = await prisma.refreshToken.findFirst({
            where: {
                tokenHash: refreshTokenHash
            }
        });

        if (!existingRefreshToken || addTime({}) > existingRefreshToken.expiresAt) {
            throw new UnauthorizedError("Login Required! refresh token exipired")
        }

        const accessToken = signAccessToken({
            sub: existingRefreshToken.userId,
            aud: "worklune-api"
        });

        res.cookie("access_token", accessToken, {
            httpOnly: true,
            secure: true,
            sameSite: "strict",
            path: "/",
            maxAge: 15 * 60 * 1000
        });

        return res.status(200).json({
            success: true,
            message: "request processed",
        })
    }
}