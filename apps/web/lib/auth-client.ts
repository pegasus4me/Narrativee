import { createAuthClient } from "better-auth/react";

const {useSession, signIn, signOut} = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
});

export { authClient };
