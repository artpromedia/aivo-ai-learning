"use client";
import { useAuth } from "@/providers/auth-provider";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

export default function DevOpsDashboard() {
  const { accessToken } = useAuth();
  const t = useTranslations("dashboard");
  const tc = useTranslations("common");
  const [statusOverview, setStatusOverview] = useState<any>(null);
  const [uptime, setUptime] = useState<any>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/status/overview").then((r) => r.ok ? r.json() : null).catch(() => null),
      fetch("/api/status/uptime").then((r) => r.ok ? r.json() : null).catch(() => null),
    ]).then(([overview, uptimeData]) => {
      setStatusOverview(overview);
      setUptime(uptimeData);
    });

    const interval = setInterval(() => {
      fetch("/api/status/overview").then((r) => r.ok ? r.json() : null)
        .then(setStatusOverview).catch(() => {});
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  const healthyCount = statusOverview?.services?.filter((s: any) => s.status === "healthy").length ?? 0;
  const totalServices = statusOverview?.services?.length ?? 0;
  const overallStatus = statusOverview?.overall ?? "checking";

  const infrastructure = [
    { name: "PostgreSQL 16", type: "Database", status: "healthy", uptime: "99.99%", region: "us-east" },
    { name: "Redis (Cache)", type: "Cache", status: "healthy", uptime: "99.95%", region: "us-east" },
    { name: "Hetzner Cloud", type: "Compute", status: "healthy", uptime: "99.97%", region: "eu-central" },
    { name: "S3 (Object Storage)", type: "Storage", status: "healthy", uptime: "99.99%", region: "us-east" },
    { name: "CDN (Assets)", type: "CDN", status: "healthy", uptime: "99.99%", region: "global" },
  ];

  const deployments = [
    { service: "web (Next.js)", version: "v3.2.1", deployedAt: "2h ago", status: "live", env: "production" },
    { service: "identity-svc", version: "v3.1.0", deployedAt: "1d ago", status: "live", env: "production" },
    { service: "brain-svc", version: "v3.0.8", deployedAt: "3d ago", status: "live", env: "production" },
    { service: "ai-svc", version: "v3.0.5", deployedAt: "5d ago", status: "live", env: "production" },
    { service: "assessment-svc", version: "v3.1.0", deployedAt: "1d ago", status: "live", env: "production" },
    { service: "learning-svc", version: "v3.0.4", deployedAt: "1w ago", status: "live", env: "production" },
  ];

  const performanceMetrics = [
    { metric: "P50 Latency", value: "45ms", status: "good" },
    { metric: "P95 Latency", value: "180ms", status: "good" },
    { metric: "P99 Latency", value: "450ms", status: "warning" },
    { metric: "Error Rate", value: "0.12%", status: "good" },
    { metric: "Throughput", value: "1.2K req/min", status: "good" },
    { metric: "CPU Usage", value: "42%", status: "good" },
    { metric: "Memory Usage", value: "68%", status: "warning" },
    { metric: "Disk Usage", value: "35%", status: "good" },
  ];

  const alerts = [
    { severity: "warning", message: "Memory usage on brain-svc above 80%", time: "1h ago", acked: false },
    { severity: "info", message: "Auto-scaled identity-svc to 3 replicas", time: "4h ago", acked: true },
    { severity: "warning", message: "Database connection pool at 75%", time: "6h ago", acked: true },
    { severity: "resolved", message: "CDN cache miss rate normalized", time: "1d ago", acked: true },
  ];

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold vi-text">{t("overview")}</h1>
          <p className="text-sm vi-text-muted mt-1">Infrastructure monitoring, deployments, and system performance.</p>
        </div>
        <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold ${
          overallStatus === "operational" ? "bg-green-100 text-green-700" :
          overallStatus === "degraded" ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"
        }`}>
          <span className={`w-2 h-2 rounded-full ${
            overallStatus === "operational" ? "bg-green-500" : overallStatus === "degraded" ? "bg-amber-500 animate-pulse" : "bg-red-500 animate-pulse"
          }`} />
          {overallStatus === "operational" ? "All Systems Operational" :
           overallStatus === "degraded" ? "Degraded" : overallStatus === "checking" ? "Checking..." : "Issues Detected"}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-green-50 rounded-xl p-5 border border-green-200 text-center">
          <p className="text-3xl font-bold text-green-700">{healthyCount}/{totalServices}</p>
          <p className="text-xs text-green-600 font-semibold mt-1">Services Healthy</p>
        </div>
        <div className="bg-white rounded-xl p-5 border vi-border text-center">
          <p className="text-3xl font-bold vi-text">{uptime?.uptime?.overall ?? "99.9"}%</p>
          <p className="text-xs vi-text-muted font-semibold mt-1">30d Uptime</p>
        </div>
        <div className="bg-white rounded-xl p-5 border vi-border text-center">
          <p className="text-3xl font-bold vi-text">{deployments.length}</p>
          <p className="text-xs vi-text-muted font-semibold mt-1">Active Deployments</p>
        </div>
        <div className="bg-white rounded-xl p-5 border vi-border text-center">
          <p className="text-3xl font-bold vi-text">{alerts.filter((a) => !a.acked).length}</p>
          <p className="text-xs vi-text-muted font-semibold mt-1">Unacked Alerts</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="vi-card overflow-hidden">
          <div className="p-5 border-b vi-border">
            <h2 className="font-heading font-bold text-lg vi-text">Service Health</h2>
          </div>
          <div className="divide-y divide-slate-50">
            {(statusOverview?.services || []).map((svc: any) => (
              <div key={svc.name} className="flex items-center justify-between px-5 py-3">
                <div className="flex items-center gap-3">
                  <span className={`w-2.5 h-2.5 rounded-full ${
                    svc.status === "healthy" ? "bg-green-500" : svc.status === "degraded" ? "bg-amber-500 animate-pulse" : "bg-red-500"
                  }`} />
                  <span className="text-sm font-medium vi-text">{svc.name}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-xs font-medium ${
                    svc.latencyMs < 200 ? "text-green-600" : svc.latencyMs < 500 ? "text-amber-600" : "text-red-600"
                  }`}>{svc.latencyMs}ms</span>
                  <span className={`px-2 py-0.5 text-xs rounded-full font-semibold ${
                    svc.status === "healthy" ? "bg-green-100 text-green-700" : svc.status === "degraded" ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"
                  }`}>{svc.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="vi-card overflow-hidden">
          <div className="p-5 border-b vi-border">
            <h2 className="font-heading font-bold text-lg vi-text">Infrastructure</h2>
          </div>
          <div className="divide-y divide-slate-50">
            {infrastructure.map((infra) => (
              <div key={infra.name} className="flex items-center justify-between px-5 py-3">
                <div>
                  <p className="text-sm font-medium vi-text">{infra.name}</p>
                  <p className="text-xs vi-text-muted">{infra.type} &middot; {infra.region}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs vi-text-muted">{infra.uptime}</span>
                  <span className="px-2 py-0.5 text-xs rounded-full font-semibold bg-green-100 text-green-700">{infra.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
        {performanceMetrics.map((pm) => (
          <div key={pm.metric} className={`rounded-xl p-3 border text-center ${
            pm.status === "good" ? "bg-green-50 border-green-200" : pm.status === "warning" ? "bg-amber-50 border-amber-200" : "bg-red-50 border-red-200"
          }`}>
            <p className={`text-lg font-bold ${pm.status === "good" ? "text-green-700" : pm.status === "warning" ? "text-amber-700" : "text-red-700"}`}>
              {pm.value}
            </p>
            <p className="text-[10px] vi-text-muted font-semibold mt-0.5">{pm.metric}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="vi-card overflow-hidden">
          <div className="p-5 border-b vi-border">
            <h2 className="font-heading font-bold text-lg vi-text">Recent Deployments</h2>
          </div>
          <div className="divide-y divide-slate-50">
            {deployments.map((d) => (
              <div key={d.service} className="flex items-center justify-between px-5 py-3">
                <div>
                  <p className="text-sm font-medium vi-text">{d.service}</p>
                  <p className="text-xs vi-text-muted">{d.env} &middot; {d.deployedAt}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs vi-text-muted">{d.version}</span>
                  <span className="px-2 py-0.5 text-xs rounded-full font-semibold bg-green-100 text-green-700">{d.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="vi-card overflow-hidden">
          <div className="p-5 border-b vi-border">
            <h2 className="font-heading font-bold text-lg vi-text">Alerts</h2>
          </div>
          <div className="divide-y divide-slate-50">
            {alerts.map((a, i) => (
              <div key={i} className="flex items-center justify-between px-5 py-3">
                <div className="flex items-center gap-3">
                  <span className={`w-2 h-2 rounded-full flex-shrink-0 ${
                    a.severity === "warning" ? "bg-amber-500" : a.severity === "info" ? "bg-blue-500" : "bg-green-500"
                  }`} />
                  <div>
                    <p className="text-sm vi-text">{a.message}</p>
                    <p className="text-xs vi-text-muted">{a.time}</p>
                  </div>
                </div>
                {!a.acked && (
                  <span className="px-2 py-0.5 text-[10px] rounded-full font-bold bg-red-100 text-red-700">NEW</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
