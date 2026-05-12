import { useState } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Trophy, DollarSign, Clock, Users, ChevronRight,
  Star, Filter, Search, Zap, Code2, Globe, Bot, BarChart3,
  CheckCircle, Circle, Eye, Heart, Bookmark, X, ArrowUpRight
} from "lucide-react";
import { cn } from "@/lib/utils";

type BountyStatus = "open" | "in_progress" | "completed";
type Difficulty = "Beginner" | "Intermediate" | "Expert";

interface Bounty {
  id: number;
  title: string;
  desc: string;
  reward: number;
  currency: string;
  status: BountyStatus;
  difficulty: Difficulty;
  tags: string[];
  poster: string;
  posterInitial: string;
  posterColor: string;
  applicants: number;
  postedAgo: string;
  deadline: string;
  icon: React.ElementType;
  iconColor: string;
  iconBg: string;
  saves: number;
  views: string;
  featured?: boolean;
}

const BOUNTIES: Bounty[] = [
  {
    id: 1,
    title: "Build a real-time collaborative code editor",
    desc: "Create a VS Code–like editor with multiplayer cursors, presence indicators, and live code sync using CRDTs or OT algorithms.",
    reward: 2500, currency: "USD",
    status: "open", difficulty: "Expert",
    tags: ["React", "WebSockets", "CRDT"],
    poster: "startupXYZ", posterInitial: "S", posterColor: "bg-blue-500",
    applicants: 12, postedAgo: "2d ago", deadline: "May 30",
    icon: Code2, iconColor: "text-blue-400", iconBg: "bg-blue-500/15",
    saves: 48, views: "1.4k", featured: true,
  },
  {
    id: 2,
    title: "AI-powered resume analyzer and optimizer",
    desc: "Build a tool that analyzes resumes against job descriptions using LLMs, provides ATS optimization scores, and suggests improvements.",
    reward: 1200, currency: "USD",
    status: "open", difficulty: "Intermediate",
    tags: ["Python", "Claude API", "NLP"],
    poster: "recruiter_ai", posterInitial: "R", posterColor: "bg-green-500",
    applicants: 7, postedAgo: "4d ago", deadline: "Jun 5",
    icon: Bot, iconColor: "text-green-400", iconBg: "bg-green-500/15",
    saves: 31, views: "890",
  },
  {
    id: 3,
    title: "Migrate REST API to GraphQL with full test coverage",
    desc: "Convert an existing Node.js REST API to GraphQL using Apollo Server. Requires 90%+ test coverage and backwards compat layer.",
    reward: 800, currency: "USD",
    status: "in_progress", difficulty: "Intermediate",
    tags: ["Node.js", "GraphQL", "TypeScript"],
    poster: "tech_startup", posterInitial: "T", posterColor: "bg-orange-500",
    applicants: 3, postedAgo: "1w ago", deadline: "May 25",
    icon: Globe, iconColor: "text-orange-400", iconBg: "bg-orange-500/15",
    saves: 19, views: "612",
  },
  {
    id: 4,
    title: "Build a crypto portfolio tracker dashboard",
    desc: "Real-time crypto dashboard with price alerts, P&L tracking, DeFi integration, and mobile-responsive design.",
    reward: 1500, currency: "USD",
    status: "open", difficulty: "Intermediate",
    tags: ["React", "WebSocket", "Charts"],
    poster: "defi_labs", posterInitial: "D", posterColor: "bg-yellow-600",
    applicants: 5, postedAgo: "3d ago", deadline: "Jun 10",
    icon: BarChart3, iconColor: "text-yellow-400", iconBg: "bg-yellow-500/15",
    saves: 27, views: "743", featured: true,
  },
  {
    id: 5,
    title: "CLI tool for automated API documentation",
    desc: "Build a CLI that auto-generates OpenAPI/Swagger docs from code comments and type annotations, with a beautiful HTML output.",
    reward: 600, currency: "USD",
    status: "open", difficulty: "Beginner",
    tags: ["Node.js", "CLI", "OpenAPI"],
    poster: "dev_tools_co", posterInitial: "D", posterColor: "bg-purple-500",
    applicants: 9, postedAgo: "5d ago", deadline: "Jun 15",
    icon: Code2, iconColor: "text-purple-400", iconBg: "bg-purple-500/15",
    saves: 14, views: "418",
  },
  {
    id: 6,
    title: "E-commerce recommendation engine",
    desc: "ML-powered product recommendation system with collaborative filtering, A/B testing support, and a Python analytics API.",
    reward: 3000, currency: "USD",
    status: "completed", difficulty: "Expert",
    tags: ["Python", "ML", "FastAPI"],
    poster: "shop_tech", posterInitial: "S", posterColor: "bg-teal-500",
    applicants: 18, postedAgo: "3w ago", deadline: "Completed",
    icon: BarChart3, iconColor: "text-teal-400", iconBg: "bg-teal-500/15",
    saves: 62, views: "2.1k",
  },
];

