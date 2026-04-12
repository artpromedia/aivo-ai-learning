"use client";
import { useAuth } from "@/providers/auth-provider";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import DashboardHeader from "@/components/DashboardHeader";

const INTERNAL_ROLES = ["PLATFORM_ADMIN", "SALES", "MARKETING", "CUSTOMER_CARE", "SUPPORT", "FINANCE", "DEVOPS"];

const NAV_ITEMS = [
  { href: "/dashboard/internal/sales", label: "Sales", icon: "💼", roles: ["SALES", "PLATFORM_ADMIN"] },
  { href: "/dashboard/internal/marketing", label: "Marketing", icon: "📣", roles: ["MARKETING", "PLATFORM_ADMIN"] },
  { href: "/dashboard/internal/customer-care", label: "Customer Care", icon: "💬", roles: ["CUSTOMER_CARE", "PLATFORM_ADMIN"] },
  { href: "/dashboard/internal/support", label: "Support", icon: "🛠️", roles: ["SUPPORT", "PLATFORM_ADMIN"] },
  { href: "/dashboard/internal/finance", label: "Finance", icon: "📊", roles: ["FINANCE", "PLATFORM_ADMIN"] },
  { href: "/dashboard/internal/devops", label: "DevOps", icon: "⚙️", roles: ["DEVOPS", "PLATFORM_ADMIN"] },
];

const ROLE_COLORS: Record<string, string> = {
  SALES: "text-emerald-400",
  MARKETING: "text-pink-400",
  CUSTOMER_CARE: "text-sky-400",
  SUPPORT: "text-amber-400",
  FINANCE: "text-violet-400",
  DEVOPS: "text-cyan-400",
  PLATFORM_ADMIN: "text-purple-400",
};

export default function InternalLayout({ children }: { children: React.ReactNode }) {
  const { user, logout, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  const ROUTE_ROLE_MAP: Record<string, string> = {
    "/dashboard/internal/sales": "SALES",
    "/dashboard/internal/marketing": "MARKETING",
    "/dashboard/internal/customer-care": "CUSTOMER_CARE",
    "/dashboard/internal/support": "SUPPORT",
    "/dashboard/internal/finance": "FINANCE",
    "/dashboard/internal/devops": "DEVOPS",
  };

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
      return;
    }
    if (!loading && user) {
      if (!INTERNAL_ROLES.includes(user.role)) {
        router.push("/");
        return;
      }
      if (user.role !== "PLATFORM_ADMIN") {
        const matchedRoute = Object.entries(ROUTE_ROLE_MAP).find(([path]) => pathname.startsWith(path));
        if (matchedRoute && matchedRoute[1] !== user.role) {
          const allowedSlug = user.role.toLowerCase().replace(/_/g, "-");
          router.push(`/dashboard/internal/${allowedSlug}`);
        }
      }
    }
  }, [user, loading, router, pathname]);

  if (loading || !user) return null;

  const visibleNav = NAV_ITEMS.filter((item) =>
    user.role === "PLATFORM_ADMIN" || item.roles.includes(user.role)
  );

  const isActive = (href: string) => pathname.startsWith(href);

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <aside className={`${collapsed ? "w-16" : "w-60"} bg-slate-900 text-white flex flex-col transition-all duration-200 flex-shrink-0`}>
        <div className="p-4 border-b border-slate-700 flex items-center justify-between">
          {!collapsed && (
            <div className="flex items-center gap-2">
              <Image src="/images/aivo-logo-white.png" alt="AIVO" width={80} height={24} style={{ height: "auto" }} />
              <span className={`text-[10px] font-bold uppercase tracking-wider ${ROLE_COLORS[user.role] || "text-purple-400"}`}>
                {user.role.replace(/_/g, " ")}
              </span>
            </div>
          )}
          <button onClick={() => setCollapsed(!collapsed)} className="text-slate-400 hover:text-white p-1">
            {collapsed ? "→" : "←"}
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-3">
          {user.role === "PLATFORM_ADMIN" && (
            <div className="mb-4">
              {!collapsed && <p className="px-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Admin</p>}
              <Link
                href="/dashboard/admin"
                className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-400 hover:bg-slate-800 hover:text-white transition"
              >
                <span className="text-base flex-shrink-0">🏠</span>
                {!collapsed && <span>Platform Admin</span>}
              </Link>
            </div>
          )}

          {!collapsed && <p className="px-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Teams</p>}
          {visibleNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-2.5 text-sm transition ${
                isActive(item.href)
                  ? "bg-purple-600/20 text-purple-300 border-r-2 border-purple-400 font-semibold"
                  : "text-slate-400 hover:bg-slate-800 hover:text-white"
              }`}
            >
              <span className="text-base flex-shrink-0">{item.icon}</span>
              {!collapsed && <span>{item.label}</span>}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-700">
          {!collapsed && (
            <div className="mb-3">
              <p className="text-sm font-semibold truncate">{user.name}</p>
              <p className="text-xs text-slate-400">{user.role.replace(/_/g, " ")}</p>
            </div>
          )}
          <button onClick={logout} className={`text-xs text-slate-400 hover:text-red-400 transition ${collapsed ? "w-full text-center" : ""}`}>
            {collapsed ? "🚪" : "Sign Out"}
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-auto flex flex-col">
        <DashboardHeader
          userName={user.name || "Team Member"}
          userRole={user.role}
          userEmail={user.email || undefined}
          accent="purple"
          basePath="/dashboard/internal"
          baseLabel="Internal"
        />
        <div className="flex-1 overflow-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
