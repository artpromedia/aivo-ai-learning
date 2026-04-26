/**
 * Sprint 7 — admin Background Jobs page backing routes.
 *
 *   GET  /api/admin-svc/jobs
 *        Joins the static `JOB_REGISTRY` with the live `daily_job_runs` row so
 *        every registered job appears even if it has never run, and any
 *        `daily_job_runs` row that *isn't* in the registry shows up with
 *        `unregistered: true` (Tasks #67, #77).
 *
 *   GET  /api/admin-svc/jobs/:jobName/runs?limit=20
 *        Per-job history slice from `periodic_job_runs` (Task #78). The limit
 *        is clamped to [1, 200].
 *
 *   POST /api/admin-svc/jobs/:jobName/run-now
 *        Asks the owning service to fire its job out-of-band, still under the
 *        existing advisory lock (Task #76).
 *
 *   GET  /api/admin-svc/jobs/freshness
 *        Single-pane dashboard — every monitored job with a green/red status
 *        derived from `computeFreshness` (Task #80).
 */
import type { FastifyInstance } from "fastify";
import { sql } from "drizzle-orm";
import { JOB_REGISTRY, computeFreshness } from "@aivo/scheduling";
import type { JobRegistryEntry } from "@aivo/scheduling";
import { requirePlatformAdmin } from "../lib/auth.js";

interface RunNowRequester {
  request(jobName: string, owner: JobRegistryEntry): Promise<{ ok: boolean; status?: string; error?: string }>;
}

const defaultRunNowRequester: RunNowRequester = {
  async request(jobName, owner) {
    const baseEnv = `${owner.service.replace(/-/g, "_").toUpperCase()}_URL`;
    const url = process.env[baseEnv];
    if (!url) {
      return { ok: false, error: `no ${baseEnv} configured for ${owner.service}` };
    }
    try {
      const res = await fetch(`${url}/internal/jobs/${encodeURIComponent(jobName)}/run-now`, {
        method: "POST",
        headers: { "content-type": "application/json" },
      });
      if (!res.ok) return { ok: false, error: `service returned ${res.status}` };
      const body = (await res.json().catch(() => ({}))) as { status?: string };
      return { ok: true, status: body.status };
    } catch (e) {
      return { ok: false, error: e instanceof Error ? e.message : String(e) };
    }
  },
};

export interface JobsRoutesDeps {
  runNow?: RunNowRequester;
}

