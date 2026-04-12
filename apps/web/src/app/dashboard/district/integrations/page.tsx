"use client";
import { useAuth } from "@/providers/auth-provider";
import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";

interface Connector {
  id: string;
  name: string;
  status: string;
  category: string;
  description: string;
  icon: string;
  features: string[];
  authType: string;
  docsUrl: string;
}

interface Connection {
  id: string;
  connectorId: string;
  connectorName: string;
  connectorType: string;
  status: string;
  hasCredentials: boolean;
  lastSyncAt: string | null;
  connectedAt: string | null;
  createdAt: string;
  metadata: any;
  config: any;
}

interface SyncLog {
  id: string;
  connectionId: string;
  syncType: string;
  status: string;
  recordsSynced: number;
  recordsFailed: number;
  recordsSkipped: number;
  startedAt: string;
  completedAt: string | null;
  durationMs: number | null;
  errors: any[];
}

const CONNECTOR_ICONS: Record<string, string> = {
  google_classroom: "🏫",
  clever: "🔵",
  classlink: "🔗",
  canvas_lms: "🎨",
  schoology: "📚",
  powerschool: "⚡",
};

const STATUS_STYLES: Record<string, string> = {
  active: "bg-green-100 text-green-700",
  authorized: "bg-blue-100 text-blue-700",
  syncing: "bg-purple-100 text-purple-700",
  pending: "bg-amber-100 text-amber-700",
  error: "bg-red-100 text-red-700",
  disconnected: "bg-slate-100 text-slate-500",
};

const SYNC_STATUS_STYLES: Record<string, string> = {
  completed: "bg-green-100 text-green-700",
  running: "bg-blue-100 text-blue-700",
  partial: "bg-amber-100 text-amber-700",
  failed: "bg-red-100 text-red-700",
  pending: "bg-slate-100 text-slate-500",
};

