import crypto from "crypto";

export interface getHashReturnInterface {
    salt: string,
    hash: string
}

const ITERATIONS = Number(process.env.HASH_ITERATION) || 64;
const KEY_LENGTH = Number(process.env.HASH_KEY_LENGTH) || 1000;
const DIGEST = process.env.HASH_DIGEST || 'sha512';
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET!

export const getHash = (inputString: string): getHashReturnInterface => {
    if (!inputString || typeof inputString !== "string") {
        throw new Error("InputString not find!");
    }

    const salt = crypto.randomBytes(16).toString("hex");

    const hash = crypto.pbkdf2Sync(
        inputString,
        salt,
        ITERATIONS,
        KEY_LENGTH,
        DIGEST
    ).toString('hex');

    return { salt, hash };
}

export const hashWithoutSalt = (token: string): string => {
    return crypto
        .createHmac(DIGEST, REFRESH_TOKEN_SECRET)
        .update(token)
        .digest("hex");
};

export const verifyHash = (inputString: string, storedHash: string, salt: string): Boolean => {
    if (!inputString) {
        throw new Error("inputString is required");
    }

    if (!storedHash || !salt) {
        throw new Error("Invalid stored credentials");
    }

    const inputHash = crypto.pbkdf2Sync(inputString, salt, ITERATIONS, KEY_LENGTH, DIGEST).toString('hex');
    return inputHash === storedHash;
}