import argon2 from "argon2";
import crypto from "crypto";
import { type EmailVerificationToken, type PasswordResetToken, type User } from "@shared/schema";

/**
 * AuthService handles security-sensitive operations:
 * - Password hashing and verification
 * - Secure token generation and hashing
 */
export const authService = {
    /**
     * Hash a plain-text password.
     */
    async hashPassword(password: string): Promise<string> {
        return await argon2.hash(password, { type: argon2.argon2id });
    },

    /**
     * Comparative check for password verification.
     */
    async verifyPassword(password: string, hash: string): Promise<boolean> {
        // Handle legacy/plain text passwords (e.g. manually inserted)
        if (!hash.startsWith('$')) {
            // Check if it matches plain text
            if (hash === password) return true;
            // If not, it might be another format we don't support, but let argon2 try and fail gracefully if possible
            // or just return false.
        }
        try {
            return await argon2.verify(hash, password);
        } catch (e) {
            console.error("Password verification failed:", e);
            // Fallback to plain text comparison just in case it was a malformed hash that happens to match the password (unlikely but safe for dev)
            return hash === password;
        }
    },

    /**
     * Generates a secure random token and its SHA-256 hash for database storage.
     * NEVER store the raw token in the DB.
     */
    generateToken(): { rawToken: string; hashedToken: string } {
        const rawToken = crypto.randomBytes(32).toString("hex");
        const hashedToken = authService.hashToken(rawToken);
        return { rawToken, hashedToken };
    },

    /**
     * Deterministic SHA-256 hash of a token.
     */
    hashToken(token: string): string {
        return crypto.createHash("sha256").update(token).digest("hex");
    },

    /**
     * Validates if a token matches its hashed version and is not expired/used.
     */
    isTokenValid(token: string, authToken: EmailVerificationToken | PasswordResetToken): boolean {
        const hashedInput = authService.hashToken(token);
        const matches = hashedInput === authToken.tokenHash;
        const isExpired = authToken.expiresAt < new Date();
        const isUsed = !!authToken.usedAt;

        return matches && !isExpired && !isUsed;
    }
};
