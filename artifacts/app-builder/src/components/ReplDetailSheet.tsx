import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, Heart, Eye, Play, GitBranch, Share2, ExternalLink,
  Star, Code2, Clock, Users, Zap, ArrowUpRight, BookOpen
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Repl {
  id: number;
  name: string;
  desc: string;
  lang: string;
  author: string;
  authorInitial: string;
  authorColor: string;
  likes: number;
  views: string;
  runs: number;
  tag?: string;
  tagColor?: string;
  icon: React.ElementType;
  iconColor: string;
  iconBg: string;
  featured?: boolean;
  category?: string;
}

interface ReplDetailSheetProps {
  repl: Repl | null;
  onClose: () => void;
  onUse?: (repl: Repl) => void;
}

const LANG_SNIPPETS: Record<string, string> = {
  TypeScript: `// TypeScript • React + Vite
import { useState, useEffect } from "react";
import { fetchData } from "./api";

export function App() {
  const [data, setData] = useState(null);
  
  useEffect(() => {
    fetchData().then(setData);
  }, []);
  
  return <div>{JSON.stringify(data)}</div>;
}`,
  Python: `# Python • Flask API
from flask import Flask, jsonify
from models import db, User

app = Flask(__name__)

@app.route("/api/users")
def get_users():
    users = User.query.all()
    return jsonify([u.to_dict() for u in users])`,
  JavaScript: `// JavaScript • Node.js
const express = require("express");
const app = express();

app.get("/api/data", async (req, res) => {
  const data = await fetchFromDB();
  res.json({ success: true, data });
});

app.listen(3000);`,
};

