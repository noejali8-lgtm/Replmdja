import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Target, Play, Loader2, ChevronRight,
  CheckCircle2, Zap, Brain, BarChart3, List, Layers,
  Sparkles, Clock, Users
} from "lucide-react";
import { cn } from "@/lib/utils";

const BASE_URL = import.meta.env.BASE_URL?.replace(/\/$/, "") || "";

interface GoalTemplate {
  id: string; name: string; description: string; complexity: string; estimatedAgents: number;
}

const COMPLEXITY_COLOR: Record<string, string> = {
  simple: "text-green-400 bg-green-500/10 border-green-400/20",
  medium: "text-yellow-400 bg-yellow-500/10 border-yellow-400/20",
  complex: "text-red-400 bg-red-500/10 border-red-400/20",
};

export default function GoalPlannerPage() {
  const [, navigate] = useLocation();
  const [goal, setGoal] = useState("");
  const [context, setContext] = useState("");
  const [complexity, setComplexity] = useState<"simple" | "medium" | "complex">("medium");
  const [planning, setPlanning] = useState(false);
  const [planOutput, setPlanOutput] = useState("");
  const [templates, setTemplates] = useState<GoalTemplate[]>([]);
  const [decomposed, setDecomposed] = useState<Record<string, unknown> | null>(null);
  const [decomposing, setDecomposing] = useState(false);
  const [tab, setTab] = useState<"plan" | "decompose" | "templates">("plan");

  useEffect(() => { fetchTemplates(); }, []);

  async function fetchTemplates() {
    try {
      const r = await fetch(`${BASE_URL}/api/goap/templates`);
      const d = await r.json() as { templates: GoalTemplate[] };
      setTemplates(d.templates ?? []);
    } catch { /* ignore */ }
  }

  async function generatePlan() {
    if (!goal.trim()) return;
    setPlanning(true);
    setPlanOutput("");
    try {
      const r = await fetch(`${BASE_URL}/api/goap/plan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ goal, context, complexity }),
      });
      const reader = r.body?.getReader();
      if (!reader) return;
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const text = new TextDecoder().decode(value);
        for (const line of text.split("\n")) {
          if (!line.startsWith("data:")) continue;
          try {
            const ev = JSON.parse(line.slice(5)) as { type: string; content?: string };
            if (ev.type === "chunk" && ev.content) setPlanOutput(p => p + ev.content);
          } catch { /* ignore */ }
        }
      }
    } catch { /* ignore */ }
    setPlanning(false);
  }

  async function decomposeGoal() {
    if (!goal.trim()) return;
    setDecomposing(true);
    setDecomposed(null);
    try {
      const r = await fetch(`${BASE_URL}/api/goap/decompose`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ goal }),
      });
      const d = await r.json() as { decomposed: Record<string, unknown> };
      setDecomposed(d.decomposed ?? null);
    } catch { /* ignore */ }
    setDecomposing(false);
  }

  function renderSubgoals(node: Record<string, unknown>, depth = 0): React.ReactNode {
    if (!node) return null;
    const subgoals = (node.subgoals as Record<string, unknown>[]) ?? [];
    const priorityColors: Record<string, string> = {
      critical: "text-red-400", high: "text-orange-400", medium: "text-yellow-400", low: "text-white/40"
    };
    return (
      <div style={{ paddingLeft: depth * 16 }}>
        <div className={cn("flex items-start gap-2 py-1.5", depth > 0 && "border-l border-white/[0.06] pl-3")}>
          <Target size={11} className={priorityColors[(node.priority as string) ?? "medium"]} />
          <div className="flex-1">
            <span className="text-[12px] text-white/80">{node.goal as string}</span>
            <div className="flex gap-2 mt-0.5">
              {!!node.agentType && <span className="text-[9px] bg-white/5 px-1.5 py-0.5 rounded text-white/40">{node.agentType as string}</span>}
              {!!node.estimatedMinutes && <span className="text-[9px] text-white/30">~{node.estimatedMinutes as number}min</span>}
              {!!node.priority && <span className={cn("text-[9px]", priorityColors[(node.priority as string)])}>{node.priority as string}</span>}
            </div>
          </div>
        </div>
        {subgoals.map((sg, i) => <div key={i}>{renderSubgoals(sg, depth + 1)}</div>)}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0d1117] text-white flex flex-col">
      <div className="sticky top-0 z-20 bg-[#0d1117]/95 backdrop-blur border-b border-white/[0.08] px-4 pt-safe">
        <div className="flex items-center gap-3 py-3">
          <button onClick={() => navigate("/")} className="p-1.5 rounded-lg hover:bg-white/5 text-white/60 hover:text-white transition-colors">
            <ArrowLeft size={20} />
          </button>
          <Target size={18} className="text-indigo-400" />
          <span className="font-semibold flex-1">GOAP Goal Planner</span>
          <span className="text-[10px] font-mono bg-indigo-500/20 text-indigo-300 border border-indigo-400/20 px-2 py-0.5 rounded-full">A* PLANNER</span>
        </div>
        <div className="flex gap-1 pb-3">
          {(["plan", "decompose", "templates"] as const).map(t => (
            <button key={t} onClick={() => setTab(t)} className={cn("flex-1 py-1.5 rounded-lg text-[11px] font-medium capitalize transition-colors", tab === t ? "bg-white/10 text-white" : "text-white/40 hover:text-white/70")}>
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pb-24 px-4 pt-4 space-y-3">
        {(tab === "plan" || tab === "decompose") && (
          <>
            <div>
              <label className="text-[11px] text-white/50 mb-1.5 block">Goal (plain English)</label>
              <textarea value={goal} onChange={e => setGoal(e.target.value)} placeholder='e.g. "Build a SaaS product with user auth, payment, and dashboard" or "Fix all security vulnerabilities in our codebase"' rows={3} className="w-full bg-[#161b22] border border-white/[0.06] rounded-xl py-3 px-4 text-[13px] placeholder:text-white/30 focus:outline-none focus:border-indigo-500/50 resize-none" />
            </div>

            {tab === "plan" && (
              <>
                <div>
                  <label className="text-[11px] text-white/50 mb-1.5 block">Context (optional)</label>
                  <input value={context} onChange={e => setContext(e.target.value)} placeholder="e.g. React + TypeScript + Postgres + Stripe" className="w-full bg-[#161b22] border border-white/[0.06] rounded-lg py-2 px-3 text-[12px] placeholder:text-white/30 focus:outline-none focus:border-indigo-500/50" />
                </div>
                <div>
                  <label className="text-[11px] text-white/50 mb-1.5 block">Complexity</label>
                  <div className="flex gap-2">
                    {(["simple", "medium", "complex"] as const).map(c => (
                      <button key={c} onClick={() => setComplexity(c)} className={cn("flex-1 py-2 rounded-lg border text-[11px] font-medium capitalize transition-colors", complexity === c ? `border-current ${COMPLEXITY_COLOR[c]}` : "border-white/[0.06] text-white/40 hover:text-white/70 bg-[#161b22]")}>
                        {c}
                      </button>
                    ))}
                  </div>
                </div>
                <button onClick={generatePlan} disabled={planning || !goal.trim()}
                  className="w-full py-3 bg-indigo-600/20 border border-indigo-400/30 rounded-xl text-indigo-300 text-[13px] font-medium flex items-center justify-center gap-2 hover:bg-indigo-600/30 transition-colors disabled:opacity-50">
                  {planning ? <Loader2 size={14} className="animate-spin" /> : <Zap size={14} />}
                  Generate GOAP A* Plan
                </button>
                {planOutput && (
                  <div className="bg-[#161b22] border border-indigo-400/20 rounded-xl p-4 max-h-[60vh] overflow-y-auto">
                    <div className="text-[11px] text-indigo-300 mb-2 flex items-center gap-1"><Target size={10} /> Agent Plan</div>
                    <pre className="text-[12px] text-white/75 whitespace-pre-wrap font-sans leading-relaxed">{planOutput}</pre>
                  </div>
                )}
              </>
            )}

            {tab === "decompose" && (
              <>
                <button onClick={decomposeGoal} disabled={decomposing || !goal.trim()}
                  className="w-full py-3 bg-indigo-600/20 border border-indigo-400/30 rounded-xl text-indigo-300 text-[13px] font-medium flex items-center justify-center gap-2 hover:bg-indigo-600/30 transition-colors disabled:opacity-50">
                  {decomposing ? <Loader2 size={14} className="animate-spin" /> : <Layers size={14} />}
                  Decompose into Sub-Goals
                </button>
                {decomposed && (
                  <div className="bg-[#161b22] border border-indigo-400/20 rounded-xl p-4">
                    <div className="text-[11px] text-indigo-300 mb-3">Goal Hierarchy</div>
                    {renderSubgoals(decomposed as Record<string, unknown>)}
                  </div>
                )}
              </>
            )}
          </>
        )}

        {tab === "templates" && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
            <p className="text-[11px] text-white/40">Pre-built goal templates — click to use as starting point.</p>
            {templates.map(t => (
              <button key={t.id} onClick={() => { setGoal(t.description); setComplexity(t.complexity as "simple" | "medium" | "complex"); setTab("plan"); }}
                className="w-full bg-[#161b22] border border-white/[0.06] rounded-xl p-3 text-left hover:border-indigo-400/30 transition-colors group">
                <div className="flex items-start gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[13px] font-medium">{t.name}</span>
                      <span className={cn("text-[9px] px-1.5 py-0.5 rounded border capitalize shrink-0", COMPLEXITY_COLOR[t.complexity])}>{t.complexity}</span>
                    </div>
                    <p className="text-[11px] text-white/40 mt-0.5">{t.description}</p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <Users size={10} className="text-white/30" />
                      <span className="text-[10px] text-white/30">{t.estimatedAgents} agents needed</span>
                    </div>
                  </div>
                  <ChevronRight size={14} className="text-white/20 group-hover:text-indigo-400 transition-colors mt-1 shrink-0" />
                </div>
              </button>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
}
