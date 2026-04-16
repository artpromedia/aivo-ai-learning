"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { BREAK_OPTIONS, type BreakType, type BreakOption, type FunctioningLevel } from "./types";

interface BreakActivityProps {
  chapterNumber: number;
  onBreakComplete: () => void;
  functioningLevel?: FunctioningLevel;
  parentMinDurationSec?: number;
}

const EXERCISES = [
  { name: "Reach for the Sky!", emoji: "🙆", instruction: "Stretch your arms up high!" },
  { name: "Touch Your Toes!", emoji: "🙇", instruction: "Bend down and try to touch your toes!" },
  { name: "Wiggle Dance!", emoji: "💃", instruction: "Shake your whole body!" },
  { name: "Big Deep Breath!", emoji: "🌬️", instruction: "Breathe in slowly... and out..." },
  { name: "Shoulder Rolls!", emoji: "🤷", instruction: "Roll your shoulders in big circles!" },
  { name: "Jumping Stars!", emoji: "⭐", instruction: "Jump and spread your arms like a star!" },
];

const MUSIC_VISUALS = [
  { emoji: "🎵", color: "#8B5CF6" },
  { emoji: "🎶", color: "#06B6D4" },
  { emoji: "🎹", color: "#EC4899" },
  { emoji: "🎸", color: "#F59E0B" },
  { emoji: "🥁", color: "#10B981" },
  { emoji: "🎺", color: "#EF4444" },
];

const WORD_GAME_WORDS = [
  { scrambled: "PPLAE", answer: "APPLE", hint: "A red fruit" },
  { scrambled: "ASTR", answer: "STAR", hint: "It shines at night" },
  { scrambled: "OBOK", answer: "BOOK", hint: "You read it" },
  { scrambled: "RTEE", answer: "TREE", hint: "It grows in the ground" },
  { scrambled: "IFHS", answer: "FISH", hint: "It lives in water" },
  { scrambled: "ATBO", answer: "BOAT", hint: "It floats on water" },
  { scrambled: "OMNO", answer: "MOON", hint: "You see it at night" },
];

