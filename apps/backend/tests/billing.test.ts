import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import type Stripe from "stripe";
import { AccessError, monthlyPeriod, plans } from "../src/billing/catalog";
import { rateFor, usageCost } from "../src/usage/model-rates";

test("month-end resets retain the original day across leap years", () => {
  assert.deepEqual(
    monthlyPeriod(new Date("2024-01-31T12:30Z"), new Date("2024-02-29T12:30Z")),
    {
      start: new Date("2024-02-29T12:30Z"),
      end: new Date("2024-03-31T12:30Z"),
    },
  );
  assert.equal(
    monthlyPeriod(
      new Date("2025-01-31T12:30Z"),
      new Date("2025-03-01"),
    ).start.toISOString(),
    "2025-02-28T12:30:00.000Z",
  );
});
test("fractional credits use actual cached and nested usage; unknown models fail closed", () => {
  const rate = rateFor("gpt-6-luna", "text");
  assert.equal(
    usageCost(rate, {
      input_tokens: 100,
      output_tokens: 10,
      input_tokens_details: { cached_tokens: 50 },
    }),
    11,
  );
  assert.equal(
    usageCost(rate, { input_tokens: 100, output_tokens: 10 }, 2),
    20015,
  );
  assert.throws(() => rateFor("unconfigured", "text"), /no verified/);
  assert.throws(
    () => usageCost(rate, { input_tokens: -1, output_tokens: 0 }),
    /reliable usage/,
  );
});
test("default campaign image model has verified standard pricing and separate input rates", () => {
  const rate = rateFor("gpt-image-2", "image");
  assert.equal(rate.maxOutputTokens, 7024);
  assert.equal(
    usageCost(rate, {
      input_tokens: 100,
      input_tokens_details: { text_tokens: 60, image_tokens: 40 },
      output_tokens: 7024,
    }),
    211340,
  );
  assert.throws(
    () => usageCost(rate, { input_tokens: 100, output_tokens: 7024 }),
    /Image usage breakdown/,
  );
});
test(
  "ledger, mocked providers and webhook lifecycle in disposable Postgres",
  { skip: !process.env.TEST_DATABASE_URL },
  async (t) => {
    assert.match(
      new URL(process.env.TEST_DATABASE_URL!).pathname,
      /^\/billing_test_[a-z0-9_]+$/,
    );
    process.env.BETTER_AUTH_SECRET =
      "isolated-billing-test-secret-000000000000";
    process.env.BETTER_AUTH_URL = "http://localhost:3002";
    const { pool } = await import("../src/auth/auth");
    const ledger = await import("../src/usage/ledger");
    const { billable, deliveryMarker } = await import(
      "../src/usage/operations"
    );
    const { db } = await import("../src/auth/auth");
    const { meteredFetch, meteredOpenAI } = await import("../src/usage/openai");
    const { processStripeEvent } = await import("../src/billing/webhooks");
    const { requireTrialAccess } = await import("../src/usage/usage.routes");
    const sql = await readFile("drizzle/0021_billing.sql", "utf8");
    await pool.query(await readFile("drizzle/0000_windy_toxin.sql", "utf8"));
    await pool.query(
      `INSERT INTO "user"(id,name,email,"emailVerified") VALUES('legacy','Legacy','legacy@billing.test',false)`,
    );
    await pool.query(await readFile("drizzle/0019_trial_credits.sql", "utf8"));
    await pool.query(sql);
    await pool.query(sql);
    const trialMigration = await readFile(
      "drizzle/0024_trial_allowance.sql",
      "utf8",
    );
    await pool.query(trialMigration);
    async function user(id: string) {
      await pool.query(
        `INSERT INTO "user"(id,name,email,"emailVerified",trial_credits_remaining) VALUES($1,$1,$2,false,80)`,
        [id, `${id}@billing.test`],
      );
    }
    async function operation(
      userId: string,
      work: () => Promise<unknown>,
      key = randomUUID(),
    ) {
      return billable(userId, "test", work, key);
    }
    try {
      await t.test(
        "legacy 80-credit trials preserve balances and deadlines on migration replay",
        async () => {
          await user("trial");
          const first = await ledger.getUsage("trial");
          assert.equal(first.availableCredits, 80);
          assert.equal(
            new Date(first.trialEndsAt!).getTime() -
              new Date(first.serverTime).getTime() >
              167 * 3600000,
            true,
          );
          await operation(
            "trial",
            async () => {
              const {
                rows: [op],
              } = await pool.query(
                `SELECT id FROM billable_operation WHERE user_id='trial' AND status='running'`,
              );
              const call = await ledger.reserve(op.id, "mock", {}, 1500);
              await ledger.recordCall(call, 1234, {});
              return { saved: true };
            },
            "one",
          );
          await pool.query(sql);
          const after = await ledger.getUsage("trial");
          assert.equal(after.availableCredits, 79.8766);
          assert.equal(after.trialEndsAt, first.trialEndsAt);
          assert.equal(
            (await ledger.getUsage("legacy")).reason,
            "PAYMENT_REQUIRED",
          );
        },
      );
      await t.test(
        "new 400-credit trials survive startup replay without refills",
        async () => {
          await pool.query(
            `INSERT INTO "user"(id,name,email,"emailVerified") VALUES('new-trial','New trial','new-trial@billing.test',false)`,
          );
          await pool.query(sql);
          await pool.query(trialMigration);
          const initial = await ledger.getUsage("new-trial");
          assert.equal(initial.availableCredits, 400);
          await pool.query(
            "UPDATE credit_bucket SET spent=10000 WHERE id='trial:new-trial'",
          );
          await pool.query(sql);
          await pool.query(trialMigration);
          const replayed = await ledger.getUsage("new-trial");
          assert.equal(replayed.availableCredits, 399);
          assert.equal(replayed.trialEndsAt, initial.trialEndsAt);
        },
      );
      await t.test(
        "launch grant is idempotent and preserves enrolled balances",
        async () => {
          const { grantLegacyTrials } = await import(
            "../src/billing/legacy-trials"
          );
          const before = await ledger.getUsage("trial");
          assert.equal(await grantLegacyTrials(), 1);
          assert.equal(await grantLegacyTrials(), 0);
          assert.equal((await ledger.getUsage("legacy")).availableCredits, 400);
          assert.equal(
            (await ledger.getUsage("trial")).availableCredits,
            before.availableCredits,
          );
          assert.equal(
            (await ledger.getUsage("trial")).trialEndsAt,
            before.trialEndsAt,
          );
        },
      );
      await t.test(
        "initial Firecrawl scrape is free while AI and follow-up tools remain metered",
        async () => {
          const { FirecrawlClient } = await import(
            "../src/analysis/firecrawl.client"
          );
          const client = new FirecrawlClient("mock-key");
          const priorRates = process.env.AI_TOOL_RATES_JSON;
          process.env.AI_TOOL_RATES_JSON = "{}";
          const before = await ledger.getUsage("trial");
          let scrapes = 0;
          t.mock.method(
            globalThis,
            "fetch",
            async (input: Parameters<typeof fetch>[0]) => {
              if (String(input).includes("api.firecrawl.dev")) {
                scrapes++;
                return Response.json({
                  success: true,
                  data: { markdown: "Website content" },
                });
              }
              return String(input).endsWith("/input_tokens")
                ? Response.json({ input_tokens: 100 })
                : Response.json({
                    usage: { input_tokens: 100, output_tokens: 10 },
                    output: [],
                  });
            },
          );
          try {
            await billable("trial", "research", async () => {
              const document = await client.scrapeInitialHomepage(
                "https://example.com",
              );
              assert.equal(document.markdown, "Website content");
              await client.searchInitialWeb("competitors", 8);
              assert.equal(
                (await ledger.getUsage("trial")).availableCredits,
                before.availableCredits,
              );
              assert.equal((await ledger.getUsage("trial")).reservedCredits, 0);
              await meteredFetch("https://api.openai.com/v1/responses", {
                method: "POST",
                body: JSON.stringify({
                  model: "gpt-6-luna",
                  input: "Analyze website",
                }),
              });
              return { saved: true };
            });
            assert.equal(scrapes, 2);
            assert.equal(
              (await ledger.getUsage("trial")).availableCredits,
              Number((before.availableCredits - 0.0015).toFixed(4)),
            );
            await assert.rejects(
              operation("trial", () =>
                client.scrapeHomepage("https://example.com"),
              ),
              /no verified provider-cost/,
            );
            await assert.rejects(
              operation("trial", () => client.searchWeb("competitors")),
              /no verified provider-cost/,
            );
            assert.equal(scrapes, 2);
          } finally {
            t.mock.restoreAll();
            if (priorRates === undefined) delete process.env.AI_TOOL_RATES_JSON;
            else process.env.AI_TOOL_RATES_JSON = priorRates;
          }
        },
      );
      await t.test(
        "missing terminal usage releases reservations without a guessed charge",
        async () => {
          const before = await ledger.getUsage("trial");
          t.mock.method(
            globalThis,
            "fetch",
            async (input: Parameters<typeof fetch>[0]) =>
              String(input).endsWith("/input_tokens")
                ? Response.json({ input_tokens: 10 })
                : new Response(
                    'data: {"type":"response.completed","response":{"output":[]}}\n\n',
                  ),
          );
          await assert.rejects(
            operation("trial", async () => {
              const response = await meteredFetch(
                "https://api.openai.com/v1/responses",
                {
                  method: "POST",
                  body: JSON.stringify({
                    model: "gpt-6-luna",
                    input: "test",
                    stream: true,
                  }),
                },
              );
              await response.text();
              return { saved: true };
            }),
            /usage was missing/,
          );
          t.mock.restoreAll();
          assert.equal(
            (await ledger.getUsage("trial")).availableCredits,
            before.availableCredits,
          );
          assert.equal((await ledger.getUsage("trial")).reservedCredits, 0);
        },
      );
      await t.test(
        "saved partial results are charged after later failure with a durable marker",
        async () => {
          const before = (await ledger.getUsage("trial")).availableCredits;
          await assert.rejects(
            operation("trial", async () => {
              const {
                rows: [op],
              } = await pool.query(
                `SELECT id FROM billable_operation WHERE user_id='trial' AND status='running'`,
              );
              const id = await ledger.reserve(op.id, "mock", {}, 100);
              await ledger.recordCall(id, 50, {});
              await db.transaction(async (tx) => {
                await tx.execute(deliveryMarker());
              });
              throw new Error("later tool failed");
            }),
          );
          assert.equal(
            (await ledger.getUsage("trial")).availableCredits,
            Number((before - 0.005).toFixed(4)),
          );
        },
      );
      await t.test(
        "forged redirects do not change access; raw-body webhook signatures are checked",
        async () => {
          const express = (await import("express")).default;
          const { stripeWebhook } = await import(
            "../src/billing/billing.routes"
          );
          const StripeSdk = (await import("stripe")).default;
          const sdk = new StripeSdk("sk_test_mock");
          process.env.STRIPE_WEBHOOK_SECRET = "whsec_billing_test";
          const app = express();
          app.post(
            "/webhook",
            express.raw({ type: "application/json" }),
            stripeWebhook,
          );
          app.use(express.json());
          const server = app.listen(0, "127.0.0.1");
          await new Promise<void>((resolve) =>
            server.once("listening", resolve),
          );
          const address = server.address();
          assert.ok(address && typeof address !== "string");
          const url = `http://127.0.0.1:${address.port}/webhook`;
          const payload = JSON.stringify({
            id: "evt_signature",
            type: "ping",
            data: { object: { id: "unrelated" } },
          });
          try {
            const forged = await fetch(url, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "stripe-signature": "forged",
              },
              body: payload,
            });
            assert.equal(forged.status, 400);
            const signature = sdk.webhooks.generateTestHeaderString({
              payload,
              secret: process.env.STRIPE_WEBHOOK_SECRET,
            });
            const valid = await fetch(url, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "stripe-signature": signature,
              },
              body: payload,
            });
            assert.equal(valid.status, 200);
            assert.equal((await ledger.getUsage("legacy")).plan, "trial");
            const { returnUrl } = await import("../src/billing/checkout");
            assert.throws(
              () => returnUrl("https://evil.example/workspace"),
              /Invalid return/,
            );
          } finally {
            await new Promise<void>((resolve) => server.close(() => resolve()));
          }
        },
      );
      await t.test(
        "nested operations and retries are charged once",
        async () => {
          let calls = 0;
          const work = () =>
            operation(
              "trial",
              async () => {
                calls++;
                const {
                  rows: [op],
                } = await pool.query(
                  `SELECT id FROM billable_operation WHERE user_id='trial' AND status='running'`,
                );
                const call = await ledger.reserve(op.id, "mock", {}, 100);
                await ledger.recordCall(call, 13, {});
                return { saved: "nested" };
              },
              "inner",
            );
          await operation("trial", work, "outer");
          await operation("trial", work, "outer");
          assert.equal(calls, 1);
          assert.equal(
            (
              await pool.query(
                `SELECT count(*)::int n FROM billable_operation WHERE user_id='trial' AND request_key='inner'`,
              )
            ).rows[0].n,
            0,
          );
        },
      );
      await t.test(
        "failed calls release all reservations and record absorbed spend",
        async () => {
          const before = (await ledger.getUsage("trial")).availableCredits;
          await assert.rejects(
            operation("trial", async () => {
              const {
                rows: [op],
              } = await pool.query(
                `SELECT id FROM billable_operation WHERE user_id='trial' AND status='running'`,
              );
              const call = await ledger.reserve(op.id, "mock", {}, 1000);
              await ledger.recordCall(call, 900, {});
              throw new Error("storage failed");
            }),
          );
          assert.equal(
            (await ledger.getUsage("trial")).availableCredits,
            before,
          );
          assert.equal(
            (await pool.query(`SELECT sum(absorbed)::int n FROM provider_call`))
              .rows[0].n,
            900,
          );
        },
      );
      await t.test(
        "concurrent calls share the same atomic available balance",
        async () => {
          await user("concurrent");
          await operation("concurrent", async () => {
            const {
              rows: [op],
            } = await pool.query(
              `SELECT id FROM billable_operation WHERE user_id='concurrent' AND status='running'`,
            );
            const outcomes = await Promise.allSettled([
              ledger.reserve(op.id, "mock", {}, 600000),
              ledger.reserve(op.id, "mock", {}, 600000),
            ]);
            assert.equal(
              outcomes.filter((x) => x.status === "fulfilled").length,
              1,
            );
            assert.equal(
              (await ledger.getUsage("concurrent")).reservedCredits,
              60,
            );
            throw new Error("cancelled");
          }).catch(() => {});
          assert.equal(
            (await ledger.getUsage("concurrent")).availableCredits,
            80,
          );
        },
      );
      await t.test(
        "complete creative generation reaches the SDK once, settles actual image usage and refunds failures",
        async () => {
          await user("images");
          const before = (await ledger.getUsage("images")).availableCredits;
          let calls = 0;
          let missingUsage = false;
          t.mock.method(
            globalThis,
            "fetch",
            async (input: Parameters<typeof fetch>[0], init?: RequestInit) => {
              assert.equal(
                String(input),
                "https://api.openai.com/v1/images/generations",
              );
              const body = JSON.parse(String(init?.body));
              assert.equal(body.model, "gpt-image-2");
              assert.equal(body.n, 1);
              assert.equal(body.size, "1024x1024");
              assert.equal(body.quality, "high");
              assert.match(body.prompt, /complete finished creative/);
              assert.match(body.prompt, /Explore/);
              calls++;
              return Response.json({
                created: 1,
                data: [{ b64_json: "aW1hZ2U=" }],
                ...(missingUsage
                  ? {}
                  : {
                      usage: {
                        input_tokens: 10,
                        input_tokens_details: {
                          text_tokens: 10,
                          image_tokens: 0,
                        },
                        output_tokens: 7024,
                      },
                    }),
              });
            },
          );
          const { generateCampaignImage } = await import(
            "../src/studio/campaign/campaign.generator"
          );
          const creative = {
            name: "Launch",
            concept: "A quiet mountain launch",
            copy: ["Explore"],
            imagePrompt:
              "A complete travel advertisement with readable typography and a quiet mountain landscape.",
            referenceIds: [],
          };
          const context = {
            brandName: "Acme",
            brain: { approvedRules: [] },
            references: [],
          } as unknown as import("../src/studio/campaign/campaign.context").CampaignContext;
          const output = {
            platform: "general",
            formatId: "square_1080",
            width: 1080,
            height: 1080,
          } as const;
          try {
            await operation(
              "images",
              async () => {
                assert.equal(
                  (
                    await generateCampaignImage(
                      creative,
                      context,
                      output,
                      "gpt-image-2",
                    )
                  ).toString(),
                  "image",
                );
                return { saved: true };
              },
              "image-success",
            );
            assert.equal(calls, 1);
            const remaining = Number((before - 21.077).toFixed(4));
            assert.equal(
              (await ledger.getUsage("images")).availableCredits,
              remaining,
            );
            const sdk = meteredOpenAI({ apiKey: "test-no-network" });
            await assert.rejects(
              operation("images", () =>
                sdk.images.generate({
                  model: "gpt-image-unconfigured",
                  prompt: "A landscape",
                  n: 1,
                  quality: "high",
                  size: "1024x1024",
                }),
              ),
              (error: unknown) =>
                error instanceof AccessError && error.code === "MODEL_UNPRICED",
            );
            assert.equal(calls, 1);
            missingUsage = true;
            await assert.rejects(
              operation("images", () =>
                generateCampaignImage(creative, context, output, "gpt-image-2"),
              ),
            );
            assert.equal(calls, 2);
            const after = await ledger.getUsage("images");
            assert.equal(after.availableCredits, remaining);
            assert.equal(after.reservedCredits, 0);
          } finally {
            t.mock.restoreAll();
          }
        },
      );
      await t.test(
        "reference-image creation is metered, preserves uploads, and refunds missing usage",
        async () => {
          await user("image-references");
          const before = (await ledger.getUsage("image-references"))
            .availableCredits;
          const { default: sharp } = await import("sharp");
          const { toFile } = await import("openai");
          const bytes = await sharp({
            create: {
              width: 16,
              height: 16,
              channels: 4,
              background: "#123456",
            },
          })
            .png()
            .toBuffer();
          const sdk = meteredOpenAI({ apiKey: "test-no-network" });
          let calls = 0;
          let missingUsage = false;
          t.mock.method(globalThis, "fetch", async (input, init) => {
            assert.equal(
              String(input),
              "https://api.openai.com/v1/images/edits",
            );
            assert.ok(init?.body instanceof FormData);
            const files = init.body.getAll("image[]");
            assert.equal(files.length, 1);
            assert.deepEqual(
              Buffer.from(await (files[0] as File).arrayBuffer()),
              bytes,
            );
            assert.ok(
              (await ledger.getUsage("image-references")).reservedCredits > 40,
              "High-fidelity image inputs are reserved before the provider call",
            );
            calls++;
            return Response.json({
              created: 1,
              data: [{ b64_json: bytes.toString("base64") }],
              ...(missingUsage
                ? {}
                : {
                    usage: {
                      input_tokens: 210,
                      input_tokens_details: {
                        text_tokens: 10,
                        image_tokens: 200,
                      },
                      output_tokens: 7000,
                    },
                  }),
            });
          });
          const generate = async () =>
            sdk.images.edit({
              model: "gpt-image-2",
              prompt: "Create a complete brand advertisement using this logo",
              image: [await toFile(bytes, "logo.png", { type: "image/png" })],
              size: "1024x1024",
              n: 1,
              quality: "high",
              output_format: "png",
            });
          try {
            await operation("image-references", async () => {
              await generate();
              return { saved: true };
            });
            const remaining = Number((before - 21.165).toFixed(4));
            assert.equal(
              (await ledger.getUsage("image-references")).availableCredits,
              remaining,
            );
            missingUsage = true;
            await assert.rejects(operation("image-references", generate));
            assert.equal(calls, 2);
            const after = await ledger.getUsage("image-references");
            assert.equal(after.availableCredits, remaining);
            assert.equal(after.reservedCredits, 0);
          } finally {
            t.mock.restoreAll();
          }
        },
      );
      await t.test(
        "stream terminal usage is metered and missing usage refunds the operation",
        async () => {
          const native = globalThis.fetch;
          let counter = 0;
          t.mock.method(
            globalThis,
            "fetch",
            async (input: Parameters<typeof fetch>[0], init?: RequestInit) => {
              const url = String(input);
              if (url.endsWith("/input_tokens"))
                return Response.json({ input_tokens: 100 });
              if (url.endsWith("/responses")) {
                counter++;
                const body = JSON.parse(String(init?.body));
                assert.equal(body.max_output_tokens, 8000);
                assert.equal(body.service_tier, "default");
                const text = `data: ${JSON.stringify({ type: "response.completed", response: { usage: { input_tokens: 100, output_tokens: 10 }, output: [] } })}\n\n`;
                return new Response(
                  new ReadableStream({
                    start(c) {
                      c.enqueue(new TextEncoder().encode(text.slice(0, 30)));
                      c.enqueue(new TextEncoder().encode(text.slice(30)));
                      c.close();
                    },
                  }),
                );
              }
              return native(input, init);
            },
          );
          const before = (await ledger.getUsage("trial")).availableCredits;
          await operation("trial", async () => {
            const response = await meteredFetch(
              "https://api.openai.com/v1/responses",
              {
                method: "POST",
                body: JSON.stringify({
                  model: "gpt-6-luna",
                  input: "hello",
                  stream: true,
                }),
              },
            );
            await response.text();
            return { saved: true };
          });
          assert.equal(counter, 1);
          assert.equal(
            (await ledger.getUsage("trial")).availableCredits,
            Number((before - 0.0015).toFixed(4)),
          );
          t.mock.restoreAll();
        },
      );
      await t.test(
        "abandoned delivered operations are settled; expiry never restores credits into a new bucket",
        async () => {
          await user("crash");
          await ledger.getUsage("crash");
          await pool.query(
            `INSERT INTO billable_operation(id,user_id,request_key,action,delivered,heartbeat_at) VALUES('abandoned','crash','crash','test',true,now()-interval '11 minutes')`,
          );
          const id = await ledger.reserve("abandoned", "mock", {}, 5000);
          await ledger.recordCall(id, 2345, {});
          await pool.query(
            `UPDATE credit_bucket SET starts_at=now()-interval '168 hours',expires_at=now()-interval '1 second' WHERE user_id='crash'`,
          );
          await ledger.recoverAbandoned();
          const usage = await ledger.getUsage("crash");
          assert.equal(usage.reason, "TRIAL_EXPIRED");
          assert.equal(usage.availableCredits, 0);
          assert.equal(usage.reservedCredits, 0);
          assert.equal(
            (
              await pool.query(
                `SELECT spent FROM credit_bucket WHERE user_id='crash'`,
              )
            ).rows[0].spent,
            "2345",
          );
        },
      );
      await t.test(
        "anonymous direct AI calls are rejected before provider usage",
        async () => {
          let status = 0,
            ran = false;
          await requireTrialAccess(
            { user: undefined } as never,
            {
              status: (s: number) => {
                status = s;
                return { json: () => {} };
              },
            } as never,
            () => {
              ran = true;
            },
          );
          assert.equal(status, 401);
          assert.equal(ran, false);
        },
      );
      await t.test(
        "annual subscriptions create only the current month and preserve month-end anchors",
        async () => {
          await user("annual");
          await ledger.getUsage("annual");
          const now = new Date();
          const anchor = new Date(Date.UTC(now.getUTCFullYear(), 0, 31, 12));
          await pool.query(
            `UPDATE billing_account SET plan='starter',status='active',subscription_id='sub_annual',anchor=$1,paid_until=$2 WHERE user_id='annual'`,
            [anchor, new Date(Date.UTC(now.getUTCFullYear() + 1, 0, 31, 12))],
          );
          await pool.query(
            `INSERT INTO billing_payment VALUES('in_annual','annual','sub_annual',$1,$2,'starter',false)`,
            [anchor, new Date(Date.UTC(now.getUTCFullYear() + 1, 0, 31, 12))],
          );
          const usage = await ledger.getUsage("annual");
          assert.equal(usage.availableCredits, 2000);
          assert.equal(
            usage.resetAt,
            monthlyPeriod(anchor, now).end.toISOString(),
          );
          assert.equal(
            (
              await pool.query(
                `SELECT count(*)::int n FROM credit_bucket WHERE user_id='annual' AND kind='paid'`,
              )
            ).rows[0].n,
            1,
          );
        },
      );
      await t.test(
        "confirmed invoices, duplicate/out-of-order events, upgrades, failed renewals and refunds",
        async () => {
          await user("stripe");
          await ledger.getUsage("stripe");
          await pool.query(
            `UPDATE billing_account SET customer_id='cus_test' WHERE user_id='stripe'`,
          );
          for (const plan of ["STARTER", "PRO"])
            for (const interval of ["MONTHLY", "YEARLY"])
              process.env[`STRIPE_PRICE_${plan}_${interval}`] =
                `price_${plan.toLowerCase()}_${interval.toLowerCase()}`;
          const now = Math.floor(Date.now() / 1000),
            start = now - 86400,
            end = now + 29 * 86400;
          let selected = "starter",
            status = "active",
            refund = false;
          let invoices = [
            {
              id: "in_start",
              lines: {
                data: [
                  {
                    amount: 1900,
                    period: { start, end },
                    pricing: {
                      price_details: { price: "price_starter_monthly" },
                    },
                  },
                ],
              },
            },
          ];
          const sdk = {
            subscriptions: {
              list: async () => ({
                data: [
                  {
                    id: "sub_test",
                    created: start,
                    start_date: start,
                    status,
                    cancel_at_period_end: false,
                    items: {
                      data: [
                        {
                          id: "si_test",
                          quantity: 1,
                          price: { id: `price_${selected}_monthly` },
                        },
                      ],
                    },
                  },
                ],
              }),
            },
            invoices: {
              list: () => ({
                async *[Symbol.asyncIterator]() {
                  yield* invoices;
                },
              }),
            },
            charges: {
              retrieve: async () => ({
                id: "ch_test",
                customer: "cus_test",
                payment_intent: "pi_test",
                amount_refunded: refund ? 1900 : 0,
                disputed: false,
              }),
            },
            invoicePayments: {
              list: () => ({
                async *[Symbol.asyncIterator]() {
                  yield { invoice: "in_start" };
                },
              }),
            },
          } as unknown as Stripe;
          const event = (id: string, type = "invoice.paid") =>
            ({
              id,
              type,
              data: { object: { id: "in_start", customer: "cus_test" } },
            }) as unknown as Stripe.Event;
          await processStripeEvent(event("evt_1"), sdk);
          assert.equal(
            (await ledger.getUsage("stripe")).availableCredits,
            plans.starter.credits,
          );
          await operation("stripe", async () => {
            const {
              rows: [op],
            } = await pool.query(
              `SELECT id FROM billable_operation WHERE user_id='stripe' AND status='running'`,
            );
            const call = await ledger.reserve(op.id, "mock", {}, 10000);
            await ledger.recordCall(call, 10000, {});
            return { saved: true };
          });
          await processStripeEvent(event("evt_1"), sdk);
          assert.equal(
            (await ledger.getUsage("stripe")).availableCredits,
            plans.starter.credits - 1,
          );
          selected = "pro";
          invoices.push({
            id: "in_upgrade",
            lines: {
              data: [
                {
                  amount: 3000,
                  period: { start: now, end },
                  pricing: { price_details: { price: "price_pro_monthly" } },
                },
              ],
            },
          });
          const reset = (await ledger.getUsage("stripe")).resetAt;
          await processStripeEvent(event("evt_upgrade"), sdk);
          assert.equal(
            (await ledger.getUsage("stripe")).availableCredits,
            plans.pro.credits - 1,
          );
          assert.equal((await ledger.getUsage("stripe")).resetAt, reset);
          await processStripeEvent(
            event("evt_old", "customer.subscription.updated"),
            sdk,
          );
          assert.equal(
            (await ledger.getUsage("stripe")).availableCredits,
            plans.pro.credits - 1,
          );
          status = "past_due";
          await processStripeEvent(
            event("evt_fail", "invoice.payment_failed"),
            sdk,
          );
          assert.equal(
            (await ledger.getUsage("stripe")).paymentNeedsAttention,
            true,
          );
          await pool.query(
            `UPDATE billing_account SET paid_until=now()-interval '1 second' WHERE user_id='stripe'`,
          );
          // An old bucket may still have a future expiry; paid term enforcement must override it.
          assert.equal(
            (await ledger.getUsage("stripe")).reason,
            "PAYMENT_REQUIRED",
          );
          refund = true;
          await processStripeEvent(
            {
              ...event("evt_refund", "charge.refunded"),
              data: { object: { id: "ch_test", customer: "cus_test" } },
            } as Stripe.Event,
            sdk,
          );
          assert.equal(
            (
              await pool.query(
                `SELECT revoked FROM billing_payment WHERE invoice_id='in_start'`,
              )
            ).rows[0].revoked,
            true,
          );
          assert.equal(
            (
              await pool.query(
                `SELECT count(*)::int n FROM stripe_event WHERE id='evt_1'`,
              )
            ).rows[0].n,
            1,
          );
        },
      );
      await t.test(
        "checkout retries preserve parameters and concurrent requests reuse one session",
        async () => {
          const { checkout } = await import("../src/billing/checkout");
          const { plans } = await import("../src/billing/catalog");
          for (const plan of ["starter", "pro"] as const)
            for (const interval of ["monthly", "yearly"] as const)
              process.env[
                `STRIPE_PRICE_${plan.toUpperCase()}_${interval.toUpperCase()}`
              ] = `price_${plan}_${interval}`;
          await user("checkout");
          let calls = 0;
          let lostResponse = true;
          let previous: unknown;
          const session = {
            id: "cs_test",
            status: "open",
            amount_total: 0,
            url: "https://checkout.stripe.test/session",
            expires_at: Math.floor(Date.now() / 1000) + 1800,
          };
          const sdk = {
            prices: {
              retrieve: async (id: string) => {
                const [, plan, interval] = id.split("_") as [
                  string,
                  "starter" | "pro",
                  "monthly" | "yearly",
                ];
                return {
                  active: true,
                  currency: "usd",
                  unit_amount: plans[plan][interval],
                  product: `prod_${plan}`,
                  recurring: {
                    interval: interval === "monthly" ? "month" : "year",
                    interval_count: 1,
                    usage_type: "licensed",
                  },
                };
              },
            },
            customers: { create: async () => ({ id: "cus_checkout" }) },
            subscriptions: { list: async () => ({ data: [] }) },
            checkout: {
              sessions: {
                create: async (params: unknown, options: unknown) => {
                  calls++;
                  const request = { params, options };
                  if (previous) assert.deepEqual(request, previous);
                  previous = request;
                  if (lostResponse) {
                    lostResponse = false;
                    throw new Error("lost response");
                  }
                  return session;
                },
                retrieve: async () => session,
              },
            },
          } as unknown as Stripe;
          await assert.rejects(
            checkout(
              "checkout",
              "starter",
              "yearly",
              "/workspace/studio?project=original",
              sdk,
            ),
            /lost response/,
          );
          const results = await Promise.all([
            checkout(
              "checkout",
              "starter",
              "yearly",
              "/workspace/studio?project=changed",
              sdk,
            ),
            checkout("checkout", "starter", "yearly", "/workspace/studio", sdk),
          ]);
          assert.equal(calls, 2);
          assert.deepEqual(results, [
            { url: session.url },
            { url: session.url },
          ]);
          const request = previous as {
            params: { line_items: { price: string }[]; success_url: string };
          };
          assert.equal(
            request.params.line_items[0].price,
            "price_starter_yearly",
          );
          assert.equal(
            new URL(request.params.success_url).searchParams.get("project"),
            "original",
          );
          assert.equal((await ledger.getUsage("checkout")).plan, "trial");
          const subscribed = {
            ...sdk,
            subscriptions: {
              list: async () => ({ data: [{ status: "active" }] }),
            },
          } as unknown as Stripe;
          await assert.rejects(
            checkout(
              "checkout",
              "starter",
              "yearly",
              "/workspace/studio",
              subscribed,
            ),
            /existing subscription/,
          );
        },
      );
    } finally {
      await pool.end();
    }
  },
);
