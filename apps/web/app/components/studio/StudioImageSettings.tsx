"use client";

import { useEffect, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import {
  getStudioAgentSettings,
  saveStudioAgentSettings,
  type StudioAgentSettingsPanel,
} from "@/lib/api/studio";
import { STUDIO_COST_EVENT } from "@/lib/studio-brief";
import StudioModelSelect from "./StudioModelSelect";

export default function StudioImageSettings({
  projectId,
  onClose,
}: {
  projectId: string;
  onClose: () => void;
}) {
  const [panel, setPanel] = useState<StudioAgentSettingsPanel | null>(null);
  const [imageModel, setImageModel] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setError(null);
    getStudioAgentSettings(projectId, "creator", controller.signal)
      .then((result) => {
        if (!controller.signal.aborted) {
          setPanel(result);
          setImageModel(result.settings.imageModel);
        }
      })
      .catch((cause: unknown) => {
        if (!controller.signal.aborted)
          setError(
            cause instanceof Error
              ? cause.message
              : "Could not load image settings",
          );
      });
    return () => controller.abort();
  }, [projectId, revision]);
  async function save() {
    if (!panel || saving) return;
    setSaving(true);
    setError(null);
    try {
      await saveStudioAgentSettings(projectId, "creator", {
        ...panel.settings,
        imageModel,
      });
      window.dispatchEvent(
        new CustomEvent(STUDIO_COST_EVENT, { detail: { projectId } }),
      );
      onClose();
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Could not save image settings",
      );
    } finally {
      setSaving(false);
    }
  }
  return (
    <Dialog.Root
      open
      onOpenChange={(open) => {
        if (!open && !saving) onClose();
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[1100] bg-black/25" />
        <Dialog.Content className="studio-theme fixed left-1/2 top-1/2 z-[1101] w-[calc(100%-32px)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-border bg-background p-6 shadow-xl">
          <Dialog.Title className="text-lg font-medium">
            Image settings
          </Dialog.Title>
          <Dialog.Description className="mt-2 text-sm text-muted-foreground">
            Choose the image model for this brand. The generation cost updates
            before your next request.
          </Dialog.Description>
          <Dialog.Close asChild>
            <button
              type="button"
              disabled={saving}
              aria-label="Close image settings"
              className="absolute right-3 top-3 rounded p-1.5 hover:bg-muted"
            >
              <X size={16} />
            </button>
          </Dialog.Close>
          {error && (
            <p role="alert" className="mt-4 text-sm text-destructive">
              {error}{" "}
              <button
                type="button"
                onClick={() => setRevision((value) => value + 1)}
                className="underline"
              >
                Retry
              </button>
            </p>
          )}
          {panel ? (
            <form
              className="mt-6 space-y-5"
              onSubmit={(event) => {
                event.preventDefault();
                void save();
              }}
            >
              <StudioModelSelect
                label="Image model"
                value={imageModel}
                models={panel.imageModels}
                modelDetails={panel.mediaModelDetails}
                defaultModel={panel.defaultImageModel}
                disabled={saving}
                onChange={setImageModel}
              />
              <button
                type="submit"
                disabled={saving}
                className="rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground disabled:opacity-40"
              >
                {saving ? "Saving…" : "Save"}
              </button>
            </form>
          ) : (
            !error && (
              <p role="status" className="mt-6 text-sm text-muted-foreground">
                Loading image settings…
              </p>
            )
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
