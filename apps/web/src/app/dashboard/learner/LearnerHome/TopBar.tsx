"use client";
import Image from "next/image";
import { Settings, Coins, Gem, LogOut } from "lucide-react";
import { useFlVariant } from "@aivo/learner-ui";

interface TopBarProps {
  userName: string;
  coins: number;
  gems: number;
  onLogout: () => void;
  onSettings: () => void;
}

export function TopBar({ userName, coins, gems, onLogout, onSettings }: TopBarProps) {
  const { isLow, isPreSymbolic } = useFlVariant();

  return (
    <header
      className="bg-white border-b-2 border-slate-200/60 px-4 md:px-8 py-3 flex items-center justify-between sticky top-0 z-30"
      role="banner"
      aria-label="Learner navigation"
    >
      <Image src="/images/aivo-logo-purple.png" alt="AIVO" width={90} height={27} priority />
      <div className="flex items-center gap-3">
        {!isPreSymbolic && (
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[hsl(43_100%_50%/0.16)] text-[hsl(43_100%_50%)] text-sm font-extrabold">
              <Coins className="w-4 h-4" strokeWidth={2.5} aria-hidden /> {coins}
            </span>
            {!isLow && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[hsl(262_83%_58%/0.12)] text-[hsl(262_83%_58%)] text-sm font-extrabold">
                <Gem className="w-4 h-4" strokeWidth={2.5} aria-hidden /> {gems}
              </span>
            )}
          </div>
        )}
        <span className="hidden sm:inline text-base font-extrabold text-slate-900">Hi, {userName}!</span>
        <button
          onClick={onSettings}
          className="w-10 h-10 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(262_83%_58%)]"
          aria-label="Settings"
          style={{ minHeight: "var(--learner-hit-target, 40px)", minWidth: "var(--learner-hit-target, 40px)" }}
        >
          <Settings className="w-5 h-5" strokeWidth={2.5} />
        </button>
        <button
          onClick={onLogout}
          className="w-10 h-10 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-[hsl(340_82%_52%/0.1)] hover:text-[hsl(340_82%_52%)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(340_82%_52%)]"
          aria-label="Log out"
          style={{ minHeight: "var(--learner-hit-target, 40px)", minWidth: "var(--learner-hit-target, 40px)" }}
        >
          <LogOut className="w-5 h-5" strokeWidth={2.5} />
        </button>
      </div>
    </header>
  );
}
