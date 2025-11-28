import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { drizzle } from "drizzle-orm/node-postgres"; // <--- Node specific driver
import { Pool } from "pg"; 
import * as schema from "../auth-schema";
import env from "dotenv";

env.config();

// Create a connection pool to Supabase
const pool = new Pool({
  connectionString: process.env.DATABASE_URL, // Use port 6543 (Transaction Mode) or 5432 (Session Mode)
});

const db = drizzle(pool, { schema });

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
        // Explicitly map the schema so Better Auth knows which tables to use
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
  // ... rest of your config
});