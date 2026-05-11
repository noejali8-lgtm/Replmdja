import { useState, useRef, useEffect } from "react";
import { Sparkles, Send, X, Code2, FileText, Wrench, ChevronDown } from "lucide-react";
import ReactMarkdown from "react-markdown";

interface Message {
  role: "user" | "agent";
  text: string;
  isStreaming?: boolean;
}

interface AIPanelProps {
  currentFile?: string;
  currentCode?: string;
  language?: string;
  initialMessage?: string;
  onClose?: () => void;
}

const QUICK_ACTIONS = [
  { icon: <Code2 className="h-3 w-3" />, label: "Explain code", prompt: "Explain what this code does in detail." },
  { icon: <Wrench className="h-3 w-3" />, label: "Fix bugs", prompt: "Find and fix any bugs or issues in this code." },
  { icon: <FileText className="h-3 w-3" />, label: "Add docs", prompt: "Add JSDoc/docstring comments to this code." },
  { icon: <Sparkles className="h-3 w-3" />, label: "Refactor", prompt: "Refactor this code to be cleaner and more maintainable." },
];

const MODELS = [
  { id: "claude-sonnet-4-6", label: "Claude Sonnet 4.6", badge: "Recommended" },
  { id: "claude-haiku-4-5", label: "Claude Haiku 4.5", badge: "Fast" },
  { id: "claude-opus-4-7", label: "Claude Opus 4.7", badge: "Most Capable" },
];

