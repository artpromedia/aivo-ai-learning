"use client";
import { useAuth } from "@/providers/auth-provider";
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import Pagination from "@/components/Pagination";

interface AuditEntry {
  id: string;
  action: string;
  actorEmail: string;
  actorRole: string;
  resourceType: string;
  resourceId: string;
  details: Record<string, unknown> | null;
  ipAddress: string;
  createdAt: string;
}

interface AuditResponse {
  entries: AuditEntry[];
  total: number;
  page: number;
  pageSize: number;
}

export default function AuditLogPage() {
  const { accessToken } = useAuth();
  const [data, setData] = useState<AuditResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [action, setAction] = useState("");
  const [resourceType, setResourceType] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 50;

  const fetchData = useCallback(() => {
    if (!accessToken) return;
    setLoading(true);
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("pageSize", String(pageSize));
    if (search) params.set("search", search);
    if (action) params.set("action", action);
    if (resourceType) params.set("resourceType", resourceType);
    if (from) params.set("from", from);
    if (to) params.set("to", to);

    fetch(`/api/admin-svc/audit-log?${params.toString()}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setData(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [accessToken, page, search, action, resourceType, from, to]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const clearFilters = () => {
    setSearch("");
    setAction("");
    setResourceType("");
    setFrom("");
    setTo("");
    setPage(1);
  };

  const handleExport = () => {
    console.log("Export audit log");
  };

  const totalPages = data ? Math.ceil(data.total / data.pageSize) : 1;

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard/admin/compliance"
          className="text-sm text-purple-600 hover:text-purple-800 transition"
        >
          ← Back to Compliance
        </Link>
      </div>

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-heading font-bold text-slate-900">Audit Log</h1>
        <button
          onClick={handleExport}
          className="px-4 py-2 text-sm font-medium rounded-lg bg-purple-600 text-white hover:bg-purple-700 transition"
        >
          Export
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4">
        <div className="flex flex-wrap items-center gap-3">
          <input
            type="text"
            placeholder="Search..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="px-3 py-2 text-sm rounded-lg border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-purple-500 w-48"
          />
          <select
            value={action}
            onChange={(e) => { setAction(e.target.value); setPage(1); }}
            className="px-3 py-2 text-sm rounded-lg border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="">All Actions</option>
            <option value="USER_CREATED">User Created</option>
            <option value="USER_UPDATED">User Updated</option>
            <option value="USER_DELETED">User Deleted</option>
            <option value="ROLE_ASSIGNED">Role Assigned</option>
            <option value="LOGIN">Login</option>
            <option value="LOGOUT">Logout</option>
            <option value="IMPERSONATION">Impersonation</option>
            <option value="TENANT_CREATED">Tenant Created</option>
            <option value="CONFIG_UPDATED">Config Updated</option>
          </select>
          <select
            value={resourceType}
            onChange={(e) => { setResourceType(e.target.value); setPage(1); }}
            className="px-3 py-2 text-sm rounded-lg border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="">All Resources</option>
            <option value="User">User</option>
            <option value="Tenant">Tenant</option>
            <option value="Learner">Learner</option>
            <option value="Session">Session</option>
            <option value="Settings">Settings</option>
          </select>
          <input
            type="date"
            value={from}
            onChange={(e) => { setFrom(e.target.value); setPage(1); }}
            className="px-3 py-2 text-sm rounded-lg border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          <input
            type="date"
            value={to}
            onChange={(e) => { setTo(e.target.value); setPage(1); }}
            className="px-3 py-2 text-sm rounded-lg border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          <button
            onClick={clearFilters}
            className="px-3 py-2 text-sm rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-100 transition"
          >
            Clear Filters
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="p-8 space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-10 bg-slate-100 rounded animate-pulse" />
            ))}
          </div>
        ) : !data || data.entries.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-sm">No audit log entries found.</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50">
                    <th className="text-left px-4 py-3 font-semibold text-slate-600">Timestamp</th>
                    <th className="text-left px-4 py-3 font-semibold text-slate-600">Actor</th>
                    <th className="text-left px-4 py-3 font-semibold text-slate-600">Action</th>
                    <th className="text-left px-4 py-3 font-semibold text-slate-600">Resource</th>
                    <th className="text-left px-4 py-3 font-semibold text-slate-600">IP Address</th>
                    <th className="text-left px-4 py-3 font-semibold text-slate-600">Details</th>
                  </tr>
                </thead>
                <tbody>
                  {data.entries.map((entry) => (
                    <tr key={entry.id} className="border-b border-slate-50 hover:bg-slate-50 transition">
                      <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">
                        {new Date(entry.createdAt).toLocaleString()}
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm text-slate-700">{entry.actorEmail}</div>
                        <span className="px-1.5 py-0.5 text-[10px] rounded bg-slate-100 text-slate-500 font-medium">
                          {entry.actorRole.replace(/_/g, " ")}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 text-xs rounded font-semibold bg-purple-100 text-purple-700">
                          {entry.action.replace(/_/g, " ")}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-slate-700">{entry.resourceType}</span>
                        <span className="text-xs text-slate-400 ml-1">#{entry.resourceId}</span>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-500 font-mono">{entry.ipAddress || "—"}</td>
                      <td className="px-4 py-3">
                        {entry.details ? (
                          <button
                            onClick={() => setExpandedRow(expandedRow === entry.id ? null : entry.id)}
                            className="text-xs text-purple-600 hover:text-purple-800 font-medium transition"
                          >
                            {expandedRow === entry.id ? "Hide" : "View"}
                          </button>
                        ) : (
                          <span className="text-xs text-slate-300">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {data.entries.some((e) => expandedRow === e.id && e.details) && (
              <div className="px-4 py-3 bg-slate-50 border-t border-slate-100">
                <pre className="text-xs text-slate-600 overflow-auto max-h-48 p-3 bg-white rounded-lg border border-slate-200">
                  {JSON.stringify(
                    data.entries.find((e) => e.id === expandedRow)?.details,
                    null,
                    2
                  )}
                </pre>
              </div>
            )}

            <Pagination
              currentPage={data.page}
              totalPages={totalPages}
              onPageChange={setPage}
              totalItems={data.total}
              pageSize={data.pageSize}
            />
          </>
        )}
      </div>
    </div>
  );
}
