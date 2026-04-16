"use client";
import Link from "next/link";

interface EmptyLearnerStateProps {
  icon?: string;
  title?: string;
  description?: string;
  cta?: { label: string; href: string };
}

export default function EmptyLearnerState({
  icon = "📚",
  title = "No learners connected yet",
  description = "Parents can invite you from the Collaboration page in their dashboard.",
  cta = { label: "Check pending invites", href: "/dashboard/notifications" },
}: EmptyLearnerStateProps) {
  return (
    <div className="bg-white rounded-2xl p-12 text-center border border-slate-100" role="status">
      <div className="text-5xl mb-4" aria-hidden="true">{icon}</div>
      <p className="text-slate-700 font-heading font-bold text-xl">{title}</p>
      <p className="text-sm text-slate-500 mt-2 max-w-md mx-auto">{description}</p>
      <Link
        href={cta.href}
        className="inline-block mt-4 px-6 py-2.5 rounded-xl bg-slate-900 text-white font-bold text-sm hover:bg-slate-800 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 focus-visible:ring-offset-2"
      >
        {cta.label}
      </Link>
    </div>
  );
}
