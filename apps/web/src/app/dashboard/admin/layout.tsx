"use client";
import { useAuth } from "@/providers/auth-provider";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import DashboardHeader from "@/components/DashboardHeader";
import CommandPalette from "@/components/CommandPalette";
import { SkipLink } from "@/components/a11y/SkipLink";

const NAV_SECTIONS = [
  {
    label: "Platform",
    items: [
      { href: "/dashboard/admin", label: "Overview", icon: "📊" },
      { href: "/dashboard/admin/activity", label: "Activity Feed", icon: "🔔" },
      { href: "/dashboard/admin/services", label: "Services & Health", icon: "⚡" },
      { href: "/dashboard/admin/analytics", label: "Analytics & Research", icon: "📈" },
    ],
  },
  {
    label: "Management",
    items: [
      { href: "/dashboard/admin/users", label: "Users & Roles", icon: "👤" },
      { href: "/dashboard/admin/learners", label: "Learners", icon: "🎓" },
      { href: "/dashboard/admin/tenants", label: "Tenants & Districts", icon: "🏢" },
    ],
  },
  {
    label: "AI & Learning",
    items: [
      { href: "/dashboard/admin/ai", label: "AI & Brain Models", icon: "🧠" },
      { href: "/dashboard/admin/ai/playground", label: "Prompt Playground", icon: "🎮" },
      { href: "/dashboard/admin/ai/moderation", label: "Content Moderation", icon: "🔍" },
    ],
  },
  {
    label: "Operations",
    items: [
      { href: "/dashboard/admin/billing", label: "Billing & Licensing", icon: "💳" },
      { href: "/dashboard/admin/billing/revenue", label: "Revenue", icon: "💰" },
      { href: "/dashboard/admin/billing/invoices", label: "Invoices", icon: "🧾" },
      { href: "/dashboard/admin/compliance", label: "Compliance & Audit", icon: "🛡️" },
      { href: "/dashboard/admin/compliance/audit-log", label: "Audit Log", icon: "📜" },
      { href: "/dashboard/admin/compliance/data-requests", label: "Data Requests", icon: "📋" },
      { href: "/dashboard/admin/settings", label: "Platform Settings", icon: "⚙️" },
      { href: "/dashboard/admin/settings/emails", label: "Email Templates", icon: "📧" },
      { href: "/dashboard/admin/settings/webhooks", label: "Webhooks", icon: "🔗" },
      { href: "/dashboard/admin/settings/api-keys", label: "API Keys", icon: "🔑" },
    ],
  },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, accessToken, logout, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/admin/login");
    } else if (!loading && user) {
      if (user.role === "DISTRICT_ADMIN") {
        router.push("/dashboard/district");
      } else if (user.role !== "PLATFORM_ADMIN") {
        router.push("/");
      }
    }
  }, [user, loading, router]);

  if (loading || !user) return null;

  const isActive = (href: string) => {
    if (href === "/dashboard/admin") return pathname === "/dashboard/admin";
    return pathname.startsWith(href);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <SkipLink />
      <aside className={`${sidebarCollapsed ? "w-16" : "w-64"} bg-slate-900 text-white flex flex-col transition-all duration-200 flex-shrink-0`} role="navigation" aria-label="Admin sidebar">
        <div className="p-4 border-b border-slate-700 flex items-center justify-between">
          {!sidebarCollapsed && (
            <div className="flex items-center gap-2">
              <Image src="/images/aivo-logo-white.png" alt="AIVO" width={80} height={24} style={{ height: "auto" }} />
              <span className="text-xs font-bold text-purple-400 uppercase tracking-wider">Admin</span>
            </div>
          )}
          <button onClick={() => setSidebarCollapsed(!sidebarCollapsed)} className="text-slate-400 hover:text-white p-1" aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}>
            {sidebarCollapsed ? "→" : "←"}
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-3">
          {NAV_SECTIONS.map((section) => (
            <div key={section.label} className="mb-4">
              {!sidebarCollapsed && (
                <p className="px-4 text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">{section.label}</p>
              )}
              {section.items.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-label={item.label}
                  aria-current={isActive(item.href) ? "page" : undefined}
                  className={`flex items-center gap-3 px-4 py-2.5 text-sm transition-all ${
                    isActive(item.href)
                      ? "bg-purple-600/20 text-purple-300 border-r-2 border-purple-400 font-semibold"
                      : "text-slate-400 hover:bg-slate-800 hover:text-white"
                  }`}
                >
                  <span className="text-base flex-shrink-0" aria-hidden="true">{item.icon}</span>
                  {!sidebarCollapsed && <span>{item.label}</span>}
                </Link>
              ))}
            </div>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-700">
          {!sidebarCollapsed && (
            <div className="mb-3">
              <p className="text-sm font-semibold truncate">{user.name}</p>
              <p className="text-xs text-slate-500">{user.role.replace(/_/g, " ")}</p>
            </div>
          )}
          <button onClick={logout} aria-label="Sign out" className={`text-xs text-slate-400 hover:text-red-400 transition ${sidebarCollapsed ? "w-full text-center" : ""}`}>
            {sidebarCollapsed ? "🚪" : "Sign Out"}
          </button>
        </div>
      </aside>

      <main id="main-content" tabIndex={-1} className="flex-1 overflow-auto flex flex-col">
        <DashboardHeader
          userName={user.name || "Admin"}
          userRole={user.role}
          userEmail={user.email || undefined}
          accent="purple"
          basePath="/dashboard/admin"
          baseLabel="Admin"
        />
        <div className="flex-1 overflow-auto">
          {children}
        </div>
      </main>
      <CommandPalette />
    </div>
  );
}
