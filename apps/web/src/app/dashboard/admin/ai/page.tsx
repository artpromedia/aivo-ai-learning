"use client";
import { useAuth } from "@/providers/auth-provider";
import { useEffect, useState } from "react";

interface BrainOverview {
  total: number;
  byStatus: Record<string, number>;
  byLevel: Record<string, number>;
  recentClones: { learnerId: string; learnerName: string; version: number; status: string; createdAt: string }[];
}

const STATUS_COLORS: Record<string, { label: string; color: string }> = {
  active: { label: "Active", color: "bg-green-100 text-green-700" },
  pending_parent_review: { label: "Pending Review", color: "bg-amber-100 text-amber-700" },
  archived: { label: "Archived", color: "bg-slate-100 text-slate-600" },
  declined: { label: "Declined", color: "bg-red-100 text-red-700" },
};

const LEVEL_COLORS: Record<string, string> = {
  STANDARD: "bg-green-100 text-green-700",
  SUPPORTED: "bg-blue-100 text-blue-700",
  LOW_VERBAL: "bg-amber-100 text-amber-700",
  NON_VERBAL: "bg-orange-100 text-orange-700",
  PRE_SYMBOLIC: "bg-red-100 text-red-700",
};

const AI_PROVIDERS = [
  { name: "Claude Sonnet", provider: "Anthropic", status: "primary", model: "claude-sonnet-4-20250514", icon: "🟣" },
  { name: "Gemini Flash", provider: "Google", status: "fallback", model: "gemini-2.0-flash", icon: "🔵" },
  { name: "GPT-4o Mini", provider: "OpenAI", status: "fallback", model: "gpt-4o-mini", icon: "🟢" },
];

