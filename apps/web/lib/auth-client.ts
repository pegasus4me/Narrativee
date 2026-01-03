import { createAuthClient } from "better-auth/react";
import { inferAdditionalFields } from "better-auth/client/plugins";
import { auth } from "../../backend/src/auth/auth";
import { API_BASE_URL } from "./api-config";

const client = createAuthClient({
  baseURL: API_BASE_URL,
  plugins: [
    inferAdditionalFields<typeof auth>()
  ]
});

// Explicitly define the type using ReturnType
export const authClient = client;