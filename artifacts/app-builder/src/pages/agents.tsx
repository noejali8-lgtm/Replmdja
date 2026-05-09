import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Search, Play, Square, Zap, Bot, Code2, Shield,
  BookOpen, Cpu, TestTube2, Settings, BarChart3, Brain, GitBranch,
  Network, Database, Layers, Sparkles, ChevronRight, Plus, X,
  Activity, Clock, CheckCircle2, AlertCircle, Loader2, Filter,
  Star, TrendingUp, Users, RefreshCw, Trash2, Terminal
} from "lucide-react";
import { cn } from "@/lib/utils";

const BASE_URL = import.meta.env.BASE_URL?.replace(/\/$/, "") || "";

const TYPE_ICONS: Record<string, React.ElementType> = {
  "code-quality": Code2, development: Code2, testing: TestTube2, security: Shield,
  documentation: BookOpen, architecture: Layers, "code-review": BookOpen, research: Brain,
  planning: BarChart3, performance: Zap, ml: Brain, coordination: Network,
  orchestration: Network, specs: BookOpen, sparc: Sparkles, swarm: Users,
  consensus: CheckCircle2, memory: Database, learning: Brain, workers: Settings,
  automation: Settings, github: GitBranch, devops: Settings, monitoring: Activity,
  neural: Brain, gamification: Star, meta: Bot, finance: BarChart3, mobile: Cpu,
  discovery: Search, quality: CheckCircle2, integration: Network,
};

const TYPE_COLORS: Record<string, string> = {
  "code-quality": "text-blue-400 bg-blue-500/10", development: "text-blue-400 bg-blue-500/10",
  testing: "text-yellow-400 bg-yellow-500/10", security: "text-red-400 bg-red-500/10",
  documentation: "text-purple-400 bg-purple-500/10", architecture: "text-indigo-400 bg-indigo-500/10",
  "code-review": "text-orange-400 bg-orange-500/10", research: "text-cyan-400 bg-cyan-500/10",
  planning: "text-green-400 bg-green-500/10", performance: "text-yellow-400 bg-yellow-500/10",
  ml: "text-pink-400 bg-pink-500/10", coordination: "text-teal-400 bg-teal-500/10",
  orchestration: "text-teal-400 bg-teal-500/10", swarm: "text-amber-400 bg-amber-500/10",
  memory: "text-violet-400 bg-violet-500/10", learning: "text-emerald-400 bg-emerald-500/10",
  automation: "text-slate-400 bg-slate-500/10", github: "text-gray-300 bg-gray-500/10",
  devops: "text-sky-400 bg-sky-500/10", monitoring: "text-lime-400 bg-lime-500/10",
  neural: "text-fuchsia-400 bg-fuchsia-500/10", meta: "text-orange-300 bg-orange-500/10",
};

interface CatalogAgent {
  name: string; type: string; description: string; capabilities: string[]; icon: string;
}
interface LiveAgent {
  id: number; name: string; type: string; description: string; status: string;
  capabilities: string[]; metrics: { tasksCompleted: number; successRate: number; avgResponseMs: number; tokensUsed: number; lastActive: string | null };
  createdAt: string;
}

type Tab = "dashboard" | "catalog" | "active";