export function AIPanel({ currentFile, currentCode, language = "txt", initialMessage, onClose }: AIPanelProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "agent",
      text: "Hi! I'm your AI assistant powered by Claude. I can see your current file and help you:\n\n- 🐛 Debug errors and fix bugs\n- ✨ Add new features\n- 🔄 Refactor and clean up code\n- 📖 Explain any part of the codebase\n- 💡 Suggest improvements\n\nWhat would you like to do?",
    },
  ]);
  const [input, setInput] = useState(initialMessage ?? "");
  const [isTyping, setIsTyping] = useState(false);
  const [selectedModel, setSelectedModel] = useState(MODELS[0].id);
  const [showModelPicker, setShowModelPicker] = useState(false);
  const [chatHistory, setChatHistory] = useState<{ role: "user" | "assistant"; content: string }[]>([]);
  const endRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (initialMessage) {
      setInput(initialMessage);
      textareaRef.current?.focus();
    }
  }, [initialMessage]);

  const sendMessage = async (overrideText?: string) => {
    const text = (overrideText ?? input).trim();
    if (!text || isTyping) return;

    const userMsg = text;
    setInput("");
    setIsTyping(true);

    setMessages(prev => [...prev, { role: "user", text: userMsg }]);
    setMessages(prev => [...prev, { role: "agent", text: "", isStreaming: true }]);

    const newHistory = [...chatHistory, { role: "user" as const, content: userMsg }];

    try {
      const res = await fetch("/api/anthropic/code-assist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMsg,
          code: currentCode ?? "",
          language,
          filename: currentFile ?? "unknown",
          history: chatHistory,
          model: selectedModel,
        }),
      });

      if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`);

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let full = "";
      let buf = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const lines = buf.split("\n");
        buf = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const data = JSON.parse(line.slice(6));
            if (data.content) {
              full += data.content;
              const snap = full;
              setMessages(prev => {
                const msgs = [...prev];
                msgs[msgs.length - 1] = { role: "agent", text: snap, isStreaming: true };
                return msgs;
              });
            }
            if (data.done || data.error) break;
          } catch { /**/ }
        }
      }

      setMessages(prev => {
        const msgs = [...prev];
        msgs[msgs.length - 1] = { role: "agent", text: full, isStreaming: false };
        return msgs;
      });
      setChatHistory([...newHistory, { role: "assistant", content: full }]);
    } catch {
      setMessages(prev => {
        const msgs = [...prev];
        msgs[msgs.length - 1] = { role: "agent", text: "Sorry, I couldn't connect to the AI. Make sure the API server is running.", isStreaming: false };
        return msgs;
      });
    } finally {
      setIsTyping(false);
    }
  };

  const currentModel = MODELS.find(m => m.id === selectedModel) ?? MODELS[0];

  return (
    <div className="flex flex-col h-full bg-[#0d1117] text-[#e6edf3]">
      <div className="flex items-center gap-2 px-3 py-2 border-b border-[#21262d] bg-[#161b22] shrink-0">
        <div className="h-6 w-6 rounded bg-gradient-to-br from-[#58a6ff] to-[#a371f7] flex items-center justify-center shrink-0">
          <Sparkles className="h-3.5 w-3.5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <span className="text-xs font-semibold">AI Agent</span>
          {currentFile && (
            <p className="text-[10px] text-[#8b949e] truncate">{currentFile}</p>
          )}
        </div>

        <button onClick={() => setShowModelPicker(!showModelPicker)}
          className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-[#a371f7]/20 text-[#a371f7] border border-[#a371f7]/30 hover:bg-[#a371f7]/30 transition-colors shrink-0">
          <span className="hidden sm:block">{currentModel.label.split(" ").slice(-1)[0]}</span>
          <ChevronDown className="h-2.5 w-2.5" />
        </button>

        {onClose && (
          <button onClick={onClose} className="h-6 w-6 flex items-center justify-center rounded text-[#8b949e] hover:text-[#e6edf3] hover:bg-[#21262d] transition-colors">
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {showModelPicker && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setShowModelPicker(false)} />
          <div className="absolute right-2 top-12 z-50 bg-[#161b22] border border-[#30363d] rounded-lg shadow-xl py-1 min-w-[220px]">
            {MODELS.map(m => (
              <button key={m.id} onClick={() => { setSelectedModel(m.id); setShowModelPicker(false); }}
                className={`w-full flex items-center justify-between px-3 py-2 text-xs hover:bg-[#21262d] transition-colors ${selectedModel === m.id ? "text-[#58a6ff]" : "text-[#e6edf3]"}`}>
                <span>{m.label}</span>
                <span className={`px-1.5 py-0.5 rounded text-[9px] ${m.badge === "Recommended" ? "bg-[#1f6feb]/20 text-[#58a6ff]" : m.badge === "Fast" ? "bg-green-500/20 text-green-400" : "bg-[#a371f7]/20 text-[#a371f7]"}`}>
                  {m.badge}
                </span>
              </button>
            ))}
          </div>
        </>
      )}

      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {messages.map((m, i) => (
          <div key={i} className={`flex gap-2 ${m.role === "user" ? "flex-row-reverse" : ""}`}>
            <div className={`h-6 w-6 rounded-full flex items-center justify-center shrink-0 text-[10px] font-bold ${m.role === "agent" ? "bg-gradient-to-br from-[#58a6ff] to-[#a371f7] text-white" : "bg-[#30363d] text-[#e6edf3]"}`}>
              {m.role === "agent" ? <Sparkles className="h-3 w-3" /> : "U"}
            </div>
            <div className={`max-w-[88%] rounded-xl px-3 py-2 text-xs leading-relaxed ${m.role === "agent" ? "bg-[#161b22] text-[#e6edf3] rounded-tl-none" : "bg-[#1f6feb] text-white rounded-tr-none"}`}>
              {m.role === "agent" ? (
                m.isStreaming && !m.text ? (
                  <div className="flex gap-1 py-1">
                    {[0, 1, 2].map(j => (
                      <div key={j} className="h-1.5 w-1.5 rounded-full bg-[#58a6ff] animate-bounce" style={{ animationDelay: `${j * 0.15}s` }} />
                    ))}
                  </div>
                ) : (
                  <div className="prose prose-invert prose-xs max-w-none [&_pre]:bg-[#0d1117] [&_pre]:border [&_pre]:border-[#30363d] [&_pre]:rounded [&_pre]:p-2 [&_code]:text-[#ffa657] [&_code]:bg-[#161b22] [&_code]:px-1 [&_code]:rounded [&_p]:mb-2 [&_ul]:list-disc [&_ul]:pl-4 [&_ol]:list-decimal [&_ol]:pl-4 [&_li]:mb-0.5 [&_h1]:text-sm [&_h2]:text-sm [&_h3]:text-xs [&_strong]:text-[#e6edf3] [&_a]:text-[#58a6ff]">
                    <ReactMarkdown>{m.text}</ReactMarkdown>
                  </div>
                )
              ) : (
                <p>{m.text}</p>
              )}
            </div>
          </div>
        ))}
        <div ref={endRef} />
      </div>

      {messages.length === 1 && !isTyping && (
        <div className="px-3 pb-2 grid grid-cols-2 gap-1.5 shrink-0">
          {QUICK_ACTIONS.map(a => (
            <button key={a.label} onClick={() => sendMessage(a.prompt)}
              className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg bg-[#161b22] border border-[#21262d] text-[10px] text-[#8b949e] hover:text-[#e6edf3] hover:border-[#30363d] transition-colors text-left">
              <span className="text-[#58a6ff]">{a.icon}</span>
              {a.label}
            </button>
          ))}
        </div>
      )}

      <div className="border-t border-[#21262d] p-2 bg-[#161b22] shrink-0">
        <div className={`flex items-end gap-2 bg-[#21262d] rounded-xl border px-3 py-2 transition-colors ${isTyping ? "border-[#a371f7]/50" : "border-[#30363d]"}`}>
          <textarea
            ref={textareaRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
            placeholder={isTyping ? "Claude is thinking…" : "Ask about your code… (⌘I for inline)"}
            rows={1}
            disabled={isTyping}
            className="flex-1 bg-transparent text-xs text-[#e6edf3] placeholder-[#484f58] outline-none resize-none disabled:opacity-50"
            style={{ maxHeight: 100 }}
          />
          <button onClick={() => sendMessage()} disabled={isTyping || !input.trim()}
            className="h-6 w-6 flex items-center justify-center rounded-lg bg-[#a371f7] hover:bg-[#8957e5] text-white transition-colors shrink-0 disabled:opacity-30">
            {isTyping
              ? <div className="h-3 w-3 border border-white/30 border-t-white rounded-full animate-spin" />
              : <Send className="h-3 w-3" />
            }
          </button>
        </div>
        <p className="text-[9px] text-[#484f58] text-center mt-1.5">Context-aware · {currentModel.label}</p>
      </div>
    </div>
  );
}
