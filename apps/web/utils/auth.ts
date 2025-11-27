import { betterAuth } from "better-auth";
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import * as schema from "../auth-schema";
import env from 'dotenv';

env.config();

const sql = neon(process.env.DATABASE_URL || "postgresql://postgres:Rayan_2008@db.nwqzqzzgrbdergqehnso.supabase.co:6543/postgres");
const db = drizzle(sql, { schema });

export const auth = betterAuth({
    database: drizzleAdapter(db, {
        provider: "pg",
        schema
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