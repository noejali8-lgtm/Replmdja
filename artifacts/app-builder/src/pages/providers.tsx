import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Cpu, Zap, Brain, Play, Send, Loader2,
  CheckCircle2, AlertCircle, RefreshCw, ChevronRight,
  BarChart3, Shield, Globe, Settings, Star
} from "lucide-react";
import { cn } from "@/lib/utils";

const BASE_URL = import.meta.env.BASE_URL?.replace(/\/$/, "") || "";

interface Provider {
  id: string; name: string; description: string; icon: string;
  models: string[]; defaultModel: string; type: string; status: string;
  capabilities: string[]; pricing: { input: number; output: number; unit: string };
}
interface RoutingStrategy {
  id: string; name: string; description: string; icon: string;
}

const STATUS_COLOR: Record<string, string> = {
  active: "text-green-400", "requires-key": "text-yellow-400",
  "requires-setup": "text-blue-400", beta: "text-purple-400",
};

export default function ProvidersPage() {
  const [, navigate] = useLocation();
  const [providers, setProviders] = useState<Provider[]>([]);
  const [strategies, setStrategies] = useState<RoutingStrategy[]>([]);
  const [selectedStrategy, setSelectedStrategy] = useState("smart");
  const [prompt, setPrompt] = useState("");
  const [task, setTask] = useState("");
  const [output, setOutput] = useState("");
  const [routing, setRouting] = useState(false);
  const [routingDecision, setRoutingDecision] = useState<{ provider: string; model: string; reason: string } | null>(null);
  const [benchmarking, setBenchmarking] = useState(false);
  const [benchResults, setBenchResults] = useState<Array<{ model: string; latencyMs: number; tokens: number; text: string; success: boolean }>>([]);
  const [tab, setTab] = useState<"route" | "providers" | "benchmark">("route");

  useEffect(() => {
    fetchProviders();
    fetchStrategies();
  }, []);

  async function fetchProviders() {
    try {
      const r = await fetch(`${BASE_URL}/api/providers`);
      const d = await r.json() as { providers: Provider[] };
      setProviders(d.providers ?? []);
    } catch { /* ignore */ }
  }

  async function fetchStrategies() {
    try {
      const r = await fetch(`${BASE_URL}/api/providers/strategies`);
      const d = await r.json() as { strategies: RoutingStrategy[] };
      setStrategies(d.strategies ?? []);
    } catch { /* ignore */ }
  }

  async function routePrompt() {
    if (!prompt.trim()) return;
    setRouting(true);
    setOutput("");
    setRoutingDecision(null);
    try {
      const r = await fetch(`${BASE_URL}/api/providers/route`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, strategy: selectedStrategy, task }),
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
            const ev = JSON.parse(line.slice(5)) as { type: string; content?: string; provider?: string; model?: string; reason?: string };
            if (ev.type === "routing_decision") setRoutingDecision({ provider: ev.provider!, model: ev.model!, reason: ev.reason! });
            else if (ev.type === "chunk" && ev.content) setOutput(p => p + ev.content);
          } catch { /* ignore */ }
        }
      }
    } catch { /* ignore */ }
    setRouting(false);
  }

  async function runBenchmark() {
    setBenchmarking(true);
    setBenchResults([]);
    try {
      const r = await fetch(`${BASE_URL}/api/providers/benchmark`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: prompt || "What is the capital of France? Answer in one word." }),
      });
      const d = await r.json() as { results: typeof benchResults };
      setBenchResults(d.results ?? []);
    } catch { /* ignore */ }
    setBenchmarking(false);
  }

  return (
    <div className="min-h-screen bg-[#0d1117] text-white flex flex-col">
      <div className="sticky top-0 z-20 bg-[#0d1117]/95 backdrop-blur border-b border-white/[0.08] px-4 pt-safe">
        <div className="flex items-center gap-3 py-3">
          <button onClick={() => navigate("/")} className="p-1.5 rounded-lg hover:bg-white/5 text-white/60 hover:text-white transition-colors">
            <ArrowLeft size={20} />
          </button>
          <Cpu size={18} className="text-cyan-400" />
          <span className="font-semibold flex-1">Multi-Provider Routing</span>
          <span className="text-[10px] font-mono bg-cyan-500/20 text-cyan-300 border border-cyan-400/20 px-2 py-0.5 rounded-full">{providers.length} PROVIDERS</span>
        </div>
        <div className="flex gap-1 pb-3">
          {(["route", "providers", "benchmark"] as const).map(t => (
            <button key={t} onClick={() => setTab(t)} className={cn("flex-1 py-1.5 rounded-lg text-[11px] font-medium capitalize transition-colors", tab === t ? "bg-white/10 text-white" : "text-white/40 hover:text-white/70")}>
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pb-24 px-4 pt-4 space-y-3">
        {tab === "route" && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
            <div>
              <label className="text-[11px] text-white/50 mb-2 block">Routing Strategy</label>
              <div className="grid grid-cols-2 gap-2">
                {strategies.map(s => (
                  <button key={s.id} onClick={() => setSelectedStrategy(s.id)}
                    className={cn("p-2.5 rounded-xl border text-left transition-colors", selectedStrategy === s.id ? "border-cyan-400/40 bg-cyan-500/10" : "border-white/[0.06] bg-[#161b22] hover:border-white/20")}>
                    <div className="flex items-center gap-2">
                      <span className="text-base">{s.icon}</span>
                      <div>
                        <div className="text-[11px] font-medium text-white">{s.name}</div>
                        <div className="text-[9px] text-white/40 mt-0.5 line-clamp-2">{s.description}</div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-[11px] text-white/50 mb-1.5 block">Task Hint (optional)</label>
              <input value={task} onChange={e => setTask(e.target.value)} placeholder="e.g. code review, analysis, fast response..." className="w-full bg-[#161b22] border border-white/[0.06] rounded-lg py-2 px-3 text-[12px] placeholder:text-white/30 focus:outline-none focus:border-cyan-500/50" />
            </div>
            <div>
              <label className="text-[11px] text-white/50 mb-1.5 block">Prompt</label>
              <textarea value={prompt} onChange={e => setPrompt(e.target.value)} placeholder="Enter your prompt..." rows={3} className="w-full bg-[#161b22] border border-white/[0.06] rounded-xl py-3 px-4 text-[13px] placeholder:text-white/30 focus:outline-none focus:border-cyan-500/50 resize-none" />
            </div>
            <button onClick={routePrompt} disabled={routing || !prompt.trim()}
              className="w-full py-3 bg-cyan-600/20 border border-cyan-400/30 rounded-xl text-cyan-300 text-[13px] font-medium flex items-center justify-center gap-2 hover:bg-cyan-600/30 transition-colors disabled:opacity-50">
              {routing ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
              Route & Execute
            </button>
            {routingDecision && (
              <div className="bg-cyan-500/10 border border-cyan-400/20 rounded-xl p-3">
                <div className="text-[11px] text-cyan-300 font-medium mb-1">🎯 Routing Decision</div>
                <div className="text-[11px] text-white/60">Provider: <span className="text-white">{routingDecision.provider}</span> · Model: <span className="text-cyan-300 font-mono">{routingDecision.model}</span></div>
                <p className="text-[11px] text-white/40 mt-1">{routingDecision.reason}</p>
              </div>
            )}
            {output && (
              <div className="bg-[#161b22] border border-white/[0.06] rounded-xl p-4">
                <div className="text-[11px] text-white/40 mb-2">Response</div>
                <p className="text-[13px] text-white/80 leading-relaxed">{output}</p>
              </div>
            )}
          </motion.div>
        )}

        {tab === "providers" && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
            {providers.map(p => (
              <div key={p.id} className="bg-[#161b22] border border-white/[0.06] rounded-xl p-3">
                <div className="flex items-start gap-3">
                  <span className="text-2xl shrink-0">{p.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[13px] font-medium">{p.name}</span>
                      <span className={cn("text-[10px] font-medium", STATUS_COLOR[p.status] ?? "text-white/40")}>
                        {p.status === "active" ? "● Active" : p.status === "requires-key" ? "◎ API Key" : p.status === "requires-setup" ? "◎ Setup" : "◎ Beta"}
                      </span>
                    </div>
                    <p className="text-[11px] text-white/40 mt-0.5">{p.description}</p>
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {p.capabilities.slice(0, 4).map(c => (
                        <span key={c} className="text-[9px] bg-white/5 border border-white/10 px-1.5 py-0.5 rounded text-white/50">{c}</span>
                      ))}
                    </div>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-[10px] text-white/30">Default: <span className="font-mono text-white/50">{p.defaultModel}</span></span>
                      {p.pricing.input > 0 && <span className="text-[10px] text-white/30">${p.pricing.input}/{p.pricing.unit}</span>}
                      {p.pricing.unit === "free" && <span className="text-[10px] text-green-400">Free</span>}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </motion.div>
        )}

        {tab === "benchmark" && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
            <div className="bg-[#161b22] border border-white/[0.06] rounded-xl p-4">
              <div className="text-[13px] font-medium mb-1">Model Benchmark</div>
              <p className="text-[11px] text-white/40">Compare response quality and latency across available models.</p>
            </div>
            <textarea value={prompt} onChange={e => setPrompt(e.target.value)} placeholder="Benchmark prompt (leave empty for default)" rows={2} className="w-full bg-[#161b22] border border-white/[0.06] rounded-xl py-3 px-4 text-[12px] placeholder:text-white/30 focus:outline-none focus:border-cyan-500/50 resize-none" />
            <button onClick={runBenchmark} disabled={benchmarking}
              className="w-full py-3 bg-cyan-600/20 border border-cyan-400/30 rounded-xl text-cyan-300 text-[13px] font-medium flex items-center justify-center gap-2 hover:bg-cyan-600/30 transition-colors disabled:opacity-50">
              {benchmarking ? <Loader2 size={14} className="animate-spin" /> : <BarChart3 size={14} />}
              Run Benchmark
            </button>
            {benchResults.length > 0 && (
              <div className="space-y-2">
                <div className="text-[11px] text-white/40">Results ({benchResults.length} models)</div>
                {benchResults.sort((a, b) => a.latencyMs - b.latencyMs).map((r, i) => (
                  <div key={r.model} className="bg-[#161b22] border border-white/[0.06] rounded-xl p-3">
                    <div className="flex items-center gap-2">
                      {i === 0 && <span className="text-[10px] bg-yellow-500/20 text-yellow-300 border border-yellow-400/20 px-1.5 py-0.5 rounded">🏆 Fastest</span>}
                      <span className="font-mono text-[11px] text-white/60 truncate flex-1">{r.model}</span>
                      <span className={cn("text-[11px] font-medium shrink-0", r.success ? "text-green-400" : "text-red-400")}>{r.latencyMs}ms</span>
                    </div>
                    {r.text && <p className="text-[11px] text-white/50 mt-1.5 line-clamp-2">{r.text}</p>}
                    <div className="text-[10px] text-white/30 mt-1">{r.tokens} tokens</div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}
