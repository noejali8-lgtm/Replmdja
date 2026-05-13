/* ==========================================================================
   GEMINI CHAT PANEL — Antigravity Agent
   Ported directly from OpenGravity (https://github.com/ab-613/opengravity)

   Key patterns from agent.js:
   - Thinking timer: setInterval counting seconds while agent reasons
   - VSCode-style command blocks (renderAICommandBlock pattern)
   - Tool results with "Exit code 0" footer
   - Thought accordion with elapsed time display
   - Default model: gemini-3.1-pro-preview (as in agent.js line 4)
   ========================================================================== */

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send, Square, Brain, Terminal, FileCode2,
  FolderOpen, Search, ChevronDown, ChevronUp,
  Key, AlertCircle, Check, Loader2,
  Globe, Trash2, Bot, Copy, ExternalLink, Zap, Clock
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getBYOKKey, hasBYOKKey, BYOKBadge } from "./BYOKPanel";

/* ══════════════════════════════════════════════════════════════
   TYPES
══════════════════════════════════════════════════════════════ */
interface ThinkingBlock {
  type: "thought";
  content: string;
  elapsedSec: number;
  expanded: boolean;
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
}

interface ErrorBlock {
  type: "error";
  content: string;
}

type MessageBlock = ThinkingBlock | ToolCallBlock | TextBlock | ErrorBlock;

interface Message {
  id: string;
  role: "user" | "assistant";
  blocks: MessageBlock[];
  model?: string;
}

/* ══════════════════════════════════════════════════════════════
   GEMINI MODELS — gemini-3.1-pro-preview is default (OpenGravity)
══════════════════════════════════════════════════════════════ */
const GEMINI_MODELS = [
  { id: "gemini-3.1-pro-preview",       name: "Gemini 3.1 Pro",        badge: "Default",  color: "text-blue-400",   badgeBg: "bg-blue-500/15 text-blue-300 border-blue-400/25" },
  { id: "gemini-3-flash-preview",       name: "Gemini 3 Flash",        badge: "New",      color: "text-cyan-400",   badgeBg: "bg-cyan-500/15 text-cyan-300 border-cyan-400/25" },
  { id: "gemini-3.1-flash-lite",        name: "Gemini 3.1 Flash Lite", badge: "Lite",     color: "text-sky-400",    badgeBg: "bg-sky-500/15 text-sky-300 border-sky-400/25" },
  { id: "gemini-2.5-pro-preview",       name: "Gemini 2.5 Pro",        badge: "Pro",      color: "text-indigo-400", badgeBg: "bg-indigo-500/15 text-indigo-300 border-indigo-400/25" },
  { id: "gemini-2.5-flash-preview",     name: "Gemini 2.5 Flash",      badge: "Fast",     color: "text-violet-400", badgeBg: "bg-violet-500/15 text-violet-300 border-violet-400/25" },
  { id: "gemini-2.5-flash-lite-preview",name: "Gemini 2.5 Flash Lite", badge: "Lite",     color: "text-purple-400", badgeBg: "bg-purple-500/15 text-purple-300 border-purple-400/25" },
  { id: "gemini-2.0-flash-exp",         name: "Gemini 2.0 Flash",      badge: "Stable",   color: "text-teal-400",   badgeBg: "bg-teal-500/15 text-teal-300 border-teal-400/25" },
  { id: "gemini-2.0-pro-exp",           name: "Gemini 2.0 Pro",        badge: "Exp",      color: "text-emerald-400",badgeBg: "bg-emerald-500/15 text-emerald-300 border-emerald-400/25" },
  { id: "gemini-1.5-pro",               name: "Gemini 1.5 Pro",        badge: "2M ctx",   color: "text-green-400",  badgeBg: "bg-green-500/15 text-green-300 border-green-400/25" },
  { id: "gemini-1.5-flash",             name: "Gemini 1.5 Flash",      badge: "1M ctx",   color: "text-lime-400",   badgeBg: "bg-lime-500/15 text-lime-300 border-lime-400/25" },
];

