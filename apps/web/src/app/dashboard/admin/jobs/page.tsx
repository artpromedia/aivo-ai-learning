"use client";
import { useAuth } from "@/providers/auth-provider";
import { useEffect, useMemo, useState } from "react";

interface FreshnessReport {
  jobName: string;
  status: "fresh" | "warning" | "stale" | "never_run";
  ageMs: number | null;
  failed: boolean;
}

interface JobRow {
  jobName: string;
  service: string;
  description: string;
  periodMs: number;
  lastRunAt: string | null;
  lastFinishedAt: string | null;
  lastReplicaId: string | null;
  lastStatus: string | null;
  lastSent: number | null;
  lastFailed: number | null;
  lastError: string | null;
  freshness: FreshnessReport;
  unregistered: boolean;
}

interface RunRow {
  id: number;
  runAt: string;
  finishedAt: string | null;
  replicaId: string | null;
  status: string;
  durationMs: number | null;
  error: string | null;
}

const FRESHNESS_BADGE: Record<FreshnessReport["status"], { label: string; cls: string }> = {
  fresh: { label: "Fresh", cls: "bg-emerald-100 text-emerald-800" },
  warning: { label: "Warning", cls: "bg-amber-100 text-amber-800" },
  stale: { label: "Stale", cls: "bg-rose-100 text-rose-800" },
  never_run: { label: "Never run", cls: "bg-gray-200 text-gray-800" },
};

function formatAge(ms: number | null): string {
  if (ms == null) return "—";
  const sec = Math.floor(ms / 1000);
  if (sec < 60) return `${sec}s ago`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 48) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  return `${day}d ago`;
}

/** Sparkline of recent run durations, color-coded by status. (Task #179) */
function DurationSparkline({ runs }: { runs: RunRow[] }) {
  const data = runs.slice().reverse();
  if (data.length === 0) {
    return <p className="text-xs text-gray-500">No runs recorded yet.</p>;
  }
  const max = Math.max(...data.map((r) => r.durationMs ?? 0), 1);
  const w = 8;
  const gap = 2;
  const height = 48;
  return (
    <svg
      role="img"
      aria-label="Recent run durations"
      width={(w + gap) * data.length}
      height={height}
      style={{ overflow: "visible" }}
    >
      {data.map((r, i) => {
        const h = Math.max(2, ((r.durationMs ?? 0) / max) * (height - 4));
        const fill =
          r.status === "failed"
            ? "#dc2626"
            : r.status === "partial"
              ? "#f59e0b"
              : "#10b981";
        return (
          <g key={r.id ?? i}>
            <rect
              x={i * (w + gap)}
              y={height - h}
              width={w}
              height={h}
              fill={fill}
              rx={1}
            >
              <title>
                {`${new Date(r.runAt).toLocaleString()} — ${r.status} — ${r.durationMs ?? 0}ms`}
              </title>
            </rect>
          </g>
        );
      })}
    </svg>
  );
}

