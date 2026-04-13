"use client";
import { useAuth } from "@/providers/auth-provider";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

interface PlatformConfig {
  featureFlags: Record<string, boolean>;
  systemLimits: Record<string, number>;
}

export default function AdminSettingsPage() {
  const { user, accessToken } = useAuth();
  const t = useTranslations("settings");
  const tc = useTranslations("common");
  const tp = useTranslations("platformAdmin");
  const [config, setConfig] = useState<PlatformConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "success" | "error">("idle");

  const isPlatformAdmin = user?.role === "PLATFORM_ADMIN";

  useEffect(() => {
    if (!accessToken) return;
    const defaultConfig: PlatformConfig = {
      featureFlags: {
        brainCloneEnabled: true,
        baselineAssessmentEnabled: true,
        aiTutorsEnabled: true,
        recommendationsEnabled: true,
        homeworkScanEnabled: true,
        billingEnabled: true,
        mobileAppEnabled: false,
        ssoEnabled: false,
        researchExportEnabled: true,
        maintenanceMode: false,
      },
      systemLimits: {
        maxLearnersPerParent: 6,
        maxSessionDurationMinutes: 60,
        maxApiRequestsPerMinute: 100,
        brainSnapshotRetention: 30,
        sessionHistoryRetentionDays: 365,
      },
    };
    fetch("/api/admin-svc/config", { headers: { Authorization: `Bearer ${accessToken}` } })
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (data?.features) {
          const merged = { ...defaultConfig };
          Object.entries(data.features).forEach(([k, v]) => {
            const flagKey = k + "Enabled";
            if (flagKey in merged.featureFlags) merged.featureFlags[flagKey] = v as boolean;
            else merged.featureFlags[k] = v as boolean;
          });
          if (data.limits) {
            Object.entries(data.limits).forEach(([k, v]) => {
              merged.systemLimits[k] = v as number;
            });
          }
          setConfig(merged);
        } else if (data?.featureFlags) {
          setConfig(data);
        } else {
          setConfig(defaultConfig);
        }
      })
      .catch(() => setConfig(defaultConfig))
      .finally(() => setLoading(false));
  }, [accessToken]);

  const handleToggleFlag = (flag: string) => {
    if (!config || !isPlatformAdmin) return;
    setConfig({
      ...config,
      featureFlags: { ...config.featureFlags, [flag]: !config.featureFlags[flag] },
    });
  };

  const handleLimitChange = (key: string, value: string) => {
    if (!config || !isPlatformAdmin) return;
    const num = parseInt(value);
    if (isNaN(num)) return;
    setConfig({
      ...config,
      systemLimits: { ...config.systemLimits, [key]: num },
    });
  };

  const handleSave = async () => {
    if (!config || !accessToken || !isPlatformAdmin) return;
    setSaving(true);
    setSaveStatus("idle");
    try {
      const res = await fetch("/api/admin-svc/config", {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify(config),
      });
      setSaveStatus(res.ok ? "success" : "error");
    } catch {
      setSaveStatus("error");
    }
    setSaving(false);
    setTimeout(() => setSaveStatus("idle"), 3000);
  };

  const FLAG_DESCRIPTIONS: Record<string, { label: string; desc: string; critical?: boolean }> = {
    brainCloneEnabled: { label: "Brain Clone Pipeline", desc: "Enable brain state creation from baseline assessments" },
    baselineAssessmentEnabled: { label: "Baseline Assessments", desc: "Allow new learners to take the Discovery Adventure" },
    aiTutorsEnabled: { label: "AI Tutors", desc: "Enable AI-powered tutoring sessions" },
    recommendationsEnabled: { label: "Recommendations Engine", desc: "Auto-generate learning recommendations" },
    homeworkScanEnabled: { label: "Homework Scanner", desc: "Allow parents to scan and upload homework" },
    billingEnabled: { label: "Billing & Subscriptions", desc: "Enable payment processing and plan management" },
    mobileAppEnabled: { label: "Mobile App", desc: "Enable mobile application access" },
    ssoEnabled: { label: "SSO/SAML", desc: "Enterprise single sign-on for districts" },
    researchExportEnabled: { label: "Research Data Export", desc: "Allow anonymized data export for research" },
    maintenanceMode: { label: "Maintenance Mode", desc: "Put the platform in maintenance mode", critical: true },
  };

  const LIMIT_DESCRIPTIONS: Record<string, { label: string; desc: string; unit: string }> = {
    maxLearnersPerParent: { label: "Max Learners per Parent", desc: "Maximum number of learner profiles per parent account", unit: "learners" },
    maxSessionDurationMinutes: { label: "Max Session Duration", desc: "Maximum length of a single tutoring session", unit: "minutes" },
    maxApiRequestsPerMinute: { label: "API Rate Limit", desc: "Maximum API requests per minute per user", unit: "req/min" },
    brainSnapshotRetention: { label: "Brain Snapshot Retention", desc: "Number of brain state versions to keep", unit: "versions" },
    sessionHistoryRetentionDays: { label: "Session History Retention", desc: "How long to keep session history data", unit: "days" },
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-400 animate-pulse">Loading platform settings...</div>;
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold text-slate-900">{t("general")}</h1>
          <p className="text-sm text-slate-500 mt-1">Configure feature flags, system limits, and global platform settings.</p>
        </div>
        {isPlatformAdmin && (
          <div className="flex items-center gap-3">
            {saveStatus === "success" && <span className="text-sm text-green-600 font-semibold">Saved!</span>}
            {saveStatus === "error" && <span className="text-sm text-red-600 font-semibold">Save failed</span>}
            <button onClick={handleSave} disabled={saving}
              className="px-5 py-2.5 rounded-xl bg-primary text-white font-semibold text-sm hover:bg-primary-dark transition disabled:opacity-50 shadow-sm">
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
        <h2 className="font-heading font-bold text-lg text-slate-900 mb-1">Feature Flags</h2>
        <p className="text-xs text-slate-400 mb-5">Enable or disable platform features globally.</p>
        <div className="space-y-4">
          {Object.entries(config?.featureFlags || {}).map(([key, enabled]) => {
            const info = FLAG_DESCRIPTIONS[key] || { label: key, desc: "" };
            return (
              <div key={key} className={`flex items-center justify-between p-4 rounded-xl border ${
                info.critical ? "border-red-200 bg-red-50/30" : "border-slate-100"
              }`}>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-slate-900">{info.label}</p>
                    {info.critical && <span className="px-1.5 py-0.5 text-[10px] rounded bg-red-100 text-red-700 font-bold">CRITICAL</span>}
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">{info.desc}</p>
                </div>
                <button
                  onClick={() => handleToggleFlag(key)}
                  disabled={!isPlatformAdmin}
                  className={`relative w-12 h-6 rounded-full transition-colors ${
                    enabled ? (info.critical ? "bg-red-500" : "bg-green-500") : "bg-slate-300"
                  } ${!isPlatformAdmin ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                >
                  <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${enabled ? "left-[26px]" : "left-0.5"}`} />
                </button>
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
        <h2 className="font-heading font-bold text-lg text-slate-900 mb-1">System Limits</h2>
        <p className="text-xs text-slate-400 mb-5">Configure platform-wide resource limits and thresholds.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.entries(config?.systemLimits || {}).map(([key, value]) => {
            const info = LIMIT_DESCRIPTIONS[key] || { label: key, desc: "", unit: "" };
            return (
              <div key={key} className="p-4 rounded-xl border border-slate-100">
                <label className="block text-sm font-semibold text-slate-900 mb-0.5">{info.label}</label>
                <p className="text-xs text-slate-400 mb-2">{info.desc}</p>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={value}
                    onChange={(e) => handleLimitChange(key, e.target.value)}
                    disabled={!isPlatformAdmin}
                    className="w-24 px-3 py-2 rounded-lg border border-slate-200 text-sm font-medium text-right disabled:opacity-50"
                  />
                  <span className="text-xs text-slate-400">{info.unit}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200">
        <h2 className="font-heading font-bold text-lg text-slate-900 mb-4">Platform Information</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Platform Version", value: "v3.0.0" },
            { label: "Architecture", value: "Monorepo (Turborepo)" },
            { label: "Database", value: "PostgreSQL 16" },
            { label: "Auth", value: "JWT RS256" },
            { label: "Frontend", value: "Next.js 15 + Tailwind v4" },
            { label: "Backend (TS)", value: "Fastify 5" },
            { label: "Backend (Python)", value: "FastAPI + Uvicorn" },
            { label: "AI", value: "Claude / Gemini / GPT" },
          ].map((info) => (
            <div key={info.label} className="text-sm">
              <p className="text-slate-400 font-medium">{info.label}</p>
              <p className="text-slate-900 font-semibold">{info.value}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
