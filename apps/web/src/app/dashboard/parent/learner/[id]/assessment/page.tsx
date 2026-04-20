"use client";
import { useAuth } from "@/providers/auth-provider";
import { useRouter, useParams } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import {
  ArrowLeft, ChevronLeft, ChevronRight, Check, HelpCircle, Heart,
  Sparkles, Compass, CheckCircle2,
} from "lucide-react";
import { IconWell } from "@/components/discovery/_vi";
import { PARENT_ASSESSMENT_CATEGORIES, TOTAL_QUESTIONS, type AssessmentQuestion } from "@/lib/assessment-questions";

const SCALE_EMOJIS = ["😟", "😕", "😐", "🙂", "🌟"];

function hexToHsl(hex: string): { h: number; s: number; l: number } | null {
  const m = hex.replace("#", "");
  if (m.length !== 6) return null;
  const r = parseInt(m.slice(0, 2), 16) / 255;
  const g = parseInt(m.slice(2, 4), 16) / 255;
  const b = parseInt(m.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)); break;
      case g: h = ((b - r) / d + 2); break;
      case b: h = ((r - g) / d + 4); break;
    }
    h /= 6;
  }
  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}
function tint(hex: string, alpha: number): string {
  const hsl = hexToHsl(hex);
  if (!hsl) return `${hex}1f`;
  return `hsl(${hsl.h} ${hsl.s}% ${hsl.l}% / ${alpha})`;
}

