import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, ChevronLeft, Play, Square, Loader2, Swords,
  RefreshCw, Plus, Minus, Bot
} from "lucide-react";
import { cn } from "@/lib/utils";

const BASE_URL = import.meta.env.BASE_URL?.replace(/\/$/, "") || "";

const AGENT_PERSONAS = [
  { id: "coder", name: "Coder", icon: "💻", color: "text-blue-400", bg: "bg-blue-500/10 border-blue-400/20", bubble: "bg-blue-500/10 border-blue-400/25" },
  { id: "tester", name: "Tester", icon: "🧪", color: "text-yellow-400", bg: "bg-yellow-500/10 border-yellow-400/20", bubble: "bg-yellow-500/10 border-yellow-400/25" },
  { id: "security", name: "Security", icon: "🛡️", color: "text-red-400", bg: "bg-red-500/10 border-red-400/20", bubble: "bg-red-500/10 border-red-400/25" },
  { id: "architect", name: "Architect", icon: "🏗️", color: "text-indigo-400", bg: "bg-indigo-500/10 border-indigo-400/20", bubble: "bg-indigo-500/10 border-indigo-400/25" },
  { id: "performance", name: "Perf", icon: "⚡", color: "text-yellow-400", bg: "bg-yellow-500/10 border-yellow-400/20", bubble: "bg-yellow-500/10 border-yellow-400/25" },
  { id: "devops", name: "DevOps", icon: "🔄", color: "text-sky-400", bg: "bg-sky-500/10 border-sky-400/20", bubble: "bg-sky-500/10 border-sky-400/25" },
];

interface DebateTurn {
  agentId: string;
  agentName: string;
  icon: string;
  round: number;
  content: string;
  isStreaming: boolean;
}

interface AgentDebatePanelProps {
  onClose: () => void;
}

