"use client";
import { useAuth } from "@/providers/auth-provider";
import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Lock, Check, Calculator, BookOpen, FlaskConical, Globe2, type LucideIcon } from "lucide-react";

interface QuestWorld {
  slug: string;
  name: string;
  description: string;
  theme: string;
  icon: LucideIcon;
  quests: Quest[];
}

interface Quest {
  id: string;
  title: string;
  description: string;
  xpReward: number;
  status: "locked" | "available" | "in_progress" | "completed";
  progressPct: number;
  steps: { title: string; completed: boolean }[];
}

const SAMPLE_WORLDS: Record<string, QuestWorld> = {
  "mathlands": {
    slug: "mathlands",
    name: "Mathlands",
    description: "Conquer the realm of numbers and equations",
    theme: "from-blue-500 to-indigo-600",
    icon: Calculator,
    quests: [
      { id: "q1", title: "Number Basics", description: "Master addition and subtraction", xpReward: 100, status: "completed", progressPct: 100, steps: [{ title: "Addition", completed: true }, { title: "Subtraction", completed: true }, { title: "Mixed Practice", completed: true }] },
      { id: "q2", title: "Multiplication Mission", description: "Learn your times tables", xpReward: 150, status: "in_progress", progressPct: 60, steps: [{ title: "Tables 1-5", completed: true }, { title: "Tables 6-10", completed: true }, { title: "Tables 11-12", completed: false }, { title: "Speed Challenge", completed: false }] },
      { id: "q3", title: "Division Discovery", description: "Divide and conquer", xpReward: 150, status: "available", progressPct: 0, steps: [{ title: "Basic Division", completed: false }, { title: "Remainders", completed: false }, { title: "Long Division", completed: false }] },
      { id: "q4", title: "Fraction Kingdom", description: "Rule the land of fractions", xpReward: 200, status: "locked", progressPct: 0, steps: [{ title: "Parts of a Whole", completed: false }, { title: "Adding Fractions", completed: false }, { title: "Mixed Numbers", completed: false }] },
    ],
  },
  "word-world": {
    slug: "word-world",
    name: "Word World",
    description: "Explore the magic of language and reading",
    theme: "from-green-500 to-emerald-600",
    icon: BookOpen,
    quests: [
      { id: "q5", title: "Phonics Path", description: "Sound out the basics", xpReward: 100, status: "completed", progressPct: 100, steps: [{ title: "Vowel Sounds", completed: true }, { title: "Consonant Blends", completed: true }] },
      { id: "q6", title: "Reading Rally", description: "Build fluency and comprehension", xpReward: 150, status: "in_progress", progressPct: 40, steps: [{ title: "Sight Words", completed: true }, { title: "Short Stories", completed: false }, { title: "Comprehension Quiz", completed: false }] },
      { id: "q7", title: "Creative Writing Cave", description: "Tell your own stories", xpReward: 200, status: "locked", progressPct: 0, steps: [{ title: "Sentence Building", completed: false }, { title: "Paragraphs", completed: false }, { title: "Story Time", completed: false }] },
    ],
  },
  "science-station": {
    slug: "science-station",
    name: "Science Station",
    description: "Experiment and discover the natural world",
    theme: "from-orange-500 to-red-600",
    icon: FlaskConical,
    quests: [
      { id: "q8", title: "Lab Basics", description: "Learn the scientific method", xpReward: 100, status: "available", progressPct: 0, steps: [{ title: "Observation", completed: false }, { title: "Hypothesis", completed: false }, { title: "Experiment", completed: false }] },
    ],
  },
};

