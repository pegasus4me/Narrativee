import { billingError, AccessError } from "../billing/catalog";
import { Router, type Response } from "express";
import { z } from "zod";
import { verifyAuth, type AuthRequest } from "../middleware/auth";
import {
  createStudioProject,
  findOrCreateStudioProject,
  findStudioProject,
  listStudioProjects,
  readStudioMessages,
  renameStudioProject,
  startStudioResearch,
  StudioResearchError,
  type StudioReply,
} from "./studio.service";
import { runCreatorRequest } from "./creator.service";
import { BoardResearchUnavailableError } from "../brand-board/research";
import { JevConfigurationError, JevRequestError } from "./identity.judgment";
import { agentFailureMessage } from "./agent-errors";
import { canvasRouter } from "./canvas/canvas.routes";
import { adReferencesRouter } from "../ad-references/ad-references.routes";
import { CampaignError } from "./campaign/campaign.service";
import { campaignOutputsSchema } from "./campaign/campaign.schema";
import { campaignGenerationSchema } from "./campaign/campaign.brief";
import { campaignCreditBound } from "./campaign/campaign.cost";
import { runCollaborativeConversation } from "./collaboration.service";
import { decideVisualApproval } from "./approval.service";
import { ApprovalError } from "./visual-approval";
import { requireTrialAccess } from "../usage/usage.routes";
import {
  agentSettingsSchema,
  defaultAgentModel,
  defaultImageModel,
  defaultVideoModel,
  listAgentModels,
  readAgentSettings,
  saveAgentSettings,
} from "./agent-settings.service";

const projectIdSchema = z.string().uuid();
const agentSchema = z.enum(["research", "brand", "creator"]);
const createSchema = z.object({ brandId: z.string().uuid() });
const renameSchema = z.object({ title: z.string().trim().min(1).max(100) });
const messageSchema = z.object({
  content: z.string().trim().min(1).max(4000),
  agent: z.enum(["team", "research", "brand", "creator"]).optional(),
  outputs: campaignOutputsSchema.optional(),
  generation: campaignGenerationSchema.optional(),
});
const researchSchema = z.object({
  url: z.string().trim().max(2048).optional(),
});
const allowedOrigins = new Set([
  "http://localhost:3000",
  "http://localhost:3010",
  "https://narrativee.com",
]);

