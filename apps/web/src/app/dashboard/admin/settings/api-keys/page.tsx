"use client";
import { useAuth } from "@/providers/auth-provider";
import { useState } from "react";
import Link from "next/link";

interface ApiKey {
  id: string;
  name: string;
  keyPrefix: string;
  scopes: string[];
  expiresAt: string | null;
  lastUsedAt: string | null;
  createdAt: string;
}

const AVAILABLE_SCOPES = [
  "read:users", "write:users",
  "read:learners", "write:learners",
  "read:tenants", "write:tenants",
  "read:sessions", "read:assessments",
  "read:billing", "admin:full",
];

export default function ApiKeysPage() {
  const { accessToken } = useAuth();
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newScopes, setNewScopes] = useState<string[]>([]);
  const [newExpiry, setNewExpiry] = useState("");
  const [createdKey, setCreatedKey] = useState<string | null>(null);

  const toggleScope = (scope: string) => {
    setNewScopes(newScopes.includes(scope)
      ? newScopes.filter((s) => s !== scope)
      : [...newScopes, scope]
    );
  };

  const handleCreate = () => {
    if (!newName || newScopes.length === 0) return;
    const key = `aivo_${crypto.randomUUID().replace(/-/g, "").slice(0, 32)}`;
    const apiKey: ApiKey = {
      id: crypto.randomUUID(),
      name: newName,
      keyPrefix: key.slice(0, 10),
      scopes: newScopes,
      expiresAt: newExpiry || null,
      lastUsedAt: null,
      createdAt: new Date().toISOString(),
    };
    setKeys([...keys, apiKey]);
    setCreatedKey(key);
    setNewName("");
    setNewScopes([]);
    setNewExpiry("");
  };

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center gap-3 text-sm vi-text-muted">
        <Link href="/dashboard/admin/settings" className="hover:text-[hsl(var(--visual-primary))] transition">Settings</Link>
        <span>/</span>
        <span className="vi-text font-medium">API Keys</span>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold vi-text">API Keys</h1>
          <p className="text-sm vi-text-muted mt-1">Manage API keys for programmatic access to the AIVO platform.</p>
        </div>
        <button
          onClick={() => { setShowCreate(true); setCreatedKey(null); }}
          className="px-5 py-2.5 rounded-xl bg-purple-600 text-white font-semibold text-sm hover:bg-purple-700 transition flex items-center gap-2"
        >
          <span className="text-lg leading-none">+</span>
          Generate Key
        </button>
      </div>

      {createdKey && (
        <div className="bg-green-50 border border-green-200 rounded-2xl p-5">
          <p className="text-green-800 font-semibold mb-2">API Key Created Successfully</p>
          <p className="text-sm text-green-700 mb-1">Copy this key now. You won&apos;t be able to see it again.</p>
          <div className="bg-white border border-green-300 rounded-xl px-4 py-3 font-mono text-sm select-all break-all">{createdKey}</div>
          <button
            onClick={() => setCreatedKey(null)}
            className="mt-3 px-4 py-2 text-sm font-semibold rounded-xl bg-green-600 text-white hover:bg-green-700 transition"
          >
            Done
          </button>
        </div>
      )}

      {keys.length === 0 && !showCreate ? (
        <div className="vi-card p-12 text-center">
          <p className="text-4xl mb-4">🔑</p>
          <p className="text-lg font-semibold vi-text">No API keys</p>
          <p className="text-sm vi-text-muted mt-1">Generate an API key to start using the AIVO REST API.</p>
        </div>
      ) : (
        <div className="vi-card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left vi-text-muted border-b vi-border vi-bg/50">
                <th className="px-5 py-3 font-semibold">Name</th>
                <th className="px-5 py-3 font-semibold">Key</th>
                <th className="px-5 py-3 font-semibold">Scopes</th>
                <th className="px-5 py-3 font-semibold">Last Used</th>
                <th className="px-5 py-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {keys.map((k) => (
                <tr key={k.id} className="border-b vi-border hover:vi-bg/50 transition">
                  <td className="px-5 py-3 font-medium vi-text">{k.name}</td>
                  <td className="px-5 py-3">
                    <span className="font-mono text-xs vi-surface-soft px-2 py-1 rounded">{k.keyPrefix}...****</span>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex flex-wrap gap-1">
                      {k.scopes.slice(0, 3).map((s) => (
                        <span key={s} className="text-xs vi-surface-soft text-[hsl(var(--visual-primary))] px-2 py-0.5 rounded-full">{s}</span>
                      ))}
                      {k.scopes.length > 3 && (
                        <span className="text-xs vi-surface-soft vi-text-muted px-2 py-0.5 rounded-full">+{k.scopes.length - 3}</span>
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-3 vi-text-muted">{k.lastUsedAt ? new Date(k.lastUsedAt).toLocaleDateString() : "Never"}</td>
                  <td className="px-5 py-3">
                    <button
                      onClick={() => setKeys(keys.filter((key) => key.id !== k.id))}
                      className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 transition"
                    >
                      Revoke
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showCreate && !createdKey && (
        <div className="vi-card p-6 space-y-4">
          <h2 className="text-lg font-heading font-bold vi-text">Generate New API Key</h2>
          <div>
            <label htmlFor="key-name" className="block text-sm font-medium vi-text mb-1">Key Name</label>
            <input
              id="key-name"
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="e.g. Production Integration"
              className="w-full px-4 py-2.5 rounded-xl border vi-border text-sm focus:border-purple-400 focus:ring-2 focus:ring-purple-100 outline-none"
            />
          </div>
          <div>
            <label htmlFor="key-expiry" className="block text-sm font-medium vi-text mb-1">Expiration (optional)</label>
            <input
              id="key-expiry"
              type="date"
              value={newExpiry}
              onChange={(e) => setNewExpiry(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border vi-border text-sm focus:border-purple-400 focus:ring-2 focus:ring-purple-100 outline-none"
            />
          </div>
          <div>
            <p className="text-sm font-medium vi-text mb-2">Scopes</p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {AVAILABLE_SCOPES.map((scope) => (
                <label key={scope} className="flex items-center gap-2 cursor-pointer" htmlFor={`scope-${scope}`}>
                  <input
                    id={`scope-${scope}`}
                    type="checkbox"
                    checked={newScopes.includes(scope)}
                    onChange={() => toggleScope(scope)}
                    className="rounded border-slate-300 text-[hsl(var(--visual-primary))] focus:ring-purple-500"
                  />
                  <span className="text-sm vi-text">{scope}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={() => setShowCreate(false)} className="flex-1 py-2.5 rounded-xl border vi-border vi-text-muted font-semibold hover:vi-bg transition">Cancel</button>
            <button
              onClick={handleCreate}
              disabled={!newName || newScopes.length === 0}
              className="flex-1 py-2.5 rounded-xl bg-purple-600 text-white font-semibold hover:bg-purple-700 transition disabled:opacity-50"
            >
              Generate Key
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
