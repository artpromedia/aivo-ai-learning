"use client";

import { useMemo } from "react";
import type { SurfaceProtocolProfile, TutorSurfaceCommand } from "@aivo/tutor-surface-protocol";
import {
  normalizeTutorSurfaceCommands,
  type NormalizedTutorCommand,
} from "./tutor-surface-command-normalizer.js";

export interface TutorSurfaceCommandRendererProps {
  commands: TutorSurfaceCommand[];
  profile?: SurfaceProtocolProfile;
  /**
   * Called with the normalized list of renderable commands. The host renders
   * each via `SurfaceHost` from `@aivo/learner-surfaces`. The component does
   * not own SurfaceHost lifecycle so existing stage hooks can wire snapshots
   * into the problem-session ledger.
   */
  onCommands: (commands: NormalizedTutorCommand[]) => void;
  /**
   * Telemetry hook for rejected commands. Implementations MUST NOT include
   * raw payload, sensitive learner data, or free-form tutor text.
   */
  onRejected?: (
    rejected: Array<{ commandId?: string; surfaceId?: string; codes: string[] }>,
  ) => void;
}

export function TutorSurfaceCommandRenderer({
  commands,
  profile,
  onCommands,
  onRejected,
}: TutorSurfaceCommandRendererProps): null {
  const { normalized, rejected } = useMemo(
    () => normalizeTutorSurfaceCommands(commands, profile),
    [commands, profile],
  );

  useMemo(() => {
    onCommands(normalized);
    if (rejected.length > 0 && onRejected) {
      onRejected(
        rejected.map((entry) => ({
          commandId: entry.commandId,
          surfaceId: entry.surfaceId,
          codes: entry.issues.map((issue) => issue.code),
        })),
      );
    }
  }, [normalized, rejected, onCommands, onRejected]);

  return null;
}
