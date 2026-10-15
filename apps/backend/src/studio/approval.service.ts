import { billable } from "../usage/operations";
import { and, eq } from "drizzle-orm";
import { db } from "../auth/auth";
import { studioMessage } from "../auth/schema/schema";
import { withCreatorProject, type CreatorEvent } from "./creator.service";
import { runCampaignRequest } from "./campaign/campaign.service";
import {
  findStudioProject,
  presentStudioMessage,
  saveStudioExchange,
} from "./studio.service";
import { ApprovalError, StaleVisualApprovalError } from "./visual-approval";

async function decideVisualApprovalInternal(
  projectId: string,
  userId: string,
  messageId: string,
  action: "approve" | "reject" | "refresh",
  feedback: string,
  emit: (event: CreatorEvent) => void,
) {
  return withCreatorProject(projectId, async () => {
    const project = await findStudioProject(projectId, userId);
    if (!project) throw new ApprovalError(404, "Proposal not found");
    // Claim exactly once in a short transaction; providers run after commit.
    const proposal = await db.transaction(async (transaction) => {
      const [message] = await transaction
        .select()
        .from(studioMessage)
        .where(
          and(
            eq(studioMessage.id, messageId),
            eq(studioMessage.projectId, projectId),
          ),
        )
        .for("update");
      if (!message?.approvalData)
        throw new ApprovalError(404, "Proposal not found");
      if (
        message.approvalStatus !== "pending" &&
        !(action === "refresh" && message.approvalStatus === "failed")
      )
        throw new ApprovalError(
          409,
          "This proposal has already been decided. Request a fresh proposal to change it.",
        );
      await transaction
        .update(studioMessage)
        .set({
          approvalStatus: action === "approve" ? "executing" : "rejected",
          approvedBy: action === "approve" ? userId : null,
          approvedAt: action === "approve" ? new Date() : null,
        })
        .where(eq(studioMessage.id, messageId));
      return message;
    });
    const prepared = proposal.approvalData!;
    const finish = async (status: "completed" | "failed" | "rejected") => {
      const [updated] = await db
        .update(studioMessage)
        .set({ approvalStatus: status })
        .where(eq(studioMessage.id, messageId))
        .returning();
      return presentStudioMessage(updated!);
    };
    try {
      if (action === "reject" && !feedback) {
        const result = await saveStudioExchange(
          projectId,
          "Declined this proposed direction.",
          "This direction was declined. No visual was created. You can brief the team again when ready.",
          "brand",
          proposal.thread,
        );
        return { ...result, approvalMessage: await finish("rejected") };
      }
      const request =
        action === "reject"
          ? `${prepared.brief}\n\nRequested changes before creating:\n${feedback}`
          : prepared.brief;
      const run = async (execute: boolean) => {
        if (execute && prepared.kind === "logo_exploration")
          throw new StaleVisualApprovalError(
            "This vector proposal must be replaced with an image direction before creation.",
          );
        return runCampaignRequest(
          projectId,
          project.brandId,
          userId,
          request,
          emit,
          proposal.thread,
          execute && prepared.kind === "campaign_creation"
            ? prepared
            : undefined,
          prepared.kind === "campaign_creation" ? prepared.outputs : undefined,
          prepared.kind === "campaign_creation"
            ? prepared.generation
            : undefined,
        );
      };
      let needsReview = action === "refresh";
      let answer: Awaited<ReturnType<typeof run>>;
      try {
        answer = await run(action === "approve");
      } catch (error) {
        if (
          !(error instanceof StaleVisualApprovalError) ||
          action !== "approve"
        )
          throw error;
        needsReview = true;
        emit({
          type: "stage",
          text: "The proposal is out of date. Preparing an updated direction for your approval",
        });
        answer = await run(false);
      }
      if (needsReview && answer.approval)
        answer.content = `This proposal replaces the earlier direction using the current brand context and canvas. Review and approve this new card before creation.\n\n${answer.content}`;
      const result = await saveStudioExchange(
        projectId,
        needsReview
          ? "Requested an updated proposal for review."
          : action === "approve"
            ? "Approved this proposed direction. Create it."
            : `Request changes: ${feedback}`,
        answer.content,
        answer.agent,
        "team",
        answer.contributions ?? [],
        answer.approval,
      );
      return {
        ...result,
        approvalMessage: await finish(
          action === "approve" && !needsReview && !answer.needsRevision
            ? "completed"
            : "rejected",
        ),
      };
    } catch (error) {
      await finish(action === "reject" ? "rejected" : "failed");
      throw error;
    }
  });
}

export async function decideVisualApproval(
  projectId: string,
  userId: string,
  messageId: string,
  action: "approve" | "reject" | "refresh",
  feedback: string,
  emit: (event: CreatorEvent) => void,
) {
  if (action === "reject" && !feedback)
    return decideVisualApprovalInternal(
      projectId,
      userId,
      messageId,
      action,
      feedback,
      emit,
    );
  return billable(userId, "approval", () =>
    decideVisualApprovalInternal(
      projectId,
      userId,
      messageId,
      action,
      feedback,
      emit,
    ),
  );
}
