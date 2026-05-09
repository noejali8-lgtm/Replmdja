import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Settings, Play, Pause, RefreshCw, Activity,
  Clock, CheckCircle2, XCircle, Loader2, BarChart3, Zap,
  Shield, Database, Brain, Search, Code2, Network, TrendingUp
} from "lucide-react";
import { cn } from "@/lib/utils";

const BASE_URL = import.meta.env.BASE_URL?.replace(/\/$/, "") || "";

const TYPE_ICONS: Record<string, React.ElementType> = {
  security: Shield, performance: Zap, testing: Code2,
  documentation: Search, maintenance: Settings, memory: Database,
  monitoring: Activity, learning: Brain, federation: Network,
};
const TYPE_COLORS: Record<string, string> = {
  security: "text-red-400 bg-red-500/10", performance: "text-yellow-400 bg-yellow-500/10",
  testing: "text-blue-400 bg-blue-500/10", documentation: "text-purple-400 bg-purple-500/10",
  maintenance: "text-slate-400 bg-slate-500/10", memory: "text-violet-400 bg-violet-500/10",
  monitoring: "text-green-400 bg-green-500/10", learning: "text-emerald-400 bg-emerald-500/10",
  federation: "text-teal-400 bg-teal-500/10",
};

interface Worker {
  id: number; name: string; type: string; description: string; schedule: string;
  status: string; isEnabled: boolean; runCount: number; errorCount: number;
  avgDurationMs: number; lastRunAt: string | null; nextRunAt: string | null;
}
interface WorkerRun {
  id: number; workerId: number; status: string; output: Record<string, unknown> | null;
  error: string | null; durationMs: number | null; startedAt: string; completedAt: string | null;
}

