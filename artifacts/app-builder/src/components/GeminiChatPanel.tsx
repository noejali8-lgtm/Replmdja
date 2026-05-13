/* ==========================================================================
   GEMINI CHAT PANEL — Antigravity Agent (OpenGravity)
   Features:
   - Voice Input via Web Speech API (microphone button)
   - Debate Mode: 3-phase self-refinement (Answer → Critique → Synthesis)
   - Agent Mode: full agentic loop with tool use
   - Chat Mode: simple Q&A with thinking blocks
   - Thinking timer (OpenGravity pattern)
   - VSCode-style command blocks
   ========================================================================== */

import { useState, useRef, useEffect, useCallback, type ReactElement } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send, Square, Brain, Terminal, FileCode2,
  FolderOpen, Search, ChevronDown, ChevronUp,
  Key, AlertCircle, Check, Loader2,
  Globe, Trash2, Copy, Zap, Clock, Mic, MicOff,
  Swords, History, Plus, X, MessageSquare
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getBYOKKey, hasBYOKKey, BYOKBadge } from "./BYOKPanel";

/* ── Web Speech API type stubs (not in all TS DOM libs) ── */
interface ISpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  onresult: ((ev: ISpeechRecognitionEvent) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
}
interface ISpeechRecognitionEvent {
  resultIndex: number;
  results: ISpeechRecognitionResultList;
}
interface ISpeechRecognitionResultList {
  length: number;
  [index: number]: ISpeechRecognitionResult;
}
interface ISpeechRecognitionResult {
  isFinal: boolean;
  [index: number]: ISpeechRecognitionAlternative;
}
interface ISpeechRecognitionAlternative { transcript: string; }
type SpeechRecognitionCtor = new () => ISpeechRecognition;

/* ══════════════════════════════════════════════════════════════
   TYPES
══════════════════════════════════════════════════════════════ */
type AppMode = "agent" | "chat" | "debate";

/* ══════════════════════════════════════════════════════════════
   HISTORY PERSISTENCE
   Sessions stored in localStorage — max 20, newest first
══════════════════════════════════════════════════════════════ */
interface HistorySession {
  id: string;
  title: string;
  mode: AppMode;
  model: string;
  turns: number;
  createdAt: number;
  updatedAt: number;
  messages: Message[];
}

const HISTORY_LS_KEY = "antigravity_history_v1";
const MAX_HISTORY     = 20;

function useGeminiHistory() {
  const load = (): HistorySession[] => {
    try { return JSON.parse(localStorage.getItem(HISTORY_LS_KEY) ?? "[]") as HistorySession[]; }
    catch { return []; }
  };

  const save = (sessions: HistorySession[]) => {
    try { localStorage.setItem(HISTORY_LS_KEY, JSON.stringify(sessions)); } catch { /* quota */ }
  };

  const upsert = (session: HistorySession) => {
    const all = load();
    const idx = all.findIndex(s => s.id === session.id);
    if (idx !== -1) all[idx] = session;
    else { all.unshift(session); if (all.length > MAX_HISTORY) all.splice(MAX_HISTORY); }
    save(all);
  };

  const remove = (id: string) => save(load().filter(s => s.id !== id));
  const clearAll = () => localStorage.removeItem(HISTORY_LS_KEY);

  return { load, upsert, remove, clearAll };
}

function sessionTitle(messages: Message[]): string {
  const first = messages.find(m => m.role === "user");
  const text  = (first?.blocks[0] as TextBlock | undefined)?.content ?? "New conversation";
  return text.length > 55 ? text.slice(0, 52) + "…" : text;
}

function newSessionId() { return `s-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`; }

const MODE_ICON: Record<AppMode, string> = { agent: "🤖", chat: "💬", debate: "⚔️" };

interface ThinkingBlock {
  type: "thought";
  content: string;
  elapsedSec: number;
  expanded: boolean;
  round?: number;
}

interface ToolCallBlock {
  type: "tool_call";
  tool: string;
  label: string;
  output?: string;
  done: boolean;
}

interface TextBlock {
  type: "text";
  content: string;
  round?: number;
}

interface RoundBlock {
  type: "round_marker";
  round: number;
  label: string;
  icon: string;
  done: boolean;
}

interface ErrorBlock {
  type: "error";
  content: string;
}

type MessageBlock = ThinkingBlock | ToolCallBlock | TextBlock | RoundBlock | ErrorBlock;

interface Message {
  id: string;
  role: "user" | "assistant";
  blocks: MessageBlock[];
  model?: string;
  mode?: AppMode;
}

/* ══════════════════════════════════════════════════════════════
   GEMINI MODELS
══════════════════════════════════════════════════════════════ */
const GEMINI_MODELS = [
  { id: "gemini-3.1-pro-preview",       name: "Gemini 3.1 Pro",        badge: "Default",  color: "text-blue-400",    badgeBg: "bg-blue-500/15 text-blue-300 border-blue-400/25" },
  { id: "gemini-3-flash-preview",       name: "Gemini 3 Flash",        badge: "New",      color: "text-cyan-400",    badgeBg: "bg-cyan-500/15 text-cyan-300 border-cyan-400/25" },
  { id: "gemini-3.1-flash-lite",        name: "Gemini 3.1 Flash Lite", badge: "Lite",     color: "text-sky-400",     badgeBg: "bg-sky-500/15 text-sky-300 border-sky-400/25" },
  { id: "gemini-2.5-pro-preview",       name: "Gemini 2.5 Pro",        badge: "Pro",      color: "text-indigo-400",  badgeBg: "bg-indigo-500/15 text-indigo-300 border-indigo-400/25" },
  { id: "gemini-2.5-flash-preview",     name: "Gemini 2.5 Flash",      badge: "Fast",     color: "text-violet-400",  badgeBg: "bg-violet-500/15 text-violet-300 border-violet-400/25" },
  { id: "gemini-2.5-flash-lite-preview",name: "Gemini 2.5 Flash Lite", badge: "Lite",     color: "text-purple-400",  badgeBg: "bg-purple-500/15 text-purple-300 border-purple-400/25" },
  { id: "gemini-2.0-flash-exp",         name: "Gemini 2.0 Flash",      badge: "Stable",   color: "text-teal-400",    badgeBg: "bg-teal-500/15 text-teal-300 border-teal-400/25" },
  { id: "gemini-2.0-pro-exp",           name: "Gemini 2.0 Pro",        badge: "Exp",      color: "text-emerald-400", badgeBg: "bg-emerald-500/15 text-emerald-300 border-emerald-400/25" },
  { id: "gemini-1.5-pro",               name: "Gemini 1.5 Pro",        badge: "2M ctx",   color: "text-green-400",   badgeBg: "bg-green-500/15 text-green-300 border-green-400/25" },
  { id: "gemini-1.5-flash",             name: "Gemini 1.5 Flash",      badge: "1M ctx",   color: "text-lime-400",    badgeBg: "bg-lime-500/15 text-lime-300 border-lime-400/25" },
];

