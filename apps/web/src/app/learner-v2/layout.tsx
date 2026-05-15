import * as React from "react";
import type { ReactNode } from "react";

export const metadata = {
  title: "AIVO Learner",
  description: "Personalized lessons for every learner.",
};

/**
 * Segment layout for the v2 learner surface. Sprint 01 keeps this
 * intentionally bare: a passthrough so each page renders the learner
 * shell with its own title. Middleware and role gating are wired in a
 * later sprint per global rule 9 (no v2 redirects yet).
 */
export default function LearnerV2Layout({
  children,
}: {
  children: ReactNode;
}) {
  return <>{children}</>;
}
