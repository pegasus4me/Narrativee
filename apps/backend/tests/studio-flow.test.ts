import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import test from "node:test";
import express from "express";
import cookieParser from "cookie-parser";
import { Pool } from "pg";

test("Studio projects persist conversations and isolate owners", async () => {
  const url = process.env.TEST_DATABASE_URL;
  assert.ok(
    url && new URL(url).pathname === "/studio_flow_test",
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
  ]) {
    await pool.query(await readFile(`drizzle/${file}`, "utf8"));
  }

  const { auth } = await import("../src/auth/auth");
  const { toNodeHandler } = await import("better-auth/node");
  const { brandRouter } = await import("../src/brands/brand.routes");
  const { createStudioRouter } = await import("../src/studio/studio.routes");
  const app = express();
  app.use(cookieParser());
  app.all("/api/auth/*splat", toNodeHandler(auth));
  app.use(express.json());
  app.use("/api/brands", brandRouter);
  app.use(
    "/api/studio/projects",
    createStudioRouter(async (system, turns) => {
      assert.match(system, /"brandName":"Acme"/);
      assert.match(system, /A distinctive diagnosis/);
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

  async function call(path: string, body?: object, cookie = "") {
    return fetch(`${base}${path}`, {
      method: body ? "POST" : "GET",
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
      (await chatsResponse.json()).map((chat: { title: string }) => chat.title),
      ["Discovery", "Creation 1"],
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
    const discoveryProject = await call(
      `/studio/projects/${discovery.id}`,
      undefined,
      ownerCookie,
    );
    assert.equal((await discoveryProject.json()).project.kind, "discovery");
    assert.equal((await call(projectPath, undefined, otherCookie)).status, 404);
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

    const failed = await call(
      `${projectPath}/messages`,
      { content: "fail" },
      ownerCookie,
    );
    assert.equal(failed.status, 503);
    assert.equal(
      (await (await call(projectPath, undefined, ownerCookie)).json()).messages
        .length,
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
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
    await pool.end();
  }
});
