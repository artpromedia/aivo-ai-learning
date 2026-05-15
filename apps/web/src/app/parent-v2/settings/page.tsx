import * as React from "react";
import { ParentShell } from "@/components/v2/layout/parent-shell";
import { EmptyState } from "@/components/v2/shared/empty-state";
import { PrimaryActionCard } from "@/components/v2/shared/primary-action-card";

export default function ParentSettingsPage() {
  return (
    <ParentShell
      title="Settings"
      description="Account, notification, and consent preferences."
    >
      <EmptyState
        title="Settings are being prepared"
        description="The v2 settings flow will move the existing parent settings into a calmer layout. Until then, use the legacy parent settings."
      />
      <div className="mt-6">
        <PrimaryActionCard
          surface="parent"
          title="Use the existing settings"
          description="The v2 settings page is shell-only. The legacy settings page is still available."
          cta="Open legacy settings"
          ctaHref="/dashboard/parent/settings"
        />
      </div>
    </ParentShell>
  );
}
