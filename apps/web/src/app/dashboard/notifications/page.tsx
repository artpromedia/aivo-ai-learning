"use client";
import { useAuth } from "@/providers/auth-provider";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useTranslations } from "next-intl";

interface Notification {
  id: string;
  type: "achievement" | "alert" | "info" | "milestone" | "system";
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  link?: string;
}

const TYPE_ICONS: Record<string, string> = {
  achievement: "🏆",
  alert: "⚠️",
  info: "ℹ️",
  milestone: "🎯",
  system: "🔔",
};

const TYPE_COLORS: Record<string, string> = {
  achievement: "bg-amber-50 border-amber-200",
  alert: "bg-red-50 border-red-200",
  info: "bg-blue-50 border-blue-200",
  milestone: "bg-green-50 border-green-200",
  system: "bg-slate-50 border-slate-200",
};

export default function NotificationsPage() {
  const { user, accessToken, loading } = useAuth();
  const t = useTranslations("common");
  const td = useTranslations("dashboard");
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loadingNotifs, setLoadingNotifs] = useState(true);
  const [filter, setFilter] = useState<"all" | "unread">("all");

  useEffect(() => { if (!loading && !user) router.push("/login"); }, [user, loading, router]);

  useEffect(() => {
    if (!accessToken || !user) return;
    fetch("/api/comms/notifications", {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
      .then(r => r.ok ? r.json() : { notifications: [] })
      .then(data => {
        const notifs = Array.isArray(data?.notifications) ? data.notifications : [];
        if (notifs.length === 0) {
          setNotifications([
            { id: "demo1", type: "achievement", title: "Welcome to AIVO!", message: "Your account has been created. Start exploring your personalized learning journey.", read: false, createdAt: new Date().toISOString() },
            { id: "demo2", type: "info", title: "Complete Your Profile", message: "Add a learner to get started with AI-powered tutoring sessions.", read: false, createdAt: new Date(Date.now() - 3600000).toISOString() },
            { id: "demo3", type: "system", title: "Platform Update", message: "New tutors and quest worlds are now available. Check the tutor store for details.", read: true, createdAt: new Date(Date.now() - 86400000).toISOString() },
          ]);
        } else {
          setNotifications(notifs);
        }
      })
      .catch(() => {
        setNotifications([
          { id: "demo1", type: "info", title: "Welcome to AIVO!", message: "Your notification center is ready. Updates about your learning journey will appear here.", read: false, createdAt: new Date().toISOString() },
        ]);
      })
      .finally(() => setLoadingNotifs(false));
  }, [accessToken, user]);

  if (loading || !user) return null;

  const markAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const filtered = filter === "unread" ? notifications.filter(n => !n.read) : notifications;
  const unreadCount = notifications.filter(n => !n.read).length;

  const dashboardLink = user.role === "PARENT" ? "/dashboard/parent" :
    user.role === "LEARNER" ? "/dashboard/learner" :
    user.role === "TEACHER" ? "/dashboard/teacher" :
    user.role === "THERAPIST" ? "/dashboard/therapist" :
    user.role === "CAREGIVER" ? "/dashboard/caregiver" :
    "/dashboard/admin";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-purple-50">
      <header className="bg-white/80 backdrop-blur border-b border-slate-200 px-8 py-4 flex items-center justify-between">
        <Image src="/images/aivo-logo-purple.png" alt="AIVO" width={120} height={36} style={{ height: "auto" }} />
        <div className="flex items-center gap-4">
          <Link href={dashboardLink} className="text-sm text-primary font-semibold hover:underline">Dashboard</Link>
          <span className="text-sm font-semibold text-slate-600">{user.name}</span>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-heading font-bold text-slate-900">{td("overview")}</h1>
            {unreadCount > 0 && (
              <p className="text-sm text-slate-500 mt-1">{unreadCount} unread</p>
            )}
          </div>
          <div className="flex items-center gap-3">
            <div className="flex gap-1 bg-slate-100 rounded-xl p-1">
              {(["all", "unread"] as const).map(f => (
                <button key={f} onClick={() => setFilter(f)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition capitalize ${filter === f ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"}`}>
                  {f} {f === "unread" ? `(${unreadCount})` : ""}
                </button>
              ))}
            </div>
            {unreadCount > 0 && (
              <button onClick={markAllRead} className="text-xs text-primary font-semibold hover:underline">Mark all read</button>
            )}
          </div>
        </div>

        {loadingNotifs ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-slate-100 animate-pulse text-slate-400">Loading notifications...</div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-slate-100">
            <div className="text-4xl mb-3">🔔</div>
            <p className="text-slate-500 font-semibold">{filter === "unread" ? "No unread notifications" : "No notifications yet"}</p>
            <p className="text-xs text-slate-400 mt-1">Updates about your learning journey will appear here.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(n => (
              <div key={n.id}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") markAsRead(n.id); }}
                onClick={() => markAsRead(n.id)}
                className={`rounded-xl border-2 p-4 cursor-pointer transition hover:shadow-sm ${n.read ? "bg-white border-slate-100 opacity-70" : TYPE_COLORS[n.type]}`}>
                <div className="flex items-start gap-3">
                  <span className="text-xl mt-0.5">{TYPE_ICONS[n.type] || "🔔"}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className={`text-sm font-semibold ${n.read ? "text-slate-500" : "text-slate-900"}`}>{n.title}</h3>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {!n.read && <span className="w-2 h-2 rounded-full bg-primary" />}
                        <span className="text-xs text-slate-400">{formatTime(n.createdAt)}</span>
                      </div>
                    </div>
                    <p className={`text-sm mt-0.5 ${n.read ? "text-slate-400" : "text-slate-600"}`}>{n.message}</p>
                    {n.link && (
                      <Link href={n.link} className="text-xs text-primary font-semibold hover:underline mt-1 inline-block">View details →</Link>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function formatTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < 60000) return "just now";
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  if (diff < 604800000) return `${Math.floor(diff / 86400000)}d ago`;
  return new Date(iso).toLocaleDateString();
}
