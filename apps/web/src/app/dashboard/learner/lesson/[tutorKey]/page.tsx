"use client";
import { useAuth } from "@/providers/auth-provider";
import { useRouter, useParams } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import { Play, ChevronLeft, Wind, LogOut, Sparkles } from "lucide-react";
import { TUTORS, type TutorKey } from "@aivo/brand";
import { useTranslations } from "next-intl";
import { StageLayout } from "@/components/stage/StageLayout";
import { CelebrationOverlay } from "@/components/stage/CelebrationOverlay";
import { useSensoryAdapter } from "@/components/stage/useSensoryAdapter";
import { useSessionFlow } from "@/components/stage/useSessionFlow";
import { useTTS } from "@/components/stage/useTTS";
import { useLocale } from "@/providers/i18n-provider";
import { TUTOR_THEMES } from "@/components/stage/types";
import type { Beat, TutorState, FunctioningLevel } from "@/components/stage/types";

const SKU_MAP: Record<string, string> = {
  nova: "ADDON_TUTOR_MATH", sage: "ADDON_TUTOR_ELA", spark: "ADDON_TUTOR_SCIENCE",
  chrono: "ADDON_TUTOR_HISTORY", pixel: "ADDON_TUTOR_CODING", echo: "ADDON_TUTOR_SPEECH",
  harmony: "ADDON_TUTOR_SEL", atlas: "ADDON_TUTOR_SOCIAL_STUDIES", cadence: "ADDON_TUTOR_ARTS",
  vigor: "ADDON_TUTOR_PE_HEALTH", lingua: "ADDON_TUTOR_LANGUAGES", forge: "ADDON_TUTOR_STEM_DESIGN",
  compass: "ADDON_TUTOR_LIFE_SKILLS", muse: "ADDON_TUTOR_CREATIVE_WRITING",
};

