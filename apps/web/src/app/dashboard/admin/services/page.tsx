"use client";
import { useAuth } from "@/providers/auth-provider";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

interface ServiceStatus {
  name: string;
  status: string;
  latency: number;
}

interface Incident {
  id: string;
  title: string;
  status: string;
  severity: string;
  affectedServices: string[];
  createdAt: string;
  resolvedAt?: string;
}

const ALL_SERVICES = [
  { name: "identity-svc", port: 3001, desc: "Authentication, users, RBAC" },
  { name: "brain-svc", port: 3002, desc: "Brain clone engine (Python)" },
  { name: "assessment-svc", port: 3003, desc: "Baseline & dynamic assessments" },
  { name: "ai-svc", port: 3004, desc: "LLM gateway, content generation" },
  { name: "learning-svc", port: 3005, desc: "Lesson sessions, gradebook" },
  { name: "tutor-svc", port: 3006, desc: "14 AI tutor management" },
  { name: "family-svc", port: 3007, desc: "Collaboration, recommendations" },
  { name: "engagement-svc", port: 3008, desc: "Gamification, rewards" },
  { name: "billing-svc", port: 3009, desc: "Subscriptions, payments" },
  { name: "comms-svc", port: 3010, desc: "Notifications, email, push" },
  { name: "i18n-svc", port: 3011, desc: "Internationalization" },
  { name: "integrations-svc", port: 3012, desc: "Third-party integrations" },
  { name: "admin-svc", port: 3013, desc: "Platform administration" },
  { name: "status-page-svc", port: 3014, desc: "System health monitoring" },
  { name: "research-svc", port: 3015, desc: "Analytics & research data" },
];

