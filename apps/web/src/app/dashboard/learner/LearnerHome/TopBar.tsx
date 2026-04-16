"use client";
import Image from "next/image";
import { useRouter } from "next/navigation";
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
      className="bg-white/80 backdrop-blur-md border-b border-slate-200 px-4 md:px-8 py-3 flex items-center justify-between sticky top-0 z-30"
      role="banner"
      aria-label="Learner navigation"
    >
      <Image src="/images/aivo-logo-purple.png" alt="AIVO" width={90} height={27} priority />
      <div className="flex items-center gap-3">
        {!isPreSymbolic && (
          <div className="flex items-center gap-2 text-sm">
            <span className="inline-flex items-center gap-1 font-bold text-amber-600">
              <span aria-hidden="true">🪙</span> {coins}
            </span>
            {!isLow && (
              <span className="inline-flex items-center gap-1 font-bold text-purple-600">
                <span aria-hidden="true">💎</span> {gems}
              </span>
            )}
          </div>
        )}
        <span className="text-base font-heading font-bold text-slate-800">
          Hi, {userName}!
        </span>
        <button
          onClick={onSettings}
          className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400"
          aria-label="Settings"
          style={{ minHeight: "var(--learner-hit-target, 36px)", minWidth: "var(--learner-hit-target, 36px)" }}
        >
          ⚙️
        </button>
      </div>
    </header>
  );
}
