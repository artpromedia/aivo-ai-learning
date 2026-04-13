"use client";
import { useAuth } from "@/providers/auth-provider";
import { useEffect, useState } from "react";
import Image from "next/image";
import { TUTORS, type TutorKey } from "@aivo/brand";
import { useTranslations } from "next-intl";

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
  const t = useTranslations("platformAdmin");
  const tc = useTranslations("common");
  const td = useTranslations("dashboard");
  const [brainOverview, setBrainOverview] = useState<BrainOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedTutor, setExpandedTutor] = useState<TutorKey | null>(null);

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
        <h1 className="text-2xl font-heading font-bold text-slate-900">{t("ai_usage")}</h1>
        <p className="text-sm text-slate-500 mt-1">Monitor brain clones, AI model performance, and content generation across the platform.</p>
      </div>

      <div className="bg-gradient-to-r from-purple-600 to-purple-800 rounded-2xl p-6 text-white">
        <h2 className="font-heading font-bold text-lg mb-4">{t("ai_usage")}</h2>
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
          <h2 className="font-heading font-bold text-lg text-slate-900 mb-4">{t("services")}</h2>
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
          <h2 className="font-heading font-bold text-lg text-slate-900 mb-4">{td("overview")}</h2>
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
        <h2 className="font-heading font-bold text-lg text-slate-900 mb-4">{t("audit_logs")}</h2>
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
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-heading font-bold text-lg text-slate-900">{t("ai_usage")}</h2>
          <div className="flex items-center gap-3 text-xs text-slate-400">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-400" /> 7 Core</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400" /> 7 Expansion</span>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
          {(Object.entries(TUTORS) as [TutorKey, typeof TUTORS[TutorKey]][]).map(([key, t]) => (
            <button
              key={key}
              onClick={() => setExpandedTutor(expandedTutor === key ? null : key)}
              className={`p-3 rounded-xl border text-center transition cursor-pointer group ${
                expandedTutor === key
                  ? "border-2 shadow-md"
                  : "border-slate-100 hover:shadow-sm hover:border-slate-200"
              }`}
              style={expandedTutor === key ? { borderColor: t.color } : undefined}
            >
              <div className="relative w-12 h-12 rounded-full mx-auto mb-2 overflow-hidden border-2 group-hover:scale-110 transition-transform shadow-sm" style={{ borderColor: t.color }}>
                <Image src={t.avatar} alt={t.name} fill className="object-cover object-top" sizes="48px" />
              </div>
              <p className="text-xs font-bold text-slate-700">{t.name}</p>
              <p className="text-[10px] text-slate-400 leading-tight">{t.domain}</p>
              <span className={`inline-block mt-1 px-1.5 py-0.5 text-[9px] font-bold rounded-full ${
                t.tier === "core" ? "bg-blue-50 text-blue-600" : "bg-amber-50 text-amber-600"
              }`}>{t.tier}</span>
            </button>
          ))}
        </div>

        {expandedTutor && TUTORS[expandedTutor] && (() => {
          const t = TUTORS[expandedTutor];
          return (
            <div className="mt-4 p-5 rounded-xl border-2 animate-in fade-in slide-in-from-top-2 duration-200" style={{ borderColor: t.color, backgroundColor: `${t.color}08` }}>
              <div className="flex items-start gap-4">
                <div className="relative w-20 h-20 rounded-xl overflow-hidden border-2 shadow-lg flex-shrink-0" style={{ borderColor: t.color }}>
                  <Image src={t.avatar} alt={t.name} fill className="object-cover object-top" sizes="80px" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="font-heading font-bold text-lg" style={{ color: t.color }}>{t.name}</h3>
                    <span className="text-xl">{t.icon}</span>
                    <span className={`px-2 py-0.5 text-xs rounded-full font-semibold ${
                      t.tier === "core" ? "bg-blue-100 text-blue-700" : "bg-amber-100 text-amber-700"
                    }`}>{t.tier}</span>
                  </div>
                  <p className="text-sm text-slate-600 font-semibold">{t.domain}</p>
                  <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="bg-white rounded-lg p-3 border border-slate-100">
                      <p className="text-[10px] text-slate-400 font-semibold uppercase">Tutor Key</p>
                      <p className="text-sm font-mono font-bold text-slate-700">{expandedTutor}</p>
                    </div>
                    <div className="bg-white rounded-lg p-3 border border-slate-100">
                      <p className="text-[10px] text-slate-400 font-semibold uppercase">Tier</p>
                      <p className="text-sm font-bold text-slate-700 capitalize">{t.tier}</p>
                    </div>
                    <div className="bg-white rounded-lg p-3 border border-slate-100">
                      <p className="text-[10px] text-slate-400 font-semibold uppercase">Color</p>
                      <div className="flex items-center gap-2">
                        <span className="w-4 h-4 rounded-full border" style={{ backgroundColor: t.color }} />
                        <p className="text-sm font-mono font-bold text-slate-700">{t.color}</p>
                      </div>
                    </div>
                    <div className="bg-white rounded-lg p-3 border border-slate-100">
                      <p className="text-[10px] text-slate-400 font-semibold uppercase">Levels</p>
                      <p className="text-sm font-bold text-slate-700">All 5</p>
                    </div>
                  </div>
                  <div className="mt-3 bg-white rounded-lg p-3 border border-slate-100">
                    <p className="text-[10px] text-slate-400 font-semibold uppercase mb-1">Functioning Level Adaptations</p>
                    <div className="flex flex-wrap gap-1.5">
                      {["STANDARD", "SUPPORTED", "LOW_VERBAL", "NON_VERBAL", "PRE_SYMBOLIC"].map((level) => (
                        <span key={level} className={`px-2 py-0.5 text-[10px] rounded-full font-semibold ${LEVEL_COLORS[level] || "bg-slate-100 text-slate-600"}`}>
                          {level.replace(/_/g, " ")}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
}
