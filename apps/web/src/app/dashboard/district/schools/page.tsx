"use client";
import { useAuth } from "@/providers/auth-provider";
import { useEffect, useState } from "react";
import Link from "next/link";

interface School {
  id: string;
  name: string;
  address?: string;
  city?: string;
  state?: string;
  status: string;
  principalName?: string;
  principalEmail?: string;
  enrollmentCapacity?: number;
  gradeLevels: string[];
  learnerCount: number;
  staffCount: number;
  createdAt: string;
}

export default function DistrictSchoolsPage() {
  const { accessToken } = useAuth();
  const [schools, setSchools] = useState<School[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  const loadSchools = () => {
    if (!accessToken) return;
    const qs = search ? `?search=${encodeURIComponent(search)}` : "";
    fetch(`/api/district/schools${qs}`, { headers: { Authorization: `Bearer ${accessToken}` } })
      .then((r) => r.ok ? r.json() : { schools: [] })
      .then((data) => setSchools(data.schools || []))
      .catch(() => setSchools([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadSchools(); }, [accessToken, search]);

  return (
    <div className="p-8 space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold text-slate-900">Schools</h1>
          <p className="text-sm text-slate-500 mt-1">Manage schools and campuses within your district.</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="px-4 py-2 bg-violet-600 text-white rounded-xl text-sm font-semibold hover:bg-violet-700 transition shadow-sm"
        >
          + Add School
        </button>
      </header>

      <div className="flex items-center gap-4">
        <input
          type="text"
          placeholder="Search schools..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="px-4 py-2 rounded-xl border border-slate-200 text-sm w-80 focus:border-violet-400 focus:ring-2 focus:ring-violet-100 outline-none"
        />
        <span className="text-sm text-slate-400">{schools.length} schools</span>
      </div>

      {loading ? (
        <div className="animate-pulse space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-28 bg-slate-200 rounded-2xl" />)}
        </div>
      ) : schools.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <span className="text-4xl mb-4 block">🏫</span>
          <p className="text-slate-600 font-medium">No schools found</p>
          <p className="text-sm text-slate-400 mt-1">Add your first school to get started.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {schools.map((s) => (
            <Link key={s.id} href={`/dashboard/district/schools/${s.id}`} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 hover:shadow-md hover:border-violet-200 transition-all block">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-violet-100 rounded-xl flex items-center justify-center text-lg">🏫</div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-slate-900 truncate">{s.name}</h3>
                  <p className="text-xs text-slate-400">
                    {[s.city, s.state].filter(Boolean).join(", ") || "No location"}
                  </p>
                </div>
                <span className={`px-2 py-0.5 text-xs rounded-full font-semibold ${s.status === "active" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                  {s.status}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-slate-50 rounded-lg py-2">
                  <p className="text-lg font-bold text-slate-900">{s.learnerCount}</p>
                  <p className="text-[10px] text-slate-400 font-medium">Learners</p>
                </div>
                <div className="bg-slate-50 rounded-lg py-2">
                  <p className="text-lg font-bold text-slate-900">{s.staffCount}</p>
                  <p className="text-[10px] text-slate-400 font-medium">Staff</p>
                </div>
                <div className="bg-slate-50 rounded-lg py-2">
                  <p className="text-lg font-bold text-slate-900">{s.enrollmentCapacity ?? "—"}</p>
                  <p className="text-[10px] text-slate-400 font-medium">Capacity</p>
                </div>
              </div>
              {s.principalName && (
                <p className="text-xs text-slate-500 mt-3">Principal: {s.principalName}</p>
              )}
            </Link>
          ))}
        </div>
      )}

      {showCreate && (
        <CreateSchoolModal
          accessToken={accessToken!}
          onClose={() => setShowCreate(false)}
          onCreated={() => { setShowCreate(false); loadSchools(); }}
        />
      )}
    </div>
  );
}

function CreateSchoolModal({ accessToken, onClose, onCreated }: { accessToken: string; onClose: () => void; onCreated: () => void }) {
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [principalName, setPrincipalName] = useState("");
  const [principalEmail, setPrincipalEmail] = useState("");
  const [capacity, setCapacity] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { setError("School name is required"); return; }
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/district/schools", {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(), city: city.trim() || undefined, state: state.trim() || undefined,
          principalName: principalName.trim() || undefined, principalEmail: principalEmail.trim() || undefined,
          enrollmentCapacity: capacity ? parseInt(capacity) : undefined,
        }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || "Failed to create school"); }
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
          <h2 className="text-lg font-heading font-semibold text-slate-900">Add School</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl">&times;</button>
        </div>
        {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
        <form onSubmit={handleSubmit} className="space-y-3">
          <Field label="School Name *" value={name} onChange={setName} placeholder="e.g. Westside Elementary" />
          <div className="grid grid-cols-2 gap-3">
            <Field label="City" value={city} onChange={setCity} />
            <Field label="State" value={state} onChange={setState} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Principal Name" value={principalName} onChange={setPrincipalName} />
            <Field label="Principal Email" value={principalEmail} onChange={setPrincipalEmail} type="email" />
          </div>
          <Field label="Enrollment Capacity" value={capacity} onChange={setCapacity} type="number" />
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 border border-slate-200 rounded-xl text-sm text-slate-600 hover:bg-slate-50">Cancel</button>
            <button type="submit" disabled={saving} className="flex-1 px-4 py-2 bg-violet-600 text-white rounded-xl text-sm font-semibold hover:bg-violet-700 disabled:opacity-50">
              {saving ? "Creating..." : "Create School"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, placeholder, type = "text" }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string;
}) {
  return (
    <div className="space-y-1">
      <label className="text-xs text-slate-500 font-medium">{label}</label>
      <input
        type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:border-violet-400 focus:ring-2 focus:ring-violet-100 outline-none"
      />
    </div>
  );
}
