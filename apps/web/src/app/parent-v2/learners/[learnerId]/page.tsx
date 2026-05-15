import * as React from "react";
import { ParentShell } from "@/components/v2/layout/parent-shell";
import { EmptyState } from "@/components/v2/shared/empty-state";
import { PrimaryActionCard } from "@/components/v2/shared/primary-action-card";

export default async function ParentLearnerDetailPage({
  params,
}: {
  params: Promise<{ learnerId: string }>;
}) {
  await params;
  return (
    <ParentShell
      title="Learner overview"
      description="A plain-language summary of how this learner is doing and what to do next."
    >
      <EmptyState
        title="Overview is being prepared"
        description="When the v2 learner data layer is ready, this page will show baseline status, IEP/accommodations status, recent lessons, and the next step for this learner."
      />
      <div className="mt-6">
        <PrimaryActionCard
          surface="parent"
          title="Open the assessment"
          description="Start the assessment so AIVO can prepare a personalized lesson."
          cta="Open assessment"
          disabledReason="The v2 assessment flow is not yet implemented."
        />
      </div>
    </ParentShell>
  );
}
