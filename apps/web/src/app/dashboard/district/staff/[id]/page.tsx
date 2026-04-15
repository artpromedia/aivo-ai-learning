"use client";
import { useAuth } from "@/providers/auth-provider";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

const ROLE_COLORS: Record<string, string> = {
  TEACHER: "bg-green-100 text-green-700",
  THERAPIST: "bg-amber-100 text-amber-700",
  CAREGIVER: "bg-blue-100 text-blue-700",
  DISTRICT_ADMIN: "bg-violet-100 text-violet-700",
};

export default function StaffDetailPage() {
  const { accessToken } = useAuth();
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!accessToken || !id) return;
    fetch(`/api/district/staff/${id}`, { headers: { Authorization: `Bearer ${accessToken}` } })
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

  if (!data?.user) {
    return (
      <div className="p-8">
        <p className="text-slate-500">Staff member not found.</p>
        <Link href="/dashboard/district/staff" className="text-violet-600 text-sm mt-2 inline-block">Back to Staff</Link>
      </div>
    );
  }

  const u = data.user;

  return (
    <div className="p-8 space-y-6">
      <header>
        <Link href="/dashboard/district/staff" className="text-sm text-violet-600 hover:underline mb-2 inline-block">&larr; Back to Staff</Link>
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center text-white text-xl font-bold">
            {u.name?.charAt(0) || "?"}
          </div>
          <div>
            <h1 className="text-2xl font-heading font-bold text-slate-900">{u.name}</h1>
            <div className="flex items-center gap-2 mt-0.5">
              <span className={`px-2.5 py-0.5 text-xs rounded-full font-semibold ${ROLE_COLORS[u.role] || "bg-slate-100 text-slate-600"}`}>
                {u.role?.replace(/_/g, " ")}
              </span>
              {u.deactivatedAt && (
                <span className="px-2.5 py-0.5 text-xs rounded-full font-semibold bg-red-100 text-red-700">Deactivated</span>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-3">
          <h3 className="text-lg font-semibold text-slate-900">Profile</h3>
          <InfoRow label="Name" value={u.name || "—"} />
          <InfoRow label="Email" value={u.email || "—"} />
          <InfoRow label="Role" value={u.role?.replace(/_/g, " ") || "—"} />
          <InfoRow label="Joined" value={u.createdAt ? new Date(u.createdAt).toLocaleDateString() : "—"} />
          <InfoRow label="Last Login" value={u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleDateString() : "Never"} />
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-3">
          <h3 className="text-lg font-semibold text-slate-900">School Assignments</h3>
          {data.schoolAssignments?.length > 0 ? (
            <div className="space-y-2">
              {data.schoolAssignments.map((a: any, i: number) => (
                <div key={i} className="flex items-center justify-between py-2 px-3 rounded-lg bg-slate-50">
                  <Link href={`/dashboard/district/schools/${a.schoolId}`} className="text-sm font-medium text-violet-600 hover:underline">
                    {a.schoolName}
                  </Link>
                  <div className="flex items-center gap-2">
                    {a.roleAtSchool && <span className="text-xs text-slate-500">{a.roleAtSchool}</span>}
                    <span className="text-xs text-slate-400">{a.assignedAt ? new Date(a.assignedAt).toLocaleDateString() : ""}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-400">No school assignments.</p>
          )}
        </div>
      </div>
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