/* ══════════════════════════════════════════════════════════════
   TOOL ICON — matches OpenGravity's renderAICommandBlock
══════════════════════════════════════════════════════════════ */
function getToolIcon(tool: string) {
  switch (tool) {
    case "run_command":
    case "execute_command":  return <Terminal size={11} />;
    case "send_terminal_input": return <Terminal size={11} className="text-amber-400" />;
    case "wait":             return <Clock size={11} className="text-yellow-400/70" />;
    case "write_file":       return <FileCode2 size={11} className="text-blue-400" />;
    case "read_file":        return <FolderOpen size={11} className="text-cyan-400" />;
    case "list_files":       return <FolderOpen size={11} className="text-teal-400" />;
    case "search_files":     return <Search size={11} className="text-purple-400" />;
    case "fetch_url":        return <Globe size={11} className="text-orange-400" />;
    case "delete_file":      return <FileCode2 size={11} className="text-red-400" />;
    case "move_file":        return <FileCode2 size={11} className="text-yellow-400" />;
    default:                 return <Zap size={11} />;
  }
}

function getToolVerb(tool: string): string {
  switch (tool) {
    case "run_command":
    case "execute_command":  return "Ran background command";
    case "send_terminal_input": return "Sent terminal input";
    case "wait":             return "Waited";
    case "write_file":       return "Edited file";
    case "read_file":        return "Analyzed file";
    case "list_files":       return "Scanned workspace";
    case "search_files":     return "Searched files";
    case "fetch_url":        return "Fetched URL";
    case "delete_file":      return "Deleted file";
    case "move_file":        return "Moved file";
    default:                 return tool.replace(/_/g, " ");
  }
}

/* ══════════════════════════════════════════════════════════════
   RENDER HELPERS
══════════════════════════════════════════════════════════════ */

