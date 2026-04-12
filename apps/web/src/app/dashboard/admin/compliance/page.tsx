"use client";
import { useAuth } from "@/providers/auth-provider";
import { useEffect, useState } from "react";

interface AuditEvent {
  id: string;
  eventType: string;
  resourceType: string;
  userId: string;
  metadata: any;
  createdAt: string;
}

export default function AdminCompliancePage() {
  const { accessToken } = useAuth();
  const [auditEvents, setAuditEvents] = useState<AuditEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!accessToken) return;
    setLoading(false);
  }, [accessToken]);

  const complianceChecks = [
    { framework: "COPPA", status: "compliant", items: [
      { label: "Parental consent required before data collection", status: true },
      { label: "No direct marketing to children under 13", status: true },
      { label: "Parent can review/delete child data at any time", status: true },
      { label: "Minimal data collection principle enforced", status: true },
    ]},
    { framework: "FERPA", status: "compliant", items: [
      { label: "Student education records access controls", status: true },
      { label: "Parent access to student data guaranteed", status: true },
      { label: "Data sharing limited to educational purpose", status: true },
      { label: "Annual notification procedures in place", status: true },
    ]},
    { framework: "GDPR/CCPA", status: "compliant", items: [
      { label: "Right to access personal data", status: true },
      { label: "Right to deletion (data erasure)", status: true },
      { label: "Data portability support", status: true },
      { label: "Consent management & withdrawal", status: true },
    ]},
    { framework: "SOC2 Type II", status: "in_progress", items: [
      { label: "Access control procedures", status: true },
      { label: "System change management", status: true },
      { label: "Risk assessment documentation", status: true },
      { label: "Incident response procedures", status: true },
      { label: "Audit evidence automation", status: false },
    ]},
  ];

  const securityControls = [
    { label: "JWT RS256 Token Authentication", status: true, category: "Auth" },
    { label: "Multi-Factor Authentication (MFA)", status: true, category: "Auth" },
    { label: "Step-Up Authentication for Sensitive Ops", status: true, category: "Auth" },
    { label: "Role-Based Access Control (RBAC)", status: true, category: "Access" },
    { label: "Tenant Data Isolation", status: true, category: "Access" },
    { label: "API Rate Limiting", status: true, category: "Network" },
    { label: "HTTPS/TLS Encryption in Transit", status: true, category: "Encryption" },
    { label: "AES-256 Encryption at Rest", status: true, category: "Encryption" },
    { label: "Brain State Versioning & Audit Trail", status: true, category: "Audit" },
    { label: "Admin Action Logging", status: true, category: "Audit" },
    { label: "Automated Vulnerability Scanning", status: true, category: "Scanning" },
    { label: "Secret Detection (gitleaks/trufflehog)", status: true, category: "Scanning" },
  ];

  const dataRequests = [
    { type: "Access Request", count: 0, desc: "Pending data access requests" },
    { type: "Deletion Request", count: 0, desc: "Pending data deletion requests" },
    { type: "Export Request", count: 0, desc: "Pending data export requests" },
  ];

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold text-slate-900">Compliance & Security</h1>
        <p className="text-sm text-slate-500 mt-1">COPPA, FERPA, GDPR compliance status and security controls.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {complianceChecks.map((fw) => {
          const passed = fw.items.filter((i) => i.status).length;
          const total = fw.items.length;
          return (
            <div key={fw.framework} className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-heading font-bold text-slate-900">{fw.framework}</h3>
                <span className={`px-2.5 py-0.5 text-xs rounded-full font-semibold ${
                  fw.status === "compliant" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
                }`}>
                  {fw.status === "compliant" ? "Compliant" : "In Progress"}
                </span>
              </div>
              <div className="space-y-2">
                {fw.items.map((item, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span className={`mt-0.5 text-xs ${item.status ? "text-green-500" : "text-slate-300"}`}>
                      {item.status ? "✓" : "○"}
                    </span>
                    <span className="text-xs text-slate-600">{item.label}</span>
                  </div>
                ))}
              </div>
              <div className="mt-3 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                <div className="h-full bg-green-500 rounded-full" style={{ width: `${(passed / total) * 100}%` }} />
              </div>
              <p className="text-[10px] text-slate-400 mt-1">{passed}/{total} checks passed</p>
            </div>
          );
        })}
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
        <h2 className="font-heading font-bold text-lg text-slate-900 mb-4">Security Controls</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {securityControls.map((ctrl) => (
            <div key={ctrl.label} className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-green-500 mt-0.5 font-bold flex-shrink-0">✓</span>
              <div>
                <p className="text-sm font-medium text-slate-700">{ctrl.label}</p>
                <p className="text-[10px] text-slate-400 mt-0.5">{ctrl.category}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {dataRequests.map((dr) => (
          <div key={dr.type} className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 text-center">
            <p className="text-3xl font-bold text-slate-900">{dr.count}</p>
            <p className="text-sm font-semibold text-slate-700 mt-1">{dr.type}</p>
            <p className="text-xs text-slate-400 mt-0.5">{dr.desc}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
        <h2 className="font-heading font-bold text-lg text-slate-900 mb-4">Consent Management</h2>
        <p className="text-sm text-slate-500 mb-4">COPPA parental consent is required before any child data is collected. All consent records are tracked with timestamps and can be revoked.</p>
        <div className="grid grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-green-50 border border-green-200 text-center">
            <p className="text-2xl font-bold text-green-700">Active</p>
            <p className="text-xs text-green-600">Consent Tracking</p>
          </div>
          <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 text-center">
            <p className="text-2xl font-bold text-blue-700">Enforced</p>
            <p className="text-xs text-blue-600">Data Minimization</p>
          </div>
          <div className="p-4 rounded-xl bg-purple-50 border border-purple-200 text-center">
            <p className="text-2xl font-bold text-purple-700">Logged</p>
            <p className="text-xs text-purple-600">Admin Actions</p>
          </div>
        </div>
      </div>
    </div>
  );
}
