"use client";
import { useAuth } from "@/providers/auth-provider";
import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { TUTORS, type TutorKey } from "@aivo/brand";

interface MasteryDecision {
  domain: string;
  score: number;
  display_label: string;
  reasoning: string;
  source: string;
  raw_score?: string;
  difficulty?: string;
}

interface AccommodationDecision {
  accommodation: string;
  display_label: string;
  reasoning: string;
  source: string;
  removable: boolean;
}

interface TutorDecision {
  tutor_key: string;
  reasoning: string;
  source: string;
}

interface SignalDecision {
  signal: string;
  value: string;
  display_label: string;
  reasoning: string;
  source: string;
}

interface XaiExplanation {
  summary: string;
  rai_compliance: {
    data_sources: string[];
    bias_mitigations: string[];
    transparency: string;
    human_oversight: string;
  };
  mastery_decisions: MasteryDecision[];
  accommodation_decisions: AccommodationDecision[];
  tutor_decisions: TutorDecision[];
  signal_decisions: SignalDecision[];
}

interface BrainReview {
  id: string;
  learner_name: string;
  grade_level?: string;
  functioning_level?: string;
  approval_status: string;
  mastery_levels: Record<string, number>;
  disability_signals: Record<string, any>;
  active_accommodations: string[];
  active_tutors: string[];
  xai_explanation: XaiExplanation;
  parent_notes?: string;
}

const MASTERY_COLORS: Record<string, string> = {
  math: "from-blue-500 to-blue-600",
  ela: "from-emerald-500 to-emerald-600",
  science: "from-amber-500 to-amber-600",
  history: "from-rose-500 to-rose-600",
  coding: "from-violet-500 to-violet-600",
  social: "from-pink-500 to-pink-600",
  communication: "from-cyan-500 to-cyan-600",
  daily_living: "from-orange-500 to-orange-600",
  cause_effect: "from-teal-500 to-teal-600",
  sensory_engagement: "from-indigo-500 to-indigo-600",
  social_awareness: "from-fuchsia-500 to-fuchsia-600",
};

const MASTERY_EMOJIS: Record<string, string> = {
  math: "🔢", ela: "📖", science: "🔬", history: "🏛️", coding: "💻",
  social: "🤝", communication: "💬", daily_living: "🏠",
  cause_effect: "🎯", sensory_engagement: "🎨", social_awareness: "👥",
};

const SOURCE_BADGES: Record<string, { label: string; color: string }> = {
  discovery_adventure: { label: "From Assessment", color: "bg-blue-100 text-blue-700" },
  template_default: { label: "Template Default", color: "bg-slate-100 text-slate-600" },
  functioning_level_template: { label: "Evidence-Based", color: "bg-green-100 text-green-700" },
  parent_assessment: { label: "Parent Reported", color: "bg-purple-100 text-purple-700" },
};

