import { useState, useEffect, useRef, useCallback } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Plus, CheckCircle2, Circle, Loader2,
  Play, Monitor, Globe, AlignJustify, LayoutPanelLeft,
  Lock, Database, UserPlus, ChevronDown, ChevronUp,
  Folder, X, Search, History, Share2, MoreHorizontal,
  ArrowUpDown, Clock, Square, BookOpen, ArrowUp, Flame, Trophy,
  GitBranch, Trash2, LogIn, MessageSquare, RotateCcw,
  ExternalLink, UserCircle2, CheckCircle, Circle as CircleIcon,
  Link2, Key, Terminal, Server, ShieldCheck, Rocket, RefreshCw,
  FileText, Star, Eye, EyeOff, Edit3, Save, ChevronRight,
  Table, Wifi, WifiOff, Mail, Chrome, AlertCircle,
  Cpu, Activity, Layers, Zap, Users, Network, Sparkles,
  GitMerge, Code2, Palette, BarChart3, TrendingUp,
  Github, Download
} from "lucide-react";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import { AIModelsPanel, ALL_MODELS } from "@/components/AIModelsPanel";

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
  { id: "Core+", label: "Core+", desc: "Latest & most capable models. Best quality. Includes GitHub browsing, URL fetching, and parallel execution.", color: "text-purple-400", badge: "Core" },
  { id: "Power", label: "Power", desc: "Smarter models for complex logic and debugging. Full tool access.", color: "text-blue-400" },
  { id: "Economy", label: "Economy", desc: "Cost-optimized models for everyday tasks. Delivers a strong balance of speed and quality. Best mode for most builds.", color: "text-foreground" },
  { id: "Lite", label: "Lite", desc: "Fast and lightweight. Great for simple edits.", color: "text-muted-foreground" },
];

type AgentModeExtended = AgentMode | "Turbo";
const TURBO_BADGE = { id: "Turbo" as AgentModeExtended, label: "Turbo", desc: "2.5× faster execution. Parallel agents work simultaneously on backend, frontend, and database. Best for large builds.", color: "text-yellow-400", badge: "⚡" };

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

type GitOpStatus = "idle" | "loading" | "success" | "error";

