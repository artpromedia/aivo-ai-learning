"use client";
import { useAuth } from "@/providers/auth-provider";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import { TUTORS } from "@aivo/brand";

interface EngagementProfile {
  totalXp: number;
  level: number;
  xpForNextLevel: number;
  xpProgress: number;
  streak: { current: number; longest: number; tier: string; lastActivity: string | null; freezesUsed: number };
  badges: { id: string; badgeType: string; name: string; rarity: string; earnedAt: string }[];
  currency: { coins: number; gems: number };
}

interface SelExercise {
  title: string;
  steps: string[];
  durationMinutes: number;
}

const STREAK_COLORS: Record<string, string> = {
  grey: "#94a3b8",
  orange: "#f97316",
  purple: "#7c3aed",
  gold: "#eab308",
};

const EMOTIONS = [
  { emoji: "😊", label: "Happy", value: "happy" },
  { emoji: "😐", label: "Okay", value: "okay" },
  { emoji: "😢", label: "Sad", value: "sad" },
  { emoji: "😤", label: "Frustrated", value: "frustrated" },
  { emoji: "😴", label: "Tired", value: "tired" },
  { emoji: "🤩", label: "Excited", value: "excited" },
];

type FunctioningLevel = "STANDARD" | "SUPPORTED" | "LOW_VERBAL" | "NON_VERBAL" | "PRE_SYMBOLIC";

function isLowFunctioning(level?: FunctioningLevel): boolean {
  return level === "LOW_VERBAL" || level === "NON_VERBAL" || level === "PRE_SYMBOLIC";
}