export default function AdminServicesPage() {
  const { accessToken, user } = useAuth();
  const t = useTranslations("platformAdmin");
  const tc = useTranslations("common");
  const [serviceStatuses, setServiceStatuses] = useState<ServiceStatus[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [uptime, setUptime] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [overallStatus, setOverallStatus] = useState("checking");
  const [showIncidentForm, setShowIncidentForm] = useState(false);
  const [incidentTitle, setIncidentTitle] = useState("");
  const [incidentSeverity, setIncidentSeverity] = useState("minor");

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetch("/api/status/overview").then((r) => r.ok ? r.json() : null).catch(() => null),
      fetch("/api/status/incidents").then((r) => r.ok ? r.json() : []).catch(() => []),
      fetch("/api/status/uptime").then((r) => r.ok ? r.json() : null).catch(() => null),
    ]).then(([overview, incidentData, uptimeData]) => {
      if (overview?.services) {
        setServiceStatuses(overview.services.map((s: any) => ({
          name: s.name,
          status: s.status === "healthy" ? "operational" : s.status,
          latency: s.latencyMs || 0,
        })));
        setOverallStatus(overview.overall === "major_outage" ? "outage" : overview.overall || "checking");
      }
      const incArr = incidentData?.incidents || (Array.isArray(incidentData) ? incidentData : []);
      setIncidents(incArr);
      setUptime(uptimeData);
    }).finally(() => setLoading(false));

    const interval = setInterval(() => {
      fetch("/api/status/overview").then((r) => r.ok ? r.json() : null)
        .then((data) => {
          if (data?.services) {
            setServiceStatuses(data.services.map((s: any) => ({
              name: s.name,
              status: s.status === "healthy" ? "operational" : s.status,
              latency: s.latencyMs || 0,
            })));
            setOverallStatus(data.overall === "major_outage" ? "outage" : data.overall || "checking");
          }
        }).catch(() => {});
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleCreateIncident = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken) return;
    try {
      await fetch("/api/status/incidents", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ title: incidentTitle, severity: incidentSeverity, affectedServices: [] }),
      });
      setIncidentTitle("");
      setShowIncidentForm(false);
      const res = await fetch("/api/status/incidents");
      if (res.ok) setIncidents(await res.json());
    } catch {}
  };

  const healthyCount = serviceStatuses.filter((s) => s.status === "operational").length;
  const degradedCount = serviceStatuses.filter((s) => s.status === "degraded").length;
  const downCount = serviceStatuses.filter((s) => s.status !== "operational" && s.status !== "degraded").length;

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold text-slate-900">{t("system_health")}</h1>
          <p className="text-sm text-slate-500 mt-1">Real-time health monitoring across all {ALL_SERVICES.length} microservices.</p>
        </div>
        <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold ${
          overallStatus === "operational" ? "bg-green-100 text-green-700" :
          overallStatus === "degraded" ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"
        }`}>
          <span className={`w-2 h-2 rounded-full ${
            overallStatus === "operational" ? "bg-green-500" : overallStatus === "degraded" ? "bg-amber-500 animate-pulse" : "bg-red-500 animate-pulse"
          }`} />
          {overallStatus === "operational" ? "All Systems Operational" : overallStatus === "degraded" ? "Degraded" : "Issues Detected"}
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 border border-slate-200 text-center">
          <p className="text-3xl font-bold text-slate-900">{ALL_SERVICES.length}</p>
          <p className="text-xs text-slate-500 font-semibold mt-1">Total Services</p>
        </div>
        <div className="bg-green-50 rounded-xl p-4 border border-green-200 text-center">
          <p className="text-3xl font-bold text-green-700">{healthyCount}</p>
          <p className="text-xs text-green-600 font-semibold mt-1">Operational</p>
        </div>
        <div className="bg-amber-50 rounded-xl p-4 border border-amber-200 text-center">
          <p className="text-3xl font-bold text-amber-700">{degradedCount}</p>
          <p className="text-xs text-amber-600 font-semibold mt-1">Degraded</p>
        </div>
        <div className="bg-red-50 rounded-xl p-4 border border-red-200 text-center">
          <p className="text-3xl font-bold text-red-700">{downCount}</p>
          <p className="text-xs text-red-600 font-semibold mt-1">Down</p>
        </div>
      </div>

      {uptime && (
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-2xl p-6 text-white">
          <h2 className="font-heading font-bold text-lg mb-3">30-Day Uptime Report</h2>
          <div className="grid grid-cols-3 gap-6">
            <div>
              <p className="text-3xl font-bold">{uptime.uptime?.overall ?? "99.9"}%</p>
              <p className="text-sm text-slate-400">Overall Uptime</p>
            </div>
            <div>
              <p className="text-3xl font-bold">{uptime.period ?? "30d"}</p>
              <p className="text-sm text-slate-400">Period</p>
            </div>
            <div>
              <p className="text-3xl font-bold">{uptime.uptime?.byService?.length ?? 0}</p>
              <p className="text-sm text-slate-400">Monitored Services</p>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-5 border-b border-slate-100">
          <h2 className="font-heading font-bold text-lg text-slate-900">Service Status</h2>
        </div>
        {loading ? (
          <div className="p-10 text-center text-slate-400 animate-pulse">Checking services...</div>
        ) : (
          <div className="divide-y divide-slate-50">
            {ALL_SERVICES.map((svc) => {
              const live = serviceStatuses.find((s) => s.name === svc.name);
              const status = live?.status || "unknown";
              return (
                <div key={svc.name} className="flex items-center justify-between px-5 py-4 hover:bg-slate-50/50 transition">
                  <div className="flex items-center gap-4">
                    <span className={`w-3 h-3 rounded-full flex-shrink-0 ${
                      status === "operational" ? "bg-green-500" : status === "degraded" ? "bg-amber-500 animate-pulse" : "bg-red-500"
                    }`} />
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{svc.name}</p>
                      <p className="text-xs text-slate-400">{svc.desc}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-xs text-slate-400">:{svc.port}</span>
                    {live?.latency !== undefined && live.latency > 0 && (
                      <span className={`text-xs font-medium ${live.latency < 200 ? "text-green-600" : live.latency < 500 ? "text-amber-600" : "text-red-600"}`}>
                        {live.latency}ms
                      </span>
                    )}
                    <span className={`px-2.5 py-0.5 text-xs rounded-full font-semibold ${
                      status === "operational" ? "bg-green-100 text-green-700" : status === "degraded" ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"
                    }`}>
                      {status}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-heading font-bold text-lg text-slate-900">Incidents</h2>
          {user?.role === "PLATFORM_ADMIN" && (
            <button onClick={() => setShowIncidentForm(!showIncidentForm)}
              className="px-4 py-2 rounded-lg bg-red-50 text-red-700 text-sm font-semibold hover:bg-red-100 transition">
              + Report Incident
            </button>
          )}
        </div>
        {showIncidentForm && (
          <form onSubmit={handleCreateIncident} className="p-5 border-b border-slate-100 flex gap-3 items-end bg-slate-50">
            <div className="flex-1">
              <label className="block text-xs font-medium text-slate-600 mb-1">Title</label>
              <input type="text" value={incidentTitle} onChange={(e) => setIncidentTitle(e.target.value)} required
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm" placeholder="Describe the incident..." />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Severity</label>
              <select value={incidentSeverity} onChange={(e) => setIncidentSeverity(e.target.value)}
                className="px-3 py-2 rounded-lg border border-slate-200 text-sm bg-white">
                <option value="minor">Minor</option>
                <option value="major">Major</option>
                <option value="critical">Critical</option>
              </select>
            </div>
            <button type="submit" className="px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-semibold">Create</button>
          </form>
        )}
        <div className="divide-y divide-slate-50">
          {incidents.length > 0 ? incidents.map((inc) => (
            <div key={inc.id} className="px-5 py-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-900">{inc.title}</p>
                <p className="text-xs text-slate-400">{new Date(inc.createdAt).toLocaleString()}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 text-xs rounded-full font-semibold ${
                  inc.severity === "critical" ? "bg-red-100 text-red-700" : inc.severity === "major" ? "bg-orange-100 text-orange-700" : "bg-amber-100 text-amber-700"
                }`}>{inc.severity}</span>
                <span className={`px-2 py-0.5 text-xs rounded-full font-semibold ${
                  inc.status === "resolved" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                }`}>{inc.status}</span>
              </div>
            </div>
          )) : (
            <div className="px-5 py-8 text-center text-slate-400 text-sm">No incidents reported</div>
          )}
        </div>
      </div>
    </div>
  );
}
