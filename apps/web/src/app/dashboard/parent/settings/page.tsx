"use client";
import { useAuth } from "@/providers/auth-provider";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";

export default function ParentSettingsPage() {
  const { user, accessToken, logout, loading } = useAuth();
  const router = useRouter();

  const [profileName, setProfileName] = useState("");
  const [profileEmail, setProfileEmail] = useState("");
  const [profileMsg, setProfileMsg] = useState("");
  const [profileErr, setProfileErr] = useState("");
  const [profileLoading, setProfileLoading] = useState(false);

  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [pwMsg, setPwMsg] = useState("");
  const [pwErr, setPwErr] = useState("");
  const [pwLoading, setPwLoading] = useState(false);

  const [notifPrefs, setNotifPrefs] = useState({
    emailEnabled: true, emailDigest: "daily", emailMarketing: false,
    pushEnabled: true, pushSessionReminders: true, pushProgressUpdates: true,
    smsEnabled: false,
  });
  const [notifMsg, setNotifMsg] = useState("");

  const [learners, setLearners] = useState<{ id: string; name: string }[]>([]);
  const [deleteLearnerId, setDeleteLearnerId] = useState<string | null>(null);
  const [deleteLearnerConfirm, setDeleteLearnerConfirm] = useState("");
  const [deleteLearnerMsg, setDeleteLearnerMsg] = useState("");

  const [showDeleteAccount, setShowDeleteAccount] = useState(false);
  const [deleteAccPw, setDeleteAccPw] = useState("");
  const [deleteAccErr, setDeleteAccErr] = useState("");
  const [deleteAccLoading, setDeleteAccLoading] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.push("/login");
    if (!loading && user && user.role !== "PARENT") router.push("/");
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      setProfileName(user.name || "");
      setProfileEmail(user.email || "");
    }
  }, [user]);

  useEffect(() => {
    if (!accessToken) return;
    fetch("/api/users/learners", { headers: { Authorization: `Bearer ${accessToken}` } })
      .then(r => r.json())
      .then(data => setLearners(Array.isArray(data) ? data : data.learners || []))
      .catch(() => {});

    fetch("/api/comms/preferences/" + user?.id, { headers: { Authorization: `Bearer ${accessToken}` } })
      .then(r => r.json())
      .then(data => {
        if (data.email) {
          setNotifPrefs({
            emailEnabled: data.email.enabled ?? true,
            emailDigest: data.email.digest ?? "daily",
            emailMarketing: data.email.marketing ?? false,
            pushEnabled: data.push?.enabled ?? true,
            pushSessionReminders: data.push?.sessionReminders ?? true,
            pushProgressUpdates: data.push?.progressUpdates ?? true,
            smsEnabled: data.sms?.enabled ?? false,
          });
        }
      })
      .catch(() => {});
  }, [accessToken, user?.id]);

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileMsg(""); setProfileErr("");
    setProfileLoading(true);
    try {
      const res = await fetch("/api/auth/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ name: profileName, email: profileEmail }),
      });
      const data = await res.json();
      if (!res.ok) setProfileErr(data.error || "Update failed");
      else setProfileMsg("Profile updated successfully.");
    } catch { setProfileErr("Network error"); }
    setProfileLoading(false);
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwMsg(""); setPwErr("");
    if (newPw !== confirmPw) { setPwErr("New passwords do not match."); return; }
    setPwLoading(true);
    try {
      const res = await fetch("/api/auth/password", {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ currentPassword: currentPw, newPassword: newPw }),
      });
      const data = await res.json();
      if (!res.ok) setPwErr(data.error || "Password change failed");
      else { setPwMsg("Password changed successfully."); setCurrentPw(""); setNewPw(""); setConfirmPw(""); }
    } catch { setPwErr("Network error"); }
    setPwLoading(false);
  };

  const handleNotifSave = async () => {
    setNotifMsg("");
    try {
      await fetch("/api/comms/preferences/" + user?.id, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({
          email: { enabled: notifPrefs.emailEnabled, digest: notifPrefs.emailDigest, marketing: notifPrefs.emailMarketing },
          push: { enabled: notifPrefs.pushEnabled, sessionReminders: notifPrefs.pushSessionReminders, progressUpdates: notifPrefs.pushProgressUpdates },
          sms: { enabled: notifPrefs.smsEnabled },
        }),
      });
      setNotifMsg("Notification preferences saved.");
    } catch {}
  };

  const handleDownloadData = async (learnerId: string) => {
    const res = await fetch(`/api/family/data-export/${learnerId}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (res.ok) {
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `aivo-data-export-${learnerId}.json`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const handleDeleteLearner = async () => {
    if (!deleteLearnerId) return;
    const learner = learners.find(l => l.id === deleteLearnerId);
    if (deleteLearnerConfirm !== learner?.name) { setDeleteLearnerMsg("Name does not match."); return; }

    const res = await fetch(`/api/auth/learner/${deleteLearnerId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (res.ok) {
      setLearners(learners.filter(l => l.id !== deleteLearnerId));
      setDeleteLearnerId(null);
      setDeleteLearnerConfirm("");
      setDeleteLearnerMsg("Learner removed successfully.");
    } else {
      const data = await res.json();
      setDeleteLearnerMsg(data.error || "Failed to remove learner.");
    }
  };

  const handleDeleteAccount = async () => {
    setDeleteAccErr("");
    setDeleteAccLoading(true);
    try {
      const res = await fetch("/api/auth/account", {
        method: "DELETE",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ password: deleteAccPw }),
      });
      const data = await res.json();
      if (!res.ok) setDeleteAccErr(data.error || "Deletion failed");
      else { logout(); router.push("/"); }
    } catch { setDeleteAccErr("Network error"); }
    setDeleteAccLoading(false);
  };

  if (loading || !user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-cyan-50">
      <header className="bg-white/80 backdrop-blur border-b border-slate-200 px-8 py-4 flex items-center justify-between">
        <Image src="/images/aivo-logo-purple.png" alt="AIVO" width={120} height={36} />
        <div className="flex items-center gap-4">
          <Link href="/dashboard/parent" className="text-sm text-primary font-semibold hover:underline">Dashboard</Link>
          <Link href="/dashboard/parent/billing" className="text-sm text-slate-500 font-semibold hover:text-primary">Billing</Link>
          <span className="text-sm font-semibold text-slate-600">{user.name}</span>
          <button onClick={logout} className="text-sm text-slate-500 hover:text-red-500 font-semibold transition">Logout</button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-8 py-8 space-y-8">
        <h1 className="text-2xl font-heading font-bold text-slate-900">Account Settings</h1>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 space-y-5">
          <h2 className="text-lg font-heading font-bold text-slate-900">Profile Information</h2>
          {profileMsg && <p className="text-sm text-green-600 bg-green-50 p-2 rounded">{profileMsg}</p>}
          {profileErr && <p className="text-sm text-red-600 bg-red-50 p-2 rounded">{profileErr}</p>}
          <form onSubmit={handleProfileUpdate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
              <input type="text" value={profileName} onChange={e => setProfileName(e.target.value)} required
                className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:border-primary focus:ring-2 focus:ring-purple-100 outline-none transition" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
              <input type="email" value={profileEmail} onChange={e => setProfileEmail(e.target.value)} required
                className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:border-primary focus:ring-2 focus:ring-purple-100 outline-none transition" />
            </div>
            <button type="submit" disabled={profileLoading}
              className="px-6 py-2.5 rounded-lg bg-primary text-white font-semibold hover:bg-primary-dark transition disabled:opacity-50 text-sm">
              {profileLoading ? "Saving..." : "Save Changes"}
            </button>
          </form>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 space-y-5">
          <h2 className="text-lg font-heading font-bold text-slate-900">Change Password</h2>
          {pwMsg && <p className="text-sm text-green-600 bg-green-50 p-2 rounded">{pwMsg}</p>}
          {pwErr && <p className="text-sm text-red-600 bg-red-50 p-2 rounded">{pwErr}</p>}
          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Current Password</label>
              <input type="password" value={currentPw} onChange={e => setCurrentPw(e.target.value)} required
                className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:border-primary focus:ring-2 focus:ring-purple-100 outline-none transition" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">New Password</label>
                <input type="password" value={newPw} onChange={e => setNewPw(e.target.value)} required minLength={8}
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:border-primary focus:ring-2 focus:ring-purple-100 outline-none transition" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Confirm New Password</label>
                <input type="password" value={confirmPw} onChange={e => setConfirmPw(e.target.value)} required minLength={8}
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:border-primary focus:ring-2 focus:ring-purple-100 outline-none transition" />
              </div>
            </div>
            <button type="submit" disabled={pwLoading}
              className="px-6 py-2.5 rounded-lg bg-primary text-white font-semibold hover:bg-primary-dark transition disabled:opacity-50 text-sm">
              {pwLoading ? "Changing..." : "Change Password"}
            </button>
          </form>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 space-y-5">
          <h2 className="text-lg font-heading font-bold text-slate-900">Notification Preferences</h2>
          {notifMsg && <p className="text-sm text-green-600 bg-green-50 p-2 rounded">{notifMsg}</p>}
          <div className="space-y-4">
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-slate-700">Email Notifications</h3>
              <label className="flex items-center gap-3">
                <input type="checkbox" checked={notifPrefs.emailEnabled} onChange={e => setNotifPrefs({ ...notifPrefs, emailEnabled: e.target.checked })}
                  className="w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary" />
                <span className="text-sm text-slate-600">Enable email notifications</span>
              </label>
              <div className="ml-7">
                <label className="block text-xs text-slate-500 mb-1">Digest frequency</label>
                <select value={notifPrefs.emailDigest} onChange={e => setNotifPrefs({ ...notifPrefs, emailDigest: e.target.value })}
                  className="px-3 py-1.5 rounded border border-slate-200 text-sm">
                  <option value="realtime">Real-time</option>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                </select>
              </div>
              <label className="flex items-center gap-3">
                <input type="checkbox" checked={notifPrefs.emailMarketing} onChange={e => setNotifPrefs({ ...notifPrefs, emailMarketing: e.target.checked })}
                  className="w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary" />
                <span className="text-sm text-slate-600">Product updates and tips</span>
              </label>
            </div>
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-slate-700">Push Notifications</h3>
              <label className="flex items-center gap-3">
                <input type="checkbox" checked={notifPrefs.pushEnabled} onChange={e => setNotifPrefs({ ...notifPrefs, pushEnabled: e.target.checked })}
                  className="w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary" />
                <span className="text-sm text-slate-600">Enable push notifications</span>
              </label>
              <label className="flex items-center gap-3 ml-7">
                <input type="checkbox" checked={notifPrefs.pushSessionReminders} onChange={e => setNotifPrefs({ ...notifPrefs, pushSessionReminders: e.target.checked })}
                  className="w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary" />
                <span className="text-sm text-slate-600">Session reminders</span>
              </label>
              <label className="flex items-center gap-3 ml-7">
                <input type="checkbox" checked={notifPrefs.pushProgressUpdates} onChange={e => setNotifPrefs({ ...notifPrefs, pushProgressUpdates: e.target.checked })}
                  className="w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary" />
                <span className="text-sm text-slate-600">Progress updates</span>
              </label>
            </div>
            <label className="flex items-center gap-3">
              <input type="checkbox" checked={notifPrefs.smsEnabled} onChange={e => setNotifPrefs({ ...notifPrefs, smsEnabled: e.target.checked })}
                className="w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary" />
              <span className="text-sm text-slate-600">SMS notifications</span>
            </label>
            <button onClick={handleNotifSave}
              className="px-6 py-2.5 rounded-lg bg-primary text-white font-semibold hover:bg-primary-dark transition text-sm">
              Save Preferences
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 space-y-5">
          <h2 className="text-lg font-heading font-bold text-slate-900">Data & Privacy</h2>
          <p className="text-sm text-slate-500">Download all data for a learner in GDPR-compliant JSON format, or remove a learner's account entirely.</p>

          {deleteLearnerMsg && <p className="text-sm text-green-600 bg-green-50 p-2 rounded">{deleteLearnerMsg}</p>}

          {learners.length > 0 ? (
            <div className="space-y-3">
              {learners.map(l => (
                <div key={l.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-100">
                  <span className="font-medium text-sm text-slate-700">{l.name}</span>
                  <div className="flex gap-2">
                    <button onClick={() => handleDownloadData(l.id)}
                      className="px-3 py-1.5 text-xs rounded-lg bg-blue-50 text-blue-700 font-semibold hover:bg-blue-100 transition">
                      Download Data
                    </button>
                    <button onClick={() => { setDeleteLearnerId(l.id); setDeleteLearnerConfirm(""); setDeleteLearnerMsg(""); }}
                      className="px-3 py-1.5 text-xs rounded-lg bg-red-50 text-red-700 font-semibold hover:bg-red-100 transition">
                      Remove Learner
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-400">No learners found.</p>
          )}

          {deleteLearnerId && (
            <div className="p-4 rounded-lg bg-red-50 border border-red-200 space-y-3">
              <p className="text-sm text-red-700 font-medium">
                To confirm removing <strong>{learners.find(l => l.id === deleteLearnerId)?.name}</strong>, type their name below:
              </p>
              <input type="text" value={deleteLearnerConfirm} onChange={e => setDeleteLearnerConfirm(e.target.value)}
                placeholder="Type learner's name to confirm"
                className="w-full px-4 py-2 rounded-lg border border-red-200 text-sm" />
              <div className="flex gap-2">
                <button onClick={handleDeleteLearner}
                  className="px-4 py-2 text-xs rounded-lg bg-red-600 text-white font-semibold hover:bg-red-700 transition">
                  Permanently Remove
                </button>
                <button onClick={() => setDeleteLearnerId(null)}
                  className="px-4 py-2 text-xs rounded-lg bg-slate-200 text-slate-700 font-semibold hover:bg-slate-300 transition">
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-red-100 space-y-4">
          <h2 className="text-lg font-heading font-bold text-red-700">Danger Zone</h2>
          <p className="text-sm text-slate-500">Permanently delete your AIVO account and all associated data. This action cannot be undone.</p>

          {!showDeleteAccount ? (
            <button onClick={() => setShowDeleteAccount(true)}
              className="px-6 py-2.5 rounded-lg border-2 border-red-300 text-red-700 font-semibold hover:bg-red-50 transition text-sm">
              Delete My Account
            </button>
          ) : (
            <div className="p-4 rounded-lg bg-red-50 border border-red-200 space-y-3">
              <p className="text-sm text-red-700 font-medium">This will permanently delete your account, all learner profiles, and all associated data. Enter your password to confirm.</p>
              {deleteAccErr && <p className="text-sm text-red-600 bg-red-100 p-2 rounded">{deleteAccErr}</p>}
              <input type="password" value={deleteAccPw} onChange={e => setDeleteAccPw(e.target.value)}
                placeholder="Enter your password"
                className="w-full px-4 py-2 rounded-lg border border-red-200 text-sm" />
              <div className="flex gap-2">
                <button onClick={handleDeleteAccount} disabled={deleteAccLoading || !deleteAccPw}
                  className="px-4 py-2 text-xs rounded-lg bg-red-600 text-white font-semibold hover:bg-red-700 transition disabled:opacity-50">
                  {deleteAccLoading ? "Deleting..." : "Permanently Delete Account"}
                </button>
                <button onClick={() => { setShowDeleteAccount(false); setDeleteAccPw(""); setDeleteAccErr(""); }}
                  className="px-4 py-2 text-xs rounded-lg bg-slate-200 text-slate-700 font-semibold hover:bg-slate-300 transition">
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
