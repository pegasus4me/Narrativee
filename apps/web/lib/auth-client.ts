import { createAuthClient } from "better-auth/react";
import { inferAdditionalFields } from "better-auth/client/plugins";
import { auth } from "../../backend/src/auth/auth";
import { API_BASE_URL } from "./api-config";

/** Browser client for the shared Better Auth configuration. */
export const authClient = createAuthClient({
  baseURL: API_BASE_URL,
  plugins: [inferAdditionalFields<typeof auth>()],
});
