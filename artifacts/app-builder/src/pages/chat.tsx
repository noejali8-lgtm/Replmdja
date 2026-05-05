import { useState, useEffect, useRef, useCallback } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowUp, ArrowLeft, Plus, CheckCircle2, Circle, Loader2,
  Play, Monitor, Globe, Layers, Search, LayoutPanelLeft,
  Lock, Database, UserPlus, ChevronDown, Folder, X, RotateCcw
} from "lucide-react";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  isStreaming?: boolean;
}

interface BuildStep {
  id: string;
  label: string;
  status: "pending" | "active" | "done";
}

type AgentMode = "Core+" | "Power" | "Economy" | "Lite";

const BASE_URL = import.meta.env.BASE_URL?.replace(/\/$/, "") || "";

const BUILD_STEPS: BuildStep[] = [
  { id: "analyze", label: "Analyzing your idea", status: "pending" },
  { id: "plan", label: "Creating project plan", status: "pending" },
  { id: "setup", label: "Setting up environment", status: "pending" },
  { id: "build", label: "Generating code", status: "pending" },
  { id: "deps", label: "Installing dependencies", status: "pending" },
  { id: "preview", label: "Launching preview", status: "pending" },
];

const AGENT_MODES: { id: AgentMode; label: string; desc: string; color: string; badge?: string }[] = [
  { id: "Core+", label: "Core+", desc: "Latest & most capable models. Best quality.", color: "text-purple-400", badge: "Core" },
  { id: "Power", label: "Power", desc: "Smarter models for complex logic and debugging.", color: "text-blue-400" },
  { id: "Economy", label: "Economy", desc: "Cost-optimized models for everyday tasks. Delivers a strong balance of speed and quality. Best mode for most builds.", color: "text-foreground" },
  { id: "Lite", label: "Lite", desc: "Fast and lightweight. Great for simple edits.", color: "text-muted-foreground" },
];

function ThinkingDots() {
  return (
    <div className="flex items-center gap-1.5 px-4 py-3" data-testid="thinking-indicator">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="w-2 h-2 rounded-full bg-primary"
          animate={{ scale: [1, 1.4, 1], opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
        />
      ))}
    </div>
  );
}

function BuildProgress({ steps }: { steps: BuildStep[] }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col gap-2 px-1 py-2"
      data-testid="build-progress"
    >
      {steps.map((step) => (
        <motion.div
          key={step.id}
          className="flex items-center gap-3"
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
        >
          {step.status === "done" ? (
            <CheckCircle2 size={16} className="text-green-400 shrink-0" />
          ) : step.status === "active" ? (
            <Loader2 size={16} className="text-primary animate-spin shrink-0" />
          ) : (
            <Circle size={16} className="text-muted-foreground/40 shrink-0" />
          )}
          <span className={cn(
            "text-sm",
            step.status === "done" ? "text-green-400"
              : step.status === "active" ? "text-foreground"
              : "text-muted-foreground/50"
          )}>
            {step.label}
          </span>
        </motion.div>
      ))}
    </motion.div>
  );
}

function MessageBubble({ msg }: { msg: Message }) {
  const isUser = msg.role === "user";
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn("flex w-full", isUser ? "justify-end" : "justify-start")}
    >
      {!isUser && (
        <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center mr-2 mt-0.5 shrink-0">
          <span className="text-primary-foreground text-xs font-bold">A</span>
        </div>
      )}
      <div
        className={cn(
          "max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed",
          isUser
            ? "bg-primary text-primary-foreground rounded-br-sm"
            : "bg-card border border-card-border text-foreground rounded-bl-sm"
        )}
        data-testid={`message-${msg.role}-${msg.id}`}
      >
        {isUser ? (
          <p className="whitespace-pre-wrap">{msg.content}</p>
        ) : (
          <div className="prose prose-sm prose-invert max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
            <ReactMarkdown>{msg.content}</ReactMarkdown>
          </div>
        )}
        {msg.isStreaming && (
          <motion.span
            className="inline-block w-0.5 h-4 bg-foreground ml-0.5 align-middle"
            animate={{ opacity: [1, 0] }}
            transition={{ duration: 0.6, repeat: Infinity }}
          />
        )}
      </div>
    </motion.div>
  );
}

