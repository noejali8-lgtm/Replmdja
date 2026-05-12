import { useState } from "react";
import { useLocation, useParams } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Globe, GitBranch, Heart, Eye, Star, Users, UserPlus,
  UserCheck, Share2, Code2, Trophy, Zap, Calendar, Link as LinkIcon,
  Twitter, Github, MapPin, ChevronRight, Play, Lock
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";

interface ProfileRepl {
  id: number;
  name: string;
  desc: string;
  lang: string;
  langColor: string;
  langBg: string;
  likes: number;
  views: string;
  runs: string;
  isPublic: boolean;
  starred: boolean;
  updatedAgo: string;
}

const PROFILE_REPLS: ProfileRepl[] = [
  {
    id: 1, name: "AI Portfolio Generator", desc: "Generate stunning portfolios with AI — 12 templates, PDF export, custom domains.",
    lang: "TypeScript", langColor: "text-blue-400", langBg: "bg-blue-500/15",
    likes: 4821, views: "128k", runs: "22k", isPublic: true, starred: true, updatedAgo: "2h ago",
  },
  {
    id: 2, name: "Real-time Chat App", desc: "Full-stack chat with WebSockets, rooms, media sharing, and end-to-end encryption.",
    lang: "JavaScript", langColor: "text-yellow-400", langBg: "bg-yellow-500/15",
    likes: 2340, views: "74k", runs: "18k", isPublic: true, starred: false, updatedAgo: "1d ago",
  },
  {
    id: 3, name: "Data Visualization Dashboard", desc: "Real-time analytics with 8 chart types, CSV import, and shareable reports.",
    lang: "Python", langColor: "text-green-400", langBg: "bg-green-500/15",
    likes: 1870, views: "61k", runs: "9k", isPublic: true, starred: true, updatedAgo: "3d ago",
  },
  {
    id: 4, name: "Private API Server", desc: "Internal microservices architecture — authenticated REST + gRPC gateway.",
    lang: "TypeScript", langColor: "text-blue-400", langBg: "bg-blue-500/15",
    likes: 0, views: "0", runs: "0", isPublic: false, starred: false, updatedAgo: "5d ago",
  },
  {
    id: 5, name: "Snake Game (Retro)", desc: "Classic snake with power-ups, multiplayer mode, and global leaderboard.",
    lang: "JavaScript", langColor: "text-yellow-400", langBg: "bg-yellow-500/15",
    likes: 3102, views: "95k", runs: "41k", isPublic: true, starred: false, updatedAgo: "1w ago",
  },
  {
    id: 6, name: "Machine Learning Pipeline", desc: "End-to-end ML pipeline with data preprocessing, training, evaluation, and deployment.",
    lang: "Python", langColor: "text-green-400", langBg: "bg-green-500/15",
    likes: 987, views: "32k", runs: "4.2k", isPublic: true, starred: false, updatedAgo: "2w ago",
  },
];