export default function ParentAssessmentPage() {
  const { user, accessToken, loading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const t = useTranslations("assessment");
  const tc = useTranslations("common");
  const learnerId = params.id as string;

  const [currentCategoryIdx, setCurrentCategoryIdx] = useState(0);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [alreadyCompleted, setAlreadyCompleted] = useState(false);
  const [learnerName, setLearnerName] = useState("");
  const [learnerFunctioningLevel, setLearnerFunctioningLevel] = useState("");
  const [checkingStatus, setCheckingStatus] = useState(true);

  useEffect(() => {
    if (!loading && !user) router.push("/login");
    if (!loading && user && user.role !== "PARENT") router.push("/");
  }, [user, loading, router]);

  useEffect(() => {
    if (!accessToken || !user) return;
    const loadStatus = async () => {
      try {
        const [learnersRes, statusRes] = await Promise.all([
          fetch("/api/users/learners", { headers: { Authorization: `Bearer ${accessToken}` } }),
          fetch(`/api/assessments/parent/${learnerId}/status`, { headers: { Authorization: `Bearer ${accessToken}` } }),
        ]);
        if (learnersRes.ok) {
          const learners: any[] = await learnersRes.json();
          const found = learners.find((l: any) => l.id === learnerId);
          if (found) {
            setLearnerName(found.name || "");
            if (found.functioningLevel) setLearnerFunctioningLevel(found.functioningLevel);
          }
        }
        if (statusRes.ok) {
          const status = await statusRes.json();
          if (status?.completed) setAlreadyCompleted(true);
        }
      } catch {}
      setCheckingStatus(false);
    };
    loadStatus();
  }, [accessToken, user, learnerId]);

  const category = PARENT_ASSESSMENT_CATEGORIES[currentCategoryIdx];
  const question = category?.questions[currentQuestionIdx];

  const answeredCount = Object.keys(answers).length;
  const progress = (answeredCount / TOTAL_QUESTIONS) * 100;

  const isCurrentAnswered = question ? answers[question.id] !== undefined : false;
  const canAdvance = question ? (!question.required || isCurrentAnswered) : false;

  const setAnswer = useCallback((questionId: string, value: any) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
  }, []);

  const toggleMultiSelect = useCallback((questionId: string, option: string) => {
    setAnswers(prev => {
      const current = (prev[questionId] as string[]) || [];
      const updated = current.includes(option) ? current.filter(o => o !== option) : [...current, option];
      return { ...prev, [questionId]: updated };
    });
  }, []);

  const goNext = () => {
    if (currentQuestionIdx < category.questions.length - 1) {
      setCurrentQuestionIdx(currentQuestionIdx + 1);
    } else if (currentCategoryIdx < PARENT_ASSESSMENT_CATEGORIES.length - 1) {
      setShowCelebration(true);
      setTimeout(() => {
        setShowCelebration(false);
        setCurrentCategoryIdx(currentCategoryIdx + 1);
        setCurrentQuestionIdx(0);
      }, 1500);
    }
  };

  const goPrev = () => {
    if (currentQuestionIdx > 0) setCurrentQuestionIdx(currentQuestionIdx - 1);
    else if (currentCategoryIdx > 0) {
      const prevCat = PARENT_ASSESSMENT_CATEGORIES[currentCategoryIdx - 1];
      setCurrentCategoryIdx(currentCategoryIdx - 1);
      setCurrentQuestionIdx(prevCat.questions.length - 1);
    }
  };

  const isLastQuestion =
    currentCategoryIdx === PARENT_ASSESSMENT_CATEGORIES.length - 1 &&
    currentQuestionIdx === category?.questions.length - 1;

  const getMissingRequired = () => {
    const missing: string[] = [];
    for (const cat of PARENT_ASSESSMENT_CATEGORIES) {
      for (const q of cat.questions) {
        if (!q.required) continue;
        const val = answers[q.id];
        if (val === undefined || val === null || val === "") missing.push(q.id);
        if (Array.isArray(val) && val.length === 0) missing.push(q.id);
      }
    }
    return missing;
  };

  const submit = async () => {
    const missing = getMissingRequired();
    if (missing.length > 0) {
      const firstMissing = missing[0];
      for (let ci = 0; ci < PARENT_ASSESSMENT_CATEGORIES.length; ci++) {
        const qi = PARENT_ASSESSMENT_CATEGORIES[ci].questions.findIndex(q => q.id === firstMissing);
        if (qi !== -1) { setCurrentCategoryIdx(ci); setCurrentQuestionIdx(qi); break; }
      }
      setSubmitError(t("missing_required", { count: missing.length }));
      return;
    }
    setSubmitting(true);
    setSubmitError(null);
    try {
      const res = await fetch("/api/assessments/parent", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({
          learnerId,
          communicationMode: mapCommunicationMode(answers),
          deviceInteraction: mapDeviceInteraction(answers),
          responseMethod: mapResponseMethod(answers),
          attentionSpan: mapAttentionSpan(answers),
          diagnoses: mapDiagnoses(answers),
          additionalResponses: answers,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setResult(data);
        setSubmitted(true);
      } else {
        const err = await res.json().catch(() => null);
        setSubmitError(err?.message || t("submission_failed"));
      }
    } catch {
      setSubmitError(t("network_error_retry"));
    }
    setSubmitting(false);
  };

  if (loading || !user || checkingStatus) return null;

  if (alreadyCompleted && !submitted) {
    return (
      <div className="min-h-screen vi-bg flex items-center justify-center px-4 py-8">
        <div className="max-w-lg w-full">
          <section className="vi-card p-8 md:p-10 text-center bg-gradient-to-br from-white via-[hsl(262_83%_58%/0.04)] to-[hsl(43_100%_50%/0.06)] border-2 border-[hsl(262_83%_58%/0.15)] relative overflow-hidden">
            <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-[hsl(43_100%_50%/0.18)] blur-2xl" aria-hidden />
            <div className="absolute -bottom-10 -left-10 w-40 h-40 rounded-full bg-[hsl(262_83%_58%/0.18)] blur-2xl" aria-hidden />
            <div className="relative space-y-5">
              <div className="mx-auto inline-flex">
                <IconWell color="science" size="lg"><CheckCircle2 className="w-10 h-10" strokeWidth={2.5} /></IconWell>
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-[hsl(142_71%_45%)] mb-2">All Done</p>
                <h1 className="text-2xl font-extrabold text-slate-900">{t("already_complete_title")}</h1>
                <p className="text-slate-600 mt-2">{t("already_complete_desc", { name: learnerName || t("this_learner") })}</p>
              </div>

              <div className="vi-card p-4 bg-white text-left">
                <p className="text-[11px] font-bold uppercase tracking-wider text-[hsl(262_83%_58%)]">{t("functioning_level_label")}</p>
                <p className="text-lg font-extrabold text-slate-900 mt-1">
                  {learnerFunctioningLevel.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())}
                </p>
              </div>

              <div className="vi-card p-4 text-left" style={{ background: "hsl(43 100% 50% / 0.06)", borderColor: "hsl(43 100% 50% / 0.3)" }}>
                <div className="flex items-start gap-3">
                  <IconWell color="sel" size="sm"><Compass className="w-5 h-5" strokeWidth={2.5} /></IconWell>
                  <div className="flex-1">
                    <p className="text-sm font-extrabold text-[hsl(43_100%_50%)]">{t("next_step_baseline")}</p>
                    <p className="text-xs text-slate-600 mt-1">{t("baseline_child_desc", { name: learnerName || t("your_child") })}</p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-3 pt-2">
                <button
                  onClick={() => router.push(`/dashboard/learner/assessment?learnerId=${learnerId}`)}
                  className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-full bg-[hsl(43_100%_50%)] text-white font-extrabold shadow-xl shadow-[hsl(43_100%_50%/0.3)] hover:scale-105 active:scale-95 transition-transform"
                  style={{ minHeight: "48px" }}
                >
                  <Compass className="w-4 h-4" /> {t("start_baseline")}
                </button>
                <button
                  onClick={() => router.push(`/dashboard/parent/learner/${learnerId}`)}
                  className="inline-flex items-center justify-center gap-2 px-7 py-3 rounded-full bg-[hsl(262_83%_58%)] text-white font-extrabold shadow-lg hover:scale-105 active:scale-95 transition-transform"
                  style={{ minHeight: "48px" }}
                >
                  {t("back_to_profile")}
                </button>
                <button
                  onClick={() => router.push("/dashboard/parent")}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-white border-2 border-slate-200 text-slate-700 font-extrabold hover:border-slate-300 transition-colors"
                  style={{ minHeight: "48px" }}
                >
                  {t("back_to_dashboard")}
                </button>
              </div>
            </div>
          </section>
        </div>
      </div>
    );
  }

  if (submitted && result) {
    return (
      <div className="min-h-screen vi-bg flex items-center justify-center px-4 py-8">
        <div className="max-w-lg w-full">
          <section className="vi-card p-8 md:p-10 text-center bg-gradient-to-br from-white via-[hsl(262_83%_58%/0.04)] to-[hsl(43_100%_50%/0.06)] border-2 border-[hsl(262_83%_58%/0.15)] relative overflow-hidden">
            <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-[hsl(43_100%_50%/0.18)] blur-2xl" aria-hidden />
            <div className="absolute -bottom-10 -left-10 w-40 h-40 rounded-full bg-[hsl(262_83%_58%/0.18)] blur-2xl" aria-hidden />
            <div className="relative space-y-5">
              <div className="mx-auto inline-flex">
                <IconWell color="science" size="lg"><CheckCircle2 className="w-10 h-10" strokeWidth={2.5} /></IconWell>
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-[hsl(142_71%_45%)] mb-2">Thank You</p>
                <h1 className="text-2xl font-extrabold text-slate-900">{t("assessment_complete_title")}</h1>
                <p className="text-slate-600 mt-2">{t("assessment_thank_you")}</p>
              </div>

              {result.functioningLevel && (
                <div className="vi-card p-4 bg-white text-left">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-[hsl(262_83%_58%)]">{t("recommended_level")}</p>
                  <p className="text-lg font-extrabold text-slate-900 mt-1">
                    {(result.functioningLevel.level || "").replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c: string) => c.toUpperCase())}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    {t("confidence")}: {(() => {
                      const c = Number(result.functioningLevel.confidence) || 0;
                      const pct = c <= 1 ? c * 100 : c;
                      return `${Math.round(pct)}%`;
                    })()}
                  </p>
                </div>
              )}

              <div className="vi-card p-4 text-left" style={{ background: "hsl(43 100% 50% / 0.06)", borderColor: "hsl(43 100% 50% / 0.3)" }}>
                <div className="flex items-start gap-3">
                  <IconWell color="sel" size="sm"><Compass className="w-5 h-5" strokeWidth={2.5} /></IconWell>
                  <div className="flex-1">
                    <p className="text-sm font-extrabold text-[hsl(43_100%_50%)]">{t("next_step_baseline")}</p>
                    <p className="text-xs text-slate-600 mt-1">{t("baseline_generic_desc")}</p>
                  </div>
                </div>
              </div>

              <button
                onClick={() => router.push(`/dashboard/parent/learner/${learnerId}`)}
                className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-full bg-[hsl(262_83%_58%)] text-white font-extrabold shadow-xl shadow-[hsl(262_83%_58%/0.3)] hover:scale-105 active:scale-95 transition-transform"
                style={{ minHeight: "48px" }}
              >
                {t("continue_to_profile")} <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </section>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen vi-bg">
      <header className="bg-white border-b border-slate-200/60 sticky top-0 z-20">
        <div className="max-w-3xl mx-auto px-6 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push(`/dashboard/parent`)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-bold text-slate-500 hover:bg-slate-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(262_83%_58%)]"
            >
              <ArrowLeft className="w-4 h-4" /> {tc("back")}
            </button>
            <div className="hidden sm:flex items-center gap-2">
              <IconWell color="primary" size="sm"><Sparkles className="w-5 h-5" strokeWidth={2.5} /></IconWell>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Parent Assessment</p>
                <p className="text-sm font-extrabold text-slate-900">
                  {learnerName ? `Tell us about ${learnerName}` : "Tell us about your child"}
                </p>
              </div>
            </div>
          </div>
          <div className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-full whitespace-nowrap">
            {answeredCount} / {TOTAL_QUESTIONS}
          </div>
        </div>
        <div className="h-1.5 bg-slate-100">
          <div
            className="h-full bg-gradient-to-r from-[hsl(262_83%_58%)] to-[hsl(340_82%_52%)] rounded-r-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </header>

      {showCelebration && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/30 backdrop-blur-sm">
          <div className="vi-card p-8 text-center max-w-sm mx-4 animate-in fade-in zoom-in border-2" style={{ borderColor: "hsl(142 71% 45% / 0.3)" }}>
            <div className="mx-auto inline-flex mb-3">
              <IconWell color="science" size="md"><Check className="w-7 h-7" strokeWidth={3} /></IconWell>
            </div>
            <h3 className="text-xl font-extrabold text-slate-900">{t("section_complete")}</h3>
            <p className="text-sm text-slate-500 mt-1">{t("moving_next")}</p>
          </div>
        </div>
      )}

      <main className="max-w-3xl mx-auto px-6 py-6 space-y-5">
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
          {PARENT_ASSESSMENT_CATEGORIES.map((cat, idx) => {
            const catAnswered = cat.questions.filter(q => answers[q.id] !== undefined).length;
            const catTotal = cat.questions.length;
            const isComplete = catAnswered === catTotal;
            const isCurrent = idx === currentCategoryIdx;
            const baseStyle = isCurrent
              ? { backgroundColor: tint(cat.color, 0.1), borderColor: cat.color, color: cat.color }
              : isComplete
              ? { backgroundColor: "hsl(142 71% 45% / 0.1)", borderColor: "hsl(142 71% 45% / 0.3)", color: "hsl(142 71% 45%)" }
              : { backgroundColor: "white", borderColor: "rgb(226 232 240)", color: "rgb(100 116 139)" };
            return (
              <button
                key={cat.key}
                onClick={() => { setCurrentCategoryIdx(idx); setCurrentQuestionIdx(0); }}
                aria-pressed={isCurrent}
                aria-label={`${cat.label}: ${catAnswered} of ${catTotal} answered${isComplete ? ", complete" : ""}`}
                className="flex items-center gap-2 flex-shrink-0 px-3 py-2 rounded-full border-2 text-xs font-bold transition-all hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                style={baseStyle}
              >
                <span className="text-base leading-none" aria-hidden>{cat.icon}</span>
                <span>{cat.label}</span>
                {isComplete ? (
                  <Check className="w-3.5 h-3.5" strokeWidth={3} aria-hidden />
                ) : (
                  <span className={`text-[10px] font-extrabold tabular-nums ${isCurrent ? "" : "text-slate-400"}`}>{catAnswered}/{catTotal}</span>
                )}
              </button>
            );
          })}
        </div>

        {question && (
          <section className="vi-card p-7 space-y-6">
            <div className="flex items-center gap-3">
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl"
                style={{ backgroundColor: tint(category.color, 0.12), color: category.color }}
                aria-hidden
              >
                {category.icon}
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: category.color }}>
                  {category.label}
                </p>
                <p className="text-xs text-slate-400 font-semibold">
                  {t("question_of", { current: currentQuestionIdx + 1, total: category.questions.length })}
                </p>
              </div>
            </div>

            <div>
              <h2 className="text-xl md:text-2xl font-extrabold text-slate-900 leading-snug">
                {question.questionText}
              </h2>
              {question.helpText && (
                <p className="mt-2 text-sm text-slate-500 italic flex items-start gap-1.5">
                  <HelpCircle className="w-4 h-4 mt-0.5 flex-shrink-0 text-slate-400" />
                  <span>{question.helpText}</span>
                </p>
              )}
            </div>

            <QuestionInput
              question={question}
              value={answers[question.id]}
              categoryColor={category.color}
              onSelect={(v) => setAnswer(question.id, v)}
              onMultiToggle={(opt) => toggleMultiSelect(question.id, opt)}
              onTextChange={(v) => setAnswer(question.id, v)}
              onScaleChange={(v) => setAnswer(question.id, v)}
            />

            {submitError && (
              <div className="p-3 rounded-2xl border-2 text-sm font-semibold text-center" style={{ background: "hsl(0 72% 51% / 0.06)", borderColor: "hsl(0 72% 51% / 0.3)", color: "hsl(0 72% 51%)" }}>
                {submitError}
              </div>
            )}

            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <button
                onClick={goPrev}
                disabled={currentCategoryIdx === 0 && currentQuestionIdx === 0}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full text-sm font-bold text-slate-500 hover:bg-slate-100 transition-colors disabled:opacity-30 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
              >
                <ChevronLeft className="w-4 h-4" /> {t("previous")}
              </button>

              {isLastQuestion ? (
                <button
                  onClick={submit}
                  disabled={submitting}
                  className="inline-flex items-center gap-1.5 px-7 py-2.5 rounded-full bg-[hsl(142_71%_45%)] text-white font-extrabold text-sm shadow-lg shadow-[hsl(142_71%_45%/0.3)] hover:scale-105 active:scale-95 transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? t("submitting") : <>{t("submit_assessment")} <Check className="w-4 h-4" strokeWidth={3} /></>}
                </button>
              ) : (
                <button
                  onClick={goNext}
                  disabled={!canAdvance}
                  className="inline-flex items-center gap-1.5 px-6 py-2.5 rounded-full text-white font-extrabold text-sm shadow-lg hover:scale-105 active:scale-95 transition-transform disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{ backgroundColor: category.color, boxShadow: `0 8px 24px ${tint(category.color, 0.3)}` }}
                >
                  {tc("next")} <ChevronRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </section>
        )}

        <div className="vi-card p-4 flex items-start gap-3" style={{ background: "hsl(43 100% 50% / 0.08)", borderColor: "hsl(43 100% 50% / 0.3)" }}>
          <IconWell color="sel" size="sm"><Sparkles className="w-5 h-5" strokeWidth={2.5} /></IconWell>
          <p className="text-sm text-slate-700">
            Your answers help your tutors meet {learnerName || "your child"} where they are.{" "}
            <span className="font-extrabold">You can edit anything later.</span>
          </p>
        </div>
      </main>
    </div>
  );
}

