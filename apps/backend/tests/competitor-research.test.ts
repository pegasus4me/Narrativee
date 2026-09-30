import assert from "node:assert/strict";
import { test } from "node:test";
import {
  dedupeSearchResults,
  selectSupportedCandidates,
} from "../src/analysis/analysis.service";

test("search results retain one result per domain and ignore malformed URLs", () => {
  const results = dedupeSearchResults([
    { url: "https://www.alpha.com/product", title: "Alpha" },
    { url: "https://alpha.com/about", title: "Alpha duplicate" },
    { url: "javascript:alert(1)", title: "Invalid" },
    { url: "https://beta.com", title: "Beta" },
  ]);
  assert.deepEqual(results.map(({ title }) => title), ["Alpha", "Beta"]);
});

test("candidate selection rejects the subject, unsupported domains, and duplicates", () => {
  const candidate = (url: string) => ({
    name: url,
    url,
    relationship: "direct" as const,
    reason: "Same buyer and workflow",
    confidence: 0.8,
  });
  const selected = selectSupportedCandidates(
    "https://lark.ai",
    [
      candidate("https://www.lark.ai"),
      candidate("https://alpha.com"),
      candidate("https://www.alpha.com/other"),
      candidate("https://invented.com"),
      candidate("not a url"),
    ],
    [{ url: "https://alpha.com/product" }],
  );
  assert.deepEqual(selected.map(({ url }) => url), ["https://alpha.com"]);
});
