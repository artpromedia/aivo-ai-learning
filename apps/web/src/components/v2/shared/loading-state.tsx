import * as React from "react";
/**
 * Loading-state panel for v2 surfaces. A11y-friendly: announces
 * progress via `role="status"` and visually shows a calm placeholder
 * instead of a spinner-only state.
 */
export function LoadingState({
  label = "Loading",
  hint,
}: {
  label?: string;
  hint?: string;
}) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="rounded-3xl border-2 border-slate-200 bg-white p-8 text-center"
    >
      <p className="font-heading text-lg font-bold text-slate-900">{label}</p>
      {hint ? <p className="mt-2 text-base text-slate-600">{hint}</p> : null}
      <span className="sr-only">{label}</span>
    </div>
  );
}
