import * as React from "react";
import type { ReactNode } from "react";

/**
 * Error-state panel for v2 surfaces. Never shows a raw upstream error
 * string to learners. The optional `audience` flag tightens the
 * default copy for the child surface.
 */
export function ErrorState({
  title,
  description,
  audience = "parent",
  action,
}: {
  title?: string;
  description?: string;
  audience?: "learner" | "parent";
  action?: ReactNode;
}) {
  const defaultTitle =
    audience === "learner"
      ? "Something went wrong"
      : "We could not load this just now";
  const defaultDescription =
    audience === "learner"
      ? "Try again in a moment."
      : "Please try again. If this keeps happening, check your connection and retry.";

  return (
    <div
      role="alert"
      className="rounded-3xl border-2 border-rose-200 bg-rose-50 p-6"
    >
      <p className="font-heading text-lg font-bold text-rose-900">
        {title ?? defaultTitle}
      </p>
      <p className="mt-1 text-base text-rose-900/80">
        {description ?? defaultDescription}
      </p>
      {action ? <div className="mt-3">{action}</div> : null}
    </div>
  );
}
