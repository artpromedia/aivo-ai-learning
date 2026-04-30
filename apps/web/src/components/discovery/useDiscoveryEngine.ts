"use client";
import { useState, useCallback, useRef, useEffect } from "react";
import type {
  DiscoveryState,
  AdventurePhase,
  DifficultyTier,
  ChapterResult,
  ChapterActivities,
  Activity,
  AdventureChapter,
  FunctioningLevel,
} from "./types";
import { ADVENTURE_CHAPTERS, FUNCTIONING_LEVEL_CONFIG } from "./types";
import { FALLBACK_ACTIVITIES } from "./fallbackActivities";


interface UseDiscoveryEngineProps {
  learnerId: string;
  learnerName: string;
  functioningLevel: FunctioningLevel;
  accessToken: string | null;
  refreshToken?: () => Promise<string | null>;
  locale?: string;
}

const STORAGE_KEY_PREFIX = "aivo_discovery_";

function loadSavedState(learnerId: string): DiscoveryState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(`${STORAGE_KEY_PREFIX}${learnerId}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as DiscoveryState;
    if (parsed.phase === "results" || parsed.phase === "finale") return null;
    return parsed;
  } catch {
    return null;
  }
}

function persistState(learnerId: string, state: DiscoveryState) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}${learnerId}`, JSON.stringify(state));
  } catch {}
}

function clearSavedState(learnerId: string) {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(`${STORAGE_KEY_PREFIX}${learnerId}`);
  } catch {}
}

