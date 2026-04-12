"use client";
import { useAuth } from "@/providers/auth-provider";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import { TUTORS } from "@aivo/brand";
import BrainVisualization from "@/components/BrainVisualization";

interface Learner {
  id: string;
  name: string;
  functioningLevel: string;
  gradeLevel: string;
  zipCode?: string;
  country?: string;
  districtName?: string;
  curriculumFramework?: string;
}

interface CurriculumInfo {
  country: string;
  state?: string;
  districtId?: string;
  districtName?: string;
  curriculumFramework: string;
  standards: string;
}

const COUNTRIES = [
  { code: "US", label: "United States" },
  { code: "GB", label: "United Kingdom" },
  { code: "CA_INT", label: "Canada" },
  { code: "AU", label: "Australia" },
  { code: "NZ", label: "New Zealand" },
  { code: "IE", label: "Ireland" },
  { code: "SG", label: "Singapore" },
  { code: "IN", label: "India" },
  { code: "AE", label: "UAE" },
  { code: "ZA", label: "South Africa" },
  { code: "PH", label: "Philippines" },
  { code: "KE", label: "Kenya" },
  { code: "NG", label: "Nigeria" },
  { code: "JP", label: "Japan" },
  { code: "KR", label: "South Korea" },
  { code: "DE", label: "Germany" },
  { code: "FR", label: "France" },
  { code: "BR", label: "Brazil" },
  { code: "MX", label: "Mexico" },
];