function ExpandedJobRow({ jobName, accessToken }: { jobName: string; accessToken: string }) {
  const [runs, setRuns] = useState<RunRow[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!accessToken) return;
    setLoading(true);
    fetch(`/api/admin-svc/jobs/${encodeURIComponent(jobName)}/runs?limit=20`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
      .then(async (r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((j) => setRuns(j.runs ?? []))
      .catch((e) => setError(e instanceof Error ? e.message : String(e)))
      .finally(() => setLoading(false));
  }, [jobName, accessToken]);

  if (loading) return <p className="text-xs text-gray-500 px-4 py-3">Loading runs…</p>;
  if (error) return <p className="text-xs text-rose-600 px-4 py-3">Error: {error}</p>;
  if (!runs) return null;
  return (
    <div className="px-4 py-3 bg-gray-50 border-t">
      <div className="mb-3">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1">
          Duration trend (last 20 runs)
        </h4>
        <DurationSparkline runs={runs} />
      </div>
      <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1">
        Recent runs
      </h4>
      <table
        data-testid={`runs-table-${jobName}`}
        className="w-full text-xs"
      >
        <thead>
          <tr className="text-left text-gray-500">
            <th className="py-1">Started</th>
            <th>Status</th>
            <th>Duration</th>
            <th>Replica</th>
            <th>Error</th>
          </tr>
        </thead>
        <tbody>
          {runs.map((r) => (
            <tr key={r.id} className="border-t border-gray-200">
              <td className="py-1 font-mono">{new Date(r.runAt).toLocaleString()}</td>
              <td>
                <span
                  className={`inline-block rounded px-1.5 py-0.5 text-[10px] font-medium ${
                    r.status === "ok"
                      ? "bg-emerald-100 text-emerald-800"
                      : r.status === "partial"
                        ? "bg-amber-100 text-amber-800"
                        : "bg-rose-100 text-rose-800"
                  }`}
                >
                  {r.status}
                </span>
              </td>
              <td>{r.durationMs != null ? `${r.durationMs}ms` : "—"}</td>
              <td className="font-mono text-[10px]">{r.replicaId ?? "—"}</td>
              <td className="text-rose-700">{r.error ?? ""}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function BackgroundJobsPage() {
  const { user } = useAuth();
  const accessToken =
    typeof window !== "undefined" ? window.localStorage.getItem("accessToken") ?? "" : "";
  const [jobs, setJobs] = useState<JobRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [runNowState, setRunNowState] = useState<Record<string, "idle" | "running" | "ok" | "error">>({});

  const load = () => {
    if (!accessToken) return;
    fetch("/api/admin-svc/jobs", {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
      .then(async (r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((j) => setJobs(j.jobs ?? []))
      .catch((e) => setError(e instanceof Error ? e.message : String(e)));
  };
  useEffect(load, [accessToken]);

  const visible = useMemo(() => {
    if (!jobs) return null;
    if (statusFilter === "all") return jobs;
    return jobs.filter((j) => j.freshness.status === statusFilter || (statusFilter === "failed" && j.freshness.failed));
  }, [jobs, statusFilter]);

  if (!user) return null;

  async function runNow(jobName: string) {
    setRunNowState((s) => ({ ...s, [jobName]: "running" }));
    try {
      const res = await fetch(`/api/admin-svc/jobs/${encodeURIComponent(jobName)}/run-now`, {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      setRunNowState((s) => ({ ...s, [jobName]: res.ok ? "ok" : "error" }));
      if (res.ok) load();
    } catch {
      setRunNowState((s) => ({ ...s, [jobName]: "error" }));
    }
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <header className="mb-6">
        <h1 className="text-2xl font-bold">Background Jobs</h1>
        <p className="text-sm text-gray-600">
          Every fleet-wide periodic job. Click a row to see recent runs and a duration trend.
        </p>
      </header>

      <div className="mb-4 flex items-center gap-3">
        <label htmlFor="job-filter" className="text-sm text-gray-600">Filter:</label>
        <select
          id="job-filter"
          aria-label="Filter jobs by status"
          className="border rounded px-2 py-1 text-sm"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="all">All</option>
          <option value="fresh">Fresh</option>
          <option value="warning">Warning</option>
          <option value="stale">Stale</option>
          <option value="never_run">Never run</option>
          <option value="failed">Last status: failed</option>
        </select>
        <button
          className="ml-auto text-xs px-3 py-1 border rounded hover:bg-gray-100"
          onClick={load}
        >
          Refresh
        </button>
      </div>

      {error && <p className="text-rose-600 mb-4">Error: {error}</p>}

      <div className="border rounded-lg overflow-hidden bg-white">
        <table className="w-full text-sm" data-testid="jobs-table">
          <thead className="bg-gray-50">
            <tr className="text-left">
              <th className="px-4 py-2">Job</th>
              <th className="px-4 py-2">Service</th>
              <th className="px-4 py-2">Last finish</th>
              <th className="px-4 py-2">Status</th>
              <th className="px-4 py-2">Replica</th>
              <th className="px-4 py-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {!visible && (
              <tr>
                <td className="px-4 py-3 text-gray-500" colSpan={6}>
                  Loading…
                </td>
              </tr>
            )}
            {visible?.length === 0 && (
              <tr>
                <td className="px-4 py-3 text-gray-500" colSpan={6}>
                  No jobs match this filter.
                </td>
              </tr>
            )}
            {visible?.map((j) => {
              const isOpen = expanded === j.jobName;
              const badge = FRESHNESS_BADGE[j.freshness.status];
              const runState = runNowState[j.jobName] ?? "idle";
              return (
                <>
                  <tr
                    key={j.jobName}
                    data-testid={`job-row-${j.jobName}`}
                    className={`border-t cursor-pointer hover:bg-gray-50 ${j.unregistered ? "italic" : ""}`}
                    onClick={() => setExpanded(isOpen ? null : j.jobName)}
                  >
                    <td className="px-4 py-2 font-mono text-xs">
                      {j.jobName}
                      {j.unregistered && (
                        <span className="ml-2 text-[10px] uppercase rounded bg-amber-100 text-amber-800 px-1">
                          unregistered
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2">{j.service}</td>
                    <td className="px-4 py-2">
                      <span title={j.lastFinishedAt ?? "never"}>{formatAge(j.freshness.ageMs)}</span>
                    </td>
                    <td className="px-4 py-2">
                      <span className={`inline-block rounded px-2 py-0.5 text-xs ${badge.cls}`}>
                        {badge.label}
                      </span>
                      {j.freshness.failed && (
                        <span className="ml-2 inline-block rounded bg-rose-100 text-rose-800 text-xs px-2 py-0.5">
                          failed
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2 font-mono text-xs">{j.lastReplicaId ?? "—"}</td>
                    <td className="px-4 py-2 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          runNow(j.jobName);
                        }}
                        disabled={runState === "running"}
                        className="text-xs px-3 py-1 border rounded hover:bg-gray-100 disabled:opacity-50"
                      >
                        {runState === "running" ? "Running…"
                          : runState === "ok" ? "Triggered"
                          : runState === "error" ? "Error — retry"
                          : "Run now"}
                      </button>
                    </td>
                  </tr>
                  {isOpen && (
                    <tr key={`${j.jobName}-runs`} data-testid={`job-row-runs-${j.jobName}`}>
                      <td colSpan={6} className="p-0">
                        <ExpandedJobRow jobName={j.jobName} accessToken={accessToken} />
                      </td>
                    </tr>
                  )}
                </>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
