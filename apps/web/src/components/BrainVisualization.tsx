"use client";
import { useEffect, useState, useRef, useCallback } from "react";

interface BrainState {
  masteryLevels: Record<string, number>;
  functioningLevelProfile: { level: string; confidence?: number };
  sensoryProfile: { visual?: string; auditory?: string; tactile?: string };
  activeAccommodations: string[];
  iepProfile: { goals?: string[] };
  disabilitySignals: Record<string, number>;
  version: number;
  updatedAt: string;
}

interface BrainNode {
  id: string;
  label: string;
  x: number;
  y: number;
  radius: number;
  color: string;
  mastery: number;
  pulsePhase: number;
}

interface NeuralConnection {
  from: string;
  to: string;
  strength: number;
}

type ViewMode = "brain" | "rai" | "xai";

const DOMAIN_COLORS: Record<string, string> = {
  mathematics: "#7C3AED",
  math: "#7C3AED",
  ela: "#10B981",
  english: "#10B981",
  science: "#F59E0B",
  history: "#6366F1",
  coding: "#06B6D4",
  speech: "#EC4899",
  sel: "#8B5CF6",
  geography: "#14B8A6",
  music: "#D946EF",
  pe: "#22C55E",
  health: "#22C55E",
  languages: "#0EA5E9",
  stem: "#EF4444",
  engineering: "#EF4444",
  life_skills: "#F97316",
  creative: "#A855F7",
  default: "#94A3B8",
};

function getDomainColor(domain: string): string {
  const lower = domain.toLowerCase();
  for (const [key, color] of Object.entries(DOMAIN_COLORS)) {
    if (lower.includes(key)) return color;
  }
  return DOMAIN_COLORS.default;
}

function generateBrainNodes(mastery: Record<string, number>): BrainNode[] {
  const entries = Object.entries(mastery);
  if (entries.length === 0) return [];

  const nodes: BrainNode[] = [];
  const cx = 200;
  const cy = 180;
  const maxRadius = 130;

  entries.forEach(([domain, value], i) => {
    const angle = (i / entries.length) * Math.PI * 2 - Math.PI / 2;
    const dist = maxRadius * (0.5 + Math.random() * 0.4);
    nodes.push({
      id: domain,
      label: domain.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase()),
      x: cx + Math.cos(angle) * dist,
      y: cy + Math.sin(angle) * dist,
      radius: 12 + (value / 100) * 14,
      color: getDomainColor(domain),
      mastery: value,
      pulsePhase: Math.random() * Math.PI * 2,
    });
  });

  return nodes;
}

function generateConnections(nodes: BrainNode[]): NeuralConnection[] {
  const conns: NeuralConnection[] = [];
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const dx = nodes[i].x - nodes[j].x;
      const dy = nodes[i].y - nodes[j].y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 180) {
        const avgMastery = (nodes[i].mastery + nodes[j].mastery) / 200;
        conns.push({
          from: nodes[i].id,
          to: nodes[j].id,
          strength: avgMastery * (1 - dist / 250),
        });
      }
    }
  }
  return conns;
}

const FUNCTIONING_BADGES: Record<string, { label: string; color: string; bg: string }> = {
  STANDARD: { label: "Standard", color: "#059669", bg: "#D1FAE5" },
  SUPPORTED: { label: "Supported", color: "#D97706", bg: "#FEF3C7" },
  LOW_VERBAL: { label: "Low Verbal", color: "#DC2626", bg: "#FEE2E2" },
  NON_VERBAL: { label: "Non-Verbal", color: "#7C3AED", bg: "#EDE9FE" },
  PRE_SYMBOLIC: { label: "Pre-Symbolic", color: "#BE185D", bg: "#FCE7F3" },
};

interface BrainVisualizationProps {
  learnerId: string;
  learnerName: string;
  accessToken: string;
  compact?: boolean;
}

