"use client";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { useState } from "react";

interface DashboardHeaderProps {
  userName: string;
  userRole: string;
  userEmail?: string;
  accent?: "purple" | "violet" | "blue" | "pink" | "green";
  basePath: string;
  baseLabel: string;
}

const NOTIFICATIONS = [
  { id: "1", message: "New learner enrolled", time: "2m ago", read: false },
  { id: "2", message: "Assessment completed", time: "15m ago", read: false },
  { id: "3", message: "System health check passed", time: "1h ago", read: true },
];

function getBreadcrumbs(pathname: string, basePath: string, baseLabel: string) {
  const segments = pathname.replace(basePath, "").split("/").filter(Boolean);
  const crumbs = [{ label: baseLabel, href: basePath }];
  let path = basePath;
  for (const seg of segments) {
    path += `/${seg}`;
    crumbs.push({
      label: seg.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
      href: path,
    });
  }
  return crumbs;
}

export default function DashboardHeader({ userName, userRole, userEmail, accent = "purple", basePath, baseLabel }: DashboardHeaderProps) {
  const pathname = usePathname();
  const [showNotifications, setShowNotifications] = useState(false);
  const crumbs = getBreadcrumbs(pathname, basePath, baseLabel);
  const unreadCount = NOTIFICATIONS.filter((n) => !n.read).length;
  const accentMap: Record<string, { text: string; bg: string }> = {
    purple: { text: "text-purple-600", bg: "bg-purple-50 border-purple-200" },
    violet: { text: "text-violet-600", bg: "bg-violet-50 border-violet-200" },
    blue: { text: "text-blue-600", bg: "bg-blue-50 border-blue-200" },
    pink: { text: "text-pink-600", bg: "bg-pink-50 border-pink-200" },
    green: { text: "text-green-600", bg: "bg-green-50 border-green-200" },
  };
  const accentColor = accentMap[accent]?.text || "text-purple-600";
  const accentBg = accentMap[accent]?.bg || "bg-purple-50 border-purple-200";

  return (
    <div className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center gap-6">
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm">
          {crumbs.map((crumb, i) => (
            <span key={crumb.href} className="flex items-center gap-1.5">
              {i > 0 && <span className="text-slate-300" aria-hidden="true">/</span>}
              {i === crumbs.length - 1 ? (
                <span className="font-semibold text-slate-900" aria-current="page">{crumb.label}</span>
              ) : (
                <Link href={crumb.href} className={`${accentColor} hover:underline font-medium`}>
                  {crumb.label}
                </Link>
              )}
            </span>
          ))}
        </nav>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 rounded-lg hover:bg-slate-100 transition text-slate-500 hover:text-slate-700"
            aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ""}`}
            aria-expanded={showNotifications}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)} />
              <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden z-50">
                <div className="p-3 border-b border-slate-100 flex items-center justify-between">
                  <span className="text-sm font-semibold text-slate-900">Notifications</span>
                  <span className="text-xs text-slate-400">{unreadCount} unread</span>
                </div>
                <div className="max-h-64 overflow-y-auto">
                  {NOTIFICATIONS.map((n) => (
                    <div key={n.id} className={`px-3 py-2.5 border-b border-slate-50 hover:bg-slate-50 transition ${!n.read ? "bg-blue-50/30" : ""}`}>
                      <div className="flex items-start gap-2">
                        {!n.read && <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 flex-shrink-0" />}
                        <div>
                          <p className="text-sm text-slate-700">{n.message}</p>
                          <p className="text-xs text-slate-400 mt-0.5">{n.time}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="p-2 border-t border-slate-100">
                  <button className={`w-full text-center text-xs font-semibold ${accentColor} py-1.5 hover:underline`}>
                    View all notifications
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        <div className="h-6 w-px bg-slate-200" />

        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
            {userName?.charAt(0) || "?"}
          </div>
          <div className="hidden md:block">
            <p className="text-sm font-medium text-slate-900 leading-tight">{userName}</p>
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">{userRole.replace(/_/g, " ")}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
