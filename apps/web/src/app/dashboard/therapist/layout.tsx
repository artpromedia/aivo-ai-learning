"use client";
import { useAuth } from "@/providers/auth-provider";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import DashboardHeader from "@/components/DashboardHeader";
import { SkipLink } from "@/components/a11y/SkipLink";

const NAV_ITEMS = [
  { href: "/dashboard/therapist", label: "Caseload", icon: "👥" },
  { href: "/dashboard/therapist/reports", label: "Reports", icon: "📋" },
  { href: "/dashboard/therapist/sessions", label: "Sessions", icon: "📅" },
  { href: "/dashboard/therapist/settings", label: "Settings", icon: "⚙️" },
];

export default function TherapistLayout({ children }: { children: React.ReactNode }) {
  const { user, logout, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.push("/login");
    if (!loading && user && !["THERAPIST", "PLATFORM_ADMIN"].includes(user.role)) router.push("/");
  }, [user, loading, router]);

  if (loading || !user) return null;

  const isActive = (href: string) => {
    if (href === "/dashboard/therapist") return pathname === "/dashboard/therapist";
    return pathname.startsWith(href);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <SkipLink />
      <aside className={`${collapsed ? "w-16" : "w-64"} bg-white border-r border-slate-200 flex flex-col transition-all duration-200 flex-shrink-0`} role="navigation" aria-label="Therapist sidebar">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          {!collapsed && (
            <Link href="/dashboard/therapist" className="flex items-center gap-3">
              <div className="w-9 h-9 bg-gradient-to-br from-pink-500 to-pink-600 rounded-xl flex items-center justify-center">
                <Image src="/images/aivo-logo-white.png" alt="AIVO" width={22} height={22} style={{ height: "auto" }} />
              </div>
              <div>
                <p className="font-bold text-slate-900 text-sm">AIVO</p>
                <p className="text-xs text-pink-600 font-semibold uppercase tracking-wider">Therapist</p>
              </div>
            </Link>
          )}
          <button onClick={() => setCollapsed(!collapsed)} className="text-slate-400 hover:text-slate-600 p-1 transition" aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}>
            {collapsed ? "→" : "←"}
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-3">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-label={item.label}
              aria-current={isActive(item.href) ? "page" : undefined}
              className={`flex items-center gap-3 px-4 py-2.5 text-sm transition-all mx-2 rounded-xl ${
                isActive(item.href)
                  ? "bg-pink-100 text-pink-700 font-semibold shadow-sm"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              <span className="text-base flex-shrink-0" aria-hidden="true">{item.icon}</span>
              {!collapsed && <span>{item.label}</span>}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-100">
          {!collapsed && (
            <div className="mb-3">
              <p className="text-sm font-semibold text-slate-900 truncate">{user.name}</p>
              <p className="text-xs text-slate-500">{user.role.replace(/_/g, " ")}</p>
            </div>
          )}
          <button onClick={logout} aria-label="Sign out" className={`text-xs text-slate-400 hover:text-red-400 transition ${collapsed ? "w-full text-center" : ""}`}>
            {collapsed ? "🚪" : "Sign Out"}
          </button>
        </div>
      </aside>

      <main id="main-content" tabIndex={-1} className="flex-1 overflow-auto flex flex-col">
        <DashboardHeader
          userName={user.name || "Therapist"}
          userRole={user.role}
          userEmail={user.email || undefined}
          accent="pink"
          basePath="/dashboard/therapist"
          baseLabel="Therapist"
        />
        <div className="flex-1 overflow-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
