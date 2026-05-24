import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import { webcrypto } from 'node:crypto';
if (!global.crypto) {
  global.crypto = webcrypto as any;
}
import { execFile } from 'node:child_process';
import express from 'express';
import cors from 'cors';
import pricingRouter from './routes/pricing';
import userRouter from './routes/user';
import cookieParser from 'cookie-parser';
import { auth, db } from "./auth/auth"
import { toNodeHandler } from "better-auth/node";
import channelsRouter from './routes/channels';
import sourcesRouter from './routes/sources';
import articlesRouter from './routes/articles';
import knowledgeRouter from './routes/knowledge';
import { posthog } from './lib/posthog';
import { socialPosts } from "./auth/schema/schema";
import { and, eq, lte, sql } from "drizzle-orm";
import { publishPostToSocialPlatform } from "./services/publisher";

const app = express();

app.set('trust proxy', true);

const PORT = process.env.PORT || 3002;

// ─── Timeouts ───────────────────────────────────────────────────────────────
const SERVER_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes for slow LLM responses

// ─── Scheduler config ───────────────────────────────────────────────────────
const SCHEDULER_INTERVAL_MS = 15_000;

// CORS MUST be before BetterAuth
app.use(cors({
  origin: [
    "http://localhost:3000",
    "http://localhost:3001",
    "https://narrativee.com",
    "https://www.narrativee.com",
    "http://localhost:3010",
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
}));

app.use(cookieParser());

// Better Auth handler (Express 5 syntax)
app.all('/api/auth/*splat', toNodeHandler(auth));

// Pricing router (must be before express.json() for webhook raw body)
app.use('/api/pricing', pricingRouter);

app.use(express.json());

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', message: 'Narrativee API is running' });
});

// Deploy webhook — triggered by GitHub Actions after image push
const DEPLOY_SCRIPT_PATH = process.env.DEPLOY_SCRIPT_PATH || '/home/ubuntu/deploy.sh';
app.post('/api/deploy-hook', (req: express.Request, res: express.Response) => {
  const secret = process.env.DEPLOY_HOOK_SECRET;
  const authHeader = req.headers['authorization'];
  if (!secret || authHeader !== `Bearer ${secret}`) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  res.json({ ok: true });
  execFile(DEPLOY_SCRIPT_PATH, (err, stdout, stderr) => {
    if (err) console.error('[Deploy] error:', stderr);
    else console.log('[Deploy] output:', stdout);
  });
});

// API routes
app.use('/api/user', userRouter);
app.use('/api/channels', channelsRouter);
app.use('/api/sources', sourcesRouter);
app.use('/api/articles', articlesRouter);
app.use('/api/knowledge-base', knowledgeRouter);

// Global error handler
app.use((err: Error, req: express.Request, res: express.Response, _next: express.NextFunction) => {
  const userId = (req as any).user?.id;
  posthog.captureException(err, userId);
  console.error('[Unhandled Error]', err);
  res.status(500).json({ error: 'Internal server error' });
});

const server = app.listen(PORT, async () => {
  console.log(`Express Server running on http://localhost:${PORT}`);

  // Ensure oauth_states table exists in the database
  try {
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "oauth_states" (
        "state" text PRIMARY KEY NOT NULL,
        "user_id" text NOT NULL,
        "platform" text NOT NULL,
        "code_verifier" text,
        "expires_at" timestamp NOT NULL,
        "created_at" timestamp DEFAULT now() NOT NULL
      );
    `);
    console.log('[Database] Verified/created oauth_states table successfully.');
  } catch (err) {
    console.error('[Database] Failed to verify/create oauth_states table:', err);
  }
});

server.setTimeout(SERVER_TIMEOUT_MS);
server.keepAliveTimeout = SERVER_TIMEOUT_MS;
server.headersTimeout = SERVER_TIMEOUT_MS + 1000;

// Flush PostHog events before process exit
process.on('SIGINT', async () => {
  await posthog.shutdown();
  process.exit(0);
});
process.on('SIGTERM', async () => {
  await posthog.shutdown();
  process.exit(0);
});

// ─── Scheduled Posts background publishing engine ───────────────────────────
// Uses pg_advisory_xact_lock to prevent duplicate publishing across instances.
setInterval(async () => {
  try {
    const SCHEDULER_LOCK_ID = 123456789;
    // Collect pending post IDs inside a short-lived transaction (holds advisory lock briefly)
    const pendingPostIds = await db.transaction(async (tx) => {
      const lockResult = await tx.execute(
        sql`SELECT pg_try_advisory_xact_lock(${SCHEDULER_LOCK_ID}) AS acquired`
      );
      const rows = lockResult.rows as Array<{ acquired: boolean }>;
      if (!rows[0]?.acquired) return [];

      const now = new Date();
      const pendingPosts = await tx
        .select({ id: socialPosts.id })
        .from(socialPosts)
        .where(
          and(
            eq(socialPosts.status, "scheduled"),
            lte(socialPosts.scheduledAt, now)
          )
        );
      return pendingPosts.map((p) => p.id);
    });

    // Publish outside the transaction so the DB connection and lock are released
    if (pendingPostIds.length > 0) {
      console.log(`[Scheduler] Found ${pendingPostIds.length} pending scheduled posts due for publishing.`);
      for (const postId of pendingPostIds) {
        await publishPostToSocialPlatform(postId);
      }
    }
  } catch (err) {
    console.error("[Scheduler] Error checking/publishing scheduled posts:", err);
  }
}, SCHEDULER_INTERVAL_MS);