export default function WorkersPage() {
  const [, navigate] = useLocation();
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [runs, setRuns] = useState<Record<number, WorkerRun[]>>({});
  const [loading, setLoading] = useState(false);
  const [triggering, setTriggering] = useState<number | null>(null);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [filter, setFilter] = useState<"all" | "enabled" | "disabled">("all");

  useEffect(() => { fetchWorkers(); }, []);

  async function fetchWorkers() {
    setLoading(true);
    try {
      const r = await fetch(`${BASE_URL}/api/workers`);
      const d = await r.json() as { workers: Worker[] };
      setWorkers(d.workers ?? []);
    } catch { /* ignore */ }
    setLoading(false);
  }

  async function fetchRuns(workerId: number) {
    try {
      const r = await fetch(`${BASE_URL}/api/workers/${workerId}/runs`);
      const d = await r.json() as { runs: WorkerRun[] };
      setRuns(prev => ({ ...prev, [workerId]: d.runs ?? [] }));
    } catch { /* ignore */ }
  }

  async function triggerWorker(id: number) {
    setTriggering(id);
    try {
      await fetch(`${BASE_URL}/api/workers/${id}/trigger`, { method: "POST" });
      await fetchWorkers();
      await fetchRuns(id);
    } catch { /* ignore */ }
    setTriggering(null);
  }

  async function toggleWorker(worker: Worker) {
    try {
      await fetch(`${BASE_URL}/api/workers/${worker.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isEnabled: !worker.isEnabled }),
      });
      setWorkers(ws => ws.map(w => w.id === worker.id ? { ...w, isEnabled: !w.isEnabled } : w));
    } catch { /* ignore */ }
  }

  function toggleExpand(id: number) {
    if (expanded === id) { setExpanded(null); return; }
    setExpanded(id);
    fetchRuns(id);
  }

  const filtered = workers.filter(w =>
    filter === "all" ? true : filter === "enabled" ? w.isEnabled : !w.isEnabled
  );
  const running = workers.filter(w => w.status === "running").length;
  const enabled = workers.filter(w => w.isEnabled).length;
  const totalRuns = workers.reduce((s, w) => s + w.runCount, 0);

  return (
    <div className="min-h-screen bg-[#0d1117] text-white flex flex-col">
      <div className="sticky top-0 z-20 bg-[#0d1117]/95 backdrop-blur border-b border-white/[0.08] px-4 pt-safe">
        <div className="flex items-center gap-3 py-3">
          <button onClick={() => navigate("/")} className="p-1.5 rounded-lg hover:bg-white/5 text-white/60 hover:text-white transition-colors">
            <ArrowLeft size={20} />
          </button>
          <Settings size={18} className="text-sky-400" />
          <span className="font-semibold flex-1">Background Workers</span>
          <span className="text-[10px] font-mono bg-sky-500/20 text-sky-300 border border-sky-400/20 px-2 py-0.5 rounded-full">12 WORKERS</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pb-24 px-4 pt-4 space-y-4">
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: "Total Workers", value: workers.length, color: "text-sky-300", icon: Settings },
            { label: "Enabled", value: enabled, color: "text-green-300", icon: CheckCircle2 },
            { label: "Total Runs", value: totalRuns, color: "text-purple-300", icon: TrendingUp },
          ].map(({ label, value, color, icon: Icon }) => (
            <div key={label} className="bg-[#161b22] border border-white/[0.06] rounded-xl p-3 text-center">
              <Icon size={16} className={cn("mx-auto mb-1", color)} />
              <div className={cn("text-xl font-bold", color)}>{value}</div>
              <div className="text-[9px] text-white/30">{label}</div>
            </div>
          ))}
        </div>

        <div className="flex gap-1.5">
          {(["all", "enabled", "disabled"] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)} className={cn("flex-1 py-1.5 rounded-lg text-[11px] font-medium capitalize transition-colors", filter === f ? "bg-white/10 text-white" : "text-white/40 hover:text-white/70")}>
              {f}
            </button>
          ))}
          <button onClick={fetchWorkers} className="p-1.5 rounded-lg hover:bg-white/5 text-white/40">
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          </button>
        </div>

        <div className="space-y-2">
          {filtered.map(worker => {
            const Icon = TYPE_ICONS[worker.type] ?? Settings;
            const colorClass = TYPE_COLORS[worker.type] ?? "text-white/60 bg-white/5";
            const isTriggering = triggering === worker.id;
            const isExpanded = expanded === worker.id;
            const workerRuns = runs[worker.id] ?? [];

            return (
              <div key={worker.id} className={cn("bg-[#161b22] border rounded-xl transition-all", isExpanded ? "border-sky-400/30" : "border-white/[0.06]")}>
                <div className="p-3">
                  <div className="flex items-start gap-3">
                    <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0", colorClass.split(" ")[1])}>
                      <Icon size={14} className={colorClass.split(" ")[0]} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[13px] font-medium">{worker.name}</span>
                        <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", worker.status === "running" ? "bg-green-400 animate-pulse" : worker.isEnabled ? "bg-sky-400/50" : "bg-white/10")} />
                        <span className="text-[9px] font-mono text-white/30 bg-white/5 px-1.5 py-0.5 rounded">{worker.schedule}</span>
                      </div>
                      <p className="text-[11px] text-white/40 mt-0.5">{worker.description}</p>
                      <div className="flex gap-3 mt-1.5">
                        <span className="text-[10px] text-white/30">Runs: {worker.runCount}</span>
                        {worker.errorCount > 0 && <span className="text-[10px] text-red-400">Errors: {worker.errorCount}</span>}
                        {worker.avgDurationMs > 0 && <span className="text-[10px] text-white/30">Avg: {worker.avgDurationMs.toFixed(0)}ms</span>}
                        {worker.lastRunAt && <span className="text-[10px] text-white/20">Last: {new Date(worker.lastRunAt).toLocaleTimeString()}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button onClick={() => toggleWorker(worker)}
                        className={cn("p-1.5 rounded-lg transition-colors", worker.isEnabled ? "bg-green-500/15 text-green-400 hover:bg-green-500/25" : "bg-white/5 text-white/30 hover:bg-white/10")}>
                        {worker.isEnabled ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                      </button>
                      <button onClick={() => triggerWorker(worker.id)} disabled={isTriggering || !worker.isEnabled}
                        className="p-1.5 rounded-lg bg-sky-500/15 text-sky-400 hover:bg-sky-500/25 transition-colors disabled:opacity-40">
                        {isTriggering ? <Loader2 size={12} className="animate-spin" /> : <Play size={12} />}
                      </button>
                      <button onClick={() => toggleExpand(worker.id)} className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-white/40">
                        <BarChart3 size={12} />
                      </button>
                    </div>
                  </div>
                </div>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="border-t border-white/[0.06] px-3 pb-3 pt-3">
                      <div className="text-[11px] text-white/40 mb-2">Recent Runs</div>
                      {workerRuns.length === 0 ? (
                        <p className="text-[11px] text-white/20 text-center py-3">No runs yet — trigger to start</p>
                      ) : (
                        <div className="space-y-1.5">
                          {workerRuns.slice(0, 5).map(run => (
                            <div key={run.id} className="bg-[#0d1117] rounded-lg p-2.5">
                              <div className="flex items-center gap-2">
                                <span className={cn("text-[10px] px-1.5 py-0.5 rounded font-medium", run.status === "completed" ? "bg-green-500/15 text-green-400" : "bg-red-500/15 text-red-400")}>{run.status}</span>
                                {run.durationMs && <span className="text-[10px] text-white/30">{run.durationMs}ms</span>}
                                <span className="text-[10px] text-white/20 ml-auto">{new Date(run.startedAt).toLocaleTimeString()}</span>
                              </div>
                              {run.output && (
                                <div className="mt-1.5 flex flex-wrap gap-2">
                                  {Object.entries(run.output).map(([k, v]) => (
                                    <span key={k} className="text-[9px] bg-white/5 px-1.5 py-0.5 rounded text-white/40">{k}: <span className="text-white/60">{String(v)}</span></span>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
