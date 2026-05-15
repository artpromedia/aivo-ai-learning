import * as React from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import { AppShell } from "./app-shell";
import { AccessibilityToolbar } from "../shared/accessibility-toolbar";

/**
 * Learner-facing shell. Optimized for a child sitting in front of a
 * tablet or laptop: large hit targets, one back/home control, one
 * accessibility toolbar slot, no dashboard chrome. The shell renders
 * its own header so each page only has to supply its content.
 */
export function LearnerShell({
  children,
  title,
  backHref,
  backLabel = "Back",
}: {
  children: ReactNode;
  title: string;
  backHref?: string;
  backLabel?: string;
}) {
  return (
    <AppShell surface="learner">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-4 py-3">
          <div className="flex items-center gap-2">
            {backHref ? (
              <Link
                href={backHref}
                aria-label={backLabel}
                className="inline-flex h-11 min-w-11 items-center justify-center rounded-2xl border-2 border-slate-200 px-3 text-base font-semibold text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-violet-200"
              >
                <span aria-hidden>&larr;</span>
                <span className="ml-1">{backLabel}</span>
              </Link>
            ) : null}
            <Link
              href="/learner-v2/home"
              aria-label="Learner home"
              className="inline-flex h-11 min-w-11 items-center justify-center rounded-2xl bg-violet-600 px-4 text-base font-bold text-white hover:bg-violet-700 focus:outline-none focus:ring-4 focus:ring-violet-200"
            >
              Home
            </Link>
          </div>
          <AccessibilityToolbar />
        </div>
        <h1
          id="v2-page-title"
          className="mx-auto max-w-3xl px-4 pb-4 pt-1 font-heading text-3xl font-bold text-slate-900"
        >
          {title}
        </h1>
      </header>
      <main id="v2-main" className="mx-auto max-w-3xl px-4 py-6">
        {children}
      </main>
    </AppShell>
  );
}
