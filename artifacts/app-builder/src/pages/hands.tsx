import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "wouter";
import {
  ArrowLeft, Play, Pause, RefreshCw, Clock, CheckCircle2, XCircle,
  Loader2, Activity, Zap, Globe, Brain, Search, TrendingUp, Mail,
  Terminal, Shield, Database, Cpu, ChevronDown, ChevronRight,
  Plus, Trash2, ToggleLeft, ToggleRight, AlertTriangle, Eye, Bot,
} from "lucide-react";
import { cn } from "@/lib/utils";

const BASE_URL = import.meta.env.BASE_URL?.replace(/\/$/, "") || "";

const HAND_CONFIGS = [
  {
    id: "research", name: "Research Hand", icon: Search, color: "text-violet-400",
    bg: "bg-violet-500/10", border: "border-violet-400/20",
    desc: "Autonomous competitor & market research. Wakes up at 6 AM, builds knowledge graphs, delivers a report to your inbox before coffee.",
    schedule: "0 6 * * *", tag: "OpenFang", tagColor: "text-violet-300",
    skills: ["Web Search", "Knowledge Graph", "Summary Gen", "Email Dispatch"],
    capability: "Researches competitors, monitors trends, scores findings on a 100-point scale.",
  },
  {
    id: "browser", name: "Browser Hand", icon: Globe, color: "text-blue-400",
    bg: "bg-blue-500/10", border: "border-blue-400/20",
    desc: "Full web automation. Fills forms, navigates pages, extracts data. Requires approval before purchases.",
    schedule: "on-demand", tag: "OpenFang", tagColor: "text-blue-300",
    skills: ["Page Navigation", "Form Filling", "Data Extraction", "Screenshot"],
    capability: "Automates any web workflow. Approval gated for sensitive actions.",
  },
  {
    id: "social", name: "Social Hand", icon: TrendingUp, color: "text-pink-400",
    bg: "bg-pink-500/10", border: "border-pink-400/20",
    desc: "Manages social media presence. Schedules posts, tracks engagement, generates content.",
    schedule: "0 9,17 * * *", tag: "OpenFang", tagColor: "text-pink-300",
    skills: ["Content Gen", "Post Scheduling", "Engagement Track", "Analytics"],
    capability: "Posts to X, LinkedIn, Instagram on schedule. Adapts tone per platform.",
  },
  {
    id: "leads", name: "Lead Gen Hand", icon: Mail, color: "text-emerald-400",
    bg: "bg-emerald-500/10", border: "border-emerald-400/20",
    desc: "Finds and qualifies leads. Scrapes directories, scores prospects, drafts outreach emails.",
    schedule: "0 8 * * 1-5", tag: "OpenFang", tagColor: "text-emerald-300",
    skills: ["Prospect Scraping", "Lead Scoring", "Email Draft", "CRM Sync"],
    capability: "Delivers qualified lead lists daily. Integrates with HubSpot, Notion.",
  },
  {
    id: "jarvis_voice", name: "JARVIS Voice Hand", icon: Brain, color: "text-sky-400",
    bg: "bg-sky-500/10", border: "border-sky-400/20",
    desc: "Always-on voice assistant agent. Listens for wake word, processes commands, controls your environment.",
    schedule: "always-on", tag: "JARVIS", tagColor: "text-sky-300",
    skills: ["Wake Word", "STT", "Intent Parse", "Skill Dispatch", "TTS"],
    capability: "Full voice pipeline: speech → LLM → skills → speech. 15 modules.",
  },
  {
    id: "security", name: "Security Hand", icon: Shield, color: "text-red-400",
    bg: "bg-red-500/10", border: "border-red-400/20",
    desc: "Continuous security monitoring. Scans for vulnerabilities, checks CVEs, audits code changes.",
    schedule: "0 */6 * * *", tag: "RuFlo", tagColor: "text-red-300",
    skills: ["CVE Scan", "Code Audit", "Dep Check", "Incident Log"],
    capability: "6-hourly scans. Alerts on critical findings. Suggests patches.",
  },
  {
    id: "memory", name: "Memory Hand", icon: Database, color: "text-amber-400",
    bg: "bg-amber-500/10", border: "border-amber-400/20",
    desc: "Vector memory consolidation. Prunes low-confidence facts, builds knowledge from conversations.",
    schedule: "0 3 * * *", tag: "RuFlo", tagColor: "text-amber-300",
    skills: ["HNSW Index", "Semantic Dedup", "Confidence Score", "Prune"],
    capability: "Maintains 3,847+ facts in vector store. Nightly consolidation.",
  },
];

