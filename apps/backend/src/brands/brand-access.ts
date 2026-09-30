import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import type { Response } from "express";
import type { AuthRequest } from "../middleware/auth";

export const hash = (value: string) =>
  createHash("sha256").update(value).digest("hex");
export const guestCookieName = (id: string) => `narrativee_brand_${id}`;

export function guestToken(key: string): string {
  const secret = process.env.BETTER_AUTH_SECRET;
  if (!secret) throw new Error("BETTER_AUTH_SECRET is not configured");
  // The random creation key lets a lost response be retried with the same guest cookie.
  return createHmac("sha256", secret).update(`brand:${key}`).digest("hex");
}

export function setGuestCookie(response: Response, id: string, token: string) {
  response.cookie(guestCookieName(id), token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/api",
    maxAge: 30 * 24 * 60 * 60 * 1000,
  });
}

export function canAccessBrand(
  record: { id: string; userId: string | null; guestTokenHash: string | null },
  request: AuthRequest,
): boolean {
  if (record.userId) return record.userId === request.user?.id;
  const token: unknown = request.cookies?.[guestCookieName(record.id)];
  if (typeof token !== "string" || !record.guestTokenHash) return false;
  const expected = Buffer.from(record.guestTokenHash, "hex");
  const supplied = Buffer.from(hash(token), "hex");
  return (
    expected.length === supplied.length && timingSafeEqual(expected, supplied)
  );
}
