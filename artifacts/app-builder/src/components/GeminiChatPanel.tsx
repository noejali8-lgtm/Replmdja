/* ==========================================================================
   GEMINI CHAT PANEL — Antigravity Agent (from OpenGravity)
   Full agentic loop with BYOK, tool rendering, thinking blocks,
   model selection, and proactive reasoning display.
   ========================================================================== */

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send, Square, Sparkles, Brain, Terminal, FileCode2,
  FolderOpen, Search, ChevronDown, ChevronUp, RefreshCw,
  Key, AlertCircle, Check, Loader2, Copy, RotateCcw,
  Zap, ExternalLink, Globe, Trash2, Settings, Bot
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getBYOKKey, hasBYOKKey, BYOKBadge, type ByokProvider } from "./BYOKPanel";

/* ══════════════════════════════════════════════════════════════
   TYPES
══════════════════════════════════════════════════════════════ */
interface ThinkingBlock {
  type: "thought";
  content: string;
  expanded: boolean;
}

interface ToolCallBlock {
  type: "tool_call";
  tool: string;
  args: Record<string, unknown>;
  result?: string;
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
  iterations?: number;
}

/* ══════════════════════════════════════════════════════════════
   GEMINI MODELS
══════════════════════════════════════════════════════════════ */
const GEMINI_MODELS = [
  { id: "gemini-2.5-pro-preview",       name: "2.5 Pro",        badge: "Best",        desc: "Most capable" },
  { id: "gemini-2.5-flash-preview",     name: "2.5 Flash",      badge: "Recommended", desc: "Fast & capable" },
  { id: "gemini-2.5-flash-lite-preview",name: "2.5 Flash Lite", badge: "Ultra-fast",  desc: "Lightweight" },
  { id: "gemini-2.0-flash-exp",         name: "2.0 Flash",      badge: "Stable",      desc: "Stable Flash" },
  { id: "gemini-2.0-pro-exp",           name: "2.0 Pro",        badge: "Exp",         desc: "Experimental" },
  { id: "gemini-1.5-pro",               name: "1.5 Pro",        badge: "2M ctx",      desc: "2M context" },
  { id: "gemini-3.1-pro-preview",       name: "3.1 Pro",        badge: "New",         desc: "Latest gen" },
  { id: "gemini-3-flash-preview",       name: "3 Flash",        badge: "New",         desc: "Next-gen Flash" },
];

/* ══════════════════════════════════════════════════════════════
   TOOL ICON / LABEL MAP (OpenGravity style)
══════════════════════════════════════════════════════════════ */
function getToolIcon(tool: string) {
  switch (tool) {
    case "run_command":
    case "execute_command":
      return <Terminal size={11} />;
    case "write_file":
      return <FileCode2 size={11} />;
    case "read_file":
      return <FolderOpen size={11} />;
    case "list_files":
      return <FolderOpen size={11} />;
    case "search_files":
      return <Search size={11} />;
    case "fetch_url":
      return <Globe size={11} />;
    case "send_terminal_input":
      return <Terminal size={11} />;
    case "wait":
      return <Loader2 size={11} />;
    case "delete_file":
    case "move_file":
      return <FileCode2 size={11} />;
    default:
      return <Zap size={11} />;
  }
}

function getToolLabel(tool: string, args: Record<string, unknown>): string {
  switch (tool) {
    case "run_command":
    case "execute_command":
      return `$ ${String(args.command ?? "").slice(0, 60)}`;
    case "write_file":
      return `Wrote ${args.path as string ?? "file"}`;
    case "read_file":
      return `Read ${args.path as string ?? "file"}`;
    case "list_files":
      return `Listed ${args.directory ? String(args.directory) : "workspace"}`;
    case "search_files":
      return `Searched for "${args.pattern as string ?? ""}"`;
    case "fetch_url":
      return `Fetched ${String(args.url ?? "").replace(/^https?:\/\//, "").slice(0, 50)}`;
    case "send_terminal_input":
      return `Sent input: "${args.text as string ?? ""}"`;
    case "wait":
      return `Waited ${args.ms as number ?? 0}ms`;
    case "delete_file":
      return `Deleted ${args.path as string ?? "file"}`;
    case "move_file":
      return `Moved ${args.from as string ?? ""} → ${args.to as string ?? ""}`;
    default:
      return tool.replace(/_/g, " ");
  }
}