export default function AgentsPage() {
  const [, navigate] = useLocation();
  const [tab, setTab] = useState<Tab>("dashboard");
  const [catalog, setCatalog] = useState<CatalogAgent[]>([]);
  const [liveAgents, setLiveAgents] = useState<LiveAgent[]>([]);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [spawning, setSpawning] = useState<string | null>(null);
  const [running, setRunning] = useState<number | null>(null);
  const [taskInput, setTaskInput] = useState("");
  const [selectedAgent, setSelectedAgent] = useState<LiveAgent | null>(null);
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);
  const outputRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchCatalog();
    fetchLiveAgents();
  }, []);

  useEffect(() => {
    if (outputRef.current) outputRef.current.scrollTop = outputRef.current.scrollHeight;
  }, [output]);

  async function fetchCatalog() {
    try {
      const r = await fetch(`${BASE_URL}/api/agents/catalog`);
      const d = await r.json() as { agents: CatalogAgent[] };
      setCatalog(d.agents ?? []);
    } catch { /* ignore */ }
  }

  async function fetchLiveAgents() {
    setLoading(true);
    try {
      const r = await fetch(`${BASE_URL}/api/agents`);
      const d = await r.json() as { agents: LiveAgent[] };
      setLiveAgents(d.agents ?? []);
    } catch { /* ignore */ }
    setLoading(false);
  }

  async function spawnAgent(agent: CatalogAgent) {
    setSpawning(agent.name);
    try {
      await fetch(`${BASE_URL}/api/agents`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: agent.name, type: agent.type, description: agent.description, capabilities: agent.capabilities }),
      });
      await fetchLiveAgents();
      setTab("active");
    } catch { /* ignore */ }
    setSpawning(null);
  }

  async function runAgent(agent: LiveAgent) {
    if (!taskInput.trim()) return;
    setRunning(agent.id);
    setOutput("");
    setSelectedAgent(agent);
    try {
      const r = await fetch(`${BASE_URL}/api/agents/${agent.id}/run`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ task: taskInput }),
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
            const ev = JSON.parse(line.slice(5)) as { type: string; content?: string };
            if (ev.type === "chunk" && ev.content) setOutput(p => p + ev.content);
          } catch { /* ignore */ }
        }
      }
      await fetchLiveAgents();
    } catch { /* ignore */ }
    setRunning(null);
  }

  async function deleteAgent(id: number) {
    await fetch(`${BASE_URL}/api/agents/${id}`, { method: "DELETE" });
    await fetchLiveAgents();
    if (selectedAgent?.id === id) setSelectedAgent(null);
  }

  const allTypes = ["all", ...new Set(catalog.map(a => a.type))];
  const filteredCatalog = catalog.filter(a =>
    (typeFilter === "all" || a.type === typeFilter) &&
    (!search || a.name.includes(search) || a.description.toLowerCase().includes(search.toLowerCase()))
  );
  const filteredLive = liveAgents.filter(a =>
    !search || a.name.includes(search) || a.description.toLowerCase().includes(search.toLowerCase())
  );

  const stats = {
    total: catalog.length, active: liveAgents.filter(a => a.status !== "idle").length,
    idle: liveAgents.filter(a => a.status === "idle").length,
    tasksTotal: liveAgents.reduce((s, a) => s + (a.metrics?.tasksCompleted ?? 0), 0),
  };

  return (
    <div className="min-h-screen bg-[#0d1117] text-white flex flex-col">
      <div className="sticky top-0 z-20 bg-[#0d1117]/95 backdrop-blur border-b border-white/[0.08] px-4 pt-safe">
        <div className="flex items-center gap-3 py-3">
          <button onClick={() => navigate("/")} className="p-1.5 rounded-lg hover:bg-white/5 text-white/60 hover:text-white transition-colors">
            <ArrowLeft size={20} />
          </button>
          <div className="flex items-center gap-2 flex-1">
            <Bot size={18} className="text-purple-400" />
            <span className="font-semibold">Agent System</span>
            <span className="ml-auto text-[10px] font-mono bg-purple-500/20 text-purple-300 border border-purple-400/20 px-2 py-0.5 rounded-full">{catalog.length}+ AGENTS</span>
          </div>
        </div>
        <div className="flex gap-1 pb-3">
          {(["dashboard", "catalog", "active"] as Tab[]).map(t => (
            <button key={t} onClick={() => setTab(t)} className={cn("flex-1 py-1.5 rounded-lg text-[12px] font-medium capitalize transition-colors", tab === t ? "bg-white/10 text-white" : "text-white/40 hover:text-white/70")}>
              {t} {t === "active" && liveAgents.length > 0 && <span className="ml-1 text-[10px] bg-green-500/30 text-green-300 px-1.5 rounded-full">{liveAgents.length}</span>}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pb-24 px-4">
        {tab === "dashboard" && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="pt-4 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Catalog Agents", value: stats.total, icon: Bot, color: "text-purple-400", bg: "bg-purple-500/10" },
                { label: "Active Now", value: stats.active, icon: Activity, color: "text-green-400", bg: "bg-green-500/10" },
                { label: "Idle", value: stats.idle, icon: Clock, color: "text-blue-400", bg: "bg-blue-500/10" },
                { label: "Tasks Done", value: stats.tasksTotal, icon: CheckCircle2, color: "text-yellow-400", bg: "bg-yellow-500/10" },
              ].map(({ label, value, icon: Icon, color, bg }) => (
                <div key={label} className="bg-[#161b22] border border-white/[0.06] rounded-xl p-4">
                  <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center mb-2", bg)}>
                    <Icon size={16} className={color} />
                  </div>
                  <div className="text-2xl font-bold">{value}</div>
                  <div className="text-[11px] text-white/40 mt-0.5">{label}</div>
                </div>
              ))}
            </div>

            <div className="bg-[#161b22] border border-white/[0.06] rounded-xl p-4">
              <h3 className="text-[13px] font-semibold mb-3 flex items-center gap-2"><Layers size={14} className="text-purple-400" /> Agent Categories</h3>
              <div className="space-y-2">
                {[
                  { type: "development", label: "Development", count: catalog.filter(a => a.type === "development").length, icon: Code2, color: "text-blue-400" },
                  { type: "testing", label: "Testing & QA", count: catalog.filter(a => a.type === "testing").length, icon: TestTube2, color: "text-yellow-400" },
                  { type: "security", label: "Security", count: catalog.filter(a => a.type === "security").length, icon: Shield, color: "text-red-400" },
                  { type: "swarm", label: "Swarm Coordination", count: catalog.filter(a => a.type === "swarm").length, icon: Network, color: "text-amber-400" },
                  { type: "learning", label: "Self-Learning", count: catalog.filter(a => a.type === "learning").length, icon: Brain, color: "text-emerald-400" },
                  { type: "memory", label: "Memory & Knowledge", count: catalog.filter(a => a.type === "memory").length, icon: Database, color: "text-violet-400" },
                ].map(({ type, label, count, icon: Icon, color }) => (
                  <button key={type} onClick={() => { setTypeFilter(type); setTab("catalog"); }}
                    className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors group">
                    <Icon size={14} className={color} />
                    <span className="text-[13px] flex-1 text-left">{label}</span>
                    <span className="text-[11px] text-white/40">{count} agents</span>
                    <ChevronRight size={12} className="text-white/20 group-hover:text-white/40" />
                  </button>
                ))}
              </div>
            </div>

            <button onClick={() => setTab("catalog")}
              className="w-full py-3 bg-purple-600/20 border border-purple-400/30 rounded-xl text-purple-300 text-[13px] font-medium flex items-center justify-center gap-2 hover:bg-purple-600/30 transition-colors">
              <Plus size={14} /> Spawn Agents from Catalog
            </button>
          </motion.div>
        )}

        {tab === "catalog" && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="pt-4 space-y-3">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search agents..." className="w-full bg-[#161b22] border border-white/[0.06] rounded-lg py-2 pl-9 pr-3 text-[13px] placeholder:text-white/30 focus:outline-none focus:border-purple-500/50" />
            </div>
            <div className="flex gap-1.5 flex-wrap">
              {allTypes.slice(0, 8).map(t => (
                <button key={t} onClick={() => setTypeFilter(t)} className={cn("px-2.5 py-1 rounded-full text-[10px] font-medium border transition-colors capitalize", typeFilter === t ? "bg-purple-600/30 border-purple-400/40 text-purple-300" : "bg-white/5 border-white/10 text-white/50 hover:text-white/80")}>
                  {t}
                </button>
              ))}
            </div>
            <div className="text-[11px] text-white/30">{filteredCatalog.length} agents</div>
            <div className="space-y-2">
              {filteredCatalog.map(agent => {
                const Icon = TYPE_ICONS[agent.type] ?? Bot;
                const colorClass = TYPE_COLORS[agent.type] ?? "text-white/60 bg-white/5";
                const isSpawning = spawning === agent.name;
                return (
                  <div key={agent.name} className="bg-[#161b22] border border-white/[0.06] rounded-xl p-3">
                    <div className="flex items-start gap-3">
                      <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-base", colorClass.split(" ")[1])}>
                        <span className="text-sm">{agent.icon}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-[13px] font-medium truncate">{agent.name}</span>
                          <span className={cn("text-[9px] font-medium px-1.5 py-0.5 rounded-full border shrink-0", colorClass)}>{agent.type}</span>
                        </div>
                        <p className="text-[11px] text-white/50 mt-0.5 line-clamp-2">{agent.description}</p>
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {agent.capabilities.slice(0, 3).map(c => (
                            <span key={c} className="text-[9px] bg-white/5 border border-white/10 px-1.5 py-0.5 rounded text-white/50">{c}</span>
                          ))}
                        </div>
                      </div>
                      <button onClick={() => spawnAgent(agent)} disabled={isSpawning}
                        className="shrink-0 px-2.5 py-1.5 bg-purple-600/20 border border-purple-400/30 rounded-lg text-purple-300 text-[11px] font-medium hover:bg-purple-600/30 transition-colors flex items-center gap-1 disabled:opacity-50">
                        {isSpawning ? <Loader2 size={10} className="animate-spin" /> : <Plus size={10} />}
                        Spawn
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {tab === "active" && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="pt-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[12px] text-white/50">{filteredLive.length} active agents</span>
              <button onClick={fetchLiveAgents} className="p-1.5 rounded-lg hover:bg-white/5 text-white/40 hover:text-white transition-colors">
                <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
              </button>
            </div>

            {filteredLive.length === 0 ? (
              <div className="text-center py-16">
                <Bot size={40} className="mx-auto text-white/10 mb-3" />
                <p className="text-white/30 text-[13px]">No active agents</p>
                <button onClick={() => setTab("catalog")} className="mt-3 px-4 py-2 bg-purple-600/20 border border-purple-400/30 rounded-lg text-purple-300 text-[12px]">
                  Spawn from Catalog
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredLive.map(agent => {
                  const colorClass = TYPE_COLORS[agent.type] ?? "text-white/60 bg-white/5";
                  const isRunning = running === agent.id;
                  return (
                    <div key={agent.id} className={cn("bg-[#161b22] border rounded-xl p-3 transition-all", selectedAgent?.id === agent.id ? "border-purple-400/40" : "border-white/[0.06]")}>
                      <div className="flex items-start gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-[13px] font-medium truncate">{agent.name}</span>
                            <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", agent.status === "running" ? "bg-green-400 animate-pulse" : agent.status === "idle" ? "bg-white/20" : "bg-yellow-400")} />
                            <span className={cn("text-[9px] ml-auto shrink-0 px-1.5 py-0.5 rounded-full border", colorClass)}>{agent.type}</span>
                          </div>
                          <div className="flex gap-3 mt-1.5">
                            <span className="text-[10px] text-white/40">✓ {agent.metrics?.tasksCompleted ?? 0} tasks</span>
                            {agent.metrics?.lastActive && <span className="text-[10px] text-white/30">Last: {new Date(agent.metrics.lastActive).toLocaleTimeString()}</span>}
                          </div>
                        </div>
                        <div className="flex gap-1.5 shrink-0">
                          <button onClick={() => { setSelectedAgent(selectedAgent?.id === agent.id ? null : agent); setOutput(""); }}
                            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                            <Terminal size={12} className="text-white/60" />
                          </button>
                          <button onClick={() => deleteAgent(agent.id)} className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 transition-colors">
                            <Trash2 size={12} className="text-red-400" />
                          </button>
                        </div>
                      </div>

                      <AnimatePresence>
                        {selectedAgent?.id === agent.id && (
                          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="mt-3 space-y-2">
                            <div className="flex gap-2">
                              <input value={taskInput} onChange={e => setTaskInput(e.target.value)} placeholder="Enter task for agent..." className="flex-1 bg-[#0d1117] border border-white/10 rounded-lg px-3 py-2 text-[12px] placeholder:text-white/30 focus:outline-none focus:border-purple-500/50" />
                              <button onClick={() => runAgent(agent)} disabled={isRunning || !taskInput.trim()}
                                className="px-3 py-2 bg-purple-600/30 border border-purple-400/40 rounded-lg text-purple-300 text-[11px] flex items-center gap-1 disabled:opacity-50 hover:bg-purple-600/40 transition-colors">
                                {isRunning ? <Loader2 size={12} className="animate-spin" /> : <Play size={12} />}
                                Run
                              </button>
                            </div>
                            {output && (
                              <div ref={outputRef} className="bg-[#0d1117] border border-white/[0.06] rounded-lg p-3 max-h-48 overflow-y-auto text-[11px] font-mono text-white/70 whitespace-pre-wrap">
                                {output}
                              </div>
                            )}
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
