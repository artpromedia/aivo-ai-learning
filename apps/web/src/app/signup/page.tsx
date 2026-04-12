"use client";
import { useState } from "react";
import { useAuth } from "@/providers/auth-provider";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

const ROLES = [
  { value: "PARENT", label: "Parent / Guardian", desc: "Manage your child's learning journey" },
  { value: "TEACHER", label: "Teacher", desc: "Track student progress and insights" },
  { value: "THERAPIST", label: "Therapist", desc: "Contribute to learner brain profiles" },
  { value: "CAREGIVER", label: "Caregiver", desc: "Support daily learning activities" },
];

export default function SignupPage() {
  const { register } = useAuth();
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("PARENT");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await register(email, password, name, role);
      router.push("/");
    } catch (err: any) {
      setError(err.message || "Registration failed");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary to-secondary items-center justify-center p-12">
        <div className="text-white space-y-6 max-w-md">
          <Image src="/images/aivo-logo-white.png" alt="AIVO" width={180} height={54} />
          <h2 className="text-3xl font-heading font-bold">Join AIVO</h2>
          <p className="text-purple-100 text-lg">Create an account to unlock AI-powered adaptive learning for every child.</p>
          <div className="space-y-3 text-purple-100">
            <div className="flex items-center gap-3"><span className="w-2 h-2 rounded-full bg-white" /> 14 specialized AI tutors</div>
            <div className="flex items-center gap-3"><span className="w-2 h-2 rounded-full bg-white" /> 5 functioning levels</div>
            <div className="flex items-center gap-3"><span className="w-2 h-2 rounded-full bg-white" /> Adaptive brain-clone technology</div>
            <div className="flex items-center gap-3"><span className="w-2 h-2 rounded-full bg-white" /> COPPA compliant</div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md space-y-6">
          <div className="lg:hidden flex justify-center">
            <Image src="/images/aivo-logo-purple.png" alt="AIVO" width={140} height={42} />
          </div>
          <h1 className="text-2xl font-heading font-bold text-slate-900">Create your account</h1>

          {error && <div className="p-3 rounded-lg bg-red-50 text-red-600 text-sm">{error}</div>}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} required
                className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:border-primary focus:ring-2 focus:ring-purple-100 outline-none transition" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
                className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:border-primary focus:ring-2 focus:ring-purple-100 outline-none transition" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8}
                className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:border-primary focus:ring-2 focus:ring-purple-100 outline-none transition" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">I am a...</label>
              <div className="grid grid-cols-2 gap-3">
                {ROLES.map((r) => (
                  <button key={r.value} type="button" onClick={() => setRole(r.value)}
                    className={`p-3 rounded-lg border-2 text-left transition ${role === r.value ? "border-primary bg-purple-50" : "border-slate-200 hover:border-slate-300"}`}>
                    <div className="font-medium text-sm">{r.label}</div>
                    <div className="text-xs text-slate-500 mt-0.5">{r.desc}</div>
                  </button>
                ))}
              </div>
            </div>
            <button type="submit" disabled={loading}
              className="w-full py-3 rounded-lg bg-primary text-white font-semibold hover:bg-primary-dark transition disabled:opacity-50">
              {loading ? "Creating account..." : "Create Account"}
            </button>
          </form>

          <p className="text-center text-sm text-slate-500">
            Already have an account?{" "}
            <Link href="/login" className="text-primary font-medium hover:underline">Log in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
