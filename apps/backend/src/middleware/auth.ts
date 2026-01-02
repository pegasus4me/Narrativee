import { Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';
import { auth } from '../auth/auth';
dotenv.config();

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    name: string;
    image?: string;
    plan: 'free' | 'premium' | 'pro';
    tokens?: number;
    subscriptionStatus?: string;
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
      : req.cookies?.['better-auth.session_token'] || req.cookies?.['__Secure-better-auth.session_token'];

    if (!token) {
      // Try one last time with getSession directly, as it might find something we missed
      // But usually if no cookie/header, it's empty.
      // Let's keep the check but include the secure cookie name.
    } else {
      // Token found
    }

    // Actually, simpler: Just remove the strict "if (!token)" block and let auth.api.getSession handle it.
    // If getSession returns null, we send 401.

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
      plan: (session.user as any).plan || 'free',
      tokens: (session.user as any).tokens || 0,
      subscriptionStatus: (session.user as any).subscriptionStatus,
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
      : req.cookies?.['better-auth.session_token'] || req.cookies?.['__Secure-better-auth.session_token'];

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
          subscriptionStatus: (session.user as any).subscriptionStatus,
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
