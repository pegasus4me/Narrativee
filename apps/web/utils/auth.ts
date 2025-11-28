// apps/web/utils/auth.ts
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "../auth-schema";

// Define the Cloudflare Env interface
export interface Env {
  HYPERDRIVE: { connectionString: string };
}

// 1. Create a function that initializes DB and Auth using the runtime Env
export const createAuth = (env: Env) => {
  // Use the Hyperdrive connection string directly
  const pool = new Pool({
    connectionString: env.HYPERDRIVE.connectionString,
  });

  const db = drizzle(pool, { schema });

  return betterAuth({
    database: drizzleAdapter(db, {
      provider: "pg",
      schema,
    }),
    emailAndPassword: {
      enabled: true,
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
};