import { Request, Response, NextFunction } from 'express';
import { betterAuth } from 'better-auth';
import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

// Initialize Better Auth with same config as frontend
const auth = betterAuth({
  database: new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  }),
  secret: process.env.BETTER_AUTH_SECRET || 'your-secret-key', // Must match frontend
});

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    name: string;
    image?: string;
    plan: 'free' | 'premium';
    tokens?: number; // For future token tracking
  };
  session?: any;
}

/**
 * Middleware to verify Better Auth session
 * Extracts session token from Authorization header or cookies
 */
export async function verifyAuth(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    // Get token from Authorization header or cookies
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ')
      ? authHeader.substring(7)
      : req.cookies?.['better-auth.session_token'];

    if (!token) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'No authentication token provided'
      });
    }

    // Verify session using Better Auth
    const session = await auth.api.getSession({
      headers: req.headers as any,
    });

    if (!session || !session.user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid or expired session'
      });
    }

    // Attach user and session to request
    req.user = {
      id: session.user.id,
      email: session.user.email,
      name: session.user.name,
      image: session.user.image as string,
      plan: (session.user as any).plan || 'free', // Default to free plan
      tokens: (session.user as any).tokens || 0, // For future token tracking
    };
    req.session = session.session;

    next();
  } catch (error) {
    console.error('Auth verification error:', error);
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication failed'
    });
  }
}

/**
 * Optional middleware - allows both authenticated and anonymous users
 */
export async function optionalAuth(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ')
      ? authHeader.substring(7)
      : req.cookies?.['better-auth.session_token'];

    if (token) {
      const session = await auth.api.getSession({
        headers: req.headers as any,
      });

      if (session?.user) {
        req.user = {
          id: session.user.id,
          email: session.user.email,
          name: session.user.name,
          image: session.user.image as string,
          plan: (session.user as any).plan || 'free',
          tokens: (session.user as any).tokens || 0,
        };
        req.session = session.session;
      }
    }

    next();
  } catch (error) {
    console.error('Optional auth error:', error);
    next(); // Continue even if auth fails
  }
}
