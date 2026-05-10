export type SurfaceTelemetryEventType =
  | "surface_started"
  | "surface_submitted"
  | "ink_started"
  | "ink_completed"
  | "ink_undo"
  | "ink_clear"
  | "answer_changed"
  | "tool_changed"
  | "unsupported_surface";

export interface SurfaceTelemetryEvent {
  id: string;
  surfaceId: string;
  type: SurfaceTelemetryEventType;
  occurredAt: string;
  payload?: Record<string, unknown>;
}

let eventCounter = 0;

export function createSurfaceEvent(
  surfaceId: string,
  type: SurfaceTelemetryEventType,
  payload?: Record<string, unknown>,
): SurfaceTelemetryEvent {
  eventCounter += 1;
  return {
    id: `${surfaceId}-${type}-${eventCounter}`,
    surfaceId,
    type,
    occurredAt: new Date().toISOString(),
    payload,
  };
}
