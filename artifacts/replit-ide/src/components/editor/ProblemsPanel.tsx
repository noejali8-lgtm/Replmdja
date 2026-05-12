import { useState, useCallback } from "react";
import { AlertTriangle, XCircle, Info, RefreshCw, ChevronRight, Loader2, CheckCircle2, FileCode } from "lucide-react";

interface Diagnostic {
  file: string;
  line: number;
  col: number;
  severity: "error" | "warning" | "info";
  code: string;
  message: string;
}

interface Props {
  projectId?: number;
  onNavigate?: (file: string, line: number, col: number) => void;
}

type Filter = "all" | "error" | "warning" | "info";

export function ProblemsPanel({ projectId, onNavigate }: Props) {
  const [diagnostics, setDiagnostics] = useState<Diagnostic[]>([]);
  const [summary, setSummary] = useState<string>("");
  const [language, setLanguage] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<Filter>("all");
  const [checked, setChecked] = useState(false);

  const runCheck = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    setChecked(false);
    try {
      const r = await fetch(`/api/projects/${projectId}/diagnostics`, { method: "POST" });
      if (!r.ok) throw new Error("API error");
      const data = await r.json() as { diagnostics: Diagnostic[]; language: string; summary?: string };
      setDiagnostics(data.diagnostics ?? []);
      setLanguage(data.language ?? "");
      setSummary(data.summary ?? "");
      setChecked(true);
    } catch {
      setSummary("Failed to run diagnostics");
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  const filtered = diagnostics.filter(d => filter === "all" || d.severity === filter);
  const errors   = diagnostics.filter(d => d.severity === "error").length;
  const warnings = diagnostics.filter(d => d.severity === "warning").length;
  const infos    = diagnostics.filter(d => d.severity === "info").length;

  const grouped = filtered.reduce<Record<string, Diagnostic[]>>((acc, d) => {
    const key = d.file || "unknown";
    (acc[key] ??= []).push(d);
    return acc;
  }, {});

  const sevIcon = (s: Diagnostic["severity"]) => {
    if (s === "error")   return <XCircle      className="h-3 w-3 text-[#f85149] shrink-0" />;
    if (s === "warning") return <AlertTriangle className="h-3 w-3 text-[#d29922] shrink-0" />;
    return                      <Info          className="h-3 w-3 text-[#58a6ff] shrink-0" />;
  };

  const sevColor = (s: Diagnostic["severity"]) => {
    if (s === "error")   return "text-[#ffa198]";
    if (s === "warning") return "text-[#e3b341]";
    return "text-[#a5d6ff]";
  };

  return (
    <div className="flex flex-col h-full bg-[#0d1117] text-[#e6edf3]">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 bg-[#161b22] border-b border-[#21262d] shrink-0">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-3.5 w-3.5 text-[#8b949e]" />
          <span className="text-[11px] font-semibold text-[#8b949e] uppercase tracking-wider">Problems</span>
          {language && <span className="text-[10px] text-[#484f58]">({language})</span>}
        </div>
        <button
          onClick={runCheck}
          disabled={loading || !projectId}
          className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] bg-[#21262d] border border-[#30363d] text-[#8b949e] hover:text-[#e6edf3] hover:border-[#484f58] transition-colors disabled:opacity-40">
          {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
          Check
        </button>
      </div>

      {/* Filter tabs */}
      {checked && (
        <div className="flex items-center gap-1 px-2 py-1.5 border-b border-[#21262d] bg-[#0d1117] shrink-0">
          {(["all", "error", "warning", "info"] as Filter[]).map(f => {
            const count = f === "all" ? diagnostics.length : f === "error" ? errors : f === "warning" ? warnings : infos;
            return (
              <button key={f} onClick={() => setFilter(f)}
                className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] border transition-colors capitalize ${
                  filter === f ? "bg-[#1f6feb]/10 border-[#58a6ff]/30 text-[#58a6ff]" : "text-[#484f58] border-transparent hover:text-[#8b949e]"
                }`}>
                {f === "error" && <XCircle className="h-2.5 w-2.5 text-[#f85149]" />}
                {f === "warning" && <AlertTriangle className="h-2.5 w-2.5 text-[#d29922]" />}
                {f === "info" && <Info className="h-2.5 w-2.5 text-[#58a6ff]" />}
                {f} {count > 0 && <span className="text-[9px]">({count})</span>}
              </button>
            );
          })}
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {!projectId ? (
          <div className="flex flex-col items-center justify-center h-32 text-[#484f58] gap-2">
            <AlertTriangle className="h-8 w-8 opacity-20" />
            <p className="text-xs">Open a project to check for problems</p>
          </div>
        ) : !checked && !loading ? (
          <div className="flex flex-col items-center justify-center h-32 text-[#484f58] gap-3 p-4">
            <AlertTriangle className="h-8 w-8 opacity-20" />
            <p className="text-xs text-center">Click Check to scan for type errors and diagnostics</p>
            <button onClick={runCheck} className="px-3 py-1.5 rounded bg-[#238636] hover:bg-[#2ea043] text-white text-xs transition-colors">
              Run Diagnostics
            </button>
          </div>
        ) : loading ? (
          <div className="flex flex-col items-center justify-center h-32 text-[#484f58] gap-2">
            <Loader2 className="h-6 w-6 animate-spin text-[#58a6ff]" />
            <p className="text-xs">Analyzing…</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-[#484f58] gap-2">
            <CheckCircle2 className="h-8 w-8 text-[#3fb950] opacity-60" />
            <p className="text-xs text-[#3fb950]">
              {summary || (diagnostics.length === 0 ? "No problems found ✓" : `No ${filter} diagnostics`)}
            </p>
          </div>
        ) : (
          <div className="py-1">
            {Object.entries(grouped).map(([file, items]) => (
              <div key={file}>
                {/* File header */}
                <div className="flex items-center gap-2 px-3 py-1.5 bg-[#161b22] border-b border-[#21262d] sticky top-0">
                  <FileCode className="h-3 w-3 text-[#8b949e] shrink-0" />
                  <span className="text-[10px] font-mono text-[#8b949e] truncate flex-1">{file.split("/").pop()}</span>
                  <span className="text-[9px] text-[#484f58]">{items.length}</span>
                </div>
                {/* Diagnostic items */}
                {items.map((d, i) => (
                  <button
                    key={i}
                    onClick={() => onNavigate?.(d.file, d.line, d.col)}
                    className="w-full flex items-start gap-2 px-3 py-1.5 hover:bg-[#161b22] transition-colors text-left group border-b border-[#21262d]/50">
                    {sevIcon(d.severity)}
                    <div className="flex-1 min-w-0">
                      <p className={`text-[11px] leading-tight ${sevColor(d.severity)}`}>{d.message}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[9px] text-[#484f58] font-mono">Ln {d.line}, Col {d.col}</span>
                        {d.code && <span className="text-[9px] text-[#484f58]">{d.code}</span>}
                      </div>
                    </div>
                    <ChevronRight className="h-3 w-3 text-[#484f58] opacity-0 group-hover:opacity-100 shrink-0 mt-0.5" />
                  </button>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      {checked && (
        <div className="flex items-center gap-3 px-3 py-1.5 border-t border-[#21262d] bg-[#161b22] shrink-0 text-[10px]">
          <span className="text-[#f85149] flex items-center gap-1"><XCircle className="h-3 w-3" /> {errors} errors</span>
          <span className="text-[#d29922] flex items-center gap-1"><AlertTriangle className="h-3 w-3" /> {warnings} warnings</span>
          <span className="text-[#58a6ff] flex items-center gap-1"><Info className="h-3 w-3" /> {infos} info</span>
        </div>
      )}
    </div>
  );
}
