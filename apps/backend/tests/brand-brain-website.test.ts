import assert from "node:assert/strict";
import test from "node:test";
import sharp from "sharp";
import {
  normalizeWebsiteProfile,
  shouldImportWebsiteRecord,
} from "../src/brand-brain/website-profile";
import {
  downloadWebsiteImage,
  isPublicAddress,
  normalizeWebsiteImage,
} from "../src/brand-brain/website-image";

const url = "https://brand.example/";
const diagnosis = {
  companyName: "Acme",
  summary: "A useful product",
  observations: [
    {
      type: "product",
      statement: "Acme sells widgets",
      confidence: 0.9,
      evidence: [
        {
          statement: "Widget offering",
          sourceUrl: url,
          sourceText: "Widgets for teams",
        },
      ],
    },
  ],
  inferences: [
    {
      type: "positioning",
      statement: "Appears focused on teams",
      confidence: 0.7,
      evidence: [
        {
          statement: "Team focus",
          sourceUrl: url,
          sourceText: "Widgets for teams",
        },
      ],
    },
  ],
  contradictions: [],
  openQuestions: [],
};

test("website profile maps detected identity and evidence without inventing values", () => {
  const profile = normalizeWebsiteProfile(
    {
      branding: {
        logo: "/logo.svg",
        colors: {
          primary: "#abc",
          background: "#123456",
          invented: "#FFFFFF",
          accent: "blue",
        },
        fonts: [
          { family: "Inter", role: "body" },
          { family: "system-ui" },
          { family: "JetBrains Mono", role: "monospace" },
        ],
        typography: {
          fontFamilies: { primary: "Inter", heading: "Inter Tight" },
        },
        images: { ogImage: "/social.png", favicon: "/favicon.ico" },
        components: { irrelevant: "cookie consent" },
      },
    },
    diagnosis,
    url,
  );
  assert.deepEqual(
    profile.items
      .filter((item) => item.category === "color")
      .map((item) => item.content),
    ["Primary: #AABBCC", "Background: #123456"],
  );
  assert.deepEqual(
    profile.items
      .filter((item) => item.category === "typography")
      .map((item) => item.content),
    ["Body: Inter", "Headings: Inter Tight", "Monospace: JetBrains Mono"],
  );
  assert.ok(profile.items.every((item) => item.sourceUrl === url));
  assert.ok(
    profile.items.some((item) => item.content.startsWith("Hypothesis")),
  );
  assert.ok(
    profile.items.some((item) =>
      item.content.includes("Evidence: Widgets for teams"),
    ),
  );
  assert.deepEqual(
    profile.assets.map((item) => item.sourceKey),
    ["image:logo", "image:ogImage"],
  );
});

test("empty or malformed research does not produce a made-up brand kit", () => {
  assert.deepEqual(normalizeWebsiteProfile(null, null, url), {
    items: [],
    assets: [],
  });
  assert.deepEqual(normalizeWebsiteProfile({ branding: "invalid" }, {}, url), {
    items: [],
    assets: [],
  });
  const unsupported = {
    ...diagnosis,
    observations: [{ ...diagnosis.observations[0], evidence: [] }],
    inferences: [],
  };
  assert.equal(normalizeWebsiteProfile({}, unsupported, url).items.length, 0);
  const wrongSource = {
    ...diagnosis,
    observations: [
      {
        ...diagnosis.observations[0],
        evidence: [
          {
            statement: "Competitor fact",
            sourceUrl: "https://competitor.example",
            sourceText: "A competitor says",
          },
        ],
      },
    ],
    inferences: [],
  };
  assert.equal(normalizeWebsiteProfile({}, wrongSource, url).items.length, 0);
});

test("reimports respect existing imports, archives and manual choices", () => {
  const candidate = {
    sourceKey: "color:primary",
    category: "color",
    content: "Primary: #123456",
  };
  const imported = {
    sourceKey: candidate.sourceKey,
    category: "color",
    source: "discovery",
    kind: "rule",
    archivedAt: null,
    content: "Primary: #654321",
  };
  assert.equal(shouldImportWebsiteRecord(candidate, []), true);
  assert.equal(shouldImportWebsiteRecord(candidate, [imported]), false);
  assert.equal(
    shouldImportWebsiteRecord(candidate, [
      { ...imported, archivedAt: new Date() },
    ]),
    false,
  );
  assert.equal(
    shouldImportWebsiteRecord(candidate, [
      { ...imported, sourceKey: null, source: "user" },
    ]),
    false,
  );
  assert.equal(
    shouldImportWebsiteRecord(candidate, [
      { ...imported, sourceKey: null, source: "user", category: "voice" },
    ]),
    true,
  );
});

test("image download rejects private addresses and IPv6 forms", async () => {
  for (const address of [
    "127.0.0.1",
    "10.0.0.1",
    "192.168.1.1",
    "169.254.169.254",
    "100.64.0.1",
    "::1",
    "::ffff:127.0.0.1",
    "fc00::1",
    "fe80::1",
  ]) {
    assert.equal(isPublicAddress(address), false, address);
  }
  assert.equal(isPublicAddress("8.8.8.8"), true);
  assert.equal(isPublicAddress("2606:4700:4700::1111"), true);
  await assert.rejects(
    downloadWebsiteImage("http://127.0.0.1/logo.png", url),
    /Private/,
  );
  await assert.rejects(
    downloadWebsiteImage("file:///etc/passwd", url),
    /Unsupported/,
  );
});

test("raster images and safe SVG logos become validated private PNG assets", async () => {
  const bytes = await sharp({
    create: { width: 24, height: 16, channels: 4, background: "#123456" },
  })
    .webp()
    .toBuffer();
  const normalized = await downloadWebsiteImage(
    `data:image/webp;base64,${bytes.toString("base64")}`,
    url,
  );
  assert.equal(normalized.mimeType, "image/png");
  assert.equal(normalized.width, 24);
  assert.equal((await sharp(normalized.bytes).metadata()).format, "png");
  const svg = Buffer.from(
    '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="16"><path d="M0 0H24V16H0Z" fill="#123456"/></svg>',
  );
  assert.equal((await normalizeWebsiteImage(svg)).width, 24);
  await assert.rejects(normalizeWebsiteImage(Buffer.from("not an image")));
  await assert.rejects(
    normalizeWebsiteImage(
      Buffer.from(
        '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"><image href="https://evil.example/a.png"/></svg>',
      ),
    ),
    /Unsafe/,
  );
  await assert.rejects(
    normalizeWebsiteImage(Buffer.alloc(8 * 1024 * 1024 + 1)),
    /large/,
  );
});
