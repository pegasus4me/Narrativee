import { betterAuth } from "better-auth";
import { neonConfig, Pool } from "@neondatabase/serverless";
import env from 'dotenv';
import ws from 'ws';

env.config();

// Configure WebSocket for Cloudflare Workers compatibility
if (typeof WebSocket === 'undefined') {
    neonConfig.webSocketConstructor = ws;
}

export const auth = betterAuth({
    database: new Pool({
        connectionString: process.env.DATABASE_URL
    }),
    emailAndPassword: {
        enabled: true,
        requireEmailVerification: false // Set to true in production
    },
    socialProviders: {
        google: {
            clientId: process.env.GOOGLE_CLIENT_ID || "",
            clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
            enabled: !!process.env.GOOGLE_CLIENT_ID
        }
    },
    session: {
        cookieCache: {
            enabled: true,
            maxAge: 60 * 60 * 24 * 7 // 7 days
        }
    },
    advanced: {
        defaultCookieAttributes: {
            sameSite: 'lax', // Works for localhost cross-origin
            secure: process.env.NODE_ENV === 'production',
            httpOnly: true
        }
    }
})