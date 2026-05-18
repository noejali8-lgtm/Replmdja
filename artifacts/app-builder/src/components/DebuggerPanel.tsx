import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, Bug, Play, SkipForward, CornerDownRight, ArrowUpToLine,
  Square, RotateCcw, Circle, Trash2, Eye, EyeOff,
  ChevronRight, ChevronDown, AlertCircle, Code2,
  Layers, List, Activity, Zap, GitBranch, Tag, RefreshCw,
  User, Clock,
} from "lucide-react";

function cn(...classes: (string | undefined | false | null)[]) {
  return classes.filter(Boolean).join(" ");
}

/* ─── Types ─── */
export interface Breakpoint {
  id: string; file: string; line: number;
  condition?: string; enabled: boolean; hitCount?: number;
}
export interface WatchedVariable {
  id: string; name: string; value?: string; type?: string; expanded?: boolean;
}
export interface CallFrame {
  index: number; fn: string; file: string; line: number; active?: boolean;
}
interface GitCommitNode {
  hash: string;
  message: string;
  author: string;
  authorInitial: string;
  date: string;
  lane: number;
  parentRows: number[];
  tags?: string[];
  branchLabel?: string;
  isHead?: boolean;
  isMerge?: boolean;
}

interface DebuggerPanelProps {
  onClose: () => void;
  projectId?: string;
  onSendDebugCommand?: (action: string, args?: Record<string, unknown>) => void;
  breakpoints?: Breakpoint[];
  variables?: WatchedVariable[];
  callStack?: CallFrame[];
  isRunning?: boolean;
  isPaused?: boolean;
}

type DebugTab = "breakpoints" | "variables" | "callstack" | "console" | "git";

/* ─── Lane colours (matching GitLens style) ─── */
const LANE_COLORS = [
  "#58a6ff", // 0 main     — blue
  "#3fb950", // 1 feature  — green
  "#bc8cff", // 2 feature2 — purple
  "#ff7b72", // 3 hotfix   — red
  "#d29922", // 4 develop  — amber
];

/* ─── Demo git graph data ───
 * 15 commits across 4 branches with real-looking topology.
 * Rows are newest→oldest (row 0 = HEAD).
 */
const DEMO_COMMITS: GitCommitNode[] = [
  {
    hash: "a3f9c2e", message: "Merge branch 'feature/auth' into main",
    author: "Ada Lovelace", authorInitial: "A", date: "just now",
    lane: 0, parentRows: [1, 4], isMerge: true, isHead: true,
    branchLabel: "main", tags: [],
  },
  {
    hash: "b12d8fa", message: "Fix lint warnings in middleware",
    author: "Ada Lovelace", authorInitial: "A", date: "2 hours ago",
    lane: 0, parentRows: [5],
  },
  {
    hash: "c4e6701", message: "Add JWT refresh token support",
    author: "Ben Turing", authorInitial: "B", date: "3 hours ago",
    lane: 1, parentRows: [3], branchLabel: "feature/auth",
  },
  {
    hash: "d9a1f3c", message: "Implement OAuth2 PKCE flow",
    author: "Ben Turing", authorInitial: "B", date: "4 hours ago",
    lane: 1, parentRows: [4],
  },
  {
    hash: "e7b2d88", message: "Add auth middleware skeleton",
    author: "Ben Turing", authorInitial: "B", date: "5 hours ago",
    lane: 1, parentRows: [5],
  },
  {
    hash: "f0c3a19", message: "chore: update all dependencies",
    author: "Ada Lovelace", authorInitial: "A", date: "6 hours ago",
    lane: 0, parentRows: [9],
  },
  {
    hash: "1a4e77d", message: "feat: add animated dark-mode toggle",
    author: "Cleo Shannon", authorInitial: "C", date: "8 hours ago",
    lane: 2, parentRows: [7], branchLabel: "feature/ui",
  },
  {
    hash: "2b5f88e", message: "refactor: split NavBar into sub-components",
    author: "Cleo Shannon", authorInitial: "C", date: "9 hours ago",
    lane: 2, parentRows: [9],
  },
  {
    hash: "3c6099f", message: "fix: sanitize user input on search field",
    author: "Dave Grace", authorInitial: "D", date: "10 hours ago",
    lane: 3, parentRows: [10],
  },
  {
    hash: "4d710a0", message: "Merge branch 'fix/hotfix-1.2.1'",
    author: "Ada Lovelace", authorInitial: "A", date: "11 hours ago",
    lane: 0, parentRows: [10, 8], isMerge: true,
  },
  {
    hash: "5e821b1", message: "fix: patch XSS vulnerability in profile page",
    author: "Dave Grace", authorInitial: "D", date: "11 hours ago",
    lane: 3, parentRows: [11], branchLabel: "fix/hotfix-1.2.1",
    tags: ["v1.2.1"],
  },
  {
    hash: "6f932c2", message: "feat: add API rate limiting per user",
    author: "Ada Lovelace", authorInitial: "A", date: "yesterday",
    lane: 0, parentRows: [12], tags: ["v1.2.0"],
  },
  {
    hash: "7a043d3", message: "feat: add file-upload with progress bar",
    author: "Ben Turing", authorInitial: "B", date: "yesterday",
    lane: 0, parentRows: [13],
  },
  {
    hash: "8b154e4", message: "docs: update README with quick-start guide",
    author: "Cleo Shannon", authorInitial: "C", date: "2 days ago",
    lane: 0, parentRows: [14],
  },
  {
    hash: "9c265f5", message: "chore: initial project scaffold",
    author: "Ada Lovelace", authorInitial: "A", date: "2 days ago",
    lane: 0, parentRows: [], tags: ["v1.0.0"],
  },
];

