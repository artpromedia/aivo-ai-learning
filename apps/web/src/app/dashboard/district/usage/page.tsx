"use client";
import { useAuth } from "@/providers/auth-provider";
import { useEffect, useState } from "react";

interface UsageData {
  users: { used: number; limit: number };
  learners: { used: number; limit: number };
  teachers: { used: number; limit: number };
  schools: { used: number; limit: number };
  aiCalls: { used: number; limit: number; period: string };
  tutorSessions: { used: number; limit: number; period: string };
  storage: { usedMb: number; limitMb: number };
  plan: string;
}

export default function DistrictUsagePage() {
  const { accessToken } = useAuth();
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!accessToken) return;
    fetch("/api/district/usage", { headers: { Authorization: `Bearer ${accessToken}` } })
      .then((r) => r.ok ? r.json() : null)
      .then(setUsage)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [accessToken]);

  if (loading) {
    return (
      <div className="p-8 animate-pulse space-y-4">
        <div className="h-8 bg-slate-200 rounded-lg w-48" />
        {[1, 2, 3, 4].map((i) => <div key={i} className="h-20 bg-slate-200 rounded-2xl" />)}
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold text-slate-900">Usage & Limits</h1>
          <p className="text-sm text-slate-500 mt-1">Monitor your district&apos;s platform usage against your subscription limits.</p>
        </div>
        {usage && (
          <span className="px-3 py-1 bg-violet-100 text-violet-700 rounded-full text-xs font-semibold">
            {usage.plan} Plan
          </span>
        )}
      </header>

      {usage && (
        <>
          <div className="grid gap-4 md:grid-cols-2">
            <UsageCard label="User Accounts" used={usage.users.used} limit={usage.users.limit} icon="👥" />
            <UsageCard label="Learners" used={usage.learners.used} limit={usage.learners.limit} icon="🎓" />
            <UsageCard label="Teachers" used={usage.teachers.used} limit={usage.teachers.limit} icon="👩‍🏫" />
            <UsageCard label="Schools" used={usage.schools.used} limit={usage.schools.limit} icon="🏫" />
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
            <h2 className="text-lg font-heading font-semibold text-slate-900">AI Usage</h2>
            <div className="grid gap-4 md:grid-cols-3">
              <AiUsageStat label="AI Calls" value={usage.aiCalls.used} limit={usage.aiCalls.limit} period={usage.aiCalls.period} />
              <AiUsageStat label="Tutor Sessions" value={usage.tutorSessions.used} limit={usage.tutorSessions.limit} period={usage.tutorSessions.period} />
              <AiUsageStat label="Storage" value={usage.storage.usedMb} limit={usage.storage.limitMb} unit="MB" />
            </div>
            <p className="text-xs text-slate-400">
              AI usage tracking will populate as learners interact with tutors. Limits are based on your subscription tier.
            </p>
          </div>
        </>
      )}

      <div className="bg-gradient-to-br from-violet-50 to-purple-50 rounded-2xl border border-violet-200 p-6">
        <div className="flex items-start gap-3">
          <span className="text-2xl">💡</span>
          <div>
            <h3 className="font-semibold text-violet-900">Need higher limits?</h3>
            <p className="text-sm text-violet-700 mt-1">
              Contact your platform administrator to upgrade your district&apos;s subscription plan for increased usage limits.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function UsageCard({ label, used, limit, icon }: { label: string; used: number; limit: number; icon: string }) {
  const pct = Math.min(100, Math.round((used / limit) * 100));
  const isHigh = pct > 80;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 hover:shadow-md transition">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-lg">{icon}</span>
        <span className="text-sm text-slate-500 font-medium">{label}</span>
      </div>
      <div className="flex items-baseline gap-1 mb-2">
        <span className="text-2xl font-bold text-slate-900">{used.toLocaleString()}</span>
        <span className="text-sm text-slate-400">/ {limit.toLocaleString()}</span>
      </div>
      <div className="h-2.5 rounded-full bg-slate-100 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${isHigh ? "bg-amber-500" : "bg-violet-500"}`}
          style={{ width: `${Math.max(2, pct)}%` }}
        />
      </div>
      <p className={`text-xs mt-1 font-medium ${isHigh ? "text-amber-600" : "text-slate-400"}`}>
        {pct}% used
      </p>
    </div>
  );
}

function AiUsageStat({ label, value, limit, period, unit }: { label: string; value: number; limit: number; period?: string; unit?: string }) {
  const pct = limit > 0 ? Math.round((value / limit) * 100) : 0;
  return (
    <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
      <p className="text-xs text-slate-500 font-medium">{label}</p>
      <p className="text-xl font-bold text-slate-900 mt-1">{value.toLocaleString()} {unit || ""}</p>
      <p className="text-xs text-slate-400 mt-0.5">{pct}% of {limit.toLocaleString()} {unit || ""} limit{period ? ` (${period})` : ""}</p>
    </div>
  );
}
