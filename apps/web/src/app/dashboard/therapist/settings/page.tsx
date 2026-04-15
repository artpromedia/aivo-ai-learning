"use client";
import { useAuth } from "@/providers/auth-provider";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { AccessibleToggle } from "@/components/a11y/AccessibleToggle";

export default function TherapistSettingsPage() {
  const { user, loading } = useAuth();
  const td = useTranslations("dashboard");
  const tc = useTranslations("common");
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [sessionReminders, setSessionReminders] = useState(true);
  const [goalAlerts, setGoalAlerts] = useState(true);
  const [settingsSaved, setSettingsSaved] = useState(false);

  if (loading || !user) return null;

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
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-900">Email Notifications</p>
              <p className="text-xs text-slate-500">Receive email updates about your clients</p>
            </div>
            <AccessibleToggle id="email-notifs" value={emailNotifs} onChange={setEmailNotifs} label="Email Notifications" description="Receive email updates about your clients" color="bg-pink-600" />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-900">Session Reminders</p>
              <p className="text-xs text-slate-500">Get reminders before scheduled therapy sessions</p>
            </div>
            <AccessibleToggle id="session-reminders" value={sessionReminders} onChange={setSessionReminders} label="Session Reminders" description="Get reminders before scheduled therapy sessions" color="bg-pink-600" />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-900">Goal Progress Alerts</p>
              <p className="text-xs text-slate-500">Notifications when a therapy goal reaches milestones</p>
            </div>
            <AccessibleToggle id="goal-alerts" value={goalAlerts} onChange={setGoalAlerts} label="Goal Progress Alerts" description="Notifications when a therapy goal reaches milestones" color="bg-pink-600" />
          </div>
        </div>
        {settingsSaved && <p className="text-sm text-green-600 mt-3 font-medium" role="status" aria-live="polite">Settings saved!</p>}
        <button onClick={() => { setSettingsSaved(true); setTimeout(() => setSettingsSaved(false), 3000); }}
          className="mt-4 px-6 py-2.5 rounded-xl bg-pink-600 text-white font-bold text-sm hover:bg-pink-700 transition">
          Save Preferences
        </button>
      </div>
    </div>
  );
}