/* ══════════════════════════════════════════════════════════════
   WEB SPEECH API HOOK
   Uses browser's built-in SpeechRecognition for voice input
══════════════════════════════════════════════════════════════ */
function useVoiceInput(onResult: (text: string) => void) {
  const [listening, setListening] = useState(false);
  const [supported, setSupported] = useState(false);
  const recognitionRef = useRef<ISpeechRecognition | null>(null);

  useEffect(() => {
    const win = window as unknown as Record<string, unknown>;
    const Ctor = (win["SpeechRecognition"] ?? win["webkitSpeechRecognition"]) as SpeechRecognitionCtor | undefined;
    if (Ctor) {
      setSupported(true);
      const rec = new Ctor();
      rec.continuous = false;
      rec.interimResults = true;
      rec.lang = "en-US";

      rec.onresult = (ev: ISpeechRecognitionEvent) => {
        let interim = "";
        let final = "";
        for (let i = ev.resultIndex; i < ev.results.length; i++) {
          const t = ev.results[i][0].transcript;
          if (ev.results[i].isFinal) final += t;
          else interim += t;
        }
        onResult(final || interim);
      };

      rec.onend = () => setListening(false);
      rec.onerror = () => setListening(false);
      recognitionRef.current = rec;
    }
  }, [onResult]);

  const toggle = useCallback(() => {
    const rec = recognitionRef.current;
    if (!rec) return;
    if (listening) {
      rec.stop();
      setListening(false);
    } else {
      rec.start();
      setListening(true);
    }
  }, [listening]);

  return { listening, supported, toggle };
}

/* ══════════════════════════════════════════════════════════════
   TOOL HELPERS
══════════════════════════════════════════════════════════════ */
function getToolIcon(tool: string) {
  const cls = "shrink-0";
  switch (tool) {
    case "run_command":
    case "execute_command":    return <Terminal size={11} className={cls} />;
    case "send_terminal_input":return <Terminal size={11} className={cn(cls, "text-amber-400")} />;
    case "wait":               return <Clock size={11} className={cn(cls, "text-yellow-400/70")} />;
    case "write_file":         return <FileCode2 size={11} className={cn(cls, "text-blue-400")} />;
    case "read_file":          return <FolderOpen size={11} className={cn(cls, "text-cyan-400")} />;
    case "list_files":         return <FolderOpen size={11} className={cn(cls, "text-teal-400")} />;
    case "search_files":       return <Search size={11} className={cn(cls, "text-purple-400")} />;
    case "fetch_url":          return <Globe size={11} className={cn(cls, "text-orange-400")} />;
    default:                   return <Zap size={11} className={cls} />;
  }
}

function getToolVerb(tool: string): string {
  switch (tool) {
    case "run_command":
    case "execute_command":    return "Ran background command";
    case "send_terminal_input":return "Sent terminal input";
    case "wait":               return "Waited";
    case "write_file":         return "Edited file";
    case "read_file":          return "Analyzed file";
    case "list_files":         return "Scanned workspace";
    case "search_files":       return "Searched files";
    case "fetch_url":          return "Fetched URL";
    case "delete_file":        return "Deleted file";
    case "move_file":          return "Moved file";
    default:                   return tool.replace(/_/g, " ");
  }
}

/* ══════════════════════════════════════════════════════════════
   ROUND MARKER — Debate Mode phase header
══════════════════════════════════════════════════════════════ */
const ROUND_COLORS: Record<number, { bg: string; border: string; text: string; dot: string }> = {
  1: { bg: "bg-amber-500/6",   border: "border-amber-400/20",  text: "text-amber-300/80",  dot: "bg-amber-400" },
  2: { bg: "bg-red-500/6",     border: "border-red-400/20",    text: "text-red-300/80",    dot: "bg-red-400" },
  3: { bg: "bg-emerald-500/6", border: "border-emerald-400/20",text: "text-emerald-300/80",dot: "bg-emerald-400" },
};

