import { Router, type Request, type Response } from "express";
import { z } from "zod";
import { verifyAuth, type AuthRequest } from "../middleware/auth";
import { plans, AccessError, billingError } from "./catalog";
import { checkout, upgrade, portal } from "./checkout";
import { stripeClient } from "./stripe";
import { processStripeEvent } from "./webhooks";
export const billingRouter = Router();
billingRouter.get("/plans", (_request, response) => {
  response.setHeader("Cache-Control", "no-store");
  response.json({
    currency: "USD",
    creditCostUsd: 0.01,
    plans,
    billingAvailable: process.env.BILLING_ENABLED === "true",
  });
});
billingRouter.use(verifyAuth);
billingRouter.use((request, response, next) => {
  const origin = request.get("origin");
  if (
    request.method !== "GET" &&
    origin &&
    ![
      "http://localhost:3000",
      "http://localhost:3010",
      process.env.WEB_APP_URL ?? "https://narrativee.com",
    ].includes(origin)
  ) {
    response.status(403).json({ error: "Origin not allowed" });
    return;
  }
  if (process.env.BILLING_ENABLED !== "true") {
    response
      .status(503)
      .json({
        code: "BILLING_UNAVAILABLE",
        error: "Paid billing is not available yet.",
      });
    return;
  }
  next();
});
const destination = z.object({
  returnPath: z.string().max(2048).default("/workspace/studio"),
});
for (const kind of ["checkout", "upgrade", "portal"] as const)
  billingRouter.post(`/${kind}`, async (request: AuthRequest, response) => {
    try {
      const input =
        kind === "checkout"
          ? destination
              .extend({
                plan: z.enum(["starter", "pro"]),
                interval: z.enum(["monthly", "yearly"]),
              })
              .parse(request.body)
          : destination.parse(request.body);
      let result;
      if (kind === "checkout") {
        const selection = z
          .object({
            plan: z.enum(["starter", "pro"]),
            interval: z.enum(["monthly", "yearly"]),
          })
          .parse(request.body);
        result = await checkout(
          request.user!.id,
          selection.plan,
          selection.interval,
          input.returnPath,
        );
      } else
        result =
          kind === "upgrade"
            ? await upgrade(request.user!.id, input.returnPath)
            : await portal(request.user!.id, input.returnPath);
      response.json(result);
    } catch (error) {
      if (error instanceof z.ZodError) {
        response.status(400).json({ error: "Invalid billing request" });
        return;
      }
      console.error("Billing request failed", error);
      response
        .status(error instanceof AccessError ? error.status : 503)
        .json(
          error instanceof AccessError
            ? billingError(error)
            : { error: "Billing is temporarily unavailable. Please retry." },
        );
    }
  });
export async function stripeWebhook(request: Request, response: Response) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    response.status(503).json({ error: "Webhook is not configured" });
    return;
  }
  let event;
  try {
    event = stripeClient().webhooks.constructEvent(
      request.body,
      request.get("stripe-signature") ?? "",
      secret,
    );
  } catch {
    response.status(400).json({ error: "Invalid webhook signature" });
    return;
  }
  try {
    await processStripeEvent(event);
    response.json({ received: true });
  } catch (error) {
    console.error("Stripe webhook processing failed", error);
    response.status(500).json({ error: "Webhook could not be processed" });
  }
}
