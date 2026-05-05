import { useState, useEffect, useRef, useCallback } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Plus, CheckCircle2, Circle, Loader2,
  Play, Monitor, Globe, AlignJustify, LayoutPanelLeft,
  Lock, Database, UserPlus, ChevronDown, ChevronUp,
  Folder, X, Search, History, Share2, MoreHorizontal,
  ArrowUpDown, Clock, Square, BookOpen,
  GitBranch, Trash2, LogIn, MessageSquare, RotateCcw,
  ExternalLink, UserCircle2, CheckCircle, Circle as CircleIcon,
  Link2
} from "lucide-react";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  isStreaming?: boolean;
  timestamp?: Date;
  actionCount?: number;
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

/* ── Replit Agent SVG icon (3×2 grid of dots) ── */
function AgentIcon({ size = 20, className = "" }: { size?: number; className?: string }) {
  const s = size;
  const r = s * 0.13;
  const gap = s * 0.33;
  const offX = s * 0.115;
  const offY = s * 0.2;
  const dots = [
    [0, 0], [1, 0], [2, 0],
    [0, 1], [1, 1], [2, 1],
  ];
  return (
    <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`} fill="none" className={className}>
      {dots.map(([col, row], i) => (
        <circle
          key={i}
          cx={offX + col * gap}
          cy={offY + row * gap}
          r={r}
          fill="currentColor"
        />
      ))}
    </svg>
  );
}

/* Legacy text dots used for timestamps only */
function AgentDots({ size = 18, className = "" }: { size?: number; className?: string }) {
  return <AgentIcon size={size} className={className} />;
}

/* "Thinking." card — exact Replit style */
function ThinkingCard() {
  const [dots, setDots] = useState(".");
  useEffect(() => {
    const t = setInterval(() => setDots(d => d.length >= 3 ? "." : d + "."), 500);
    return () => clearInterval(t);
  }, []);
  return (
    <motion.div
      initial={{ opacity: 0, y: 6, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className="flex items-center gap-3 px-3 py-3 bg-[#1e1e2e] border border-border/50 rounded-2xl w-fit"
      data-testid="thinking-indicator"
    >
      <div className="w-9 h-9 rounded-xl bg-[#2a1f4e] border border-purple-500/30 flex items-center justify-center shrink-0">
        <motion.div
          animate={{ scale: [1, 1.15, 1], opacity: [0.8, 1, 0.8] }}
          transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
        >
          <AgentIcon size={20} className="text-purple-400" />
        </motion.div>
      </div>
      <span className="text-sm font-medium text-foreground">
        Thinking{dots}
      </span>
    </motion.div>
  );
}

/* "Working.." card — exact Replit style */
function WorkingCard() {
  const [dots, setDots] = useState("..");
  useEffect(() => {
    const t = setInterval(() => setDots(d => d.length >= 3 ? "." : d + "."), 400);
    return () => clearInterval(t);
  }, []);
  return (
    <motion.div
      initial={{ opacity: 0, y: 6, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className="flex items-center gap-3 px-3 py-3 bg-[#1e1e2e] border border-border/50 rounded-2xl w-fit"
      data-testid="working-indicator"
    >
      <div className="w-9 h-9 rounded-xl bg-[#2a1f4e] border border-purple-500/30 flex items-center justify-center shrink-0">
        <motion.div
          animate={{ rotate: [0, 15, -15, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        >
          <AgentIcon size={20} className="text-purple-400" />
        </motion.div>
      </div>
      <span className="text-sm font-medium text-foreground">
        Working{dots}
      </span>
    </motion.div>
  );
}

/* Planning step row (shows between messages while planning) */
function PlanningStep({ label, elapsed }: { label: string; elapsed: number }) {
  const [open, setOpen] = useState(false);
  return (
    <motion.button
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      onClick={() => setOpen(v => !v)}
      className="flex items-center gap-2 text-left w-full py-1"
    >
      <div className="w-6 h-6 rounded-lg bg-secondary/60 border border-border/50 flex items-center justify-center shrink-0">
        <motion.div
          animate={{ rotate: [0, 360] }}
          transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
        >
          <AgentIcon size={13} className="text-muted-foreground" />
        </motion.div>
      </div>
      <span className="flex-1 text-xs text-muted-foreground truncate">
        {label} ({elapsed} sec...)
      </span>
      <ChevronDown size={13} className={cn("text-muted-foreground/50 shrink-0 transition-transform", open && "rotate-180")} />
    </motion.button>
  );
}

/* ─────────────────────────────────────────────────────────
   HISTORY PANEL
   ───────────────────────────────────────────────────────── */
interface HistoryConversation {
  id: string;
  title: string;
  lastMessage: string;
  timestamp: Date;
  msgCount: number;
}

const SAMPLE_HISTORY: HistoryConversation[] = [
  { id: "h1", title: "Portfolio website with animations", lastMessage: "Here's your responsive portfolio with smooth scroll animations and dark mode.", timestamp: new Date(Date.now() - 3600000 * 1.5), msgCount: 8 },
  { id: "h2", title: "Todo app with drag & drop", lastMessage: "I've built a full todo list with drag-and-drop, priorities, and filters.", timestamp: new Date(Date.now() - 3600000 * 26), msgCount: 14 },
  { id: "h3", title: "Weather dashboard UI", lastMessage: "The weather dashboard is ready with hourly forecasts and city search.", timestamp: new Date(Date.now() - 3600000 * 50), msgCount: 6 },
  { id: "h4", title: "E-commerce product page", lastMessage: "I've created the product page with cart, variants, and image gallery.", timestamp: new Date(Date.now() - 3600000 * 75), msgCount: 19 },
  { id: "h5", title: "Real-time chat app", lastMessage: "The WebSocket chat is working with rooms, online status, and typing indicators.", timestamp: new Date(Date.now() - 3600000 * 120), msgCount: 11 },
  { id: "h6", title: "Landing page for SaaS tool", lastMessage: "Your SaaS landing page with hero, pricing section, and testimonials is done.", timestamp: new Date(Date.now() - 3600000 * 168), msgCount: 7 },
];

function fmtHistoryTime(d: Date) {
  const diffH = (Date.now() - d.getTime()) / 3600000;
  if (diffH < 1) return "Just now";
  if (diffH < 24) return `${Math.round(diffH)}h ago`;
  if (diffH < 48) return "Yesterday";
  if (diffH < 168) return `${Math.round(diffH / 24)}d ago`;
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
}

function HistoryPanel({ onClose }: { onClose: () => void }) {
  const [search, setSearch] = useState("");
  const [conversations] = useState<HistoryConversation[]>(() => {
    try {
      const saved = localStorage.getItem("chat_history_v1");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0)
          return parsed.map((c: HistoryConversation) => ({ ...c, timestamp: new Date(c.timestamp) }));
      }
    } catch { /* ignore */ }
    return SAMPLE_HISTORY;
  });

  const filtered = conversations.filter(c =>
    !search || c.title.toLowerCase().includes(search.toLowerCase())
  );

  const grouped: Record<string, HistoryConversation[]> = {};
  for (const c of filtered) {
    const diffH = (Date.now() - c.timestamp.getTime()) / 3600000;
    const key = diffH < 24 ? "Today" : diffH < 48 ? "Yesterday" : diffH < 168 ? "This Week" : "Older";
    (grouped[key] ||= []).push(c);
  }
  const ORDER = ["Today", "Yesterday", "This Week", "Older"];

  return (
    <motion.div
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      exit={{ x: "100%" }}
      transition={{ type: "spring", stiffness: 380, damping: 38 }}
      className="absolute inset-0 z-50 flex flex-col bg-background"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-10 pb-3 border-b border-border shrink-0">
        <div className="flex items-center gap-2">
          <History size={18} className="text-purple-400" />
          <h2 className="text-base font-semibold text-foreground">History</h2>
        </div>
        <button
          onClick={onClose}
          className="w-8 h-8 flex items-center justify-center text-muted-foreground hover:text-foreground rounded-lg hover:bg-secondary/60 transition-colors"
          data-testid="button-close-history"
        >
          <X size={18} />
        </button>
      </div>

      {/* Search */}
      <div className="px-4 py-3 border-b border-border/50 shrink-0">
        <div className="flex items-center gap-2 bg-secondary/40 rounded-xl px-3 h-9 border border-border/40">
          <Search size={14} className="text-muted-foreground shrink-0" />
          <input
            type="text"
            placeholder="Search conversations..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/60 outline-none"
            data-testid="input-history-search"
          />
          {search && (
            <button onClick={() => setSearch("")} className="text-muted-foreground hover:text-foreground">
              <X size={13} />
            </button>
          )}
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto no-scrollbar">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 gap-3">
            <MessageSquare size={32} className="text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground/60">No conversations found</p>
          </div>
        ) : (
          ORDER.filter(k => grouped[k]?.length).map(group => (
            <div key={group}>
              <div className="px-4 pt-4 pb-1.5">
                <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50">{group}</span>
              </div>
              {grouped[group].map(conv => (
                <motion.button
                  key={conv.id}
                  whileTap={{ scale: 0.98 }}
                  className="w-full flex items-start gap-3 px-4 py-3 hover:bg-secondary/30 active:bg-secondary/50 transition-colors text-left border-b border-border/20"
                  data-testid={`history-item-${conv.id}`}
                  onClick={onClose}
                >
                  <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center shrink-0 mt-0.5">
                    <MessageSquare size={16} className="text-purple-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-0.5">
                      <p className="text-sm font-medium text-foreground truncate">{conv.title}</p>
                      <span className="text-[10px] text-muted-foreground/60 shrink-0">{fmtHistoryTime(conv.timestamp)}</span>
                    </div>
                    <p className="text-xs text-muted-foreground/70 truncate leading-relaxed">{conv.lastMessage}</p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="text-[10px] text-muted-foreground/40 flex items-center gap-1">
                        <MessageSquare size={9} /> {conv.msgCount} messages
                      </span>
                    </div>
                  </div>
                  <RotateCcw size={14} className="text-muted-foreground/30 shrink-0 mt-1" />
                </motion.button>
              ))}
            </div>
          ))
        )}
        <div className="h-8" />
      </div>

      {/* Footer */}
      <div className="shrink-0 px-4 py-3 border-t border-border/50 bg-card/40">
        <p className="text-[11px] text-muted-foreground/50 text-center">
          {conversations.length} total conversations saved locally
        </p>
      </div>
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────────
   GIT PANEL
   ───────────────────────────────────────────────────────── */
type GitConnection = { id: string; name: string; icon: React.ReactNode; status: "connected" | "disconnected"; username?: string };

const GIT_CONNECTIONS: GitConnection[] = [
  {
    id: "github",
    name: "GitHub",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/>
      </svg>
    ),
    status: "connected",
    username: "username",
  },
  {
    id: "bitbucket",
    name: "Bitbucket",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
        <path d="M.778 1.213a.768.768 0 00-.768.892l3.263 19.81c.084.5.515.868 1.022.873H19.95a.772.772 0 00.77-.646l3.27-20.03a.768.768 0 00-.768-.891zM14.52 15.53H9.522L8.17 8.466h7.561z"/>
      </svg>
    ),
    status: "disconnected",
  },
  {
    id: "gitlab",
    name: "GitLab",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
        <path d="M22.65 14.39L12 22.13 1.35 14.39a.84.84 0 01-.3-.94l1.22-3.78 2.44-7.51A.42.42 0 014.82 2a.43.43 0 01.58 0 .42.42 0 01.11.18l2.44 7.49h8.1l2.44-7.51A.42.42 0 0118.6 2a.43.43 0 01.58 0 .42.42 0 01.11.18l2.44 7.51L23 13.45a.84.84 0 01-.35.94z"/>
      </svg>
    ),
    status: "disconnected",
  },
];

function GitPanel({ onClose }: { onClose: () => void }) {
  const [remoteUrl, setRemoteUrl] = useState("");
  const [connections, setConnections] = useState<GitConnection[]>(GIT_CONNECTIONS);
  const [authorName, setAuthorName] = useState("username");
  const [authorEmail, setAuthorEmail] = useState("user@example.com");
  const [showAuthorEdit, setShowAuthorEdit] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleDelete = (id: string) => {
    setConnections(prev => prev.map(c => c.id === id ? { ...c, status: "disconnected" as const, username: undefined } : c));
  };
  const handleSignIn = (id: string) => {
    setConnections(prev => prev.map(c => c.id === id ? { ...c, status: "connected" as const, username: "username" } : c));
  };

  return (
    <motion.div
      initial={{ y: "100%" }}
      animate={{ y: 0 }}
      exit={{ y: "100%" }}
      transition={{ type: "spring", stiffness: 340, damping: 36 }}
      className="absolute inset-0 z-50 flex flex-col bg-background overflow-y-auto no-scrollbar"
    >
      {/* Header */}
      <div className="flex items-center gap-2 px-4 pt-10 pb-3 border-b border-border shrink-0">
        <button
          onClick={onClose}
          className="text-muted-foreground hover:text-foreground text-sm flex items-center gap-1 mr-1 transition-colors"
          data-testid="button-git-back"
        >
          <ArrowLeft size={15} /> Settings
        </button>
        <div className="flex-1" />
        <GitBranch size={17} className="text-green-400" />
        <span className="text-base font-semibold text-foreground">Git</span>
        <div className="flex-1" />
        <button
          onClick={onClose}
          className="w-8 h-8 flex items-center justify-center text-muted-foreground hover:text-foreground rounded-lg hover:bg-secondary/60 transition-colors"
          data-testid="button-close-git"
        >
          <X size={18} />
        </button>
      </div>

      <div className="flex-1 px-4 py-4 space-y-5">

        {/* Remote section */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Link2 size={14} className="text-muted-foreground" />
            <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Remote</h3>
          </div>
          <div className="bg-card border border-border rounded-2xl overflow-hidden">
            <div className="px-4 py-3 border-b border-border/50">
              <label className="text-xs text-muted-foreground block mb-1.5">Remote URL</label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={remoteUrl}
                  onChange={e => setRemoteUrl(e.target.value)}
                  placeholder="https://github.com/username/repo.git"
                  className="flex-1 bg-secondary/30 border border-border/50 rounded-lg px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground/50 outline-none focus:border-purple-400/50 transition-colors"
                  data-testid="input-remote-url"
                />
                {remoteUrl && (
                  <button
                    onClick={() => { navigator.clipboard?.writeText(remoteUrl); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
                    className="w-8 h-8 flex items-center justify-center bg-secondary/50 border border-border/50 rounded-lg text-muted-foreground hover:text-foreground transition-colors shrink-0"
                  >
                    {copied ? <CheckCircle size={13} className="text-green-400" /> : <ExternalLink size={13} />}
                  </button>
                )}
              </div>
            </div>
            <div className="px-4 py-2.5 flex items-center justify-between">
              <span className="text-xs text-muted-foreground/70">Branch: <span className="text-foreground font-medium">main</span></span>
              <button
                disabled={!remoteUrl}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all",
                  remoteUrl
                    ? "bg-purple-500/20 border border-purple-400/40 text-purple-300 hover:bg-purple-500/30"
                    : "bg-secondary/30 border border-border/30 text-muted-foreground/40 cursor-not-allowed"
                )}
                data-testid="button-create-remote"
              >
                Create Remote
              </button>
            </div>
          </div>
        </div>

        {/* Connections section */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <GitBranch size={14} className="text-muted-foreground" />
            <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Connections</h3>
          </div>
          <div className="bg-card border border-border rounded-2xl overflow-hidden divide-y divide-border/50">
            {connections.map((conn) => (
              <div key={conn.id} className="flex items-center gap-3 px-4 py-3.5">
                <div className="w-8 h-8 rounded-lg bg-secondary/50 border border-border/50 flex items-center justify-center text-foreground shrink-0">
                  {conn.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-medium text-foreground">{conn.name}</span>
                    {conn.status === "connected" && (
                      <span className="text-[9px] bg-green-500/20 border border-green-400/30 text-green-400 px-1.5 rounded-full font-semibold">Active</span>
                    )}
                  </div>
                  {conn.username && (
                    <span className="text-xs text-muted-foreground/60">@{conn.username}</span>
                  )}
                </div>
                {conn.status === "connected" ? (
                  <button
                    onClick={() => handleDelete(conn.id)}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs text-red-400 hover:bg-red-500/10 border border-red-400/20 hover:border-red-400/40 transition-all"
                    data-testid={`button-disconnect-${conn.id}`}
                  >
                    <Trash2 size={11} /> Delete
                  </button>
                ) : (
                  <button
                    onClick={() => handleSignIn(conn.id)}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs text-muted-foreground hover:text-foreground border border-border/50 hover:border-border hover:bg-secondary/50 transition-all"
                    data-testid={`button-connect-${conn.id}`}
                  >
                    <LogIn size={11} /> Sign in
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Commit Author section */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <UserCircle2 size={14} className="text-muted-foreground" />
            <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Commit Author</h3>
          </div>
          <div className="bg-card border border-border rounded-2xl overflow-hidden">
            <button
              className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-secondary/20 transition-colors"
              onClick={() => setShowAuthorEdit(v => !v)}
              data-testid="button-toggle-author"
            >
              <div className="w-9 h-9 rounded-full bg-purple-500/20 border border-purple-400/30 flex items-center justify-center shrink-0">
                <span className="text-sm font-semibold text-purple-300">{authorName[0]?.toUpperCase()}</span>
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-medium text-foreground">{authorName}</p>
                <p className="text-xs text-muted-foreground/60">{authorEmail}</p>
              </div>
              <ChevronDown size={15} className={cn("text-muted-foreground transition-transform", showAuthorEdit && "rotate-180")} />
            </button>
            <AnimatePresence>
              {showAuthorEdit && (
                <motion.div
                  initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }}
                  className="overflow-hidden border-t border-border/40"
                >
                  <div className="px-4 py-3 space-y-2.5">
                    <div>
                      <label className="text-[11px] text-muted-foreground block mb-1">Name</label>
                      <input
                        value={authorName}
                        onChange={e => setAuthorName(e.target.value)}
                        className="w-full bg-secondary/30 border border-border/50 rounded-lg px-3 py-2 text-xs text-foreground outline-none focus:border-purple-400/50 transition-colors"
                        data-testid="input-author-name"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-muted-foreground block mb-1">Email</label>
                      <input
                        value={authorEmail}
                        onChange={e => setAuthorEmail(e.target.value)}
                        className="w-full bg-secondary/30 border border-border/50 rounded-lg px-3 py-2 text-xs text-foreground outline-none focus:border-purple-400/50 transition-colors"
                        data-testid="input-author-email"
                      />
                    </div>
                    <button
                      onClick={() => setShowAuthorEdit(false)}
                      className="w-full py-2 bg-purple-500/20 border border-purple-400/30 text-purple-300 text-xs font-semibold rounded-lg hover:bg-purple-500/30 transition-colors"
                      data-testid="button-save-author"
                    >
                      Save Author
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

      </div>
    </motion.div>
  );
}

function TimeStamp({ date }: { date?: Date }) {
  const fmt = (d: Date) => {
    const diff = (Date.now() - d.getTime()) / 1000;
    if (diff < 5) return "Just now";
    if (diff < 60) return `${Math.round(diff)} seconds ago`;
    if (diff < 3600) return `${Math.round(diff / 60)} minutes ago`;
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };
  if (!date) return null;
  return (
    <div className="flex items-center justify-end gap-1.5 text-xs text-muted-foreground/60 py-1 pr-1">
      <AgentDots size={12} className="text-muted-foreground/40" />
      <span>{fmt(date)}</span>
    </div>
  );
}

function ActionsBadge({ count }: { count: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-2 py-1"
    >
      <BookOpen size={14} className="text-muted-foreground/60" />
      <AgentIcon size={14} className="text-muted-foreground/60" />
      <span className="text-xs text-muted-foreground/70 font-medium">{count} actions</span>
    </motion.div>
  );
}

function ActivityCard({ msgCount, actionCount, startTime }: {
  msgCount: number; actionCount: number; startTime: Date | null;
}) {
  const [open, setOpen] = useState(true);
  const [checkOpen, setCheckOpen] = useState(false);
  const [workOpen, setWorkOpen] = useState(false);

  if (msgCount === 0) return null;
  const workSecs = startTime ? Math.round((Date.now() - startTime.getTime()) / 60000) : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-1 mb-3 bg-card border border-border/60 rounded-2xl overflow-hidden"
    >
      {/* Header row */}
      <button
        className="w-full flex items-center gap-2 px-4 py-3 hover:bg-secondary/30 transition-colors"
        onClick={() => setOpen(v => !v)}
      >
        <ArrowUpDown size={15} className="text-muted-foreground shrink-0" />
        <span className="flex-1 text-sm font-medium text-foreground text-left">
          {msgCount} messages &amp; {actionCount} actions
        </span>
        <motion.span animate={{ rotate: open ? 0 : 180 }} transition={{ duration: 0.2 }}>
          <ChevronUp size={15} className="text-muted-foreground" />
        </motion.span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: "auto" }}
            exit={{ height: 0 }}
            className="overflow-hidden border-t border-border/40"
          >
            {/* Checkpoint row */}
            <button
              className="w-full flex items-center gap-2 px-4 py-3 hover:bg-secondary/20 transition-colors border-b border-border/30"
              onClick={() => setCheckOpen(v => !v)}
            >
              <CheckCircle2 size={15} className="text-green-400 shrink-0" />
              <span className="flex-1 text-sm text-muted-foreground text-left">
                Checkpoint made {workSecs <= 1 ? "just now" : `${workSecs} minutes ago`}
              </span>
              <ChevronDown size={14} className={cn("text-muted-foreground transition-transform", checkOpen && "rotate-180")} />
            </button>
            <AnimatePresence>
              {checkOpen && (
                <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="overflow-hidden bg-secondary/10">
                  <div className="px-4 py-3 text-xs text-muted-foreground">
                    Auto-checkpoint saved. You can restore this state from history.
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Worked row */}
            <button
              className="w-full flex items-center gap-2 px-4 py-3 hover:bg-secondary/20 transition-colors"
              onClick={() => setWorkOpen(v => !v)}
            >
              <Clock size={15} className="text-muted-foreground shrink-0" />
              <span className="flex-1 text-sm text-muted-foreground text-left">
                Worked for {Math.max(workSecs, 1)} minute{workSecs !== 1 ? "s" : ""}
              </span>
              <ChevronDown size={14} className={cn("text-muted-foreground transition-transform", workOpen && "rotate-180")} />
            </button>
            <AnimatePresence>
              {workOpen && (
                <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="overflow-hidden bg-secondary/10">
                  <div className="px-4 py-3 text-xs text-muted-foreground">
                    Agent spent {Math.max(workSecs, 1)} minute{workSecs !== 1 ? "s" : ""} building your project across {actionCount} actions.
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function BuildProgress({ steps }: { steps: BuildStep[] }) {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-2 px-1 py-2" data-testid="build-progress">
      {steps.map((step) => (
        <motion.div key={step.id} className="flex items-center gap-3" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}>
          {step.status === "done" ? (
            <CheckCircle2 size={16} className="text-green-400 shrink-0" />
          ) : step.status === "active" ? (
            <Loader2 size={16} className="text-primary animate-spin shrink-0" />
          ) : (
            <Circle size={16} className="text-muted-foreground/40 shrink-0" />
          )}
          <span className={cn("text-sm", step.status === "done" ? "text-green-400" : step.status === "active" ? "text-foreground" : "text-muted-foreground/50")}>
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
    <div className={cn("flex w-full flex-col", isUser ? "items-end" : "items-start")}>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn("flex w-full", isUser ? "justify-end" : "justify-start")}
      >
        {!isUser && (
          <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center mr-2 mt-0.5 shrink-0">
            <AgentDots size={10} className="text-primary-foreground" />
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
      {msg.actionCount !== undefined && msg.actionCount > 0 && (
        <div className={cn("mt-2 w-full max-w-[85%]", isUser ? "self-end" : "self-start ml-9")}>
          <ActionsBadge count={msg.actionCount} />
        </div>
      )}
      <TimeStamp date={msg.timestamp} />
    </div>
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
  const [fileSearch, setFileSearch] = useState("");
  const [planEnabled, setPlanEnabled] = useState(false);
  const [actionCount, setActionCount] = useState(0);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [showGit, setShowGit] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const hasInitialized = useRef(false);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => { scrollToBottom(); }, [messages, isThinking, scrollToBottom]);

  // Animate action count while thinking
  useEffect(() => {
    if (!isThinking) return;
    const interval = setInterval(() => {
      setActionCount(c => c + 1);
    }, 1800);
    return () => clearInterval(interval);
  }, [isThinking]);

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
                setMessages((prev) => [...prev, {
                  id: assistantMsgId, role: "assistant", content: data.content,
                  isStreaming: true, timestamp: new Date(),
                  actionCount: actionCount
                }]);
                isFirst = false;
              } else {
                setMessages((prev) => prev.map((m) =>
                  m.id === assistantMsgId ? { ...m, content: m.content + data.content } : m
                ));
              }
            }
            if (data.done) {
              setMessages((prev) => prev.map((m) =>
                m.id === assistantMsgId ? { ...m, isStreaming: false } : m
              ));
            }
          } catch { /* ignore */ }
        }
      }
    } catch {
      setIsThinking(false);
      setMessages((prev) => [...prev, {
        id: assistantMsgId, role: "assistant",
        content: "Sorry, something went wrong. Please try again.",
        timestamp: new Date()
      }]);
    }
  }, [actionCount]);

  const startConversation = useCallback(async (prompt: string) => {
    const userMsgId = `user-${Date.now()}`;
    const now = new Date();
    setStartTime(now);
    setActionCount(0);
    setMessages([{ id: userMsgId, role: "user", content: prompt, timestamp: now }]);
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
      setMessages((prev) => [...prev, {
        id: `err-${Date.now()}`, role: "assistant",
        content: "Failed to start conversation. Please try again.",
        timestamp: new Date()
      }]);
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
    const now = new Date();
    const userMsgId = `user-${Date.now()}`;
    setMessages((prev) => [...prev, { id: userMsgId, role: "user", content, timestamp: now }]);
    if (!conversationId) { await startConversation(content); }
    else { await sendMessage(content, conversationId); }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSubmit(); }
  };

  const msgCount = messages.length;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="relative flex flex-col h-[100dvh] max-w-[480px] mx-auto w-full bg-background overflow-hidden"
    >
      {/* ── Header ── */}
      <div className="flex items-center justify-between px-3 pt-10 pb-3 border-b border-border shrink-0">
        {/* Left group */}
        <div className="flex items-center gap-1 bg-secondary/40 border border-border/60 rounded-xl px-1 py-1">
          <button
            onClick={() => setLocation("/")}
            className="w-8 h-8 flex items-center justify-center text-muted-foreground hover:text-foreground rounded-lg hover:bg-secondary/60 transition-colors"
            data-testid="button-back"
          >
            <ArrowLeft size={18} />
          </button>
          <button
            onClick={() => setShowHistory(true)}
            className="w-8 h-8 flex items-center justify-center text-muted-foreground hover:text-foreground rounded-lg hover:bg-secondary/60 transition-colors"
            data-testid="button-history"
          >
            <History size={18} />
          </button>
        </div>

        {/* Center - Agent title */}
        <div className="flex items-center gap-2 px-3 py-1.5 bg-secondary/30 border border-border/40 rounded-xl">
          <AgentDots size={16} className="text-purple-400" />
          <span className="text-sm font-semibold text-foreground">Agent</span>
        </div>

        {/* Right group */}
        <div className="flex items-center gap-1 bg-secondary/40 border border-border/60 rounded-xl px-1 py-1">
          <button
            className="w-8 h-8 flex items-center justify-center text-muted-foreground hover:text-foreground rounded-lg hover:bg-secondary/60 transition-colors"
            data-testid="button-share"
          >
            <Share2 size={17} />
          </button>
          <button
            className="w-8 h-8 flex items-center justify-center text-muted-foreground hover:text-foreground rounded-lg hover:bg-secondary/60 transition-colors"
            data-testid="button-more"
          >
            <MoreHorizontal size={18} />
          </button>
        </div>
      </div>

      {/* ── Messages area ── */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2 no-scrollbar">
        {/* Activity summary card */}
        <ActivityCard msgCount={msgCount} actionCount={actionCount} startTime={startTime} />

        <AnimatePresence initial={false}>
          {messages.map((msg) => <MessageBubble key={msg.id} msg={msg} />)}
        </AnimatePresence>

        {/* Build steps */}
        <AnimatePresence>
          {showBuildProgress && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex justify-start">
              <div className="flex gap-2">
                <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center shrink-0 mt-0.5">
                  <AgentDots size={10} className="text-primary-foreground" />
                </div>
                <div className="bg-card border border-card-border rounded-2xl rounded-bl-sm px-4 py-3">
                  <BuildProgress steps={buildSteps} />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Thinking / Working cards */}
        <AnimatePresence>
          {isThinking && !showBuildProgress && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-2"
            >
              {actionCount < 3 ? <ThinkingCard /> : <WorkingCard />}
              {actionCount >= 3 && (
                <PlanningStep
                  label="Planning UI element implementation"
                  elapsed={Math.max(actionCount * 4, 1)}
                />
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <div ref={messagesEndRef} />
      </div>

      {/* ── Dev Tools Bar ── */}
      <div className="shrink-0 border-t border-border bg-card/60">
        <div className="flex items-stretch h-14">
          {[
            { icon: <Lock size={19} />, label: "Secrets", testId: "tool-secrets", onClick: undefined },
            { icon: <Database size={19} />, label: "Database", testId: "tool-database", onClick: undefined },
            { icon: <UserPlus size={19} />, label: "Auth", testId: "tool-auth", onClick: undefined },
            { icon: <GitBranch size={19} />, label: "Git", testId: "tool-git", onClick: () => setShowGit(true) },
          ].map((tool, i) => (
            <motion.button
              key={tool.label}
              whileTap={{ scale: 0.92 }}
              onClick={tool.onClick}
              className={cn(
                "flex-1 flex flex-col items-center justify-center gap-0.5 text-muted-foreground hover:text-foreground hover:bg-secondary/50 active:bg-secondary transition-colors",
                i < 3 && "border-r border-border/50",
                tool.label === "Git" && "hover:text-green-400"
              )}
              data-testid={tool.testId}
            >
              {tool.icon}
              <span className="text-[10px] font-medium">{tool.label}</span>
            </motion.button>
          ))}
        </div>
      </div>

      {/* ── File Search Bar ── */}
      <div className="shrink-0 border-t border-border/50 bg-background">
        <div className="flex items-center h-11 px-1 gap-1">
          <motion.button
            whileTap={{ scale: 0.9 }}
            className="w-9 h-9 flex items-center justify-center text-muted-foreground hover:text-foreground rounded-lg hover:bg-secondary/50 transition-colors"
            data-testid="button-files"
          >
            <Folder size={18} />
          </motion.button>
          <div className="flex-1 flex items-center gap-2 bg-secondary/30 rounded-lg px-3 h-8 border border-border/30">
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
          <motion.button
            whileTap={{ scale: 0.9 }}
            className="w-9 h-9 flex items-center justify-center text-muted-foreground hover:text-foreground rounded-lg hover:bg-secondary/50 transition-colors"
            onClick={() => setFileSearch("")}
            data-testid="button-close-search"
          >
            <X size={18} />
          </motion.button>
        </div>
      </div>

      {/* ── Input Area ── */}
      <div className="shrink-0 px-3 pb-3 pt-2 border-t border-border bg-background relative">
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
                className="absolute bottom-full mb-1 left-3 right-3 z-40 bg-card border border-border rounded-2xl shadow-2xl overflow-hidden"
              >
                <div className="p-3">
                  <p className="text-xs text-muted-foreground font-semibold uppercase tracking-widest px-1 mb-2">Agent modes</p>
                  <div className="grid grid-cols-4 gap-1.5 mb-3">
                    {AGENT_MODES.map((mode) => (
                      <motion.button
                        key={mode.id}
                        whileTap={{ scale: 0.94 }}
                        onClick={() => { setAgentMode(mode.id); setShowModes(false); }}
                        className={cn(
                          "relative px-2 py-2.5 rounded-xl text-sm font-semibold transition-all border",
                          agentMode === mode.id
                            ? "bg-secondary border-primary/40 text-foreground shadow-sm"
                            : "bg-transparent border-transparent text-muted-foreground hover:bg-secondary/50"
                        )}
                        data-testid={`agent-mode-${mode.id.toLowerCase().replace("+", "-plus")}`}
                      >
                        {mode.badge && (
                          <span className="absolute -top-1.5 -left-0.5 text-[9px] bg-purple-500 text-white px-1 rounded-sm font-bold leading-none py-0.5">
                            {mode.badge}
                          </span>
                        )}
                        <span className={mode.color}>{mode.id}</span>
                      </motion.button>
                    ))}
                  </div>
                  <div className="px-2 py-2.5 bg-secondary/40 rounded-xl border border-border/30">
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {AGENT_MODES.find(m => m.id === agentMode)?.desc}
                    </p>
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        <div className="bg-card rounded-2xl border border-card-border p-3 shadow-lg flex flex-col gap-2.5">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              e.target.style.height = "auto";
              e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
            }}
            onKeyDown={handleKeyDown}
            placeholder="Make, test, iterate..."
            className="w-full bg-transparent resize-none outline-none text-foreground placeholder:text-muted-foreground/60 min-h-[36px] max-h-[120px] text-sm"
            data-testid="input-chat"
            rows={1}
          />
          <div className="flex items-center gap-2">
            {/* + attach */}
            <motion.button
              whileTap={{ scale: 0.9 }}
              className="w-7 h-7 rounded-full bg-secondary/70 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors border border-border/60 shrink-0"
              data-testid="button-attach"
            >
              <Plus size={14} />
            </motion.button>

            {/* Plan toggle */}
            <button
              onClick={() => setPlanEnabled(v => !v)}
              className={cn(
                "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors shrink-0",
                planEnabled
                  ? "bg-primary/15 border-primary/40 text-primary"
                  : "bg-secondary/40 border-border/50 text-muted-foreground hover:text-foreground"
              )}
              data-testid="switch-plan"
            >
              <motion.div
                className={cn("w-3 h-3 rounded-full border-2 shrink-0", planEnabled ? "bg-primary border-primary" : "border-muted-foreground bg-transparent")}
                animate={{ scale: planEnabled ? 1.1 : 1 }}
              />
              Plan
            </button>

            {/* Agent mode pill */}
            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={() => setShowModes(!showModes)}
              className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-secondary/50 border border-border/50 hover:bg-secondary transition-colors shrink-0"
              data-testid="button-agent-mode"
            >
              <AgentDots size={11} className="text-foreground/80" />
              <span className="text-xs font-medium text-foreground">{agentMode}</span>
              <ChevronDown size={10} className="text-muted-foreground" />
            </motion.button>

            <div className="flex-1" />

            {/* Send / Stop button */}
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={isThinking ? () => {} : handleSubmit}
              disabled={!input.trim() && !isThinking}
              className={cn(
                "w-8 h-8 rounded-xl flex items-center justify-center transition-all shrink-0",
                isThinking
                  ? "bg-primary text-primary-foreground shadow-md"
                  : input.trim()
                  ? "bg-primary text-primary-foreground shadow-md hover:brightness-110"
                  : "bg-secondary text-muted-foreground opacity-40 cursor-not-allowed"
              )}
              data-testid="button-send-chat"
            >
              {isThinking ? (
                <motion.div
                  animate={{ scale: [1, 0.85, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                >
                  <Square size={14} fill="currentColor" />
                </motion.div>
              ) : (
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M8 12V4M8 4L4 8M8 4L12 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </motion.button>
          </div>
        </div>
      </div>

      {/* ── Workspace Toolbar ── */}
      <div className="shrink-0 border-t border-border bg-card/90">
        <div className="flex items-center justify-around h-13 px-1 py-1 relative">

          {/* Run */}
          <motion.button whileTap={{ scale: 0.88 }} className="w-10 h-10 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary/50 rounded-lg transition-colors" data-testid="toolbar-run" title="Run">
            <Play size={19} />
          </motion.button>

          {/* Webview */}
          <motion.button whileTap={{ scale: 0.88 }} className="w-10 h-10 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary/50 rounded-lg transition-colors" data-testid="toolbar-webview" title="Webview">
            <Monitor size={19} />
          </motion.button>

          {/* Agent — active with glow + underline indicator */}
          <motion.button
            whileTap={{ scale: 0.88 }}
            className="relative w-11 h-11 flex flex-col items-center justify-center gap-0.5 rounded-xl bg-[#2a1f4e]/70 border border-purple-500/30 transition-colors"
            data-testid="toolbar-agent"
            title="Agent"
          >
            <motion.div
              animate={{ scale: [1, 1.08, 1], opacity: [0.85, 1, 0.85] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            >
              <AgentIcon size={22} className="text-purple-400" />
            </motion.div>
            {/* Active underline */}
            <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-5 h-0.5 rounded-full bg-purple-400" />
          </motion.button>

          {/* Separator */}
          <div className="w-px h-6 bg-border/50 mx-1" />

          {/* Deploy */}
          <motion.button whileTap={{ scale: 0.88 }} className="w-10 h-10 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary/50 rounded-lg transition-colors" data-testid="toolbar-deploy" title="Deploy">
            <Globe size={19} />
          </motion.button>

          {/* New Tab */}
          <motion.button whileTap={{ scale: 0.88 }} className="w-10 h-10 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary/50 rounded-lg transition-colors" data-testid="toolbar-new-tab" title="New Tab">
            <Plus size={19} />
          </motion.button>

          {/* Files */}
          <motion.button whileTap={{ scale: 0.88 }} className="w-10 h-10 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary/50 rounded-lg transition-colors" data-testid="toolbar-files" title="Files">
            <AlignJustify size={19} />
          </motion.button>

          {/* Split */}
          <motion.button whileTap={{ scale: 0.88 }} className="w-10 h-10 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary/50 rounded-lg transition-colors" data-testid="toolbar-split" title="Split Screen">
            <LayoutPanelLeft size={19} />
          </motion.button>
        </div>
      </div>

      {/* ── History Panel (slides in from right) ── */}
      <AnimatePresence>
        {showHistory && <HistoryPanel onClose={() => setShowHistory(false)} />}
      </AnimatePresence>

      {/* ── Git Panel (slides up from bottom) ── */}
      <AnimatePresence>
        {showGit && <GitPanel onClose={() => setShowGit(false)} />}
      </AnimatePresence>
    </motion.div>
  );
}
