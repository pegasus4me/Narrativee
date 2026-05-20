import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { Pool } from "pg";
import * as schema from "./schema/schema";
import dotenv from "dotenv"
import { drizzle } from 'drizzle-orm/node-postgres'
import dns from 'node:dns';
import path from 'node:path';
import fs from 'node:fs';
import { EmailService } from "../services/email-service";
import { posthog } from "../lib/posthog";

// Load .env: walk up from CWD until we find it (works for both turbo & docker)
const loadEnv = () => {
  let dir = process.cwd();
  for (let i = 0; i < 6; i++) {
    const candidate = path.join(dir, '.env');
    if (fs.existsSync(candidate)) {
      dotenv.config({ path: candidate });
      return;
    }
    dir = path.dirname(dir);
  }
  dotenv.config(); // fallback
};
loadEnv();

const pool = new Pool({
  connectionString: process.env.LOCAL_DATABASE_URL || process.env.DATABASE_URL,
  allowExitOnIdle: true,
});

// Prevent crash on idle client error
pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
});

export const db = drizzle(pool, { schema: schema });

export const auth = betterAuth({
  debug: true,
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
  account: {
    accountLinking: {
      enabled: true,
      trustedProviders: ["google", "microsoft"],
      allowDifferentEmails: true
    },
  },
  secret: process.env.BETTER_AUTH_SECRET,
  trustedOrigins: [
    "http://localhost:3000",
    "http://localhost:3010",
    "https://narrativee.com",

  ],
  advanced: {
    useSecureCookies: process.env.NODE_ENV === "production",
    // REMOVE THIS IN LOCAL DEVELOPEMENT

  },
  databaseHooks: {
    user: {
      create: {
        before: async (user) => {
          const isCredentials = !user.image;
          return {
            data: {
              ...user,
              onboarded: isCredentials ? true : user.onboarded,
              image: user.image || "https://static.vecteezy.com/system/resources/previews/059/545/358/non_2x/abstract-pixel-art-background-soft-purple-and-pale-yellow-mosaic-ideal-for-website-banners-digital-art-presentations-and-tech-designs-conveys-a-sense-of-modern-technology-and-digital-fluidity-vector.jpg"
            }
          };
        },
        after: async (user) => {
          try {
            await EmailService.sendWelcome({
              email: user.email,
              name: user.name ?? "",
              promoCode: "EARLYBIRD26",
            });
          } catch (e) {
            console.error("Failed to send welcome email:", e);
          }
          posthog.identify({
            distinctId: user.id,
            properties: {
              $set: { email: user.email, name: user.name },
              $set_once: { created_at: new Date().toISOString() },
            },
          });
          posthog.capture({
            distinctId: user.id,
            event: 'user_signed_up',
            properties: {
              email: user.email,
              name: user.name,
            },
          });
        }
      }
    }
  },
  user: {
    additionalFields: {
      plan: {
        type: "string",
        defaultValue: "free"
      },
      tokens: {
        type: "number",
        defaultValue: 40
      },
      subscriptionStatus: {
        type: "string",
        required: false
      },
      stripeCustomerId: {
        type: "string",
        required: false
      },
      onboarded: {
        type: "boolean",
        defaultValue: false
      }
    }
  }
});
