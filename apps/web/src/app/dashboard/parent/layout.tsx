"use client";
import { useAuth } from "@/providers/auth-provider";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState, createContext, useContext, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

interface Learner {
  id: string;
  name: string;
  functioningLevel: string;
  gradeLevel: string;
}

interface ParentLayoutContextType {
  learners: Learner[];
  activeLearner: Learner | null;
  setActiveLearner: (l: Learner) => void;
  unreadCount: number;
  refreshLearners: () => void;
}

const ParentLayoutContext = createContext<ParentLayoutContextType>({
  learners: [],
  activeLearner: null,
  setActiveLearner: () => {},
  unreadCount: 0,
  refreshLearners: () => {},
});

export const useParentLayout = () => useContext(ParentLayoutContext);

const NAV_ITEMS = [
  { key: "home", icon: "🏠", href: "/dashboard/parent", matchExact: true },
  { key: "inbox", icon: "💬", href: "/dashboard/parent/inbox" },
  { key: "settings", icon: "⚙️", href: "/dashboard/parent/settings" },
  { key: "billing", icon: "💳", href: "/dashboard/parent/billing" },
  { key: "store", icon: "🛍️", href: "/dashboard/parent/store" },
  { key: "help", icon: "❓", href: "/dashboard/parent/help" },
];

const BOTTOM_TABS = [
  { key: "home", icon: "🏠", href: "/dashboard/parent", matchExact: true },
  { key: "child", icon: "🧒", href: null },
  { key: "progress", icon: "📊", href: null },
  { key: "inbox", icon: "💬", href: "/dashboard/parent/inbox" },
  { key: "more", icon: "☰", href: null },
];

