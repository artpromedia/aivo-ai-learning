"use client";

import * as React from "react";

/**
 * Retry panel. Recoverable error surfaces should render this with an
 * `onRetry` handler so the user has a single, obvious next step.
 */
export function RetryPanel({
  title = "We could not load this",
  description = "Try again in a moment.",
  onRetry,
  ctaLabel = "Try again",
}: {
  title?: string;
  description?: string;
  onRetry?: () => void;
  ctaLabel?: string;
}) {
  return (
    <div
      role="alert"
      className="rounded-3xl border-2 border-amber-200 bg-amber-50 p-6"
    >
      <p className="font-heading text-lg font-bold text-amber-900">{title}</p>
      <p className="mt-1 text-base text-amber-900/80">{description}</p>
      <button
        type="button"
        onClick={onRetry}
        disabled={!onRetry}
        className="mt-4 inline-flex min-h-[44px] items-center justify-center rounded-2xl bg-amber-600 px-5 text-base font-semibold text-white hover:bg-amber-700 focus:outline-none focus:ring-4 focus:ring-amber-300 disabled:bg-amber-300 disabled:cursor-not-allowed"
      >
        {ctaLabel}
      </button>
    </div>
  );
}
