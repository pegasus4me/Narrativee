import { randomUUID } from "node:crypto";
import sharp from "sharp";
import {
  discardProjectImages,
  storeProjectImage,
  readCanvas,
  readProjectImage,
} from "../canvas/canvas.service";
import type { CreatorEvent } from "../creator.service";
import { readAgentSettings } from "../agent-settings.service";
import { assertImageModelConnected } from "../media-models";
import { rateFor } from "../../usage/model-rates";
import { loadCampaignContext, type CampaignContext } from "./campaign.context";
import {
  createCampaignPlan,
  generateCampaignImage,
  researchCreativeBrief,
  validateCampaignReferences,
} from "./campaign.generator";
import { reviewAndRefineCampaignImage } from "./campaign.quality";
import { assessCampaignPlan } from "./campaign.judgment";
import { readCampaignEdit, selectCampaignReferences } from "./campaign.brief";
import type { CampaignGeneration } from "./campaign.types";
import {
  campaignDocumentSchema,
  campaignPlanSchema,
  validateCampaign,
  type CampaignPlan,
  type CampaignDocument,
} from "./campaign.schema";
import {
  defaultCampaignOutput,
  campaignOutputLabel,
  type CampaignOutput,
} from "./campaign.output";
import {
  agentActivity,
  createTeamDiscussion,
  type CreativeAgentSelection,
  type StudioAgentAnswer,
} from "../agent-team";

import {
  approvalContextHash,
  approvalCanvasHash,
  isApprovalCanvasCurrent,
  StaleVisualApprovalError,
  type VisualApproval,
} from "../visual-approval";

export class CampaignError extends Error {
  constructor(
    message: string,
    public readonly cause?: unknown,
  ) {
    super(message);
  }
}

const campaignDependencies = {
  loadCampaignContext,
  readCanvas,
  readProjectImage,
  researchCreativeBrief,
  createCampaignPlan,
  assessCampaignPlan,
  generateCampaignImage,
  reviewAndRefineCampaignImage,
  readAgentSettings,
  storeProjectImage,
  discardProjectImages,
};

