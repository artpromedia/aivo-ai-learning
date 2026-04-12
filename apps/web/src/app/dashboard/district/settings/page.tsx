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

export default function DistrictSettingsPage() {
  const { accessToken, user } = useAuth();
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!accessToken) return;
    fetch("/api/admin/tenants", { headers: { Authorization: `Bearer ${accessToken}` } })
      .then((r) => r.ok ? r.json() : [])
      .then((data) => {
        const all = Array.isArray(data) ? data : [];
        const myTenant = user?.tenantId
          ? all.find((t: Tenant) => t.id === user.tenantId)
          : all[0];
        setTenant(myTenant || null);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [accessToken, user]);

  if (loading) {
    return (
      <div className="p-8 animate-pulse space-y-4">
        <div className="h-8 bg-slate-200 rounded-lg w-48" />
        <div className="h-64 bg-slate-200 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      <header>
        <h1 className="text-2xl font-heading font-bold text-slate-900">District Settings</h1>
        <p className="text-sm text-slate-500 mt-1">Configure your district organization and preferences.</p>
      </header>

      {tenant && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
          <h2 className="text-lg font-heading font-semibold text-slate-900">Organization Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <SettingsField label="Organization Name" value={tenant.name} />
            <SettingsField label="Organization Type" value={tenant.type} />
            <SettingsField label="Slug" value={tenant.slug} />
            <SettingsField label="ID" value={tenant.id} mono />
            <SettingsField label="Created" value={new Date(tenant.createdAt).toLocaleDateString()} />
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
        <h2 className="text-lg font-heading font-semibold text-slate-900">Account Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <SettingsField label="Admin Name" value={user?.name || "—"} />
          <SettingsField label="Email" value={user?.email || "—"} />
          <SettingsField label="Role" value={user?.role.replace(/_/g, " ") || "—"} />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
        <h2 className="text-lg font-heading font-semibold text-slate-900">Preferences</h2>
        <div className="space-y-3">
          <ToggleSetting label="Email notifications for new enrollments" defaultOn />
          <ToggleSetting label="Weekly performance digest email" defaultOn />
          <ToggleSetting label="Alert when usage exceeds 80% of limits" defaultOn />
          <ToggleSetting label="Auto-approve teacher account requests" defaultOn={false} />
        </div>
      </div>

      <div className="bg-gradient-to-br from-violet-50 to-purple-50 rounded-2xl border border-violet-200 p-6">
        <div className="flex items-start gap-3">
          <span className="text-2xl">🔒</span>
          <div>
            <h3 className="font-semibold text-violet-900">Advanced Settings</h3>
            <p className="text-sm text-violet-700 mt-1">
              For subscription changes, SSO configuration, or API access, contact your platform administrator.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function SettingsField({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="space-y-1">
      <label className="text-xs text-slate-400 font-medium uppercase tracking-wide">{label}</label>
      <div className={`px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-700 ${mono ? "font-mono text-xs" : ""}`}>
        {value}
      </div>
    </div>
  );
}

function ToggleSetting({ label, defaultOn }: { label: string; defaultOn?: boolean }) {
  const [on, setOn] = useState(defaultOn ?? false);
  return (
    <div className="flex items-center justify-between py-2 px-3 rounded-xl hover:bg-slate-50 transition">
      <span className="text-sm text-slate-700">{label}</span>
      <button
        onClick={() => setOn(!on)}
        className={`w-10 h-6 rounded-full transition-colors relative ${on ? "bg-violet-500" : "bg-slate-300"}`}
      >
        <div className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-all ${on ? "left-5" : "left-1"}`} />
      </button>
    </div>
  );
}
