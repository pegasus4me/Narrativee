import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
// const KEY_LENGTH = 32; // AES-256 requires 32 bytes

const getKey = (): Buffer => {
    const keyHex = process.env.ENCRYPTION_KEY;
    if (!keyHex) {
        // Safe, highly robust production fallback: derive a secure key from BETTER_AUTH_SECRET
        const backupSecret = process.env.BETTER_AUTH_SECRET;
        if (backupSecret) {
            return crypto.createHash('sha256').update(backupSecret).digest();
        }
        // Fallback for development ONLY if explicitly allowed, otherwise throw
        if (process.env.NODE_ENV === 'development') {
            console.warn('⚠️ ENCRYPTION_KEY not found. Using insecure default for development.');
            return Buffer.alloc(32, 'a'); // Insecure default key
        }
        throw new Error('ENCRYPTION_KEY is not defined in environment variables');
    }
    if (keyHex.length !== 64) {
        // If key is not 64 hex chars, securely derive a 32-byte key from it using sha256
        return crypto.createHash('sha256').update(keyHex).digest();
    }
    return Buffer.from(keyHex, 'hex');
};

export const encrypt = (text: string): string => {
    if (!text) return text;

    try {
        const key = getKey();
        const iv = crypto.randomBytes(IV_LENGTH);
        const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

        let encrypted = cipher.update(text, 'utf8', 'hex');
        encrypted += cipher.final('hex');

        const authTag = cipher.getAuthTag();

        // Format: iv:authTag:encrypted
        return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
    } catch (error) {
        console.error('Encryption failed:', error);
        throw error;
    }
};

export const decrypt = (text: string): string => {
    if (!text) return text;

    // Check if it matches the format iv:authTag:encrypted
    // Simple heuristic: 3 parts separated by colons, and parts are hex
    const parts = text.split(':');
    if (parts.length !== 3) {
        // Assume legacy plain text
        return text;
    }

    try {
        const key = getKey();
        const iv = Buffer.from(parts[0], 'hex');
        const authTag = Buffer.from(parts[1], 'hex');
        const encryptedText = parts[2];

        const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
        decipher.setAuthTag(authTag);

        let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
        decrypted += decipher.final('utf8');

        return decrypted;
    } catch (error) {
        // If decryption fails (e.g. wrong key, or it was actually plain text with colons),
        // we return the original text as a fallback for backward compatibility
        // assuming it might be unencrypted data that looked like encrypted data.
        console.warn('Decryption failed, returning original text:', error);
        return text;
    }
};