const ACHIEVEMENTS = [
  { id: 1, icon: "🏆", label: "Top Creator", desc: "500+ likes received", color: "text-yellow-400", bg: "bg-yellow-500/10", border: "border-yellow-400/20" },
  { id: 2, icon: "🔥", label: "Hot Streak", desc: "30-day active streak", color: "text-orange-400", bg: "bg-orange-500/10", border: "border-orange-400/20" },
  { id: 3, icon: "🌐", label: "Deployed", desc: "5+ live deployments", color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-400/20" },
  { id: 4, icon: "🤝", label: "Collaborator", desc: "10+ forked repls", color: "text-green-400", bg: "bg-green-500/10", border: "border-green-400/20" },
  { id: 5, icon: "🧠", label: "AI Pioneer", desc: "Used 5 AI models", color: "text-purple-400", bg: "bg-purple-500/10", border: "border-purple-400/20" },
  { id: 6, icon: "⭐", label: "Rising Star", desc: "Trending this week", color: "text-cyan-400", bg: "bg-cyan-500/10", border: "border-cyan-400/20" },
];

type Tab = "repls" | "stars" | "activity";

export default function Profile() {
  const [, setLocation] = useLocation();
  const params = useParams<{ username?: string }>();
  const { user } = useAuth();
  const [following, setFollowing] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("repls");
  const [likedIds, setLikedIds] = useState<Set<number>>(new Set());

  const isOwn = !params.username || params.username === user?.username;
  const username = params.username || user?.username || "developer";
  const displayName = isOwn ? (user?.displayName || user?.username || "Developer") : username;

  const publicRepls = PROFILE_REPLS.filter(r => r.isPublic);
  const starredRepls = PROFILE_REPLS.filter(r => r.starred);

  const toggleLike = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setLikedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const tabContent = activeTab === "repls" ? PROFILE_REPLS : activeTab === "stars" ? starredRepls : [];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex flex-col min-h-full pb-24 max-w-[480px] mx-auto w-full"
    >
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-12 pb-3">
        <button
          onClick={() => setLocation(-1 as any)}
          className="w-8 h-8 flex items-center justify-center text-white/50 hover:text-white transition-colors rounded-xl hover:bg-white/6"
        >
          <ArrowLeft size={20} />
        </button>
        <span className="text-[15px] font-semibold text-white/80 flex-1 truncate">@{username}</span>
        <button className="w-8 h-8 flex items-center justify-center text-white/40 hover:text-white transition-colors rounded-xl hover:bg-white/6">
          <Share2 size={17} />
        </button>
      </div>

      {/* Cover + Avatar */}
      <div className="relative px-4 mb-4">
        <div className="h-24 rounded-2xl bg-gradient-to-br from-purple-600/30 via-blue-600/20 to-cyan-600/20 border border-white/[0.06] overflow-hidden">
          <div className="absolute inset-0" style={{ backgroundImage: "radial-gradient(circle at 30% 40%, rgba(139,92,246,0.3) 0%, transparent 60%), radial-gradient(circle at 70% 60%, rgba(59,130,246,0.2) 0%, transparent 60%)" }} />
        </div>
        <div className="absolute bottom-0 left-7 translate-y-1/2 flex items-end gap-3">
          <div className="w-16 h-16 rounded-2xl border-2 border-[#141414] bg-purple-600 flex items-center justify-center text-xl font-bold text-white shadow-xl">
            {displayName.slice(0, 2).toUpperCase()}
          </div>
        </div>
      </div>

      {/* Bio section */}
      <div className="px-4 pt-10 pb-4 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-[17px] font-bold text-white truncate">{displayName}</h2>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-orange-500/15 border border-orange-400/25 text-orange-400 shrink-0">
                Core
              </span>
            </div>
            <p className="text-[12px] text-white/45 mt-0.5">@{username}</p>
          </div>
          {!isOwn ? (
            <button
              onClick={() => setFollowing(v => !v)}
              className={cn(
                "flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[12px] font-semibold transition-all border",
                following
                  ? "bg-white/6 border-white/12 text-white/60 hover:bg-red-500/10 hover:border-red-400/20 hover:text-red-400"
                  : "bg-white text-black border-white hover:bg-white/90"
              )}
            >
              {following
                ? <><UserCheck size={13} /> Following</>
                : <><UserPlus size={13} /> Follow</>
              }
            </button>
          ) : (
            <button
              onClick={() => setLocation("/settings")}
              className="px-3.5 py-2 rounded-xl text-[12px] font-semibold bg-white/6 border border-white/12 text-white/70 hover:bg-white/10 transition-all"
            >
              Edit profile
            </button>
          )}
        </div>

        <p className="text-[13px] text-white/60 leading-relaxed">
          Full-stack developer & open-source enthusiast. Building the future one repl at a time. ⚡ TypeScript · Python · AI
        </p>

        <div className="flex items-center gap-3 flex-wrap">
          <span className="flex items-center gap-1 text-[11px] text-white/35">
            <MapPin size={11} /> San Francisco, CA
          </span>
          <span className="flex items-center gap-1 text-[11px] text-white/35">
            <LinkIcon size={11} />
            <a href="#" className="text-blue-400/70 hover:text-blue-400 transition-colors">replit.com/@{username}</a>
          </span>
          <span className="flex items-center gap-1 text-[11px] text-white/35">
            <Calendar size={11} /> Joined Mar 2023
          </span>
        </div>

        <div className="flex items-center gap-1">
          <a href="#" className="w-7 h-7 flex items-center justify-center rounded-lg bg-white/5 border border-white/8 text-white/40 hover:text-white hover:bg-white/10 transition-all">
            <Twitter size={13} />
          </a>
          <a href="#" className="w-7 h-7 flex items-center justify-center rounded-lg bg-white/5 border border-white/8 text-white/40 hover:text-white hover:bg-white/10 transition-all">
            <Github size={13} />
          </a>
          <a href="#" className="w-7 h-7 flex items-center justify-center rounded-lg bg-white/5 border border-white/8 text-white/40 hover:text-white hover:bg-white/10 transition-all">
            <Globe size={13} />
          </a>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-4 gap-2 pt-1">
          {[
            { label: "Repls", value: "24", icon: Code2, color: "text-blue-400" },
            { label: "Followers", value: "1.2k", icon: Users, color: "text-purple-400" },
            { label: "Following", value: "318", icon: UserPlus, color: "text-green-400" },
            { label: "Total Likes", value: "14k", icon: Heart, color: "text-red-400" },
          ].map(stat => {
            const Icon = stat.icon;
            return (
              <div key={stat.label} className="flex flex-col items-center gap-1 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                <Icon size={13} className={stat.color} />
                <span className="text-[13px] font-bold text-white">{stat.value}</span>
                <span className="text-[9px] text-white/30 uppercase tracking-wide">{stat.label}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Achievements */}
      <div className="px-4 mb-4">
        <div className="flex items-center gap-2 mb-2.5">
          <Trophy size={12} className="text-yellow-400" />
          <span className="text-[11px] font-semibold uppercase tracking-widest text-white/35">Achievements</span>
        </div>
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1 -mx-4 px-4">
          {ACHIEVEMENTS.map((ach, i) => (
            <motion.div
              key={ach.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.04 }}
              className={cn("shrink-0 flex flex-col items-center gap-1 px-3 py-2.5 rounded-2xl border", ach.bg, ach.border)}
            >
              <span className="text-xl">{ach.icon}</span>
              <p className={cn("text-[10px] font-bold", ach.color)}>{ach.label}</p>
              <p className="text-[9px] text-white/30 whitespace-nowrap">{ach.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="px-4 flex gap-1 mb-3 bg-white/[0.02] border-y border-white/[0.05] py-2">
        {(["repls", "stars", "activity"] as Tab[]).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "flex-1 py-1.5 rounded-lg text-[12px] font-semibold capitalize transition-all",
              activeTab === tab ? "bg-white/10 text-white" : "text-white/35 hover:text-white/60"
            )}
          >
            {tab}
            {tab === "repls" && (
              <span className="ml-1 text-[10px] text-white/25">{PROFILE_REPLS.length}</span>
            )}
          </button>
        ))}
      </div>

      {/* Repl cards */}
      <div className="px-4 space-y-2">
        <AnimatePresence mode="popLayout">
          {activeTab === "activity" ? (
            <motion.div
              key="activity"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-2"
            >
              {["Created AI Portfolio Generator", "Forked Real-time Chat App", "Liked Data Dashboard", "Starred Snake Game", "Followed @mike_ui", "Deployed portfolio-gen.replit.app"].map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="flex items-center gap-3 px-3.5 py-3 rounded-xl bg-white/[0.03] border border-white/[0.06]"
                >
                  <div className="w-2 h-2 rounded-full bg-purple-400/60 shrink-0" />
                  <span className="text-[12px] text-white/55">{item}</span>
                  <span className="text-[10px] text-white/20 ml-auto">{i + 1}d ago</span>
                </motion.div>
              ))}
            </motion.div>
          ) : (
            tabContent.map((repl, i) => (
              <motion.div
                key={repl.id}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="p-3.5 rounded-2xl bg-[#1a1a1a] border border-white/[0.08] hover:border-white/15 hover:bg-[#1e1e1e] transition-all cursor-pointer group"
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      {!repl.isPublic && (
                        <Lock size={11} className="text-white/30 shrink-0" />
                      )}
                      <h3 className="text-[13px] font-semibold text-white leading-tight group-hover:text-blue-400 transition-colors truncate">
                        {repl.name}
                      </h3>
                    </div>
                    <p className="text-[11px] text-white/40 mt-0.5 line-clamp-2 leading-relaxed">{repl.desc}</p>
                  </div>
                  <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full border shrink-0", repl.langBg, repl.langColor, "border-current/20")}>
                    {repl.lang}
                  </span>
                </div>
                {repl.isPublic && (
                  <div className="flex items-center gap-3.5">
                    <button
                      onClick={e => toggleLike(repl.id, e)}
                      className={cn("flex items-center gap-1 text-[11px] transition-colors",
                        likedIds.has(repl.id) ? "text-red-400" : "text-white/25 hover:text-white/50"
                      )}
                    >
                      <Heart size={11} className={likedIds.has(repl.id) ? "fill-red-400" : ""} />
                      <span>{likedIds.has(repl.id) ? repl.likes + 1 : repl.likes}</span>
                    </button>
                    <span className="flex items-center gap-1 text-[11px] text-white/20">
                      <Eye size={11} /> {repl.views}
                    </span>
                    <span className="flex items-center gap-1 text-[11px] text-white/20">
                      <Play size={10} /> {repl.runs}
                    </span>
                    <span className="text-[10px] text-white/20 ml-auto">{repl.updatedAgo}</span>
                  </div>
                )}
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
