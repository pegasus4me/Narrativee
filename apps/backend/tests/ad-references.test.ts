import assert from "node:assert/strict";
import test from "node:test";
import {
  AdReferenceError,
  adSearchSchema,
  metaMediaUrl,
  normalizeAdSearch,
  searchAdReferences,
} from "../src/ad-references/ad-references.service";

const imageUrl = "https://scontent.xx.fbcdn.net/reference.jpg";
const imageAd = {
  ad_archive_id: "123",
  page_name: "Example brand",
  is_active: true,
  snapshot: {
    body: { text: "Ad copy" },
    images: [{ original_image_url: imageUrl }],
  },
};

test("normalizes image, carousel and video references without leaking provider credentials or credit details", () => {
  const result = normalizeAdSearch({
    success: true,
    credits_remaining: 12345,
    cursor: "next-page",
    searchResults: [
      imageAd,
      imageAd,
      {
        ad_archive_id: "456",
        snapshot: { cards: [{ original_image_url: imageUrl }] },
      },
      {
        ad_archive_id: "789",
        snapshot: {
          videos: [
            {
              video_preview_image_url: imageUrl,
              video_sd_url: "https://video.xx.fbcdn.net/reference.mp4",
            },
          ],
        },
      },
      { ad_archive_id: "invalid-id" },
      { ad_archive_id: "999", snapshot: null },
    ],
  });
  assert.equal(result.items.length, 4);
  assert.equal(result.cursor, "next-page");
  assert.equal(
    result.items[0].sourceUrl,
    "https://www.facebook.com/ads/library/?id=123",
  );
  assert.equal(result.items[1].imageUrl, imageUrl);
  assert.equal(
    result.items[2].videoUrl,
    "https://video.xx.fbcdn.net/reference.mp4",
  );
  assert.equal(result.items[3].imageUrl, null);
  assert.ok(!JSON.stringify(result).includes("credits_remaining"));
  assert.deepEqual(normalizeAdSearch({ success: true, searchResults: [] }), {
    items: [],
    cursor: null,
  });
  assert.throws(() =>
    normalizeAdSearch({ success: false, error: "bad credential" }),
  );
});

test("rejects unsafe remote media and invalid search inputs", () => {
  for (const url of [
    "http://scontent.xx.fbcdn.net/image.jpg",
    "https://fbcdn.net.attacker.example/image.jpg",
    "https://user:password@scontent.xx.fbcdn.net/image.jpg",
    "https://scontent.xx.fbcdn.net:8443/image.jpg",
    "http://127.0.0.1/private",
    "data:image/png;base64,abc",
  ])
    assert.equal(metaMediaUrl(url), null);
  assert.equal(metaMediaUrl(imageUrl), imageUrl);
  const result = normalizeAdSearch({
    success: true,
    searchResults: [
      {
        ...imageAd,
        snapshot: {
          images: [{ original_image_url: "http://localhost/private" }],
        },
      },
    ],
  });
  assert.equal(result.items[0].imageUrl, null);
  assert.deepEqual(adSearchSchema.parse({ query: " skincare " }), {
    query: "skincare",
    country: "ALL",
  });
  assert.throws(() => adSearchSchema.parse({ query: "a" }));
  assert.throws(() =>
    adSearchSchema.parse({ query: "valid", country: "invalid" }),
  );
});

test("search sends credentials only to the provider, caches identical requests and preserves pagination", async (t) => {
  const previous = process.env.SCRAPECREATORS_API_KEY;
  t.after(() => {
    if (previous === undefined) delete process.env.SCRAPECREATORS_API_KEY;
    else process.env.SCRAPECREATORS_API_KEY = previous;
  });
  delete process.env.SCRAPECREATORS_API_KEY;
  await assert.rejects(
    searchAdReferences({ query: "test-search", country: "FR" }),
    (error: unknown) =>
      error instanceof AdReferenceError && error.status === 503,
  );
  process.env.SCRAPECREATORS_API_KEY = "test-only-secret";
  const requests: Array<{ url: string; init: RequestInit }> = [];
  t.mock.method(globalThis, "fetch", async (url: string, init: RequestInit) => {
    requests.push({ url, init });
    return new Response(
      JSON.stringify({
        success: true,
        searchResults: [imageAd],
        cursor: "next",
      }),
      { status: 200 },
    );
  });
  const input = { query: "test-search", country: "FR" };
  const result = await searchAdReferences(input);
  await searchAdReferences(input);
  assert.equal(requests.length, 1);
  assert.equal(
    new Headers(requests[0].init.headers).get("x-api-key"),
    "test-only-secret",
  );
  assert.equal(
    requests[0].url,
    "https://api.scrapecreators.com/v1/facebook/adLibrary/search/ads",
  );
  assert.equal(requests[0].init.method, "POST");
  await searchAdReferences({ ...input, cursor: "next" });
  assert.equal(requests.length, 2);
  assert.equal(JSON.parse(String(requests[1].init.body)).cursor, "next");
  assert.ok(!JSON.stringify(result).includes("test-only-secret"));
  t.mock.method(globalThis, "fetch", async () =>
    Response.json({ success: false }),
  );
  await assert.rejects(
    searchAdReferences({ query: "invalid-response-test", country: "ALL" }),
    (error: unknown) =>
      error instanceof AdReferenceError && error.status === 502,
  );
  t.mock.method(
    globalThis,
    "fetch",
    async () => new Response("Provider secret details", { status: 401 }),
  );
  await assert.rejects(
    searchAdReferences({ query: "failure-test", country: "ALL" }),
    (error: unknown) =>
      error instanceof AdReferenceError &&
      error.status === 502 &&
      !error.message.includes("Provider secret"),
  );
});
