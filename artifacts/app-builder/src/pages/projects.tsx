import { useState } from "react";
import { useLocation } from "wouter";
import { motion as m, AnimatePresence } from "framer-motion";
import {
  Search, MonitorSmartphone, Layers, BarChart3, Presentation, Wand2,
  ChevronRight, Plus, MoreHorizontal, Star, StarOff, Trash2, Globe,
  Lock, Play, Code2, Bot, Terminal, Blocks, Smartphone, X, Filter,
  Grid3X3, List, Clock, SortAsc, LayoutGrid
} from "lucide-react";
import { cn } from "@/lib/utils";

type FilterTab = "all" | "recent" | "starred" | "shared";
type ViewMode = "list" | "grid";
type SortMode = "recent" | "name" | "lang";

interface Project {
  id: number;
  name: string;
  type: string;
  lang: string;
  time: string;
  timeMs: number;
  icon: React.ElementType;
  color: string;
  bg: string;
  privacy: "public" | "private";
  starred: boolean;
  shared: boolean;
  runs: number;
}

const INITIAL_PROJECTS: Project[] = [
  { id: 1, name: "Portfolio Website", type: "Web App", lang: "TypeScript", time: "2h ago", timeMs: Date.now() - 7200000, icon: MonitorSmartphone, color: "text-blue-400", bg: "bg-blue-500/15", privacy: "public", starred: true, shared: false, runs: 142 },
  { id: 2, name: "Data Dashboard", type: "React", lang: "JavaScript", time: "5h ago", timeMs: Date.now() - 18000000, icon: BarChart3, color: "text-green-400", bg: "bg-green-500/15", privacy: "public", starred: false, shared: true, runs: 57 },
  { id: 3, name: "API Server", type: "Backend", lang: "Python", time: "1d ago", timeMs: Date.now() - 86400000, icon: Layers, color: "text-yellow-400", bg: "bg-yellow-500/15", privacy: "private", starred: false, shared: false, runs: 23 },
  { id: 4, name: "Pitch Deck", type: "Slides", lang: "HTML", time: "2d ago", timeMs: Date.now() - 172800000, icon: Presentation, color: "text-purple-400", bg: "bg-purple-500/15", privacy: "public", starred: true, shared: true, runs: 8 },
  { id: 5, name: "Logo Generator", type: "AI App", lang: "Python", time: "3d ago", timeMs: Date.now() - 259200000, icon: Wand2, color: "text-pink-400", bg: "bg-pink-500/15", privacy: "private", starred: false, shared: false, runs: 31 },
  { id: 6, name: "Discord Bot", type: "Bot", lang: "JavaScript", time: "5d ago", timeMs: Date.now() - 432000000, icon: Bot, color: "text-indigo-400", bg: "bg-indigo-500/15", privacy: "private", starred: false, shared: false, runs: 204 },
  { id: 7, name: "Mobile App", type: "Mobile", lang: "TypeScript", time: "1w ago", timeMs: Date.now() - 604800000, icon: Smartphone, color: "text-cyan-400", bg: "bg-cyan-500/15", privacy: "public", starred: true, shared: false, runs: 18 },
  { id: 8, name: "CLI Tool", type: "Terminal", lang: "Rust", time: "2w ago", timeMs: Date.now() - 1209600000, icon: Terminal, color: "text-orange-400", bg: "bg-orange-500/15", privacy: "private", starred: false, shared: false, runs: 76 },
];

