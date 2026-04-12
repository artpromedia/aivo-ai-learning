"use client";
import { useAuth } from "@/providers/auth-provider";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";

interface LearnerProfile {
  id: string;
  name: string;
  gradeLevel: string;
  functioningLevel: string;
  xp: number;
  level: number;
  streakDays: number;
  totalSessions: number;
  badgesEarned: number;
  questsCompleted: number;
  currency: number;
  joinedAt: string;
  subjects: { name: string; mastery: number }[];
}

export default function LearnerProfilePage() {
  const { user, accessToken, loading } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<LearnerProfile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  useEffect(() => { if (!loading && !user) router.push("/login"); }, [user, loading, router]);

  useEffect(() => {
    if (!accessToken || !user) return;
    fetch("/api/engagement/profile", {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data) setProfile(data);
        else {
          setProfile({
            id: user.id || "",
            name: user.name || "Learner",
            gradeLevel: "",
            functioningLevel: "",
            xp: 0,
            level: 1,
            streakDays: 0,
            totalSessions: 0,
            badgesEarned: 0,
            questsCompleted: 0,
            currency: 0,
            joinedAt: new Date().toISOString(),
            subjects: [],
          });
        }
      })
      .catch(() => setProfile(null))
      .finally(() => setLoadingProfile(false));
  }, [accessToken, user]);

  if (loading || !user) return null;

  const xpForNextLevel = ((profile?.level || 1) + 1) * 500;
  const xpProgress = profile ? Math.min((profile.xp % 500) / 5, 100) : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-white to-purple-50">
      <div className="max-w-4xl mx-auto px-6 py-8">
        <Link href="/dashboard/learner" className="text-sm text-primary hover:underline font-semibold mb-4 inline-block">← Back to Dashboard</Link>

        {loadingProfile ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-slate-100">
            <div className="animate-pulse text-slate-400">Loading profile...</div>
          </div>
        ) : !profile ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-red-100">
            <p className="text-red-600 font-semibold">Unable to load profile</p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-primary to-purple-600 rounded-3xl p-8 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
              <div className="relative">
                <div className="flex items-center gap-6">
                  <div className="w-20 h-20 rounded-2xl bg-white/20 flex items-center justify-center text-4xl">
                    🧑‍🎓
                  </div>
                  <div>
                    <h1 className="text-3xl font-heading font-bold">{profile.name}</h1>
                    <p className="text-white/70 mt-1">Level {profile.level} Learner</p>
                    {profile.gradeLevel && <p className="text-white/60 text-sm">Grade {profile.gradeLevel}</p>}
                  </div>
                  <div className="ml-auto text-right">
                    <p className="text-4xl font-bold">{profile.xp.toLocaleString()}</p>
                    <p className="text-white/70 text-sm">Total XP</p>
                  </div>
                </div>
                <div className="mt-6">
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span>Level {profile.level}</span>
                    <span>Level {profile.level + 1}</span>
                  </div>
                  <div className="w-full bg-white/20 rounded-full h-3">
                    <div className="h-3 rounded-full bg-white/80 transition-all" style={{ width: `${xpProgress}%` }} />
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm text-center">
                <p className="text-3xl font-bold text-orange-500">🔥 {profile.streakDays}</p>
                <p className="text-xs text-slate-400 font-semibold uppercase mt-1">Day Streak</p>
              </div>
              <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm text-center">
                <p className="text-3xl font-bold text-blue-600">{profile.totalSessions}</p>
                <p className="text-xs text-slate-400 font-semibold uppercase mt-1">Sessions</p>
              </div>
              <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm text-center">
                <p className="text-3xl font-bold text-amber-500">🏅 {profile.badgesEarned}</p>
                <p className="text-xs text-slate-400 font-semibold uppercase mt-1">Badges</p>
              </div>
              <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm text-center">
                <p className="text-3xl font-bold text-green-600">{profile.questsCompleted}</p>
                <p className="text-xs text-slate-400 font-semibold uppercase mt-1">Quests Done</p>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
              <h2 className="font-heading font-bold text-lg text-slate-900 mb-4">Subject Mastery</h2>
              {profile.subjects.length === 0 ? (
                <p className="text-sm text-slate-400">Start learning to see your mastery progress here!</p>
              ) : (
                <div className="space-y-4">
                  {profile.subjects.map((s, i) => (
                    <div key={i}>
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm font-semibold text-slate-700">{s.name}</p>
                        <span className="text-sm font-bold text-primary">{s.mastery}%</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2.5">
                        <div className="h-2.5 rounded-full bg-gradient-to-r from-primary to-purple-400 transition-all" style={{ width: `${s.mastery}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
              <h2 className="font-heading font-bold text-lg text-slate-900 mb-3">Quick Links</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Link href="/dashboard/learner/badges" className="p-4 rounded-xl border border-slate-200 hover:border-primary hover:shadow-sm transition text-center">
                  <span className="text-2xl">🏅</span>
                  <p className="text-sm font-semibold text-slate-700 mt-1">Badges</p>
                </Link>
                <Link href="/dashboard/learner/quests" className="p-4 rounded-xl border border-slate-200 hover:border-primary hover:shadow-sm transition text-center">
                  <span className="text-2xl">🗺️</span>
                  <p className="text-sm font-semibold text-slate-700 mt-1">Quests</p>
                </Link>
                <Link href="/dashboard/learner/shop" className="p-4 rounded-xl border border-slate-200 hover:border-primary hover:shadow-sm transition text-center">
                  <span className="text-2xl">🛍️</span>
                  <p className="text-sm font-semibold text-slate-700 mt-1">Shop</p>
                </Link>
                <Link href="/dashboard/learner/settings" className="p-4 rounded-xl border border-slate-200 hover:border-primary hover:shadow-sm transition text-center">
                  <span className="text-2xl">⚙️</span>
                  <p className="text-sm font-semibold text-slate-700 mt-1">Settings</p>
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
