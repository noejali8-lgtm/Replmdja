import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, Bug, Play, SkipForward, CornerDownRight, ArrowUpToLine,
  Square, RotateCcw, Circle, Trash2, Eye, EyeOff,
  ChevronRight, ChevronDown, AlertCircle, Code2,
  Layers, List, Activity, Zap,
} from "lucide-react";

function cn(...classes: (string | undefined | false | null)[]) {
  return classes.filter(Boolean).join(" ");
}

export interface Breakpoint {
  id: string;
  file: string;
  line: number;
  condition?: string;
  enabled: boolean;
  hitCount?: number;
}

export interface WatchedVariable {
  id: string;
  name: string;
  value?: string;
  type?: string;
  expanded?: boolean;
}

export interface CallFrame {
  index: number;
  fn: string;
  file: string;
  line: number;
  active?: boolean;
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

type DebugTab = "breakpoints" | "variables" | "callstack" | "console";

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

export function DebuggerPanel({
  onClose,
  projectId = "workspace",
  onSendDebugCommand,
  breakpoints: bpProp,
  variables: varProp,
  callStack: stackProp,
  isRunning = false,
  isPaused = true,
}: DebuggerPanelProps) {
  const [tab, setTab] = useState<DebugTab>("breakpoints");
  const [breakpoints, setBreakpoints] = useState<Breakpoint[]>(bpProp ?? DEMO_BREAKPOINTS);
  const [variables, setVariables] = useState<WatchedVariable[]>(varProp ?? DEMO_VARS);
  const [callStack] = useState<CallFrame[]>(stackProp ?? DEMO_STACK);
  const [newWatch, setNewWatch] = useState("");
  const [expandedVars, setExpandedVars] = useState<Set<string>>(new Set());
  const [dbgState, setDbgState] = useState<"stopped" | "running" | "paused">(isPaused ? "paused" : isRunning ? "running" : "stopped");
  const consoleEndRef = useRef<HTMLDivElement>(null);
  const [consoleLines, setConsoleLines] = useState(DEMO_CONSOLE);

  useEffect(() => { if (bpProp) setBreakpoints(bpProp); }, [bpProp]);
  useEffect(() => { if (varProp) setVariables(varProp); }, [varProp]);

  const send = (action: string, args?: Record<string, unknown>) => {
    onSendDebugCommand?.(action, { projectId, ...args });
  };

  function toggleBp(id: string) {
    setBreakpoints(prev => prev.map(b => b.id === id ? { ...b, enabled: !b.enabled } : b));
  }

  function deleteBp(id: string) {
    setBreakpoints(prev => prev.filter(b => b.id !== id));
    send("remove_breakpoint");
  }

  function addWatch() {
    const name = newWatch.trim();
    if (!name) return;
    setVariables(prev => [...prev, { id: `v_${Date.now()}`, name, value: "(watching…)", type: "unknown" }]);
    setNewWatch("");
    send("watch", { variable: name });
  }

  function removeWatch(id: string) {
    setVariables(prev => prev.filter(v => v.id !== id));
  }

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
    setConsoleLines(prev => [...prev, { level: "log", msg: "🔄 Restarting debug session…", ts: new Date().toTimeString().slice(0, 8) }]);
    send("continue");
    setTimeout(() => setDbgState("paused"), 800);
  }

  const STATE_COLOR = { stopped: "text-white/30", running: "text-green-400", paused: "text-yellow-400" };
  const STATE_LABEL = { stopped: "Stopped", running: "Running", paused: "Paused at breakpoint" };