export default function LearnerDashboard() {
  const { user, accessToken, logout, loading } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<EngagementProfile | null>(null);
  const [showSelCheckin, setShowSelCheckin] = useState(false);
  const [selExercise, setSelExercise] = useState<SelExercise | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const [functioningLevel, setFunctioningLevel] = useState<FunctioningLevel>("STANDARD");

  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [user, loading, router]);

  useEffect(() => {
    if (!accessToken || !user) return;
    fetch(`/api/users/learners`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
      .then((r) => (r.ok ? r.json() : []))
      .then((learners: { id: string; functioningLevel?: FunctioningLevel }[]) => {
        const me = learners.find((l) => l.id === user.id);
        if (me?.functioningLevel) setFunctioningLevel(me.functioningLevel);
      })
      .catch(() => {});
  }, [accessToken, user]);

  const fetchProfile = useCallback(() => {
    if (!accessToken || !user) return;
    fetch(`/api/engagement/profile/${user.id}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
      .then((r) => (r.ok ? r.json() : null))
      .then(setProfile)
      .catch(() => {});
  }, [accessToken, user]);

  useEffect(() => { fetchProfile(); }, [fetchProfile]);

  const handleSelCheckin = async (emotion: string) => {
    if (!accessToken || !user) return;
    const res = await fetch("/api/engagement/sel/checkin", {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({ learnerId: user.id, emotion }),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.suggestedExercises?.length > 0) {
        setSelExercise(data.suggestedExercises[0]);
      }
    }
    setShowSelCheckin(false);
    setShowCelebration(true);
    setTimeout(() => setShowCelebration(false), 2500);
    fetchProfile();
  };

  if (loading || !user) return null;

  const allTutors = Object.entries(TUTORS);
  const xpPercent = profile ? Math.min(100, (profile.xpProgress / profile.xpForNextLevel) * 100) : 0;
  const isLow = isLowFunctioning(functioningLevel);
  const isPreSymbolic = functioningLevel === "PRE_SYMBOLIC";

  if (isPreSymbolic) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-white to-pink-50">
        <header className="bg-white/80 backdrop-blur border-b border-slate-200 px-8 py-4 flex items-center justify-between">
          <Image src="/images/aivo-logo-purple.png" alt="AIVO" width={100} height={30} />
          <div className="flex items-center gap-4">
            <span className="text-lg font-heading font-bold text-primary">{user.name}</span>
            <button onClick={logout} className="text-sm text-slate-500 hover:text-red-500 font-semibold">Exit</button>
          </div>
        </header>
        <main className="max-w-3xl mx-auto px-8 py-12 text-center space-y-8">
          <div className="text-6xl">⭐</div>
          <h1 className="text-3xl font-heading font-bold text-slate-900">Welcome, {user.name}!</h1>
          <p className="text-lg text-slate-500 font-semibold">Parent-managed learning — progress shown on the parent dashboard.</p>
          {profile && (
            <div className="bg-white rounded-3xl p-8 border border-yellow-200 shadow-sm">
              <div className="text-5xl mb-3">⭐</div>
              <div className="text-2xl font-heading font-bold text-amber-600">{profile.totalXp} Stars</div>
              <div className="mt-4 bg-yellow-100 rounded-full h-4 overflow-hidden max-w-xs mx-auto">
                <div className="bg-gradient-to-r from-yellow-400 to-amber-500 h-full rounded-full transition-all" style={{ width: `${xpPercent}%` }} />
              </div>
            </div>
          )}
          <div className="grid grid-cols-2 gap-6">
            {allTutors.slice(0, 4).map(([key, tutor]) => (
              <button key={key}
                onClick={() => router.push(`/dashboard/learner/lesson/${key}`)}
                className="bg-white rounded-3xl p-8 shadow-sm border-4 hover:shadow-xl transition text-center"
                style={{ borderColor: tutor.color }}
              >
                <div className="relative w-24 h-24 mx-auto rounded-full overflow-hidden shadow-lg" style={{ borderColor: tutor.color, borderWidth: "4px" }}>
                  <Image src={tutor.avatar} alt={tutor.name} fill className="object-cover object-top" sizes="96px" />
                </div>
                <div className="font-heading font-bold text-xl mt-3" style={{ color: tutor.color }}>{tutor.name}</div>
              </button>
            ))}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-cyan-50">
      {showCelebration && (
        <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
          <div className="text-8xl animate-bounce">🌟</div>
        </div>
      )}

      <header className="bg-white/80 backdrop-blur border-b border-slate-200 px-8 py-4 flex items-center justify-between">
        <Image src="/images/aivo-logo-purple.png" alt="AIVO" width={100} height={30} />
        <div className="flex items-center gap-4">
          {profile && (
            <div className="flex items-center gap-2 text-sm">
              <span className="font-bold text-amber-600">{profile.currency.coins} coins</span>
              <span className="font-bold text-purple-600">{profile.currency.gems} gems</span>
            </div>
          )}
          <span className="text-lg font-heading font-bold text-primary">Hi, {user.name}!</span>
          <button onClick={logout} className="text-sm text-slate-500 hover:text-red-500 font-semibold">Exit</button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-8 py-8 space-y-8">
        {profile && (
          <div className={`grid grid-cols-1 ${isLow ? "md:grid-cols-2" : "md:grid-cols-4"} gap-4`}>
            <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm text-center">
              {isLow ? (
                <>
                  <div className="text-5xl mb-2">⭐</div>
                  <div className="text-2xl font-heading font-bold text-amber-600">{profile.totalXp} Stars</div>
                  <div className="mt-2 bg-yellow-100 rounded-full h-4 overflow-hidden">
                    <div className="bg-gradient-to-r from-yellow-400 to-amber-500 h-full rounded-full transition-all" style={{ width: `${xpPercent}%` }} />
                  </div>
                </>
              ) : (
                <>
                  <div className="text-3xl font-heading font-bold text-primary">Lv. {profile.level}</div>
                  <div className="mt-2 bg-slate-100 rounded-full h-3 overflow-hidden">
                    <div className="bg-gradient-to-r from-purple-500 to-cyan-500 h-full rounded-full transition-all" style={{ width: `${xpPercent}%` }} />
                  </div>
                  <div className="text-xs text-slate-400 mt-1 font-semibold">{profile.totalXp} XP total</div>
                </>
              )}
            </div>

            <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm text-center">
              <div className="text-3xl" style={{ color: STREAK_COLORS[profile.streak.tier] || "#94a3b8" }}>
                🔥
              </div>
              <div className="text-xl font-heading font-bold" style={{ color: STREAK_COLORS[profile.streak.tier] }}>
                {profile.streak.current} day{profile.streak.current !== 1 ? "s" : ""}
              </div>
              <div className="text-xs text-slate-400 font-semibold">Best: {profile.streak.longest}</div>
            </div>

            {!isLow && (
              <>
                <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm text-center">
                  <div className="text-3xl">🏆</div>
                  <div className="text-xl font-heading font-bold text-slate-900">{profile.badges.length}</div>
                  <div className="text-xs text-slate-400 font-semibold">Badges earned</div>
                </div>

                <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex flex-col items-center justify-center gap-2">
                  <button
                    onClick={() => setShowSelCheckin(!showSelCheckin)}
                    className="px-4 py-2 rounded-full bg-pink-50 text-pink-700 font-bold text-sm hover:bg-pink-100 transition"
                  >
                    How are you feeling?
                  </button>
                  {showSelCheckin && (
                    <div className="flex gap-2 flex-wrap justify-center">
                      {EMOTIONS.map((e) => (
                        <button key={e.value} onClick={() => handleSelCheckin(e.value)} className="text-2xl hover:scale-125 transition-transform" title={e.label}>
                          {e.emoji}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}

            {isLow && (
              <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex flex-col items-center justify-center gap-2">
                <button
                  onClick={() => setShowSelCheckin(!showSelCheckin)}
                  className="px-6 py-3 rounded-full bg-pink-50 text-pink-700 font-bold text-lg hover:bg-pink-100 transition"
                >
                  How do I feel?
                </button>
                {showSelCheckin && (
                  <div className="flex gap-3 flex-wrap justify-center">
                    {EMOTIONS.slice(0, 4).map((e) => (
                      <button key={e.value} onClick={() => handleSelCheckin(e.value)} className="text-4xl hover:scale-125 transition-transform" title={e.label}>
                        {e.emoji}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {selExercise && (
          <div className="bg-pink-50 rounded-2xl p-6 border border-pink-200">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-heading font-bold text-lg text-pink-800">{selExercise.title}</h3>
              <button onClick={() => setSelExercise(null)} className="text-sm text-pink-500 hover:text-pink-700 font-bold">Close</button>
            </div>
            <ol className="space-y-2">
              {selExercise.steps.map((step, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-pink-200 text-pink-800 text-xs font-bold flex items-center justify-center shrink-0">{i + 1}</span>
                  <span className="text-sm text-pink-700">{step}</span>
                </li>
              ))}
            </ol>
            <div className="text-xs text-pink-400 mt-3 font-semibold">{selExercise.durationMinutes} minutes</div>
          </div>
        )}

        {!isLow && (
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <button onClick={() => router.push("/dashboard/learner/assessment")}
              className="inline-flex items-center gap-2 px-6 py-2 rounded-full bg-amber-100 text-amber-700 font-bold text-sm hover:bg-amber-200 transition">
              <span>📝</span> Baseline Assessment
            </button>
            <button onClick={() => router.push("/dashboard/learner/homework")}
              className="inline-flex items-center gap-2 px-6 py-2 rounded-full bg-purple-100 text-purple-700 font-bold text-sm hover:bg-purple-200 transition">
              <span>📸</span> Homework Helper
            </button>
            <button onClick={() => router.push("/dashboard/learner/quests")}
              className="inline-flex items-center gap-2 px-6 py-2 rounded-full bg-cyan-100 text-cyan-700 font-bold text-sm hover:bg-cyan-200 transition">
              <span>🗺️</span> Quests
            </button>
            <button onClick={() => router.push("/dashboard/learner/challenges")}
              className="inline-flex items-center gap-2 px-6 py-2 rounded-full bg-red-100 text-red-700 font-bold text-sm hover:bg-red-200 transition">
              <span>⚔️</span> Challenges
            </button>
            <button onClick={() => router.push("/dashboard/learner/shop")}
              className="inline-flex items-center gap-2 px-6 py-2 rounded-full bg-green-100 text-green-700 font-bold text-sm hover:bg-green-200 transition">
              <span>🛒</span> Shop
            </button>
            <button onClick={() => router.push("/dashboard/learner/leaderboard")}
              className="inline-flex items-center gap-2 px-6 py-2 rounded-full bg-amber-100 text-amber-600 font-bold text-sm hover:bg-amber-200 transition">
              <span>🏆</span> Leaderboard
            </button>
          </div>
        )}

        {isLow && (
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <button onClick={() => router.push("/dashboard/learner/quests")}
              className="inline-flex items-center gap-3 px-8 py-4 rounded-2xl bg-cyan-100 text-cyan-700 font-bold text-lg hover:bg-cyan-200 transition shadow-sm">
              <span className="text-2xl">🗺️</span> Adventures
            </button>
            <button onClick={() => router.push("/dashboard/learner/shop")}
              className="inline-flex items-center gap-3 px-8 py-4 rounded-2xl bg-green-100 text-green-700 font-bold text-lg hover:bg-green-200 transition shadow-sm">
              <span className="text-2xl">🎁</span> Rewards
            </button>
          </div>
        )}

        {!isLow && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-5 border border-amber-200 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xl">🎯</span>
                <h3 className="font-heading font-bold text-amber-800">Daily Missions</h3>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-3 bg-white/70 rounded-xl px-4 py-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-xl" style={{ backgroundColor: `${TUTORS.nova.color}15` }}>🔢</div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-slate-700">Complete 1 session with Nova</p>
                    <div className="flex items-center gap-1 mt-1">
                      <div className="w-24 bg-amber-100 rounded-full h-2"><div className="h-2 rounded-full bg-amber-400 transition-all" style={{ width: "0%" }} /></div>
                      <span className="text-xs text-amber-500 font-bold">0/1</span>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-amber-600">+25 XP</span>
                </div>
                <div className="flex items-center gap-3 bg-white/70 rounded-xl px-4 py-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-xl" style={{ backgroundColor: `${TUTORS.sage.color}15` }}>📚</div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-slate-700">Practice reading with Sage</p>
                    <div className="flex items-center gap-1 mt-1">
                      <div className="w-24 bg-amber-100 rounded-full h-2"><div className="h-2 rounded-full bg-amber-400 transition-all" style={{ width: "0%" }} /></div>
                      <span className="text-xs text-amber-500 font-bold">0/1</span>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-amber-600">+25 XP</span>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-violet-50 to-purple-50 rounded-2xl p-5 border border-purple-200 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xl">🗺️</span>
                <h3 className="font-heading font-bold text-purple-800">Quest Worlds</h3>
              </div>
              <div className="space-y-2">
                {[
                  { name: "Mathlands", emoji: "🔢", tutor: "nova", color: TUTORS.nova.color },
                  { name: "Word World", emoji: "📚", tutor: "sage", color: TUTORS.sage.color },
                  { name: "Science Frontier", emoji: "🔬", tutor: "spark", color: TUTORS.spark.color },
                ].map((world) => (
                  <button key={world.name} onClick={() => router.push(`/dashboard/learner/quests/${world.tutor}`)}
                    className="w-full flex items-center gap-3 bg-white/70 rounded-xl px-4 py-3 hover:bg-white transition text-left group">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl" style={{ backgroundColor: `${world.color}15` }}>{world.emoji}</div>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-slate-700 group-hover:text-primary transition">{world.name}</p>
                      <p className="text-xs text-slate-400">Explore & complete quests</p>
                    </div>
                    <span className="text-slate-300 group-hover:text-primary transition">→</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        <div>
          <h2 className={`font-heading font-bold text-slate-900 text-center mb-6 ${isLow ? "text-3xl" : "text-2xl"}`}>
            {isLow ? "Pick a Friend!" : "Start Learning"}
          </h2>
          <div className={`grid ${isLow ? "grid-cols-2 md:grid-cols-3 gap-8" : "grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5"}`}>
            {(isLow ? allTutors.slice(0, 6) : allTutors).map(([key, tutor]) => (
              <button key={key}
                onClick={() => router.push(`/dashboard/learner/lesson/${key}`)}
                className={`relative bg-white rounded-2xl shadow-sm border-2 border-transparent hover:shadow-xl transition text-center group overflow-hidden ${isLow ? "p-8" : "p-5"}`}
                style={{ borderColor: "transparent" }}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = tutor.color)}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = "transparent")}
              >
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: `linear-gradient(135deg, ${tutor.color}08, ${tutor.color}15)` }} />
                <div className="relative">
                  <div className={`relative mx-auto rounded-full overflow-hidden group-hover:scale-110 transition-transform shadow-lg ${isLow ? "w-24 h-24" : "w-20 h-20"}`} style={{ borderColor: tutor.color, borderWidth: isLow ? "4px" : "3px" }}>
                    <Image src={tutor.avatar} alt={`${tutor.name} - ${tutor.domain}`} fill className="object-cover object-top" sizes={isLow ? "96px" : "80px"} />
                  </div>
                  <div className={`font-heading font-bold mt-3 ${isLow ? "text-xl" : "text-base"}`} style={{ color: tutor.color }}>{tutor.name}</div>
                  {!isLow && <div className="text-xs text-slate-400 font-semibold mt-0.5">{tutor.domain}</div>}
                  {!isLow && (
                    <div className="mt-2 text-xs font-bold text-white px-3 py-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity inline-block" style={{ backgroundColor: tutor.color }}>
                      Start Learning →
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        {!isLow && profile && profile.badges.length > 0 && (
          <div>
            <h2 className="text-2xl font-heading font-bold text-slate-900 text-center mb-4">Badge Cabinet</h2>
            <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-6 gap-4">
              {profile.badges.map((b) => (
                <div key={b.id} className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm text-center">
                  <div className="text-3xl mb-2">
                    {b.rarity === "legendary" ? "💎" : b.rarity === "epic" ? "🌟" : b.rarity === "rare" ? "⭐" : "🏅"}
                  </div>
                  <div className="text-xs font-bold text-slate-700 truncate">{b.name}</div>
                  <div className="text-xs text-slate-400 capitalize">{b.rarity}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
