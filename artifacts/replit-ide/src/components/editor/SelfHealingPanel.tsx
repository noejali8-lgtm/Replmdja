import { useState, useCallback } from "react";
import { Sparkles, AlertTriangle, CheckCircle2, RefreshCw, Zap, Play, ChevronRight, Wrench } from "lucide-react";

interface ErrorDiagnostic {
  id: string;
  file: string;
  line: number;
  col: number;
  message: string;
  severity: "error" | "warning";
  code?: string;
  fixAvailable?: boolean;
  applied?: boolean;
}

const DEMO_ERRORS: ErrorDiagnostic[] = [
  {
    id: "e1", file: "src/App.tsx", line: 12, col: 8, severity: "error",
    message: "Property 'user' does not exist on type 'AppState'",
    code: "TS2339", fixAvailable: true,
  },
  {
    id: "e2", file: "src/utils/api.ts", line: 34, col: 3, severity: "error",
    message: "Cannot find name 'fetchUser'. Did you mean 'getUser'?",
    code: "TS2304", fixAvailable: true,
  },
  {
    id: "e3", file: "src/components/Header.tsx", line: 7, col: 15, severity: "warning",
    message: "React Hook useEffect has missing dependencies: 'userId'",
    code: "react-hooks/exhaustive-deps", fixAvailable: true,
  },
  {
    id: "e4", file: "src/pages/Dashboard.tsx", line: 89, col: 1, severity: "error",
    message: "Unreachable code detected",
    code: "TS7027", fixAvailable: true,
  },
];

const FIX_SUGGESTIONS: Record<string, string> = {
  "e1": "Add `user?: UserType` to the AppState interface definition.",
  "e2": "Import `getUser` from `./api` or rename the function call to `getUser`.",
  "e3": "Add `userId` to the dependency array: `useEffect(() => { … }, [userId])`.",
  "e4": "Remove the unreachable code block or move it before the return statement.",
};

interface SelfHealingPanelProps {
  currentFile?: string;
}

