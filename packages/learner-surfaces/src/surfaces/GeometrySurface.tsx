import { useMemo, useState } from "react";
import { describeSurface } from "../a11y/describeSurface.js";
import { renderGeometrySvg } from "../geometry/renderGeometrySvg.js";
import { InkCanvas } from "../ink/InkCanvas.js";
import type { InkStroke } from "../ink/stroke-model.js";
import { createSurfaceEvent, type SurfaceTelemetryEvent } from "../telemetry/surface-events.js";
import type { LearnerSurfaceSpec, SurfaceResponse } from "../types.js";

export interface GeometrySurfaceProps {
  surface: LearnerSurfaceSpec;
  disabled?: boolean;
  onSubmit?: (response: SurfaceResponse) => void;
  onEvent?: (event: SurfaceTelemetryEvent) => void;
}

export function GeometrySurface({ surface, disabled = false, onSubmit, onEvent }: GeometrySurfaceProps) {
  const [answer, setAnswer] = useState("");
  const [strokes, setStrokes] = useState<InkStroke[]>([]);
  const [tool, setTool] = useState<"pencil" | "highlighter" | "eraser">("pencil");

  const diagram = surface.diagram;
  const showScratchpad = surface.scratchpad?.enabled ?? false;
  const requiresAnswer = surface.capture.finalAnswer && surface.answerInput?.type !== "none";
  const answerMissing = requiresAnswer && answer.trim().length === 0;
  const submitDisabled = disabled || answerMissing;

  const diagramDescription = useMemo(() => describeSurface(surface), [surface]);

  return (
    <section aria-label="geometry-surface">
      <p>{surface.prompt}</p>
      {surface.instructions ? <p>{surface.instructions}</p> : null}
      <p style={{ position: "absolute", left: -9999 }} aria-live="polite">
        {diagramDescription}
      </p>
      <div
        style={{
          display: "grid",
          gap: 12,
          alignItems: "start",
          gridTemplateColumns: showScratchpad ? "repeat(auto-fit, minmax(280px, 1fr))" : "1fr",
        }}
      >
        {diagram ? renderGeometrySvg({ diagram, accessibility: surface.accessibility }) : null}
        {showScratchpad ? (
          <InkCanvas
            surfaceId={surface.id}
            width={surface.scratchpad?.width ?? diagram?.width ?? 480}
            height={surface.scratchpad?.height ?? diagram?.height ?? 320}
            disabled={disabled}
            tool={tool}
            showToolbar
            onToolChange={(nextTool) => {
              setTool(nextTool);
              onEvent?.(createSurfaceEvent(surface.id, "tool_changed", { tool: nextTool }));
            }}
            onChange={setStrokes}
            onEvent={onEvent}
          />
        ) : null}
      </div>
      {surface.answerInput && surface.answerInput.type !== "none" ? (
        <label>
          {surface.answerInput.label ?? "Final answer"}
          <input
            aria-label={surface.answerInput.label ?? "Final answer"}
            type={surface.answerInput.type === "number" ? "number" : "text"}
            value={answer}
            placeholder={surface.answerInput.placeholder}
            disabled={disabled}
            onChange={(event) => {
              const nextAnswer = event.currentTarget.value;
              setAnswer(nextAnswer);
              onEvent?.(createSurfaceEvent(surface.id, "answer_changed", { answer: nextAnswer }));
            }}
          />
        </label>
      ) : null}
      <button
        type="button"
        aria-label="submit geometry"
        disabled={submitDisabled}
        onClick={() => {
          onEvent?.(createSurfaceEvent(surface.id, "surface_submitted", { answer, strokeCount: strokes.length }));
          onSubmit?.({
            surfaceId: surface.id,
            answer,
            inkStrokes: strokes,
          });
        }}
      >
        Submit
      </button>
    </section>
  );
}
