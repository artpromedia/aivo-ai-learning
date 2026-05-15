import * as React from "react";
import { ParentShell } from "@/components/v2/layout/parent-shell";
import { EmptyState } from "@/components/v2/shared/empty-state";
import { PrimaryActionCard } from "@/components/v2/shared/primary-action-card";

export default async function ParentLearnerProgressPage({
  params,
}: {
  params: Promise<{ learnerId: string }>;
}) {
  await params;
  return (
    <ParentShell
      title="Progress"
      description="A plain-language summary of what the learner has worked on and what is next."
    >
      <EmptyState
        title="Progress summary is being prepared"
        description="When the lesson engine and mastery tracking are ready, this page will summarize recent lessons in plain language."
      />
      <div className="mt-6">
        <PrimaryActionCard
          surface="parent"
          title="Back to overview"
          cta="Open learner overview"
          ctaHref="/parent-v2/learners"
        />
      </div>
    </ParentShell>
  );
}
