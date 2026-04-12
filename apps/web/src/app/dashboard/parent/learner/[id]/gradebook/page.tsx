"use client";
import { useAuth } from "@/providers/auth-provider";
import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import Image from "next/image";

interface GradebookEntry {
  id: string;
  subject: string;
  skill: string;
  masteryScore: number;
  attemptsCount: number;
  lastAssessedAt: string | null;
  trend: string;
}

interface LearningPath {
  id: string;
  subject: string;
  currentTopic: string | null;
  topicSequence: string[];
  completedTopics: string[];
  masteryMap: Record<string, number>;
}

interface SessionRecord {
  id: string;
  tutorSku: string;
  subject: string;
  status: string;
  xpEarned: number;
  durationSeconds: number;
  startedAt: string;
  completedAt: string | null;
}

const SUBJECT_COLORS: Record<string, string> = {
  Mathematics: "#6C5CE7",
  "English Language Arts": "#00B894",
  Science: "#FDCB6E",
  "History & Social Studies": "#E17055",
  "Coding & Computer Science": "#0984E3",
  "Speech & Language": "#00CEC9",
  "Social-Emotional Learning": "#A29BFE",
};

export default function GradebookPage() {
  const { user, accessToken, loading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const learnerId = params.id as string;

  const [gradebook, setGradebook] = useState<GradebookEntry[]>([]);
  const [sessions, setSessions] = useState<SessionRecord[]>([]);
  const [paths, setPaths] = useState<LearningPath[]>([]);
  const [activeTab, setActiveTab] = useState<"gradebook" | "sessions" | "paths">("gradebook");

  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [user, loading, router]);

  useEffect(() => {
    if (learnerId) {
      fetch(`/api/learning/gradebook/${learnerId}`).then(r => r.json()).then(setGradebook).catch(() => {});
      fetch(`/api/learning/sessions?learnerId=${learnerId}`).then(r => r.json()).then(setSessions).catch(() => {});

      const subjects = ["Mathematics", "English Language Arts", "Science", "History & Social Studies", "Coding & Computer Science", "Speech & Language", "Social-Emotional Learning"];
      Promise.all(
        subjects.map(s => fetch(`/api/learning/path/${learnerId}/${encodeURIComponent(s)}`).then(r => r.ok ? r.json() : null).catch(() => null))
      ).then(results => setPaths(results.filter(Boolean)));
    }
  }, [learnerId]);

  if (loading || !user) return null;

  const subjectGroups = gradebook.reduce<Record<string, GradebookEntry[]>>((acc, entry) => {
    if (!acc[entry.subject]) acc[entry.subject] = [];
    acc[entry.subject].push(entry);
    return acc;
  }, {});

  const totalXP = sessions.reduce((sum, s) => sum + (s.xpEarned || 0), 0);
  const completedSessions = sessions.filter(s => s.status === "COMPLETED").length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-cyan-50">
      <header className="bg-white/80 backdrop-blur border-b border-slate-200 px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => router.push(`/dashboard/parent/learner/${learnerId}`)}
            className="text-sm text-slate-500 hover:text-primary font-semibold">
            Back to Profile
          </button>
          <Image src="/images/aivo-logo-purple.png" alt="AIVO" width={120} height={36} />
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-8 py-8 space-y-8">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-heading font-bold text-slate-900">Progress & Gradebook</h1>
          <div className="flex gap-4">
            <div className="text-center px-4 py-2 rounded-xl bg-purple-50">
              <div className="text-2xl font-bold text-primary">{totalXP}</div>
              <div className="text-xs text-slate-500 font-semibold">Total XP</div>
            </div>
            <div className="text-center px-4 py-2 rounded-xl bg-green-50">
              <div className="text-2xl font-bold text-green-600">{completedSessions}</div>
              <div className="text-xs text-slate-500 font-semibold">Sessions</div>
            </div>
          </div>
        </div>

        <div className="flex gap-2 border-b border-slate-200 pb-1">
          {(["gradebook", "sessions", "paths"] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-sm font-bold rounded-t-lg transition ${activeTab === tab ? "bg-white border border-b-white text-primary -mb-[1px]" : "text-slate-400 hover:text-slate-600"}`}>
              {tab === "gradebook" ? "Mastery" : tab === "sessions" ? "Sessions" : "Learning Paths"}
            </button>
          ))}
        </div>

        {activeTab === "gradebook" && (
          <div className="space-y-6">
            {Object.keys(subjectGroups).length === 0 ? (
              <div className="bg-white rounded-2xl p-12 text-center border border-slate-100">
                <div className="text-4xl mb-3">📊</div>
                <p className="text-slate-500 font-semibold">No mastery data yet. Complete some lessons to see progress!</p>
              </div>
            ) : (
              Object.entries(subjectGroups).map(([subject, entries]) => (
                <div key={subject} className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
                  <h3 className="font-heading font-bold text-lg mb-4" style={{ color: SUBJECT_COLORS[subject] || "#6C5CE7" }}>
                    {subject}
                  </h3>
                  <div className="space-y-3">
                    {entries.map(entry => (
                      <div key={entry.id} className="flex items-center gap-4">
                        <span className="text-sm text-slate-700 font-semibold w-40 truncate">{entry.skill}</span>
                        <div className="flex-1 h-4 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full rounded-full transition-all duration-500"
                            style={{
                              width: `${Math.min(100, (entry.masteryScore || 0) * 100)}%`,
                              backgroundColor: SUBJECT_COLORS[subject] || "#6C5CE7",
                            }} />
                        </div>
                        <span className="text-sm font-bold w-12 text-right" style={{ color: SUBJECT_COLORS[subject] || "#6C5CE7" }}>
                          {Math.round((entry.masteryScore || 0) * 100)}%
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                          entry.trend === "improving" ? "bg-green-100 text-green-700" :
                          entry.trend === "declining" ? "bg-red-100 text-red-700" :
                          "bg-slate-100 text-slate-500"
                        }`}>
                          {entry.trend === "improving" ? "Up" : entry.trend === "declining" ? "Down" : "Steady"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === "sessions" && (
          <div className="space-y-3">
            {sessions.length === 0 ? (
              <div className="bg-white rounded-2xl p-12 text-center border border-slate-100">
                <div className="text-4xl mb-3">🎮</div>
                <p className="text-slate-500 font-semibold">No sessions yet. Start a lesson to begin!</p>
              </div>
            ) : (
              sessions.map(s => (
                <div key={s.id} className="bg-white rounded-xl p-4 border border-slate-100 flex items-center justify-between">
                  <div>
                    <span className="font-heading font-bold text-slate-800">{s.subject}</span>
                    <span className="ml-2 text-xs text-slate-400">{s.tutorSku}</span>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <span className={`px-2 py-0.5 rounded-full font-bold text-xs ${
                      s.status === "COMPLETED" ? "bg-green-100 text-green-700" :
                      s.status === "IN_PROGRESS" ? "bg-blue-100 text-blue-700" :
                      "bg-slate-100 text-slate-500"
                    }`}>{s.status}</span>
                    <span className="text-purple-600 font-bold">+{s.xpEarned} XP</span>
                    <span className="text-slate-400">{new Date(s.startedAt).toLocaleDateString()}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === "paths" && (
          <div className="space-y-4">
            {paths.length === 0 ? (
              <div className="bg-white rounded-2xl p-12 text-center border border-slate-100">
                <div className="text-4xl mb-3">🗺</div>
                <p className="text-slate-500 font-semibold">Learning paths are generated as your learner progresses through lessons.</p>
              </div>
            ) : (
              paths.map(path => {
                const completed = (path.completedTopics || []).length;
                const total = (path.topicSequence || []).length;
                const progress = total > 0 ? (completed / total) * 100 : 0;
                return (
                  <div key={path.id} className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-heading font-bold text-lg" style={{ color: SUBJECT_COLORS[path.subject] || "#6C5CE7" }}>
                        {path.subject}
                      </h3>
                      <span className="text-sm font-bold" style={{ color: SUBJECT_COLORS[path.subject] || "#6C5CE7" }}>
                        {completed}/{total} topics
                      </span>
                    </div>
                    <div className="h-3 bg-slate-100 rounded-full overflow-hidden mb-4">
                      <div className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${progress}%`, backgroundColor: SUBJECT_COLORS[path.subject] || "#6C5CE7" }} />
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {(path.topicSequence || []).map((topic: string, i: number) => {
                        const isDone = (path.completedTopics || []).includes(topic);
                        const isCurrent = !isDone && i === completed;
                        return (
                          <span key={i} className={`px-3 py-1 text-xs rounded-full font-semibold ${
                            isDone ? "bg-green-100 text-green-700" :
                            isCurrent ? "bg-purple-100 text-primary ring-2 ring-purple-300" :
                            "bg-slate-100 text-slate-400"
                          }`}>
                            {topic}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </main>
    </div>
  );
}
