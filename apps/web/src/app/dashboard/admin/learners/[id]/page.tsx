"use client";
import { useAuth } from "@/providers/auth-provider";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect, useState } from "react";

interface LearnerDetail {
  id: string;
  name: string;
  dateOfBirth: string | null;
  gradeLevel: string | null;
  functioningLevel: string | null;
  communicationMode: string | null;
  diagnoses: string[];
  zipCode: string | null;
  country: string | null;
  region: string | null;
  districtId: string | null;
  districtName: string | null;
  curriculumFramework: string | null;
  curriculumAlignment: string | null;
  createdAt: string;
  updatedAt: string;
  parentId: string | null;
  tenantId: string | null;
  userId: string | null;
  parent: { id: string; name: string; email: string; role: string } | null;
  sensoryProfile: {
    visual: number | null;
    auditory: number | null;
    tactile: number | null;
    vestibular: number | null;
    proprioceptive: number | null;
    notes: string | null;
  } | null;
  tenant: { id: string; name: string; type: string } | null;
}

const LEVEL_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  STANDARD: { label: "Standard", color: "text-green-700", bg: "bg-green-100" },
  SUPPORTED: { label: "Supported", color: "text-blue-700", bg: "bg-blue-100" },
  LOW_VERBAL: { label: "Low Verbal", color: "text-amber-700", bg: "bg-amber-100" },
  NON_VERBAL: { label: "Non-Verbal", color: "text-orange-700", bg: "bg-orange-100" },
  PRE_SYMBOLIC: { label: "Pre-Symbolic", color: "text-red-700", bg: "bg-red-100" },
};

const SENSORY_LABELS: Record<string, string> = {
  visual: "Visual",
  auditory: "Auditory",
  tactile: "Tactile",
  vestibular: "Vestibular",
  proprioceptive: "Proprioceptive",
};

const SENSORY_COLORS: Record<string, string> = {
  visual: "bg-purple-500",
  auditory: "bg-blue-500",
  tactile: "bg-green-500",
  vestibular: "bg-amber-500",
  proprioceptive: "bg-red-500",
};

function calcAge(dob: string | null): string {
  if (!dob) return "—";
  const birth = new Date(dob);
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  if (now.getMonth() < birth.getMonth() || (now.getMonth() === birth.getMonth() && now.getDate() < birth.getDate())) {
    age--;
  }
  return `${age} years old`;
}

