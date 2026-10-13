import { Router, type Response, type NextFunction } from "express";
import { verifyAuth, type AuthRequest } from "../middleware/auth";
import { AccessError, billingError } from "../billing/catalog";
import { assertAccess, getUsage } from "./ledger";
import { requestKey, usageContext } from "./operations";

// Retain the middleware name and trial error codes for existing API clients.
export async function requireTrialAccess(
  request: AuthRequest,
  response: Response,
  next: NextFunction,
) {
  if (!request.user) {
    response.status(401).json({ error: "Sign up or sign in before using AI." });
    return;
  }
  try {
    assertAccess(await getUsage(request.user.id));
    usageContext.run(
      { userId: request.user.id, key: requestKey(request) },
      next,
    );
  } catch (error) {
    response
      .status(error instanceof AccessError ? error.status : 503)
      .json(
        error instanceof AccessError
          ? billingError(error)
          : { error: "Unable to check your available credits" },
      );
  }
}
export const usageRouter = Router();
usageRouter.get("/", verifyAuth, async (request: AuthRequest, response) => {
  try {
    const { bucketId, ...usage } = await getUsage(request.user!.id);
    response.setHeader("Cache-Control", "no-store");
    response.json(usage);
  } catch (error) {
    console.error("Usage unavailable", error);
    response.status(503).json({ error: "Unable to load usage" });
  }
});