const STATUS_CONFIG: Record<BountyStatus, { label: string; color: string; bg: string; border: string; dot: string }> = {
  open: { label: "Open", color: "text-green-400", bg: "bg-green-500/12", border: "border-green-400/25", dot: "bg-green-400" },
  in_progress: { label: "In Progress", color: "text-yellow-400", bg: "bg-yellow-500/12", border: "border-yellow-400/25", dot: "bg-yellow-400" },
  completed: { label: "Completed", color: "text-white/40", bg: "bg-white/5", border: "border-white/10", dot: "bg-white/30" },
};

const DIFF_COLOR: Record<Difficulty, string> = {
  Beginner: "text-green-400 bg-green-500/10 border-green-400/20",
  Intermediate: "text-yellow-400 bg-yellow-500/10 border-yellow-400/20",
  Expert: "text-red-400 bg-red-500/10 border-red-400/20",
};

type Filter = "all" | "open" | "in_progress" | "completed";

export default function Bounties() {
  const [, setLocation] = useLocation();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [savedIds, setSavedIds] = useState<Set<number>>(new Set());
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const filtered = BOUNTIES.filter(b => {
    const matchFilter = filter === "all" || b.status === filter;
    const matchSearch = !search
      || b.title.toLowerCase().includes(search.toLowerCase())
      || b.tags.some(t => t.toLowerCase().includes(search.toLowerCase()));
    return matchFilter && matchSearch;
  });

  const totalRewards = BOUNTIES.filter(b => b.status === "open").reduce((s, b) => s + b.reward, 0);
  const selected = BOUNTIES.find(b => b.id === selectedId);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex flex-col min-h-full pb-24 max-w-[480px] mx-auto w-full"
    >
      {/* Header */}
      <div className="px-4 pt-12 pb-4">
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={() => setLocation(-1 as any)}
            className="w-8 h-8 flex items-center justify-center text-white/50 hover:text-white transition-colors rounded-xl hover:bg-white/6"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="flex-1">
            <h1 className="text-[17px] font-bold text-white">Bounties</h1>
            <p className="text-[11px] text-white/35">Earn money building with Replit</p>
          </div>
          <button className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-medium bg-green-500/15 border border-green-400/25 text-green-400 hover:bg-green-500/22 transition-all">
            <DollarSign size={12} /> Post Bounty
          </button>
        </div>

        {/* Stats bar */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          {[
            { label: "Total Rewards", value: `$${(totalRewards / 1000).toFixed(1)}k`, color: "text-green-400" },
            { label: "Open Bounties", value: BOUNTIES.filter(b => b.status === "open").length.toString(), color: "text-blue-400" },
            { label: "Avg Reward", value: "$1.3k", color: "text-purple-400" },
          ].map(stat => (
            <div key={stat.label} className="flex flex-col items-center gap-0.5 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06]">
              <span className={cn("text-[15px] font-bold", stat.color)}>{stat.value}</span>
              <span className="text-[9px] text-white/30 text-center">{stat.label}</span>
            </div>
          ))}
        </div>

        {/* Search */}
        <div className="relative mb-3">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
          <input
            type="text"
            placeholder="Search bounties or tags..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-[#1c1c1c] border border-white/10 rounded-2xl pl-9 pr-9 py-2.5 text-sm text-white placeholder:text-white/30 outline-none focus:border-white/20 transition-colors"
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white">
              <X size={14} />
            </button>
          )}
        </div>

        {/* Filter tabs */}
        <div className="flex gap-1.5">
          {([["all", "All"], ["open", "Open"], ["in_progress", "In Progress"], ["completed", "Done"]] as [Filter, string][]).map(([id, label]) => (
            <button
              key={id}
              onClick={() => setFilter(id)}
              className={cn(
                "flex items-center gap-1 px-3 py-1.5 rounded-full text-[11px] font-semibold transition-all border shrink-0",
                filter === id ? "bg-white text-black border-white" : "bg-white/5 text-white/45 border-white/8 hover:text-white/70"
              )}
            >
              {id !== "all" && (
                <div className={cn("w-1.5 h-1.5 rounded-full", STATUS_CONFIG[id as BountyStatus]?.dot)} />
              )}
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Bounty list */}
      <div className="px-4 space-y-2">
        {filtered.map((bounty, i) => {
          const StatusIcon = bounty.status === "completed" ? CheckCircle : Circle;
          const Icon = bounty.icon;
          const sc = STATUS_CONFIG[bounty.status];

          return (
            <motion.div
              key={bounty.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              onClick={() => setSelectedId(bounty.id)}
              className={cn(
                "p-4 rounded-2xl border cursor-pointer transition-all hover:border-white/15 hover:bg-[#1e1e1e] relative",
                bounty.featured ? "bg-[#1a1512] border-orange-500/20" : "bg-[#1a1a1a] border-white/[0.08]"
              )}
            >
              {bounty.featured && (
                <div className="absolute top-3 right-3">
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-orange-500/20 border border-orange-400/25 text-orange-400">Featured</span>
                </div>
              )}

              <div className="flex items-start gap-3 mb-2.5">
                <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", bounty.iconBg)}>
                  <Icon size={18} className={bounty.iconColor} />
                </div>
                <div className="flex-1 min-w-0 pr-16">
                  <h3 className="text-[13px] font-semibold text-white leading-snug line-clamp-2">{bounty.title}</h3>
                  <div className="flex items-center gap-1.5 mt-1">
                    <div className={cn("w-4 h-4 rounded-full flex items-center justify-center text-[7px] font-bold text-white shrink-0", bounty.posterColor)}>
                      {bounty.posterInitial}
                    </div>
                    <span className="text-[10px] text-white/35">@{bounty.poster}</span>
                    <span className="text-white/15">·</span>
                    <span className="text-[10px] text-white/25">{bounty.postedAgo}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap mb-2.5">
                <div className={cn("flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-semibold", sc.bg, sc.border, sc.color)}>
                  <div className={cn("w-1.5 h-1.5 rounded-full", sc.dot)} />
                  {sc.label}
                </div>
                <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full border", DIFF_COLOR[bounty.difficulty])}>
                  {bounty.difficulty}
                </span>
                {bounty.tags.slice(0, 2).map(tag => (
                  <span key={tag} className="text-[10px] text-white/40 bg-white/5 border border-white/8 px-1.5 py-0.5 rounded-full">
                    {tag}
                  </span>
                ))}
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-[11px] text-white/25 flex items-center gap-1">
                    <Users size={10} /> {bounty.applicants} applicants
                  </span>
                  <span className="text-[11px] text-white/25 flex items-center gap-1">
                    <Eye size={10} /> {bounty.views}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <DollarSign size={13} className="text-green-400" />
                  <span className="text-[15px] font-bold text-green-400">{bounty.reward.toLocaleString()}</span>
                  <span className="text-[10px] text-white/30">{bounty.currency}</span>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Bounty detail sheet */}
      <AnimatePresence>
        {selected && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-40"
              onClick={() => setSelectedId(null)}
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 280 }}
              className="fixed bottom-0 left-0 right-0 z-50 max-w-[480px] mx-auto bg-[#1a1a1a] border-t border-white/10 rounded-t-3xl overflow-hidden"
              style={{ maxHeight: "85vh" }}
            >
              <div className="flex items-center justify-between px-4 py-3.5 border-b border-white/[0.07]">
                <h3 className="text-[14px] font-bold text-white line-clamp-1 pr-4">{selected.title}</h3>
                <button onClick={() => setSelectedId(null)} className="text-white/40 hover:text-white shrink-0">
                  <X size={18} />
                </button>
              </div>
              <div className="overflow-y-auto" style={{ maxHeight: "calc(85vh - 56px)" }}>
                <div className="p-4 space-y-4">
                  {/* Reward + status */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <DollarSign size={18} className="text-green-400" />
                      <span className="text-[22px] font-bold text-green-400">{selected.reward.toLocaleString()}</span>
                      <span className="text-[12px] text-white/40">{selected.currency}</span>
                    </div>
                    <span className={cn(
                      "flex items-center gap-1.5 px-3 py-1 rounded-full border text-[11px] font-semibold",
                      STATUS_CONFIG[selected.status].bg,
                      STATUS_CONFIG[selected.status].border,
                      STATUS_CONFIG[selected.status].color
                    )}>
                      <div className={cn("w-1.5 h-1.5 rounded-full", STATUS_CONFIG[selected.status].dot)} />
                      {STATUS_CONFIG[selected.status].label}
                    </span>
                  </div>

                  {/* Description */}
                  <p className="text-[13px] text-white/55 leading-relaxed">{selected.desc}</p>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-1.5">
                    {selected.tags.map(tag => (
                      <span key={tag} className="text-[11px] text-white/50 bg-white/6 border border-white/10 px-2.5 py-1 rounded-full">
                        {tag}
                      </span>
                    ))}
                  </div>

                  {/* Meta */}
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { label: "Difficulty", value: selected.difficulty },
                      { label: "Deadline", value: selected.deadline },
                      { label: "Applicants", value: `${selected.applicants} people` },
                      { label: "Posted by", value: `@${selected.poster}` },
                    ].map(m => (
                      <div key={m.label} className="px-3 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                        <p className="text-[10px] text-white/30">{m.label}</p>
                        <p className="text-[12px] font-semibold text-white mt-0.5">{m.value}</p>
                      </div>
                    ))}
                  </div>

                  {/* CTA */}
                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={() => setSavedIds(prev => { const n = new Set(prev); n.has(selected.id) ? n.delete(selected.id) : n.add(selected.id); return n; })}
                      className={cn(
                        "w-10 h-10 flex items-center justify-center rounded-xl border transition-all shrink-0",
                        savedIds.has(selected.id) ? "bg-yellow-500/15 border-yellow-400/25 text-yellow-400" : "bg-white/5 border-white/10 text-white/40 hover:text-white"
                      )}
                    >
                      <Bookmark size={16} className={savedIds.has(selected.id) ? "fill-yellow-400" : ""} />
                    </button>
                    <button
                      disabled={selected.status === "completed"}
                      className={cn(
                        "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-[13px] font-bold transition-all",
                        selected.status === "completed"
                          ? "bg-white/5 text-white/25 cursor-default border border-white/8"
                          : "bg-green-600 text-white hover:bg-green-500 active:scale-[0.98]"
                      )}
                    >
                      {selected.status === "completed" ? "Bounty Completed" : <>Apply Now <ArrowUpRight size={14} /></>}
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
