import assert from "node:assert/strict";
import test from "node:test";
import { AnalysisService } from "../src/analysis/analysis.service";
import {
  FirecrawlClient,
  type FirecrawlDocument,
} from "../src/analysis/firecrawl.client";
import { AccessError } from "../src/billing/catalog";
import { usageContext } from "../src/usage/operations";

function scanner(scrapeHomepage: (url: string) => Promise<FirecrawlDocument>) {
  const service = Object.create(AnalysisService.prototype) as {
    firecrawl: Pick<FirecrawlClient, "scrapeHomepage">;
    scrapeCompetitors: (
      urls: string[],
    ) => Promise<Array<{ url: string; document: FirecrawlDocument }>>;
  };
  service.firecrawl = { scrapeHomepage };
  return service;
}

test("missing Firecrawl rates reach comparison callers without scanning websites", async (t) => {
  const priorRates = process.env.AI_TOOL_RATES_JSON;
  process.env.AI_TOOL_RATES_JSON = "{}";
  const fetch = t.mock.method(globalThis, "fetch", async () => {
    assert.fail("An unpriced scan must not call the provider");
  });
  const client = new FirecrawlClient("test-no-network");
  const service = scanner((url) => client.scrapeHomepage(url));
  try {
    await assert.rejects(
      usageContext.run(
        { userId: "test", key: "comparison", operationId: "test" },
        () => service.scrapeCompetitors(["https://competitor.example"]),
      ),
      (error: unknown) => {
        assert.ok(error instanceof AccessError);
        assert.equal(error.code, "TOOL_UNPRICED");
        assert.match(error.message, /no verified provider-cost/);
        return true;
      },
    );
    assert.equal(fetch.mock.callCount(), 0);
  } finally {
    if (priorRates === undefined) delete process.env.AI_TOOL_RATES_JSON;
    else process.env.AI_TOOL_RATES_JSON = priorRates;
  }
});

test("account failures stop comparison even if another site was scanned", async () => {
  const access = new AccessError(
    "TRIAL_CREDITS_EXHAUSTED",
    "Your trial credits are exhausted.",
  );
  const service = scanner(async (url) => {
    if (url.includes("blocked")) {
      throw new Error("Scan failed", { cause: access });
    }
    return { markdown: "Competitor evidence" };
  });
  await assert.rejects(
    service.scrapeCompetitors([
      "https://available.example",
      "https://blocked.example",
    ]),
    (error) => error === access,
  );
});

test("individual website failures are logged and other competitors still scan", async (t) => {
  const failure = new Error("Website refused the scan");
  const log = t.mock.method(console, "error", () => {});
  const document = { markdown: "Competitor evidence" };
  const scanned: string[] = [];
  const service = scanner(async (url) => {
    scanned.push(url);
    if (url.includes("blocked")) throw failure;
    return document;
  });
  const urls = [
    "https://first.example",
    "https://blocked.example",
    "https://third.example",
    "https://fourth.example",
    "https://fifth.example",
  ];
  assert.deepEqual(
    await service.scrapeCompetitors(urls),
    urls
      .filter((url) => !url.includes("blocked"))
      .map((url) => ({ url, document })),
  );
  assert.deepEqual(scanned, urls);
  assert.deepEqual(log.mock.calls[0]?.arguments, [
    "Competitor website scan failed",
    failure,
  ]);
  assert.deepEqual(await service.scrapeCompetitors([urls[1]!]), []);
});
