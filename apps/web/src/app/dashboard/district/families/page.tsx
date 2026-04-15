"use client";
import { useAuth } from "@/providers/auth-provider";
import { useEffect, useState } from "react";
import Link from "next/link";

interface Family {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  lastLoginAt?: string;
  learners: { id: string; name: string }[];
  learnerCount: number;
}

export default function DistrictFamiliesPage() {
  const { accessToken } = useAuth();
  const [families, setFamilies] = useState<Family[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!accessToken) return;
    const qs = search ? `?search=${encodeURIComponent(search)}` : "";
    fetch(`/api/district/families${qs}`, { headers: { Authorization: `Bearer ${accessToken}` } })
      .then((r) => r.ok ? r.json() : { families: [] })
      .then((data) => setFamilies(data.families || []))
      .catch(() => setFamilies([]))
      .finally(() => setLoading(false));
  }, [accessToken, search]);

  return (
    <div className="p-8 space-y-6">
      <header>
        <h1 className="text-2xl font-heading font-bold text-slate-900">Parents & Families</h1>
        <p className="text-sm text-slate-500 mt-1">View parent accounts and their linked learners across the district.</p>
      </header>

      <div className="flex items-center gap-4">
        <input
          type="text"
          placeholder="Search by name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="px-4 py-2 rounded-xl border border-slate-200 text-sm w-80 focus:border-violet-400 focus:ring-2 focus:ring-violet-100 outline-none"
        />
        <span className="text-sm text-slate-400">{families.length} families</span>
      </div>

      {loading ? (
        <div className="animate-pulse space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-20 bg-slate-200 rounded-2xl" />)}
        </div>
      ) : families.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <span className="text-4xl mb-4 block">👨‍👩‍👧</span>
          <p className="text-slate-600 font-medium">No families found</p>
          <p className="text-sm text-slate-400 mt-1">Parent accounts will appear here once learners are enrolled.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-400 bg-slate-50/50 border-b border-slate-100">
                <th className="px-5 py-3 font-semibold">Parent</th>
                <th className="px-5 py-3 font-semibold">Email</th>
                <th className="px-5 py-3 font-semibold">Learners</th>
                <th className="px-5 py-3 font-semibold">Last Login</th>
              </tr>
            </thead>
            <tbody>
              {families.map((f) => (
                <tr key={f.id} className="border-b border-slate-50 hover:bg-violet-50/30 transition">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-400 to-rose-500 flex items-center justify-center text-white text-xs font-bold">
                        {f.name?.charAt(0) || "?"}
                      </div>
                      <span className="font-medium text-slate-900">{f.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-slate-500">{f.email}</td>
                  <td className="px-5 py-3">
                    {f.learners.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {f.learners.map((l) => (
                          <Link key={l.id} href={`/dashboard/district/learners/${l.id}`} className="px-2 py-0.5 text-xs rounded-full bg-violet-100 text-violet-700 font-medium hover:bg-violet-200">
                            {l.name}
                          </Link>
                        ))}
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400">No learners</span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-slate-400 text-xs">
                    {f.lastLoginAt ? new Date(f.lastLoginAt).toLocaleDateString() : "Never"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
