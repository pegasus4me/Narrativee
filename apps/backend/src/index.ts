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
import { auth, db } from "./auth/auth"
import { toNodeHandler } from "better-auth/node";
import { EmailService } from "./services/email-service";
import { NoteService } from "./services/note-service";
import { SubscriberService } from "./services/subscriber-service";
import { user } from "./auth/schema/schema";
import { eq, and, gte, isNotNull } from "drizzle-orm";
import { notes, scheduledNotes } from "./auth/schema/schema";

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

// Weekly digest cron — call this every Monday at 8am via a cron service
app.post('/api/cron/weekly-digest', async (req: any, res: any) => {
    const secret = process.env.DEPLOY_HOOK_SECRET;
    const authHeader = req.headers['authorization'];
    if (!secret || authHeader !== `Bearer ${secret}`) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    res.json({ ok: true, message: 'Weekly digest started' });

    // Run in background
    (async () => {
        try {
            const allUsers = await db.select().from(user).where(eq(user.onboarded, true));
            console.log(`📬 Sending weekly digest to ${allUsers.length} users...`);

            const oneWeekAgo = new Date();
            oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
            const oneWeekAgoStr = oneWeekAgo.toISOString().split('T')[0]!;

            for (const u of allUsers) {
                try {
                    // Notes posted this week (synced notes)
                    const weekNotes = await db.select().from(notes).where(
                        and(eq(notes.userId, u.id), isNotNull(notes.publishedAt), gte(notes.publishedAt, oneWeekAgo))
                    );
                    // + scheduled notes published this week
                    const weekScheduled = await db.select().from(scheduledNotes).where(
                        and(eq(scheduledNotes.userId, u.id), eq(scheduledNotes.status, 'published'), gte(scheduledNotes.scheduledDate, oneWeekAgoStr))
                    );

                    const notesPosted = weekNotes.length + weekScheduled.length;
                    const totalLikes = weekNotes.reduce((s, n) => s + (n.likes || 0), 0);
                    const totalComments = weekNotes.reduce((s, n) => s + (n.comments || 0), 0);
                    const totalRestacks = weekNotes.reduce((s, n) => s + (n.restacks || 0), 0);

                    // Subscriber growth this week
                    const subs = await SubscriberService.getSubscribers(u.id);
                    const currentMonth = new Date().toISOString().slice(0, 7);
                    const lastMonth = new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().slice(0, 7);
                    const currSubs = subs.find(s => s.month === currentMonth)?.totalCount ?? 0;
                    const prevSubs = subs.find(s => s.month === lastMonth)?.totalCount ?? 0;
                    const newSubscribers = Math.max(0, currSubs - prevSubs);

                    // Top note this week
                    const topNote = weekNotes.sort((a, b) => (b.likes || 0) - (a.likes || 0))[0] ?? null;

                    await EmailService.sendWeeklyDigest({
                        email: u.email,
                        name: u.name,
                        notesPosted,
                        totalLikes,
                        totalComments,
                        totalRestacks,
                        newSubscribers,
                        topNote: topNote ? { content: topNote.contentPreview || '', likes: topNote.likes || 0 } : null,
                    });
                } catch (e) {
                    console.error(`Failed digest for ${u.email}:`, e);
                }
            }
            console.log('✅ Weekly digest done');
        } catch (e) {
            console.error('Weekly digest failed:', e);
        }
    })();
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