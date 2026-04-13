"use client";
import { useAuth } from "@/providers/auth-provider";
import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";

interface TeamMember {
  id: string;
  memberType: "teacher" | "caregiver" | "therapist";
  teacherEmail?: string;
  caregiverEmail?: string;
  therapistEmail?: string;
  status: string;
  relationship?: string;
  specialty?: string;
  credentials?: string;
  invitedAt: string;
  acceptedAt?: string;
}

export default function CollaborationPage() {
  const { user, accessToken, loading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const learnerId = params.id as string;
  const t = useTranslations("parent");
  const tCommon = useTranslations("common");

  const [members, setMembers] = useState<{ teachers: TeamMember[]; caregivers: TeamMember[]; therapists: TeamMember[] }>({
    teachers: [], caregivers: [], therapists: [],
  });
  const [showInvite, setShowInvite] = useState<"teacher" | "caregiver" | "therapist" | null>(null);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRelationship, setInviteRelationship] = useState("");
  const [inviteSpecialty, setInviteSpecialty] = useState("");
  const [inviteCredentials, setInviteCredentials] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [user, loading, router]);

  const fetchMembers = async () => {
    if (!accessToken || !learnerId) return;
    try {
      const res = await fetch(`/api/family/collaboration/${learnerId}/members`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (res.ok) setMembers(await res.json());
    } catch (err) {
      console.error("Failed to fetch members:", err);
    }
  };

  useEffect(() => { fetchMembers(); }, [accessToken, learnerId]);

  const inviteMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showInvite || !inviteEmail) return;
    setSubmitting(true);
    setError("");

    const body: Record<string, string> = { email: inviteEmail };
    if (showInvite === "caregiver") body.relationship = inviteRelationship;
    if (showInvite === "therapist") {
      body.specialty = inviteSpecialty;
      body.credentials = inviteCredentials;
    }

    try {
      const res = await fetch(`/api/family/collaboration/${learnerId}/invite/${showInvite}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        setShowInvite(null);
        setInviteEmail("");
        setInviteRelationship("");
        setInviteSpecialty("");
        setInviteCredentials("");
        fetchMembers();
      } else {
        const data = await res.json();
        setError(data.error || t("failed_invite"));
      }
    } catch {
      setError(t("network_error_retry"));
    }
    setSubmitting(false);
  };

  const removeMember = async (memberId: string, memberType: string) => {
    if (!confirm(t("remove_team_member"))) return;
    try {
      await fetch(`/api/family/collaboration/${learnerId}/member/${memberId}?memberType=${memberType}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      fetchMembers();
    } catch (err) {
      console.error("Failed to remove member:", err);
    }
  };

  const getEmail = (m: TeamMember) => m.teacherEmail || m.caregiverEmail || m.therapistEmail || "";

  if (loading || !user) return null;

  const STATUS_COLORS: Record<string, string> = {
    PENDING: "bg-amber-100 text-amber-700",
    ACCEPTED: "bg-green-100 text-green-700",
    ACTIVE: "bg-green-100 text-green-700",
    DECLINED: "bg-red-100 text-red-700",
  };

  const allMembers = [
    ...members.teachers.map(m => ({ ...m, memberType: "teacher" as const })),
    ...members.caregivers.map(m => ({ ...m, memberType: "caregiver" as const })),
    ...members.therapists.map(m => ({ ...m, memberType: "therapist" as const })),
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-cyan-50">
      <header className="bg-white/80 backdrop-blur border-b border-slate-200 px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => router.push("/dashboard/parent")}
            className="text-sm text-slate-500 hover:text-primary font-semibold">{t("back_to_dashboard")}</button>
          <Image src="/images/aivo-logo-purple.png" alt="AIVO" width={120} height={36} />
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-8 py-8 space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-heading font-bold text-slate-900">{t("learning_team")}</h1>
            <p className="text-slate-500 mt-1">{t("collaborate_desc")}</p>
          </div>
        </div>

        <div className="flex gap-3">
          <button onClick={() => setShowInvite("teacher")}
            className="px-5 py-2.5 rounded-full bg-blue-50 text-blue-700 font-bold hover:bg-blue-100 transition text-sm">
            {t("invite_teacher")}
          </button>
          <button onClick={() => setShowInvite("caregiver")}
            className="px-5 py-2.5 rounded-full bg-green-50 text-green-700 font-bold hover:bg-green-100 transition text-sm">
            {t("invite_caregiver")}
          </button>
          <button onClick={() => setShowInvite("therapist")}
            className="px-5 py-2.5 rounded-full bg-purple-50 text-purple-700 font-bold hover:bg-purple-100 transition text-sm">
            {t("invite_therapist")}
          </button>
        </div>

        {showInvite && (
          <form onSubmit={inviteMember} className="bg-white rounded-2xl p-6 shadow-md border border-slate-100 space-y-4">
            <h3 className="font-heading font-bold text-lg text-slate-900 capitalize">
              {t("invite_title", { type: showInvite })}
            </h3>

            {error && <div className="p-3 rounded-xl bg-red-50 text-red-700 text-sm font-semibold">{error}</div>}

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">{t("email_address")}</label>
              <input type="email" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} required
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-primary focus:ring-2 focus:ring-purple-100 outline-none font-body" />
            </div>

            {showInvite === "caregiver" && (
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">{t("relationship")}</label>
                <input type="text" value={inviteRelationship} onChange={(e) => setInviteRelationship(e.target.value)}
                  placeholder={t("relationship_placeholder")}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-primary focus:ring-2 focus:ring-purple-100 outline-none font-body" />
              </div>
            )}

            {showInvite === "therapist" && (
              <>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">{t("specialty")}</label>
                  <input type="text" value={inviteSpecialty} onChange={(e) => setInviteSpecialty(e.target.value)}
                    placeholder={t("specialty_placeholder")}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-primary focus:ring-2 focus:ring-purple-100 outline-none font-body" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">{t("credentials")}</label>
                  <input type="text" value={inviteCredentials} onChange={(e) => setInviteCredentials(e.target.value)}
                    placeholder={t("credentials_placeholder")}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-primary focus:ring-2 focus:ring-purple-100 outline-none font-body" />
                </div>
              </>
            )}

            <div className="flex gap-3">
              <button type="submit" disabled={submitting}
                className="px-6 py-2.5 rounded-full bg-primary text-white font-bold hover:bg-primary-dark transition disabled:opacity-50">
                {submitting ? t("sending") : t("send_invite")}
              </button>
              <button type="button" onClick={() => { setShowInvite(null); setError(""); }}
                className="px-6 py-2.5 rounded-full bg-slate-100 text-slate-600 font-bold hover:bg-slate-200 transition">
                {tCommon("cancel")}
              </button>
            </div>

            {showInvite === "teacher" && (
              <p className="text-xs text-slate-400">{t("teacher_slot_info")}</p>
            )}
            {showInvite === "caregiver" && (
              <p className="text-xs text-slate-400">{t("caregiver_slot_info")}</p>
            )}
            {showInvite === "therapist" && (
              <p className="text-xs text-slate-400">{t("therapist_slot_info")}</p>
            )}
          </form>
        )}

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <h2 className="font-heading font-bold text-xl text-slate-900 mb-4">{t("team_members")}</h2>

          {allMembers.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-5xl mb-3">👥</div>
              <p className="text-slate-500 font-semibold">{t("no_team_members")}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {allMembers.map((m) => (
                <div key={m.id} className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                      m.memberType === "teacher" ? "bg-blue-500" : m.memberType === "caregiver" ? "bg-green-500" : "bg-purple-500"
                    }`}>
                      {m.memberType === "teacher" ? "T" : m.memberType === "caregiver" ? "C" : "Th"}
                    </div>
                    <div>
                      <div className="font-bold text-slate-800">{getEmail(m)}</div>
                      <div className="text-xs text-slate-400 capitalize">
                        {m.memberType}
                        {m.relationship && ` — ${m.relationship}`}
                        {m.specialty && ` — ${m.specialty}`}
                        {m.credentials && ` (${m.credentials})`}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 text-xs rounded-full font-bold ${STATUS_COLORS[m.status] || "bg-slate-100 text-slate-500"}`}>
                      {m.status}
                    </span>
                    <button onClick={() => removeMember(m.id, m.memberType)}
                      className="text-xs text-red-400 hover:text-red-600 font-bold transition">
                      {tCommon("remove")}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
