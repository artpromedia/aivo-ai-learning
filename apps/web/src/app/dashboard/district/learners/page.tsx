"use client";
import { useAuth } from "@/providers/auth-provider";
import { useEffect, useState } from "react";

interface Learner {
  id: string;
  name: string;
  functioningLevel: string;
  gradeLevel: string;
  curriculumFramework?: string;
  createdAt: string;
}

const FL_COLORS: Record<string, string> = {
  STANDARD: "bg-emerald-100 text-emerald-700",
  SUPPORTED: "bg-blue-100 text-blue-700",
  LOW_VERBAL: "bg-amber-100 text-amber-700",
  NON_VERBAL: "bg-orange-100 text-orange-700",
  PRE_SYMBOLIC: "bg-red-100 text-red-700",
};

export default function DistrictLearnersPage() {
  const { accessToken } = useAuth();
  const [learners, setLearners] = useState<Learner[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!accessToken) return;
    fetch("/api/admin/learners", { headers: { Authorization: `Bearer ${accessToken}` } })
      .then((r) => r.ok ? r.json() : [])
      .then((data) => setLearners(Array.isArray(data) ? data : []))
      .catch(() => setLearners([]))
      .finally(() => setLoading(false));
  }, [accessToken]);

  const filtered = search
    ? learners.filter((l) => l.name.toLowerCase().includes(search.toLowerCase()))
    : learners;

  return (
    <div className="p-8 space-y-6">
      <header>
        <h1 className="text-2xl font-heading font-bold text-slate-900">Learners</h1>
        <p className="text-sm text-slate-500 mt-1">Browse enrolled learners, view progress, and manage accommodations.</p>
      </header>

      <div className="flex items-center gap-4">
        <input
          type="text"
          placeholder="Search learners..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="px-4 py-2 rounded-xl border border-slate-200 text-sm w-80 focus:border-violet-400 focus:ring-2 focus:ring-violet-100 outline-none"
        />
        <span className="text-sm text-slate-400">{filtered.length} learners</span>
      </div>

      {loading ? (
        <div className="animate-pulse space-y-3">
          {[1, 2, 3, 4, 5].map((i) => <div key={i} className="h-14 bg-slate-200 rounded-xl" />)}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-400 bg-slate-50/50 border-b border-slate-100">
                <th className="px-5 py-3 font-semibold">Learner</th>
                <th className="px-5 py-3 font-semibold">Grade</th>
                <th className="px-5 py-3 font-semibold">Functioning Level</th>
                <th className="px-5 py-3 font-semibold">Curriculum</th>
                <th className="px-5 py-3 font-semibold">Enrolled</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((l) => (
                <tr key={l.id} className="border-b border-slate-50 hover:bg-violet-50/30 transition">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-400 to-purple-500 flex items-center justify-center text-white text-xs font-bold">
                        {l.name.charAt(0)}
                      </div>
                      <span className="font-medium text-slate-900">{l.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-slate-500">{l.gradeLevel || "—"}</td>
                  <td className="px-5 py-3">
                    <span className={`px-2.5 py-0.5 text-xs rounded-full font-semibold ${FL_COLORS[l.functioningLevel] || "bg-slate-100 text-slate-600"}`}>
                      {l.functioningLevel.replace(/_/g, " ")}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-slate-500 text-xs">{l.curriculumFramework || "—"}</td>
                  <td className="px-5 py-3 text-slate-400">{new Date(l.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-10 text-center text-slate-400">No learners found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
