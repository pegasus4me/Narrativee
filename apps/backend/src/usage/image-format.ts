// GPT Image 2 supports multiples of 16. Keep native generation around 1 MP;
// the final PNG is resized to the user's selected output dimensions.
export function creativeImageSize(
  width: number,
  height: number,
  model: string,
) {
  const ratio = width / height;
  if (!Number.isFinite(ratio) || ratio < 1 / 3 || ratio > 3)
    throw new Error("Image outputs support aspect ratios between 1:3 and 3:1");
  if (!/^gpt-image-2(?:$|-)/.test(model))
    return ratio === 1 ? "1024x1024" : ratio > 1 ? "1536x1024" : "1024x1536";
  const scale = Math.sqrt(1_048_576 / (width * height));
  let nativeWidth = Math.floor((width * scale) / 16) * 16;
  let nativeHeight = Math.floor((height * scale) / 16) * 16;
  if (nativeWidth > nativeHeight * 3) nativeWidth = nativeHeight * 3;
  if (nativeHeight > nativeWidth * 3) nativeHeight = nativeWidth * 3;
  return `${nativeWidth}x${nativeHeight}`;
}

export function imageOutputBound(
  model: string,
  size: string,
  squareBound: number,
) {
  const match = /^(\d+)x(\d+)$/.exec(size);
  if (!match) throw new Error("An explicit image size is required");
  const width = Number(match[1]),
    height = Number(match[2]);
  if (/^gpt-image-2(?:$|-)/.test(model)) {
    if (
      width % 16 ||
      height % 16 ||
      width * height < 655_360 ||
      width * height > 1_048_576 ||
      Math.max(width, height) / Math.min(width, height) > 3
    )
      throw new Error("This image size is outside the verified billing bounds");
    // Under this pixel budget every aspect ratio costs at most a high-quality square.
    return squareBound;
  }
  if (!["1024x1024", "1024x1536", "1536x1024"].includes(size))
    throw new Error("This image size is unavailable for the selected model");
  return size === "1024x1024" ? squareBound : Math.ceil(squareBound * 1.5);
}
