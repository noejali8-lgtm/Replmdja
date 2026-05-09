import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Network, Plus, Play, CheckCircle2, Loader2,
  RefreshCw, Trash2, Settings, Vote, Wifi, WifiOff, Zap,
  ChevronDown
} from "lucide-react";
import { cn } from "@/lib/utils";

const BASE_URL = import.meta.env.BASE_URL?.replace(/\/$/, "") || "";

/* ─── Topology definitions ──────────────────────────────────────────────── */
const TOPOLOGIES = [
  { id: "hierarchical", name: "Hierarchical", description: "Tree structure — coordinator delegates to specialists", icon: "🌳", color: "text-blue-400" },
  { id: "mesh",         name: "Mesh",         description: "Peer-to-peer — all agents collaborate directly",     icon: "🕸️", color: "text-purple-400" },
  { id: "adaptive",    name: "Adaptive",     description: "Self-optimizing — topology evolves with task demands", icon: "🦋", color: "text-green-400" },
];

/* ─── Graph layout data ──────────────────────────────────────────────────── */
type GraphNode = { id: string; label: string; emoji: string; x: number; y: number; color: string };
type GraphEdge = { from: string; to: string };
type PhaseMap  = Record<string, { nodes: string[]; edges: [string, string][] }>;
type GraphDef  = { nodes: GraphNode[]; edges: GraphEdge[]; phases: PhaseMap };

const GRAPH: Record<string, GraphDef> = {
  hierarchical: {
    nodes: [
      { id: "coord",    label: "Coordinator", emoji: "👑", x: 160, y: 48,  color: "#f59e0b" },
      { id: "analyst",  label: "Analyst",     emoji: "🔍", x: 55,  y: 155, color: "#60a5fa" },
      { id: "executor", label: "Executor",    emoji: "⚙️", x: 160, y: 155, color: "#34d399" },
      { id: "reviewer", label: "Reviewer",    emoji: "👁️", x: 265, y: 155, color: "#a78bfa" },
      { id: "reporter", label: "Reporter",    emoji: "📋", x: 160, y: 258, color: "#f472b6" },
    ],
    edges: [
      { from: "coord",    to: "analyst"  },
      { from: "coord",    to: "executor" },
      { from: "coord",    to: "reviewer" },
      { from: "analyst",  to: "executor" },
      { from: "executor", to: "reporter" },
      { from: "reviewer", to: "reporter" },
    ],
    phases: {
      analyze:     { nodes: ["coord","analyst"],                          edges: [["coord","analyst"]] },
      delegate:    { nodes: ["coord","executor","reviewer"],              edges: [["coord","executor"],["coord","reviewer"]] },
      execute:     { nodes: ["analyst","executor"],                       edges: [["analyst","executor"]] },
      consolidate: { nodes: ["executor","reviewer","reporter"],           edges: [["executor","reporter"],["reviewer","reporter"]] },
      report:      { nodes: ["reporter","coord"],                         edges: [["executor","reporter"]] },
    },
  },
  mesh: {
    nodes: [
      { id: "n1", label: "Agent-1", emoji: "🤖", x: 160, y: 38,  color: "#f59e0b" },
      { id: "n2", label: "Agent-2", emoji: "🤖", x: 270, y: 115, color: "#60a5fa" },
      { id: "n3", label: "Agent-3", emoji: "🤖", x: 228, y: 242, color: "#34d399" },
      { id: "n4", label: "Agent-4", emoji: "🤖", x: 92,  y: 242, color: "#a78bfa" },
      { id: "n5", label: "Agent-5", emoji: "🤖", x: 50,  y: 115, color: "#f472b6" },
    ],
    edges: [
      { from: "n1", to: "n2" }, { from: "n2", to: "n3" }, { from: "n3", to: "n4" },
      { from: "n4", to: "n5" }, { from: "n5", to: "n1" },
      { from: "n1", to: "n3" }, { from: "n2", to: "n4" },
      { from: "n3", to: "n5" }, { from: "n4", to: "n1" }, { from: "n5", to: "n2" },
    ],
    phases: {
      broadcast:          { nodes: ["n1","n2","n3","n4","n5"], edges: [["n1","n2"],["n1","n3"],["n1","n4"],["n1","n5"]] },
      negotiate:          { nodes: ["n1","n2","n3"],           edges: [["n1","n2"],["n2","n3"],["n3","n1"]] },
      "parallel-execute": { nodes: ["n2","n3","n4"],           edges: [["n2","n3"],["n3","n4"]] },
      consensus:          { nodes: ["n1","n3","n5"],           edges: [["n1","n3"],["n3","n5"],["n5","n1"]] },
      merge:              { nodes: ["n1","n2","n3","n4","n5"], edges: [["n1","n2"],["n2","n3"],["n3","n4"],["n4","n5"],["n5","n1"]] },
    },
  },
  adaptive: {
    nodes: [
      { id: "hub", label: "Hub",      emoji: "🦋", x: 160, y: 148, color: "#f59e0b" },
      { id: "w1",  label: "Worker-1", emoji: "⚡", x: 58,  y: 58,  color: "#60a5fa" },
      { id: "w2",  label: "Worker-2", emoji: "⚡", x: 262, y: 58,  color: "#34d399" },
      { id: "w3",  label: "Worker-3", emoji: "⚡", x: 268, y: 232, color: "#a78bfa" },
      { id: "w4",  label: "Worker-4", emoji: "⚡", x: 52,  y: 232, color: "#f472b6" },
    ],
    edges: [
      { from: "hub", to: "w1" }, { from: "hub", to: "w2" },
      { from: "hub", to: "w3" }, { from: "hub", to: "w4" },
      { from: "w1",  to: "w2" }, { from: "w3",  to: "w4" },
    ],
    phases: {
      assess:           { nodes: ["hub","w1"],           edges: [["hub","w1"]] },
      "adapt-topology": { nodes: ["hub","w1","w2"],      edges: [["hub","w1"],["hub","w2"],["w1","w2"]] },
      route:            { nodes: ["hub","w2","w3"],      edges: [["hub","w2"],["hub","w3"]] },
      execute:          { nodes: ["w1","w2","w3","w4"],  edges: [["hub","w1"],["hub","w2"],["hub","w3"],["hub","w4"]] },
      learn:            { nodes: ["hub","w1","w4"],      edges: [["hub","w1"],["hub","w4"]] },
    },
  },
};

