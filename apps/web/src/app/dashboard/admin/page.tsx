"use client";
import { useAuth } from "@/providers/auth-provider";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Image from "next/image";

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
  port: number;
  status: "healthy" | "unhealthy" | "checking";
}

const SERVICES = [
  { name: "identity-svc", port: 3001, healthPath: "/api/auth/health" },
  { name: "brain-svc", port: 3002, healthPath: "/api/brain/health" },
  { name: "assessment-svc", port: 3003, healthPath: "/api/assessments/health" },
  { name: "ai-svc", port: 3004, healthPath: "/api/ai/health" },
  { name: "learning-svc", port: 3005, healthPath: "/api/learning/health" },
  { name: "tutor-svc", port: 3006, healthPath: "/api/tutors/health" },
  { name: "family-svc", port: 3007, healthPath: "/api/family/health" },
  { name: "engagement-svc", port: 3008, healthPath: "/api/engagement/health" },
];

const ROLE_COLORS: Record<string, string> = {
  PARENT: "bg-purple-100 text-purple-700",
  LEARNER: "bg-cyan-100 text-cyan-700",
  TEACHER: "bg-green-100 text-green-700",
  THERAPIST: "bg-amber-100 text-amber-700",
  CAREGIVER: "bg-blue-100 text-blue-700",
  PLATFORM_ADMIN: "bg-red-100 text-red-700",
  DISTRICT_ADMIN: "bg-orange-100 text-orange-700",
};

const LEVEL_COLORS: Record<string, string> = {
  STANDARD: "bg-green-100 text-green-700",
  SUPPORTED: "bg-blue-100 text-blue-700",
  LOW_VERBAL: "bg-amber-100 text-amber-700",
  NON_VERBAL: "bg-orange-100 text-orange-700",
  PRE_SYMBOLIC: "bg-red-100 text-red-700",
};

