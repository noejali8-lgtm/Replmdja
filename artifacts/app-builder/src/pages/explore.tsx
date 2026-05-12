import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { motion as m, AnimatePresence } from "framer-motion";
import {
  Search, TrendingUp, Star, Play, Heart, Globe, Lock,
  Code2, Bot, Gamepad2, BarChart3, Smartphone, Server,
  Palette, Globe2, ChevronRight, Zap, Users, Eye,
  Layers, Terminal, BookOpen, X, Filter, Copy
} from "lucide-react";
import { cn } from "@/lib/utils";

type Category = "All" | "Web" | "Game" | "AI" | "Mobile" | "Backend" | "Art";

interface Repl {
  id: number;
  name: string;
  author: string;
  authorInitial: string;
  authorColor: string;
  desc: string;
  lang: string;
  icon: React.ElementType;
  iconColor: string;
  iconBg: string;
  likes: number;
  views: string;
  runs: number;
  category: Category;
  featured?: boolean;
  tag?: string;
  tagColor?: string;
}

const REPLS: Repl[] = [
  { id: 1, name: "Flappy Bird Clone", author: "alex_dev", authorInitial: "A", authorColor: "bg-blue-500", desc: "A smooth Flappy Bird clone built with p5.js — tap to flap!", lang: "JavaScript", icon: Gamepad2, iconColor: "text-yellow-400", iconBg: "bg-yellow-500/15", likes: 2841, views: "48K", runs: 12400, category: "Game", featured: true, tag: "Trending", tagColor: "bg-orange-500/20 text-orange-400 border-orange-400/30" },
  { id: 2, name: "AI Chat Interface", author: "sara_codes", authorInitial: "S", authorColor: "bg-purple-500", desc: "Clean ChatGPT-style UI with streaming responses and markdown support.", lang: "TypeScript", icon: Bot, iconColor: "text-purple-400", iconBg: "bg-purple-500/15", likes: 1943, views: "31K", runs: 8200, category: "AI", featured: true, tag: "Popular", tagColor: "bg-blue-500/20 text-blue-400 border-blue-400/30" },
  { id: 3, name: "Portfolio Generator", author: "mike_ui", authorInitial: "M", authorColor: "bg-green-500", desc: "Generate a beautiful personal portfolio site from a JSON config file.", lang: "TypeScript", icon: Palette, iconColor: "text-pink-400", iconBg: "bg-pink-500/15", likes: 1234, views: "22K", runs: 5600, category: "Web", tag: "New", tagColor: "bg-green-500/20 text-green-400 border-green-400/30" },
  { id: 4, name: "REST API Boilerplate", author: "backend_pro", authorInitial: "B", authorColor: "bg-yellow-500", desc: "Production-ready Express API with auth, rate limiting, and PostgreSQL.", lang: "TypeScript", icon: Server, iconColor: "text-cyan-400", iconBg: "bg-cyan-500/15", likes: 987, views: "18K", runs: 3100, category: "Backend" },
  { id: 5, name: "2048 Game", author: "game_dev42", authorInitial: "G", authorColor: "bg-red-500", desc: "Classic 2048 puzzle game with swipe support and smooth animations.", lang: "JavaScript", icon: Gamepad2, iconColor: "text-red-400", iconBg: "bg-red-500/15", likes: 876, views: "15K", runs: 7800, category: "Game" },
  { id: 6, name: "Real-time Dashboard", author: "data_viz", authorInitial: "D", authorColor: "bg-teal-500", desc: "Live data dashboard with animated charts, dark mode, and CSV import.", lang: "Python", icon: BarChart3, iconColor: "text-teal-400", iconBg: "bg-teal-500/15", likes: 743, views: "12K", runs: 2900, category: "Web" },
  { id: 7, name: "Snake Game", author: "retro_coder", authorInitial: "R", authorColor: "bg-emerald-600", desc: "Classic Snake with a modern neon aesthetic and high-score tracking.", lang: "JavaScript", icon: Gamepad2, iconColor: "text-emerald-400", iconBg: "bg-emerald-500/15", likes: 654, views: "11K", runs: 9400, category: "Game" },
  { id: 8, name: "Expense Tracker", author: "fin_dev", authorInitial: "F", authorColor: "bg-orange-500", desc: "Track your spending with categories, charts, and monthly summaries.", lang: "TypeScript", icon: BarChart3, iconColor: "text-orange-400", iconBg: "bg-orange-500/15", likes: 541, views: "9.2K", runs: 2100, category: "Web" },
  { id: 9, name: "AI Image Captioner", author: "ml_guru", authorInitial: "M", authorColor: "bg-violet-500", desc: "Upload any image and get an AI-generated description using Claude.", lang: "Python", icon: Bot, iconColor: "text-violet-400", iconBg: "bg-violet-500/15", likes: 498, views: "8.1K", runs: 1800, category: "AI" },
  { id: 10, name: "Markdown Editor", author: "text_craft", authorInitial: "T", authorColor: "bg-slate-500", desc: "Split-pane Markdown editor with live preview and syntax highlighting.", lang: "TypeScript", icon: Code2, iconColor: "text-slate-400", iconBg: "bg-slate-500/15", likes: 432, views: "7.4K", runs: 3200, category: "Web" },
  { id: 11, name: "Pomodoro Timer", author: "focus_dev", authorInitial: "F", authorColor: "bg-rose-500", desc: "Beautiful Pomodoro productivity timer with session tracking.", lang: "JavaScript", icon: Layers, iconColor: "text-rose-400", iconBg: "bg-rose-500/15", likes: 389, views: "6.8K", runs: 5100, category: "Web" },
  { id: 12, name: "Terminal Portfolio", author: "hack3r", authorInitial: "H", authorColor: "bg-lime-600", desc: "Interactive terminal-style portfolio — type commands to explore.", lang: "JavaScript", icon: Terminal, iconColor: "text-lime-400", iconBg: "bg-lime-500/15", likes: 321, views: "5.9K", runs: 1400, category: "Web" },
];

