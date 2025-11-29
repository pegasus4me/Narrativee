import { webcrypto } from 'node:crypto';
if (!global.crypto) {
  global.crypto = webcrypto as any;
}
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import reportRouter from './routes/report';
import chatRouter from './routes/chat';
import cookieParser from 'cookie-parser';
import { auth } from "./auth/auth"
import { toNodeHandler } from "better-auth/node";

dotenv.config();
const app = express();

app.set('trust proxy', true);

const PORT = process.env.PORT || 3002;


// CORS MUST be before BetterAuth
app.use(cors({
  origin: process.env.NODE_ENV === "production"
    ? ["https://narrativee.com", "https://api.narrativee.com"]
    : ["http://localhost:3000"],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(cookieParser());
// Better Auth handler (Express 5 syntax)
app.all('/api/auth/*splat', toNodeHandler(auth));

app.use(express.json());

// Other routes
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Narrativee API is running' });
});

app.use('/api/report', reportRouter);
app.use('/api/chat', chatRouter);

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});