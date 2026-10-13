import { verifyBillingConfiguration } from "./billing/readiness";
import { billingRouter, stripeWebhook } from "./billing/billing.routes";
import { recoverAbandoned } from "./usage/ledger";
import { retryStripeEvents } from "./billing/webhooks";
import "dotenv/config";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { toNodeHandler } from "better-auth/node";
import { auth } from "./auth/auth";
import { analysisRouter } from "./analysis/analysis.routes";
import { brandRouter } from "./brands/brand.routes";
import { brandBrainRouter } from "./brand-brain/brand-brain.routes";
import { studioRouter } from "./studio/studio.routes";
import { waitlistRouter } from "./waitlist/waitlist.routes";
import { googleFontsRouter } from "./fonts/google-fonts.routes";
import { usageRouter } from "./usage/usage.routes";
import { health } from "./health";

const app = express();
const port = Number(process.env.PORT ?? 3002);

app.set("trust proxy", true);
app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "http://localhost:3010",
      "https://narrativee.com",
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  }),
);
app.use(cookieParser());

app.all("/api/auth/*splat", toNodeHandler(auth));
app.use("/api/studio/projects", express.json({ limit: "2mb" }));
app.post(
  "/api/billing/webhook",
  express.raw({ type: "application/json" }),
  stripeWebhook,
);
app.use(express.json());
app.use("/api/site-analyses", analysisRouter);
app.use("/api/brands", brandBrainRouter);
app.use("/api/brands", brandRouter);
app.use("/api/studio/projects", studioRouter);
app.use("/api/waitlist", waitlistRouter);
app.use("/api/fonts", googleFontsRouter);
app.use("/api/usage", usageRouter);
app.use("/api/billing", billingRouter);
const recovery = setInterval(() => {
  void recoverAbandoned().catch((error) =>
    console.error("Usage recovery failed", error),
  );
  if (process.env.STRIPE_SECRET_KEY)
    void retryStripeEvents().catch((error) =>
      console.error("Webhook recovery failed", error),
    );
}, 60_000);
recovery.unref();

app.get("/health", health);

async function start() {
  if (process.env.BILLING_ENABLED === "true")
    await verifyBillingConfiguration();
  app.listen(port, () =>
    console.log(`Narrativee API running on http://localhost:${port}`),
  );
}
void start().catch((error) => {
  console.error(
    "API startup failed",
    error instanceof Error ? error.message : error,
  );
  process.exitCode = 1;
});
