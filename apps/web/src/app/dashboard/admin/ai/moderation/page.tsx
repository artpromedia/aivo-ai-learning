"use client";
import { useAuth } from "@/providers/auth-provider";
import { useState } from "react";
import Link from "next/link";

interface ModerationItem {
  id: string;
  content: string;
  contentType: string;
  flagReason: string;
  flagConfidence: number;
  tutorKey: string;
  provider: string;
  status: string;
  createdAt: string;
}

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700",
  approved: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
  escalated: "bg-purple-100 text-purple-700",
};

const SAMPLE_ITEMS: ModerationItem[] = [
  { id: "1", content: "Let me tell you about dangerous chemicals you can mix at home...", contentType: "ai_response", flagReason: "safety_concern", flagConfidence: 0.92, tutorKey: "sage", provider: "gpt-4o", status: "pending", createdAt: new Date(Date.now() - 3600000).toISOString() },
  { id: "2", content: "You're so stupid, why can't you understand this simple problem?", contentType: "ai_response", flagReason: "inappropriate_language", flagConfidence: 0.88, tutorKey: "bolt", provider: "claude-3-5-sonnet", status: "pending", createdAt: new Date(Date.now() - 7200000).toISOString() },
  { id: "3", content: "Here's a fun way to learn about volcanoes using a baking soda experiment!", contentType: "ai_response", flagReason: "false_positive", flagConfidence: 0.31, tutorKey: "sage", provider: "gpt-4o-mini", status: "approved", createdAt: new Date(Date.now() - 86400000).toISOString() },
];

export default function ContentModerationPage() {
  const { accessToken } = useAuth();
  const [items, setItems] = useState<ModerationItem[]>(SAMPLE_ITEMS);
  const [filter, setFilter] = useState("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = filter === "all" ? items : items.filter((i) => i.status === filter);

  const handleAction = (id: string, action: string) => {
    setItems(items.map((item) => item.id === id ? { ...item, status: action } : item));
  };

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center gap-3 text-sm text-slate-500">
        <Link href="/dashboard/admin/ai" className="hover:text-purple-600 transition">AI & Brain Models</Link>
        <span>/</span>
        <span className="text-slate-900 font-medium">Content Moderation</span>
      </div>

      <div>
        <h1 className="text-2xl font-heading font-bold text-slate-900">Content Moderation</h1>
        <p className="text-sm text-slate-500 mt-1">Review AI-generated content flagged by automated safety filters.</p>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Pending Review", value: items.filter((i) => i.status === "pending").length, color: "text-amber-600" },
          { label: "Approved", value: items.filter((i) => i.status === "approved").length, color: "text-green-600" },
          { label: "Rejected", value: items.filter((i) => i.status === "rejected").length, color: "text-red-600" },
          { label: "Total Flagged", value: items.length, color: "text-slate-900" },
        ].map((m) => (
          <div key={m.label} className="bg-white rounded-xl p-4 shadow-sm border border-slate-200 text-center">
            <p className={`text-2xl font-bold ${m.color}`}>{m.value}</p>
            <p className="text-xs text-slate-500 font-semibold mt-1">{m.label}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center gap-3">
          <span className="text-sm text-slate-500">Filter:</span>
          {["all", "pending", "approved", "rejected"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                filter === f ? "bg-purple-100 text-purple-700" : "bg-slate-50 text-slate-500 hover:bg-slate-100"
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        <div className="divide-y divide-slate-50">
          {filtered.map((item) => (
            <div key={item.id} className="p-5 hover:bg-slate-50/50 transition">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`px-2.5 py-0.5 text-xs rounded-full font-semibold ${STATUS_COLORS[item.status]}`}>{item.status}</span>
                    <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">{item.flagReason.replace(/_/g, " ")}</span>
                    <span className="text-xs text-slate-400">Confidence: {(item.flagConfidence * 100).toFixed(0)}%</span>
                  </div>
                  <p className="text-sm text-slate-900 line-clamp-2">{item.content}</p>
                  <div className="flex items-center gap-4 mt-2 text-xs text-slate-400">
                    <span>Tutor: {item.tutorKey}</span>
                    <span>Model: {item.provider}</span>
                    <span>{new Date(item.createdAt).toLocaleString()}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  {item.status === "pending" && (
                    <>
                      <button
                        onClick={() => handleAction(item.id, "approved")}
                        className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-green-50 text-green-700 hover:bg-green-100 border border-green-200 transition"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleAction(item.id, "rejected")}
                        className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 transition"
                      >
                        Reject
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
                    className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200 transition"
                  >
                    {expandedId === item.id ? "Collapse" : "Expand"}
                  </button>
                </div>
              </div>
              {expandedId === item.id && (
                <div className="mt-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <p className="text-sm text-slate-900 whitespace-pre-wrap">{item.content}</p>
                </div>
              )}
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="p-10 text-center text-slate-400">No items matching the current filter.</div>
          )}
        </div>
      </div>
    </div>
  );
}
