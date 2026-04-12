"use client";
import { useAuth } from "@/providers/auth-provider";
import { useRouter, useParams } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import { PARENT_ASSESSMENT_CATEGORIES, TOTAL_QUESTIONS, type AssessmentQuestion } from "@/lib/assessment-questions";

const SCALE_EMOJIS = ["😟", "😕", "😐", "🙂", "🌟"];

export default function ParentAssessmentPage() {
  const { user, accessToken, loading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const learnerId = params.id as string;

  const [currentCategoryIdx, setCurrentCategoryIdx] = useState(0);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) router.push("/login");
    if (!loading && user && user.role !== "PARENT") router.push("/");
  }, [user, loading, router]);

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
      const updated = current.includes(option)
        ? current.filter(o => o !== option)
        : [...current, option];
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
    if (currentQuestionIdx > 0) {
      setCurrentQuestionIdx(currentQuestionIdx - 1);
    } else if (currentCategoryIdx > 0) {
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
      setSubmitError(`Please answer all required questions. ${missing.length} remaining.`);
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
        setSubmitError(err?.message || `Submission failed (${res.status}). Please try again.`);
      }
    } catch (e: any) {
      setSubmitError("Network error. Please check your connection and try again.");
    }
    setSubmitting(false);
  };

  if (loading || !user) return null;

  if (submitted && result) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-cyan-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-3xl p-10 shadow-xl border border-slate-100 text-center max-w-lg space-y-6">
          <div className="w-20 h-20 mx-auto rounded-full bg-green-100 flex items-center justify-center">
            <span className="text-4xl">&#10003;</span>
          </div>
          <h1 className="text-2xl font-heading font-bold text-slate-900">Assessment Complete!</h1>
          <p className="text-slate-500">Thank you for taking the time to help us understand your child's needs.</p>
          {result.functioningLevel && (
            <div className="p-4 rounded-2xl bg-purple-50 border border-purple-200">
              <p className="text-sm font-bold text-purple-700">Recommended Functioning Level</p>
              <p className="text-xl font-heading font-bold text-primary mt-1">{result.functioningLevel.level}</p>
              <p className="text-xs text-purple-500 mt-1">Confidence: {Math.round((result.functioningLevel.confidence || 0) * 100)}%</p>
            </div>
          )}
          <button onClick={() => router.push(`/dashboard/parent/learner/${learnerId}`)}
            className="px-8 py-3 rounded-full bg-primary text-white font-bold hover:bg-primary-dark transition shadow-lg shadow-purple-200">
            Continue to Profile
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-cyan-50">
      <header className="bg-white/80 backdrop-blur border-b border-slate-200 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => router.push(`/dashboard/parent`)}
            className="text-sm text-slate-500 hover:text-primary font-semibold">
            Back
          </button>
          <Image src="/images/aivo-logo-purple.png" alt="AIVO" width={100} height={30} />
        </div>
        <div className="text-sm text-slate-500 font-semibold">
          {answeredCount} of {TOTAL_QUESTIONS} questions
        </div>
      </header>

      <div className="h-1.5 bg-slate-100">
        <div className="h-full bg-primary transition-all duration-300 rounded-r-full" style={{ width: `${progress}%` }} />
      </div>

      {showCelebration && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-8 text-center shadow-2xl max-w-sm mx-4 animate-in fade-in zoom-in">
            <div className="w-16 h-16 rounded-full bg-green-400 flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl text-white">&#10003;</span>
            </div>
            <h3 className="text-xl font-heading font-bold text-slate-900">Section Complete!</h3>
            <p className="text-sm text-slate-500 mt-1">Great job! Moving to the next section...</p>
          </div>
        </div>
      )}

      <main className="max-w-2xl mx-auto px-6 py-8">
        <div className="flex gap-1.5 mb-6 overflow-x-auto pb-2">
          {PARENT_ASSESSMENT_CATEGORIES.map((cat, idx) => {
            const catAnswered = cat.questions.filter(q => answers[q.id] !== undefined).length;
            const catTotal = cat.questions.length;
            const isComplete = catAnswered === catTotal;
            const isCurrent = idx === currentCategoryIdx;
            return (
              <button key={cat.key}
                onClick={() => { setCurrentCategoryIdx(idx); setCurrentQuestionIdx(0); }}
                className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-bold transition ${
                  isCurrent ? "text-white shadow-md" : isComplete ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-400"
                }`}
                style={isCurrent ? { backgroundColor: cat.color } : undefined}
                title={cat.label}>
                {cat.icon} {isCurrent ? cat.label : `${catAnswered}/${catTotal}`}
              </button>
            );
          })}
        </div>

        {question && (
          <div className="bg-white rounded-3xl p-8 shadow-md border border-slate-100 space-y-6">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-2xl">{category.icon}</span>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider" style={{ color: category.color }}>
                  {category.label}
                </p>
                <p className="text-xs text-slate-400">
                  Question {currentQuestionIdx + 1} of {category.questions.length}
                </p>
              </div>
            </div>

            <h2 className="text-lg font-heading font-bold text-slate-900 leading-relaxed">
              {question.questionText}
            </h2>

            {question.helpText && (
              <p className="text-sm text-slate-400 italic">{question.helpText}</p>
            )}

            <QuestionInput
              question={question}
              value={answers[question.id]}
              categoryColor={category.color}
              categoryBgColor={category.bgColor}
              onSelect={(v) => setAnswer(question.id, v)}
              onMultiToggle={(opt) => toggleMultiSelect(question.id, opt)}
              onTextChange={(v) => setAnswer(question.id, v)}
              onScaleChange={(v) => setAnswer(question.id, v)}
            />

            {submitError && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm font-semibold text-center">
                {submitError}
              </div>
            )}

            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <button onClick={goPrev}
                disabled={currentCategoryIdx === 0 && currentQuestionIdx === 0}
                className="px-5 py-2.5 rounded-full text-sm font-bold text-slate-500 hover:bg-slate-100 transition disabled:opacity-30">
                Previous
              </button>

              {isLastQuestion ? (
                <button onClick={submit} disabled={submitting}
                  className="px-8 py-2.5 rounded-full bg-green-500 text-white font-bold text-sm hover:bg-green-600 transition disabled:opacity-50 shadow-lg">
                  {submitting ? "Submitting..." : "Submit Assessment"}
                </button>
              ) : (
                <button onClick={goNext} disabled={!canAdvance}
                  className="px-6 py-2.5 rounded-full text-white font-bold text-sm transition disabled:opacity-50 shadow-md"
                  style={{ backgroundColor: category.color }}>
                  Next
                </button>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function QuestionInput({
  question: q,
  value,
  categoryColor,
  categoryBgColor,
  onSelect,
  onMultiToggle,
  onTextChange,
  onScaleChange,
}: {
  question: AssessmentQuestion;
  value: any;
  categoryColor: string;
  categoryBgColor: string;
  onSelect: (v: string) => void;
  onMultiToggle: (opt: string) => void;
  onTextChange: (v: string) => void;
  onScaleChange: (v: number) => void;
}) {
  if (q.questionType === "multiple_choice" || q.questionType === "yes_no") {
    return (
      <div className="space-y-2">
        {(q.options || []).map(opt => {
          const selected = value === opt;
          return (
            <button key={opt} onClick={() => onSelect(opt)}
              className="w-full text-left px-4 py-3 rounded-2xl border-2 text-sm font-semibold transition"
              style={{
                borderColor: selected ? categoryColor : "#e2e8f0",
                backgroundColor: selected ? categoryBgColor : "white",
                color: selected ? categoryColor : "#475569",
              }}>
              {opt}
            </button>
          );
        })}
      </div>
    );
  }

  if (q.questionType === "multi_select") {
    const selected = (value as string[]) || [];
    return (
      <div className="space-y-2">
        {(q.options || []).map(opt => {
          const isSelected = selected.includes(opt);
          return (
            <button key={opt} onClick={() => onMultiToggle(opt)}
              className="w-full text-left px-4 py-3 rounded-2xl border-2 text-sm font-semibold transition flex items-center gap-3"
              style={{
                borderColor: isSelected ? categoryColor : "#e2e8f0",
                backgroundColor: isSelected ? categoryBgColor : "white",
                color: isSelected ? categoryColor : "#475569",
              }}>
              <span className="w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 text-xs"
                style={{
                  borderColor: isSelected ? categoryColor : "#cbd5e1",
                  backgroundColor: isSelected ? categoryColor : "transparent",
                  color: "white",
                }}>
                {isSelected ? "&#10003;" : ""}
              </span>
              {opt}
            </button>
          );
        })}
      </div>
    );
  }

  if (q.questionType === "rating_scale") {
    return (
      <div>
        <div className="flex items-center gap-2 justify-center">
          {Array.from({ length: (q.scaleMax ?? 5) - (q.scaleMin ?? 1) + 1 }).map((_, i) => {
            const val = (q.scaleMin ?? 1) + i;
            const selected = value === val;
            const emoji = SCALE_EMOJIS[Math.min(i, SCALE_EMOJIS.length - 1)];
            return (
              <button key={val} type="button" onClick={() => onScaleChange(val)}
                className="flex flex-col items-center gap-1 p-3 rounded-2xl transition-all hover:scale-105"
                style={selected ? { backgroundColor: categoryBgColor } : undefined}>
                <span className={`text-3xl transition-all ${selected ? "scale-110" : "grayscale opacity-50"}`}>
                  {emoji}
                </span>
                <span className="text-xs font-bold" style={{ color: selected ? categoryColor : "#94a3b8" }}>
                  {val}
                </span>
              </button>
            );
          })}
        </div>
        <div className="flex justify-between mt-2 px-2">
          <span className="text-xs text-slate-400">{q.scaleLabels?.min}</span>
          <span className="text-xs text-slate-400">{q.scaleLabels?.max}</span>
        </div>
      </div>
    );
  }

  if (q.questionType === "open_ended") {
    return (
      <textarea
        value={(value as string) ?? ""}
        onChange={(e) => onTextChange(e.target.value)}
        placeholder="Type your answer..."
        rows={3}
        className="w-full rounded-2xl border-2 border-slate-200 p-4 text-sm text-slate-800 placeholder-slate-300 focus:outline-none resize-none transition-all font-body"
        onFocus={(e) => { e.currentTarget.style.borderColor = categoryColor; }}
        onBlur={(e) => { e.currentTarget.style.borderColor = "#e2e8f0"; }}
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
