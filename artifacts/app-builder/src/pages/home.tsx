import { useState, useEffect } from "react";
import { useLocation, Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { MoreVertical, Lock, Globe, Download, ChevronDown, X, CheckCircle2, Loader2, Zap, Layers, BookOpen, Compass, ChevronRight, Clock, Trash2 } from "lucide-react";
import { SiGithub, SiReplit } from "react-icons/si";
import { CategoryChips } from "@/components/CategoryChips";
import { CreateInput } from "@/components/CreateInput";
import { cn } from "@/lib/utils";

type ImportSource = "github" | "replit";

interface ImportTarget {
  url: string;
  source: ImportSource;
  label: string;
}

interface RecentImport extends ImportTarget {
  importedAt: number;
}

const HISTORY_KEY = "import_history";
const MAX_HISTORY = 5;

function loadHistory(): RecentImport[] {
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY) ?? "[]");
  } catch {
    return [];
  }
}

function saveToHistory(target: ImportTarget) {
  const existing = loadHistory().filter(h => h.url !== target.url);
  const updated: RecentImport[] = [
    { ...target, importedAt: Date.now() },
    ...existing,
  ].slice(0, MAX_HISTORY);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
}

function removeFromHistory(url: string) {
  const updated = loadHistory().filter(h => h.url !== url);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
}

function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const m = Math.floor(diff / 60000);
  const h = Math.floor(diff / 3600000);
  const d = Math.floor(diff / 86400000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  if (h < 24) return `${h}h ago`;
  return `${d}d ago`;
}

