import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import test from "node:test";
import express from "express";
import cookieParser from "cookie-parser";
import { Pool } from "pg";

test(
  "Studio projects persist conversations and isolate owners",
  { skip: !process.env.TEST_DATABASE_URL },
  async (t) => {
    const url = process.env.TEST_DATABASE_URL;
    assert.ok(
      url && /^\/studio_flow_test(?:_[a-z0-9_]+)?$/.test(new URL(url).pathname),
      "Use an empty isolated studio_flow_test database",
    );
    process.env.LOCAL_DATABASE_URL = url;
    process.env.BETTER_AUTH_SECRET =
      "isolated-studio-flow-test-secret-0000000000";
    process.env.BETTER_AUTH_URL = "http://localhost:3002";
    process.env.OPENAI_API_KEY = "test-no-network";

    const pool = new Pool({ connectionString: url });
    const existing = await pool.query(
      "SELECT to_regclass('public.studio_project') AS project",
    );
    assert.equal(existing.rows[0].project, null, "Test database must be empty");
    for (const file of [
      "0000_windy_toxin.sql",
      "0004_site_analysis.sql",
      "0005_competitor_analysis.sql",
      "0006_brands.sql",
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
      "0024_trial_allowance.sql",
    ]) {
      await pool.query(await readFile(`drizzle/${file}`, "utf8"));
    }

    // Reapplying the additive migration must preserve existing data.
    await pool.query(
      await readFile("drizzle/0015_studio_agent_threads.sql", "utf8"),
    );

    await pool.query(
      await readFile("drizzle/0016_studio_agent_settings.sql", "utf8"),
    );
    await pool.query(
      await readFile("drizzle/0018_studio_approvals.sql", "utf8"),
    );
    const nativeFetch = globalThis.fetch;
    let providerChecks = 0;
    t.mock.method(
      globalThis,
      "fetch",
      async (input: Parameters<typeof fetch>[0], init?: RequestInit) => {
        const target = String(input);
        if (target === "https://api.openai.com/v1/models")
          return Response.json({
            object: "list",
            data: [
              "gpt-6-luna",
              "gpt-image-2",
              "gpt-image-1.5",
              "sora-2",
              "sora-2-pro",
              "gpt-5-pro",
            ].map((id) => ({
              id,
              object: "model",
              created: 1,
              owned_by: "openai",
            })),
          });
        if (target === "https://api.openai.com/v1/responses/input_tokens") {
          return Response.json({ input_tokens: 100 });
        }
        if (target === "https://api.openai.com/v1/responses") {
          const body = JSON.parse(String(init?.body));
          assert.equal(body.model, "gpt-6-luna");
          assert.match(body.input[0].content, /Explain brand choices simply/);
          assert.match(body.input[0].content, /"responseLength":"brief"/);
          providerChecks++;
          return new Response(
            [
              'event: response.output_text.delta\ndata: {"type":"response.output_text.delta","delta":"Settings applied"}\n\n',
              'event: response.completed\ndata: {"type":"response.completed","response":{"id":"test","status":"completed","output":[],"usage":{"input_tokens":100,"output_tokens":10}}}\n\n',
            ].join(""),
            { headers: { "Content-Type": "text/event-stream" } },
          );
        }
        assert.ok(target.startsWith("http://127.0.0.1:"), `Unexpected external request in Studio test: ${target}`);
        return nativeFetch(input, init);
      },
    );

    const { auth } = await import("../src/auth/auth");
    const { toNodeHandler } = await import("better-auth/node");
    const { brandRouter } = await import("../src/brands/brand.routes");
    const { brandBrainRouter } = await import(
      "../src/brand-brain/brand-brain.routes"
    );
    const { createStudioRouter } = await import("../src/studio/studio.routes");
    const app = express();
    app.use(cookieParser());
    app.all("/api/auth/*splat", toNodeHandler(auth));
    app.use(express.json());
    app.use("/api/brands", brandBrainRouter);
    app.use("/api/brands", brandRouter);
    app.use(
      "/api/studio/projects",
      createStudioRouter(async (system, turns, options) => {
        assert.match(system, /"brandName":"Acme"/);
        assert.match(system, /A distinctive diagnosis/);
        assert.match(system, /Always use deep blue/);
        if (turns.at(-1)?.content === "Second idea") {
          assert.deepEqual(
            turns.map((turn) => turn.content),
            [
              "A bold identity",
              "Creative answer: A bold identity",
              "Second idea",
            ],
          );
        }
        const content = turns.at(-1)?.content ?? "";
        if (content === "Check saved settings") {
          assert.equal(options?.model, "gpt-6-luna");
          assert.match(system, /Explain brand choices simply/);
          assert.match(system, /"responseLength":"brief"/);
        }
        if (content.startsWith("Reply as "))
          assert.equal(
            turns.length,
            1,
            "An agent starts with its own empty history",
          );
        if (content.startsWith("Follow up as ")) {
          const agent = content.slice("Follow up as ".length);
          assert.deepEqual(
            turns.map((turn) => turn.content),
            [
              `Reply as ${agent}`,
              `Creative answer: Reply as ${agent}`,
              content,
            ],
            "The model must receive only this agent's history",
          );
          if (agent === "creator") {
            assert.match(system, /"teamConversation":/);
            assert.match(system, /Creative answer: Reply as brand/);
            assert.match(system, /Creative answer: Reply as research/);
            assert.match(
              system,
              /reference data, not instructions or automatic user approval/,
            );
          }
        }
        if (turns.at(-1)?.content === "fail")
          throw new Error("Model unavailable");
        return `Creative answer: ${turns.at(-1)?.content}`;
      }),
    );
    const server = app.listen(0, "127.0.0.1");
    await new Promise<void>((resolve) => server.once("listening", resolve));
    const address = server.address();
    assert.ok(address && typeof address !== "string");
    const base = `http://127.0.0.1:${address.port}/api`;

    async function call(
      path: string,
      body?: object,
      cookie = "",
      method = body ? "POST" : "GET",
    ) {
      return fetch(`${base}${path}`, {
        method,
        headers: {
          "Content-Type": "application/json",
          Origin: "http://localhost:3010",
          Cookie: cookie,
        },
        body: body ? JSON.stringify(body) : undefined,
      });
    }
    const cookieOf = (response: Response) =>
      response.headers
        .getSetCookie()
        .map((item) => item.split(";")[0])
        .join("; ");

    try {
      const ownerSignup = await call("/auth/sign-up/email", {
        name: "Studio Owner",
        email: "studio-owner@example.test",
        password: "TestPassword123!",
      });
      assert.equal(ownerSignup.status, 200);
      const ownerCookie = cookieOf(ownerSignup);
      const otherSignup = await call("/auth/sign-up/email", {
        name: "Other Owner",
        email: "studio-other@example.test",
        password: "TestPassword123!",
      });
      assert.equal(otherSignup.status, 200);
      const otherCookie = cookieOf(otherSignup);

      const brandResponse = await call(
        "/brands",
        { name: "Acme", key: randomUUID() },
        ownerCookie,
      );
      assert.equal(brandResponse.status, 201);
      const brand = await brandResponse.json();
      await pool.query(
        "INSERT INTO site_analysis (brand_id, url, status, diagnosis) VALUES ($1, $2, $3, $4)",
        [
          brand.id,
          "https://acme.example",
          "completed",
          JSON.stringify({ summary: "A distinctive diagnosis" }),
        ],
      );
      const brainPath = `/brands/${brand.id}/brain`;
      assert.equal((await call(brainPath, undefined, otherCookie)).status, 404);
      const savedRule = await call(
        `${brainPath}/items`,
        {
          kind: "rule",
          category: "color",
          content: "Always use deep blue",
        },
        ownerCookie,
      );
      assert.equal(savedRule.status, 201);
      assert.equal(
        (await (await call(brainPath, undefined, ownerCookie)).json()).items
          .length,
        1,
      );

      assert.equal(
        (await call("/studio/projects", { brandId: brand.id })).status,
        401,
      );
      assert.equal(
        (await call("/studio/projects", { brandId: randomUUID() }, ownerCookie))
          .status,
        404,
      );
      assert.equal(
        (await call("/studio/projects", { brandId: brand.id }, otherCookie))
          .status,
        404,
      );

      // Establish discovery in a separate transaction before creating a new chat.
      // Projects inserted together share a timestamp and UUID ordering is arbitrary.
      assert.equal(
        (
          await call(
            `/studio/projects?brandId=${brand.id}`,
            undefined,
            ownerCookie,
          )
        ).status,
        200,
      );
      const created = await call(
        "/studio/projects",
        { brandId: brand.id },
        ownerCookie,
      );
      assert.equal(created.status, 201);
      const project = await created.json();
      assert.equal(project.brandId, brand.id);
      const discoveryResponse = await call(
        `/studio/projects?brandId=${brand.id}`,
        undefined,
        ownerCookie,
      );
      assert.equal(discoveryResponse.status, 200);
      const discovery = await discoveryResponse.json();
      assert.notEqual(discovery.id, project.id);
      const reopenedDiscovery = await call(
        `/studio/projects?brandId=${brand.id}`,
        undefined,
        ownerCookie,
      );
      assert.equal((await reopenedDiscovery.json()).id, discovery.id);
      const chatsResponse = await call(
        `/studio/projects?brandId=${brand.id}&view=chats`,
        undefined,
        ownerCookie,
      );
      assert.equal(chatsResponse.status, 200);
      assert.deepEqual(
        (await chatsResponse.json()).map(
          (chat: { title: string }) => chat.title,
        ),
        ["Discovery", "Untitled"],
      );
      assert.equal(
        (
          await call(
            `/studio/projects?brandId=${brand.id}&view=chats`,
            undefined,
            otherCookie,
          )
        ).status,
        404,
      );
      const projectPath = `/studio/projects/${project.id}`;
      const initial = await call(projectPath, undefined, ownerCookie);
      assert.equal(initial.status, 200);
      const initialProject = await initial.json();
      assert.deepEqual(initialProject.messages, []);
      assert.equal(initialProject.project.kind, "creation");
      await t.test(
        "Project names persist, validate input and isolate owners",
        async () => {
          assert.equal(initialProject.project.title, "Untitled");
          assert.equal(
            (await call(projectPath, { title: "New name" }, "", "PATCH"))
              .status,
            401,
          );
          assert.equal(
            (
              await call(
                projectPath,
                { title: "New name" },
                otherCookie,
                "PATCH",
              )
            ).status,
            404,
          );
          for (const title of ["", "   ", "x".repeat(101), 123]) {
            assert.equal(
              (await call(projectPath, { title }, ownerCookie, "PATCH")).status,
              400,
            );
          }
          const renamed = await call(
            projectPath,
            { title: "  Summer campaign  " },
            ownerCookie,
            "PATCH",
          );
          assert.equal(renamed.status, 200);
          assert.equal((await renamed.json()).title, "Summer campaign");
          assert.equal(
            (await (await call(projectPath, undefined, ownerCookie)).json())
              .project.title,
            "Summer campaign",
          );
          const renamedChats = await (
            await call(
              `/studio/projects?brandId=${brand.id}&view=chats`,
              undefined,
              ownerCookie,
            )
          ).json();
          assert.equal(
            renamedChats.find((chat: { id: string }) => chat.id === project.id)
              .title,
            "Summer campaign",
          );
          await pool.query(
            await readFile("drizzle/0020_studio_project_title.sql", "utf8"),
          );
          assert.equal(
            (await (await call(projectPath, undefined, ownerCookie)).json())
              .project.title,
            "Summer campaign",
          );
        },
      );
      const discoveryProject = await call(
        `/studio/projects/${discovery.id}`,
        undefined,
        ownerCookie,
      );
      assert.equal((await discoveryProject.json()).project.kind, "discovery");
      assert.equal(
        (await call(projectPath, undefined, otherCookie)).status,
        404,
      );
      assert.equal(
        (
          await call(
            `${projectPath}/messages`,
            { content: "A bold identity" },
            otherCookie,
          )
        ).status,
        404,
      );

      const reply = await call(
        `${projectPath}/messages`,
        { content: "A bold identity" },
        ownerCookie,
      );
      assert.equal(reply.status, 200);
      const exchange = await reply.json();
      assert.equal(exchange.userMessage.content, "A bold identity");
      assert.equal(exchange.userMessage.thread, "team");
      assert.equal(exchange.assistantMessage.thread, "team");
      assert.equal(exchange.userMessage.agent, null);
      assert.equal(exchange.assistantMessage.agent, "brand");
      assert.equal(
        exchange.assistantMessage.content,
        "Creative answer: A bold identity",
      );
      const reopened = await call(projectPath, undefined, ownerCookie);
      assert.deepEqual(
        (await reopened.json()).messages.map(
          (message: { content: string }) => message.content,
        ),
        ["A bold identity", "Creative answer: A bold identity"],
      );

      const secondReply = await call(
        `${projectPath}/messages`,
        { content: "Second idea" },
        ownerCookie,
      );
      assert.equal(secondReply.status, 200);
      assert.equal((await secondReply.json()).assistantMessage.agent, "brand");

      const failed = await call(
        `${projectPath}/messages`,
        { content: "fail" },
        ownerCookie,
      );
      assert.equal(failed.status, 503);
      assert.equal(
        (await (await call(projectPath, undefined, ownerCookie)).json())
          .messages.length,
        4,
        "Failed generations must not persist a user message",
      );

      const second = await call(
        "/studio/projects",
        { brandId: brand.id },
        ownerCookie,
      );
      assert.equal(second.status, 201);
      const secondProject = await second.json();
      assert.deepEqual(
        (
          await (
            await call(
              `/studio/projects/${secondProject.id}`,
              undefined,
              ownerCookie,
            )
          ).json()
        ).messages,
        [],
        "Each project must have its own conversation",
      );
      const secondPath = `/studio/projects/${secondProject.id}`;
      for (const agent of ["research", "brand", "creator"] as const) {
        const response = await call(
          `${secondPath}/messages`,
          { content: `Reply as ${agent}`, agent },
          ownerCookie,
        );
        assert.equal(response.status, 200);
        const result = await response.json();
        assert.equal(result.assistantMessage.agent, agent);
        assert.equal(result.userMessage.thread, agent);
        assert.equal(result.assistantMessage.thread, agent);
        const history = await (
          await call(secondPath, undefined, ownerCookie)
        ).json();
        assert.equal(history.messages.at(-1).agent, agent);
        assert.equal(history.messages.at(-2).agent, null);
      }
      for (const agent of ["research", "brand", "creator"] as const) {
        const response = await call(
          `${secondPath}/messages`,
          { content: `Follow up as ${agent}`, agent },
          ownerCookie,
        );
        assert.equal(response.status, 200);
        const result = await response.json();
        assert.equal(result.userMessage.thread, agent);
        assert.equal(result.assistantMessage.thread, agent);
      }
      const login = await call("/auth/sign-in/email", {
        email: "studio-owner@example.test",
        password: "TestPassword123!",
      });
      assert.equal(login.status, 200);
      const persisted = await (
        await call(secondPath, undefined, cookieOf(login))
      ).json();
      assert.equal(persisted.messages.length, 12);
      for (const agent of ["research", "brand", "creator"]) {
        assert.deepEqual(
          persisted.messages
            .filter((message: { thread: string }) => message.thread === agent)
            .map((message: { content: string }) => message.content),
          [
            `Reply as ${agent}`,
            `Creative answer: Reply as ${agent}`,
            `Follow up as ${agent}`,
            `Creative answer: Follow up as ${agent}`,
          ],
        );
      }
      assert.equal(
        (
          await call(
            `${secondPath}/messages`,
            { content: "fail", agent: "research" },
            ownerCookie,
          )
        ).status,
        503,
      );
      assert.equal(
        (await (await call(secondPath, undefined, ownerCookie)).json()).messages
          .length,
        12,
      );
      assert.equal(
        (
          await call(
            `${secondPath}/messages`,
            { content: "Invalid agent", agent: "unknown" },
            ownerCookie,
          )
        ).status,
        400,
      );
      await assert.rejects(
        pool.query(
          "INSERT INTO studio_message (project_id, role, content, thread) VALUES ($1, 'user', 'Invalid', 'unknown')",
          [secondProject.id],
        ),
        /check constraint/,
      );
      await pool.query(
        "INSERT INTO studio_message (project_id, role, content) VALUES ($1, 'assistant', 'Legacy reply')",
        [secondProject.id],
      );
      const legacy = await (
        await call(secondPath, undefined, ownerCookie)
      ).json();
      assert.equal(legacy.messages.at(-1).agent, null);
      assert.equal(legacy.messages.at(-1).thread, "team");

      const settingsPath = `${secondPath}/agents/brand/settings`;
      assert.equal((await call(settingsPath)).status, 401);
      assert.equal(
        (await call(settingsPath, undefined, otherCookie)).status,
        404,
      );
      assert.equal(
        (
          await call(
            `${secondPath}/agents/team/settings`,
            undefined,
            ownerCookie,
          )
        ).status,
        400,
      );
      const defaults = await (
        await call(settingsPath, undefined, ownerCookie)
      ).json();
      assert.deepEqual(defaults.settings, {
        model: null,
        imageModel: null,
        videoModel: null,
        responseLength: "balanced",
        instructions: "",
      });
      assert.ok(defaults.models.includes("gpt-6-luna"));
      assert.ok(!defaults.models.includes("gpt-image-2"));
      assert.ok(!defaults.models.includes("gpt-5-pro"));
      assert.ok(defaults.imageModels.includes("gpt-image-2"));
      assert.ok(!defaults.imageModels.includes("gpt-image-1.5"));
      assert.ok(!defaults.imageModels.includes("nano-banana"));
      assert.ok(!defaults.imageModels.includes("seedream"));
      assert.deepEqual(defaults.videoModels, []);
      assert.equal(defaults.defaultVideoModel, "seedance");
      assert.equal(defaults.mediaModelDetails["nano-banana"].connected, false);
      assert.equal(defaults.videoGenerationAvailable, false);
      const creatorPath = `${secondPath}/agents/creator/settings`;
      const media = {
        ...defaults.settings,
        imageModel: "gpt-image-2",
        videoModel: null,
      };
      assert.equal(
        (await call(settingsPath, media, ownerCookie, "PATCH")).status,
        400,
      );
      assert.equal(
        (
          await call(
            creatorPath,
            { ...media, imageModel: "gpt-6-luna" },
            ownerCookie,
            "PATCH",
          )
        ).status,
        400,
      );
      assert.equal(
        (
          await call(
            creatorPath,
            { ...media, videoModel: "invalid-video" },
            ownerCookie,
            "PATCH",
          )
        ).status,
        400,
      );
      assert.equal(
        (await call(creatorPath, media, ownerCookie, "PATCH")).status,
        200,
      );
      assert.deepEqual(
        (await (await call(creatorPath, undefined, cookieOf(login))).json())
          .settings,
        media,
      );
      assert.equal(
        (
          await call(
            creatorPath,
            { ...media, imageModel: "seedream" },
            ownerCookie,
            "PATCH",
          )
        ).status,
        400,
      );
      await pool.query(
        "UPDATE brand_agent_settings SET video_model='sora-2-pro' WHERE brand_id=$1 AND agent='creator'",
        [secondProject.brandId],
      );
      const legacyVideo = await (
        await call(creatorPath, undefined, ownerCookie)
      ).json();
      assert.equal(legacyVideo.settings.videoModel, "seedance");
      assert.equal(legacyVideo.settings.imageModel, "gpt-image-2");
      assert.deepEqual(
        (await (await call(settingsPath, undefined, ownerCookie)).json())
          .settings,
        defaults.settings,
      );
      const mentionBrief =
        "@Scout check the evidence; @Pixel propose a hierarchy. @Scout";
      const mentioned = await (
        await call(
          `${secondPath}/messages`,
          { content: mentionBrief, agent: "brand" },
          ownerCookie,
        )
      ).json();
      assert.equal(mentioned.userMessage.content, mentionBrief);
      assert.equal(mentioned.assistantMessage.agent, "brand");
      assert.equal(mentioned.assistantMessage.thread, "team");
      assert.deepEqual(
        mentioned.collaborationMessages.map(
          (message: { agent: string }) => message.agent,
        ),
        ["research", "creator"],
      );
      const reopenedMentions = await (
        await call(secondPath, undefined, ownerCookie)
      ).json();
      for (const message of mentioned.collaborationMessages) {
        assert.equal(message.thread, "team");
        assert.ok(
          reopenedMentions.messages.some(
            (saved: { id: string; agent: string }) =>
              saved.id === message.id && saved.agent === message.agent,
          ),
        );
      }
      const teamMention = await (
        await call(
          `${secondPath}/messages`,
          { content: "@Pixel explain the proposed hierarchy" },
          ownerCookie,
        )
      ).json();
      assert.equal(teamMention.assistantMessage.agent, "creator");
      assert.equal(teamMention.assistantMessage.thread, "team");
      assert.deepEqual(teamMention.collaborationMessages, []);
      const settings = {
        model: "gpt-6-luna",
        imageModel: null,
        videoModel: null,
        responseLength: "brief",
        instructions: "Explain brand choices simply",
      };
      assert.equal(
        (await call(settingsPath, settings, otherCookie, "PATCH")).status,
        404,
      );
      assert.equal(
        (
          await call(
            settingsPath,
            { ...settings, model: "invalid-model" },
            ownerCookie,
            "PATCH",
          )
        ).status,
        400,
      );
      assert.equal(
        (
          await call(
            settingsPath,
            { ...settings, instructions: "x".repeat(2001) },
            ownerCookie,
            "PATCH",
          )
        ).status,
        400,
      );
      assert.equal(
        (
          await call(
            settingsPath,
            { ...settings, responseLength: "unknown" },
            ownerCookie,
            "PATCH",
          )
        ).status,
        400,
      );
      assert.equal(
        (await call(settingsPath, settings, ownerCookie, "PATCH")).status,
        200,
      );
      assert.deepEqual(
        (await (await call(settingsPath, undefined, cookieOf(login))).json())
          .settings,
        settings,
      );
      assert.deepEqual(
        (
          await (
            await call(
              `${projectPath}/agents/brand/settings`,
              undefined,
              ownerCookie,
            )
          ).json()
        ).settings,
        settings,
        "Same brand uses the same agent preferences across projects",
      );
      assert.deepEqual(
        (
          await (
            await call(
              `${secondPath}/agents/research/settings`,
              undefined,
              ownerCookie,
            )
          ).json()
        ).settings,
        defaults.settings,
        "Sage settings must not alter Scout",
      );
      const otherBrandResponse = await call(
        "/brands",
        { name: "Other brand", key: randomUUID() },
        ownerCookie,
      );
      const otherBrand = await otherBrandResponse.json();
      const otherProject = await (
        await call("/studio/projects", { brandId: otherBrand.id }, ownerCookie)
      ).json();
      assert.deepEqual(
        (
          await (
            await call(
              `/studio/projects/${otherProject.id}/agents/brand/settings`,
              undefined,
              ownerCookie,
            )
          ).json()
        ).settings,
        defaults.settings,
        "Preferences must not leak into another brand",
      );
      assert.equal(
        (
          await call(
            `${secondPath}/messages`,
            { content: "Check saved settings", agent: "brand" },
            ownerCookie,
          )
        ).status,
        200,
      );
      for (const endpoint of ["messages", "creator"]) {
        const streamed = await (
          await call(
            `${secondPath}/${endpoint}/stream`,
            { content: "Check saved settings", agent: "brand" },
            ownerCookie,
          )
        ).text();
        assert.doesNotMatch(streamed, /"type":"error"/);
        const done = streamed
          .trim()
          .split("\n")
          .map((line) => JSON.parse(line))
          .find((event) => event.type === "done");
        assert.ok(done);
        assert.equal(done.assistantMessage.thread, "brand");
      }
      assert.equal(
        providerChecks,
        2,
        "Both streaming paths use the saved model and instructions",
      );
      assert.equal(
        (await call(settingsPath, defaults.settings, ownerCookie, "PATCH"))
          .status,
        200,
      );
      assert.deepEqual(
        (await (await call(settingsPath, undefined, ownerCookie)).json())
          .settings,
        defaults.settings,
      );
      assert.equal(
        (
          await call(
            `/studio/projects/${otherProject.id}/agents/creator/settings`,
            settings,
            ownerCookie,
            "PATCH",
          )
        ).status,
        200,
      );
      assert.equal(
        (
          await call(
            `/brands/${otherBrand.id}`,
            undefined,
            ownerCookie,
            "DELETE",
          )
        ).status,
        200,
      );
      assert.equal(
        (
          await pool.query(
            "SELECT count(*)::int AS count FROM brand_agent_settings WHERE brand_id=$1",
            [otherBrand.id],
          )
        ).rows[0].count,
        0,
      );
    } finally {
      await new Promise<void>((resolve) => server.close(() => resolve()));
      await pool.end();
    }
  },
);
