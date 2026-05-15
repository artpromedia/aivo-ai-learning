"use client";

import * as React from "react";
import { useEffect, useState } from "react";

/**
 * Always-visible accessibility toolbar slot for v2 surfaces. Sprint 01
 * scope: render the two controls (text size, reduce motion) that every
 * learner page must expose, persist preferences in localStorage, and
 * write them onto `document.documentElement` so downstream components
 * can read them via CSS variables. Hooking these preferences into the
 * lesson player is a later sprint.
 */
const STORAGE_KEY = "aivo:v2:a11y-prefs";

type TextSize = "default" | "large";
type Motion = "default" | "reduced";

interface Prefs {
  textSize: TextSize;
  motion: Motion;
}

const DEFAULT_PREFS: Prefs = { textSize: "default", motion: "default" };

function loadPrefs(): Prefs {
  if (typeof window === "undefined") return DEFAULT_PREFS;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_PREFS;
    const parsed = JSON.parse(raw) as Partial<Prefs>;
    return {
      textSize: parsed.textSize === "large" ? "large" : "default",
      motion: parsed.motion === "reduced" ? "reduced" : "default",
    };
  } catch {
    return DEFAULT_PREFS;
  }
}

function applyPrefs(prefs: Prefs): void {
  if (typeof document === "undefined") return;
  document.documentElement.dataset.v2TextSize = prefs.textSize;
  document.documentElement.dataset.v2Motion = prefs.motion;
}

export function AccessibilityToolbar() {
  const [prefs, setPrefs] = useState<Prefs>(DEFAULT_PREFS);

  useEffect(() => {
    const initial = loadPrefs();
    setPrefs(initial);
    applyPrefs(initial);
  }, []);

  function update(next: Prefs) {
    setPrefs(next);
    applyPrefs(next);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    }
  }

  return (
    <div
      role="group"
      aria-label="Accessibility preferences"
      className="flex items-center gap-2"
    >
      <button
        type="button"
        aria-pressed={prefs.textSize === "large"}
        onClick={() =>
          update({
            ...prefs,
            textSize: prefs.textSize === "large" ? "default" : "large",
          })
        }
        className="inline-flex h-11 min-w-11 items-center justify-center rounded-2xl border-2 border-slate-200 px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-violet-200 aria-pressed:bg-violet-100 aria-pressed:border-violet-400"
      >
        {prefs.textSize === "large" ? "A-" : "A+"}
        <span className="sr-only">
          {prefs.textSize === "large"
            ? "Switch to default text size"
            : "Switch to large text size"}
        </span>
      </button>
      <button
        type="button"
        aria-pressed={prefs.motion === "reduced"}
        onClick={() =>
          update({
            ...prefs,
            motion: prefs.motion === "reduced" ? "default" : "reduced",
          })
        }
        className="inline-flex h-11 min-w-11 items-center justify-center rounded-2xl border-2 border-slate-200 px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-violet-200 aria-pressed:bg-violet-100 aria-pressed:border-violet-400"
      >
        {prefs.motion === "reduced" ? "Motion on" : "Reduce motion"}
      </button>
    </div>
  );
}
