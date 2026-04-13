"use client";
import { useAuth } from "@/providers/auth-provider";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";

interface TenantInfo {
  id: string;
  name: string;
  type: string;
  slug: string;
  createdAt: string;
}

interface RoleCount {
  role: string;
  count: number;
}

interface Stats {
  totalUsers: number;
  totalLearners: number;
  totalTenants: number;
  roleCounts: RoleCount[];
}

interface Learner {
  id: string;
  name: string;
  functioningLevel: string;
  gradeLevel: string;
  createdAt: string;
}

function getRoleCount(roleCounts: RoleCount[], role: string): number {
  return roleCounts.find((r) => r.role === role)?.count ?? 0;
}

export default function DistrictDashboardPage() {
  const { user, accessToken } = useAuth();
  const t = useTranslations("districtAdmin");
  const tc = useTranslations("common");
  const td = useTranslations("dashboard");
  const [tenant, setTenant] = useState<TenantInfo | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [learners, setLearners] = useState<Learner[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!accessToken || !user) return;
    setLoading(true);

    const headers = { Authorization: `Bearer ${accessToken}` };

    Promise.all([
      fetch("/api/admin/tenants", { headers }).then((r) => r.ok ? r.json() : []),
      fetch("/api/admin/stats", { headers }).then((r) => r.ok ? r.json() : null),
      fetch("/api/admin/learners", { headers }).then((r) => r.ok ? r.json() : []),
    ])
      .then(([tenantData, statsData, learnerData]) => {
        const tenants = Array.isArray(tenantData) ? tenantData : [];
        const myTenant = user.tenantId
          ? tenants.find((t: TenantInfo) => t.id === user.tenantId)
          : tenants[0];
        setTenant(myTenant || null);
        setStats(statsData);
        setLearners(Array.isArray(learnerData) ? learnerData : []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [accessToken, user]);

  const rc = stats?.roleCounts ?? [];
  const teacherCount = getRoleCount(rc, "TEACHER");
  const learnerCount = stats?.totalLearners ?? learners.length;
  const parentCount = getRoleCount(rc, "PARENT");

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-slate-200 rounded-lg w-64" />
          <div className="grid grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => <div key={i} className="h-28 bg-slate-200 rounded-2xl" />)}
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => <div key={i} className="h-40 bg-slate-200 rounded-2xl" />)}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      <header className="space-y-1">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-heading font-bold bg-gradient-to-r from-violet-600 to-violet-500 bg-clip-text text-transparent">
            {t("dashboard")}
          </h1>
          {tenant && (
            <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold bg-violet-100 text-violet-700">
              {tenant.name}
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500" />
            </span>
          )}
        </div>
        <p className="text-sm text-slate-500">
          Manage your district&apos;s learners, teachers, and content. View progress reports and coordinate accommodations.
        </p>
      </header>

      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Active Learners" value={learnerCount.toString()} helper="Students enrolled" icon="🎓" accent="bg-violet-100 text-violet-600" />
        <MetricCard label="Teachers" value={teacherCount.toString()} helper="Educators on platform" icon="👩‍🏫" accent="bg-blue-100 text-blue-600" />
        <MetricCard label="Parents" value={parentCount.toString()} helper="Family accounts" icon="👨‍👩‍👧" accent="bg-emerald-100 text-emerald-600" />
        <MetricCard label="Total Users" value={(stats?.totalUsers ?? 0).toString()} helper="All platform users" icon="👥" accent="bg-amber-100 text-amber-600" />
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <ActionCard title="Schools" description="View and manage schools within your district, their enrollment numbers, and performance." href="/dashboard/district/schools" buttonLabel="Manage Schools" icon="🏫" />
        <ActionCard title="Learner Management" description="Browse enrolled learners, view progress summaries, manage IEPs and accommodations." href="/dashboard/district/learners" buttonLabel="View Learners" icon="🎓" />
        <ActionCard title="Analytics & Reports" description="District-wide analytics, mastery trends, domain performance, and intervention recommendations." href="/dashboard/district/analytics" buttonLabel="View Analytics" icon="📈" />
        <ActionCard title="Staff & Teachers" description="Manage teacher assignments, view classroom performance, and coordinate professional development." href="/dashboard/district/staff" buttonLabel="Manage Staff" icon="👩‍🏫" />
      </section>

      {tenant && (
        <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
          <h2 className="text-lg font-heading font-semibold text-slate-900">{t("dashboard")}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <InfoRow label="Organization" value={tenant.name} />
            <InfoRow label="Type" value={tenant.type} />
            <InfoRow label="Slug" value={tenant.slug} />
            <InfoRow label="Created" value={new Date(tenant.createdAt).toLocaleDateString()} />
          </div>
        </section>
      )}

      {learners.length > 0 && (
        <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-lg font-heading font-semibold text-slate-900">{t("learners")}</h2>
            <Link href="/dashboard/district/learners" className="text-sm text-violet-600 font-medium hover:underline">View all</Link>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-400 bg-slate-50/50 border-b border-slate-100">
                <th className="px-5 py-3 font-semibold">Learner</th>
                <th className="px-5 py-3 font-semibold">Grade</th>
                <th className="px-5 py-3 font-semibold">Functioning Level</th>
                <th className="px-5 py-3 font-semibold">Enrolled</th>
              </tr>
            </thead>
            <tbody>
              {learners.slice(0, 5).map((l) => (
                <tr key={l.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-400 to-purple-500 flex items-center justify-center text-white text-xs font-bold">
                        {l.name.charAt(0)}
                      </div>
                      <span className="font-medium text-slate-900">{l.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-slate-500">{l.gradeLevel || "—"}</td>
                  <td className="px-5 py-3">
                    <span className="px-2.5 py-0.5 text-xs rounded-full bg-violet-100 text-violet-700 font-semibold">
                      {l.functioningLevel.replace(/_/g, " ")}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-slate-400">{new Date(l.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
    </div>
  );
}

function MetricCard({ label, value, helper, icon, accent }: {
  label: string; value: string; helper: string; icon: string; accent: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 transition-all hover:shadow-md hover:border-violet-200">
      <div className="flex items-center gap-2 mb-2">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm ${accent}`}>{icon}</div>
        <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">{label}</p>
      </div>
      <p className="text-3xl font-bold text-slate-900">{value}</p>
      <p className="text-xs text-slate-400 mt-1">{helper}</p>
    </div>
  );
}

function ActionCard({ title, description, href, buttonLabel, icon }: {
  title: string; description: string; href: string; buttonLabel: string; icon: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 transition-all hover:shadow-md hover:border-violet-200 flex flex-col">
      <div className="flex items-center gap-3 mb-3">
        <span className="text-2xl">{icon}</span>
        <h3 className="text-base font-semibold text-slate-900">{title}</h3>
      </div>
      <p className="text-sm text-slate-500 flex-1">{description}</p>
      <Link href={href} className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-violet-600 hover:text-violet-700 transition">
        {buttonLabel} <span>→</span>
      </Link>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 py-2 px-3 rounded-lg bg-slate-50">
      <span className="text-xs text-slate-400 font-medium w-24">{label}</span>
      <span className="text-sm text-slate-700 font-medium">{value}</span>
    </div>
  );
}
