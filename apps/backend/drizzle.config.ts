import { defineConfig } from "drizzle-kit";
import dotenv from "dotenv";
// Load environment variables from .env file
dotenv.config();

export default defineConfig({
  // Point this to your actual schema file path
  // Based on your imports ("../auth-schema"), this might be "./src/auth-schema.ts"
  schema: "./src/auth/schema/schema.ts",

  // Where migration files will be stored
  out: "./drizzle",

  // Database dialect
  dialect: "postgresql",

  // Your Supabase connection string
  dbCredentials: {
    url: process.env.LOCAL_DATABASE_URL!,  // match backend's auth.ts
  },
});