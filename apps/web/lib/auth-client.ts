import { createAuthClient } from "better-auth/react";


let url = process.env.NODE_ENV === 'development' ? "http://localhost:3000" : "https://narrativee.com"
const client = createAuthClient({
  baseURL: url
});

// Explicitly define the type using ReturnType
export const authClient: ReturnType<typeof createAuthClient> = client;