export function registerJobsRoutes(app: FastifyInstance, db: any, deps: JobsRoutesDeps = {}) {
  const runNow = deps.runNow ?? defaultRunNowRequester;

  app.get("/api/admin-svc/jobs", async (req, reply) => {
    const me = await requirePlatformAdmin(req, reply);
    if (!me) return;

    const ledgerResult = (await db.execute(sql`
      SELECT job_name, last_run_at, last_finished_at, last_replica_id, last_status,
             last_sent, last_failed, last_error
      FROM daily_job_runs
    `)) as { rows?: Array<Record<string, any>> } | Array<Record<string, any>>;
    const ledgerRows = Array.isArray(ledgerResult) ? ledgerResult : (ledgerResult.rows ?? []);
    const byName = new Map<string, Record<string, any>>();
    for (const row of ledgerRows) byName.set(row.job_name, row);

    const out = JOB_REGISTRY.map((entry) => {
      const row = byName.get(entry.jobName);
      const lastFinishedAt = row?.last_finished_at
        ? new Date(row.last_finished_at)
        : null;
      const lastRunAt = row?.last_run_at ? new Date(row.last_run_at) : null;
      const freshness = computeFreshness({
        jobName: entry.jobName,
        periodMs: entry.periodMs,
        lastRunAt,
        lastFinishedAt,
        lastStatus: row?.last_status ?? null,
      });
      byName.delete(entry.jobName);
      return {
        ...entry,
        lastRunAt,
        lastFinishedAt,
        lastReplicaId: row?.last_replica_id ?? null,
        lastStatus: row?.last_status ?? null,
        lastSent: row?.last_sent ?? null,
        lastFailed: row?.last_failed ?? null,
        lastError: row?.last_error ?? null,
        freshness,
        unregistered: false,
      };
    });

    // Anything left in `byName` is a job present in the ledger but not the
    // registry — we still want to surface it so on-call sees the row.
    for (const [jobName, row] of byName) {
      out.push({
        jobName,
        service: "(unknown)",
        description: "Job present in ledger but not in JOB_REGISTRY.",
        periodMs: 24 * 60 * 60 * 1000,
        lastRunAt: row.last_run_at ? new Date(row.last_run_at) : null,
        lastFinishedAt: row.last_finished_at ? new Date(row.last_finished_at) : null,
        lastReplicaId: row.last_replica_id ?? null,
        lastStatus: row.last_status ?? null,
        lastSent: row.last_sent ?? null,
        lastFailed: row.last_failed ?? null,
        lastError: row.last_error ?? null,
        freshness: computeFreshness({
          jobName,
          periodMs: 24 * 60 * 60 * 1000,
          lastRunAt: row.last_run_at ? new Date(row.last_run_at) : null,
          lastFinishedAt: row.last_finished_at ? new Date(row.last_finished_at) : null,
          lastStatus: row.last_status ?? null,
        }),
        unregistered: true,
      });
    }

    return { jobs: out };
  });

  app.get("/api/admin-svc/jobs/:jobName/runs", async (req, reply) => {
    const me = await requirePlatformAdmin(req, reply);
    if (!me) return;

    const params = req.params as { jobName: string };
    const query = req.query as { limit?: string };
    let limit = 20;
    if (query.limit) {
      const n = Number.parseInt(query.limit, 10);
      if (Number.isFinite(n) && n > 0) limit = Math.max(1, Math.min(n, 200));
    }

    const result = (await db.execute(sql`
      SELECT id, run_at, finished_at, replica_id, status, duration_ms, error
      FROM periodic_job_runs
      WHERE job_name = ${params.jobName}
      ORDER BY run_at DESC
      LIMIT ${limit}
    `)) as { rows?: Array<Record<string, any>> } | Array<Record<string, any>>;
    const rows = Array.isArray(result) ? result : (result.rows ?? []);

    return {
      jobName: params.jobName,
      limit,
      runs: rows.map((r) => ({
        id: r.id,
        runAt: r.run_at,
        finishedAt: r.finished_at,
        replicaId: r.replica_id,
        status: r.status,
        durationMs: r.duration_ms,
        error: r.error,
      })),
    };
  });

  app.post("/api/admin-svc/jobs/:jobName/run-now", async (req, reply) => {
    const me = await requirePlatformAdmin(req, reply);
    if (!me) return;
    const params = req.params as { jobName: string };
    const owner = JOB_REGISTRY.find((j) => j.jobName === params.jobName);
    if (!owner) {
      reply.code(404).send({ error: "job_not_registered", jobName: params.jobName });
      return;
    }
    const result = await runNow.request(params.jobName, owner);
    if (!result.ok) {
      reply.code(502).send({ error: "remote_failed", detail: result.error });
      return;
    }
    return { ok: true, status: result.status ?? "queued" };
  });

  app.get("/api/admin-svc/jobs/freshness", async (req, reply) => {
    const me = await requirePlatformAdmin(req, reply);
    if (!me) return;

    const ledgerResult = (await db.execute(sql`
      SELECT job_name, last_run_at, last_finished_at, last_status FROM daily_job_runs
    `)) as { rows?: Array<Record<string, any>> } | Array<Record<string, any>>;
    const ledgerRows = Array.isArray(ledgerResult) ? ledgerResult : (ledgerResult.rows ?? []);
    const byName = new Map<string, Record<string, any>>();
    for (const r of ledgerRows) byName.set(r.job_name, r);

    const reports = JOB_REGISTRY.map((entry) => {
      const row = byName.get(entry.jobName);
      return computeFreshness({
        jobName: entry.jobName,
        periodMs: entry.periodMs,
        lastRunAt: row?.last_run_at ? new Date(row.last_run_at) : null,
        lastFinishedAt: row?.last_finished_at ? new Date(row.last_finished_at) : null,
        lastStatus: row?.last_status ?? null,
      });
    });

    const counts = {
      fresh: reports.filter((r) => r.status === "fresh" && !r.failed).length,
      warning: reports.filter((r) => r.status === "warning").length,
      stale: reports.filter((r) => r.status === "stale").length,
      never_run: reports.filter((r) => r.status === "never_run").length,
      failed: reports.filter((r) => r.failed).length,
    };

    return { generatedAt: new Date().toISOString(), counts, reports };
  });
}