export default function QuestWorldPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const t = useTranslations("learner");
  const tCommon = useTranslations("common");
  const tGamification = useTranslations("gamification");
  const params = useParams();
  const worldSlug = params.worldSlug as string;
  const world = SAMPLE_WORLDS[worldSlug];

  useEffect(() => { if (!loading && !user) router.push("/login"); }, [user, loading, router]);
  if (loading || !user) return null;

  if (!world) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-500 font-semibold">{t("quest_not_found")}</p>
          <Link href="/dashboard/learner/quests" className="text-primary hover:underline text-sm mt-2 inline-block">← {tCommon("back")}</Link>
        </div>
      </div>
    );
  }

  const completed = world.quests.filter(q => q.status === "completed").length;
  const totalXP = world.quests.reduce((sum, q) => sum + (q.status === "completed" ? q.xpReward : 0), 0);

  const STATUS_STYLES = {
    completed: "border-green-300 bg-green-50",
    in_progress: "border-blue-300 bg-blue-50",
    available: "border-slate-200 bg-white",
    locked: "border-slate-200 bg-slate-50 opacity-60",
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-purple-50">
      <div className="max-w-4xl mx-auto px-6 py-8">
        <Link href="/dashboard/learner/quests" className="text-sm text-primary hover:underline font-semibold mb-6 inline-block">← {tCommon("back")}</Link>

        <div className={`bg-gradient-to-r ${world.theme} rounded-3xl p-8 text-white mb-8 relative overflow-hidden`}>
          <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="relative">
            <span className="w-16 h-16 mb-3 rounded-2xl bg-white/20 text-white flex items-center justify-center"><world.icon className="w-9 h-9" strokeWidth={2} aria-hidden /></span>
            <h1 className="text-3xl font-heading font-bold">{world.name}</h1>
            <p className="text-white/80 mt-1">{world.description}</p>
            <div className="flex gap-6 mt-4">
              <div>
                <p className="text-2xl font-bold">{completed}/{world.quests.length}</p>
                <p className="text-white/60 text-xs">{t("quests_done")}</p>
              </div>
              <div>
                <p className="text-2xl font-bold">{totalXP}</p>
                <p className="text-white/60 text-xs">{tGamification("xp")}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {world.quests.map((quest, index) => (
            <div key={quest.id} className={`rounded-2xl border-2 p-6 transition ${STATUS_STYLES[quest.status]}`}>
              <div className="flex items-start gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm ${
                  quest.status === "completed" ? "bg-green-500 text-white" :
                  quest.status === "in_progress" ? "bg-blue-500 text-white" :
                  quest.status === "available" ? "bg-slate-200 text-slate-600" : "bg-slate-100 text-slate-400"
                }`}>
                  {quest.status === "completed" ? <Check className="w-5 h-5" strokeWidth={3} aria-hidden /> : quest.status === "locked" ? <Lock className="w-4 h-4" strokeWidth={2.5} aria-hidden /> : index + 1}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-heading font-bold text-slate-900">{quest.title}</h3>
                    <span className="text-sm font-bold text-amber-600">+{quest.xpReward} XP</span>
                  </div>
                  <p className="text-sm text-slate-500 mb-3">{quest.description}</p>

                  {quest.status !== "locked" && (
                    <>
                      <div className="flex items-center gap-2 mb-3">
                        <div className="flex-1 bg-slate-200 rounded-full h-2">
                          <div className={`h-2 rounded-full transition-all ${quest.status === "completed" ? "bg-green-500" : "bg-blue-500"}`}
                            style={{ width: `${quest.progressPct}%` }} />
                        </div>
                        <span className="text-xs font-semibold text-slate-500">{quest.progressPct}%</span>
                      </div>

                      <div className="space-y-1.5">
                        {quest.steps.map((step, si) => (
                          <div key={si} className="flex items-center gap-2 text-sm">
                            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${step.completed ? "bg-green-500 text-white" : "bg-slate-200 text-slate-400"}`}>
                              {step.completed ? <Check className="w-3 h-3" strokeWidth={3} aria-hidden /> : si + 1}
                            </span>
                            <span className={step.completed ? "text-slate-400 line-through" : "text-slate-700"}>{step.title}</span>
                          </div>
                        ))}
                      </div>
                    </>
                  )}

                  {quest.status === "available" && (
                    <button className="mt-3 px-4 py-2 rounded-lg bg-primary text-white text-sm font-bold hover:bg-primary-dark transition">
                      {t("start_quest")}
                    </button>
                  )}
                  {quest.status === "in_progress" && (
                    <button className="mt-3 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-bold hover:bg-blue-700 transition">
                      {t("continue_quest")}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
