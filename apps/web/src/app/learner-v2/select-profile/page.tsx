import * as React from "react";
import { LearnerShell } from "@/components/v2/layout/learner-shell";
import { PrimaryActionCard } from "@/components/v2/shared/primary-action-card";
import { EmptyState } from "@/components/v2/shared/empty-state";

export default function LearnerSelectProfilePage() {
  return (
    <LearnerShell title="Choose your profile">
      <p className="mb-6 text-base text-slate-700">
        Pick the learner profile you want to use today.
      </p>
      <EmptyState
        title="Profile selector is being prepared"
        description="Your parent or teacher will help you link a profile. Once linked, your profiles will appear here."
      />
      <div className="mt-6">
        <PrimaryActionCard
          surface="learner"
          title="Ready when your profile is linked"
          description="When a profile is connected, this button will take you to Today's Mission."
          cta="Open my profile"
          disabledReason="Available once a learner profile is linked to this account."
        />
      </div>
    </LearnerShell>
  );
}
