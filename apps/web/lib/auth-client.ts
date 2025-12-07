import { createAuthClient } from "better-auth/react";
import { inferAdditionalFields } from "better-auth/client/plugins";
import { auth } from "../../backend/src/auth/auth";

let url = process.env.NODE_ENV === 'development' ? "http://localhost:3002" : "https://api.narrativee.com"
const client = createAuthClient({
  baseURL: url,
  plugins: [
    inferAdditionalFields<typeof auth>()
  ]
});

// Explicitly define the type using ReturnType
export const authClient = client;