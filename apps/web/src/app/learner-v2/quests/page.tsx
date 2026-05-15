import * as React from "react";
import { LearnerShell } from "@/components/v2/layout/learner-shell";
import { EmptyState } from "@/components/v2/shared/empty-state";
import { PrimaryActionCard } from "@/components/v2/shared/primary-action-card";

export default function LearnerQuestsPage() {
  return (
    <LearnerShell
      title="Quest worlds"
      backHref="/learner-v2/home"
      backLabel="Home"
    >
      <p className="mb-6 text-base text-slate-700">
        Quest worlds turn personalized lessons into longer adventures.
      </p>
      <EmptyState
        title="Quest worlds are being prepared"
        description="Quest worlds will appear once the lesson engine and the personalized adventure flow are ready."
      />
      <div className="mt-6">
        <PrimaryActionCard
          surface="learner"
          title="Today&apos;s Mission first"
          description="Start with Today's Mission. Quest worlds unlock as your mastery grows."
          cta="Go to Today&apos;s Mission"
          ctaHref="/learner-v2/home"
        />
      </div>
    </LearnerShell>
  );
}
