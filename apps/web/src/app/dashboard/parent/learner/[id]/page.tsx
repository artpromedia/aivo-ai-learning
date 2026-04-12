"use client";
import { useAuth } from "@/providers/auth-provider";
import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { TUTORS, type TutorKey } from "@aivo/brand";
import BrainVisualization from "@/components/BrainVisualization";

interface Learner {
  id: string;
  name: string;
  gradeLevel?: string;
  functioningLevel?: string;
  dateOfBirth?: string;
  zipCode?: string;
  curriculumFramework?: string;
}

const LEVEL_COLORS: Record<string, string> = {
  STANDARD: "bg-green-100 text-green-700",
  SUPPORTED: "bg-blue-100 text-blue-700",
  LOW_VERBAL: "bg-amber-100 text-amber-700",
  NON_VERBAL: "bg-orange-100 text-orange-700",
  PRE_SYMBOLIC: "bg-red-100 text-red-700",
};

export default function LearnerProfilePage() {
  const { user, accessToken, loading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const learnerId = params.id as string;

  const [learner, setLearner] = useState<Learner | null>(null);
  const [loadingLearner, setLoadingLearner] = useState(true);

  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [user, loading, router]);

  useEffect(() => {
    if (!accessToken || !user) return;
    fetch("/api/users/learners", {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
      .then((r) => (r.ok ? r.json() : []))
      .then((learners: Learner[]) => {
        const found = learners.find((l) => l.id === learnerId);
        if (found) setLearner(found);
      })
      .catch(() => {})
      .finally(() => setLoadingLearner(false));
  }, [accessToken, user, learnerId]);

  if (loading || !user) return null;

  const NAV_ITEMS = [
    { label: "Overview", href: `/dashboard/parent/learner/${learnerId}/overview`, emoji: "📊" },
    { label: "Brain Review", href: `/dashboard/parent/learner/${learnerId}/brain-review`, emoji: "🔍" },
    { label: "Brain Profile", href: `/dashboard/parent/learner/${learnerId}/brain`, emoji: "🧠" },
    { label: "Gradebook", href: `/dashboard/parent/learner/${learnerId}/gradebook`, emoji: "📓" },
    { label: "Assessment", href: `/dashboard/parent/learner/${learnerId}/assessment`, emoji: "📝" },
    { label: "Sensory Profile", href: `/dashboard/parent/learner/${learnerId}/sensory`, emoji: "🎨" },
    { label: "IEP Goals", href: `/dashboard/parent/learner/${learnerId}/iep`, emoji: "🎯" },
    { label: "Tutors", href: `/dashboard/parent/learner/${learnerId}/tutors`, emoji: "👩‍🏫" },
    { label: "Learning Team", href: `/dashboard/parent/learner/${learnerId}/collaboration`, emoji: "🤝" },
    { label: "Recommendations", href: `/dashboard/parent/learner/${learnerId}/recommendations`, emoji: "💡" },
    { label: "Homework", href: `/dashboard/parent/${learnerId}/homework`, emoji: "📸" },
    { label: "Settings", href: `/dashboard/parent/learner/${learnerId}/settings`, emoji: "⚙️" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-cyan-50">
      <header className="bg-white/80 backdrop-blur border-b border-slate-200 px-8 py-4 flex items-center justify-between">
        <Image src="/images/aivo-logo-purple.png" alt="AIVO" width={120} height={36} />
        <div className="flex items-center gap-4">
          <Link href="/dashboard/parent" className="text-sm text-primary font-semibold hover:underline">Dashboard</Link>
          <span className="text-sm font-semibold text-slate-600">{user.name}</span>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">
        {loadingLearner ? (
          <div className="text-center py-20 text-slate-400 animate-pulse">Loading learner profile...</div>
        ) : !learner ? (
          <div className="text-center py-20">
            <div className="text-4xl mb-3">🔍</div>
            <p className="text-slate-500 font-semibold">Learner not found</p>
            <Link href="/dashboard/parent" className="text-sm text-primary font-semibold hover:underline mt-2 inline-block">Back to Dashboard</Link>
          </div>
        ) : (
          <div className="space-y-8">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex flex-col md:flex-row items-center gap-6">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-purple-400 flex items-center justify-center text-3xl text-white font-heading font-bold shadow-lg">
                {learner.name.charAt(0)}
              </div>
              <div className="flex-1 text-center md:text-left">
                <h1 className="text-2xl font-heading font-bold text-slate-900">{learner.name}</h1>
                <div className="flex items-center gap-3 flex-wrap justify-center md:justify-start mt-2">
                  {learner.gradeLevel && (
                    <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-sm font-semibold">Grade {learner.gradeLevel}</span>
                  )}
                  {learner.functioningLevel && (
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${LEVEL_COLORS[learner.functioningLevel] || "bg-slate-100 text-slate-600"}`}>
                      {learner.functioningLevel.replace(/_/g, " ")}
                    </span>
                  )}
                  {learner.curriculumFramework && (
                    <span className="px-3 py-1 rounded-full bg-cyan-50 text-cyan-700 text-sm font-semibold">{learner.curriculumFramework}</span>
                  )}
                </div>
              </div>
              <div className="flex-shrink-0">
                <BrainVisualization learnerId={learnerId} compact />
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {NAV_ITEMS.map((item) => (
                <Link key={item.href} href={item.href}
                  className="bg-white rounded-xl p-5 border border-slate-100 shadow-sm hover:shadow-md hover:border-purple-200 transition text-center group">
                  <div className="text-3xl mb-2 group-hover:scale-110 transition-transform">{item.emoji}</div>
                  <p className="text-sm font-heading font-bold text-slate-700 group-hover:text-primary transition">{item.label}</p>
                </Link>
              ))}
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
              <h2 className="font-heading font-bold text-lg text-slate-900 mb-4">Subscribed Tutors</h2>
              <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-7 gap-4">
                {Object.entries(TUTORS).slice(0, 7).map(([key, tutor]) => (
                  <Link key={key} href={`/dashboard/learner/lesson/${key}`}
                    className="flex flex-col items-center gap-2 group">
                    <div className="w-14 h-14 rounded-full overflow-hidden border-2 group-hover:scale-110 transition-transform shadow" style={{ borderColor: tutor.color }}>
                      <Image src={tutor.avatar} alt={tutor.name} width={56} height={56} className="object-cover" />
                    </div>
                    <span className="text-xs font-heading font-bold text-slate-600 group-hover:text-primary transition">{tutor.name}</span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