export function useDiscoveryEngine({ learnerId, learnerName, functioningLevel, accessToken, refreshToken, locale }: UseDiscoveryEngineProps) {
  const config = FUNCTIONING_LEVEL_CONFIG[functioningLevel] || FUNCTIONING_LEVEL_CONFIG.STANDARD;
  const chapters = ADVENTURE_CHAPTERS.slice(0, config.chaptersCount);

  const [state, setState] = useState<DiscoveryState>(() => {
    const saved = loadSavedState(learnerId);
    if (saved) return saved;
    return {
      phase: "loading",
      currentChapterIdx: 0,
      currentActivityIdx: 0,
      chapterResults: [],
      startedAt: Date.now(),
      currentDifficulty: "easy",
      streakCorrect: 0,
      streakWrong: 0,
      totalCorrect: 0,
      totalAttempts: 0,
      xpEarned: 0,
      favoriteChapterIdx: 0,
      responseLatencies: [],
    };
  });

  const stateRef = useRef(state);
  stateRef.current = state;
  const resumeHandledRef = useRef(false);

  useEffect(() => {
    if (state.phase !== "loading" && state.phase !== "results") {
      persistState(learnerId, state);
    }
    if (state.phase === "results") {
      clearSavedState(learnerId);
    }
  }, [state, learnerId]);

  const chapterActivitiesRef = useRef<Record<string, ChapterActivities>>({});
  const chapterCorrectRef = useRef(0);
  const chapterTotalRef = useRef(0);
  const chapterLatenciesRef = useRef<number[]>([]);
  const loadingChapterRef = useRef<string | null>(null);

  // Cache activities per (chapter, locale) so a mid-session locale switch
  // returns translated activities instead of stale English ones.
  const activityCacheKey = useCallback(
    (chapterId: string) => `${chapterId}::${locale ?? "en"}`,
    [locale]
  );

  const loadChapterActivities = useCallback(async (chapter: AdventureChapter): Promise<ChapterActivities> => {
    const cacheKey = activityCacheKey(chapter.id);
    if (chapterActivitiesRef.current[cacheKey]) {
      return chapterActivitiesRef.current[cacheKey];
    }

    if (!accessToken) {
      const fallback = FALLBACK_ACTIVITIES[chapter.id] || FALLBACK_ACTIVITIES.sage_story_garden;
      chapterActivitiesRef.current[cacheKey] = fallback;
      return fallback;
    }

    try {
      const res = await fetch(`/api/assessments/learner/discovery/${learnerId}/chapter`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({
          chapter: {
            id: chapter.id,
            title: chapter.title,
            subtitle: chapter.subtitle,
            domain: chapter.domain,
            tutorKey: chapter.tutorKey,
            sceneDescription: chapter.sceneDescription,
          },
          // Forward the learner's UI locale so the LLM produces
          // narration/tutorLine/choice labels in their language
          // (matches locale-aware tutor chat).
          locale: locale ?? undefined,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.generated && data.activities) {
          const activities = data.activities as ChapterActivities;
          const hasActivities = ["easy", "medium", "hard"].some(
            tier => (activities[tier as DifficultyTier] || []).length > 0
          );
          if (hasActivities) {
            chapterActivitiesRef.current[cacheKey] = activities;
            return activities;
          }
        }
      }
    } catch {
    }

    const fallback = FALLBACK_ACTIVITIES[chapter.id] || FALLBACK_ACTIVITIES.sage_story_garden;
    chapterActivitiesRef.current[cacheKey] = fallback;
    return fallback;
  }, [accessToken, learnerId, locale, activityCacheKey]);

  useEffect(() => {
    if (resumeHandledRef.current) return;
    const saved = loadSavedState(learnerId);
    if (!saved) return;
    resumeHandledRef.current = true;
    const needsActivities = saved.phase === "activity" || saved.phase === "chapter-intro" || saved.phase === "chapter-complete";
    if (needsActivities && chapters[saved.currentChapterIdx]) {
      loadChapterActivities(chapters[saved.currentChapterIdx]);
    }
  }, [learnerId, chapters, loadChapterActivities]);

  const getCurrentActivities = useCallback((): Activity[] => {
    const chapter = chapters[state.currentChapterIdx];
    if (!chapter) return [];
    const chapterActs = chapterActivitiesRef.current[activityCacheKey(chapter.id)];
    if (!chapterActs) return [];
    const tierActs = chapterActs[state.currentDifficulty] || chapterActs.easy || [];
    return tierActs.slice(0, config.activitiesPerChapter);
  }, [state.currentChapterIdx, state.currentDifficulty, chapters, config.activitiesPerChapter, activityCacheKey]);

  const getCurrentActivity = useCallback((): Activity | null => {
    const activities = getCurrentActivities();
    return activities[state.currentActivityIdx] || null;
  }, [getCurrentActivities, state.currentActivityIdx]);

  const startAdventure = useCallback(() => {
    setState(s => ({ ...s, phase: "pre-adventure", startedAt: Date.now() }));
  }, []);

  const beginFirstChapter = useCallback(async () => {
    if (chapters.length === 0) {
      setState(s => ({ ...s, phase: "finale" }));
      return;
    }
    setState(s => ({ ...s, phase: "loading" }));
    await loadChapterActivities(chapters[0]);
    chapterCorrectRef.current = 0;
    chapterTotalRef.current = 0;
    chapterLatenciesRef.current = [];
    setState(s => ({ ...s, phase: "chapter-intro", currentChapterIdx: 0, currentActivityIdx: 0, currentDifficulty: "easy" }));
  }, [chapters, loadChapterActivities]);

  const startChapterActivities = useCallback(() => {
    setState(s => ({ ...s, phase: "activity", currentActivityIdx: 0 }));
  }, []);

  const handleAnswer = useCallback((correct: boolean, latencyMs: number) => {
    if (correct) chapterCorrectRef.current++;
    chapterTotalRef.current++;
    chapterLatenciesRef.current.push(latencyMs);

    setState(s => {
      const newStreakCorrect = correct ? s.streakCorrect + 1 : 0;
      const newStreakWrong = correct ? 0 : s.streakWrong + 1;
      const newXp = s.xpEarned + (correct ? 10 : 3);

      const chapter = chapters[s.currentChapterIdx];
      if (!chapter) return s;

      const chapterActs = chapterActivitiesRef.current[activityCacheKey(chapter.id)];
      if (!chapterActs) return s;
      const tierActs = chapterActs[s.currentDifficulty] || chapterActs.easy || [];
      const activities = tierActs.slice(0, config.activitiesPerChapter);
      const nextIdx = s.currentActivityIdx + 1;

      if (nextIdx >= activities.length) {
        let nextDifficulty = s.currentDifficulty;
        const chapterPct = chapterCorrectRef.current / Math.max(1, chapterTotalRef.current);
        if (chapterPct >= 0.8 && s.currentDifficulty === "easy") nextDifficulty = "medium";
        else if (chapterPct >= 0.8 && s.currentDifficulty === "medium") nextDifficulty = "hard";
        else if (chapterPct < 0.4 && s.currentDifficulty === "hard") nextDifficulty = "medium";
        else if (chapterPct < 0.4 && s.currentDifficulty === "medium") nextDifficulty = "easy";

        const result: ChapterResult = {
          chapterId: chapter.id,
          domain: chapter.domain,
          correct: chapterCorrectRef.current,
          total: chapterTotalRef.current,
          avgLatencyMs: chapterLatenciesRef.current.length > 0
            ? chapterLatenciesRef.current.reduce((a, b) => a + b, 0) / chapterLatenciesRef.current.length
            : 0,
          difficulty: s.currentDifficulty,
        };

        return {
          ...s,
          phase: "chapter-complete" as AdventurePhase,
          totalCorrect: s.totalCorrect + (correct ? 1 : 0),
          totalAttempts: s.totalAttempts + 1,
          streakCorrect: newStreakCorrect,
          streakWrong: newStreakWrong,
          xpEarned: newXp,
          currentDifficulty: nextDifficulty,
          chapterResults: [...s.chapterResults, result],
          responseLatencies: [...s.responseLatencies, latencyMs],
        };
      }

      return {
        ...s,
        currentActivityIdx: nextIdx,
        totalCorrect: s.totalCorrect + (correct ? 1 : 0),
        totalAttempts: s.totalAttempts + 1,
        streakCorrect: newStreakCorrect,
        streakWrong: newStreakWrong,
        xpEarned: newXp,
        responseLatencies: [...s.responseLatencies, latencyMs],
      };
    });
  }, [chapters, config.activitiesPerChapter]);

  const advanceToNextChapter = useCallback(async () => {
    const nextIdx = state.currentChapterIdx + 1;
    if (nextIdx >= chapters.length) {
      setState(s => ({ ...s, phase: "finale" }));
      return;
    }

    setState(s => ({ ...s, phase: "break" }));
  }, [state.currentChapterIdx, chapters]);

  const resumeAfterBreak = useCallback(async () => {
    const nextIdx = state.currentChapterIdx + 1;
    if (nextIdx >= chapters.length) {
      setState(s => ({ ...s, phase: "finale" }));
      return;
    }

    setState(s => ({ ...s, phase: "loading" }));
    await loadChapterActivities(chapters[nextIdx]);
    chapterCorrectRef.current = 0;
    chapterTotalRef.current = 0;
    chapterLatenciesRef.current = [];
    setState(s => ({
      ...s,
      phase: "chapter-intro",
      currentChapterIdx: nextIdx,
      currentActivityIdx: 0,
    }));
  }, [state.currentChapterIdx, chapters, loadChapterActivities]);

  const finishAdventure = useCallback(() => {
    clearSavedState(learnerId);
    setState(s => ({ ...s, phase: "results" }));
  }, [learnerId]);

  const exitToHome = useCallback(() => {
    persistState(learnerId, stateRef.current);
  }, [learnerId]);

  const hasSavedProgress = useCallback(() => {
    return loadSavedState(learnerId) !== null;
  }, [learnerId]);

  const submitResults = useCallback(async (): Promise<{ success: boolean; error?: string; code?: string; status?: number }> => {
    const payload = JSON.stringify({
      chapterResults: state.chapterResults,
      totalCorrect: state.totalCorrect,
      totalAttempts: state.totalAttempts,
      xpEarned: state.xpEarned,
      responseLatencies: state.responseLatencies,
    });

    const doPost = async (token: string) => {
      return fetch(`/api/assessments/learner/discovery/${learnerId}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: payload,
      });
    };

    try {
      let token = accessToken;
      if (!token && refreshToken) token = await refreshToken();
      if (!token) return { success: false, error: "No auth token", code: "no_auth_token" };

      let res = await doPost(token);

      if (res.status === 401 && refreshToken) {
        const fresh = await refreshToken();
        if (fresh) {
          res = await doPost(fresh);
        }
      }

      if (res.ok) {
        clearSavedState(learnerId);
        return { success: true };
      } else {
        const raw = await res.text();
        let code: string | undefined;
        let message: string | undefined;
        try {
          const parsed = JSON.parse(raw);
          if (parsed && typeof parsed === "object") {
            if (typeof parsed.error === "string") code = parsed.error;
            if (typeof parsed.message === "string") message = parsed.message;
            if (!code && typeof parsed.detail === "string") code = parsed.detail;
          }
        } catch {
          const trimmed = raw.trim();
          if (trimmed === "parent_assessment_required") code = trimmed;
        }
        return {
          success: false,
          error: message || raw || `HTTP ${res.status}`,
          code,
          status: res.status,
        };
      }
    } catch (e: any) {
      return { success: false, error: e?.message || "Network error", code: "network_error" };
    }
  }, [accessToken, refreshToken, learnerId, state.chapterResults, state.totalCorrect, state.totalAttempts, state.xpEarned, state.responseLatencies]);

  return {
    state,
    chapters,
    config,
    getCurrentActivity,
    getCurrentActivities,
    startAdventure,
    beginFirstChapter,
    startChapterActivities,
    handleAnswer,
    advanceToNextChapter,
    resumeAfterBreak,
    finishAdventure,
    exitToHome,
    hasSavedProgress,
    submitResults,
  };
}
