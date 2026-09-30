import { Router, type Response } from "express";
import { and, asc, eq, inArray } from "drizzle-orm";
import { db } from "../auth/auth";
import { discoveryMessage, siteAnalysis } from "../auth/schema/schema";
import { optionalAuth, type AuthRequest } from "../middleware/auth";
import { findPublicAnalysis } from "./analysis.service";
import { createAnalysisService as createService } from "./create-service";
import { normalizePublicUrl } from "./url-policy";

export const analysisRouter = Router();
analysisRouter.use(optionalAuth);

analysisRouter.post(
  "/",
  async (request: AuthRequest, response: Response): Promise<void> => {
    try {
      if (typeof request.body?.url !== "string") {
        response.status(400).json({ error: "A URL is required" });
        return;
      }

      const url = normalizePublicUrl(request.body.url);
      const service = createService();
      const analysisId = await service.create(url, request.user?.id);

      void service.run(analysisId, url);
      response.status(202).json({ analysisId, status: "queued" });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Invalid request";
      response.status(400).json({ error: message });
    }
  },
);

analysisRouter.post(
  "/:id/competitors",
  async (request: AuthRequest, response: Response): Promise<void> => {
    try {
      if (!Array.isArray(request.body?.urls)) {
        response.status(400).json({ error: "Competitor URLs are required" });
        return;
      }

      const analysis = await findPublicAnalysis(request.params.id, request);
      if (!analysis) {
        response.status(404).json({ error: "Analysis not found" });
        return;
      }

      if (
        analysis.status !== "awaiting_competitor_confirmation" &&
        analysis.status !== "competitor_analysis_failed"
      ) {
        response.status(409).json({
          error: "Competitors can only be selected after discovery finishes",
        });
        return;
      }

      const companyHostname = new URL(analysis.url).hostname;
      const submittedUrls = request.body.urls as unknown[];
      const urls: string[] = [
        ...new Set(
          submittedUrls
            .filter((url: unknown): url is string => typeof url === "string")
            .map(normalizePublicUrl)
            .filter((url: string) => new URL(url).hostname !== companyHostname),
        ),
      ].slice(0, 5);

      if (urls.length === 0) {
        response.status(400).json({
          error: "Select between one and five competitor URLs",
        });
        return;
      }

      const service = createService();
      const [started] = await db
        .update(siteAnalysis)
        .set({
          status: "scanning_competitors",
          progress: 0,
          selectedCompetitorUrls: urls,
          competitorAnalysis: null,
          error: null,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(siteAnalysis.id, request.params.id),
            inArray(siteAnalysis.status, [
              "awaiting_competitor_confirmation",
              "competitor_analysis_failed",
            ]),
          ),
        )
        .returning({ id: siteAnalysis.id });
      if (!started) {
        response
          .status(409)
          .json({ error: "Competitor analysis already started" });
        return;
      }
      void service.analyzeCompetitors(request.params.id, urls);
      response.status(202).json({
        analysisId: request.params.id,
        status: "scanning_competitors",
        competitorUrls: urls,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Invalid competitor selection";
      response.status(400).json({ error: message });
    }
  },
);

analysisRouter.get(
  "/:id",
  async (request: AuthRequest, response: Response): Promise<void> => {
    try {
      const analysis = await findPublicAnalysis(request.params.id, request);
      if (!analysis) {
        response.status(404).json({ error: "Analysis not found" });
        return;
      }

      response.json(analysis);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to load analysis";
      response.status(500).json({ error: message });
    }
  },
);

analysisRouter.get(
  "/:id/messages",
  async (request: AuthRequest, response: Response): Promise<void> => {
    try {
      const analysis = await findPublicAnalysis(request.params.id, request);
      if (!analysis) {
        response.status(404).json({ error: "Analysis not found" });
        return;
      }
      const messages = await db
        .select({
          id: discoveryMessage.id,
          role: discoveryMessage.role,
          content: discoveryMessage.content,
          createdAt: discoveryMessage.createdAt,
        })
        .from(discoveryMessage)
        .where(eq(discoveryMessage.analysisId, request.params.id))
        .orderBy(asc(discoveryMessage.createdAt));
      response.json({ messages });
    } catch (error) {
      console.error("Unable to load discovery conversation:", error);
      const databaseError = error as { code?: string };
      response.status(500).json({
        error:
          databaseError.code === "42P01"
            ? "Discovery conversation table is missing. Run pnpm --filter backend db:migrate-brands."
            : "Unable to load discovery conversation. Check the backend logs for details.",
      });
    }
  },
);

analysisRouter.post(
  "/:id/messages",
  async (request: AuthRequest, response: Response): Promise<void> => {
    try {
      const analysis = await findPublicAnalysis(request.params.id, request);
      if (!analysis) {
        response.status(404).json({ error: "Analysis not found" });
        return;
      }
      const content =
        typeof request.body?.content === "string"
          ? request.body.content.trim()
          : "";
      if (!content || content.length > 4000) {
        response
          .status(400)
          .json({ error: "Message must be between 1 and 4000 characters" });
        return;
      }
      if (!analysis.diagnosis || analysis.status !== "completed") {
        response
          .status(409)
          .json({
            error:
              "Wait for the brand and competitor exploration to finish first",
          });
        return;
      }
      const answer = await createService().replyToDiscovery(
        request.params.id,
        content,
      );
      response.json({ answer });
    } catch (error) {
      response
        .status(500)
        .json({
          error:
            error instanceof Error
              ? error.message
              : "Designer agent is unavailable",
        });
    }
  },
);
