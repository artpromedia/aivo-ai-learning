"use client";
import { useAuth } from "@/providers/auth-provider";
import { useState } from "react";
import Link from "next/link";

interface Webhook {
  id: string;
  url: string;
  events: string[];
  active: boolean;
  lastDeliveryAt: string | null;
  lastDeliveryStatus: string | null;
  createdAt: string;
}

const AVAILABLE_EVENTS = [
  "user.created", "user.updated", "user.deleted",
  "learner.created", "learner.updated",
  "session.completed", "assessment.completed",
  "subscription.created", "subscription.cancelled",
  "brain.cloned", "brain.updated",
];

export default function WebhooksPage() {
  const { accessToken } = useAuth();
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [newUrl, setNewUrl] = useState("");
  const [newEvents, setNewEvents] = useState<string[]>([]);

  const toggleEvent = (event: string) => {
    setNewEvents(newEvents.includes(event)
      ? newEvents.filter((e) => e !== event)
      : [...newEvents, event]
    );
  };

  const handleCreate = () => {
    if (!newUrl || newEvents.length === 0) return;
    const webhook: Webhook = {
      id: crypto.randomUUID(),
      url: newUrl,
      events: newEvents,
      active: true,
      lastDeliveryAt: null,
      lastDeliveryStatus: null,
      createdAt: new Date().toISOString(),
    };
    setWebhooks([...webhooks, webhook]);
    setNewUrl("");
    setNewEvents([]);
    setShowCreate(false);
  };

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center gap-3 text-sm text-slate-500">
        <Link href="/dashboard/admin/settings" className="hover:text-purple-600 transition">Settings</Link>
        <span>/</span>
        <span className="text-slate-900 font-medium">Webhooks</span>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold text-slate-900">Webhooks</h1>
          <p className="text-sm text-slate-500 mt-1">Configure webhook endpoints to receive real-time event notifications.</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="px-5 py-2.5 rounded-xl bg-purple-600 text-white font-semibold text-sm hover:bg-purple-700 transition flex items-center gap-2"
        >
          <span className="text-lg leading-none">+</span>
          Add Webhook
        </button>
      </div>

      {webhooks.length === 0 && !showCreate ? (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-12 text-center">
          <p className="text-4xl mb-4">🔗</p>
          <p className="text-lg font-semibold text-slate-900">No webhooks configured</p>
          <p className="text-sm text-slate-500 mt-1">Add a webhook endpoint to start receiving event notifications.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {webhooks.map((wh) => (
            <div key={wh.id} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-mono text-sm text-slate-900 font-medium">{wh.url}</p>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {wh.events.map((evt) => (
                      <span key={evt} className="text-xs bg-purple-50 text-purple-600 px-2 py-0.5 rounded-full">{evt}</span>
                    ))}
                  </div>
                  <p className="text-xs text-slate-400 mt-2">
                    {wh.lastDeliveryAt ? `Last delivery: ${new Date(wh.lastDeliveryAt).toLocaleString()} (${wh.lastDeliveryStatus})` : "No deliveries yet"}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-2.5 py-0.5 text-xs rounded-full font-semibold ${wh.active ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"}`}>
                    {wh.active ? "Active" : "Inactive"}
                  </span>
                  <button
                    onClick={() => setWebhooks(webhooks.filter((w) => w.id !== wh.id))}
                    className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 transition"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showCreate && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-4">
          <h2 className="text-lg font-heading font-bold text-slate-900">New Webhook</h2>
          <div>
            <label htmlFor="webhook-url" className="block text-sm font-medium text-slate-700 mb-1">Endpoint URL</label>
            <input
              id="webhook-url"
              type="url"
              value={newUrl}
              onChange={(e) => setNewUrl(e.target.value)}
              placeholder="https://api.example.com/webhooks/aivo"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-purple-400 focus:ring-2 focus:ring-purple-100 outline-none"
            />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-700 mb-2">Events</p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {AVAILABLE_EVENTS.map((evt) => (
                <label key={evt} className="flex items-center gap-2 cursor-pointer" htmlFor={`evt-${evt}`}>
                  <input
                    id={`evt-${evt}`}
                    type="checkbox"
                    checked={newEvents.includes(evt)}
                    onChange={() => toggleEvent(evt)}
                    className="rounded border-slate-300 text-purple-600 focus:ring-purple-500"
                  />
                  <span className="text-sm text-slate-700">{evt}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={() => setShowCreate(false)} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 transition">Cancel</button>
            <button
              onClick={handleCreate}
              disabled={!newUrl || newEvents.length === 0}
              className="flex-1 py-2.5 rounded-xl bg-purple-600 text-white font-semibold hover:bg-purple-700 transition disabled:opacity-50"
            >
              Create Webhook
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