/* ══════════════════════════════════════════════════════════════
   RENDER BLOCKS
══════════════════════════════════════════════════════════════ */
function ThinkingBlockView({ block, onToggle }: { block: ThinkingBlock; onToggle: () => void }) {
  return (
    <div className="mb-2">
      <button
        onClick={onToggle}
        className="flex items-center gap-1.5 text-[11px] text-white/35 hover:text-white/55 transition-colors"
      >
        <Brain size={11} className="text-purple-400/70" />
        <span>Thinking</span>
        {block.expanded ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
      </button>
      <AnimatePresence>
        {block.expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="mt-1.5 ml-4 pl-3 border-l border-purple-400/20 text-[11px] text-white/30 font-mono leading-relaxed whitespace-pre-wrap max-h-48 overflow-y-auto">
              {block.content}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ToolCallBlockView({ block }: { block: ToolCallBlock }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="mb-2 bg-[#0d0d0d] border border-white/[0.06] rounded-lg overflow-hidden">
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-white/[0.02] transition-colors"
      >
        <span className="text-white/35">{getToolIcon(block.tool)}</span>
        <span className="flex-1 text-[12px] text-white/60 font-mono truncate">
          {getToolLabel(block.tool, block.args)}
        </span>
        {block.result
          ? <Check size={10} className="text-green-400 shrink-0" />
          : <Loader2 size={10} className="text-white/25 animate-spin shrink-0" />
        }
        {block.result && (expanded ? <ChevronUp size={10} className="text-white/25 shrink-0" /> : <ChevronDown size={10} className="text-white/25 shrink-0" />)}
      </button>
      <AnimatePresence>
        {expanded && block.result && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: "auto" }}
            exit={{ height: 0 }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-2.5 pt-0.5 border-t border-white/[0.05]">
              <pre className="text-[11px] text-white/40 font-mono whitespace-pre-wrap leading-relaxed max-h-32 overflow-y-auto">
                {block.result}
              </pre>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function renderMarkdown(text: string): string {
  return text
    .replace(/```(\w*)\n?([\s\S]*?)```/g, (_, lang, code) =>
      `<div class="code-block" data-lang="${lang}"><pre><code>${code.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</code></pre></div>`
    )
    .replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\*([^*]+)\*/g, "<em>$1</em>")
    .replace(/^### (.+)$/gm, "<h3>$1</h3>")
    .replace(/^## (.+)$/gm, "<h2>$1</h2>")
    .replace(/^# (.+)$/gm, "<h1>$1</h1>")
    .replace(/^\- (.+)$/gm, "<li>$1</li>")
    .replace(/\n\n/g, "<br/><br/>");
}

function MessageView({
  message,
  onToggleThought,
}: {
  message: Message;
  onToggleThought: (msgId: string, blockIdx: number) => void;
}) {
  if (message.role === "user") {
    return (
      <div className="flex justify-end mb-4">
        <div className="max-w-[85%] bg-[#1a1a2e] border border-blue-400/15 rounded-2xl rounded-tr-sm px-4 py-3">
          <p className="text-[13.5px] text-white/85 leading-relaxed whitespace-pre-wrap">
            {(message.blocks[0] as TextBlock)?.content ?? ""}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-4">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-5 h-5 rounded-full bg-blue-500/20 border border-blue-400/20 flex items-center justify-center">
          <Bot size={10} className="text-blue-400" />
        </div>
        <span className="text-[11px] text-white/25">
          Antigravity{message.model ? ` · ${message.model.replace("gemini-", "Gemini ")}` : ""}
        </span>
        {message.iterations && message.iterations > 1 && (
          <span className="text-[10px] text-white/20">{message.iterations} steps</span>
        )}
      </div>

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
          return (
            <div
              key={i}
              className="text-[13.5px] text-white/80 leading-relaxed ai-markdown"
              dangerouslySetInnerHTML={{ __html: renderMarkdown(block.content) }}
            />
          );
        }
        if (block.type === "error") {
          return (
            <div key={i} className="flex items-start gap-2 bg-red-500/10 border border-red-400/20 rounded-xl px-3 py-2.5 text-[12px] text-red-300">
              <AlertCircle size={12} className="mt-0.5 shrink-0" />
              {block.content}
            </div>
          );
        }
        return null;
      })}
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
  const [mode, setMode] = useState<"chat" | "agent">("agent");

  const abortRef = useRef<(() => void) | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const hasKey = hasBYOKKey("gemini");
  const currentModel = GEMINI_MODELS.find(m => m.id === selectedModel) ?? GEMINI_MODELS[0];

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const addBlock = useCallback((msgId: string, block: MessageBlock) => {
    setMessages(prev => prev.map(m => {
      if (m.id !== msgId) return m;

      if (block.type === "tool_call") {
        const existingIdx = m.blocks.findIndex(
          b => b.type === "tool_call" &&
            (b as ToolCallBlock).tool === block.tool &&
            !(b as ToolCallBlock).result
        );
        if (existingIdx !== -1) {
          const updated = [...m.blocks];
          (updated[existingIdx] as ToolCallBlock).result = block.result;
          return { ...m, blocks: updated };
        }
      }
      return { ...m, blocks: [...m.blocks, block] };
    }));
  }, []);

  const handleSend = useCallback(async () => {
    const q = input.trim();
    if (!q || streaming) return;
    if (!hasKey) { onOpenBYOK(); return; }

    const apiKey = getBYOKKey("gemini");
    setInput("");
    setStreaming(true);

    const userMsg: Message = {
      id: `u-${Date.now()}`,
      role: "user",
      blocks: [{ type: "text", content: q }],
    };
    const assistantMsgId = `a-${Date.now()}`;
    const assistantMsg: Message = {
      id: assistantMsgId,
      role: "assistant",
      blocks: [],
      model: selectedModel,
    };

    setMessages(prev => [...prev, userMsg, assistantMsg]);

    const endpoint = mode === "agent" ? "/api/gemini/agent" : "/api/gemini/chat";

    let aborted = false;
    const controller = new AbortController();
    abortRef.current = () => { aborted = true; controller.abort(); };

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Gemini-Key": apiKey,
        },
        body: JSON.stringify({ query: q, model: selectedModel }),
        signal: controller.signal,
      });

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      if (!reader) throw new Error("No response stream");

      let buffer = "";
      let currentToolCallBlock: ToolCallBlock | null = null;

      while (true) {
        const { done, value } = await reader.read();
        if (done || aborted) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6);
          let event: Record<string, unknown>;
          try { event = JSON.parse(jsonStr) as Record<string, unknown>; }
          catch { continue; }

          switch (event.type) {
            case "thinking_start":
              break;
            case "thought":
              addBlock(assistantMsgId, {
                type: "thought",
                content: event.content as string,
                expanded: false,
              });
              break;
            case "tool_call":
              currentToolCallBlock = {
                type: "tool_call",
                tool: event.tool as string,
                args: (event.args as Record<string, unknown>) ?? {},
              };
              addBlock(assistantMsgId, currentToolCallBlock);
              break;
            case "tool_result":
              if (currentToolCallBlock) {
                addBlock(assistantMsgId, {
                  type: "tool_call",
                  tool: event.tool as string,
                  args: currentToolCallBlock.args,
                  result: event.output as string,
                });
                currentToolCallBlock = null;
              }
              break;
            case "chunk":
            case "text":
              addBlock(assistantMsgId, {
                type: "text",
                content: event.content as string,
              });
              break;
            case "error":
              addBlock(assistantMsgId, {
                type: "error",
                content: event.error as string,
              });
              break;
            case "done":
              setMessages(prev => prev.map(m =>
                m.id === assistantMsgId
                  ? { ...m, iterations: event.iterations_used as number | undefined }
                  : m
              ));
              break;
          }
        }
      }
    } catch (e: unknown) {
      if (!aborted) {
        addBlock(assistantMsgId, {
          type: "error",
          content: e instanceof Error ? e.message : String(e),
        });
      }
    } finally {
      setStreaming(false);
      abortRef.current = null;
    }
  }, [input, streaming, hasKey, selectedModel, mode, addBlock, onOpenBYOK]);

  const handleToggleThought = useCallback((msgId: string, blockIdx: number) => {
    setMessages(prev => prev.map(m => {
      if (m.id !== msgId) return m;
      const blocks = [...m.blocks];
      const b = blocks[blockIdx];
      if (b && b.type === "thought") {
        blocks[blockIdx] = { ...b, expanded: !b.expanded };
      }
      return { ...m, blocks };
    }));
  }, []);

  return (
    <div className="flex flex-col h-full bg-[#0a0a0a]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.07] shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 bg-blue-500/15 border border-blue-400/20 rounded-lg flex items-center justify-center">
            <span className="text-[14px]">💎</span>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[13px] font-semibold text-white">Antigravity</span>
              <span className="text-[10px] text-white/25 font-medium">by OpenGravity</span>
            </div>
            <div className="text-[11px] text-white/30">Gemini BYOK Agent</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Mode toggle */}
          <div className="flex items-center bg-white/[0.04] border border-white/[0.07] rounded-lg p-0.5">
            {(["chat", "agent"] as const).map(m => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={cn(
                  "px-2.5 py-1 text-[11px] rounded-md transition-all capitalize",
                  mode === m
                    ? "bg-blue-500/20 text-blue-300 font-medium"
                    : "text-white/35 hover:text-white/55"
                )}
              >
                {m === "agent" ? "🤖 Agent" : "💬 Chat"}
              </button>
            ))}
          </div>
          <BYOKBadge provider="gemini" onClick={onOpenBYOK} />
        </div>
      </div>

      {/* No key warning */}
      <AnimatePresence>
        {!hasKey && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: "auto" }}
            exit={{ height: 0 }}
            className="overflow-hidden shrink-0"
          >
            <div
              className="flex items-center gap-2 px-4 py-2.5 bg-amber-500/8 border-b border-amber-400/15 text-[12px] text-amber-300 cursor-pointer hover:bg-amber-500/12 transition-colors"
              onClick={onOpenBYOK}
            >
              <Key size={12} className="shrink-0" />
              <span>Add your Gemini API key to start chatting</span>
              <ChevronDown size={11} className="ml-auto rotate-[-90deg]" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
            <div className="w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-400/15 flex items-center justify-center">
              <span className="text-3xl">💎</span>
            </div>
            <div>
              <h3 className="text-[14px] font-semibold text-white/80 mb-1">Antigravity Agent</h3>
              <p className="text-[12px] text-white/35 max-w-[260px] leading-relaxed">
                Powered by Google Gemini with your own API key.
                {mode === "agent"
                  ? " Can run commands, write files, and build full projects."
                  : " Direct chat with Gemini's thinking models."}
              </p>
            </div>
            <div className="flex flex-wrap gap-1.5 justify-center max-w-[300px]">
              {["Build a React component", "Fix this bug", "Explain this code", "Create a REST API"].map(s => (
                <button
                  key={s}
                  onClick={() => setInput(s)}
                  className="px-2.5 py-1.5 bg-white/[0.04] hover:bg-white/[0.07] border border-white/[0.07] rounded-lg text-[11px] text-white/45 hover:text-white/65 transition-all"
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
              />
            ))}
            {streaming && (
              <div className="flex items-center gap-2 text-[12px] text-white/30 mb-4">
                <Loader2 size={12} className="animate-spin text-blue-400" />
                <span>Antigravity is working...</span>
              </div>
            )}
          </>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="shrink-0 border-t border-white/[0.07] p-3">
        {/* Model selector */}
        <div className="relative mb-2">
          <button
            onClick={() => setShowModelPicker(p => !p)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white/[0.04] hover:bg-white/[0.06] border border-white/[0.07] rounded-lg text-[11px] text-white/45 hover:text-white/65 transition-all"
          >
            <span className="text-[10px]">💎</span>
            <span>Gemini {currentModel.name}</span>
            <span className="px-1 py-0.5 bg-blue-500/15 text-blue-300 rounded text-[9px]">{currentModel.badge}</span>
            <ChevronDown size={10} className={cn("transition-transform", showModelPicker && "rotate-180")} />
          </button>

          <AnimatePresence>
            {showModelPicker && (
              <motion.div
                initial={{ opacity: 0, y: -4, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -4, scale: 0.98 }}
                transition={{ duration: 0.15 }}
                className="absolute bottom-full mb-1.5 left-0 w-64 bg-[#111] border border-white/[0.1] rounded-xl shadow-xl overflow-hidden z-50"
              >
                {GEMINI_MODELS.map(m => (
                  <button
                    key={m.id}
                    onClick={() => { setSelectedModel(m.id); setShowModelPicker(false); }}
                    className={cn(
                      "w-full flex items-center gap-2.5 px-3 py-2.5 text-left hover:bg-white/[0.04] transition-colors",
                      selectedModel === m.id && "bg-blue-500/8"
                    )}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[12px] text-white/75 font-medium">Gemini {m.name}</span>
                        <span className="px-1.5 py-0.5 bg-blue-500/15 text-blue-300 border border-blue-400/20 rounded text-[9px]">{m.badge}</span>
                      </div>
                      <div className="text-[11px] text-white/30">{m.desc}</div>
                    </div>
                    {selectedModel === m.id && <Check size={12} className="text-blue-400 shrink-0" />}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Text input */}
        <div className="flex items-end gap-2">
          <div className="flex-1 bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 focus-within:border-blue-400/30 transition-colors">
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder={
                !hasKey ? "Add your Gemini API key first..." :
                mode === "agent" ? "Ask Antigravity to build something..." :
                "Chat with Gemini..."
              }
              disabled={!hasKey}
              className="w-full bg-transparent text-[13px] text-white placeholder:text-white/20 resize-none outline-none max-h-32 leading-relaxed"
              rows={1}
              style={{ height: "auto", minHeight: "24px" }}
              onInput={e => {
                const t = e.target as HTMLTextAreaElement;
                t.style.height = "auto";
                t.style.height = `${Math.min(t.scrollHeight, 128)}px`;
              }}
            />
          </div>
          {streaming ? (
            <button
              onClick={() => abortRef.current?.()}
              className="w-9 h-9 flex items-center justify-center bg-red-500/15 hover:bg-red-500/25 border border-red-400/20 rounded-xl text-red-400 transition-all shrink-0"
            >
              <Square size={13} />
            </button>
          ) : (
            <button
              onClick={handleSend}
              disabled={!input.trim() || !hasKey}
              className="w-9 h-9 flex items-center justify-center bg-blue-500/20 hover:bg-blue-500/30 border border-blue-400/25 hover:border-blue-400/40 disabled:opacity-30 disabled:cursor-not-allowed rounded-xl text-blue-300 transition-all shrink-0"
            >
              <Send size={13} />
            </button>
          )}
        </div>

        {messages.length > 0 && (
          <div className="flex items-center justify-between mt-2">
            <button
              onClick={() => setMessages([])}
              className="flex items-center gap-1 text-[10px] text-white/20 hover:text-white/40 transition-colors"
            >
              <Trash2 size={9} />
              Clear chat
            </button>
            <span className="text-[10px] text-white/15">
              {messages.filter(m => m.role === "user").length} turns
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
