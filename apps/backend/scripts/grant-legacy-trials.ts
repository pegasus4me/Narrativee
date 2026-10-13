import "dotenv/config";
import { pool } from "../src/auth/auth";
import { grantLegacyTrials } from "../src/billing/legacy-trials";
async function main() {
  if (!process.argv.includes("--cutover"))
    throw new Error(
      "Run with --cutover only at the approved production launch.",
    );
  console.log(
    `Enrolled ${await grantLegacyTrials()} legacy accounts. Existing trials were preserved.`,
  );
}
void main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