function ProjectMenu({ project, onStar, onDelete, onClose }: {
  project: Project;
  onStar: () => void;
  onDelete: () => void;
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
        {project.starred ? <StarOff size={14} className="text-yellow-400" /> : <Star size={14} className="text-white/50" />}
        <span className="text-sm text-white">{project.starred ? "Unstar" : "Star"}</span>
      </button>
      <button className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors text-left">
        <Code2 size={14} className="text-white/50" />
        <span className="text-sm text-white">Open in IDE</span>
      </button>
      <button className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors text-left">
        {project.privacy === "public"
          ? <Lock size={14} className="text-white/50" />
          : <Globe size={14} className="text-white/50" />}
        <span className="text-sm text-white">Make {project.privacy === "public" ? "Private" : "Public"}</span>
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
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterTab>("all");
  const [view, setView] = useState<ViewMode>("list");
  const [sort, setSort] = useState<SortMode>("recent");
  const [showSort, setShowSort] = useState(false);
  const [openMenu, setOpenMenu] = useState<number | null>(null);
  const [projects, setProjects] = useState<Project[]>(INITIAL_PROJECTS);
  const [, setLocation] = useLocation();

  const handleOpenProject = (project: Project) => {
    if (openMenu) return;
    sessionStorage.setItem("chat_prompt", `Open project: ${project.name} — a ${project.type} project built with ${project.lang}. Let's continue working on it.`);
    setLocation("/chat");
  };

  const handleStar = (id: number) => {
    setProjects(ps => ps.map(p => p.id === id ? { ...p, starred: !p.starred } : p));
    setOpenMenu(null);
  };

  const handleDelete = (id: number) => {
    setProjects(ps => ps.filter(p => p.id !== id));
    setOpenMenu(null);
  };

  const visible = projects
    .filter(p => {
      const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.lang.toLowerCase().includes(search.toLowerCase()) || p.type.toLowerCase().includes(search.toLowerCase());
      const matchFilter =
        filter === "all" ? true :
        filter === "recent" ? true :
        filter === "starred" ? p.starred :
        filter === "shared" ? p.shared :
        true;
      return matchSearch && matchFilter;
    })
    .sort((a, b) =>
      sort === "name" ? a.name.localeCompare(b.name) :
      sort === "lang" ? a.lang.localeCompare(b.lang) :
      b.timeMs - a.timeMs
    );

  const TABS: { id: FilterTab; label: string }[] = [
    { id: "all", label: "All" },
    { id: "recent", label: "Recent" },
    { id: "starred", label: "Starred" },
    { id: "shared", label: "Shared" },
  ];

  return (
    <m.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex flex-col h-full min-h-[100dvh] max-w-[480px] mx-auto w-full"
      onClick={() => { setOpenMenu(null); setShowSort(false); }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-12 pb-3">
        <h1 className="text-2xl font-bold text-white">My Repls</h1>
        <button
          onClick={() => setLocation("/")}
          className="w-9 h-9 flex items-center justify-center bg-blue-600 hover:bg-blue-500 rounded-xl transition-colors active:scale-95"
          data-testid="button-new-repl"
        >
          <Plus size={20} className="text-white" />
        </button>
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
              {tab.id === "starred" ? <span className="flex items-center gap-1"><Star size={10} />{tab.label}</span> : tab.label}
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

      {/* Project list */}
      <div className={cn("flex-1 overflow-y-auto no-scrollbar pb-28 px-4", view === "grid" ? "grid grid-cols-2 gap-3 content-start" : "flex flex-col gap-2.5")}>
        <AnimatePresence>
          {visible.map((project, i) => {
            const Icon = project.icon;
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
                <div className={cn("w-11 h-11 rounded-xl flex items-center justify-center shrink-0", project.bg)}>
                  <Icon size={21} className={project.color} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-semibold text-white truncate">{project.name}</span>
                    {project.starred && <Star size={11} className="text-yellow-400 shrink-0 fill-yellow-400" />}
                    {project.privacy === "private"
                      ? <Lock size={10} className="text-white/25 shrink-0" />
                      : <Globe size={10} className="text-white/25 shrink-0" />}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[11px] text-white/35">{project.time}</span>
                    <span className="text-white/20">·</span>
                    <span className="text-[11px] font-medium text-white/40 bg-white/5 px-1.5 py-0.5 rounded-md border border-white/6">{project.lang}</span>
                    {project.shared && <span className="text-[10px] font-semibold text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded-md border border-blue-400/20">Shared</span>}
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={e => { e.stopPropagation(); sessionStorage.setItem("chat_prompt", `Run ${project.name}`); setLocation("/chat"); }}
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
                  <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", project.bg)}>
                    <Icon size={18} className={project.color} />
                  </div>
                  {project.starred && <Star size={11} className="text-yellow-400 fill-yellow-400" />}
                </div>
                <p className="text-sm font-semibold text-white leading-tight truncate">{project.name}</p>
                <p className="text-[11px] text-white/35 mt-0.5">{project.time}</p>
                <div className="flex items-center gap-1.5 mt-2">
                  <span className="text-[10px] font-medium text-white/35 bg-white/5 px-1.5 py-0.5 rounded border border-white/6">{project.lang}</span>
                  {project.privacy === "private"
                    ? <Lock size={9} className="text-white/20" />
                    : <Globe size={9} className="text-white/25" />}
                </div>
              </m.div>
            );
          })}
        </AnimatePresence>

        {visible.length === 0 && (
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
