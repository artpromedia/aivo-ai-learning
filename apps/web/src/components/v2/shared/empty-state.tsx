import * as React from "react";
import type { ReactNode } from "react";

/**
 * Generic empty-state panel for v2 surfaces. Distinct from
 * `loading-state` and `error-state`: this is what we render when a
 * fetch succeeded but the upstream record is genuinely absent.
 */
export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div
      role="status"
      className="rounded-3xl border-2 border-dashed border-slate-200 bg-slate-50 p-8 text-center"
    >
      <p className="font-heading text-xl font-bold text-slate-900">{title}</p>
      {description ? (
        <p className="mt-2 text-base text-slate-600">{description}</p>
      ) : null}
      {action ? <div className="mt-4 inline-flex">{action}</div> : null}
    </div>
  );
}
