import { Request, Response, NextFunction } from "express";
import { db } from "../auth/auth";
import { apiKeys } from "../auth/schema/schema";
import { eq } from "drizzle-orm";

export async function apikeyValidator(req: Request, res: Response, next: NextFunction) {
    // validate user API KEY MIDDLEWARE
    const apiKey = req.headers['x-api-key'] || req.headers['apikey'];

    try {
        if (!apiKey || typeof apiKey !== 'string') {
            return res.status(401).json({ message: 'API key not found' });
        }

        // check if the api key is valid
        const [apiKeyData] = await db.select()
            .from(apiKeys)
            .where(eq(apiKeys.key, apiKey));

        if (!apiKeyData) {
            return res.status(401).json({ message: 'Invalid API key' });
        }

        // check if the api key is active
        if (!apiKeyData.isActive) {
            return res.status(401).json({ message: 'API key disabled' });
        }

        // Attach key data to req.user or specific property
        // Using basic object for now to avoid extensive type augmentation in this file
        (req as any).user = {
            apiKeyId: apiKeyData.id,
            ...apiKeyData,
            id: apiKeyData.userId, // Explicitly set id to userId (AFTER spread to override apiKeyData.id)
        };

        next();
    } catch (error) {
        console.error("API Key Validation Error:", error);
        return res.status(500).json({ message: 'Internal Server Error' });
    }
}