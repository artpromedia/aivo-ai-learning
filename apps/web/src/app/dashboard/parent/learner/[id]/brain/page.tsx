"use client";
import { useAuth } from "@/providers/auth-provider";
import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import BrainVisualization from "@/components/BrainVisualization";

export default function ParentBrainProfilePage() {
  const { user, accessToken, loading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const learnerId = params.id as string;
  const [learnerName, setLearnerName] = useState("Learner");
  const [loadingName, setLoadingName] = useState(true);
  const [baselineCompleted, setBaselineCompleted] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.push("/login");
    if (!loading && user && user.role !== "PARENT") router.push("/");
  }, [user, loading, router]);

  useEffect(() => {
    if (!accessToken || !learnerId) return;
    fetch("/api/users/learners", { headers: { Authorization: `Bearer ${accessToken}` } })
      .then(r => r.ok ? r.json() : [])
      .then(data => {
        const list = Array.isArray(data) ? data : [];
        const found = list.find((l: any) => l.id === learnerId);
        if (found) setLearnerName(found.name);
      })
      .catch(() => {})
      .finally(() => setLoadingName(false));

    fetch(`/api/assessments/learner/discovery/${learnerId}/status`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
      .then((r) => r.ok ? r.json() : null)
      .then((status) => {
        if (status?.baselineCompleted) setBaselineCompleted(true);
      })
      .catch(() => {});
  }, [accessToken, learnerId]);

  if (loading || !user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-cyan-50">
      <header className="bg-white/80 backdrop-blur border-b border-slate-200 px-8 py-4 flex items-center justify-between">
        <Image src="/images/aivo-logo-purple.png" alt="AIVO" width={120} height={36} />
        <div className="flex items-center gap-4">
          <Link href="/dashboard/parent" className="text-sm text-primary font-semibold hover:underline">Dashboard</Link>
          <span className="text-sm font-semibold text-slate-600">{user.name}</span>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-8 py-6">
        <Link href={`/dashboard/parent/learner/${learnerId}/overview`}
          className="text-sm text-primary hover:underline font-semibold mb-4 inline-block">← Back to {learnerName}</Link>

        <h1 className="text-2xl font-heading font-bold text-slate-900 mb-2">Brain Profile — {learnerName}</h1>
        <p className="text-sm text-slate-500 mb-8">
          The Brain Clone is AIVO&apos;s adaptive model of your learner&apos;s cognitive patterns, strengths, sensory preferences, and communication style. It evolves with every session.
        </p>

        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
            <h2 className="font-heading font-bold text-lg text-slate-900 mb-4">Brain Visualization</h2>
            {accessToken ? (
              <BrainVisualization learnerId={learnerId} learnerName={learnerName} accessToken={accessToken} baselineCompleted={baselineCompleted} />
            ) : (
              <p className="text-sm text-slate-400">Loading brain data...</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
              <h3 className="font-heading font-bold text-slate-900 mb-3">What is the Brain Clone?</h3>
              <ul className="space-y-2 text-sm text-slate-600">
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">●</span>
                  <span>Adapts content difficulty in real-time based on performance</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">●</span>
                  <span>Tracks learning patterns across all subjects and tutors</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">●</span>
                  <span>Identifies strengths and areas that need extra support</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">●</span>
                  <span>Informs IEP goal recommendations and accommodation suggestions</span>
                </li>
              </ul>
            </div>
            <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
              <h3 className="font-heading font-bold text-slate-900 mb-3">Related Pages</h3>
              <div className="space-y-2">
                <Link href={`/dashboard/parent/learner/${learnerId}/sensory`}
                  className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 hover:border-primary/30 hover:bg-purple-50/30 transition">
                  <span className="text-xl">🎨</span>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Sensory Profile</p>
                    <p className="text-xs text-slate-400">View sensory preferences and accommodations</p>
                  </div>
                </Link>
                <Link href={`/dashboard/parent/learner/${learnerId}/recommendations`}
                  className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 hover:border-primary/30 hover:bg-purple-50/30 transition">
                  <span className="text-xl">💡</span>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Recommendations</p>
                    <p className="text-xs text-slate-400">AI-generated suggestions based on brain data</p>
                  </div>
                </Link>
                <Link href={`/dashboard/parent/learner/${learnerId}/iep`}
                  className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 hover:border-primary/30 hover:bg-purple-50/30 transition">
                  <span className="text-xl">🎯</span>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">IEP Goals</p>
                    <p className="text-xs text-slate-400">Track individualized education plan progress</p>
                  </div>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