function QuestionInput({
  question: q,
  value,
  categoryColor,
  onSelect,
  onMultiToggle,
  onTextChange,
  onScaleChange,
}: {
  question: AssessmentQuestion;
  value: any;
  categoryColor: string;
  onSelect: (v: string) => void;
  onMultiToggle: (opt: string) => void;
  onTextChange: (v: string) => void;
  onScaleChange: (v: number) => void;
}) {
  const t = useTranslations("assessment");
  const tintBg = tint(categoryColor, 0.1);

  if (q.questionType === "multiple_choice" || q.questionType === "yes_no") {
    return (
      <div className="space-y-2" role="radiogroup">
        {(q.options || []).map(opt => {
          const selected = value === opt;
          return (
            <button
              key={opt}
              onClick={() => onSelect(opt)}
              role="radio"
              aria-checked={selected}
              className="w-full flex items-center gap-3 text-left px-4 py-3.5 rounded-2xl border-2 text-sm font-semibold transition-all hover:scale-[1.01] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
              style={{
                borderColor: selected ? categoryColor : "rgb(226 232 240)",
                backgroundColor: selected ? tintBg : "white",
                color: selected ? categoryColor : "rgb(71 85 105)",
              }}
            >
              <span
                className="w-6 h-6 rounded-lg border-2 flex items-center justify-center flex-shrink-0"
                style={selected
                  ? { backgroundColor: categoryColor, borderColor: categoryColor, color: "white" }
                  : { borderColor: "rgb(203 213 225)" }}
              >
                {selected && <Check className="w-3.5 h-3.5" strokeWidth={3} />}
              </span>
              <span className="font-bold flex-1">{opt}</span>
            </button>
          );
        })}
      </div>
    );
  }

  if (q.questionType === "multi_select") {
    const selected = (value as string[]) || [];
    return (
      <div className="space-y-2" role="group">
        {(q.options || []).map(opt => {
          const isSelected = selected.includes(opt);
          return (
            <button
              key={opt}
              onClick={() => onMultiToggle(opt)}
              aria-pressed={isSelected}
              className="w-full flex items-center gap-3 text-left px-4 py-3.5 rounded-2xl border-2 text-sm font-semibold transition-all hover:scale-[1.01] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
              style={{
                borderColor: isSelected ? categoryColor : "rgb(226 232 240)",
                backgroundColor: isSelected ? tintBg : "white",
                color: isSelected ? categoryColor : "rgb(71 85 105)",
              }}
            >
              <span
                className="w-6 h-6 rounded-lg border-2 flex items-center justify-center flex-shrink-0"
                style={isSelected
                  ? { backgroundColor: categoryColor, borderColor: categoryColor, color: "white" }
                  : { borderColor: "rgb(203 213 225)" }}
              >
                {isSelected && <Check className="w-3.5 h-3.5" strokeWidth={3} />}
              </span>
              <span className="font-bold flex-1">{opt}</span>
            </button>
          );
        })}
      </div>
    );
  }

  if (q.questionType === "rating_scale") {
    return (
      <div className="pt-2">
        <div className="flex items-center gap-2 mb-3">
          <Heart className="w-4 h-4 text-[hsl(43_100%_50%)] fill-[hsl(43_100%_50%)]" aria-hidden />
          <p className="text-sm font-bold text-slate-900">How often does this feel true?</p>
        </div>
        <div className="flex items-center justify-between gap-1" role="radiogroup">
          {Array.from({ length: (q.scaleMax ?? 5) - (q.scaleMin ?? 1) + 1 }).map((_, i) => {
            const val = (q.scaleMin ?? 1) + i;
            const selected = value === val;
            const emoji = SCALE_EMOJIS[Math.min(i, SCALE_EMOJIS.length - 1)];
            return (
              <button
                key={val}
                type="button"
                onClick={() => onScaleChange(val)}
                role="radio"
                aria-checked={selected}
                aria-label={`${val} of ${q.scaleMax ?? 5}`}
                className="flex flex-col items-center gap-1 p-3 rounded-2xl transition-all hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                style={selected ? { backgroundColor: tintBg } : undefined}
              >
                <span className={`text-3xl transition-all ${selected ? "scale-110" : "grayscale opacity-50"}`} aria-hidden>{emoji}</span>
                <span className="text-[10px] font-extrabold tabular-nums" style={{ color: selected ? categoryColor : "rgb(148 163 184)" }}>{val}</span>
              </button>
            );
          })}
        </div>
        {(q.scaleLabels?.min || q.scaleLabels?.max) && (
          <div className="flex justify-between mt-2 px-2">
            <span className="text-xs text-slate-400 font-semibold">{q.scaleLabels?.min}</span>
            <span className="text-xs text-slate-400 font-semibold">{q.scaleLabels?.max}</span>
          </div>
        )}
      </div>
    );
  }

  if (q.questionType === "open_ended") {
    return (
      <textarea
        value={(value as string) ?? ""}
        onChange={(e) => onTextChange(e.target.value)}
        placeholder={t("type_answer")}
        rows={4}
        className="w-full rounded-2xl border-2 border-slate-200 p-4 text-sm text-slate-800 placeholder-slate-300 focus:outline-none resize-none transition-all"
        onFocus={(e) => { e.currentTarget.style.borderColor = categoryColor; }}
        onBlur={(e) => { e.currentTarget.style.borderColor = "rgb(226 232 240)"; }}
      />
    );
  }

  return null;
}

