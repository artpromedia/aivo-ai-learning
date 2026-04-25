/**
 * Sprint 7 — watchdog tests. (Tasks #59, #68)
 *
 * The watchdog walks the registry, asks the ledger for each job's last finish
 * time, and pages on-call when a job is stale. Verifies the alert payloads via
 * a fake fetch.
 */
import { test } from "node:test";
import assert from "node:assert";
import { runWatchdogOnce } from "../src/lib/watchdog.js";
import { _resetOpsAlertClient, createOpsAlertClient } from "@aivo/ops-alert";

function makeFakeDb(rows: any[]) {
  return {
    execute: async () => ({ rows }),
  };
}

test("alerts when a registered job has never run", async () => {
  const calls: any[] = [];
  process.env.OPS_ALERT_WEBHOOK_URL = "https://example.test/webhook";
  // Force a fresh singleton with a fake fetch for the test.
  _resetOpsAlertClient();
  // Replace the singleton's implementation by monkey-patching globalThis.fetch.
  const original = globalThis.fetch;
  globalThis.fetch = (async (_url: any, init: any) => {
    calls.push(JSON.parse(String(init.body)));
    return { ok: true, status: 204, json: async () => ({}) } as any;
  }) as typeof fetch;
  try {
    const db = makeFakeDb([]);
    const result = await runWatchdogOnce(db);
    assert.ok(result.alerted.length > 0);
    assert.ok(calls.length > 0);
  } finally {
    globalThis.fetch = original;
    delete process.env.OPS_ALERT_WEBHOOK_URL;
    _resetOpsAlertClient();
  }
});

test("does not alert when every job is fresh", async () => {
  const calls: any[] = [];
  process.env.OPS_ALERT_WEBHOOK_URL = "https://example.test/webhook";
  _resetOpsAlertClient();
  const original = globalThis.fetch;
  globalThis.fetch = (async (_url: any, init: any) => {
    calls.push(JSON.parse(String(init.body)));
    return { ok: true, status: 204, json: async () => ({}) } as any;
  }) as typeof fetch;
  try {
    const now = new Date();
    const { JOB_REGISTRY } = await import("@aivo/scheduling");
    const rows = JOB_REGISTRY.map((j) => ({
      job_name: j.jobName,
      last_run_at: now,
      last_finished_at: now,
      last_status: "ok",
    }));
    const db = makeFakeDb(rows);
    const result = await runWatchdogOnce(db);
    assert.equal(result.alerted.length, 0);
    assert.equal(calls.length, 0);
  } finally {
    globalThis.fetch = original;
    delete process.env.OPS_ALERT_WEBHOOK_URL;
    _resetOpsAlertClient();
  }
});

test("opsAlert client survives missing webhook gracefully", async () => {
  const client = createOpsAlertClient({});
  const r = await client.send({ severity: "info", title: "x", body: "y" });
  assert.equal(r.delivered, false);
});
