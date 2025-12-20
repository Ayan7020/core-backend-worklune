import crypto from "crypto";

export interface getPasswordHashReturn {
    salt: string,
    hash: string
}

const ITERATIONS = Number(process.env.HASH_ITERATION) || 64;
const KEY_LENGTH = Number(process.env.HASH_KEY_LENGTH) || 1000;
const DIGEST = process.env.HASH_DIGEST || 'sha512';

export const getPasswordHash = (password: string): getPasswordHashReturn => {
    if (!password || typeof password !== "string") {
        throw new Error("Password not find!");
    }

    const salt = crypto.randomBytes(16).toString("hex");
  

    const hash = crypto.pbkdf2Sync(
        password,
        salt,
        ITERATIONS,
        KEY_LENGTH,
        DIGEST
    ).toString('hex');

    return { salt, hash };
}

export const verifyPassword = (inputPassword: string, storedHash: string, salt: string): Boolean => {
    if (!inputPassword) {
        throw new Error("Password is required");
    }

    if (!storedHash || !salt) {
        throw new Error("Invalid stored credentials");
    }

    const inputHash = crypto.pbkdf2Sync(inputPassword, salt, ITERATIONS, KEY_LENGTH, DIGEST).toString('hex');
    return inputHash === storedHash;
}