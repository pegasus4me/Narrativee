import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../.env') });
// Trigger reload for new Threads OAuth provider file

import { webcrypto } from 'node:crypto';
if (!global.crypto) {
  global.crypto = webcrypto as any;
}
import express from 'express';
import cors from 'cors';
import pricingRouter from './routes/pricing';
import userRouter from './routes/user';
import cookieParser from 'cookie-parser';
import { auth, db } from "./auth/auth"
import { toNodeHandler } from "better-auth/node";
import { user } from "./auth/schema/schema";

const app = express();

app.set('trust proxy', true);

const PORT = process.env.PORT || 3002;


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
  // allowedHeaders: ['Content-Type', 'Authorization'] // Removed to allow all headers (fixes Safari User-Agent issue)
}));

app.use(cookieParser());
// Better Auth handler (Express 5 syntax)
// Better Auth handler (Express 5 syntax)
app.all('/api/auth/*splat', toNodeHandler(auth));

// Pricing router (must be before express.json() for webhook raw body)
app.use('/api/pricing', pricingRouter);

app.use(express.json());

// Other routes
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Narrativee API is running' });
});


// Deploy webhook — triggered by GitHub Actions after image push
app.post('/api/deploy-hook', (req: any, res: any) => {
  const secret = process.env.DEPLOY_HOOK_SECRET;
  const auth = req.headers['authorization'];
  if (!secret || auth !== `Bearer ${secret}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  res.json({ ok: true });
  // Run deploy script in background after responding
  const { exec } = require('child_process');
  exec('/home/ubuntu/deploy.sh', (err: any, stdout: any, stderr: any) => {
    if (err) console.error('Deploy error:', stderr);
    else console.log('Deploy output:', stdout);
  });
});

import channelsRouter from './routes/channels';
import sourcesRouter from './routes/sources';
import articlesRouter from './routes/articles';
import knowledgeRouter from './routes/knowledge';

app.use('/api/user', userRouter);
app.use('/api/channels', channelsRouter);
app.use('/api/sources', sourcesRouter);
app.use('/api/articles', articlesRouter);
app.use('/api/knowledge-base', knowledgeRouter);

import { socialPosts } from "./auth/schema/schema";
import { and, eq, lte } from "drizzle-orm";
import { publishPostToSocialPlatform } from "./services/publisher";

const server = app.listen(PORT, () => {
  console.log(`🚀 Express Server running on http://localhost:${PORT}`);
});

// Increase timeout to 5 minutes (300s) for slow LLM responses
server.setTimeout(300000);
server.keepAliveTimeout = 300000;
server.headersTimeout = 301000;

// ─── Scheduled Posts background publishing engine (runs every 15s) ─────────
setInterval(async () => {
  try {
    const now = new Date();
    const pendingPosts = await db
      .select({ id: socialPosts.id })
      .from(socialPosts)
      .where(
        and(
          eq(socialPosts.status, "scheduled"),
          lte(socialPosts.scheduledAt, now)
        )
      );

    if (pendingPosts.length > 0) {
      console.log(`[Scheduler] Found ${pendingPosts.length} pending scheduled posts due for publishing.`);
      for (const post of pendingPosts) {
        await publishPostToSocialPlatform(post.id);
      }
    }
  } catch (err) {
    console.error("[Scheduler] Error checking/publishing scheduled posts:", err);
  }
}, 15000);