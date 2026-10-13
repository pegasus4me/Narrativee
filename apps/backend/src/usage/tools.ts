import { z } from "zod";
import { AccessError } from "../billing/catalog";
import { usageContext } from "./operations";
import { reserve, recordCall } from "./ledger";
const schema = z.record(
  z.string(),
  z.object({
    microdollars: z.number().int().nonnegative(),
    version: z.string().min(1),
    source: z.string().url(),
    verifiedAt: z.string().datetime(),
  }),
);
export async function meteredTool<T>(
  tool: string,
  work: () => Promise<T>,
): Promise<T> {
  const context = usageContext.getStore();
  if (!context?.operationId)
    throw new AccessError(
      "PAYMENT_REQUIRED",
      "Sign in before starting research.",
    );
  const rate = schema.parse(JSON.parse(process.env.AI_TOOL_RATES_JSON ?? "{}"))[
    tool
  ];
  if (!rate)
    throw new AccessError(
      "TOOL_UNPRICED",
      `${tool} has no verified provider-cost configuration.`,
      503,
    );
  const id = await reserve(
    context.operationId,
    tool,
    rate,
    Math.max(1, rate.microdollars),
  );
  try {
    const result = await work();
    await recordCall(id, rate.microdollars, { tool, completed: true });
    return result;
  } catch (error) {
    await recordCall(id, 0, { tool, completed: false, costUnknown: true });
    throw error;
  }
}
