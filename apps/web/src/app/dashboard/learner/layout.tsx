"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
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
 *
 * When a parent enters this layout (e.g. running the baseline adventure on
 * behalf of a child via `?learnerId=…`), the queried learner takes priority
 * over the parent's "first learner" so the tier matches the child the
 * adventure is actually for.
 */
export default function LearnerLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<div style={{ minHeight: "100vh", background: "#FFFAEF" }} />}>
      <LearnerLayoutInner>{children}</LearnerLayoutInner>
    </Suspense>
  );
}

function LearnerLayoutInner({ children }: { children: React.ReactNode }) {
  const { user, accessToken } = useAuth();
  const searchParams = useSearchParams();
  const queriedLearnerId = searchParams.get("learnerId");
  const [gradeLevel, setGradeLevel] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    // Always reset to null on user change so a stale grade from a previous
    // session can never persist and drive the wrong tier. Null falls back
    // to EARLY in TierThemeProvider — the safest, brightest baseline.
    setGradeLevel(null);

    if (!user?.id || !accessToken) return;

    fetch("/api/users/learners", { headers: { Authorization: `Bearer ${accessToken}` } })
      .then((res) => (res.ok ? res.json() : null))
      .then((data: LearnerRecord[] | null) => {
        if (cancelled) return;
        if (!Array.isArray(data) || data.length === 0) {
          setGradeLevel(null);
          return;
        }
        // Priority: explicit ?learnerId query (parent acting on behalf of a
        // child) > the logged-in learner's own record > first available.
        const queried = queriedLearnerId
          ? data.find((l) => l.id === queriedLearnerId || l.userId === queriedLearnerId)
          : null;
        const own = data.find((l) => l.userId === user.id || l.id === user.id);
        const chosen = queried ?? own ?? data[0];
        setGradeLevel(chosen?.gradeLevel ?? null);
      })
      .catch(() => {
        if (!cancelled) setGradeLevel(null);
      });

    return () => {
      cancelled = true;
    };
  }, [user?.id, accessToken, queriedLearnerId]);

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
