import * as React from "react";
import Link from "next/link";
import { ParentShell } from "@/components/v2/layout/parent-shell";
import { PrimaryActionCard } from "@/components/v2/shared/primary-action-card";

export default function ParentHomePage() {
  return (
    <ParentShell
      title="Welcome to AIVO"
      description="Set up a learner, complete the parent assessment, and AIVO will prepare the first personalized lesson."
    >
      <PrimaryActionCard
        surface="parent"
        title="Your learners"
        description="See the learners on your account, add a new learner, and track their progress."
        cta="View learners"
        ctaHref="/parent-v2/learners"
      />
      <nav
        aria-label="Secondary"
        className="mt-6 grid grid-cols-1 gap-3 text-sm sm:grid-cols-2"
      >
        <Link
          href="/parent-v2/settings"
          className="rounded-2xl border-2 border-slate-200 bg-white p-4 hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-violet-200"
        >
          <span className="block font-semibold text-slate-900">
            Account settings
          </span>
          <span className="mt-1 block text-slate-600">
            Update contact, notification, and consent preferences.
          </span>
        </Link>
        <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 p-4 text-slate-600">
          <span className="block font-semibold text-slate-900">
            What is a personalized lesson?
          </span>
          <span className="mt-1 block">
            A plain-language overview will be published in a later sprint.
          </span>
        </div>
      </nav>
    </ParentShell>
  );
}
