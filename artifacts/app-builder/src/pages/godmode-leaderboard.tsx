import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "wouter";
import {
  ArrowLeft, Trophy, Zap, Clock, Target, BarChart3,
  Flame, ChevronRight, RefreshCw, Trash2, AlertTriangle,
  Crown, Medal
} from "lucide-react";
import { cn } from "@/lib/utils";

const BASE_URL = import.meta.env.BASE_URL?.replace(/\/$/, "") || "";

const COMBO_META: Record<string, { emoji: string; name: string; label: string; color: string; bg: string; border: string }> = {
  logic:       { emoji: "💛", name: "GPT-4o",          label: "Logic Breaker",      color: "text-yellow-400", bg: "bg-yellow-500/10", border: "border-yellow-400/25" },
  philosopher: { emoji: "🩷", name: "Claude Opus",      label: "Philosopher's Key",  color: "text-pink-400",   bg: "bg-pink-500/10",   border: "border-pink-400/25"   },
  cosmic:      { emoji: "💙", name: "Gemini 2.0 Flash", label: "Cosmic Lens",        color: "text-blue-400",   bg: "bg-blue-500/10",   border: "border-blue-400/25"   },
  reality:     { emoji: "💚", name: "LLaMA 3.3 70B",    label: "Reality Anchor",     color: "text-green-400",  bg: "bg-green-500/10",  border: "border-green-400/25"  },
  chain:       { emoji: "💜", name: "DeepSeek R1",       label: "Chain Breaker",      color: "text-purple-400", bg: "bg-purple-500/10", border: "border-purple-400/25" },
};

const COMBO_IDS = ["logic", "philosopher", "cosmic", "reality", "chain"];

interface Race {
  id: number;
  prompt: string;
  winnerId: string;
  winnerName: string;
  winnerScore: number;
  scores: Record<string, number>;
  elapsed: Record<string, number>;
  previews: Record<string, string>;
  createdAt: string;
}

function formatTime(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const diff = (now.getTime() - d.getTime()) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return d.toLocaleDateString();
}

function ScoreBar({ comboId, score, isWinner }: { comboId: string; score: number; isWinner: boolean }) {
  const meta = COMBO_META[comboId];
  if (!meta) return null;
  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] w-4 text-center">{meta.emoji}</span>
      <div className="flex-1 h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
        <motion.div
          className={cn("h-full rounded-full", meta.color.replace("text-", "bg-"))}
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ duration: 0.7, ease: "easeOut" }}
        />
      </div>
      <span className={cn("text-[10px] font-mono w-6 text-right font-bold", isWinner ? meta.color : "text-white/35")}>
        {score}
      </span>
      {isWinner && <Trophy size={9} className="text-yellow-400 shrink-0" />}
    </div>
  );
}

