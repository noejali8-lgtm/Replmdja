import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "wouter";
import { ArrowLeft, Send, Users, Zap, RotateCcw } from "lucide-react";

const BASE = import.meta.env.BASE_URL?.replace(/\/$/, "") || "";

interface AgentInfo {
  id: string;
  name: string;
  emoji: string;
  role: string;
  color: string;
}

interface ChatMessage {
  agentId: string;
  agentName: string;
  emoji: string;
  role: string;
  color: string;
  content: string;
  streaming: boolean;
}

const SUGGESTED_TASKS = [
  "Build a real-time collaborative code editor",
  "Design a microservices auth system",
  "Create a mobile-first e-commerce checkout",
  "Implement a distributed job queue",
  "Build an AI-powered search feature",
];

export default function AgentChatPage() {
  const [, navigate] = useLocation();
  const [task, setTask] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [agents, setAgents] = useState<AgentInfo[]>([]);
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);
  const [currentAgent, setCurrentAgent] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function startChat(taskText: string) {
    if (!taskText.trim() || running) return;
    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();

    setMessages([]);
    setAgents([]);
    setDone(false);
    setRunning(true);
    setCurrentAgent(null);

    try {
      const res = await fetch(`${BASE}/api/multi-chat/stream`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ task: taskText.trim() }),
        signal: abortRef.current.signal,
      });

      if (!res.ok || !res.body) throw new Error("stream failed");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";

      while (true) {
        const { done: rdone, value } = await reader.read();
        if (rdone) break;
        buf += decoder.decode(value, { stream: true });
        const lines = buf.split("\n");
        buf = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          let evt: Record<string, unknown>;
          try { evt = JSON.parse(line.slice(6)); } catch { continue; }

          if (evt.type === "start") {
            setAgents((evt.agents as AgentInfo[]) ?? []);
          } else if (evt.type === "agent_start") {
            setCurrentAgent(evt.agentId as string);
            setMessages(prev => [
              ...prev,
              {
                agentId: evt.agentId as string,
                agentName: evt.agentName as string,
                emoji: evt.emoji as string,
                role: evt.role as string,
                color: evt.color as string,
                content: "",
                streaming: true,
              },
            ]);
          } else if (evt.type === "agent_token") {
            setMessages(prev =>
              prev.map(m =>
                m.agentId === (evt.agentId as string) && m.streaming
                  ? { ...m, content: m.content + (evt.token as string) }
                  : m,
              ),
            );
          } else if (evt.type === "agent_done") {
            setMessages(prev =>
              prev.map(m =>
                m.agentId === (evt.agentId as string) && m.streaming
                  ? { ...m, streaming: false }
                  : m,
              ),
            );
            setCurrentAgent(null);
          } else if (evt.type === "done") {
            setDone(true);
          }
        }
      }
    } catch (e: unknown) {
      if ((e as Error)?.name !== "AbortError") {
        setMessages(prev => [
          ...prev,
          { agentId: "err", agentName: "System", emoji: "⚠️", role: "Error", color: "#f78166", content: "Connection failed. Check API server.", streaming: false },
        ]);
      }
    } finally {
      setRunning(false);
      setCurrentAgent(null);
    }
  }

  function reset() {
    abortRef.current?.abort();
    setMessages([]);
    setAgents([]);
    setRunning(false);
    setDone(false);
    setCurrentAgent(null);
    setTask("");
  }

  const hasMessages = messages.length > 0;

  return (
    <div className="flex flex-col h-[100dvh] bg-[#0d1117] text-white overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-[#21262d] bg-[#161b22]">
        <button onClick={() => navigate("/agents")} className="p-1.5 rounded-lg hover:bg-[#21262d] transition-colors">
          <ArrowLeft size={18} className="text-[#8b949e]" />
        </button>
        <div className="flex items-center gap-2 flex-1">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-sm">
            <Users size={14} />
          </div>
          <div>
            <h1 className="text-sm font-semibold leading-none">Agent Chat Room</h1>
            <p className="text-xs text-[#8b949e] mt-0.5">5 specialists · real-time collaboration</p>
          </div>
        </div>
        {hasMessages && (
          <button onClick={reset} className="p-1.5 rounded-lg hover:bg-[#21262d] transition-colors text-[#8b949e]">
            <RotateCcw size={16} />
          </button>
        )}
      </div>

      {/* Agent roster */}
      {agents.length > 0 && (
        <div className="flex gap-2 px-4 py-2 border-b border-[#21262d] overflow-x-auto scrollbar-hide">
          {agents.map(a => (
            <div
              key={a.id}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium shrink-0 transition-all"
              style={{
                background: currentAgent === a.id ? `${a.color}22` : "#21262d",
                border: `1px solid ${currentAgent === a.id ? a.color : "transparent"}`,
                color: currentAgent === a.id ? a.color : "#8b949e",
              }}
            >
              <span>{a.emoji}</span>
              <span>{a.name}</span>
              {currentAgent === a.id && (
                <span className="flex gap-0.5 ml-1">
                  {[0, 0.15, 0.3].map(d => (
                    <motion.span
                      key={d}
                      className="w-1 h-1 rounded-full"
                      style={{ background: a.color }}
                      animate={{ opacity: [0.3, 1, 0.3] }}
                      transition={{ duration: 0.8, repeat: Infinity, delay: d }}
                    />
                  ))}
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Messages / Empty state */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {!hasMessages && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center h-full gap-6 pb-8"
          >
            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500/20 to-purple-600/20 border border-violet-500/20 flex items-center justify-center text-3xl mx-auto mb-4">
                💬
              </div>
              <h2 className="text-base font-semibold text-white mb-1">Multi-Agent Chat Room</h2>
              <p className="text-sm text-[#8b949e] max-w-xs text-center">
                Give a task and watch 5 AI specialists collaborate in real-time — each sharing their expert perspective.
              </p>
            </div>
            <div className="w-full space-y-2">
              <p className="text-xs text-[#8b949e] font-medium px-1">Suggested tasks</p>
              {SUGGESTED_TASKS.map(t => (
                <button
                  key={t}
                  onClick={() => { setTask(t); startChat(t); }}
                  className="w-full text-left px-3 py-2.5 rounded-xl bg-[#161b22] border border-[#21262d] hover:border-[#30363d] text-sm text-[#c9d1d9] transition-colors"
                >
                  {t}
                </button>
              ))}
            </div>
          </motion.div>
        )}

        <AnimatePresence>
          {messages.map((msg, i) => (
            <motion.div
              key={`${msg.agentId}-${i}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
              className="flex gap-3"
            >
              {/* Avatar */}
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center text-base shrink-0 mt-0.5"
                style={{ background: `${msg.color}18`, border: `1px solid ${msg.color}40` }}
              >
                {msg.emoji}
              </div>

              {/* Bubble */}
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-xs font-semibold" style={{ color: msg.color }}>
                    {msg.agentName}
                  </span>
                  <span className="text-[10px] text-[#8b949e]">{msg.role}</span>
                </div>
                <div
                  className="rounded-2xl rounded-tl-sm px-4 py-3 text-sm leading-relaxed text-[#e6edf3]"
                  style={{
                    background: `${msg.color}0d`,
                    border: `1px solid ${msg.color}25`,
                  }}
                >
                  {msg.content || (
                    <span className="flex gap-1 items-center text-[#8b949e]">
                      <Zap size={12} style={{ color: msg.color }} />
                      <span className="text-xs">thinking…</span>
                    </span>
                  )}
                  {msg.streaming && msg.content && (
                    <span
                      className="inline-block w-0.5 h-4 ml-0.5 rounded-full align-middle"
                      style={{ background: msg.color, animation: "blink 0.7s infinite" }}
                    />
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {done && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#161b22] border border-[#21262d] text-xs text-[#8b949e]"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            All agents responded · collaboration complete
          </motion.div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-4 py-3 border-t border-[#21262d] bg-[#161b22]">
        <div className="flex gap-2 items-end">
          <textarea
            value={task}
            onChange={e => setTask(e.target.value)}
            onKeyDown={e => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                startChat(task);
              }
            }}
            placeholder="Describe a task for the agents to collaborate on…"
            rows={1}
            disabled={running}
            className="flex-1 bg-[#0d1117] border border-[#30363d] rounded-xl px-3 py-2.5 text-sm text-[#e6edf3] placeholder-[#484f58] resize-none focus:outline-none focus:border-violet-500 disabled:opacity-50 transition-colors"
            style={{ minHeight: "40px", maxHeight: "120px" }}
          />
          <button
            onClick={() => startChat(task)}
            disabled={!task.trim() || running}
            className="w-9 h-9 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center transition-colors shrink-0"
          >
            {running ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              >
                <Zap size={16} />
              </motion.div>
            ) : (
              <Send size={16} />
            )}
          </button>
        </div>
        <p className="text-[10px] text-[#484f58] mt-1.5 px-1">
          Enter to send · Shift+Enter for new line
        </p>
      </div>

      <style>{`
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
        .scrollbar-hide::-webkit-scrollbar{display:none}
        .scrollbar-hide{-ms-overflow-style:none;scrollbar-width:none}
      `}</style>
    </div>
  );
}
