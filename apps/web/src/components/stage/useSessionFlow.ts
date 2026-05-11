"use client";
import { useCallback, useRef, useState } from "react";
import type {
  SurfaceResponse,
  SurfaceTelemetryEvent,
} from "@aivo/learner-surfaces";
import type { Beat, SessionPhase, SessionState, FunctioningLevel } from "./types";
import type { TutorKey } from "@aivo/brand";
import { SESSION_DURATIONS } from "./types";

export interface SessionProcessSignals {
  surfaceEvents: SurfaceTelemetryEvent[];
  surfaceResponses: SurfaceResponse[];
  beatsCompleted: number;
  attemptedAnswers: number;
  correctAnswers: number;
  scratchpadUseCount: number;
  hintUsageCount: number;
  erasuresCount: number;
}

const INITIAL_PROCESS_SIGNALS: SessionProcessSignals = {
  surfaceEvents: [],
  surfaceResponses: [],
  beatsCompleted: 0,
  attemptedAnswers: 0,
  correctAnswers: 0,
  scratchpadUseCount: 0,
  hintUsageCount: 0,
  erasuresCount: 0,
};

const INITIAL_STATE: SessionState = {
  phase: "loading",
  currentBeatIndex: 0,
  beats: [],
  totalBeats: 0,
  xpEarned: 0,
  coinsEarned: 0,
  correctCount: 0,
  totalAttempts: 0,
  startedAt: Date.now(),
  tutorKey: "nova" as TutorKey,
  learnerId: "",
  functioningLevel: "STANDARD",
};

export function useSessionFlow(tutorKey: TutorKey, learnerId: string, functioningLevel: FunctioningLevel) {
  const [state, setState] = useState<SessionState>({
    ...INITIAL_STATE,
    tutorKey,
    learnerId,
    functioningLevel,
    startedAt: Date.now(),
  });
  const [processSignals, setProcessSignals] = useState<SessionProcessSignals>(INITIAL_PROCESS_SIGNALS);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const maxDurationMs = SESSION_DURATIONS[functioningLevel].max * 60 * 1000;

  const setPhase = useCallback((phase: SessionPhase) => {
    setState((s) => ({ ...s, phase }));
  }, []);

  const loadBeats = useCallback((beats: Beat[], sessionId?: string, learnerName?: string) => {
    setState((s) => ({
      ...s,
      beats,
      totalBeats: beats.length,
      currentBeatIndex: 0,
      sessionId,
      learnerName,
      phase: "opening",
      startedAt: Date.now(),
    }));
    setProcessSignals(INITIAL_PROCESS_SIGNALS);
  }, []);

  const derivePhase = useCallback((beatIndex: number, beats: Beat[]): SessionPhase => {
    if (beats.length === 0) return "loading";
    const beat = beats[beatIndex];
    if (!beat) return "celebration";
    if (beatIndex === 0) return "opening";
    if (beat.id.startsWith("warmup") || beat.id === "warmup") return "warmup";
    if (beat.id.startsWith("check") || beat.id === "check") return "check";
    if (beat.id.startsWith("close") || beat.type === "celebration") return "celebration";
    return "core";
  }, []);

  const nextBeat = useCallback(() => {
    setState((s) => {
      const next = s.currentBeatIndex + 1;
      if (next >= s.beats.length) {
        return { ...s, phase: "celebration" };
      }
      const elapsed = Date.now() - s.startedAt;
      if (elapsed > maxDurationMs) {
        return { ...s, phase: "celebration" };
      }
      const phase = derivePhase(next, s.beats);
      return { ...s, currentBeatIndex: next, phase };
    });
    setProcessSignals((p) => ({ ...p, beatsCompleted: p.beatsCompleted + 1 }));
  }, [maxDurationMs, derivePhase]);

  const recordAnswer = useCallback(
    (correct: boolean, xp: number = 0, coins: number = 0, payload?: Record<string, unknown>) => {
      setState((s) => ({
        ...s,
        correctCount: s.correctCount + (correct ? 1 : 0),
        totalAttempts: s.totalAttempts + 1,
        xpEarned: s.xpEarned + xp,
        coinsEarned: s.coinsEarned + coins,
      }));
      setProcessSignals((p) => ({
        ...p,
        attemptedAnswers: p.attemptedAnswers + 1,
        correctAnswers: p.correctAnswers + (correct ? 1 : 0),
        erasuresCount: p.erasuresCount + Number(payload?.erasureCount ?? 0),
        scratchpadUseCount: p.scratchpadUseCount + (Number(payload?.inkStrokeCount ?? 0) > 0 ? 1 : 0),
      }));
    },
    [],
  );

  const recordSurfaceEvent = useCallback((event: SurfaceTelemetryEvent) => {
    setProcessSignals((p) => {
      const hintBumped = event.type === "tool_changed" && event.payload?.tool === "hint" ? 1 : 0;
      return {
        ...p,
        surfaceEvents: [...p.surfaceEvents, event],
        hintUsageCount: p.hintUsageCount + hintBumped,
      };
    });
  }, []);

  const recordSurfaceResponse = useCallback((response: SurfaceResponse) => {
    setProcessSignals((p) => ({
      ...p,
      surfaceResponses: [...p.surfaceResponses, response],
    }));
  }, []);

  const currentBeat = state.beats[state.currentBeatIndex] || null;
  const progress = state.totalBeats > 0 ? (state.currentBeatIndex + 1) / state.totalBeats : 0;

  const cleanup = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  return {
    state,
    processSignals,
    currentBeat,
    progress,
    setPhase,
    loadBeats,
    nextBeat,
    recordAnswer,
    recordSurfaceEvent,
    recordSurfaceResponse,
    cleanup,
  };
}
