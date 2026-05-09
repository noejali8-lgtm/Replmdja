import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Database, Search, Plus, Trash2, Pin, Brain,
  RefreshCw, Activity, TrendingUp, Clock, Loader2, BookOpen,
  Zap, ChevronRight, Filter, Star
} from "lucide-react";
import { cn } from "@/lib/utils";

const BASE_URL = import.meta.env.BASE_URL?.replace(/\/$/, "") || "";

interface MemoryEntry {
  id: number; key: string; value: string; namespace: string;
  importance: number; accessCount: number; isPinned: boolean;
  createdAt: string; updatedAt: string;
}
interface ReasoningEntry {
  id: number; taskType: string; pattern: string; solution: string;
  confidence: number; usageCount: number; successCount: number; createdAt: string;
}
interface Trajectory {
  id: number; taskDescription: string; outcome: string; reward: number;
  sonaScore: number; steps: Array<{ action: string; result: string; timestamp: string }>; createdAt: string;
}

type Tab = "memory" | "reasoning" | "trajectories" | "recall";

export default function MemoryPage() {
  const [, navigate] = useLocation();
  const [tab, setTab] = useState<Tab>("memory");
  const [entries, setEntries] = useState<MemoryEntry[]>([]);
  const [reasoning, setReasoning] = useState<ReasoningEntry[]>([]);
  const [trajectories, setTrajectories] = useState<Trajectory[]>([]);
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState<(MemoryEntry & { score: number })[]>([]);
  const [loading, setLoading] = useState(false);
  const [recallPrompt, setRecallPrompt] = useState("");
  const [recallAnswer, setRecallAnswer] = useState("");
  const [recalling, setRecalling] = useState(false);
  const [newKey, setNewKey] = useState("");
  const [newValue, setNewValue] = useState("");
  const [newNamespace, setNewNamespace] = useState("global");
  const [saving, setSaving] = useState(false);
  const [showAdd, setShowAdd] = useState(false);

  useEffect(() => { fetchAll(); }, []);

  async function fetchAll() {
    setLoading(true);
    try {
      const [mRes, rRes, tRes] = await Promise.all([
        fetch(`${BASE_URL}/api/memory`),
        fetch(`${BASE_URL}/api/memory/reasoning`),
        fetch(`${BASE_URL}/api/memory/trajectories`),
      ]);
      const [mData, rData, tData] = await Promise.all([mRes.json(), rRes.json(), tRes.json()]) as [{ entries: MemoryEntry[] }, { entries: ReasoningEntry[] }, { trajectories: Trajectory[] }];
      setEntries(mData.entries ?? []);
      setReasoning(rData.entries ?? []);
      setTrajectories(tData.trajectories ?? []);
    } catch { /* ignore */ }
    setLoading(false);
  }

  async function saveMemory() {
    if (!newKey.trim() || !newValue.trim()) return;
    setSaving(true);
    try {
      await fetch(`${BASE_URL}/api/memory`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: newKey, value: newValue, namespace: newNamespace }),
      });
      setNewKey(""); setNewValue(""); setShowAdd(false);
      await fetchAll();
    } catch { /* ignore */ }
    setSaving(false);
  }

  async function deleteEntry(id: number) {
    await fetch(`${BASE_URL}/api/memory/${id}`, { method: "DELETE" });
    setEntries(e => e.filter(m => m.id !== id));
  }

  async function vectorSearch() {
    if (!search.trim()) return;
    try {
      const r = await fetch(`${BASE_URL}/api/memory/search`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: search, limit: 10, threshold: 0.1 }),
      });
      const d = await r.json() as { results: (MemoryEntry & { score: number })[] };
      setSearchResults(d.results ?? []);
    } catch { /* ignore */ }
  }

  async function recall() {
    if (!recallPrompt.trim()) return;
    setRecalling(true);
    setRecallAnswer("");
    try {
      const r = await fetch(`${BASE_URL}/api/memory/recall`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: recallPrompt }),
      });
      const d = await r.json() as { answer: string };
      setRecallAnswer(d.answer ?? "");
    } catch { /* ignore */ }
    setRecalling(false);
  }

  const filteredEntries = entries.filter(e =>
    !search || e.key.toLowerCase().includes(search.toLowerCase()) || e.value.toLowerCase().includes(search.toLowerCase())
  );

  const namespaces = [...new Set(entries.map(e => e.namespace))];

  return (
    <div className="min-h-screen bg-[#0d1117] text-white flex flex-col">
      <div className="sticky top-0 z-20 bg-[#0d1117]/95 backdrop-blur border-b border-white/[0.08] px-4 pt-safe">
        <div className="flex items-center gap-3 py-3">
          <button onClick={() => navigate("/")} className="p-1.5 rounded-lg hover:bg-white/5 text-white/60 hover:text-white transition-colors">
            <ArrowLeft size={20} />
          </button>
          <Database size={18} className="text-violet-400" />
          <span className="font-semibold flex-1">AgentDB Memory</span>
          <span className="text-[10px] font-mono bg-violet-500/20 text-violet-300 border border-violet-400/20 px-2 py-0.5 rounded-full">HNSW</span>
        </div>
        <div className="flex gap-1 pb-3 overflow-x-auto">
          {(["memory", "reasoning", "trajectories", "recall"] as Tab[]).map(t => (
            <button key={t} onClick={() => setTab(t)} className={cn("shrink-0 px-3 py-1.5 rounded-lg text-[11px] font-medium capitalize transition-colors", tab === t ? "bg-white/10 text-white" : "text-white/40 hover:text-white/70")}>
              {t === "memory" ? `Memory (${entries.length})` : t === "reasoning" ? `ReasoningBank (${reasoning.length})` : t === "trajectories" ? `SONA (${trajectories.length})` : "Recall"}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pb-24 px-4">
        {tab === "memory" && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="pt-4 space-y-3">
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-[#161b22] border border-white/[0.06] rounded-xl p-3 text-center">
                <div className="text-xl font-bold text-violet-300">{entries.length}</div>
                <div className="text-[10px] text-white/40">Memories</div>
              </div>
              <div className="bg-[#161b22] border border-white/[0.06] rounded-xl p-3 text-center">
                <div className="text-xl font-bold text-blue-300">{namespaces.length}</div>
                <div className="text-[10px] text-white/40">Namespaces</div>
              </div>
              <div className="bg-[#161b22] border border-white/[0.06] rounded-xl p-3 text-center">
                <div className="text-xl font-bold text-green-300">{entries.filter(e => e.isPinned).length}</div>
                <div className="text-[10px] text-white/40">Pinned</div>
              </div>
            </div>

            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                <input value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === "Enter" && vectorSearch()} placeholder="Vector search memories..." className="w-full bg-[#161b22] border border-white/[0.06] rounded-lg py-2 pl-8 pr-3 text-[12px] placeholder:text-white/30 focus:outline-none focus:border-violet-500/50" />
              </div>
              <button onClick={vectorSearch} className="px-3 py-2 bg-violet-600/20 border border-violet-400/30 rounded-lg text-violet-300 text-[11px]">
                <Zap size={12} />
              </button>
              <button onClick={() => setShowAdd(!showAdd)} className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white/60 text-[11px]">
                <Plus size={12} />
              </button>
              <button onClick={fetchAll} className="p-2 rounded-lg hover:bg-white/5 text-white/40">
                <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
              </button>
            </div>

            {searchResults.length > 0 && (
              <div className="bg-violet-500/10 border border-violet-400/20 rounded-xl p-3">
                <div className="text-[11px] text-violet-300 mb-2 flex items-center gap-1"><Zap size={10} /> Vector Search Results</div>
                <div className="space-y-1.5">
                  {searchResults.map(r => (
                    <div key={r.id} className="flex items-center gap-2 text-[11px]">
                      <span className="text-white/50 font-mono text-[10px] bg-white/5 px-1.5 py-0.5 rounded">{(r.score * 100).toFixed(0)}%</span>
                      <span className="text-violet-300 truncate">{r.key}</span>
                      <span className="text-white/40 truncate">{r.value.slice(0, 40)}...</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <AnimatePresence>
              {showAdd && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="bg-[#161b22] border border-violet-400/20 rounded-xl p-3 space-y-2">
                  <div className="text-[11px] text-violet-300 font-medium">Store Memory</div>
                  <input value={newKey} onChange={e => setNewKey(e.target.value)} placeholder="Key (e.g. user_preference_color)" className="w-full bg-[#0d1117] border border-white/10 rounded-lg px-3 py-2 text-[12px] placeholder:text-white/30 focus:outline-none focus:border-violet-500/50" />
                  <textarea value={newValue} onChange={e => setNewValue(e.target.value)} placeholder="Value to remember..." rows={2} className="w-full bg-[#0d1117] border border-white/10 rounded-lg px-3 py-2 text-[12px] placeholder:text-white/30 focus:outline-none focus:border-violet-500/50 resize-none" />
                  <div className="flex gap-2">
                    <input value={newNamespace} onChange={e => setNewNamespace(e.target.value)} placeholder="Namespace" className="flex-1 bg-[#0d1117] border border-white/10 rounded-lg px-3 py-2 text-[12px] placeholder:text-white/30 focus:outline-none" />
                    <button onClick={saveMemory} disabled={saving} className="px-4 py-2 bg-violet-600/30 border border-violet-400/40 rounded-lg text-violet-300 text-[11px] flex items-center gap-1 disabled:opacity-50">
                      {saving ? <Loader2 size={10} className="animate-spin" /> : <Plus size={10} />} Save
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="space-y-1.5">
              {filteredEntries.map(entry => (
                <div key={entry.id} className="bg-[#161b22] border border-white/[0.06] rounded-xl p-3">
                  <div className="flex items-start gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[12px] font-mono text-violet-300 truncate">{entry.key}</span>
                        {entry.isPinned && <Pin size={10} className="text-yellow-400 shrink-0" />}
                        <span className="text-[9px] bg-white/5 border border-white/10 px-1.5 py-0.5 rounded text-white/40 shrink-0">{entry.namespace}</span>
                        <span className="text-[9px] text-white/30 shrink-0">★ {entry.importance.toFixed(1)}</span>
                      </div>
                      <p className="text-[11px] text-white/60 mt-1 line-clamp-2">{entry.value}</p>
                      <div className="flex gap-3 mt-1">
                        <span className="text-[9px] text-white/30">Accessed {entry.accessCount}×</span>
                        <span className="text-[9px] text-white/30">{new Date(entry.updatedAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <button onClick={() => deleteEntry(entry.id)} className="p-1 rounded-lg hover:bg-red-500/20 text-white/20 hover:text-red-400 transition-colors shrink-0">
                      <Trash2 size={11} />
                    </button>
                  </div>
                </div>
              ))}
              {filteredEntries.length === 0 && (
                <div className="text-center py-12">
                  <Database size={36} className="mx-auto text-white/10 mb-3" />
                  <p className="text-white/30 text-[12px]">No memories stored yet</p>
                  <p className="text-white/20 text-[11px] mt-1">Click + to add your first memory</p>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {tab === "reasoning" && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="pt-4 space-y-3">
            <div className="bg-[#161b22] border border-white/[0.06] rounded-xl p-4">
              <div className="flex items-center gap-2 mb-1">
                <Brain size={14} className="text-emerald-400" />
                <span className="text-[13px] font-medium">ReasoningBank</span>
              </div>
              <p className="text-[11px] text-white/40">Stores successful reasoning patterns for SONA self-improvement. Agents learn from high-confidence patterns.</p>
            </div>
            <div className="space-y-2">
              {reasoning.map(r => (
                <div key={r.id} className="bg-[#161b22] border border-white/[0.06] rounded-xl p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[11px] font-mono bg-emerald-500/10 text-emerald-300 px-2 py-0.5 rounded border border-emerald-400/20">{r.taskType}</span>
                    <span className="text-[10px] text-white/40 ml-auto">Confidence: {(r.confidence * 100).toFixed(0)}%</span>
                  </div>
                  <p className="text-[11px] text-white/70 mt-1">{r.pattern}</p>
                  <p className="text-[11px] text-white/40 mt-1 line-clamp-2">{r.solution}</p>
                  <div className="flex gap-3 mt-1.5">
                    <span className="text-[9px] text-white/30">Used {r.usageCount}×</span>
                    <span className="text-[9px] text-white/30">Success: {r.successCount}×</span>
                  </div>
                </div>
              ))}
              {reasoning.length === 0 && (
                <div className="text-center py-12">
                  <Brain size={36} className="mx-auto text-white/10 mb-3" />
                  <p className="text-white/30 text-[12px]">No reasoning patterns yet</p>
                  <p className="text-white/20 text-[11px] mt-1">Patterns are learned from agent trajectories</p>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {tab === "trajectories" && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="pt-4 space-y-3">
            <div className="bg-[#161b22] border border-white/[0.06] rounded-xl p-4">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp size={14} className="text-blue-400" />
                <span className="text-[13px] font-medium">SONA Trajectories</span>
              </div>
              <p className="text-[11px] text-white/40">Self-Organizing Neural Architecture — learns from agent task execution paths to improve future performance.</p>
            </div>
            <div className="space-y-2">
              {trajectories.map(t => (
                <div key={t.id} className="bg-[#161b22] border border-white/[0.06] rounded-xl p-3">
                  <p className="text-[12px] text-white/80 line-clamp-2">{t.taskDescription}</p>
                  <div className="flex gap-3 mt-2">
                    <span className={cn("text-[10px] px-1.5 py-0.5 rounded", t.outcome === "success" ? "bg-green-500/15 text-green-300" : "bg-red-500/15 text-red-300")}>{t.outcome}</span>
                    <span className="text-[10px] text-white/40">Reward: {t.reward.toFixed(2)}</span>
                    <span className="text-[10px] text-white/40">SONA: {t.sonaScore.toFixed(3)}</span>
                    <span className="text-[10px] text-white/30">{t.steps.length} steps</span>
                  </div>
                </div>
              ))}
              {trajectories.length === 0 && (
                <div className="text-center py-12">
                  <TrendingUp size={36} className="mx-auto text-white/10 mb-3" />
                  <p className="text-white/30 text-[12px]">No trajectories recorded</p>
                  <p className="text-white/20 text-[11px] mt-1">Run agents to generate learning trajectories</p>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {tab === "recall" && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="pt-4 space-y-3">
            <div className="bg-[#161b22] border border-white/[0.06] rounded-xl p-4">
              <div className="flex items-center gap-2 mb-1">
                <BookOpen size={14} className="text-orange-400" />
                <span className="text-[13px] font-medium">AI Memory Recall</span>
              </div>
              <p className="text-[11px] text-white/40">Ask questions using natural language. The AI searches your memory store and answers based on what it remembers.</p>
            </div>
            <div className="space-y-2">
              <textarea value={recallPrompt} onChange={e => setRecallPrompt(e.target.value)} placeholder='e.g. "What did I say about my favorite color?" or "What coding standards should I follow?"' rows={3} className="w-full bg-[#161b22] border border-white/[0.06] rounded-xl px-4 py-3 text-[13px] placeholder:text-white/30 focus:outline-none focus:border-orange-500/50 resize-none" />
              <button onClick={recall} disabled={recalling || !recallPrompt.trim()}
                className="w-full py-3 bg-orange-600/20 border border-orange-400/30 rounded-xl text-orange-300 text-[13px] font-medium flex items-center justify-center gap-2 hover:bg-orange-600/30 transition-colors disabled:opacity-50">
                {recalling ? <Loader2 size={14} className="animate-spin" /> : <Brain size={14} />}
                Recall from Memory
              </button>
              {recallAnswer && (
                <div className="bg-[#161b22] border border-orange-400/20 rounded-xl p-4">
                  <div className="text-[11px] text-orange-300 mb-2">Memory Recall Result</div>
                  <p className="text-[13px] text-white/80 leading-relaxed">{recallAnswer}</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
