"use client";
import { useAuth } from "@/providers/auth-provider";
import { useEffect, useState } from "react";
import { IconWell, StatIconWell } from "@/components/discovery/_vi";
import { Gauge, Users, GraduationCap, UserCog, School, Lightbulb, type LucideIcon } from "lucide-react";

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
      <header className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4">
          <IconWell color="math">
            <Gauge size={28} strokeWidth={2.5} aria-hidden="true" />
          </IconWell>
          <div>
            <h1 className="text-2xl font-heading font-bold vi-text">Usage & Limits</h1>
            <p className="text-sm vi-text-muted mt-1">Monitor your district&apos;s platform usage against your subscription limits.</p>
          </div>
        </div>
        {usage && (
          <span className="px-3 py-1 bg-[hsl(var(--visual-primary)/0.12)] text-[hsl(var(--visual-primary))] rounded-full text-xs font-semibold">
            {usage.plan} Plan
          </span>
        )}
      </header>

      {usage && (
        <>
          <div className="grid gap-4 md:grid-cols-2">
            <UsageCard label="User Accounts" used={usage.users.used} limit={usage.users.limit} Icon={Users} well="bg-[hsl(var(--visual-primary)/0.12)] text-[hsl(var(--visual-primary))]" />
            <UsageCard label="Learners" used={usage.learners.used} limit={usage.learners.limit} Icon={GraduationCap} well="bg-[hsl(var(--visual-math)/0.12)] text-[hsl(var(--visual-math))]" />
            <UsageCard label="Teachers" used={usage.teachers.used} limit={usage.teachers.limit} Icon={UserCog} well="bg-[hsl(var(--visual-reading)/0.12)] text-[hsl(var(--visual-reading))]" />
            <UsageCard label="Schools" used={usage.schools.used} limit={usage.schools.limit} Icon={School} well="bg-[hsl(var(--visual-science)/0.12)] text-[hsl(var(--visual-science))]" />
          </div>

          <div className="vi-card p-6 space-y-4">
            <h2 className="text-lg font-heading font-semibold vi-text">AI Usage</h2>
            <div className="grid gap-4 md:grid-cols-3">
              <AiUsageStat label="AI Calls" value={usage.aiCalls.used} limit={usage.aiCalls.limit} period={usage.aiCalls.period} />
              <AiUsageStat label="Tutor Sessions" value={usage.tutorSessions.used} limit={usage.tutorSessions.limit} period={usage.tutorSessions.period} />
              <AiUsageStat label="Storage" value={usage.storage.usedMb} limit={usage.storage.limitMb} unit="MB" />
            </div>
            <p className="text-xs vi-text-muted">
              AI usage tracking will populate as learners interact with tutors. Limits are based on your subscription tier.
            </p>
          </div>
        </>
      )}

      <div className="vi-surface-soft rounded-2xl border border-[hsl(var(--visual-primary)/0.3)] p-6">
        <div className="flex items-start gap-3">
          <StatIconWell color="primary" className="flex-shrink-0">
            <Lightbulb size={22} strokeWidth={2.5} aria-hidden="true" />
          </StatIconWell>
          <div>
            <h3 className="font-semibold text-violet-900">Need higher limits?</h3>
            <p className="text-sm text-[hsl(var(--visual-primary))] mt-1">
              Contact your platform administrator to upgrade your district&apos;s subscription plan for increased usage limits.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function UsageCard({ label, used, limit, Icon, well }: { label: string; used: number; limit: number; Icon: LucideIcon; well: string }) {
  const pct = Math.min(100, Math.round((used / limit) * 100));
  const isHigh = pct > 80;

  return (
    <div className="vi-card p-5 hover:shadow-md transition">
      <div className="flex items-center gap-3 mb-3">
        <StatIconWell wellClass={well}>
          <Icon size={22} strokeWidth={2.5} aria-hidden="true" />
        </StatIconWell>
        <span className="text-sm vi-text-muted font-medium">{label}</span>
      </div>
      <div className="flex items-baseline gap-1 mb-2">
        <span className="text-2xl font-bold vi-text">{used.toLocaleString()}</span>
        <span className="text-sm vi-text-muted">/ {limit.toLocaleString()}</span>
      </div>
      <div className="h-2.5 rounded-full vi-surface-soft overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${isHigh ? "bg-[hsl(var(--visual-sel))]" : "bg-[hsl(var(--visual-primary))]"}`}
          style={{ width: `${Math.max(2, pct)}%` }}
        />
      </div>
      <p className={`text-xs mt-1 font-medium ${isHigh ? "text-[hsl(var(--visual-sel))]" : "vi-text-muted"}`}>
        {pct}% used
      </p>
    </div>
  );
}

function AiUsageStat({ label, value, limit, period, unit }: { label: string; value: number; limit: number; period?: string; unit?: string }) {
  const pct = limit > 0 ? Math.round((value / limit) * 100) : 0;
  return (
    <div className="vi-bg rounded-xl p-4 border vi-border">
      <p className="text-xs vi-text-muted font-medium">{label}</p>
      <p className="text-xl font-bold vi-text mt-1">{value.toLocaleString()} {unit || ""}</p>
      <p className="text-xs vi-text-muted mt-0.5">{pct}% of {limit.toLocaleString()} {unit || ""} limit{period ? ` (${period})` : ""}</p>
    </div>
  );
}