export default function IntegrationsPage() {
  const { user, accessToken } = useAuth();
  const searchParams = useSearchParams();
  const [connectors, setConnectors] = useState<Connector[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [syncLogs, setSyncLogs] = useState<Record<string, SyncLog[]>>({});
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState<Record<string, boolean>>({});
  const [connectingId, setConnectingId] = useState<string | null>(null);
  const [showApiKeyModal, setShowApiKeyModal] = useState<string | null>(null);
  const [apiKeyInput, setApiKeyInput] = useState("");
  const [canvasUrlInput, setCanvasUrlInput] = useState("");
  const [activeTab, setActiveTab] = useState<"catalog" | "connected">("catalog");
  const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const tenantId = user?.tenantId;

  const fetchData = useCallback(async () => {
    if (!accessToken || !tenantId) return;
    try {
      const [connectorsRes, connectionsRes] = await Promise.all([
        fetch("/api/integrations/connectors"),
        fetch(`/api/integrations/connections/${tenantId}`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        }),
      ]);

      if (connectorsRes.ok) {
        const data = await connectorsRes.json();
        setConnectors(data.connectors || []);
      }

      if (connectionsRes.ok) {
        const data = await connectionsRes.json();
        setConnections(data.connections || []);

        for (const conn of data.connections || []) {
          const logsRes = await fetch(`/api/integrations/sync-logs/${conn.id}`, {
            headers: { Authorization: `Bearer ${accessToken}` },
          });
          if (logsRes.ok) {
            const logsData = await logsRes.json();
            setSyncLogs((prev) => ({ ...prev, [conn.id]: logsData.logs || [] }));
          }
        }
      }
    } catch {
    } finally {
      setLoading(false);
    }
  }, [accessToken, tenantId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    const connected = searchParams.get("connected");
    const error = searchParams.get("error");
    if (connected) {
      setNotification({ type: "success", message: "Integration connected successfully! You can now run your first sync." });
      setActiveTab("connected");
      fetchData();
    }
    if (error) {
      setNotification({ type: "error", message: `Connection failed: ${error.replace(/_/g, " ")}` });
    }
  }, [searchParams, fetchData]);

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 8000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const handleConnect = async (connector: Connector) => {
    if (!tenantId || !accessToken) return;

    if (connector.authType === "api_key") {
      setShowApiKeyModal(connector.id);
      return;
    }

    if (connector.authType === "oauth2") {
      setConnectingId(connector.id);
      try {
        const res = await fetch(`/api/integrations/oauth/${connector.id}/authorize?tenantId=${tenantId}`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (res.ok) {
          const data = await res.json();
          if (data.authorizationUrl) {
            window.location.href = data.authorizationUrl;
            return;
          }
        }

        const result = await fetch("/api/integrations/connect", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ tenantId, connectorId: connector.id }),
        });

        if (result.ok) {
          setNotification({ type: "success", message: `${connector.name} connected successfully!` });
          setActiveTab("connected");
          fetchData();
        } else {
          const err = await result.json();
          setNotification({ type: "error", message: err.error || "Failed to connect" });
        }
      } catch {
        setNotification({ type: "error", message: "Connection failed. Please try again." });
      } finally {
        setConnectingId(null);
      }
    }
  };

  const handleApiKeyConnect = async () => {
    if (!tenantId || !accessToken || !showApiKeyModal) return;

    try {
      const res = await fetch("/api/integrations/connect", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          tenantId,
          connectorId: showApiKeyModal,
          credentials: { apiToken: apiKeyInput },
          config: showApiKeyModal === "canvas_lms" ? { canvasUrl: canvasUrlInput } : {},
        }),
      });

      if (res.ok) {
        setNotification({ type: "success", message: "Integration connected successfully!" });
        setActiveTab("connected");
        fetchData();
      } else {
        const err = await res.json();
        setNotification({ type: "error", message: err.error || "Connection failed" });
      }
    } catch {
      setNotification({ type: "error", message: "Connection failed" });
    } finally {
      setShowApiKeyModal(null);
      setApiKeyInput("");
      setCanvasUrlInput("");
    }
  };

  const handleSync = async (connectionId: string) => {
    if (!accessToken) return;
    setSyncing((prev) => ({ ...prev, [connectionId]: true }));

    try {
      const res = await fetch(`/api/integrations/sync/${connectionId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ syncType: "full" }),
      });

      if (res.ok) {
        setNotification({ type: "success", message: "Sync started! This may take a few minutes." });
        setTimeout(fetchData, 3000);
        setTimeout(fetchData, 10000);
      } else {
        const err = await res.json();
        setNotification({ type: "error", message: err.error || "Sync failed" });
      }
    } catch {
      setNotification({ type: "error", message: "Failed to start sync" });
    } finally {
      setSyncing((prev) => ({ ...prev, [connectionId]: false }));
    }
  };

  const handleDisconnect = async (connectionId: string) => {
    if (!accessToken || !confirm("Are you sure you want to disconnect this integration? Synced data will be preserved.")) return;

    try {
      const res = await fetch(`/api/integrations/disconnect/${connectionId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (res.ok) {
        setNotification({ type: "success", message: "Integration disconnected." });
        fetchData();
      }
    } catch {
      setNotification({ type: "error", message: "Failed to disconnect" });
    }
  };

  const connectedIds = connections.filter((c) => c.status !== "disconnected").map((c) => c.connectorId);

  const formatDuration = (ms: number | null) => {
    if (!ms) return "—";
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  const formatTime = (dateStr: string | null) => {
    if (!dateStr) return "Never";
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  if (loading) {
    return (
      <div className="p-8 space-y-6">
        <div className="h-8 bg-slate-200 rounded-lg w-64 animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-2xl p-6 border border-slate-200 animate-pulse">
              <div className="h-12 w-12 bg-slate-200 rounded-xl mb-4" />
              <div className="h-5 bg-slate-200 rounded w-32 mb-2" />
              <div className="h-3 bg-slate-100 rounded w-48" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      {notification && (
        <div className={`p-4 rounded-xl text-sm font-medium flex items-center justify-between ${
          notification.type === "success" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"
        }`}>
          <span>{notification.message}</span>
          <button onClick={() => setNotification(null)} className="text-current opacity-50 hover:opacity-100">x</button>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold text-slate-900">Integrations</h1>
          <p className="text-sm text-slate-500 mt-1">
            Connect your district's learning tools to automatically sync rosters, classes, and student data.
          </p>
        </div>
        <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1">
          <button
            onClick={() => setActiveTab("catalog")}
            className={`px-4 py-2 rounded-md text-sm font-medium transition ${
              activeTab === "catalog" ? "bg-white shadow text-violet-700" : "text-slate-500"
            }`}
          >
            Available ({connectors.filter((c) => c.status !== "coming_soon" && !connectedIds.includes(c.id)).length})
          </button>
          <button
            onClick={() => setActiveTab("connected")}
            className={`px-4 py-2 rounded-md text-sm font-medium transition ${
              activeTab === "connected" ? "bg-white shadow text-violet-700" : "text-slate-500"
            }`}
          >
            Connected ({connections.filter((c) => c.status !== "disconnected").length})
          </button>
        </div>
      </div>

      {activeTab === "catalog" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {connectors.map((connector) => {
              const isConnected = connectedIds.includes(connector.id);
              const isComingSoon = connector.status === "coming_soon";
              const isConnecting = connectingId === connector.id;

              return (
                <div key={connector.id} className={`bg-white rounded-2xl p-6 border transition-all ${
                  isConnected ? "border-green-200 bg-green-50/30" : isComingSoon ? "border-slate-200 opacity-60" : "border-slate-200 hover:border-violet-200 hover:shadow-md"
                }`}>
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center text-2xl">
                      {CONNECTOR_ICONS[connector.id] || "🔌"}
                    </div>
                    <span className={`px-2 py-0.5 text-[10px] rounded-full font-bold uppercase ${
                      isConnected ? "bg-green-100 text-green-700" :
                      isComingSoon ? "bg-slate-100 text-slate-500" :
                      "bg-violet-100 text-violet-700"
                    }`}>
                      {isConnected ? "Connected" : isComingSoon ? "Coming Soon" : "Available"}
                    </span>
                  </div>

                  <h3 className="font-heading font-bold text-lg text-slate-900 mb-1">{connector.name}</h3>
                  <p className="text-xs text-slate-500 mb-3">{connector.description}</p>

                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {connector.features.map((f) => (
                      <span key={f} className="px-2 py-0.5 text-[10px] rounded-full bg-slate-100 text-slate-600 font-medium">
                        {f.replace(/_/g, " ")}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center gap-2">
                    {isConnected ? (
                      <button
                        onClick={() => setActiveTab("connected")}
                        className="flex-1 py-2 rounded-lg text-sm font-semibold bg-green-100 text-green-700 hover:bg-green-200 transition"
                      >
                        View Connection
                      </button>
                    ) : isComingSoon ? (
                      <button disabled className="flex-1 py-2 rounded-lg text-sm font-semibold bg-slate-100 text-slate-400 cursor-not-allowed">
                        Coming Soon
                      </button>
                    ) : (
                      <button
                        onClick={() => handleConnect(connector)}
                        disabled={isConnecting}
                        className="flex-1 py-2 rounded-lg text-sm font-semibold bg-violet-600 text-white hover:bg-violet-700 transition disabled:opacity-50"
                      >
                        {isConnecting ? "Connecting..." : "Connect"}
                      </button>
                    )}
                    <a
                      href={connector.docsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
                      title="View documentation"
                    >
                      ↗
                    </a>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="bg-gradient-to-br from-violet-50 to-purple-50 border border-violet-200 rounded-2xl p-6">
            <h3 className="font-heading font-bold text-lg text-slate-900 mb-2">Need a different integration?</h3>
            <p className="text-sm text-slate-600 mb-3">
              We're always adding new connectors. If your district uses a platform not listed here, let us know and we'll prioritize it.
            </p>
            <button className="px-4 py-2 rounded-lg text-sm font-semibold bg-violet-600 text-white hover:bg-violet-700 transition">
              Request Integration
            </button>
          </div>
        </div>
      )}

      {activeTab === "connected" && (
        <div className="space-y-6">
          {connections.filter((c) => c.status !== "disconnected").length === 0 ? (
            <div className="bg-white rounded-2xl p-12 border border-slate-200 text-center">
              <div className="w-16 h-16 bg-violet-100 rounded-2xl flex items-center justify-center mx-auto mb-4 text-3xl">🔗</div>
              <h3 className="font-heading font-bold text-lg text-slate-900 mb-2">No integrations connected</h3>
              <p className="text-sm text-slate-500 mb-4">
                Connect Google Classroom, Clever, or ClassLink to automatically sync your district's roster data.
              </p>
              <button
                onClick={() => setActiveTab("catalog")}
                className="px-6 py-2.5 rounded-lg text-sm font-semibold bg-violet-600 text-white hover:bg-violet-700 transition"
              >
                Browse Integrations
              </button>
            </div>
          ) : (
            connections.filter((c) => c.status !== "disconnected").map((conn) => {
              const logs = syncLogs[conn.id] || [];
              const lastSync = logs[0];

              return (
                <div key={conn.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                  <div className="p-6 border-b border-slate-100">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center text-2xl">
                          {CONNECTOR_ICONS[conn.connectorId] || "🔌"}
                        </div>
                        <div>
                          <h3 className="font-heading font-bold text-lg text-slate-900">{conn.connectorName}</h3>
                          <div className="flex items-center gap-3 mt-1">
                            <span className={`px-2 py-0.5 text-xs rounded-full font-semibold ${STATUS_STYLES[conn.status] || "bg-slate-100 text-slate-500"}`}>
                              {conn.status}
                            </span>
                            <span className="text-xs text-slate-400">
                              Connected {formatTime(conn.connectedAt)}
                            </span>
                            {conn.lastSyncAt && (
                              <span className="text-xs text-slate-400">
                                Last sync: {formatTime(conn.lastSyncAt)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleSync(conn.id)}
                          disabled={syncing[conn.id] || conn.status === "syncing"}
                          className="px-4 py-2 rounded-lg text-sm font-semibold bg-violet-600 text-white hover:bg-violet-700 transition disabled:opacity-50"
                        >
                          {syncing[conn.id] || conn.status === "syncing" ? "Syncing..." : "Sync Now"}
                        </button>
                        <button
                          onClick={() => handleDisconnect(conn.id)}
                          className="px-4 py-2 rounded-lg text-sm font-semibold text-red-600 hover:bg-red-50 border border-red-200 transition"
                        >
                          Disconnect
                        </button>
                      </div>
                    </div>
                  </div>

                  {lastSync && (
                    <div className="px-6 py-4 bg-slate-50/50 border-b border-slate-100">
                      <div className="flex items-center gap-6">
                        <div>
                          <p className="text-[10px] text-slate-400 font-semibold uppercase">Last Sync Status</p>
                          <span className={`px-2 py-0.5 text-xs rounded-full font-semibold ${SYNC_STATUS_STYLES[lastSync.status]}`}>
                            {lastSync.status}
                          </span>
                        </div>
                        <div>
                          <p className="text-[10px] text-slate-400 font-semibold uppercase">Records Synced</p>
                          <p className="text-sm font-bold text-slate-900">{lastSync.recordsSynced}</p>
                        </div>
                        {lastSync.recordsFailed > 0 && (
                          <div>
                            <p className="text-[10px] text-slate-400 font-semibold uppercase">Failed</p>
                            <p className="text-sm font-bold text-red-600">{lastSync.recordsFailed}</p>
                          </div>
                        )}
                        {lastSync.recordsSkipped > 0 && (
                          <div>
                            <p className="text-[10px] text-slate-400 font-semibold uppercase">Skipped</p>
                            <p className="text-sm font-bold text-amber-600">{lastSync.recordsSkipped}</p>
                          </div>
                        )}
                        <div>
                          <p className="text-[10px] text-slate-400 font-semibold uppercase">Duration</p>
                          <p className="text-sm font-bold text-slate-700">{formatDuration(lastSync.durationMs)}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {logs.length > 0 && (
                    <div className="px-6 py-4">
                      <p className="text-xs font-bold text-slate-400 uppercase mb-3">Sync History</p>
                      <div className="space-y-2">
                        {logs.slice(0, 5).map((log) => (
                          <div key={log.id} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                            <div className="flex items-center gap-3">
                              <span className={`px-2 py-0.5 text-[10px] rounded-full font-semibold ${SYNC_STATUS_STYLES[log.status]}`}>
                                {log.status}
                              </span>
                              <span className="text-xs text-slate-500">{log.syncType} sync</span>
                            </div>
                            <div className="flex items-center gap-4 text-xs text-slate-400">
                              <span>{log.recordsSynced} records</span>
                              <span>{formatDuration(log.durationMs)}</span>
                              <span>{formatTime(log.startedAt)}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {lastSync?.errors && lastSync.errors.length > 0 && (
                    <div className="px-6 py-4 bg-red-50/50 border-t border-red-100">
                      <p className="text-xs font-bold text-red-600 uppercase mb-2">Errors</p>
                      {lastSync.errors.map((err: any, i: number) => (
                        <p key={i} className="text-xs text-red-600">{err.message}</p>
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {showApiKeyModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <h3 className="font-heading font-bold text-lg text-slate-900 mb-4">
              Connect {connectors.find((c) => c.id === showApiKeyModal)?.name}
            </h3>

            {showApiKeyModal === "canvas_lms" && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 mb-1">Canvas Instance URL</label>
                <input
                  type="url"
                  value={canvasUrlInput}
                  onChange={(e) => setCanvasUrlInput(e.target.value)}
                  placeholder="https://yourschool.instructure.com"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:border-violet-400 focus:ring-2 focus:ring-violet-100 outline-none"
                />
              </div>
            )}

            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 mb-1">API Access Token</label>
              <input
                type="password"
                value={apiKeyInput}
                onChange={(e) => setApiKeyInput(e.target.value)}
                placeholder="Paste your API token here"
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:border-violet-400 focus:ring-2 focus:ring-violet-100 outline-none"
              />
              <p className="text-[10px] text-slate-400 mt-1">
                Generate an access token from your admin settings. This is stored securely and encrypted.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => { setShowApiKeyModal(null); setApiKeyInput(""); setCanvasUrlInput(""); }}
                className="flex-1 py-2 rounded-lg text-sm font-semibold border border-slate-200 text-slate-600 hover:bg-slate-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleApiKeyConnect}
                disabled={!apiKeyInput || (showApiKeyModal === "canvas_lms" && !canvasUrlInput)}
                className="flex-1 py-2 rounded-lg text-sm font-semibold bg-violet-600 text-white hover:bg-violet-700 transition disabled:opacity-50"
              >
                Connect
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
