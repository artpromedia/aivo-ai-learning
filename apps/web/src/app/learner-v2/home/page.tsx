import * as React from "react";
import { LearnerShell } from "@/components/v2/layout/learner-shell";
import { PrimaryActionCard } from "@/components/v2/shared/primary-action-card";

export default function LearnerHomePage() {
  return (
    <LearnerShell title="Hi there">
      <p className="mb-6 text-lg text-slate-700">
        AIVO is preparing your personalized learning path.
      </p>
      <PrimaryActionCard
        surface="learner"
        title="Today&apos;s Mission"
        description="Today's Mission will appear here once your learner profile, assessment, and lesson engine are ready."
        cta="Select learner profile"
        ctaHref="/learner-v2/select-profile"
        helperText="The mission card will become a personalized lesson in a later sprint."
      />
    </LearnerShell>
  );
}
