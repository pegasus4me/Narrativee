import "dotenv/config";
import express, { type Request, type Response } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { toNodeHandler } from "better-auth/node";
import { auth } from "./auth/auth";
import { analysisRouter } from "./analysis/analysis.routes";
import { brandRouter } from "./brands/brand.routes";
import { studioRouter } from "./studio/studio.routes";
import { waitlistRouter } from "./waitlist/waitlist.routes";

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
app.use(express.json());
app.use("/api/site-analyses", analysisRouter);
app.use("/api/brands", brandRouter);
app.use("/api/studio/projects", studioRouter);
app.use("/api/waitlist", waitlistRouter);

app.get("/health", (_request: Request, response: Response): void => {
  response.json({ status: "ok" });
});

app.listen(port, (): void => {
  console.log(`Narrativee API running on http://localhost:${port}`);
});
