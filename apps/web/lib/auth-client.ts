import { createAuthClient } from "better-auth/react";

const client = createAuthClient({
  baseURL: process.env.FRONTEND_URL || "http://localhost:3000"
});

// Explicitly define the type using ReturnType
export const authClient: ReturnType<typeof createAuthClient> = client;