/** Thinking block with elapsed time — mirrors OpenGravity's thinkingTimerId pattern */
function ThinkingBlockView({ block, onToggle }: { block: ThinkingBlock; onToggle: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -2 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-2.5"
    >
      <button
        onClick={onToggle}
        className="flex items-center gap-2 text-[11.5px] text-white/40 hover:text-white/60 transition-colors group"
      >
        <div className="w-4 h-4 rounded border border-purple-400/30 bg-purple-500/10 flex items-center justify-center">
          <Brain size={9} className="text-purple-400" />
        </div>
        <span className="font-medium">Thought</span>
        <span className="text-white/20">·</span>
        <span className="text-white/25">{block.elapsedSec}s</span>
        <span className="ml-0.5 text-white/20 group-hover:text-white/40 transition-colors">
          {block.expanded ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
        </span>
      </button>
      <AnimatePresence>
        {block.expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="overflow-hidden"
          >
            <div className="mt-1.5 ml-6 pl-3 border-l-2 border-purple-400/15 py-1">
              <p className="text-[11px] text-white/25 font-mono leading-relaxed whitespace-pre-wrap max-h-56 overflow-y-auto">
                {block.content}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/** VSCode-style command block — mirrors renderAICommandBlock from OpenGravity script.js */
function ToolCallBlockView({ block }: { block: ToolCallBlock }) {
  const [expanded, setExpanded] = useState(false);
  const isCommand = block.tool === "run_command" || block.tool === "execute_command";
  const isWrite = block.tool === "write_file";

  return (
    <motion.div
      initial={{ opacity: 0, y: 2 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-2 rounded-lg overflow-hidden border border-white/[0.07] bg-[#0e0e0e]"
    >
      {/* Header — "Ran background command" style */}
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-white/[0.05]">
        <div className="flex items-center gap-1.5 text-[11px] text-white/35">
          {getToolIcon(block.tool)}
          <span>{getToolVerb(block.tool)}</span>
        </div>
        <div className="flex items-center gap-2">
          {!block.done && (
            <Loader2 size={10} className="text-white/25 animate-spin" />
          )}
          {block.done && (
            <span className="text-[10px] text-green-400/70">Exit code 0</span>
          )}
          {block.output && (
            <button
              onClick={() => setExpanded(e => !e)}
              className="text-[10px] text-white/25 hover:text-white/50 transition-colors flex items-center gap-0.5"
            >
              {expanded ? "hide" : "show"}
              {expanded ? <ChevronUp size={9} /> : <ChevronDown size={9} />}
            </button>
          )}
        </div>
      </div>

      {/* Command line */}
      <div className="flex items-center justify-between px-3 py-2 font-mono">
        <span className="text-[12px] text-white/60 truncate">{block.label}</span>
        <button
          onClick={() => navigator.clipboard.writeText(block.label)}
          className="shrink-0 ml-2 text-white/20 hover:text-white/50 transition-colors"
          title="Copy"
        >
          <Copy size={10} />
        </button>
      </div>

      {/* Output (collapsible) */}
      <AnimatePresence>
        {expanded && block.output && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: "auto" }}
            exit={{ height: 0 }}
            className="overflow-hidden"
          >
            <div className="border-t border-white/[0.05] px-3 py-2">
              <pre className="text-[11px] text-white/35 font-mono leading-relaxed whitespace-pre-wrap max-h-40 overflow-y-auto">
                {block.output}
              </pre>
            </div>
            {/* Scroll track dots — VSCode aesthetic from OpenGravity */}
            <div className="flex flex-col items-center gap-1 px-3 py-1.5 border-t border-white/[0.04]">
              <div className="flex items-center justify-between w-full text-[10px] text-white/20">
                <span>Always run</span>
                <span className="text-green-400/60">{block.done ? "✓ complete" : "running..."}</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/** Thinking indicator while waiting for next response — animated dots */
function ThinkingIndicator({ startTime }: { startTime: number }) {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setElapsed(Math.floor((Date.now() - startTime) / 1000)), 500);
    return () => clearInterval(id);
  }, [startTime]);
  return (
    <div className="flex items-center gap-2 mb-3 text-[12px] text-white/30">
      <div className="flex gap-0.5">
        {[0, 1, 2].map(i => (
          <motion.div
            key={i}
            className="w-1 h-1 rounded-full bg-blue-400/60"
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 1.2, delay: i * 0.2, repeat: Infinity }}
          />
        ))}
      </div>
      <span>Thinking{elapsed > 0 ? ` · ${elapsed}s` : "..."}</span>
    </div>
  );
}

/** Render markdown — matches renderAIMarkdown from OpenGravity */
function MarkdownView({ text }: { text: string }) {
  const html = text
    .replace(/```(\w*)\n?([\s\S]*?)```/g, (_, lang, code) =>
      `<div class="og-code-block"><div class="og-code-lang">${lang || "code"}</div><pre><code>${code.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</code></pre></div>`
    )
    .replace(/`([^`\n]+)`/g, '<code class="og-inline-code">$1</code>')
    .replace(/\*\*([^*\n]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\*([^*\n]+)\*/g, "<em>$1</em>")
    .replace(/^### (.+)$/gm, '<h3 class="og-h3">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="og-h2">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 class="og-h1">$1</h1>')
    .replace(/^[-•] (.+)$/gm, '<li class="og-li">$1</li>')
    .replace(/(<li.*<\/li>\n?)+/g, (match) => `<ul class="og-ul">${match}</ul>`)
    .replace(/\n\n/g, '<br class="og-br"/>');

  return (
    <div
      className="og-markdown text-[13.5px] text-white/80 leading-relaxed"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

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
        <div className="max-w-[85%] bg-[#161b26] border border-blue-400/10 rounded-2xl rounded-tr-md px-4 py-2.5">
          <p className="text-[13.5px] text-white/85 leading-relaxed whitespace-pre-wrap">
            {(message.blocks[0] as TextBlock)?.content ?? ""}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-5">
      {/* Agent header */}
      <div className="flex items-center gap-2 mb-2.5">
        <div className="w-6 h-6 rounded-md bg-blue-500/15 border border-blue-400/20 flex items-center justify-center">
          <span className="text-[12px]">💎</span>
        </div>
        <span className="text-[11.5px] font-medium text-white/40">Antigravity</span>
        {message.model && (
          <span className="text-[10px] text-white/20">
            · {message.model.replace("gemini-", "").replace("-preview", "").replace("-exp", "")}
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
        if (block.type === "text") {
          return <MarkdownView key={i} text={block.content} />;
        }
        if (block.type === "error") {
          return (
            <div key={i} className="flex items-start gap-2 bg-red-500/8 border border-red-400/15 rounded-xl px-3 py-2.5 text-[12px] text-red-300 mb-2">
              <AlertCircle size={12} className="mt-0.5 shrink-0" />
              <span>{block.content}</span>
            </div>
          );
        }
        return null;
      })}

      {/* Thinking indicator for the last streaming message */}
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
  const [mode, setMode] = useState<"chat" | "agent">("agent");
  const [hasKey, setHasKey] = useState(hasBYOKKey("gemini"));

  const abortRef = useRef<(() => void) | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const thinkingStartRef = useRef<number>(0);

  const currentModel = GEMINI_MODELS.find(m => m.id === selectedModel) ?? GEMINI_MODELS[0];

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  /* Re-check key whenever BYOK panel might have updated it */
  useEffect(() => {
    const check = () => setHasKey(hasBYOKKey("gemini"));
    window.addEventListener("focus", check);
    return () => window.removeEventListener("focus", check);
  }, []);

  /* ── Add a block to the last assistant message ── */
  const addBlock = useCallback((msgId: string, block: MessageBlock) => {
    setMessages(prev => prev.map(m => {
      if (m.id !== msgId) return m;

      /* Update existing tool_call block with result */
      if (block.type === "tool_call" && block.done && block.output !== undefined) {
        const idx = [...m.blocks].reverse().findIndex(
          b => b.type === "tool_call" && (b as ToolCallBlock).tool === block.tool && !(b as ToolCallBlock).done
        );
        if (idx !== -1) {
          const realIdx = m.blocks.length - 1 - idx;
          const updated = [...m.blocks];
          (updated[realIdx] as ToolCallBlock).done = true;
          (updated[realIdx] as ToolCallBlock).output = block.output;
          return { ...m, blocks: updated };
        }
      }
      return { ...m, blocks: [...m.blocks, block] };
    }));
  }, []);

  /* ── Main send handler ── */
  const handleSend = useCallback(async () => {
    const q = input.trim();
    if (!q || streaming) return;

    /* Re-check key in case it was just added */
    const freshHasKey = hasBYOKKey("gemini");
    setHasKey(freshHasKey);
    if (!freshHasKey) { onOpenBYOK(); return; }

    const apiKey = getBYOKKey("gemini");
    setInput("");
    setStreaming(true);
    setStreamStartTime(Date.now());

    const userMsgId = `u-${Date.now()}`;
    const asstMsgId = `a-${Date.now() + 1}`;

    setMessages(prev => [
      ...prev,
      { id: userMsgId, role: "user", blocks: [{ type: "text", content: q }] },
      { id: asstMsgId, role: "assistant", blocks: [], model: selectedModel },
    ]);

    const endpoint = mode === "agent" ? "/api/gemini/agent" : "/api/gemini/chat";
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
            case "thinking_start":
              thinkStart = Date.now();
              thinkingStartRef.current = thinkStart;
              break;

            case "thought": {
              const elapsed = Math.round((Date.now() - thinkStart) / 1000);
              addBlock(asstMsgId, {
                type: "thought",
                content: ev.content as string,
                elapsedSec: elapsed,
                expanded: false,
              });
              thinkStart = Date.now();
              break;
            }

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
                tool: ev.tool as string ?? pendingToolTool,
                label: pendingToolLabel,
                output: ev.output as string,
                done: true,
              });
              pendingToolTool = "";
              pendingToolLabel = "";
              break;

            case "chunk":
            case "text":
              addBlock(asstMsgId, { type: "text", content: ev.content as string });
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

  /* ══ RENDER ══ */
  return (
    <>
      {/* Markdown / code block styles */}
      <style>{`
        .og-markdown h1.og-h1 { font-size:16px; font-weight:700; color:rgba(255,255,255,.85); margin-bottom:6px; }
        .og-markdown h2.og-h2 { font-size:14px; font-weight:600; color:rgba(255,255,255,.80); margin-bottom:5px; }
        .og-markdown h3.og-h3 { font-size:13px; font-weight:600; color:rgba(255,255,255,.75); margin-bottom:4px; }
        .og-markdown ul.og-ul  { list-style:disc; padding-left:18px; margin:4px 0 8px; }
        .og-markdown li.og-li  { margin-bottom:3px; }
        .og-markdown strong    { font-weight:600; color:rgba(255,255,255,.9); }
        .og-markdown em        { font-style:italic; color:rgba(255,255,255,.6); }
        .og-markdown .og-inline-code {
          font-family: Consolas, "Fira Code", monospace;
          font-size:11.5px;
          background:rgba(255,255,255,.07);
          border:1px solid rgba(255,255,255,.1);
          padding:1px 5px;
          border-radius:4px;
          color:#79c0ff;
        }
        .og-markdown .og-code-block {
          background:#0d1117;
          border:1px solid rgba(255,255,255,.08);
          border-radius:8px;
          overflow:hidden;
          margin:8px 0;
        }
        .og-markdown .og-code-lang {
          font-size:10px;
          font-family: Consolas, monospace;
          color:rgba(255,255,255,.25);
          padding:4px 10px;
          border-bottom:1px solid rgba(255,255,255,.06);
          background:rgba(255,255,255,.02);
        }
        .og-markdown .og-code-block pre {
          padding:10px 12px;
          overflow-x:auto;
          margin:0;
        }
        .og-markdown .og-code-block code {
          font-family: Consolas, "Fira Code", monospace;
          font-size:12px;
          color:#e6edf3;
          line-height:1.55;
        }
      `}</style>

      <div className="flex flex-col h-full bg-[#0a0a0a]">

        {/* ── Header ── */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.07] shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-blue-500/10 border border-blue-400/15 rounded-lg flex items-center justify-center">
              <span className="text-[13px]">💎</span>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[13px] font-semibold text-white/85">Antigravity</span>
                <span className="text-[9px] px-1.5 py-0.5 bg-blue-500/10 border border-blue-400/15 rounded text-blue-300/70 font-medium">OpenGravity</span>
              </div>
              <div className="text-[10.5px] text-white/25">Gemini BYOK Agent</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Mode toggle */}
            <div className="flex items-center bg-white/[0.04] border border-white/[0.06] rounded-lg p-0.5">
              {(["agent", "chat"] as const).map(m => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className={cn(
                    "px-2.5 py-1 text-[10.5px] rounded-md transition-all",
                    mode === m
                      ? "bg-blue-500/20 text-blue-300 font-semibold"
                      : "text-white/30 hover:text-white/55"
                  )}
                >
                  {m === "agent" ? "🤖 Agent" : "💬 Chat"}
                </button>
              ))}
            </div>
            <BYOKBadge
              provider="gemini"
              onClick={() => { onOpenBYOK(); }}
            />
          </div>
        </div>

        {/* ── No key warning ── */}
        <AnimatePresence>
          {!hasKey && (
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: "auto" }}
              exit={{ height: 0 }}
              className="overflow-hidden shrink-0"
            >
              <div
                className="flex items-center gap-2 px-4 py-2.5 bg-amber-500/7 border-b border-amber-400/12 text-[12px] text-amber-300/80 cursor-pointer hover:bg-amber-500/10 transition-colors"
                onClick={() => { onOpenBYOK(); setHasKey(hasBYOKKey("gemini")); }}
              >
                <Key size={11} className="shrink-0" />
                <span>Add your Gemini API key to start — get one free at aistudio.google.com/apikey</span>
                <ChevronDown size={10} className="ml-auto rotate-[-90deg] shrink-0" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Messages ── */}
        <div className="flex-1 overflow-y-auto px-4 py-4">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-5 text-center">
              <div className="w-16 h-16 rounded-2xl bg-blue-500/8 border border-blue-400/12 flex items-center justify-center">
                <span className="text-3xl">💎</span>
              </div>
              <div>
                <h3 className="text-[14px] font-semibold text-white/75 mb-1.5">Antigravity Agent</h3>
                <p className="text-[12px] text-white/30 max-w-[270px] leading-relaxed">
                  Powered by Google Gemini with your own API key.
                  Uses advanced reasoning, can run commands, write files, and build full projects autonomously.
                </p>
              </div>
              {/* Suggestion chips */}
              <div className="flex flex-wrap gap-1.5 justify-center max-w-[310px]">
                {[
                  "Build a React dashboard",
                  "Fix a TypeScript error",
                  "Create a REST endpoint",
                  "Explain this codebase",
                  "Add dark mode",
                  "Write unit tests",
                ].map(s => (
                  <button
                    key={s}
                    onClick={() => setInput(s)}
                    className="px-2.5 py-1.5 bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] rounded-lg text-[11px] text-white/40 hover:text-white/65 transition-all"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
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
              {streaming && messages[messages.length - 1]?.blocks.length === 0 && (
                <ThinkingIndicator startTime={streamStartTime} />
              )}
            </>
          )}
          <div ref={bottomRef} />
        </div>

        {/* ── Input area ── */}
        <div className="shrink-0 border-t border-white/[0.07] p-3 space-y-2">

          {/* Model selector */}
          <div className="relative">
            <button
              onClick={() => setShowModelPicker(p => !p)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white/[0.04] hover:bg-white/[0.06] border border-white/[0.06] rounded-lg text-[11px] transition-all"
            >
              <span className="text-[10px]">💎</span>
              <span className={cn("font-medium", currentModel.color)}>{currentModel.name}</span>
              <span className={cn("px-1.5 py-0.5 rounded border text-[9px] font-medium", currentModel.badgeBg)}>
                {currentModel.badge}
              </span>
              <ChevronDown size={9} className={cn("text-white/30 transition-transform", showModelPicker && "rotate-180")} />
            </button>

            <AnimatePresence>
              {showModelPicker && (
                <motion.div
                  initial={{ opacity: 0, y: -4, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.13 }}
                  className="absolute bottom-full mb-1 left-0 w-72 bg-[#111] border border-white/[0.1] rounded-xl shadow-2xl overflow-y-auto max-h-72 z-50"
                >
                  {GEMINI_MODELS.map(m => (
                    <button
                      key={m.id}
                      onClick={() => { setSelectedModel(m.id); setShowModelPicker(false); }}
                      className={cn(
                        "w-full flex items-center gap-2.5 px-3 py-2.5 text-left hover:bg-white/[0.04] transition-colors",
                        selectedModel === m.id && "bg-blue-500/6"
                      )}
                    >
                      <span className={cn("text-[12px] font-medium flex-1 truncate", m.color)}>{m.name}</span>
                      <span className={cn("px-1.5 py-0.5 rounded border text-[9px] font-medium shrink-0", m.badgeBg)}>
                        {m.badge}
                      </span>
                      {selectedModel === m.id && <Check size={11} className="text-blue-400 shrink-0" />}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Text + send */}
          <div className="flex items-end gap-2">
            <div className="flex-1 bg-white/[0.04] border border-white/[0.08] focus-within:border-blue-400/25 rounded-xl px-3 py-2.5 transition-colors">
              <textarea
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                placeholder={
                  !hasKey ? "Add your Gemini API key first..." :
                  mode === "agent" ? "Ask Antigravity to build something..." :
                  "Chat with Gemini..."
                }
                disabled={!hasKey}
                className="w-full bg-transparent text-[13px] text-white placeholder:text-white/18 resize-none outline-none leading-relaxed"
                rows={1}
                style={{ minHeight: "22px", maxHeight: "130px" }}
                onInput={e => {
                  const t = e.target as HTMLTextAreaElement;
                  t.style.height = "auto";
                  t.style.height = `${Math.min(t.scrollHeight, 130)}px`;
                }}
              />
            </div>
            {streaming ? (
              <button
                onClick={() => abortRef.current?.()}
                className="w-9 h-9 flex items-center justify-center bg-red-500/12 hover:bg-red-500/20 border border-red-400/15 rounded-xl text-red-400 transition-all shrink-0"
                title="Stop"
              >
                <Square size={12} />
              </button>
            ) : (
              <button
                onClick={handleSend}
                disabled={!input.trim() || !hasKey}
                className="w-9 h-9 flex items-center justify-center bg-blue-500/15 hover:bg-blue-500/25 border border-blue-400/20 hover:border-blue-400/35 disabled:opacity-25 disabled:cursor-not-allowed rounded-xl text-blue-300 transition-all shrink-0"
              >
                <Send size={13} />
              </button>
            )}
          </div>

          {/* Footer */}
          {messages.length > 0 && (
            <div className="flex items-center justify-between pt-0.5">
              <button
                onClick={() => setMessages([])}
                className="flex items-center gap-1 text-[10px] text-white/18 hover:text-white/40 transition-colors"
              >
                <Trash2 size={9} />
                Clear
              </button>
              <span className="text-[9.5px] text-white/12">
                {messages.filter(m => m.role === "user").length} turn{messages.filter(m => m.role === "user").length !== 1 ? "s" : ""}
              </span>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

/* ══════════════════════════════════════════════════════════════
   HELPER — build display label for a tool call
══════════════════════════════════════════════════════════════ */
function buildToolLabel(tool: string, args: Record<string, unknown>): string {
  switch (tool) {
    case "run_command":
    case "execute_command":
      return String(args.command ?? "");
    case "write_file":
      return String(args.path ?? "file");
    case "read_file":
      return `Reading ${args.path as string ?? "file"}`;
    case "list_files":
      return `ls ${args.directory ? String(args.directory) : "."}`;
    case "search_files":
      return `grep "${args.pattern as string ?? ""}" ${args.directory ? String(args.directory) : ""}`;
    case "fetch_url":
      return String(args.url ?? "").replace(/^https?:\/\//, "").slice(0, 60);
    case "send_terminal_input":
      return `Sent: "${String(args.text ?? "")}"`;
    case "wait":
      return `Waiting ${String(args.ms ?? 0)}ms`;
    case "delete_file":
      return `rm ${args.path as string ?? ""}`;
    case "move_file":
      return `mv ${args.from as string ?? ""} → ${args.to as string ?? ""}`;
    default:
      return tool.replace(/_/g, " ");
  }
}
