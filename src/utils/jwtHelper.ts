import Jwt, { JsonWebTokenError, JwtPayload, TokenExpiredError } from "jsonwebtoken";
import crypto from "crypto";
import { prisma } from "@/services/prisma.service";
import { hashWithoutSalt } from "./hashing";
import { addTime } from "./clock";

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
    throw new Error("Provide the JWT Secret Key");
};
const ACCESS_TOKEN_TTL = "10m";

export const signAccessToken = (payload: {
    sub: string;
    aud: string;
    wid?: string;
    scopes?: string[];
}): string => {
    if (!payload || Object.entries(payload).length == 0) {
        throw new Error("provide the payload for creating the jwt!");
    }

    const token = Jwt.sign(payload, JWT_SECRET, {
        issuer: "http://localhost:8000",
        expiresIn: ACCESS_TOKEN_TTL
    });

    return token;
}


export const verifyAccessToken = (token: string) => {
    if (!token) {
        throw new Error("Provide the token");
    }

    const payload = Jwt.verify(token, JWT_SECRET) as JwtPayload;
    return payload;
}


export function generateRefreshToken() {
    return crypto.randomBytes(64).toString("hex");
}

export const storedRefreshToken = async (accessToken: string, userId: string) => {
    if (!accessToken || !userId) {
        throw new Error("Provide the access token and user Id");
    }

    const hashAccessToken = hashWithoutSalt(accessToken);

    const existingUserRefreshToken = await prisma.refreshToken.findFirst({
        where: {
            userId: userId
        }
    });
    
    const expiresAt = addTime({
        days: 30
    });

    if (!existingUserRefreshToken) {
        await prisma.refreshToken.create({
            data: {
                tokenHash: hashAccessToken,
                expiresAt: expiresAt,
                userId: userId.trim()
            }
        });
        return;
    }

    await prisma.refreshToken.update({
        where: {
            userId: userId.trim()
        },
        data: {
            tokenHash: hashAccessToken,
            expiresAt: expiresAt,
        }
    });
    return;
}