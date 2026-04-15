"use client";
import { useAuth } from "@/providers/auth-provider";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { AccessibleToggle } from "@/components/a11y/AccessibleToggle";

export default function CaregiverSettingsPage() {
  const { user, loading } = useAuth();
  const td = useTranslations("dashboard");
  const tc = useTranslations("common");
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [dailySummary, setDailySummary] = useState(true);
  const [iepAlerts, setIepAlerts] = useState(true);
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
            <p className="text-green-600 font-semibold">Caregiver</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
        <h2 className="font-heading font-bold text-lg text-slate-900 mb-4">{tc("details")}</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-900">Email Notifications</p>
              <p className="text-xs text-slate-500">Receive email updates about your learners</p>
            </div>
            <AccessibleToggle id="email-notifs" value={emailNotifs} onChange={setEmailNotifs} label="Email Notifications" description="Receive email updates about your learners" color="bg-green-600" />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-900">Daily Summary</p>
              <p className="text-xs text-slate-500">Receive a daily summary of learner activities</p>
            </div>
            <AccessibleToggle id="daily-summary" value={dailySummary} onChange={setDailySummary} label="Daily Summary" description="Receive a daily summary of learner activities" color="bg-green-600" />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-900">IEP Goal Alerts</p>
              <p className="text-xs text-slate-500">Notifications when IEP goals reach milestones</p>
            </div>
            <AccessibleToggle id="iep-alerts" value={iepAlerts} onChange={setIepAlerts} label="IEP Goal Alerts" description="Notifications when IEP goals reach milestones" color="bg-green-600" />
          </div>
        </div>
        {settingsSaved && <p className="text-sm text-green-600 mt-3 font-medium" role="status" aria-live="polite">Settings saved!</p>}
        <button onClick={() => { setSettingsSaved(true); setTimeout(() => setSettingsSaved(false), 3000); }}
          className="mt-4 px-6 py-2.5 rounded-xl bg-green-600 text-white font-bold text-sm hover:bg-green-700 transition">
          Save Preferences
        </button>
      </div>
    </div>
  );
}
