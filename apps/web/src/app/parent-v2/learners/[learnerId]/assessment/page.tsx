import * as React from "react";
import { ParentShell } from "@/components/v2/layout/parent-shell";
import { EmptyState } from "@/components/v2/shared/empty-state";
import { PrimaryActionCard } from "@/components/v2/shared/primary-action-card";

export default async function ParentLearnerAssessmentPage({
  params,
}: {
  params: Promise<{ learnerId: string }>;
}) {
  await params;
  return (
    <ParentShell
      title="Assessment"
      description="The parent-led assessment is what AIVO uses to prepare the first personalized lesson."
    >
      <EmptyState
        title="Assessment flow is being prepared"
        description="When the v2 assessment flow is ready, this page will guide you through a short set of questions about the learner."
      />
      <div className="mt-6">
        <PrimaryActionCard
          surface="parent"
          title="Start the assessment"
          description="A guided assessment will be available in a later sprint."
          cta="Start assessment"
          disabledReason="The v2 assessment flow is not yet implemented."
        />
      </div>
    </ParentShell>
  );
}
