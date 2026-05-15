import * as React from "react";
import { ParentShell } from "@/components/v2/layout/parent-shell";
import { PrimaryActionCard } from "@/components/v2/shared/primary-action-card";
import { EmptyState } from "@/components/v2/shared/empty-state";

export default function ParentLearnersPage() {
  return (
    <ParentShell
      title="Your learners"
      description="Add learners, complete their assessment, and review their progress."
    >
      <EmptyState
        title="Learner list is being prepared"
        description="When the v2 learner data layer is ready, this page will show every learner on your account with a clear next step for each one."
      />
      <div className="mt-6">
        <PrimaryActionCard
          surface="parent"
          title="Add your first learner"
          description="Onboarding moves to the v2 flow in a later sprint."
          cta="Add a learner"
          disabledReason="The v2 onboarding flow is not yet implemented."
        />
      </div>
    </ParentShell>
  );
}
