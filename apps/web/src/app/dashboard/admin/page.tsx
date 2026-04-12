"use client";
import { useAuth } from "@/providers/auth-provider";
import { useEffect, useState } from "react";
import Link from "next/link";

interface AdminStats {
  totalUsers: number;
  totalLearners: number;
  totalTenants: number;
  roleCounts: { role: string; count: number }[];
  recentUsers: { id: string; name: string; email: string; role: string; createdAt: string }[];
  recentLearners: { id: string; name: string; functioningLevel: string | null; gradeLevel: string | null; createdAt: string }[];
}

interface ServiceHealth {
  name: string;
  status: "operational" | "degraded" | "down" | "checking";
  latency?: number;
}

interface StatusOverview {
  status: string;
  services: { name: string; status: string; latency: number }[];
  timestamp: string;
}

const ROLE_COLORS: Record<string, string> = {
  PARENT: "bg-purple-100 text-purple-700",
  LEARNER: "bg-cyan-100 text-cyan-700",
  TEACHER: "bg-green-100 text-green-700",
  THERAPIST: "bg-amber-100 text-amber-700",
  CAREGIVER: "bg-blue-100 text-blue-700",
  PLATFORM_ADMIN: "bg-red-100 text-red-700",
  DISTRICT_ADMIN: "bg-orange-100 text-orange-700",
};

