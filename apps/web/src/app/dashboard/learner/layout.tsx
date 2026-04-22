"use client";

import { useEffect, useState } from "react";
import { TierThemeProvider } from "@aivo/learner-ui";
import { useAuth } from "@/providers/auth-provider";

interface LearnerRecord {
  id: string;
  userId?: string;
  gradeLevel?: string;
}

/**
 * Wraps every page under `/dashboard/learner/...` with the active learner's
 * age-tier theme. The tier (EARLY / MIDDLE / HIGH) is *derived* from the
 * learner's `gradeLevel` on each render — promoting a learner from 5th to
 * 6th grade automatically swaps the K-5 "Soft Meadow" palette for the 6-8
 * "Study Treehouse", with no separate trigger required.
 *
 * The provider writes `--tier-*` CSS variables to `document.documentElement`
 * and exposes the same theme via the `useTierTheme()` hook for components
 * that want conditional logic (e.g. mascot vs. no-mascot hero).
 */
export default function LearnerLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [gradeLevel, setGradeLevel] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    // Always reset to null on user change so a stale grade from a previous
    // session can never persist and drive the wrong tier. Null falls back
    // to EARLY in TierThemeProvider — the safest, brightest baseline.
    setGradeLevel(null);

    if (!user?.id) return;

    fetch("/api/users/learners", { credentials: "include" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data: LearnerRecord[] | null) => {
        if (cancelled) return;
        if (!Array.isArray(data) || data.length === 0) {
          setGradeLevel(null);
          return;
        }
        // If the logged-in user is a LEARNER, prefer their own record;
        // otherwise (PARENT/TEACHER viewing a child), fall back to the
        // first available learner.
        const own = data.find((l) => l.userId === user.id || l.id === user.id);
        const chosen = own ?? data[0];
        setGradeLevel(chosen?.gradeLevel ?? null);
      })
      .catch(() => {
        if (!cancelled) setGradeLevel(null);
      });

    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  return (
    <TierThemeProvider gradeLevel={gradeLevel}>
      <div
        style={{
          minHeight: "100vh",
          background: "var(--tier-bg, #FFFAEF)",
          color: "var(--tier-text, #292F3D)",
          fontFamily: "var(--tier-font-body, 'Nunito', system-ui, sans-serif)",
          transition: "background-color 400ms ease, color 400ms ease",
        }}
      >
        {children}
      </div>
    </TierThemeProvider>
  );
}
