"use client";
import { useAuth } from "@/providers/auth-provider";
import { useEffect, useState } from "react";

interface User {
  id: string;
  name: string;
  email: string | null;
  role: string;
  tenantId: string | null;
  createdAt: string;
}

const ROLE_COLORS: Record<string, string> = {
  PARENT: "bg-purple-100 text-purple-700",
  LEARNER: "bg-cyan-100 text-cyan-700",
  TEACHER: "bg-green-100 text-green-700",
  THERAPIST: "bg-amber-100 text-amber-700",
  CAREGIVER: "bg-blue-100 text-blue-700",
  PLATFORM_ADMIN: "bg-red-100 text-red-700",
  DISTRICT_ADMIN: "bg-orange-100 text-orange-700",
};

const ROLES = ["ALL", "PARENT", "LEARNER", "TEACHER", "CAREGIVER", "THERAPIST", "PLATFORM_ADMIN", "DISTRICT_ADMIN"];

export default function AdminUsersPage() {
  const { accessToken } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!accessToken) return;
    setLoading(true);
    const params = roleFilter !== "ALL" ? `?role=${roleFilter}&limit=200` : "?limit=200";
    fetch(`/api/admin/users${params}`, { headers: { Authorization: `Bearer ${accessToken}` } })
      .then((r) => r.ok ? r.json() : [])
      .then((data) => setUsers(Array.isArray(data) ? data : []))
      .catch(() => setUsers([]))
      .finally(() => setLoading(false));
  }, [accessToken, roleFilter]);

  const filtered = search
    ? users.filter((u) =>
        u.name?.toLowerCase().includes(search.toLowerCase()) ||
        u.email?.toLowerCase().includes(search.toLowerCase())
      )
    : users;

  const roleCounts = ROLES.slice(1).reduce((acc, role) => {
    acc[role] = users.filter((u) => u.role === role).length;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold text-slate-900">Users & Roles</h1>
        <p className="text-sm text-slate-500 mt-1">Manage all platform users, roles, and access controls.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        {ROLES.slice(1).map((role) => (
          <button
            key={role}
            onClick={() => setRoleFilter(roleFilter === role ? "ALL" : role)}
            className={`p-3 rounded-xl border text-center transition ${
              roleFilter === role
                ? "border-purple-300 bg-purple-50 shadow-sm"
                : "border-slate-200 bg-white hover:border-slate-300"
            }`}
          >
            <p className="text-lg font-bold text-slate-900">{roleCounts[role] ?? 0}</p>
            <p className="text-[10px] font-semibold text-slate-500 mt-0.5">{role.replace(/_/g, " ")}</p>
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex flex-col md:flex-row gap-3 items-center justify-between">
          <div className="flex items-center gap-3 w-full md:w-auto">
            <input
              type="text"
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="px-4 py-2 rounded-lg border border-slate-200 text-sm w-full md:w-80 focus:border-primary focus:ring-2 focus:ring-purple-100 outline-none"
            />
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-3 py-2 rounded-lg border border-slate-200 text-sm bg-white"
            >
              {ROLES.map((r) => (
                <option key={r} value={r}>{r === "ALL" ? "All Roles" : r.replace(/_/g, " ")}</option>
              ))}
            </select>
          </div>
          <p className="text-sm text-slate-400">{filtered.length} users</p>
        </div>

        {loading ? (
          <div className="p-10 text-center text-slate-400 animate-pulse">Loading users...</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-400 border-b border-slate-100 bg-slate-50/50">
                <th className="px-5 py-3 font-semibold">User</th>
                <th className="px-5 py-3 font-semibold">Email</th>
                <th className="px-5 py-3 font-semibold">Role</th>
                <th className="px-5 py-3 font-semibold">Joined</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => (
                <tr key={u.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
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
                  <td colSpan={4} className="px-5 py-10 text-center text-slate-400">No users found</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
