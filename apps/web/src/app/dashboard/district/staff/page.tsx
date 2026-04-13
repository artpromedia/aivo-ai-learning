"use client";
import { useAuth } from "@/providers/auth-provider";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

interface User {
  id: string;
  name: string;
  email: string | null;
  role: string;
  createdAt: string;
}

const STAFF_ROLES = ["TEACHER", "THERAPIST", "CAREGIVER"];

const ROLE_COLORS: Record<string, string> = {
  TEACHER: "bg-green-100 text-green-700",
  THERAPIST: "bg-amber-100 text-amber-700",
  CAREGIVER: "bg-blue-100 text-blue-700",
};

export default function DistrictStaffPage() {
  const { accessToken } = useAuth();
  const t = useTranslations("districtAdmin");
  const tc = useTranslations("common");
  const [staff, setStaff] = useState<User[]>([]);
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!accessToken) return;
    setLoading(true);

    const fetches = STAFF_ROLES.map((role) =>
      fetch(`/api/admin/users?role=${role}&limit=100`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      }).then((r) => r.ok ? r.json() : [])
    );

    Promise.all(fetches)
      .then((results) => {
        const all = results.flat().filter(Array.isArray(results) ? Boolean : () => true);
        setStaff(all);
      })
      .catch(() => setStaff([]))
      .finally(() => setLoading(false));
  }, [accessToken]);

  const filtered = staff
    .filter((u) => roleFilter === "ALL" || u.role === roleFilter)
    .filter((u) =>
      !search || u.name?.toLowerCase().includes(search.toLowerCase()) || u.email?.toLowerCase().includes(search.toLowerCase())
    );

  const roleCounts = STAFF_ROLES.reduce((acc, role) => {
    acc[role] = staff.filter((u) => u.role === role).length;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="p-8 space-y-6">
      <header>
        <h1 className="text-2xl font-heading font-bold text-slate-900">{t("staff")}</h1>
        <p className="text-sm text-slate-500 mt-1">Manage teachers, therapists, and caregivers across your district.</p>
      </header>

      <div className="grid grid-cols-3 gap-3">
        {STAFF_ROLES.map((role) => (
          <button
            key={role}
            onClick={() => setRoleFilter(roleFilter === role ? "ALL" : role)}
            className={`p-4 rounded-xl border text-center transition ${
              roleFilter === role
                ? "border-violet-300 bg-violet-50 shadow-sm"
                : "border-slate-200 bg-white hover:border-slate-300"
            }`}
          >
            <p className="text-2xl font-bold text-slate-900">{roleCounts[role] ?? 0}</p>
            <p className="text-xs font-semibold text-slate-500 mt-0.5">{role === "TEACHER" ? "Teachers" : role === "THERAPIST" ? "Therapists" : "Caregivers"}</p>
          </button>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <input
          type="text"
          placeholder="Search by name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="px-4 py-2 rounded-xl border border-slate-200 text-sm w-80 focus:border-violet-400 focus:ring-2 focus:ring-violet-100 outline-none"
        />
        <span className="text-sm text-slate-400">{filtered.length} staff</span>
      </div>

      {loading ? (
        <div className="animate-pulse space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-14 bg-slate-200 rounded-xl" />)}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-400 bg-slate-50/50 border-b border-slate-100">
                <th className="px-5 py-3 font-semibold">{tc("name")}</th>
                <th className="px-5 py-3 font-semibold">{tc("email")}</th>
                <th className="px-5 py-3 font-semibold">{tc("role")}</th>
                <th className="px-5 py-3 font-semibold">Joined</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => (
                <tr key={u.id} className="border-b border-slate-50 hover:bg-violet-50/30 transition">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center text-white text-xs font-bold">
                        {u.name?.charAt(0) || "?"}
                      </div>
                      <span className="font-medium text-slate-900">{u.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-slate-500">{u.email || "—"}</td>
                  <td className="px-5 py-3">
                    <span className={`px-2.5 py-0.5 text-xs rounded-full font-semibold ${ROLE_COLORS[u.role] || "bg-slate-100 text-slate-600"}`}>
                      {u.role.replace(/_/g, " ")}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-slate-400">{new Date(u.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-5 py-10 text-center text-slate-400">No staff found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