export default function BreakActivity({ chapterNumber, onBreakComplete, functioningLevel = "STANDARD", parentMinDurationSec = 0 }: BreakActivityProps) {
  const [selectedBreak, setSelectedBreak] = useState<BreakType | null>(null);
  const [show, setShow] = useState(false);
  const [exerciseIdx, setExerciseIdx] = useState(0);
  const [wordIdx, setWordIdx] = useState(0);
  const [guess, setGuess] = useState("");
  const [wordSolved, setWordSolved] = useState(false);
  const [musicNoteIdx, setMusicNoteIdx] = useState(0);
  const [elapsedSec, setElapsedSec] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const isTextFree = functioningLevel === "NON_VERBAL" || functioningLevel === "PRE_SYMBOLIC";
  const minDurationMet = elapsedSec >= parentMinDurationSec;

  useEffect(() => {
    const t = setTimeout(() => setShow(true), 200);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    setWordIdx(Math.floor(Math.random() * WORD_GAME_WORDS.length));
    setExerciseIdx(Math.floor(Math.random() * EXERCISES.length));
  }, []);

  const startBreak = useCallback((option: BreakOption) => {
    setSelectedBreak(option.type);
    setElapsedSec(0);
  }, []);

  useEffect(() => {
    if (!selectedBreak) return;
    timerRef.current = setInterval(() => {
      setElapsedSec(t => t + 1);
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [selectedBreak]);

  useEffect(() => {
    if (!selectedBreak || selectedBreak !== "exercise") return;
    const interval = setInterval(() => {
      setExerciseIdx(i => (i + 1) % EXERCISES.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [selectedBreak]);

  useEffect(() => {
    if (!selectedBreak || selectedBreak !== "music") return;
    const interval = setInterval(() => {
      setMusicNoteIdx(i => (i + 1) % MUSIC_VISUALS.length);
    }, 800);
    return () => clearInterval(interval);
  }, [selectedBreak]);

  const breakOptions = isTextFree
    ? BREAK_OPTIONS.filter(o => o.type !== "word_game")
    : BREAK_OPTIONS;

  if (!selectedBreak) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-indigo-950 via-purple-900 to-slate-950 flex items-center justify-center px-4">
        <div className={`max-w-md w-full text-center transition-all duration-700 ${show ? "opacity-100 scale-100" : "opacity-0 scale-90"}`}>
          <div className="text-5xl mb-4">🎉</div>
          {!isTextFree && (
            <>
              <h2 className="text-2xl font-heading font-bold text-white mb-2">
                Great job on Chapter {chapterNumber}!
              </h2>
              <p className="text-white/60 font-body mb-8">
                Time for a break. Pick what feels good — take as long as you need!
              </p>
            </>
          )}
          {isTextFree && (
            <div className="mb-8" />
          )}

          <div className="space-y-3">
            {breakOptions.map((option) => (
              <button
                key={option.type}
                onClick={() => startBreak(option)}
                className="w-full flex items-center gap-4 bg-white/10 backdrop-blur border border-white/20 rounded-2xl p-4 hover:bg-white/20 hover:scale-[1.02] active:scale-[0.98] transition-all text-left group"
                style={{ minHeight: "72px" }}
                aria-label={option.label}
              >
                <div className="text-4xl group-hover:scale-110 transition-transform">
                  {option.emoji}
                </div>
                {!isTextFree && (
                  <div className="flex-1">
                    <p className="font-heading font-bold text-white text-lg">{option.label}</p>
                    <p className="text-white/50 text-sm font-body">{option.description}</p>
                  </div>
                )}
              </button>
            ))}
          </div>

          {parentMinDurationSec <= 0 && (
            <button
              onClick={onBreakComplete}
              className="mt-6 text-white/40 hover:text-white/60 text-sm font-body transition"
              style={{ minHeight: "48px" }}
            >
              {isTextFree ? "➡️" : "Skip break"}
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-indigo-950 via-purple-900 to-slate-950 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        {selectedBreak === "music" && (
          <div className="space-y-6">
            <div className="text-6xl mb-4 animate-pulse">🎵</div>
            {!isTextFree && (
              <>
                <h2 className="text-2xl font-heading font-bold text-white mb-2">Relax & Listen</h2>
                <p className="text-white/60 font-body mb-6">Close your eyes and enjoy the moment...</p>
              </>
            )}
            <div className="flex justify-center gap-4 h-32 items-end">
              {MUSIC_VISUALS.map((note, i) => (
                <div
                  key={i}
                  className="w-8 rounded-t-full transition-all duration-500"
                  style={{
                    backgroundColor: note.color,
                    height: `${20 + Math.sin((musicNoteIdx + i) * 1.2) * 40 + 40}%`,
                    opacity: i === musicNoteIdx % MUSIC_VISUALS.length ? 1 : 0.4,
                  }}
                />
              ))}
            </div>
            <div className="flex justify-center gap-3 mt-4 flex-wrap">
              {MUSIC_VISUALS.map((note, i) => (
                <span
                  key={i}
                  className="text-3xl transition-all duration-300"
                  style={{
                    transform: i === musicNoteIdx % MUSIC_VISUALS.length ? "scale(1.5) translateY(-8px)" : "scale(1)",
                    opacity: i === musicNoteIdx % MUSIC_VISUALS.length ? 1 : 0.3,
                  }}
                >
                  {note.emoji}
                </span>
              ))}
            </div>
          </div>
        )}

        {selectedBreak === "word_game" && (
          <div className="space-y-6">
            <div className="text-6xl mb-4">🔤</div>
            <h2 className="text-2xl font-heading font-bold text-white mb-2">Word Scramble!</h2>
            <p className="text-white/60 font-body mb-2">Unscramble the letters to find the word</p>
            <div className="bg-white/10 backdrop-blur rounded-2xl p-6 border border-white/20">
              <div className="flex justify-center gap-2 mb-4">
                {WORD_GAME_WORDS[wordIdx].scrambled.split("").map((letter, i) => (
                  <div
                    key={i}
                    className="w-12 h-12 rounded-xl bg-amber-400 flex items-center justify-center text-xl font-heading font-bold text-slate-900 shadow-lg"
                  >
                    {letter}
                  </div>
                ))}
              </div>
              <p className="text-white/40 text-sm mb-4">Hint: {WORD_GAME_WORDS[wordIdx].hint}</p>
              {wordSolved ? (
                <div className="text-emerald-400 font-heading font-bold text-lg">
                  Correct! Great job! 🎉
                </div>
              ) : (
                <div className="flex gap-2 justify-center">
                  <input
                    type="text"
                    value={guess}
                    onChange={(e) => {
                      const val = e.target.value.toUpperCase();
                      setGuess(val);
                      const scrambled = WORD_GAME_WORDS[wordIdx].scrambled;
                      const sorted = (s: string) => s.split("").sort().join("");
                      if (val.length === scrambled.length && sorted(val) === sorted(scrambled)) {
                        setWordSolved(true);
                      }
                    }}
                    placeholder="Type your answer..."
                    className="px-4 py-2 rounded-xl bg-white/20 text-white placeholder-white/30 font-heading font-bold text-center focus:outline-none focus:ring-2 focus:ring-amber-400 w-40"
                    maxLength={WORD_GAME_WORDS[wordIdx].scrambled.length}
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {selectedBreak === "exercise" && (
          <div className="space-y-6">
            <div className="text-7xl mb-4 transition-all duration-500" key={exerciseIdx}>
              {EXERCISES[exerciseIdx].emoji}
            </div>
            {!isTextFree && (
              <>
                <h2 className="text-2xl font-heading font-bold text-white mb-2">
                  {EXERCISES[exerciseIdx].name}
                </h2>
                <p className="text-white/70 font-body text-lg mb-4">
                  {EXERCISES[exerciseIdx].instruction}
                </p>
              </>
            )}
            <div className="flex justify-center gap-2">
              {EXERCISES.map((_, i) => (
                <div
                  key={i}
                  className={`w-3 h-3 rounded-full transition-all ${
                    i === exerciseIdx ? "bg-amber-400 scale-125" : "bg-white/20"
                  }`}
                />
              ))}
            </div>
          </div>
        )}

        <div className="mt-8">
          <button
            onClick={onBreakComplete}
            disabled={!minDurationMet}
            className={`px-8 py-4 rounded-full text-white font-heading font-bold text-lg shadow-xl transition-all ${
              minDurationMet
                ? "bg-gradient-to-r from-amber-400 to-orange-500 hover:scale-105 active:scale-95"
                : "bg-white/10 cursor-not-allowed opacity-50"
            }`}
            style={{ minHeight: "56px" }}
            aria-label="I'm ready to go back"
          >
            {isTextFree ? "✅ ➡️" : "I'm ready to go back"}
          </button>
          {!minDurationMet && !isTextFree && (
            <p className="text-white/30 text-xs mt-2 font-body">
              Take your time — {parentMinDurationSec - elapsedSec}s before you can continue
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
