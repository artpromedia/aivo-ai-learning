"use client";
import { useAuth } from "@/providers/auth-provider";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { type TutorKey, getTutorsForTier, TUTORS } from "@aivo/brand";
import { useTierThemeOptional } from "@aivo/learner-ui";
import { useTranslations } from "next-intl";

export default function LearnerTutorsPage() {
  const { user, accessToken, loading } = useAuth();
  const router = useRouter();
  const t = useTranslations("learner");
  const tTutor = useTranslations("tutor");
  const tCommon = useTranslations("common");
  const [activeTutors, setActiveTutors] = useState<string[]>([]);
  const [loadingTutors, setLoadingTutors] = useState(true);
  const [filter, setFilter] = useState<"all" | "active" | "locked">("all");
  const tierCtx = useTierThemeOptional();

  useEffect(() => { if (!loading && !user) router.push("/login"); }, [user, loading, router]);

  useEffect(() => {
    if (!accessToken || !user) return;
    fetch(`/api/tutors/active/${user.id}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
      .then(r => r.ok ? r.json() : [])
      .then(data => {
        const subs = Array.isArray(data) ? data : [];
        setActiveTutors(subs.map((s: any) => s.tutorSku));
      })
      .catch(() => {})
      .finally(() => setLoadingTutors(false));
  }, [accessToken, user]);

  if (loading || !user) return null;

  // Filter to tutors that fit this learner's age tier (e.g. K-5 hides
  // Chrono / Lingua / Forge / Compass).
  const tutorEntries = getTutorsForTier(tierCtx?.theme.id ?? null) as [TutorKey, typeof TUTORS[TutorKey]][];
  const isActive = (key: string) => activeTutors.some(sku => sku.toLowerCase().includes(key.toLowerCase()));

  const filtered = tutorEntries.filter(([key]) => {
    if (filter === "active") return isActive(key);
    if (filter === "locked") return !isActive(key);
    return true;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <Link href="/dashboard/learner" className="text-sm text-primary hover:underline font-semibold mb-2 inline-block">← {tCommon("back")}</Link>
            <h1 className="text-3xl font-heading font-bold text-slate-900">{t("my_tutors")}</h1>
            <p className="text-sm text-slate-500 mt-1">{t("tutors_description")}</p>
          </div>
          <div className="flex gap-1 bg-slate-100 rounded-xl p-1">
            {(["all", "active", "locked"] as const).map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition capitalize ${filter === f ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"}`}>
                {f}
              </button>
            ))}
          </div>
        </div>

        {loadingTutors ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-slate-100">
            <div className="animate-pulse text-slate-400">{tCommon("loading")}</div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map(([key, tutor]) => {
              const active = isActive(key);
              return (
                <Link key={key} href={`/dashboard/learner/tutors/${key}`}
                  className={`group rounded-2xl border-2 overflow-hidden transition hover:shadow-lg ${active ? "border-primary/30 bg-white" : "border-slate-200 bg-slate-50/50 opacity-70 hover:opacity-100"}`}>
                  <div className="p-5">
                    <div className="flex items-center gap-4 mb-3">
                      <Image src={tutor.avatar} alt={tutor.name} width={56} height={56} className="rounded-xl shadow-sm" />
                      <div>
                        <h3 className="font-heading font-bold text-slate-900 group-hover:text-primary transition">{tutor.name}</h3>
                        <p className="text-xs text-slate-500">{tutor.domain}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className={`px-2 py-0.5 text-xs rounded-full font-semibold ${tutor.tier === "core" ? "bg-[hsl(var(--visual-reading)/0.12)] text-[hsl(var(--visual-reading))]" : "bg-[hsl(var(--visual-sel)/0.18)] text-[hsl(var(--visual-sel))]"}`}>
                        {tutor.tier}
                      </span>
                      {active ? (
                        <span className="px-2 py-0.5 text-xs rounded-full bg-[hsl(var(--visual-science)/0.14)] text-[hsl(var(--visual-science))] font-semibold">Active</span>
                      ) : (
                        <span className="px-2 py-0.5 text-xs rounded-full bg-slate-200 text-slate-500 font-semibold">Locked</span>
                      )}
                    </div>
                  </div>
                  <div className="h-1" style={{ backgroundColor: tutor.color }} />
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