function generateDemoBeats(tutorKey: string, learnerName: string, level: FunctioningLevel): Beat[] {
  const tutor = TUTORS[tutorKey as TutorKey];
  if (!tutor) return [];
  const name = tutor.name;

  const beatSets: Record<string, Beat[]> = {
    nova: [
      { id: "open", type: "narration", tutorState: "speaking", narration: `Welcome back, ${learnerName}! Ready to explore the cosmos of numbers with me?`, visuals: [
        { id: "v1", type: "card", content: "Today's Mission", emoji: "🚀", animation: "bounce", position: { x: 50, y: 30 } },
      ] },
      { id: "warmup", type: "interaction", tutorState: "encouraging", narration: "Let's warm up! Which planet has the most moons?", visuals: [
        { id: "v2", type: "card", content: "Quick Space Quiz", emoji: "🪐", animation: "fade_in", position: { x: 50, y: 20 } },
      ], interaction: { type: "multiple_choice", prompt: "Which planet has the most moons?", choices: [
        { id: "a", label: "Jupiter", emoji: "🟤", isCorrect: false },
        { id: "b", label: "Saturn", emoji: "🪐", isCorrect: true },
        { id: "c", label: "Earth", emoji: "🌍", isCorrect: false },
        { id: "d", label: "Mars", emoji: "🔴", isCorrect: false },
      ] } },
      { id: "core1", type: "demonstration", tutorState: "pointing", narration: "Fractions are like splitting a planet into equal parts. Watch!", visuals: [
        { id: "v3", type: "card", content: "Fraction Explorer", emoji: "🌕", animation: "slide_in", position: { x: 50, y: 25 } },
        { id: "v4", type: "manipulative", content: "🌕,🌗,🌑", animation: "bounce", position: { x: 50, y: 55 } },
      ] },
      { id: "core2", type: "interaction", tutorState: "encouraging", narration: "If we split a pizza into 4 equal slices and eat 1, what fraction is left?", visuals: [
        { id: "v5", type: "card", content: "Pizza Fractions", emoji: "🍕", animation: "fade_in", position: { x: 50, y: 20 } },
      ], interaction: { type: "multiple_choice", prompt: "1 slice eaten from 4 total. What fraction remains?", choices: [
        { id: "a", label: "3/4", emoji: "🍕", isCorrect: true },
        { id: "b", label: "1/4", emoji: "🍕", isCorrect: false },
        { id: "c", label: "2/4", emoji: "🍕", isCorrect: false },
        { id: "d", label: "4/4", emoji: "🍕", isCorrect: false },
      ] } },
      { id: "core3", type: "interaction", tutorState: "thinking", narration: "Now arrange these fractions from smallest to largest!", visuals: [
        { id: "v6", type: "card", content: "Sort the Fractions", emoji: "📊", animation: "slide_in", position: { x: 50, y: 20 } },
      ], interaction: { type: "drag_drop", prompt: "Drag fractions in order: smallest → largest", dragItems: [
        { id: "d1", label: "3/4", emoji: "🔵", targetZone: "z3" },
        { id: "d2", label: "1/4", emoji: "🟢", targetZone: "z1" },
        { id: "d3", label: "1/2", emoji: "🟡", targetZone: "z2" },
      ], dragZones: [
        { id: "z1", label: "Smallest" },
        { id: "z2", label: "Middle" },
        { id: "z3", label: "Largest" },
      ] } },
      { id: "check", type: "interaction", tutorState: "encouraging", narration: "Final challenge! What is 1/2 + 1/4?", visuals: [
        { id: "v7", type: "card", content: "Star Challenge", emoji: "⭐", animation: "glow", position: { x: 50, y: 20 } },
      ], interaction: { type: "multiple_choice", prompt: "What is 1/2 + 1/4?", choices: [
        { id: "a", label: "3/4", emoji: "✨", isCorrect: true },
        { id: "b", label: "2/4", emoji: "💫", isCorrect: false },
        { id: "c", label: "1/6", emoji: "🌟", isCorrect: false },
      ] } },
      { id: "close", type: "celebration", tutorState: "celebrating", narration: `Amazing work, ${learnerName}! You're becoming a fraction master! Next time we'll explore mixed numbers!`, visuals: [
        { id: "v8", type: "card", content: "Mission Complete!", emoji: "🏆", animation: "bounce", position: { x: 50, y: 30 } },
      ] },
    ],
    sage: [
      { id: "open", type: "narration", tutorState: "speaking", narration: `Welcome to the Story Garden, ${learnerName}! Let's discover a wonderful tale together.`, visuals: [
        { id: "v1", type: "card", content: "Story Time", emoji: "📖", animation: "fade_in", position: { x: 50, y: 30 } },
      ] },
      { id: "warmup", type: "interaction", tutorState: "encouraging", narration: "Which word means the same as 'happy'?", visuals: [
        { id: "v2", type: "card", content: "Word Power Warm-Up", emoji: "✏️", animation: "slide_in", position: { x: 50, y: 20 } },
      ], interaction: { type: "multiple_choice", prompt: "Which word is a synonym for 'happy'?", choices: [
        { id: "a", label: "Joyful", emoji: "😊", isCorrect: true },
        { id: "b", label: "Angry", emoji: "😠", isCorrect: false },
        { id: "c", label: "Tired", emoji: "😴", isCorrect: false },
      ] } },
      { id: "core1", type: "demonstration", tutorState: "pointing", narration: "Every story has characters, a setting, and a plot. Let me show you!", visuals: [
        { id: "v3", type: "card", content: "Story Elements", emoji: "🎭", animation: "bounce", position: { x: 50, y: 20 } },
        { id: "v4", type: "shape", content: "👤", emoji: "👤", animation: "slide_in", position: { x: 20, y: 50 }, color: "#10B981" },
        { id: "v5", type: "shape", content: "🏰", emoji: "🏰", animation: "slide_in", position: { x: 50, y: 50 }, color: "#3B82F6" },
        { id: "v6", type: "shape", content: "⚡", emoji: "⚡", animation: "slide_in", position: { x: 80, y: 50 }, color: "#F59E0B" },
      ] },
      { id: "core2", type: "interaction", tutorState: "thinking", narration: "In the story 'The Three Bears,' what is the setting?", visuals: [
        { id: "v7", type: "card", content: "Reading Detective", emoji: "🔍", animation: "fade_in", position: { x: 50, y: 20 } },
      ], interaction: { type: "multiple_choice", prompt: "Where does the story take place?", choices: [
        { id: "a", label: "A forest cottage", emoji: "🏠", isCorrect: true },
        { id: "b", label: "A spaceship", emoji: "🚀", isCorrect: false },
        { id: "c", label: "A school", emoji: "🏫", isCorrect: false },
      ] } },
      { id: "check", type: "interaction", tutorState: "encouraging", narration: "Match each story element to its description!", visuals: [
        { id: "v8", type: "card", content: "Match Game", emoji: "🧩", animation: "glow", position: { x: 50, y: 20 } },
      ], interaction: { type: "drag_drop", prompt: "Match each element to its meaning", dragItems: [
        { id: "d1", label: "Character", emoji: "👤", targetZone: "z1" },
        { id: "d2", label: "Setting", emoji: "🏰", targetZone: "z2" },
        { id: "d3", label: "Plot", emoji: "⚡", targetZone: "z3" },
      ], dragZones: [
        { id: "z1", label: "Who" },
        { id: "z2", label: "Where" },
        { id: "z3", label: "What happens" },
      ] } },
      { id: "close", type: "celebration", tutorState: "celebrating", narration: `Wonderful reading, ${learnerName}! You're becoming a true story detective!`, visuals: [
        { id: "v9", type: "card", content: "Chapter Complete!", emoji: "📚", animation: "bounce", position: { x: 50, y: 30 } },
      ] },
    ],
  };

  const defaultBeats: Beat[] = [
    { id: "open", type: "narration", tutorState: "speaking", narration: `Hello ${learnerName}! I'm ${name}, and I'm so excited to learn with you today!`, visuals: [
      { id: "v1", type: "card", content: `Welcome to ${name}'s World`, emoji: tutor.icon, animation: "bounce", position: { x: 50, y: 30 } },
    ] },
    { id: "warmup", type: "interaction", tutorState: "encouraging", narration: "Let's start with a quick warm-up question!", visuals: [
      { id: "v2", type: "card", content: "Warm-Up Challenge", emoji: "⚡", animation: "slide_in", position: { x: 50, y: 20 } },
    ], interaction: { type: "multiple_choice", prompt: `What does ${name} teach?`, choices: [
      { id: "a", label: tutor.domain, emoji: tutor.icon, isCorrect: true },
      { id: "b", label: "Swimming", emoji: "🏊", isCorrect: false },
      { id: "c", label: "Cooking", emoji: "🍳", isCorrect: false },
    ] } },
    { id: "core1", type: "demonstration", tutorState: "pointing", narration: `Today we're exploring something amazing in ${tutor.domain}. Watch carefully!`, visuals: [
      { id: "v3", type: "card", content: `Exploring ${tutor.domain}`, emoji: tutor.icon, animation: "fade_in", position: { x: 50, y: 25 } },
      { id: "v4", type: "text", content: "Every great journey begins with curiosity!", animation: "slide_in", position: { x: 50, y: 55 } },
    ] },
    { id: "core2", type: "interaction", tutorState: "thinking", narration: "Now it's your turn! Can you solve this?", visuals: [
      { id: "v5", type: "card", content: "Your Turn!", emoji: "🎯", animation: "bounce", position: { x: 50, y: 20 } },
    ], interaction: { type: "tap", prompt: "Tap to show me you're ready!" } },
    { id: "check", type: "interaction", tutorState: "encouraging", narration: "One last challenge! I know you can do this!", visuals: [
      { id: "v6", type: "card", content: "Final Challenge", emoji: "⭐", animation: "glow", position: { x: 50, y: 20 } },
    ], interaction: { type: "multiple_choice", prompt: "Did you enjoy learning today?", choices: [
      { id: "a", label: "Yes!", emoji: "🎉", isCorrect: true },
      { id: "b", label: "It was great!", emoji: "⭐", isCorrect: true },
    ] } },
    { id: "close", type: "celebration", tutorState: "celebrating", narration: `You did amazing, ${learnerName}! I can't wait for our next session!`, visuals: [
      { id: "v7", type: "card", content: "Session Complete!", emoji: "🏆", animation: "bounce", position: { x: 50, y: 30 } },
    ] },
  ];

  let beats = beatSets[tutorKey] || defaultBeats;

  if (level === "LOW_VERBAL" || level === "NON_VERBAL" || level === "PRE_SYMBOLIC") {
    beats = beats.map((b) => ({
      ...b,
      visuals: b.visuals.slice(0, 2),
      interaction: b.interaction ? {
        ...b.interaction,
        choices: b.interaction.choices?.slice(0, 2),
      } : undefined,
    }));
  }

  return beats;
}

