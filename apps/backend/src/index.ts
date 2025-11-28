import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import reportRouter from './routes/report';
import chatRouter from './routes/chat';
import cookieParser from 'cookie-parser';
import {auth} from "./auth/auth"
import { toNodeHandler } from "better-auth/node";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3002;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true, // Allow cookies for Better Auth sessions
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.all('/api/auth/{*any}', toNodeHandler(auth));
app.use(express.json());
app.use(cookieParser());

// Routes
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Narrativee API is running' });
});

app.use('/api/report', reportRouter);
app.use('/api/chat', chatRouter);

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
