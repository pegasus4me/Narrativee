import { Router } from "express";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "../auth/auth";
import { onboardingProfile } from "../auth/schema/schema";
import { verifyAuth, type AuthRequest } from "../middleware/auth";

const profileInput = z
  .object({
    workspaceType: z.enum(["small_business", "agency"]),
    workspaceName: z.string().trim().min(1).max(120),
    agencySize: z.enum(["1-5", "6-10", "11-25", "26+"]).nullable(),
    complete: z.boolean().default(false),
  })
  .refine(
    (profile) =>
      (profile.workspaceType === "agency" && profile.agencySize !== null) ||
      (profile.workspaceType === "small_business" &&
        profile.agencySize === null),
    { message: "Select an agency size or clear it for a small business." },
  );

export const onboardingRouter = Router();
onboardingRouter.use(verifyAuth);

onboardingRouter.get("/profile", async (request: AuthRequest, response) => {
  const [profile] = await db
    .select()
    .from(onboardingProfile)
    .where(eq(onboardingProfile.userId, request.user!.id))
    .limit(1);
  response.setHeader("Cache-Control", "no-store");
  response.json({ profile: profile ?? null });
});

onboardingRouter.put("/profile", async (request: AuthRequest, response) => {
  const parsed = profileInput.safeParse(request.body);
  if (!parsed.success) {
    response.status(400).json({ error: "Enter valid onboarding details." });
    return;
  }

  const input = parsed.data;
  const [profile] = await db
    .insert(onboardingProfile)
    .values({
      userId: request.user!.id,
      workspaceType: input.workspaceType,
      workspaceName: input.workspaceName,
      agencySize: input.agencySize,
      completedAt: input.complete ? new Date() : null,
    })
    .onConflictDoUpdate({
      target: onboardingProfile.userId,
      set: {
        workspaceType: input.workspaceType,
        workspaceName: input.workspaceName,
        agencySize: input.agencySize,
        ...(input.complete ? { completedAt: new Date() } : {}),
        updatedAt: new Date(),
      },
    })
    .returning();

  response.setHeader("Cache-Control", "no-store");
  response.json({ profile });
});