export default function LessonPage() {
  const { user, accessToken, loading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const tutorKey = params.tutorKey as TutorKey;
  const tutor = TUTORS[tutorKey];
  const tTutor = useTranslations("tutor");
  const tLearner = useTranslations("learner");
  const tCommon = useTranslations("common");

  const [functioningLevel, setFunctioningLevel] = useState<FunctioningLevel>("STANDARD");
  const [learnerName, setLearnerName] = useState("");
  const [tutorState, setTutorState] = useState<TutorState>("idle");
  const [speechText, setSpeechText] = useState<string | undefined>();
  const [showCelebration, setShowCelebration] = useState(false);
  const [showPause, setShowPause] = useState(false);
  const [started, setStarted] = useState(false);
  const [sessionApiId, setSessionApiId] = useState<string | null>(null);
  const [curriculumFocus, setCurriculumFocus] = useState<{
    title?: string;
    summary?: string;
    topics?: string[];
    weekStart?: string | null;
    weekEnd?: string | null;
  } | null>(null);
  const tCurriculum = useTranslations("curriculum");
  const tDape = useTranslations("dape");
  const [dapeProfile, setDapeProfile] = useState<{ hasActiveTrack: boolean; categories: { id: string; label: string; goalCount: number }[] } | null>(null);
  const [dapeActivity, setDapeActivity] = useState<null | {
    category: string;
    activity: { name: string; pictureSequence: string[]; steps: string[]; equipment: string[]; partnerCue: string; durationMin: number };
  }>(null);
  const [dapeLoading, setDapeLoading] = useState(false);

  const { adaptations, getRegulationBreak } = useSensoryAdapter(
    user?.id || null,
    accessToken,
    functioningLevel
  );

  const { state, currentBeat, progress, setPhase, loadBeats, nextBeat, recordAnswer, cleanup } = useSessionFlow(tutorKey, user?.id || "", functioningLevel);

  const { locale } = useLocale();
  const { speak, stop: stopTTS, isSpeaking } = useTTS(tutorKey, adaptations, locale);

  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [user, loading, router]);

  useEffect(() => {
    if (!accessToken || !user) return;
    fetch(`/api/brain/${user.id}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.functioning_level_profile?.level) {
          setFunctioningLevel(data.functioning_level_profile.level);
        }
      })
      .catch(() => {});

    fetch("/api/users/me", {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.name) setLearnerName(data.name);
      })
      .catch(() => {});

    const tutorSubjectMap: Record<string, string> = {
      nova: "math",
      sage: "ela",
      spark: "science",
      chrono: "history",
      pixel: "coding",
      echo: "speech",
      harmony: "sel",
      atlas: "history",
      cadence: "art",
      vigor: "other",
      lingua: "ela",
      forge: "science",
      compass: "sel",
      muse: "art",
    };
    const subjectHint = tutorSubjectMap[tutorKey] || "";
    const subjectQuery = subjectHint ? `?subject=${subjectHint}` : "";
    fetch(`/api/tutors/curriculum/learner/${user.id}/active${subjectQuery}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.focus) setCurriculumFocus(data.focus);
      })
      .catch(() => {});

    // For Vigor, check whether this learner has DAPE goals; if so, fetch a
    // suggested activity so we can offer the DAPE track on the start screen.
    if (tutorKey === "vigor") {
      fetch(`/api/family/iep/${user.id}/dape/profile`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => { if (data) setDapeProfile(data); })
        .catch(() => {});
    }
  }, [accessToken, user, tutorKey]);

  const loadDapeActivity = useCallback(async (category?: string) => {
    if (!user || !accessToken) return;
    setDapeLoading(true);
    try {
      const url = `/api/family/iep/${user.id}/dape/activity${category ? `?category=${encodeURIComponent(category)}` : ""}`;
      const res = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
      if (res.ok) setDapeActivity(await res.json());
    } catch { /* ignore */ }
    setDapeLoading(false);
  }, [user, accessToken]);

  const handleNarration = useCallback(async (beat: Beat | null) => {
    if (!beat?.narration) {
      if (beat && !beat.interaction) {
        setTimeout(() => nextBeat(), 1500);
      }
      return;
    }
    setSpeechText(beat.narration);
    setTutorState(beat.tutorState || "speaking");
    await speak(beat.narration);
    setTutorState("idle");
    if (!beat.interaction) {
      const delay = beat.type === "celebration" ? 2000 : 1500;
      setTimeout(() => nextBeat(), delay);
    }
  }, [speak, nextBeat]);

  useEffect(() => {
    if (started && currentBeat) {
      handleNarration(currentBeat);
    }
  }, [currentBeat?.id, started]);

  useEffect(() => {
    if (state.phase === "celebration" && !showCelebration) {
      setShowCelebration(true);
      setTutorState("celebrating");
      completeSessionAPI();
    }
  }, [state.phase]);

  const startStage = async () => {
    if (!user || !tutor) return;
    setStarted(true);

    const sku = SKU_MAP[tutorKey] || `ADDON_TUTOR_${tutorKey.toUpperCase()}`;
    try {
      const res = await fetch("/api/tutor/session/start", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ learnerId: user.id, tutorSku: sku }),
      });
      if (res.ok) {
        const data = await res.json();
        setSessionApiId(data.sessionId);
      }
    } catch {}

    const name = learnerName || user.name || "Explorer";
    const beats = generateDemoBeats(tutorKey, name, functioningLevel);
    loadBeats(beats, undefined, name);
  };

  const completeSessionAPI = async () => {
    if (sessionApiId && accessToken) {
      try {
        await fetch(`/api/tutor/session/${sessionApiId}/complete`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
          body: JSON.stringify({}),
        });
      } catch {}

      try {
        await fetch("/api/engagement/xp/award", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
          body: JSON.stringify({
            learnerId: user?.id,
            eventType: "lesson_completed",
            xpAmount: state.xpEarned || 50,
            coinReward: state.coinsEarned || 10,
            metadata: { tutorKey, correctCount: state.correctCount, totalAttempts: state.totalAttempts },
          }),
        });
      } catch {}

      try {
        await fetch("/api/engagement/streak/update", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
          body: JSON.stringify({ learnerId: user?.id }),
        });
      } catch {}
    }
  };

  const handleAnswer = useCallback((correct: boolean) => {
    if (correct) {
      setTutorState("celebrating");
      setSpeechText(["Great job!", "Amazing!", "You got it!", "Wonderful!"][Math.floor(Math.random() * 4)]);
      recordAnswer(true, 15, 3);
      speak(["Great job!", "Amazing!", "You got it!", "Wonderful!"][Math.floor(Math.random() * 4)]).then(() => {
        setTutorState("idle");
        setTimeout(() => nextBeat(), 800);
      });
    } else {
      setTutorState("encouraging");
      setSpeechText("That's okay! Let's try again!");
      recordAnswer(false, 5, 1);
      speak("That's okay! Let's try again!").then(() => {
        setTutorState("idle");
      });
    }
  }, [recordAnswer, nextBeat, speak]);

  const handlePause = useCallback(() => {
    stopTTS();
    setShowPause(true);
    // If this learner has DAPE goals, fetch a regulation-break activity
    // matched to their sensory profile so the pause modal can offer a
    // movement break instead of a passive timeout.
    if (dapeProfile?.hasActiveTrack) {
      const { category } = getRegulationBreak();
      loadDapeActivity(category);
    }
  }, [stopTTS, dapeProfile, getRegulationBreak, loadDapeActivity]);

  const handleCelebrationComplete = useCallback(() => {
    setShowCelebration(false);
    cleanup();
    router.push("/dashboard/learner");
  }, [cleanup, router]);

  if (loading || !user) return null;
  if (!tutor) return <div className="min-h-screen flex items-center justify-center text-slate-500 font-heading">{tTutor("not_found")}</div>;

  const theme = TUTOR_THEMES[tutorKey];

  if (!started) {
    return (
      <div className="min-h-screen vi-bg flex flex-col items-center justify-center px-6 py-8">
        <div className="w-full max-w-md">
          <section
            className="vi-card p-8 md:p-10 text-center relative overflow-hidden bg-gradient-to-br from-white"
            style={{
              background: `linear-gradient(135deg, white, ${tutor.color}10)`,
              borderColor: `${tutor.color}26`,
            }}
          >
            <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full blur-2xl" style={{ backgroundColor: `${tutor.color}30` }} aria-hidden />
            <div className="absolute -bottom-10 -left-10 w-40 h-40 rounded-full bg-[hsl(43_100%_50%/0.18)] blur-2xl" aria-hidden />
            <div className="relative">
              <div className="relative w-32 h-32 md:w-36 md:h-36 rounded-3xl overflow-hidden border-4 shadow-xl mx-auto mb-6 animate-breathe" style={{ borderColor: tutor.color }}>
                <Image src={tutor.avatar} alt={tutor.name} fill className="object-cover" priority />
              </div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] mb-2" style={{ color: tutor.color }}>{tutor.domain}</p>
              <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-2 leading-tight">
                Learn with {tutor.name} <Sparkles className="inline w-7 h-7 text-[hsl(43_100%_50%)]" aria-hidden />
              </h1>
              <p className="text-base text-slate-600 mb-1">{theme?.envName || tutor.domain}</p>
              {learnerName && (
                <p className="text-slate-500 mb-6">Ready for an adventure, {learnerName}!</p>
              )}

              <button
                onClick={startStage}
                className="inline-flex items-center gap-2 px-8 py-4 rounded-full text-white font-extrabold text-xl shadow-xl hover:scale-105 active:scale-95 transition-transform focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-offset-2 mt-3"
                style={{ backgroundColor: tutor.color, boxShadow: `0 8px 24px ${tutor.color}60` }}
              >
                <Play className="w-5 h-5 fill-white" /> {tLearner("start_learning")}
              </button>

              {tutorKey === "vigor" && dapeProfile?.hasActiveTrack && (
                <div className="mt-6 text-left rounded-2xl border-2 p-4 bg-white" style={{ borderColor: `${tutor.color}40` }}>
                  <div className="flex items-center justify-between mb-2 gap-3">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wide" style={{ color: tutor.color }}>{tDape("track_label")}</p>
                      <p className="font-extrabold text-slate-900">{tDape("track_heading")}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => loadDapeActivity()}
                      disabled={dapeLoading}
                      className="text-xs font-bold rounded-full px-3 py-1.5 disabled:opacity-50"
                      style={{ backgroundColor: `${tutor.color}18`, color: tutor.color }}
                    >
                      {dapeActivity ? tDape("new_activity") : (dapeLoading ? tDape("loading") : tDape("suggest_activity"))}
                    </button>
                  </div>
                  {dapeProfile.categories.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {dapeProfile.categories.map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => loadDapeActivity(c.id)}
                          className="text-xs font-bold rounded-full px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700"
                        >
                          {c.label} · {c.goalCount}
                        </button>
                      ))}
                    </div>
                  )}
                  {dapeActivity && (
                    <div className="rounded-xl bg-slate-50 p-3 space-y-2">
                      <p className="font-extrabold text-slate-900 text-sm">{dapeActivity.activity.name}</p>
                      <p className="text-2xl tracking-widest" aria-hidden>
                        {dapeActivity.activity.pictureSequence.join(" ")}
                      </p>
                      <ol className="list-decimal list-inside text-xs text-slate-700 space-y-0.5">
                        {dapeActivity.activity.steps.map((s, i) => <li key={i}>{s}</li>)}
                      </ol>
                      {dapeActivity.activity.partnerCue && (
                        <p className="text-xs italic text-slate-500">{tDape("partner_cue")}: {dapeActivity.activity.partnerCue}</p>
                      )}
                    </div>
                  )}
                </div>
              )}

              <div>
                <button
                  onClick={() => router.push("/dashboard/learner")}
                  className="mt-5 inline-flex items-center gap-2 text-slate-500 hover:text-slate-700 text-sm font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 rounded-full px-3 py-2"
                >
                  <ChevronLeft className="w-4 h-4" /> {tCommon("back")}
                </button>
              </div>
            </div>
          </section>
        </div>
      </div>
    );
  }

  return (
    <>
      {curriculumFocus && started && (
        <div
          className="fixed top-3 left-1/2 -translate-x-1/2 z-40 max-w-lg w-[92%] sm:w-auto pointer-events-none"
          role="status"
          aria-live="polite"
        >
          <div
            className="rounded-full px-4 py-2 shadow-lg backdrop-blur-md text-sm flex items-center gap-2 pointer-events-auto"
            style={{ backgroundColor: `${tutor.color}E6`, color: "white" }}
          >
            <span className="text-xs uppercase tracking-wide opacity-80 font-semibold">
              {tCurriculum("stage_banner_label")}
            </span>
            <span className="font-semibold truncate max-w-[18rem]">
              {curriculumFocus.title || (curriculumFocus.topics || [])[0] || curriculumFocus.summary?.slice(0, 60)}
            </span>
          </div>
        </div>
      )}
      <StageLayout
        tutorKey={tutorKey}
        phase={state.phase}
        tutorState={tutorState}
        currentBeat={currentBeat}
        progress={progress}
        totalBeats={state.totalBeats}
        currentBeatIndex={state.currentBeatIndex}
        speechText={speechText}
        functioningLevel={functioningLevel}
        adaptations={adaptations}
        onAnswer={handleAnswer}
        onPause={handlePause}
      />

      {showPause && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm animate-fade-in px-4">
          <div className="vi-card p-8 max-w-sm w-full text-center space-y-5 animate-scale-in border-2" style={{ borderColor: `${tutor.color}26` }}>
            <div className="mx-auto inline-flex">
              <div className="w-16 h-16 rounded-3xl flex items-center justify-center bg-[hsl(199_89%_48%/0.12)] text-[hsl(199_89%_48%)] animate-breathe">
                <Wind className="w-8 h-8" strokeWidth={2.5} aria-hidden />
              </div>
            </div>
            <div>
              <h2 className="text-2xl font-extrabold text-slate-900 mb-1">{tLearner("taking_break")}</h2>
              <p className="text-slate-600">{tLearner("take_breath")}</p>
            </div>

            {dapeProfile?.hasActiveTrack && dapeActivity && (
              <div className="rounded-xl bg-slate-50 p-3 text-left space-y-1.5">
                <p className="text-xs font-bold uppercase tracking-wide text-emerald-700">{tDape("regulation_break")}</p>
                <p className="font-extrabold text-slate-900 text-sm">{dapeActivity.activity.name}</p>
                <p className="text-xl tracking-widest" aria-hidden>{dapeActivity.activity.pictureSequence.join(" ")}</p>
                <ol className="list-decimal list-inside text-xs text-slate-700 space-y-0.5">
                  {dapeActivity.activity.steps.slice(0, 3).map((s, i) => <li key={i}>{s}</li>)}
                </ol>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setShowPause(false)}
                className="flex-1 inline-flex items-center justify-center gap-2 py-3 rounded-full font-extrabold text-white shadow-lg hover:scale-105 active:scale-95 transition-transform focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-offset-2"
                style={{ backgroundColor: tutor.color, boxShadow: `0 8px 24px ${tutor.color}40` }}
              >
                <Play className="w-4 h-4 fill-white" /> {tLearner("resume")}
              </button>
              <button
                onClick={() => { cleanup(); router.push("/dashboard/learner"); }}
                className="flex-1 inline-flex items-center justify-center gap-2 py-3 rounded-full font-extrabold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
              >
                <LogOut className="w-4 h-4" /> {tLearner("log_out")}
              </button>
            </div>
          </div>
        </div>
      )}

      {showCelebration && (
        <CelebrationOverlay
          xpEarned={state.xpEarned || 50}
          coinsEarned={state.coinsEarned || 10}
          correctCount={state.correctCount}
          totalAttempts={state.totalAttempts}
          adaptations={adaptations}
          accentColor={tutor.color}
          tutorName={tutor.name}
          onComplete={handleCelebrationComplete}
        />
      )}
    </>
  );
}
