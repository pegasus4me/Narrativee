import "dotenv/config";
import { verifyBillingConfiguration } from "../src/billing/readiness";
void verifyBillingConfiguration()
  .then(() =>
    console.log(
      "Billing prices, verified model rates, portal and launch checks are configured.",
    ),
  )
  .catch((error) => {
    console.error(
      error instanceof Error ? error.message : "Billing verification failed",
    );
    process.exitCode = 1;
  });