export default function AdminAIPage() {
  const { accessToken } = useAuth();
  const [brainOverview, setBrainOverview] = useState<BrainOverview | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!accessToken) return;
    setLoading(true);
    fetch("/api/admin/stats", { headers: { Authorization: `Bearer ${accessToken}` } })
      .then((r) => r.ok ? r.json() : null)
      .then((stats) => {
        if (stats) {
          setBrainOverview({
            total: stats.totalLearners || 0,
            byStatus: {},
            byLevel: {},
            recentClones: [],
          });
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [accessToken]);

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold text-slate-900">AI & Brain Model Management</h1>
        <p className="text-sm text-slate-500 mt-1">Monitor brain clones, AI model performance, and content generation across the platform.</p>
      </div>

      <div className="bg-gradient-to-r from-purple-600 to-purple-800 rounded-2xl p-6 text-white">
        <h2 className="font-heading font-bold text-lg mb-4">Brain Clone Architecture</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div>
            <p className="text-3xl font-bold">{brainOverview?.total ?? "—"}</p>
            <p className="text-sm text-purple-200">Total Learners</p>
          </div>
          <div>
            <p className="text-3xl font-bold">5</p>
            <p className="text-sm text-purple-200">Functioning Levels</p>
          </div>
          <div>
            <p className="text-3xl font-bold">14</p>
            <p className="text-sm text-purple-200">AI Tutors</p>
          </div>
          <div>
            <p className="text-3xl font-bold">3</p>
            <p className="text-sm text-purple-200">LLM Providers</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
          <h2 className="font-heading font-bold text-lg text-slate-900 mb-4">LLM Provider Configuration</h2>
          <p className="text-xs text-slate-400 mb-4">Priority: Claude Sonnet → Gemini Flash → GPT-4o Mini</p>
          <div className="space-y-3">
            {AI_PROVIDERS.map((p) => (
              <div key={p.name} className="flex items-center justify-between p-4 rounded-xl border border-slate-100 hover:border-purple-200 transition">
                <div className="flex items-center gap-3">
                  <span className="text-xl">{p.icon}</span>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{p.name}</p>
                    <p className="text-xs text-slate-400">{p.provider} &middot; {p.model}</p>
                  </div>
                </div>
                <span className={`px-2.5 py-0.5 text-xs rounded-full font-semibold ${
                  p.status === "primary" ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-600"
                }`}>
                  {p.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
          <h2 className="font-heading font-bold text-lg text-slate-900 mb-4">Brain Clone Pipeline</h2>
          <div className="space-y-4">
            {[
              { step: "1", label: "Baseline Assessment", desc: "6-domain Discovery Adventure", status: "active" },
              { step: "2", label: "Parent Questionnaire", desc: "49-question intake form (11 categories)", status: "active" },
              { step: "3", label: "Functioning Level Classification", desc: "5-level auto-classification", status: "active" },
              { step: "4", label: "Brain State Creation", desc: "Mastery levels, accommodations, tutor config", status: "active" },
              { step: "5", label: "XAI Explanation Generation", desc: "Transparent decision rationale", status: "active" },
              { step: "6", label: "Parent Review & Approval", desc: "Approve / Add Context / Start Over", status: "active" },
            ].map((s) => (
              <div key={s.step} className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                  {s.step}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-slate-900">{s.label}</p>
                    <span className="w-2 h-2 rounded-full bg-green-500" />
                  </div>
                  <p className="text-xs text-slate-400">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
        <h2 className="font-heading font-bold text-lg text-slate-900 mb-4">RAI (Responsible AI) Compliance</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[
            { label: "COPPA Consent Gate", status: true, detail: "Parental consent required before data collection" },
            { label: "Content Safety Filter", status: true, detail: "All AI-generated content passes quality & safety checks" },
            { label: "Bias Detection", status: true, detail: "Content checked for cultural and demographic sensitivity" },
            { label: "Data Encryption", status: true, detail: "Brain state encrypted at rest (AES-256)" },
            { label: "Parent Approval Loop", status: true, detail: "Level changes and accommodations require parent consent" },
            { label: "Full Audit Trail", status: true, detail: "Every brain version tracked with decision rationale" },
          ].map((c) => (
            <div key={c.label} className="flex items-start gap-3 p-4 rounded-xl bg-green-50 border border-green-100">
              <span className="text-green-500 mt-0.5 flex-shrink-0 font-bold">✓</span>
              <div>
                <p className="text-sm font-bold text-slate-700">{c.label}</p>
                <p className="text-xs text-slate-400 mt-0.5">{c.detail}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
        <h2 className="font-heading font-bold text-lg text-slate-900 mb-4">AI Tutors</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
          {[
            { name: "Nova", domain: "Math", color: "#7C3AED" },
            { name: "Sage", domain: "ELA", color: "#10B981" },
            { name: "Spark", domain: "Science", color: "#F59E0B" },
            { name: "Chrono", domain: "History", color: "#6366F1" },
            { name: "Pixel", domain: "Coding", color: "#06B6D4" },
            { name: "Echo", domain: "Speech", color: "#EC4899" },
            { name: "Harmony", domain: "SEL", color: "#8B5CF6" },
            { name: "Atlas", domain: "Geography", color: "#14B8A6" },
            { name: "Cadence", domain: "Music", color: "#D946EF" },
            { name: "Vigor", domain: "PE/Health", color: "#22C55E" },
            { name: "Lingua", domain: "Languages", color: "#0EA5E9" },
            { name: "Forge", domain: "STEM", color: "#EF4444" },
            { name: "Compass", domain: "Life Skills", color: "#F97316" },
            { name: "Muse", domain: "Creative", color: "#A855F7" },
          ].map((t) => (
            <div key={t.name} className="p-3 rounded-xl border border-slate-100 text-center hover:shadow-sm transition">
              <div className="w-10 h-10 rounded-full mx-auto mb-2 flex items-center justify-center text-white text-sm font-bold" style={{ backgroundColor: t.color }}>
                {t.name.charAt(0)}
              </div>
              <p className="text-xs font-bold text-slate-700">{t.name}</p>
              <p className="text-[10px] text-slate-400">{t.domain}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