function isGitHubUrl(text: string): boolean {
  return /^(https?:\/\/)?(www\.)?github\.com\/[a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+/.test(text.trim());
}

function isReplitUrl(text: string): boolean {
  return /^(https?:\/\/)?(www\.)?replit\.com\/@?[a-zA-Z0-9_.-]+(\/[a-zA-Z0-9_.-]+)?/.test(text.trim());
}

function detectImport(text: string): ImportTarget | null {
  const t = text.trim();
  if (isGitHubUrl(t)) {
    const slug = t.replace(/^https?:\/\//, "").replace(/^github\.com\//, "").replace(/\.git$/, "");
    return { url: `https://github.com/${slug}`, source: "github", label: slug };
  }
  if (isReplitUrl(t)) {
    const slug = t.replace(/^https?:\/\//, "").replace(/^(www\.)?replit\.com\/@?/, "").replace(/^replit\.com\//, "");
    const normalized = `https://replit.com/@${slug.replace(/^@/, "")}`;
    return { url: normalized, source: "replit", label: slug };
  }
  return null;
}

function ImportingScreen({ target, onDone }: { target: ImportTarget; onDone: () => void }) {
  const [phase, setPhase] = useState<"importing" | "setting-up" | "done">("importing");
  const isGitHub = target.source === "github";

  useEffect(() => {
    const t1 = setTimeout(() => setPhase("setting-up"), 2200);
    const t2 = setTimeout(() => setPhase("done"), 4000);
    const t3 = setTimeout(() => onDone(), 4600);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [onDone]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-[#0d1117] flex flex-col"
    >
      <div className="px-4 pt-12">
        <AnimatePresence mode="wait">
          {(phase === "importing" || phase === "setting-up") && (
            <motion.div
              key="progress-badge"
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="flex items-center gap-2.5 bg-[#161b22] border border-white/10 rounded-2xl px-4 py-3"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
                className="w-4 h-4 rounded-full border-2 border-white/20 border-t-white/70 shrink-0"
              />
              <span className="text-sm text-white/70 font-medium">
                {phase === "importing"
                  ? `Setting up your project from ${isGitHub ? "GitHub" : "Replit"}...`
                  : "Preparing workspace..."}
              </span>
            </motion.div>
          )}
          {phase === "done" && (
            <motion.div
              key="done-badge"
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2.5 bg-[#161b22] border border-white/10 rounded-2xl px-4 py-3"
            >
              <CheckCircle2 size={16} className="text-white/70 shrink-0" />
              <span className="text-sm text-white/70 font-medium">
                Successfully imported from {isGitHub ? "GitHub" : "Replit"}
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center gap-8">
        <AnimatePresence mode="wait">
          {phase === "importing" && (
            <motion.div
              key="squares"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="flex flex-col items-center gap-6"
            >
              <div className="relative w-24 h-24">
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    className={cn("absolute w-10 h-10 rounded-xl", isGitHub ? "bg-[#f25022]" : "bg-[#f26207]")}
                    style={{
                      top: i === 0 ? 0 : "auto",
                      bottom: i === 0 ? "auto" : 0,
                      left: i === 2 ? "auto" : 0,
                      right: i === 2 ? 0 : "auto",
                    }}
                    animate={{ scale: [1, 0.82, 1], opacity: [0.9, 0.55, 0.9] }}
                    transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.22, ease: "easeInOut" }}
                  />
                ))}
              </div>
              <p className="text-white/60 text-base font-medium tracking-wide">Importing...</p>
            </motion.div>
          )}
          {phase === "setting-up" && (
            <motion.div
              key="setting-up"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              className="flex flex-col items-center gap-4"
            >
              <div className="w-14 h-14 rounded-2xl bg-[#6e40c9]/20 border border-[#6e40c9]/30 flex items-center justify-center">
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.4, repeat: Infinity, ease: "linear" }}>
                  <Loader2 size={26} className="text-[#a78bfa]" />
                </motion.div>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded bg-[#6e40c9]/30 border border-[#6e40c9]/40 flex items-center justify-center">
                  <div className="w-2 h-2 rounded-sm bg-[#a78bfa]" />
                </div>
                <p className="text-white/60 text-sm font-medium">Working.</p>
              </div>
            </motion.div>
          )}
          {phase === "done" && (
            <motion.div
              key="done"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-4"
            >
              <div className="w-14 h-14 rounded-2xl bg-[#6e40c9]/20 border border-[#6e40c9]/30 flex items-center justify-center">
                <div className="w-5 h-5 rounded bg-[#6e40c9]/30 border border-[#6e40c9]/40 flex items-center justify-center">
                  <div className="w-2 h-2 rounded-sm bg-[#a78bfa]" />
                </div>
              </div>
              <p className="text-white/60 text-sm font-medium">Working.</p>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/8 rounded-full">
          {isGitHub
            ? <SiGithub size={13} className="text-white/40 shrink-0" />
            : <SiReplit size={13} className="text-[#f26207]/60 shrink-0" />
          }
          <span className="text-xs text-white/40 font-mono truncate max-w-[220px]">{target.label}</span>
        </div>
      </div>
    </motion.div>
  );
}

function ImportFromGitHubSheet({ onClose, onImport }: { onClose: () => void; onImport: (target: ImportTarget) => void }) {
  const [repoUrl, setRepoUrl] = useState("");
  const [privacy, setPrivacy] = useState<"private" | "public">("private");
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState("");
  const username = (typeof localStorage !== "undefined" && localStorage.getItem("git_author_name")) || "username";
  const initial = username[0]?.toUpperCase() || "U";
  const liveDetect = detectImport(repoUrl);

  const handleImport = async () => {
    const target = detectImport(repoUrl);
    if (!target) { setError("Enter a valid GitHub or Replit URL"); return; }
    setError("");
    setImporting(true);
    await new Promise(r => setTimeout(r, 300));
    onImport(target);
  };

  return (
    <motion.div className="fixed inset-0 z-50 flex items-end justify-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
        transition={{ type: "spring", stiffness: 360, damping: 38 }}
        className="relative w-full max-w-[480px] bg-[#1c1c1c] rounded-t-3xl overflow-hidden shadow-2xl z-10 border-t border-white/10"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-center pt-3 pb-1"><div className="w-10 h-1 rounded-full bg-white/20" /></div>
        <div className="flex items-center justify-between px-5 pt-2 pb-4">
          <div className="w-8" />
          <h2 className="text-xl font-bold text-white tracking-tight">Import Project</h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center text-white/40 hover:text-white transition-colors rounded-full hover:bg-white/8"><X size={18} /></button>
        </div>
        <div className="px-5 pb-8 space-y-5">
          <div>
            <label className="block text-sm font-semibold text-white/80 mb-2">GitHub or Replit URL</label>
            <input
              type="text" value={repoUrl}
              onChange={e => { setRepoUrl(e.target.value); setError(""); }}
              placeholder="github.com/user/repo  or  replit.com/@user/project"
              className={cn("w-full bg-transparent border rounded-xl px-4 py-3.5 text-sm text-white placeholder:text-white/25 outline-none transition-colors", error ? "border-red-400/60 focus:border-red-400" : "border-white/12 focus:border-white/30")}
              data-testid="input-github-repo-url" autoFocus
            />
            {error && <p className="text-xs text-red-400 mt-1.5">{error}</p>}
            <AnimatePresence>
              {repoUrl.trim() && liveDetect && (
                <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex items-center gap-2 mt-2">
                  {liveDetect.source === "github" ? <SiGithub size={12} className="text-green-400" /> : <SiReplit size={12} className="text-[#f26207]" />}
                  <span className="text-xs text-green-400 font-medium">
                    {liveDetect.source === "github" ? "GitHub repo detected" : "Replit project detected"}
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <div>
            <label className="block text-sm font-semibold text-white/80 mb-2">Owner</label>
            <div className="flex items-center justify-between border border-white/12 rounded-xl px-4 py-3 bg-transparent">
              <ChevronDown size={16} className="text-white/40" />
              <div className="flex items-center gap-2.5">
                <span className="text-sm text-white font-medium">{username}</span>
                <div className="w-7 h-7 rounded-full bg-blue-500 flex items-center justify-center shrink-0">
                  <span className="text-xs font-bold text-white">{initial}</span>
                </div>
              </div>
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-white/80 mb-2">Privacy</label>
            <div className="grid grid-cols-2 gap-2 p-1 bg-white/5 border border-white/8 rounded-xl">
              {(["private", "public"] as const).map((p) => (
                <button key={p} onClick={() => setPrivacy(p)}
                  className={cn("flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-semibold transition-all", privacy === p ? "bg-[#2563eb] text-white" : "text-white/40 hover:text-white/70")}
                  data-testid={`button-privacy-${p}`}
                >
                  {p === "private" ? <Lock size={14} /> : <Globe size={14} />}
                  {p === "private" ? "Private" : "Public"}
                </button>
              ))}
            </div>
          </div>
          <button
            onClick={handleImport} disabled={importing || !repoUrl.trim()}
            className={cn("w-full flex items-center justify-center gap-2.5 py-4 rounded-xl text-sm font-semibold transition-all", importing ? "bg-white/8 text-white/40 cursor-not-allowed" : repoUrl.trim() ? "bg-[#2563eb] text-white hover:bg-blue-500 active:scale-[0.98]" : "bg-white/6 border border-white/8 text-white/30 cursor-not-allowed")}
            data-testid="button-import-repo"
          >
            {importing ? <><Loader2 size={15} className="animate-spin" /> Preparing...</> : <><Download size={15} /> Import</>}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function RecentImportsSection({ onReimport }: { onReimport: (target: ImportTarget) => void }) {
  const [history, setHistory] = useState<RecentImport[]>([]);

  useEffect(() => {
    setHistory(loadHistory());
  }, []);

  const handleRemove = (e: React.MouseEvent, url: string) => {
    e.stopPropagation();
    removeFromHistory(url);
    setHistory(loadHistory());
  };

  if (history.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-2"
    >
      <div className="flex items-center gap-2 px-0.5">
        <Clock size={12} className="text-white/30" />
        <span className="text-[11px] font-semibold uppercase tracking-widest text-white/30">Recent Imports</span>
      </div>
      <div className="space-y-1.5">
        {history.map((item, i) => (
          <motion.button
            key={item.url}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            onClick={() => onReimport(item)}
            className="w-full flex items-center gap-3 px-3.5 py-3 rounded-xl bg-white/[0.035] border border-white/[0.07] hover:bg-white/6 active:scale-[0.98] transition-all group text-left"
          >
            {/* Source icon */}
            <div className={cn(
              "w-8 h-8 rounded-lg border flex items-center justify-center shrink-0 transition-colors",
              item.source === "github"
                ? "bg-white/8 border-white/12 group-hover:bg-white/12"
                : "bg-[#f26207]/10 border-[#f26207]/20 group-hover:bg-[#f26207]/15"
            )}>
              {item.source === "github"
                ? <SiGithub size={14} className="text-white/60" />
                : <SiReplit size={14} className="text-[#f26207]/80" />
              }
            </div>

            {/* Label + meta */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white/80 truncate leading-tight">{item.label}</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className={cn(
                  "text-[10px] font-semibold px-1.5 py-0.5 rounded-full",
                  item.source === "github"
                    ? "bg-white/6 text-white/30"
                    : "bg-[#f26207]/10 text-[#f26207]/60"
                )}>
                  {item.source === "github" ? "GitHub" : "Replit"}
                </span>
                <span className="text-[10px] text-white/25">{timeAgo(item.importedAt)}</span>
              </div>
            </div>

            {/* Re-import arrow + delete */}
            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={(e) => handleRemove(e, item.url)}
                className="w-6 h-6 flex items-center justify-center rounded-lg text-white/0 group-hover:text-white/25 hover:!text-white/60 hover:bg-white/8 transition-all"
              >
                <Trash2 size={12} />
              </button>
              <ChevronRight size={14} className="text-white/20 group-hover:text-white/40 transition-colors" />
            </div>
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
}

export default function Home() {
  const [prompt, setPrompt] = useState("");
  const [showMenu, setShowMenu] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [importTarget, setImportTarget] = useState<ImportTarget | null>(null);
  const [historyVersion, setHistoryVersion] = useState(0);
  const [, setLocation] = useLocation();

  const detected = detectImport(prompt);

  const handleChipSelect = (category: string) => {
    setPrompt(p => p.length > 0 ? `${p} ${category}` : `I want to make a ${category}`);
  };

  const handleSubmit = () => {
    const trimmed = prompt.trim();
    if (!trimmed) return;
    const target = detectImport(trimmed);
    if (target) {
      setPrompt("");
      setImportTarget(target);
      return;
    }
    sessionStorage.setItem("chat_prompt", trimmed);
    setLocation("/chat");
  };

  const handleStartImport = (target: ImportTarget) => { setShowImport(false); setImportTarget(target); };
  const handleReimport = (target: ImportTarget) => { setImportTarget(target); };

  const handleImportDone = () => {
    if (!importTarget) return;
    saveToHistory(importTarget);
    setHistoryVersion(v => v + 1);
    const { url, source } = importTarget;
    const chatPrompt = source === "github"
      ? `I've imported the GitHub repo ${url}. Analyze the project structure, explain what it does, and suggest what we can build or improve.`
      : `I've imported the Replit project ${url}. Analyze the project structure, explain what it does, and suggest what we can build or improve.`;
    sessionStorage.setItem("chat_prompt", chatPrompt);
    sessionStorage.setItem("imported_repo", url);
    setLocation("/chat");
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex flex-col h-full min-h-[100dvh] max-w-[480px] mx-auto w-full relative"
    >
      {/* Header */}
      <header className="flex items-center justify-between px-4 pt-12 pb-2 relative">
        <div className="relative">
          <button
            className="p-2 -ml-2 text-white/50 hover:text-white transition-colors"
            onClick={() => setShowMenu((v) => !v)}
            data-testid="button-menu"
          >
            <MoreVertical size={22} />
          </button>
          <AnimatePresence>
            {showMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} data-testid="overlay-dismiss-menu" />
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -4 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -4 }}
                  transition={{ duration: 0.12 }}
                  className="absolute left-0 top-10 bg-[#252525] border border-white/10 shadow-2xl rounded-xl overflow-hidden z-50 min-w-[210px]"
                >
                  <button
                    onClick={() => { setShowMenu(false); setShowImport(true); }}
                    className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-white/5 transition-colors text-left"
                    data-testid="button-import-github"
                  >
                    <SiGithub size={16} className="text-white shrink-0" />
                    <p className="text-sm font-medium text-white leading-tight">Import from GitHub</p>
                  </button>
                  <div className="h-px bg-white/6 mx-3" />
                  <button
                    onClick={() => { setShowMenu(false); setShowImport(true); }}
                    className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-white/5 transition-colors text-left"
                    data-testid="button-import-replit"
                  >
                    <SiReplit size={16} className="text-[#f26207] shrink-0" />
                    <p className="text-sm font-medium text-white leading-tight">Import from Replit</p>
                  </button>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
        <span className="text-sm font-medium text-white/60">jnar7804's workspace</span>
        <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center cursor-pointer" data-testid="avatar-user">
          <span className="text-sm font-bold text-white">N</span>
        </div>
      </header>

      {/* Body */}
      <div className="flex-1 flex flex-col overflow-y-auto">
        <div className="flex-1 flex flex-col items-center justify-center px-4 pb-4">
          <h1 className="text-[28px] font-semibold text-white text-center leading-snug tracking-tight mb-6">
            Hi jnar7804,<br />
            what do you want to make?
          </h1>
          <div className="w-full overflow-x-auto no-scrollbar -mx-4 px-4">
            <CategoryChips onSelect={handleChipSelect} />
          </div>
        </div>

        {/* Input + sections */}
        <div className="px-4 pb-[78px] space-y-4">
          <CreateInput value={prompt} onChange={setPrompt} onSubmit={handleSubmit} />

          {/* Auto-detect hint */}
          <AnimatePresence>
            {detected && (
              <motion.div
                initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }}
                className="flex items-center gap-2.5 px-3.5 py-2.5 bg-[#161b22] border border-white/10 rounded-xl"
              >
                {detected.source === "github"
                  ? <SiGithub size={14} className="text-white/60 shrink-0" />
                  : <SiReplit size={14} className="text-[#f26207]/80 shrink-0" />
                }
                <span className="text-xs text-white/50 flex-1">
                  {detected.source === "github" ? "GitHub" : "Replit"} URL detected — press send to import automatically
                </span>
                <Zap size={12} className="text-yellow-400/60 shrink-0" />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Recent imports */}
          <RecentImportsSection key={historyVersion} onReimport={handleReimport} />

          {/* Quick links */}
          <div className="grid grid-cols-2 gap-2">
            <Link href="/templates">
              <div className="flex items-center gap-2.5 px-3.5 py-3 rounded-xl bg-white/4 border border-white/8 hover:bg-white/7 transition-colors cursor-pointer">
                <div className="w-7 h-7 rounded-lg bg-blue-500/20 border border-blue-400/25 flex items-center justify-center shrink-0">
                  <BookOpen size={13} className="text-blue-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-white leading-tight">Templates</p>
                  <p className="text-[10px] text-white/35 truncate">قوالب جاهزة</p>
                </div>
                <ChevronRight size={12} className="text-white/20 ml-auto shrink-0" />
              </div>
            </Link>
            <Link href="/explore">
              <div className="flex items-center gap-2.5 px-3.5 py-3 rounded-xl bg-white/4 border border-white/8 hover:bg-white/7 transition-colors cursor-pointer">
                <div className="w-7 h-7 rounded-lg bg-purple-500/20 border border-purple-400/25 flex items-center justify-center shrink-0">
                  <Compass size={13} className="text-purple-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-white leading-tight">Explore</p>
                  <p className="text-[10px] text-white/35 truncate">دليل Replit</p>
                </div>
                <ChevronRight size={12} className="text-white/20 ml-auto shrink-0" />
              </div>
            </Link>
            <Link href="/replit-agent">
              <div className="flex items-center gap-2.5 px-3.5 py-3 rounded-xl bg-white/4 border border-white/8 hover:bg-white/7 transition-colors cursor-pointer">
                <div className="w-7 h-7 rounded-lg bg-purple-500/20 border border-purple-400/25 flex items-center justify-center shrink-0">
                  <Zap size={13} className="text-purple-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-white leading-tight">AI Agent</p>
                  <p className="text-[10px] text-white/35 truncate">بنّاء تلقائي</p>
                </div>
                <ChevronRight size={12} className="text-white/20 ml-auto shrink-0" />
              </div>
            </Link>
            <Link href="/pro-features">
              <div className="flex items-center gap-2.5 px-3.5 py-3 rounded-xl bg-white/4 border border-white/8 hover:bg-white/7 transition-colors cursor-pointer">
                <div className="w-7 h-7 rounded-lg bg-cyan-500/20 border border-cyan-400/25 flex items-center justify-center shrink-0">
                  <Layers size={13} className="text-cyan-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-white leading-tight">Pro Tools</p>
                  <p className="text-[10px] text-white/35 truncate">Nix · DB · Deploy</p>
                </div>
                <ChevronRight size={12} className="text-white/20 ml-auto shrink-0" />
              </div>
            </Link>
          </div>

          <div className="flex flex-col items-center gap-0.5 text-[13px] pb-2">
            <span className="text-white/40">Start creating for free</span>
            <a href="#" className="text-white/70 underline underline-offset-2 font-medium hover:text-white transition-colors">
              Join Replit Core to unlock more usage
            </a>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showImport && <ImportFromGitHubSheet onClose={() => setShowImport(false)} onImport={handleStartImport} />}
      </AnimatePresence>
      <AnimatePresence>
        {importTarget && <ImportingScreen target={importTarget} onDone={handleImportDone} />}
      </AnimatePresence>
    </motion.div>
  );
}
