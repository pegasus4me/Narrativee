import dotenv from "dotenv";
import path from "path";
import OpenAI from "openai";

let hasLoadedEnv = false;
let cachedApiKey = "";
let cachedClient: OpenAI | null = null;

function ensureEnvLoaded(): void {
  if (hasLoadedEnv) {
    return;
  }

  const candidatePaths = [
    path.resolve(process.cwd(), "apps/backend/.env"),
    path.resolve(process.cwd(), ".env"),
    path.resolve(__dirname, "../../.env"),
    path.resolve(__dirname, "../../../backend/.env"),
  ];

  for (const envPath of candidatePaths) {
    dotenv.config({ path: envPath, override: true });
  }

  hasLoadedEnv = true;
}

function getGrokApiKey(): string {
  ensureEnvLoaded();
  return process.env.GROK_API_KEY?.trim() || process.env.XAI_API_KEY?.trim() || "";
}

/**
 * Returns a cached Grok client when the backend is configured for xAI calls.
 */
export function getGrokClient(): OpenAI | null {
  const apiKey = getGrokApiKey();
  if (!apiKey) {
    return null;
  }

  if (cachedClient && cachedApiKey === apiKey) {
    return cachedClient;
  }

  cachedApiKey = apiKey;
  cachedClient = new OpenAI({
    baseURL: "https://api.x.ai/v1",
    apiKey,
  });

  return cachedClient;
}