function mapCommunicationMode(answers: Record<string, any>): string {
  const cn1 = answers["cn-1"];
  if (!cn1) return "verbal";
  if (cn1.includes("speaks clearly")) return "verbal";
  if (cn1.includes("limited vocabulary")) return "limited_verbal";
  if (cn1.includes("Sign language")) return "sign_language";
  if (cn1.includes("AAC") || cn1.includes("Communication device")) return "aac_device";
  if (cn1.includes("Non-verbal")) return "non_verbal";
  if (cn1.includes("Gestures")) return "non_verbal";
  if (cn1.includes("Picture symbols")) return "aac_device";
  return "verbal";
}

function mapDeviceInteraction(answers: Record<string, any>): string {
  const im1 = answers["im-1"];
  if (!im1) return "independent";
  if (im1.includes("Standard")) return "independent";
  if (im1.includes("larger touch")) return "guided";
  if (im1.includes("occasional guidance")) return "guided";
  if (im1.includes("switch access")) return "switch_access";
  if (im1.includes("eye gaze") || im1.includes("eye tracking")) return "eye_gaze";
  if (im1.includes("head tracking")) return "eye_gaze";
  if (im1.includes("voice control")) return "guided";
  if (im1.includes("Parent/aide")) return "partner_assisted";
  return "independent";
}

