import type { Request, Response, NextFunction } from "express";
import { auth } from "../auth/auth";

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  image?: string | null;
  createdAt: Date;
  updatedAt: Date;
  emailVerified: boolean;
}

export interface AuthRequest extends Request {
  user?: AuthUser;
  session?: unknown;
}

/**
 * Middleware to verify Better Auth session.
 * Extracts session from incoming request headers and cookies.
 */
export async function verifyAuth(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void | Response> {
  try {
    const cleanHeaders: Record<string, string> = {};
    for (const [key, value] of Object.entries(req.headers)) {
      if (value && key.toLowerCase() !== "origin" && key.toLowerCase() !== "referer") {
        cleanHeaders[key] = Array.isArray(value) ? value.join(", ") : String(value);
      }
    }

    const session = await auth.api.getSession({
      headers: cleanHeaders,
    });

    if (!session?.user) {
      return res.status(401).json({
        error: "Unauthorized",
        message: "Invalid or expired session",
      });
    }

    req.user = session.user as unknown as AuthUser;
    req.session = session.session;

    next();
  } catch (error) {
    console.error("Auth verification error:", error);
    return res.status(401).json({
      error: "Unauthorized",
      message: "Authentication failed",
    });
  }
}

/**
 * Optional middleware - allows both authenticated and anonymous users.
 */
export async function optionalAuth(
  req: AuthRequest,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const cleanHeaders: Record<string, string> = {};
    for (const [key, value] of Object.entries(req.headers)) {
      if (value && key.toLowerCase() !== "origin" && key.toLowerCase() !== "referer") {
        cleanHeaders[key] = Array.isArray(value) ? value.join(", ") : String(value);
      }
    }

    const session = await auth.api.getSession({
      headers: cleanHeaders,
    });

    if (session?.user) {
      req.user = session.user as unknown as AuthUser;
      req.session = session.session;
    }

    next();
  } catch (error) {
    console.error("Optional auth error:", error);
    next();
  }
}

