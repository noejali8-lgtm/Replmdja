import { useState, useEffect, useRef, useCallback } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowUp, ArrowLeft, RotateCcw, Plus, CheckCircle2, Circle, Loader2 } from "lucide-react";
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

const BASE_URL = import.meta.env.BASE_URL?.replace(/\/$/, "") || "";

const BUILD_STEPS: BuildStep[] = [
  { id: "analyze", label: "Analyzing your idea", status: "pending" },
  { id: "plan", label: "Creating project plan", status: "pending" },
  { id: "setup", label: "Setting up environment", status: "pending" },
  { id: "build", label: "Generating code", status: "pending" },
  { id: "deps", label: "Installing dependencies", status: "pending" },
  { id: "preview", label: "Launching preview", status: "pending" },
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
          <span
            className={cn(
              "text-sm",
              step.status === "done"
                ? "text-green-400"
                : step.status === "active"
                ? "text-foreground"
                : "text-muted-foreground/50"
            )}
          >
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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const hasInitialized = useRef(false);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isThinking, scrollToBottom]);

  const runBuildAnimation = useCallback((): Promise<void> => {
    return new Promise((resolve) => {
      const steps = BUILD_STEPS.map((s) => ({ ...s }));
      setBuildSteps(steps);
      setShowBuildProgress(true);

      let stepIdx = 0;
      const advance = () => {
        if (stepIdx >= steps.length) {
          resolve();
          return;
        }
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
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content }),
        }
      );

      if (!response.ok || !response.body) {
        throw new Error("Stream request failed");
      }

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
                setMessages((prev) => [
                  ...prev,
                  { id: assistantMsgId, role: "assistant", content: data.content, isStreaming: true },
                ]);
                isFirst = false;
              } else {
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantMsgId
                      ? { ...m, content: m.content + data.content }
                      : m
                  )
                );
              }
            }

            if (data.done) {
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantMsgId ? { ...m, isStreaming: false } : m
                )
              );
            }
          } catch {
            // ignore parse errors
          }
        }
      }
    } catch (err) {
      setIsThinking(false);
      setMessages((prev) => [
        ...prev,
        {
          id: assistantMsgId,
          role: "assistant",
          content: "Sorry, something went wrong. Please try again.",
        },
      ]);
    }
  }, []);

  const startConversation = useCallback(
    async (prompt: string) => {
      const userMsgId = `user-${Date.now()}`;
      setMessages([{ id: userMsgId, role: "user", content: prompt }]);
      setIsThinking(true);

      try {
        const convRes = await fetch(`${BASE_URL}/api/anthropic/conversations`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: prompt.slice(0, 80) }),
        });

        if (!convRes.ok) throw new Error("Failed to create conversation");
        const conv = await convRes.json();
        setConversationId(conv.id);

        await runBuildAnimation();
        await sendMessage(prompt, conv.id);
      } catch {
        setIsThinking(false);
        setMessages((prev) => [
          ...prev,
          {
            id: `err-${Date.now()}`,
            role: "assistant",
            content: "Failed to start conversation. Please try again.",
          },
        ]);
      }
    },
    [runBuildAnimation, sendMessage]
  );

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

    if (!conversationId) {
      await startConversation(content);
    } else {
      await sendMessage(content, conversationId);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleNewChat = () => {
    setLocation("/");
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
        <button
          onClick={() => setLocation("/")}
          className="p-2 -ml-2 text-muted-foreground hover:text-foreground transition-colors"
          data-testid="button-back"
        >
          <ArrowLeft size={20} />
        </button>
        <span className="text-sm font-medium text-muted-foreground truncate max-w-[200px]">
          {messages[0]?.content?.slice(0, 40) || "New Project"}
          {(messages[0]?.content?.length ?? 0) > 40 ? "..." : ""}
        </span>
        <button
          onClick={handleNewChat}
          className="p-2 -mr-2 text-muted-foreground hover:text-foreground transition-colors"
          data-testid="button-new-chat"
        >
          <Plus size={20} />
        </button>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 no-scrollbar">
        <AnimatePresence initial={false}>
          {messages.map((msg) => (
            <MessageBubble key={msg.id} msg={msg} />
          ))}
        </AnimatePresence>

        {/* Build progress */}
        <AnimatePresence>
          {showBuildProgress && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex justify-start"
            >
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

        {/* Thinking animation */}
        <AnimatePresence>
          {isThinking && !showBuildProgress && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex justify-start"
            >
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

      {/* Input area */}
      <div className="shrink-0 px-4 pb-6 pt-2 border-t border-border">
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
            <button
              className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors border border-border"
              data-testid="button-attach"
            >
              <Plus size={16} />
            </button>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <RotateCcw size={12} />
              <span>Shift+Enter for newline</span>
            </div>
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
    </motion.div>
  );
}
