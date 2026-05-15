import * as React from "react";
import type { ReactNode } from "react";

/**
 * AIVO v2 outer shell. Wraps the learner and parent shells with the
 * shared page chrome that the v2 product principles require: semantic
 * landmarks, a skip link, and a neutral background that yields to the
 * surface-specific shell underneath.
 */
export function AppShell({
  children,
  surface,
}: {
  children: ReactNode;
  surface: "learner" | "parent";
}) {
  return (
    <div
      data-surface={surface}
      className="min-h-screen bg-white text-slate-800 font-body antialiased"
    >
      <a
        href="#v2-main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-xl focus:bg-slate-900 focus:px-4 focus:py-2 focus:text-white"
      >
        Skip to main content
      </a>
      {children}
    </div>
  );
}
