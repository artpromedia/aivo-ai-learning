"use client";
import { useAuth } from "@/providers/auth-provider";
import { useEffect, useState } from "react";
import Link from "next/link";

interface ActivityEntry {
  id: string;
  action: string;
  actorEmail: string;
  actorRole: string;
  resourceType: string;
  resourceId: string;
  details: Record<string, unknown> | null;
  createdAt: string;
}

function formatTimeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function resourceLink(type: string, id: string): string | null {
  const map: Record<string, string> = {
    User: `/dashboard/admin/users/${id}`,
    Learner: `/dashboard/admin/learners/${id}`,
    Tenant: `/dashboard/admin/tenants/${id}`,
  };
  return map[type] || null;
}

const ACTION_COLORS: Record<string, string> = {
  USER_CREATED: "bg-green-100 text-green-700",
  USER_UPDATED: "bg-blue-100 text-blue-700",
  USER_DELETED: "bg-red-100 text-red-700",
  ROLE_ASSIGNED: "bg-blue-100 text-blue-700",
  TENANT_CREATED: "bg-purple-100 text-purple-700",
  LOGIN: "bg-slate-100 text-slate-700",
  LOGOUT: "bg-slate-100 text-slate-700",
  IMPERSONATION: "bg-amber-100 text-amber-700",
  CONFIG_UPDATED: "bg-cyan-100 text-cyan-700",
};

export default function ActivityFeedPage() {
  const { accessToken } = useAuth();
  const [entries, setEntries] = useState<ActivityEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!accessToken) return;
    fetch("/api/admin-svc/activity", {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => setEntries(Array.isArray(data) ? data.slice(0, 20) : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [accessToken]);

  if (loading) {
    return (
      <div className="p-8 space-y-4">
        <div className="h-8 bg-slate-200 rounded-lg w-48 animate-pulse" />
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-16 bg-slate-200 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      <h1 className="text-2xl font-heading font-bold text-slate-900">Activity Feed</h1>

      {entries.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-12 text-center text-slate-400 text-sm">
          No recent activity.
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <div className="relative">
            <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-slate-100" />
            <div className="space-y-6">
              {entries.map((entry) => (
                <div key={entry.id} className="relative pl-10">
                  <div className="absolute left-2.5 top-1.5 w-3 h-3 rounded-full bg-purple-500 border-2 border-white shadow-sm" />
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium text-slate-700">{entry.actorEmail}</span>
                        <span className={`px-2 py-0.5 text-[10px] rounded font-semibold ${ACTION_COLORS[entry.action] || "bg-slate-100 text-slate-600"}`}>
                          {entry.action.replace(/_/g, " ")}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        {resourceLink(entry.resourceType, entry.resourceId) ? (
                          <Link
                            href={resourceLink(entry.resourceType, entry.resourceId)!}
                            className="text-xs text-purple-600 hover:text-purple-800 transition"
                          >
                            {entry.resourceType} #{entry.resourceId}
                          </Link>
                        ) : (
                          <span className="text-xs text-slate-500">
                            {entry.resourceType} #{entry.resourceId}
                          </span>
                        )}
                        <span className="px-1.5 py-0.5 text-[10px] rounded bg-slate-100 text-slate-400 font-medium">
                          {entry.actorRole.replace(/_/g, " ")}
                        </span>
                      </div>
                    </div>
                    <span className="text-xs text-slate-400 whitespace-nowrap flex-shrink-0">
                      {formatTimeAgo(new Date(entry.createdAt))}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
