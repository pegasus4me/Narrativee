export const STUDIO_SELECTION_EVENT = "narrativee:studio-selection";
export const STUDIO_SAVE_EVENT = "narrativee:studio-save";
export const STUDIO_COST_EVENT = "narrativee:studio-cost-changed";

export interface StudioImageSelection {
  assetId: string;
  name: string;
  kind: "upload" | "campaign";
  width: number;
  height: number;
  version: number;
}

export async function flushStudioCanvas(projectId: string) {
  return new Promise<void>((resolve, reject) => {
    let handled = false;
    window.dispatchEvent(
      new CustomEvent(STUDIO_SAVE_EVENT, {
        detail: {
          projectId,
          respondWith: (saving: Promise<void>) => {
            handled = true;
            saving.then(resolve, reject);
          },
        },
      }),
    );
    if (!handled)
      reject(new Error("Open the canvas before generating a creative"));
  });
}
