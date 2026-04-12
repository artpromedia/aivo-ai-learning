"use client";
import { useAuth } from "@/providers/auth-provider";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Image from "next/image";
import BrainVisualization from "@/components/BrainVisualization";

interface ConnectedLearner {
  id: string;
  name: string;
  functioningLevel: string;
  gradeLevel: string;
}

export default function TherapistDashboard() {
  const { user, accessToken, logout, loading } = useAuth();
  const router = useRouter();
  const [learners, setLearners] = useState<ConnectedLearner[]>([]);
  const [loadingLearners, setLoadingLearners] = useState(true);
  const [fetchError, setFetchError] = useState(false);

  useEffect(() => { if (!loading && !user) router.push("/login"); }, [user, loading, router]);

  useEffect(() => {
    if (!accessToken || !user) return;
    setFetchError(false);
    fetch("/api/family/collaboration/connected-learners", {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
      .then(r => {
        if (!r.ok) { setFetchError(true); return []; }
        return r.json();
      })
      .then(setLearners)
      .catch((err: unknown) => { console.error("Failed to load connected learners:", err); setFetchError(true); })
      .finally(() => setLoadingLearners(false));
  }, [accessToken, user]);

  if (loading || !user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50">
      <header className="bg-white/80 backdrop-blur border-b border-slate-200 px-8 py-4 flex items-center justify-between">
        <Image src="/images/aivo-logo-purple.png" alt="AIVO" width={120} height={36} />
        <div className="flex items-center gap-4">
          <span className="text-sm font-semibold text-slate-600">{user.name}</span>
          <span className="px-3 py-1 text-xs rounded-full bg-pink-100 text-pink-700 font-bold">Therapist</span>
          <button onClick={logout} className="text-sm text-slate-500 hover:text-red-500 font-semibold transition">Logout</button>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-8 py-8 space-y-8">
        <h1 className="text-3xl font-heading font-bold text-slate-900">Therapist Dashboard</h1>

        {loadingLearners ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-slate-100">
            <div className="animate-pulse text-slate-400">Loading your clients...</div>
          </div>
        ) : fetchError ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-red-100">
            <div className="text-4xl mb-4">⚠️</div>
            <p className="text-red-600 font-semibold text-lg">Unable to load clients</p>
            <p className="text-sm text-slate-400 mt-2">Please try refreshing the page. If the issue persists, contact support.</p>
          </div>
        ) : learners.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-slate-100">
            <div className="text-4xl mb-4">💜</div>
            <p className="text-slate-500 font-semibold text-lg">No clients connected yet</p>
            <p className="text-sm text-slate-400 mt-2">Parents can invite you to their learner&apos;s team from the Collaboration page.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {learners.map((l) => (
              <div key={l.id} className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm hover:shadow-lg transition">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-heading font-bold text-slate-900">{l.name}</h3>
                  <span className="px-3 py-1 text-xs rounded-full bg-purple-100 text-primary font-bold">
                    {l.functioningLevel || "Pending"}
                  </span>
                </div>
                {l.gradeLevel && <p className="text-sm text-slate-500 font-semibold mb-3">Grade: {l.gradeLevel}</p>}
                {accessToken && (
                  <BrainVisualization
                    learnerId={l.id}
                    learnerName={l.name}
                    accessToken={accessToken}
                    compact
                  />
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