function mapResponseMethod(answers: Record<string, any>): string {
  const fl4 = answers["fl-4"];
  if (!fl4) return "touch_select";
  if (fl4.includes("Verbally")) return "voice";
  if (fl4.includes("short words")) return "voice";
  if (fl4.includes("Points") || fl4.includes("touches")) return "touch_select";
  if (fl4.includes("communication device") || fl4.includes("pictures")) return "switch_scan";
  if (fl4.includes("Looks") || fl4.includes("gazes")) return "partner_response";
  if (fl4.includes("adult to interpret") || fl4.includes("Does not consistently")) return "partner_response";
  return "touch_select";
}

function mapAttentionSpan(answers: Record<string, any>): string {
  const ls3 = answers["ls-3"];
  if (!ls3) return "typical";
  if (ls3 >= 4) return "typical";
  if (ls3 === 3) return "variable";
  if (ls3 === 2) return "short";
  return "very_short";
}

function mapDiagnoses(answers: Record<string, any>): string[] {
  const ch2 = answers["ch-2"];
  if (!ch2 || ch2 === "No, none that I'm aware of") return [];
  const map: Record<string, string> = {
    "Yes, ADHD/ADD": "adhd",
    "Yes, dyslexia or reading difficulty": "dyslexia",
    "Yes, dyscalculia or math difficulty": "dyscalculia",
    "Yes, autism spectrum": "asd",
    "Currently being evaluated": "under_evaluation",
  };
  return map[ch2] ? [map[ch2]] : ["other"];
}
