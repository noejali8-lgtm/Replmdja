import { useState } from "react";
import { useLocation } from "wouter";
import { motion as m, AnimatePresence } from "framer-motion";
import {
  Globe, Smartphone, Database, Bot, BarChart3, Server,
  BookOpen, Gamepad2, ShoppingCart, MessageSquare, Layers,
  Code2, Zap, Search, Star, TrendingUp, Clock, X, Play,
  Heart, Users
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Template {
  id: number;
  name: string;
  desc: string;
  lang: string;
  icon: React.ElementType;
  color: string;
  bg: string;
  uses: string;
  likes: number;
  tag: "Popular" | "New" | "AI" | "Official";
  tagColor: string;
  author: string;
  authorInitial: string;
  authorColor: string;
}

const TEMPLATES: Template[] = [
  { id: 1, name: "React + Vite", desc: "Modern React app with Vite, Tailwind CSS, and TypeScript — zero config.", lang: "TypeScript", icon: Globe, color: "text-blue-400", bg: "bg-blue-500/15", uses: "128k", likes: 4821, tag: "Popular", tagColor: "bg-yellow-500/20 text-yellow-400 border-yellow-400/30", author: "Replit", authorInitial: "R", authorColor: "bg-orange-500" },
  { id: 2, name: "Python Flask", desc: "Simple web server with Flask, SQLAlchemy, and database migrations.", lang: "Python", icon: Server, color: "text-green-400", bg: "bg-green-500/15", uses: "95k", likes: 3204, tag: "Popular", tagColor: "bg-yellow-500/20 text-yellow-400 border-yellow-400/30", author: "Replit", authorInitial: "R", authorColor: "bg-orange-500" },
  { id: 3, name: "Node.js Express", desc: "REST API with Express, JWT auth, rate limiting, and PostgreSQL.", lang: "JavaScript", icon: Layers, color: "text-yellow-400", bg: "bg-yellow-500/15", uses: "87k", likes: 2918, tag: "Popular", tagColor: "bg-yellow-500/20 text-yellow-400 border-yellow-400/30", author: "Replit", authorInitial: "R", authorColor: "bg-orange-500" },
  { id: 4, name: "AI Chatbot", desc: "Streaming AI chatbot with Anthropic Claude, tool use, and markdown support.", lang: "TypeScript", icon: Bot, color: "text-purple-400", bg: "bg-purple-500/15", uses: "43k", likes: 1947, tag: "AI", tagColor: "bg-purple-500/20 text-purple-400 border-purple-400/30", author: "Replit", authorInitial: "R", authorColor: "bg-orange-500" },
  { id: 5, name: "Data Dashboard", desc: "Analytics dashboard with real-time charts, filters, and CSV export.", lang: "Python", icon: BarChart3, color: "text-cyan-400", bg: "bg-cyan-500/15", uses: "61k", likes: 2341, tag: "Popular", tagColor: "bg-yellow-500/20 text-yellow-400 border-yellow-400/30", author: "Replit", authorInitial: "R", authorColor: "bg-orange-500" },
  { id: 6, name: "Next.js Full Stack", desc: "Full-stack app with SSR, API routes, Prisma, and Tailwind CSS.", lang: "TypeScript", icon: Zap, color: "text-orange-400", bg: "bg-orange-500/15", uses: "112k", likes: 3872, tag: "New", tagColor: "bg-green-500/20 text-green-400 border-green-400/30", author: "Replit", authorInitial: "R", authorColor: "bg-orange-500" },
  { id: 7, name: "Discord Bot", desc: "Discord bot with slash commands, embeds, and moderation tools.", lang: "JavaScript", icon: MessageSquare, color: "text-indigo-400", bg: "bg-indigo-500/15", uses: "78k", likes: 1654, tag: "Popular", tagColor: "bg-yellow-500/20 text-yellow-400 border-yellow-400/30", author: "Replit", authorInitial: "R", authorColor: "bg-orange-500" },
  { id: 8, name: "E-Commerce Store", desc: "Full e-commerce with Stripe payments, cart, and product management.", lang: "TypeScript", icon: ShoppingCart, color: "text-emerald-400", bg: "bg-emerald-500/15", uses: "34k", likes: 1123, tag: "Official", tagColor: "bg-blue-500/20 text-blue-400 border-blue-400/30", author: "Replit", authorInitial: "R", authorColor: "bg-orange-500" },
  { id: 9, name: "PostgreSQL Starter", desc: "PostgreSQL with Drizzle ORM, migrations, and a REST API layer.", lang: "TypeScript", icon: Database, color: "text-teal-400", bg: "bg-teal-500/15", uses: "55k", likes: 1487, tag: "Official", tagColor: "bg-blue-500/20 text-blue-400 border-blue-400/30", author: "Replit", authorInitial: "R", authorColor: "bg-orange-500" },
  { id: 10, name: "2D Game (p5.js)", desc: "Browser-based 2D game template with p5.js physics and sprite support.", lang: "JavaScript", icon: Gamepad2, color: "text-red-400", bg: "bg-red-500/15", uses: "47k", likes: 2089, tag: "Popular", tagColor: "bg-yellow-500/20 text-yellow-400 border-yellow-400/30", author: "Replit", authorInitial: "R", authorColor: "bg-orange-500" },
  { id: 11, name: "AI Image Generator", desc: "Generate images with DALL-E 3 API, gallery view, and download support.", lang: "Python", icon: Star, color: "text-amber-400", bg: "bg-amber-500/15", uses: "38k", likes: 1832, tag: "AI", tagColor: "bg-purple-500/20 text-purple-400 border-purple-400/30", author: "Replit", authorInitial: "R", authorColor: "bg-orange-500" },
  { id: 12, name: "Mobile App (React Native)", desc: "Cross-platform mobile app for iOS and Android with Expo.", lang: "TypeScript", icon: Smartphone, color: "text-pink-400", bg: "bg-pink-500/15", uses: "29k", likes: 976, tag: "Official", tagColor: "bg-blue-500/20 text-blue-400 border-blue-400/30", author: "Replit", authorInitial: "R", authorColor: "bg-orange-500" },
];

const TAGS = ["All", "Popular", "New", "AI", "Official"] as const;
const LANGS = ["All", "TypeScript", "Python", "JavaScript"] as const;

type TagFilter = typeof TAGS[number];
type LangFilter = typeof LANGS[number];

export default function Templates() {
  const [search, setSearch] = useState("");
  const [activeTag, setActiveTag] = useState<TagFilter>("All");
  const [activeLang, setActiveLang] = useState<LangFilter>("All");
  const [likedIds, setLikedIds] = useState<Set<number>>(new Set());
  const [, setLocation] = useLocation();

  const filtered = TEMPLATES.filter(t => {
    const matchSearch = !search || t.name.toLowerCase().includes(search.toLowerCase()) || t.lang.toLowerCase().includes(search.toLowerCase()) || t.desc.toLowerCase().includes(search.toLowerCase());
    const matchTag = activeTag === "All" || t.tag === activeTag;
    const matchLang = activeLang === "All" || t.lang === activeLang;
    return matchSearch && matchTag && matchLang;
  });

  const handleUse = (template: Template) => {
    sessionStorage.setItem("chat_prompt", `Use the "${template.name}" template (${template.lang}): ${template.desc}`);
    setLocation("/chat");
  };

  const toggleLike = (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    setLikedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  return (
    <m.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex flex-col min-h-full pb-28 max-w-[480px] mx-auto w-full"
    >
      {/* Header */}
      <div className="px-4 pt-12 pb-4">
        <h1 className="text-2xl font-bold text-white mb-1">Templates</h1>
        <p className="text-sm text-white/35">Start from a ready-made template</p>
      </div>

      {/* Search */}
      <div className="px-4 mb-3">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" size={15} />
          <input
            type="text"
            placeholder="Search templates..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-[#1c1c1c] border border-white/10 rounded-2xl pl-10 pr-10 py-2.5 text-sm text-white placeholder:text-white/30 outline-none focus:border-white/20 transition-colors"
            data-testid="input-search-templates"
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white">
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Tag filters */}
      <div className="px-4 mb-2 overflow-x-auto no-scrollbar">
        <div className="flex gap-2 pb-1">
          {TAGS.map(tag => (
            <button
              key={tag}
              onClick={() => setActiveTag(tag)}
              className={cn(
                "flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all border shrink-0",
                activeTag === tag
                  ? "bg-white text-black border-white"
                  : "bg-white/5 border-white/8 text-white/45 hover:text-white/80 hover:bg-white/10"
              )}
              data-testid={`filter-tag-${tag}`}
            >
              {tag === "Popular" && <TrendingUp size={10} />}
              {tag === "New" && <Clock size={10} />}
              {tag === "AI" && <Bot size={10} />}
              {tag === "Official" && <Star size={10} />}
              {tag}
            </button>
          ))}
        </div>
      </div>

      {/* Language filters */}
      <div className="px-4 mb-4 overflow-x-auto no-scrollbar">
        <div className="flex gap-2 pb-1">
          {LANGS.map(lang => (
            <button
              key={lang}
              onClick={() => setActiveLang(lang)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all border shrink-0",
                activeLang === lang
                  ? "bg-white/12 border-white/20 text-white"
                  : "bg-transparent border-white/6 text-white/35 hover:text-white/60 hover:border-white/12"
              )}
              data-testid={`filter-lang-${lang}`}
            >
              {lang}
            </button>
          ))}
        </div>
      </div>

      {/* Template count */}
      {!search && (
        <div className="px-4 mb-3">
          <span className="text-xs text-white/25">{filtered.length} templates</span>
        </div>
      )}

      {/* Template list */}
      <div className="px-4 space-y-2.5">
        <AnimatePresence>
          {filtered.map((template, i) => {
            const Icon = template.icon;
            const liked = likedIds.has(template.id);
            return (
              <m.div
                key={template.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ delay: i * 0.04 }}
                onClick={() => handleUse(template)}
                className="flex items-start gap-3.5 p-4 rounded-2xl bg-[#1a1a1a] border border-white/[0.08] hover:border-white/15 hover:bg-[#1e1e1e] active:scale-[0.99] transition-all cursor-pointer"
                data-testid={`template-${template.id}`}
              >
                <div className={cn("w-11 h-11 rounded-xl flex items-center justify-center shrink-0 mt-0.5", template.bg)}>
                  <Icon size={21} className={template.color} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <h3 className="text-sm font-semibold text-white leading-tight truncate">{template.name}</h3>
                    <span className={cn("text-[9px] font-bold px-1.5 py-0.5 rounded-full border shrink-0", template.tagColor)}>
                      {template.tag}
                    </span>
                  </div>
                  <p className="text-[11px] text-white/40 leading-relaxed line-clamp-2">{template.desc}</p>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-[10px] font-medium text-white/30 bg-white/5 px-1.5 py-0.5 rounded-md border border-white/6">{template.lang}</span>
                    <span className="text-[10px] text-white/25 flex items-center gap-1">
                      <Play size={9} /> {template.uses} uses
                    </span>
                    <button
                      onClick={e => toggleLike(e, template.id)}
                      className={cn("flex items-center gap-1 text-[10px] transition-colors ml-auto",
                        liked ? "text-red-400" : "text-white/20 hover:text-white/50"
                      )}
                    >
                      <Heart size={10} className={liked ? "fill-red-400" : ""} />
                      <span>{liked ? template.likes + 1 : template.likes}</span>
                    </button>
                  </div>
                </div>
              </m.div>
            );
          })}
        </AnimatePresence>

        {filtered.length === 0 && (
          <m.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20">
            <Search size={36} className="mx-auto mb-3 text-white/15" />
            <p className="text-sm text-white/30">No templates match your search</p>
            <button onClick={() => { setSearch(""); setActiveTag("All"); setActiveLang("All"); }}
              className="mt-2 text-xs text-blue-400 hover:text-blue-300 transition-colors">
              Clear filters
            </button>
          </m.div>
        )}
      </div>
    </m.div>
  );
}
