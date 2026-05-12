import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { motion as m, AnimatePresence } from "framer-motion";
import {
  Search, MonitorSmartphone, Layers, BarChart3, Presentation, Wand2,
  ChevronRight, Plus, MoreHorizontal, Star, StarOff, Trash2, Globe,
  Lock, Play, Code2, Bot, Terminal, Blocks, Smartphone, X, SortAsc,
  List, Clock, LayoutGrid, RefreshCw, AlertCircle, GitBranch, Download,
  Copy, Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";

const API = "/api/projects";

type FilterTab = "all" | "recent" | "starred";
type ViewMode = "list" | "grid";
type SortMode = "recent" | "name" | "lang";

interface Project {
  id: number;
  name: string;
  language: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  running?: boolean;
  starred?: boolean;
}

function langIcon(lang: string) {
  switch (lang) {
    case "react": return MonitorSmartphone;
    case "python": case "flask": return Terminal;
    case "node": return Blocks;
    default: return Layers;
  }
}

function langColor(lang: string) {
  switch (lang) {
    case "react": return { color: "text-blue-400",    bg: "bg-blue-500/15" };
    case "node":  return { color: "text-green-400",   bg: "bg-green-500/15" };
    case "python":return { color: "text-yellow-400",  bg: "bg-yellow-500/15" };
    case "flask": return { color: "text-orange-400",  bg: "bg-orange-500/15" };
    case "html":  return { color: "text-purple-400",  bg: "bg-purple-500/15" };
    default:      return { color: "text-white/40",    bg: "bg-white/10" };
  }
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function ImportModal({ onClose, onImported }: { onClose: () => void; onImported: () => void }) {
  const [url, setUrl] = useState("");
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleImport = async () => {
    if (!url.trim()) { setError("Please enter a GitHub URL"); return; }
    setError(""); setLoading(true);
    try {
      const res = await fetch("/api/projects/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ githubUrl: url.trim(), token: token.trim() || undefined }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Import failed"); return; }
      onImported();
      onClose();
    } catch { setError("Network error — check the API server"); }
    finally { setLoading(false); }
  };

  return (
    <m.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end justify-center"
      onClick={onClose}
    >
      <m.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", stiffness: 400, damping: 40 }}
        className="w-full max-w-[480px] bg-[#161b22] border border-white/[0.1] rounded-t-3xl p-6 pb-10"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2.5">
            <GitBranch size={18} className="text-[#58a6ff]" />
            <h2 className="text-base font-semibold text-white">Import from GitHub</h2>
          </div>
          <button onClick={onClose} className="text-white/40 hover:text-white transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="flex flex-col gap-3">
          <div>
            <label className="block text-xs text-white/50 mb-1.5">Repository URL</label>
            <input
              value={url} onChange={e => setUrl(e.target.value)}
              placeholder="https://github.com/owner/repo"
              className="w-full bg-white/[0.05] border border-white/[0.08] rounded-xl px-4 h-11 text-sm text-white placeholder:text-white/25 outline-none focus:border-[#58a6ff]/60 transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs text-white/50 mb-1.5">GitHub Token <span className="text-white/25">(optional, for private repos)</span></label>
            <input
              value={token} onChange={e => setToken(e.target.value)} type="password"
              placeholder="ghp_..."
              className="w-full bg-white/[0.05] border border-white/[0.08] rounded-xl px-4 h-11 text-sm text-white placeholder:text-white/25 outline-none focus:border-[#58a6ff]/60 transition-colors"
            />
          </div>
          {error && (
            <p className="text-xs text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">{error}</p>
          )}
          <button
            onClick={handleImport}
            disabled={loading || !url.trim()}
            className="w-full h-11 rounded-xl bg-[#238636] hover:bg-[#2ea043] disabled:opacity-50 text-white text-sm font-semibold transition-colors flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} />}
            {loading ? "Cloning repository..." : "Import Repository"}
          </button>
        </div>
      </m.div>
    </m.div>
  );
}

function ProjectMenu({ project, onStar, onDelete, onFork, onClose }: {
  project: Project;
  onStar: () => void;
  onDelete: () => void;
  onFork: () => void;
  onClose: () => void;
}) {
  return (
    <m.div
      initial={{ opacity: 0, scale: 0.92, y: -4 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.92, y: -4 }}
      transition={{ duration: 0.12 }}
      className="absolute right-0 top-8 bg-[#1e1e1e] border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50 min-w-[180px]"
      onClick={e => e.stopPropagation()}
    >
      <button onClick={onStar} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors text-left">
        {project.starred
          ? <StarOff size={14} className="text-yellow-400" />
          : <Star size={14} className="text-white/50" />}
        <span className="text-sm text-white">{project.starred ? "Unstar" : "Star"}</span>
      </button>
      <button className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors text-left">
        <Code2 size={14} className="text-white/50" />
        <span className="text-sm text-white">Open in IDE</span>
      </button>
      <button onClick={onFork} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors text-left">
        <Copy size={14} className="text-white/50" />
        <span className="text-sm text-white">Fork</span>
      </button>
      <div className="h-px bg-white/6 mx-3" />
      <button onClick={onDelete} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-red-500/10 transition-colors text-left">
        <Trash2 size={14} className="text-red-400" />
        <span className="text-sm text-red-400">Delete</span>
      </button>
    </m.div>
  );
}

export default function Projects() {
  const [, setLocation] = useLocation();
  const [search, setSearch]       = useState("");
  const [filter, setFilter]       = useState<FilterTab>("all");
  const [view, setView]           = useState<ViewMode>("list");
  const [sort, setSort]           = useState<SortMode>("recent");
  const [showSort, setShowSort]   = useState(false);
  const [openMenu, setOpenMenu]   = useState<number | null>(null);

  const [projects, setProjects]   = useState<Project[]>([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState("");
  const [starred, setStarred]     = useState<Set<number>>(new Set());

  async function fetchProjects() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(API, { credentials: "include" });
      if (!res.ok) throw new Error("Failed");
      setProjects(await res.json());
    } catch {
      setError("Could not load projects");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchProjects();
    try {
      const saved = JSON.parse(localStorage.getItem("starred_projects") ?? "[]");
      setStarred(new Set(saved));
    } catch { /**/ }
  }, []);

  const handleOpenProject = (project: Project) => {
    if (openMenu) return;
    sessionStorage.setItem("chat_prompt", `Continue working on "${project.name}": a ${project.language} project. ${project.description || "Let's keep building it."}`);
    setLocation("/chat");
  };

  const handleStar = (id: number) => {
    setStarred(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      localStorage.setItem("starred_projects", JSON.stringify([...next]));
      return next;
    });
    setOpenMenu(null);
  };

  const handleDelete = async (id: number) => {
    setOpenMenu(null);
    try {
      await fetch(`${API}/${id}`, { method: "DELETE", credentials: "include" });
      setProjects(ps => ps.filter(p => p.id !== id));
    } catch { /**/ }
  };

  const visible = projects
    .map(p => ({ ...p, starred: starred.has(p.id) }))
    .filter(p => {
      if (search && !p.name.toLowerCase().includes(search.toLowerCase()) &&
          !p.language.toLowerCase().includes(search.toLowerCase())) return false;
      if (filter === "starred") return p.starred;
      return true;
    })
    .sort((a, b) =>
      sort === "name" ? a.name.localeCompare(b.name) :
      sort === "lang" ? a.language.localeCompare(b.language) :
      new Date(b.updatedAt ?? b.createdAt).getTime() - new Date(a.updatedAt ?? a.createdAt).getTime()
    );

  const TABS: { id: FilterTab; label: string }[] = [
    { id: "all",     label: "All" },
    { id: "recent",  label: "Recent" },
    { id: "starred", label: "⭐ Starred" },
  ];

  const [showImport, setShowImport] = useState(false);

  const handleFork = async (id: number) => {
    setOpenMenu(null);
    try {
      const res = await fetch(`${API}/${id}/fork`, { method: "POST", credentials: "include" });
      if (res.ok) { await fetchProjects(); }
    } catch { /**/ }
  };

  return (
    <m.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex flex-col h-full min-h-[100dvh] max-w-[480px] mx-auto w-full"
      onClick={() => { setOpenMenu(null); setShowSort(false); }}
    >
      {/* Import modal */}
      <AnimatePresence>
        {showImport && <ImportModal onClose={() => setShowImport(false)} onImported={fetchProjects} />}
      </AnimatePresence>

      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-12 pb-3">
        <h1 className="text-2xl font-bold text-white">My Repls</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={e => { e.stopPropagation(); setShowImport(true); }}
            className="w-8 h-8 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/8 rounded-lg transition-colors"
            title="Import from GitHub"
          >
            <GitBranch size={15} />
          </button>
          <button
            onClick={e => { e.stopPropagation(); fetchProjects(); }}
            className="w-8 h-8 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/8 rounded-lg transition-colors"
          >
            <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
          </button>
          <button
            onClick={() => setLocation("/")}
            className="w-9 h-9 flex items-center justify-center bg-blue-600 hover:bg-blue-500 rounded-xl transition-colors active:scale-95"
            data-testid="button-new-repl"
          >
            <Plus size={20} className="text-white" />
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="px-4 mb-3">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" size={15} />
          <input
            type="text"
            placeholder="Search repls..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-[#1c1c1c] border border-white/10 rounded-xl pl-10 pr-10 py-2.5 text-sm text-white placeholder:text-white/30 outline-none focus:border-white/20 transition-colors"
            data-testid="input-search-projects"
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white">
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Filter tabs + sort */}
      <div className="flex items-center gap-2 px-4 mb-4">
        <div className="flex-1 flex gap-1.5 overflow-x-auto no-scrollbar">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              className={cn(
                "px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all shrink-0",
                filter === tab.id
                  ? "bg-white text-black"
                  : "bg-white/6 text-white/50 border border-white/10 hover:text-white/80"
              )}
              data-testid={`filter-${tab.id}`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Sort */}
        <div className="relative shrink-0" onClick={e => e.stopPropagation()}>
          <button
            onClick={() => setShowSort(v => !v)}
            className={cn("w-8 h-8 flex items-center justify-center rounded-lg transition-colors",
              showSort ? "text-white bg-white/10" : "text-white/40 hover:text-white hover:bg-white/8"
            )}
          >
            <SortAsc size={16} />
          </button>
          <AnimatePresence>
            {showSort && (
              <m.div
                initial={{ opacity: 0, scale: 0.92, y: -4 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.92, y: -4 }}
                className="absolute right-0 top-10 bg-[#1e1e1e] border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50 min-w-[150px]"
              >
                {([["recent", "Recent", Clock], ["name", "Name", SortAsc], ["lang", "Language", Code2]] as const).map(([id, label, Icon]) => (
                  <button key={id} onClick={() => { setSort(id); setShowSort(false); }}
                    className={cn("w-full flex items-center gap-3 px-4 py-2.5 hover:bg-white/5 transition-colors text-left",
                      sort === id ? "text-blue-400" : "text-white/70"
                    )}>
                    <Icon size={13} />
                    <span className="text-sm">{label}</span>
                    {sort === id && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-400" />}
                  </button>
                ))}
              </m.div>
            )}
          </AnimatePresence>
        </div>

        {/* View toggle */}
        <button
          onClick={() => setView(v => v === "list" ? "grid" : "list")}
          className="w-8 h-8 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/8 rounded-lg transition-colors shrink-0"
        >
          {view === "list" ? <LayoutGrid size={15} /> : <List size={15} />}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="mx-4 mb-3 flex items-center gap-2 text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2.5">
          <AlertCircle size={14} className="shrink-0" />
          <span className="text-xs flex-1">{error}</span>
          <button onClick={fetchProjects} className="text-xs text-red-300 underline">Retry</button>
        </div>
      )}

      {/* Project list */}
      <div className={cn(
        "flex-1 overflow-y-auto no-scrollbar pb-28 px-4",
        view === "grid" ? "grid grid-cols-2 gap-3 content-start" : "flex flex-col gap-2.5"
      )}>

        {/* Loading skeleton */}
        {loading && [...Array(5)].map((_, i) => (
          <div key={i} className={cn(
            "animate-pulse bg-[#1a1a1a] rounded-2xl border border-white/[0.08]",
            view === "list" ? "h-16" : "h-28"
          )} />
        ))}

        <AnimatePresence>
          {!loading && visible.map((project, i) => {
            const Icon = langIcon(project.language);
            const { color, bg } = langColor(project.language);
            return view === "list" ? (
              <m.div
                key={project.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ delay: i * 0.04 }}
                onClick={() => handleOpenProject(project)}
                className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-[#1a1a1a] border border-white/[0.08] hover:border-white/15 hover:bg-[#1e1e1e] active:scale-[0.99] cursor-pointer transition-all relative"
                data-testid={`card-project-${project.id}`}
              >
                <div className={cn("w-11 h-11 rounded-xl flex items-center justify-center shrink-0", bg)}>
                  <Icon size={21} className={color} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-semibold text-white truncate">{project.name}</span>
                    {project.starred && <Star size={11} className="text-yellow-400 shrink-0 fill-yellow-400" />}
                    {project.running && (
                      <span className="w-1.5 h-1.5 rounded-full bg-green-400 shrink-0" />
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[11px] text-white/35">{timeAgo(project.updatedAt ?? project.createdAt)}</span>
                    <span className="text-white/20">·</span>
                    <span className="text-[11px] font-medium text-white/40 bg-white/5 px-1.5 py-0.5 rounded-md border border-white/6 capitalize">{project.language}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={e => { e.stopPropagation(); handleOpenProject(project); }}
                    className="w-8 h-8 flex items-center justify-center text-white/25 hover:text-green-400 hover:bg-green-500/10 rounded-lg transition-all"
                  >
                    <Play size={13} />
                  </button>
                  <div className="relative" onClick={e => e.stopPropagation()}>
                    <button
                      onClick={() => setOpenMenu(openMenu === project.id ? null : project.id)}
                      className="w-8 h-8 flex items-center justify-center text-white/25 hover:text-white hover:bg-white/8 rounded-lg transition-colors"
                      data-testid={`menu-project-${project.id}`}
                    >
                      <MoreHorizontal size={15} />
                    </button>
                    <AnimatePresence>
                      {openMenu === project.id && (
                        <ProjectMenu
                          project={project}
                          onStar={() => handleStar(project.id)}
                          onDelete={() => handleDelete(project.id)}
                          onFork={() => handleFork(project.id)}
                          onClose={() => setOpenMenu(null)}
                        />
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </m.div>
            ) : (
              <m.div
                key={project.id}
                initial={{ opacity: 0, scale: 0.94 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.94 }}
                transition={{ delay: i * 0.04 }}
                onClick={() => handleOpenProject(project)}
                className="flex flex-col p-3.5 rounded-2xl bg-[#1a1a1a] border border-white/[0.08] hover:border-white/15 hover:bg-[#1e1e1e] active:scale-[0.98] cursor-pointer transition-all relative"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", bg)}>
                    <Icon size={18} className={color} />
                  </div>
                  {project.starred && <Star size={11} className="text-yellow-400 fill-yellow-400" />}
                </div>
                <p className="text-sm font-semibold text-white leading-tight truncate">{project.name}</p>
                <p className="text-[11px] text-white/35 mt-0.5">{timeAgo(project.updatedAt ?? project.createdAt)}</p>
                <div className="flex items-center gap-1.5 mt-2">
                  <span className="text-[10px] font-medium text-white/35 bg-white/5 px-1.5 py-0.5 rounded border border-white/6 capitalize">{project.language}</span>
                </div>
              </m.div>
            );
          })}
        </AnimatePresence>

        {!loading && visible.length === 0 && (
          <m.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={cn("text-center py-20", view === "grid" && "col-span-2")}
          >
            {search ? (
              <>
                <Search size={36} className="mx-auto mb-3 text-white/15" />
                <p className="text-sm text-white/30">No repls match "{search}"</p>
                <button onClick={() => setSearch("")} className="mt-3 text-xs text-blue-400 hover:text-blue-300 transition-colors">Clear search</button>
              </>
            ) : filter === "starred" ? (
              <>
                <Star size={36} className="mx-auto mb-3 text-white/15" />
                <p className="text-sm text-white/30">No starred repls yet</p>
                <p className="text-xs text-white/20 mt-1">Star repls to find them quickly</p>
              </>
            ) : (
              <>
                <Blocks size={36} className="mx-auto mb-3 text-white/15" />
                <p className="text-sm text-white/30">No repls yet</p>
                <button onClick={() => setLocation("/")} className="mt-3 flex items-center gap-1.5 mx-auto text-xs text-blue-400 hover:text-blue-300 transition-colors">
                  <Plus size={13} /> Create your first repl
                </button>
              </>
            )}
          </m.div>
        )}
      </div>
    </m.div>
  );
}
