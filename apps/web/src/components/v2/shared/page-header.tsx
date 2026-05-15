import * as React from "react";
import type { ReactNode } from "react";

/**
 * In-body page header. The shells render the page title inside the
 * top bar; `PageHeader` is for secondary section titles inside the
 * main content (e.g. "Subjects", "Today's Mission").
 */
export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h2 className="font-heading text-2xl font-bold text-slate-900">
          {title}
        </h2>
        {description ? (
          <p className="mt-1 text-base text-slate-600">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
    </div>
  );
}
