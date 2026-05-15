import * as React from "react";
import type { ReactNode } from "react";
import Link from "next/link";

/**
 * Single primary CTA per screen. The card is the v2 enforcement point
 * for "one primary action per screen": every learner and parent page
 * renders at most one of these, and pages that are not yet wired to a
 * real destination render it as a disabled state with a user-safe
 * reason instead of inventing a fake destination.
 */
type PrimaryActionCardProps = {
  title: string;
  description?: string;
  cta: string;
  ctaHref?: string;
  /** Surface flavor. Learner uses larger hit targets and brighter color. */
  surface?: "learner" | "parent";
  /** If supplied, the CTA is disabled and the reason is shown. */
  disabledReason?: string;
  helperText?: ReactNode;
};

export function PrimaryActionCard({
  title,
  description,
  cta,
  ctaHref,
  surface = "learner",
  disabledReason,
  helperText,
}: PrimaryActionCardProps) {
  const isDisabled = !ctaHref || Boolean(disabledReason);
  const sizing =
    surface === "learner"
      ? "min-h-[56px] px-6 text-lg"
      : "min-h-[44px] px-5 text-base";

  const buttonClasses = [
    "inline-flex items-center justify-center rounded-2xl font-semibold transition focus:outline-none focus:ring-4 focus:ring-violet-200",
    sizing,
    isDisabled
      ? "bg-slate-200 text-slate-500 cursor-not-allowed"
      : "bg-violet-600 text-white hover:bg-violet-700",
  ].join(" ");

  return (
    <section
      className="rounded-3xl border-2 border-slate-200 bg-white p-6 shadow-sm"
      aria-labelledby="primary-action-title"
    >
      <h2
        id="primary-action-title"
        className="font-heading text-xl font-bold text-slate-900"
      >
        {title}
      </h2>
      {description ? (
        <p className="mt-1 text-base text-slate-600">{description}</p>
      ) : null}
      <div className="mt-4 flex flex-col gap-2">
        {isDisabled ? (
          <button
            type="button"
            disabled
            aria-disabled="true"
            aria-describedby={disabledReason ? "primary-action-reason" : undefined}
            className={buttonClasses}
          >
            {cta}
          </button>
        ) : (
          <Link href={ctaHref!} className={buttonClasses}>
            {cta}
          </Link>
        )}
        {disabledReason ? (
          <p
            id="primary-action-reason"
            className="text-sm text-slate-500"
          >
            {disabledReason}
          </p>
        ) : null}
        {helperText ? (
          <div className="text-sm text-slate-500">{helperText}</div>
        ) : null}
      </div>
    </section>
  );
}
