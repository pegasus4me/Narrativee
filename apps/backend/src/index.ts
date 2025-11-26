import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import reportRouter from './routes/report';
import cookieParser from 'cookie-parser';

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
app.use(express.json());
app.use(cookieParser());

// Routes
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Narrativee API is running' });
});

app.use('/api/report', reportRouter);

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
