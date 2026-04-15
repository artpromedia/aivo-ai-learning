"use client";
import { useAuth } from "@/providers/auth-provider";
import { useEffect, useState, useCallback } from "react";

interface DistrictSettingsData {
  notificationPrefs: Record<string, boolean>;
  ssoConfig: Record<string, any>;
  branding: Record<string, any>;
  featureOverrides: Record<string, boolean>;
}

export default function DistrictSettingsPage() {
  const { accessToken, user } = useAuth();
  const [tenant, setTenant] = useState<any>(null);
  const [settings, setSettings] = useState<DistrictSettingsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");

  useEffect(() => {
    if (!accessToken) return;
    const headers = { Authorization: `Bearer ${accessToken}` };
    Promise.all([
      fetch("/api/district/tenant", { headers }).then((r) => r.ok ? r.json() : null),
      fetch("/api/district/settings", { headers }).then((r) => r.ok ? r.json() : null),
    ])
      .then(([t, s]) => {
        setTenant(t);
        setSettings(s || { notificationPrefs: {}, ssoConfig: {}, branding: {}, featureOverrides: {} });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [accessToken]);

  const saveSettings = useCallback(async (updated: DistrictSettingsData) => {
    if (!accessToken) return;
    setSaving(true);
    setSaveMsg("");
    try {
      const res = await fetch("/api/district/settings", {
        method: "PUT",
        headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
        body: JSON.stringify(updated),
      });
      if (res.ok) {
        const data = await res.json();
        setSettings(data);
        setSaveMsg("Settings saved");
        setTimeout(() => setSaveMsg(""), 2000);
      }
    } catch { }
    finally { setSaving(false); }
  }, [accessToken]);

  const togglePref = (key: string) => {
    if (!settings) return;
    const updated = {
      ...settings,
      notificationPrefs: { ...settings.notificationPrefs, [key]: !settings.notificationPrefs[key] },
    };
    setSettings(updated);
    saveSettings(updated);
  };

  const toggleFeature = (key: string) => {
    if (!settings) return;
    const updated = {
      ...settings,
      featureOverrides: { ...settings.featureOverrides, [key]: !settings.featureOverrides[key] },
    };
    setSettings(updated);
    saveSettings(updated);
  };

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
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold text-slate-900">District Settings</h1>
          <p className="text-sm text-slate-500 mt-1">Configure your district organization and preferences.</p>
        </div>
        {saveMsg && <span className="text-sm text-emerald-600 font-medium">{saveMsg}</span>}
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
        <h2 className="text-lg font-heading font-semibold text-slate-900">Notification Preferences</h2>
        <div className="space-y-3">
          <ToggleSetting label="Email notifications for new enrollments" checked={settings?.notificationPrefs?.newEnrollments !== false} onChange={() => togglePref("newEnrollments")} />
          <ToggleSetting label="Weekly performance digest email" checked={settings?.notificationPrefs?.weeklyDigest !== false} onChange={() => togglePref("weeklyDigest")} />
          <ToggleSetting label="Alert when usage exceeds 80% of limits" checked={settings?.notificationPrefs?.usageAlerts !== false} onChange={() => togglePref("usageAlerts")} />
          <ToggleSetting label="IEP review date reminders" checked={settings?.notificationPrefs?.iepReminders !== false} onChange={() => togglePref("iepReminders")} />
          <ToggleSetting label="Auto-approve teacher account requests" checked={settings?.notificationPrefs?.autoApproveTeachers === true} onChange={() => togglePref("autoApproveTeachers")} />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
        <h2 className="text-lg font-heading font-semibold text-slate-900">Feature Overrides</h2>
        <div className="space-y-3">
          <ToggleSetting label="Enable AI tutor for all learners" checked={settings?.featureOverrides?.aiTutor !== false} onChange={() => toggleFeature("aiTutor")} />
          <ToggleSetting label="Enable sensory profiles" checked={settings?.featureOverrides?.sensoryProfiles !== false} onChange={() => toggleFeature("sensoryProfiles")} />
          <ToggleSetting label="Enable parent portal access" checked={settings?.featureOverrides?.parentPortal !== false} onChange={() => toggleFeature("parentPortal")} />
          <ToggleSetting label="Enable offline mode for mobile" checked={settings?.featureOverrides?.offlineMode !== false} onChange={() => toggleFeature("offlineMode")} />
        </div>
      </div>

      <div className="bg-gradient-to-br from-violet-50 to-purple-50 rounded-2xl border border-violet-200 p-6">
        <div className="flex items-start gap-3">
          <span className="text-2xl">🔒</span>
          <div>
            <h3 className="font-semibold text-violet-900">Advanced Settings</h3>
            <p className="text-sm text-violet-700 mt-1">
              For SSO configuration, branding customization, or API access, contact your platform administrator.
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

function ToggleSetting({ label, checked, onChange }: { label: string; checked: boolean; onChange: () => void }) {
  return (
    <div className="flex items-center justify-between py-2 px-3 rounded-xl hover:bg-slate-50 transition">
      <span className="text-sm text-slate-700">{label}</span>
      <button
        onClick={onChange}
        className={`w-10 h-6 rounded-full transition-colors relative ${checked ? "bg-violet-500" : "bg-slate-300"}`}
      >
        <div className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-all ${checked ? "left-5" : "left-1"}`} />
      </button>
    </div>
  );
}
