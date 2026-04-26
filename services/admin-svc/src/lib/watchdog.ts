/**
 * Sprint 7 — fleet-wide watchdog. (Tasks #59, #68)
 *
 * On a fixed cadence, walks every registered job and pages on-call when a
 * job's last_finished_at is older than `1.5 × periodMs`. Dedup is handled by
 * `@aivo/ops-alert` so a job that's been silent for days only pages once per
 * dedupWindowMs.
 *
 * The watchdog is generic — it doesn't know about billing specifically, it
 * walks the full registry. That replaces the original billing-only
 * `BILLING_DAILY_WATCHDOG_WEBHOOK_URL` plumbing (Task #69) with a single
 * `OPS_ALERT_*` config.
 */
import { sql } from "drizzle-orm";
import { JOB_REGISTRY, computeFreshness } from "@aivo/scheduling";
import { getOpsAlertClient } from "@aivo/ops-alert";

export interface WatchdogOptions {
  intervalMs?: number;
  log?: { info: (...args: unknown[]) => void; error: (...args: unknown[]) => void };
}

const DEFAULT_INTERVAL_MS = 15 * 60 * 1000; // 15 minutes

export async function runWatchdogOnce(
  db: any,
  log?: WatchdogOptions["log"],
): Promise<{ alerted: string[]; checked: number }> {
  const alerts = getOpsAlertClient();
  const result = (await db.execute(sql`
    SELECT job_name, last_run_at, last_finished_at, last_status FROM daily_job_runs
  `)) as { rows?: Array<Record<string, any>> } | Array<Record<string, any>>;
  const rows = Array.isArray(result) ? result : (result.rows ?? []);
  const byName = new Map<string, Record<string, any>>();
  for (const r of rows) byName.set(r.job_name, r);

  const alerted: string[] = [];

  for (const entry of JOB_REGISTRY) {
    const row = byName.get(entry.jobName);
    const report = computeFreshness({
      jobName: entry.jobName,
      periodMs: entry.periodMs,
      lastRunAt: row?.last_run_at ? new Date(row.last_run_at) : null,
      lastFinishedAt: row?.last_finished_at ? new Date(row.last_finished_at) : null,
      lastStatus: row?.last_status ?? null,
    });
    if (report.status === "stale" || report.status === "never_run" || report.failed) {
      alerted.push(entry.jobName);
      const ageHours = report.ageMs ? Math.round(report.ageMs / (60 * 60 * 1000)) : null;
      const sev =
        report.status === "stale" ? "critical"
        : report.failed ? "critical"
        : "warning";
      try {
        await alerts.send({
          severity: sev,
          title: `Background job stale: ${entry.jobName}`,
          body:
            report.status === "never_run"
              ? `Job ${entry.jobName} has never been recorded as running on this database.`
              : report.failed
                ? `Job ${entry.jobName} reported status=failed at last finish.`
                : `Job ${entry.jobName} hasn't reported a finish in ~${ageHours}h (expected every ${Math.round(entry.periodMs / 3600_000)}h).`,
          dedupKey: `job-stale:${entry.jobName}`,
          fields: {
            service: entry.service,
            lastFinishedAt: row?.last_finished_at ?? null,
            lastStatus: row?.last_status ?? null,
            ageHours,
          },
        });
      } catch (e) {
        log?.error({ err: e, jobName: entry.jobName }, "watchdog send failed");
      }
    }
  }

  return { alerted, checked: JOB_REGISTRY.length };
}

export function startWatchdog(db: any, opts: WatchdogOptions = {}) {
  const intervalMs = opts.intervalMs ?? DEFAULT_INTERVAL_MS;
  const log = opts.log;
  let stopped = false;

  const tick = async () => {
    if (stopped) return;
    try {
      const result = await runWatchdogOnce(db, log);
      log?.info(result, "watchdog tick");
    } catch (e) {
      log?.error({ err: e }, "watchdog tick failed");
    }
  };
  // First tick after a short delay so dev boot stays quick.
  setTimeout(tick, 30_000).unref?.();
  const interval = setInterval(tick, intervalMs);
  if (typeof (interval as { unref?: () => void }).unref === "function") {
    (interval as { unref: () => void }).unref();
  }
  return {
    stop() {
      stopped = true;
      clearInterval(interval);
    },
  };
}
