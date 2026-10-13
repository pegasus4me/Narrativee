import "dotenv/config";
import { randomUUID } from "node:crypto";
import { spawn } from "node:child_process";
import { Pool } from "pg";
async function main() {
  const source = process.env.LOCAL_DATABASE_URL ?? process.env.DATABASE_URL;
  if (!source)
    throw new Error(
      "Configure a local Postgres connection for disposable tests",
    );
  const url = new URL(source);
  if (!["localhost", "127.0.0.1"].includes(url.hostname))
    throw new Error("Disposable tests require local Postgres");
  const suite = process.argv[2] ?? "billing";
  const options: Record<string, { file: string; prefix: string }> = {
    billing: { file: "billing.test.ts", prefix: "billing_test" },
    trial: { file: "trial-flow.test.ts", prefix: "trial_flow_test" },
    products: {
      file: "brand-brain-products.test.ts",
      prefix: "brand_products_test",
    },
    campaign: { file: "campaign-flow.test.ts", prefix: "campaign_flow_test" },
    brands: { file: "brand-flow.test.ts", prefix: "brand_flow_test" },
    studio: { file: "studio-flow.test.ts", prefix: "studio_flow_test" },
    schema: {
      file: "deployment-schema.test.ts",
      prefix: "deployment_schema_test",
    },
  };
  const suites =
    suite === "ci"
      ? [
          "schema",
          "brands",
          "products",
          "studio",
          "campaign",
          "trial",
          "billing",
        ]
      : [suite];
  if (suites.some((name) => !options[name]))
    throw new Error(`Unknown test suite: ${suite}`);
  const admin = new Pool({ connectionString: source });
  try {
    for (const suiteName of suites) {
      const selected = options[suiteName]!;
      const name = `${selected.prefix}_${randomUUID().replaceAll("-", "")}`;
      try {
        await admin.query(`CREATE DATABASE "${name}"`);
        url.pathname = `/${name}`;
        const code = await new Promise<number>((resolve, reject) => {
          const child = spawn(
            process.execPath,
            ["--import", "tsx", "--test", `tests/${selected.file}`],
            {
              stdio: "inherit",
              env: {
                ...process.env,
                TEST_DATABASE_URL: url.toString(),
                LOCAL_DATABASE_URL: url.toString(),
                NODE_ENV: "test",
                STRIPE_SECRET_KEY: "sk_test_mock_only",
                OPENAI_API_KEY: "test-no-network",
                BETTER_AUTH_SECRET:
                  "disposable-ci-auth-secret-not-for-production",
                BETTER_AUTH_URL: "http://localhost:3002",
              },
            },
          );
          child.on("error", reject);
          child.on("exit", (code) => resolve(code ?? 1));
        });
        process.exitCode = code;
        if (code !== 0) break;
      } finally {
        await admin.query(`DROP DATABASE IF EXISTS "${name}" WITH (FORCE)`);
      }
    }
  } finally {
    await admin.end();
  }
}
void main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
