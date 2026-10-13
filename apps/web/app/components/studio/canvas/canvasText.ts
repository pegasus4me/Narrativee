import type { Textbox } from "fabric";

export function fitCampaignText(
  object: Textbox,
  bounds: { width: number; height: number },
) {
  const fits = () =>
    object.height <= bounds.height && object.width <= bounds.width;
  if (fits()) return;

  const requestedSize = object.fontSize;
  // Preserve readable heading/body sizes rather than hiding overflow in tiny text.
  let smallest = Math.min(requestedSize, requestedSize >= 32 ? 24 : 12);
  let largest = Math.floor(requestedSize);
  const measure = (fontSize: number) => {
    // Fabric can expand the box to fit an unbroken word; reset width each time.
    object.set({ fontSize, width: bounds.width });
    return fits();
  };
  if (!measure(smallest))
    throw new Error(
      "The designer could not fit the text at a readable size. Generate this creative again; your brief does not need changing.",
    );

  let fittedSize = smallest;
  while (smallest <= largest) {
    const size = Math.floor((smallest + largest) / 2);
    if (measure(size)) {
      fittedSize = size;
      smallest = size + 1;
    } else {
      largest = size - 1;
    }
  }
  measure(fittedSize);
}