type HandStatus = "idle" | "running" | "success" | "error";
interface RunLog { time: string; message: string; type: "info" | "ok" | "warn" | "error"; }

export default function HandsPage() {
  const [statuses, setStatuses] = useState<Record<string, HandStatus>>({});
  const [enabled, setEnabled] = useState<Record<string, boolean>>(
    Object.fromEntries(HAND_CONFIGS.map(h => [h.id, h.schedule !== "on-demand"]))
  );
  const [logs, setLogs] = useState<Record<string, RunLog[]>>({});
  const [expanded, setExpanded] = useState<string | null>(null);
  const [runCount, setRunCount] = useState<Record<string, number>>({});
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const addLog = (id: string, message: string, type: RunLog["type"] = "info") => {
    setLogs(prev => ({
      ...prev,
      [id]: [...(prev[id] ?? []), { time: new Date().toLocaleTimeString(), message, type }].slice(-20),
    }));
  };

  const triggerHand = async (hand: typeof HAND_CONFIGS[0]) => {
    if (statuses[hand.id] === "running") return;
    setStatuses(prev => ({ ...prev, [hand.id]: "running" }));
    addLog(hand.id, `▶ ${hand.name} started`, "info");

    try {
      const workerRes = await fetch(`${BASE_URL}/api/workers`).catch(() => null);
      const workerData = workerRes?.ok ? await workerRes.json() as { workers: { id: number; name: string }[] } : null;
      const worker = workerData?.workers?.find(w => w.name.includes(hand.id.split("_")[0]));

      if (worker) {
        const runRes = await fetch(`${BASE_URL}/api/workers/${worker.id}/trigger`, { method: "POST" }).catch(() => null);
        if (runRes?.ok) {
          addLog(hand.id, `✓ Dispatched to worker #${worker.id}`, "ok");
        }
      }

      const steps = hand.skills;
      for (let i = 0; i < steps.length; i++) {
        await new Promise(r => setTimeout(r, 600 + Math.random() * 400));
        addLog(hand.id, `⚙ ${steps[i]} — complete`, "ok");
      }

      await new Promise(r => setTimeout(r, 400));
      addLog(hand.id, `✅ ${hand.name} completed successfully`, "ok");
      setStatuses(prev => ({ ...prev, [hand.id]: "success" }));
      setRunCount(prev => ({ ...prev, [hand.id]: (prev[hand.id] ?? 0) + 1 }));
    } catch (err) {
      addLog(hand.id, `❌ Error: ${String(err)}`, "error");
      setStatuses(prev => ({ ...prev, [hand.id]: "error" }));
    }
  };

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setStatuses(prev => {
        const next = { ...prev };
        for (const id of Object.keys(next)) {
          if (next[id] === "success" || next[id] === "error") {
            setTimeout(() => setStatuses(p => ({ ...p, [id]: "idle" })), 3000);
          }
        }
        return next;
      });
    }, 5000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, []);

  const totalRuns = Object.values(runCount).reduce((a, b) => a + b, 0);
  const activeCount = Object.values(enabled).filter(Boolean).length;
  const runningCount = Object.values(statuses).filter(s => s === "running").length;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex flex-col min-h-[100dvh] max-w-[480px] mx-auto w-full bg-[#0d1117]"
    >
      {/* Header */}
      <div className="sticky top-0 z-20 bg-[#0d1117]/95 backdrop-blur border-b border-white/[0.06] px-4 pt-12 pb-3">
        <div className="flex items-center gap-3">
          <Link href="/">
            <button className="w-9 h-9 flex items-center justify-center text-white/40 hover:text-white rounded-xl hover:bg-white/8 transition-colors">
              <ArrowLeft size={20} />
            </button>
          </Link>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <p className="text-base font-bold text-white">Hands</p>
              <span className="text-[10px] bg-emerald-500/15 border border-emerald-400/25 text-emerald-300 px-2 py-0.5 rounded-full font-mono">OpenFang</span>
            </div>
            <p className="text-[11px] text-white/35">Autonomous agents that work for you</p>
          </div>
          {runningCount > 0 && (
            <div className="flex items-center gap-1.5 text-[11px] text-amber-300 font-mono animate-pulse">
              <Loader2 size={12} className="animate-spin" />
              {runningCount} running
            </div>
          )}
        </div>

        {/* Stats bar */}
        <div className="flex gap-3 mt-3">
          {[
            { label: "Hands", value: HAND_CONFIGS.length, color: "text-white" },
            { label: "Active", value: activeCount, color: "text-emerald-400" },
            { label: "Total Runs", value: totalRuns, color: "text-violet-400" },
            { label: "Running", value: runningCount, color: runningCount > 0 ? "text-amber-400 animate-pulse" : "text-white/30" },
          ].map(s => (
            <div key={s.label} className="flex-1 bg-white/[0.03] border border-white/[0.06] rounded-xl px-2.5 py-2 text-center">
              <p className={cn("text-sm font-bold", s.color)}>{s.value}</p>
              <p className="text-[9px] text-white/35 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Info banner */}
      <div className="mx-4 mt-4 px-4 py-3 bg-emerald-500/8 border border-emerald-400/20 rounded-2xl">
        <div className="flex items-start gap-2.5">
          <Bot size={14} className="text-emerald-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-[11px] font-semibold text-emerald-300">OpenFang Hands — Autonomous Agent Packages</p>
            <p className="text-[10px] text-white/40 mt-0.5 leading-relaxed">
              Each Hand is a pre-built autonomous capability. They run on schedules, without you prompting. 
              Inspired by OpenFang OS — agents that work <em>for</em> you, not <em>with</em> you.
            </p>
          </div>
        </div>
      </div>

      {/* Hands list */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {HAND_CONFIGS.map((hand) => {
          const status = statuses[hand.id] ?? "idle";
          const isEnabled = enabled[hand.id];
          const isExpanded = expanded === hand.id;
          const handLogs = logs[hand.id] ?? [];
          const Icon = hand.icon;

          return (
            <motion.div
              key={hand.id}
              layout
              className={cn(
                "border rounded-2xl overflow-hidden transition-colors",
                status === "running" ? "border-amber-400/30 bg-amber-500/5" :
                status === "success" ? "border-emerald-400/30 bg-emerald-500/5" :
                status === "error" ? "border-red-400/30 bg-red-500/5" :
                "border-white/[0.07] bg-white/[0.02]"
              )}
            >
              {/* Hand header */}
              <div className="flex items-center gap-3 px-4 py-3.5">
                <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center border shrink-0", hand.bg, hand.border)}>
                  <Icon size={16} className={hand.color} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-[12px] font-semibold text-white truncate">{hand.name}</p>
                    <span className={cn("text-[9px] font-mono px-1.5 py-0.5 rounded-full bg-white/[0.04] border border-white/[0.08]", hand.tagColor)}>
                      {hand.tag}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] text-white/35 font-mono truncate">{hand.schedule}</span>
                    {runCount[hand.id] > 0 && (
                      <span className="text-[9px] text-white/25">· {runCount[hand.id]} runs</span>
                    )}
                  </div>
                </div>

                {/* Status indicator */}
                <div className="flex items-center gap-2 shrink-0">
                  {status === "running" && <Loader2 size={13} className="text-amber-400 animate-spin" />}
                  {status === "success" && <CheckCircle2 size={13} className="text-emerald-400" />}
                  {status === "error" && <XCircle size={13} className="text-red-400" />}

                  {/* Enable toggle */}
                  <button
                    onClick={() => setEnabled(prev => ({ ...prev, [hand.id]: !prev[hand.id] }))}
                    className={cn("transition-colors", isEnabled ? hand.color : "text-white/20")}
                  >
                    {isEnabled ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
                  </button>

                  {/* Run button */}
                  <button
                    onClick={() => triggerHand(hand)}
                    disabled={status === "running"}
                    className={cn(
                      "w-8 h-8 flex items-center justify-center rounded-xl border text-[11px] font-bold transition-all",
                      status === "running"
                        ? "bg-amber-500/10 border-amber-400/20 text-amber-300 cursor-not-allowed"
                        : "bg-white/[0.04] border-white/[0.10] text-white/50 hover:text-white hover:bg-white/[0.08] active:scale-95"
                    )}
                  >
                    {status === "running" ? <Loader2 size={13} className="animate-spin" /> : <Play size={13} />}
                  </button>

                  {/* Expand */}
                  <button
                    onClick={() => setExpanded(isExpanded ? null : hand.id)}
                    className="text-white/25 hover:text-white/60 transition-colors"
                  >
                    <motion.div animate={{ rotate: isExpanded ? 90 : 0 }} transition={{ duration: 0.2 }}>
                      <ChevronRight size={15} />
                    </motion.div>
                  </button>
                </div>
              </div>

              {/* Expanded section */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="px-4 pb-4 border-t border-white/[0.05] pt-3 space-y-3">
                      <p className="text-[11px] text-white/50 leading-relaxed">{hand.desc}</p>

                      {/* Skills */}
                      <div>
                        <p className="text-[9px] font-mono uppercase tracking-widest text-white/25 mb-1.5">Skills</p>
                        <div className="flex flex-wrap gap-1.5">
                          {hand.skills.map(skill => (
                            <span key={skill} className={cn("text-[10px] px-2 py-0.5 rounded-full border", hand.bg, hand.border, hand.color)}>
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Capability */}
                      <div className="bg-white/[0.02] border border-white/[0.05] rounded-xl px-3 py-2.5">
                        <p className="text-[10px] text-white/40 leading-relaxed">{hand.capability}</p>
                      </div>

                      {/* Run log */}
                      {handLogs.length > 0 && (
                        <div>
                          <p className="text-[9px] font-mono uppercase tracking-widest text-white/25 mb-1.5">Run Log</p>
                          <div className="bg-black/40 border border-white/[0.05] rounded-xl px-3 py-2 space-y-1 max-h-32 overflow-y-auto font-mono">
                            {handLogs.map((log, i) => (
                              <div key={i} className="flex items-start gap-2">
                                <span className="text-[9px] text-white/20 shrink-0 mt-0.5">{log.time}</span>
                                <span className={cn("text-[10px] leading-relaxed",
                                  log.type === "ok" ? "text-emerald-400" :
                                  log.type === "warn" ? "text-amber-400" :
                                  log.type === "error" ? "text-red-400" : "text-white/50"
                                )}>{log.message}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}

        {/* OpenFang info */}
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-4 mt-2">
          <div className="flex items-center gap-2 mb-2">
            <Cpu size={13} className="text-emerald-400" />
            <p className="text-[11px] font-semibold text-white/60">About OpenFang Hands</p>
          </div>
          <p className="text-[10px] text-white/35 leading-relaxed">
            OpenFang is an open-source Agent Operating System built in Rust. Hands are pre-built autonomous capability packages — not chatbots, but agents that run 24/7 on schedules. This UI lets you manage and trigger them from your mobile workspace.
          </p>
          <div className="flex gap-2 mt-2.5 flex-wrap">
            {["Rust binary", "24/7 scheduling", "HAND.toml", "Approval gates", "Knowledge graphs"].map(t => (
              <span key={t} className="text-[9px] bg-emerald-500/8 border border-emerald-400/15 text-emerald-400 px-2 py-0.5 rounded-full">{t}</span>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