/* ─── Demo data for other tabs ─── */
const DEMO_BREAKPOINTS: Breakpoint[] = [
  { id: "bp1", file: "index.js", line: 14, enabled: true, hitCount: 3 },
  { id: "bp2", file: "utils/auth.js", line: 87, condition: "user.role === 'admin'", enabled: true },
  { id: "bp3", file: "app.py", line: 42, enabled: false },
];
const DEMO_VARS: WatchedVariable[] = [
  { id: "v1", name: "user", value: '{ id: "u_7f3a", role: "admin", email: "…" }', type: "object" },
  { id: "v2", name: "response.status", value: "403", type: "number" },
  { id: "v3", name: "config.timeout", value: "30000", type: "number" },
  { id: "v4", name: "isAuthenticated", value: "false", type: "boolean" },
];
const DEMO_STACK: CallFrame[] = [
  { index: 0, fn: "checkPermissions()", file: "auth.js", line: 87, active: true },
  { index: 1, fn: "handleRequest()", file: "routes/api.js", line: 54 },
  { index: 2, fn: "middleware()", file: "app.js", line: 22 },
  { index: 3, fn: "express.next()", file: "node_modules/express/lib/router/layer.js", line: 144 },
];
const DEMO_CONSOLE = [
  { level: "log", msg: "Server started on port 3000", ts: "22:41:03" },
  { level: "warn", msg: "JWT secret is using default value", ts: "22:41:03" },
  { level: "error", msg: "TypeError: Cannot read property 'role' of undefined", ts: "22:41:07" },
  { level: "log", msg: "Breakpoint hit: auth.js:87", ts: "22:41:07" },
];

/* ════════════════════════════════════════════════
   GitGraph — SVG branch graph component
   ════════════════════════════════════════════════ */
const ROW_H = 48;
const LANE_W = 20;
const LEFT_PAD = 14;
const GRAPH_W = 5 * LANE_W + LEFT_PAD + 8; // 4 lanes max + padding
const NODE_R = 5;

function laneX(lane: number) { return LEFT_PAD + lane * LANE_W; }
function rowY(row: number) { return ROW_H / 2 + row * ROW_H; }

