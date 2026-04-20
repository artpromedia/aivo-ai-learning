"use client";
import { useAuth } from "@/providers/auth-provider";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";

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
  overall: string;
  services: { name: string; status: string; latencyMs: number }[];
  timestamp: string;
}

const ROLE_COLORS: Record<string, string> = {
  PARENT: "bg-[hsl(var(--visual-primary)/0.12)] text-[hsl(var(--visual-primary))]",
  LEARNER: "bg-cyan-100 text-cyan-700",
  TEACHER: "bg-green-100 text-green-700",
  THERAPIST: "bg-amber-100 text-amber-700",
  CAREGIVER: "bg-blue-100 text-blue-700",
  PLATFORM_ADMIN: "bg-red-100 text-red-700",
  DISTRICT_ADMIN: "bg-orange-100 text-orange-700",
  SALES: "bg-emerald-100 text-emerald-700",
  MARKETING: "bg-pink-100 text-pink-700",
  CUSTOMER_CARE: "bg-sky-100 text-sky-700",
  SUPPORT: "bg-teal-100 text-teal-700",
  FINANCE: "bg-[hsl(var(--visual-primary)/0.12)] text-[hsl(var(--visual-primary))]",
  DEVOPS: "bg-indigo-100 text-indigo-700",
};

export default function AdminOverview() {
  const { user, accessToken } = useAuth();
  const t = useTranslations("platformAdmin");
  const tc = useTranslations("common");
  const td = useTranslations("dashboard");
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
    { title: t("total_users"), value: stats?.totalUsers ?? "—", icon: "👤", bg: "bg-[hsl(var(--visual-primary))]", link: "/dashboard/admin/users" },
    { title: td("total_learners"), value: stats?.totalLearners ?? "—", icon: "🎓", bg: "bg-[hsl(var(--visual-science))]", link: "/dashboard/admin/learners" },
    { title: t("tenants"), value: stats?.totalTenants ?? "—", icon: "🏢", bg: "bg-[hsl(var(--visual-math))]", link: "/dashboard/admin/tenants" },
    { title: t("services"), value: totalServices > 0 ? `${healthyCount}/${totalServices}` : "—", icon: "⚡", bg: "bg-[hsl(var(--visual-reading))]", link: "/dashboard/admin/services" },
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
          <h1 className="text-2xl font-heading font-bold vi-text">{td("overview")}</h1>
          <p className="text-sm vi-text-muted mt-1">{td("welcome_message", { name: user?.name ?? "" })}</p>
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
            <div className={`${c.bg} rounded-2xl p-5 text-white shadow-lg group-hover:shadow-xl transition-all group-hover:scale-[1.02]`}>
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
        <div className="lg:col-span-2 vi-card p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-heading font-bold text-lg vi-text">Users by Role</h2>
            <Link href="/dashboard/admin/users" className="text-xs text-[hsl(var(--visual-primary))] font-semibold hover:underline">View All →</Link>
          </div>
          {stats?.roleCounts && stats.roleCounts.length > 0 ? (
            <div className="space-y-3">
              {stats.roleCounts.map((rc) => {
                const max = Math.max(...stats.roleCounts.map((r) => r.count));
                const pct = max > 0 ? (rc.count / max) * 100 : 0;
                return (
                  <div key={rc.role} className="flex items-center gap-4">
                    <span className={`px-3 py-1 text-xs rounded-full font-semibold w-36 text-center ${ROLE_COLORS[rc.role] || "vi-surface-soft vi-text-muted"}`}>
                      {rc.role.replace(/_/g, " ")}
                    </span>
                    <div className="flex-1 vi-surface-soft rounded-full h-3 overflow-hidden">
                      <div className="h-full bg-[hsl(var(--visual-primary))] rounded-full transition-all" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-sm font-bold vi-text w-10 text-right">{rc.count}</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm vi-text-muted">Loading role data...</p>
          )}
        </div>

        <div className="vi-card p-6">
          <h2 className="font-heading font-bold text-lg vi-text mb-5">{td("quick_actions")}</h2>
          <div className="grid grid-cols-2 gap-2">
            {quickActions.map((a) => (
              <Link key={a.label} href={a.href}
                className="flex flex-col items-center gap-2 p-3 rounded-xl border vi-border hover:border-[hsl(var(--visual-primary)/0.3)] hover:vi-surface-soft transition text-center group">
                <span className="text-2xl group-hover:scale-110 transition-transform">{a.icon}</span>
                <span className="text-xs font-semibold vi-text-muted group-hover:text-[hsl(var(--visual-primary))]">{a.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="vi-card p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-heading font-bold text-lg vi-text">{t("system_health")}</h2>
            <Link href="/dashboard/admin/services" className="text-xs text-[hsl(var(--visual-primary))] font-semibold hover:underline">Details →</Link>
          </div>
          <div className="space-y-2">
            {(statusOverview?.services || []).map((svc: any) => (
              <div key={svc.name} className="flex items-center justify-between py-2 border-b vi-border last:border-0">
                <div className="flex items-center gap-3">
                  <span className={`w-2.5 h-2.5 rounded-full ${
                    svc.status === "healthy" ? "bg-green-500" : svc.status === "degraded" ? "bg-amber-500 animate-pulse" : "bg-red-500"
                  }`} />
                  <span className="text-sm font-medium vi-text">{svc.name}</span>
                </div>
                <div className="flex items-center gap-3">
                  {svc.latencyMs > 0 && <span className="text-xs vi-text-muted">{svc.latencyMs}ms</span>}
                  <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${
                    svc.status === "healthy" ? "bg-green-100 text-green-700" : svc.status === "degraded" ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"
                  }`}>
                    {svc.status}
                  </span>
                </div>
              </div>
            ))}
            {(!statusOverview?.services || statusOverview.services.length === 0) && (
              <p className="text-sm vi-text-muted text-center py-4">Loading service status...</p>
            )}
          </div>
        </div>

        <div className="vi-card p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-heading font-bold text-lg vi-text">Recent Users</h2>
            <Link href="/dashboard/admin/users" className="text-xs text-[hsl(var(--visual-primary))] font-semibold hover:underline">View All →</Link>
          </div>
          {stats?.recentUsers && stats.recentUsers.length > 0 ? (
            <div className="space-y-2">
              {stats.recentUsers.slice(0, 8).map((u) => (
                <div key={u.id} className="flex items-center justify-between py-2 border-b vi-border last:border-0">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-[hsl(var(--visual-primary))] flex items-center justify-center text-white text-xs font-bold">
                      {u.name?.charAt(0) || "?"}
                    </div>
                    <div>
                      <p className="text-sm font-medium vi-text">{u.name}</p>
                      <p className="text-xs vi-text-muted">{u.email || "No email"}</p>
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${ROLE_COLORS[u.role] || "vi-surface-soft"}`}>
                    {u.role.replace(/_/g, " ")}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm vi-text-muted text-center py-4">Loading...</p>
          )}
        </div>
      </div>

      {uptime && (
        <div className="vi-card p-6">
          <h2 className="font-heading font-bold text-lg mb-4">30-Day Uptime</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div>
              <p className="text-3xl font-bold">{uptime.uptime?.overall ?? "99.9"}%</p>
              <p className="text-sm vi-text-muted">Overall Uptime</p>
            </div>
            <div>
              <p className="text-3xl font-bold">{uptime.period ?? "30d"}</p>
              <p className="text-sm vi-text-muted">Monitoring Period</p>
            </div>
            <div>
              <p className="text-3xl font-bold">{uptime.uptime?.byService?.length ?? 0}</p>
              <p className="text-sm vi-text-muted">Monitored Services</p>
            </div>
            <div>
              <p className="text-3xl font-bold">{healthyCount}/{totalServices}</p>
              <p className="text-sm vi-text-muted">Services Online</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
