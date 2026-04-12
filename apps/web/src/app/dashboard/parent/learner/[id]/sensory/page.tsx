"use client";
import { useAuth } from "@/providers/auth-provider";
import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";

const MODALITIES = [
  {
    key: "visual",
    label: "Visual",
    icon: "👁️",
    description: "How does your child respond to lights, colors, and visual patterns?",
    hyperDesc: "Bothered by bright lights, avoids visually busy environments",
    hypoDesc: "Seeks visual stimulation, stares at lights or spinning objects",
  },
  {
    key: "auditory",
    label: "Auditory",
    icon: "👂",
    description: "How does your child respond to sounds?",
    hyperDesc: "Covers ears, distressed by loud or unexpected sounds",
    hypoDesc: "Doesn't respond to name, seeks loud sounds or music",
  },
  {
    key: "tactile",
    label: "Tactile",
    icon: "✋",
    description: "How does your child respond to touch and textures?",
    hyperDesc: "Avoids certain textures, dislikes being touched, picky about clothing",
    hypoDesc: "Seeks touch, doesn't notice pain, mouths objects",
  },
  {
    key: "vestibular",
    label: "Vestibular",
    icon: "🎡",
    description: "How does your child respond to movement and balance?",
    hyperDesc: "Fearful of heights/movement, gets carsick easily, avoids swings",
    hypoDesc: "Seeks spinning, rocking, or swinging; doesn't get dizzy",
  },
  {
    key: "proprioceptive",
    label: "Proprioceptive",
    icon: "💪",
    description: "How does your child respond to body awareness and pressure?",
    hyperDesc: "Avoids heavy lifting, doesn't like tight clothing or hugs",
    hypoDesc: "Crashes into things, seeks deep pressure, chews on objects",
  },
];

export default function SensoryProfilePage() {
  const { user, accessToken, loading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const learnerId = params.id as string;

  const [profile, setProfile] = useState<Record<string, string>>({
    visual: "typical",
    auditory: "typical",
    tactile: "typical",
    vestibular: "typical",
    proprioceptive: "typical",
  });
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [existingProfile, setExistingProfile] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [user, loading, router]);

  useEffect(() => {
    if (!accessToken || !learnerId) return;
    fetch(`/api/assessments/sensory-profile/${learnerId}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
      .then((r) => {
        if (r.ok) return r.json();
        return null;
      })
      .then((data) => {
        if (data && data.visual) {
          setProfile({
            visual: data.visual,
            auditory: data.auditory,
            tactile: data.tactile,
            vestibular: data.vestibular,
            proprioceptive: data.proprioceptive,
          });
          setNotes(data.notes || "");
          setExistingProfile(true);
        }
      })
      .catch(() => {});
  }, [accessToken, learnerId]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/assessments/sensory-profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ learnerId, ...profile, notes }),
      });
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading || !user) return null;

  return (
    <div className="min-h-screen bg-surface">
      <header className="bg-white border-b border-slate-200 px-8 py-4 flex items-center justify-between">
        <Link href="/dashboard/parent" className="text-primary font-heading font-bold text-lg">
          &larr; Back to Dashboard
        </Link>
        <h1 className="text-xl font-heading font-bold text-slate-900">Sensory Profile</h1>
        <div />
      </header>

      <main className="max-w-3xl mx-auto px-6 py-8 space-y-6">
        <div className="bg-purple-50 rounded-xl p-6 border border-purple-100">
          <h2 className="text-lg font-heading font-bold text-purple-800 mb-2">
            Understanding Your Child's Sensory Needs
          </h2>
          <p className="text-sm text-purple-600">
            This information helps AIVO adapt all generated content — adjusting colors, animations,
            sound levels, visual complexity, and text density based on your child's sensory profile.
          </p>
        </div>

        {MODALITIES.map((mod) => (
          <div key={mod.key} className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-2xl">{mod.icon}</span>
              <div>
                <h3 className="font-heading font-bold text-slate-900">{mod.label}</h3>
                <p className="text-sm text-slate-500">{mod.description}</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 mt-4">
              {[
                { value: "hyper", label: "Hyper-sensitive", desc: mod.hyperDesc, color: "border-red-300 bg-red-50" },
                { value: "typical", label: "Typical", desc: "Responds as expected for age", color: "border-green-300 bg-green-50" },
                { value: "hypo", label: "Hypo-sensitive", desc: mod.hypoDesc, color: "border-blue-300 bg-blue-50" },
              ].map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setProfile((p) => ({ ...p, [mod.key]: opt.value }))}
                  className={`p-4 rounded-lg border-2 text-left transition ${
                    profile[mod.key] === opt.value
                      ? `${opt.color} ring-2 ring-primary`
                      : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
                >
                  <div className="font-semibold text-sm text-slate-900">{opt.label}</div>
                  <div className="text-xs text-slate-500 mt-1">{opt.desc}</div>
                </button>
              ))}
            </div>
          </div>
        ))}

        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
          <h3 className="font-heading font-bold text-slate-900 mb-3">Additional Notes</h3>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Any additional sensory observations or therapist recommendations..."
            className="w-full h-24 p-3 border border-slate-300 rounded-lg text-sm resize-none focus:ring-2 focus:ring-primary focus:border-primary"
          />
        </div>

        <div className="flex items-center justify-between">
          <Link
            href={`/dashboard/parent/learner/${learnerId}/assessment`}
            className="text-sm text-slate-500 hover:text-primary"
          >
            Skip for now
          </Link>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-8 py-3 rounded-full bg-primary text-white font-bold hover:bg-primary-dark transition disabled:opacity-50"
          >
            {saving ? "Saving..." : saved ? "Saved!" : existingProfile ? "Update Profile" : "Save Profile"}
          </button>
        </div>
      </main>
    </div>
  );
}
