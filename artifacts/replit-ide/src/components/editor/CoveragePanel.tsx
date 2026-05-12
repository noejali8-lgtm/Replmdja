import { useState, useRef, useCallback } from "react";
import { PieChart, Play, Loader2, AlertCircle, CheckCircle, ChevronRight } from "lucide-react";

interface CoverageFile {
  file: string;
  stmts?: number;
  branch?: number;
  funcs?: number;
  lines?: number;
  cover?: number;
  miss?: number;
}

interface Props {
  projectId?: number;
}

function CoverageBar({ pct, size = "md" }: { pct: number; size?: "sm" | "md" }) {
  const color = pct >= 80 ? "#3fb950" : pct >= 50 ? "#d29922" : "#f85149";
  return (
    <div className={`w-full bg-[#21262d] rounded overflow-hidden ${size === "sm" ? "h-1" : "h-1.5"}`}>
      <div className="h-full rounded transition-all" style={{ width: `${Math.min(pct, 100)}%`, backgroundColor: color }} />
    </div>
  );
}

function pctColor(pct: number) {
  return pct >= 80 ? "text-[#3fb950]" : pct >= 50 ? "text-[#d29922]" : "text-[#ff7b72]";
}

export function CoveragePanel({ projectId }: Props) {
  const [running, setRunning] = useState(false);
  const [files, setFiles] = useState<CoverageFile[]>([]);
  const [totalCover, setTotalCover] = useState<number | null>(null);
  const [output, setOutput] = useState<{ text: string; type: string }[]>([]);
  const [done, setDone] = useState(false);
  const [exitCode, setExitCode] = useState<number | null>(null);
  const abortRef = useRef<(() => void) | null>(null);
  const outRef = useRef<HTMLDivElement>(null);

  const runCoverage = useCallback(async () => {
    if (!projectId) {
      setOutput([{ text: "⚠ Open a real project to run coverage.", type: "warn" }]);
      return;
    }
    setRunning(true);
    setDone(false);
    setFiles([]);
    setTotalCover(null);
    setExitCode(null);
    setOutput([]);

    const ctrl = new AbortController();
    abortRef.current = () => ctrl.abort();

    try {
      const resp = await fetch(`/api/projects/${projectId}/coverage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        signal: ctrl.signal,
      });

      if (!resp.body) throw new Error("No SSE body");
      const reader = resp.body.getReader();
      const dec = new TextDecoder();
      let buf = "";

      while (true) {
        const { done: d, value } = await reader.read();
        if (d) break;
        buf += dec.decode(value, { stream: true });
        const lines = buf.split("\n");
        buf = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.startsWith("data:")) continue;
          try {
            const ev = JSON.parse(line.slice(5).trim()) as Record<string, unknown>;
            if (ev.type === "done") {
              setFiles((ev.files as CoverageFile[]) ?? []);
              setTotalCover(ev.totalCover as number ?? null);
              setExitCode(Number(ev.code ?? 0));
              setDone(true);
            } else if (ev.data) {
              setOutput(p => [...p, { text: String(ev.data), type: String(ev.type) }]);
              setTimeout(() => outRef.current?.scrollTo(0, outRef.current.scrollHeight), 0);
            }
          } catch { /* */ }
        }
      }
    } catch (e) {
      if ((e as Error).name !== "AbortError") {
        setOutput(p => [...p, { text: `Error: ${(e as Error).message}`, type: "error" }]);
      }
    } finally {
      setRunning(false);
    }
  }, [projectId]);

  const pyFiles = files.filter(f => f.cover !== undefined);
  const jsFiles = files.filter(f => f.lines !== undefined);
  const displayFiles = pyFiles.length > 0 ? pyFiles : jsFiles;

  return (
    <div className="flex flex-col h-full bg-[#0d1117] text-[#e6edf3] overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-[#21262d] bg-[#161b22] shrink-0">
        <PieChart className="h-4 w-4 text-[#f2cc60]" />
        <span className="text-xs font-semibold flex-1">Code Coverage</span>
        {totalCover !== null && (
          <span className={`text-sm font-bold font-mono ${pctColor(totalCover)}`}>{totalCover}%</span>
        )}
      </div>

      {/* Run button */}
      <div className="px-3 py-2 border-b border-[#21262d] shrink-0">
        <button
          onClick={runCoverage}
          disabled={running}
          className="w-full flex items-center justify-center gap-2 py-1.5 rounded bg-[#238636] hover:bg-[#2ea043] text-white text-xs font-medium transition-colors disabled:opacity-50"
        >
          {running ? <><Loader2 className="h-3 w-3 animate-spin" /> Running coverage…</> : <><Play className="h-3 w-3" /> Run Coverage</>}
        </button>
      </div>

      {/* Total coverage ring-like summary */}
      {totalCover !== null && (
        <div className="px-3 py-3 border-b border-[#21262d] shrink-0">
          <div className="flex items-center gap-3">
            <div className="relative h-14 w-14 shrink-0">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                <circle cx="18" cy="18" r="15.9155" fill="none" stroke="#21262d" strokeWidth="3" />
                <circle
                  cx="18" cy="18" r="15.9155" fill="none"
                  stroke={totalCover >= 80 ? "#3fb950" : totalCover >= 50 ? "#d29922" : "#f85149"}
                  strokeWidth="3"
                  strokeDasharray={`${totalCover} ${100 - totalCover}`}
                  strokeLinecap="round"
                />
              </svg>
              <span className={`absolute inset-0 flex items-center justify-center text-xs font-bold ${pctColor(totalCover)}`}>
                {totalCover}%
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium mb-1">
                {totalCover >= 80 ? "✓ Good coverage" : totalCover >= 50 ? "⚠ Moderate coverage" : "✗ Low coverage"}
              </p>
              <p className="text-[10px] text-[#8b949e]">{displayFiles.length} files analyzed</p>
              <CoverageBar pct={totalCover} />
            </div>
          </div>
        </div>
      )}

      {/* Per-file results */}
      {displayFiles.length > 0 && (
        <div className="flex-1 overflow-y-auto">
          <div className="px-3 py-1.5 border-b border-[#21262d]">
            <p className="text-[9px] font-semibold text-[#8b949e] uppercase tracking-widest">Per-file Coverage</p>
          </div>
          {displayFiles.map((f, i) => {
            const pct = f.cover ?? f.lines ?? 0;
            return (
              <div key={i} className="px-3 py-2 border-b border-[#21262d]/50 hover:bg-[#161b22] transition-colors">
                <div className="flex items-center gap-2 mb-1">
                  <ChevronRight className="h-2.5 w-2.5 text-[#484f58] shrink-0" />
                  <span className="text-[11px] font-mono text-[#e6edf3] truncate flex-1">{f.file}</span>
                  <span className={`text-[10px] font-bold font-mono shrink-0 ${pctColor(pct)}`}>{pct}%</span>
                </div>
                <div className="ml-4">
                  <CoverageBar pct={pct} size="sm" />
                  {(f.stmts !== undefined || f.branch !== undefined || f.funcs !== undefined) && (
                    <div className="flex gap-3 mt-1">
                      {f.stmts !== undefined && <span className="text-[9px] text-[#484f58]">Stmts: {f.stmts}%</span>}
                      {f.branch !== undefined && <span className="text-[9px] text-[#484f58]">Branch: {f.branch}%</span>}
                      {f.funcs !== undefined && <span className="text-[9px] text-[#484f58]">Funcs: {f.funcs}%</span>}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Raw output */}
      {output.length > 0 && displayFiles.length === 0 && (
        <div ref={outRef} className="flex-1 overflow-y-auto p-3 font-mono text-[11px] space-y-0.5">
          {output.map((line, i) => (
            <div key={i} className={`whitespace-pre-wrap break-all ${
              line.type === "error" ? "text-[#ff7b72]" :
              line.type === "stderr" ? "text-[#d29922]" :
              line.type === "info" ? "text-[#58a6ff]" : "text-[#8b949e]"
            }`}>
              {line.text}
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!running && !done && output.length === 0 && (
        <div className="flex flex-col items-center justify-center flex-1 text-[#484f58] gap-3 px-3">
          <PieChart className="h-8 w-8 opacity-30" />
          <div className="text-center">
            <p className="text-xs font-medium mb-1">No coverage data</p>
            <p className="text-[10px]">Run coverage to see which lines are tested</p>
            {!projectId && <p className="text-[10px] mt-1 text-[#d29922]">Open a real project first</p>}
          </div>
        </div>
      )}
    </div>
  );
}
