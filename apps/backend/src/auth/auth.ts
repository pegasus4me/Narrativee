import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { Pool } from "pg";
import * as schema from "./schema/schema";
import dotenv from "dotenv"
import { drizzle } from 'drizzle-orm/node-postgres'
import dns from 'node:dns';

dotenv.config()

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  allowExitOnIdle: true,
});

export const db = drizzle(pool, { schema: schema });

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL,
  database: drizzleAdapter(db, {
    provider: "pg",
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      enabled: true,
    },
  },
  secret: process.env.BETTER_AUTH_SECRET,
  trustedOrigins: [
    "http://localhost:3000",
    "https://narrativee.com",

  ],
  advanced: {
    useSecureCookies: process.env.NODE_ENV === "production",
    crossSubDomainCookies: {
      enabled: true,
      domain: ".narrativee.com"
    },
  },
  user: {
    additionalFields: {
      plan: {
        type: "string",
        defaultValue: "free"
      },
      tokens: {
        type: "number",
        defaultValue: 0
      },
      subscriptionStatus: {
        type: "string",
        required: false
      },
      stripeCustomerId: {
        type: "string",
        required: false
      }
    }
  }
});