function RoundMarkerView({ block }: { block: RoundBlock }) {
  const c = ROUND_COLORS[block.round] ?? ROUND_COLORS[1];
  return (
    <div className={cn(
      "flex items-center gap-2.5 px-3 py-2 rounded-lg border mb-3 mt-4",
      c.bg, c.border
    )}>
      <span className="text-[13px]">{block.icon}</span>
      <div className="flex-1">
        <div className={cn("text-[11.5px] font-semibold", c.text)}>
          Phase {block.round} — {block.label}
        </div>
      </div>
      <div className="flex items-center gap-1.5">
        {!block.done ? (
          <Loader2 size={10} className="text-white/25 animate-spin" />
        ) : (
          <div className={cn("w-1.5 h-1.5 rounded-full", c.dot)} />
        )}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   THINKING BLOCK
══════════════════════════════════════════════════════════════ */
function ThinkingBlockView({ block, onToggle }: { block: ThinkingBlock; onToggle: () => void }) {
  return (
    <motion.div initial={{ opacity: 0, y: -2 }} animate={{ opacity: 1, y: 0 }} className="mb-2.5">
      <button
        onClick={onToggle}
        className="flex items-center gap-2 text-[11px] text-white/35 hover:text-white/55 transition-colors group"
      >
        <div className="w-4 h-4 rounded border border-purple-400/30 bg-purple-500/8 flex items-center justify-center">
          <Brain size={8} className="text-purple-400" />
        </div>
        <span className="font-medium">Thought</span>
        {block.elapsedSec > 0 && (
          <>
            <span className="text-white/15">·</span>
            <span className="text-white/20">{block.elapsedSec}s</span>
          </>
        )}
        <span className="ml-0.5 text-white/15 group-hover:text-white/35 transition-colors">
          {block.expanded ? <ChevronUp size={9} /> : <ChevronDown size={9} />}
        </span>
      </button>
      <AnimatePresence>
        {block.expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.16 }}
            className="overflow-hidden"
          >
            <div className="mt-1.5 ml-5 pl-3 border-l-2 border-purple-400/12 py-1">
              <p className="text-[11px] text-white/22 font-mono leading-relaxed whitespace-pre-wrap max-h-48 overflow-y-auto">
                {block.content}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* ══════════════════════════════════════════════════════════════
   TOOL CALL BLOCK — VSCode-style (OpenGravity renderAICommandBlock)
══════════════════════════════════════════════════════════════ */
function ToolCallBlockView({ block }: { block: ToolCallBlock }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <motion.div
      initial={{ opacity: 0, y: 2 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-2 rounded-lg overflow-hidden border border-white/[0.06] bg-[#0d0d0d]"
    >
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-white/[0.04]">
        <div className="flex items-center gap-1.5 text-[11px] text-white/30">
          {getToolIcon(block.tool)}
          <span>{getToolVerb(block.tool)}</span>
        </div>
        <div className="flex items-center gap-2">
          {!block.done ? (
            <Loader2 size={9} className="text-white/20 animate-spin" />
          ) : (
            <span className="text-[9.5px] text-green-400/60">Exit code 0</span>
          )}
          {block.output && (
            <button
              onClick={() => setExpanded(e => !e)}
              className="text-[9.5px] text-white/20 hover:text-white/45 transition-colors flex items-center gap-0.5"
            >
              {expanded ? <ChevronUp size={8} /> : <ChevronDown size={8} />}
            </button>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 px-3 py-2 font-mono">
        <span className="text-[11.5px] text-white/55 truncate flex-1">{block.label}</span>
        <button
          onClick={() => navigator.clipboard.writeText(block.label)}
          className="text-white/15 hover:text-white/40 transition-colors shrink-0"
          title="Copy"
        >
          <Copy size={9} />
        </button>
      </div>

      <AnimatePresence>
        {expanded && block.output && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: "auto" }}
            exit={{ height: 0 }}
            className="overflow-hidden"
          >
            <div className="border-t border-white/[0.04] px-3 py-2">
              <pre className="text-[10.5px] text-white/30 font-mono leading-relaxed whitespace-pre-wrap max-h-36 overflow-y-auto">
                {block.output}
              </pre>
            </div>
            <div className="flex items-center justify-between px-3 py-1.5 border-t border-white/[0.03] text-[9.5px] text-white/15">
              <span>Always run</span>
              <span className={block.done ? "text-green-400/50" : "text-white/20"}>
                {block.done ? "✓ complete" : "running..."}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* ══════════════════════════════════════════════════════════════
   THINKING INDICATOR — animated dots with live timer
   Mirrors OpenGravity's thinkingTimerId setInterval pattern
══════════════════════════════════════════════════════════════ */
function ThinkingIndicator({ startTime }: { startTime: number }) {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setElapsed(Math.floor((Date.now() - startTime) / 1000)), 500);
    return () => clearInterval(id);
  }, [startTime]);
  return (
    <div className="flex items-center gap-2 mb-3 text-[11.5px] text-white/28">
      <div className="flex gap-0.5 items-center">
        {[0, 1, 2].map(i => (
          <motion.div
            key={i}
            className="w-1 h-1 rounded-full bg-blue-400/50"
            animate={{ opacity: [0.25, 1, 0.25] }}
            transition={{ duration: 1.3, delay: i * 0.22, repeat: Infinity }}
          />
        ))}
      </div>
      <span>Thinking{elapsed > 0 ? ` · ${elapsed}s` : "..."}</span>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   MARKDOWN RENDERER
══════════════════════════════════════════════════════════════ */
function MarkdownView({ text }: { text: string }) {
  const html = text
    .replace(/```(\w*)\n?([\s\S]*?)```/g, (_m, lang, code) =>
      `<div class="og-code-block"><div class="og-code-lang">${lang || "code"}</div><pre><code>${
        code.replace(/</g, "&lt;").replace(/>/g, "&gt;")
      }</code></pre></div>`
    )
    .replace(/`([^`\n]+)`/g, '<code class="og-inline-code">$1</code>')
    .replace(/\*\*([^*\n]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\*([^*\n]+)\*/g, "<em>$1</em>")
    .replace(/^### (.+)$/gm, '<h3 class="og-h3">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="og-h2">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 class="og-h1">$1</h1>')
    .replace(/^[-•] (.+)$/gm, '<li class="og-li">$1</li>')
    .replace(/(<li[^>]*>.*<\/li>\n?)+/g, m => `<ul class="og-ul">${m}</ul>`)
    .replace(/\n\n/g, "<br/>");

  return (
    <div
      className="og-markdown text-[13.5px] text-white/80 leading-relaxed"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

/* ══════════════════════════════════════════════════════════════
   MESSAGE VIEW
══════════════════════════════════════════════════════════════ */
function MessageView({
  message,
  onToggleThought,
  isLastAssistant,
  isStreaming,
  streamStartTime,
}: {
  message: Message;
  onToggleThought: (msgId: string, idx: number) => void;
  isLastAssistant: boolean;
  isStreaming: boolean;
  streamStartTime: number;
}) {
  if (message.role === "user") {
    return (
      <div className="flex justify-end mb-5">
        <div className="max-w-[88%] bg-[#161b26] border border-blue-400/8 rounded-2xl rounded-tr-md px-4 py-2.5">
          <p className="text-[13.5px] text-white/82 leading-relaxed whitespace-pre-wrap">
            {(message.blocks[0] as TextBlock)?.content ?? ""}
          </p>
        </div>
      </div>
    );
  }

  const isDebate = message.mode === "debate";

  return (
    <div className="mb-5">
      {/* Agent header */}
      <div className="flex items-center gap-2 mb-2.5">
        <div className="w-6 h-6 rounded-md bg-blue-500/12 border border-blue-400/18 flex items-center justify-center">
          <span className="text-[12px]">💎</span>
        </div>
        <span className="text-[11px] font-medium text-white/38">Antigravity</span>
        {message.model && (
          <span className="text-[9.5px] text-white/18">
            · {message.model.replace("gemini-", "").replace("-preview", "").replace("-exp", "")}
          </span>
        )}
        {isDebate && (
          <span className="flex items-center gap-1 text-[9px] px-1.5 py-0.5 bg-orange-500/10 border border-orange-400/20 rounded text-orange-300/70">
            <Swords size={8} />
            Debate
          </span>
        )}
      </div>

      {/* Blocks */}
      {message.blocks.map((block, i) => {
        if (block.type === "thought") {
          return (
            <ThinkingBlockView
              key={i}
              block={block}
              onToggle={() => onToggleThought(message.id, i)}
            />
          );
        }
        if (block.type === "tool_call") {
          return <ToolCallBlockView key={i} block={block} />;
        }
        if (block.type === "round_marker") {
          return <RoundMarkerView key={i} block={block} />;
        }
        if (block.type === "text") {
          return <MarkdownView key={i} text={block.content} />;
        }
        if (block.type === "error") {
          return (
            <div key={i} className="flex items-start gap-2 bg-red-500/7 border border-red-400/12 rounded-xl px-3 py-2.5 text-[12px] text-red-300/85 mb-2">
              <AlertCircle size={11} className="mt-0.5 shrink-0" />
              <span>{block.content}</span>
            </div>
          );
        }
        return null;
      })}

      {/* Thinking indicator */}
      {isLastAssistant && isStreaming && message.blocks.every(b => b.type === "round_marker") && (
        <ThinkingIndicator startTime={streamStartTime} />
      )}
      {isLastAssistant && isStreaming && message.blocks.length === 0 && (
        <ThinkingIndicator startTime={streamStartTime} />
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════════════════ */
interface GeminiChatPanelProps {
  onOpenBYOK: () => void;
}

export function GeminiChatPanel({ onOpenBYOK }: GeminiChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [selectedModel, setSelectedModel] = useState(GEMINI_MODELS[0].id);
  const [showModelPicker, setShowModelPicker] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const [streamStartTime, setStreamStartTime] = useState(0);
  const [mode, setMode] = useState<AppMode>("agent");
  const [hasKey, setHasKey] = useState(hasBYOKKey("gemini"));
  const [showHistory, setShowHistory] = useState(false);
  const [sessionId, setSessionId] = useState(() => newSessionId());
  const [sessionCreatedAt, setSessionCreatedAt] = useState(() => Date.now());
  const [historySessions, setHistorySessions] = useState<HistorySession[]>([]);

  const abortRef = useRef<(() => void) | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const history = useGeminiHistory();

  const currentModel = GEMINI_MODELS.find(m => m.id === selectedModel) ?? GEMINI_MODELS[0];

  /* ── Auto-scroll ── */
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  /* ── Key status re-check on window focus ── */
  useEffect(() => {
    const check = () => setHasKey(hasBYOKKey("gemini"));
    window.addEventListener("focus", check);
    return () => window.removeEventListener("focus", check);
  }, []);

  /* ── Load sessions list on mount ── */
  useEffect(() => {
    setHistorySessions(history.load());
  }, []);

  /* ── Auto-save when streaming ends and we have messages ── */
  useEffect(() => {
    if (streaming) return;
    if (messages.length < 2) return;
    const session: HistorySession = {
      id: sessionId,
      title: sessionTitle(messages),
      mode,
      model: selectedModel,
      turns: messages.filter(m => m.role === "user").length,
      createdAt: sessionCreatedAt,
      updatedAt: Date.now(),
      messages,
    };
    history.upsert(session);
    setHistorySessions(history.load());
  }, [streaming]);

  /* ── New chat ── */
  const startNewChat = useCallback(() => {
    setMessages([]);
    setInput("");
    setSessionId(newSessionId());
    setSessionCreatedAt(Date.now());
    setShowHistory(false);
  }, []);

  /* ── Load a past session ── */
  const loadSession = useCallback((s: HistorySession) => {
    setMessages(s.messages);
    setMode(s.mode);
    setSelectedModel(s.model);
    setSessionId(s.id);
    setSessionCreatedAt(s.createdAt);
    setShowHistory(false);
  }, []);

  /* ── Delete a session from history ── */
  const deleteSession = useCallback((id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    history.remove(id);
    setHistorySessions(history.load());
    if (id === sessionId) startNewChat();
  }, [sessionId, startNewChat]);

  /* ── Clear all history ── */
  const clearAllHistory = useCallback(() => {
    history.clearAll();
    setHistorySessions([]);
    startNewChat();
  }, [startNewChat]);

  /* ── Voice Input ── */
  const handleVoiceResult = useCallback((text: string) => {
    setInput(prev => {
      const joined = prev ? prev + " " + text : text;
      return joined;
    });
  }, []);
  const { listening, supported: voiceSupported, toggle: toggleVoice } = useVoiceInput(handleVoiceResult);

  /* ── Block helpers ── */
  const addBlock = useCallback((msgId: string, block: MessageBlock) => {
    setMessages(prev => prev.map(m => {
      if (m.id !== msgId) return m;

      /* Finalize pending tool_call */
      if (block.type === "tool_call" && block.done) {
        const idx = [...m.blocks].map((b, i) => ({ b, i })).reverse()
          .find(({ b }) => b.type === "tool_call" && (b as ToolCallBlock).tool === block.tool && !(b as ToolCallBlock).done)?.i;
        if (idx !== undefined) {
          const updated = [...m.blocks];
          (updated[idx] as ToolCallBlock).done = true;
          if (block.output) (updated[idx] as ToolCallBlock).output = block.output;
          return { ...m, blocks: updated };
        }
      }

      /* Finalize round_marker when round_end arrives */
      if (block.type === "round_marker" && block.done) {
        const idx = [...m.blocks].map((b, i) => ({ b, i })).reverse()
          .find(({ b }) => b.type === "round_marker" && (b as RoundBlock).round === block.round && !(b as RoundBlock).done)?.i;
        if (idx !== undefined) {
          const updated = [...m.blocks];
          (updated[idx] as RoundBlock).done = true;
          return { ...m, blocks: updated };
        }
      }

      return { ...m, blocks: [...m.blocks, block] };
    }));
  }, []);

  /* ══════════════════════════════════════════════════════════
     SEND HANDLER — branches on mode
  ══════════════════════════════════════════════════════════ */
  const handleSend = useCallback(async () => {
    const q = input.trim();
    if (!q || streaming) return;

    const freshHasKey = hasBYOKKey("gemini");
    setHasKey(freshHasKey);
    if (!freshHasKey) { onOpenBYOK(); return; }

    const apiKey = getBYOKKey("gemini");
    setInput("");
    setStreaming(true);
    setStreamStartTime(Date.now());

    const asstMsgId = `a-${Date.now()}`;
    setMessages(prev => [
      ...prev,
      { id: `u-${Date.now() - 1}`, role: "user", blocks: [{ type: "text", content: q }] },
      { id: asstMsgId, role: "assistant", blocks: [], model: selectedModel, mode },
    ]);

    const endpoint =
      mode === "agent"  ? "/api/gemini/agent"  :
      mode === "debate" ? "/api/gemini/debate"  :
                          "/api/gemini/chat";

    const abortCtrl = new AbortController();
    let aborted = false;
    abortRef.current = () => { aborted = true; abortCtrl.abort(); };

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Gemini-Key": apiKey },
        body: JSON.stringify({ query: q, model: selectedModel }),
        signal: abortCtrl.signal,
      });

      if (!res.body) throw new Error("No response stream");
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";
      let pendingToolTool = "";
      let pendingToolLabel = "";
      let thinkStart = Date.now();

      while (true) {
        const { done, value } = await reader.read();
        if (done || aborted) break;
        buf += decoder.decode(value, { stream: true });
        const lines = buf.split("\n");
        buf = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          let ev: Record<string, unknown>;
          try { ev = JSON.parse(line.slice(6)) as Record<string, unknown>; }
          catch { continue; }

          switch (ev.type) {

            /* ── Thinking ── */
            case "thinking_start":
              thinkStart = Date.now();
              break;

            case "thought": {
              const elapsed = Math.round((Date.now() - thinkStart) / 1000);
              addBlock(asstMsgId, {
                type: "thought",
                content: ev.content as string,
                elapsedSec: elapsed,
                expanded: false,
                round: ev.round as number | undefined,
              });
              thinkStart = Date.now();
              break;
            }

            /* ── Agent tool calls ── */
            case "tool_call":
              pendingToolTool = ev.tool as string;
              pendingToolLabel = buildToolLabel(ev.tool as string, ev.args as Record<string, unknown>);
              addBlock(asstMsgId, {
                type: "tool_call",
                tool: pendingToolTool,
                label: pendingToolLabel,
                done: false,
              });
              break;

            case "tool_result":
              addBlock(asstMsgId, {
                type: "tool_call",
                tool: (ev.tool as string) || pendingToolTool,
                label: pendingToolLabel,
                output: ev.output as string,
                done: true,
              });
              pendingToolTool = "";
              pendingToolLabel = "";
              break;

            /* ── Debate rounds ── */
            case "round_start":
              addBlock(asstMsgId, {
                type: "round_marker",
                round: ev.round as number,
                label: ev.label as string,
                icon: ev.icon as string,
                done: false,
              });
              break;

            case "round_end":
              addBlock(asstMsgId, {
                type: "round_marker",
                round: ev.round as number,
                label: "",
                icon: "",
                done: true,
              });
              break;

            /* ── Text ── */
            case "chunk":
            case "text":
              addBlock(asstMsgId, {
                type: "text",
                content: ev.content as string,
                round: ev.round as number | undefined,
              });
              break;

            case "error":
              addBlock(asstMsgId, { type: "error", content: ev.error as string });
              break;

            case "done":
              break;
          }
        }
      }
    } catch (e: unknown) {
      if (!aborted) {
        addBlock(asstMsgId, {
          type: "error",
          content: e instanceof Error ? e.message : String(e),
        });
      }
    } finally {
      setStreaming(false);
      abortRef.current = null;
    }
  }, [input, streaming, selectedModel, mode, addBlock, onOpenBYOK]);

  const handleToggleThought = useCallback((msgId: string, idx: number) => {
    setMessages(prev => prev.map(m => {
      if (m.id !== msgId) return m;
      const blocks = [...m.blocks];
      const b = blocks[idx];
      if (b && b.type === "thought") blocks[idx] = { ...b, expanded: !b.expanded };
      return { ...m, blocks };
    }));
  }, []);

  const lastAssistantId = [...messages].reverse().find(m => m.role === "assistant")?.id ?? "";

  /* ════════════════════════════════════════════════════════════════
     RENDER
  ════════════════════════════════════════════════════════════════ */
  return (
    <>
      <style>{`
        .og-markdown h1.og-h1 { font-size:16px; font-weight:700; color:rgba(255,255,255,.85); margin-bottom:6px; }
        .og-markdown h2.og-h2 { font-size:14px; font-weight:600; color:rgba(255,255,255,.80); margin-bottom:5px; }
        .og-markdown h3.og-h3 { font-size:13px; font-weight:600; color:rgba(255,255,255,.75); margin-bottom:4px; }
        .og-markdown ul.og-ul  { list-style:disc; padding-left:18px; margin:4px 0 8px; }
        .og-markdown li.og-li  { margin-bottom:3px; }
        .og-markdown strong    { font-weight:600; color:rgba(255,255,255,.9); }
        .og-markdown em        { font-style:italic; color:rgba(255,255,255,.6); }
        .og-markdown .og-inline-code {
          font-family:Consolas,"Fira Code",monospace;
          font-size:11.5px; background:rgba(255,255,255,.07);
          border:1px solid rgba(255,255,255,.1);
          padding:1px 5px; border-radius:4px; color:#79c0ff;
        }
        .og-markdown .og-code-block {
          background:#0d1117; border:1px solid rgba(255,255,255,.08);
          border-radius:8px; overflow:hidden; margin:8px 0;
        }
        .og-markdown .og-code-lang {
          font-size:10px; font-family:Consolas,monospace;
          color:rgba(255,255,255,.25); padding:4px 10px;
          border-bottom:1px solid rgba(255,255,255,.06);
          background:rgba(255,255,255,.02);
        }
        .og-markdown .og-code-block pre { padding:10px 12px; overflow-x:auto; margin:0; }
        .og-markdown .og-code-block code {
          font-family:Consolas,"Fira Code",monospace;
          font-size:12px; color:#e6edf3; line-height:1.55;
        }
      `}</style>

      <div className="relative flex flex-col h-full bg-[#0a0a0a] overflow-hidden">

        {/* ══ HISTORY DRAWER (slide-in) ══ */}
        <AnimatePresence>
          {showHistory && (
            <>
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowHistory(false)}
                className="absolute inset-0 bg-black/50 z-20"
              />
              {/* Drawer */}
              <motion.div
                initial={{ x: "-100%" }}
                animate={{ x: 0 }}
                exit={{ x: "-100%" }}
                transition={{ type: "spring", stiffness: 320, damping: 32 }}
                className="absolute inset-y-0 left-0 w-[82%] max-w-[300px] bg-[#0e0e0e] border-r border-white/[0.08] z-30 flex flex-col"
              >
                {/* Drawer header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.07]">
                  <div className="flex items-center gap-2">
                    <History size={13} className="text-white/50" />
                    <span className="text-[12.5px] font-semibold text-white/75">Chat History</span>
                    {historySessions.length > 0 && (
                      <span className="text-[9.5px] px-1.5 py-0.5 bg-white/[0.05] rounded text-white/30">
                        {historySessions.length}/{MAX_HISTORY}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => setShowHistory(false)}
                    className="text-white/25 hover:text-white/55 transition-colors"
                  >
                    <X size={14} />
                  </button>
                </div>

                {/* New chat button */}
                <div className="px-3 pt-3 pb-2 shrink-0">
                  <button
                    onClick={startNewChat}
                    className="w-full flex items-center gap-2 px-3 py-2.5 bg-blue-500/10 hover:bg-blue-500/18 border border-blue-400/18 rounded-xl text-[12px] text-blue-300 transition-all"
                  >
                    <Plus size={12} />
                    <span className="font-medium">New Conversation</span>
                  </button>
                </div>

                {/* Sessions list */}
                <div className="flex-1 overflow-y-auto px-3 pb-3 space-y-1">
                  {historySessions.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-40 gap-3 text-center">
                      <MessageSquare size={22} className="text-white/12" />
                      <p className="text-[11px] text-white/25 leading-relaxed">
                        No history yet.<br />Start a conversation to save it here.
                      </p>
                    </div>
                  ) : (
                    historySessions.map(s => (
                      <button
                        key={s.id}
                        onClick={() => loadSession(s)}
                        className={cn(
                          "w-full flex items-start gap-2.5 px-3 py-2.5 rounded-xl text-left transition-all group",
                          s.id === sessionId
                            ? "bg-blue-500/10 border border-blue-400/15"
                            : "hover:bg-white/[0.04] border border-transparent"
                        )}
                      >
                        <span className="text-[12px] mt-0.5 shrink-0">{MODE_ICON[s.mode]}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-[11.5px] text-white/70 truncate font-medium leading-tight">
                            {s.title}
                          </p>
                          <p className="text-[10px] text-white/25 mt-0.5">
                            {s.turns} turn{s.turns !== 1 ? "s" : ""} · {new Date(s.updatedAt).toLocaleDateString([], { month: "short", day: "numeric" })}
                          </p>
                        </div>
                        <button
                          onClick={e => deleteSession(s.id, e)}
                          className="shrink-0 opacity-0 group-hover:opacity-100 text-white/25 hover:text-red-400/70 transition-all mt-0.5"
                          title="Delete"
                        >
                          <X size={10} />
                        </button>
                      </button>
                    ))
                  )}
                </div>

                {/* Clear all */}
                {historySessions.length > 0 && (
                  <div className="px-3 py-3 border-t border-white/[0.06] shrink-0">
                    <button
                      onClick={clearAllHistory}
                      className="w-full flex items-center justify-center gap-1.5 py-2 text-[11px] text-white/22 hover:text-red-400/65 transition-colors"
                    >
                      <Trash2 size={10} />
                      Clear all history
                    </button>
                  </div>
                )}
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* ══ HEADER ══ */}
        <div className="flex items-center justify-between px-3 py-2.5 border-b border-white/[0.07] shrink-0">
          <div className="flex items-center gap-2">
            {/* History button */}
            <button
              onClick={() => setShowHistory(p => !p)}
              className={cn(
                "relative w-7 h-7 flex items-center justify-center rounded-lg border transition-all",
                showHistory
                  ? "bg-blue-500/15 border-blue-400/25 text-blue-300"
                  : "bg-white/[0.04] border-white/[0.07] text-white/35 hover:text-white/65 hover:bg-white/[0.07]"
              )}
              title="Chat history"
            >
              <History size={13} />
              {historySessions.length > 0 && (
                <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-blue-500 rounded-full text-[8px] text-white flex items-center justify-center font-bold leading-none">
                  {historySessions.length > 9 ? "9+" : historySessions.length}
                </span>
              )}
            </button>

            <div className="w-6 h-6 bg-blue-500/10 border border-blue-400/14 rounded-md flex items-center justify-center">
              <span className="text-[11px]">💎</span>
            </div>
            <div>
              <div className="flex items-center gap-1">
                <span className="text-[12.5px] font-semibold text-white/85">Antigravity</span>
                <span className="text-[8.5px] px-1.5 py-0.5 bg-blue-500/10 border border-blue-400/14 rounded text-blue-300/60 font-medium">OpenGravity</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            {/* New chat button */}
            <button
              onClick={startNewChat}
              className="w-7 h-7 flex items-center justify-center bg-white/[0.04] hover:bg-white/[0.07] border border-white/[0.07] rounded-lg text-white/35 hover:text-white/65 transition-all"
              title="New chat"
            >
              <Plus size={13} />
            </button>
            <BYOKBadge provider="gemini" onClick={onOpenBYOK} />
          </div>
        </div>

        {/* ══ MODE TABS ══ */}
        <div className="flex items-center gap-0 px-3 py-2 border-b border-white/[0.05] shrink-0">
          {([
            { id: "agent",  label: "🤖 Agent",  desc: "Autonomous" },
            { id: "chat",   label: "💬 Chat",    desc: "Simple Q&A" },
            { id: "debate", label: "⚔️ Debate",  desc: "Self-refine" },
          ] as const).map(m => (
            <button
              key={m.id}
              onClick={() => setMode(m.id)}
              className={cn(
                "flex-1 flex flex-col items-center py-1.5 text-[10.5px] rounded-lg mx-0.5 transition-all",
                mode === m.id
                  ? m.id === "debate"
                    ? "bg-orange-500/12 text-orange-300 border border-orange-400/20"
                    : "bg-blue-500/12 text-blue-300 border border-blue-400/18"
                  : "text-white/28 hover:text-white/50 border border-transparent hover:bg-white/[0.03]"
              )}
            >
              <span className="font-medium">{m.label}</span>
              <span className={cn(
                "text-[8.5px] mt-0.5",
                mode === m.id ? "opacity-70" : "text-white/18"
              )}>
                {m.desc}
              </span>
            </button>
          ))}
        </div>

        {/* ══ DEBATE HINT ══ */}
        <AnimatePresence>
          {mode === "debate" && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden shrink-0"
            >
              <div className="flex items-start gap-2 px-4 py-2.5 bg-orange-500/5 border-b border-orange-400/10 text-[11px] text-orange-300/60">
                <Swords size={11} className="mt-0.5 shrink-0" />
                <span>
                  <strong className="text-orange-300/80">3-Phase Self-Refinement</strong> —
                  Phase 1 answers, Phase 2 critiques, Phase 3 synthesizes the best final response.
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ══ NO KEY WARNING ══ */}
        <AnimatePresence>
          {!hasKey && (
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: "auto" }}
              exit={{ height: 0 }}
              className="overflow-hidden shrink-0"
            >
              <div
                className="flex items-center gap-2 px-4 py-2.5 bg-amber-500/6 border-b border-amber-400/10 text-[11.5px] text-amber-300/75 cursor-pointer hover:bg-amber-500/9 transition-colors"
                onClick={() => { onOpenBYOK(); setHasKey(hasBYOKKey("gemini")); }}
              >
                <Key size={10} className="shrink-0" />
                <span>Add your Gemini API key — free at aistudio.google.com/apikey</span>
                <ChevronDown size={9} className="ml-auto rotate-[-90deg] shrink-0" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ══ MESSAGES ══ */}
        <div className="flex-1 overflow-y-auto px-4 py-4">
          {messages.length === 0 ? (
            <EmptyState mode={mode} onChipClick={setInput} />
          ) : (
            <>
              {messages.map(m => (
                <MessageView
                  key={m.id}
                  message={m}
                  onToggleThought={handleToggleThought}
                  isLastAssistant={m.id === lastAssistantId}
                  isStreaming={streaming}
                  streamStartTime={streamStartTime}
                />
              ))}
            </>
          )}
          <div ref={bottomRef} />
        </div>

        {/* ══ INPUT AREA ══ */}
        <div className="shrink-0 border-t border-white/[0.07] p-3 space-y-2">

          {/* Model selector */}
          <div className="relative">
            <button
              onClick={() => setShowModelPicker(p => !p)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white/[0.04] hover:bg-white/[0.06] border border-white/[0.06] rounded-lg text-[11px] transition-all"
            >
              <span className="text-[9.5px]">💎</span>
              <span className={cn("font-medium truncate max-w-[110px]", currentModel.color)}>{currentModel.name}</span>
              <span className={cn("px-1.5 py-0.5 rounded border text-[8.5px] font-medium shrink-0", currentModel.badgeBg)}>
                {currentModel.badge}
              </span>
              <ChevronDown size={8} className={cn("text-white/28 transition-transform shrink-0", showModelPicker && "rotate-180")} />
            </button>

            <AnimatePresence>
              {showModelPicker && (
                <motion.div
                  initial={{ opacity: 0, y: -4, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.12 }}
                  className="absolute bottom-full mb-1 left-0 w-68 bg-[#111] border border-white/[0.1] rounded-xl shadow-2xl overflow-y-auto max-h-72 z-50"
                >
                  {GEMINI_MODELS.map(m => (
                    <button
                      key={m.id}
                      onClick={() => { setSelectedModel(m.id); setShowModelPicker(false); }}
                      className={cn(
                        "w-full flex items-center gap-2 px-3 py-2.5 text-left hover:bg-white/[0.04] transition-colors",
                        selectedModel === m.id && "bg-blue-500/6"
                      )}
                    >
                      <span className={cn("text-[12px] font-medium flex-1 truncate", m.color)}>{m.name}</span>
                      <span className={cn("px-1.5 py-0.5 rounded border text-[8.5px] font-medium shrink-0", m.badgeBg)}>
                        {m.badge}
                      </span>
                      {selectedModel === m.id && <Check size={10} className="text-blue-400 shrink-0" />}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Text input row */}
          <div className="flex items-end gap-2">
            <div className={cn(
              "flex-1 bg-white/[0.04] border rounded-xl px-3 py-2.5 transition-colors",
              listening
                ? "border-red-400/30 bg-red-500/5"
                : "border-white/[0.08] focus-within:border-blue-400/22"
            )}>
              {listening && (
                <div className="flex items-center gap-1.5 mb-1.5 text-[10px] text-red-400/70">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
                  Listening...
                </div>
              )}
              <textarea
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                placeholder={
                  !hasKey      ? "Add your Gemini API key first..." :
                  listening    ? "Speak now..." :
                  mode === "agent"  ? "Ask Antigravity to build something..." :
                  mode === "debate" ? "Ask a question to debate and refine..." :
                                     "Chat with Gemini..."
                }
                disabled={!hasKey}
                className="w-full bg-transparent text-[13px] text-white placeholder:text-white/16 resize-none outline-none leading-relaxed"
                rows={1}
                style={{ minHeight: "22px", maxHeight: "130px" }}
                onInput={e => {
                  const t = e.target as HTMLTextAreaElement;
                  t.style.height = "auto";
                  t.style.height = `${Math.min(t.scrollHeight, 130)}px`;
                }}
              />
            </div>

            {/* Voice button */}
            {voiceSupported && !streaming && (
              <button
                onClick={toggleVoice}
                title={listening ? "Stop recording" : "Voice input"}
                className={cn(
                  "w-9 h-9 flex items-center justify-center rounded-xl border transition-all shrink-0",
                  listening
                    ? "bg-red-500/18 border-red-400/25 text-red-400"
                    : "bg-white/[0.04] border-white/[0.07] text-white/35 hover:text-white/65 hover:bg-white/[0.07]"
                )}
              >
                {listening ? <MicOff size={13} /> : <Mic size={13} />}
              </button>
            )}

            {/* Send / Stop */}
            {streaming ? (
              <button
                onClick={() => abortRef.current?.()}
                className="w-9 h-9 flex items-center justify-center bg-red-500/12 hover:bg-red-500/20 border border-red-400/15 rounded-xl text-red-400 transition-all shrink-0"
                title="Stop"
              >
                <Square size={11} />
              </button>
            ) : (
              <button
                onClick={handleSend}
                disabled={!input.trim() || !hasKey}
                className={cn(
                  "w-9 h-9 flex items-center justify-center rounded-xl border transition-all shrink-0",
                  mode === "debate"
                    ? "bg-orange-500/12 hover:bg-orange-500/22 border-orange-400/18 hover:border-orange-400/30 text-orange-300 disabled:opacity-25 disabled:cursor-not-allowed"
                    : "bg-blue-500/14 hover:bg-blue-500/22 border-blue-400/18 hover:border-blue-400/30 text-blue-300 disabled:opacity-25 disabled:cursor-not-allowed"
                )}
              >
                {mode === "debate" ? <Swords size={12} /> : <Send size={12} />}
              </button>
            )}
          </div>

          {/* Footer */}
          {messages.length > 0 && (
            <div className="flex items-center justify-between pt-0.5">
              <button
                onClick={startNewChat}
                className="flex items-center gap-1 text-[10px] text-white/15 hover:text-white/38 transition-colors"
              >
                <Plus size={8} />
                New chat
              </button>
              <div className="flex items-center gap-2">
                <span className="text-[9px] text-white/12">
                  {messages.filter(m => m.role === "user").length} turn{messages.filter(m => m.role === "user").length !== 1 ? "s" : ""}
                </span>
                <span className="text-[9px] text-green-400/35">✓ saved</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

/* ══════════════════════════════════════════════════════════════
   EMPTY STATE
══════════════════════════════════════════════════════════════ */
const MODE_SUGGESTIONS: Record<AppMode, string[]> = {
  agent: ["Build a React dashboard", "Fix TypeScript errors", "Create a REST endpoint", "Explain this codebase"],
  chat:  ["What is React Suspense?", "Explain async/await", "Best practices for APIs", "Differences: REST vs GraphQL"],
  debate:["Is TypeScript worth it?", "Best CSS framework?", "Monorepo vs multi-repo?", "REST vs GraphQL debate"],
};

function EmptyState({ mode, onChipClick }: { mode: AppMode; onChipClick: (s: string) => void }) {
  const icons: Record<AppMode, ReactElement> = {
    agent:  <span className="text-3xl">🤖</span>,
    chat:   <span className="text-3xl">💬</span>,
    debate: <Swords size={28} className="text-orange-400/70" />,
  };
  const titles: Record<AppMode, string> = {
    agent:  "Antigravity Agent",
    chat:   "Gemini Chat",
    debate: "Debate Mode",
  };
  const descs: Record<AppMode, string> = {
    agent:  "Autonomous agent powered by Gemini. Can run commands, write files, and build full projects.",
    chat:   "Fast Q&A with Gemini's reasoning capabilities. Great for explanations and advice.",
    debate: "Ask a question and watch the model answer, critique itself, then produce a refined synthesis.",
  };

  return (
    <div className="flex flex-col items-center justify-center h-full gap-5 text-center">
      <div className={cn(
        "w-16 h-16 rounded-2xl flex items-center justify-center border",
        mode === "debate"
          ? "bg-orange-500/7 border-orange-400/12"
          : "bg-blue-500/7 border-blue-400/12"
      )}>
        {icons[mode]}
      </div>
      <div>
        <h3 className="text-[14px] font-semibold text-white/75 mb-1.5">{titles[mode]}</h3>
        <p className="text-[11.5px] text-white/28 max-w-[270px] leading-relaxed">{descs[mode]}</p>
      </div>
      <div className="flex flex-wrap gap-1.5 justify-center max-w-[310px]">
        {MODE_SUGGESTIONS[mode].map(s => (
          <button
            key={s}
            onClick={() => onChipClick(s)}
            className={cn(
              "px-2.5 py-1.5 border rounded-lg text-[11px] transition-all",
              mode === "debate"
                ? "bg-orange-500/5 hover:bg-orange-500/10 border-orange-400/12 text-orange-300/55 hover:text-orange-300/80"
                : "bg-white/[0.03] hover:bg-white/[0.06] border-white/[0.06] text-white/38 hover:text-white/65"
            )}
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   HELPER — build display label for a tool call
══════════════════════════════════════════════════════════════ */
function buildToolLabel(tool: string, args: Record<string, unknown>): string {
  switch (tool) {
    case "run_command":
    case "execute_command":  return String(args.command ?? "");
    case "write_file":       return String(args.path ?? "file");
    case "read_file":        return `Reading ${String(args.path ?? "file")}`;
    case "list_files":       return `ls ${args.directory ? String(args.directory) : "."}`;
    case "search_files":     return `grep "${String(args.pattern ?? "")}" ${args.directory ? String(args.directory) : ""}`;
    case "fetch_url":        return String(args.url ?? "").replace(/^https?:\/\//, "").slice(0, 60);
    case "send_terminal_input": return `Sent: "${String(args.text ?? "")}"`;
    case "wait":             return `Waiting ${String(args.ms ?? 0)}ms`;
    case "delete_file":      return `rm ${String(args.path ?? "")}`;
    case "move_file":        return `mv ${String(args.from ?? "")} → ${String(args.to ?? "")}`;
    default:                 return tool.replace(/_/g, " ");
  }
}
