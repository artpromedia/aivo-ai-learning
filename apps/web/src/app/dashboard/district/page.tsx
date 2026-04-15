"use client";
import { useAuth } from "@/providers/auth-provider";
import { useEffect, useState } from "react";
import Link from "next/link";

interface Stats {
  totalUsers: number;
  totalLearners: number;
  totalStaff: number;
  totalParents: number;
  totalSchools: number;
  activeIeps: number;
  roleCounts: { role: string; count: number }[];
  functioningLevelCounts: { level: string; count: number }[];
}

interface TenantInfo {
  id: string;
  name: string;
  type: string;
  slug: string;
  createdAt: string;
}

export default function DistrictDashboardPage() {
  const { user, accessToken } = useAuth();
  const [tenant, setTenant] = useState<TenantInfo | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!accessToken || !user) return;
    setLoading(true);
    const headers = { Authorization: `Bearer ${accessToken}` };

    Promise.all([
      fetch("/api/district/stats", { headers }).then((r) => r.ok ? r.json() : null),
      fetch("/api/district/tenant", { headers }).then((r) => r.ok ? r.json() : null),
    ])
      .then(([statsData, tenantData]) => {
        setStats(statsData);
        setTenant(tenantData);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [accessToken, user]);

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

  const flCounts = stats?.functioningLevelCounts ?? [];
  const maxFL = Math.max(1, ...flCounts.map((c) => Number(c.count)));

  return (
    <div className="p-8 space-y-6">
      <header className="space-y-1">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-heading font-bold bg-gradient-to-r from-violet-600 to-violet-500 bg-clip-text text-transparent">
            District Dashboard
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
        <MetricCard label="Active Learners" value={stats?.totalLearners ?? 0} helper="Students enrolled" icon="🎓" accent="bg-violet-100 text-violet-600" />
        <MetricCard label="Staff" value={stats?.totalStaff ?? 0} helper="Teachers, therapists, caregivers" icon="👩‍🏫" accent="bg-blue-100 text-blue-600" />
        <MetricCard label="Schools" value={stats?.totalSchools ?? 0} helper="Active campuses" icon="🏫" accent="bg-emerald-100 text-emerald-600" />
        <MetricCard label="Active IEPs" value={stats?.activeIeps ?? 0} helper="Individualized plans" icon="📋" accent="bg-amber-100 text-amber-600" />
      </section>

      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Parents" value={stats?.totalParents ?? 0} helper="Family accounts" icon="👨‍👩‍👧" accent="bg-pink-100 text-pink-600" />
        <MetricCard label="Total Users" value={stats?.totalUsers ?? 0} helper="All platform users" icon="👥" accent="bg-slate-100 text-slate-600" />
        {stats?.roleCounts?.filter(r => r.role === "TEACHER").map(r => (
          <MetricCard key="teachers" label="Teachers" value={Number(r.count)} helper="Educators on platform" icon="📚" accent="bg-green-100 text-green-600" />
        ))}
        {stats?.roleCounts?.filter(r => r.role === "THERAPIST").map(r => (
          <MetricCard key="therapists" label="Therapists" value={Number(r.count)} helper="Specialists on platform" icon="🧠" accent="bg-teal-100 text-teal-600" />
        ))}
      </section>

      {flCounts.length > 0 && (
        <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <h2 className="text-lg font-heading font-semibold text-slate-900 mb-4">Functioning Level Distribution</h2>
          <div className="flex items-end gap-4 h-48">
            {flCounts.map((d) => (
              <div key={d.level} className="flex-1 flex flex-col items-center gap-2">
                <span className="text-sm font-bold text-slate-900">{d.count}</span>
                <div
                  className="w-full rounded-t-lg bg-gradient-to-t from-violet-500 to-violet-400 transition-all"
                  style={{ height: `${Math.max(8, (Number(d.count) / maxFL) * 100)}%` }}
                />
                <span className="text-[10px] text-slate-500 font-medium text-center">{String(d.level).replace(/_/g, " ")}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="grid gap-4 md:grid-cols-2">
        <ActionCard title="Schools" description="View and manage schools within your district, their enrollment numbers, and staff assignments." href="/dashboard/district/schools" buttonLabel="Manage Schools" icon="🏫" />
        <ActionCard title="Learner Management" description="Browse enrolled learners, view progress summaries, manage IEPs and accommodations." href="/dashboard/district/learners" buttonLabel="View Learners" icon="🎓" />
        <ActionCard title="IEP Management" description="Track individualized education programs, review dates, and compliance status." href="/dashboard/district/iep" buttonLabel="View IEPs" icon="📋" />
        <ActionCard title="Staff & Teachers" description="Manage teacher assignments, view school placements, and invite new staff members." href="/dashboard/district/staff" buttonLabel="Manage Staff" icon="👩‍🏫" />
      </section>

      {tenant && (
        <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
          <h2 className="text-lg font-heading font-semibold text-slate-900">Organization Info</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <InfoRow label="Organization" value={tenant.name} />
            <InfoRow label="Type" value={tenant.type} />
            <InfoRow label="Slug" value={tenant.slug} />
            <InfoRow label="Created" value={new Date(tenant.createdAt).toLocaleDateString()} />
          </div>
        </section>
      )}
    </div>
  );
}

function MetricCard({ label, value, helper, icon, accent }: {
  label: string; value: number; helper: string; icon: string; accent: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 transition-all hover:shadow-md hover:border-violet-200">
      <div className="flex items-center gap-2 mb-2">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm ${accent}`}>{icon}</div>
        <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">{label}</p>
      </div>
      <p className="text-3xl font-bold text-slate-900">{value.toLocaleString()}</p>
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
