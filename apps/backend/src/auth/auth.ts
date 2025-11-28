import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { Pool } from "pg";
import * as schema from "./schema/schema";
import dotenv from "dotenv"
import { drizzle } from 'drizzle-orm/node-postgres'
dotenv.config()


// setup PG connection instance
const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

// create drizzle db instance
const db = drizzle(pool, { schema });


// plug it into better auth
export const auth = betterAuth({
    database: drizzleAdapter(db, {
        provider: "pg",
    }),
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: false // set to true 
    },
    socialProviders: {
      google: {
        // In OpenNext, Vars are usually available in process.env
        // But passing them via env is safer if you have issues
        clientId: process.env.GOOGLE_CLIENT_ID!,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        enabled: true,
      },
    },
    // We must manually pass secret here if it's not picked up automatically
    secret: process.env.BETTER_AUTH_SECRET, 
});