export async function runCampaignRequest(
  projectId: string,
  brandId: string,
  userId: string,
  request: string,
  emit: (event: CreatorEvent) => void,
  thread: CreativeAgentSelection = "team",
  approved?: Extract<VisualApproval, { kind: "campaign_creation" }>,
  requestedOutputs: CampaignOutput[] = [defaultCampaignOutput],
  generation?: CampaignGeneration,
  dependencies = campaignDependencies,
): Promise<StudioAgentAnswer> {
  const {
    loadCampaignContext,
    readCanvas,
    readProjectImage,
    researchCreativeBrief,
    createCampaignPlan,
    assessCampaignPlan,
    generateCampaignImage,
    reviewAndRefineCampaignImage,
    readAgentSettings,
    storeProjectImage,
    discardProjectImages,
  } = dependencies;
  const started = Date.now();
  const createdAssets: string[] = [];
  let delivered = false;
  let imageCalls = 0;
  const qualityResults: Array<{ name: string; status: string }> = [];
  let succeeded = false;
  const discussion = createTeamDiscussion(emit);
  const describePlan = (plan: CampaignPlan) =>
    plan.creatives
      ?.map(
        (creative) =>
          `**${creative.name}**\n${creative.concept}\n\n**Copy:** ${creative.copy.join(" / ")}`,
      )
      .join("\n\n");
  const feedback = (issues: string[]) =>
    issues
      .map((issue) =>
        issue
          .replace(/^(?:brandFit|grounding|specificity):\s*/, "")
          .replace(" Evidence:", "\n\n**Based on:**")
          .replace(" Correction:", "\n\n**Suggested change:**"),
      )
      .join("\n\n");
  try {
    emit({ type: "stage", text: "Reading brand rules and visual references" });
    let outputs = approved?.outputs ?? requestedOutputs;
    let context: CampaignContext = {
      ...(await loadCampaignContext(projectId, userId, thread, generation)),
      outputs,
      ...(generation ? { userBrief: request } : {}),
    };
    if (generation) {
      try {
        context = selectCampaignReferences(context, generation);
      } catch (error) {
        throw new CampaignError(
          error instanceof Error
            ? error.message
            : "Invalid creative references",
        );
      }
    }
    const {
      briefHistory: _history,
      teamConversation: _team,
      outputs: _outputs,
      ...reviewContext
    } = context;
    const contextHash = approvalContextHash(reviewContext);
    const canvas = await readCanvas(projectId, userId);
    const canvasRevision = canvas.revision;
    const edit = generation?.editAssetId
      ? readCampaignEdit(canvas.snapshot, generation.editAssetId)
      : undefined;
    let editImage: Buffer | undefined;
    if (edit && generation?.editAssetId) {
      if (outputs.length !== 1)
        throw new CampaignError("Retouch one selected creative at a time");
      outputs = [
        {
          ...outputs[0]!,
          formatId: "custom",
          width: edit.exportWidth,
          height: edit.exportHeight,
        },
      ];
      context.outputs = outputs;
      editImage = Buffer.from(
        (await readProjectImage(projectId, userId, generation.editAssetId))
          .bytes,
      );
    }
    const editThumbnail = editImage
      ? await sharp(editImage)
          .resize({
            width: 768,
            height: 768,
            fit: "inside",
            withoutEnlargement: true,
          })
          .png()
          .toBuffer()
      : undefined;
    if (
      approved &&
      (!("renderMode" in approved.plan) ||
        approved.contextHash !== contextHash ||
        !isApprovalCanvasCurrent(approved, canvas))
    )
      throw new StaleVisualApprovalError(
        "The brand rules, references or canvas changed. Request a fresh proposal before approving.",
      );
    if (!approved && !generation)
      emit(
        agentActivity(
          "research",
          "working",
          "Finding a creative angle in your brand and competitor evidence",
        ),
      );
    const research =
      approved || generation
        ? undefined
        : await researchCreativeBrief(context, request);
    if (research) {
      emit(agentActivity("research", "complete", research.summary));
      discussion.say(
        "research",
        `${research.summary}\n\n**Creative angle:** ${research.creativeAngle}${research.limitations.length ? `\n\n**Limits of the evidence:** ${research.limitations.join(" ")}` : ""}`,
      );
    }
    if (context.typographyNotice)
      emit({ type: "stage", text: context.typographyNotice });
    const check = (plan: CampaignPlan) => {
      campaignPlanSchema.parse(plan);
      if (plan.clarifyingQuestion) return;
      if (!plan.creatives || plan.creatives.length !== outputs.length)
        throw new Error(
          "Prepare exactly one complete image brief per selected output",
        );
      for (const creative of plan.creatives) {
        validateCampaignReferences(creative, context);
        if (
          generation?.productId &&
          !creative.references?.some(
            (use) =>
              use.role === "product" &&
              context.references.some(
                (reference) =>
                  reference.id === use.id &&
                  reference.productId === generation.productId,
              ),
          )
        ) {
          throw new Error(
            "Use a selected photo of the chosen product in every creative",
          );
        }
        if (
          creative.referenceIds.some(
            (id) =>
              !context.references.some((reference) => reference.id === id),
          )
        )
          throw new Error(
            "The image brief references unavailable brand material",
          );
      }
    };
    emit({ type: "stage", text: "Developing the campaign composition" });
    emit(
      agentActivity(
        "creator",
        "working",
        "Preparing the scene from your brief",
      ),
    );
    let plan = approved
      ? campaignPlanSchema.parse(structuredClone(approved.plan))
      : await createCampaignPlan(
          context,
          request,
          [],
          research,
          undefined,
          editThumbnail
            ? `data:image/png;base64,${editThumbnail.toString("base64")}`
            : undefined,
        );
    if (approved) check(plan);
    for (let attempt = 0; !approved && attempt < 2; attempt++) {
      if (plan.clarifyingQuestion) {
        emit({ type: "reply_agent", agent: "creator" });
        emit(
          agentActivity(
            "creator",
            "complete",
            "Waiting for your answer before creating",
          ),
        );
        emit({ type: "delta", text: plan.clarifyingQuestion });
        succeeded = true;
        return {
          agent: "creator",
          content: plan.clarifyingQuestion,
          contributions: discussion.contributions,
        };
      }
      let issues: string[];
      let reviewConcern = false;
      if (describePlan(plan))
        discussion.say(
          "creator",
          `Sage, here's ${attempt ? "the revised" : "the proposed"} composition for review.\n\n${describePlan(plan)}`,
        );
      emit(
        agentActivity("creator", "complete", "Composition ready for review"),
      );
      emit(
        agentActivity(
          "brand",
          "working",
          "Checking approved brand rules, claims, and creative specificity",
        ),
      );
      try {
        check(plan);
        issues = [];
      } catch (error) {
        issues = [
          error instanceof Error ? error.message : "Invalid campaign plan",
        ];
      }
      // Provider failures are not a reason to pay for another planning call.
      if (!issues.length) {
        issues = await assessCampaignPlan(context, request, plan);
        reviewConcern = issues.length > 0;
      }
      if (!issues.length) {
        emit(
          agentActivity(
            "brand",
            "complete",
            "Plan passed the brand and grounding review",
          ),
        );
        discussion.say(
          "brand",
          generation
            ? "The image brief follows your scene and selected references. Pixel, create it."
            : "Pixel, the plan passes the supplied brand rules, grounding and specificity checks. It's ready for the team to review and approve.",
        );
        break;
      }
      if (attempt === 1 && reviewConcern) {
        const content = `This direction still needs a correction before we create it.\n\n${feedback(issues)}\n\nThe canvas hasn't changed. You can discuss the suggested changes with us here before we prepare a new proposal.`;
        emit({ type: "reply_agent", agent: "brand" });
        emit({ type: "delta", text: content });
        emit(
          agentActivity(
            "brand",
            "complete",
            "Waiting for your feedback in Creative Team",
          ),
        );
        succeeded = true;
        return {
          agent: "brand",
          content,
          contributions: discussion.contributions,
          needsRevision: true,
        };
      }
      if (attempt === 1)
        throw new CampaignError(
          `The creative still needs a correction before it can be created: ${issues.join("; ")}. Your saved canvas was kept.`,
        );
      emit({ type: "stage", text: "Refining brand fit and composition" });
      discussion.say(
        "brand",
        `Pixel, please refine this direction.\n\n${feedback(issues)}`,
      );
      emit(
        agentActivity(
          "brand",
          "complete",
          `Requested refinement: ${issues.join(", ")}`,
        ),
      );
      emit(
        agentActivity(
          "creator",
          "working",
          "Refining the design from Brand's feedback",
        ),
      );
      plan = await createCampaignPlan(
        context,
        request,
        issues,
        research,
        plan,
        editThumbnail
          ? `data:image/png;base64,${editThumbnail.toString("base64")}`
          : undefined,
      );
    }
    if (!approved && !generation) {
      const directions = plan
        .creatives!.map(
          (creative, index) =>
            `### Proposed direction: ${creative.name}\n${creative.concept}\n\n- **Output:** ${campaignOutputLabel(outputs[index]!)}.\n- **Copy:** ${creative.copy.length ? creative.copy.join(" / ") : "No text"}.\n- **Art direction:** ${creative.imagePrompt}${creative.references?.length ? `\n- **References used:** ${creative.references.map((use) => `${context.references.find(({ id }) => id === use.id)?.caption} (${use.role}): ${use.instruction}`).join("; ")}.` : ""}${creative.unusedReferences?.length ? `\n- **References left out:** ${creative.unusedReferences.map((use) => `${context.references.find(({ id }) => id === use.id)?.caption}: ${use.reason}`).join("; ")}.` : ""}`,
        )
        .join("\n\n");
      const content = `${directions}\n\nApprove to generate ${outputs.length} complete ${outputs.length === 1 ? "creative image" : "creative images"}. Sage will inspect each finished image. A major defect can trigger one targeted image correction; reviews and corrections use credits. Each output will be one PNG on the canvas; text and graphics are part of the image. Nothing has been added to the canvas.`;
      emit({ type: "reply_agent", agent: "creator" });
      emit({ type: "delta", text: content });
      emit(
        agentActivity(
          "creator",
          "complete",
          "Waiting for your approval before image generation",
        ),
      );
      succeeded = true;
      return {
        agent: "creator",
        content,
        approval: {
          kind: "campaign_creation",
          brief: request,
          plan,
          contextHash,
          canvasRevision,
          canvasHash: approvalCanvasHash(canvas.snapshot),
          outputs,
        },
        contributions: discussion.contributions,
      };
    }

    const creatorSettings = await readAgentSettings(brandId, "creator");
    const imageModel =
      creatorSettings.imageModel ??
      process.env.BRAND_BOARD_IMAGE_MODEL ??
      "gpt-image-2";
    assertImageModelConnected(imageModel);
    rateFor(imageModel, "image");
    emit(
      agentActivity("creator", "working", "Generating your creative images"),
    );
    const document: CampaignDocument = { version: 1, frames: [] };
    for (const [index, creative] of plan.creatives!.entries()) {
      const output = outputs[index]!;
      emit({
        type: "stage",
        text: `Generating creative ${index + 1} of ${outputs.length}: ${creative.name}`,
      });
      imageCalls++;
      const generated = await generateCampaignImage(
        creative,
        context,
        output,
        imageModel,
        editImage ? { image: editImage, feedback: request } : undefined,
      );
      emit({
        type: "stage",
        text: `Sage is inspecting the finished image: ${creative.name}`,
      });
      emit(
        agentActivity(
          "brand",
          "working",
          "Checking product fidelity, copy and visual hierarchy in the finished image",
        ),
      );
      const reviewed = await reviewAndRefineCampaignImage(
        creative,
        context,
        output,
        generated,
        imageModel,
        discussion.say,
        undefined,
        editImage,
      );
      imageCalls += reviewed.corrections;
      qualityResults.push({ name: creative.name, status: reviewed.status });
      emit(
        agentActivity(
          "brand",
          "complete",
          reviewed.status === "passed"
            ? "Finished-image review passed"
            : "Finished-image review notes are in Creative Team",
        ),
      );
      // Native model sizes use 16-pixel increments; deliver exactly the selected size.
      const bytes = await sharp(reviewed.image)
        .resize(output.width, output.height, { fit: "fill" })
        .png()
        .toBuffer();
      const saved = await storeProjectImage(projectId, userId, bytes);
      createdAssets.push(saved.id);
      document.frames.push({
        id: randomUUID(),
        formatId: output.formatId,
        width: output.width,
        height: output.height,
        name: `${campaignOutputLabel(output)} · ${creative.name}${edit ? ` · v${edit.version + 1}` : ""}`.slice(
          0,
          80,
        ),
        concept: creative.concept,
        background: "#FFFFFF",
        version: edit ? edit.version + 1 : 1,
        ...(generation?.editAssetId
          ? { revisionOf: generation.editAssetId }
          : {}),
        layers: [
          {
            id: "creative-image",
            type: "image",
            assetId: saved.id,
            fit: "contain",
            x: 0,
            y: 0,
            width: output.width,
            height: output.height,
          },
        ],
      });
    }
    campaignDocumentSchema.parse(document);
    validateCampaign(document, new Set(createdAssets), []);
    emit({
      type: "stage",
      text: "Adding your finished creative images to the canvas",
    });
    // Append to the current canvas; don't discard results because existing work moved.
    emit({ type: "campaign_scene", document });
    delivered = true;
    const reviewNotes = qualityResults.some(({ status }) => status !== "passed")
      ? "\n\nSage left review notes in this conversation. Check those notes before publishing; any unresolved or unreviewed output is a draft."
      : "\n\nSage inspected the finished images and reported no unresolved defects.";
    const answer = generation
      ? `Created ${document.frames.length === 1 ? "your image" : `${document.frames.length} images`}.${edit ? " The original remains on the canvas; this is a new version." : ""}${reviewNotes}\n\nSelect an image to request changes or export it.`
      : `I created ${document.frames.length} complete ${document.frames.length === 1 ? "creative image" : "creative images"} for ${context.brandName}.\n\n${document.frames.map((frame) => `- ${frame.name}`).join("\n")}\n\n### Design approach\n${plan.creatives!.map((creative) => `**${creative.name}**\n${creative.concept}`).join("\n\n")}${reviewNotes}\n\nEach creative is a single PNG with its copy and layout rendered into the image. Select it to move, resize, or export it. Text and graphics are not separately editable yet.`;
    emit({ type: "reply_agent", agent: "creator" });
    emit(
      agentActivity(
        "creator",
        "complete",
        "Creative images delivered to your canvas",
      ),
    );
    succeeded = true;
    return {
      agent: "creator",
      content: answer,
      contributions: discussion.contributions,
    };
  } catch (error) {
    if (!delivered) await discardProjectImages(projectId, createdAssets);
    if (error instanceof StaleVisualApprovalError) throw error;
    if (error instanceof CampaignError) throw error;
    throw new CampaignError(
      error instanceof Error ? error.message : "Campaign generation failed",
      error,
    );
  } finally {
    console.info("Studio campaign", {
      projectId,
      durationMs: Date.now() - started,
      imageCalls,
      qualityResults,
      succeeded,
    });
  }
}
