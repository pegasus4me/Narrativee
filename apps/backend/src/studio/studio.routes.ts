import { Router, type Response } from "express";
import { z } from "zod";
import { verifyAuth, type AuthRequest } from "../middleware/auth";
import {
  createStudioProject,
  findOrCreateStudioProject,
  findStudioProject,
  generateStudioReply,
  generateStudioReplyStream,
  listStudioProjects,
  readStudioMessages,
  sendStudioMessage,
  startStudioResearch,
  StudioResearchError,
  type StudioReply,
} from "./studio.service";
import { runCreatorRequest } from "./creator.service";
import { BoardResearchUnavailableError } from "../brand-board/research";

const projectIdSchema = z.string().uuid();
const createSchema = z.object({ brandId: z.string().uuid() });
const messageSchema = z.object({
  content: z.string().trim().min(1).max(4000),
});
const researchSchema = z.object({
  url: z.string().trim().max(2048).optional(),
});
const allowedOrigins = new Set([
  "http://localhost:3000",
  "http://localhost:3010",
  "https://narrativee.com",
]);

export function createStudioRouter(
  generate: StudioReply = generateStudioReply,
) {
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
      if (project.kind !== "creation") {
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
        );
        if (!result) throw new Error("Project not found");
        response.write(`${JSON.stringify({ type: "done", ...result })}\n`);
      } catch (error) {
        console.error("Studio Creator stream failed:", error);
        const reason =
          error instanceof BoardResearchUnavailableError
            ? error.message
            : error instanceof Error && error.name === "CreatorBusyError"
              ? error.message
              : "The designer could not finish. Completed canvas objects were kept.";
        response.write(`${JSON.stringify({ type: "error", error: reason })}\n`);
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
        const result = await sendStudioMessage(
          id.data,
          request.user!.id,
          message.data.content,
          (system, turns) =>
            generateStudioReplyStream(system, turns, (delta) => {
              response.write(
                `${JSON.stringify({ type: "delta", text: delta })}\n`,
              );
            }),
        );
        if (!result) throw new Error("Project not found");
        response.write(`${JSON.stringify({ type: "done", ...result })}\n`);
      } catch (error) {
        console.error("Studio designer stream failed:", error);
        response.write(
          `${JSON.stringify({ type: "error", error: "The designer is unavailable. Your prompt was not sent." })}\n`,
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
        const result = await sendStudioMessage(
          id.data,
          request.user!.id,
          message.data.content,
          generate,
        );
        if (!result) {
          response.status(404).json({ error: "Project not found" });
          return;
        }
        response.json(result);
      } catch (error) {
        console.error("Studio designer failed:", error);
        response.status(503).json({
          error: "The designer is unavailable. Your prompt was not sent.",
        });
      }
    },
  );

  return router;
}

export const studioRouter = createStudioRouter();