function GitGraph({
  commits, onSelect, selected,
}: {
  commits: GitCommitNode[];
  onSelect: (idx: number) => void;
  selected: number | null;
}) {
  const svgH = commits.length * ROW_H;

  /* Build path segments */
  const segments: { d: string; color: string; dashed?: boolean }[] = [];

  commits.forEach((commit, rowIdx) => {
    const cx = laneX(commit.lane);
    const cy = rowY(rowIdx);

    commit.parentRows.forEach((parentRow, pIdx) => {
      const parent = commits[parentRow];
      if (!parent) return;
      const px = laneX(parent.lane);
      const py = rowY(parentRow);

      // Color: use the source commit's lane color (or parent for merge)
      const color = LANE_COLORS[pIdx === 0 ? commit.lane : parent.lane] ?? LANE_COLORS[0];

      if (cx === px) {
        // Same lane — straight vertical line
        segments.push({ d: `M ${cx} ${cy} L ${px} ${py}`, color });
      } else {
        // Different lanes — cubic bezier elbow
        const midY = (cy + py) / 2;
        segments.push({
          d: `M ${cx} ${cy} C ${cx} ${midY} ${px} ${midY} ${px} ${py}`,
          color,
          dashed: pIdx > 0,
        });
      }
    });
  });

  return (
    <svg width={GRAPH_W} height={svgH} className="flex-shrink-0 overflow-visible">
      <defs>
        {LANE_COLORS.map((c, i) => (
          <filter key={i} id={`glow${i}`}>
            <feGaussianBlur stdDeviation="1.5" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        ))}
      </defs>

      {/* Lane guide lines (faint) */}
      {[0, 1, 2, 3].map(lane => {
        const x = laneX(lane);
        const hasCommitsOnLane = commits.some(c => c.lane === lane);
        if (!hasCommitsOnLane) return null;
        return (
          <line key={lane} x1={x} y1={0} x2={x} y2={svgH}
            stroke={LANE_COLORS[lane]} strokeWidth={1} strokeOpacity={0.08} />
        );
      })}

      {/* Connector paths */}
      {segments.map((seg, i) => (
        <path key={i} d={seg.d} fill="none"
          stroke={seg.color} strokeWidth={1.5} strokeOpacity={0.75}
          strokeDasharray={seg.dashed ? "4 3" : undefined} />
      ))}

      {/* Commit nodes */}
      {commits.map((commit, rowIdx) => {
        const cx = laneX(commit.lane);
        const cy = rowY(rowIdx);
        const color = LANE_COLORS[commit.lane] ?? LANE_COLORS[0];
        const isSelected = selected === rowIdx;

        return (
          <g key={rowIdx} className="cursor-pointer" onClick={() => onSelect(rowIdx)}>
            {/* Selection ring */}
            {isSelected && (
              <circle cx={cx} cy={cy} r={NODE_R + 4}
                fill="none" stroke={color} strokeWidth={1} strokeOpacity={0.4} />
            )}
            {/* Merge indicator (diamond) */}
            {commit.isMerge ? (
              <polygon
                points={`${cx},${cy - NODE_R - 1} ${cx + NODE_R + 1},${cy} ${cx},${cy + NODE_R + 1} ${cx - NODE_R - 1},${cy}`}
                fill={color} stroke="#0d1117" strokeWidth={1.5}
                filter={isSelected ? `url(#glow${commit.lane})` : undefined}
              />
            ) : (
              <circle cx={cx} cy={cy} r={NODE_R}
                fill={commit.isHead ? color : "#0d1117"}
                stroke={color} strokeWidth={commit.isHead ? 0 : 1.5}
                filter={isSelected ? `url(#glow${commit.lane})` : undefined}
              />
            )}
            {/* HEAD dot */}
            {commit.isHead && (
              <circle cx={cx} cy={cy} r={2} fill="#0d1117" />
            )}
          </g>
        );
      })}
    </svg>
  );
}

