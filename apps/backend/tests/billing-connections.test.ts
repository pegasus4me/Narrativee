import assert from "node:assert/strict";
import test from "node:test";
import type { PoolClient } from "pg";
import { pool } from "../src/auth/auth";
import { customerLock } from "../src/billing/checkout";
import { transaction } from "../src/usage/ledger";

test("a failed advisory unlock destroys the client instead of leaking its session", async (t) => {
  const failure = new Error("Database disconnected during unlock");
  let destroyed: boolean | undefined;
  const client = {
    query: async (sql: string) => {
      if (sql.includes("pg_advisory_unlock")) throw failure;
      return { rows: [] };
    },
    release: (destroy: boolean) => {
      destroyed = destroy;
    },
  } as unknown as PoolClient;
  t.mock.method(pool, "connect", async () => client);
  await assert.rejects(
    customerLock("test-customer", async () => "ok"),
    failure,
  );
  assert.equal(destroyed, true);
});

test("a failing payment rolls back on its existing client and releases the customer lock", async (t) => {
  const statements: string[] = [];
  const releases: boolean[] = [];
  const failure = new Error("Payment failed");
  const client = {
    query: async (sql: string) => {
      statements.push(sql);
      return { rows: [] };
    },
    release: (destroy: boolean) => releases.push(destroy),
  } as unknown as PoolClient;
  const connect = t.mock.method(pool, "connect", async () => client);
  await assert.rejects(
    customerLock("test-customer", (lockedClient) =>
      transaction(async (sqlClient) => {
        assert.equal(sqlClient, lockedClient);
        throw failure;
      }, lockedClient),
    ),
    failure,
  );
  assert.equal(connect.mock.callCount(), 1);
  assert.ok(statements.some((sql) => sql.includes("pg_advisory_lock")));
  assert.ok(statements.includes("ROLLBACK"));
  assert.ok(statements.at(-1)?.includes("pg_advisory_unlock"));
  assert.deepEqual(releases, [false]);
});
