import { Router } from "express";
import { z } from "zod";
import { db } from "../auth/auth";
import { waitlistEntry } from "../auth/schema/schema";
import { notifyDiscordOfWaitlistSignup } from "./notify-discord";

const inputSchema = z.object({
  email: z.string().trim().email().max(320),
  utmSource: z.string().max(200).optional(),
  utmMedium: z.string().max(200).optional(),
  utmCampaign: z.string().max(200).optional(),
  utmContent: z.string().max(200).optional(),
  utmTerm: z.string().max(200).optional(),
  fbclid: z.string().max(1024).optional(),
  companyUrl: z.string().max(2048).optional(),
});

export const waitlistRouter = Router();

waitlistRouter.post("/", async (request, response) => {
  const origin = request.get("origin");
  if (origin && !["http://localhost:3000", "http://localhost:3010", "https://narrativee.com"].includes(origin)) {
    response.status(403).json({ error: "Origin not allowed" });
    return;
  }

  const parsed = inputSchema.safeParse(request.body);
  if (!parsed.success) {
    response.status(400).json({ error: "Enter a valid email address." });
    return;
  }

  if (parsed.data.companyUrl) {
    response.json({ created: false });
    return;
  }

  const { email, utmSource, utmMedium, utmCampaign, utmContent, utmTerm, fbclid } = parsed.data;
  try {
    const inserted = await db.insert(waitlistEntry).values({
      email: email.toLowerCase(),
      utmSource,
      utmMedium,
      utmCampaign,
      utmContent,
      utmTerm,
      fbclid,
    }).onConflictDoNothing({ target: waitlistEntry.email }).returning({ id: waitlistEntry.id });

    if (inserted.length) {
      void notifyDiscordOfWaitlistSignup({
        email: email.toLowerCase(),
        utmSource,
        utmCampaign,
      });
    }

    response.status(inserted.length ? 201 : 200).json({ created: inserted.length > 0 });
  } catch (error) {
    console.error("Waitlist signup failed", error);
    response.status(503).json({ error: "Could not join the waitlist. Please try again." });
  }
});