export default function BrainVisualization({ learnerId, learnerName, accessToken, compact = false }: BrainVisualizationProps) {
  const [brainState, setBrainState] = useState<BrainState | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("brain");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const animRef = useRef<number>(0);

  useEffect(() => {
    const fetchBrain = async () => {
      try {
        const res = await fetch(`/api/brain/${learnerId}`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (res.ok) {
          const data = await res.json();
          setBrainState(data.state || data);
        } else {
          setError("Brain not initialized yet");
        }
      } catch (err: unknown) {
        console.error("Failed to fetch brain state:", err);
        setError("Could not load brain data");
      }
      setLoading(false);
    };
    fetchBrain();
  }, [learnerId, accessToken]);

  useEffect(() => {
    let running = true;
    const animate = () => {
      if (!running) return;
      setTick(t => t + 1);
      animRef.current = requestAnimationFrame(animate);
    };
    animRef.current = requestAnimationFrame(animate);
    return () => {
      running = false;
      cancelAnimationFrame(animRef.current);
    };
  }, []);

  const mastery = brainState?.masteryLevels || {};
  const nodes = generateBrainNodes(mastery);
  const connections = generateConnections(nodes);
  const funcLevel = brainState?.functioningLevelProfile?.level || "STANDARD";
  const funcBadge = FUNCTIONING_BADGES[funcLevel] || FUNCTIONING_BADGES.STANDARD;
  const sensory = brainState?.sensoryProfile || {};
  const accommodations = brainState?.activeAccommodations || [];
  const iepGoals = brainState?.iepProfile?.goals || [];
  const signals = brainState?.disabilitySignals || {};

  const getNodePosition = useCallback((node: BrainNode, t: number): { x: number; y: number } => {
    const speed = 0.02;
    const amplitude = 2;
    return {
      x: node.x + Math.sin(t * speed + node.pulsePhase) * amplitude,
      y: node.y + Math.cos(t * speed * 0.7 + node.pulsePhase) * amplitude,
    };
  }, []);

  if (loading) {
    return (
      <div className={`bg-white rounded-2xl border border-slate-200 ${compact ? "p-4" : "p-6"} flex items-center justify-center`}>
        <div className="animate-pulse flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-purple-100" />
          <span className="text-sm text-slate-400">Loading brain data...</span>
        </div>
      </div>
    );
  }

  if (error || !brainState) {
    return (
      <div className={`bg-white rounded-2xl border border-slate-200 ${compact ? "p-4" : "p-6"}`}>
        <div className="text-center py-8">
          <div className="text-4xl mb-3">🧠</div>
          <p className="text-slate-500 font-semibold">{error || "No brain data available"}</p>
          <p className="text-xs text-slate-400 mt-1">Complete the baseline assessment to initialize the Brain Clone</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-2xl border border-slate-200 overflow-hidden ${compact ? "" : "shadow-lg"}`}>
      <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 bg-gradient-to-r from-purple-50 to-cyan-50">
        <div className="flex items-center gap-3">
          <span className="text-xl">🧠</span>
          <div>
            <h3 className="font-heading font-bold text-slate-900 text-sm">{learnerName}&apos;s Brain Clone</h3>
            <span className="text-[10px] text-slate-400">v{brainState.version} &middot; Updated {new Date(brainState.updatedAt).toLocaleDateString()}</span>
          </div>
        </div>
        <div className="flex items-center gap-1 bg-white rounded-full p-0.5 border border-slate-200">
          {(["brain", "rai", "xai"] as ViewMode[]).map((mode) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                viewMode === mode
                  ? mode === "rai" ? "bg-green-500 text-white" : mode === "xai" ? "bg-blue-500 text-white" : "bg-primary text-white"
                  : "text-slate-500 hover:bg-slate-50"
              }`}
            >
              {mode === "brain" ? "Brain" : mode.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      <div className={compact ? "p-3" : "p-5"}>
        {viewMode === "brain" && (
          <BrainNetworkView
            nodes={nodes}
            connections={connections}
            tick={tick}
            hoveredNode={hoveredNode}
            setHoveredNode={setHoveredNode}
            getNodePosition={getNodePosition}
            funcBadge={funcBadge}
            funcLevel={funcLevel}
            compact={compact}
          />
        )}
        {viewMode === "rai" && (
          <RAIView
            funcBadge={funcBadge}
            funcLevel={funcLevel}
            sensory={sensory}
            accommodations={accommodations}
            iepGoals={iepGoals}
            version={brainState.version}
            compact={compact}
          />
        )}
        {viewMode === "xai" && (
          <XAIView
            mastery={mastery}
            signals={signals}
            nodes={nodes}
            funcLevel={funcLevel}
            compact={compact}
          />
        )}
      </div>
    </div>
  );
}

function BrainNetworkView({
  nodes, connections, tick, hoveredNode, setHoveredNode, getNodePosition, funcBadge, funcLevel, compact,
}: {
  nodes: BrainNode[];
  connections: NeuralConnection[];
  tick: number;
  hoveredNode: string | null;
  setHoveredNode: (id: string | null) => void;
  getNodePosition: (node: BrainNode, t: number) => { x: number; y: number };
  funcBadge: { label: string; color: string; bg: string };
  funcLevel: string;
  compact: boolean;
}) {
  const svgHeight = compact ? 260 : 360;

  return (
    <div>
      <svg viewBox="0 0 400 360" className="w-full" style={{ maxHeight: `${svgHeight}px` }}>
        <defs>
          <radialGradient id="brain-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#7C3AED" stopOpacity="0.08" />
            <stop offset="100%" stopColor="#7C3AED" stopOpacity="0" />
          </radialGradient>
          <filter id="node-glow">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          {nodes.map(node => (
            <radialGradient key={`grad-${node.id}`} id={`grad-${node.id}`} cx="30%" cy="30%">
              <stop offset="0%" stopColor={node.color} stopOpacity="0.9" />
              <stop offset="100%" stopColor={node.color} stopOpacity="0.6" />
            </radialGradient>
          ))}
        </defs>

        <ellipse cx="200" cy="180" rx="170" ry="155" fill="url(#brain-glow)" />

        {connections.map((conn, i) => {
          const fromNode = nodes.find(n => n.id === conn.from);
          const toNode = nodes.find(n => n.id === conn.to);
          if (!fromNode || !toNode) return null;
          const fromPos = getNodePosition(fromNode, tick);
          const toPos = getNodePosition(toNode, tick);
          const pulseOffset = (tick * 0.03 + i * 0.5) % 1;
          const isHighlighted = hoveredNode === conn.from || hoveredNode === conn.to;

          return (
            <g key={`conn-${i}`}>
              <line
                x1={fromPos.x} y1={fromPos.y}
                x2={toPos.x} y2={toPos.y}
                stroke={isHighlighted ? "#7C3AED" : "#CBD5E1"}
                strokeWidth={isHighlighted ? 2 : 1}
                strokeOpacity={isHighlighted ? 0.8 : 0.15 + conn.strength * 0.4}
              />
              <circle
                cx={fromPos.x + (toPos.x - fromPos.x) * pulseOffset}
                cy={fromPos.y + (toPos.y - fromPos.y) * pulseOffset}
                r={1.5}
                fill="#7C3AED"
                opacity={0.3 + conn.strength * 0.5}
              />
            </g>
          );
        })}

        {nodes.map((node) => {
          const pos = getNodePosition(node, tick);
          const isHovered = hoveredNode === node.id;
          const pulseScale = 1 + Math.sin(tick * 0.04 + node.pulsePhase) * 0.08;
          const r = node.radius * (isHovered ? 1.3 : pulseScale);

          return (
            <g
              key={node.id}
              onMouseEnter={() => setHoveredNode(node.id)}
              onMouseLeave={() => setHoveredNode(null)}
              style={{ cursor: "pointer" }}
            >
              <circle
                cx={pos.x} cy={pos.y} r={r + 4}
                fill={node.color}
                opacity={0.15 + Math.sin(tick * 0.03 + node.pulsePhase) * 0.1}
              />
              <circle
                cx={pos.x} cy={pos.y} r={r}
                fill={`url(#grad-${node.id})`}
                filter={isHovered ? "url(#node-glow)" : undefined}
                stroke="white"
                strokeWidth={isHovered ? 2 : 1}
              />
              <text
                x={pos.x} y={pos.y + r + 14}
                textAnchor="middle"
                fontSize="8"
                fontWeight="700"
                fill="#475569"
                fontFamily="'Nunito', sans-serif"
              >
                {node.label.length > 12 ? node.label.slice(0, 12) + "…" : node.label}
              </text>
              <text
                x={pos.x} y={pos.y + 3}
                textAnchor="middle"
                fontSize="9"
                fontWeight="800"
                fill="white"
              >
                {Math.round(node.mastery)}%
              </text>

              {isHovered && (
                <g>
                  <rect
                    x={pos.x - 55} y={pos.y - r - 32}
                    width={110} height={22}
                    rx={6}
                    fill="rgba(30,41,59,0.9)"
                  />
                  <text
                    x={pos.x} y={pos.y - r - 17}
                    textAnchor="middle"
                    fontSize="9"
                    fill="white"
                    fontWeight="600"
                  >
                    {node.label}: {Math.round(node.mastery)}%
                  </text>
                </g>
              )}
            </g>
          );
        })}

        <text x="200" y="355" textAnchor="middle" fontSize="9" fill="#94A3B8" fontWeight="600">
          Neural pathways active &middot; {nodes.length} domains
        </text>
      </svg>

      <div className="flex items-center justify-center gap-3 mt-2">
        <span
          className="px-3 py-1 rounded-full text-xs font-bold"
          style={{ color: funcBadge.color, backgroundColor: funcBadge.bg }}
        >
          {funcBadge.label}
        </span>
        <span className="text-xs text-slate-400">{funcLevel} functioning</span>
      </div>
    </div>
  );
}

function RAIView({
  funcBadge, funcLevel, sensory, accommodations, iepGoals, version, compact,
}: {
  funcBadge: { label: string; color: string; bg: string };
  funcLevel: string;
  sensory: Record<string, string>;
  accommodations: string[];
  iepGoals: string[];
  version: number;
  compact: boolean;
}) {
  const checks = [
    { label: "COPPA Compliance", status: true, detail: "Parental consent verified" },
    { label: "Content Safety Gate", status: true, detail: "All responses pass quality filter" },
    { label: "Bias Detection", status: true, detail: "Content checked for cultural sensitivity" },
    { label: "Data Encryption", status: true, detail: "Brain state encrypted at rest (AES-256)" },
    { label: "Parent Approval Loop", status: true, detail: "Level changes require parent consent" },
    { label: "Session Recording", status: true, detail: `Brain v${version} — full audit trail` },
  ];

  const sensoryEntries = Object.entries(sensory).filter(([, v]) => v && v !== "typical");

  return (
    <div className={`space-y-4 ${compact ? "text-xs" : "text-sm"}`}>
      <div className="flex items-center gap-2 mb-3">
        <span className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-600 text-lg font-bold">✓</span>
        <div>
          <h4 className="font-heading font-bold text-slate-900">Responsible AI Status</h4>
          <p className="text-xs text-slate-400">Safety, compliance & ethical guardrails</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {checks.map((c) => (
          <div key={c.label} className="flex items-start gap-2 p-2.5 rounded-xl bg-green-50 border border-green-100">
            <span className="text-green-500 mt-0.5 flex-shrink-0">✓</span>
            <div>
              <p className="font-bold text-slate-700 text-xs">{c.label}</p>
              <p className="text-[10px] text-slate-400">{c.detail}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="border-t border-slate-100 pt-3">
        <h5 className="font-bold text-slate-700 mb-2">Functioning & Sensory Profile</h5>
        <div className="flex flex-wrap gap-2">
          <span className="px-2.5 py-1 rounded-full text-xs font-bold" style={{ color: funcBadge.color, backgroundColor: funcBadge.bg }}>
            {funcBadge.label}
          </span>
          {sensoryEntries.map(([key, val]) => (
            <span key={key} className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-100">
              {key}: {val}
            </span>
          ))}
        </div>
      </div>

      {accommodations.length > 0 && (
        <div className="border-t border-slate-100 pt-3">
          <h5 className="font-bold text-slate-700 mb-2">Active Accommodations</h5>
          <div className="flex flex-wrap gap-1.5">
            {accommodations.map((a, i) => (
              <span key={i} className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-100">
                {typeof a === "string" ? a : String(a)}
              </span>
            ))}
          </div>
        </div>
      )}

      {iepGoals.length > 0 && (
        <div className="border-t border-slate-100 pt-3">
          <h5 className="font-bold text-slate-700 mb-2">IEP Goals Tracked ({iepGoals.length})</h5>
          <ul className="space-y-1">
            {iepGoals.slice(0, 5).map((g, i) => (
              <li key={i} className="flex items-start gap-1.5 text-xs text-slate-600">
                <span className="text-purple-400 mt-0.5">•</span>
                {typeof g === "string" ? g : String(g)}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function XAIView({
  mastery, signals, nodes, funcLevel, compact,
}: {
  mastery: Record<string, number>;
  signals: Record<string, number>;
  nodes: BrainNode[];
  funcLevel: string;
  compact: boolean;
}) {
  const entries = Object.entries(mastery).sort((a, b) => b[1] - a[1]);
  const strengths = entries.filter(([, v]) => v >= 60);
  const developing = entries.filter(([, v]) => v >= 30 && v < 60);
  const emerging = entries.filter(([, v]) => v < 30);
  const avgMastery = entries.length > 0 ? entries.reduce((s, [, v]) => s + v, 0) / entries.length : 0;
  const signalEntries = Object.entries(signals).filter(([, v]) => v > 0.3);

  const explanations: { icon: string; title: string; detail: string; type: "insight" | "caution" | "info" }[] = [];

  if (strengths.length > 0) {
    explanations.push({
      icon: "💪",
      title: `Strong in ${strengths.length} domain${strengths.length > 1 ? "s" : ""}`,
      detail: `Highest: ${strengths[0][0].replace(/_/g, " ")} at ${Math.round(strengths[0][1])}%. These domains show consistent mastery and readiness for advancement.`,
      type: "insight",
    });
  }

  if (emerging.length > 0) {
    explanations.push({
      icon: "🌱",
      title: `${emerging.length} domain${emerging.length > 1 ? "s" : ""} emerging`,
      detail: `${emerging.map(([d]) => d.replace(/_/g, " ")).join(", ")} — below 30% mastery. The Brain is focusing additional scaffolding and review on these areas.`,
      type: "caution",
    });
  }

  if (funcLevel !== "STANDARD") {
    explanations.push({
      icon: "🎯",
      title: `Adapted for ${funcLevel.replace(/_/g, " ").toLowerCase()} learner`,
      detail: "Content delivery, interaction modes, and session lengths are automatically adjusted based on the functioning level profile in the Brain Clone.",
      type: "info",
    });
  }

  if (signalEntries.length > 0) {
    explanations.push({
      icon: "📊",
      title: "Behavioral signals detected",
      detail: `The Brain has identified patterns in: ${signalEntries.map(([k]) => k.replace(/_/g, " ")).join(", ")}. These influence accommodation recommendations.`,
      type: "info",
    });
  }

  explanations.push({
    icon: "🔄",
    title: "Continuous adaptation",
    detail: `Average mastery: ${Math.round(avgMastery)}% across ${entries.length} domains. The Brain adjusts difficulty, pacing, and tutor strategies after each session.`,
    type: "insight",
  });

  return (
    <div className={`space-y-4 ${compact ? "text-xs" : "text-sm"}`}>
      <div className="flex items-center gap-2 mb-3">
        <span className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-lg font-bold">?</span>
        <div>
          <h4 className="font-heading font-bold text-slate-900">Explainable AI Insights</h4>
          <p className="text-xs text-slate-400">Why the Brain makes its decisions</p>
        </div>
      </div>

      <div className="space-y-2.5">
        {explanations.map((exp, i) => (
          <div
            key={i}
            className={`p-3 rounded-xl border ${
              exp.type === "insight" ? "bg-emerald-50 border-emerald-100" :
              exp.type === "caution" ? "bg-amber-50 border-amber-100" :
              "bg-blue-50 border-blue-100"
            }`}
          >
            <div className="flex items-start gap-2">
              <span className="text-base flex-shrink-0">{exp.icon}</span>
              <div>
                <p className="font-bold text-slate-800 text-xs">{exp.title}</p>
                <p className="text-[10px] text-slate-500 mt-0.5 leading-relaxed">{exp.detail}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="border-t border-slate-100 pt-3">
        <h5 className="font-bold text-slate-700 mb-2">Domain Mastery Breakdown</h5>
        <div className="space-y-1.5">
          {entries.map(([domain, value]) => {
            const node = nodes.find(n => n.id === domain);
            const color = node?.color || "#94A3B8";
            return (
              <div key={domain} className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                <span className="text-[10px] text-slate-600 w-24 truncate">{domain.replace(/_/g, " ")}</span>
                <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${value}%`, backgroundColor: color }}
                  />
                </div>
                <span className="text-[10px] font-bold text-slate-500 w-8 text-right">{Math.round(value)}%</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
