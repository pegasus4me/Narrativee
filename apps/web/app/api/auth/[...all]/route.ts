import { createAuth } from "../../../../utils/auth";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { NextRequest } from "next/server";

// Helper to handle the request
async function handler(request: NextRequest) {
  // 1. Get the Cloudflare Env (Hyperdrive is here)
  const { env } = await getCloudflareContext();

  // 2. Initialize Auth with that Env
  const auth = createAuth(env as any);

  // 3. Let Better Auth handle the request
  return auth.handler(request);
}

export const GET = handler;
export const POST = handler;