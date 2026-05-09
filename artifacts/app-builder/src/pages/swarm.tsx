import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Network, Plus, Play, CheckCircle2, Loader2,
  ChevronRight, Activity, Users, Zap, GitBranch, RefreshCw,
  MessageSquare, Vote, Trash2, Brain, Settings, BarChart3
} from "lucide-react";
import { cn } from "@/lib/utils";

const BASE_URL = import.meta.env.BASE_URL?.replace(/\/$/, "") || "";

const TOPOLOGIES = [
  { id: "hierarchical", name: "Hierarchical", description: "Tree structure — coordinator delegates to specialists", icon: "🌳", color: "text-blue-400" },
  { id: "mesh", name: "Mesh", description: "Peer-to-peer — all agents collaborate directly", icon: "🕸️", color: "text-purple-400" },
  { id: "adaptive", name: "Adaptive", description: "Self-optimizing — topology evolves with task demands", icon: "🦋", color: "text-green-400" },
];

interface Swarm {
  id: number; name: string; topology: string; status: string; description: string;
  config: { maxAgents: number; consensusThreshold: number; learningRate: number; adaptiveRouting: boolean };
  metrics: { totalTasks: number; successRate: number; activeAgents: number; throughput: number };
  createdAt: string;
}

export default function SwarmPage() {
  const [, navigate] = useLocation();
  const [swarms, setSwarms] = useState<Swarm[]>([]);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [newTopology, setNewTopology] = useState("hierarchical");
  const [selected, setSelected] = useState<Swarm | null>(null);
  const [task, setTask] = useState("");
  const [coordinating, setCoordinating] = useState<number | null>(null);
  const [output, setOutput] = useState("");
  const [consensusQ, setConsensusQ] = useState("");
  const [consensusResult, setConsensusResult] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"swarms" | "create" | "detail">("swarms");

  useEffect(() => { fetchSwarms(); }, []);

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
      setActiveTab("swarms");
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
    await fetchSwarms();
    if (selected?.id === id) setSelected(null);
  }

  const topoInfo = (topo: string) => TOPOLOGIES.find(t => t.id === topo) ?? TOPOLOGIES[0];

  return (
    <div className="min-h-screen bg-[#0d1117] text-white flex flex-col">
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
          {(["swarms", "create"] as const).map(t => (
            <button key={t} onClick={() => setActiveTab(t)} className={cn("flex-1 py-1.5 rounded-lg text-[12px] font-medium capitalize transition-colors", activeTab === t ? "bg-white/10 text-white" : "text-white/40 hover:text-white/70")}>
              {t === "swarms" ? `Active Swarms (${swarms.length})` : "Create Swarm"}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pb-24 px-4">
        {activeTab === "create" && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="pt-4 space-y-4">
            <div>
              <label className="text-[11px] text-white/50 mb-1.5 block">Swarm Name</label>
              <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="e.g. Code Review Swarm" className="w-full bg-[#161b22] border border-white/[0.06] rounded-xl py-3 px-4 text-[13px] placeholder:text-white/30 focus:outline-none focus:border-amber-500/50" />
            </div>
            <div>
              <label className="text-[11px] text-white/50 mb-2 block">Topology</label>
              <div className="space-y-2">
                {TOPOLOGIES.map(t => (
                  <button key={t.id} onClick={() => setNewTopology(t.id)}
                    className={cn("w-full p-3 rounded-xl border text-left transition-colors", newTopology === t.id ? "border-amber-400/40 bg-amber-500/10" : "border-white/[0.06] bg-[#161b22] hover:border-white/20")}>
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
            <button onClick={createSwarm} disabled={creating || !newName.trim()}
              className="w-full py-3 bg-amber-600/20 border border-amber-400/30 rounded-xl text-amber-300 text-[13px] font-medium flex items-center justify-center gap-2 hover:bg-amber-600/30 transition-colors disabled:opacity-50">
              {creating ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
              Initialize Swarm
            </button>
          </motion.div>
        )}

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
                  const info = topoInfo(swarm.topology);
                  const isCoord = coordinating === swarm.id;
                  const isSelected = selected?.id === swarm.id;
                  return (
                    <div key={swarm.id} className={cn("bg-[#161b22] border rounded-xl p-3 transition-all", isSelected ? "border-amber-400/30" : "border-white/[0.06]")}>
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
                          <button onClick={() => setSelected(isSelected ? null : swarm)}
                            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                            <Settings size={12} className="text-white/50" />
                          </button>
                          <button onClick={() => deleteSwarm(swarm.id)} className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 transition-colors">
                            <Trash2 size={12} className="text-red-400" />
                          </button>
                        </div>
                      </div>

                      <AnimatePresence>
                        {isSelected && (
                          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="mt-3 space-y-3">
                            <div className="grid grid-cols-3 gap-2">
                              {[
                                { label: "Max Agents", value: swarm.config?.maxAgents ?? 10 },
                                { label: "Consensus", value: `${((swarm.config?.consensusThreshold ?? 0.7) * 100).toFixed(0)}%` },
                                { label: "Learning", value: swarm.config?.learningRate ?? 0.01 },
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
                                  className="px-3 py-2 bg-blue-600/20 border border-blue-400/30 rounded-lg text-blue-300 text-[11px] flex items-center gap-1 disabled:opacity-50">
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
