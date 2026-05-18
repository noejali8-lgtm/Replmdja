import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "wouter";
import {
  ArrowLeft, Send, Terminal, Folder, File, Play, Square,
  Loader2, ChevronRight, ChevronDown, Zap, Globe, Brain,
  Code2, RefreshCw, Trash2, Copy, Check, AlertTriangle,
  Sparkles, Settings, Eye, Key,
} from "lucide-react";
import { cn } from "@/lib/utils";

const BASE_URL = import.meta.env.BASE_URL?.replace(/\/$/, "") || "";

interface Message { role: "user" | "agent"; content: string; tool?: string; isThinking?: boolean; }
interface FileNode { name: string; content: string; language: string; }

const DEMO_FILES: FileNode[] = [
  { name: "index.html", language: "html", content: `<!DOCTYPE html>\n<html>\n<head>\n  <title>My App</title>\n</head>\n<body>\n  <h1>Hello World</h1>\n</body>\n</html>` },
  { name: "style.css", language: "css", content: `body {\n  font-family: sans-serif;\n  background: #0d1117;\n  color: white;\n}` },
  { name: "app.js", language: "javascript", content: `// Main application\nconsole.log("App started");` },
];

const AGENT_PROMPTS = [
  "Build a todo app with React and Tailwind",
  "Create a landing page for a SaaS product",
  "Write a Python web scraper",
  "Build a REST API with Express",
  "Create a data visualization dashboard",
];

