import * as React from "react";
import type { ReactNode } from "react";

export const metadata = {
  title: "AIVO Parent",
  description: "Set up learners, review progress, and prepare lessons.",
};

/**
 * Segment layout for the v2 parent surface. Sprint 01 keeps this as a
 * passthrough. Middleware and role gating come in a later sprint.
 */
export default function ParentV2Layout({
  children,
}: {
  children: ReactNode;
}) {
  return <>{children}</>;
}
