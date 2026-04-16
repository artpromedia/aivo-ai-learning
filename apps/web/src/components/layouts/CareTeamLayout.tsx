"use client";
import { useAuth } from "@/providers/auth-provider";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import DashboardHeader from "@/components/DashboardHeader";
import { SkipLink } from "@/components/a11y/SkipLink";

const ACCENT_CLASSES = {
  blue: {
    gradient: "from-blue-500 to-blue-600",
    roleText: "text-blue-600",
    activeBg: "bg-blue-100",
    activeText: "text-blue-700",
    focusRing: "focus-visible:ring-blue-500",
  },
  pink: {
    gradient: "from-pink-500 to-pink-600",
    roleText: "text-pink-600",
    activeBg: "bg-pink-100",
    activeText: "text-pink-700",
    focusRing: "focus-visible:ring-pink-500",
  },
  green: {
    gradient: "from-green-500 to-green-600",
    roleText: "text-green-600",
    activeBg: "bg-green-100",
    activeText: "text-green-700",
    focusRing: "focus-visible:ring-green-500",
  },
} as const;

interface NavItem {
  href: string;
  label: string;
  icon: string;
}

interface CareTeamLayoutProps {
  children: React.ReactNode;
  accent: keyof typeof ACCENT_CLASSES;
  roleLabel: string;
  allowedRoles: string[];
  basePath: string;
  navItems: NavItem[];
}

export default function CareTeamLayout({ children, accent, roleLabel, allowedRoles, basePath, navItems }: CareTeamLayoutProps) {
  const { user, logout, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const colors = ACCENT_CLASSES[accent];

  useEffect(() => {
    if (!loading && !user) router.push("/login");
    if (!loading && user && !allowedRoles.includes(user.role)) router.push("/");
  }, [user, loading, router, allowedRoles]);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  if (loading || !user) return null;

  const isActive = (href: string) => {
    if (href === basePath) return pathname === basePath;
    return pathname.startsWith(href);
  };

  const sidebarContent = (
    <>
      <div className="p-4 border-b border-slate-100 flex items-center justify-between">
        {!collapsed && (
          <Link href={basePath} className="flex items-center gap-3">
            <div className={`w-9 h-9 bg-gradient-to-br ${colors.gradient} rounded-xl flex items-center justify-center`}>
              <Image src="/images/aivo-logo-white.png" alt="AIVO" width={22} height={22} style={{ height: "auto" }} />
            </div>
            <div>
              <p className="font-bold text-slate-900 text-sm">AIVO</p>
              <p className={`text-xs ${colors.roleText} font-semibold uppercase tracking-wider`}>{roleLabel}</p>
            </div>
          </Link>
        )}
        <button onClick={() => setCollapsed(!collapsed)} className="text-slate-400 hover:text-slate-600 p-1 transition hidden md:block" aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}>
          {collapsed ? "\u2192" : "\u2190"}
        </button>
        <button onClick={() => setMobileOpen(false)} className="text-slate-400 hover:text-slate-600 p-1 transition md:hidden" aria-label="Close navigation menu">
          \u2715
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto py-3">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            aria-label={item.label}
            aria-current={isActive(item.href) ? "page" : undefined}
            className={`flex items-center gap-3 px-4 py-2.5 text-sm transition-all mx-2 rounded-xl focus:outline-none focus-visible:ring-2 ${colors.focusRing} focus-visible:ring-offset-2 ${
              isActive(item.href)
                ? `${colors.activeBg} ${colors.activeText} font-semibold shadow-sm`
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            }`}
          >
            <span className="text-base flex-shrink-0" aria-hidden="true">{item.icon}</span>
            {(!collapsed || mobileOpen) && <span>{item.label}</span>}
          </Link>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-100">
        {(!collapsed || mobileOpen) && (
          <div className="mb-3">
            <p className="text-sm font-semibold text-slate-900 truncate">{user.name}</p>
            <p className="text-xs text-slate-500">{user.role.replace(/_/g, " ")}</p>
          </div>
        )}
        <button onClick={logout} aria-label="Sign out" className={`text-xs text-slate-400 hover:text-red-400 transition ${collapsed && !mobileOpen ? "w-full text-center" : ""}`}>
          {collapsed && !mobileOpen ? "\uD83D\uDEAA" : "Sign Out"}
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <SkipLink />

      {mobileOpen && (
        <div className="fixed inset-0 bg-slate-900/30 z-40 md:hidden" onClick={() => setMobileOpen(false)} aria-hidden="true" />
      )}

      <aside
        id="care-team-sidebar"
        className={`
          fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-200 flex flex-col
          transition-transform duration-200 motion-reduce:transition-none
          ${mobileOpen ? "translate-x-0" : "-translate-x-full"}
          md:static md:translate-x-0 md:z-auto md:flex-shrink-0
          ${!mobileOpen ? (collapsed ? "md:w-16" : "md:w-64") : ""}
        `}
        role="navigation"
        aria-label={`${roleLabel} sidebar`}
      >
        {sidebarContent}
      </aside>

      <main id="main-content" tabIndex={-1} className="flex-1 overflow-auto flex flex-col min-w-0">
        <div className="md:hidden flex items-center px-4 h-14 border-b border-slate-100 bg-white">
          <button
            onClick={() => setMobileOpen(true)}
            aria-label="Open navigation menu"
            aria-expanded={mobileOpen}
            aria-controls="care-team-sidebar"
            className="p-2 text-slate-600 hover:text-slate-900 transition"
          >
            <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M3 12h18M3 6h18M3 18h18" />
            </svg>
          </button>
          <Link href={basePath} className="ml-3">
            <Image src="/images/aivo-logo-purple.png" alt="AIVO" width={80} height={24} style={{ height: "auto" }} />
          </Link>
        </div>
        <div className="hidden md:block">
          <DashboardHeader
            userName={user.name || roleLabel}
            userRole={user.role}
            userEmail={user.email || undefined}
            accent={accent}
            basePath={basePath}
            baseLabel={roleLabel}
          />
        </div>
        <div className="flex-1 overflow-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