export function SelfHealingPanel({ currentFile }: SelfHealingPanelProps) {
  const [errors, setErrors] = useState<ErrorDiagnostic[]>(DEMO_ERRORS);
  const [scanning, setScanning] = useState(false);
  const [scanned, setScanned] = useState(true);
  const [fixing, setFixing] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const runScan = useCallback(async () => {
    setScanning(true);
    setScanned(false);
    await new Promise(r => setTimeout(r, 1500));
    setErrors(DEMO_ERRORS.map(e => ({ ...e, applied: false })));
    setScanned(true);
    setScanning(false);
  }, []);

  const applyFix = useCallback(async (id: string) => {
    setFixing(id);
    await new Promise(r => setTimeout(r, 1200));
    setErrors(prev => prev.map(e => e.id === id ? { ...e, applied: true } : e));
    setFixing(null);
  }, []);

  const fixAll = useCallback(async () => {
    const fixable = errors.filter(e => e.fixAvailable && !e.applied);
    for (const e of fixable) {
      await applyFix(e.id);
      await new Promise(r => setTimeout(r, 200));
    }
  }, [errors, applyFix]);

  const toggleExpanded = (id: string) => {
    setExpanded(prev => {
      const s = new Set(prev);
      s.has(id) ? s.delete(id) : s.add(id);
      return s;
    });
  };

  const pending = errors.filter(e => !e.applied);
  const fixed = errors.filter(e => e.applied);
  const errorCount = pending.filter(e => e.severity === "error").length;
  const warnCount = pending.filter(e => e.severity === "warning").length;

  return (
    <div className="flex flex-col h-full bg-[#0d1117] text-[#e6edf3]">
      <div className="flex items-center gap-2 px-3 py-2 border-b border-[#21262d] bg-[#161b22] shrink-0">
        <Zap className="h-3.5 w-3.5 text-[#f2cc60]" />
        <span className="text-[10px] font-semibold text-[#8b949e] uppercase tracking-widest flex-1">Self-Healing AI</span>
        <button onClick={runScan} disabled={scanning}
          className="h-5 w-5 flex items-center justify-center rounded text-[#484f58] hover:text-[#8b949e] hover:bg-[#21262d] transition-colors disabled:opacity-50">
          <RefreshCw className={`h-3 w-3 ${scanning ? "animate-spin" : ""}`} />
        </button>
      </div>

      {scanning ? (
        <div className="flex flex-col items-center justify-center flex-1 gap-3 p-6">
          <div className="relative h-12 w-12">
            <div className="absolute inset-0 rounded-full border-2 border-[#30363d]" />
            <div className="absolute inset-0 rounded-full border-2 border-t-[#f2cc60] animate-spin" />
            <Zap className="absolute inset-0 m-auto h-5 w-5 text-[#f2cc60]" />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-[#e6edf3]">Scanning…</p>
            <p className="text-xs text-[#8b949e] mt-1">AI analyzing code quality</p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col flex-1 overflow-hidden">
          {/* Summary */}
          <div className="px-3 py-2 border-b border-[#21262d] shrink-0">
            <div className="flex items-center gap-3 mb-2">
              {errorCount > 0 && (
                <span className="flex items-center gap-1 text-[11px] text-[#f85149]">
                  <AlertTriangle className="h-3 w-3" />{errorCount} error{errorCount !== 1 ? "s" : ""}
                </span>
              )}
              {warnCount > 0 && (
                <span className="flex items-center gap-1 text-[11px] text-[#d29922]">
                  <AlertTriangle className="h-3 w-3" />{warnCount} warning{warnCount !== 1 ? "s" : ""}
                </span>
              )}
              {fixed.length > 0 && (
                <span className="flex items-center gap-1 text-[11px] text-[#3fb950]">
                  <CheckCircle2 className="h-3 w-3" />{fixed.length} fixed
                </span>
              )}
            </div>
            {pending.length > 0 && (
              <button onClick={fixAll}
                className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded bg-[#f2cc60]/10 hover:bg-[#f2cc60]/20 text-[#f2cc60] text-xs border border-[#f2cc60]/20 transition-colors">
                <Sparkles className="h-3 w-3" /> Fix all with AI ({pending.filter(e => e.fixAvailable).length} issues)
              </button>
            )}
          </div>

          {/* Issue list */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {pending.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 gap-2 text-[#484f58]">
                <CheckCircle2 className="h-8 w-8 text-[#3fb950] opacity-50" />
                <p className="text-xs text-center">All issues resolved! ✨</p>
              </div>
            ) : (
              pending.map(err => {
                const isOpen = expanded.has(err.id);
                return (
                  <div key={err.id}
                    className={`border rounded-lg overflow-hidden ${err.severity === "error" ? "border-[#f85149]/20 bg-[#f85149]/5" : "border-[#d29922]/20 bg-[#d29922]/5"}`}>
                    <button className="w-full flex items-center gap-2 px-2.5 py-2 text-left"
                      onClick={() => toggleExpanded(err.id)}>
                      <AlertTriangle className={`h-3 w-3 shrink-0 ${err.severity === "error" ? "text-[#f85149]" : "text-[#d29922]"}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] text-[#e6edf3] truncate">{err.message}</p>
                        <p className="text-[9px] text-[#484f58]">{err.file}:{err.line}:{err.col} {err.code && `[${err.code}]`}</p>
                      </div>
                      {isOpen ? <ChevronRight className="h-3 w-3 text-[#484f58] rotate-90 shrink-0" /> : <ChevronRight className="h-3 w-3 text-[#484f58] shrink-0" />}
                    </button>
                    {isOpen && FIX_SUGGESTIONS[err.id] && (
                      <div className="px-3 pb-2.5 border-t border-[#21262d]/40">
                        <div className="mt-2 p-2 rounded bg-[#161b22] border border-[#21262d]">
                          <div className="flex items-start gap-1.5 mb-2">
                            <Wrench className="h-3 w-3 text-[#8b949e] shrink-0 mt-0.5" />
                            <p className="text-[10px] text-[#8b949e]">{FIX_SUGGESTIONS[err.id]}</p>
                          </div>
                          <button onClick={() => applyFix(err.id)} disabled={fixing === err.id}
                            className="flex items-center gap-1.5 text-[10px] px-2 py-1 rounded bg-[#238636]/20 hover:bg-[#238636]/30 text-[#3fb950] border border-[#238636]/20 transition-colors disabled:opacity-50">
                            {fixing === err.id ? (
                              <><div className="h-2.5 w-2.5 border border-[#3fb950]/30 border-t-[#3fb950] rounded-full animate-spin" />Applying…</>
                            ) : (
                              <><Sparkles className="h-2.5 w-2.5" />Apply fix</>
                            )}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}

            {fixed.length > 0 && (
              <div className="mt-2 pt-2 border-t border-[#21262d]">
                <p className="text-[9px] text-[#484f58] px-1 mb-1 uppercase tracking-widest">Fixed</p>
                {fixed.map(err => (
                  <div key={err.id} className="flex items-center gap-2 px-2.5 py-1.5 rounded opacity-50">
                    <CheckCircle2 className="h-3 w-3 text-[#3fb950] shrink-0" />
                    <p className="text-[10px] text-[#8b949e] truncate flex-1 line-through">{err.message}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
