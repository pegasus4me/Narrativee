import { Router } from "express";
import { z } from "zod";
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

const surveySchema = z.object({
  email: z.string().trim().email().max(320),
  role: z.enum(["founder", "marketing", "designer", "agency", "other"]),
  firstUseCase: z.enum(["campaign", "social", "launch", "identity", "other"]),
  currentWorkflow: z.enum([
    "self",
    "design_tool",
    "image_ai",
    "freelancer",
    "in_house",
  ]),
  mainPain: z.enum(["brand_fit", "time", "quality", "cost", "starting"]),
  founderConversation: z.boolean(),
  utmSource: z.string().max(200).optional(),
  utmCampaign: z.string().max(200).optional(),
});

export const waitlistRouter = Router();

waitlistRouter.post("/", async (request, response) => {
  const origin = request.get("origin");
  if (
    origin &&
    ![
      "http://localhost:3000",
      "http://localhost:3010",
      "https://narrativee.com",
    ].includes(origin)
  ) {
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

  const { email, utmSource, utmCampaign } = parsed.data;
  try {
    await notifyDiscordOfWaitlistSignup({
      email: email.toLowerCase(),
      utmSource,
      utmCampaign,
    });
    response.status(201).json({ created: true });
  } catch (error) {
    console.error("Waitlist signup failed", error);
    response
      .status(503)
      .json({ error: "Could not join the waitlist. Please try again." });
  }
});

waitlistRouter.post("/survey", async (request, response) => {
  const origin = request.get("origin");
  if (
    origin &&
    ![
      "http://localhost:3000",
      "http://localhost:3010",
      "https://narrativee.com",
    ].includes(origin)
  ) {
    response.status(403).json({ error: "Origin not allowed" });
    return;
  }

  const parsed = surveySchema.safeParse(request.body);
  if (!parsed.success) {
    response.status(400).json({
      error: "Please complete the survey before claiming your credits.",
    });
    return;
  }

  const data = parsed.data;
  const email = data.email.toLowerCase();
  try {
    await notifyDiscordOfWaitlistSignup({ ...data, email });
    response.json({ completed: true });
  } catch (error) {
    console.error("Waitlist survey submission failed", error);
    response
      .status(503)
      .json({ error: "Could not save your answers. Please try again." });
  }
});
