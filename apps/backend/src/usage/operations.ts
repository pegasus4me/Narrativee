import { AsyncLocalStorage } from "node:async_hooks";
import { createHash, randomUUID } from "node:crypto";
import { sql } from "drizzle-orm";
import { pool } from "../auth/auth";
import { AccessError, asAccessError } from "../billing/catalog";
import { assertAccess, finishOperation, snapshot, transaction } from "./ledger";

export const usageContext = new AsyncLocalStorage<{
  userId: string;
  key: string;
  operationId?: string;
}>();
export function requestKey(request: {
  get(name: string): string | undefined;
  body?: unknown;
  originalUrl: string;
}) {
  const key = request.get("idempotency-key") ?? randomUUID();
  if (key.length > 200)
    throw new AccessError(
      "INVALID_IDEMPOTENCY_KEY",
      "Invalid request key",
      400,
    );
  return createHash("sha256")
    .update(
      `${key}:${request.originalUrl}:${JSON.stringify(request.body ?? {})}`,
    )
    .digest("hex");
}
export async function billable<T>(
  userId: string,
  action: string,
  work: () => Promise<T>,
  key?: string,
): Promise<T> {
  const parent = usageContext.getStore();
  if (parent?.operationId) {
    if (parent.userId !== userId) throw new Error("Operation owner mismatch");
    return work();
  }
  const request_key = key ?? `${parent?.key ?? randomUUID()}:${action}`;
  const started = await transaction(async (client) => {
    const usage = await snapshot(client, userId);
    const {
      rows: [existing],
    } = await client.query(
      `SELECT * FROM billable_operation WHERE user_id=$1 AND request_key=$2`,
      [userId, request_key],
    );
    if (existing) return existing;
    assertAccess(usage);
    const id = randomUUID();
    const {
      rows: [operation],
    } = await client.query(
      `INSERT INTO billable_operation(id,user_id,request_key,action) VALUES($1,$2,$3,$4) RETURNING *`,
      [id, userId, request_key, action],
    );
    return { ...operation, fresh: true };
  });
  if (!started.fresh) {
    if (started.status === "completed") return started.result as T;
    throw new AccessError(
      "OPERATION_IN_PROGRESS",
      started.status === "running"
        ? "This request is already running."
        : "This attempt failed. Start a new request to retry.",
      409,
    );
  }
  const heartbeat = setInterval(() => {
    void pool
      .query(
        `UPDATE billable_operation SET heartbeat_at=now() WHERE id=$1 AND status='running'`,
        [started.id],
      )
      .catch((error) => console.error("Usage heartbeat failed", error));
  }, 30_000);
  heartbeat.unref();
  try {
    const result = await usageContext.run(
      { userId, key: request_key, operationId: started.id },
      work,
    );
    await finishOperation(started.id, result);
    return result;
  } catch (error) {
    await finishOperation(started.id, null, error);
    throw asAccessError(error) ?? error;
  } finally {
    clearInterval(heartbeat);
  }
}
// Use inside the SAME Drizzle transaction that saves a delivered result. This survives worker crashes.
export function deliveryMarker() {
  const id = usageContext.getStore()?.operationId;
  return id
    ? sql`UPDATE billable_operation SET delivered=true WHERE id=${id} AND status='running'`
    : sql`SELECT 1`;
}
