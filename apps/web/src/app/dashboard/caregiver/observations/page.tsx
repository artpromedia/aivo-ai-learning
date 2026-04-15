"use client";
import { useAuth } from "@/providers/auth-provider";

export default function CaregiverObservationsPage() {
  const { user, loading } = useAuth();

  if (loading || !user) return null;

  return (
    <div className="p-8 space-y-6">
      <h1 className="text-3xl font-heading font-bold text-slate-900">Observations</h1>

      <div className="bg-white rounded-2xl p-12 text-center border border-slate-100 shadow-sm">
        <div className="text-5xl mb-4" aria-hidden="true">📝</div>
        <h2 className="text-xl font-heading font-bold text-slate-900 mb-2">Observation Submission</h2>
        <p className="text-sm text-slate-500 max-w-md mx-auto mb-6">
          Submit behavioral observations, daily notes, and home observations to help build a complete picture of the learner&apos;s progress.
        </p>
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-50 text-green-600 text-sm font-semibold">
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" aria-hidden="true" />
          Coming Soon
        </div>
      </div>
    </div>
  );
}