export function ReplDetailSheet({ repl, onClose, onUse }: ReplDetailSheetProps) {
  const [liked, setLiked] = useState(false);
  const [starred, setStarred] = useState(false);
  const [forked, setForked] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "code" | "comments">("overview");

  if (!repl) return null;

  const Icon = repl.icon;
  const snippet = LANG_SNIPPETS[repl.lang] ?? LANG_SNIPPETS.JavaScript;

  const COMMENTS = [
    { user: "dev_ninja", initial: "D", color: "bg-blue-500", text: "This is exactly what I was looking for! The code structure is really clean.", time: "2h ago" },
    { user: "react_lover", initial: "R", color: "bg-green-500", text: "Great project! Would love to see dark mode support added.", time: "5h ago" },
    { user: "pythonista", initial: "P", color: "bg-yellow-600", text: "Forked and already customizing it for my use case. Thanks!", time: "1d ago" },
  ];

  return (
    <AnimatePresence>
      {repl && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-40"
            onClick={onClose}
          />

          {/* Sheet */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-50 max-w-[480px] mx-auto bg-[#1a1a1a] border-t border-white/10 rounded-t-3xl overflow-hidden"
            style={{ maxHeight: "88vh" }}
          >
            {/* Drag handle */}
            <div className="flex justify-center pt-2.5 pb-1">
              <div className="w-10 h-1 rounded-full bg-white/15" />
            </div>

            {/* Header */}
            <div className="flex items-center gap-3 px-4 pb-3 border-b border-white/[0.07]">
              <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", repl.iconBg)}>
                <Icon size={19} className={repl.iconColor} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <h3 className="text-[15px] font-bold text-white truncate">{repl.name}</h3>
                  {repl.tag && (
                    <span className={cn("text-[9px] font-bold px-1.5 py-0.5 rounded-full border shrink-0", repl.tagColor)}>
                      {repl.tag}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <div className={cn("w-3.5 h-3.5 rounded-full flex items-center justify-center text-[7px] font-bold text-white shrink-0", repl.authorColor)}>
                    {repl.authorInitial}
                  </div>
                  <span className="text-[11px] text-white/40">@{repl.author}</span>
                  <span className="text-white/15">·</span>
                  <span className="text-[10px] font-semibold text-white/35 bg-white/6 border border-white/8 px-1.5 py-0.5 rounded">{repl.lang}</span>
                </div>
              </div>
              <button onClick={onClose} className="text-white/40 hover:text-white transition-colors shrink-0">
                <X size={20} />
              </button>
            </div>

            {/* Stats row */}
            <div className="flex items-center gap-4 px-4 py-2.5 border-b border-white/[0.05] bg-white/[0.01]">
              <button
                onClick={() => setLiked(v => !v)}
                className={cn("flex items-center gap-1.5 text-[12px] transition-colors", liked ? "text-red-400" : "text-white/35 hover:text-white/60")}
              >
                <Heart size={13} className={liked ? "fill-red-400" : ""} />
                {liked ? repl.likes + 1 : repl.likes}
              </button>
              <span className="flex items-center gap-1.5 text-[12px] text-white/30">
                <Eye size={13} /> {repl.views}
              </span>
              <span className="flex items-center gap-1.5 text-[12px] text-white/30">
                <Play size={12} /> {repl.runs.toLocaleString()}
              </span>
              <div className="flex-1" />
              <button
                onClick={() => setStarred(v => !v)}
                className={cn("flex items-center gap-1 text-[12px] transition-all px-2 py-1 rounded-lg", starred ? "text-yellow-400 bg-yellow-500/10" : "text-white/30 hover:text-white/60 hover:bg-white/5")}
              >
                <Star size={12} className={starred ? "fill-yellow-400" : ""} />
                <span>{starred ? "Starred" : "Star"}</span>
              </button>
              <button className="text-white/30 hover:text-white transition-colors p-1">
                <Share2 size={14} />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-0 px-3 pt-2 border-b border-white/[0.06]">
              {(["overview", "code", "comments"] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={cn(
                    "flex-1 py-2 text-[12px] font-semibold capitalize transition-all border-b-2",
                    activeTab === tab
                      ? "text-white border-white"
                      : "text-white/35 border-transparent hover:text-white/60"
                  )}
                >
                  {tab}
                  {tab === "comments" && (
                    <span className="ml-1 text-[10px] text-white/25">{COMMENTS.length}</span>
                  )}
                </button>
              ))}
            </div>

            {/* Tab content */}
            <div className="overflow-y-auto" style={{ maxHeight: "calc(88vh - 220px)" }}>
              {activeTab === "overview" && (
                <div className="p-4 space-y-4">
                  <p className="text-[13px] text-white/55 leading-relaxed">{repl.desc}</p>

                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { icon: Clock, label: "Updated", value: "2h ago" },
                      { icon: GitBranch, label: "Forks", value: "128" },
                      { icon: Users, label: "Authors", value: "1" },
                    ].map(stat => {
                      const I = stat.icon;
                      return (
                        <div key={stat.label} className="flex flex-col items-center gap-1 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                          <I size={13} className="text-white/30" />
                          <span className="text-[12px] font-bold text-white">{stat.value}</span>
                          <span className="text-[9px] text-white/25">{stat.label}</span>
                        </div>
                      );
                    })}
                  </div>

                  <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                    <p className="text-[10px] text-white/30 font-semibold uppercase tracking-widest mb-2">Technologies</p>
                    <div className="flex flex-wrap gap-1.5">
                      {[repl.lang, "Vite", "Tailwind", "TypeScript"].map(tech => (
                        <span key={tech} className="text-[11px] text-white/50 bg-white/5 border border-white/8 px-2 py-0.5 rounded-full">
                          {tech}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "code" && (
                <div className="p-4">
                  <div className="rounded-xl overflow-hidden border border-white/[0.08]">
                    <div className="flex items-center justify-between px-3 py-2 bg-[#252525] border-b border-white/[0.06]">
                      <div className="flex items-center gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
                        <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
                        <div className="w-2.5 h-2.5 rounded-full bg-green-500/60" />
                      </div>
                      <span className="text-[10px] text-white/30 font-mono">main.{repl.lang === "Python" ? "py" : "tsx"}</span>
                      <Code2 size={12} className="text-white/25" />
                    </div>
                    <pre className="p-3 text-[10px] font-mono text-white/60 leading-relaxed overflow-x-auto bg-[#0d0d0d]">
                      {snippet}
                    </pre>
                  </div>
                </div>
              )}

              {activeTab === "comments" && (
                <div className="p-4 space-y-3">
                  {COMMENTS.map((comment, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="flex gap-2.5"
                    >
                      <div className={cn("w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0", comment.color)}>
                        {comment.initial}
                      </div>
                      <div className="flex-1 bg-white/[0.03] border border-white/[0.06] rounded-xl p-2.5">
                        <div className="flex items-center gap-1.5 mb-1">
                          <span className="text-[11px] font-semibold text-white">@{comment.user}</span>
                          <span className="text-[10px] text-white/25">{comment.time}</span>
                        </div>
                        <p className="text-[12px] text-white/50 leading-relaxed">{comment.text}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* CTA buttons */}
            <div className="flex gap-2 px-4 py-3 border-t border-white/[0.07] bg-[#1a1a1a]">
              <button
                onClick={() => { setForked(true); }}
                className={cn(
                  "flex items-center justify-center gap-2 flex-1 py-2.5 rounded-xl text-[13px] font-semibold transition-all border",
                  forked ? "bg-green-500/10 border-green-400/25 text-green-400" : "bg-white/5 border-white/10 text-white/60 hover:bg-white/10"
                )}
              >
                <GitBranch size={14} />
                {forked ? "Forked!" : "Fork"}
              </button>
              <button
                onClick={() => onUse?.(repl)}
                className="flex items-center justify-center gap-2 flex-1 py-2.5 rounded-xl text-[13px] font-bold bg-white text-black hover:bg-white/90 active:scale-[0.98] transition-all"
              >
                <Zap size={14} />
                Use in Project
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
