import { useState, useRef, useEffect } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, X, ArrowRight, Bot, Globe, Gamepad2, Code2,
  BarChart3, Server, Palette, BookOpen, FolderOpen, Zap,
  TrendingUp, Clock
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SearchResult {
  id: string;
  type: "repl" | "template" | "page" | "user";
  title: string;
  subtitle: string;
  icon: React.ElementType;
  iconColor: string;
  iconBg: string;
  path: string;
}

const ALL_RESULTS: SearchResult[] = [
  { id: "r1", type: "repl", title: "AI Chat Interface", subtitle: "by @sara_codes · TypeScript", icon: Bot, iconColor: "text-purple-400", iconBg: "bg-purple-500/15", path: "/explore" },
  { id: "r2", type: "repl", title: "Flappy Bird Clone", subtitle: "by @alex_dev · JavaScript", icon: Gamepad2, iconColor: "text-yellow-400", iconBg: "bg-yellow-500/15", path: "/explore" },
  { id: "r3", type: "repl", title: "Portfolio Generator", subtitle: "by @mike_ui · TypeScript", icon: Palette, iconColor: "text-pink-400", iconBg: "bg-pink-500/15", path: "/explore" },
  { id: "r4", type: "repl", title: "REST API Boilerplate", subtitle: "by @backend_pro · TypeScript", icon: Server, iconColor: "text-cyan-400", iconBg: "bg-cyan-500/15", path: "/explore" },
  { id: "r5", type: "repl", title: "Real-time Dashboard", subtitle: "by @data_viz · Python", icon: BarChart3, iconColor: "text-teal-400", iconBg: "bg-teal-500/15", path: "/explore" },
  { id: "t1", type: "template", title: "React + Vite", subtitle: "Official template · TypeScript", icon: Globe, iconColor: "text-blue-400", iconBg: "bg-blue-500/15", path: "/templates" },
  { id: "t2", type: "template", title: "Python Flask", subtitle: "Official template · Python", icon: Server, iconColor: "text-green-400", iconBg: "bg-green-500/15", path: "/templates" },
  { id: "t3", type: "template", title: "AI Chatbot", subtitle: "Official template · TypeScript", icon: Bot, iconColor: "text-purple-400", iconBg: "bg-purple-500/15", path: "/templates" },
  { id: "p1", type: "page", title: "Explore", subtitle: "Browse community repls", icon: Globe, iconColor: "text-purple-400", iconBg: "bg-purple-500/15", path: "/explore" },
  { id: "p2", type: "page", title: "Templates", subtitle: "Starter templates", icon: BookOpen, iconColor: "text-blue-400", iconBg: "bg-blue-500/15", path: "/templates" },
  { id: "p3", type: "page", title: "Projects", subtitle: "Your projects", icon: FolderOpen, iconColor: "text-orange-400", iconBg: "bg-orange-500/15", path: "/projects" },
  { id: "p4", type: "page", title: "Plans & Pricing", subtitle: "Upgrade your plan", icon: Zap, iconColor: "text-yellow-400", iconBg: "bg-yellow-500/15", path: "/plans" },
  { id: "p5", type: "page", title: "Bounties", subtitle: "Earn money building", icon: TrendingUp, iconColor: "text-green-400", iconBg: "bg-green-500/15", path: "/bounties" },
];

const TRENDING = ["AI chatbot", "portfolio site", "REST API", "2048 game", "dashboard"];
const RECENT_KEY = "global_search_recent";

interface GlobalSearchProps {
  onClose: () => void;
}

