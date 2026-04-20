"use client";
import { useAuth } from "@/providers/auth-provider";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";

interface QuestWorld {
  key: string;
  name: string;
  tutorKey: string;
  subject: string;
  description: string;
  chapters: number;
}

const WORLD_ICONS: Record<string, string> = {
  nova_number_galaxy: "🌌",
  sage_story_kingdom: "📖",
  spark_science_lab: "🧪",
  chrono_time_tower: "🏰",
  pixel_code_forge: "💻",
};

const WORLD_COLORS: Record<string, string> = {
  nova_number_galaxy: "#6366f1",
  sage_story_kingdom: "#059669",
  spark_science_lab: "#f59e0b",
  chrono_time_tower: "#8b5cf6",
  pixel_code_forge: "#3b82f6",
};

export default function QuestsPage() {
  const { user, accessToken, logout, loading } = useAuth();
  const router = useRouter();
  const t = useTranslations("learner");
  const tCommon = useTranslations("common");
  const [worlds, setWorlds] = useState<QuestWorld[]>([]);

  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [user, loading, router]);

  useEffect(() => {
    if (!accessToken) return;
    fetch("/api/engagement/quests/worlds", {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
      .then((r) => (r.ok ? r.json() : []))
      .then(setWorlds)
      .catch(() => {});
  }, [accessToken]);

  if (loading || !user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <header className="bg-white/80 backdrop-blur border-b border-slate-200 px-8 py-4 flex items-center justify-between">
        <Image src="/images/aivo-logo-purple.png" alt="AIVO" width={100} height={30} style={{ height: "auto" }} />
        <div className="flex items-center gap-4">
          <button onClick={() => router.push("/dashboard/learner")}
            className="text-sm text-primary font-semibold hover:underline">{tCommon("back")}</button>
          <button onClick={logout} className="text-sm text-slate-500 hover:text-red-500 font-semibold">{t("log_out")}</button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-8 py-12 space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-heading font-bold text-slate-900">🗺️ {t("quest_worlds")}</h1>
          <p className="text-slate-500 font-semibold mt-2">{t("quest_worlds_desc")}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {worlds.map((world) => (
            <div
              key={world.key}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") router.push(`/dashboard/learner/quests/${world.key}`); }}
              className="bg-white rounded-2xl p-6 border-2 shadow-sm hover:shadow-xl transition cursor-pointer group"
              style={{ borderColor: WORLD_COLORS[world.key] || "#7c3aed" }}
              onClick={() => router.push(`/dashboard/learner/quests/${world.key}`)}
            >
              <div className="flex items-center gap-4 mb-3">
                <div className="text-4xl">{WORLD_ICONS[world.key] || "🌍"}</div>
                <div>
                  <h3 className="text-xl font-heading font-bold" style={{ color: WORLD_COLORS[world.key] }}>
                    {world.name}
                  </h3>
                  <p className="text-sm text-slate-500 font-semibold">{world.subject}</p>
                </div>
              </div>
              <p className="text-sm text-slate-600">{world.description}</p>
              <div className="mt-3 flex items-center justify-between">
                <span className="text-xs text-slate-400 font-semibold">{world.chapters} chapters</span>
                <span className="text-sm font-bold group-hover:translate-x-1 transition-transform" style={{ color: WORLD_COLORS[world.key] }}>
                  {t("enter")} →
                </span>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