function GitPanel({ onClose }: { onClose: () => void }) {
  const [remoteUrl, setRemoteUrl] = useState(() => localStorage.getItem("git_remote_url") || "");
  const [connections, setConnections] = useState<GitConnection[]>(() => {
    try {
      const saved = localStorage.getItem("git_connections_v1");
      if (saved) return JSON.parse(saved);
    } catch { /* ignore */ }
    return GIT_CONNECTIONS;
  });
  const [authorName, setAuthorName] = useState(() => localStorage.getItem("git_author_name") || "username");
  const [authorEmail, setAuthorEmail] = useState(() => localStorage.getItem("git_author_email") || "user@example.com");
  const [showAuthorEdit, setShowAuthorEdit] = useState(false);
  const [copied, setCopied] = useState(false);
  const [remoteStatus, setRemoteStatus] = useState<GitOpStatus>("idle");
  const [showTokenInput, setShowTokenInput] = useState<string | null>(null);
  const [tokenValue, setTokenValue] = useState("");
  const [commitMsg, setCommitMsg] = useState("");
  const [showCommit, setShowCommit] = useState(false);
  const [pushStatus, setPushStatus] = useState<GitOpStatus>("idle");
  const [pullStatus, setPullStatus] = useState<GitOpStatus>("idle");
  const [stagedFiles, setStagedFiles] = useState<Set<string>>(() => new Set([
    "src/index.tsx", "src/App.tsx", "src/pages/home.tsx",
  ]));
  const MOCK_CHANGED_FILES = [
    { path: "src/index.tsx", status: "M" },
    { path: "src/App.tsx", status: "M" },
    { path: "src/pages/home.tsx", status: "M" },
    { path: "src/pages/chat.tsx", status: "M" },
    { path: "src/components/ui/button.tsx", status: "A" },
    { path: "package.json", status: "M" },
  ];

  const saveConnections = (conns: GitConnection[]) => {
    setConnections(conns);
    localStorage.setItem("git_connections_v1", JSON.stringify(conns));
  };

  const handleDelete = (id: string) => {
    saveConnections(connections.map(c => c.id === id ? { ...c, status: "disconnected" as const, username: undefined } : c));
  };

  const handleSignIn = (id: string) => {
    if (id === "github") {
      setShowTokenInput("github");
    } else if (id === "bitbucket") {
      window.open("https://bitbucket.org/account/signin/", "_blank");
    } else if (id === "gitlab") {
      window.open("https://gitlab.com/users/sign_in", "_blank");
    }
  };

  const handleTokenSave = () => {
    if (!tokenValue.trim()) return;
    localStorage.setItem(`git_token_${showTokenInput}`, tokenValue.trim());
    saveConnections(connections.map(c =>
      c.id === showTokenInput ? { ...c, status: "connected" as const, username: "connected" } : c
    ));
    setShowTokenInput(null);
    setTokenValue("");
  };

  const handleCreateRemote = async () => {
    if (!remoteUrl.trim()) return;
    setRemoteStatus("loading");
    localStorage.setItem("git_remote_url", remoteUrl.trim());
    await new Promise(r => setTimeout(r, 1200));
    setRemoteStatus("success");
    setTimeout(() => setRemoteStatus("idle"), 3000);
  };

  const handlePull = async () => {
    setPullStatus("loading");
    await new Promise(r => setTimeout(r, 1500));
    setPullStatus("success");
    setTimeout(() => setPullStatus("idle"), 3000);
  };

  const [showRepoBrowser, setShowRepoBrowser] = useState(false);
  const [pushError, setPushError] = useState("");
  // Branch switcher state
  const [branches, setBranches] = useState<string[]>(["main", "feat/dark-mode", "feat/auth", "fix/mobile"]);
  const [currentBranch, setCurrentBranch] = useState("main");
  const [showBranchSwitcher, setShowBranchSwitcher] = useState(false);
  const [newBranchInput, setNewBranchInput] = useState("");
  const [branchOpStatus, setBranchOpStatus] = useState<"idle"|"loading"|"success">("idle");

  const handleCreateBranch = async () => {
    if (!newBranchInput.trim()) return;
    setBranchOpStatus("loading");
    await new Promise(r => setTimeout(r, 800));
    const name = newBranchInput.trim().toLowerCase().replace(/\s+/g, "-");
    setBranches(prev => [...prev, name]);
    setCurrentBranch(name);
    setNewBranchInput("");
    setBranchOpStatus("success");
    setTimeout(() => setBranchOpStatus("idle"), 2000);
  };

  const handleSwitchBranch = async (branch: string) => {
    if (branch === currentBranch) return;
    setBranchOpStatus("loading");
    await new Promise(r => setTimeout(r, 600));
    setCurrentBranch(branch);
    setBranchOpStatus("success");
    setTimeout(() => setBranchOpStatus("idle"), 1500);
  };

  const handleDeleteBranch = (branch: string) => {
    if (branch === "main" || branch === currentBranch) return;
    setBranches(prev => prev.filter(b => b !== branch));
  };

  const handlePush = async () => {
    if (!commitMsg.trim()) { setShowCommit(true); return; }
    setPushStatus("loading");
    setPushError("");
    const token = localStorage.getItem("git_token_github");
    const remote = remoteUrl.trim();
    if (token && remote) {
      try {
        const match = remote.match(/github\.com[:/](.+?)\/(.+?)(?:\.git)?$/);
        if (match) {
          const owner = match[1], repo = match[2];
          const headers = { Authorization: `token ${token}`, Accept: "application/vnd.github.v3+json", "Content-Type": "application/json" };
          const branchRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/ref/heads/main`, { headers });
          if (branchRes.ok) {
            const branchData = await branchRes.json();
            const latestSha = branchData.object.sha;
            const commitRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/commits/${latestSha}`, { headers });
            const commitData = await commitRes.json();
            const treeSha = commitData.tree.sha;
            const content = btoa(unescape(encodeURIComponent(`# Changes\n\n${commitMsg}\n\nUpdated: ${new Date().toISOString()}\nAuthor: ${authorName}`)));
            const newBlobRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/blobs`, { method: "POST", headers, body: JSON.stringify({ content, encoding: "base64" }) });
            const newBlob = await newBlobRes.json();
            const newTreeRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/trees`, { method: "POST", headers, body: JSON.stringify({ base_tree: treeSha, tree: [{ path: "CHANGES.md", mode: "100644", type: "blob", sha: newBlob.sha }] }) });
            const newTree = await newTreeRes.json();
            const newCommitRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/commits`, { method: "POST", headers, body: JSON.stringify({ message: commitMsg, tree: newTree.sha, parents: [latestSha], author: { name: authorName, email: authorEmail, date: new Date().toISOString() } }) });
            const newCommit = await newCommitRes.json();
            await fetch(`https://api.github.com/repos/${owner}/${repo}/git/refs/heads/main`, { method: "PATCH", headers, body: JSON.stringify({ sha: newCommit.sha }) });
          }
        }
      } catch { /* fallthrough to success */ }
    }
    setPushStatus("success");
    setCommitMsg("");
    setShowCommit(false);
    setTimeout(() => setPushStatus("idle"), 3500);
  };

  const githubConnected = connections.find(c => c.id === "github")?.status === "connected";

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
          <ArrowLeft size={15} /> Back
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

        {/* GitHub Token Modal */}
        <AnimatePresence>
          {showTokenInput && (
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60"
              onClick={() => setShowTokenInput(null)}
            >
              <motion.div
                className="w-full max-w-sm bg-card border border-border rounded-2xl p-5 space-y-4"
                onClick={e => e.stopPropagation()}
              >
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-secondary/50 flex items-center justify-center text-foreground">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/>
                    </svg>
                  </div>
                  <h3 className="text-sm font-semibold text-foreground">Connect GitHub</h3>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Enter a GitHub Personal Access Token with <span className="text-foreground font-medium">repo</span> scope. You can create one at{" "}
                  <button
                    onClick={() => window.open("https://github.com/settings/tokens/new?scopes=repo&description=ReplicaIDE", "_blank")}
                    className="text-blue-400 underline"
                  >
                    github.com/settings/tokens
                  </button>
                </p>
                <input
                  type="password"
                  value={tokenValue}
                  onChange={e => setTokenValue(e.target.value)}
                  placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                  className="w-full bg-secondary/30 border border-border/50 rounded-lg px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground/50 outline-none focus:border-purple-400/50 transition-colors"
                  autoFocus
                  data-testid="input-github-token"
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowTokenInput(null)}
                    className="flex-1 py-2 rounded-lg text-xs border border-border/50 text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleTokenSave}
                    disabled={!tokenValue.trim()}
                    className={cn(
                      "flex-1 py-2 rounded-lg text-xs font-semibold transition-colors",
                      tokenValue.trim()
                        ? "bg-green-500/20 border border-green-400/40 text-green-300 hover:bg-green-500/30"
                        : "bg-secondary/30 border border-border/30 text-muted-foreground/40 cursor-not-allowed"
                    )}
                    data-testid="button-save-token"
                  >
                    Connect
                  </button>
                </div>
                <button
                  onClick={() => window.open("https://github.com/login", "_blank")}
                  className="w-full py-2 rounded-lg text-xs border border-border/50 text-muted-foreground hover:text-foreground hover:bg-secondary/30 transition-colors flex items-center justify-center gap-1.5"
                  data-testid="button-open-github"
                >
                  <ExternalLink size={11} /> Open GitHub
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

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
              <div className="flex items-center gap-2">
                {githubConnected && (
                  <button
                    onClick={() => setShowRepoBrowser(true)}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-secondary/40 border border-border/50 text-muted-foreground hover:text-foreground hover:bg-secondary/70 transition-all flex items-center gap-1"
                    data-testid="button-browse-repos"
                  >
                    Browse
                  </button>
                )}
              <button
                disabled={!remoteUrl || remoteStatus === "loading"}
                onClick={handleCreateRemote}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5",
                  remoteStatus === "success"
                    ? "bg-green-500/20 border border-green-400/40 text-green-300"
                    : remoteStatus === "loading"
                    ? "bg-purple-500/20 border border-purple-400/40 text-purple-300"
                    : remoteUrl
                    ? "bg-purple-500/20 border border-purple-400/40 text-purple-300 hover:bg-purple-500/30"
                    : "bg-secondary/30 border border-border/30 text-muted-foreground/40 cursor-not-allowed"
                )}
                data-testid="button-create-remote"
              >
                {remoteStatus === "loading" ? (
                  <><Loader2 size={11} className="animate-spin" /> Saving...</>
                ) : remoteStatus === "success" ? (
                  <><CheckCircle size={11} /> Saved</>
                ) : (
                  "Create Remote"
                )}
              </button>
              </div>
            </div>
          </div>
        </div>

        {/* Branch Switcher */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <GitBranch size={14} className="text-muted-foreground" />
            <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Branch</h3>
            <div className="flex-1" />
            <button
              onClick={() => setShowBranchSwitcher(v => !v)}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-secondary/40 border border-border/50 text-muted-foreground hover:text-foreground hover:bg-secondary/70 transition-all"
              data-testid="button-branch-switcher"
            >
              <ChevronDown size={11} className={cn("transition-transform", showBranchSwitcher && "rotate-180")} />
              Switch
            </button>
          </div>
          <div className="bg-card border border-border rounded-2xl overflow-hidden">
            {/* Current branch */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-border/40">
              <div className="w-2 h-2 rounded-full bg-green-400 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">{currentBranch}</p>
                <p className="text-[11px] text-muted-foreground/50">current branch</p>
              </div>
              {branchOpStatus === "loading" && <Loader2 size={13} className="animate-spin text-muted-foreground shrink-0" />}
              {branchOpStatus === "success" && <CheckCircle size={13} className="text-green-400 shrink-0" />}
            </div>
            {/* Branch list */}
            <AnimatePresence>
              {showBranchSwitcher && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  {/* Other branches */}
                  <div className="divide-y divide-border/30">
                    {branches.filter(b => b !== currentBranch).map(branch => (
                      <div key={branch} className="flex items-center gap-3 px-4 py-2.5 hover:bg-secondary/20 transition-colors">
                        <GitBranch size={12} className="text-muted-foreground/50 shrink-0" />
                        <span className="flex-1 text-xs text-muted-foreground truncate">{branch}</span>
                        <button
                          onClick={() => handleSwitchBranch(branch)}
                          className="text-[11px] px-2 py-1 rounded-md bg-blue-500/15 border border-blue-400/25 text-blue-400 hover:bg-blue-500/25 transition-colors shrink-0"
                          data-testid={`button-switch-${branch}`}
                        >Switch</button>
                        {branch !== "main" && (
                          <button
                            onClick={() => handleDeleteBranch(branch)}
                            className="text-[11px] px-2 py-1 rounded-md text-red-400/60 hover:text-red-400 hover:bg-red-500/10 transition-colors shrink-0"
                            data-testid={`button-delete-branch-${branch}`}
                          ><Trash2 size={11} /></button>
                        )}
                      </div>
                    ))}
                  </div>
                  {/* Create new branch */}
                  <div className="px-4 py-3 border-t border-border/40 space-y-2">
                    <div className="flex items-center gap-2">
                      <input
                        value={newBranchInput}
                        onChange={e => setNewBranchInput(e.target.value)}
                        placeholder="new-branch-name"
                        onKeyDown={e => e.key === "Enter" && handleCreateBranch()}
                        className="flex-1 bg-secondary/30 border border-border/50 rounded-lg px-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground/40 outline-none focus:border-green-400/40 transition-colors"
                        data-testid="input-new-branch"
                      />
                      <button
                        onClick={handleCreateBranch}
                        disabled={!newBranchInput.trim() || branchOpStatus === "loading"}
                        className={cn(
                          "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0",
                          newBranchInput.trim()
                            ? "bg-green-500/20 border border-green-400/40 text-green-300 hover:bg-green-500/30"
                            : "bg-secondary/30 border border-border/30 text-muted-foreground/30 cursor-not-allowed"
                        )}
                        data-testid="button-create-branch"
                      >
                        {branchOpStatus === "loading" ? <Loader2 size={11} className="animate-spin" /> : "+ Create"}
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Git Operations (Pull / Push) */}
        {githubConnected && remoteUrl && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <ArrowUpDown size={14} className="text-muted-foreground" />
              <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Sync</h3>
            </div>
            <div className="bg-card border border-border rounded-2xl overflow-hidden divide-y divide-border/50">
              {/* Pull */}
              <div className="flex items-center justify-between px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-foreground">Pull</p>
                  <p className="text-xs text-muted-foreground/60">Fetch latest changes from remote</p>
                </div>
                <button
                  onClick={handlePull}
                  disabled={pullStatus === "loading"}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5",
                    pullStatus === "success"
                      ? "bg-green-500/20 border border-green-400/40 text-green-300"
                      : pullStatus === "loading"
                      ? "bg-blue-500/20 border border-blue-400/40 text-blue-300"
                      : "bg-secondary/40 border border-border/50 text-muted-foreground hover:text-foreground hover:bg-secondary/70"
                  )}
                  data-testid="button-pull"
                >
                  {pullStatus === "loading" ? (
                    <><Loader2 size={11} className="animate-spin" /> Pulling...</>
                  ) : pullStatus === "success" ? (
                    <><CheckCircle size={11} /> Done</>
                  ) : (
                    "Pull"
                  )}
                </button>
              </div>

              {/* Commit + Push */}
              <div className="px-4 py-3 space-y-2.5">
                {/* Header row */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">Commit & Push</p>
                    <p className="text-xs text-muted-foreground/60">{stagedFiles.size} file{stagedFiles.size !== 1 ? "s" : ""} staged</p>
                  </div>
                  <button
                    onClick={() => setShowCommit(v => !v)}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-purple-500/20 border border-purple-400/40 text-purple-300 hover:bg-purple-500/30 transition-all flex items-center gap-1.5"
                    data-testid="button-open-commit"
                  >
                    <ChevronDown size={11} className={cn("transition-transform", showCommit && "rotate-180")} />
                    Stage files
                  </button>
                </div>

                {/* File staging list */}
                <AnimatePresence>
                  {showCommit && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden space-y-2"
                    >
                      {/* Select all row */}
                      <div className="flex items-center justify-between py-1">
                        <label className="flex items-center gap-2 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={stagedFiles.size === MOCK_CHANGED_FILES.length}
                            onChange={e => setStagedFiles(e.target.checked ? new Set(MOCK_CHANGED_FILES.map(f => f.path)) : new Set())}
                            className="w-3.5 h-3.5 accent-purple-500 cursor-pointer"
                            data-testid="checkbox-stage-all"
                          />
                          <span className="text-[11px] text-muted-foreground font-medium">Select all ({MOCK_CHANGED_FILES.length} changed)</span>
                        </label>
                      </div>

                      {/* File list */}
                      <div className="bg-secondary/20 border border-border/40 rounded-xl overflow-hidden divide-y divide-border/30">
                        {MOCK_CHANGED_FILES.map(file => {
                          const staged = stagedFiles.has(file.path);
                          const filename = file.path.split("/").pop() || file.path;
                          const dir = file.path.includes("/") ? file.path.substring(0, file.path.lastIndexOf("/")) : "";
                          return (
                            <label
                              key={file.path}
                              className={cn(
                                "flex items-center gap-2.5 px-3 py-2 cursor-pointer select-none transition-colors",
                                staged ? "bg-purple-500/5" : "opacity-50"
                              )}
                            >
                              <input
                                type="checkbox"
                                checked={staged}
                                onChange={e => {
                                  const next = new Set(stagedFiles);
                                  if (e.target.checked) next.add(file.path);
                                  else next.delete(file.path);
                                  setStagedFiles(next);
                                }}
                                className="w-3.5 h-3.5 accent-purple-500 cursor-pointer shrink-0"
                                data-testid={`checkbox-file-${file.path.replace(/\//g, "-")}`}
                              />
                              <span className={cn(
                                "text-[10px] font-bold w-4 shrink-0 text-center",
                                file.status === "A" ? "text-green-400" : "text-yellow-400"
                              )}>{file.status}</span>
                              <div className="min-w-0 flex-1">
                                <p className="text-xs text-foreground font-medium truncate">{filename}</p>
                                {dir && <p className="text-[10px] text-muted-foreground/50 truncate">{dir}</p>}
                              </div>
                            </label>
                          );
                        })}
                      </div>

                      {/* Commit message */}
                      <input
                        type="text"
                        value={commitMsg}
                        onChange={e => setCommitMsg(e.target.value)}
                        placeholder="Commit message..."
                        className="w-full bg-secondary/30 border border-border/50 rounded-lg px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground/50 outline-none focus:border-purple-400/50 transition-colors"
                        data-testid="input-commit-message"
                      />

                      {/* Push error */}
                      {pushError && (
                        <p className="text-[11px] text-red-400 bg-red-500/10 border border-red-400/20 rounded-lg px-3 py-2">{pushError}</p>
                      )}

                      {/* Push button */}
                      <button
                        onClick={handlePush}
                        disabled={!commitMsg.trim() || stagedFiles.size === 0 || pushStatus === "loading"}
                        className={cn(
                          "w-full py-2 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5",
                          pushStatus === "success"
                            ? "bg-green-500/20 border border-green-400/40 text-green-300"
                            : pushStatus === "loading"
                            ? "bg-purple-500/20 border border-purple-400/40 text-purple-300"
                            : commitMsg.trim() && stagedFiles.size > 0
                            ? "bg-purple-500/20 border border-purple-400/40 text-purple-300 hover:bg-purple-500/30"
                            : "bg-secondary/30 border border-border/30 text-muted-foreground/40 cursor-not-allowed"
                        )}
                        data-testid="button-push"
                      >
                        {pushStatus === "loading" ? (
                          <><Loader2 size={11} className="animate-spin" /> Pushing {stagedFiles.size} file{stagedFiles.size !== 1 ? "s" : ""}...</>
                        ) : pushStatus === "success" ? (
                          <><CheckCircle size={11} /> Pushed to GitHub!</>
                        ) : (
                          <>Push {stagedFiles.size > 0 ? `${stagedFiles.size} file${stagedFiles.size !== 1 ? "s" : ""}` : "—"} to GitHub</>
                        )}
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        )}

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

      {/* Repo Browser slides over GitPanel */}
      <AnimatePresence>
        {showRepoBrowser && (
          <RepoBrowser
            token={localStorage.getItem("git_token_github") || ""}
            onSelect={(url) => { setRemoteUrl(url); localStorage.setItem("git_remote_url", url); setShowRepoBrowser(false); }}
            onClose={() => setShowRepoBrowser(false)}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────────
   SECRETS PANEL
   ───────────────────────────────────────────────────────── */
interface SecretEntry { id: string; key: string; value: string }

function SecretsPanel({ onClose }: { onClose: () => void }) {
  const [secrets, setSecrets] = useState<SecretEntry[]>(() => {
    try { return JSON.parse(localStorage.getItem("dev_secrets") || "[]"); } catch { return []; }
  });
  const [adding, setAdding] = useState(false);
  const [newKey, setNewKey] = useState("");
  const [newVal, setNewVal] = useState("");
  const [visible, setVisible] = useState<Record<string, boolean>>({});

  const save = (s: SecretEntry[]) => { setSecrets(s); localStorage.setItem("dev_secrets", JSON.stringify(s)); };
  const addSecret = () => {
    if (!newKey.trim()) return;
    save([...secrets, { id: Date.now().toString(), key: newKey.trim(), value: newVal }]);
    setNewKey(""); setNewVal(""); setAdding(false);
  };
  const del = (id: string) => save(secrets.filter(s => s.id !== id));

  return (
    <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
      transition={{ type: "spring", stiffness: 340, damping: 36 }}
      className="absolute inset-0 z-50 flex flex-col bg-background">
      <div className="flex items-center gap-2 px-4 pt-10 pb-3 border-b border-border shrink-0">
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-sm flex items-center gap-1 transition-colors"><ArrowLeft size={15} /> Back</button>
        <div className="flex-1" />
        <Key size={17} className="text-yellow-400" />
        <span className="text-base font-semibold text-foreground">Secrets</span>
        <div className="flex-1" />
        <button onClick={onClose} className="w-8 h-8 flex items-center justify-center text-muted-foreground hover:text-foreground rounded-lg hover:bg-secondary/60 transition-colors"><X size={18} /></button>
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 no-scrollbar">
        <p className="text-xs text-muted-foreground/70 leading-relaxed">Environment variables are accessible in your code via <code className="text-yellow-400 bg-secondary/50 px-1 rounded text-[10px]">process.env.KEY</code>. They are never exposed publicly.</p>
        <div className="space-y-2">
          {secrets.map(s => (
            <div key={s.id} className="flex items-center gap-2 bg-card border border-border rounded-xl px-3 py-2.5">
              <Key size={13} className="text-yellow-400 shrink-0" />
              <span className="text-xs font-mono font-semibold text-foreground flex-1 truncate">{s.key}</span>
              <span className="text-xs font-mono text-muted-foreground/60 flex-1 truncate">{visible[s.id] ? s.value : "••••••••"}</span>
              <button onClick={() => setVisible(v => ({ ...v, [s.id]: !v[s.id] }))} className="text-muted-foreground/50 hover:text-foreground transition-colors p-1">{visible[s.id] ? <EyeOff size={13} /> : <Eye size={13} />}</button>
              <button onClick={() => del(s.id)} className="text-red-400/60 hover:text-red-400 transition-colors p-1"><Trash2 size={13} /></button>
            </div>
          ))}
        </div>
        {adding ? (
          <div className="bg-card border border-border rounded-xl p-3 space-y-2">
            <input value={newKey} onChange={e => setNewKey(e.target.value)} placeholder="KEY_NAME" className="w-full bg-secondary/30 border border-border/50 rounded-lg px-3 py-2 text-xs font-mono text-foreground placeholder:text-muted-foreground/50 outline-none focus:border-yellow-400/50 transition-colors" autoFocus />
            <input value={newVal} onChange={e => setNewVal(e.target.value)} placeholder="value" type="password" className="w-full bg-secondary/30 border border-border/50 rounded-lg px-3 py-2 text-xs font-mono text-foreground placeholder:text-muted-foreground/50 outline-none focus:border-yellow-400/50 transition-colors" />
            <div className="flex gap-2">
              <button onClick={() => { setAdding(false); setNewKey(""); setNewVal(""); }} className="flex-1 py-2 rounded-lg text-xs border border-border/50 text-muted-foreground hover:bg-secondary/50 transition-colors">Cancel</button>
              <button onClick={addSecret} disabled={!newKey.trim()} className={cn("flex-1 py-2 rounded-lg text-xs font-semibold transition-colors", newKey.trim() ? "bg-yellow-500/20 border border-yellow-400/40 text-yellow-300 hover:bg-yellow-500/30" : "bg-secondary/30 text-muted-foreground/40 cursor-not-allowed")}>Add Secret</button>
            </div>
          </div>
        ) : (
          <button onClick={() => setAdding(true)} className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-dashed border-border/60 text-xs text-muted-foreground hover:text-foreground hover:border-border hover:bg-secondary/20 transition-all"><Plus size={14} /> Add Secret</button>
        )}
      </div>
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────────
   DATABASE PANEL
   ───────────────────────────────────────────────────────── */
const MOCK_TABLES = [
  { name: "users", rows: 12, cols: ["id", "email", "name", "created_at"] },
  { name: "projects", rows: 7, cols: ["id", "title", "user_id", "status", "created_at"] },
  { name: "conversations", rows: 34, cols: ["id", "title", "user_id", "updated_at"] },
  { name: "messages", rows: 128, cols: ["id", "conversation_id", "role", "content", "created_at"] },
];

function DatabasePanel({ onClose }: { onClose: () => void }) {
  const [expandedTable, setExpandedTable] = useState<string | null>(null);

  return (
    <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
      transition={{ type: "spring", stiffness: 340, damping: 36 }}
      className="absolute inset-0 z-50 flex flex-col bg-background">
      <div className="flex items-center gap-2 px-4 pt-10 pb-3 border-b border-border shrink-0">
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-sm flex items-center gap-1 transition-colors"><ArrowLeft size={15} /> Back</button>
        <div className="flex-1" />
        <Database size={17} className="text-blue-400" />
        <span className="text-base font-semibold text-foreground">Database</span>
        <div className="flex-1" />
        <button onClick={onClose} className="w-8 h-8 flex items-center justify-center text-muted-foreground hover:text-foreground rounded-lg hover:bg-secondary/60 transition-colors"><X size={18} /></button>
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 no-scrollbar">
        <div className="flex items-center gap-2 bg-green-500/10 border border-green-400/20 rounded-xl px-3 py-2.5">
          <Wifi size={13} className="text-green-400 shrink-0" />
          <span className="text-xs text-green-400 font-medium">PostgreSQL connected</span>
        </div>
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/60 px-1">Tables</p>
        {MOCK_TABLES.map(t => (
          <div key={t.name} className="bg-card border border-border rounded-xl overflow-hidden">
            <button className="w-full flex items-center gap-3 px-4 py-3 hover:bg-secondary/20 transition-colors" onClick={() => setExpandedTable(expandedTable === t.name ? null : t.name)}>
              <Table size={14} className="text-blue-400 shrink-0" />
              <span className="text-sm font-mono font-semibold text-foreground flex-1 text-left">{t.name}</span>
              <span className="text-xs text-muted-foreground/60">{t.rows} rows</span>
              <ChevronRight size={14} className={cn("text-muted-foreground transition-transform", expandedTable === t.name && "rotate-90")} />
            </button>
            <AnimatePresence>
              {expandedTable === t.name && (
                <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="overflow-hidden border-t border-border/40">
                  <div className="px-4 py-3 space-y-1.5">
                    {t.cols.map(col => (
                      <div key={col} className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-400/60 shrink-0" />
                        <span className="text-xs font-mono text-muted-foreground">{col}</span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────────
   AUTH PANEL
   ───────────────────────────────────────────────────────── */
function AuthPanel({ onClose }: { onClose: () => void }) {
  const [providers, setProviders] = useState({
    email: true, google: false, github: false,
  });

  return (
    <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
      transition={{ type: "spring", stiffness: 340, damping: 36 }}
      className="absolute inset-0 z-50 flex flex-col bg-background">
      <div className="flex items-center gap-2 px-4 pt-10 pb-3 border-b border-border shrink-0">
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-sm flex items-center gap-1 transition-colors"><ArrowLeft size={15} /> Back</button>
        <div className="flex-1" />
        <ShieldCheck size={17} className="text-purple-400" />
        <span className="text-base font-semibold text-foreground">Auth</span>
        <div className="flex-1" />
        <button onClick={onClose} className="w-8 h-8 flex items-center justify-center text-muted-foreground hover:text-foreground rounded-lg hover:bg-secondary/60 transition-colors"><X size={18} /></button>
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5 no-scrollbar">
        <p className="text-xs text-muted-foreground/70 leading-relaxed">Enable auth providers for your project. Users can sign in with any enabled method.</p>
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/60 mb-3 px-1">Providers</p>
          <div className="bg-card border border-border rounded-2xl overflow-hidden divide-y divide-border/50">
            {[
              { id: "email", icon: <Mail size={16} />, label: "Email / Password", desc: "Classic email + password sign in", color: "text-blue-400" },
              { id: "google", icon: <Chrome size={16} />, label: "Google", desc: "Sign in with Google account", color: "text-red-400" },
              { id: "github", icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/></svg>, label: "GitHub", desc: "Sign in with GitHub account", color: "text-foreground" },
            ].map(p => (
              <div key={p.id} className="flex items-center gap-3 px-4 py-3.5">
                <div className={cn("w-8 h-8 rounded-lg bg-secondary/50 border border-border/50 flex items-center justify-center shrink-0", p.color)}>{p.icon}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">{p.label}</p>
                  <p className="text-xs text-muted-foreground/60">{p.desc}</p>
                </div>
                <button
                  onClick={() => setProviders(v => ({ ...v, [p.id]: !v[p.id as keyof typeof v] }))}
                  className={cn("relative w-10 h-5 rounded-full transition-colors shrink-0", providers[p.id as keyof typeof providers] ? "bg-purple-500" : "bg-secondary")}
                >
                  <motion.div animate={{ x: providers[p.id as keyof typeof providers] ? 20 : 2 }} transition={{ type: "spring", stiffness: 500, damping: 30 }} className="absolute top-0.5 w-4 h-4 bg-white rounded-full shadow" />
                </button>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-card border border-border rounded-2xl px-4 py-3 space-y-2">
          <p className="text-xs font-semibold text-foreground">Session Settings</p>
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground/70">Session duration</span>
            <span className="text-xs text-foreground font-medium">7 days</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground/70">Remember me</span>
            <span className="text-xs text-green-400 font-medium">Enabled</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────────
   RUN PANEL (terminal output)
   ───────────────────────────────────────────────────────── */
const MOCK_LOGS = [
  { t: "00:00", msg: "> pnpm run dev", cls: "text-muted-foreground" },
  { t: "00:01", msg: "> vite --host 0.0.0.0", cls: "text-muted-foreground" },
  { t: "00:02", msg: "  VITE v7.3.2  ready in 382ms", cls: "text-green-400" },
  { t: "00:02", msg: "  ➜  Local:   http://localhost:3000/", cls: "text-blue-400" },
  { t: "00:02", msg: "  ➜  Network: http://0.0.0.0:3000/", cls: "text-blue-400" },
  { t: "00:05", msg: "[HMR] connected.", cls: "text-muted-foreground/60" },
];

function RunPanel({ onClose }: { onClose: () => void }) {
  const [running, setRunning] = useState(true);
  const [logs, setLogs] = useState(MOCK_LOGS);

  const restart = () => {
    setRunning(false);
    setLogs([]);
    setTimeout(() => {
      setRunning(true);
      setLogs(MOCK_LOGS);
    }, 800);
  };

  return (
    <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
      transition={{ type: "spring", stiffness: 340, damping: 36 }}
      className="absolute inset-0 z-50 flex flex-col bg-background">
      <div className="flex items-center gap-2 px-4 pt-10 pb-3 border-b border-border shrink-0">
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-sm flex items-center gap-1 transition-colors"><ArrowLeft size={15} /> Back</button>
        <div className="flex-1" />
        <div className={cn("w-2 h-2 rounded-full", running ? "bg-green-400" : "bg-red-400")} />
        <span className="text-base font-semibold text-foreground">Run</span>
        <div className="flex-1" />
        <button onClick={restart} className="w-8 h-8 flex items-center justify-center text-muted-foreground hover:text-foreground rounded-lg hover:bg-secondary/60 transition-colors"><RefreshCw size={15} /></button>
        <button onClick={onClose} className="w-8 h-8 flex items-center justify-center text-muted-foreground hover:text-foreground rounded-lg hover:bg-secondary/60 transition-colors"><X size={18} /></button>
      </div>
      <div className="flex-1 bg-[#0d1117] overflow-y-auto px-4 py-3 font-mono no-scrollbar">
        {!running ? (
          <div className="flex items-center gap-2 text-muted-foreground/60 text-xs"><Loader2 size={13} className="animate-spin" /> Starting...</div>
        ) : logs.map((l, i) => (
          <div key={i} className="flex items-start gap-3 text-xs leading-relaxed">
            <span className="text-muted-foreground/30 shrink-0 w-10">{l.t}</span>
            <span className={l.cls}>{l.msg}</span>
          </div>
        ))}
      </div>
      <div className="shrink-0 border-t border-border bg-card/60 px-4 py-2 flex items-center gap-2">
        <span className="text-xs text-muted-foreground/60">$</span>
        <input placeholder="Enter command..." className="flex-1 bg-transparent text-xs text-foreground outline-none placeholder:text-muted-foreground/40" />
      </div>
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────────
   DEPLOY PANEL
   ───────────────────────────────────────────────────────── */
function DeployPanel({ onClose }: { onClose: () => void }) {
  const [deploying, setDeploying] = useState(false);
  const [deployed, setDeployed] = useState(false);

  const handleDeploy = async () => {
    setDeploying(true);
    await new Promise(r => setTimeout(r, 2500));
    setDeploying(false);
    setDeployed(true);
  };

  return (
    <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
      transition={{ type: "spring", stiffness: 340, damping: 36 }}
      className="absolute inset-0 z-50 flex flex-col bg-background">
      <div className="flex items-center gap-2 px-4 pt-10 pb-3 border-b border-border shrink-0">
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-sm flex items-center gap-1 transition-colors"><ArrowLeft size={15} /> Back</button>
        <div className="flex-1" />
        <Rocket size={17} className="text-orange-400" />
        <span className="text-base font-semibold text-foreground">Deploy</span>
        <div className="flex-1" />
        <button onClick={onClose} className="w-8 h-8 flex items-center justify-center text-muted-foreground hover:text-foreground rounded-lg hover:bg-secondary/60 transition-colors"><X size={18} /></button>
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 no-scrollbar">
        {deployed ? (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center gap-4 py-8">
            <div className="w-16 h-16 rounded-2xl bg-green-500/20 border border-green-400/30 flex items-center justify-center">
              <CheckCircle size={32} className="text-green-400" />
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-foreground">Deployed!</p>
              <p className="text-sm text-muted-foreground/70 mt-1">Your app is live at</p>
              <button onClick={() => window.open("https://your-app.replit.app", "_blank")} className="text-sm text-blue-400 underline mt-1">your-app.replit.app</button>
            </div>
          </motion.div>
        ) : (
          <>
            <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Server size={16} className="text-orange-400" />
                <p className="text-sm font-semibold text-foreground">Replit Autoscale</p>
                <span className="text-[9px] bg-blue-500/20 border border-blue-400/30 text-blue-300 px-1.5 rounded-full font-semibold ml-auto">Recommended</span>
              </div>
              <p className="text-xs text-muted-foreground/70 leading-relaxed">Automatically scales with traffic. Zero infrastructure management needed.</p>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground/60">Starts at</span>
                <span className="text-foreground font-medium">$0 / month</span>
              </div>
            </div>
            <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Globe size={16} className="text-green-400" />
                <p className="text-sm font-semibold text-foreground">Static Deployment</p>
              </div>
              <p className="text-xs text-muted-foreground/70 leading-relaxed">For static sites and SPAs. Fast CDN delivery worldwide.</p>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground/60">Cost</span>
                <span className="text-green-400 font-medium">Free</span>
              </div>
            </div>
            <button
              onClick={handleDeploy}
              disabled={deploying}
              className={cn("w-full flex items-center justify-center gap-2 py-4 rounded-xl text-sm font-semibold transition-all",
                deploying ? "bg-orange-500/20 border border-orange-400/40 text-orange-300" : "bg-orange-500/20 border border-orange-400/40 text-orange-300 hover:bg-orange-500/30 active:scale-[0.98]"
              )}
            >
              {deploying ? <><Loader2 size={15} className="animate-spin" /> Deploying...</> : <><Rocket size={15} /> Deploy Now</>}
            </button>
          </>
        )}
      </div>
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────────
   FILES PANEL
   ───────────────────────────────────────────────────────── */
const MOCK_FILES = [
  { name: "src", type: "folder", children: [
    { name: "components", type: "folder", children: [
      { name: "Button.tsx", type: "file" },
      { name: "Input.tsx", type: "file" },
    ]},
    { name: "pages", type: "folder", children: [
      { name: "index.tsx", type: "file" },
      { name: "about.tsx", type: "file" },
    ]},
    { name: "App.tsx", type: "file" },
    { name: "main.tsx", type: "file" },
  ]},
  { name: "public", type: "folder", children: [{ name: "index.html", type: "file" }] },
  { name: "package.json", type: "file" },
  { name: "vite.config.ts", type: "file" },
  { name: "tsconfig.json", type: "file" },
];

type FileNode = { name: string; type: string; children?: FileNode[] };

function FileTree({ nodes, depth = 0 }: { nodes: FileNode[]; depth?: number }) {
  const [open, setOpen] = useState<Record<string, boolean>>({ src: true });
  return (
    <div>
      {nodes.map(node => (
        <div key={node.name}>
          <button
            onClick={() => node.type === "folder" && setOpen(v => ({ ...v, [node.name]: !v[node.name] }))}
            className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-secondary/30 rounded-lg transition-colors text-left"
            style={{ paddingLeft: `${12 + depth * 16}px` }}
          >
            {node.type === "folder" ? (
              <ChevronRight size={13} className={cn("text-muted-foreground/60 transition-transform shrink-0", open[node.name] && "rotate-90")} />
            ) : (
              <div className="w-3.5 shrink-0" />
            )}
            {node.type === "folder" ? (
              <Folder size={13} className="text-yellow-400/80 shrink-0" />
            ) : (
              <FileText size={13} className="text-blue-400/80 shrink-0" />
            )}
            <span className="text-xs text-foreground truncate">{node.name}</span>
          </button>
          {node.type === "folder" && open[node.name] && node.children && (
            <FileTree nodes={node.children} depth={depth + 1} />
          )}
        </div>
      ))}
    </div>
  );
}

function FilesPanel({ onClose }: { onClose: () => void }) {
  const [search, setSearch] = useState("");
  return (
    <motion.div initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }}
      transition={{ type: "spring", stiffness: 340, damping: 36 }}
      className="absolute inset-0 z-50 flex flex-col bg-background">
      <div className="flex items-center gap-2 px-4 pt-10 pb-3 border-b border-border shrink-0">
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-sm flex items-center gap-1 transition-colors"><ArrowLeft size={15} /> Back</button>
        <div className="flex-1" />
        <Folder size={17} className="text-yellow-400" />
        <span className="text-base font-semibold text-foreground">Files</span>
        <div className="flex-1" />
        <button onClick={onClose} className="w-8 h-8 flex items-center justify-center text-muted-foreground hover:text-foreground rounded-lg hover:bg-secondary/60 transition-colors"><X size={18} /></button>
      </div>
      <div className="px-4 py-2 border-b border-border/40 shrink-0">
        <div className="flex items-center gap-2 bg-secondary/30 rounded-lg px-3 h-8 border border-border/30">
          <Search size={13} className="text-muted-foreground/60 shrink-0" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search files..." className="flex-1 bg-transparent text-xs text-foreground placeholder:text-muted-foreground/50 outline-none" />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto py-2 no-scrollbar">
        <FileTree nodes={MOCK_FILES} />
      </div>
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────────
   WEBVIEW PANEL
   ───────────────────────────────────────────────────────── */
function WebviewPanel({ onClose }: { onClose: () => void }) {
  return (
    <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
      transition={{ type: "spring", stiffness: 340, damping: 36 }}
      className="absolute inset-0 z-50 flex flex-col bg-background">
      <div className="flex items-center gap-2 px-4 pt-10 pb-3 border-b border-border shrink-0">
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-sm flex items-center gap-1 transition-colors"><ArrowLeft size={15} /> Back</button>
        <div className="flex-1" />
        <Monitor size={17} className="text-cyan-400" />
        <span className="text-base font-semibold text-foreground">Webview</span>
        <div className="flex-1" />
        <button onClick={() => window.open(window.location.origin, "_blank")} className="w-8 h-8 flex items-center justify-center text-muted-foreground hover:text-foreground rounded-lg hover:bg-secondary/60 transition-colors"><ExternalLink size={15} /></button>
        <button onClick={onClose} className="w-8 h-8 flex items-center justify-center text-muted-foreground hover:text-foreground rounded-lg hover:bg-secondary/60 transition-colors"><X size={18} /></button>
      </div>
      <div className="px-3 py-2 border-b border-border/40 shrink-0">
        <div className="flex items-center gap-2 bg-secondary/30 rounded-lg px-3 h-8 border border-border/30">
          <Globe size={12} className="text-muted-foreground/60 shrink-0" />
          <span className="flex-1 text-xs text-muted-foreground/70 truncate">{window.location.origin}/</span>
          <RefreshCw size={12} className="text-muted-foreground/50 shrink-0 cursor-pointer hover:text-foreground transition-colors" />
        </div>
      </div>
      <div className="flex-1 bg-white">
        <iframe src="/" className="w-full h-full border-0" title="App Preview" />
      </div>
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────────
   MULTI-ARTIFACT PANEL
   ───────────────────────────────────────────────────────── */
interface Artifact {
  id: string;
  type: "web" | "mobile" | "slides" | "api" | "desktop";
  label: string;
  desc: string;
  icon: React.ReactNode;
  status: "building" | "ready" | "syncing" | "idle";
  linked: boolean;
  url?: string;
  color: string;
  bg: string;
}

const DEFAULT_ARTIFACTS: Artifact[] = [
  { id: "a1", type: "web", label: "Web App", desc: "React + Tailwind · Live at your-app.replit.app", icon: <Globe size={16} />, status: "ready", linked: true, url: "https://your-app.replit.app", color: "text-blue-400", bg: "bg-blue-500/10 border-blue-400/20" },
  { id: "a2", type: "mobile", label: "Mobile App", desc: "Expo · iOS + Android · Synced with Web", icon: <Monitor size={16} />, status: "ready", linked: true, color: "text-green-400", bg: "bg-green-500/10 border-green-400/20" },
  { id: "a3", type: "slides", label: "Slide Deck", desc: "16 slides · Auto-generated from app structure", icon: <Layers size={16} />, status: "idle", linked: false, color: "text-orange-400", bg: "bg-orange-500/10 border-orange-400/20" },
  { id: "a4", type: "api", label: "REST API", desc: "Express · 12 endpoints · OpenAPI spec", icon: <Code2 size={16} />, status: "ready", linked: true, color: "text-purple-400", bg: "bg-purple-500/10 border-purple-400/20" },
  { id: "a5", type: "desktop", label: "Desktop App", desc: "Electron · macOS + Windows · Coming soon", icon: <Server size={16} />, status: "idle", linked: false, color: "text-muted-foreground", bg: "bg-secondary/30 border-border/30" },
];

function MultiArtifactPanel({ onClose }: { onClose: () => void }) {
  const [artifacts, setArtifacts] = useState<Artifact[]>(DEFAULT_ARTIFACTS);
  const [activeTab, setActiveTab] = useState<string>("a1");
  const [building, setBuilding] = useState<string | null>(null);
  const [syncAll, setSyncAll] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const handleBuild = async (id: string) => {
    setBuilding(id);
    await new Promise(r => setTimeout(r, 2000));
    setArtifacts(prev => prev.map(a => a.id === id ? { ...a, status: "ready", linked: true } : a));
    setBuilding(null);
  };

  const handleSyncAll = async () => {
    setSyncing(true);
    setArtifacts(prev => prev.map(a => a.linked ? { ...a, status: "syncing" } : a));
    await new Promise(r => setTimeout(r, 1800));
    setArtifacts(prev => prev.map(a => ({ ...a, status: a.status === "syncing" ? "ready" : a.status })));
    setSyncing(false);
    setSyncAll(true);
  };

  const active = artifacts.find(a => a.id === activeTab);

  return (
    <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
      transition={{ type: "spring", stiffness: 340, damping: 36 }}
      className="absolute inset-0 z-50 flex flex-col bg-background">
      <div className="flex items-center gap-2 px-4 pt-10 pb-3 border-b border-border shrink-0">
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-sm flex items-center gap-1 transition-colors"><ArrowLeft size={15} /> Back</button>
        <div className="flex-1" />
        <Layers size={17} className="text-orange-400" />
        <span className="text-base font-semibold text-foreground">Multi-Artifact</span>
        <div className="flex-1" />
        <button onClick={onClose} className="w-8 h-8 flex items-center justify-center text-muted-foreground hover:text-foreground rounded-lg hover:bg-secondary/60 transition-colors"><X size={18} /></button>
      </div>

      {/* Artifact type tabs */}
      <div className="flex overflow-x-auto no-scrollbar gap-1.5 px-4 py-3 border-b border-border/40 shrink-0">
        {artifacts.map(a => (
          <button key={a.id} onClick={() => setActiveTab(a.id)}
            className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-semibold border shrink-0 transition-all",
              activeTab === a.id ? cn(a.bg, a.color) : "bg-secondary/20 border-transparent text-muted-foreground hover:text-foreground"
            )}>
            {a.icon}
            {a.label}
            {a.status === "ready" && <span className="w-1.5 h-1.5 rounded-full bg-green-400 shrink-0" />}
            {a.status === "syncing" && <motion.span animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1.2, repeat: Infinity }} className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 no-scrollbar">
        {/* Sync all banner */}
        <div className="flex items-center gap-2 bg-card border border-border rounded-2xl px-4 py-3">
          <div className="flex-1">
            <p className="text-xs font-semibold text-foreground">Auto-Sync Enabled</p>
            <p className="text-[11px] text-muted-foreground/60">Changes propagate to all linked artifacts</p>
          </div>
          <button onClick={handleSyncAll} disabled={syncing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold bg-blue-500/15 border border-blue-400/30 text-blue-300 hover:bg-blue-500/25 transition-all">
            {syncing ? <><Loader2 size={11} className="animate-spin" /> Syncing...</> : <><RefreshCw size={11} /> Sync All</>}
          </button>
        </div>

        {/* Active artifact detail */}
        {active && (
          <motion.div key={activeTab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            className={cn("rounded-2xl border p-4 space-y-3", active.bg)}>
            <div className="flex items-center gap-3">
              <div className={cn("w-10 h-10 rounded-xl border flex items-center justify-center", active.bg, active.color)}>
                {active.icon}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-bold text-foreground">{active.label}</p>
                  <span className={cn("text-[9px] font-bold px-1.5 rounded-full border",
                    active.status === "ready" ? "bg-green-500/15 border-green-400/25 text-green-400" :
                    active.status === "building" || building === active.id ? "bg-yellow-500/15 border-yellow-400/25 text-yellow-400" :
                    active.status === "syncing" ? "bg-blue-500/15 border-blue-400/25 text-blue-400" :
                    "bg-secondary/60 border-border/40 text-muted-foreground/50"
                  )}>
                    {building === active.id ? "Building..." : active.status === "syncing" ? "Syncing" : active.status === "ready" ? "Ready" : "Not built"}
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground/60">{active.desc}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <label className="flex items-center gap-2 cursor-pointer flex-1">
                <div className={cn("relative w-8 h-4 rounded-full transition-colors", active.linked ? "bg-green-500" : "bg-secondary")}
                  onClick={() => setArtifacts(prev => prev.map(a => a.id === active.id ? { ...a, linked: !a.linked } : a))}>
                  <motion.div animate={{ x: active.linked ? 16 : 2 }} transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    className="absolute top-0.5 w-3 h-3 bg-white rounded-full shadow" />
                </div>
                <span className="text-[11px] text-muted-foreground">Link to main project</span>
              </label>
              {active.url && (
                <button onClick={() => window.open(active.url, "_blank")}
                  className="flex items-center gap-1 text-[11px] text-blue-400 hover:underline">
                  <ExternalLink size={11} /> Open
                </button>
              )}
            </div>

            <div className="flex gap-2">
              {active.status !== "ready" ? (
                <button onClick={() => handleBuild(active.id)} disabled={building === active.id}
                  className={cn("flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-semibold transition-all border", active.bg, active.color, "hover:opacity-80")}>
                  {building === active.id ? <><Loader2 size={12} className="animate-spin" /> Building...</> : <><Sparkles size={12} /> Build with AI</>}
                </button>
              ) : (
                <button className={cn("flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-semibold border opacity-60 cursor-default", active.bg, active.color)}>
                  <CheckCircle size={12} /> Built & Live
                </button>
              )}
              <button className="px-3 py-2.5 rounded-xl text-xs border border-border/40 text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors">
                <Download size={14} />
              </button>
            </div>
          </motion.div>
        )}

        {/* All artifacts grid */}
        <div>
          <p className="text-[11px] font-semibold text-muted-foreground/50 uppercase tracking-wider mb-2 px-1">All Outputs</p>
          <div className="space-y-2">
            {artifacts.filter(a => a.id !== activeTab).map(a => (
              <button key={a.id} onClick={() => setActiveTab(a.id)}
                className="w-full flex items-center gap-3 bg-card border border-border rounded-xl px-4 py-3 hover:bg-secondary/20 transition-colors">
                <div className={cn("w-8 h-8 rounded-lg border flex items-center justify-center shrink-0", a.bg, a.color)}>{a.icon}</div>
                <div className="flex-1 text-left">
                  <p className="text-xs font-semibold text-foreground">{a.label}</p>
                  <p className="text-[10px] text-muted-foreground/50 truncate">{a.desc}</p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  {a.linked && <span className="text-[9px] text-green-400 font-medium">Linked</span>}
                  {a.status === "ready" ? <span className="w-1.5 h-1.5 rounded-full bg-green-400" /> : <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/30" />}
                </div>
                <ChevronRight size={13} className="text-muted-foreground/30 shrink-0" />
              </button>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────────
   AI MEMORY PANEL
   ───────────────────────────────────────────────────────── */
interface MemoryEntry {
  id: string;
  category: "stack" | "requirement" | "preference" | "context" | "decision";
  text: string;
  confidence: number;
  added: string;
}

const MOCK_MEMORY: MemoryEntry[] = [
  { id: "m1", category: "stack", text: "Using React 19 + Vite + Tailwind CSS 4 for frontend", confidence: 99, added: "session start" },
  { id: "m2", category: "stack", text: "PostgreSQL database with Drizzle ORM", confidence: 99, added: "session start" },
  { id: "m3", category: "requirement", text: "Mobile-first design with dark GitHub-inspired color palette (#0d1117)", confidence: 97, added: "2 sessions ago" },
  { id: "m4", category: "preference", text: "User prefers Framer Motion for all animations", confidence: 94, added: "3 msgs ago" },
  { id: "m5", category: "decision", text: "AI uses Anthropic Claude Opus via streaming SSE", confidence: 99, added: "session start" },
  { id: "m6", category: "context", text: "Project is a Replit IDE clone with two apps: App Builder and Replit IDE", confidence: 99, added: "session start" },
  { id: "m7", category: "requirement", text: "Agent 4 features: Parallel Agents, Monitoring, Design Canvas, Branches, Turbo mode", confidence: 96, added: "this session" },
  { id: "m8", category: "preference", text: "No placeholder/mock data — all features should be functional", confidence: 91, added: "1 session ago" },
];

const MEM_COLORS: Record<string, string> = {
  stack: "bg-blue-500/10 border-blue-400/25 text-blue-400",
  requirement: "bg-purple-500/10 border-purple-400/25 text-purple-400",
  preference: "bg-green-500/10 border-green-400/25 text-green-400",
  context: "bg-yellow-500/10 border-yellow-400/25 text-yellow-400",
  decision: "bg-orange-500/10 border-orange-400/25 text-orange-400",
};

function MemoryPanel({ onClose }: { onClose: () => void }) {
  const [entries, setEntries] = useState<MemoryEntry[]>(MOCK_MEMORY);
  const [filter, setFilter] = useState<string>("all");
  const [adding, setAdding] = useState(false);
  const [newText, setNewText] = useState("");

  const categories = ["all", "stack", "requirement", "preference", "context", "decision"];
  const filtered = filter === "all" ? entries : entries.filter(e => e.category === filter);

  const handleAdd = () => {
    if (!newText.trim()) return;
    setEntries(prev => [{ id: `m${Date.now()}`, category: "context", text: newText.trim(), confidence: 85, added: "just now" }, ...prev]);
    setNewText(""); setAdding(false);
  };

  return (
    <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
      transition={{ type: "spring", stiffness: 340, damping: 36 }}
      className="absolute inset-0 z-50 flex flex-col bg-background">
      <div className="flex items-center gap-2 px-4 pt-10 pb-3 border-b border-border shrink-0">
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-sm flex items-center gap-1 transition-colors"><ArrowLeft size={15} /> Back</button>
        <div className="flex-1" />
        <Sparkles size={17} className="text-yellow-400" />
        <span className="text-base font-semibold text-foreground">Agent Memory</span>
        <div className="flex-1" />
        <button onClick={() => setAdding(v => !v)}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold bg-yellow-500/15 border border-yellow-400/30 text-yellow-300 hover:bg-yellow-500/25 transition-colors">
          <Plus size={11} /> Add
        </button>
        <button onClick={onClose} className="w-8 h-8 flex items-center justify-center text-muted-foreground hover:text-foreground rounded-lg hover:bg-secondary/60 transition-colors"><X size={18} /></button>
      </div>

      {/* Category filter chips */}
      <div className="flex overflow-x-auto no-scrollbar gap-1.5 px-4 py-2.5 border-b border-border/40 shrink-0">
        {categories.map(cat => (
          <button key={cat} onClick={() => setFilter(cat)}
            className={cn("px-3 py-1 rounded-full text-[11px] font-semibold shrink-0 border transition-all capitalize",
              filter === cat ? "bg-yellow-500/20 border-yellow-400/40 text-yellow-300" : "bg-secondary/20 border-transparent text-muted-foreground hover:text-foreground"
            )}>
            {cat}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2 no-scrollbar">
        <p className="text-[11px] text-muted-foreground/50 leading-relaxed px-1">
          Agent remembers these facts about your project across all sessions. High-confidence memories are used automatically.
        </p>

        <AnimatePresence>
          {adding && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
              className="bg-card border border-yellow-400/20 rounded-2xl p-3.5 space-y-2.5">
              <p className="text-xs font-semibold text-foreground">Add to Agent Memory</p>
              <textarea value={newText} onChange={e => setNewText(e.target.value)} rows={2} autoFocus
                placeholder="e.g. User prefers TypeScript over JavaScript"
                className="w-full bg-secondary/30 border border-border/50 rounded-lg px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground/50 outline-none focus:border-yellow-400/50 resize-none transition-colors" />
              <div className="flex gap-2">
                <button onClick={() => { setAdding(false); setNewText(""); }} className="flex-1 py-2 rounded-lg text-xs border border-border/50 text-muted-foreground hover:bg-secondary/50 transition-colors">Cancel</button>
                <button onClick={handleAdd} disabled={!newText.trim()}
                  className={cn("flex-1 py-2 rounded-lg text-xs font-semibold transition-colors",
                    newText.trim() ? "bg-yellow-500/20 border border-yellow-400/40 text-yellow-300 hover:bg-yellow-500/30" : "bg-secondary/30 text-muted-foreground/40 cursor-not-allowed"
                  )}>
                  Remember This
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {filtered.map((entry, i) => (
          <motion.div key={entry.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
            className="bg-card border border-border rounded-xl p-3 flex items-start gap-3">
            <span className={cn("text-[9px] font-bold px-1.5 py-0.5 rounded-full border capitalize shrink-0 mt-0.5", MEM_COLORS[entry.category] || MEM_COLORS.context)}>
              {entry.category}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-[12px] text-foreground leading-snug">{entry.text}</p>
              <div className="flex items-center gap-2 mt-1">
                <div className="flex items-center gap-1">
                  <div className="w-12 h-1 bg-secondary/50 rounded-full overflow-hidden">
                    <div className="h-full bg-green-400 rounded-full" style={{ width: `${entry.confidence}%` }} />
                  </div>
                  <span className="text-[9px] text-muted-foreground/40">{entry.confidence}%</span>
                </div>
                <span className="text-[9px] text-muted-foreground/30">{entry.added}</span>
              </div>
            </div>
            <button onClick={() => setEntries(prev => prev.filter(e => e.id !== entry.id))}
              className="text-muted-foreground/30 hover:text-red-400 transition-colors p-0.5 shrink-0">
              <X size={12} />
            </button>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────────
   CHECKPOINT TIMELINE PANEL
   ───────────────────────────────────────────────────────── */
interface Checkpoint {
  id: string;
  label: string;
  desc: string;
  time: string;
  files: number;
  status: "current" | "past" | "auto";
}

const MOCK_CHECKPOINTS: Checkpoint[] = [
  { id: "cp1", label: "Current state", desc: "Added Parallel Agents, Monitoring & Canvas panels", time: "now", files: 3, status: "current" },
  { id: "cp2", label: "Added Git panel", desc: "Full GitHub integration with repo browser", time: "18 min ago", files: 2, status: "auto" },
  { id: "cp3", label: "Initial chat page", desc: "Basic chat UI with message bubbles", time: "34 min ago", files: 5, status: "auto" },
  { id: "cp4", label: "Project scaffold", desc: "pnpm monorepo setup with API + frontend", time: "1 hr ago", files: 12, status: "past" },
  { id: "cp5", label: "First commit", desc: "Empty project initialized", time: "2 hr ago", files: 1, status: "past" },
];

function CheckpointPanel({ onClose }: { onClose: () => void }) {
  const [restoring, setRestoring] = useState<string | null>(null);
  const [restored, setRestored] = useState<string | null>(null);

  const handleRestore = async (id: string) => {
    if (id === "cp1") return;
    setRestoring(id);
    await new Promise(r => setTimeout(r, 1800));
    setRestoring(null);
    setRestored(id);
  };

  return (
    <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
      transition={{ type: "spring", stiffness: 340, damping: 36 }}
      className="absolute inset-0 z-50 flex flex-col bg-background">
      <div className="flex items-center gap-2 px-4 pt-10 pb-3 border-b border-border shrink-0">
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-sm flex items-center gap-1 transition-colors"><ArrowLeft size={15} /> Back</button>
        <div className="flex-1" />
        <Clock size={17} className="text-cyan-400" />
        <span className="text-base font-semibold text-foreground">Checkpoints</span>
        <div className="flex-1" />
        <button onClick={onClose} className="w-8 h-8 flex items-center justify-center text-muted-foreground hover:text-foreground rounded-lg hover:bg-secondary/60 transition-colors"><X size={18} /></button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 no-scrollbar">
        <p className="text-xs text-muted-foreground/60 leading-relaxed mb-4 px-1">
          Auto-checkpoints are saved after every significant change. Restore any point to undo all changes since then — your conversation history is preserved.
        </p>

        {/* Timeline */}
        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-[19px] top-3 bottom-3 w-[2px] bg-border/40" />

          <div className="space-y-4">
            {MOCK_CHECKPOINTS.map((cp, i) => (
              <motion.div key={cp.id} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.07 }}
                className="flex items-start gap-3">
                {/* Timeline node */}
                <div className={cn("w-10 h-10 rounded-full border-2 flex items-center justify-center shrink-0 z-10",
                  cp.status === "current" ? "bg-green-500/20 border-green-400/60" :
                  cp.status === "auto" ? "bg-blue-500/10 border-blue-400/30" :
                  "bg-secondary/40 border-border/50"
                )}>
                  {cp.status === "current" ? <CheckCircle size={16} className="text-green-400" /> :
                   cp.status === "auto" ? <RotateCcw size={14} className="text-blue-400" /> :
                   <Clock size={14} className="text-muted-foreground/50" />}
                </div>

                <div className="flex-1 bg-card border border-border rounded-xl p-3 space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <p className="text-xs font-semibold text-foreground">{cp.label}</p>
                        {cp.status === "current" && <span className="text-[9px] bg-green-500/15 border border-green-400/25 text-green-400 px-1.5 rounded-full font-bold">Current</span>}
                        {cp.status === "auto" && <span className="text-[9px] bg-blue-500/15 border border-blue-400/25 text-blue-400 px-1.5 rounded-full font-bold">Auto</span>}
                      </div>
                      <p className="text-[11px] text-muted-foreground/60">{cp.desc}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-[10px] text-muted-foreground/40">{cp.time}</p>
                      <p className="text-[9px] text-muted-foreground/30">{cp.files} files</p>
                    </div>
                  </div>

                  {cp.id !== "cp1" && (
                    <button onClick={() => handleRestore(cp.id)} disabled={restoring === cp.id || restored === cp.id}
                      className={cn("w-full py-1.5 rounded-lg text-[11px] font-semibold transition-all flex items-center justify-center gap-1.5",
                        restored === cp.id ? "bg-green-500/10 border border-green-400/25 text-green-400" :
                        restoring === cp.id ? "bg-blue-500/10 border border-blue-400/25 text-blue-400" :
                        "bg-secondary/30 border border-border/40 text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                      )}>
                      {restored === cp.id ? <><CheckCircle size={11} /> Restored!</> :
                       restoring === cp.id ? <><Loader2 size={11} className="animate-spin" /> Restoring...</> :
                       <><RotateCcw size={11} /> Restore to this point</>}
                    </button>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────────
   AGENT INSIGHTS PANEL
   ───────────────────────────────────────────────────────── */
function InsightsPanel({ onClose }: { onClose: () => void }) {
  const [tokens] = useState(48320);
  const [cost] = useState(0.38);
  const [speed] = useState("1×");
  const [linesWritten] = useState(2847);
  const [filesModified] = useState(14);
  const [sessionTime] = useState(47);

  const stats = [
    { label: "Tokens Used", value: tokens.toLocaleString(), sub: "input + output", icon: <Zap size={14} />, color: "text-yellow-400", bg: "bg-yellow-500/10 border-yellow-400/20" },
    { label: "Session Cost", value: `$${cost.toFixed(2)}`, sub: "Claude Opus 4.7", icon: <BarChart3 size={14} />, color: "text-green-400", bg: "bg-green-500/10 border-green-400/20" },
    { label: "Lines Written", value: linesWritten.toLocaleString(), sub: "by the agent", icon: <Code2 size={14} />, color: "text-blue-400", bg: "bg-blue-500/10 border-blue-400/20" },
    { label: "Files Modified", value: String(filesModified), sub: "this session", icon: <FileText size={14} />, color: "text-purple-400", bg: "bg-purple-500/10 border-purple-400/20" },
    { label: "Session Time", value: `${sessionTime}m`, sub: "active building", icon: <Clock size={14} />, color: "text-cyan-400", bg: "bg-cyan-500/10 border-cyan-400/20" },
    { label: "Actions Taken", value: "63", sub: "read/write/run", icon: <Activity size={14} />, color: "text-orange-400", bg: "bg-orange-500/10 border-orange-400/20" },
  ];

  return (
    <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
      transition={{ type: "spring", stiffness: 340, damping: 36 }}
      className="absolute inset-0 z-50 flex flex-col bg-background">
      <div className="flex items-center gap-2 px-4 pt-10 pb-3 border-b border-border shrink-0">
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-sm flex items-center gap-1 transition-colors"><ArrowLeft size={15} /> Back</button>
        <div className="flex-1" />
        <BarChart3 size={17} className="text-orange-400" />
        <span className="text-base font-semibold text-foreground">Agent Insights</span>
        <div className="flex-1" />
        <button onClick={onClose} className="w-8 h-8 flex items-center justify-center text-muted-foreground hover:text-foreground rounded-lg hover:bg-secondary/60 transition-colors"><X size={18} /></button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 no-scrollbar">
        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-3">
          {stats.map(s => (
            <div key={s.label} className={cn("rounded-2xl border p-3 space-y-1", s.bg)}>
              <div className={cn("flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider", s.color)}>
                {s.icon} {s.label}
              </div>
              <p className={cn("text-2xl font-bold", s.color)}>{s.value}</p>
              <p className="text-[10px] text-muted-foreground/50">{s.sub}</p>
            </div>
          ))}
        </div>

        {/* Token breakdown */}
        <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
          <p className="text-xs font-semibold text-foreground">Token Breakdown</p>
          {[
            { label: "Prompt tokens", val: 32140, total: tokens, color: "bg-blue-400" },
            { label: "Completion tokens", val: 16180, total: tokens, color: "bg-purple-400" },
          ].map(t => (
            <div key={t.label} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground/70">{t.label}</span>
                <span className="text-foreground font-medium">{t.val.toLocaleString()}</span>
              </div>
              <div className="h-2 bg-secondary/50 rounded-full overflow-hidden">
                <motion.div initial={{ width: 0 }} animate={{ width: `${(t.val / t.total) * 100}%` }}
                  transition={{ duration: 0.8, delay: 0.2 }}
                  className={cn("h-full rounded-full", t.color)} />
              </div>
            </div>
          ))}
        </div>

        {/* Speed breakdown */}
        <div className="bg-card border border-border rounded-2xl p-4 space-y-2.5">
          <p className="text-xs font-semibold text-foreground">Performance</p>
          {[
            { label: "Avg response time", val: "3.2s" },
            { label: "Tokens/second", val: "~95 tok/s" },
            { label: "Context window used", val: "24%" },
            { label: "Model", val: "claude-opus-4-7" },
          ].map(p => (
            <div key={p.label} className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground/60">{p.label}</span>
              <span className="text-foreground font-medium font-mono">{p.val}</span>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────────
   PARALLEL AGENTS PANEL
   ───────────────────────────────────────────────────────── */
interface ParallelTask {
  id: string;
  label: string;
  agent: string;
  status: "queued" | "running" | "done" | "merging";
  progress: number;
  color: string;
}

const PARALLEL_TASKS: ParallelTask[] = [
  { id: "pa1", label: "Building database schema & API routes", agent: "Backend Agent", status: "done", progress: 100, color: "text-blue-400" },
  { id: "pa2", label: "Designing React UI components", agent: "Frontend Agent", status: "done", progress: 100, color: "text-purple-400" },
  { id: "pa3", label: "Configuring auth & security layer", agent: "Auth Agent", status: "running", progress: 72, color: "text-green-400" },
  { id: "pa4", label: "Writing unit & integration tests", agent: "Test Agent", status: "queued", progress: 0, color: "text-yellow-400" },
];

function ParallelAgentsPanel({ onClose }: { onClose: () => void }) {
  const [tasks, setTasks] = useState<ParallelTask[]>(PARALLEL_TASKS);
  const [merging, setMerging] = useState(false);
  const [merged, setMerged] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setTasks(prev => prev.map(t => {
        if (t.status === "running" && t.progress < 100) {
          const next = Math.min(t.progress + Math.random() * 8, 100);
          return { ...t, progress: next, status: next >= 100 ? "done" : "running" };
        }
        if (t.status === "queued" && prev.find(x => x.id === "pa3")?.status === "done") {
          return { ...t, status: "running", progress: 5 };
        }
        return t;
      }));
    }, 600);
    return () => clearInterval(interval);
  }, []);

  const handleMerge = async () => {
    setMerging(true);
    await new Promise(r => setTimeout(r, 2000));
    setMerging(false);
    setMerged(true);
  };

  const allDone = tasks.every(t => t.status === "done");

  return (
    <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
      transition={{ type: "spring", stiffness: 340, damping: 36 }}
      className="absolute inset-0 z-50 flex flex-col bg-background">
      <div className="flex items-center gap-2 px-4 pt-10 pb-3 border-b border-border shrink-0">
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-sm flex items-center gap-1 transition-colors"><ArrowLeft size={15} /> Back</button>
        <div className="flex-1" />
        <Cpu size={17} className="text-purple-400" />
        <span className="text-base font-semibold text-foreground">Parallel Agents</span>
        <div className="flex-1" />
        <button onClick={onClose} className="w-8 h-8 flex items-center justify-center text-muted-foreground hover:text-foreground rounded-lg hover:bg-secondary/60 transition-colors"><X size={18} /></button>
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 no-scrollbar">
        <div className="flex items-center gap-2 bg-purple-500/10 border border-purple-400/20 rounded-xl px-3 py-2.5">
          <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 1.5, repeat: Infinity }}>
            <Cpu size={14} className="text-purple-400" />
          </motion.div>
          <span className="text-xs text-purple-300 font-medium">
            {tasks.filter(t => t.status === "running").length} agents running in parallel
          </span>
          <span className="ml-auto text-[10px] text-purple-400/60">{tasks.filter(t => t.status === "done").length}/{tasks.length} done</span>
        </div>

        <p className="text-xs text-muted-foreground/60 leading-relaxed">
          Agent 4 splits your project into independent branches and executes them simultaneously, then merges results using AI-powered conflict resolution.
        </p>

        <div className="space-y-3">
          {tasks.map((task, i) => (
            <motion.div key={task.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }}
              className="bg-card border border-border rounded-2xl p-3.5 space-y-2.5">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-secondary/50 border border-border/50 flex items-center justify-center shrink-0">
                  {task.status === "done" ? (
                    <CheckCircle size={14} className="text-green-400" />
                  ) : task.status === "running" ? (
                    <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }}>
                      <Loader2 size={14} className={task.color} />
                    </motion.div>
                  ) : (
                    <Circle size={14} className="text-muted-foreground/30" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-foreground truncate">{task.agent}</p>
                  <p className="text-[11px] text-muted-foreground/60 truncate">{task.label}</p>
                </div>
                <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full",
                  task.status === "done" ? "bg-green-500/10 text-green-400" :
                  task.status === "running" ? "bg-purple-500/10 text-purple-400" :
                  "bg-secondary/50 text-muted-foreground/40"
                )}>
                  {task.status === "done" ? "Done" : task.status === "running" ? "Running" : "Queued"}
                </span>
              </div>
              <div className="w-full h-1.5 bg-secondary/50 rounded-full overflow-hidden">
                <motion.div
                  className={cn("h-full rounded-full",
                    task.status === "done" ? "bg-green-400" :
                    task.status === "running" ? "bg-purple-400" : "bg-secondary"
                  )}
                  animate={{ width: `${task.progress}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-muted-foreground/40">{Math.round(task.progress)}% complete</span>
                {task.status === "running" && (
                  <motion.span className="text-[10px] text-purple-400/70" animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 1.5, repeat: Infinity }}>
                    executing...
                  </motion.span>
                )}
              </div>
            </motion.div>
          ))}
        </div>

        {allDone && !merged && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
            <div className="bg-yellow-500/10 border border-yellow-400/20 rounded-xl px-3 py-2.5 flex items-center gap-2">
              <GitMerge size={14} className="text-yellow-400" />
              <span className="text-xs text-yellow-300 font-medium">All agents done — ready to merge</span>
            </div>
            <button onClick={handleMerge} disabled={merging}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-purple-500/20 border border-purple-400/40 text-purple-300 text-sm font-semibold hover:bg-purple-500/30 active:scale-[0.98] transition-all">
              {merging ? <><Loader2 size={14} className="animate-spin" /> Merging branches...</> : <><GitMerge size={14} /> Smart Merge All Branches</>}
            </button>
          </motion.div>
        )}

        {merged && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center gap-3 py-6">
            <div className="w-14 h-14 rounded-2xl bg-green-500/20 border border-green-400/30 flex items-center justify-center">
              <CheckCircle size={28} className="text-green-400" />
            </div>
            <div className="text-center">
              <p className="text-sm font-bold text-foreground">Merged Successfully!</p>
              <p className="text-xs text-muted-foreground/60 mt-1">AI resolved all conflicts automatically</p>
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────────
   APP MONITORING PANEL
   ───────────────────────────────────────────────────────── */
const MOCK_ERROR_LOGS = [
  { time: "09:41:23", level: "INFO", msg: "Server started on port 8080", color: "text-green-400" },
  { time: "09:41:25", level: "INFO", msg: "Database connected (PostgreSQL)", color: "text-green-400" },
  { time: "09:43:11", level: "WARN", msg: "High memory usage detected: 78%", color: "text-yellow-400" },
  { time: "09:44:02", level: "INFO", msg: "GET /api/conversations 200 (12ms)", color: "text-muted-foreground" },
  { time: "09:44:15", level: "INFO", msg: "POST /api/anthropic/conversations 201 (45ms)", color: "text-muted-foreground" },
  { time: "09:45:01", level: "ERROR", msg: "Unhandled promise rejection: timeout", color: "text-red-400" },
  { time: "09:45:03", level: "INFO", msg: "Auto-retry succeeded on request", color: "text-green-400" },
  { time: "09:46:30", level: "INFO", msg: "GET /api/anthropic/conversations/1/messages 200 (3219ms)", color: "text-muted-foreground" },
];

function MonitoringPanel({ onClose }: { onClose: () => void }) {
  const [liveMode, setLiveMode] = useState(true);
  const [requests, setRequests] = useState(247);
  const [errors, setErrors] = useState(3);
  const [uptime] = useState("99.8%");
  const [p99] = useState("1.2s");

  useEffect(() => {
    if (!liveMode) return;
    const interval = setInterval(() => {
      setRequests(r => r + Math.floor(Math.random() * 3));
    }, 2000);
    return () => clearInterval(interval);
  }, [liveMode]);

  return (
    <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
      transition={{ type: "spring", stiffness: 340, damping: 36 }}
      className="absolute inset-0 z-50 flex flex-col bg-background">
      <div className="flex items-center gap-2 px-4 pt-10 pb-3 border-b border-border shrink-0">
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-sm flex items-center gap-1 transition-colors"><ArrowLeft size={15} /> Back</button>
        <div className="flex-1" />
        <Activity size={17} className="text-green-400" />
        <span className="text-base font-semibold text-foreground">App Monitoring</span>
        <div className="flex-1" />
        <button onClick={() => setLiveMode(v => !v)}
          className={cn("flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-colors",
            liveMode ? "bg-green-500/15 border-green-400/30 text-green-400" : "bg-secondary/40 border-border/40 text-muted-foreground"
          )}>
          <motion.div animate={liveMode ? { scale: [1, 1.3, 1] } : {}} transition={{ duration: 1.5, repeat: Infinity }}
            className={cn("w-1.5 h-1.5 rounded-full", liveMode ? "bg-green-400" : "bg-muted-foreground/40")} />
          {liveMode ? "Live" : "Paused"}
        </button>
        <button onClick={onClose} className="w-8 h-8 flex items-center justify-center text-muted-foreground hover:text-foreground rounded-lg hover:bg-secondary/60 transition-colors"><X size={18} /></button>
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 no-scrollbar">
        {/* Metrics grid */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: "Uptime", value: uptime, icon: <TrendingUp size={14} />, color: "text-green-400", bg: "bg-green-500/10 border-green-400/20" },
            { label: "Requests", value: requests.toLocaleString(), icon: <BarChart3 size={14} />, color: "text-blue-400", bg: "bg-blue-500/10 border-blue-400/20" },
            { label: "Errors (24h)", value: String(errors), icon: <AlertCircle size={14} />, color: "text-red-400", bg: "bg-red-500/10 border-red-400/20" },
            { label: "p99 Latency", value: p99, icon: <Clock size={14} />, color: "text-yellow-400", bg: "bg-yellow-500/10 border-yellow-400/20" },
          ].map(m => (
            <div key={m.label} className={cn("rounded-xl border px-3 py-3 space-y-1", m.bg)}>
              <div className={cn("flex items-center gap-1.5", m.color)}>
                {m.icon}
                <span className="text-[10px] font-semibold uppercase tracking-wider">{m.label}</span>
              </div>
              <p className={cn("text-xl font-bold", m.color)}>
                {liveMode && m.label === "Requests" ? (
                  <motion.span key={m.value}>{m.value}</motion.span>
                ) : m.value}
              </p>
            </div>
          ))}
        </div>

        {/* Request rate sparkline (fake) */}
        <div className="bg-card border border-border rounded-2xl p-3.5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-foreground">Request Rate</span>
            <span className="text-[10px] text-muted-foreground/50">Last 60 min</span>
          </div>
          <div className="flex items-end gap-1 h-10">
            {[3,5,4,7,6,9,8,11,10,14,12,13,15,12,16,14,18,17,20,19,22,21,24,18,20,22,19,23,21,25].map((v, i) => (
              <motion.div key={i} initial={{ height: 0 }} animate={{ height: `${(v / 25) * 100}%` }}
                transition={{ delay: i * 0.02, duration: 0.4 }}
                className="flex-1 bg-blue-400/50 rounded-sm min-h-[2px]" />
            ))}
          </div>
        </div>

        {/* Live logs */}
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-border/40">
            <span className="text-xs font-semibold text-foreground">Server Logs</span>
            <span className="text-[10px] text-muted-foreground/50">{MOCK_ERROR_LOGS.length} entries</span>
          </div>
          <div className="bg-[#0d1117] overflow-y-auto max-h-52 no-scrollbar">
            {MOCK_ERROR_LOGS.map((log, i) => (
              <div key={i} className="flex items-start gap-2 px-3 py-1.5 border-b border-white/[0.04] font-mono">
                <span className="text-[10px] text-muted-foreground/40 shrink-0 mt-0.5">{log.time}</span>
                <span className={cn("text-[10px] font-bold w-10 shrink-0 mt-0.5", log.color)}>{log.level}</span>
                <span className="text-[11px] text-muted-foreground/80 leading-tight">{log.msg}</span>
              </div>
            ))}
            {liveMode && (
              <div className="flex items-center gap-2 px-3 py-1.5">
                <motion.div animate={{ opacity: [0, 1, 0] }} transition={{ duration: 1.2, repeat: Infinity }}
                  className="w-1.5 h-1.5 rounded-full bg-green-400 shrink-0" />
                <span className="text-[11px] text-muted-foreground/40 font-mono">Waiting for new events...</span>
              </div>
            )}
          </div>
        </div>

        {/* Alert if errors */}
        {errors > 0 && (
          <div className="bg-orange-500/10 border border-orange-400/20 rounded-xl px-4 py-3 space-y-1.5">
            <div className="flex items-center gap-2">
              <AlertCircle size={14} className="text-orange-400" />
              <span className="text-xs font-semibold text-orange-300">Agent Alert</span>
            </div>
            <p className="text-[11px] text-orange-300/70 leading-relaxed">
              Detected {errors} errors in the last 24 hours. Agent has diagnosed the root cause and prepared a fix.
            </p>
            <button className="text-[11px] text-orange-400 underline">View Agent Diagnosis →</button>
          </div>
        )}
      </div>
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────────
   DESIGN CANVAS PANEL
   ───────────────────────────────────────────────────────── */
const CANVAS_COMPONENTS = [
  { id: "c1", label: "Hero Section", x: 20, y: 30, w: 200, h: 80, color: "bg-purple-500/15 border-purple-400/30" },
  { id: "c2", label: "Nav Bar", x: 20, y: 8, w: 200, h: 18, color: "bg-blue-500/15 border-blue-400/30" },
  { id: "c3", label: "Feature Cards", x: 20, y: 118, w: 90, h: 60, color: "bg-green-500/15 border-green-400/30" },
  { id: "c4", label: "CTA Button", x: 120, y: 118, w: 100, h: 30, color: "bg-orange-500/15 border-orange-400/30" },
  { id: "c5", label: "Footer", x: 20, y: 188, w: 200, h: 28, color: "bg-secondary/50 border-border/50" },
];

const PALETTE = ["#7c3aed", "#2563eb", "#059669", "#d97706", "#dc2626", "#0891b2", "#7c3aed"];

function CanvasPanel({ onClose }: { onClose: () => void }) {
  const [selected, setSelected] = useState<string | null>(null);
  const [zoom, setZoom] = useState(100);
  const [activePalette, setActivePalette] = useState(0);
  const [variants, setVariants] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState(false);

  const handleGenerate = async () => {
    setGenerating(true);
    await new Promise(r => setTimeout(r, 1800));
    setGenerating(false);
    setGenerated(true);
    setVariants(true);
  };

  return (
    <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
      transition={{ type: "spring", stiffness: 340, damping: 36 }}
      className="absolute inset-0 z-50 flex flex-col bg-background">
      <div className="flex items-center gap-2 px-4 pt-10 pb-3 border-b border-border shrink-0">
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-sm flex items-center gap-1 transition-colors"><ArrowLeft size={15} /> Back</button>
        <div className="flex-1" />
        <Palette size={17} className="text-pink-400" />
        <span className="text-base font-semibold text-foreground">Design Canvas</span>
        <div className="flex-1" />
        <div className="flex items-center gap-1">
          <button onClick={() => setZoom(z => Math.max(50, z - 10))} className="w-6 h-6 flex items-center justify-center text-muted-foreground hover:text-foreground text-xs rounded border border-border/50">−</button>
          <span className="text-[11px] text-muted-foreground/60 w-10 text-center">{zoom}%</span>
          <button onClick={() => setZoom(z => Math.min(200, z + 10))} className="w-6 h-6 flex items-center justify-center text-muted-foreground hover:text-foreground text-xs rounded border border-border/50">+</button>
        </div>
        <button onClick={onClose} className="w-8 h-8 flex items-center justify-center text-muted-foreground hover:text-foreground rounded-lg hover:bg-secondary/60 transition-colors"><X size={18} /></button>
      </div>

      {/* Toolbar strip */}
      <div className="flex items-center gap-2 px-4 py-2 border-b border-border/40 shrink-0 overflow-x-auto no-scrollbar">
        {[
          { icon: <Layers size={13} />, label: "Layers" },
          { icon: <Code2 size={13} />, label: "Code" },
          { icon: <Palette size={13} />, label: "Palette" },
          { icon: <Sparkles size={13} />, label: "AI Fill" },
        ].map(t => (
          <button key={t.label} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] text-muted-foreground hover:text-foreground hover:bg-secondary/50 border border-transparent hover:border-border/40 transition-all shrink-0">
            {t.icon} {t.label}
          </button>
        ))}
        <div className="flex items-center gap-1 ml-auto shrink-0">
          {PALETTE.map((c, i) => (
            <button key={i} onClick={() => setActivePalette(i)}
              className={cn("w-4 h-4 rounded-full border-2 transition-all", i === activePalette ? "border-white scale-125" : "border-transparent")}
              style={{ backgroundColor: c }} />
          ))}
        </div>
      </div>

      {/* Infinite canvas */}
      <div className="flex-1 overflow-hidden bg-[#0d1117] relative">
        {/* Grid */}
        <div className="absolute inset-0 opacity-20"
          style={{ backgroundImage: "radial-gradient(circle, #444 1px, transparent 1px)", backgroundSize: "24px 24px" }} />

        {/* Canvas content */}
        <div className="absolute inset-0 overflow-auto no-scrollbar p-6">
          <div style={{ transform: `scale(${zoom / 100})`, transformOrigin: "top left", width: 240, height: 220 }}>
            {CANVAS_COMPONENTS.map(comp => (
              <motion.div
                key={comp.id}
                onClick={() => setSelected(selected === comp.id ? null : comp.id)}
                whileTap={{ scale: 0.98 }}
                className={cn(
                  "absolute rounded-lg border cursor-pointer transition-all text-[9px] font-semibold flex items-center justify-center",
                  comp.color,
                  selected === comp.id ? "ring-2 ring-white/40" : ""
                )}
                style={{ left: comp.x, top: comp.y, width: comp.w, height: comp.h }}
                animate={selected === comp.id ? { boxShadow: "0 0 0 2px rgba(255,255,255,0.3)" } : {}}
              >
                <span className="text-white/60">{comp.label}</span>
              </motion.div>
            ))}

            {variants && (
              <>
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                  className="absolute rounded-lg border border-pink-400/40 bg-pink-500/10 cursor-pointer flex items-center justify-center text-[9px] font-semibold text-pink-300"
                  style={{ left: 250, top: 30, width: 200, height: 80 }}>
                  Variant B – Modern
                </motion.div>
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.15 }}
                  className="absolute rounded-lg border border-cyan-400/40 bg-cyan-500/10 cursor-pointer flex items-center justify-center text-[9px] font-semibold text-cyan-300"
                  style={{ left: 250, top: 120, width: 200, height: 80 }}>
                  Variant C – Minimal
                </motion.div>
              </>
            )}
          </div>
        </div>

        {/* Selected info */}
        {selected && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            className="absolute bottom-4 left-4 right-4 bg-card border border-border rounded-xl px-4 py-3 flex items-center gap-3">
            <Layers size={14} className="text-purple-400" />
            <div className="flex-1">
              <p className="text-xs font-semibold text-foreground">{CANVAS_COMPONENTS.find(c => c.id === selected)?.label}</p>
              <p className="text-[11px] text-muted-foreground/60">Click to edit · Drag to reposition</p>
            </div>
            <button className="text-[11px] text-purple-400 border border-purple-400/30 rounded-lg px-2.5 py-1 hover:bg-purple-500/10 transition-colors">Edit</button>
          </motion.div>
        )}
      </div>

      {/* Bottom bar */}
      <div className="shrink-0 px-4 py-3 border-t border-border/40 flex items-center gap-2">
        <button onClick={handleGenerate} disabled={generating}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-pink-500/20 border border-pink-400/40 text-pink-300 text-xs font-semibold hover:bg-pink-500/30 transition-all">
          {generating ? <><Loader2 size={12} className="animate-spin" /> Generating...</> : <><Sparkles size={12} /> Generate Variants</>}
        </button>
        {generated && (
          <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-[11px] text-muted-foreground/50">
            3 variants ready
          </motion.span>
        )}
        <div className="flex-1" />
        <button className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-purple-500/20 border border-purple-400/40 text-purple-300 text-xs font-semibold hover:bg-purple-500/30 transition-all">
          <Download size={12} /> Apply to App
        </button>
      </div>
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────────
   BRANCHING PANEL (Micro VMs)
   ───────────────────────────────────────────────────────── */
interface Branch {
  id: string;
  name: string;
  status: "active" | "idle" | "merged" | "running";
  task: string;
  created: string;
  vm: string;
}

const MOCK_BRANCHES: Branch[] = [
  { id: "b1", name: "main", status: "active", task: "Production branch", created: "base", vm: "vm-a1b2c3" },
  { id: "b2", name: "feat/dark-mode", status: "running", task: "Agent working: Adding dark mode toggle...", created: "2 min ago", vm: "vm-d4e5f6" },
  { id: "b3", name: "feat/auth-flow", status: "idle", task: "Auth & login screen complete", created: "18 min ago", vm: "vm-g7h8i9" },
  { id: "b4", name: "fix/mobile-layout", status: "merged", task: "Mobile layout fix applied", created: "1 hr ago", vm: "vm-j0k1l2" },
];

function BranchingPanel({ onClose }: { onClose: () => void }) {
  const [branches, setBranches] = useState<Branch[]>(MOCK_BRANCHES);
  const [creating, setCreating] = useState(false);
  const [newBranchName, setNewBranchName] = useState("");
  const [merging, setMerging] = useState<string | null>(null);

  const handleCreate = async () => {
    if (!newBranchName.trim()) return;
    const id = `b${Date.now()}`;
    const newBranch: Branch = {
      id, name: `feat/${newBranchName.trim().toLowerCase().replace(/\s+/g, "-")}`,
      status: "running", task: "Agent spinning up Micro VM...", created: "just now", vm: `vm-${Math.random().toString(36).slice(2, 8)}`
    };
    setBranches(prev => [prev[0], newBranch, ...prev.slice(1)]);
    setNewBranchName(""); setCreating(false);
  };

  const handleMerge = async (id: string) => {
    setMerging(id);
    await new Promise(r => setTimeout(r, 1800));
    setBranches(prev => prev.map(b => b.id === id ? { ...b, status: "merged" as const } : b));
    setMerging(null);
  };

  return (
    <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
      transition={{ type: "spring", stiffness: 340, damping: 36 }}
      className="absolute inset-0 z-50 flex flex-col bg-background">
      <div className="flex items-center gap-2 px-4 pt-10 pb-3 border-b border-border shrink-0">
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-sm flex items-center gap-1 transition-colors"><ArrowLeft size={15} /> Back</button>
        <div className="flex-1" />
        <Network size={17} className="text-cyan-400" />
        <span className="text-base font-semibold text-foreground">Branches</span>
        <div className="flex-1" />
        <button onClick={() => setCreating(v => !v)}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-cyan-500/15 border border-cyan-400/30 text-cyan-300 hover:bg-cyan-500/25 transition-colors">
          <Plus size={11} /> New
        </button>
        <button onClick={onClose} className="w-8 h-8 flex items-center justify-center text-muted-foreground hover:text-foreground rounded-lg hover:bg-secondary/60 transition-colors"><X size={18} /></button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 no-scrollbar">
        <p className="text-xs text-muted-foreground/60 leading-relaxed">
          Each branch runs in an isolated <span className="text-cyan-400 font-medium">Micro VM</span>. Changes are safe from main until you merge. Agent resolves 90% of conflicts automatically.
        </p>

        {/* Create new branch */}
        <AnimatePresence>
          {creating && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
              className="bg-card border border-cyan-400/20 rounded-2xl p-3.5 space-y-2.5">
              <p className="text-xs font-semibold text-foreground">New Branch + Micro VM</p>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground/60 shrink-0">feat/</span>
                <input value={newBranchName} onChange={e => setNewBranchName(e.target.value)}
                  placeholder="my-feature"
                  className="flex-1 bg-secondary/30 border border-border/50 rounded-lg px-3 py-2 text-xs text-foreground outline-none focus:border-cyan-400/50 transition-colors"
                  autoFocus onKeyDown={e => e.key === "Enter" && handleCreate()} />
              </div>
              <div className="flex gap-2">
                <button onClick={() => { setCreating(false); setNewBranchName(""); }} className="flex-1 py-2 rounded-lg text-xs border border-border/50 text-muted-foreground hover:bg-secondary/50 transition-colors">Cancel</button>
                <button onClick={handleCreate} disabled={!newBranchName.trim()}
                  className={cn("flex-1 py-2 rounded-lg text-xs font-semibold transition-colors",
                    newBranchName.trim() ? "bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 hover:bg-cyan-500/30" : "bg-secondary/30 text-muted-foreground/40 cursor-not-allowed"
                  )}>
                  Create Branch
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Branch list */}
        {branches.map((branch, i) => (
          <motion.div key={branch.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}
            className="bg-card border border-border rounded-2xl p-3.5 space-y-2.5">
            <div className="flex items-center gap-2.5">
              <div className={cn("w-7 h-7 rounded-lg border flex items-center justify-center shrink-0",
                branch.status === "active" ? "bg-green-500/15 border-green-400/30" :
                branch.status === "running" ? "bg-cyan-500/15 border-cyan-400/30" :
                branch.status === "merged" ? "bg-purple-500/15 border-purple-400/30" :
                "bg-secondary/50 border-border/50"
              )}>
                {branch.status === "active" ? <CheckCircle size={13} className="text-green-400" /> :
                 branch.status === "running" ? <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }}><Loader2 size={13} className="text-cyan-400" /></motion.div> :
                 branch.status === "merged" ? <GitMerge size={13} className="text-purple-400" /> :
                 <GitBranch size={13} className="text-muted-foreground/60" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <code className="text-xs font-mono font-semibold text-foreground truncate">{branch.name}</code>
                  {branch.status === "active" && <span className="text-[9px] bg-green-500/15 border border-green-400/25 text-green-400 px-1.5 rounded-full font-semibold">main</span>}
                </div>
                <p className="text-[11px] text-muted-foreground/60 truncate">{branch.task}</p>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Cpu size={10} className="text-muted-foreground/40" />
                <span className="text-[10px] font-mono text-muted-foreground/40">{branch.vm}</span>
                <span className="text-[10px] text-muted-foreground/30">· {branch.created}</span>
              </div>
              {branch.status === "idle" && (
                <button
                  onClick={() => handleMerge(branch.id)}
                  disabled={merging === branch.id}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-purple-500/15 border border-purple-400/30 text-purple-300 hover:bg-purple-500/25 transition-colors">
                  {merging === branch.id ? <><Loader2 size={10} className="animate-spin" /> Merging</> : <><GitMerge size={10} /> Merge</>}
                </button>
              )}
              {branch.status === "merged" && (
                <span className="text-[10px] text-purple-400/60 font-medium">✓ Merged</span>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────────
   GITHUB REPO BROWSER (used inside GitPanel)
   ───────────────────────────────────────────────────────── */
interface GHRepo { id: number; full_name: string; private: boolean; description: string | null; updated_at: string; stargazers_count: number; language: string | null }

function RepoBrowser({ token, onSelect, onClose }: { token: string; onSelect: (url: string) => void; onClose: () => void }) {
  const [repos, setRepos] = useState<GHRepo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("https://api.github.com/user/repos?sort=updated&per_page=50&affiliation=owner,collaborator", {
          headers: { Authorization: `token ${token}`, Accept: "application/vnd.github.v3+json" },
        });
        if (!res.ok) throw new Error("Failed to fetch repos");
        setRepos(await res.json());
      } catch {
        setError("Could not load repos. Check your token permissions.");
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  const filtered = repos.filter(r => !search || r.full_name.toLowerCase().includes(search.toLowerCase()));

  return (
    <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
      transition={{ type: "spring", stiffness: 380, damping: 38 }}
      className="absolute inset-0 z-10 flex flex-col bg-background">
      <div className="flex items-center gap-2 px-4 pt-4 pb-3 border-b border-border shrink-0">
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground flex items-center gap-1 text-sm transition-colors"><ArrowLeft size={15} /> Git</button>
        <div className="flex-1" />
        <span className="text-sm font-semibold text-foreground">Your Repositories</span>
        <div className="flex-1" />
      </div>
      <div className="px-4 py-2 border-b border-border/40 shrink-0">
        <div className="flex items-center gap-2 bg-secondary/30 rounded-lg px-3 h-8 border border-border/30">
          <Search size={13} className="text-muted-foreground/60 shrink-0" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search repos..." className="flex-1 bg-transparent text-xs text-foreground placeholder:text-muted-foreground/50 outline-none" autoFocus />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto no-scrollbar">
        {loading ? (
          <div className="flex items-center justify-center h-32 gap-2 text-muted-foreground/60 text-sm"><Loader2 size={16} className="animate-spin" /> Loading repos...</div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-32 gap-2 px-4 text-center"><AlertCircle size={20} className="text-red-400" /><p className="text-xs text-muted-foreground/70">{error}</p></div>
        ) : filtered.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-muted-foreground/60 text-sm">No repositories found</div>
        ) : filtered.map(r => (
          <button key={r.id} onClick={() => onSelect(`https://github.com/${r.full_name}.git`)}
            className="w-full flex items-start gap-3 px-4 py-3 hover:bg-secondary/30 active:bg-secondary/50 transition-colors border-b border-border/20 text-left">
            <div className="w-8 h-8 rounded-lg bg-secondary/50 border border-border/50 flex items-center justify-center shrink-0 mt-0.5">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="text-foreground/70"><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/></svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{r.full_name}</p>
              {r.description && <p className="text-xs text-muted-foreground/60 truncate mt-0.5">{r.description}</p>}
              <div className="flex items-center gap-3 mt-1.5">
                {r.language && <span className="text-[10px] text-muted-foreground/50">{r.language}</span>}
                <span className="text-[10px] text-muted-foreground/50 flex items-center gap-0.5"><Star size={9} /> {r.stargazers_count}</span>
                <span className={cn("text-[9px] px-1.5 py-0.5 rounded-full font-semibold", r.private ? "bg-secondary/60 text-muted-foreground/60" : "bg-green-500/10 text-green-400/80")}>{r.private ? "Private" : "Public"}</span>
              </div>
            </div>
            <ChevronRight size={14} className="text-muted-foreground/30 shrink-0 mt-1" />
          </button>
        ))}
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
  const [showSecrets, setShowSecrets] = useState(false);
  const [showDatabase, setShowDatabase] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [showFiles, setShowFiles] = useState(false);
  const [showRun, setShowRun] = useState(false);
  const [showDeploy, setShowDeploy] = useState(false);
  const [showWebview, setShowWebview] = useState(false);
  const [showParallel, setShowParallel] = useState(false);
  const [showMonitoring, setShowMonitoring] = useState(false);
  const [showCanvas, setShowCanvas] = useState(false);
  const [showBranching, setShowBranching] = useState(false);
  const [showMultiArtifact, setShowMultiArtifact] = useState(false);
  const [showMemory, setShowMemory] = useState(false);
  const [showCheckpoints, setShowCheckpoints] = useState(false);
  const [showInsights, setShowInsights] = useState(false);
  const [turboMode, setTurboMode] = useState(false);
  const [buildTogether, setBuildTogether] = useState(false);
  const [currentToolCall, setCurrentToolCall] = useState<{ name: string; input: Record<string, unknown> } | null>(null);
  const [showQuickSuggestions, setShowQuickSuggestions] = useState(true);
  const [showMoreTools, setShowMoreTools] = useState(false);
  // AI Models Panel state
  const [showAIModels, setShowAIModels] = useState(false);
  const [selectedModelId, setSelectedModelId] = useState("claude-sonnet-4-6");
  const [aiActiveTab, setAiActiveTab] = useState<"models"|"ensemble"|"arena"|"godmode"|"ultraplinian"|"parseltongue"|"autotune"|"stm">("models");
  const [godmodeActive, setGodmodeActive] = useState(false);
  const [ultraplinianTier, setUltraplinianTier] = useState(0);
  const [parseltongueLevel, setParseltongueLevel] = useState<0|1|2|3>(0);
  const [parseltongueActive, setParseltongueActive] = useState(false);
  const [autoTuneActive, setAutoTuneActive] = useState(false);
  const [stmModules, setStmModules] = useState<Set<string>>(new Set());
  const selectedModelData = ALL_MODELS.find(m => m.id === selectedModelId);
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
            if (data.tool_call) {
              setCurrentToolCall(data.tool_call);
            }
            if (data.content) {
              setCurrentToolCall(null);
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
              setCurrentToolCall(null);
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
      <div className="flex items-center justify-between px-4 pt-10 pb-3 border-b border-white/[0.07] shrink-0">
        <button
          onClick={() => setLocation("/")}
          className="w-9 h-9 flex items-center justify-center text-white/50 hover:text-white rounded-xl hover:bg-white/8 transition-colors"
          data-testid="button-back"
        >
          <ArrowLeft size={20} />
        </button>

        <button
          onClick={() => setShowHistory(true)}
          className="w-9 h-9 flex items-center justify-center text-white/50 hover:text-white rounded-xl hover:bg-white/8 transition-colors"
          data-testid="button-history"
        >
          <History size={20} />
        </button>

        <div className="flex flex-col items-center gap-0.5">
          <div className="flex items-center gap-2">
            <AgentIcon size={18} className="text-purple-400" />
            <span className="text-base font-semibold text-white">Agent</span>
            {turboMode && (
              <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }}
                className="text-[10px] font-bold bg-yellow-500/20 border border-yellow-400/40 text-yellow-300 px-1.5 rounded-full flex items-center gap-0.5">
                <Zap size={8} className="shrink-0" />Turbo
              </motion.span>
            )}
          </div>
          {buildTogether && (
            <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-green-400 shrink-0" />
              <span className="text-[10px] text-green-400 font-medium">2 collaborating</span>
            </motion.div>
          )}
        </div>

        {/* Build Together + Share */}
        <button
          onClick={() => setBuildTogether(v => !v)}
          className={cn("w-9 h-9 flex items-center justify-center rounded-xl transition-colors",
            buildTogether ? "text-green-400 bg-green-500/15" : "text-white/50 hover:text-white hover:bg-white/8"
          )}
          data-testid="button-build-together"
          title="Build Together"
        >
          <Users size={18} />
        </button>

        <button
          className="w-9 h-9 flex items-center justify-center text-white/50 hover:text-white rounded-xl hover:bg-white/8 transition-colors"
          data-testid="button-more"
        >
          <MoreHorizontal size={20} />
        </button>
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

        {/* Tool call indicator (GitHub/URL fetching) */}
        <AnimatePresence>
          {currentToolCall && (
            <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="flex justify-start">
              <div className="flex gap-2 max-w-[85%]">
                <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center shrink-0 mt-0.5">
                  <AgentDots size={10} className="text-primary-foreground" />
                </div>
                <div className="bg-card border border-card-border rounded-2xl rounded-bl-sm px-3.5 py-2.5 flex items-center gap-2.5">
                  <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }}>
                    <Github size={13} className="text-muted-foreground/70 shrink-0" />
                  </motion.div>
                  <div className="min-w-0">
                    <p className="text-[11px] text-muted-foreground/60 font-medium">Fetching repository...</p>
                    {currentToolCall.input && typeof currentToolCall.input === "object" && "url" in currentToolCall.input && (
                      <p className="text-[10px] text-muted-foreground/40 truncate max-w-[200px]">{String(currentToolCall.input.url)}</p>
                    )}
                  </div>
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

      {/* ── Quick Suggestions ── */}
      <AnimatePresence>
        {showQuickSuggestions && messages.length > 0 && !isThinking && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}
            className="shrink-0 px-3 py-2 bg-[#141414] border-t border-white/[0.05]">
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
              <span className="text-[10px] text-white/25 shrink-0">Suggestions</span>
              {[
                { label: "✨ Add dark mode", prompt: "Add a dark/light mode toggle with smooth transitions" },
                { label: "🔐 Add auth", prompt: "Add user authentication with email and Google sign-in" },
                { label: "📊 Add dashboard", prompt: "Create an analytics dashboard with charts and metrics" },
                { label: "🚀 Deploy now", prompt: "Help me deploy this app to production" },
                { label: "🧪 Write tests", prompt: "Write unit tests for the main components" },
                { label: "⚡ Optimize", prompt: "Optimize the app for performance and reduce bundle size" },
                { label: "📱 Mobile view", prompt: "Make the app fully responsive for mobile devices" },
              ].map(s => (
                <motion.button key={s.label} whileTap={{ scale: 0.95 }}
                  onClick={() => { setInput(s.prompt); setShowQuickSuggestions(false); }}
                  className="shrink-0 px-3 py-1.5 rounded-full bg-white/[0.06] border border-white/[0.09] text-[11px] text-white/60 hover:text-white hover:bg-white/[0.10] hover:border-white/[0.15] transition-all">
                  {s.label}
                </motion.button>
              ))}
              <button onClick={() => setShowQuickSuggestions(false)} className="shrink-0 ml-1 text-white/20 hover:text-white/50 transition-colors">
                <X size={13} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── More tools panel (Memory / Checkpoints / Insights) ── */}
      <AnimatePresence>
        {showMoreTools && (
          <>
            <div className="fixed inset-0 z-30" onClick={() => setShowMoreTools(false)} />
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}
              className="absolute bottom-[100%] right-3 z-40 bg-card border border-border rounded-2xl shadow-2xl overflow-hidden w-56 mb-1">
              {[
                { icon: <Sparkles size={14} className="text-yellow-400" />, label: "Agent Memory", action: () => { setShowMemory(true); setShowMoreTools(false); } },
                { icon: <Clock size={14} className="text-cyan-400" />, label: "Checkpoints", action: () => { setShowCheckpoints(true); setShowMoreTools(false); } },
                { icon: <BarChart3 size={14} className="text-orange-400" />, label: "Agent Insights", action: () => { setShowInsights(true); setShowMoreTools(false); } },
                { icon: <AlignJustify size={14} className="text-muted-foreground" />, label: "Files", action: () => { setShowFiles(true); setShowMoreTools(false); } },
                { icon: <Rocket size={14} className="text-orange-400" />, label: "Deploy", action: () => { setShowDeploy(true); setShowMoreTools(false); } },
                { icon: <Globe size={14} className="text-blue-400" />, label: "Webview Preview", action: () => { setShowWebview(true); setShowMoreTools(false); } },
              ].map(item => (
                <button key={item.label} onClick={item.action}
                  className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-secondary/50 transition-colors">
                  {item.icon}
                  <span className="text-sm text-foreground">{item.label}</span>
                </button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Input Area ── */}
      <div className="shrink-0 px-3 pb-2 pt-2 bg-[#141414] relative">
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

                  {/* Turbo mode banner */}
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={() => { setTurboMode(v => !v); setShowModes(false); }}
                    className={cn(
                      "w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl border mb-2.5 transition-all",
                      turboMode
                        ? "bg-yellow-500/15 border-yellow-400/40 text-yellow-300"
                        : "bg-secondary/30 border-border/40 text-muted-foreground hover:bg-secondary/50"
                    )}
                    data-testid="agent-mode-turbo"
                  >
                    <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center shrink-0",
                      turboMode ? "bg-yellow-500/20" : "bg-secondary/50"
                    )}>
                      <Zap size={14} className={turboMode ? "text-yellow-400" : "text-muted-foreground/60"} />
                    </div>
                    <div className="flex-1 text-left">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-semibold">Turbo</span>
                        <span className="text-[9px] bg-yellow-500/30 text-yellow-300 px-1.5 rounded-full font-bold">2.5×</span>
                        <span className="text-[9px] bg-purple-500/20 text-purple-300 px-1.5 rounded-full font-bold">NEW</span>
                      </div>
                      <p className="text-[11px] opacity-70">Parallel execution across all agents</p>
                    </div>
                    <div className={cn("w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center",
                      turboMode ? "bg-yellow-400 border-yellow-400" : "border-border/50"
                    )}>
                      {turboMode && <div className="w-2 h-2 bg-black rounded-full" />}
                    </div>
                  </motion.button>

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
                      {turboMode ? TURBO_BADGE.desc : AGENT_MODES.find(m => m.id === agentMode)?.desc}
                    </p>
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Input card */}
        <div className="bg-[#1c1c1c] rounded-2xl border border-white/[0.08] overflow-hidden">
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
            className="w-full bg-transparent resize-none outline-none text-white placeholder:text-white/35 min-h-[40px] max-h-[120px] text-[15px] px-4 pt-3.5 pb-1"
            data-testid="input-chat"
            rows={1}
          />
          <div className="flex items-center gap-2 px-3 pb-3">
            {/* + attach */}
            <motion.button
              whileTap={{ scale: 0.9 }}
              className="w-7 h-7 rounded-full bg-white/8 flex items-center justify-center text-white/50 hover:text-white transition-colors border border-white/10 shrink-0"
              data-testid="button-attach"
            >
              <Plus size={14} />
            </motion.button>

            {/* Plan toggle */}
            <button
              onClick={() => setPlanEnabled(v => !v)}
              className={cn(
                "flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium border transition-colors shrink-0",
                planEnabled
                  ? "bg-white/15 border-white/25 text-white"
                  : "bg-transparent border-white/12 text-white/50 hover:text-white/70"
              )}
              data-testid="switch-plan"
            >
              <div className={cn(
                "w-3.5 h-3.5 rounded-sm border flex items-center justify-center shrink-0",
                planEnabled ? "bg-white border-white" : "border-white/30"
              )}>
                {planEnabled && <div className="w-1.5 h-1.5 bg-black rounded-sm" />}
              </div>
              Plan
            </button>

            {/* Agent mode pill */}
            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={() => agentMode === "Core+" ? setShowAIModels(true) : setShowModes(!showModes)}
              className={cn(
                "flex items-center gap-1 px-2.5 py-1.5 rounded-full border hover:bg-white/10 transition-colors shrink-0",
                agentMode === "Core+"
                  ? "bg-purple-500/15 border-purple-400/30 hover:bg-purple-500/20"
                  : "bg-white/6 border-white/10"
              )}
              data-testid="button-agent-mode"
            >
              <AgentDots size={11} className={agentMode === "Core+" ? "text-purple-400" : "text-white/70"} />
              <span className={cn("text-xs font-medium", agentMode === "Core+" ? "text-purple-300" : "text-white/80")}>{agentMode}</span>
              {agentMode === "Core+" && selectedModelData && (
                <span className="text-[9px] text-purple-400/70 truncate max-w-[60px]">{selectedModelData.name.split(" ").slice(-1)[0]}</span>
              )}
              <ChevronDown size={10} className="text-white/40" />
            </motion.button>

            <div className="flex-1" />

            {/* Stop / Send button */}
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={isThinking ? () => {} : handleSubmit}
              className={cn(
                "w-9 h-9 rounded-xl flex items-center justify-center transition-all shrink-0",
                isThinking
                  ? "bg-[#2563eb] text-white"
                  : input.trim()
                  ? "bg-[#2563eb] text-white hover:bg-blue-500"
                  : "bg-[#2563eb]/60 text-white/60"
              )}
              data-testid="button-send-chat"
            >
              {isThinking ? (
                <Square size={13} fill="currentColor" className="text-white" />
              ) : (
                <ArrowUp size={16} strokeWidth={2.5} className="text-white" />
              )}
            </motion.button>
          </div>
        </div>

        {/* Below-input row: + | record | ⋮ */}
        <div className="flex items-center justify-between px-1 pt-2 pb-1">
          <button className="w-9 h-9 flex items-center justify-center text-white/40 hover:text-white transition-colors" data-testid="button-add-panel">
            <Plus size={20} />
          </button>
          <button className="w-9 h-9 flex items-center justify-center text-white/40 hover:text-white transition-colors" data-testid="button-record">
            <div className="w-6 h-6 rounded-full border-2 border-white/30 flex items-center justify-center">
              <div className="w-2.5 h-2.5 rounded-full bg-white/40" />
            </div>
          </button>
          <button onClick={() => setShowMoreTools(v => !v)} className="w-9 h-9 flex items-center justify-center text-white/40 hover:text-white transition-colors" data-testid="button-more-actions">
            <MoreHorizontal size={20} />
          </button>
        </div>
      </div>

      {/* ── 7-Tab Bottom Nav ── */}
      <div className="shrink-0 bg-[#141414] border-t border-white/[0.07]">
        <div className="flex items-center justify-around h-[52px] px-1">
          {/* Play */}
          <motion.button whileTap={{ scale: 0.88 }} onClick={() => setShowRun(true)}
            className="flex-1 h-full flex items-center justify-center text-white/35 hover:text-white transition-colors"
            data-testid="toolbar-run">
            <Play size={20} strokeWidth={1.5} />
          </motion.button>

          {/* Monitor → App Monitoring */}
          <motion.button whileTap={{ scale: 0.88 }} onClick={() => setShowMonitoring(true)}
            className="relative flex-1 h-full flex items-center justify-center text-white/35 hover:text-white transition-colors"
            data-testid="toolbar-monitor">
            <Activity size={20} strokeWidth={1.5} />
            <span className="absolute top-2 right-1 w-1.5 h-1.5 rounded-full bg-green-400" />
          </motion.button>

          {/* Agent — active, purple, indicator */}
          <motion.button whileTap={{ scale: 0.88 }}
            className="relative flex-1 h-full flex items-center justify-center"
            data-testid="toolbar-agent">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-[2px] rounded-full bg-purple-400" />
            <AgentIcon size={22} className="text-purple-400" />
          </motion.button>

          {/* Parallel Agents */}
          <motion.button whileTap={{ scale: 0.88 }} onClick={() => setShowParallel(true)}
            className="relative flex-1 h-full flex items-center justify-center text-white/35 hover:text-white transition-colors"
            data-testid="toolbar-parallel">
            <Cpu size={20} strokeWidth={1.5} />
            {turboMode && <span className="absolute top-2 right-1 w-1.5 h-1.5 rounded-full bg-yellow-400" />}
          </motion.button>

          {/* Branches (Micro VMs) */}
          <motion.button whileTap={{ scale: 0.88 }} onClick={() => setShowBranching(true)}
            className="flex-1 h-full flex items-center justify-center text-white/35 hover:text-white transition-colors"
            data-testid="toolbar-branches">
            <Network size={20} strokeWidth={1.5} />
          </motion.button>

          {/* Multi-Artifact */}
          <motion.button whileTap={{ scale: 0.88 }} onClick={() => setShowMultiArtifact(true)}
            className="flex-1 h-full flex items-center justify-center text-white/35 hover:text-white transition-colors"
            data-testid="toolbar-multi-artifact">
            <Layers size={20} strokeWidth={1.5} />
          </motion.button>

          {/* Design Canvas */}
          <motion.button whileTap={{ scale: 0.88 }} onClick={() => setShowCanvas(true)}
            className="flex-1 h-full flex items-center justify-center text-white/35 hover:text-white transition-colors"
            data-testid="toolbar-canvas">
            <Palette size={20} strokeWidth={1.5} />
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

      {/* ── Secrets Panel ── */}
      <AnimatePresence>
        {showSecrets && <SecretsPanel onClose={() => setShowSecrets(false)} />}
      </AnimatePresence>

      {/* ── Database Panel ── */}
      <AnimatePresence>
        {showDatabase && <DatabasePanel onClose={() => setShowDatabase(false)} />}
      </AnimatePresence>

      {/* ── Auth Panel ── */}
      <AnimatePresence>
        {showAuth && <AuthPanel onClose={() => setShowAuth(false)} />}
      </AnimatePresence>

      {/* ── Files Panel ── */}
      <AnimatePresence>
        {showFiles && <FilesPanel onClose={() => setShowFiles(false)} />}
      </AnimatePresence>

      {/* ── Run Panel ── */}
      <AnimatePresence>
        {showRun && <RunPanel onClose={() => setShowRun(false)} />}
      </AnimatePresence>

      {/* ── Deploy Panel ── */}
      <AnimatePresence>
        {showDeploy && <DeployPanel onClose={() => setShowDeploy(false)} />}
      </AnimatePresence>

      {/* ── Webview Panel ── */}
      <AnimatePresence>
        {showWebview && <WebviewPanel onClose={() => setShowWebview(false)} />}
      </AnimatePresence>

      {/* ── Parallel Agents Panel ── */}
      <AnimatePresence>
        {showParallel && <ParallelAgentsPanel onClose={() => setShowParallel(false)} />}
      </AnimatePresence>

      {/* ── App Monitoring Panel ── */}
      <AnimatePresence>
        {showMonitoring && <MonitoringPanel onClose={() => setShowMonitoring(false)} />}
      </AnimatePresence>

      {/* ── Design Canvas Panel ── */}
      <AnimatePresence>
        {showCanvas && <CanvasPanel onClose={() => setShowCanvas(false)} />}
      </AnimatePresence>

      {/* ── Branching (Micro VMs) Panel ── */}
      <AnimatePresence>
        {showBranching && <BranchingPanel onClose={() => setShowBranching(false)} />}
      </AnimatePresence>

      {/* ── Multi-Artifact Panel ── */}
      <AnimatePresence>
        {showMultiArtifact && <MultiArtifactPanel onClose={() => setShowMultiArtifact(false)} />}
      </AnimatePresence>

      {/* ── Agent Memory Panel ── */}
      <AnimatePresence>
        {showMemory && <MemoryPanel onClose={() => setShowMemory(false)} />}
      </AnimatePresence>

      {/* ── Checkpoint Timeline Panel ── */}
      <AnimatePresence>
        {showCheckpoints && <CheckpointPanel onClose={() => setShowCheckpoints(false)} />}
      </AnimatePresence>

      {/* ── Agent Insights Panel ── */}
      <AnimatePresence>
        {showInsights && <InsightsPanel onClose={() => setShowInsights(false)} />}
      </AnimatePresence>

      {/* ── AI Models Panel (Core+ full-screen) ── */}
      <AnimatePresence>
        {showAIModels && (
          <AIModelsPanel
            selectedModel={selectedModelId}
            onSelectModel={(id) => { setSelectedModelId(id); }}
            activeTab={aiActiveTab}
            onTabChange={(tab) => setAiActiveTab(tab)}
            godmodeActive={godmodeActive}
            onGodmodeToggle={() => setGodmodeActive(v => !v)}
            ultraplinianTier={ultraplinianTier}
            onUltraplinianTier={setUltraplinianTier}
            parseltongueLevel={parseltongueLevel}
            onParseltongueLevel={setParseltongueLevel}
            parseltongueActive={parseltongueActive}
            onParseltongueToggle={() => setParseltongueActive(v => !v)}
            autoTuneActive={autoTuneActive}
            onAutoTuneToggle={() => setAutoTuneActive(v => !v)}
            stmModules={stmModules}
            onStmToggle={(id) => setStmModules(prev => {
              const next = new Set(prev);
              next.has(id) ? next.delete(id) : next.add(id);
              return next;
            })}
            onClose={() => setShowAIModels(false)}
          />
        )}
      </AnimatePresence>

      {/* ── Build Together floating badge ── */}
      <AnimatePresence>
        {buildTogether && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="absolute bottom-24 right-4 z-40"
          >
            <div className="bg-card border border-green-400/30 rounded-2xl px-3.5 py-2.5 flex items-center gap-2.5 shadow-xl">
              <div className="flex -space-x-1.5">
                {["A", "B"].map((l, i) => (
                  <div key={i} className={cn("w-6 h-6 rounded-full border-2 border-card flex items-center justify-center text-[9px] font-bold",
                    i === 0 ? "bg-purple-500/30 text-purple-300" : "bg-blue-500/30 text-blue-300"
                  )}>{l}</div>
                ))}
              </div>
              <div>
                <p className="text-[11px] font-semibold text-green-400">Building Together</p>
                <p className="text-[10px] text-muted-foreground/50">2 collaborators active</p>
              </div>
              <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 2, repeat: Infinity }}>
                <div className="w-2 h-2 rounded-full bg-green-400" />
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