export function AgentDebatePanel({ onClose }: AgentDebatePanelProps) {
  const [topic, setTopic] = useState("");
  const [selectedAgents, setSelectedAgents] = useState<string[]>(["coder", "architect"]);
  const [rounds, setRounds] = useState(2);
  const [running, setRunning] = useState(false);
  const [turns, setTurns] = useState<DebateTurn[]>([]);
  const [done, setDone] = useState(false);
  const [phase, setPhase] = useState<"setup" | "debate">("setup");
  const abortRef = useRef<AbortController | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [turns]);

  function toggleAgent(id: string) {
    setSelectedAgents(prev => {
      if (prev.includes(id)) {
        if (prev.length <= 2) return prev;
        return prev.filter(a => a !== id);
      } else {
        if (prev.length >= 4) return prev;
        return [...prev, id];
      }
    });
  }

  async function startDebate() {
    if (!topic.trim() || selectedAgents.length < 2 || running) return;
    setTurns([]);
    setDone(false);
    setRunning(true);
    setPhase("debate");
    abortRef.current = new AbortController();

    try {
      const res = await fetch(`${BASE_URL}/api/agents/debate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: topic.trim(), agents: selectedAgents, rounds }),
        signal: abortRef.current.signal,
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const reader = res.body?.getReader();
      if (!reader) throw new Error("No stream");

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done: streamDone, value } = await reader.read();
        if (streamDone) break;
        buffer += decoder.decode(value, { stream: true });

        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data:")) continue;
          try {
            const ev = JSON.parse(line.slice(5)) as {
              type: string;
              round?: number;
              agentId?: string;
              agentName?: string;
              icon?: string;
              content?: string;
            };

            if (ev.type === "round_start" && ev.agentId && ev.agentName && ev.round != null) {
              setTurns(prev => [...prev, {
                agentId: ev.agentId!,
                agentName: ev.agentName!,
                icon: ev.icon ?? "🤖",
                round: ev.round!,
                content: "",
                isStreaming: true,
              }]);
            } else if (ev.type === "chunk" && ev.content) {
              setTurns(prev => {
                if (!prev.length) return prev;
                const next = [...prev];
                next[next.length - 1] = { ...next[next.length - 1], content: next[next.length - 1].content + ev.content };
                return next;
              });
            } else if (ev.type === "round_end") {
              setTurns(prev => {
                if (!prev.length) return prev;
                const next = [...prev];
                next[next.length - 1] = { ...next[next.length - 1], isStreaming: false };
                return next;
              });
            } else if (ev.type === "done") {
              setDone(true);
            }
          } catch { /* ignore */ }
        }
      }
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        console.error("Debate error:", err);
      }
    }

    setRunning(false);
    setDone(true);
  }

  function stopDebate() {
    abortRef.current?.abort();
    setRunning(false);
    setTurns(prev => prev.map(t => ({ ...t, isStreaming: false })));
  }

  function reset() {
    stopDebate();
    setTurns([]);
    setDone(false);
    setPhase("setup");
  }

  const personaMap = Object.fromEntries(AGENT_PERSONAS.map(p => [p.id, p]));

  return (
    <motion.div
      initial={{ y: "100%" }}
      animate={{ y: 0 }}
      exit={{ y: "100%" }}
      transition={{ type: "spring", stiffness: 350, damping: 36 }}
      className="absolute inset-0 z-50 flex flex-col bg-[#0d1117]"
    >
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-safe pt-10 pb-3 border-b border-white/[0.08] shrink-0">
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg hover:bg-white/5 text-white/50 hover:text-white transition-colors"
        >
          <ChevronLeft size={20} />
        </button>
        <div className="flex items-center gap-2 flex-1">
          <Swords size={16} className="text-purple-400" />
          <span className="font-semibold">Agent Debate</span>
          {running && (
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 1.2, repeat: Infinity }}
              className="w-2 h-2 rounded-full bg-purple-400 ml-1"
            />
          )}
        </div>
        {phase === "debate" && (
          <button
            onClick={reset}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/50 hover:text-white text-[11px] transition-colors"
          >
            <RefreshCw size={11} />
            Reset
          </button>
        )}
        <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/5 text-white/40">
          <X size={18} />
        </button>
      </div>

      {/* Setup Phase */}
      <AnimatePresence mode="wait">
        {phase === "setup" && (
          <motion.div
            key="setup"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="flex-1 overflow-y-auto px-4 py-4 space-y-5"
          >
            {/* Topic input */}
            <div>
              <label className="block text-[11px] font-semibold text-white/50 uppercase tracking-wider mb-2">Debate Topic</label>
              <textarea
                value={topic}
                onChange={e => setTopic(e.target.value)}
                placeholder="e.g. Should we use microservices or a monolith for this project?"
                rows={3}
                className="w-full bg-[#161b22] border border-white/[0.08] rounded-xl px-3 py-2.5 text-[13px] placeholder:text-white/25 focus:outline-none focus:border-purple-500/50 text-white resize-none"
              />
            </div>

            {/* Agent selection */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-[11px] font-semibold text-white/50 uppercase tracking-wider">Agents ({selectedAgents.length}/4)</label>
                <span className="text-[10px] text-white/30">Pick 2–4</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {AGENT_PERSONAS.map(agent => {
                  const selected = selectedAgents.includes(agent.id);
                  return (
                    <button
                      key={agent.id}
                      onClick={() => toggleAgent(agent.id)}
                      className={cn(
                        "flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all",
                        selected ? agent.bg : "bg-[#161b22] border-white/[0.06] opacity-50 hover:opacity-80"
                      )}
                    >
                      <span className="text-xl">{agent.icon}</span>
                      <span className={cn("text-[11px] font-medium", selected ? agent.color : "text-white/50")}>{agent.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Rounds */}
            <div>
              <label className="block text-[11px] font-semibold text-white/50 uppercase tracking-wider mb-2">Rounds</label>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setRounds(r => Math.max(1, r - 1))}
                  className="w-9 h-9 rounded-xl bg-[#161b22] border border-white/[0.08] flex items-center justify-center text-white/50 hover:text-white transition-colors"
                >
                  <Minus size={14} />
                </button>
                <div className="flex-1 text-center">
                  <span className="text-2xl font-bold">{rounds}</span>
                  <span className="text-[11px] text-white/40 ml-1">round{rounds !== 1 ? "s" : ""}</span>
                </div>
                <button
                  onClick={() => setRounds(r => Math.min(5, r + 1))}
                  className="w-9 h-9 rounded-xl bg-[#161b22] border border-white/[0.08] flex items-center justify-center text-white/50 hover:text-white transition-colors"
                >
                  <Plus size={14} />
                </button>
              </div>
              <p className="text-[10px] text-white/30 text-center mt-1.5">Each agent speaks once per round</p>
            </div>

            {/* Start button */}
            <button
              onClick={startDebate}
              disabled={!topic.trim() || selectedAgents.length < 2}
              className={cn(
                "w-full py-3.5 rounded-xl font-semibold text-[14px] flex items-center justify-center gap-2 transition-all",
                topic.trim() && selectedAgents.length >= 2
                  ? "bg-purple-600/30 border border-purple-400/40 text-purple-300 hover:bg-purple-600/40"
                  : "bg-white/5 border border-white/10 text-white/30 cursor-not-allowed"
              )}
            >
              <Swords size={16} />
              Start Debate
            </button>

            {/* Preview */}
            {selectedAgents.length >= 2 && (
              <div className="bg-[#161b22] border border-white/[0.06] rounded-xl p-3">
                <p className="text-[10px] text-white/40 mb-2">Debate order:</p>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {Array.from({ length: rounds }, (_, r) =>
                    selectedAgents.map(id => {
                      const p = personaMap[id];
                      return (
                        <span key={`${r}-${id}`} className={cn("text-[10px] px-2 py-0.5 rounded-full border", p?.bg ?? "bg-white/5 border-white/10")}>
                          {p?.icon} {p?.name}
                        </span>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* Debate Phase */}
        {phase === "debate" && (
          <motion.div
            key="debate"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex-1 overflow-y-auto px-3 py-3 space-y-3"
          >
            {/* Topic banner */}
            <div className="bg-purple-500/5 border border-purple-400/15 rounded-xl px-3 py-2.5">
              <p className="text-[10px] text-purple-300/60 font-medium uppercase tracking-wider mb-0.5">Debating</p>
              <p className="text-[13px] text-white/80 font-medium leading-snug">{topic}</p>
              <div className="flex items-center gap-2 mt-1.5">
                {selectedAgents.map(id => {
                  const p = personaMap[id];
                  return p ? (
                    <span key={id} className="text-[10px] text-white/40">{p.icon} {p.name}</span>
                  ) : null;
                })}
                <span className="text-[10px] text-white/25 ml-auto">{rounds} round{rounds !== 1 ? "s" : ""}</span>
              </div>
            </div>

            {/* Turns */}
            {turns.map((turn, i) => {
              const persona = personaMap[turn.agentId];
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn("flex gap-2.5", i % 2 === 1 && "flex-row-reverse")}
                >
                  {/* Avatar */}
                  <div className={cn(
                    "w-8 h-8 rounded-xl border flex items-center justify-center text-sm shrink-0 mt-1",
                    persona?.bg ?? "bg-white/5 border-white/10"
                  )}>
                    {turn.icon}
                  </div>
                  {/* Bubble */}
                  <div className={cn("flex-1 max-w-[78%]", i % 2 === 1 && "flex flex-col items-end")}>
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className={cn("text-[10px] font-semibold", persona?.color ?? "text-white/60")}>{turn.agentName}</span>
                      <span className="text-[9px] text-white/25">Round {turn.round}</span>
                    </div>
                    <div className={cn(
                      "px-3 py-2.5 rounded-2xl border text-[12px] leading-relaxed text-white/80",
                      persona?.bubble ?? "bg-white/5 border-white/10"
                    )}>
                      {turn.content || (
                        <span className="flex items-center gap-1.5 text-white/40">
                          <Loader2 size={10} className="animate-spin" />
                          thinking…
                        </span>
                      )}
                      {turn.isStreaming && turn.content && (
                        <motion.span
                          animate={{ opacity: [1, 0, 1] }}
                          transition={{ duration: 0.7, repeat: Infinity }}
                          className="inline-block w-0.5 h-3.5 bg-current ml-0.5 align-middle"
                        />
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}

            {/* Running indicator */}
            {running && turns.length === 0 && (
              <div className="flex items-center justify-center gap-2 py-8 text-white/30">
                <Loader2 size={16} className="animate-spin" />
                <span className="text-[13px]">Starting debate…</span>
              </div>
            )}

            {/* Done banner */}
            {done && !running && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-emerald-500/8 border border-emerald-400/20 rounded-xl px-3 py-2.5 text-center"
              >
                <p className="text-[12px] text-emerald-300 font-semibold">Debate concluded</p>
                <p className="text-[10px] text-white/40 mt-0.5">{turns.length} arguments across {rounds} round{rounds !== 1 ? "s" : ""}</p>
              </motion.div>
            )}

            <div ref={bottomRef} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom bar in debate phase */}
      {phase === "debate" && (
        <div className="shrink-0 px-4 py-3 border-t border-white/[0.07] bg-[#0d1117]">
          {running ? (
            <button
              onClick={stopDebate}
              className="w-full py-2.5 bg-red-500/10 border border-red-400/30 rounded-xl text-red-300 text-[13px] font-medium flex items-center justify-center gap-2 hover:bg-red-500/15 transition-colors"
            >
              <Square size={13} />
              Stop
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={reset}
                className="flex-1 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white/60 text-[13px] font-medium hover:bg-white/8 transition-colors"
              >
                New Debate
              </button>
              {done && (
                <button
                  onClick={startDebate}
                  className="flex-1 py-2.5 bg-purple-600/20 border border-purple-400/30 rounded-xl text-purple-300 text-[13px] font-medium flex items-center justify-center gap-2 hover:bg-purple-600/30 transition-colors"
                >
                  <RefreshCw size={12} />
                  Re-run
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}
