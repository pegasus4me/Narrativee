import { createAuthClient } from "better-auth/react";

const client = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
});

// Explicitly define the type using ReturnType
export const authClient: ReturnType<typeof createAuthClient> = client;