export default function LearnerDetailPage() {
  const { accessToken } = useAuth();
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [learner, setLearner] = useState<LearnerDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!accessToken || !id) return;
    setLoading(true);
    fetch(`/api/admin/learners/${id}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
      .then((r) => {
        if (!r.ok) throw new Error("Failed to load learner");
        return r.json();
      })
      .then((data) => setLearner(data))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [accessToken, id]);

  if (loading) {
    return (
      <div className="p-8 space-y-6">
        <div className="h-6 w-32 bg-slate-200 rounded animate-pulse" />
        <div className="h-10 w-64 bg-slate-200 rounded animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-48 bg-slate-200 rounded-2xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !learner) {
    return (
      <div className="p-8 space-y-4">
        <Link href="/dashboard/admin/learners" className="text-sm text-purple-600 hover:text-purple-700 font-medium">
          ← Back to Learners
        </Link>
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-red-600">
          {error || "Learner not found"}
        </div>
      </div>
    );
  }

  const levelConfig = LEVEL_CONFIG[learner.functioningLevel || ""] || { label: learner.functioningLevel || "Unknown", color: "text-slate-600", bg: "bg-slate-100" };

  return (
    <div className="p-8 space-y-6">
      <Link href="/dashboard/admin/learners" className="text-sm text-purple-600 hover:text-purple-700 font-medium inline-flex items-center gap-1">
        ← Back to Learners
      </Link>

      <div className="flex items-center gap-4">
        <div className="w-14 h-14 rounded-full bg-purple-100 flex items-center justify-center text-2xl">🎓</div>
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-heading font-bold text-slate-900">{learner.name}</h1>
            <span className={`px-2.5 py-0.5 text-xs rounded-full font-semibold ${levelConfig.bg} ${levelConfig.color}`}>
              {levelConfig.label}
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-0.5">
            {learner.gradeLevel ? `Grade ${learner.gradeLevel}` : "No grade"} · {calcAge(learner.dateOfBirth)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <h3 className="font-heading font-bold text-slate-900 mb-4">Demographics</h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500">Grade Level</span>
              <span className="font-medium text-slate-900">{learner.gradeLevel || "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Date of Birth</span>
              <span className="font-medium text-slate-900">
                {learner.dateOfBirth ? new Date(learner.dateOfBirth).toLocaleDateString() : "—"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Location</span>
              <span className="font-medium text-slate-900">
                {[learner.region, learner.country].filter(Boolean).join(", ") || "—"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Zip Code</span>
              <span className="font-medium text-slate-900">{learner.zipCode || "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">District</span>
              <span className="font-medium text-slate-900">{learner.districtName || "—"}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <h3 className="font-heading font-bold text-slate-900 mb-4">Clinical</h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500">Functioning Level</span>
              <span className={`px-2 py-0.5 text-xs rounded-full font-semibold ${levelConfig.bg} ${levelConfig.color}`}>
                {levelConfig.label}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Communication</span>
              <span className="font-medium text-slate-900">{learner.communicationMode || "—"}</span>
            </div>
            <div>
              <span className="text-slate-500">Diagnoses</span>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {learner.diagnoses && learner.diagnoses.length > 0 ? (
                  learner.diagnoses.map((d, i) => (
                    <span key={i} className="px-2 py-0.5 text-xs rounded-full bg-slate-100 text-slate-600 font-medium">
                      {d}
                    </span>
                  ))
                ) : (
                  <span className="text-slate-400 text-xs">None recorded</span>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <h3 className="font-heading font-bold text-slate-900 mb-4">Curriculum</h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500">Framework</span>
              <span className="font-medium text-slate-900">{learner.curriculumFramework || "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Alignment</span>
              <span className="font-medium text-slate-900">{learner.curriculumAlignment || "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Created</span>
              <span className="font-medium text-slate-900">{new Date(learner.createdAt).toLocaleDateString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Updated</span>
              <span className="font-medium text-slate-900">{new Date(learner.updatedAt).toLocaleDateString()}</span>
            </div>
          </div>
        </div>
      </div>

      {learner.sensoryProfile && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <h3 className="font-heading font-bold text-slate-900 mb-4">Sensory Profile</h3>
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
            {(["visual", "auditory", "tactile", "vestibular", "proprioceptive"] as const).map((key) => {
              const val = learner.sensoryProfile?.[key];
              const pct = val != null ? Math.min(val, 100) : 0;
              return (
                <div key={key}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-slate-600">{SENSORY_LABELS[key]}</span>
                    <span className="text-xs font-bold text-slate-900">{val != null ? val : "—"}</span>
                  </div>
                  <div className="bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div className={`h-full rounded-full ${SENSORY_COLORS[key]}`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
          {learner.sensoryProfile.notes && (
            <div className="mt-4 p-3 bg-slate-50 rounded-lg text-sm text-slate-600">
              <span className="font-semibold text-slate-700">Notes: </span>
              {learner.sensoryProfile.notes}
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <h3 className="font-heading font-bold text-slate-900 mb-4">Parent / Guardian</h3>
          {learner.parent ? (
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Name</span>
                <Link href={`/dashboard/admin/users/${learner.parent.id}`} className="font-medium text-purple-600 hover:text-purple-700">
                  {learner.parent.name}
                </Link>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Email</span>
                <span className="font-medium text-slate-900">{learner.parent.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Role</span>
                <span className="px-2 py-0.5 text-xs rounded-full bg-slate-100 text-slate-600 font-medium">
                  {learner.parent.role.replace(/_/g, " ")}
                </span>
              </div>
            </div>
          ) : (
            <p className="text-sm text-slate-400">No parent linked</p>
          )}
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <h3 className="font-heading font-bold text-slate-900 mb-4">Tenant</h3>
          {learner.tenant ? (
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Name</span>
                <Link href={`/dashboard/admin/tenants/${learner.tenant.id}`} className="font-medium text-purple-600 hover:text-purple-700">
                  {learner.tenant.name}
                </Link>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Type</span>
                <span className="px-2 py-0.5 text-xs rounded-full bg-slate-100 text-slate-600 font-medium">
                  {learner.tenant.type}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Tenant ID</span>
                <span className="font-mono text-xs text-slate-500">{learner.tenant.id}</span>
              </div>
            </div>
          ) : (
            <p className="text-sm text-slate-400">No tenant assigned</p>
          )}
        </div>
      </div>
    </div>
  );
}
