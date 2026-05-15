import * as React from "react";
import { LearnerShell } from "@/components/v2/layout/learner-shell";
import { EmptyState } from "@/components/v2/shared/empty-state";
import { PrimaryActionCard } from "@/components/v2/shared/primary-action-card";

export default async function LearnerQuestWorldPage({
  params,
}: {
  params: Promise<{ worldId: string }>;
}) {
  await params;
  return (
    <LearnerShell
      title="Quest world"
      backHref="/learner-v2/quests"
      backLabel="Quests"
    >
      <p className="mb-6 text-base text-slate-700">
        Chapters in this world will appear here.
      </p>
      <EmptyState
        title="Chapters are being prepared"
        description="When the adventure flow is ready, chapters from this world will appear here."
      />
      <div className="mt-6">
        <PrimaryActionCard
          surface="learner"
          title="Back to Today&apos;s Mission"
          cta="Go to Today&apos;s Mission"
          ctaHref="/learner-v2/home"
        />
      </div>
    </LearnerShell>
  );
}
