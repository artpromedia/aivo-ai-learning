"use client";
import { useCallback, useRef, useState } from "react";
import type { Beat, SessionPhase, SessionState, FunctioningLevel } from "./types";
import type { TutorKey } from "@aivo/brand";
import { SESSION_DURATIONS } from "./types";

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
  }, [maxDurationMs, derivePhase]);

  const recordAnswer = useCallback((correct: boolean, xp: number = 0, coins: number = 0) => {
    setState((s) => ({
      ...s,
      correctCount: s.correctCount + (correct ? 1 : 0),
      totalAttempts: s.totalAttempts + 1,
      xpEarned: s.xpEarned + xp,
      coinsEarned: s.coinsEarned + coins,
    }));
  }, []);

  const currentBeat = state.beats[state.currentBeatIndex] || null;
  const progress = state.totalBeats > 0 ? (state.currentBeatIndex + 1) / state.totalBeats : 0;

  const cleanup = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  return {
    state,
    currentBeat,
    progress,
    setPhase,
    loadBeats,
    nextBeat,
    recordAnswer,
    cleanup,
  };
}