export default function ParentDashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, accessToken, logout, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations("parent");

  const [learners, setLearners] = useState<Learner[]>([]);
  const [activeLearner, setActiveLearner] = useState<Learner | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const [showLearnerSwitcher, setShowLearnerSwitcher] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.push("/login");
    if (!loading && user && user.role !== "PARENT" && user.role !== "PLATFORM_ADMIN") router.push("/");
  }, [user, loading, router]);

  const refreshLearners = useCallback(() => {
    if (!accessToken) return;
    fetch("/api/users/learners", { headers: { Authorization: `Bearer ${accessToken}` } })
      .then((r) => r.ok ? r.json() : [])
      .then((data) => {
        const list: Learner[] = Array.isArray(data) ? data : [];
        setLearners(list);
        if (list.length > 0 && !activeLearner) {
          const pathMatch = pathname.match(/\/learner\/([^/]+)/);
          const matchedLearner = pathMatch ? list.find(l => l.id === pathMatch[1]) : null;
          setActiveLearner(matchedLearner || list[0]);
        }
      })
      .catch(() => {});
  }, [accessToken, pathname, activeLearner]);

  useEffect(() => { refreshLearners(); }, [refreshLearners]);

  useEffect(() => {
    if (!accessToken || !user) return;
    fetch(`/api/family/inbox/${user.id}?filter=unread&limit=1`, { headers: { Authorization: `Bearer ${accessToken}` } })
      .then(r => r.ok ? r.json() : { unreadCount: 0 })
      .then(data => setUnreadCount(data.unreadCount || 0))
      .catch(() => {});
  }, [accessToken, user]);

  useEffect(() => {
    const pathMatch = pathname.match(/\/learner\/([^/]+)/);
    if (pathMatch && learners.length > 0) {
      const found = learners.find(l => l.id === pathMatch[1]);
      if (found) setActiveLearner(found);
    }
  }, [pathname, learners]);

  if (loading || !user) return null;

  const isActive = (href: string, exact?: boolean) => {
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    const name = user.name?.split(" ")[0] || "";
    if (hour >= 5 && hour < 12) return `Good morning, ${name} ☀️`;
    if (hour >= 12 && hour < 17) return `Good afternoon, ${name} 🌤️`;
    if (hour >= 17 && hour < 21) return `Good evening, ${name} 🌙`;
    return `Hey ${name} 🌟`;
  };

  const handleBottomTab = (tab: typeof BOTTOM_TABS[0]) => {
    if (tab.href) {
      router.push(tab.href);
      setShowMoreMenu(false);
    } else if (tab.key === "child" && activeLearner) {
      router.push(`/dashboard/parent/learner/${activeLearner.id}`);
    } else if (tab.key === "progress" && activeLearner) {
      router.push(`/dashboard/parent/learner/${activeLearner.id}/progress`);
    } else if (tab.key === "more") {
      setShowMoreMenu(!showMoreMenu);
    }
  };

  return (
    <ParentLayoutContext.Provider value={{ learners, activeLearner, setActiveLearner, unreadCount, refreshLearners }}>
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-cyan-50">
        <nav aria-label="Parent sidebar" className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-40 lg:flex lg:flex-col"
          onMouseEnter={() => setSidebarExpanded(true)} onMouseLeave={() => setSidebarExpanded(false)}
          style={{ width: sidebarExpanded ? 220 : 64, transition: "width 200ms ease" }}>
          <div className="flex flex-col h-full bg-white/95 backdrop-blur border-r border-slate-100 shadow-sm">
            <div className="flex items-center h-16 px-4">
              <Link href="/dashboard/parent">
                {sidebarExpanded ? (
                  <Image src="/images/aivo-logo-purple.png" alt="AIVO" width={100} height={30} />
                ) : (
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center text-white font-bold text-sm">A</div>
                )}
              </Link>
            </div>

            {learners.length > 1 && (
              <div className="px-3 py-2 border-b border-slate-100">
                {learners.map(l => (
                  <button key={l.id} onClick={() => { setActiveLearner(l); router.push(`/dashboard/parent/learner/${l.id}`); }}
                    className={`flex items-center gap-2 w-full px-2 py-1.5 rounded-lg text-sm transition mb-1 ${activeLearner?.id === l.id ? "bg-purple-50 text-purple-700 font-semibold" : "text-slate-600 hover:bg-slate-50"}`}>
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0 ${activeLearner?.id === l.id ? "bg-purple-500" : "bg-slate-400"}`}>
                      {l.name.charAt(0)}
                    </div>
                    {sidebarExpanded && <span className="truncate">{l.name}</span>}
                  </button>
                ))}
              </div>
            )}

            <nav className="flex-1 px-3 py-4 space-y-1">
              {NAV_ITEMS.map(item => (
                <Link key={item.key} href={item.href}
                  className={`flex items-center gap-3 px-2 py-2.5 rounded-lg text-sm transition ${isActive(item.href, item.matchExact) ? "bg-purple-50 text-purple-700 font-semibold" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"}`}>
                  <span className="text-lg flex-shrink-0 w-6 text-center">{item.icon}</span>
                  {sidebarExpanded && (
                    <span className="truncate">{t(`nav_${item.key}`, { defaultValue: item.key.charAt(0).toUpperCase() + item.key.slice(1) })}</span>
                  )}
                  {item.key === "inbox" && unreadCount > 0 && (
                    <span className="ml-auto bg-red-500 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">{unreadCount > 9 ? "9+" : unreadCount}</span>
                  )}
                </Link>
              ))}
            </nav>

            <div className="px-3 py-4 border-t border-slate-100">
              <button onClick={logout}
                className="flex items-center gap-3 px-2 py-2.5 rounded-lg text-sm text-slate-500 hover:bg-red-50 hover:text-red-600 transition w-full">
                <span className="text-lg flex-shrink-0 w-6 text-center">🚪</span>
                {sidebarExpanded && <span>{t("logout")}</span>}
              </button>
            </div>
          </div>
        </nav>

        <header className="sticky top-0 z-30 bg-white/90 backdrop-blur border-b border-slate-100 lg:pl-16" style={{ transition: "padding 200ms ease" }}>
          <div className="flex items-center justify-between px-4 lg:px-6 h-14">
            <div className="flex items-center gap-3">
              <Link href="/dashboard/parent" className="lg:hidden">
                <Image src="/images/aivo-logo-purple.png" alt="AIVO" width={80} height={24} />
              </Link>
              <span className="hidden lg:block text-sm text-slate-500">{getGreeting()}</span>
            </div>

            <div className="flex items-center gap-3">
              {learners.length > 0 && (
                <div className="relative lg:hidden">
                  <button onClick={() => setShowLearnerSwitcher(!showLearnerSwitcher)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-purple-50 text-purple-700 text-sm font-semibold">
                    <span>{activeLearner?.name || "Select"}</span>
                    {activeLearner?.gradeLevel && <span className="text-xs text-purple-400">Grade {activeLearner.gradeLevel}</span>}
                    <span className="text-xs">▾</span>
                  </button>
                  {showLearnerSwitcher && (
                    <div className="absolute top-full mt-1 right-0 bg-white rounded-xl shadow-lg border border-slate-200 py-2 min-w-48 z-50">
                      {learners.map(l => (
                        <button key={l.id} onClick={() => { setActiveLearner(l); setShowLearnerSwitcher(false); router.push(`/dashboard/parent/learner/${l.id}`); }}
                          className={`flex items-center gap-2 w-full px-4 py-2.5 text-left text-sm ${activeLearner?.id === l.id ? "bg-purple-50 text-purple-700 font-semibold" : "text-slate-700 hover:bg-slate-50"}`}>
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white ${activeLearner?.id === l.id ? "bg-purple-500" : "bg-slate-400"}`}>
                            {l.name.charAt(0)}
                          </div>
                          <div>
                            <div>{l.name}</div>
                            {l.gradeLevel && <div className="text-xs text-slate-400">Grade {l.gradeLevel}</div>}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <Link href="/dashboard/parent/inbox" className="relative p-2 rounded-full hover:bg-slate-100 transition" aria-label="Inbox">
                <span className="text-lg">🔔</span>
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center">{unreadCount > 9 ? "9+" : unreadCount}</span>
                )}
              </Link>

              <div className="hidden lg:flex items-center gap-2">
                <LanguageSwitcher compact />
                <Link href="/dashboard/parent/settings" className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center text-white text-sm font-bold" aria-label="Account">
                  {user.name?.charAt(0) || "P"}
                </Link>
              </div>
            </div>
          </div>
        </header>

        <main className="lg:pl-16 pb-20 lg:pb-0" style={{ transition: "padding 200ms ease" }}>
          {children}
        </main>

        <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur border-t border-slate-200 safe-area-bottom">
          <div className="flex items-center justify-around h-14">
            {BOTTOM_TABS.map(tab => {
              const active = tab.href ? isActive(tab.href, tab.matchExact) :
                tab.key === "child" ? pathname.includes("/learner/") && !pathname.includes("/progress") :
                tab.key === "progress" ? pathname.includes("/progress") : false;
              return (
                <button key={tab.key} onClick={() => handleBottomTab(tab)}
                  className={`flex flex-col items-center justify-center w-full h-full relative ${active ? "text-purple-600" : "text-slate-400"}`}
                  style={{ minHeight: 44, minWidth: 44 }}>
                  <span className="text-lg">{tab.icon}</span>
                  <span className={`text-[10px] mt-0.5 ${active ? "font-bold" : ""}`}>{t(`nav_${tab.key}`, { defaultValue: tab.key.charAt(0).toUpperCase() + tab.key.slice(1) })}</span>
                  {tab.key === "inbox" && unreadCount > 0 && (
                    <span className="absolute top-1 right-1/4 bg-red-500 text-white text-[8px] font-bold rounded-full w-3.5 h-3.5 flex items-center justify-center">{unreadCount > 9 ? "9+" : unreadCount}</span>
                  )}
                </button>
              );
            })}
          </div>

          {showMoreMenu && (
            <div className="absolute bottom-full left-0 right-0 bg-white border-t border-slate-200 shadow-lg rounded-t-2xl p-4 space-y-2">
              {[
                { key: "settings", href: "/dashboard/parent/settings", icon: "⚙️" },
                { key: "billing", href: "/dashboard/parent/billing", icon: "💳" },
                { key: "store", href: "/dashboard/parent/store", icon: "🛍️" },
                { key: "help", href: "/dashboard/parent/help", icon: "❓" },
              ].map(item => (
                <Link key={item.href} href={item.href} onClick={() => setShowMoreMenu(false)}
                  className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-slate-50 text-sm font-semibold text-slate-700">
                  <span className="text-lg">{item.icon}</span>
                  <span>{t(`nav_${item.key}`, { defaultValue: item.key.charAt(0).toUpperCase() + item.key.slice(1) })}</span>
                </Link>
              ))}
              <button onClick={() => { setShowMoreMenu(false); logout(); }}
                className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-red-50 text-sm font-semibold text-red-500 w-full">
                <span className="text-lg">🚪</span>
                <span>{t("logout")}</span>
              </button>
            </div>
          )}
        </nav>
      </div>
    </ParentLayoutContext.Provider>
  );
}
