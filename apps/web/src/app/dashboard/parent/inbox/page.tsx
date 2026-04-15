"use client";
import { useAuth } from "@/providers/auth-provider";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

interface Notification {
  id: string;
  type: string;
  title: string;
  body?: string;
  actionUrl?: string;
  urgency: string;
  readAt: string | null;
  createdAt: string;
  learnerId?: string;
}

const TYPE_ICONS: Record<string, string> = {
  brain_review: "🧠",
  recommendation: "💡",
  iep_reminder: "📋",
  milestone: "🏆",
  progress: "📈",
  team: "🤝",
  system: "ℹ️",
};

const TABS = [
  { key: "all", label: "All" },
  { key: "action", label: "Action Needed" },
  { key: "celebrations", label: "Celebrations" },
  { key: "archived", label: "Archive" },
];

export default function InboxPage() {
  const { user, accessToken, loading } = useAuth();
  const t = useTranslations("parent");
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [activeTab, setActiveTab] = useState("all");
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (!accessToken || !user) return;
    setLoadingData(true);
    fetch(`/api/family/inbox/${user.id}`, { headers: { Authorization: `Bearer ${accessToken}` } })
      .then(r => r.ok ? r.json() : { items: [] })
      .then(data => setNotifications(data.items || []))
      .catch(() => {})
      .finally(() => setLoadingData(false));
  }, [accessToken, user]);

  if (loading || !user) return null;

  const markAsRead = async (id: string) => {
    await fetch(`/api/family/inbox/${id}/read`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, readAt: new Date().toISOString() } : n));
  };

  const dismiss = async (id: string) => {
    await fetch(`/api/family/inbox/${id}/dismiss`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const filtered = notifications.filter(n => {
    if (activeTab === "action") return ["brain_review", "recommendation", "iep_reminder"].includes(n.type) && !n.readAt;
    if (activeTab === "celebrations") return ["milestone", "progress"].includes(n.type);
    if (activeTab === "archived") return !!n.readAt;
    return true;
  });

  return (
    <div className="max-w-3xl mx-auto px-4 lg:px-6 py-6">
      <h1 className="text-2xl font-heading font-bold text-slate-900 mb-6">Inbox</h1>

      <div className="flex gap-1 mb-6 overflow-x-auto">
        {TABS.map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition ${
              activeTab === tab.key ? "bg-purple-100 text-purple-700" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`} style={{ minHeight: 44 }}>
            {tab.label}
          </button>
        ))}
      </div>

      {loadingData ? (
        <div className="text-center py-16 text-slate-400 animate-pulse">Loading...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-4xl mb-3">📭</div>
          <p className="text-slate-500 font-semibold">
            {activeTab === "all" ? "Your inbox is empty. We'll let you know when something needs attention." : `No ${activeTab} items.`}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(n => (
            <div key={n.id}
              className={`bg-white rounded-xl p-4 border transition hover:shadow-md ${
                !n.readAt ? "border-purple-200 border-l-4 border-l-purple-500" : "border-slate-100"
              }`}>
              <div className="flex items-start gap-3">
                <span className="text-xl flex-shrink-0 mt-0.5">{TYPE_ICONS[n.type] || "📣"}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 justify-between">
                    <p className={`text-sm ${!n.readAt ? "font-bold text-slate-900" : "font-semibold text-slate-700"}`}>{n.title}</p>
                    <span className="text-xs text-slate-400 flex-shrink-0">
                      {new Date(n.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  {n.body && <p className="text-sm text-slate-500 mt-1">{n.body}</p>}
                  <div className="flex items-center gap-2 mt-3">
                    {n.actionUrl && (
                      <a href={n.actionUrl} className="px-3 py-1.5 text-xs rounded-full bg-purple-50 text-purple-700 font-semibold hover:bg-purple-100 transition" style={{ minHeight: 32 }}>
                        View →
                      </a>
                    )}
                    {!n.readAt && (
                      <button onClick={() => markAsRead(n.id)} className="px-3 py-1.5 text-xs rounded-full bg-slate-100 text-slate-600 font-semibold hover:bg-slate-200 transition" style={{ minHeight: 32 }}>
                        Mark Read
                      </button>
                    )}
                    <button onClick={() => dismiss(n.id)} className="px-3 py-1.5 text-xs rounded-full text-slate-400 hover:text-red-500 hover:bg-red-50 transition" style={{ minHeight: 32 }}>
                      Dismiss
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