/* ─── Types ─────────────────────────────────────────────────────────────── */
interface Swarm {
  id: number; name: string; topology: string; status: string; description: string;
  config: { maxAgents: number; consensusThreshold: number; learningRate: number; adaptiveRouting: boolean };
  metrics: { totalTasks: number; successRate: number; activeAgents: number; throughput: number };
  createdAt: string;
}

/* ─── SwarmGraph component ───────────────────────────────────────────────── */
function SwarmGraph({ swarm }: { swarm: Swarm }) {
  const [phase, setPhase]         = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  const [running, setRunning]     = useState(false);
  const [task, setTask]           = useState("");
  const [output, setOutput]       = useState("");
  const [coordinating, setCoordinating] = useState(false);
  const outputRef = useRef<HTMLDivElement>(null);

  const topology = (GRAPH[swarm.topology] ? swarm.topology : "hierarchical") as keyof typeof GRAPH;
  const { nodes, edges, phases } = GRAPH[topology];
  const activity = phase ? (phases[phase] ?? null) : null;

  const isNodeActive = (id: string) => activity?.nodes.includes(id) ?? false;
  const isEdgeActive = (from: string, to: string) =>
    activity?.edges.some(([f, t]) => (f === from && t === to) || (f === to && t === from)) ?? false;
  const nodeById = (id: string) => nodes.find(n => n.id === id);

  /* Auto-scroll output */
  useEffect(() => {
    if (outputRef.current) outputRef.current.scrollTop = outputRef.current.scrollHeight;
  }, [output]);

  /* SSE connection to viz event bus */
  useEffect(() => {
    const es = new EventSource(`${BASE_URL}/api/swarm/${swarm.id}/events/stream`);
    es.onopen  = () => setConnected(true);
    es.onerror = () => setConnected(false);
    es.onmessage = (e) => {
      try {
        const ev = JSON.parse(e.data) as { type: string; phase?: string; topology?: string };
        if (ev.type === "connected") { setConnected(true); return; }
        if (ev.type === "viz_init")  { setPhase(null); setRunning(true); return; }
        if (ev.type === "viz_phase") { setPhase(ev.phase ?? null); return; }
        if (ev.type === "viz_done")  { setPhase(null); setRunning(false); return; }
      } catch { /* ignore */ }
    };
    return () => { es.close(); setConnected(false); };
  }, [swarm.id]);

  async function startCoordination() {
    if (!task.trim() || coordinating) return;
    setCoordinating(true);
    setOutput("");
    try {
      const r = await fetch(`${BASE_URL}/api/swarm/${swarm.id}/coordinate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ task }),
      });
      const reader = r.body?.getReader();
      if (!reader) return;
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const text = new TextDecoder().decode(value);
        for (const line of text.split("\n")) {
          if (!line.startsWith("data:")) continue;
          try {
            const ev = JSON.parse(line.slice(5)) as { type: string; phase?: string; content?: string };
            if (ev.type === "phase_start") setOutput(p => p + `\n▶ ${ev.phase}\n`);
            if (ev.type === "phase_chunk" && ev.content) setOutput(p => p + ev.content);
            if (ev.type === "swarm_done") setOutput(p => p + "\n\n✅ Coordination complete");
          } catch { /* ignore */ }
        }
      }
    } catch { /* ignore */ }
    setCoordinating(false);
  }

  return (
    <div className="space-y-3">
      {/* Graph card */}
      <div className="bg-[#0a0e14] rounded-2xl border border-white/10 overflow-hidden">
        {/* Header bar */}
        <div className="flex items-center gap-2 px-3 py-2 bg-[#0d1117] border-b border-white/[0.07]">
          <span className="text-[10px] font-mono text-white/30 flex-1 truncate">{swarm.name}</span>
          <span className="text-[9px] font-mono bg-white/5 border border-white/10 px-1.5 py-0.5 rounded text-white/40">{topology}</span>
          <span className={cn("flex items-center gap-1 text-[9px] font-medium shrink-0", connected ? "text-green-400" : "text-white/25")}>
            {connected ? <Wifi size={8} /> : <WifiOff size={8} />}
            {connected ? "live" : "off"}
          </span>
        </div>

        {/* Phase badge */}
        <div className="px-3 pt-2.5 pb-0 h-8 flex items-center">
          <AnimatePresence mode="wait">
            {phase ? (
              <motion.div
                key={phase}
                initial={{ opacity: 0, y: -6, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 6, scale: 0.9 }}
                transition={{ duration: 0.2 }}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/20 border border-amber-400/30"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse shrink-0" />
                <span className="text-amber-300 text-[10px] font-mono font-medium">phase: {phase}</span>
              </motion.div>
            ) : running ? (
              <motion.span key="finishing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
                <Loader2 size={9} className="animate-spin" /> finishing…
              </motion.span>
            ) : (
              <span className="text-[10px] text-white/20 font-mono">idle — run a task to watch live execution</span>
            )}
          </AnimatePresence>
        </div>

        {/* SVG graph */}
        <svg viewBox="0 0 320 295" className="w-full select-none" style={{ height: 230 }}>
          <defs>
            <style>{`
              @keyframes flowDash { to { stroke-dashoffset: -18; } }
              @keyframes nodeGlow { 0%,100% { opacity:.35 } 50% { opacity:.8 } }
            `}</style>
          </defs>

          {/* Edges */}
          {edges.map(({ from, to }) => {
            const n1 = nodeById(from);
            const n2 = nodeById(to);
            if (!n1 || !n2) return null;
            const active  = isEdgeActive(from, to);
            const pathId  = `p-${from}-${to}`;
            return (
              <g key={`${from}-${to}`}>
                {/* Static edge line */}
                <line
                  x1={n1.x} y1={n1.y} x2={n2.x} y2={n2.y}
                  stroke={active ? "#f59e0b" : "rgba(255,255,255,0.07)"}
                  strokeWidth={active ? 1.8 : 1}
                  strokeDasharray={active ? "6 4" : "3 5"}
                  style={active ? { animation: "flowDash .6s linear infinite" } : undefined}
                />
                {/* Invisible path anchor for animateMotion */}
                {active && (
                  <>
                    <path id={pathId} d={`M${n1.x},${n1.y} L${n2.x},${n2.y}`} fill="none" stroke="none" />
                    <circle r="3.5" fill="#fbbf24" opacity="0.9">
                      <animateMotion dur="0.85s" repeatCount="indefinite">
                        <mpath href={`#${pathId}`} />
                      </animateMotion>
                    </circle>
                    {/* reverse dot */}
                    <circle r="2" fill="#fde68a" opacity="0.6">
                      <animateMotion dur="0.85s" repeatCount="indefinite" begin="0.42s">
                        <mpath href={`#${pathId}`} />
                      </animateMotion>
                    </circle>
                  </>
                )}
              </g>
            );
          })}

          {/* Nodes */}
          {nodes.map((node) => {
            const active = isNodeActive(node.id);
            return (
              <g key={node.id}>
                {/* Outer glow */}
                {active && (
                  <circle
                    cx={node.x} cy={node.y} r={29}
                    fill={`${node.color}18`}
                    stroke={`${node.color}50`}
                    strokeWidth={1}
                    style={{ animation: "nodeGlow 1.2s ease-in-out infinite" }}
                  />
                )}
                {/* Main circle */}
                <circle
                  cx={node.x} cy={node.y} r={21}
                  fill={active ? `${node.color}22` : "rgba(255,255,255,0.03)"}
                  stroke={active ? node.color : "rgba(255,255,255,0.12)"}
                  strokeWidth={active ? 2 : 1}
                />
                {/* Emoji */}
                <text
                  x={node.x} y={node.y + 5}
                  textAnchor="middle"
                  fontSize={13}
                  style={{ fontFamily: "system-ui, sans-serif", userSelect: "none" }}
                >
                  {node.emoji}
                </text>
                {/* Label */}
                <text
                  x={node.x} y={node.y + 36}
                  textAnchor="middle"
                  fontSize={7.5}
                  fill={active ? node.color : "rgba(255,255,255,0.28)"}
                  style={{ fontFamily: "ui-monospace, monospace", userSelect: "none" }}
                >
                  {node.label}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Legend */}
        <div className="flex items-center justify-center gap-4 pb-3 px-3">
          <span className="flex items-center gap-1.5 text-[9px] text-white/30">
            <span className="w-4 h-px bg-white/15 border-t border-dashed border-white/15" />
            inactive
          </span>
          <span className="flex items-center gap-1.5 text-[9px] text-amber-400/70">
            <span className="w-4 h-px" style={{ background: "#f59e0b", opacity: 0.7 }} />
            active edge
          </span>
          <span className="flex items-center gap-1.5 text-[9px] text-white/30">
            <span className="w-2 h-2 rounded-full bg-amber-400/60" />
            active node
          </span>
        </div>
      </div>

      {/* Task runner */}
      <div className="bg-[#161b22] border border-white/[0.06] rounded-2xl p-3 space-y-2">
        <div className="text-[10px] text-white/40 font-medium mb-1 flex items-center gap-1.5">
          <Zap size={10} className="text-amber-400" /> Run Coordination Task
        </div>
        <div className="flex gap-2">
          <input
            value={task}
            onChange={e => setTask(e.target.value)}
            onKeyDown={e => e.key === "Enter" && startCoordination()}
            placeholder="Describe task for this swarm…"
            className="flex-1 bg-[#0d1117] border border-white/10 rounded-lg px-3 py-2 text-[12px] placeholder:text-white/20 focus:outline-none focus:border-amber-500/50 text-white/80 font-mono"
          />
          <button
            onClick={startCoordination}
            disabled={coordinating || !task.trim()}
            className="px-3 py-2 bg-amber-600/25 border border-amber-400/35 rounded-lg text-amber-300 text-[11px] flex items-center gap-1.5 disabled:opacity-40 hover:bg-amber-600/35 transition-colors shrink-0"
          >
            {coordinating ? <Loader2 size={11} className="animate-spin" /> : <Play size={11} />}
            {coordinating ? "Running" : "Run"}
          </button>
        </div>
        {output && (
          <div
            ref={outputRef}
            className="bg-[#0a0e14] border border-white/[0.06] rounded-lg p-3 max-h-32 overflow-y-auto text-[10px] font-mono text-white/60 whitespace-pre-wrap leading-relaxed"
          >
            {output}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Main SwarmPage ─────────────────────────────────────────────────────── */
type Tab = "swarms" | "visualizer" | "create";

export default function SwarmPage() {
  const [, navigate] = useLocation();
  const [swarms, setSwarms]     = useState<Swarm[]>([]);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName]   = useState("");
  const [newTopology, setNewTopology] = useState("hierarchical");
  const [selected, setSelected] = useState<Swarm | null>(null);
  const [task, setTask]         = useState("");
  const [coordinating, setCoordinating] = useState<number | null>(null);
  const [output, setOutput]     = useState("");
  const [consensusQ, setConsensusQ]     = useState("");
  const [consensusResult, setConsensusResult] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading]   = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("swarms");
  const [vizSwarm, setVizSwarm] = useState<Swarm | null>(null);
  const [showVizPicker, setShowVizPicker] = useState(false);

  useEffect(() => { fetchSwarms(); }, []);

  /* Auto-select viz swarm when swarms load */
  useEffect(() => {
    if (swarms.length > 0 && !vizSwarm) setVizSwarm(swarms[0]);
  }, [swarms, vizSwarm]);

  async function fetchSwarms() {
    setLoading(true);
    try {
      const r = await fetch(`${BASE_URL}/api/swarm`);
      const d = await r.json() as { swarms: Swarm[] };
      setSwarms(d.swarms ?? []);
    } catch { /* ignore */ }
    setLoading(false);
  }

  async function createSwarm() {
    if (!newName.trim()) return;
    setCreating(true);
    try {
      await fetch(`${BASE_URL}/api/swarm`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName, topology: newTopology }),
      });
      setNewName("");
      await fetchSwarms();
      setActiveTab("visualizer");
    } catch { /* ignore */ }
    setCreating(false);
  }

  async function coordinateTask(swarm: Swarm) {
    if (!task.trim()) return;
    setCoordinating(swarm.id);
    setOutput("");
    try {
      const r = await fetch(`${BASE_URL}/api/swarm/${swarm.id}/coordinate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ task }),
      });
      const reader = r.body?.getReader();
      if (!reader) return;
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const text = new TextDecoder().decode(value);
        for (const line of text.split("\n")) {
          if (!line.startsWith("data:")) continue;
          try {
            const ev = JSON.parse(line.slice(5)) as { type: string; phase?: string; content?: string; result?: string };
            if (ev.type === "phase_start") setOutput(p => p + `\n▶ Phase: ${ev.phase}\n`);
            else if (ev.type === "phase_chunk" && ev.content) setOutput(p => p + ev.content);
            else if (ev.type === "phase_done") setOutput(p => p + "\n");
            else if (ev.type === "swarm_done") setOutput(p => p + "\n✅ Swarm coordination complete");
          } catch { /* ignore */ }
        }
      }
      await fetchSwarms();
    } catch { /* ignore */ }
    setCoordinating(null);
  }

  async function runConsensus(swarm: Swarm) {
    if (!consensusQ.trim()) return;
    try {
      const r = await fetch(`${BASE_URL}/api/swarm/${swarm.id}/consensus`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: consensusQ }),
      });
      setConsensusResult(await r.json() as Record<string, unknown>);
    } catch { /* ignore */ }
  }

  async function deleteSwarm(id: number) {
    await fetch(`${BASE_URL}/api/swarm/${id}`, { method: "DELETE" });
    if (vizSwarm?.id === id) setVizSwarm(null);
    await fetchSwarms();
    if (selected?.id === id) setSelected(null);
  }

  const topoInfo = (topo: string) => TOPOLOGIES.find(t => t.id === topo) ?? TOPOLOGIES[0];

  return (
    <div className="min-h-screen bg-[#0d1117] text-white flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-[#0d1117]/95 backdrop-blur border-b border-white/[0.08] px-4 pt-safe">
        <div className="flex items-center gap-3 py-3">
          <button onClick={() => navigate("/")} className="p-1.5 rounded-lg hover:bg-white/5 text-white/60 hover:text-white transition-colors">
            <ArrowLeft size={20} />
          </button>
          <Network size={18} className="text-amber-400" />
          <span className="font-semibold flex-1">Swarm Coordination</span>
          <span className="text-[10px] font-mono bg-amber-500/20 text-amber-300 border border-amber-400/20 px-2 py-0.5 rounded-full">🐝 SWARM</span>
        </div>
        <div className="flex gap-1 pb-3">
          {([
            { id: "swarms",     label: `Active (${swarms.length})` },
            { id: "visualizer", label: "Visualizer" },
            { id: "create",     label: "Create" },
          ] as { id: Tab; label: string }[]).map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={cn(
                "flex-1 py-1.5 rounded-lg text-[12px] font-medium transition-colors",
                activeTab === t.id ? "bg-white/10 text-white" : "text-white/40 hover:text-white/70"
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pb-24 px-4">

        {/* ── Visualizer tab ─────────────────────────────────────────────── */}
        {activeTab === "visualizer" && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="pt-4 space-y-3">
            {swarms.length === 0 ? (
              <div className="text-center py-16 space-y-3">
                <Network size={40} className="mx-auto text-white/10" />
                <p className="text-white/30 text-[13px]">No swarms yet</p>
                <button onClick={() => setActiveTab("create")} className="px-4 py-2 bg-amber-600/20 border border-amber-400/30 rounded-xl text-amber-300 text-[12px]">
                  Create a Swarm
                </button>
              </div>
            ) : (
              <>
                {/* Swarm picker */}
                <div className="relative">
                  <button
                    onClick={() => setShowVizPicker(p => !p)}
                    className="w-full flex items-center gap-2 bg-[#161b22] border border-white/[0.06] rounded-xl px-3 py-2.5 hover:border-amber-400/30 transition-colors"
                  >
                    <span className="text-base">{topoInfo(vizSwarm?.topology ?? "hierarchical").icon}</span>
                    <span className="text-[13px] flex-1 text-left truncate">{vizSwarm?.name ?? "Select swarm…"}</span>
                    <ChevronDown size={14} className={cn("text-white/40 transition-transform", showVizPicker && "rotate-180")} />
                  </button>
                  <AnimatePresence>
                    {showVizPicker && (
                      <motion.div
                        initial={{ opacity: 0, y: -4, scaleY: 0.95 }}
                        animate={{ opacity: 1, y: 0, scaleY: 1 }}
                        exit={{ opacity: 0, y: -4, scaleY: 0.95 }}
                        className="absolute top-full left-0 right-0 mt-1 bg-[#161b22] border border-white/10 rounded-xl overflow-hidden z-30 shadow-xl"
                      >
                        {swarms.map(s => (
                          <button
                            key={s.id}
                            onClick={() => { setVizSwarm(s); setShowVizPicker(false); }}
                            className={cn("w-full flex items-center gap-2 px-3 py-2.5 hover:bg-white/5 transition-colors text-left", vizSwarm?.id === s.id && "bg-amber-500/10")}
                          >
                            <span className="text-base">{topoInfo(s.topology).icon}</span>
                            <span className="text-[13px] flex-1 truncate">{s.name}</span>
                            <span className={cn("text-[10px]", topoInfo(s.topology).color)}>{s.topology}</span>
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {vizSwarm && <SwarmGraph swarm={vizSwarm} />}
              </>
            )}
          </motion.div>
        )}

        {/* ── Create tab ─────────────────────────────────────────────────── */}
        {activeTab === "create" && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="pt-4 space-y-4">
            <div>
              <label className="text-[11px] text-white/50 mb-1.5 block">Swarm Name</label>
              <input
                value={newName}
                onChange={e => setNewName(e.target.value)}
                placeholder="e.g. Code Review Swarm"
                className="w-full bg-[#161b22] border border-white/[0.06] rounded-xl py-3 px-4 text-[13px] placeholder:text-white/30 focus:outline-none focus:border-amber-500/50"
              />
            </div>
            <div>
              <label className="text-[11px] text-white/50 mb-2 block">Topology</label>
              <div className="space-y-2">
                {TOPOLOGIES.map(t => (
                  <button
                    key={t.id}
                    onClick={() => setNewTopology(t.id)}
                    className={cn(
                      "w-full p-3 rounded-xl border text-left transition-colors",
                      newTopology === t.id ? "border-amber-400/40 bg-amber-500/10" : "border-white/[0.06] bg-[#161b22] hover:border-white/20"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{t.icon}</span>
                      <div>
                        <div className={cn("text-[13px] font-medium", t.color)}>{t.name}</div>
                        <div className="text-[11px] text-white/40 mt-0.5">{t.description}</div>
                      </div>
                      {newTopology === t.id && <CheckCircle2 size={14} className="ml-auto text-amber-400" />}
                    </div>
                  </button>
                ))}
              </div>
            </div>
            <button
              onClick={createSwarm}
              disabled={creating || !newName.trim()}
              className="w-full py-3 bg-amber-600/20 border border-amber-400/30 rounded-xl text-amber-300 text-[13px] font-medium flex items-center justify-center gap-2 hover:bg-amber-600/30 transition-colors disabled:opacity-50"
            >
              {creating ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
              Initialize Swarm
            </button>
          </motion.div>
        )}

        {/* ── Active Swarms tab ──────────────────────────────────────────── */}
        {activeTab === "swarms" && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="pt-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[12px] text-white/50">{swarms.length} swarms</span>
              <button onClick={fetchSwarms} className="p-1.5 rounded-lg hover:bg-white/5 text-white/40 hover:text-white transition-colors">
                <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
              </button>
            </div>

            {swarms.length === 0 ? (
              <div className="text-center py-16">
                <Network size={40} className="mx-auto text-white/10 mb-3" />
                <p className="text-white/30 text-[13px]">No swarms yet</p>
                <button onClick={() => setActiveTab("create")} className="mt-3 px-4 py-2 bg-amber-600/20 border border-amber-400/30 rounded-lg text-amber-300 text-[12px]">
                  Create First Swarm
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {swarms.map(swarm => {
                  const info    = topoInfo(swarm.topology);
                  const isCoord = coordinating === swarm.id;
                  const isSel   = selected?.id === swarm.id;
                  return (
                    <div key={swarm.id} className={cn("bg-[#161b22] border rounded-xl p-3 transition-all", isSel ? "border-amber-400/30" : "border-white/[0.06]")}>
                      <div className="flex items-start gap-2">
                        <span className="text-xl shrink-0">{info.icon}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-[13px] font-medium truncate">{swarm.name}</span>
                            <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", swarm.status === "running" ? "bg-green-400 animate-pulse" : "bg-white/20")} />
                          </div>
                          <div className="flex gap-3 mt-1">
                            <span className={cn("text-[10px]", info.color)}>{info.name}</span>
                            <span className="text-[10px] text-white/30">Tasks: {swarm.metrics?.totalTasks ?? 0}</span>
                          </div>
                        </div>
                        <div className="flex gap-1 shrink-0">
                          <button
                            onClick={() => { setVizSwarm(swarm); setActiveTab("visualizer"); }}
                            title="Open in Visualizer"
                            className="p-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 transition-colors"
                          >
                            <Network size={12} className="text-amber-400" />
                          </button>
                          <button
                            onClick={() => setSelected(isSel ? null : swarm)}
                            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                          >
                            <Settings size={12} className="text-white/50" />
                          </button>
                          <button
                            onClick={() => deleteSwarm(swarm.id)}
                            className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 transition-colors"
                          >
                            <Trash2 size={12} className="text-red-400" />
                          </button>
                        </div>
                      </div>

                      <AnimatePresence>
                        {isSel && (
                          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="mt-3 space-y-3">
                            <div className="grid grid-cols-3 gap-2">
                              {[
                                { label: "Max Agents", value: swarm.config?.maxAgents ?? 10 },
                                { label: "Consensus",  value: `${((swarm.config?.consensusThreshold ?? 0.7) * 100).toFixed(0)}%` },
                                { label: "Learning",   value: swarm.config?.learningRate ?? 0.01 },
                              ].map(({ label, value }) => (
                                <div key={label} className="bg-[#0d1117] rounded-lg p-2 text-center">
                                  <div className="text-[13px] font-mono text-amber-300">{value}</div>
                                  <div className="text-[9px] text-white/30 mt-0.5">{label}</div>
                                </div>
                              ))}
                            </div>
                            <div>
                              <div className="text-[11px] text-white/40 mb-1.5">Coordinate Task</div>
                              <div className="flex gap-2">
                                <input value={task} onChange={e => setTask(e.target.value)} placeholder="Describe the task..." className="flex-1 bg-[#0d1117] border border-white/10 rounded-lg px-3 py-2 text-[12px] placeholder:text-white/30 focus:outline-none focus:border-amber-500/50" />
                                <button onClick={() => coordinateTask(swarm)} disabled={isCoord || !task.trim()}
                                  className="px-3 py-2 bg-amber-600/30 border border-amber-400/40 rounded-lg text-amber-300 text-[11px] flex items-center gap-1 disabled:opacity-50">
                                  {isCoord ? <Loader2 size={12} className="animate-spin" /> : <Play size={12} />}
                                </button>
                              </div>
                            </div>
                            {output && (
                              <div className="bg-[#0d1117] border border-white/[0.06] rounded-lg p-3 max-h-40 overflow-y-auto text-[11px] font-mono text-white/70 whitespace-pre-wrap">{output}</div>
                            )}
                            <div>
                              <div className="text-[11px] text-white/40 mb-1.5">Consensus Vote</div>
                              <div className="flex gap-2">
                                <input value={consensusQ} onChange={e => setConsensusQ(e.target.value)} placeholder="Question to vote on..." className="flex-1 bg-[#0d1117] border border-white/10 rounded-lg px-3 py-2 text-[12px] placeholder:text-white/30 focus:outline-none focus:border-amber-500/50" />
                                <button onClick={() => runConsensus(swarm)} disabled={!consensusQ.trim()}
                                  className="px-3 py-2 bg-blue-600/20 border border-blue-400/30 rounded-lg text-blue-300 text-[11px] disabled:opacity-50">
                                  <Vote size={12} />
                                </button>
                              </div>
                              {consensusResult && (
                                <div className="mt-2 bg-[#0d1117] rounded-lg p-3 text-[11px]">
                                  <div className="flex items-center gap-2 mb-2">
                                    <span className={cn("font-medium", (consensusResult as { consensus: boolean }).consensus ? "text-green-400" : "text-red-400")}>
                                      {(consensusResult as { consensus: boolean }).consensus ? "✅ Consensus Reached" : "❌ No Consensus"}
                                    </span>
                                    <span className="text-white/40">Winner: <span className="text-white">{(consensusResult as { winner: string }).winner}</span></span>
                                  </div>
                                  <div className="flex gap-2 flex-wrap">
                                    {Object.entries((consensusResult as { votes: Record<string, number> }).votes ?? {}).map(([opt, count]) => (
                                      <span key={opt} className="bg-white/5 px-2 py-0.5 rounded text-white/60">{opt}: {count}</span>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}