/* ─── GitHistoryTab ─── */
function GitHistoryTab({ commits, onSend }: {
  commits: GitCommitNode[];
  onSend?: (action: string) => void;
}) {
  const [selected, setSelected] = useState<number | null>(0);
  const [filter, setFilter] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const filtered = filter
    ? commits.filter(c =>
        c.message.toLowerCase().includes(filter.toLowerCase()) ||
        c.hash.includes(filter) ||
        c.author.toLowerCase().includes(filter.toLowerCase()) ||
        (c.branchLabel ?? "").toLowerCase().includes(filter.toLowerCase())
      )
    : commits;

  const selectedCommit = selected !== null ? filtered[selected] : null;

  /* Branch legend */
  const branches = [
    { label: "main", lane: 0 },
    { label: "feature/auth", lane: 1 },
    { label: "feature/ui", lane: 2 },
    { label: "fix/hotfix", lane: 3 },
  ].filter(b => commits.some(c => c.lane === b.lane));

  return (
    <motion.div key="git" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
      className="flex flex-col h-full min-h-0">

      {/* ── Git toolbar ── */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-white/[0.06] shrink-0">
        <div className="flex-1 flex items-center gap-1.5 bg-white/[0.04] border border-white/[0.07] rounded-lg px-2.5 h-7">
          <GitBranch size={10} className="text-white/30 shrink-0" />
          <input value={filter} onChange={e => setFilter(e.target.value)}
            placeholder="Search commits, branches, authors…"
            className="flex-1 bg-transparent text-[11px] text-white/70 placeholder:text-white/25 outline-none min-w-0" />
        </div>
        <button onClick={() => onSend?.("log")}
          className="w-7 h-7 flex items-center justify-center text-white/30 hover:text-white rounded transition-colors" title="Refresh from OMEGA">
          <RefreshCw size={11} />
        </button>
      </div>

      {/* ── Branch legend ── */}
      <div className="flex items-center gap-2 px-3 py-1.5 border-b border-white/[0.05] overflow-x-auto shrink-0">
        {branches.map(b => (
          <div key={b.label} className="flex items-center gap-1 shrink-0">
            <div className="w-2 h-2 rounded-full" style={{ background: LANE_COLORS[b.lane] }} />
            <span className="text-[9px] font-mono" style={{ color: LANE_COLORS[b.lane] + "cc" }}>{b.label}</span>
          </div>
        ))}
        <div className="text-[9px] text-white/15 shrink-0 ml-auto">{filtered.length} commits</div>
      </div>

      {/* ── Main split: graph + list ── */}
      <div className="flex-1 overflow-hidden flex flex-col min-h-0">
        {/* Scrollable graph + commit list */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto min-h-0 overflow-x-hidden">
          <div className="flex">
            {/* SVG Graph column */}
            <div className="sticky-none flex-shrink-0" style={{ width: GRAPH_W }}>
              <GitGraph commits={filtered} onSelect={setSelected} selected={selected} />
            </div>

            {/* Commit info list column */}
            <div className="flex-1 min-w-0">
              {filtered.map((commit, rowIdx) => {
                const isSelected = selected === rowIdx;
                const color = LANE_COLORS[commit.lane] ?? LANE_COLORS[0];
                return (
                  <div key={commit.hash} onClick={() => setSelected(rowIdx)}
                    className={cn(
                      "flex flex-col justify-center px-2 py-2 cursor-pointer transition-colors border-b border-white/[0.03]",
                      isSelected ? "bg-white/[0.06]" : "hover:bg-white/[0.03]"
                    )}
                    style={{ height: ROW_H }}>

                    {/* Message + tags row */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {commit.branchLabel && (
                        <span className="shrink-0 text-[8px] font-medium px-1.5 py-0.5 rounded-sm border"
                          style={{ color, borderColor: color + "55", background: color + "15" }}>
                          {commit.branchLabel}
                        </span>
                      )}
                      {commit.isHead && (
                        <span className="shrink-0 text-[8px] font-bold px-1.5 py-0.5 rounded-sm bg-blue-500/20 text-blue-300 border border-blue-500/30">
                          HEAD
                        </span>
                      )}
                      {(commit.tags ?? []).map(tag => (
                        <span key={tag} className="shrink-0 flex items-center gap-0.5 text-[8px] px-1.5 py-0.5 rounded-sm bg-amber-500/15 text-amber-300 border border-amber-500/25">
                          <Tag size={7} />
                          {tag}
                        </span>
                      ))}
                      <span className={cn("text-[11px] truncate font-medium leading-tight",
                        isSelected ? "text-white" : "text-white/75")}>
                        {commit.message}
                      </span>
                    </div>

                    {/* Author + hash + date row */}
                    <div className="flex items-center gap-2 mt-1">
                      <div className="w-3.5 h-3.5 rounded-full flex items-center justify-center text-[7px] font-bold shrink-0"
                        style={{ background: color + "30", color }}>
                        {commit.authorInitial}
                      </div>
                      <span className="text-[9px] text-white/30 truncate">{commit.author}</span>
                      <code className="text-[9px] font-mono text-white/20 shrink-0">{commit.hash}</code>
                      <span className="text-[9px] text-white/20 shrink-0 ml-auto">{commit.date}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── Selected commit detail drawer ── */}
        <AnimatePresence>
          {selectedCommit && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ type: "spring", stiffness: 400, damping: 38 }}
              className="border-t border-white/[0.08] bg-[#161b22] overflow-hidden shrink-0"
            >
              <div className="px-3 py-3 space-y-2">
                {/* Commit hash + actions */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full"
                      style={{ background: LANE_COLORS[selectedCommit.lane] }} />
                    <code className="text-[11px] font-mono text-blue-300">{selectedCommit.hash}</code>
                    {selectedCommit.isMerge && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/25">merge</span>
                    )}
                  </div>
                  <div className="flex gap-1">
                    {["diff", "show", "revert"].map(action => (
                      <button key={action} onClick={() => onSend?.(action)}
                        className="px-2 py-1 rounded text-[10px] text-white/40 hover:text-white bg-white/5 hover:bg-white/10 transition-colors border border-white/[0.06]">
                        {action}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Message */}
                <div className="text-[12px] text-white font-medium">{selectedCommit.message}</div>

                {/* Meta */}
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    <User size={9} className="text-white/30" />
                    <span className="text-[10px] text-white/40">{selectedCommit.author}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock size={9} className="text-white/30" />
                    <span className="text-[10px] text-white/40">{selectedCommit.date}</span>
                  </div>
                  {(selectedCommit.tags ?? []).map(t => (
                    <span key={t} className="flex items-center gap-0.5 text-[9px] text-amber-300">
                      <Tag size={8} /> {t}
                    </span>
                  ))}
                </div>

                {/* Parents */}
                {selectedCommit.parentRows.length > 0 && (
                  <div className="flex items-center gap-1.5">
                    <span className="text-[9px] text-white/25">Parents:</span>
                    {selectedCommit.parentRows.map(r => {
                      const p = filtered[r];
                      return p ? (
                        <button key={r} onClick={() => setSelected(r)}
                          className="text-[9px] font-mono text-blue-400/70 hover:text-blue-300 transition-colors">
                          {p.hash}
                        </button>
                      ) : null;
                    })}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

/* ════════════════════════════════════════════════
   Main DebuggerPanel component
   ════════════════════════════════════════════════ */
export function DebuggerPanel({
  onClose, projectId = "workspace", onSendDebugCommand,
  breakpoints: bpProp, variables: varProp, callStack: stackProp,
  isRunning = false, isPaused = true,
}: DebuggerPanelProps) {
  const [tab, setTab] = useState<DebugTab>("git");
  const [breakpoints, setBreakpoints] = useState<Breakpoint[]>(bpProp ?? DEMO_BREAKPOINTS);
  const [variables, setVariables] = useState<WatchedVariable[]>(varProp ?? DEMO_VARS);
  const [callStack] = useState<CallFrame[]>(stackProp ?? DEMO_STACK);
  const [newWatch, setNewWatch] = useState("");
  const [expandedVars, setExpandedVars] = useState<Set<string>>(new Set());
  const [dbgState, setDbgState] = useState<"stopped" | "running" | "paused">(
    isPaused ? "paused" : isRunning ? "running" : "stopped"
  );
  const consoleEndRef = useRef<HTMLDivElement>(null);
  const [consoleLines, setConsoleLines] = useState(DEMO_CONSOLE);

  useEffect(() => { if (bpProp) setBreakpoints(bpProp); }, [bpProp]);
  useEffect(() => { if (varProp) setVariables(varProp); }, [varProp]);

  const send = (action: string, args?: Record<string, unknown>) =>
    onSendDebugCommand?.(action, { projectId, ...args });

  function toggleBp(id: string) {
    setBreakpoints(prev => prev.map(b => b.id === id ? { ...b, enabled: !b.enabled } : b));
  }
  function deleteBp(id: string) { setBreakpoints(prev => prev.filter(b => b.id !== id)); send("remove_breakpoint"); }
  function addWatch() {
    const name = newWatch.trim(); if (!name) return;
    setVariables(prev => [...prev, { id: `v_${Date.now()}`, name, value: "(watching…)", type: "unknown" }]);
    setNewWatch(""); send("watch", { variable: name });
  }
  function removeWatch(id: string) { setVariables(prev => prev.filter(v => v.id !== id)); }
  function toggleVarExpand(id: string) {
    setExpandedVars(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; });
  }

  function stepOver() { setDbgState("paused"); send("step_over"); }
  function stepInto() { setDbgState("paused"); send("step_into"); }
  function stepOut() { setDbgState("paused"); send("step_out"); }
  function continueRun() { setDbgState("running"); send("continue"); }
  function stopDebug() { setDbgState("stopped"); send("step_out"); }
  function restartDebug() {
    setDbgState("running");
    setConsoleLines(prev => [...prev, { level: "log", msg: "🔄 Restarting…", ts: new Date().toTimeString().slice(0, 8) }]);
    send("continue");
    setTimeout(() => setDbgState("paused"), 800);
  }

  const STATE_COLOR = { stopped: "text-white/30", running: "text-green-400", paused: "text-yellow-400" };
  const STATE_LABEL = { stopped: "Stopped", running: "Running", paused: "Paused at breakpoint" };

  const tabs: { id: DebugTab; label: string; icon: React.ReactNode; count?: number }[] = [
    { id: "git", label: "Git History", icon: <GitBranch size={11} />, count: DEMO_COMMITS.length },
    { id: "breakpoints", label: "Breakpoints", icon: <Circle size={10} className="fill-red-400 text-red-400" />, count: breakpoints.filter(b => b.enabled).length },
    { id: "variables", label: "Variables", icon: <Eye size={11} />, count: variables.length },
    { id: "callstack", label: "Call Stack", icon: <Layers size={11} />, count: callStack.length },
    { id: "console", label: "Console", icon: <Activity size={11} />, count: consoleLines.filter(c => c.level === "error").length || undefined },
  ];

  return (
    <motion.div
      initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
      transition={{ type: "spring", stiffness: 380, damping: 38 }}
      className="absolute inset-0 z-50 flex flex-col bg-[#0d1117]"
      style={{ paddingTop: "env(safe-area-inset-top)" }}
    >
      {/* ── Header ── */}
      <div className="flex items-center gap-2 px-3 pt-10 pb-2.5 border-b border-white/[0.08] bg-[#161b22] shrink-0">
        <div className="w-7 h-7 rounded-lg bg-red-500/15 border border-red-400/25 flex items-center justify-center shrink-0">
          <Bug size={13} className="text-red-400" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold text-white">Visual Debugger</div>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className={cn("text-[10px] font-mono", STATE_COLOR[dbgState])}>{STATE_LABEL[dbgState]}</span>
            {dbgState === "paused" && (
              <span className="text-[10px] text-white/25">· {callStack[0]?.file}:{callStack[0]?.line}</span>
            )}
          </div>
        </div>
        <button onClick={onClose} className="w-7 h-7 flex items-center justify-center text-white/40 hover:text-white rounded">
          <X size={15} />
        </button>
      </div>

      {/* ── Debug Controls Toolbar ── */}
      <div className="flex items-center gap-1 px-3 py-2 border-b border-white/[0.06] bg-[#161b22] shrink-0">
        <ControlBtn icon={<Play size={12} fill="currentColor" />} label="Continue" color="text-green-400" disabled={dbgState === "running"} onClick={continueRun} />
        <div className="w-px h-4 bg-white/10 mx-0.5" />
        <ControlBtn icon={<SkipForward size={12} />} label="Step Over" disabled={dbgState !== "paused"} onClick={stepOver} />
        <ControlBtn icon={<CornerDownRight size={12} />} label="Step Into" disabled={dbgState !== "paused"} onClick={stepInto} />
        <ControlBtn icon={<ArrowUpToLine size={12} />} label="Step Out" disabled={dbgState !== "paused"} onClick={stepOut} />
        <div className="w-px h-4 bg-white/10 mx-0.5" />
        <ControlBtn icon={<RotateCcw size={12} />} label="Restart" color="text-blue-400" onClick={restartDebug} />
        <ControlBtn icon={<Square size={12} />} label="Stop" color="text-red-400" onClick={stopDebug} />
        <div className="flex-1" />
        {dbgState === "paused" && (
          <motion.div initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-1 px-2 py-0.5 rounded bg-yellow-400/10 border border-yellow-400/25">
            <Zap size={9} className="text-yellow-400" />
            <span className="text-[10px] text-yellow-300 font-medium">Paused</span>
          </motion.div>
        )}
      </div>

      {/* ── Tab Bar ── */}
      <div className="flex border-b border-white/[0.08] bg-[#0d1117] shrink-0 overflow-x-auto">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium border-b-2 transition-colors shrink-0 whitespace-nowrap",
              tab === t.id ? "border-red-400 text-red-300" : "border-transparent text-white/40 hover:text-white/70"
            )}>
            {t.icon}
            {t.label}
            {t.count !== undefined && (
              <span className={cn("text-[9px] px-1.5 py-0.5 rounded-full min-w-[18px] text-center",
                tab === t.id ? "bg-red-500/20 text-red-300" : "bg-white/8 text-white/30")}>
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Tab Content ── */}
      <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
        <AnimatePresence mode="wait">

          {/* ── Git History Tab ── */}
          {tab === "git" && (
            <GitHistoryTab
              commits={DEMO_COMMITS}
              onSend={action => send(action, { projectId })}
            />
          )}

          {/* ── Breakpoints Tab ── */}
          {tab === "breakpoints" && (
            <motion.div key="bp" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="flex-1 overflow-y-auto p-3 space-y-2">
              {breakpoints.length === 0 ? (
                <EmptyState icon={<Circle size={22} className="text-white/15" />}
                  title="No breakpoints" desc="Use OMEGA's visual_debugger tool or click in the editor gutter" />
              ) : breakpoints.map(bp => (
                <motion.div key={bp.id} layout
                  className={cn("flex items-start gap-2.5 p-2.5 rounded-lg border transition-colors",
                    bp.enabled ? "bg-red-500/5 border-red-500/20" : "bg-white/[0.02] border-white/[0.06]")}>
                  <button onClick={() => toggleBp(bp.id)} className="mt-0.5 shrink-0">
                    <Circle size={12} className={cn(bp.enabled ? "fill-red-400 text-red-400" : "text-white/20")} />
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className={cn("text-[11px] font-mono", bp.enabled ? "text-white" : "text-white/35")}>{bp.file}</span>
                      <span className={cn("text-[11px] font-mono", bp.enabled ? "text-white/50" : "text-white/20")}>:{bp.line}</span>
                      {bp.hitCount !== undefined && bp.hitCount > 0 && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-orange-500/15 text-orange-300 border border-orange-500/20">×{bp.hitCount}</span>
                      )}
                    </div>
                    {bp.condition && (
                      <div className="mt-0.5 flex items-center gap-1">
                        <span className="text-[9px] text-white/30">if</span>
                        <code className="text-[9px] font-mono text-purple-300/70 bg-purple-500/5 px-1 rounded">{bp.condition}</code>
                      </div>
                    )}
                  </div>
                  <button onClick={() => deleteBp(bp.id)}
                    className="shrink-0 w-5 h-5 flex items-center justify-center text-white/15 hover:text-red-400 rounded transition-colors">
                    <Trash2 size={10} />
                  </button>
                </motion.div>
              ))}
              <button onClick={() => send("list_breakpoints")}
                className="w-full mt-1 py-2 rounded-lg border border-dashed border-white/[0.08] text-[11px] text-white/30 hover:text-white/60 hover:border-white/20 transition-colors flex items-center justify-center gap-1.5">
                <Circle size={10} /> Add breakpoint via OMEGA
              </button>
            </motion.div>
          )}

          {/* ── Variables/Watchers Tab ── */}
          {tab === "variables" && (
            <motion.div key="vars" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="flex-1 overflow-y-auto p-3 space-y-2">
              <div className="flex gap-1.5 mb-3">
                <input value={newWatch} onChange={e => setNewWatch(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && addWatch()}
                  placeholder="Watch expression…"
                  className="flex-1 bg-white/[0.04] border border-white/[0.08] rounded-lg px-2.5 py-1.5 text-[11px] text-white placeholder-white/25 focus:outline-none focus:border-blue-500/50 font-mono" />
                <button onClick={addWatch}
                  className="px-2.5 py-1.5 rounded-lg bg-blue-500/15 border border-blue-500/25 text-[11px] text-blue-300 hover:bg-blue-500/25 transition-colors flex items-center gap-1">
                  <Eye size={10} /> Watch
                </button>
              </div>
              {variables.length === 0 ? (
                <EmptyState icon={<Eye size={22} className="text-white/15" />}
                  title="No watched variables" desc="Type a variable name above to watch it" />
              ) : variables.map(v => {
                const isObj = v.type === "object" || (v.value ?? "").startsWith("{") || (v.value ?? "").startsWith("[");
                const isExpanded = expandedVars.has(v.id);
                return (
                  <div key={v.id} className="rounded-lg border border-white/[0.07] bg-white/[0.02] overflow-hidden">
                    <div className="flex items-center gap-2 p-2.5">
                      {isObj ? (
                        <button onClick={() => toggleVarExpand(v.id)} className="shrink-0 text-white/30 hover:text-white transition-colors">
                          {isExpanded ? <ChevronDown size={10} /> : <ChevronRight size={10} />}
                        </button>
                      ) : <div className="w-[10px] shrink-0" />}
                      <span className="text-[11px] font-mono text-blue-300 shrink-0">{v.name}</span>
                      <span className="text-[11px] text-white/25 shrink-0">=</span>
                      <span className={cn("text-[11px] font-mono flex-1 truncate",
                        v.type === "number" ? "text-green-300" : v.type === "boolean" ? "text-orange-300" :
                        v.type === "string" ? "text-yellow-300" : "text-white/70")}>
                        {v.value ?? "(undefined)"}
                      </span>
                      {v.type && <span className="text-[9px] text-white/20 shrink-0 font-mono">{v.type}</span>}
                      <button onClick={() => removeWatch(v.id)}
                        className="shrink-0 w-4 h-4 flex items-center justify-center text-white/15 hover:text-red-400 rounded transition-colors">
                        <EyeOff size={9} />
                      </button>
                    </div>
                    {isObj && isExpanded && (
                      <div className="border-t border-white/[0.06] px-4 py-2 bg-white/[0.015]">
                        <code className="text-[10px] font-mono text-white/50 whitespace-pre-wrap break-all">{v.value}</code>
                      </div>
                    )}
                  </div>
                );
              })}
            </motion.div>
          )}

          {/* ── Call Stack Tab ── */}
          {tab === "callstack" && (
            <motion.div key="stack" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="flex-1 overflow-y-auto p-3 space-y-1">
              {dbgState === "running" ? (
                <EmptyState icon={<List size={22} className="text-white/15" />}
                  title="Call stack unavailable" desc="Pause execution to inspect the call stack" />
              ) : callStack.map((frame, i) => (
                <motion.div key={i}
                  initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className={cn("flex items-center gap-3 p-2.5 rounded-lg border transition-colors",
                    frame.active ? "bg-blue-500/8 border-blue-500/20" : "bg-white/[0.02] border-white/[0.05] hover:border-white/10")}>
                  <div className={cn("shrink-0 text-[9px] font-mono w-4 text-center",
                    frame.active ? "text-blue-400 font-bold" : "text-white/20")}>{frame.index}</div>
                  <div className="flex-1 min-w-0">
                    <div className={cn("text-[11px] font-mono truncate", frame.active ? "text-white" : "text-white/50")}>{frame.fn}</div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <Code2 size={8} className="text-white/20 shrink-0" />
                      <span className="text-[9px] text-white/25 truncate">{frame.file}:{frame.line}</span>
                    </div>
                  </div>
                  {frame.active && (
                    <div className="shrink-0 flex items-center gap-1 px-1.5 py-0.5 rounded bg-yellow-400/10 border border-yellow-400/20">
                      <Zap size={8} className="text-yellow-400" />
                      <span className="text-[9px] text-yellow-300">current</span>
                    </div>
                  )}
                </motion.div>
              ))}
              {callStack.length > 0 && (
                <button onClick={() => send("get_call_stack")}
                  className="w-full py-1.5 text-[10px] text-white/25 hover:text-white/50 transition-colors flex items-center justify-center gap-1">
                  <RotateCcw size={9} /> Refresh from OMEGA
                </button>
              )}
            </motion.div>
          )}

          {/* ── Console Tab ── */}
          {tab === "console" && (
            <motion.div key="console" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="flex-1 overflow-y-auto p-2 space-y-0.5 font-mono">
              {consoleLines.map((line, i) => (
                <div key={i} className={cn("flex items-start gap-2.5 px-2 py-1 rounded text-[10px]",
                  line.level === "error" ? "bg-red-500/5 text-red-300" :
                  line.level === "warn" ? "bg-yellow-500/5 text-yellow-300" : "text-white/50")}>
                  <span className="text-white/20 shrink-0">{line.ts}</span>
                  {line.level === "error" && <AlertCircle size={9} className="text-red-400 mt-0.5 shrink-0" />}
                  <span className="flex-1 break-all">{line.msg}</span>
                </div>
              ))}
              <div ref={consoleEndRef} />
            </motion.div>
          )}

        </AnimatePresence>
      </div>

      {/* ── Status Bar ── */}
      <div className="flex items-center gap-3 px-3 py-1.5 border-t border-white/[0.06] bg-[#161b22] shrink-0">
        <div className={cn("flex items-center gap-1.5 text-[10px] font-medium", STATE_COLOR[dbgState])}>
          <div className={cn("w-1.5 h-1.5 rounded-full", {
            stopped: "bg-white/20", running: "bg-green-400 animate-pulse", paused: "bg-yellow-400",
          }[dbgState])} />
          {dbgState === "running" ? "Running" : dbgState === "paused" ? `Paused · ${callStack[0]?.fn}` : "Stopped"}
        </div>
        <div className="flex-1" />
        <span className="text-[10px] text-white/20">{projectId}</span>
        <span className="text-[10px] text-white/20">{breakpoints.filter(b => b.enabled).length} bp</span>
      </div>
    </motion.div>
  );
}

/* ── Sub-components ── */
function ControlBtn({ icon, label, color = "text-white/60", disabled, onClick }: {
  icon: React.ReactNode; label: string; color?: string; disabled?: boolean; onClick: () => void;
}) {
  return (
    <button onClick={onClick} disabled={disabled} title={label}
      className={cn("w-8 h-8 flex items-center justify-center rounded transition-colors",
        disabled ? "opacity-25 cursor-not-allowed text-white/20" : cn(color, "hover:bg-white/8 active:scale-95"))}>
      {icon}
    </button>
  );
}

function EmptyState({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 gap-3 text-center px-6">
      <div className="opacity-40">{icon}</div>
      <div className="text-[13px] text-white/40 font-medium">{title}</div>
      <div className="text-[11px] text-white/20 leading-relaxed">{desc}</div>
    </div>
  );
}
