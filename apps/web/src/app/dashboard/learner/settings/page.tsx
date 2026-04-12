"use client";
import { useAuth } from "@/providers/auth-provider";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";

export default function LearnerSettingsPage() {
  const { user, accessToken, loading } = useAuth();
  const router = useRouter();
  const [soundEffects, setSoundEffects] = useState(true);
  const [music, setMusic] = useState(true);
  const [animations, setAnimations] = useState(true);
  const [highContrast, setHighContrast] = useState(false);
  const [largeText, setLargeText] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => { if (!loading && !user) router.push("/login"); }, [user, loading, router]);
  if (loading || !user) return null;

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const Toggle = ({ value, onChange, color = "bg-primary" }: { value: boolean; onChange: (v: boolean) => void; color?: string }) => (
    <button onClick={() => onChange(!value)}
      className={`w-11 h-6 rounded-full transition relative ${value ? color : "bg-slate-200"}`}>
      <span className={`absolute w-5 h-5 rounded-full bg-white shadow top-0.5 transition ${value ? "left-[22px]" : "left-0.5"}`} />
    </button>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-purple-50">
      <div className="max-w-2xl mx-auto px-6 py-8">
        <Link href="/dashboard/learner" className="text-sm text-primary hover:underline font-semibold mb-4 inline-block">← Back to Dashboard</Link>
        <h1 className="text-3xl font-heading font-bold text-slate-900 mb-8">Settings</h1>

        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
            <h2 className="font-heading font-bold text-lg text-slate-900 mb-4">My Profile</h2>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-slate-400 font-semibold uppercase">Name</label>
                <p className="text-slate-900 font-medium">{user.name}</p>
              </div>
              <div>
                <label className="text-xs text-slate-400 font-semibold uppercase">Role</label>
                <p className="text-primary font-semibold">Learner</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
            <h2 className="font-heading font-bold text-lg text-slate-900 mb-4">Sound & Effects</h2>
            <div className="space-y-4">
              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <p className="text-sm font-semibold text-slate-900">Sound Effects</p>
                  <p className="text-xs text-slate-400">Play sounds for XP, badges, and interactions</p>
                </div>
                <Toggle value={soundEffects} onChange={setSoundEffects} />
              </label>
              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <p className="text-sm font-semibold text-slate-900">Background Music</p>
                  <p className="text-xs text-slate-400">Play ambient music during lessons</p>
                </div>
                <Toggle value={music} onChange={setMusic} />
              </label>
              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <p className="text-sm font-semibold text-slate-900">Animations</p>
                  <p className="text-xs text-slate-400">Show celebration animations and effects</p>
                </div>
                <Toggle value={animations} onChange={setAnimations} />
              </label>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
            <h2 className="font-heading font-bold text-lg text-slate-900 mb-4">Accessibility</h2>
            <div className="space-y-4">
              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <p className="text-sm font-semibold text-slate-900">High Contrast Mode</p>
                  <p className="text-xs text-slate-400">Increase color contrast for better visibility</p>
                </div>
                <Toggle value={highContrast} onChange={setHighContrast} color="bg-slate-900" />
              </label>
              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <p className="text-sm font-semibold text-slate-900">Larger Text</p>
                  <p className="text-xs text-slate-400">Increase font size throughout the app</p>
                </div>
                <Toggle value={largeText} onChange={setLargeText} color="bg-slate-900" />
              </label>
              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <p className="text-sm font-semibold text-slate-900">Reduced Motion</p>
                  <p className="text-xs text-slate-400">Minimize animations and transitions</p>
                </div>
                <Toggle value={reducedMotion} onChange={setReducedMotion} color="bg-slate-900" />
              </label>
            </div>
          </div>

          {saved && <p className="text-sm text-green-600 bg-green-50 p-3 rounded-lg font-medium">Settings saved!</p>}
          <button onClick={handleSave}
            className="w-full py-3 rounded-xl bg-primary text-white font-bold text-sm hover:bg-primary-dark transition">
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
}