const CATEGORIES: Category[] = ["All", "Web", "Game", "AI", "Mobile", "Backend", "Art"];

const CATEGORY_ICONS: Record<Category, React.ElementType> = {
  All: Globe2, Web: Globe, Game: Gamepad2, AI: Bot, Mobile: Smartphone, Backend: Server, Art: Palette
};

function FeaturedCard({ repl, onClick }: { repl: Repl; onClick: () => void }) {
  const [liked, setLiked] = useState(false);
  const Icon = repl.icon;

  return (
    <m.div
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="shrink-0 w-[280px] bg-[#1a1a1a] border border-white/[0.08] rounded-2xl overflow-hidden cursor-pointer hover:border-white/15 transition-all"
    >
      <div className="relative h-[140px] bg-gradient-to-br from-white/3 to-white/[0.01] flex items-center justify-center">
        <div className={cn("w-16 h-16 rounded-2xl flex items-center justify-center border border-white/10", repl.iconBg)}>
          <Icon size={30} className={repl.iconColor} />
        </div>
        {repl.tag && (
          <span className={cn("absolute top-3 right-3 text-[10px] font-bold px-2 py-0.5 rounded-full border", repl.tagColor)}>
            {repl.tag}
          </span>
        )}
        <button
          onClick={e => { e.stopPropagation(); setLiked(v => !v); }}
          className={cn("absolute top-3 left-3 w-7 h-7 rounded-full flex items-center justify-center transition-all",
            liked ? "bg-red-500/20 border border-red-400/30 text-red-400" : "bg-black/30 text-white/40 hover:text-white"
          )}
        >
          <Heart size={13} className={liked ? "fill-red-400" : ""} />
        </button>
      </div>
      <div className="p-3.5">
        <div className="flex items-center gap-2 mb-1.5">
          <div className={cn("w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white shrink-0", repl.authorColor)}>
            {repl.authorInitial}
          </div>
          <span className="text-[11px] text-white/40">@{repl.author}</span>
        </div>
        <h3 className="text-sm font-semibold text-white leading-tight">{repl.name}</h3>
        <p className="text-[11px] text-white/40 mt-0.5 line-clamp-2 leading-relaxed">{repl.desc}</p>
        <div className="flex items-center gap-3 mt-2.5">
          <span className="text-[10px] font-medium text-white/30 bg-white/5 px-1.5 py-0.5 rounded border border-white/6">{repl.lang}</span>
          <span className="text-[10px] text-white/25 flex items-center gap-1">
            <Heart size={9} /> {liked ? repl.likes + 1 : repl.likes}
          </span>
          <span className="text-[10px] text-white/25 flex items-center gap-1">
            <Eye size={9} /> {repl.views}
          </span>
        </div>
      </div>
    </m.div>
  );
}

