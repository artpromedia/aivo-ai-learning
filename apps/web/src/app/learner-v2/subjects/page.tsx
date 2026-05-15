import * as React from "react";
import { LearnerShell } from "@/components/v2/layout/learner-shell";
import { PrimaryActionCard } from "@/components/v2/shared/primary-action-card";
import { EmptyState } from "@/components/v2/shared/empty-state";

export default function LearnerSubjectsPage() {
  return (
    <LearnerShell title="Subjects" backHref="/learner-v2/home" backLabel="Home">
      <p className="mb-6 text-base text-slate-700">
        Your subjects will appear here once your learner profile is linked
        and your baseline assessment is complete.
      </p>
      <EmptyState
        title="Subject list is being prepared"
        description="AIVO uses your grade band, assessment, and brain profile to choose subjects. It is not ready yet."
      />
      <div className="mt-6">
        <PrimaryActionCard
          surface="learner"
          title="Take me to Today&apos;s Mission"
          description="Today's Mission picks one subject for you each day."
          cta="Go to Today&apos;s Mission"
          ctaHref="/learner-v2/home"
        />
      </div>
    </LearnerShell>
  );
}
