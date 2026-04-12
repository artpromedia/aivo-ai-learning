"use client";
import { useAuth } from "@/providers/auth-provider";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import DashboardHeader from "@/components/DashboardHeader";

const NAV_SECTIONS = [
  {
    label: "Overview",
    items: [
      { href: "/dashboard/district", label: "Dashboard", icon: "📊" },
      { href: "/dashboard/district/schools", label: "Schools", icon: "🏫" },
    ],
  },
  {
    label: "People",
    items: [
      { href: "/dashboard/district/learners", label: "Learners", icon: "🎓" },
      { href: "/dashboard/district/staff", label: "Staff & Teachers", icon: "👩‍🏫" },
    ],
  },
  {
    label: "Insights",
    items: [
      { href: "/dashboard/district/analytics", label: "Analytics & Reports", icon: "📈" },
      { href: "/dashboard/district/usage", label: "Usage & Limits", icon: "⚡" },
    ],
  },
  {
    label: "Connect",
    items: [
      { href: "/dashboard/district/integrations", label: "Integrations", icon: "🔗" },
    ],
  },
  {
    label: "Admin",
    items: [
      { href: "/dashboard/district/settings", label: "District Settings", icon: "⚙️" },
    ],
  },
];

export default function DistrictLayout({ children }: { children: React.ReactNode }) {
  const { user, logout, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.push("/login");
    if (!loading && user && !["DISTRICT_ADMIN", "PLATFORM_ADMIN"].includes(user.role)) router.push("/");
  }, [user, loading, router]);

  if (loading || !user) return null;

  const isActive = (href: string) => {
    if (href === "/dashboard/district") return pathname === "/dashboard/district";
    return pathname.startsWith(href);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <aside className={`${collapsed ? "w-16" : "w-64"} bg-white border-r border-slate-200 flex flex-col transition-all duration-200 flex-shrink-0`}>
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          {!collapsed && (
            <Link href="/dashboard/district" className="flex items-center gap-3">
              <div className="w-9 h-9 bg-gradient-to-br from-violet-500 to-violet-600 rounded-xl flex items-center justify-center">
                <Image src="/images/aivo-logo-white.png" alt="AIVO" width={22} height={22} style={{ height: "auto" }} />
              </div>
              <div>
                <p className="font-bold text-slate-900 text-sm">AIVO</p>
                <p className="text-[10px] text-violet-600 font-semibold uppercase tracking-wider">District Admin</p>
              </div>
            </Link>
          )}
          <button onClick={() => setCollapsed(!collapsed)} className="text-slate-400 hover:text-slate-600 p-1 transition">
            {collapsed ? "→" : "←"}
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-3">
          {NAV_SECTIONS.map((section) => (
            <div key={section.label} className="mb-3">
              {!collapsed && (
                <p className="px-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">{section.label}</p>
              )}
              {section.items.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-2.5 text-sm transition-all mx-2 rounded-xl ${
                    isActive(item.href)
                      ? "bg-violet-100 text-violet-700 font-semibold shadow-sm"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  }`}
                >
                  <span className="text-base flex-shrink-0">{item.icon}</span>
                  {!collapsed && <span>{item.label}</span>}
                </Link>
              ))}
            </div>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-100">
          {!collapsed && (
            <>
              <div className="mb-3">
                <p className="text-sm font-semibold text-slate-900 truncate">{user.name}</p>
                <p className="text-xs text-slate-400">{user.role.replace(/_/g, " ")}</p>
              </div>
              <div className="bg-gradient-to-br from-violet-50 to-purple-50 rounded-xl p-3 mb-3">
                <p className="text-[11px] font-medium text-violet-700">Need help?</p>
                <p className="text-[10px] text-slate-500 mt-0.5">Contact your platform administrator for support.</p>
              </div>
            </>
          )}
          <button onClick={logout} className={`text-xs text-slate-400 hover:text-red-400 transition ${collapsed ? "w-full text-center" : ""}`}>
            {collapsed ? "🚪" : "Sign Out"}
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-auto flex flex-col">
        <DashboardHeader
          userName={user.name || "District Admin"}
          userRole={user.role}
          userEmail={user.email || undefined}
          accent="violet"
          basePath="/dashboard/district"
          baseLabel="District"
        />
        <div className="flex-1 overflow-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