export function createStudioRouter(generate?: StudioReply) {
  const router = Router();
  router.use(verifyAuth);
  router.use((request, response, next) => {
    const origin = request.get("origin");
    if (request.method !== "GET" && origin && !allowedOrigins.has(origin)) {
      response.status(403).json({ error: "Origin not allowed" });
      return;
    }
    next();
  });

  router.use(canvasRouter);
  router.use(adReferencesRouter);

  router.post(
    [
      "/:id/research",
      "/:id/creator/stream",
      "/:id/messages/stream",
      "/:id/messages",
    ],
    requireTrialAccess,
  );
  router.post("/:id/approvals/:messageId/stream", (request, response, next) => {
    if (request.body?.action === "reject" && !request.body?.feedback) {
      next();
      return;
    }
    void requireTrialAccess(request, response, next);
  });

  router.post("/", async (request: AuthRequest, response: Response) => {
    const parsed = createSchema.safeParse(request.body);
    if (!parsed.success) {
      response.status(400).json({ error: "A valid brand is required" });
      return;
    }
    try {
      const project = await createStudioProject(
        parsed.data.brandId,
        request.user!.id,
      );
      if (!project) {
        response.status(404).json({ error: "Brand not found" });
        return;
      }
      response.status(201).json(project);
    } catch (error) {
      console.error("Could not create Studio project:", error);
      response.status(500).json({ error: "Could not create the project" });
    }
  });

  router.get("/", async (request: AuthRequest, response: Response) => {
    const brandId = projectIdSchema.safeParse(request.query.brandId);
    if (!brandId.success) {
      response.status(400).json({ error: "A valid brand is required" });
      return;
    }
    try {
      if (request.query.view === "chats") {
        const projects = await listStudioProjects(
          brandId.data,
          request.user!.id,
        );
        if (!projects) {
          response.status(404).json({ error: "Brand not found" });
          return;
        }
        response.setHeader("Cache-Control", "no-store");
        response.json(projects);
        return;
      }
      const project = await findOrCreateStudioProject(
        brandId.data,
        request.user!.id,
      );
      if (!project) {
        response.status(404).json({ error: "Brand not found" });
        return;
      }
      response.setHeader("Cache-Control", "no-store");
      response.json(project);
    } catch (error) {
      console.error("Could not open Studio project:", error);
      response.status(500).json({ error: "Could not open the project" });
    }
  });

  router.get("/:id", async (request: AuthRequest, response: Response) => {
    const id = projectIdSchema.safeParse(request.params.id);
    if (!id.success) {
      response.status(400).json({ error: "Invalid project ID" });
      return;
    }
    try {
      const project = await findStudioProject(id.data, request.user!.id);
      if (!project) {
        response.status(404).json({ error: "Project not found" });
        return;
      }
      const messages = await readStudioMessages(project.id);
      response.setHeader("Cache-Control", "no-store");
      response.json({ project, messages });
    } catch (error) {
      console.error("Could not load Studio project:", error);
      response.status(500).json({ error: "Could not load the project" });
    }
  });

  router.patch("/:id", async (request: AuthRequest, response: Response) => {
    const id = projectIdSchema.safeParse(request.params.id);
    const parsed = renameSchema.safeParse(request.body);
    if (!id.success || !parsed.success) {
      response
        .status(400)
        .json({ error: "Enter a project name of 1–100 characters" });
      return;
    }
    try {
      const project = await renameStudioProject(
        id.data,
        request.user!.id,
        parsed.data.title,
      );
      if (!project) {
        response.status(404).json({ error: "Project not found" });
        return;
      }
      response.json(project);
    } catch (error) {
      console.error("Could not rename Studio project:", error);
      response.status(500).json({ error: "Could not rename the project" });
    }
  });

  router.get(
    "/:id/agents/:agent/settings",
    async (request: AuthRequest, response: Response) => {
      const id = projectIdSchema.safeParse(request.params.id);
      const agent = agentSchema.safeParse(request.params.agent);
      if (!id.success || !agent.success) {
        response.status(400).json({ error: "Invalid agent" });
        return;
      }
      try {
        const project = await findStudioProject(id.data, request.user!.id);
        if (!project) {
          response.status(404).json({ error: "Project not found" });
          return;
        }
        const [settings, catalog] = await Promise.all([
          readAgentSettings(project.brandId, agent.data),
          listAgentModels(),
        ]);
        response.setHeader("Cache-Control", "no-store");
        response.json({
          settings,
          ...catalog,
          defaultModel: defaultAgentModel(),
          defaultImageModel: defaultImageModel(),
          defaultVideoModel: defaultVideoModel(),
          videoGenerationAvailable: false,
        });
      } catch {
        response.status(503).json({ error: "Could not load agent settings" });
      }
    },
  );

  router.post(
    "/:id/generation-cost",
    async (request: AuthRequest, response: Response) => {
      const id = projectIdSchema.safeParse(request.params.id);
      const outputs = campaignOutputsSchema.safeParse(request.body?.outputs);
      if (!id.success || !outputs.success) {
        response.status(400).json({ error: "Choose a valid creative format" });
        return;
      }
      try {
        const project = await findStudioProject(id.data, request.user!.id);
        if (!project) {
          response.status(404).json({ error: "Project not found" });
          return;
        }
        const settings = await readAgentSettings(project.brandId, "creator");
        const imageModel = settings.imageModel ?? defaultImageModel();
        const textModel =
          process.env.BRAND_IDENTITY_MODEL ??
          process.env.OPENAI_MODEL ??
          "gpt-5.6-luna";
        response.setHeader("Cache-Control", "no-store");
        response.json({
          maxCredits: campaignCreditBound(outputs.data, imageModel, textModel),
        });
      } catch (error) {
        response
          .status(503)
          .json({
            error: "Could not verify the generation cost",
            ...billingError(error),
          });
      }
    },
  );

  router.patch(
    "/:id/agents/:agent/settings",
    async (request: AuthRequest, response: Response) => {
      const id = projectIdSchema.safeParse(request.params.id);
      const agent = agentSchema.safeParse(request.params.agent);
      const settings = agentSettingsSchema.safeParse(request.body);
      if (!id.success || !agent.success || !settings.success) {
        response.status(400).json({ error: "Invalid agent settings" });
        return;
      }
      try {
        const project = await findStudioProject(id.data, request.user!.id);
        if (!project) {
          response.status(404).json({ error: "Project not found" });
          return;
        }
        if (
          agent.data !== "creator" &&
          (settings.data.imageModel || settings.data.videoModel)
        ) {
          response
            .status(400)
            .json({ error: "Image and video models belong to Pixel" });
          return;
        }
        const catalog = await listAgentModels();
        const selected = settings.data;
        if (
          (selected.model && !catalog.models.includes(selected.model)) ||
          (selected.imageModel &&
            !catalog.imageModels.includes(selected.imageModel)) ||
          (selected.videoModel &&
            !catalog.videoModels.includes(selected.videoModel))
        ) {
          response
            .status(400)
            .json({ error: "Choose an available model for each format" });
          return;
        }
        response.json(
          await saveAgentSettings(project.brandId, agent.data, settings.data),
        );
      } catch {
        response.status(503).json({ error: "Could not save agent settings" });
      }
    },
  );

  router.post(
    "/:id/research",
    async (request: AuthRequest, response: Response) => {
      const id = projectIdSchema.safeParse(request.params.id);
      const input = researchSchema.safeParse(request.body ?? {});
      if (!id.success || !input.success) {
        response.status(400).json({ error: "Invalid research request" });
        return;
      }

      try {
        const result = await startStudioResearch(
          id.data,
          request.user!.id,
          input.data.url,
        );
        if (!result) {
          response.status(404).json({ error: "Project not found" });
          return;
        }
        response.status(202).json(result);
      } catch (error) {
        if (error instanceof StudioResearchError) {
          response.status(error.status).json({ error: error.message });
          return;
        }
        console.error("Could not start Studio research:", error);
        response.status(503).json({ error: "Brand research is unavailable" });
      }
    },
  );

  router.post(
    "/:id/creator/stream",
    async (request: AuthRequest, response: Response) => {
      const id = projectIdSchema.safeParse(request.params.id);
      const message = messageSchema.safeParse(request.body);
      if (!id.success || !message.success) {
        response.status(400).json({ error: "Invalid Creator request" });
        return;
      }

      const project = await findStudioProject(id.data, request.user!.id);
      if (!project) {
        response.status(404).json({ error: "Project not found" });
        return;
      }
      if (project.kind !== "creation" && !message.data.generation) {
        response.status(409).json({ error: "Open a Creator chat first" });
        return;
      }

      response.setHeader("Content-Type", "application/x-ndjson; charset=utf-8");
      response.setHeader("Cache-Control", "no-cache, no-transform");
      response.setHeader("X-Accel-Buffering", "no");
      response.flushHeaders();

      try {
        const result = await runCreatorRequest(
          project.id,
          project.brandId,
          request.user!.id,
          message.data.content,
          (event) => response.write(`${JSON.stringify(event)}\n`),
          message.data.agent,
          message.data.outputs,
          message.data.generation,
        );
        if (!result) throw new Error("Project not found");
        response.write(`${JSON.stringify({ type: "done", ...result })}\n`);
      } catch (error) {
        console.error("Studio Creator stream failed:", error);
        const reason =
          error instanceof BoardResearchUnavailableError
            ? error.message
            : error instanceof CampaignError && !error.cause
              ? error.message
              : error instanceof JevConfigurationError ||
                  error instanceof JevRequestError
                ? error.message
                : error instanceof Error && error.name === "CreatorBusyError"
                  ? error.message
                  : agentFailureMessage(error);
        response.write(
          `${JSON.stringify({ type: "error", error: reason, ...billingError(error) })}\n`,
        );
      } finally {
        response.end();
      }
    },
  );

  router.post(
    "/:id/approvals/:messageId/stream",
    async (request: AuthRequest, response: Response) => {
      const id = projectIdSchema.safeParse(request.params.id);
      const messageId = projectIdSchema.safeParse(request.params.messageId);
      const decision = z
        .object({
          action: z.enum(["approve", "reject", "refresh"]),
          feedback: z.string().trim().max(4000).default(""),
        })
        .strict()
        .refine((value) => value.action === "reject" || !value.feedback)
        .safeParse(request.body);
      if (!id.success || !messageId.success || !decision.success) {
        response.status(400).json({ error: "Invalid approval decision" });
        return;
      }
      const project = await findStudioProject(id.data, request.user!.id);
      if (!project || project.kind !== "creation") {
        response.status(404).json({ error: "Proposal not found" });
        return;
      }
      response.setHeader("Content-Type", "application/x-ndjson; charset=utf-8");
      response.setHeader("Cache-Control", "no-cache, no-transform");
      response.setHeader("X-Accel-Buffering", "no");
      response.flushHeaders();
      try {
        const result = await decideVisualApproval(
          id.data,
          request.user!.id,
          messageId.data,
          decision.data.action,
          decision.data.feedback,
          (event) => response.write(`${JSON.stringify(event)}\n`),
        );
        response.write(`${JSON.stringify({ type: "done", ...result })}\n`);
      } catch (error) {
        console.error("Studio approval failed:", error);
        const reason =
          error instanceof ApprovalError ||
          (error instanceof CampaignError && !error.cause)
            ? error.message
            : agentFailureMessage(error);
        response.write(
          `${JSON.stringify({ type: "error", error: reason, ...billingError(error) })}\n`,
        );
      } finally {
        response.end();
      }
    },
  );

  router.post(
    "/:id/messages/stream",
    async (request: AuthRequest, response: Response) => {
      const id = projectIdSchema.safeParse(request.params.id);
      const message = messageSchema.safeParse(request.body);
      if (!id.success || !message.success) {
        response.status(400).json({ error: "Invalid message" });
        return;
      }

      const project = await findStudioProject(id.data, request.user!.id);
      if (!project) {
        response.status(404).json({ error: "Project not found" });
        return;
      }

      response.setHeader("Content-Type", "application/x-ndjson; charset=utf-8");
      response.setHeader("Cache-Control", "no-cache, no-transform");
      response.setHeader("X-Accel-Buffering", "no");
      response.flushHeaders();

      try {
        const result = await runCollaborativeConversation(
          id.data,
          request.user!.id,
          message.data.content,
          (event) => response.write(`${JSON.stringify(event)}\n`),
          message.data.agent ?? "team",
        );
        if (!result) throw new Error("Project not found");
        response.write(`${JSON.stringify({ type: "done", ...result })}\n`);
      } catch (error) {
        console.error("Studio designer stream failed:", error);
        response.write(
          `${JSON.stringify({ type: "error", error: "The designer is unavailable. Your prompt was not sent.", ...billingError(error) })}\n`,
        );
      } finally {
        response.end();
      }
    },
  );

  router.post(
    "/:id/messages",
    async (request: AuthRequest, response: Response) => {
      const id = projectIdSchema.safeParse(request.params.id);
      const message = messageSchema.safeParse(request.body);
      if (!id.success || !message.success) {
        response.status(400).json({ error: "Invalid message" });
        return;
      }
      try {
        const result = await runCollaborativeConversation(
          id.data,
          request.user!.id,
          message.data.content,
          () => {},
          message.data.agent ?? "team",
          undefined,
          generate,
        );
        if (!result) {
          response.status(404).json({ error: "Project not found" });
          return;
        }
        response.json(result);
      } catch (error) {
        console.error("Studio designer failed:", error);
        response
          .status(error instanceof AccessError ? error.status : 503)
          .json({
            ...billingError(error),
            error:
              error instanceof AccessError
                ? error.message
                : "The designer is unavailable. Your prompt was not sent.",
          });
      }
    },
  );

  return router;
}

export const studioRouter = createStudioRouter();