export default function AdminOverview() {
  const { user, accessToken } = useAuth();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [statusOverview, setStatusOverview] = useState<StatusOverview | null>(null);
  const [uptime, setUptime] = useState<any>(null);

  useEffect(() => {
    if (!accessToken) return;
    fetch("/api/admin/stats", { headers: { Authorization: `Bearer ${accessToken}` } })
      .then((r) => r.ok ? r.json() : null)
      .then(setStats)
      .catch(() => {});

    fetch("/api/status/overview")
      .then((r) => r.ok ? r.json() : null)
      .then(setStatusOverview)
      .catch(() => {});

    fetch("/api/status/uptime")
      .then((r) => r.ok ? r.json() : null)
      .then(setUptime)
      .catch(() => {});
  }, [accessToken]);

  const healthyCount = statusOverview?.services?.filter((s: any) => s.status === "healthy").length ?? 0;
  const totalServices = statusOverview?.services?.length ?? 0;
  const platformStatus = statusOverview?.overall ?? "checking";

  const statCards = [
    { title: "Total Users", value: stats?.totalUsers ?? "—", icon: "👤", bg: "from-purple-500 to-purple-600", link: "/dashboard/admin/users" },
    { title: "Active Learners", value: stats?.totalLearners ?? "—", icon: "🎓", bg: "from-cyan-500 to-cyan-600", link: "/dashboard/admin/learners" },
    { title: "Tenants", value: stats?.totalTenants ?? "—", icon: "🏢", bg: "from-amber-500 to-amber-600", link: "/dashboard/admin/tenants" },
    { title: "Services", value: totalServices > 0 ? `${healthyCount}/${totalServices}` : "—", icon: "⚡", bg: "from-green-500 to-green-600", link: "/dashboard/admin/services" },
  ];

  const quickActions = [
    { label: "Create District", href: "/dashboard/admin/tenants", icon: "🏫" },
    { label: "View Brain Models", href: "/dashboard/admin/ai", icon: "🧠" },
    { label: "Audit Logs", href: "/dashboard/admin/compliance", icon: "🛡️" },
    { label: "Platform Settings", href: "/dashboard/admin/settings", icon: "⚙️" },
    { label: "Billing", href: "/dashboard/admin/billing", icon: "💳" },
    { label: "Research Data", href: "/dashboard/admin/analytics", icon: "📈" },
  ];

  return (
    <div className="p-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold text-slate-900">Platform Overview</h1>
          <p className="text-sm text-slate-500 mt-1">Welcome back, {user?.name}. Here&apos;s what&apos;s happening across the platform.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold ${
            platformStatus === "operational" ? "bg-green-100 text-green-700" :
            platformStatus === "degraded" ? "bg-amber-100 text-amber-700" :
            "bg-red-100 text-red-700"
          }`}>
            <span className={`w-2 h-2 rounded-full ${
              platformStatus === "operational" ? "bg-green-500" :
              platformStatus === "degraded" ? "bg-amber-500 animate-pulse" :
              "bg-red-500 animate-pulse"
            }`} />
            {platformStatus === "operational" ? "All Systems Operational" :
             platformStatus === "degraded" ? "Degraded Performance" :
             platformStatus === "checking" ? "Checking..." : "Service Issues"}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {statCards.map((c) => (
          <Link key={c.title} href={c.link} className="group">
            <div className={`bg-gradient-to-br ${c.bg} rounded-2xl p-5 text-white shadow-lg group-hover:shadow-xl transition-all group-hover:scale-[1.02]`}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-3xl">{c.icon}</span>
                <span className="text-xs opacity-75 group-hover:opacity-100">View →</span>
              </div>
              <div className="text-3xl font-bold">{c.value}</div>
              <div className="text-sm opacity-80 mt-1">{c.title}</div>
            </div>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-heading font-bold text-lg text-slate-900">Users by Role</h2>
            <Link href="/dashboard/admin/users" className="text-xs text-primary font-semibold hover:underline">View All →</Link>
          </div>
          {stats?.roleCounts && stats.roleCounts.length > 0 ? (
            <div className="space-y-3">
              {stats.roleCounts.map((rc) => {
                const max = Math.max(...stats.roleCounts.map((r) => r.count));
                const pct = max > 0 ? (rc.count / max) * 100 : 0;
                return (
                  <div key={rc.role} className="flex items-center gap-4">
                    <span className={`px-3 py-1 text-xs rounded-full font-semibold w-36 text-center ${ROLE_COLORS[rc.role] || "bg-slate-100 text-slate-600"}`}>
                      {rc.role.replace(/_/g, " ")}
                    </span>
                    <div className="flex-1 bg-slate-100 rounded-full h-3 overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-purple-500 to-purple-400 rounded-full transition-all" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-sm font-bold text-slate-700 w-10 text-right">{rc.count}</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-slate-400">Loading role data...</p>
          )}
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
          <h2 className="font-heading font-bold text-lg text-slate-900 mb-5">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-2">
            {quickActions.map((a) => (
              <Link key={a.label} href={a.href}
                className="flex flex-col items-center gap-2 p-3 rounded-xl border border-slate-100 hover:border-purple-200 hover:bg-purple-50/50 transition text-center group">
                <span className="text-2xl group-hover:scale-110 transition-transform">{a.icon}</span>
                <span className="text-xs font-semibold text-slate-600 group-hover:text-primary">{a.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-heading font-bold text-lg text-slate-900">Service Health</h2>
            <Link href="/dashboard/admin/services" className="text-xs text-primary font-semibold hover:underline">Details →</Link>
          </div>
          <div className="space-y-2">
            {(statusOverview?.services || []).map((svc: any) => (
              <div key={svc.name} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                <div className="flex items-center gap-3">
                  <span className={`w-2.5 h-2.5 rounded-full ${
                    svc.status === "healthy" ? "bg-green-500" : svc.status === "degraded" ? "bg-amber-500 animate-pulse" : "bg-red-500"
                  }`} />
                  <span className="text-sm font-medium text-slate-700">{svc.name}</span>
                </div>
                <div className="flex items-center gap-3">
                  {svc.latencyMs > 0 && <span className="text-xs text-slate-400">{svc.latencyMs}ms</span>}
                  <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${
                    svc.status === "healthy" ? "bg-green-100 text-green-700" : svc.status === "degraded" ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"
                  }`}>
                    {svc.status}
                  </span>
                </div>
              </div>
            ))}
            {(!statusOverview?.services || statusOverview.services.length === 0) && (
              <p className="text-sm text-slate-400 text-center py-4">Loading service status...</p>
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-heading font-bold text-lg text-slate-900">Recent Users</h2>
            <Link href="/dashboard/admin/users" className="text-xs text-primary font-semibold hover:underline">View All →</Link>
          </div>
          {stats?.recentUsers && stats.recentUsers.length > 0 ? (
            <div className="space-y-2">
              {stats.recentUsers.slice(0, 8).map((u) => (
                <div key={u.id} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
                      {u.name?.charAt(0) || "?"}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-700">{u.name}</p>
                      <p className="text-xs text-slate-400">{u.email || "No email"}</p>
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${ROLE_COLORS[u.role] || "bg-slate-100"}`}>
                    {u.role.replace(/_/g, " ")}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-400 text-center py-4">Loading...</p>
          )}
        </div>
      </div>

      {uptime && (
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-2xl p-6 text-white">
          <h2 className="font-heading font-bold text-lg mb-4">30-Day Uptime</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div>
              <p className="text-3xl font-bold">{uptime.uptime?.overall ?? "99.9"}%</p>
              <p className="text-sm text-slate-400">Overall Uptime</p>
            </div>
            <div>
              <p className="text-3xl font-bold">{uptime.period ?? "30d"}</p>
              <p className="text-sm text-slate-400">Monitoring Period</p>
            </div>
            <div>
              <p className="text-3xl font-bold">{uptime.uptime?.byService?.length ?? 0}</p>
              <p className="text-sm text-slate-400">Monitored Services</p>
            </div>
            <div>
              <p className="text-3xl font-bold">{healthyCount}/{totalServices}</p>
              <p className="text-sm text-slate-400">Services Online</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
