"use client";

import { useEffect, useMemo, useState } from "react";
import { getStudioGenerationCost } from "@/lib/api/studio";
import { projectImageUrl } from "@/lib/api/studio-canvas";
import {
  STUDIO_SELECTION_EVENT,
  STUDIO_COST_EVENT,
  type StudioImageSelection,
} from "@/lib/studio-brief";
import {
  defaultCampaignOutput,
  type CampaignOutput,
} from "@/lib/studio-outputs";
import type { StudioBriefReference } from "./StudioBriefMaterials";

export function useStudioBrief(projectId: string) {
  const [productId, setProductId] = useState<string>();
  const [references, setReferences] = useState<StudioBriefReference[]>([]);
  const [edit, setEdit] = useState<StudioImageSelection | null>(null);
  const [selectedOutputs, setOutputs] = useState<CampaignOutput[]>([
    defaultCampaignOutput,
  ]);
  const [quote, setQuote] = useState<{
    key: string;
    maxCredits: number;
  } | null>(null);
  const [costError, setCostError] = useState<string | null>(null);
  const [quoteRevision, setQuoteRevision] = useState(0);
  const outputs = useMemo<CampaignOutput[]>(
    () =>
      edit
        ? [
            {
              platform: "general",
              formatId: "custom",
              width: edit.width,
              height: edit.height,
            },
          ]
        : selectedOutputs,
    [edit, selectedOutputs],
  );
  const outputKey = JSON.stringify(outputs);
  useEffect(() => {
    const select = (raw: Event) => {
      const detail = (
        raw as CustomEvent<{
          projectId: string;
          selection: StudioImageSelection | null;
        }>
      ).detail;
      if (detail?.projectId !== projectId) return;
      const selection = detail.selection;
      setEdit(selection?.kind === "campaign" ? selection : null);
      if (selection?.kind === "upload")
        setReferences((current) =>
          current.some(({ id }) => id === selection.assetId) ||
          current.length >= 5
            ? current
            : [
                ...current,
                {
                  id: selection.assetId,
                  name: selection.name,
                  url: projectImageUrl(projectId, selection.assetId),
                  role: "product",
                },
              ],
        );
    };
    window.addEventListener(STUDIO_SELECTION_EVENT, select);
    return () => window.removeEventListener(STUDIO_SELECTION_EVENT, select);
  }, [projectId]);
  useEffect(() => {
    const refresh = (raw: Event) => {
      if (
        (raw as CustomEvent<{ projectId: string }>).detail?.projectId !==
        projectId
      )
        return;
      setQuote(null);
      setQuoteRevision((value) => value + 1);
    };
    window.addEventListener(STUDIO_COST_EVENT, refresh);
    return () => window.removeEventListener(STUDIO_COST_EVENT, refresh);
  }, [projectId]);
  useEffect(() => {
    let cancelled = false;
    setCostError(null);
    getStudioGenerationCost(projectId, JSON.parse(outputKey))
      .then(({ maxCredits }) => {
        if (!cancelled) setQuote({ key: outputKey, maxCredits });
      })
      .catch((error: unknown) => {
        if (!cancelled)
          setCostError(
            error instanceof Error
              ? error.message
              : "Generation cost is unavailable",
          );
      });
    return () => {
      cancelled = true;
    };
  }, [projectId, outputKey, quoteRevision]);
  return {
    productId,
    setProductId,
    references,
    setReferences,
    edit,
    clearEdit: () => setEdit(null),
    outputs,
    setOutputs,
    maxCredits: quote?.key === outputKey ? quote.maxCredits : null,
    costError,
    retryCost: () => setQuoteRevision((value) => value + 1),
  };
}