export default function AdminDashboard() {
  const { user, accessToken, logout, loading } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [services, setServices] = useState<ServiceHealth[]>(
    SERVICES.map((s) => ({ ...s, status: "checking" as const }))
  );
  const [activeTab, setActiveTab] = useState<"overview" | "users" | "learners" | "tenants">("overview");
  const [allUsers, setAllUsers] = useState<AdminStats["recentUsers"]>([]);
  const [allLearners, setAllLearners] = useState<AdminStats["recentLearners"]>([]);

  useEffect(() => {
    if (!loading && !user) router.push("/login");
    if (!loading && user && !["PLATFORM_ADMIN", "DISTRICT_ADMIN"].includes(user.role)) router.push("/");
  }, [user, loading, router]);

  useEffect(() => {
    if (!accessToken) return;
    fetch("/api/admin/stats", { headers: { Authorization: `Bearer ${accessToken}` } })
      .then((r) => r.json())
      .then(setStats)
      .catch(() => {});
  }, [accessToken]);

  useEffect(() => {
    SERVICES.forEach((svc) => {
      fetch(svc.healthPath)
        .then((r) => {
          setServices((prev) =>
            prev.map((s) => (s.name === svc.name ? { ...s, status: r.ok ? "healthy" : "unhealthy" } : s))
          );
        })
        .catch(() => {
          setServices((prev) =>
            prev.map((s) => (s.name === svc.name ? { ...s, status: "unhealthy" } : s))
          );
        });
    });
  }, []);

  useEffect(() => {
    if (!accessToken || activeTab === "overview") return;
    if (activeTab === "users") {
      fetch("/api/admin/users?limit=100", { headers: { Authorization: `Bearer ${accessToken}` } })
        .then((r) => r.json())
        .then(setAllUsers)
        .catch(() => {});
    } else if (activeTab === "learners") {
      fetch("/api/admin/learners?limit=100", { headers: { Authorization: `Bearer ${accessToken}` } })
        .then((r) => r.json())
        .then(setAllLearners)
        .catch(() => {});
    }
  }, [activeTab, accessToken]);

  if (loading || !user) return null;

  const statCards = [
    { title: "Users", value: stats?.totalUsers ?? "--", desc: "Total registered", icon: "👤", bg: "bg-purple-50" },
    { title: "Learners", value: stats?.totalLearners ?? "--", desc: "Active profiles", icon: "🎓", bg: "bg-cyan-50" },
    { title: "Tenants", value: stats?.totalTenants ?? "--", desc: "Organizations", icon: "🏢", bg: "bg-amber-50" },
    { title: "Services", value: services.filter((s) => s.status === "healthy").length + "/" + SERVICES.length, desc: "Running", icon: "⚡", bg: "bg-green-50" },
  ];

  return (
    <div className="min-h-screen bg-surface">
      <header className="bg-white border-b border-slate-200 px-8 py-4 flex items-center justify-between">
        <Image src="/images/aivo-logo-purple.png" alt="AIVO" width={120} height={36} />
        <div className="flex items-center gap-4">
          <span className="text-sm text-slate-500">{user.name}</span>
          <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-700 font-medium">{user.role}</span>
          <button onClick={logout} className="text-sm text-slate-500 hover:text-red-500">Logout</button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-8 py-8 space-y-8">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-heading font-bold text-slate-900">Admin Dashboard</h1>
          <div className="flex gap-2">
            {(["overview", "users", "learners", "tenants"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${activeTab === tab ? "bg-primary text-white" : "bg-white text-slate-600 hover:bg-purple-50"}`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {statCards.map((c) => (
            <div key={c.title} className={`${c.bg} rounded-xl p-6 border border-slate-100`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-slate-500 font-medium">{c.title}</span>
                <span className="text-2xl">{c.icon}</span>
              </div>
              <div className="text-3xl font-bold text-slate-900">{c.value}</div>
              <div className="text-xs text-slate-400 mt-1">{c.desc}</div>
            </div>
          ))}
        </div>

        {activeTab === "overview" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
              <h3 className="font-heading font-bold text-lg mb-4">Service Health</h3>
              <div className="space-y-1">
                {services.map((svc) => (
                  <div key={svc.name} className="flex items-center justify-between py-2.5 border-b border-slate-50 last:border-0">
                    <div className="flex items-center gap-3">
                      <span className={`w-2.5 h-2.5 rounded-full ${svc.status === "healthy" ? "bg-green-500" : svc.status === "unhealthy" ? "bg-red-500" : "bg-amber-400 animate-pulse"}`} />
                      <span className="text-sm font-medium">{svc.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-400">:{svc.port}</span>
                      <span className={`px-2 py-0.5 text-xs rounded-full ${svc.status === "healthy" ? "bg-green-100 text-green-700" : svc.status === "unhealthy" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"}`}>
                        {svc.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
              <h3 className="font-heading font-bold text-lg mb-4">Users by Role</h3>
              {stats?.roleCounts && stats.roleCounts.length > 0 ? (
                <div className="space-y-3">
                  {stats.roleCounts.map((rc) => (
                    <div key={rc.role} className="flex items-center justify-between">
                      <span className={`px-3 py-1 text-xs rounded-full font-semibold ${ROLE_COLORS[rc.role] || "bg-slate-100 text-slate-600"}`}>
                        {rc.role}
                      </span>
                      <span className="text-lg font-bold text-slate-900">{rc.count}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-400">Loading...</p>
              )}
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 col-span-2">
              <h3 className="font-heading font-bold text-lg mb-4">Recent Users</h3>
              {stats?.recentUsers && stats.recentUsers.length > 0 ? (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-slate-400 border-b">
                      <th className="pb-2">Name</th>
                      <th className="pb-2">Email</th>
                      <th className="pb-2">Role</th>
                      <th className="pb-2">Joined</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.recentUsers.map((u) => (
                      <tr key={u.id} className="border-b border-slate-50">
                        <td className="py-2 font-medium">{u.name}</td>
                        <td className="py-2 text-slate-500">{u.email}</td>
                        <td className="py-2">
                          <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${ROLE_COLORS[u.role] || "bg-slate-100 text-slate-600"}`}>
                            {u.role}
                          </span>
                        </td>
                        <td className="py-2 text-slate-400">{new Date(u.createdAt).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="text-sm text-slate-400">No users yet</p>
              )}
            </div>
          </div>
        )}

        {activeTab === "users" && (
          <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
            <h3 className="font-heading font-bold text-lg mb-4">All Users</h3>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-400 border-b">
                  <th className="pb-2">Name</th>
                  <th className="pb-2">Email</th>
                  <th className="pb-2">Role</th>
                  <th className="pb-2">Joined</th>
                </tr>
              </thead>
              <tbody>
                {allUsers.map((u) => (
                  <tr key={u.id} className="border-b border-slate-50">
                    <td className="py-2 font-medium">{u.name}</td>
                    <td className="py-2 text-slate-500">{u.email}</td>
                    <td className="py-2">
                      <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${ROLE_COLORS[u.role] || "bg-slate-100"}`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="py-2 text-slate-400">{new Date(u.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === "learners" && (
          <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
            <h3 className="font-heading font-bold text-lg mb-4">All Learners</h3>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-400 border-b">
                  <th className="pb-2">Name</th>
                  <th className="pb-2">Functioning Level</th>
                  <th className="pb-2">Grade</th>
                  <th className="pb-2">Created</th>
                </tr>
              </thead>
              <tbody>
                {allLearners.map((l) => (
                  <tr key={l.id} className="border-b border-slate-50">
                    <td className="py-2 font-medium">{l.name}</td>
                    <td className="py-2">
                      <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${LEVEL_COLORS[l.functioningLevel || ""] || "bg-slate-100 text-slate-500"}`}>
                        {l.functioningLevel || "N/A"}
                      </span>
                    </td>
                    <td className="py-2 text-slate-500">{l.gradeLevel || "N/A"}</td>
                    <td className="py-2 text-slate-400">{new Date(l.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === "tenants" && (
          <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
            <h3 className="font-heading font-bold text-lg mb-4">Tenants</h3>
            <p className="text-sm text-slate-400">Tenant management coming soon. Currently {stats?.totalTenants || 0} tenants registered.</p>
          </div>
        )}
      </main>
    </div>
  );
}