  const tabs: { id: DebugTab; label: string; icon: React.ReactNode; count?: number }[] = [
    { id: "breakpoints", label: "Breakpoints", icon: <Circle size={11} className="fill-red-400 text-red-400" />, count: breakpoints.filter(b => b.enabled).length },
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
              <span className="text-[10px] text-white/25">· {callStack[0]?.file ?? ""}:{callStack[0]?.line ?? ""}</span>
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
            className={cn("flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium border-b-2 transition-colors shrink-0 whitespace-nowrap",
              tab === t.id ? "border-red-400 text-red-300" : "border-transparent text-white/40 hover:text-white/70")}>
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
      <div className="flex-1 overflow-y-auto min-h-0">
        <AnimatePresence mode="wait">
          {/* ── Breakpoints Tab ── */}
          {tab === "breakpoints" && (
            <motion.div key="bp" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="p-3 space-y-2">
              {breakpoints.length === 0 ? (
                <EmptyState icon={<Circle size={22} className="text-white/15" />}
                  title="No breakpoints" desc="Use OMEGA's visual_debugger tool or click in the editor gutter to set breakpoints" />
              ) : breakpoints.map(bp => (
                <motion.div key={bp.id} layout
                  className={cn("flex items-start gap-2.5 p-2.5 rounded-lg border transition-colors",
                    bp.enabled
                      ? "bg-red-500/5 border-red-500/20"
                      : "bg-white/[0.02] border-white/[0.06]")}>
                  <button onClick={() => toggleBp(bp.id)} className="mt-0.5 shrink-0">
                    <Circle size={12} className={cn(bp.enabled ? "fill-red-400 text-red-400" : "text-white/20")} />
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className={cn("text-[11px] font-mono", bp.enabled ? "text-white" : "text-white/35")}>
                        {bp.file}
                      </span>
                      <span className={cn("text-[11px] font-mono", bp.enabled ? "text-white/50" : "text-white/20")}>
                        :{bp.line}
                      </span>
                      {bp.hitCount !== undefined && bp.hitCount > 0 && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-orange-500/15 text-orange-300 border border-orange-500/20">
                          ×{bp.hitCount}
                        </span>
                      )}
                    </div>
                    {bp.condition && (
                      <div className="mt-0.5 flex items-center gap-1">
                        <span className="text-[9px] text-white/30">if</span>
                        <code className="text-[9px] font-mono text-purple-300/70 bg-purple-500/5 px-1 rounded">
                          {bp.condition}
                        </code>
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
                <Circle size={10} />
                Add breakpoint via OMEGA
              </button>
            </motion.div>
          )}

          {/* ── Variables/Watchers Tab ── */}
          {tab === "variables" && (
            <motion.div key="vars" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="p-3 space-y-2">
              {/* Add watch input */}
              <div className="flex gap-1.5 mb-3">
                <input
                  value={newWatch} onChange={e => setNewWatch(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && addWatch()}
                  placeholder="Watch expression…"
                  className="flex-1 bg-white/[0.04] border border-white/[0.08] rounded-lg px-2.5 py-1.5 text-[11px] text-white placeholder-white/25 focus:outline-none focus:border-blue-500/50 font-mono"
                />
                <button onClick={addWatch}
                  className="px-2.5 py-1.5 rounded-lg bg-blue-500/15 border border-blue-500/25 text-[11px] text-blue-300 hover:bg-blue-500/25 transition-colors flex items-center gap-1">
                  <Eye size={10} />
                  Watch
                </button>
              </div>

              {variables.length === 0 ? (
                <EmptyState icon={<Eye size={22} className="text-white/15" />}
                  title="No watched variables" desc="Type a variable name above to watch it, or ask OMEGA to inspect a variable" />
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
                        v.type === "number" ? "text-green-300" :
                        v.type === "boolean" ? "text-orange-300" :
                        v.type === "string" ? "text-yellow-300" : "text-white/70")}>
                        {v.value ?? "(undefined)"}
                      </span>
                      {v.type && (
                        <span className="text-[9px] text-white/20 shrink-0 font-mono">{v.type}</span>
                      )}
                      <button onClick={() => removeWatch(v.id)}
                        className="shrink-0 w-4 h-4 flex items-center justify-center text-white/15 hover:text-red-400 rounded transition-colors">
                        <EyeOff size={9} />
                      </button>
                    </div>
                    {isObj && isExpanded && (
                      <div className="border-t border-white/[0.06] px-4 py-2 bg-white/[0.015]">
                        <code className="text-[10px] font-mono text-white/50 whitespace-pre-wrap break-all">
                          {v.value}
                        </code>
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
              className="p-3 space-y-1">
              {dbgState === "running" ? (
                <EmptyState icon={<List size={22} className="text-white/15" />}
                  title="Call stack unavailable" desc="Pause execution to inspect the call stack" />
              ) : callStack.map((frame, i) => (
                <motion.div key={i}
                  initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className={cn("flex items-center gap-3 p-2.5 rounded-lg border transition-colors",
                    frame.active
                      ? "bg-blue-500/8 border-blue-500/20"
                      : "bg-white/[0.02] border-white/[0.05] hover:border-white/10")}>
                  <div className={cn("shrink-0 text-[9px] font-mono w-4 text-center rounded",
                    frame.active ? "text-blue-400 font-bold" : "text-white/20")}>
                    {frame.index}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className={cn("text-[11px] font-mono truncate", frame.active ? "text-white" : "text-white/50")}>
                      {frame.fn}
                    </div>
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
                  <RotateCcw size={9} />
                  Refresh from OMEGA
                </button>
              )}
            </motion.div>
          )}

          {/* ── Console Tab ── */}
          {tab === "console" && (
            <motion.div key="console" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="p-2 space-y-0.5 font-mono">
              {consoleLines.map((line, i) => (
                <div key={i} className={cn("flex items-start gap-2.5 px-2 py-1 rounded text-[10px]",
                  line.level === "error" ? "bg-red-500/5 text-red-300" :
                  line.level === "warn" ? "bg-yellow-500/5 text-yellow-300" :
                  "text-white/50")}>
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
            stopped: "bg-white/20",
            running: "bg-green-400 animate-pulse",
            paused: "bg-yellow-400",
          }[dbgState])} />
          {dbgState === "running" ? "Running" : dbgState === "paused" ? `Paused · ${callStack[0]?.fn}` : "Stopped"}
        </div>
        <div className="flex-1" />
        <span className="text-[10px] text-white/20">{projectId}</span>
        <span className="text-[10px] text-white/20">{breakpoints.filter(b => b.enabled).length} breakpoints active</span>
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
