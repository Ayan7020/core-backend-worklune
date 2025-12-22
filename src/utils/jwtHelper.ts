import Jwt from "jsonwebtoken";
import crypto from "crypto";
import { prisma } from "@/services/prisma.service";
import { getHash } from "./hashing";

const JWT_SECRET = process.env.JWT_SECRET;
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

    if (!JWT_SECRET) {
        throw new Error("Provide the JWT Secret Key");
    };

    const token = Jwt.sign(payload, JWT_SECRET, {
        issuer: "http://localhost:8000",
        expiresIn: ACCESS_TOKEN_TTL
    });

    return token;
}

export function generateRefreshToken() {
    return crypto.randomBytes(64).toString("hex");
}

export const storedRefreshToken = async (accessToken: string, userId: string) => {
    if (!accessToken || !userId) {
        throw new Error("Provide the access token and user Id");
    }

    const { salt, hash } = getHash(accessToken);

    const existingUserRefreshToken = await prisma.refreshToken.findFirst({
        where: {
            userId: userId
        }
    });

    if (!existingUserRefreshToken) {
        await prisma.refreshToken.create({
            data: {
                tokenHash: hash,
                salt: salt,
                expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
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
            tokenHash: hash,
            salt: salt,
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), 
        }
    });
    return;
}