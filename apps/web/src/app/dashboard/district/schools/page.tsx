"use client";
import { useAuth } from "@/providers/auth-provider";
import { useEffect, useState } from "react";

interface Tenant {
  id: string;
  name: string;
  type: string;
  slug: string;
  createdAt: string;
}

export default function DistrictSchoolsPage() {
  const { accessToken, user } = useAuth();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!accessToken) return;
    fetch("/api/admin/tenants", { headers: { Authorization: `Bearer ${accessToken}` } })
      .then((r) => r.ok ? r.json() : [])
      .then((data) => {
        const all = Array.isArray(data) ? data : [];
        if (user?.tenantId) {
          setTenants(all.filter((t: Tenant) => t.id === user.tenantId));
        } else {
          setTenants(all.filter((t: Tenant) => t.type === "school" || t.type === "district"));
        }
      })
      .catch(() => setTenants([]))
      .finally(() => setLoading(false));
  }, [accessToken, user]);

  return (
    <div className="p-8 space-y-6">
      <header>
        <h1 className="text-2xl font-heading font-bold text-slate-900">Schools</h1>
        <p className="text-sm text-slate-500 mt-1">Manage schools and campuses within your district.</p>
      </header>

      {loading ? (
        <div className="animate-pulse space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-20 bg-slate-200 rounded-2xl" />)}
        </div>
      ) : tenants.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <span className="text-4xl mb-4 block">🏫</span>
          <p className="text-slate-600 font-medium">No schools found</p>
          <p className="text-sm text-slate-400 mt-1">Schools associated with your district will appear here.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {tenants.map((t) => (
            <div key={t.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 hover:shadow-md hover:border-violet-200 transition-all">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-violet-100 rounded-xl flex items-center justify-center text-lg">🏫</div>
                <div>
                  <h3 className="font-semibold text-slate-900">{t.name}</h3>
                  <p className="text-xs text-slate-400 uppercase">{t.type}</p>
                </div>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-400">Slug</span>
                  <span className="text-slate-600 font-mono text-xs">{t.slug}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Created</span>
                  <span className="text-slate-600">{new Date(t.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
