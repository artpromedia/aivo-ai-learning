"use client";
import { useAuth } from "@/providers/auth-provider";
import { useEffect, useState } from "react";

interface Classroom {
  id: string;
  name: string;
  gradeLevel?: string;
  subject?: string;
  capacity?: number;
  schoolId: string;
  schoolName?: string;
  createdAt: string;
}

export default function DistrictClassroomsPage() {
  const { accessToken } = useAuth();
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [schools, setSchools] = useState<{ id: string; name: string }[]>([]);
  const [schoolFilter, setSchoolFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  const loadClassrooms = () => {
    if (!accessToken) return;
    const qs = schoolFilter ? `?schoolId=${schoolFilter}` : "";
    fetch(`/api/district/classrooms${qs}`, { headers: { Authorization: `Bearer ${accessToken}` } })
      .then((r) => r.ok ? r.json() : { classrooms: [] })
      .then((data) => setClassrooms(data.classrooms || []))
      .catch(() => setClassrooms([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadClassrooms(); }, [accessToken, schoolFilter]);

  useEffect(() => {
    if (!accessToken) return;
    fetch("/api/district/schools", { headers: { Authorization: `Bearer ${accessToken}` } })
      .then((r) => r.ok ? r.json() : { schools: [] })
      .then((data) => setSchools(data.schools?.map((s: any) => ({ id: s.id, name: s.name })) || []));
  }, [accessToken]);

  return (
    <div className="p-8 space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold text-slate-900">Classrooms</h1>
          <p className="text-sm text-slate-500 mt-1">Manage classroom assignments across all schools.</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="px-4 py-2 bg-violet-600 text-white rounded-xl text-sm font-semibold hover:bg-violet-700 transition shadow-sm"
        >
          + Add Classroom
        </button>
      </header>

      <div className="flex items-center gap-3">
        <select
          value={schoolFilter}
          onChange={(e) => setSchoolFilter(e.target.value)}
          className="px-3 py-2 rounded-xl border border-slate-200 text-sm text-slate-600 focus:border-violet-400 outline-none"
        >
          <option value="">All Schools</option>
          {schools.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <span className="text-sm text-slate-400">{classrooms.length} classrooms</span>
      </div>

      {loading ? (
        <div className="animate-pulse space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-14 bg-slate-200 rounded-xl" />)}
        </div>
      ) : classrooms.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <span className="text-4xl mb-4 block">🏠</span>
          <p className="text-slate-600 font-medium">No classrooms found</p>
          <p className="text-sm text-slate-400 mt-1">Create classrooms and assign them to schools.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-400 bg-slate-50/50 border-b border-slate-100">
                <th className="px-5 py-3 font-semibold">Classroom</th>
                <th className="px-5 py-3 font-semibold">School</th>
                <th className="px-5 py-3 font-semibold">Grade</th>
                <th className="px-5 py-3 font-semibold">Subject</th>
                <th className="px-5 py-3 font-semibold">Capacity</th>
              </tr>
            </thead>
            <tbody>
              {classrooms.map((c) => (
                <tr key={c.id} className="border-b border-slate-50 hover:bg-violet-50/30 transition">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center text-sm">🏠</div>
                      <span className="font-medium text-slate-900">{c.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-slate-500 text-xs">{c.schoolName || "—"}</td>
                  <td className="px-5 py-3 text-slate-500">{c.gradeLevel || "—"}</td>
                  <td className="px-5 py-3 text-slate-500">{c.subject || "—"}</td>
                  <td className="px-5 py-3 text-slate-400">{c.capacity || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showCreate && (
        <CreateClassroomModal
          accessToken={accessToken!}
          schools={schools}
          onClose={() => setShowCreate(false)}
          onCreated={() => { setShowCreate(false); loadClassrooms(); }}
        />
      )}
    </div>
  );
}

function CreateClassroomModal({ accessToken, schools, onClose, onCreated }: {
  accessToken: string; schools: { id: string; name: string }[]; onClose: () => void; onCreated: () => void;
}) {
  const [name, setName] = useState("");
  const [schoolId, setSchoolId] = useState(schools[0]?.id || "");
  const [gradeLevel, setGradeLevel] = useState("");
  const [subject, setSubject] = useState("");
  const [capacity, setCapacity] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !schoolId) { setError("Classroom name and school are required"); return; }
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/district/classrooms", {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          schoolId, name: name.trim(),
          gradeLevel: gradeLevel.trim() || undefined,
          subject: subject.trim() || undefined,
          capacity: capacity ? parseInt(capacity) : undefined,
        }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || "Failed to create classroom"); }
      onCreated();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-heading font-semibold text-slate-900">Add Classroom</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl">&times;</button>
        </div>
        {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-1">
            <label className="text-xs text-slate-500 font-medium">Classroom Name *</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Room 101" className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:border-violet-400 focus:ring-2 focus:ring-violet-100 outline-none" />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-slate-500 font-medium">School *</label>
            <select value={schoolId} onChange={(e) => setSchoolId(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:border-violet-400 outline-none">
              {schools.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="text-xs text-slate-500 font-medium">Grade</label>
              <input type="text" value={gradeLevel} onChange={(e) => setGradeLevel(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:border-violet-400 outline-none" />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-slate-500 font-medium">Subject</label>
              <input type="text" value={subject} onChange={(e) => setSubject(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:border-violet-400 outline-none" />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-slate-500 font-medium">Capacity</label>
              <input type="number" value={capacity} onChange={(e) => setCapacity(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:border-violet-400 outline-none" />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 border border-slate-200 rounded-xl text-sm text-slate-600 hover:bg-slate-50">Cancel</button>
            <button type="submit" disabled={saving} className="flex-1 px-4 py-2 bg-violet-600 text-white rounded-xl text-sm font-semibold hover:bg-violet-700 disabled:opacity-50">
              {saving ? "Creating..." : "Create Classroom"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
