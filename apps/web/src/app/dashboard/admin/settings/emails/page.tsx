"use client";
import { useAuth } from "@/providers/auth-provider";
import { useEffect, useState } from "react";
import Link from "next/link";

interface EmailTemplate {
  id: string;
  key: string;
  subject: string;
  bodyHtml: string;
  bodyText: string | null;
  variables: string[];
  active: boolean;
  updatedAt: string;
}

const DEFAULT_TEMPLATES: EmailTemplate[] = [
  { id: "1", key: "welcome", subject: "Welcome to AIVO!", bodyHtml: "<h1>Welcome {{name}}!</h1><p>Your learning journey begins now.</p>", bodyText: null, variables: ["name", "email"], active: true, updatedAt: new Date().toISOString() },
  { id: "2", key: "password_reset", subject: "Reset Your Password", bodyHtml: "<p>Hi {{name}}, click <a href='{{resetUrl}}'>here</a> to reset your password.</p>", bodyText: null, variables: ["name", "resetUrl"], active: true, updatedAt: new Date().toISOString() },
  { id: "3", key: "learner_progress", subject: "{{learnerName}}'s Weekly Progress", bodyHtml: "<p>Hi {{parentName}}, here's {{learnerName}}'s progress this week...</p>", bodyText: null, variables: ["parentName", "learnerName", "progressSummary"], active: true, updatedAt: new Date().toISOString() },
  { id: "4", key: "subscription_renewal", subject: "Your Subscription Renews Soon", bodyHtml: "<p>Hi {{name}}, your {{planName}} subscription renews on {{renewalDate}}.</p>", bodyText: null, variables: ["name", "planName", "renewalDate"], active: false, updatedAt: new Date().toISOString() },
];

export default function EmailTemplatesPage() {
  const { accessToken } = useAuth();
  const [templates, setTemplates] = useState<EmailTemplate[]>(DEFAULT_TEMPLATES);
  const [editing, setEditing] = useState<EmailTemplate | null>(null);
  const [preview, setPreview] = useState<EmailTemplate | null>(null);

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center gap-3 text-sm text-slate-500">
        <Link href="/dashboard/admin/settings" className="hover:text-purple-600 transition">Settings</Link>
        <span>/</span>
        <span className="text-slate-900 font-medium">Email Templates</span>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold text-slate-900">Email Templates</h1>
          <p className="text-sm text-slate-500 mt-1">Manage transactional and notification email templates.</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-slate-400 border-b border-slate-100 bg-slate-50/50">
              <th className="px-5 py-3 font-semibold">Template</th>
              <th className="px-5 py-3 font-semibold">Subject</th>
              <th className="px-5 py-3 font-semibold">Variables</th>
              <th className="px-5 py-3 font-semibold">Status</th>
              <th className="px-5 py-3 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {templates.map((tmpl) => (
              <tr key={tmpl.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition">
                <td className="px-5 py-3">
                  <span className="font-mono text-xs bg-slate-100 px-2 py-1 rounded">{tmpl.key}</span>
                </td>
                <td className="px-5 py-3 font-medium text-slate-900">{tmpl.subject}</td>
                <td className="px-5 py-3">
                  <div className="flex flex-wrap gap-1">
                    {tmpl.variables.map((v) => (
                      <span key={v} className="text-xs bg-purple-50 text-purple-600 px-2 py-0.5 rounded-full">{`{{${v}}}`}</span>
                    ))}
                  </div>
                </td>
                <td className="px-5 py-3">
                  <span className={`px-2.5 py-0.5 text-xs rounded-full font-semibold ${tmpl.active ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"}`}>
                    {tmpl.active ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="px-5 py-3">
                  <div className="flex gap-2">
                    <button
                      onClick={() => setPreview(tmpl)}
                      className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200 transition"
                    >
                      Preview
                    </button>
                    <button
                      onClick={() => setEditing(tmpl)}
                      className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200 transition"
                    >
                      Edit
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {preview && (
        <div className="fixed inset-0 z-[9998] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" role="presentation" onClick={() => setPreview(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 max-h-[80vh] overflow-auto">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-lg font-heading font-bold text-slate-900">Preview: {preview.key}</h2>
              <button onClick={() => setPreview(null)} className="text-slate-400 hover:text-slate-600 text-xl">&times;</button>
            </div>
            <div className="p-6">
              <p className="text-sm text-slate-500 mb-2">Subject: <strong>{preview.subject}</strong></p>
              <div className="border border-slate-200 rounded-xl p-4 bg-slate-50">
                <div dangerouslySetInnerHTML={{ __html: preview.bodyHtml }} />
              </div>
            </div>
          </div>
        </div>
      )}

      {editing && (
        <div className="fixed inset-0 z-[9998] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" role="presentation" onClick={() => setEditing(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 max-h-[80vh] overflow-auto">
            <div className="p-6 border-b border-slate-100">
              <h2 className="text-lg font-heading font-bold text-slate-900">Edit Template: {editing.key}</h2>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label htmlFor="edit-subject" className="block text-sm font-medium text-slate-700 mb-1">Subject</label>
                <input
                  id="edit-subject"
                  type="text"
                  value={editing.subject}
                  onChange={(e) => setEditing({ ...editing, subject: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-purple-400 focus:ring-2 focus:ring-purple-100 outline-none"
                />
              </div>
              <div>
                <label htmlFor="edit-body" className="block text-sm font-medium text-slate-700 mb-1">HTML Body</label>
                <textarea
                  id="edit-body"
                  value={editing.bodyHtml}
                  onChange={(e) => setEditing({ ...editing, bodyHtml: e.target.value })}
                  rows={10}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-mono focus:border-purple-400 focus:ring-2 focus:ring-purple-100 outline-none"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setEditing(null)} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 transition">Cancel</button>
                <button
                  onClick={() => {
                    setTemplates(templates.map((t) => t.id === editing.id ? editing : t));
                    setEditing(null);
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-purple-600 text-white font-semibold hover:bg-purple-700 transition"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
