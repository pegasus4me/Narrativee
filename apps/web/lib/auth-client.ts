import { createAuthClient } from "better-auth/react";
import { inferAdditionalFields } from "better-auth/client/plugins";
import { auth } from "../../backend/src/auth/auth";
import { API_BASE_URL } from "./api-config";
import { setupMockFetch } from "@/lib/mock-fetch";

if (typeof window !== "undefined") {
  setupMockFetch();
}

const client = createAuthClient({
  baseURL: API_BASE_URL,
  plugins: [
    inferAdditionalFields<typeof auth>()
  ]
});

// Proxy client to intercept hooks/methods in client-side demo mode
const clientProxy = new Proxy(client, {
  get(target, prop, receiver) {
    if (prop === "useSession") {
      return function useSession() {
        const original = target.useSession();
        const isDemo = typeof window !== "undefined" && localStorage.getItem("is_demo_mode") === "true";
        if (isDemo) {
          return {
            data: {
              user: {
                id: "demo-user-id",
                name: "Demo User",
                email: "demo@narrativee.com",
                emailVerified: true,
                image: "https://img.freepik.com/free-psd/3d-illustration-person-with-punk-haircut_23-2149436180.jpg",
                createdAt: "2026-06-11T20:00:00Z",
                updatedAt: "2026-06-11T20:00:00Z",
                plan: "premium",
                tokens: 40,
                carouselTokens: 6,
                onboarded: true
              },
              session: {
                id: "demo-session-id",
                token: "demo-session-token",
                userId: "demo-user-id",
                expiresAt: "2026-07-11T20:00:00Z",
                createdAt: "2026-06-11T20:00:00Z",
                updatedAt: "2026-06-11T20:00:00Z"
              }
            },
            isPending: original.isPending,
            error: null,
            refetch: async () => {}
          };
        }
        return original;
      };
    }

    if (prop === "getSession") {
      return async function getSession(options?: any) {
        const isDemo = typeof window !== "undefined" && localStorage.getItem("is_demo_mode") === "true";
        if (isDemo) {
          return {
            data: {
              user: {
                id: "demo-user-id",
                name: "Demo User",
                email: "demo@narrativee.com",
                emailVerified: true,
                image: "https://img.freepik.com/free-psd/3d-illustration-person-with-punk-haircut_23-2149436180.jpg",
                createdAt: "2026-06-11T20:00:00Z",
                updatedAt: "2026-06-11T20:00:00Z",
                plan: "premium",
                tokens: 40,
                carouselTokens: 6,
                onboarded: true
              },
              session: {
                id: "demo-session-id",
                token: "demo-session-token",
                userId: "demo-user-id",
                expiresAt: "2026-07-11T20:00:00Z",
                createdAt: "2026-06-11T20:00:00Z",
                updatedAt: "2026-06-11T20:00:00Z"
              }
            },
            error: null
          };
        }
        return target.getSession(options);
      };
    }

    if (prop === "signOut") {
      return async function signOut(options?: any) {
        const isDemo = typeof window !== "undefined" && localStorage.getItem("is_demo_mode") === "true";
        if (isDemo) {
          localStorage.removeItem("is_demo_mode");
          window.location.href = "/";
          return;
        }
        return target.signOut(options);
      };
    }

    return Reflect.get(target, prop, receiver);
  }
});

// Explicitly define the type using ReturnType
export const authClient = clientProxy as typeof client;