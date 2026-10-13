import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import express from "express";
import cookieParser from "cookie-parser";
import { Pool } from "pg";
import sharp from "sharp";
import type { CampaignPlan } from "../src/studio/campaign/campaign.types";
import type { CampaignOutput } from "../src/studio/campaign/campaign.output";

test(
  "campaign generation uses visual references, optional research, bounded calls and private revision-safe saving",
  { skip: !process.env.TEST_DATABASE_URL },
  async () => {
    const url = process.env.TEST_DATABASE_URL!;
    assert.match(
      new URL(url).pathname,
      /^\/campaign_flow_test_[a-z0-9_]+$/,
      "Use an isolated empty campaign_flow_test_* database",
    );
    process.env.LOCAL_DATABASE_URL = url;
    process.env.NODE_ENV = "test";
    process.env.BETTER_AUTH_SECRET =
      "isolated-campaign-test-secret-000000000000";
    process.env.BETTER_AUTH_URL = "http://localhost:3002";
    process.env.OPENAI_API_KEY = "test-no-network";
    process.env.TYPESAFE_API_KEY = "test-no-network";
    process.env.GOOGLE_FONTS_API_KEY = "test-no-network";
    for (const key of [
      "R2_ACCOUNT_ID",
      "R2_ACCESS_KEY_ID",
      "R2_SECRET_ACCESS_KEY",
      "R2_BUCKET",
    ])
      delete process.env[key];
    const directory = await mkdtemp(
      join(tmpdir(), "narrativee-campaign-test-"),
    );
    process.env.BRAND_BRAIN_LOCAL_DIR = directory;
    const pool = new Pool({ connectionString: url });
    assert.equal(
      (await pool.query("SELECT to_regclass('public.brand') AS existing"))
        .rows[0].existing,
      null,
    );
    for (const file of [
      "0000_windy_toxin.sql",
      "0004_site_analysis.sql",
      "0005_competitor_analysis.sql",
      "0006_brands.sql",
      "0007_discovery_messages.sql",
      "0008_studio_projects.sql",
      "0010_brand_brain.sql",
      "0011_brand_brain_discovery.sql",
      "0012_studio_canvas.sql",
      "0014_studio_message_agent.sql",
      "0015_studio_agent_threads.sql",
      "0016_studio_agent_settings.sql",
      "0017_studio_media_models.sql",
      "0018_studio_approvals.sql",
      "0019_trial_credits.sql",
      "0020_studio_project_title.sql",
      "0021_billing.sql",
      "0023_brand_products.sql",
    ])
      await pool.query(await readFile(`drizzle/${file}`, "utf8"));
    const { auth } = await import("../src/auth/auth");
    const { toNodeHandler } = await import("better-auth/node");
    const { createStudioRouter } = await import("../src/studio/studio.routes");
    const { brandRouter } = await import("../src/brands/brand.routes");
    const { storeProjectImage, readProjectImage } = await import(
      "../src/studio/canvas/canvas.service"
    );
    const { uploadAsset, readAsset } = await import(
      "../src/brand-brain/storage"
    );
    const app = express();
    app.use(cookieParser());
    app.all("/api/auth/*splat", toNodeHandler(auth));
    app.use(express.json({ limit: "2mb" }));
    app.use("/api/studio/projects", createStudioRouter());
    app.use("/api/brands", brandRouter);
    const server = app.listen(0, "127.0.0.1");
    await new Promise<void>((resolve) => server.once("listening", resolve));
    const address = server.address();
    assert.ok(address && typeof address !== "string");
    const base = `http://127.0.0.1:${address.port}/api`;
    const originalFetch = globalThis.fetch;
    const png = await sharp({
      create: { width: 16, height: 16, channels: 4, background: "#123456" },
    })
      .png()
      .toBuffer();
    const sourceId = randomUUID();
    const productId = randomUUID();
    let planned: CampaignPlan;
    let planningOutputs: CampaignOutput[] = [];
    let hasCompetitorEvidence = false;
    let planningCalls = 0;
    let refinementCalls = 0;
    let researchCalls = 0;
    let imageCalls = 0;
    let repairedJudgments = 0;
    let flaggedBrandReviews = 0;
    let persistentReview = false;
    let detailedReviews = 0;
    let failImage = false;
    let visualReviews = 0;
    let directRun = false;
    let directPlanningCalls = 0;
    let visualDefects = 0;
    let failVisualReview = false;
    let duringImageGeneration: (() => Promise<void>) | undefined;
    let uploadedId = "";
    let collaborativeRun = false;
    let identityPlanningCalls = 0;
    let logoCalls = 0;
    const identityPlan = {
      directions: ["Product Focus", "Open Signal", "Clear System"].map(
        (name) => ({
          name,
          strategicAngle:
            "A grounded visual identity for the supplied real product.",
          markIdea: "Two purposeful parallel forms with clear negative space.",
        }),
      ),
    };
    const discussionBrief =
      "Sage, discuss the launch direction without creating artwork";
    const providerUsage = {
      input_tokens: 200,
      output_tokens: 10,
      input_tokens_details: { text_tokens: 200, image_tokens: 0 },
    };
    const json = (value: Record<string, unknown>) =>
      new Response(
        JSON.stringify(
          Array.isArray(value.output) || Array.isArray(value.data)
            ? { ...value, usage: providerUsage }
            : value,
        ),
        {
          headers: { "Content-Type": "application/json" },
        },
      );
    globalThis.fetch = async (input, init) => {
      const target = String(input instanceof Request ? input.url : input);
      if (target.includes("www.googleapis.com/webfonts"))
        return json({
          items: [
            {
              family: "Instrument Sans",
              category: "sans-serif",
              variants: ["regular", "700"],
            },
          ],
        });
      if (target.includes("api.typesafe.ai")) {
        const body = JSON.parse(String(init?.body));
        if (body.questions.intent)
          return json({
            answers: {
              intent: {
                type: "choice",
                choice: String(body.state.request).includes(
                  "identity checkpoint",
                )
                  ? "logo_exploration"
                  : body.state.request === discussionBrief
                    ? "conversation"
                    : "campaign_creation",
                confidence: 1,
              },
            },
          });
        if (body.state.directions)
          return json({
            answers: Object.fromEntries(
              Object.keys(body.questions).map((name) => [
                name,
                { type: "score", score: 3, confidence: 1 },
              ]),
            ),
          });
        assert.equal(
          body.state.brain.approvedRules[0].content,
          "Primary: #123456",
        );
        assert.ok(body.state.plan.creatives[0].imagePrompt);
        assert.ok(
          body.state.references.some(
            (reference: { id: string; kind: string }) =>
              reference.id === uploadedId && reference.kind === "project",
          ),
        );
        assert.ok(
          !JSON.stringify(body.state.references).includes("data:image"),
          "Plan review receives reference metadata, not image bytes",
        );
        repairedJudgments++;
        const brandScore = flaggedBrandReviews > 0 || persistentReview ? 1 : 3;
        if (flaggedBrandReviews > 0) flaggedBrandReviews--;
        return json({
          answers: Object.fromEntries(
            Object.keys(body.questions).map((name) => [
              name,
              {
                type: "score",
                score: name === "brandFit" ? brandScore : 3,
                confidence: 1,
              },
            ]),
          ),
        });
      }
      if (target.includes("api.openai.com/v1/responses")) {
        if (target.endsWith("/input_tokens"))
          return json({ input_tokens: 200 });
        const body = JSON.parse(String(init?.body));
        if (body.text?.format.name === "campaign_image_review") {
          visualReviews++;
          assert.equal(body.input[1].content[1].type, "input_image");
          assert.match(
            body.input[1].content[1].image_url,
            /^data:image\/png;base64,/,
          );
          if (failVisualReview)
            return new Response("Unavailable", { status: 503 });
          const issues =
            visualDefects-- > 0
              ? [
                  {
                    dimension: "copy",
                    severity: "major",
                    problem: "Headline is misspelled.",
                    correction: "Render Meet Acme exactly.",
                  },
                ]
              : [];
          return json({
            id: "resp_visual_review",
            object: "response",
            status: "completed",
            output: [
              {
                id: "msg_visual_review",
                type: "message",
                role: "assistant",
                status: "completed",
                content: [
                  {
                    type: "output_text",
                    annotations: [],
                    text: JSON.stringify({
                      summary: issues.length
                        ? "The headline needs correction."
                        : "No observable defects.",
                      issues,
                    }),
                  },
                ],
              },
            ],
          });
        }
        if (body.text?.format.name === "campaign_review") {
          detailedReviews++;
          const review = JSON.parse(body.input[1].content);
          assert.deepEqual(review.dimensions, ["brandFit"]);
          if (!persistentReview)
            assert.match(review.plan.creatives[0].imagePrompt, /deep blue/);
          return json({
            id: "resp_review",
            object: "response",
            status: "completed",
            output: [
              {
                id: "msg_review",
                type: "message",
                status: "completed",
                role: "assistant",
                content: [
                  {
                    type: "output_text",
                    annotations: [],
                    text: JSON.stringify({
                      issues: [
                        {
                          dimension: "brandFit",
                          problem: persistentReview
                            ? "The headline is too broad for the supplied business offering."
                            : "Supporting artwork uses deep blue instead of the approved primary color.",
                          evidence: persistentReview
                            ? "The supplied offering is a product for teams."
                            : "Primary: #123456",
                          correction: persistentReview
                            ? "Make the team use case explicit in the headline."
                            : "Use #123456 in imagePrompt, keeping the composition and source imagery.",
                        },
                      ],
                    }),
                  },
                ],
              },
            ],
          });
        }
        if (collaborativeRun && body.tools) {
          const system = body.input[0].content;
          const handoffs = body.input.filter(
            (item: { type?: string }) => item.type === "function_call_output",
          );
          let reply = "";
          let output: object[] = [];
          if (system.includes("You are Scout"))
            reply =
              "Scout finding: introduce the verified offering; do not invent competitor claims.";
          else if (system.includes("You are Pixel")) {
            assert.match(JSON.stringify(body.input), /Scout finding/);
            reply =
              "Pixel direction: a product-led composition with the approved #123456 palette.";
          } else if (handoffs.length < 3) {
            const name =
              handoffs.length === 2 ? "propose_visual" : "delegate_agent";
            const arguments_ =
              handoffs.length === 0
                ? {
                    agent: "research",
                    task: "Validate our launch angle using the supplied brand evidence",
                  }
                : handoffs.length === 1
                  ? {
                      agent: "creator",
                      task: `Develop a composition from Scout finding: introduce the verified offering without competitor claims`,
                    }
                  : {
                      kind: "campaign_creation",
                      brief:
                        "Sage's chosen product-led launch. Use Scout's verified offering and Pixel's approved #123456 palette.",
                    };
            output = [
              {
                type: "function_call",
                id: `fc_${handoffs.length}`,
                call_id: `call_${handoffs.length}`,
                name,
                arguments: JSON.stringify(arguments_),
              },
            ];
          } else {
            const discussion = body.input.some(
              (item: { role?: string; content?: string }) =>
                item.role === "user" && item.content === discussionBrief,
            );
            assert.match(
              JSON.stringify(handoffs),
              discussion ? /does not authorize/ : /Proposed direction/,
            );
            reply = discussion
              ? "Here is the direction. No new artwork was created."
              : "The proposed direction uses Scout's findings. Review it and approve before Pixel creates it.";
          }
          return new Response(
            [
              ...(reply
                ? [
                    `event: response.output_text.delta\ndata: ${JSON.stringify({ type: "response.output_text.delta", delta: reply })}\n\n`,
                  ]
                : []),
              `event: response.completed\ndata: ${JSON.stringify({ type: "response.completed", response: { id: "collaboration", status: "completed", output, usage: providerUsage } })}\n\n`,
            ].join(""),
            { headers: { "Content-Type": "text/event-stream" } },
          );
        }

        if (["identity_plan", "logo_scene"].includes(body.text.format.name)) {
          const isPlan = body.text.format.name === "identity_plan";
          let payload: unknown = identityPlan;
          if (isPlan) identityPlanningCalls++;
          else {
            logoCalls++;
            assert.ok(
              identityPlan.directions.some(
                (direction) =>
                  direction.name ===
                  JSON.parse(body.input[1].content).selectedDirection.name,
              ),
            );
            payload = {
              background: "#FFFFFF",
              foreground: "#123456",
              accent: "#123456",
              fontFamily: "Instrument Sans",
              fontWeight: 600,
              letterSpacing: 2,
              paths: [
                {
                  d: "M 20 20 L 180 20 L 180 180 L 20 180 Z",
                  fill: "none",
                  stroke: "foreground",
                  strokeWidth: 8,
                },
              ],
            };
          }
          return json({
            id: "identity_response",
            object: "response",
            status: "completed",
            output: [
              {
                id: "identity_message",
                type: "message",
                status: "completed",
                role: "assistant",
                content: [
                  {
                    type: "output_text",
                    text: JSON.stringify(payload),
                    annotations: [],
                  },
                ],
              },
            ],
          });
        }
        if (body.text.format.name === "creative_research") {
          researchCalls++;
          assert.equal(
            JSON.parse(body.input[1].content).products[0].name,
            "Orange chocolate",
          );
          assert.match(body.input[0].content, /Never claim an ad is active/);
          assert.equal(
            Boolean(JSON.parse(body.input[1].content).competitorAnalysis),
            hasCompetitorEvidence,
          );
          return json({
            id: "resp_research",
            object: "response",
            status: "completed",
            output: [
              {
                id: "msg_research",
                type: "message",
                status: "completed",
                role: "assistant",
                content: [
                  {
                    type: "output_text",
                    text: JSON.stringify({
                      summary:
                        "No competitor scan is available. Acme's brand context is the starting point.",
                      creativeAngle:
                        "Introduce the real offering with a clear headline.",
                      limitations: [
                        "No conversion performance data is available.",
                      ],
                    }),
                    annotations: [],
                  },
                ],
              },
            ],
          });
        }
        planningCalls++;
        assert.equal(
          JSON.parse(body.input[1].content[0].text).brain.products[0]
            .description,
          "Dark chocolate with orange, 100 g",
        );
        if (directRun) {
          directPlanningCalls++;
          assert.equal(
            JSON.parse(body.input[1].content[0].text).creativeResearch,
            undefined,
          );
        } else {
          assert.equal(
            JSON.parse(body.input[1].content[0].text).creativeResearch
              .creativeAngle,
            "Introduce the real offering with a clear headline.",
            "Creator receives Research's structured handoff",
          );
        }
        assert.ok(
          body.input[1].content.some(
            (part: { type: string }) => part.type === "input_image",
          ),
        );
        assert.equal(
          Boolean(JSON.parse(body.input[1].content[0].text).competitorAnalysis),
          hasCompetitorEvidence,
        );
        if (uploadedId) {
          const references = JSON.parse(
            body.input[1].content[0].text,
          ).references;
          assert.equal(
            references.length,
            directRun ? 1 : 9,
            "Planning retains the wider inventory instead of truncating it to six image attachments",
          );
          assert.ok(
            references.some(
              (reference: { id: string; kind: string; caption: string }) =>
                reference.id === uploadedId &&
                reference.kind === "project" &&
                reference.caption ===
                  (directRun
                    ? "Selected product reference: product.png"
                    : "product.png"),
            ),
          );
          assert.ok(
            body.input[1].content.filter(
              (part: { type: string }) => part.type === "input_image",
            ).length >= (directRun ? 1 : 2),
            "The model receives upload pixels alongside approved brand imagery",
          );
        }
        planningOutputs = JSON.parse(body.input[1].content[0].text).outputs.map(
          ({
            platformName: _label,
            ...output
          }: CampaignOutput & { platformName: string }) => output,
        );
        const payload = structuredClone(planned);
        const planningInput = JSON.parse(body.input[1].content[0].text);
        if (planningInput.previousPlan) {
          refinementCalls++;
          if (persistentReview) {
            assert.match(
              planningInput.revisionFeedback.join(" "),
              /team use case/,
            );
          } else {
            assert.match(
              planningInput.revisionFeedback.join(" "),
              /Primary: #123456/,
            );
            assert.match(
              planningInput.previousPlan.creatives[0].imagePrompt,
              /deep blue/,
            );
            assert.match(
              planningInput.revisionFeedback.join(" "),
              /Use #123456 in imagePrompt/,
            );
            payload.creatives![0]!.imagePrompt =
              payload.creatives![0]!.imagePrompt.replace(
                "deep blue",
                "#123456",
              );
          }
        }
        if (payload.creatives) {
          const baseCreative = payload.creatives[0]!;
          if (directRun) baseCreative.referenceIds = [uploadedId];
          payload.creatives = planningOutputs.map((_, index) => ({
            ...structuredClone(baseCreative),
            direction: {
              recipeId: "studio-product",
              subject: baseCreative.imagePrompt,
              composition:
                "One dominant product with clear hierarchy and generous whitespace.",
              lightingAndMaterials: "Controlled studio lighting.",
              typography: "Bold brand typography with a short headline.",
              palette: ["#123456"],
              avoid: ["Decorative panels"],
            },
            references: baseCreative.referenceIds.map((id) => ({
              id,
              role: id === uploadedId ? "product" : "logo",
              instruction: "Preserve the actual supplied subject and identity.",
            })),
            unusedReferences: planningInput.references
              .filter(
                (reference: { id: string }) =>
                  !baseCreative.referenceIds.includes(reference.id),
              )
              .map((reference: { id: string }) => ({
                id: reference.id,
                reason: "Not relevant to this product launch.",
              })),
            name: `${baseCreative.name} ${index + 1}`,
          }));
        }
        return json({
          id: "resp_test",
          object: "response",
          status: "completed",
          output: [
            {
              id: "msg_test",
              type: "message",
              status: "completed",
              role: "assistant",
              content: [
                {
                  type: "output_text",
                  text: JSON.stringify(payload),
                  annotations: [],
                },
              ],
            },
          ],
        });
      }
      if (target.includes("api.openai.com/v1/images/")) {
        imageCalls++;
        const editCanvas = duringImageGeneration;
        duringImageGeneration = undefined;
        await editCanvas?.();
        assert.ok(
          init?.body instanceof FormData,
          "Real logo/product pixels are passed as image references",
        );
        const body = init.body;
        assert.equal(body.get("n"), "1");
        assert.equal(
          body.get("model"),
          "gpt-image-2",
          "Pixel uses the saved image model",
        );
        assert.match(String(body.get("prompt")), /complete finished creative/);
        assert.match(String(body.get("prompt")), /Meet Acme/);
        assert.doesNotMatch(
          String(body.get("prompt")),
          /Supporting artwork only/,
        );
        assert.equal(
          body.getAll("image[]").length,
          (String(body.get("prompt")).includes("EDIT:") ? 1 : 0) +
            (directRun ? 1 : 2),
        );
        if (failImage)
          return new Response(
            JSON.stringify({
              error: { message: "Image provider failed", type: "server_error" },
            }),
            { status: 500 },
          );
        return json({ data: [{ b64_json: png.toString("base64") }] });
      }
      return originalFetch(input, init);
    };
    const call = (
      path: string,
      cookie = "",
      body?: unknown,
      method = body ? "POST" : "GET",
    ) =>
      fetch(`${base}${path}`, {
        method,
        headers: {
          Cookie: cookie,
          Origin: "http://localhost:3010",
          "Content-Type": "application/json",
        },
        body: body ? JSON.stringify(body) : undefined,
      });

    const parseDone = (stream: string) =>
      stream
        .split("\n")
        .filter(Boolean)
        .map((line) => JSON.parse(line))
        .find((event) => event.type === "done");
    const createAndApprove = async (
      path: string,
      cookie: string,
      body: unknown,
    ) => {
      const beforeImages = imageCalls;
      const prepared = await call(path, cookie, body);
      const proposalText = await prepared.text();
      assert.doesNotMatch(
        proposalText,
        /"type":"campaign_scene"|"type":"direction_start"/,
      );
      assert.equal(
        imageCalls,
        beforeImages,
        "Preparation waits for human approval before image generation",
      );
      const proposal = parseDone(proposalText)?.assistantMessage;
      if (!proposal?.approval)
        return new Response(proposalText, { status: prepared.status });
      assert.equal(proposal.approval.status, "pending");
      assert.ok(
        !("approvalData" in proposal),
        "Internal execution payload stays on the server",
      );
      const approval = await call(
        path.replace("/creator/stream", `/approvals/${proposal.id}/stream`),
        cookie,
        { action: "approve" },
      );
      return new Response(
        proposalText
          .split("\n")
          .filter((line) => !line.includes('"type":"done"'))
          .join("\n") +
          "\n" +
          (await approval.text()),
      );
    };
    try {
      const signup = async (email: string) => {
        const response = await call("/auth/sign-up/email", "", {
          name: "Campaign tester",
          email,
          password: "TestPassword123!",
        });
        assert.equal(response.status, 200, await response.clone().text());
        return {
          cookie: response.headers
            .getSetCookie()
            .map((value) => value.split(";")[0])
            .join("; "),
          user: (await response.json()).user,
        };
      };
      const owner = await signup("campaign-owner@example.test");
      const other = await signup("campaign-other@example.test");
      const brandId = randomUUID(),
        projectId = randomUUID();
      await pool.query(
        "INSERT INTO brand (id,name,user_id) VALUES ($1,'Acme',$2)",
        [brandId, owner.user.id],
      );
      await pool.query(
        "INSERT INTO studio_project (id,brand_id,user_id,created_at) VALUES ($1,$2,$3,now()-interval '1 day'),($4,$2,$3,now())",
        [randomUUID(), brandId, owner.user.id, projectId],
      );
      await pool.query(
        "INSERT INTO brand_brain_item (brand_id,kind,category,content) VALUES ($1,'rule','color','Primary: #123456')",
        [brandId],
      );
      await pool.query(
        "INSERT INTO brand_product (id,brand_id,name,description) VALUES ($1,$2,'Orange chocolate','Dark chocolate with orange, 100 g')",
        [productId, brandId],
      );
      const key = `${brandId}/${sourceId}.png`;
      await uploadAsset(key, png, "image/png");
      await pool.query(
        "INSERT INTO brand_brain_asset (id,brand_id,kind,category,caption,object_key,filename,mime_type,bytes,width,height) VALUES ($1,$2,'rule','identity','Approved logo',$3,'logo.png','image/png',$4,16,16)",
        [sourceId, brandId, key, png.length],
      );
      // A larger reference inventory must not hide product uploads behind the image API's attachment limit.
      for (let index = 0; index < 7; index++) {
        const inspirationId = randomUUID();
        const inspirationKey = `${brandId}/${inspirationId}.png`;
        await uploadAsset(inspirationKey, png, "image/png");
        await pool.query(
          "INSERT INTO brand_brain_asset (id,brand_id,kind,category,caption,object_key,filename,mime_type,bytes,width,height) VALUES ($1,$2,'inspiration','imagery',$3,$4,'style.png','image/png',$5,16,16)",
          [
            inspirationId,
            brandId,
            `Style reference ${index + 1}`,
            inspirationKey,
            png.length,
          ],
        );
        if (index === 0)
          await pool.query(
            "UPDATE brand_brain_asset SET kind='rule',product_id=$1 WHERE id=$2",
            [productId, inspirationId],
          );
      }
      const endpoint = `/studio/projects/${projectId}`;
      assert.equal((await call(`${endpoint}/canvas`)).status, 401);
      assert.equal(
        (await call(`${endpoint}/canvas`, other.cookie)).status,
        404,
      );
      assert.deepEqual(
        await (await call(`${endpoint}/canvas`, owner.cookie)).json(),
        { revision: 0, snapshot: null },
      );
      planned = {
        clarifyingQuestion: "Which product are we launching?",
        renderMode: "image",
        creatives: null,
      };
      let stream = await (
        await createAndApprove(`${endpoint}/creator/stream`, owner.cookie, {
          content: "Make a launch visual",
          agent: "creator",
        })
      ).text();
      assert.match(stream, /Which product/);
      const clarificationEvents = stream
        .split("\n")
        .filter(Boolean)
        .map((line) => JSON.parse(line));
      assert.equal(
        clarificationEvents.find((event) => event.type === "reply_agent").agent,
        "creator",
      );
      assert.equal(
        clarificationEvents.find((event) => event.type === "done")
          .assistantMessage.agent,
        "creator",
      );
      assert.equal(imageCalls, 0);
      const upload = (
        cookie: string,
        bytes: Uint8Array,
        contentType = "image/png",
      ) =>
        fetch(`${base}${endpoint}/assets`, {
          method: "POST",
          headers: {
            Cookie: cookie,
            Origin: "http://localhost:3010",
            "Content-Type": contentType,
          },
          body: Buffer.from(bytes),
        });
      assert.equal((await upload("", png)).status, 401);
      assert.equal((await upload(other.cookie, png)).status, 404);
      assert.equal(
        (
          await fetch(`${base}${endpoint}/assets`, {
            method: "POST",
            headers: {
              Cookie: owner.cookie,
              Origin: "https://untrusted.example",
              "Content-Type": "image/png",
            },
            body: png,
          })
        ).status,
        403,
      );
      assert.equal(
        (await upload(owner.cookie, Buffer.from("not an image"))).status,
        400,
      );
      assert.equal((await upload(owner.cookie, png, "image/jpeg")).status, 400);
      assert.equal(
        (await upload(owner.cookie, Buffer.alloc(8 * 1024 * 1024 + 1))).status,
        413,
      );
      const uploadedResponse = await upload(owner.cookie, png);
      assert.equal(uploadedResponse.status, 201);
      const uploaded = await uploadedResponse.json();
      uploadedId = uploaded.id;
      assert.equal(uploaded.width, 16);
      assert.equal(
        (await call(`${endpoint}/assets/${uploadedId}`, other.cookie)).status,
        404,
      );
      const uploadedObject = {
        type: "Image",
        width: 16,
        height: 16,
        data: { assetId: uploadedId, kind: "upload", name: "product.png" },
      };
      assert.equal(
        (
          await call(
            `${endpoint}/canvas`,
            owner.cookie,
            {
              revision: 0,
              snapshot: {
                version: 1,
                canvas: { objects: [uploadedObject] },
                viewport: [1, 0, 0, 1, 0, 0],
                favorites: [],
              },
            },
            "PUT",
          )
        ).status,
        200,
      );
      planned = {
        renderMode: "image",
        clarifyingQuestion: null,
        creatives: [
          {
            name: "Acme launch",
            concept:
              "A product-focused launch with clear typography and the brand palette.",
            copy: ["Meet Acme"],
            imagePrompt:
              "A complete Acme product launch ad in deep blue with bold Instrument Sans typography, supplied logo and product photograph, generous whitespace.",
            referenceIds: [sourceId, uploadedId],
          },
        ],
      };
      await pool.query(
        "INSERT INTO brand_agent_settings (brand_id, agent, image_model) VALUES ($1, 'creator', 'gpt-image-2')",
        [brandId],
      );
      const callsBeforeRepair = planningCalls;
      flaggedBrandReviews = 1;
      stream = await (
        await createAndApprove(`${endpoint}/creator/stream`, owner.cookie, {
          content: "We are launching Acme. Make a promotional creative.",
          agent: "creator",
        })
      ).text();
      assert.doesNotMatch(stream, /"type":"error"/);
      assert.match(stream, /Generating creative 1 of 1/);
      assert.equal(
        planningCalls,
        callsBeforeRepair + 2,
        "Only the confirmed brand conflict requires refinement; contrast repair needs no extra retry",
      );
      assert.equal(
        repairedJudgments,
        2,
        "Approval does not repeat Sage review",
      );
      assert.equal(detailedReviews, 1);
      const teamEvents = stream
        .split("\n")
        .filter(Boolean)
        .map((line) => JSON.parse(line))
        .filter((item) => item.type === "agent_activity");
      assert.ok(
        teamEvents.some(
          (item) => item.agent === "research" && item.status === "complete",
        ),
      );
      assert.ok(
        teamEvents.some(
          (item) =>
            item.agent === "brand" &&
            item.status === "complete" &&
            item.text.includes("review"),
        ),
      );
      assert.ok(
        teamEvents.some(
          (item) =>
            item.agent === "creator" &&
            item.status === "complete" &&
            item.text.includes("delivered"),
        ),
      );
      const researchHandoff = teamEvents.findIndex(
        (item) => item.agent === "research" && item.status === "complete",
      );
      const creationStart = teamEvents.findIndex(
        (item) => item.agent === "creator" && item.status === "working",
      );
      const brandReview = teamEvents.findIndex(
        (item) =>
          item.agent === "brand" &&
          item.status === "working" &&
          item.text.includes("Checking"),
      );
      assert.ok(
        researchHandoff < creationStart && creationStart < brandReview,
        "Research hands off to Creator, then Brand reviews the plan",
      );
      const event = stream
        .split("\n")
        .filter(Boolean)
        .map((line) => JSON.parse(line))
        .find((item) => item.type === "campaign_scene");
      assert.ok(event);
      assert.equal(imageCalls, 1);
      assert.equal(event.document.frames[0].layers.length, 1);
      assert.equal(event.document.frames[0].layers[0].type, "image");
      assert.deepEqual(
        (
          await pool.query(
            "SELECT content FROM brand_brain_item WHERE brand_id=$1",
            [brandId],
          )
        ).rows,
        [{ content: "Primary: #123456" }],
        "Campaign corrections do not update Brand Brain",
      );
      const images = event.document.frames[0].layers.filter(
        (layer: { type: string }) => layer.type === "image",
      );
      assert.equal(
        images.length,
        1,
        "The complete creative is one raster image, not a collection of layers",
      );
      const doneEvent = stream
        .split("\n")
        .filter(Boolean)
        .map((line) => JSON.parse(line))
        .find((item) => item.type === "done");
      assert.match(doneEvent.assistantMessage.content, /Design approach/);
      assert.equal(doneEvent.assistantMessage.agent, "creator");
      assert.equal(doneEvent.userMessage.thread, "team");
      assert.equal(doneEvent.assistantMessage.thread, "team");
      assert.match(doneEvent.assistantMessage.content, /single PNG/);
      assert.match(
        doneEvent.assistantMessage.content,
        /not separately editable/,
      );
      for (const image of images)
        assert.equal(
          (await call(`${endpoint}/assets/${image.assetId}`, owner.cookie))
            .status,
          200,
        );
      const generatedMetadata = await sharp(
        (await readProjectImage(projectId, owner.user.id, images[0].assetId))
          .bytes,
      ).metadata();
      assert.equal(generatedMetadata.width, 1080);
      assert.equal(generatedMetadata.height, 1080);
      await pool.query(
        "UPDATE brand_brain_asset SET archived_at=now() WHERE id=$1",
        [sourceId],
      );
      assert.equal(
        (await call(`${endpoint}/assets/${images[0].assetId}`, owner.cookie))
          .status,
        200,
        "Copied images survive source archive",
      );
      assert.equal(
        (await call(`${endpoint}/assets/${images[0].assetId}`, other.cookie))
          .status,
        404,
      );
      const snapshot = {
        version: 1,
        canvas: {
          objects: [
            {
              type: "Rect",
              width: 1080,
              height: 1080,
              fill: "#FFFFFF",
              data: { kind: "campaign", role: "artboard", name: "Acme launch" },
            },
            {
              type: "Image",
              width: 90,
              height: 90,
              data: { assetId: images[0].assetId },
            },
            uploadedObject,
          ],
        },
        viewport: [1, 0, 0, 1, 0, 0],
        favorites: [],
      };
      assert.equal(
        (
          await call(
            `${endpoint}/canvas`,
            owner.cookie,
            { revision: 1, snapshot },
            "PUT",
          )
        ).status,
        200,
      );
      const saved = await (
        await call(`${endpoint}/canvas`, owner.cookie)
      ).json();
      assert.equal(saved.revision, 2);
      assert.deepEqual(saved.snapshot, snapshot);
      assert.equal(
        (
          await call(
            `${endpoint}/canvas`,
            owner.cookie,
            { revision: 0, snapshot },
            "PUT",
          )
        ).status,
        409,
      );
      assert.equal(
        (
          await call(
            `${endpoint}/canvas`,
            other.cookie,
            { revision: 2, snapshot },
            "PUT",
          )
        ).status,
        404,
      );
      const foreignBrand = randomUUID(),
        foreignProject = randomUUID();
      await pool.query(
        "INSERT INTO brand (id,name,user_id) VALUES ($1,'Other',$2)",
        [foreignBrand, other.user.id],
      );
      await pool.query(
        "INSERT INTO studio_project (id,brand_id,user_id) VALUES ($1,$2,$3)",
        [foreignProject, foreignBrand, other.user.id],
      );
      const foreignImage = await storeProjectImage(
        foreignProject,
        other.user.id,
        png,
      );
      const invalid = structuredClone(snapshot);
      invalid.canvas.objects[1]!.data = { assetId: foreignImage.id };
      assert.equal(
        (
          await call(
            `${endpoint}/canvas`,
            owner.cookie,
            { revision: 2, snapshot: invalid },
            "PUT",
          )
        ).status,
        400,
      );
      const beforeFailure = (
        await pool.query(
          "SELECT count(*)::int AS count FROM studio_asset WHERE project_id=$1",
          [projectId],
        )
      ).rows[0].count;
      const { runCollaborativeConversation } = await import(
        "../src/studio/collaboration.service"
      );
      const explanation = await runCollaborativeConversation(
        projectId,
        owner.user.id,
        "Why did you choose this design?",
        () => {},
        "creator",
        undefined,
        async (system, turns) => {
          assert.match(system, /studioMode.*creation/);
          assert.match(system, /Acme launch/);
          assert.match(system, /product.png/);
          assert.match(system, /Canvas metadata is not a screenshot/);
          assert.match(
            system,
            /Design approach/,
            "Individual follow-ups receive the shared team's design justification",
          );
          return "The headline leads the composition, using the supplied palette and your product image.";
        },
      );
      assert.match(explanation!.assistantMessage.content, /headline leads/);
      assert.equal(
        imageCalls,
        1,
        "Explaining the design does not generate another image",
      );
      await pool.query(
        "UPDATE brand_brain_asset SET archived_at=NULL WHERE id=$1",
        [sourceId],
      );
      // Editorial concerns are a normal Sage conversation, never a failed request.
      const imagesBeforeFeedback = imageCalls;
      const planningBeforeFeedback = planningCalls;
      persistentReview = true;
      const reviewedStream = await (
        await call(`${endpoint}/creator/stream`, owner.cookie, {
          content: "Make a clearer business creative.",
          agent: "creator",
        })
      ).text();
      const feedbackDone = parseDone(reviewedStream);
      assert.doesNotMatch(
        reviewedStream,
        /"type":"error"|"type":"campaign_scene"/,
      );
      assert.match(
        reviewedStream,
        /"type":"conversation_thread","thread":"team"/,
      );
      assert.equal(feedbackDone.userMessage.thread, "team");
      assert.equal(feedbackDone.assistantMessage.thread, "team");
      assert.equal(feedbackDone.assistantMessage.agent, "brand");
      assert.match(feedbackDone.assistantMessage.content, /team use case/);
      assert.equal(feedbackDone.assistantMessage.approval, null);
      assert.equal(
        planningCalls,
        planningBeforeFeedback + 2,
        "Review receives one refinement, then asks the human in chat",
      );
      assert.deepEqual(
        feedbackDone.collaborationMessages.map(
          (message: { agent: string }) => message.agent,
        ),
        ["research", "creator", "brand", "creator"],
      );
      assert.ok(
        feedbackDone.collaborationMessages.every(
          (message: { thread: string }) => message.thread === "team",
        ),
      );
      const previewMessages = reviewedStream
        .split("\n")
        .filter(Boolean)
        .map((line) => JSON.parse(line))
        .filter((event) => event.type === "team_message");
      assert.deepEqual(
        previewMessages.map(({ agent, content }) => ({ agent, content })),
        feedbackDone.collaborationMessages.map(
          ({ agent, content }: { agent: string; content: string }) => ({
            agent,
            content,
          }),
        ),
        "Live team messages persist in the same order",
      );
      const reopenedFeedback = await (
        await call(endpoint, owner.cookie)
      ).json();
      assert.ok(
        reopenedFeedback.messages.some(
          (message: { id: string; thread: string }) =>
            message.id === feedbackDone.assistantMessage.id &&
            message.thread === "team",
        ),
      );

      persistentReview = false;

      for (const [imageModel, label] of [
        ["nano-banana", "Nano Banana"],
        ["seedream", "Seedream"],
      ]) {
        await pool.query(
          "UPDATE brand_agent_settings SET image_model=$2 WHERE brand_id=$1 AND agent='creator'",
          [brandId, imageModel],
        );
        const messagesBefore = await pool.query(
          "SELECT id FROM studio_message WHERE project_id=$1 ORDER BY id",
          [projectId],
        );
        const blocked = await (
          await createAndApprove(`${endpoint}/creator/stream`, owner.cookie, {
            content: "Create another launch visual",
          })
        ).text();
        assert.match(blocked, /"type":"error"/);
        assert.ok(blocked.includes(`${label} is not connected yet`));
        assert.doesNotMatch(blocked, /"type":"campaign_scene"/);
        assert.equal(
          imageCalls,
          1,
          "External image selection must not call OpenAI",
        );
        const messagesAfter = (
          await pool.query(
            "SELECT id, approval_status FROM studio_message WHERE project_id=$1 ORDER BY sequence",
            [projectId],
          )
        ).rows;
        assert.ok(
          messagesBefore.rows.every((previous) =>
            messagesAfter.some((saved) => saved.id === previous.id),
          ),
          "A failed approval preserves prior conversations",
        );
        assert.equal(
          messagesAfter.length,
          messagesBefore.rows.length + 5,
          "The reviewed proposal and team discussion remain saved when execution fails",
        );
        assert.equal(messagesAfter.at(-1).approval_status, "failed");
        assert.equal(
          (
            await pool.query(
              "SELECT count(*)::int AS count FROM studio_asset WHERE project_id=$1",
              [projectId],
            )
          ).rows[0].count,
          beforeFailure,
        );
        assert.deepEqual(
          (await (await call(`${endpoint}/canvas`, owner.cookie)).json())
            .snapshot,
          snapshot,
        );
      }
      await pool.query(
        "UPDATE brand_agent_settings SET image_model='gpt-image-2' WHERE brand_id=$1 AND agent='creator'",
        [brandId],
      );
      failImage = true;
      stream = await (
        await createAndApprove(`${endpoint}/creator/stream`, owner.cookie, {
          content: "Create another launch visual",
        })
      ).text();
      assert.match(stream, /"type":"error"/);
      assert.equal(imageCalls, 2, "Failed image generation is not retried");
      assert.equal(
        (
          await pool.query(
            "SELECT count(*)::int AS count FROM studio_asset WHERE project_id=$1",
            [projectId],
          )
        ).rows[0].count,
        beforeFailure,
        "Failed generation cleans staged assets",
      );
      assert.deepEqual(
        (await (await call(`${endpoint}/canvas`, owner.cookie)).json())
          .snapshot,
        snapshot,
        "Failure does not overwrite saved work",
      );
      // Tagging Sage in Team prepares a direction and waits for a human decision.
      failImage = false;
      collaborativeRun = true;
      const collaborativeBrief = "Sage, create an ad from our chosen direction";
      const selectedOutputs: CampaignOutput[] = [
        {
          platform: "instagram",
          formatId: "portrait_1080",
          width: 1080,
          height: 1350,
        },
        {
          platform: "linkedin",
          formatId: "landscape_1200",
          width: 1200,
          height: 628,
        },
        { platform: "pinterest", formatId: "custom", width: 900, height: 1600 },
      ];
      const callsBeforeInvalidOutput = planningCalls;
      for (const outputs of [
        [],
        [selectedOutputs[0], selectedOutputs[0]],
        [{ ...selectedOutputs[0], width: 900 }],
      ])
        assert.equal(
          (
            await call(`${endpoint}/creator/stream`, owner.cookie, {
              content: "Make an ad",
              outputs,
            })
          ).status,
          400,
        );
      assert.equal(planningCalls, callsBeforeInvalidOutput);
      const taggedBrief = `@${collaborativeBrief}`;
      stream = await (
        await call(`${endpoint}/creator/stream`, owner.cookie, {
          content: taggedBrief,
          agent: "team",
          outputs: selectedOutputs,
        })
      ).text();
      assert.doesNotMatch(stream, /"type":"error"/);
      assert.doesNotMatch(stream, /"type":"campaign_scene"/);
      const collaborationDone = stream
        .split("\n")
        .filter(Boolean)
        .map((line) => JSON.parse(line))
        .find((event) => event.type === "done");
      assert.equal(collaborationDone.assistantMessage.agent, "brand");
      assert.equal(collaborationDone.assistantMessage.thread, "team");
      for (const agent of ["research", "brand", "creator"])
        assert.ok(
          collaborationDone.collaborationMessages.some(
            (message: { agent: string }) => message.agent === agent,
          ),
        );
      assert.ok(
        collaborationDone.collaborationMessages.every(
          (message: { thread: string }) => message.thread === "team",
        ),
      );
      assert.equal(
        (
          await pool.query(
            "SELECT count(*)::int AS count FROM studio_message WHERE project_id=$1 AND content=$2",
            [projectId, taggedBrief],
          )
        ).rows[0].count,
        1,
        "Delegation saves the original brief exactly once",
      );
      const reopenedCollaboration = await (
        await call(endpoint, owner.cookie)
      ).json();
      for (const message of collaborationDone.collaborationMessages)
        assert.ok(
          reopenedCollaboration.messages.some(
            (saved: { id: string; agent: string }) =>
              saved.id === message.id && saved.agent === message.agent,
          ),
        );

      const originalProposal = collaborationDone.collaborationMessages.find(
        (message: { approval?: { status: string } }) =>
          message.approval?.status === "pending",
      );
      assert.ok(originalProposal);
      assert.deepEqual(
        planningOutputs,
        selectedOutputs,
        "Native agent handoffs preserve every selected output",
      );
      for (const label of [
        "Instagram",
        "LinkedIn",
        "Pinterest",
        "1080 × 1350",
        "1200 × 628",
        "900 × 1600",
      ])
        assert.ok(
          originalProposal.content.includes(label),
          `Approval shows ${label}`,
        );
      assert.deepEqual(
        (
          await pool.query(
            "SELECT approval_data FROM studio_message WHERE id=$1",
            [originalProposal.id],
          )
        ).rows[0].approval_data.outputs,
        selectedOutputs,
      );
      assert.equal(
        reopenedCollaboration.messages.find(
          (message: { id: string }) => message.id === originalProposal.id,
        ).approval.status,
        "pending",
        "Pending approval survives reopening",
      );
      const approvalPath = (id: string) => `${endpoint}/approvals/${id}/stream`;
      assert.equal(
        (
          await call(approvalPath(originalProposal.id), other.cookie, {
            action: "approve",
          })
        ).status,
        404,
      );
      assert.equal(
        (
          await call(approvalPath(originalProposal.id), owner.cookie, {
            action: "approve",
            plan: planned,
          })
        ).status,
        400,
      );
      let decision = await (
        await call(approvalPath(originalProposal.id), owner.cookie, {
          action: "reject",
          feedback: "Use a quieter hierarchy and keep the product prominent",
        })
      ).text();
      assert.doesNotMatch(decision, /"type":"error"|"type":"campaign_scene"/);
      const revised = parseDone(decision).assistantMessage;
      assert.deepEqual(
        planningOutputs,
        selectedOutputs,
        "Requesting changes keeps the proposal's selected platforms and sizes",
      );
      assert.equal(
        revised.approval.status,
        "pending",
        "Revisions require new human approval",
      );
      assert.equal(
        parseDone(decision).approvalMessage.approval.status,
        "rejected",
      );
      assert.match(
        await (
          await call(approvalPath(originalProposal.id), owner.cookie, {
            action: "approve",
          })
        ).text(),
        /already been decided/,
      );
      const planningBeforeApproval = planningCalls;
      // Reviewing the canvas can save a new viewport without changing any artwork.
      const beforeViewSave = await (
        await call(`${endpoint}/canvas`, owner.cookie)
      ).json();
      const viewedSnapshot = structuredClone(beforeViewSave.snapshot);
      viewedSnapshot.viewport = [2, 0, 0, 2, 240, -160];
      viewedSnapshot.favorites = ["reviewed-frame"];
      const viewSave = await call(
        `${endpoint}/canvas`,
        owner.cookie,
        { revision: beforeViewSave.revision, snapshot: viewedSnapshot },
        "PUT",
      );
      assert.equal(viewSave.status, 200);
      const reviewsBeforeApproval = repairedJudgments;
      persistentReview = true;
      const decisions = await Promise.all([
        call(approvalPath(revised.id), owner.cookie, { action: "approve" }),
        call(approvalPath(revised.id), owner.cookie, { action: "approve" }),
      ]);
      const decisionStreams = await Promise.all(
        decisions.map((response) => response.text()),
      );
      persistentReview = false;
      assert.equal(
        repairedJudgments,
        reviewsBeforeApproval,
        "Execute an approved direction without a new subjective review",
      );
      const createdSet = decisionStreams
        .flatMap((value) =>
          value
            .split("\n")
            .filter(Boolean)
            .map((line) => JSON.parse(line)),
        )
        .find((event) => event.type === "campaign_scene");
      assert.deepEqual(
        createdSet.document.frames.map(
          (frame: { formatId: string; width: number; height: number }) => ({
            formatId: frame.formatId,
            width: frame.width,
            height: frame.height,
          }),
        ),
        selectedOutputs.map(({ platform: _platform, ...output }) => output),
        "Approval creates exactly the frozen output set",
      );
      assert.match(createdSet.document.frames[0].name, /Instagram/);
      assert.match(createdSet.document.frames[1].name, /LinkedIn/);
      assert.equal(
        decisionStreams.filter((value) =>
          value.includes('"type":"campaign_scene"'),
        ).length,
        1,
        "Concurrent approval executes once",
      );
      assert.equal(
        planningCalls,
        planningBeforeApproval,
        "Approval executes the saved plan without replanning",
      );
      const approved = parseDone(
        decisionStreams.find((value) => value.includes('"type":"done"'))!,
      );
      assert.equal(approved.approvalMessage.approval.status, "completed");
      assert.equal(approved.approvalMessage.approvedBy, owner.user.id);
      assert.ok(approved.approvalMessage.approvedAt);
      assert.match(
        await (
          await call(approvalPath(revised.id), owner.cookie, {
            action: "approve",
          })
        ).text(),
        /already been decided/,
      );

      // A canvas edit invalidates a pending plan rather than approving changed work.
      const stale = parseDone(
        await (
          await call(`${endpoint}/creator/stream`, owner.cookie, {
            content: collaborativeBrief,
            agent: "creator",
          })
        ).text(),
      ).assistantMessage;
      const savedCanvas = await (
        await call(`${endpoint}/canvas`, owner.cookie)
      ).json();
      const editedSnapshot = structuredClone(savedCanvas.snapshot);
      editedSnapshot.canvas.objects[0].fill = "#EEEEEE";
      await call(
        `${endpoint}/canvas`,
        owner.cookie,
        { revision: savedCanvas.revision, snapshot: editedSnapshot },
        "PUT",
      );
      const imagesBeforeStale = imageCalls;
      decision = await (
        await call(approvalPath(stale.id), owner.cookie, { action: "approve" })
      ).text();
      assert.doesNotMatch(decision, /"type":"error"/);
      assert.match(decision, /out of date/);
      assert.doesNotMatch(decision, /"type":"campaign_scene"/);
      assert.equal(imageCalls, imagesBeforeStale);
      assert.equal(
        (
          await pool.query(
            "SELECT approval_status FROM studio_message WHERE id=$1",
            [stale.id],
          )
        ).rows[0].approval_status,
        "rejected",
      );

      const renewed = parseDone(decision).assistantMessage;
      assert.equal(
        renewed.approval.status,
        "pending",
        "A stale approval returns a new human checkpoint, never execution",
      );
      assert.notEqual(renewed.id, stale.id);
      assert.match(renewed.content, /Review and approve this new card/);
      // Legacy failed cards have no fingerprint and remain refreshable without replaying approval.
      await pool.query(
        "UPDATE studio_message SET approval_status='failed', approval_data=approval_data - 'canvasHash' WHERE id=$1",
        [renewed.id],
      );
      const refreshedLegacy = await (
        await call(approvalPath(renewed.id), owner.cookie, {
          action: "refresh",
        })
      ).text();
      assert.doesNotMatch(
        refreshedLegacy,
        /"type":"error"|"type":"campaign_scene"/,
      );
      assert.equal(imageCalls, imagesBeforeStale);
      const recovered = parseDone(refreshedLegacy).assistantMessage;
      assert.equal(recovered.approval.status, "pending");
      assert.ok(
        (
          await pool.query(
            "SELECT approval_data FROM studio_message WHERE id=$1",
            [recovered.id],
          )
        ).rows[0].approval_data.canvasHash,
      );
      const recoveryPlans = planningCalls;
      let canvasEditedDuringGeneration: unknown;
      duringImageGeneration = async () => {
        const current = await (
          await call(`${endpoint}/canvas`, owner.cookie)
        ).json();
        const edited = structuredClone(current.snapshot);
        edited.canvas.objects[0].left = 321;
        canvasEditedDuringGeneration = edited;
        assert.equal(
          (
            await call(
              `${endpoint}/canvas`,
              owner.cookie,
              { revision: current.revision, snapshot: edited },
              "PUT",
            )
          ).status,
          200,
        );
      };
      const recoveryCreated = await (
        await call(approvalPath(recovered.id), owner.cookie, {
          action: "approve",
        })
      ).text();
      assert.doesNotMatch(recoveryCreated, /"type":"error"/);
      assert.match(recoveryCreated, /"type":"campaign_scene"/);
      assert.ok(canvasEditedDuringGeneration);
      assert.deepEqual(
        (await (await call(`${endpoint}/canvas`, owner.cookie)).json())
          .snapshot,
        canvasEditedDuringGeneration,
        "Generation emits new frames without replacing edits made during image generation",
      );
      assert.equal(
        planningCalls,
        recoveryPlans,
        "A refreshed proposal executes only after new approval and uses the saved plan",
      );

      // Old vector/layout cards become image proposals without executing the old pipeline.
      for (const legacy of [
        {
          kind: "campaign_creation",
          plan: {
            clarifyingQuestion: null,
            document: { version: 1, frames: [] },
            imageBrief: null,
          },
        },
        {
          kind: "logo_exploration",
          plan: {
            directions: [
              {
                name: "Old vector",
                strategicAngle: "Old identity direction",
                markIdea: "Old path",
              },
            ],
          },
        },
      ]) {
        const legacyCard = parseDone(
          await (
            await call(`${endpoint}/creator/stream`, owner.cookie, {
              content: "Create a complete launch image",
              agent: "creator",
            })
          ).text(),
        ).assistantMessage;
        await pool.query(
          "UPDATE studio_message SET approval_data=jsonb_set(jsonb_set(approval_data,'{kind}',$2::jsonb),'{plan}',$3::jsonb) WHERE id=$1",
          [
            legacyCard.id,
            JSON.stringify(legacy.kind),
            JSON.stringify(legacy.plan),
          ],
        );
        const imagesBeforeLegacy = imageCalls;
        const converted = await (
          await call(approvalPath(legacyCard.id), owner.cookie, {
            action: "approve",
          })
        ).text();
        assert.doesNotMatch(
          converted,
          /"type":"error"|"type":"campaign_scene"|"type":"direction_path"/,
        );
        const convertedDone = parseDone(converted);
        assert.equal(convertedDone.approvalMessage.approval.status, "rejected");
        assert.equal(convertedDone.assistantMessage.approval.status, "pending");
        assert.equal(
          imageCalls,
          imagesBeforeLegacy,
          "A migrated proposal needs a new approval before image generation",
        );
        const payload = (
          await pool.query(
            "SELECT approval_data FROM studio_message WHERE id=$1",
            [convertedDone.assistantMessage.id],
          )
        ).rows[0].approval_data;
        assert.equal(payload.plan.renderMode, "image");
      }

      const callsBeforeDiscussion = { planningCalls, imageCalls };
      const discussion = await (
        await call(`${endpoint}/creator/stream`, owner.cookie, {
          content: discussionBrief,
          agent: "brand",
        })
      ).text();
      assert.doesNotMatch(discussion, /"type":"error"|"type":"campaign_scene"/);
      assert.match(discussion, /No new artwork was created/);
      assert.deepEqual(
        { planningCalls, imageCalls },
        callsBeforeDiscussion,
        "A model-requested tool cannot turn user discussion into creation",
      );
      const discussionDone = discussion
        .split("\n")
        .filter(Boolean)
        .map((line) => JSON.parse(line))
        .find((event) => event.type === "done");
      assert.deepEqual(
        discussionDone.collaborationMessages.map(
          (message: { agent: string }) => message.agent,
        ),
        ["brand", "research", "brand", "creator", "brand"],
      );

      hasCompetitorEvidence = true;
      const evidence = {
        statement: "Acme makes a real product",
        sourceUrl: "https://acme.example",
        sourceText: "Product description",
      };
      await pool.query(
        "INSERT INTO site_analysis (brand_id, url, status, diagnosis, competitor_analysis) VALUES ($1, 'https://acme.example', 'completed', $2, $3)",
        [
          brandId,
          JSON.stringify({
            companyName: "Acme",
            summary: "A real product for teams",
            observations: [
              {
                type: "product",
                statement: evidence.statement,
                confidence: 0.9,
                evidence: [evidence],
              },
            ],
            inferences: [],
            contradictions: [],
            openQuestions: [],
          }),
          JSON.stringify({
            competitors: [
              {
                name: "Peer",
                url: "https://peer.example",
                positioning: "Technical product",
                audience: "Teams",
                primaryClaim: "Clear workflow",
                voice: ["direct"],
                visualPatterns: ["simple shapes"],
                evidence: [evidence],
              },
            ],
            categoryPatterns: [],
            similarities: [],
            differentiationOpportunities: [],
            caveats: [],
          }),
        ],
      );
      const identityProposalText = await (
        await call(`${endpoint}/creator/stream`, owner.cookie, {
          content:
            "Create three new logo directions for the identity checkpoint",
          agent: "creator",
        })
      ).text();
      assert.doesNotMatch(
        identityProposalText,
        /"type":"error"|"type":"direction_start"/,
      );
      const identityProposal = parseDone(identityProposalText).assistantMessage;
      assert.equal(identityProposal.approval.kind, "campaign_creation");
      assert.equal(
        logoCalls,
        0,
        "Logo geometry is not generated before approval",
      );
      const identityPlansBeforeApproval = planningCalls;
      const imagesBeforeIdentity = imageCalls;
      const identityCanvas = await (
        await call(`${endpoint}/canvas`, owner.cookie)
      ).json();
      const identityView = structuredClone(identityCanvas.snapshot);
      identityView.viewport = [0.75, 0, 0, 0.75, 20, 30];
      assert.equal(
        (
          await call(
            `${endpoint}/canvas`,
            owner.cookie,
            {
              revision: identityCanvas.revision,
              snapshot: identityView,
            },
            "PUT",
          )
        ).status,
        200,
      );
      const identityCreated = await (
        await call(approvalPath(identityProposal.id), owner.cookie, {
          action: "approve",
        })
      ).text();
      assert.doesNotMatch(identityCreated, /"type":"error"/);
      assert.match(identityCreated, /"type":"campaign_scene"/);
      assert.doesNotMatch(identityCreated, /"type":"direction_path"/);
      assert.equal(
        logoCalls,
        0,
        "New logo requests use GPT Images rather than SVG geometry",
      );
      assert.equal(imageCalls, imagesBeforeIdentity + 1);
      assert.equal(
        planningCalls,
        identityPlansBeforeApproval,
        "Approval uses the saved image direction",
      );
      assert.equal(
        parseDone(identityCreated).approvalMessage.approval.status,
        "completed",
      );
      const declined = parseDone(
        await (
          await call(`${endpoint}/creator/stream`, owner.cookie, {
            content: "Create a fresh identity checkpoint",
            agent: "creator",
          })
        ).text(),
      ).assistantMessage;
      const declinedStream = await (
        await call(approvalPath(declined.id), owner.cookie, {
          action: "reject",
        })
      ).text();
      assert.doesNotMatch(declinedStream, /"type":"direction_start"/);
      assert.equal(
        parseDone(declinedStream).approvalMessage.approval.status,
        "rejected",
      );
      assert.equal(logoCalls, 0, "Declining creates no vector logos");
      assert.equal(
        imageCalls,
        imagesBeforeIdentity + 1,
        "Declining creates no additional images",
      );

      // Finished-image review and a bounded correction persist in Team, not as a canvas error.
      visualDefects = 1;
      const imagesBeforeCorrection = imageCalls;
      const reviewsBeforeCorrection = visualReviews;
      const correctedStream = await (
        await createAndApprove(`${endpoint}/creator/stream`, owner.cookie, {
          content: "Create a product launch with visual review.",
          agent: "creator",
        })
      ).text();
      assert.doesNotMatch(correctedStream, /"type":"error"/);
      assert.match(correctedStream, /"type":"campaign_scene"/);
      assert.equal(imageCalls, imagesBeforeCorrection + 2);
      assert.equal(visualReviews, reviewsBeforeCorrection + 2);
      const correctedDone = parseDone(correctedStream);
      assert.equal(correctedDone.approvalMessage.approval.status, "completed");
      assert.ok(
        correctedDone.collaborationMessages.some(
          (message: { agent: string; thread: string; content: string }) =>
            message.agent === "brand" &&
            message.thread === "team" &&
            message.content.includes("Headline is misspelled"),
        ),
      );
      const reopenedReview = await (await call(endpoint, owner.cookie)).json();
      assert.ok(
        reopenedReview.messages.some(
          (message: { agent: string; thread: string; content: string }) =>
            message.agent === "brand" &&
            message.thread === "team" &&
            message.content.includes("corrected-image review"),
        ),
      );
      failVisualReview = true;
      const imagesBeforeUnavailableReview = imageCalls;
      const unreviewedStream = await (
        await createAndApprove(`${endpoint}/creator/stream`, owner.cookie, {
          content: "Create another product launch.",
          agent: "creator",
        })
      ).text();
      assert.doesNotMatch(unreviewedStream, /"type":"error"/);
      assert.match(unreviewedStream, /"type":"campaign_scene"/);
      assert.equal(imageCalls, imagesBeforeUnavailableReview + 1);
      assert.equal(
        parseDone(unreviewedStream).approvalMessage.approval.status,
        "completed",
      );
      assert.match(
        parseDone(unreviewedStream).assistantMessage.content,
        /unreviewed output is a draft/,
      );
      failVisualReview = false;

      // The same authenticated endpoint executes the single workflow without a proposal.
      directRun = true;
      const quoteResponse = await call(
        `${endpoint}/generation-cost`,
        owner.cookie,
        {
          outputs: [
            {
              platform: "general",
              formatId: "square_1080",
              width: 1080,
              height: 1080,
            },
          ],
        },
      );
      assert.equal(quoteResponse.status, 200);
      assert.ok((await quoteResponse.json()).maxCredits > 0);
      assert.equal(
        (
          await call(`${endpoint}/generation-cost`, other.cookie, {
            outputs: [
              {
                platform: "general",
                formatId: "square_1080",
                width: 1080,
                height: 1080,
              },
            ],
          })
        ).status,
        404,
      );
      const researchBeforeDirect = researchCalls;
      const directStream = await (
        await call(`${endpoint}/creator/stream`, owner.cookie, {
          content: "Put our product on white sheets in morning light",
          outputs: [
            {
              platform: "general",
              formatId: "square_1080",
              width: 1080,
              height: 1080,
            },
          ],
          generation: { productId, referenceIds: [uploadedId] },
        })
      ).text();
      assert.doesNotMatch(directStream, /"type":"error"/);
      assert.equal(parseDone(directStream).assistantMessage.approval, null);
      assert.equal(researchCalls, researchBeforeDirect);
      const directScene = directStream
        .split("\n")
        .filter(Boolean)
        .map((line) => JSON.parse(line))
        .find((event) => event.type === "campaign_scene");
      assert.ok(directScene);
      const directFrame = directScene.document.frames[0];
      const directAssetId = directFrame.layers[0].assetId;
      const priorCanvas = await (
        await call(`${endpoint}/canvas`, owner.cookie)
      ).json();
      const withDirectImage = structuredClone(priorCanvas.snapshot);
      withDirectImage.canvas.objects.push({
        type: "Image",
        width: 1080,
        height: 1080,
        data: {
          assetId: directAssetId,
          kind: "campaign",
          role: "artboard",
          layerId: "creative-image",
          name: directFrame.name,
          exportWidth: 1080,
          exportHeight: 1080,
          version: directFrame.version,
        },
      });
      assert.equal(
        (
          await call(
            `${endpoint}/canvas`,
            owner.cookie,
            { revision: priorCanvas.revision, snapshot: withDirectImage },
            "PUT",
          )
        ).status,
        200,
      );
      const revisedStream = await (
        await call(`${endpoint}/creator/stream`, owner.cookie, {
          content: "Reduce the reflections and preserve everything else",
          generation: {
            productId,
            referenceIds: [uploadedId],
            editAssetId: directAssetId,
          },
        })
      ).text();
      assert.doesNotMatch(revisedStream, /"type":"error"/);
      const revisedScene = revisedStream
        .split("\n")
        .filter(Boolean)
        .map((line) => JSON.parse(line))
        .find((event) => event.type === "campaign_scene");
      assert.equal(revisedScene.document.frames[0].revisionOf, directAssetId);
      assert.equal(revisedScene.document.frames[0].version, 2);
      assert.equal(
        (await call(`${endpoint}/assets/${directAssetId}`, owner.cookie))
          .status,
        200,
        "Original pixels remain available after the retouch",
      );
      const forbiddenEdit = await (
        await call(`${endpoint}/creator/stream`, owner.cookie, {
          content: "Edit this image",
          generation: { referenceIds: [], editAssetId: foreignImage.id },
        })
      ).text();
      assert.match(forbiddenEdit, /"type":"error"/);
      directRun = false;

      const allStoredKeys = (
        await pool.query(
          "SELECT object_key FROM studio_asset WHERE project_id=$1",
          [projectId],
        )
      ).rows.map((row) => row.object_key);
      const removed = await call(
        `/brands/${brandId}`,
        owner.cookie,
        undefined,
        "DELETE",
      );
      assert.equal(removed.status, 200);
      assert.equal(
        (
          await pool.query(
            "SELECT count(*)::int AS count FROM studio_canvas WHERE project_id=$1",
            [projectId],
          )
        ).rows[0].count,
        0,
      );
      for (const objectKey of allStoredKeys)
        await assert.rejects(readAsset(objectKey), { code: "ENOENT" });
      assert.equal(
        (
          await call(
            `/studio/projects/${foreignProject}/assets/${foreignImage.id}`,
            other.cookie,
          )
        ).status,
        200,
      );
      assert.ok(planningCalls >= 3);
      assert.equal(
        researchCalls,
        planningCalls - refinementCalls - directPlanningCalls,
        "Research runs once per creative request, not again for a targeted refinement",
      );
    } finally {
      globalThis.fetch = originalFetch;
      await new Promise<void>((resolve) => server.close(() => resolve()));
      await pool.end();
      await rm(directory, { recursive: true, force: true });
    }
  },
);
