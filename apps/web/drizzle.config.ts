import { defineConfig } from "drizzle-kit";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" })
// Load environment variables from .env file
dotenv.config();

export default defineConfig({
  // Point this to your actual schema file path
  // Based on your imports ("../auth-schema"), this might be "./src/auth-schema.ts"
  schema: "./auth-schema.ts", 
  
  // Where migration files will be stored
  out: "./drizzle",
  
  // Database dialect
  dialect: "postgresql",
  
  // Your Supabase connection string
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});