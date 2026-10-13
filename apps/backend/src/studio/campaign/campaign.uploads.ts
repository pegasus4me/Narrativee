import sharp from "sharp";
import { readCanvas, readProjectImage } from "../canvas/canvas.service";
import { studioUploadIds } from "../canvas/canvas.context";

export async function readCampaignUploads(
  projectId: string,
  userId: string,
  selectedIds?: string[],
) {
  const { snapshot } = await readCanvas(projectId, userId);
  return Promise.all(
    studioUploadIds(snapshot, selectedIds).map(async (upload) => {
      const image = await readProjectImage(projectId, userId, upload.id);
      const thumbnail = await sharp(image.bytes)
        .resize({
          width: 768,
          height: 768,
          fit: "inside",
          withoutEnlargement: true,
        })
        .png()
        .toBuffer();
      const metadata = await sharp(image.bytes).metadata();
      return {
        id: upload.id,
        productId: undefined as string | undefined,
        kind: "project",
        category: "reference",
        caption: upload.name,
        source: "studio-upload",
        width: metadata.width!,
        height: metadata.height!,
        image: `data:image/png;base64,${thumbnail.toString("base64")}`,
      };
    }),
  );
}