export default function Chat() {
  const [, setLocation] = useLocation();
  const [conversationId, setConversationId] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const [buildSteps, setBuildSteps] = useState<BuildStep[]>([]);
  const [showBuildProgress, setShowBuildProgress] = useState(false);
  const [initialPrompt] = useState(() => sessionStorage.getItem("chat_prompt") || "");
  const [agentMode, setAgentMode] = useState<AgentMode>("Economy");
  const [showModes, setShowModes] = useState(false);
  const [showFileSearch, setShowFileSearch] = useState(false);
  const [fileSearch, setFileSearch] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const hasInitialized = useRef(false);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => { scrollToBottom(); }, [messages, isThinking, scrollToBottom]);

  const runBuildAnimation = useCallback((): Promise<void> => {
    return new Promise((resolve) => {
      const steps = BUILD_STEPS.map((s) => ({ ...s }));
      setBuildSteps(steps);
      setShowBuildProgress(true);
      let stepIdx = 0;
      const advance = () => {
        if (stepIdx >= steps.length) { resolve(); return; }
        steps[stepIdx].status = "active";
        setBuildSteps([...steps]);
        setTimeout(() => {
          steps[stepIdx].status = "done";
          setBuildSteps([...steps]);
          stepIdx++;
          setTimeout(advance, 300);
        }, 700 + Math.random() * 500);
      };
      setTimeout(advance, 400);
    });
  }, []);

  const sendMessage = useCallback(async (content: string, convId: number) => {
    setIsThinking(true);
    setShowBuildProgress(false);
    const assistantMsgId = `assistant-${Date.now()}`;
    let isFirst = true;
    try {
      const response = await fetch(
        `${BASE_URL}/api/anthropic/conversations/${convId}/messages`,
        { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ content }) }
      );
      if (!response.ok || !response.body) throw new Error("Stream request failed");
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const data = JSON.parse(line.slice(6));
            if (data.content) {
              if (isFirst) {
                setIsThinking(false);
                setMessages((prev) => [...prev, { id: assistantMsgId, role: "assistant", content: data.content, isStreaming: true }]);
                isFirst = false;
              } else {
                setMessages((prev) => prev.map((m) => m.id === assistantMsgId ? { ...m, content: m.content + data.content } : m));
              }
            }
            if (data.done) {
              setMessages((prev) => prev.map((m) => m.id === assistantMsgId ? { ...m, isStreaming: false } : m));
            }
          } catch { /* ignore */ }
        }
      }
    } catch {
      setIsThinking(false);
      setMessages((prev) => [...prev, { id: assistantMsgId, role: "assistant", content: "Sorry, something went wrong. Please try again." }]);
    }
  }, []);

  const startConversation = useCallback(async (prompt: string) => {
    const userMsgId = `user-${Date.now()}`;
    setMessages([{ id: userMsgId, role: "user", content: prompt }]);
    setIsThinking(true);
    try {
      const convRes = await fetch(`${BASE_URL}/api/anthropic/conversations`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: prompt.slice(0, 80) }),
      });
      if (!convRes.ok) throw new Error("Failed to create conversation");
      const conv = await convRes.json();
      setConversationId(conv.id);
      await runBuildAnimation();
      await sendMessage(prompt, conv.id);
    } catch {
      setIsThinking(false);
      setMessages((prev) => [...prev, { id: `err-${Date.now()}`, role: "assistant", content: "Failed to start conversation. Please try again." }]);
    }
  }, [runBuildAnimation, sendMessage]);

  useEffect(() => {
    if (hasInitialized.current) return;
    hasInitialized.current = true;
    if (initialPrompt) {
      sessionStorage.removeItem("chat_prompt");
      startConversation(initialPrompt);
    }
  }, [initialPrompt, startConversation]);

  const handleSubmit = async () => {
    const content = input.trim();
    if (!content || isThinking) return;
    setInput("");
    const userMsgId = `user-${Date.now()}`;
    setMessages((prev) => [...prev, { id: userMsgId, role: "user", content }]);
    if (!conversationId) { await startConversation(content); }
    else { await sendMessage(content, conversationId); }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSubmit(); }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex flex-col h-[100dvh] max-w-[480px] mx-auto w-full bg-background"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-10 pb-3 border-b border-border shrink-0">
        <button onClick={() => setLocation("/")} className="p-2 -ml-2 text-muted-foreground hover:text-foreground transition-colors" data-testid="button-back">
          <ArrowLeft size={20} />
        </button>
        <span className="text-sm font-medium text-muted-foreground truncate max-w-[200px]">
          {messages[0]?.content?.slice(0, 40) || "New Project"}
          {(messages[0]?.content?.length ?? 0) > 40 ? "..." : ""}
        </span>
        <button onClick={() => setLocation("/")} className="p-2 -mr-2 text-muted-foreground hover:text-foreground transition-colors" data-testid="button-new-chat">
          <Plus size={20} />
        </button>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 no-scrollbar">
        <AnimatePresence initial={false}>
          {messages.map((msg) => <MessageBubble key={msg.id} msg={msg} />)}
        </AnimatePresence>

        <AnimatePresence>
          {showBuildProgress && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex justify-start">
              <div className="flex gap-2">
                <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-primary-foreground text-xs font-bold">A</span>
                </div>
                <div className="bg-card border border-card-border rounded-2xl rounded-bl-sm px-4 py-3">
                  <BuildProgress steps={buildSteps} />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {isThinking && !showBuildProgress && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex justify-start">
              <div className="flex gap-2 items-start">
                <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-primary-foreground text-xs font-bold">A</span>
                </div>
                <div className="bg-card border border-card-border rounded-2xl rounded-bl-sm">
                  <ThinkingDots />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div ref={messagesEndRef} />
      </div>

      {/* Dev Tools Bar */}
      <div className="shrink-0 border-t border-border bg-card/60">
        <div className="flex items-stretch h-14">
          {[
            { icon: <Lock size={20} />, label: "Secrets", testId: "tool-secrets" },
            { icon: <Database size={20} />, label: "Database", testId: "tool-database" },
            { icon: <UserPlus size={20} />, label: "Auth", testId: "tool-auth" },
            { icon: <Plus size={20} />, label: "New Tab", testId: "tool-new-tab" },
          ].map((tool, i) => (
            <button
              key={tool.label}
              className={cn(
                "flex-1 flex flex-col items-center justify-center gap-0.5 text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors",
                i < 3 && "border-r border-border/50"
              )}
              data-testid={tool.testId}
            >
              {tool.icon}
              <span className="text-[10px] font-medium">{tool.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* File Search Bar */}
      <div className="shrink-0 border-t border-border/50 bg-background">
        <div className="flex items-center h-11 px-1 gap-1">
          <button
            className="w-9 h-9 flex items-center justify-center text-muted-foreground hover:text-foreground rounded-lg hover:bg-secondary/50 transition-colors"
            data-testid="button-files"
          >
            <Folder size={18} />
          </button>
          <div className="flex-1 flex items-center gap-2 bg-secondary/30 rounded-lg px-3 h-8">
            <Search size={14} className="text-muted-foreground shrink-0" />
            <input
              type="text"
              placeholder="Search..."
              value={fileSearch}
              onChange={e => setFileSearch(e.target.value)}
              className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
              data-testid="input-file-search"
            />
          </div>
          <button
            className="w-9 h-9 flex items-center justify-center text-muted-foreground hover:text-foreground rounded-lg hover:bg-secondary/50 transition-colors"
            onClick={() => setFileSearch("")}
            data-testid="button-close-search"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Input area with Agent Mode */}
      <div className="shrink-0 px-4 pb-4 pt-2 border-t border-border bg-background relative">
        {/* Agent Modes Panel */}
        <AnimatePresence>
          {showModes && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setShowModes(false)} />
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.97 }}
                transition={{ duration: 0.15 }}
                className="absolute bottom-full mb-1 left-4 right-4 z-40 bg-card border border-border rounded-2xl shadow-2xl overflow-hidden"
              >
                <div className="p-3">
                  <p className="text-xs text-muted-foreground font-semibold uppercase tracking-widest px-1 mb-2">Agent modes</p>
                  <div className="grid grid-cols-4 gap-1.5 mb-3">
                    {AGENT_MODES.map((mode) => (
                      <button
                        key={mode.id}
                        onClick={() => { setAgentMode(mode.id); setShowModes(false); }}
                        className={cn(
                          "relative px-2 py-2 rounded-xl text-sm font-semibold transition-all border",
                          agentMode === mode.id
                            ? "bg-secondary border-border text-foreground"
                            : "bg-transparent border-transparent text-muted-foreground hover:bg-secondary/50"
                        )}
                        data-testid={`agent-mode-${mode.id.toLowerCase().replace("+", "-plus")}`}
                      >
                        {mode.badge && (
                          <span className="absolute -top-1.5 -left-1 text-[9px] bg-purple-500 text-white px-1 rounded-sm font-bold leading-none py-0.5">
                            {mode.badge}
                          </span>
                        )}
                        <span className={mode.color}>{mode.id}</span>
                      </button>
                    ))}
                  </div>
                  <div className="px-2 py-2 bg-secondary/40 rounded-xl">
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {AGENT_MODES.find(m => m.id === agentMode)?.desc}
                    </p>
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        <div className="bg-card rounded-xl border border-card-border p-3 shadow-lg flex flex-col gap-3">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              e.target.style.height = "auto";
              e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
            }}
            onKeyDown={handleKeyDown}
            placeholder="Ask anything or describe what to build..."
            className="w-full bg-transparent resize-none outline-none text-foreground placeholder:text-muted-foreground min-h-[40px] max-h-[120px] text-sm"
            data-testid="input-chat"
            rows={1}
          />
          <div className="flex items-center justify-between">
            <button className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors border border-border" data-testid="button-attach">
              <Plus size={16} />
            </button>

            {/* Agent mode pill */}
            <button
              onClick={() => setShowModes(!showModes)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-secondary/50 border border-border hover:bg-secondary transition-colors"
              data-testid="button-agent-mode"
            >
              <span className="text-xs font-medium text-foreground">⠿ {agentMode}</span>
              <ChevronDown size={11} className="text-muted-foreground" />
            </button>

            <button
              onClick={handleSubmit}
              disabled={!input.trim() || isThinking}
              className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center transition-all",
                input.trim() && !isThinking
                  ? "bg-primary text-primary-foreground shadow-md hover:brightness-110"
                  : "bg-secondary text-muted-foreground opacity-50 cursor-not-allowed"
              )}
              data-testid="button-send-chat"
            >
              <ArrowUp size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Workspace Toolbar */}
      <div className="shrink-0 border-t border-border bg-card/80">
        <div className="flex items-center justify-around h-12 px-2">
          <button className="w-10 h-10 flex items-center justify-center text-muted-foreground hover:text-foreground rounded-lg hover:bg-secondary/50 transition-colors" data-testid="toolbar-run" title="Run">
            <Play size={20} />
          </button>
          <button className="w-10 h-10 flex items-center justify-center text-muted-foreground hover:text-foreground rounded-lg hover:bg-secondary/50 transition-colors" data-testid="toolbar-webview" title="Webview">
            <Monitor size={20} />
          </button>
          <button className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-secondary/50 transition-colors" data-testid="toolbar-agent" title="Agent">
            <div className="w-6 h-6 rounded-md bg-primary/20 border border-primary/40 flex items-center justify-center">
              <span className="text-primary text-[10px] font-bold">⠿</span>
            </div>
          </button>
          <button className="w-10 h-10 flex items-center justify-center text-muted-foreground hover:text-foreground rounded-lg hover:bg-secondary/50 transition-colors" data-testid="toolbar-deploy" title="Deploy">
            <Globe size={20} />
          </button>
          <button className="w-10 h-10 flex items-center justify-center text-muted-foreground hover:text-foreground rounded-lg hover:bg-secondary/50 transition-colors" data-testid="toolbar-new-tab" title="New Tab">
            <Plus size={20} />
          </button>
          <button className="w-10 h-10 flex items-center justify-center text-muted-foreground hover:text-foreground rounded-lg hover:bg-secondary/50 transition-colors" data-testid="toolbar-files" title="Files">
            <Layers size={20} />
          </button>
          <button className="w-10 h-10 flex items-center justify-center text-muted-foreground hover:text-foreground rounded-lg hover:bg-secondary/50 transition-colors" data-testid="toolbar-split" title="Split Screen">
            <LayoutPanelLeft size={20} />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
