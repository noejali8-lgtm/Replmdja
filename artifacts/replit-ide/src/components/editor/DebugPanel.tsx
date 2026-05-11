import { useState } from "react";
import { Bug, Play, StepForward, CornerDownRight, CornerUpLeft, Square, Plus, X, Eye, ChevronRight, ChevronDown, Circle } from "lucide-react";

interface Breakpoint { id: string; file: string; line: number; enabled: boolean; condition?: string }
interface WatchVar   { id: string; expr: string; value?: string; type?: string; error?: boolean }
interface StackFrame { id: string; name: string; file: string; line: number; isActive?: boolean }
interface Variable   { name: string; value: string; type: string; children?: Variable[] }

const DEMO_VARS: Variable[] = [
  { name: "count",   value: "42",              type: "number" },
  { name: "message", value: '"Hello, World!"', type: "string" },
  { name: "user",    value: "{ id: 1, … }",    type: "object", children: [
    { name: "id",   value: "1",         type: "number" },
    { name: "name", value: '"Alice"',   type: "string" },
    { name: "role", value: '"admin"',   type: "string" },
  ]},
  { name: "items",   value: "[3 items]",        type: "Array", children: [
    { name: "0", value: '"react"',   type: "string" },
    { name: "1", value: '"vite"',    type: "string" },
    { name: "2", value: '"drizzle"', type: "string" },
  ]},
];

const DEMO_STACK: StackFrame[] = [
  { id: "1", name: "App()",           file: "App.tsx",    line: 12,  isActive: true },
  { id: "2", name: "useState hook",   file: "react.js",   line: 1648 },
  { id: "3", name: "renderWithHooks", file: "react-dom.js", line: 14985 },
];

function VarTree({ vars, depth = 0 }: { vars: Variable[]; depth?: number }) {
  const [open, setOpen] = useState<Set<string>>(new Set());
  return (
    <div className={depth > 0 ? "pl-4 border-l border-[#21262d]" : ""}>
      {vars.map((v) => {
        const hasChildren = v.children && v.children.length > 0;
        const isOpen = open.has(v.name);
        return (
          <div key={v.name}>
            <div
              className="flex items-center gap-1 px-2 py-0.5 hover:bg-[#161b22] rounded cursor-pointer text-[11px]"
              onClick={() => { if (hasChildren) setOpen(p => { const s = new Set(p); s.has(v.name) ? s.delete(v.name) : s.add(v.name); return s; }); }}>
              {hasChildren
                ? isOpen ? <ChevronDown className="h-3 w-3 text-[#484f58] shrink-0" /> : <ChevronRight className="h-3 w-3 text-[#484f58] shrink-0" />
                : <span className="w-3 shrink-0" />}
              <span className="text-[#9ecbff]">{v.name}</span>
              <span className="text-[#484f58] mx-1">=</span>
              <span className={v.type === "string" ? "text-[#ffa657]" : v.type === "number" ? "text-[#79c0ff]" : "text-[#e6edf3]"}>{v.value}</span>
              <span className="ml-auto text-[#484f58] text-[9px]">{v.type}</span>
            </div>
            {hasChildren && isOpen && v.children && <VarTree vars={v.children} depth={depth + 1} />}
          </div>
        );
      })}
    </div>
  );
}

interface DebugPanelProps {
  currentFile?: string;
  currentLine?: number;
  breakpoints?: Breakpoint[];
  onAddBreakpoint?: (file: string, line: number) => void;
  onRemoveBreakpoint?: (id: string) => void;
}

