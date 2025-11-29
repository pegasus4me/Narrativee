import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { Pool } from "pg";
import * as schema from "./schema/schema";
import dotenv from "dotenv"
import { drizzle } from 'drizzle-orm/node-postgres'
dotenv.config()


// setup PG connection instance
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Force IPv4 to avoid ENETUNREACH in Docker/Alpine
  allowExitOnIdle: true,
});
// Force IPv4 resolution for this pool
// @ts-ignore
pool.on('connect', (client) => {
  // This doesn't strictly force IPv4 at DNS level, but let's try a better approach
});

// Better approach: Override DNS lookup for the pool?
// Actually, node-postgres doesn't expose a simple "force IPv4" option in the config object directly documented for all versions,
// but we can try to rely on system settings.
// However, since we can't easily change system settings, let's try to resolve the host manually or use a workaround.
//
// WAIT: The simplest fix for "ENETUNREACH" on IPv6 is to just NOT use IPv6.
// We can pass `host` as the resolved IPv4 address, but that's dynamic.
//
// Let's try to add a DNS lookup wrapper if possible, OR just tell the user to use the IPv4 address.
//
// Actually, let's try to import `dns` and use `dns.setDefaultResultOrder('ipv4first')` if available (Node 17+).
// We are on Node 18.
import dns from 'node:dns';


// create drizzle db instance
const db = drizzle(pool, { schema: schema });


// plug it into better auth
export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL, // Force correct URL for redirects
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
  trustedOrigins: [
    "https://narrativee.com",
    "https://api.narrativee.com",
    "http://localhost:3000"
  ]
});