export default function BrainReviewPage() {
  const { user, accessToken, loading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const learnerId = params.id as string;

  const [review, setReview] = useState<BrainReview | null>(null);
  const [loadingReview, setLoadingReview] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "mastery" | "accommodations" | "tutors" | "signals" | "rai">("overview");
  const [parentNotes, setParentNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showAmendForm, setShowAmendForm] = useState(false);
  const [showDeclineConfirm, setShowDeclineConfirm] = useState(false);
  const [declineReason, setDeclineReason] = useState("");
  const [actionResult, setActionResult] = useState<{ type: string; message: string } | null>(null);

  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [user, loading, router]);

  useEffect(() => {
    if (!accessToken || !learnerId) return;
    fetch(`/api/brain/${learnerId}/review`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (data) setReview(data);
      })
      .catch(() => {})
      .finally(() => setLoadingReview(false));
  }, [accessToken, learnerId]);

  const handleApprove = async () => {
    if (!accessToken) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/brain/${learnerId}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ parent_notes: parentNotes || null }),
      });
      if (res.ok) {
        setActionResult({ type: "approved", message: "Brain clone approved! Your child's personalized learning journey is now active." });
        setReview((prev) => prev ? { ...prev, approval_status: "approved" } : prev);
      }
    } catch {}
    setSubmitting(false);
  };

  const handleAmend = async () => {
    if (!accessToken || !parentNotes.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/brain/${learnerId}/amend`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ parent_notes: parentNotes }),
      });
      if (res.ok) {
        setActionResult({ type: "amended", message: "Brain clone approved with your additional context. Your notes have been incorporated into your child's learning profile." });
        setReview((prev) => prev ? { ...prev, approval_status: "amended" } : prev);
        setShowAmendForm(false);
      }
    } catch {}
    setSubmitting(false);
  };

  const handleDecline = async () => {
    if (!accessToken) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/brain/${learnerId}/decline`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ reason: declineReason || null }),
      });
      if (res.ok) {
        setActionResult({ type: "declined", message: "Brain clone declined. Your child will be able to retake the baseline assessment." });
      }
    } catch {}
    setSubmitting(false);
  };

  if (loading || !user) return null;

  if (loadingReview) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-cyan-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-5xl mb-4 animate-pulse">🧠</div>
          <p className="text-slate-500 font-heading font-bold">Loading Brain Clone Review...</p>
        </div>
      </div>
    );
  }

  if (!review) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-cyan-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-5xl mb-4">🔍</div>
          <p className="text-slate-500 font-heading font-bold">No brain clone found for this learner</p>
          <Link href={`/dashboard/parent/learner/${learnerId}`} className="text-primary font-semibold hover:underline mt-4 inline-block">Back to Profile</Link>
        </div>
      </div>
    );
  }

  if (actionResult) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-cyan-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-lg text-center border border-slate-100">
          <div className="text-6xl mb-4">
            {actionResult.type === "approved" ? "✅" : actionResult.type === "amended" ? "📝" : "🔄"}
          </div>
          <h2 className="text-2xl font-heading font-bold text-slate-900 mb-3">
            {actionResult.type === "approved" ? "Clone Approved!" : actionResult.type === "amended" ? "Clone Approved with Notes" : "Clone Declined"}
          </h2>
          <p className="text-slate-600 font-body mb-6">{actionResult.message}</p>
          <Link
            href={actionResult.type === "declined" ? `/dashboard/parent/learner/${learnerId}` : `/dashboard/parent/learner/${learnerId}`}
            className="inline-block px-6 py-3 bg-gradient-to-r from-primary to-purple-600 text-white font-heading font-bold rounded-xl hover:shadow-lg transition"
          >
            {actionResult.type === "declined" ? "Back to Profile" : "View Learner Dashboard"}
          </Link>
        </div>
      </div>
    );
  }

  const xai = review.xai_explanation;
  const isAlreadyResolved = review.approval_status !== "pending_parent_review";

  const TABS = [
    { key: "overview" as const, label: "Overview", emoji: "🧠" },
    { key: "mastery" as const, label: "Learning Levels", emoji: "📊" },
    { key: "accommodations" as const, label: "Supports", emoji: "🛡️" },
    { key: "tutors" as const, label: "AI Tutors", emoji: "👩‍🏫" },
    { key: "signals" as const, label: "Learner Profile", emoji: "📋" },
    { key: "rai" as const, label: "AI Safety", emoji: "🔒" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-cyan-50">
      <header className="bg-white/80 backdrop-blur border-b border-slate-200 px-6 py-4 flex items-center justify-between">
        <Image src="/images/aivo-logo-purple.png" alt="AIVO" width={120} height={36} />
        <div className="flex items-center gap-4">
          <Link href={`/dashboard/parent/learner/${learnerId}`} className="text-sm text-primary font-semibold hover:underline">Back to Profile</Link>
          <span className="text-sm font-semibold text-slate-600">{user.name}</span>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 mb-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-3xl shadow-lg">
              🧠
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-heading font-bold text-slate-900">
                Brain Clone Review
              </h1>
              <p className="text-slate-500 font-body">
                Review {review.learner_name}&apos;s personalized learning profile before activation
              </p>
            </div>
            {isAlreadyResolved && (
              <span className={`px-4 py-2 rounded-full text-sm font-bold ${
                review.approval_status === "approved" ? "bg-green-100 text-green-700" :
                review.approval_status === "amended" ? "bg-blue-100 text-blue-700" :
                "bg-red-100 text-red-700"
              }`}>
                {review.approval_status.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())}
              </span>
            )}
          </div>

          <p className="text-sm text-slate-600 bg-purple-50 rounded-xl p-4 font-body leading-relaxed">
            {xai?.summary || "This brain clone was created from your child's baseline assessment results and your parent questionnaire responses."}
          </p>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2 mb-6">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-heading font-bold whitespace-nowrap transition ${
                activeTab === tab.key
                  ? "bg-primary text-white shadow-md"
                  : "bg-white text-slate-600 border border-slate-200 hover:border-purple-300"
              }`}
            >
              <span>{tab.emoji}</span>
              {tab.label}
            </button>
          ))}
        </div>

        <div className="space-y-4 mb-8">
          {activeTab === "overview" && (
            <>
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                <h2 className="font-heading font-bold text-lg text-slate-900 mb-4 flex items-center gap-2">
                  <span className="text-2xl">📊</span> Mastery Snapshot
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {xai?.mastery_decisions?.map((m) => (
                    <div key={m.domain} className="relative overflow-hidden rounded-xl bg-gradient-to-br from-slate-50 to-white border border-slate-100 p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xl">{MASTERY_EMOJIS[m.domain] || "📚"}</span>
                        <span className="font-heading font-bold text-sm text-slate-700">{m.display_label}</span>
                      </div>
                      <div className="text-2xl font-heading font-bold text-slate-900 mb-1">
                        {Math.round(m.score * 100)}%
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                        <div
                          className={`h-full rounded-full bg-gradient-to-r ${MASTERY_COLORS[m.domain] || "from-purple-500 to-purple-600"} transition-all duration-1000`}
                          style={{ width: `${Math.max(4, m.score * 100)}%` }}
                        />
                      </div>
                      {m.source && (
                        <span className={`inline-block mt-2 text-[10px] font-bold px-2 py-0.5 rounded-full ${SOURCE_BADGES[m.source]?.color || "bg-slate-100 text-slate-500"}`}>
                          {SOURCE_BADGES[m.source]?.label || m.source}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                  <h3 className="font-heading font-bold text-slate-900 mb-3 flex items-center gap-2">
                    <span className="text-xl">👩‍🏫</span> Active Tutors
                  </h3>
                  <div className="flex flex-wrap gap-3">
                    {review.active_tutors?.map((key) => {
                      const tutor = TUTORS[key as TutorKey];
                      if (!tutor) return null;
                      return (
                        <div key={key} className="flex items-center gap-2 bg-slate-50 rounded-xl px-3 py-2">
                          <div className="w-8 h-8 rounded-full overflow-hidden border-2" style={{ borderColor: tutor.color }}>
                            <Image src={tutor.avatar} alt={tutor.name} width={32} height={32} className="object-cover" />
                          </div>
                          <span className="text-sm font-heading font-bold text-slate-700">{tutor.name}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                  <h3 className="font-heading font-bold text-slate-900 mb-3 flex items-center gap-2">
                    <span className="text-xl">🛡️</span> Active Supports
                  </h3>
                  {review.active_accommodations?.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {review.active_accommodations.map((acc) => (
                        <span key={acc} className="px-3 py-1.5 bg-green-50 text-green-700 rounded-lg text-sm font-semibold border border-green-100">
                          {acc.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-400">No additional accommodations needed</p>
                  )}
                </div>
              </div>

              {xai?.signal_decisions?.length > 0 && (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                  <h3 className="font-heading font-bold text-slate-900 mb-3 flex items-center gap-2">
                    <span className="text-xl">📋</span> Learner Signals
                  </h3>
                  <div className="grid md:grid-cols-2 gap-3">
                    {xai.signal_decisions.map((s) => (
                      <div key={s.signal} className="bg-purple-50 rounded-xl p-3">
                        <p className="text-xs font-bold text-purple-500 uppercase">{s.display_label}</p>
                        <p className="text-sm font-semibold text-slate-800 mt-0.5">{s.value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {activeTab === "mastery" && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
              <h2 className="font-heading font-bold text-lg text-slate-900 mb-2 flex items-center gap-2">
                <span className="text-2xl">📊</span> Mastery Levels Explained
              </h2>
              <p className="text-sm text-slate-500 mb-6">Each mastery score shows where your child is starting. Here&apos;s how each one was determined.</p>
              <div className="space-y-4">
                {xai?.mastery_decisions?.map((m) => (
                  <div key={m.domain} className="border border-slate-100 rounded-xl p-4 hover:bg-slate-50 transition">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{MASTERY_EMOJIS[m.domain] || "📚"}</span>
                        <div>
                          <p className="font-heading font-bold text-slate-900">{m.display_label}</p>
                          {m.raw_score && (
                            <p className="text-xs text-slate-400">Raw: {m.raw_score} on {m.difficulty} difficulty</p>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-heading font-bold text-slate-900">{Math.round(m.score * 100)}%</p>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${SOURCE_BADGES[m.source]?.color || "bg-slate-100 text-slate-500"}`}>
                          {SOURCE_BADGES[m.source]?.label || m.source}
                        </span>
                      </div>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden mb-2">
                      <div
                        className={`h-full rounded-full bg-gradient-to-r ${MASTERY_COLORS[m.domain] || "from-purple-500 to-purple-600"}`}
                        style={{ width: `${Math.max(4, m.score * 100)}%` }}
                      />
                    </div>
                    <p className="text-sm text-slate-600 bg-slate-50 rounded-lg p-3 leading-relaxed">
                      <span className="font-semibold text-slate-700">Why this score: </span>
                      {m.reasoning}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "accommodations" && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
              <h2 className="font-heading font-bold text-lg text-slate-900 mb-2 flex items-center gap-2">
                <span className="text-2xl">🛡️</span> Learning Supports & Accommodations
              </h2>
              <p className="text-sm text-slate-500 mb-6">These supports help personalize the learning experience. Each was selected based on evidence-based practices.</p>
              {xai?.accommodation_decisions?.length > 0 ? (
                <div className="space-y-3">
                  {xai.accommodation_decisions.map((a) => (
                    <div key={a.accommodation} className="border border-slate-100 rounded-xl p-4 hover:bg-green-50/50 transition">
                      <div className="flex items-center justify-between mb-2">
                        <p className="font-heading font-bold text-slate-900">{a.display_label}</p>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${SOURCE_BADGES[a.source]?.color || "bg-slate-100 text-slate-500"}`}>
                          {SOURCE_BADGES[a.source]?.label || a.source}
                        </span>
                      </div>
                      <p className="text-sm text-slate-600 leading-relaxed">{a.reasoning}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="text-4xl mb-3">✨</div>
                  <p className="text-slate-500 font-semibold">No additional accommodations were recommended for this level.</p>
                </div>
              )}
            </div>
          )}

          {activeTab === "tutors" && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
              <h2 className="font-heading font-bold text-lg text-slate-900 mb-2 flex items-center gap-2">
                <span className="text-2xl">👩‍🏫</span> Assigned AI Tutors
              </h2>
              <p className="text-sm text-slate-500 mb-6">These tutors were selected to match your child&apos;s learning level and curriculum needs.</p>
              <div className="space-y-3">
                {xai?.tutor_decisions?.map((t) => {
                  const tutor = TUTORS[t.tutor_key as TutorKey];
                  return (
                    <div key={t.tutor_key} className="border border-slate-100 rounded-xl p-4 hover:bg-purple-50/50 transition flex items-center gap-4">
                      {tutor ? (
                        <div className="w-14 h-14 rounded-full overflow-hidden border-3 shadow-md flex-shrink-0" style={{ borderColor: tutor.color }}>
                          <Image src={tutor.avatar} alt={tutor.name} width={56} height={56} className="object-cover" />
                        </div>
                      ) : (
                        <div className="w-14 h-14 rounded-full bg-purple-100 flex items-center justify-center text-2xl flex-shrink-0">🤖</div>
                      )}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-heading font-bold text-slate-900">{tutor?.name || t.tutor_key}</p>
                          {tutor?.subject && (
                            <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-semibold">{tutor.subject}</span>
                          )}
                        </div>
                        <p className="text-sm text-slate-600">{t.reasoning}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === "signals" && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
              <h2 className="font-heading font-bold text-lg text-slate-900 mb-2 flex items-center gap-2">
                <span className="text-2xl">📋</span> Learner Profile Signals
              </h2>
              <p className="text-sm text-slate-500 mb-6">These signals help the AI understand your child&apos;s unique needs without making limiting assumptions.</p>
              {xai?.signal_decisions?.length > 0 ? (
                <div className="space-y-3">
                  {xai.signal_decisions.map((s) => (
                    <div key={s.signal} className="border border-slate-100 rounded-xl p-4">
                      <div className="flex items-center justify-between mb-2">
                        <p className="font-heading font-bold text-slate-900">{s.display_label}</p>
                        <span className="text-sm font-semibold text-purple-600 bg-purple-50 px-3 py-1 rounded-full">{s.value}</span>
                      </div>
                      <p className="text-sm text-slate-600 leading-relaxed">{s.reasoning}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="text-4xl mb-3">✅</div>
                  <p className="text-slate-500 font-semibold">No additional signals were detected from the assessments.</p>
                  <p className="text-xs text-slate-400 mt-1">Standard settings will be used for all interactions.</p>
                </div>
              )}
            </div>
          )}

          {activeTab === "rai" && (
            <div className="space-y-4">
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                <h2 className="font-heading font-bold text-lg text-slate-900 mb-4 flex items-center gap-2">
                  <span className="text-2xl">🔒</span> Responsible AI Compliance
                </h2>
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 mb-4">
                  <p className="text-sm font-semibold text-emerald-700 mb-1">Transparency Statement</p>
                  <p className="text-sm text-emerald-600">{xai?.rai_compliance?.transparency}</p>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                  <p className="text-sm font-semibold text-blue-700 mb-1">Human Oversight</p>
                  <p className="text-sm text-blue-600">{xai?.rai_compliance?.human_oversight}</p>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                <h3 className="font-heading font-bold text-slate-900 mb-3">Data Sources Used</h3>
                <div className="space-y-2">
                  {xai?.rai_compliance?.data_sources?.map((src, i) => (
                    <div key={i} className="flex items-center gap-3 bg-slate-50 rounded-xl px-4 py-3">
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-sm font-bold">{i + 1}</div>
                      <p className="text-sm font-semibold text-slate-700">{src}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                <h3 className="font-heading font-bold text-slate-900 mb-3">Bias Mitigations</h3>
                <div className="space-y-2">
                  {xai?.rai_compliance?.bias_mitigations?.map((mit, i) => (
                    <div key={i} className="flex items-start gap-3 bg-emerald-50 rounded-xl px-4 py-3">
                      <span className="text-emerald-500 mt-0.5">✓</span>
                      <p className="text-sm text-emerald-700">{mit}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {!isAlreadyResolved && (
          <div className="bg-white rounded-2xl shadow-xl border border-purple-100 p-6 sticky bottom-4">
            <h3 className="font-heading font-bold text-lg text-slate-900 mb-4">Your Decision</h3>

            {showAmendForm ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">
                    Additional Context or Amendments
                  </label>
                  <textarea
                    value={parentNotes}
                    onChange={(e) => setParentNotes(e.target.value)}
                    placeholder="Share anything the AI should know about your child that wasn't captured in the assessments..."
                    className="w-full border border-slate-200 rounded-xl p-3 text-sm min-h-[100px] focus:outline-none focus:ring-2 focus:ring-purple-500 font-body"
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={handleAmend}
                    disabled={submitting || !parentNotes.trim()}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-heading font-bold rounded-xl hover:shadow-lg transition disabled:opacity-50"
                  >
                    {submitting ? "Submitting..." : "Approve with Notes"}
                  </button>
                  <button
                    onClick={() => { setShowAmendForm(false); setParentNotes(""); }}
                    className="px-6 py-3 border border-slate-200 text-slate-600 font-heading font-bold rounded-xl hover:bg-slate-50 transition"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : showDeclineConfirm ? (
              <div className="space-y-4">
                <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                  <p className="text-sm font-semibold text-red-700 mb-1">Are you sure?</p>
                  <p className="text-sm text-red-600">Declining will remove this brain clone. Your child will need to retake the Discovery Adventure baseline assessment.</p>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">
                    Reason (optional)
                  </label>
                  <textarea
                    value={declineReason}
                    onChange={(e) => setDeclineReason(e.target.value)}
                    placeholder="Let us know why you'd like your child to retake..."
                    className="w-full border border-slate-200 rounded-xl p-3 text-sm min-h-[60px] focus:outline-none focus:ring-2 focus:ring-red-400 font-body"
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={handleDecline}
                    disabled={submitting}
                    className="flex-1 px-6 py-3 bg-red-500 text-white font-heading font-bold rounded-xl hover:bg-red-600 transition disabled:opacity-50"
                  >
                    {submitting ? "Processing..." : "Confirm Decline & Reset"}
                  </button>
                  <button
                    onClick={() => { setShowDeclineConfirm(false); setDeclineReason(""); }}
                    className="px-6 py-3 border border-slate-200 text-slate-600 font-heading font-bold rounded-xl hover:bg-slate-50 transition"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">
                    Notes for approval (optional)
                  </label>
                  <textarea
                    value={parentNotes}
                    onChange={(e) => setParentNotes(e.target.value)}
                    placeholder="Any quick notes you'd like to add..."
                    className="w-full border border-slate-200 rounded-xl p-3 text-sm min-h-[60px] focus:outline-none focus:ring-2 focus:ring-purple-500 font-body"
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={handleApprove}
                    disabled={submitting}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-heading font-bold rounded-xl hover:shadow-lg transition disabled:opacity-50"
                  >
                    {submitting ? "Approving..." : "✅ Approve Clone"}
                  </button>
                  <button
                    onClick={() => setShowAmendForm(true)}
                    disabled={submitting}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-heading font-bold rounded-xl hover:shadow-lg transition disabled:opacity-50"
                  >
                    📝 Amend & Approve
                  </button>
                  <button
                    onClick={() => setShowDeclineConfirm(true)}
                    disabled={submitting}
                    className="px-6 py-3 border-2 border-red-200 text-red-600 font-heading font-bold rounded-xl hover:bg-red-50 transition disabled:opacity-50"
                  >
                    Decline
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
