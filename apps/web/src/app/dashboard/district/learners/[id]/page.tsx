"use client";
import { useAuth } from "@/providers/auth-provider";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

const FL_COLORS: Record<string, string> = {
  STANDARD: "bg-emerald-100 text-emerald-700",
  SUPPORTED: "bg-blue-100 text-blue-700",
  LOW_VERBAL: "bg-amber-100 text-amber-700",
  NON_VERBAL: "bg-orange-100 text-orange-700",
  PRE_SYMBOLIC: "bg-red-100 text-red-700",
};

export default function LearnerDetailPage() {
  const { accessToken } = useAuth();
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"overview" | "iep" | "interventions" | "sensory">("overview");

  useEffect(() => {
    if (!accessToken || !id) return;
    fetch(`/api/district/learners/${id}`, { headers: { Authorization: `Bearer ${accessToken}` } })
      .then((r) => r.ok ? r.json() : null)
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [accessToken, id]);

  if (loading) {
    return (
      <div className="p-8 animate-pulse space-y-4">
        <div className="h-8 bg-slate-200 rounded-lg w-64" />
        <div className="h-64 bg-slate-200 rounded-2xl" />
      </div>
    );
  }

  if (!data?.learner) {
    return (
      <div className="p-8">
        <p className="text-slate-500">Learner not found.</p>
        <Link href="/dashboard/district/learners" className="text-violet-600 text-sm mt-2 inline-block">Back to Learners</Link>
      </div>
    );
  }

  const l = data.learner;
  const tabs = [
    { key: "overview" as const, label: "Overview" },
    { key: "iep" as const, label: `IEP (${data.ieps?.length || 0})` },
    { key: "interventions" as const, label: `Interventions (${data.interventions?.length || 0})` },
    { key: "sensory" as const, label: "Sensory Profile" },
  ];

  return (
    <div className="p-8 space-y-6">
      <header>
        <Link href="/dashboard/district/learners" className="text-sm text-violet-600 hover:underline mb-2 inline-block">&larr; Back to Learners</Link>
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-violet-400 to-purple-500 flex items-center justify-center text-white text-xl font-bold">
            {l.name?.charAt(0)}
          </div>
          <div>
            <h1 className="text-2xl font-heading font-bold text-slate-900">{l.name}</h1>
            <div className="flex items-center gap-2 mt-0.5">
              {l.gradeLevel && <span className="text-sm text-slate-500">Grade {l.gradeLevel}</span>}
              <span className={`px-2.5 py-0.5 text-xs rounded-full font-semibold ${FL_COLORS[l.functioningLevel] || "bg-slate-100 text-slate-600"}`}>
                {l.functioningLevel?.replace(/_/g, " ")}
              </span>
            </div>
          </div>
        </div>
      </header>

      <div className="flex gap-1 border-b border-slate-200">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition ${
              tab === t.key ? "border-violet-500 text-violet-700" : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "overview" && (
        <div className="grid gap-4 md:grid-cols-2">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-3">
            <h3 className="text-lg font-semibold text-slate-900">Learner Info</h3>
            <InfoRow label="Name" value={l.name} />
            <InfoRow label="Grade" value={l.gradeLevel || "—"} />
            <InfoRow label="Functioning Level" value={l.functioningLevel?.replace(/_/g, " ") || "—"} />
            <InfoRow label="Curriculum" value={l.curriculumFramework || "—"} />
            <InfoRow label="Enrolled" value={new Date(l.createdAt).toLocaleDateString()} />
          </div>
          <div className="space-y-4">
            {data.school && (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-3">
                <h3 className="text-lg font-semibold text-slate-900">School</h3>
                <Link href={`/dashboard/district/schools/${data.school.id}`} className="text-violet-600 hover:underline text-sm font-medium">
                  {data.school.name}
                </Link>
              </div>
            )}
            {data.parent && (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-3">
                <h3 className="text-lg font-semibold text-slate-900">Parent / Guardian</h3>
                <InfoRow label="Name" value={data.parent.name || "—"} />
                <InfoRow label="Email" value={data.parent.email || "—"} />
              </div>
            )}
          </div>
        </div>
      )}

      {tab === "iep" && (
        <div className="space-y-4">
          {(data.ieps || []).length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center">
              <span className="text-3xl block mb-2">📋</span>
              <p className="text-slate-500">No IEP records found for this learner.</p>
            </div>
          ) : (
            data.ieps.map((iep: any) => (
              <div key={iep.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-semibold text-slate-900">IEP Record</h3>
                  <span className={`px-2.5 py-0.5 text-xs rounded-full font-semibold ${
                    iep.status === "active" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"
                  }`}>
                    {iep.status}
                  </span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <InfoRow label="Start Date" value={iep.startDate || "—"} />
                  <InfoRow label="Review Date" value={iep.reviewDate || "—"} />
                  <InfoRow label="Disability" value={iep.disabilityCategory || "—"} />
                  <InfoRow label="Placement" value={iep.placement || "—"} />
                </div>
                {iep.goals?.length > 0 && (
                  <div>
                    <p className="text-xs text-slate-500 font-medium mb-1">Goals ({iep.goals.length})</p>
                    <ul className="space-y-1">
                      {iep.goals.map((g: any, i: number) => (
                        <li key={i} className="text-sm text-slate-600 bg-slate-50 rounded-lg px-3 py-2">{typeof g === "string" ? g : g.description || JSON.stringify(g)}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {tab === "interventions" && (
        <div className="space-y-4">
          {(data.interventions || []).length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center">
              <span className="text-3xl block mb-2">🎯</span>
              <p className="text-slate-500">No interventions found for this learner.</p>
            </div>
          ) : (
            data.interventions.map((iv: any) => (
              <div key={iv.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-semibold text-slate-900">{iv.type}</h3>
                    <span className="px-2 py-0.5 text-xs rounded-full bg-blue-100 text-blue-700 font-semibold">Tier {iv.tier}</span>
                  </div>
                  <span className={`px-2.5 py-0.5 text-xs rounded-full font-semibold ${
                    iv.status === "active" ? "bg-emerald-100 text-emerald-700" : iv.status === "completed" ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-500"
                  }`}>
                    {iv.status}
                  </span>
                </div>
                {iv.description && <p className="text-sm text-slate-600">{iv.description}</p>}
                <div className="grid grid-cols-2 gap-3">
                  <InfoRow label="Start" value={iv.startDate || "—"} />
                  <InfoRow label="End" value={iv.endDate || "Ongoing"} />
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {tab === "sensory" && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          {data.sensoryProfile ? (
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-slate-900">Sensory Profile</h3>
              <pre className="text-xs text-slate-600 bg-slate-50 rounded-xl p-4 overflow-auto">{JSON.stringify(data.sensoryProfile, null, 2)}</pre>
            </div>
          ) : (
            <div className="text-center py-8">
              <span className="text-3xl block mb-2">🧠</span>
              <p className="text-slate-500">No sensory profile configured for this learner.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 py-2 px-3 rounded-lg bg-slate-50">
      <span className="text-xs text-slate-400 font-medium w-24">{label}</span>
      <span className="text-sm text-slate-700">{value}</span>
    </div>
  );
}
