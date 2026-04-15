"use client";
import { useAuth } from "@/providers/auth-provider";
import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { TUTORS, type TutorKey } from "@aivo/brand";
import BrainVisualization from "@/components/BrainVisualization";
import { useTranslations } from "next-intl";

interface Learner {
  id: string;
  name: string;
  gradeLevel?: string;
  functioningLevel?: string;
  curriculumFramework?: string;
}

export default function LearnerHubPage() {
  const { user, accessToken, loading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const learnerId = params.id as string;
  const t = useTranslations("parent");

  const [learner, setLearner] = useState<Learner | null>(null);
  const [loadingLearner, setLoadingLearner] = useState(true);
  const [baselineCompleted, setBaselineCompleted] = useState(false);
  const [hasBrain, setHasBrain] = useState(false);
  const [pendingReview, setPendingReview] = useState(false);
  const [streak, setStreak] = useState<any>(null);

  useEffect(() => {
    if (!accessToken || !user) return;

    fetch("/api/users/learners", { headers: { Authorization: `Bearer ${accessToken}` } })
      .then(r => r.ok ? r.json() : [])
      .then(data => {
        const found = (Array.isArray(data) ? data : []).find((l: Learner) => l.id === learnerId);
        if (found) setLearner(found);
      })
      .catch(() => {})
      .finally(() => setLoadingLearner(false));

    fetch(`/api/assessments/learner/discovery/${learnerId}/status`, { headers: { Authorization: `Bearer ${accessToken}` } })
      .then(r => r.ok ? r.json() : null)
      .then(status => { if (status?.baselineCompleted) setBaselineCompleted(true); })
      .catch(() => {});

    fetch(`/api/brain/${learnerId}/review`, { headers: { Authorization: `Bearer ${accessToken}` } })
      .then(r => r.ok ? r.json() : null)
      .then(brain => {
        if (brain) {
          setHasBrain(true);
          if (brain.approval_status === "pending_parent_review") setPendingReview(true);
        }
      })
      .catch(() => {});

    fetch(`/api/family/streaks/${learnerId}`, { headers: { Authorization: `Bearer ${accessToken}` } })
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data) setStreak(data); })
      .catch(() => {});
  }, [accessToken, user, learnerId]);

  if (loading || !user) return null;

  if (loadingLearner) {
    return <div className="text-center py-20 text-slate-400 animate-pulse">{t("loading_learner")}</div>;
  }

  if (!learner) {
    return (
      <div className="text-center py-20">
        <div className="text-4xl mb-3">🔍</div>
        <p className="text-slate-500 font-semibold">{t("learner_not_found")}</p>
        <Link href="/dashboard/parent" className="text-sm text-purple-600 font-semibold hover:underline mt-2 inline-block">{t("back_to_dashboard")}</Link>
      </div>
    );
  }

  const RIGHT_NOW_CARDS = [];
  if (pendingReview) {
    RIGHT_NOW_CARDS.push({
      icon: "🧠", label: `Review ${learner.name}'s Brain Profile`, description: "AIVO updated the brain profile based on recent sessions.",
      href: `/dashboard/parent/learner/${learnerId}/brain-review`, color: "bg-amber-50 border-amber-200 text-amber-800",
    });
  }
  if (!baselineCompleted && !hasBrain) {
    RIGHT_NOW_CARDS.push({
      icon: "📝", label: "Complete the Assessment", description: "Help AIVO understand your child's learning needs (10 min).",
      href: `/dashboard/parent/learner/${learnerId}/assessment`, color: "bg-cyan-50 border-cyan-200 text-cyan-800",
    });
  }
  if (RIGHT_NOW_CARDS.length === 0) {
    RIGHT_NOW_CARDS.push({
      icon: "🎉", label: `${learner.name} is on track!`, description: "Everything's looking great. Keep it up!",
      href: "", color: "bg-green-50 border-green-200 text-green-800",
    });
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl p-5 lg:p-6 shadow-sm border border-slate-100">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center text-2xl text-white font-bold shadow-lg flex-shrink-0">
            {learner.name.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl lg:text-2xl font-heading font-bold text-slate-900">{learner.name}</h1>
            <div className="flex items-center gap-2 flex-wrap mt-1">
              {streak && streak.currentStreak > 0 && (
                <span className="text-sm text-orange-600 font-semibold">🔥 {streak.currentStreak}-day streak</span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <h2 className="text-lg font-heading font-bold text-slate-900">Right Now</h2>
        {RIGHT_NOW_CARDS.map((card, i) => (
          card.href ? (
            <Link key={i} href={card.href} className={`block rounded-xl p-4 border ${card.color} hover:shadow-md transition`}>
              <div className="flex items-center gap-3">
                <span className="text-xl">{card.icon}</span>
                <div>
                  <p className="text-sm font-bold">{card.label}</p>
                  <p className="text-xs opacity-80 mt-0.5">{card.description}</p>
                </div>
              </div>
            </Link>
          ) : (
            <div key={i} className={`rounded-xl p-4 border ${card.color}`}>
              <div className="flex items-center gap-3">
                <span className="text-xl">{card.icon}</span>
                <div>
                  <p className="text-sm font-bold">{card.label}</p>
                  <p className="text-xs opacity-80 mt-0.5">{card.description}</p>
                </div>
              </div>
            </div>
          )
        ))}
      </div>

      {accessToken && hasBrain && (
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-heading font-bold text-slate-900">Brain Profile</h2>
            <Link href={`/dashboard/parent/learner/${learnerId}/brain`} className="text-sm text-purple-600 font-semibold hover:underline">
              View Full Profile →
            </Link>
          </div>
          <BrainVisualization learnerId={learnerId} learnerName={learner.name} accessToken={accessToken} compact baselineCompleted={baselineCompleted} />
        </div>
      )}

      <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-heading font-bold text-slate-900">Active Tutors</h2>
          <Link href="/dashboard/parent/store" className="text-sm text-purple-600 font-semibold hover:underline">
            Visit Store →
          </Link>
        </div>
        <div className="grid grid-cols-4 md:grid-cols-7 gap-3">
          {Object.entries(TUTORS).slice(0, 7).map(([key, tutor]) => (
            <button key={key} onClick={() => router.push(`/dashboard/parent/store?tutor=${key}`)}
              className="flex flex-col items-center gap-1.5 group">
              <div className="w-12 h-12 rounded-full overflow-hidden border-2 group-hover:scale-110 transition-transform shadow" style={{ borderColor: tutor.color }}>
                <Image src={tutor.avatar} alt={tutor.name} width={48} height={48} className="object-cover" />
              </div>
              <span className="text-[10px] font-heading font-bold text-slate-600 group-hover:text-purple-600 transition">{tutor.name}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
        <h2 className="text-lg font-heading font-bold text-slate-900 mb-4">Explore</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">📚 Learning & Assessment</h3>
            <div className="space-y-1">
              <Link href={`/dashboard/parent/learner/${learnerId}/progress`} className="block px-3 py-2.5 rounded-lg hover:bg-purple-50 text-sm font-semibold text-slate-700 hover:text-purple-700 transition" style={{ minHeight: 44 }}>
                Progress & Grades
              </Link>
              <Link href={`/dashboard/parent/learner/${learnerId}/assessment`} className="block px-3 py-2.5 rounded-lg hover:bg-purple-50 text-sm font-semibold text-slate-700 hover:text-purple-700 transition" style={{ minHeight: 44 }}>
                Assessments
              </Link>
              <Link href={`/dashboard/parent/learner/${learnerId}/homework`} className="block px-3 py-2.5 rounded-lg hover:bg-purple-50 text-sm font-semibold text-slate-700 hover:text-purple-700 transition" style={{ minHeight: 44 }}>
                Homework History
              </Link>
            </div>
          </div>

          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">🧠 Brain & Accommodations</h3>
            <div className="space-y-1">
              <Link href={`/dashboard/parent/learner/${learnerId}/brain`} className="block px-3 py-2.5 rounded-lg hover:bg-purple-50 text-sm font-semibold text-slate-700 hover:text-purple-700 transition" style={{ minHeight: 44 }}>
                Brain Profile
              </Link>
              <Link href={`/dashboard/parent/learner/${learnerId}/sensory`} className="block px-3 py-2.5 rounded-lg hover:bg-purple-50 text-sm font-semibold text-slate-700 hover:text-purple-700 transition" style={{ minHeight: 44 }}>
                Sensory Needs
              </Link>
              <Link href={`/dashboard/parent/learner/${learnerId}/settings`} className="block px-3 py-2.5 rounded-lg hover:bg-purple-50 text-sm font-semibold text-slate-700 hover:text-purple-700 transition" style={{ minHeight: 44 }}>
                Settings & Accommodations
              </Link>
            </div>
          </div>

          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">🎯 IEP & Support</h3>
            <div className="space-y-1">
              <Link href={`/dashboard/parent/learner/${learnerId}/iep`} className="block px-3 py-2.5 rounded-lg hover:bg-purple-50 text-sm font-semibold text-slate-700 hover:text-purple-700 transition" style={{ minHeight: 44 }}>
                IEP Goals
              </Link>
              <Link href={`/dashboard/parent/learner/${learnerId}/recommendations`} className="block px-3 py-2.5 rounded-lg hover:bg-purple-50 text-sm font-semibold text-slate-700 hover:text-purple-700 transition" style={{ minHeight: 44 }}>
                Recommendations
              </Link>
              <Link href={`/dashboard/parent/learner/${learnerId}/team`} className="block px-3 py-2.5 rounded-lg hover:bg-purple-50 text-sm font-semibold text-slate-700 hover:text-purple-700 transition" style={{ minHeight: 44 }}>
                Learning Team
              </Link>
            </div>
          </div>

          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">🏆 Achievements</h3>
            <div className="space-y-1">
              <Link href={`/dashboard/parent/learner/${learnerId}/milestones`} className="block px-3 py-2.5 rounded-lg hover:bg-purple-50 text-sm font-semibold text-slate-700 hover:text-purple-700 transition" style={{ minHeight: 44 }}>
                Milestones & Badges
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