export default function ParentDashboard() {
  const { user, accessToken, logout, loading } = useAuth();
  const router = useRouter();
  const [learners, setLearners] = useState<Learner[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newLearner, setNewLearner] = useState({
    name: "", gradeLevel: "", pin: "", zipCode: "", country: "US", region: "",
  });
  const [curriculumInfo, setCurriculumInfo] = useState<CurriculumInfo | null>(null);
  const [curriculumLoading, setCurriculumLoading] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.push("/login");
    if (!loading && user && user.role !== "PARENT" && user.role !== "PLATFORM_ADMIN") router.push("/");
  }, [user, loading, router]);

  useEffect(() => {
    if (accessToken) {
      fetch("/api/users/learners", { headers: { Authorization: `Bearer ${accessToken}` } })
        .then((r) => r.json())
        .then(setLearners)
        .catch(() => {});
    }
  }, [accessToken]);

  const lookupCurriculum = useCallback(async (zipCode: string, country: string) => {
    if (!zipCode && country === "US") return;
    setCurriculumLoading(true);
    try {
      const params = new URLSearchParams();
      if (zipCode) params.set("zipCode", zipCode);
      if (country) params.set("country", country);
      const res = await fetch(`/api/curriculum/lookup?${params}`);
      if (res.ok) {
        const data = await res.json();
        setCurriculumInfo(data);
      }
    } catch {
      setCurriculumInfo(null);
    }
    setCurriculumLoading(false);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (newLearner.zipCode.length >= 3 || newLearner.country !== "US") {
        lookupCurriculum(newLearner.zipCode, newLearner.country);
      } else {
        setCurriculumInfo(null);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [newLearner.zipCode, newLearner.country, lookupCurriculum]);

  const addLearner = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/users/learners", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify(newLearner),
    });
    if (res.ok) {
      const data = await res.json();
      setLearners([...learners, data.learner]);
      setShowAddForm(false);
      setNewLearner({ name: "", gradeLevel: "", pin: "", zipCode: "", country: "US", region: "" });
      setCurriculumInfo(null);
    }
  };

  if (loading || !user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-cyan-50">
      <header className="bg-white/80 backdrop-blur border-b border-slate-200 px-8 py-4 flex items-center justify-between">
        <Image src="/images/aivo-logo-purple.png" alt="AIVO" width={120} height={36} />
        <div className="flex items-center gap-4">
          <span className="text-sm font-semibold text-slate-600">Welcome, {user.name}</span>
          <span className="px-3 py-1 text-xs rounded-full bg-purple-100 text-primary font-bold">{user.role}</span>
          <button onClick={logout} className="text-sm text-slate-500 hover:text-red-500 font-semibold transition">Logout</button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-8 py-8 space-y-8">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-heading font-bold text-slate-900">Your Learners</h1>
          <button onClick={() => setShowAddForm(!showAddForm)}
            className="px-6 py-2.5 rounded-full bg-primary text-white font-bold hover:bg-primary-dark transition shadow-lg shadow-purple-200">
            + Add Learner
          </button>
        </div>

        {showAddForm && (
          <form onSubmit={addLearner} className="bg-white rounded-2xl p-8 shadow-md border border-slate-100 space-y-6">
            <h3 className="font-heading font-bold text-xl text-slate-900">Add a New Learner</h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Name</label>
                <input type="text" value={newLearner.name} onChange={(e) => setNewLearner({...newLearner, name: e.target.value})} required
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-primary focus:ring-2 focus:ring-purple-100 outline-none font-body" />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Grade Level</label>
                <input type="text" value={newLearner.gradeLevel} onChange={(e) => setNewLearner({...newLearner, gradeLevel: e.target.value})}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-primary focus:ring-2 focus:ring-purple-100 outline-none font-body" placeholder="e.g. 3rd" />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">PIN (for learner login)</label>
                <input type="text" value={newLearner.pin} onChange={(e) => setNewLearner({...newLearner, pin: e.target.value})} maxLength={6}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-primary focus:ring-2 focus:ring-purple-100 outline-none font-body" placeholder="4-6 digits" />
              </div>
            </div>

            <div className="border-t border-slate-100 pt-6">
              <h4 className="font-heading font-bold text-lg text-slate-800 mb-4">Curriculum Location</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Country</label>
                  <select value={newLearner.country} onChange={(e) => setNewLearner({...newLearner, country: e.target.value})}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-primary focus:ring-2 focus:ring-purple-100 outline-none font-body bg-white">
                    {COUNTRIES.map((c) => (
                      <option key={c.code} value={c.code}>{c.label}</option>
                    ))}
                  </select>
                </div>
                {newLearner.country === "US" && (
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Zip Code</label>
                    <input type="text" value={newLearner.zipCode} onChange={(e) => setNewLearner({...newLearner, zipCode: e.target.value})}
                      maxLength={5} placeholder="e.g. 90210"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-primary focus:ring-2 focus:ring-purple-100 outline-none font-body" />
                  </div>
                )}
                {newLearner.country !== "US" && (
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Region / Province</label>
                    <input type="text" value={newLearner.region} onChange={(e) => setNewLearner({...newLearner, region: e.target.value})}
                      placeholder="e.g. Ontario, London"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-primary focus:ring-2 focus:ring-purple-100 outline-none font-body" />
                  </div>
                )}
                <div className="flex items-end">
                  {curriculumLoading && (
                    <div className="px-4 py-2.5 text-sm text-slate-400 font-semibold">Looking up curriculum...</div>
                  )}
                </div>
              </div>

              {curriculumInfo && (
                <div className="mt-4 p-4 rounded-xl bg-green-50 border border-green-200">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-green-600 text-lg">&#10003;</span>
                    <span className="font-heading font-bold text-green-800">Curriculum Detected</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                    <div><span className="font-bold text-green-700">Framework:</span> <span className="text-green-900">{curriculumInfo.curriculumFramework}</span></div>
                    <div><span className="font-bold text-green-700">Standards:</span> <span className="text-green-900">{curriculumInfo.standards}</span></div>
                    {curriculumInfo.state && (
                      <div><span className="font-bold text-green-700">State:</span> <span className="text-green-900">{curriculumInfo.state}</span></div>
                    )}
                    {curriculumInfo.districtName && (
                      <div><span className="font-bold text-green-700">District:</span> <span className="text-green-900">{curriculumInfo.districtName}</span></div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <button type="submit" className="px-8 py-3 rounded-full bg-primary text-white font-bold hover:bg-primary-dark transition shadow-lg shadow-purple-200">
              Create Learner
            </button>
          </form>
        )}

        {learners.length === 0 && !showAddForm ? (
          <div className="bg-white rounded-2xl p-16 text-center border border-slate-100 shadow-sm">
            <div className="text-5xl mb-4">🎮</div>
            <p className="text-slate-500 text-lg font-semibold">No learners yet. Add your first learner to start the adventure!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {learners.map((l) => (
              <div key={l.id} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:shadow-lg transition">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-heading font-bold text-slate-900">{l.name}</h3>
                  <span className="px-3 py-1 text-xs rounded-full bg-purple-100 text-primary font-bold">
                    {l.functioningLevel || "Pending Assessment"}
                  </span>
                </div>
                {l.gradeLevel && <p className="text-sm text-slate-500 font-semibold">Grade: {l.gradeLevel}</p>}
                {l.curriculumFramework && (
                  <p className="text-sm text-cyan-600 mt-1 font-semibold">{l.curriculumFramework}</p>
                )}
                {l.districtName && (
                  <p className="text-xs text-slate-400 mt-0.5">{l.districtName}</p>
                )}
                {accessToken && (
                  <div className="mt-4">
                    <BrainVisualization
                      learnerId={l.id}
                      learnerName={l.name}
                      accessToken={accessToken}
                      compact
                    />
                  </div>
                )}
                <div className="mt-4 flex gap-2 flex-wrap">
                  <button onClick={() => router.push(`/dashboard/parent/learner/${l.id}`)}
                    className="px-4 py-2 text-sm rounded-full bg-purple-50 text-primary font-bold hover:bg-purple-100 transition">
                    View Profile
                  </button>
                  <button onClick={() => router.push(`/dashboard/parent/learner/${l.id}/assessment`)}
                    className="px-4 py-2 text-sm rounded-full bg-cyan-50 text-secondary font-bold hover:bg-cyan-100 transition">
                    Start Assessment
                  </button>
                  <button onClick={() => router.push(`/dashboard/parent/learner/${l.id}/gradebook`)}
                    className="px-4 py-2 text-sm rounded-full bg-green-50 text-green-700 font-bold hover:bg-green-100 transition">
                    Gradebook
                  </button>
                  <button onClick={() => router.push(`/dashboard/parent/${l.id}/homework`)}
                    className="px-4 py-2 text-sm rounded-full bg-amber-50 text-amber-700 font-bold hover:bg-amber-100 transition">
                    Homework
                  </button>
                  <button onClick={() => router.push(`/dashboard/parent/learner/${l.id}/collaboration`)}
                    className="px-4 py-2 text-sm rounded-full bg-blue-50 text-blue-700 font-bold hover:bg-blue-100 transition">
                    Team
                  </button>
                  <button onClick={() => router.push(`/dashboard/parent/learner/${l.id}/recommendations`)}
                    className="px-4 py-2 text-sm rounded-full bg-pink-50 text-pink-700 font-bold hover:bg-pink-100 transition">
                    Inbox
                  </button>
                  <button onClick={() => router.push(`/dashboard/parent/learner/${l.id}/iep`)}
                    className="px-4 py-2 text-sm rounded-full bg-indigo-50 text-indigo-700 font-bold hover:bg-indigo-100 transition">
                    IEP Goals
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xl font-heading font-bold text-slate-900">Available Tutors</h2>
            <button onClick={() => router.push("/dashboard/parent/store")}
              className="px-4 py-2 text-sm rounded-full bg-primary text-white font-bold hover:bg-primary-dark transition">
              Tutor Store
            </button>
          </div>
          <p className="text-sm text-slate-500 mb-6">7 core tutors + 7 expansion specialists</p>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-7 gap-4">
            {Object.entries(TUTORS).map(([key, tutor]) => (
              <div key={key} className="text-center p-3 rounded-2xl hover:bg-slate-50 transition cursor-pointer group">
                <div className="relative w-16 h-16 mx-auto mb-2 rounded-full overflow-hidden border-2 group-hover:scale-110 transition-transform shadow-md" style={{ borderColor: tutor.color }}>
                  <Image
                    src={tutor.avatar}
                    alt={`${tutor.name} - ${tutor.domain}`}
                    fill
                    className="object-cover object-top"
                    sizes="64px"
                  />
                </div>
                <div className="font-heading font-bold text-sm" style={{ color: tutor.color }}>{tutor.name}</div>
                <div className="text-xs text-slate-500 mt-0.5 leading-tight">{tutor.domain}</div>
                {tutor.tier === "expansion" && (
                  <span className="inline-block mt-1 px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-amber-50 text-amber-600">NEW</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