export function GlobalSearch({ onClose }: GlobalSearchProps) {
  const [, setLocation] = useLocation();
  const [query, setQuery] = useState("");
  const [recent, setRecent] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    try {
      const r = JSON.parse(localStorage.getItem(RECENT_KEY) ?? "[]");
      if (Array.isArray(r)) setRecent(r);
    } catch { /**/ }
  }, []);

  const results = query.trim()
    ? ALL_RESULTS.filter(r =>
        r.title.toLowerCase().includes(query.toLowerCase()) ||
        r.subtitle.toLowerCase().includes(query.toLowerCase())
      )
    : [];

  const saveRecent = (q: string) => {
    const next = [q, ...recent.filter(r => r !== q)].slice(0, 5);
    setRecent(next);
    localStorage.setItem(RECENT_KEY, JSON.stringify(next));
  };

  const handleSelect = (result: SearchResult) => {
    saveRecent(result.title);
    setLocation(result.path);
    onClose();
  };

  const handleTrending = (term: string) => {
    setQuery(term);
    saveRecent(term);
  };

  const clearRecent = () => {
    setRecent([]);
    localStorage.removeItem(RECENT_KEY);
  };

  const TYPE_LABEL: Record<string, string> = {
    repl: "Repl",
    template: "Template",
    page: "Page",
    user: "User",
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex flex-col max-w-[480px] mx-auto"
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      {/* Search panel */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -20, opacity: 0 }}
        transition={{ duration: 0.18 }}
        className="relative z-10 bg-[#1a1a1a] border-b border-white/10 shadow-2xl"
      >
        {/* Input */}
        <div className="flex items-center gap-3 px-4 py-3">
          <Search size={18} className="text-white/40 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === "Escape" && onClose()}
            placeholder="Search repls, templates, pages..."
            className="flex-1 bg-transparent text-[15px] text-white placeholder:text-white/30 outline-none"
            data-testid="global-search-input"
          />
          {query && (
            <button onClick={() => setQuery("")} className="text-white/40 hover:text-white shrink-0">
              <X size={16} />
            </button>
          )}
          <button onClick={onClose} className="text-white/40 hover:text-white text-[13px] font-medium ml-1 shrink-0">
            Cancel
          </button>
        </div>

        {/* Results or suggestions */}
        <div className="max-h-[70vh] overflow-y-auto pb-4">
          {results.length > 0 ? (
            <div>
              <p className="px-4 py-2 text-[10px] font-semibold uppercase tracking-widest text-white/25">
                Results ({results.length})
              </p>
              {results.map((result, i) => {
                const Icon = result.icon;
                return (
                  <motion.button
                    key={result.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.03 }}
                    onClick={() => handleSelect(result)}
                    className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-white/5 transition-colors text-left"
                  >
                    <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center shrink-0", result.iconBg)}>
                      <Icon size={15} className={result.iconColor} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-semibold text-white truncate">{result.title}</p>
                      <p className="text-[11px] text-white/35 truncate">{result.subtitle}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[9px] font-semibold text-white/25 bg-white/6 border border-white/8 px-1.5 py-0.5 rounded-full">
                        {TYPE_LABEL[result.type]}
                      </span>
                      <ArrowRight size={12} className="text-white/20" />
                    </div>
                  </motion.button>
                );
              })}
            </div>
          ) : query ? (
            <div className="px-4 py-8 text-center">
              <Search size={24} className="text-white/15 mx-auto mb-2" />
              <p className="text-[13px] text-white/30">No results for "{query}"</p>
              <p className="text-[11px] text-white/20 mt-1">Try a different search term</p>
            </div>
          ) : (
            <div className="space-y-1">
              {/* Trending */}
              <div className="px-4 py-2">
                <div className="flex items-center gap-1.5 mb-2">
                  <TrendingUp size={12} className="text-white/30" />
                  <span className="text-[10px] font-semibold uppercase tracking-widest text-white/25">Trending</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {TRENDING.map(term => (
                    <button
                      key={term}
                      onClick={() => handleTrending(term)}
                      className="text-[12px] text-white/50 bg-white/5 border border-white/8 px-2.5 py-1 rounded-full hover:bg-white/10 hover:text-white transition-all"
                    >
                      {term}
                    </button>
                  ))}
                </div>
              </div>

              {/* Recent */}
              {recent.length > 0 && (
                <div className="px-4 py-2 border-t border-white/[0.05]">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5">
                      <Clock size={11} className="text-white/30" />
                      <span className="text-[10px] font-semibold uppercase tracking-widest text-white/25">Recent</span>
                    </div>
                    <button onClick={clearRecent} className="text-[10px] text-white/25 hover:text-white/50 transition-colors">
                      Clear
                    </button>
                  </div>
                  {recent.map(term => (
                    <button
                      key={term}
                      onClick={() => setQuery(term)}
                      className="w-full flex items-center gap-2.5 py-2 hover:bg-white/4 rounded-lg px-1 transition-colors text-left group"
                    >
                      <Clock size={13} className="text-white/25 shrink-0" />
                      <span className="text-[13px] text-white/50 flex-1">{term}</span>
                      <ArrowRight size={12} className="text-white/0 group-hover:text-white/25 transition-colors shrink-0" />
                    </button>
                  ))}
                </div>
              )}

              {/* Quick links */}
              <div className="px-4 py-2 border-t border-white/[0.05]">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-white/25 mb-2">Quick Links</p>
                {ALL_RESULTS.filter(r => r.type === "page").map(result => {
                  const Icon = result.icon;
                  return (
                    <button
                      key={result.id}
                      onClick={() => handleSelect(result)}
                      className="w-full flex items-center gap-3 py-2.5 hover:bg-white/4 rounded-lg px-1 transition-colors text-left"
                    >
                      <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center shrink-0", result.iconBg)}>
                        <Icon size={13} className={result.iconColor} />
                      </div>
                      <span className="text-[13px] text-white/50 flex-1">{result.title}</span>
                      <ArrowRight size={12} className="text-white/20 shrink-0" />
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
