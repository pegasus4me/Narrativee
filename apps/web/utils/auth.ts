import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "../auth-schema";

interface Hyperdrive {
  connectionString: string;
}

// Check if we're in Cloudflare Workers environment
function getConnectionString() {
  // In Cloudflare Workers, globalThis will have the env bindings
  if (typeof globalThis !== 'undefined' && (globalThis as any).HYPERDRIVE) {
    return (globalThis as any).HYPERDRIVE.connectionString;
  }
  // Fallback to local environment variable
  return process.env.DATABASE_URL;
}

const pool = new Pool({
  connectionString: getConnectionString(),
});

const db = drizzle(pool, { schema });

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user: schema.user,
      session: schema.session,
      account: schema.account,
      verification: schema.verification
    }
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false 
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      enabled: !!process.env.GOOGLE_CLIENT_ID
    }
  },
});