function ReplCard({ repl, onClick, i }: { repl: Repl; onClick: () => void; i: number }) {
  const [liked, setLiked] = useState(false);
  const Icon = repl.icon;

  return (
    <m.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: i * 0.04 }}
      onClick={onClick}
      className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-[#1a1a1a] border border-white/[0.08] hover:border-white/15 hover:bg-[#1e1e1e] active:scale-[0.99] cursor-pointer transition-all"
    >
      <div className={cn("w-11 h-11 rounded-xl flex items-center justify-center shrink-0 mt-0.5", repl.iconBg)}>
        <Icon size={20} className={repl.iconColor} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <h3 className="text-sm font-semibold text-white leading-tight truncate">{repl.name}</h3>
          {repl.tag && (
            <span className={cn("text-[9px] font-bold px-1.5 py-0.5 rounded-full border shrink-0", repl.tagColor)}>
              {repl.tag}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5 mt-0.5 mb-1">
          <div className={cn("w-3.5 h-3.5 rounded-full flex items-center justify-center text-[7px] font-bold text-white shrink-0", repl.authorColor)}>
            {repl.authorInitial}
          </div>
          <span className="text-[11px] text-white/35">@{repl.author}</span>
          <span className="text-white/15">·</span>
          <span className="text-[10px] text-white/25 bg-white/5 px-1.5 py-0.5 rounded border border-white/6 font-medium">{repl.lang}</span>
        </div>
        <p className="text-[11px] text-white/40 leading-relaxed line-clamp-2">{repl.desc}</p>
        <div className="flex items-center gap-3 mt-1.5">
          <button
            onClick={e => { e.stopPropagation(); setLiked(v => !v); }}
            className={cn("flex items-center gap-1 text-[11px] transition-colors",
              liked ? "text-red-400" : "text-white/25 hover:text-white/50"
            )}
          >
            <Heart size={11} className={liked ? "fill-red-400" : ""} />
            <span>{liked ? repl.likes + 1 : repl.likes}</span>
          </button>
          <span className="text-[11px] text-white/20 flex items-center gap-1">
            <Eye size={11} /> {repl.views}
          </span>
          <span className="text-[11px] text-white/20 flex items-center gap-1">
            <Play size={10} /> {repl.runs.toLocaleString()}
          </span>
        </div>
      </div>
    </m.div>
  );
}

interface CommunityProject {
  id: number; name: string; language: string; description: string;
  isPublic: boolean; createdAt: string; updatedAt: string;
}

const LANG_COLORS: Record<string, string> = {
  node: "text-green-400", python: "text-yellow-400", react: "text-blue-400",
  html: "text-orange-400", flask: "text-purple-400",
};
const LANG_BG: Record<string, string> = {
  node: "bg-green-500/15", python: "bg-yellow-500/15", react: "bg-blue-500/15",
  html: "bg-orange-500/15", flask: "bg-purple-500/15",
};

export default function Explore() {
  const [, setLocation] = useLocation();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<Category>("All");
  const [community, setCommunity] = useState<CommunityProject[]>([]);

  useEffect(() => {
    fetch("/api/projects/explore", { credentials: "include" })
      .then(r => r.ok ? r.json() : [])
      .then(data => { if (Array.isArray(data)) setCommunity(data); })
      .catch(() => {});
  }, []);

  const handleOpen = (repl: Repl) => {
    sessionStorage.setItem("chat_prompt", `I want to build something like "${repl.name}" — ${repl.desc}`);
    setLocation("/chat");
  };

  const handleOpenCommunity = (p: CommunityProject) => {
    sessionStorage.setItem("chat_prompt", `I want to explore "${p.name}" — a ${p.language} project. ${p.description}`);
    setLocation("/chat");
  };

  const handleFork = async (p: CommunityProject, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const res = await fetch(`/api/projects/${p.id}/fork`, { method: "POST", credentials: "include" });
      if (res.ok) { const forked = await res.json(); alert(`Forked as "${forked.name}"!`); }
    } catch { /**/ }
  };

  const featured = REPLS.filter(r => r.featured);
  const visible = REPLS.filter(r => {
    const matchCat = category === "All" || r.category === category;
    const matchSearch = !search || r.name.toLowerCase().includes(search.toLowerCase()) || r.author.toLowerCase().includes(search.toLowerCase()) || r.desc.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <m.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex flex-col min-h-full pb-28 max-w-[480px] mx-auto w-full"
    >
      {/* Header */}
      <div className="px-4 pt-12 pb-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-white">Explore</h1>
          <div className="flex items-center gap-1.5 bg-green-500/10 border border-green-400/20 px-2.5 py-1 rounded-full">
            <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            <span className="text-[11px] text-green-400 font-semibold">{REPLS.length} online</span>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" size={15} />
          <input
            type="text"
            placeholder="Search repls, authors..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-[#1c1c1c] border border-white/10 rounded-2xl pl-10 pr-10 py-2.5 text-sm text-white placeholder:text-white/30 outline-none focus:border-white/20 transition-colors"
            data-testid="input-search-explore"
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white">
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Category chips */}
      <div className="px-4 mb-5 overflow-x-auto no-scrollbar">
        <div className="flex gap-2 pb-1">
          {CATEGORIES.map(cat => {
            const Icon = CATEGORY_ICONS[cat];
            return (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={cn(
                  "flex items-center gap-1.5 px-3.5 py-2 rounded-full text-[12px] font-semibold whitespace-nowrap transition-all shrink-0 border",
                  category === cat
                    ? "bg-white text-black border-white"
                    : "bg-white/5 text-white/50 border-white/8 hover:text-white/80 hover:bg-white/10"
                )}
                data-testid={`cat-${cat.toLowerCase()}`}
              >
                <Icon size={12} />
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* Featured section (only when no search + All/Web/Game/AI) */}
      <AnimatePresence>
        {!search && (category === "All" || category === "Game" || category === "AI" || category === "Web") && (
          <m.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="mb-5"
          >
            <div className="flex items-center gap-2 px-4 mb-3">
              <TrendingUp size={14} className="text-orange-400" />
              <span className="text-sm font-semibold text-white">Featured</span>
            </div>
            <div className="flex gap-3 px-4 overflow-x-auto no-scrollbar pb-1">
              {featured
                .filter(r => category === "All" || r.category === category)
                .map(repl => (
                  <FeaturedCard key={repl.id} repl={repl} onClick={() => handleOpen(repl)} />
                ))}
            </div>
          </m.div>
        )}
      </AnimatePresence>

      {/* Community repls from API */}
      {community.length > 0 && !search && (
        <m.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-5">
          <div className="flex items-center gap-2 px-4 mb-3">
            <Globe size={14} className="text-blue-400" />
            <span className="text-sm font-semibold text-white">Community Repls</span>
            <span className="text-xs text-white/25 ml-auto">{community.length} public</span>
          </div>
          <div className="px-4 space-y-2.5">
            {community.slice(0, 5).map((p, i) => (
              <m.div
                key={p.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => handleOpenCommunity(p)}
                className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-[#1a1a2e] border border-blue-500/20 hover:border-blue-400/40 cursor-pointer transition-all active:scale-[0.99]"
              >
                <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0", LANG_BG[p.language] ?? "bg-white/10")}>
                  <Code2 size={18} className={LANG_COLORS[p.language] ?? "text-white/50"} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate">{p.name}</p>
                  <p className="text-[11px] text-white/40 truncate mt-0.5">{p.description || `A ${p.language} project`}</p>
                  <span className="text-[10px] font-medium text-blue-400/70 bg-blue-500/10 px-1.5 py-0.5 rounded border border-blue-400/20 mt-1 inline-block capitalize">{p.language}</span>
                </div>
                <button
                  onClick={(e) => handleFork(p, e)}
                  className="w-8 h-8 flex items-center justify-center text-white/25 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-all shrink-0"
                  title="Fork this repl"
                >
                  <Copy size={13} />
                </button>
              </m.div>
            ))}
          </div>
        </m.div>
      )}

      {/* Stats bar */}
      {!search && category === "All" && (
        <div className="mx-4 mb-5 grid grid-cols-3 gap-3">
          {[
            { icon: <Users size={14} />, value: "30M+", label: "Developers", color: "text-blue-400" },
            { icon: <Layers size={14} />, value: "100M+", label: "Repls created", color: "text-green-400" },
            { icon: <Zap size={14} />, value: "50+", label: "Languages", color: "text-yellow-400" },
          ].map(stat => (
            <div key={stat.label} className="bg-[#1a1a1a] border border-white/[0.08] rounded-2xl p-3 text-center">
              <div className={cn("flex items-center justify-center mb-1", stat.color)}>{stat.icon}</div>
              <p className="text-sm font-bold text-white">{stat.value}</p>
              <p className="text-[10px] text-white/30 mt-0.5">{stat.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Repls list */}
      <div className="px-4">
        {!search && (
          <div className="flex items-center gap-2 mb-3">
            <Star size={13} className="text-white/40" />
            <span className="text-sm font-semibold text-white">
              {category === "All" ? "Top Repls" : `Top ${category} Repls`}
            </span>
            <span className="text-xs text-white/25 ml-auto">{visible.length} repls</span>
          </div>
        )}

        <div className="space-y-2.5">
          {visible.map((repl, i) => (
            <ReplCard key={repl.id} repl={repl} onClick={() => handleOpen(repl)} i={i} />
          ))}

          {visible.length === 0 && (
            <m.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20">
              <Search size={36} className="mx-auto mb-3 text-white/15" />
              <p className="text-sm text-white/30">No repls found for "{search}"</p>
              <button onClick={() => setSearch("")} className="mt-2 text-xs text-blue-400 hover:text-blue-300 transition-colors">Clear search</button>
            </m.div>
          )}
        </div>
      </div>
    </m.div>
  );
}
