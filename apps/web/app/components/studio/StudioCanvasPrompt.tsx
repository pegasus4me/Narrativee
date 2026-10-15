"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { PromptInput } from "@/components/agents/prompt-input";
import { projectImageUrl } from "@/lib/api/studio-canvas";
import type { CampaignGeneration } from "@/lib/api/studio";
import {
  campaignOutputSelectionError,
  type CampaignOutput,
} from "@/lib/studio-outputs";
import { StudioWorkingBorder } from "./StudioWorkingBorder";
import StudioOutputSelect from "./StudioOutputSelect";
import StudioBriefMaterials from "./StudioBriefMaterials";
import { useStudioBrief } from "./useStudioBrief";

export function StudioCanvasPrompt({
  projectId,
  brandId,
  draft,
  onDraftChange,
  onSubmit,
  disabled,
  pending,
  error,
  onUploadChange,
}: {
  projectId: string;
  brandId: string;
  draft: string;
  onDraftChange: (value: string) => void;
  onSubmit: (
    content: string,
    outputs: CampaignOutput[],
    generation: CampaignGeneration,
  ) => Promise<void>;
  disabled: boolean;
  pending: boolean;
  error: string | null;
  onUploadChange: (busy: boolean) => void;
}) {
  const brief = useStudioBrief(projectId);
  const [materialsTarget, setMaterialsTarget] = useState<HTMLElement | null>(
    null,
  );
  useEffect(() => {
    setMaterialsTarget(
      document.getElementById(`studio-materials-${projectId}`),
    );
  }, [projectId]);
  const outputError = campaignOutputSelectionError(brief.outputs);
  const missingProductPhoto =
    Boolean(brief.productId) &&
    !brief.references.some(({ role }) => role === "product");
  const submitDisabled =
    pending ||
    Boolean(outputError) ||
    missingProductPhoto ||
    brief.maxCredits === null ||
    Boolean(brief.costError);
  return (
    <>
      {materialsTarget &&
        createPortal(
          <StudioBriefMaterials
            brandId={brandId}
            projectId={projectId}
            productId={brief.productId}
            references={brief.references}
            onProductChange={brief.setProductId}
            onReferencesChange={brief.setReferences}
            disabled={disabled || pending}
            onBusyChange={onUploadChange}
          >
            {brief.edit ? (
              <span className="px-3 text-xs text-muted-foreground">
                Original format preserved
              </span>
            ) : (
              <StudioOutputSelect
                outputs={brief.outputs}
                onChange={brief.setOutputs}
                disabled={disabled || pending}
              />
            )}
          </StudioBriefMaterials>,
          materialsTarget,
        )}
      <div className="pointer-events-auto relative mx-auto w-full max-w-2xl rounded-2xl border border-border bg-white p-3">
        {error && (
          <p role="alert" className="mb-2 text-sm text-destructive">
            {error} Your brief is still here.
          </p>
        )}
        {outputError && (
          <p role="alert" className="mb-2 text-xs text-destructive">
            {outputError}
          </p>
        )}
        {missingProductPhoto && (
          <p className="mt-2 text-xs text-muted-foreground">
            Attach a photo of this product before generating.
          </p>
        )}
        {brief.edit && (
          <div className="mt-2 flex items-center gap-2 rounded-lg bg-muted p-2">
            <img
              src={projectImageUrl(projectId, brief.edit.assetId)}
              alt="Selected creative"
              className="size-9 rounded object-cover"
            />
            <span className="min-w-0 flex-1 truncate text-xs">
              Retouching: {brief.edit.name} · v{brief.edit.version}
            </span>
            <button
              type="button"
              disabled={disabled || pending}
              onClick={brief.clearEdit}
              aria-label="Create a new image instead of retouching"
              className="rounded p-1 hover:bg-background"
            >
              <X size={14} />
            </button>
          </div>
        )}
        <PromptInput
          value={draft}
          onValueChange={onDraftChange}
          onSubmit={(content) =>
            submitDisabled
              ? undefined
              : onSubmit(content, brief.outputs, {
                  productId: brief.productId,
                  referenceIds: brief.references.map(({ id }) => id),
                  styleReferenceIds: brief.references
                    .filter(({ role }) => role === "style")
                    .map(({ id }) => id),
                  editAssetId: brief.edit?.assetId,
                })
          }
          disabled={disabled}
          submitDisabled={submitDisabled}
          submitLabel={brief.edit ? "Apply changes" : "Generate"}
          minRows={2}
          maxRows={5}
          placeholder={
            brief.edit
              ? "Describe what to change. Everything else stays the same…"
              : "Describe the image you want to create…"
          }
          aria-label="Creative brief"
          className="border-0 bg-transparent shadow-none"
        />
        {(brief.costError || brief.maxCredits === null) && (
          <p
            role="status"
            className="mt-2 px-2 text-[11px] leading-4 text-muted-foreground"
          >
            {brief.costError ? (
              <>
                {brief.costError}{" "}
                <button
                  type="button"
                  disabled={pending}
                  onClick={brief.retryCost}
                  className="underline"
                >
                  Retry
                </button>
              </>
            ) : (
              "Checking generation cost…"
            )}
          </p>
        )}
        <StudioWorkingBorder active={pending} />
      </div>
    </>
  );
}