export function DebugPanel({ currentFile = "App.tsx" }: DebugPanelProps) {
  const [isRunning, setIsRunning]         = useState(false);
  const [isPaused, setIsPaused]           = useState(false);
  const [section, setSection]             = useState<"vars"|"watch"|"stack"|"bp">("vars");
  const [breakpoints, setBreakpoints]     = useState<Breakpoint[]>([
    { id: "1", file: "App.tsx", line: 12, enabled: true },
    { id: "2", file: "App.tsx", line: 24, enabled: false, condition: "count > 5" },
  ]);
  const [watchVars, setWatchVars]         = useState<WatchVar[]>([
    { id: "1", expr: "count", value: "42", type: "number" },
    { id: "2", expr: "user.name", value: '"Alice"', type: "string" },
  ]);
  const [newWatch, setNewWatch]           = useState("");
  const [newBpLine, setNewBpLine]         = useState("");

  const startDebug = () => { setIsRunning(true); setIsPaused(true); };
  const stop = () => { setIsRunning(false); setIsPaused(false); };

  const addWatch = () => {
    if (!newWatch.trim()) return;
    setWatchVars(p => [...p, { id: Date.now().toString(), expr: newWatch.trim(), value: "undefined", type: "undefined" }]);
    setNewWatch("");
  };

  const addBp = () => {
    const ln = parseInt(newBpLine);
    if (!ln) return;
    setBreakpoints(p => [...p, { id: Date.now().toString(), file: currentFile, line: ln, enabled: true }]);
    setNewBpLine("");
  };

  return (
    <div className="flex flex-col h-full bg-[#0d1117] text-[#e6edf3]">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-[#21262d] bg-[#161b22] shrink-0">
        <Bug className="h-4 w-4 text-[#f85149]" />
        <span className="text-xs font-semibold flex-1">Debugger</span>
        {isPaused && <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#d29922]/20 text-[#d29922] border border-[#d29922]/20">Paused at line {DEMO_STACK[0].line}</span>}
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-0.5 px-2 py-1.5 border-b border-[#21262d] shrink-0">
        {!isRunning ? (
          <button onClick={startDebug}
            className="flex items-center gap-1 text-[11px] px-2 py-1 rounded bg-[#238636] hover:bg-[#2ea043] text-white transition-colors">
            <Play className="h-3 w-3" /> Start Debugging
          </button>
        ) : (
          <>
            <button title="Continue (F5)" onClick={() => setIsPaused(false)}
              className="h-7 w-7 flex items-center justify-center rounded hover:bg-[#21262d] text-[#3fb950] transition-colors">
              <Play className="h-3.5 w-3.5" />
            </button>
            <button title="Step Over (F10)"
              className="h-7 w-7 flex items-center justify-center rounded hover:bg-[#21262d] text-[#8b949e] hover:text-[#e6edf3] transition-colors">
              <StepForward className="h-3.5 w-3.5" />
            </button>
            <button title="Step Into (F11)"
              className="h-7 w-7 flex items-center justify-center rounded hover:bg-[#21262d] text-[#8b949e] hover:text-[#e6edf3] transition-colors">
              <CornerDownRight className="h-3.5 w-3.5" />
            </button>
            <button title="Step Out (⇧F11)"
              className="h-7 w-7 flex items-center justify-center rounded hover:bg-[#21262d] text-[#8b949e] hover:text-[#e6edf3] transition-colors">
              <CornerUpLeft className="h-3.5 w-3.5" />
            </button>
            <button title="Stop" onClick={stop}
              className="h-7 w-7 flex items-center justify-center rounded hover:bg-[#21262d] text-[#f85149] transition-colors">
              <Square className="h-3.5 w-3.5" />
            </button>
          </>
        )}
      </div>

      {/* Section tabs */}
      <div className="flex items-center border-b border-[#21262d] px-1 shrink-0">
        {(["vars","watch","stack","bp"] as const).map(s => (
          <button key={s} onClick={() => setSection(s)}
            className={`px-3 py-1.5 text-[10px] font-medium transition-colors capitalize ${section === s ? "text-[#e6edf3] border-b-2 border-[#58a6ff]" : "text-[#8b949e] hover:text-[#e6edf3]"}`}>
            {s === "bp" ? "Breakpoints" : s === "vars" ? "Variables" : s === "stack" ? "Call Stack" : "Watch"}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto">
        {section === "vars" && (
          <div className="py-1">
            {isPaused ? <VarTree vars={DEMO_VARS} /> : (
              <div className="flex flex-col items-center justify-center py-12 text-[#484f58] text-xs text-center gap-2">
                <Bug className="h-8 w-8 opacity-20" />
                <p>Start debugging to inspect variables</p>
              </div>
            )}
          </div>
        )}

        {section === "watch" && (
          <div className="p-2 space-y-1">
            {watchVars.map(w => (
              <div key={w.id} className="flex items-center gap-2 px-2 py-1 rounded hover:bg-[#161b22] text-[11px] group">
                <Eye className="h-3 w-3 text-[#484f58] shrink-0" />
                <span className="text-[#9ecbff] flex-1">{w.expr}</span>
                <span className="text-[#ffa657]">{w.value ?? "…"}</span>
                <button onClick={() => setWatchVars(p => p.filter(v => v.id !== w.id))}
                  className="opacity-0 group-hover:opacity-100 hover:text-[#f85149] transition-all">
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
            <div className="flex items-center gap-1 mt-2">
              <input value={newWatch} onChange={e => setNewWatch(e.target.value)}
                onKeyDown={e => e.key === "Enter" && addWatch()}
                placeholder="Watch expression…"
                className="flex-1 bg-[#21262d] border border-[#30363d] rounded px-2 py-1 text-[11px] text-[#e6edf3] placeholder-[#484f58] outline-none" />
              <button onClick={addWatch} className="h-6 w-6 flex items-center justify-center rounded bg-[#1f6feb] hover:bg-[#388bfd] text-white transition-colors">
                <Plus className="h-3 w-3" />
              </button>
            </div>
          </div>
        )}

        {section === "stack" && (
          <div className="py-1">
            {isPaused ? DEMO_STACK.map(f => (
              <div key={f.id} className={`flex items-start gap-2 px-3 py-2 text-[11px] ${f.isActive ? "bg-[#1f6feb]/10 border-l-2 border-[#58a6ff]" : "hover:bg-[#161b22]"}`}>
                {f.isActive && <Circle className="h-2 w-2 fill-[#58a6ff] text-[#58a6ff] mt-0.5 shrink-0" />}
                <div className="flex-1 min-w-0">
                  <p className={`font-medium ${f.isActive ? "text-[#58a6ff]" : "text-[#e6edf3]"}`}>{f.name}</p>
                  <p className="text-[#484f58] text-[10px] truncate">{f.file}:{f.line}</p>
                </div>
              </div>
            )) : (
              <div className="flex flex-col items-center justify-center py-12 text-[#484f58] text-xs text-center gap-2">
                <p>No active call stack</p>
              </div>
            )}
          </div>
        )}

        {section === "bp" && (
          <div className="p-2 space-y-1">
            {breakpoints.map(bp => (
              <div key={bp.id} className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-[#161b22] text-[11px] group">
                <button onClick={() => setBreakpoints(p => p.map(b => b.id === bp.id ? { ...b, enabled: !b.enabled } : b))}>
                  <Circle className={`h-3 w-3 ${bp.enabled ? "fill-[#f85149] text-[#f85149]" : "text-[#484f58]"}`} />
                </button>
                <div className="flex-1 min-w-0">
                  <span className="text-[#e6edf3]">{bp.file}</span>
                  <span className="text-[#484f58] mx-1">:</span>
                  <span className="text-[#79c0ff]">{bp.line}</span>
                  {bp.condition && <span className="text-[#d29922] ml-1 text-[9px]">if {bp.condition}</span>}
                </div>
                <button onClick={() => setBreakpoints(p => p.filter(b => b.id !== bp.id))}
                  className="opacity-0 group-hover:opacity-100 hover:text-[#f85149] transition-all">
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
            <div className="flex items-center gap-1 mt-2">
              <input value={newBpLine} onChange={e => setNewBpLine(e.target.value)}
                onKeyDown={e => e.key === "Enter" && addBp()}
                placeholder="Line number…"
                type="number"
                className="w-24 bg-[#21262d] border border-[#30363d] rounded px-2 py-1 text-[11px] text-[#e6edf3] placeholder-[#484f58] outline-none" />
              <span className="text-[10px] text-[#484f58]">in {currentFile}</span>
              <button onClick={addBp} className="ml-auto h-6 w-6 flex items-center justify-center rounded bg-[#1f6feb] hover:bg-[#388bfd] text-white transition-colors">
                <Plus className="h-3 w-3" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
