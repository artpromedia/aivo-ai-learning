"use client";
import { useAuth } from "@/providers/auth-provider";
import { useEffect, useState, useCallback } from "react";
import Pagination from "@/components/Pagination";

interface Activity {
  id: string;
  action: string;
  actorName: string;
  resourceType: string;
  resourceId?: string;
  details?: any;
  createdAt: string;
}

const PAGE_SIZE = 30;

const ACTION_ICONS: Record<string, string> = {
  "school.created": "🏫",
  "school.updated": "🏫",
  "staff.invited": "👩‍🏫",
  "staff.updated": "👩‍🏫",
  "staff.deactivated": "🚫",
  "classroom.created": "🏠",
  "settings.updated": "⚙️",
  "iep.created": "📋",
  "intervention.created": "🎯",
};

export default function DistrictActivityPage() {
  const { accessToken } = useAuth();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const loadActivity = useCallback(() => {
    if (!accessToken) return;
    setLoading(true);
    const params = new URLSearchParams({ page: String(currentPage), pageSize: String(PAGE_SIZE) });
    fetch(`/api/district/activity?${params}`, { headers: { Authorization: `Bearer ${accessToken}` } })
      .then((r) => r.ok ? r.json() : { activities: [], total: 0 })
      .then((data) => { setActivities(data.activities || []); setTotal(data.total || 0); })
      .catch(() => { setActivities([]); setTotal(0); })
      .finally(() => setLoading(false));
  }, [accessToken, currentPage]);

  useEffect(() => { loadActivity(); }, [loadActivity]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="p-8 space-y-6">
      <header>
        <h1 className="text-2xl font-heading font-bold text-slate-900">Activity Log</h1>
        <p className="text-sm text-slate-500 mt-1">Track all administrative actions across your district.</p>
      </header>

      {loading ? (
        <div className="animate-pulse space-y-3">
          {[1, 2, 3, 4, 5].map((i) => <div key={i} className="h-14 bg-slate-200 rounded-xl" />)}
        </div>
      ) : activities.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <span className="text-4xl mb-4 block">📜</span>
          <p className="text-slate-600 font-medium">No activity recorded yet</p>
          <p className="text-sm text-slate-400 mt-1">Administrative actions will be logged here.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {activities.map((a) => (
            <div key={a.id} className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex items-start gap-4">
              <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-lg flex-shrink-0">
                {ACTION_ICONS[a.action] || "📝"}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-slate-900">{a.actorName}</span>
                  <span className="text-slate-400 text-xs">{a.action?.replace(/\./g, " ")}</span>
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="px-2 py-0.5 text-xs rounded-full bg-slate-100 text-slate-500 font-medium">
                    {a.resourceType}
                  </span>
                  {a.details && typeof a.details === "object" && (
                    <span className="text-xs text-slate-400 truncate">
                      {Object.entries(a.details).map(([k, v]) => `${k}: ${v}`).join(", ")}
                    </span>
                  )}
                </div>
              </div>
              <span className="text-xs text-slate-400 flex-shrink-0">
                {new Date(a.createdAt).toLocaleString()}
              </span>
            </div>
          ))}
          {totalPages > 1 && (
            <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} totalItems={total} pageSize={PAGE_SIZE} />
          )}
        </div>
      )}
    </div>
  );
}
