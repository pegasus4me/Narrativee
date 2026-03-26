import { webcrypto } from 'node:crypto';
if (!global.crypto) {
  global.crypto = webcrypto as any;
}
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import pricingRouter from './routes/pricing';
import userRouter from './routes/user';
import cookieParser from 'cookie-parser';
import { auth } from "./auth/auth"
import { toNodeHandler } from "better-auth/node";

dotenv.config();
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
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
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

// import eventsRouter from './routes/events';

// ... (imports)

// ...

// import apiKeysRouter from './routes/api-keys';

// import scoringRouter from './routes/scoring';
// import workflowsRouter from './routes/workflows';
import onboardingRouter from './routes/onboarding';
import substackRouter from './routes/substack';
import postsRouter from './routes/posts';
import notesRouter from './routes/notes';
import subscribersRouter from './routes/subscribers';
import inspirationsRouter from './routes/inspirations';
import scheduledNotesRouter from './routes/scheduled-notes';

app.use('/api/user', userRouter);
// app.use('/api/events', eventsRouter);
// app.use('/api/api-keys', apiKeysRouter);

// app.use('/api/scoring', scoringRouter);
// app.use('/api/workflows', workflowsRouter);
app.use('/api/onboarding', onboardingRouter);
app.use('/api/substack', substackRouter);
app.use('/api/posts', postsRouter);
app.use('/api/notes', notesRouter);
app.use('/api/subscribers', subscribersRouter);
app.use('/api/inspirations', inspirationsRouter);
app.use('/api/scheduled-notes', scheduledNotesRouter);

const server = app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});

// Increase timeout to 5 minutes (300s) for slow LLM responses
server.setTimeout(300000);
server.keepAliveTimeout = 300000;
server.headersTimeout = 301000;