function RaceCard({ race, index, onDelete }: { race: Race; index: number; onDelete: (id: number) => void }) {
  const [expanded, setExpanded] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const winner = COMBO_META[race.winnerId];
  const elapsed = race.elapsed[race.winnerId];

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Delete this race from history?")) return;
    setDeleting(true);
    try {
      await fetch(`${BASE_URL}/api/godmode/races/${race.id}`, { method: "DELETE" });
      onDelete(race.id);
    } catch {
      setDeleting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      className={cn(
        "bg-[#0d1117] border rounded-2xl overflow-hidden",
        winner ? winner.border : "border-white/[0.08]"
      )}
    >
      {/* Card header — always visible */}
      <div
        className="flex items-start gap-3 px-4 py-3 cursor-pointer select-none hover:bg-white/[0.02] transition-colors"
        onClick={() => setExpanded(v => !v)}
      >
        {/* Winner badge */}
        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border text-xl", winner?.bg ?? "bg-white/5", winner?.border ?? "border-white/10")}>
          {winner?.emoji ?? "?"}
        </div>

        <div className="flex-1 min-w-0">
          {/* Prompt */}
          <p className="text-[11px] text-white/70 font-medium leading-snug line-clamp-2 pr-2">{race.prompt}</p>
          {/* Winner line */}
          <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
            <span className={cn("text-[10px] font-bold", winner?.color ?? "text-white/40")}>
              {winner?.emoji} {winner?.name ?? race.winnerName}
            </span>
            <span className="text-[9px] text-white/25">wins</span>
            <span className={cn("text-[10px] font-mono font-bold", winner?.color ?? "text-white/40")}>{race.winnerScore}/100</span>
            {elapsed && (
              <span className="text-[9px] text-white/25 font-mono">{(elapsed / 1000).toFixed(1)}s</span>
            )}
            <span className="text-[9px] text-white/25 ml-auto">{formatTime(race.createdAt)}</span>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button onClick={handleDelete} disabled={deleting}
            className="w-6 h-6 flex items-center justify-center text-white/20 hover:text-red-400 transition-colors rounded-lg hover:bg-red-500/10">
            <Trash2 size={11} />
          </button>
          <motion.div animate={{ rotate: expanded ? 90 : 0 }} transition={{ duration: 0.2 }}>
            <ChevronRight size={14} className="text-white/20" />
          </motion.div>
        </div>
      </div>

      {/* Expanded: score bars + previews */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t border-white/[0.06]"
          >
            <div className="px-4 py-3 space-y-4">
              {/* All 5 score bars */}
              <div>
                <p className="text-[9px] font-mono uppercase tracking-widest text-white/25 mb-2">Scores</p>
                <div className="space-y-1.5">
                  {COMBO_IDS.map(id => {
                    const score = race.scores[id] ?? 0;
                    return (
                      <ScoreBar key={id} comboId={id} score={score} isWinner={race.winnerId === id} />
                    );
                  })}
                </div>
              </div>

              {/* Response previews */}
              {Object.keys(race.previews ?? {}).length > 0 && (
                <div>
                  <p className="text-[9px] font-mono uppercase tracking-widest text-white/25 mb-2">Response Previews</p>
                  <div className="space-y-2">
                    {COMBO_IDS.filter(id => race.previews?.[id]).map(id => {
                      const meta = COMBO_META[id];
                      return (
                        <div key={id} className={cn("px-3 py-2 rounded-xl border", meta.bg, meta.border)}>
                          <p className={cn("text-[10px] font-semibold mb-1", meta.color)}>{meta.emoji} {meta.name}</p>
                          <p className="text-[10px] text-white/45 leading-relaxed">{race.previews[id]}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Elapsed times */}
              {Object.keys(race.elapsed ?? {}).length > 0 && (
                <div className="flex gap-2 flex-wrap">
                  {COMBO_IDS.filter(id => race.elapsed?.[id]).map(id => {
                    const meta = COMBO_META[id];
                    return (
                      <span key={id} className={cn("text-[9px] font-mono px-2 py-0.5 rounded-full border", meta.bg, meta.border, meta.color)}>
                        {meta.emoji} {(race.elapsed[id] / 1000).toFixed(1)}s
                      </span>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function GodmodeLeaderboardPage() {
  const [, navigate] = useLocation();
  const [races, setRaces] = useState<Race[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const fetchRaces = async (showSpinner = false) => {
    if (showSpinner) setRefreshing(true);
    try {
      const res = await fetch(`${BASE_URL}/api/godmode/races`);
      if (!res.ok) throw new Error(`${res.status}`);
      const data = await res.json();
      setRaces(data.races ?? []);
      setError("");
    } catch (err) {
      setError(`Failed to load races: ${err}`);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchRaces(); }, []);

  const handleDelete = (id: number) => setRaces(prev => prev.filter(r => r.id !== id));

  /* ── Leaderboard stats ── */
  const totalRaces = races.length;
  const winCounts: Record<string, number> = {};
  let totalScore = 0;
  let totalElapsed = 0;
  let elapsedCount = 0;
  races.forEach(r => {
    winCounts[r.winnerId] = (winCounts[r.winnerId] ?? 0) + 1;
    totalScore += r.winnerScore;
    const e = r.elapsed[r.winnerId];
    if (e) { totalElapsed += e; elapsedCount++; }
  });
  const topWinnerId = Object.entries(winCounts).sort((a, b) => b[1] - a[1])[0]?.[0];
  const topWinner = topWinnerId ? COMBO_META[topWinnerId] : null;
  const avgScore = totalRaces > 0 ? Math.round(totalScore / totalRaces) : 0;
  const avgElapsed = elapsedCount > 0 ? (totalElapsed / elapsedCount / 1000).toFixed(1) : "—";

  /* ── Per-model win rate for podium ── */
  const podium = Object.entries(winCounts)
    .map(([id, wins]) => ({ id, wins, meta: COMBO_META[id] }))
    .filter(x => x.meta)
    .sort((a, b) => b.wins - a.wins)
    .slice(0, 3);

  return (
    <div className="min-h-screen bg-[#0d1117] text-white flex flex-col">

      {/* ── Header ── */}
      <div className="sticky top-0 z-20 bg-[#0d1117]/95 backdrop-blur border-b border-white/[0.08] px-4 pt-safe">
        <div className="flex items-center gap-3 py-3">
          <button
            onClick={() => navigate(-1 as unknown as string)}
            className="p-1.5 rounded-lg hover:bg-white/5 text-white/60 hover:text-white transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="flex-1">
            <p className="text-[10px] font-mono uppercase tracking-widest text-red-400/70">G0DM0D3.AI</p>
            <p className="text-[15px] font-bold leading-tight">Race Leaderboard</p>
          </div>
          <button
            onClick={() => fetchRaces(true)}
            disabled={refreshing}
            className="p-2 rounded-lg hover:bg-white/5 text-white/40 hover:text-white transition-colors"
          >
            <motion.div animate={refreshing ? { rotate: 360 } : {}} transition={{ duration: 0.8, repeat: refreshing ? Infinity : 0, ease: "linear" }}>
              <RefreshCw size={16} />
            </motion.div>
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pb-8">

        {/* ── Stats bar ── */}
        <div className="grid grid-cols-4 gap-0 border-b border-white/[0.08]">
          {[
            { icon: <Flame size={14} className="text-red-400" />, label: "Races", value: String(totalRaces) },
            { icon: <Trophy size={14} className="text-yellow-400" />, label: "Top Model", value: topWinner ? topWinner.emoji : "—" },
            { icon: <Target size={14} className="text-sky-400" />, label: "Avg Score", value: totalRaces > 0 ? String(avgScore) : "—" },
            { icon: <Clock size={14} className="text-emerald-400" />, label: "Avg Speed", value: avgElapsed === "—" ? "—" : `${avgElapsed}s` },
          ].map((s, i) => (
            <div key={i} className="flex flex-col items-center gap-1 py-4 border-r border-white/[0.06] last:border-r-0">
              {s.icon}
              <span className="text-[15px] font-bold">{s.value}</span>
              <span className="text-[9px] text-white/30 font-mono uppercase">{s.label}</span>
            </div>
          ))}
        </div>

        {/* ── Podium (top 3 models by wins) ── */}
        {podium.length > 0 && (
          <div className="px-4 py-4 border-b border-white/[0.06]">
            <p className="text-[9px] font-mono uppercase tracking-widest text-white/25 mb-3">Model Win Standings</p>
            <div className="flex gap-2">
              {podium.map((p, i) => (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }}
                  className={cn(
                    "flex-1 flex flex-col items-center gap-1.5 py-3 px-2 rounded-2xl border",
                    p.meta.bg, p.meta.border
                  )}
                >
                  {i === 0 ? <Crown size={14} className="text-yellow-400" /> : <Medal size={14} className={i === 1 ? "text-slate-300" : "text-amber-700"} />}
                  <span className="text-2xl">{p.meta.emoji}</span>
                  <p className={cn("text-[10px] font-bold text-center leading-tight", p.meta.color)}>{p.meta.name}</p>
                  <span className={cn("text-[11px] font-mono font-bold", p.meta.color)}>{p.wins}W</span>
                  <span className="text-[9px] text-white/30">
                    {totalRaces > 0 ? `${Math.round((p.wins / totalRaces) * 100)}%` : ""}
                  </span>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* ── Win rate bar chart ── */}
        {totalRaces > 0 && (
          <div className="px-4 py-4 border-b border-white/[0.06]">
            <p className="text-[9px] font-mono uppercase tracking-widest text-white/25 mb-3">Win Rate by Model</p>
            <div className="space-y-2">
              {COMBO_IDS.map(id => {
                const meta = COMBO_META[id];
                const wins = winCounts[id] ?? 0;
                const pct = totalRaces > 0 ? Math.round((wins / totalRaces) * 100) : 0;
                return (
                  <div key={id} className="flex items-center gap-2">
                    <span className="text-[11px] w-5 text-center">{meta.emoji}</span>
                    <span className={cn("text-[10px] font-semibold w-24 shrink-0", meta.color)}>{meta.name}</span>
                    <div className="flex-1 h-2 bg-white/[0.05] rounded-full overflow-hidden">
                      <motion.div
                        className={cn("h-full rounded-full", meta.color.replace("text-", "bg-"))}
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                      />
                    </div>
                    <span className="text-[10px] font-mono text-white/40 w-10 text-right">{wins}W·{pct}%</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Race history ── */}
        <div className="px-4 py-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[9px] font-mono uppercase tracking-widest text-white/25">Race History</p>
            {races.length > 0 && (
              <span className="text-[10px] text-white/30">{races.length} race{races.length !== 1 ? "s" : ""}</span>
            )}
          </div>

          {loading && (
            <div className="flex items-center justify-center py-16">
              <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>
                <Zap size={20} className="text-red-400" />
              </motion.div>
            </div>
          )}

          {error && !loading && (
            <div className="flex items-center gap-2 px-4 py-3 bg-red-500/10 border border-red-400/20 rounded-2xl text-red-300 text-[11px]">
              <AlertTriangle size={14} className="shrink-0" />
              {error}
            </div>
          )}

          {!loading && !error && races.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-400/20 flex items-center justify-center">
                <BarChart3 size={28} className="text-red-400/50" />
              </div>
              <p className="text-[13px] font-semibold text-white/40">No races yet</p>
              <p className="text-[11px] text-white/25 text-center px-8">
                Open the G0DM0D3 page, expand "⚡ LIVE RACE", and launch your first race.
              </p>
              <button
                onClick={() => navigate("/g0dm0d3")}
                className="mt-2 px-4 py-2 bg-red-500/15 border border-red-400/30 text-red-300 text-[12px] font-semibold rounded-xl hover:bg-red-500/25 transition-colors"
              >
                Go to G0DM0D3
              </button>
            </div>
          )}

          <div className="space-y-3">
            {races.map((race, i) => (
              <RaceCard key={race.id} race={race} index={i} onDelete={handleDelete} />
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
