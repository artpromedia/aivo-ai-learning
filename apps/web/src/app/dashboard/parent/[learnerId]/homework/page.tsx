"use client";
import { useAuth } from "@/providers/auth-provider";
import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import Image from "next/image";

interface ChildHomework {
  learnerId: string;
  learnerName: string;
  assignments: {
    id: string;
    subject: string;
    status: string;
    detectedSubject: string;
    problemCount: number;
    createdAt: string;
  }[];
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  READY: { label: "Ready", color: "bg-green-100 text-green-700" },
  IN_PROGRESS: { label: "In Progress", color: "bg-blue-100 text-blue-700" },
  COMPLETED: { label: "Completed", color: "bg-purple-100 text-purple-700" },
  FAILED: { label: "Failed", color: "bg-red-100 text-red-700" },
};

const SUBJECT_ICONS: Record<string, string> = {
  math: "🔢",
  ela: "📖",
  science: "🔬",
  history: "🏛️",
  coding: "💻",
  other: "📝",
};

export default function ParentHomeworkPage() {
  const { user, accessToken, loading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const learnerId = params.learnerId as string;

  const [data, setData] = useState<ChildHomework | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user) return;
    fetchHomework();
  }, [user]);

  async function fetchHomework() {
    try {
      const res = await fetch(`/api/tutors/homework/learner/${learnerId}`, {
        headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
      });
      if (res.ok) {
        const result = await res.json();
        setData({
          learnerId,
          learnerName: "",
          assignments: result.assignments || [],
        });
      }
    } catch {} finally {
      setLoading(false);
    }
  }

  if (authLoading || !user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-cyan-50">
      <header className="bg-white/80 backdrop-blur border-b border-slate-200 px-8 py-4 flex items-center justify-between">
        <Image src="/images/aivo-logo-purple.png" alt="AIVO" width={100} height={30} />
        <button onClick={() => router.push("/dashboard/parent")} className="text-sm text-slate-500 hover:text-purple-600 font-semibold">
          Back to Dashboard
        </button>
      </header>

      <main className="max-w-4xl mx-auto px-8 py-12 space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-heading font-bold text-slate-900">Homework History</h1>
          <p className="text-slate-500">View your child's homework activity and progress</p>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="w-10 h-10 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mx-auto" />
          </div>
        ) : !data || data.assignments.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <div className="text-5xl mb-4">📚</div>
            <p className="font-semibold">No homework assignments yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {data.assignments.map((hw) => {
              const subjectLower = hw.subject?.toLowerCase() || "other";
              const status = STATUS_LABELS[hw.status] || STATUS_LABELS.READY;
              return (
                <div
                  key={hw.id}
                  className="bg-white rounded-xl p-5 shadow-sm border border-slate-100 flex items-center gap-4"
                >
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center text-xl bg-slate-50">
                    {SUBJECT_ICONS[subjectLower] || SUBJECT_ICONS.other}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-slate-800 capitalize">{subjectLower} Homework</p>
                    <p className="text-sm text-slate-400">
                      {hw.problemCount} problem{hw.problemCount !== 1 ? "s" : ""} &middot;{" "}
                      {new Date(hw.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${status.color}`}>
                    {status.label}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
