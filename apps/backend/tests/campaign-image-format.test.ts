import assert from "node:assert/strict";
import test from "node:test";
import { creativeImageSize, imageOutputBound } from "../src/usage/image-format";
import { campaignFormats } from "../src/studio/campaign/campaign.output";

test("GPT Image 2 generates every preset with matching proportions within the verified pixel/token bounds", () => {
  for (const output of [
    ...Object.values(campaignFormats),
    { width: 64, height: 64 },
    { width: 4096, height: 2048 },
    { width: 1500, height: 500 },
  ]) {
    const size = creativeImageSize(output.width, output.height, "gpt-image-2");
    const [width, height] = size.split("x").map(Number) as [number, number];
    assert.equal(width % 16, 0);
    assert.equal(height % 16, 0);
    assert.ok(width * height >= 655360 && width * height <= 1048576);
    assert.ok(
      Math.abs(width / height / (output.width / output.height) - 1) < 0.03,
    );
    assert.equal(imageOutputBound("gpt-image-2", size, 7024), 7024);
  }
  for (const size of ["auto", "2048x2048", "1024x512", "1025x1024", "512x2048"])
    assert.throws(() => imageOutputBound("gpt-image-2", size, 7024));
  assert.throws(
    () => creativeImageSize(64, 4096, "gpt-image-2"),
    /aspect ratios/,
  );
});

test("legacy image models retain their supported native sizes and non-square output budget", () => {
  assert.equal(creativeImageSize(1000, 1500, "gpt-image-1.5"), "1024x1536");
  assert.equal(imageOutputBound("gpt-image-1.5", "1024x1536", 4160), 6240);
  assert.throws(() => imageOutputBound("gpt-image-1.5", "1024x1280", 4160));
});
