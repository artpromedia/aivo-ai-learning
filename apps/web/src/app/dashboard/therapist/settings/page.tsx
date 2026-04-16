"use client";
import { useAuth } from "@/providers/auth-provider";
import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { AccessibleToggle } from "@/components/a11y/AccessibleToggle";

export default function TherapistSettingsPage() {
  const { user, accessToken, loading } = useAuth();
  const td = useTranslations("dashboard");
  const tc = useTranslations("common");
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [sessionReminders, setSessionReminders] = useState(true);
  const [goalAlerts, setGoalAlerts] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "success" | "error">("idle");
  const [loadingPrefs, setLoadingPrefs] = useState(true);

  const fetchPreferences = useCallback(async () => {
    if (!accessToken || !user) return;
    try {
      const res = await fetch(`/api/comms/preferences/${user.id}`, { headers: { Authorization: `Bearer ${accessToken}` } });
      if (res.ok) {
        const data = await res.json();
        if (data.email !== undefined) setEmailNotifs(data.email);
        if (data.sessionReminders !== undefined) setSessionReminders(data.sessionReminders);
        if (data.goalAlerts !== undefined) setGoalAlerts(data.goalAlerts);
      }
    } catch { /* use defaults */ }
    setLoadingPrefs(false);
  }, [accessToken, user]);

  useEffect(() => { fetchPreferences(); }, [fetchPreferences]);

  if (loading || !user) return null;

  const handleSaveSettings = async () => {
    setSaving(true);
    setSaveStatus("idle");
    try {
      const res = await fetch(`/api/comms/preferences/${user.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ email: emailNotifs, sessionReminders, goalAlerts }),
      });
      setSaveStatus(res.ok ? "success" : "error");
    } catch {
      setSaveStatus("error");
    }
    setSaving(false);
    if (saveStatus !== "error") setTimeout(() => setSaveStatus("idle"), 3000);
  };

  return (
    <div className="p-8 max-w-2xl space-y-6">
      <h1 className="text-3xl font-heading font-bold text-slate-900">Settings</h1>

      <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
        <h2 className="font-heading font-bold text-lg text-slate-900 mb-4">{td("overview")}</h2>
        <div className="space-y-3">
          <div>
            <p className="text-xs text-slate-500 font-semibold uppercase">Name</p>
            <p className="text-slate-900 font-medium">{user.name}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500 font-semibold uppercase">Email</p>
            <p className="text-slate-900 font-medium">{user.email}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500 font-semibold uppercase">Role</p>
            <p className="text-pink-600 font-semibold">Therapist</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
        <h2 className="font-heading font-bold text-lg text-slate-900 mb-4">{tc("details")}</h2>
        {loadingPrefs ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => <div key={i} className="h-12 bg-slate-100 rounded-xl animate-pulse motion-reduce:animate-none" />)}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-900" id="email-notifs-label">Email Notifications</p>
                <p className="text-xs text-slate-500" id="email-notifs-desc">Receive email updates about your clients</p>
              </div>
              <AccessibleToggle id="email-notifs" value={emailNotifs} onChange={setEmailNotifs} label="Email Notifications" description="Receive email updates about your clients" color="bg-pink-600" />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-900" id="session-reminders-label">Session Reminders</p>
                <p className="text-xs text-slate-500" id="session-reminders-desc">Reminders before scheduled therapy sessions</p>
              </div>
              <AccessibleToggle id="session-reminders" value={sessionReminders} onChange={setSessionReminders} label="Session Reminders" description="Reminders before scheduled therapy sessions" color="bg-pink-600" />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-900" id="goal-alerts-label">Goal Progress Alerts</p>
                <p className="text-xs text-slate-500" id="goal-alerts-desc">Notification when client goals reach milestones</p>
              </div>
              <AccessibleToggle id="goal-alerts" value={goalAlerts} onChange={setGoalAlerts} label="Goal Progress Alerts" description="Notification when client goals reach milestones" color="bg-pink-600" />
            </div>
          </div>
        )}
        {saveStatus === "success" && <p className="text-sm text-green-600 mt-3 font-medium" role="status" aria-live="polite">Settings saved!</p>}
        {saveStatus === "error" && <p className="text-sm text-red-600 mt-3 font-medium" role="alert">Failed to save settings. Please try again.</p>}
        <button onClick={handleSaveSettings} disabled={saving} aria-busy={saving}
          className="mt-4 px-6 py-2.5 rounded-xl bg-pink-600 text-white font-bold text-sm hover:bg-pink-700 transition disabled:opacity-50 disabled:cursor-not-allowed">
          {saving ? "Saving..." : "Save Preferences"}
        </button>
      </div>
    </div>
  );
}
