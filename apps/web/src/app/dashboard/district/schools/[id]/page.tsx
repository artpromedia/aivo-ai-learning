"use client";
import { useAuth } from "@/providers/auth-provider";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

interface SchoolDetail {
  school: any;
  learners: any[];
  staff: any[];
  classrooms: any[];
  learnerCount: number;
}

export default function SchoolDetailPage() {
  const { accessToken } = useAuth();
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<SchoolDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"overview" | "learners" | "staff" | "classrooms">("overview");

  useEffect(() => {
    if (!accessToken || !id) return;
    fetch(`/api/district/schools/${id}`, { headers: { Authorization: `Bearer ${accessToken}` } })
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

  if (!data?.school) {
    return (
      <div className="p-8">
        <p className="text-slate-500">School not found.</p>
        <Link href="/dashboard/district/schools" className="text-violet-600 text-sm mt-2 inline-block">Back to Schools</Link>
      </div>
    );
  }

  const s = data.school;
  const tabs = [
    { key: "overview" as const, label: "Overview" },
    { key: "learners" as const, label: `Learners (${data.learners.length})` },
    { key: "staff" as const, label: `Staff (${data.staff.length})` },
    { key: "classrooms" as const, label: `Classrooms (${data.classrooms.length})` },
  ];

  return (
    <div className="p-8 space-y-6">
      <header>
        <Link href="/dashboard/district/schools" className="text-sm text-violet-600 hover:underline mb-2 inline-block">&larr; Back to Schools</Link>
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-violet-100 rounded-xl flex items-center justify-center text-2xl">🏫</div>
          <div>
            <h1 className="text-2xl font-heading font-bold text-slate-900">{s.name}</h1>
            <p className="text-sm text-slate-500">{[s.city, s.state].filter(Boolean).join(", ") || "No location set"}</p>
          </div>
          <span className={`px-2.5 py-0.5 text-xs rounded-full font-semibold ${s.status === "active" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
            {s.status}
          </span>
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
            <h3 className="text-lg font-semibold text-slate-900">School Info</h3>
            <InfoRow label="Address" value={s.address || "—"} />
            <InfoRow label="Phone" value={s.phone || "—"} />
            <InfoRow label="Principal" value={s.principalName || "—"} />
            <InfoRow label="Principal Email" value={s.principalEmail || "—"} />
            <InfoRow label="Capacity" value={s.enrollmentCapacity?.toString() || "—"} />
            <InfoRow label="Grade Levels" value={s.gradeLevels?.join(", ") || "—"} />
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-3">
            <h3 className="text-lg font-semibold text-slate-900">Summary</h3>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="bg-violet-50 rounded-xl p-4">
                <p className="text-2xl font-bold text-violet-700">{data.learnerCount}</p>
                <p className="text-xs text-slate-500 mt-1">Learners</p>
              </div>
              <div className="bg-blue-50 rounded-xl p-4">
                <p className="text-2xl font-bold text-blue-700">{data.staff.length}</p>
                <p className="text-xs text-slate-500 mt-1">Staff</p>
              </div>
              <div className="bg-emerald-50 rounded-xl p-4">
                <p className="text-2xl font-bold text-emerald-700">{data.classrooms.length}</p>
                <p className="text-xs text-slate-500 mt-1">Classrooms</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === "learners" && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-400 bg-slate-50/50 border-b border-slate-100">
                <th className="px-5 py-3 font-semibold">Name</th>
                <th className="px-5 py-3 font-semibold">Grade</th>
                <th className="px-5 py-3 font-semibold">Functioning Level</th>
                <th className="px-5 py-3 font-semibold">Enrolled</th>
              </tr>
            </thead>
            <tbody>
              {data.learners.map((l: any) => (
                <tr key={l.id} className="border-b border-slate-50 hover:bg-violet-50/30 transition">
                  <td className="px-5 py-3">
                    <Link href={`/dashboard/district/learners/${l.id}`} className="font-medium text-slate-900 hover:text-violet-600">{l.name}</Link>
                  </td>
                  <td className="px-5 py-3 text-slate-500">{l.gradeLevel || "—"}</td>
                  <td className="px-5 py-3">
                    <span className="px-2.5 py-0.5 text-xs rounded-full font-semibold bg-violet-100 text-violet-700">
                      {l.functioningLevel?.replace(/_/g, " ")}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-slate-400">{new Date(l.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
              {data.learners.length === 0 && (
                <tr><td colSpan={4} className="px-5 py-10 text-center text-slate-400">No learners enrolled</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {tab === "staff" && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-400 bg-slate-50/50 border-b border-slate-100">
                <th className="px-5 py-3 font-semibold">Name</th>
                <th className="px-5 py-3 font-semibold">Email</th>
                <th className="px-5 py-3 font-semibold">Role</th>
                <th className="px-5 py-3 font-semibold">Assigned</th>
              </tr>
            </thead>
            <tbody>
              {data.staff.map((u: any) => (
                <tr key={u.id} className="border-b border-slate-50 hover:bg-violet-50/30 transition">
                  <td className="px-5 py-3">
                    <Link href={`/dashboard/district/staff/${u.id}`} className="font-medium text-slate-900 hover:text-violet-600">{u.name}</Link>
                  </td>
                  <td className="px-5 py-3 text-slate-500">{u.email || "—"}</td>
                  <td className="px-5 py-3">
                    <span className="px-2.5 py-0.5 text-xs rounded-full font-semibold bg-green-100 text-green-700">
                      {u.role?.replace(/_/g, " ")}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-slate-400">{u.assignedAt ? new Date(u.assignedAt).toLocaleDateString() : "—"}</td>
                </tr>
              ))}
              {data.staff.length === 0 && (
                <tr><td colSpan={4} className="px-5 py-10 text-center text-slate-400">No staff assigned</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {tab === "classrooms" && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-400 bg-slate-50/50 border-b border-slate-100">
                <th className="px-5 py-3 font-semibold">Name</th>
                <th className="px-5 py-3 font-semibold">Grade</th>
                <th className="px-5 py-3 font-semibold">Subject</th>
                <th className="px-5 py-3 font-semibold">Capacity</th>
              </tr>
            </thead>
            <tbody>
              {data.classrooms.map((c: any) => (
                <tr key={c.id} className="border-b border-slate-50 hover:bg-violet-50/30 transition">
                  <td className="px-5 py-3 font-medium text-slate-900">{c.name}</td>
                  <td className="px-5 py-3 text-slate-500">{c.gradeLevel || "—"}</td>
                  <td className="px-5 py-3 text-slate-500">{c.subject || "—"}</td>
                  <td className="px-5 py-3 text-slate-400">{c.capacity || "—"}</td>
                </tr>
              ))}
              {data.classrooms.length === 0 && (
                <tr><td colSpan={4} className="px-5 py-10 text-center text-slate-400">No classrooms created</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 py-2 px-3 rounded-lg bg-slate-50">
      <span className="text-xs text-slate-400 font-medium w-28">{label}</span>
      <span className="text-sm text-slate-700">{value}</span>
    </div>
  );
}
