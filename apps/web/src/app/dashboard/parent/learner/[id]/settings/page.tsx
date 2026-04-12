"use client";
import { useAuth } from "@/providers/auth-provider";
import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";

export default function ParentLearnerSettingsPage() {
  const { user, accessToken, loading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const learnerId = params.id as string;
  const [learnerName, setLearnerName] = useState("Learner");
  const [loadingData, setLoadingData] = useState(true);

  const [readAloud, setReadAloud] = useState(true);
  const [simplifiedUI, setSimplifiedUI] = useState(false);
  const [extendedTime, setExtendedTime] = useState(false);
  const [breakReminders, setBreakReminders] = useState(true);
  const [dailyGoalMinutes, setDailyGoalMinutes] = useState(30);
  const [notifyOnMilestone, setNotifyOnMilestone] = useState(true);
  const [notifyOnStruggle, setNotifyOnStruggle] = useState(true);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.push("/login");
    if (!loading && user && user.role !== "PARENT") router.push("/");
  }, [user, loading, router]);

  useEffect(() => {
    if (!accessToken || !learnerId) return;
    fetch("/api/users/learners", { headers: { Authorization: `Bearer ${accessToken}` } })
      .then(r => r.ok ? r.json() : [])
      .then(data => {
        const list = Array.isArray(data) ? data : [];
        const found = list.find((l: any) => l.id === learnerId);
        if (found) setLearnerName(found.name);
      })
      .catch(() => {})
      .finally(() => setLoadingData(false));
  }, [accessToken, learnerId]);

  if (loading || !user) return null;

  const Toggle = ({ value, onChange, color = "bg-primary" }: { value: boolean; onChange: (v: boolean) => void; color?: string }) => (
    <button onClick={() => onChange(!value)}
      className={`w-11 h-6 rounded-full transition relative ${value ? color : "bg-slate-200"}`}>
      <span className={`absolute w-5 h-5 rounded-full bg-white shadow top-0.5 transition ${value ? "left-[22px]" : "left-0.5"}`} />
    </button>
  );

  const handleSave = () => { setSaved(true); setTimeout(() => setSaved(false), 3000); };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-cyan-50">
      <header className="bg-white/80 backdrop-blur border-b border-slate-200 px-8 py-4 flex items-center justify-between">
        <Image src="/images/aivo-logo-purple.png" alt="AIVO" width={120} height={36} />
        <div className="flex items-center gap-4">
          <Link href="/dashboard/parent" className="text-sm text-primary font-semibold hover:underline">Dashboard</Link>
          <span className="text-sm font-semibold text-slate-600">{user.name}</span>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-8 py-6">
        <Link href={`/dashboard/parent/learner/${learnerId}/overview`}
          className="text-sm text-primary hover:underline font-semibold mb-4 inline-block">← Back to {learnerName}</Link>

        <h1 className="text-2xl font-heading font-bold text-slate-900 mb-6">Settings — {learnerName}</h1>

        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
            <h2 className="font-heading font-bold text-lg text-slate-900 mb-4">Accessibility & Accommodations</h2>
            <div className="space-y-4">
              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <p className="text-sm font-semibold text-slate-900">Read Aloud</p>
                  <p className="text-xs text-slate-400">AI tutors will read content aloud by default</p>
                </div>
                <Toggle value={readAloud} onChange={setReadAloud} />
              </label>
              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <p className="text-sm font-semibold text-slate-900">Simplified UI</p>
                  <p className="text-xs text-slate-400">Reduce visual complexity for less distraction</p>
                </div>
                <Toggle value={simplifiedUI} onChange={setSimplifiedUI} />
              </label>
              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <p className="text-sm font-semibold text-slate-900">Extended Time</p>
                  <p className="text-xs text-slate-400">Give 1.5x time on assessments and quizzes</p>
                </div>
                <Toggle value={extendedTime} onChange={setExtendedTime} />
              </label>
              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <p className="text-sm font-semibold text-slate-900">Break Reminders</p>
                  <p className="text-xs text-slate-400">Prompt breaks every 20 minutes of activity</p>
                </div>
                <Toggle value={breakReminders} onChange={setBreakReminders} />
              </label>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
            <h2 className="font-heading font-bold text-lg text-slate-900 mb-4">Learning Goals</h2>
            <div>
              <label className="text-xs text-slate-400 font-semibold uppercase">Daily Learning Goal (minutes)</label>
              <div className="flex items-center gap-4 mt-2">
                <input type="range" min={10} max={120} step={5} value={dailyGoalMinutes}
                  onChange={e => setDailyGoalMinutes(Number(e.target.value))}
                  className="flex-1 accent-primary" />
                <span className="text-lg font-bold text-primary w-16 text-right">{dailyGoalMinutes}m</span>
              </div>
              <p className="text-xs text-slate-400 mt-1">Recommended: 20–45 minutes per day</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
            <h2 className="font-heading font-bold text-lg text-slate-900 mb-4">Parent Notifications for {learnerName}</h2>
            <div className="space-y-4">
              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <p className="text-sm font-semibold text-slate-900">Milestone Notifications</p>
                  <p className="text-xs text-slate-400">Get notified when {learnerName} earns badges or completes quests</p>
                </div>
                <Toggle value={notifyOnMilestone} onChange={setNotifyOnMilestone} />
              </label>
              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <p className="text-sm font-semibold text-slate-900">Struggle Alerts</p>
                  <p className="text-xs text-slate-400">Get notified when {learnerName} struggles repeatedly with a topic</p>
                </div>
                <Toggle value={notifyOnStruggle} onChange={setNotifyOnStruggle} />
              </label>
            </div>
          </div>

          {saved && <p className="text-sm text-green-600 bg-green-50 p-3 rounded-lg font-medium">Settings saved for {learnerName}!</p>}
          <button onClick={handleSave}
            className="w-full py-3 rounded-xl bg-primary text-white font-bold text-sm hover:bg-primary-dark transition">
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
}