export default function OpenGravityPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "agent",
      content: "**OpenGravity Agent online.** I'm your autonomous AI engineer. I can plan, build, and iterate on software projects. I'll execute tasks proactively — no hand-holding needed.\n\nWhat shall we build?",
    },
  ]);
  const [input, setInput] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const [apiKey, setApiKey] = useState(() => localStorage.getItem("opengravity_api_key") ?? "");
  const [showKeyInput, setShowKeyInput] = useState(false);
  const [files, setFiles] = useState<FileNode[]>(DEMO_FILES);
  const [activeFile, setActiveFile] = useState<FileNode | null>(null);
  const [terminalLines, setTerminalLines] = useState<{ text: string; type: "cmd" | "out" | "err" | "ok" }[]>([
    { text: "OpenGravity Terminal v1.0 — WebContainer mode", type: "out" },
    { text: "$ ready", type: "ok" },
  ]);
  const [showTerminal, setShowTerminal] = useState(false);
  const [provider, setProvider] = useState<"anthropic" | "gemini" | "openrouter">("anthropic");
  const [geminiKey, setGeminiKey] = useState(() => localStorage.getItem("opengravity_gemini_key") ?? "");
  const [copiedFile, setCopiedFile] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const addTerminalLine = (text: string, type: "cmd" | "out" | "err" | "ok" = "out") => {
    setTerminalLines(prev => [...prev.slice(-50), { text, type }]);
  };

  const callAgent = useCallback(async (userInput: string) => {
    if (isThinking) return;
    setIsThinking(true);
    setMessages(prev => [
      ...prev,
      { role: "user", content: userInput },
      { role: "agent", content: "", isThinking: true },
    ]);

    try {
      const history = messages.slice(-8).map(m => ({
        role: m.role === "agent" ? "assistant" as const : "user" as const,
        content: m.content || "(thinking...)",
      }));

      if (provider === "anthropic") {
        const res = await fetch(`${BASE_URL}/api/jarvis/chat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            stream: true,
            messages: [
              ...history,
              { role: "user", content: `You are OpenGravity, an autonomous AI software engineer. The user said: ${userInput}\n\nRespond as an agent: explain what you're doing, what files you'd create/edit, and what commands you'd run. Use markdown. Be specific and technical.` },
            ],
          }),
        });

        if (res.ok && res.body) {
          const reader = res.body.getReader();
          const decoder = new TextDecoder();
          let fullText = "";

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            const chunk = decoder.decode(value);
            const lines = chunk.split("\n");
            for (const line of lines) {
              if (line.startsWith("data: ")) {
                try {
                  const data = JSON.parse(line.slice(6)) as { token?: string; done?: boolean; error?: string };
                  if (data.token) {
                    fullText += data.token;
                    setMessages(prev => {
                      const next = [...prev];
                      const last = next[next.length - 1];
                      if (last?.isThinking) next[next.length - 1] = { ...last, content: fullText, isThinking: false };
                      else if (last?.role === "agent") next[next.length - 1] = { ...last, content: fullText };
                      return next;
                    });
                  }
                } catch { /* ignore */ }
              }
            }
          }

          if (!fullText) {
            setMessages(prev => {
              const next = [...prev];
              next[next.length - 1] = { role: "agent", content: "⚠️ No response from agent. Check your API configuration.", isThinking: false };
              return next;
            });
          }

          const lower = userInput.toLowerCase();
          if (lower.includes("create") || lower.includes("build") || lower.includes("write") || lower.includes("make")) {
            const newFile: FileNode = {
              name: lower.includes("react") ? "App.tsx" : lower.includes("python") ? "main.py" : lower.includes("css") ? "style.css" : "output.js",
              language: lower.includes("react") || lower.includes("typescript") ? "typescript" : lower.includes("python") ? "python" : lower.includes("css") ? "css" : "javascript",
              content: `// Generated by OpenGravity Agent\n// Task: ${userInput}\n\n// Code will appear here as the agent builds it...`,
            };
            setFiles(prev => {
              const existing = prev.findIndex(f => f.name === newFile.name);
              if (existing >= 0) { const next = [...prev]; next[existing] = newFile; return next; }
              return [...prev, newFile];
            });
            setActiveFile(newFile);
            addTerminalLine(`$ agent created ${newFile.name}`, "cmd");
            addTerminalLine(`✓ ${newFile.name} — ${newFile.language}`, "ok");
          }
        }
      } else if (provider === "gemini" && geminiKey) {
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [
              ...history.map(m => ({ role: m.role === "assistant" ? "model" : "user", parts: [{ text: m.content }] })),
              { role: "user", parts: [{ text: `You are OpenGravity, an autonomous AI software engineer. ${userInput}` }] },
            ],
          }),
        });
        const data = await res.json() as { candidates?: { content?: { parts?: { text: string }[] } }[] };
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "No response from Gemini.";
        setMessages(prev => { const next = [...prev]; next[next.length - 1] = { role: "agent", content: text, isThinking: false }; return next; });
      } else {
        setMessages(prev => { const next = [...prev]; next[next.length - 1] = { role: "agent", content: "⚠️ Please configure an API key in settings to use OpenGravity agent.", isThinking: false }; return next; });
        setShowKeyInput(true);
      }
    } catch (err) {
      setMessages(prev => { const next = [...prev]; next[next.length - 1] = { role: "agent", content: `❌ Agent error: ${String(err)}`, isThinking: false }; return next; });
    }

    setIsThinking(false);
  }, [isThinking, messages, provider, geminiKey]);

  const handleSend = () => {
    const text = input.trim();
    if (!text || isThinking) return;
    setInput("");
    callAgent(text);
  };

  const copyFile = (file: FileNode) => {
    navigator.clipboard.writeText(file.content).catch(() => {});
    setCopiedFile(file.name);
    setTimeout(() => setCopiedFile(null), 1500);
  };

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
              <p className="text-base font-bold text-white">OpenGravity</p>
              <span className="text-[9px] bg-blue-500/15 border border-blue-400/20 text-blue-300 px-2 py-0.5 rounded-full font-mono">AGENT IDE</span>
            </div>
            <p className="text-[11px] text-white/35">Agentic workspace · Zero install · BYOK</p>
          </div>
          <button
            onClick={() => setShowKeyInput(v => !v)}
            className={cn(
              "w-9 h-9 flex items-center justify-center rounded-xl border transition-colors",
              (provider === "gemini" && geminiKey) || provider === "anthropic"
                ? "border-emerald-400/25 bg-emerald-500/10 text-emerald-400"
                : "border-white/10 bg-white/5 text-white/40 hover:text-white"
            )}
          >
            <Key size={16} />
          </button>
        </div>

        {/* Provider + key setup */}
        <AnimatePresence>
          {showKeyInput && (
            <motion.div
              initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden mt-3"
            >
              <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-3 space-y-2">
                <p className="text-[10px] font-semibold text-white/50 uppercase tracking-widest">AI Provider</p>
                <div className="flex gap-2">
                  {[
                    { id: "anthropic", label: "Claude (built-in)", color: "text-violet-300" },
                    { id: "gemini", label: "Gemini BYOK", color: "text-blue-300" },
                  ].map(p => (
                    <button
                      key={p.id}
                      onClick={() => setProvider(p.id as typeof provider)}
                      className={cn(
                        "flex-1 text-[11px] font-semibold py-2 px-3 rounded-xl border transition-all",
                        provider === p.id
                          ? "bg-white/[0.08] border-white/20 text-white"
                          : "bg-transparent border-white/[0.06] text-white/35 hover:text-white/60"
                      )}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
                {provider === "gemini" && (
                  <input
                    value={geminiKey}
                    onChange={e => { setGeminiKey(e.target.value); localStorage.setItem("opengravity_gemini_key", e.target.value); }}
                    placeholder="Gemini API Key (AIza...)"
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-[11px] text-white placeholder-white/25 outline-none font-mono"
                  />
                )}
                {provider === "anthropic" && (
                  <div className="flex items-center gap-2 text-[10px] text-emerald-300 bg-emerald-500/8 border border-emerald-400/15 rounded-xl px-3 py-2">
                    <Zap size={11} />
                    Using Replit's built-in Anthropic integration — no key needed
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* File explorer */}
      <div className="mx-4 mt-3">
        <div className="bg-[#161b22] border border-white/[0.07] rounded-2xl overflow-hidden">
          <div className="flex items-center gap-2 px-3 py-2 border-b border-white/[0.06] bg-white/[0.02]">
            <Folder size={12} className="text-yellow-400" />
            <span className="text-[11px] font-semibold text-white/60">Workspace</span>
            <span className="ml-auto text-[9px] font-mono text-white/25">{files.length} files</span>
          </div>
          <div className="flex flex-wrap gap-1 p-2">
            {files.map(file => (
              <button
                key={file.name}
                onClick={() => setActiveFile(activeFile?.name === file.name ? null : file)}
                className={cn(
                  "flex items-center gap-1.5 text-[10px] px-2.5 py-1.5 rounded-lg border transition-all",
                  activeFile?.name === file.name
                    ? "bg-white/[0.10] border-white/20 text-white"
                    : "bg-transparent border-white/[0.06] text-white/50 hover:text-white/80"
                )}
              >
                <File size={10} />
                {file.name}
              </button>
            ))}
          </div>

          {/* Active file viewer */}
          <AnimatePresence>
            {activeFile && (
              <motion.div
                initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden border-t border-white/[0.06]"
              >
                <div className="flex items-center gap-2 px-3 py-2 bg-white/[0.02]">
                  <span className="text-[10px] font-mono text-sky-400 flex-1">{activeFile.name}</span>
                  <button onClick={() => copyFile(activeFile)} className="text-white/30 hover:text-white transition-colors">
                    {copiedFile === activeFile.name ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                  </button>
                </div>
                <pre className="px-3 py-2 text-[10px] font-mono text-emerald-300/80 whitespace-pre-wrap leading-relaxed max-h-40 overflow-y-auto bg-[#0a0e14]">
                  {activeFile.content}
                </pre>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Chat / agent messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.map((msg, i) => (
          <div key={i} className={cn("flex", msg.role === "user" ? "justify-end" : "justify-start")}>
            {msg.role === "agent" && (
              <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center shrink-0 mr-2 mt-0.5">
                <Brain size={13} className="text-white" />
              </div>
            )}
            <div className={cn(
              "max-w-[85%] rounded-2xl px-3.5 py-2.5 text-[12px] leading-relaxed",
              msg.role === "user"
                ? "bg-white/[0.08] border border-white/[0.12] text-white"
                : "bg-[#161b22] border border-white/[0.07] text-white/85"
            )}>
              {msg.isThinking ? (
                <div className="flex items-center gap-2 text-white/40">
                  <Loader2 size={12} className="animate-spin" />
                  <span className="text-[11px] font-mono animate-pulse">Agent reasoning...</span>
                </div>
              ) : (
                <div className="whitespace-pre-wrap">{msg.content}</div>
              )}
            </div>
          </div>
        ))}

        {/* Quick prompts */}
        {messages.length === 1 && (
          <div className="space-y-2">
            <p className="text-[10px] text-white/25 text-center font-mono">Quick start</p>
            <div className="flex flex-col gap-1.5">
              {AGENT_PROMPTS.map(p => (
                <button
                  key={p}
                  onClick={() => callAgent(p)}
                  className="text-left text-[11px] text-white/50 hover:text-white/80 bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.06] rounded-xl px-3 py-2 transition-all flex items-center gap-2"
                >
                  <Sparkles size={11} className="text-blue-400 shrink-0" />
                  {p}
                </button>
              ))}
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Terminal */}
      <AnimatePresence>
        {showTerminal && (
          <motion.div
            initial={{ height: 0 }} animate={{ height: 200 }} exit={{ height: 0 }}
            className="overflow-hidden border-t border-white/[0.08] bg-black/60"
          >
            <div className="flex items-center gap-2 px-3 py-2 border-b border-white/[0.06] bg-[#0d1117]/80">
              <Terminal size={11} className="text-emerald-400" />
              <span className="text-[10px] font-mono text-white/40">WebContainer Terminal</span>
              <button onClick={() => setTerminalLines([{ text: "Terminal cleared", type: "out" }])} className="ml-auto text-white/20 hover:text-white/50">
                <Trash2 size={11} />
              </button>
            </div>
            <div className="overflow-y-auto h-[calc(200px-36px)] p-2 font-mono text-[10px] space-y-0.5">
              {terminalLines.map((line, i) => (
                <div key={i} className={cn(
                  line.type === "cmd" ? "text-white" :
                  line.type === "ok" ? "text-emerald-400" :
                  line.type === "err" ? "text-red-400" : "text-white/50"
                )}>
                  {line.text}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input area */}
      <div className="sticky bottom-0 bg-[#0d1117]/95 backdrop-blur border-t border-white/[0.06] px-4 py-3 space-y-2">
        <div className="flex items-end gap-2">
          <div className="flex-1 bg-[#161b22] border border-white/[0.10] rounded-2xl px-3.5 py-2.5">
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
              placeholder="Tell the agent what to build..."
              disabled={isThinking}
              rows={1}
              className="w-full bg-transparent text-[13px] text-white placeholder-white/25 outline-none resize-none min-h-[20px] max-h-[80px] overflow-y-auto disabled:opacity-50"
              style={{ height: "auto" }}
            />
          </div>
          <button
            onClick={handleSend}
            disabled={!input.trim() || isThinking}
            className="w-10 h-10 flex items-center justify-center bg-blue-600/80 hover:bg-blue-600 border border-blue-500/40 rounded-2xl text-white transition-all disabled:opacity-40 active:scale-95"
          >
            {isThinking ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
          </button>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowTerminal(v => !v)}
            className={cn("flex items-center gap-1.5 text-[10px] px-3 py-1.5 rounded-xl border transition-all",
              showTerminal ? "bg-emerald-500/15 border-emerald-400/25 text-emerald-300" : "bg-transparent border-white/[0.08] text-white/35 hover:text-white/60"
            )}
          >
            <Terminal size={11} />
            Terminal
          </button>
          <button
            onClick={() => { setMessages([{ role: "agent", content: "**OpenGravity Agent reset.** What shall we build?" }]); setFiles(DEMO_FILES); setActiveFile(null); setTerminalLines([{ text: "$ workspace cleared", type: "cmd" }]); }}
            className="flex items-center gap-1.5 text-[10px] px-3 py-1.5 rounded-xl border border-white/[0.08] text-white/35 hover:text-white/60 transition-all"
          >
            <RefreshCw size={11} />
            Reset
          </button>
          <span className="ml-auto text-[9px] font-mono text-white/20">
            {provider === "anthropic" ? "Claude" : "Gemini"} · {messages.length - 1} msgs
          </span>
        </div>
      </div>
    </motion.div>
  );
}
