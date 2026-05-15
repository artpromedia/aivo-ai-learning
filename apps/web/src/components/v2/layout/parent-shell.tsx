import * as React from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import { AppShell } from "./app-shell";
import { AccessibilityToolbar } from "../shared/accessibility-toolbar";

/**
 * Parent-facing shell. Plain language, calm density, no admin chrome.
 * Renders a top bar with a learner switcher slot, a settings link,
 * and the page title. Body content fills the main region.
 */
export function ParentShell({
  children,
  title,
  description,
  learnerSwitcher,
}: {
  children: ReactNode;
  title: string;
  description?: string;
  learnerSwitcher?: ReactNode;
}) {
  return (
    <AppShell surface="parent">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-6 py-3">
          <Link
            href="/parent-v2/home"
            className="font-heading text-xl font-bold text-slate-900"
          >
            AIVO
          </Link>
          <div className="flex items-center gap-3">
            <div data-slot="learner-switcher">
              {learnerSwitcher ?? (
                <span className="text-sm text-slate-500">No learner selected</span>
              )}
            </div>
            <Link
              href="/parent-v2/settings"
              className="rounded-xl px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 focus:outline-none focus:ring-4 focus:ring-violet-200"
            >
              Settings
            </Link>
            <AccessibilityToolbar />
          </div>
        </div>
        <div className="mx-auto max-w-5xl px-6 pb-5">
          <h1
            id="v2-page-title"
            className="font-heading text-3xl font-bold text-slate-900"
          >
            {title}
          </h1>
          {description ? (
            <p className="mt-1 max-w-3xl text-base text-slate-600">{description}</p>
          ) : null}
        </div>
      </header>
      <main id="v2-main" className="mx-auto max-w-5xl px-6 py-6">
        {children}
      </main>
    </AppShell>
  );
}
