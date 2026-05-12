import { useState, useRef, useCallback } from "react";
import { Archive, Play, Loader2, FileCode, AlertCircle, CheckCircle } from "lucide-react";

interface BundleFile {
  name: string;
  size: number;
  gzip?: number;
}

interface Props {
  projectId?: number;
}

function fmt(bytes: number) {
  if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(1)} kB`;
  return `${bytes} B`;
}

function pct(size: number, total: number) {
  return total > 0 ? Math.round((size / total) * 100) : 0;
}

const FILE_COLORS: Record<string, string> = {
  ".js": "#f2cc60",
  ".css": "#58a6ff",
  ".html": "#3fb950",
  ".ts": "#79c0ff",
  ".tsx": "#79c0ff",
  ".woff": "#a371f7",
  ".woff2": "#a371f7",
  ".png": "#ff7b72",
  ".svg": "#ff7b72",
};

function fileColor(name: string) {
  const ext = "." + name.split(".").pop();
  return FILE_COLORS[ext] ?? "#8b949e";
}

export function BundleAnalyzerPanel({ projectId }: Props) {
  const [building, setBuilding] = useState(false);
  const [files, setFiles] = useState<BundleFile[]>([]);
  const [totalSize, setTotalSize] = useState(0);
  const [exitCode, setExitCode] = useState<number | null>(null);
  const [output, setOutput] = useState<{ text: string; type: string }[]>([]);
  const abortRef = useRef<(() => void) | null>(null);
  const outRef = useRef<HTMLDivElement>(null);

  const runBuild = useCallback(async () => {
    if (!projectId) {
      setOutput([{ text: "⚠ Open a real project to analyze its bundle.", type: "warn" }]);
      return;
    }
    setBuilding(true);
    setFiles([]);
    setTotalSize(0);
    setExitCode(null);
    setOutput([]);

    const ctrl = new AbortController();
    abortRef.current = () => ctrl.abort();

    try {
      const resp = await fetch(`/api/projects/${projectId}/build`, {
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
        const { done, value } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        const lines = buf.split("\n");
        buf = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.startsWith("data:")) continue;
          try {
            const ev = JSON.parse(line.slice(5).trim()) as Record<string, unknown>;
            if (ev.type === "done") {
              setFiles((ev.files as BundleFile[]) ?? []);
              setTotalSize(Number(ev.totalSize ?? 0));
              setExitCode(Number(ev.code ?? 0));
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
      setBuilding(false);
    }
  }, [projectId]);

  const sorted = [...files].sort((a, b) => b.size - a.size);

  return (
    <div className="flex flex-col h-full bg-[#0d1117] text-[#e6edf3] overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-[#21262d] bg-[#161b22] shrink-0">
        <Archive className="h-4 w-4 text-[#f2cc60]" />
        <span className="text-xs font-semibold flex-1">Bundle Analyzer</span>
        {exitCode !== null && (
          exitCode === 0
            ? <CheckCircle className="h-3.5 w-3.5 text-[#3fb950]" />
            : <AlertCircle className="h-3.5 w-3.5 text-[#ff7b72]" />
        )}
      </div>

      {/* Run button */}
      <div className="px-3 py-2 border-b border-[#21262d] shrink-0">
        <button
          onClick={runBuild}
          disabled={building}
          className="w-full flex items-center justify-center gap-2 py-1.5 rounded bg-[#238636] hover:bg-[#2ea043] text-white text-xs font-medium transition-colors disabled:opacity-50"
        >
          {building ? <><Loader2 className="h-3 w-3 animate-spin" /> Building…</> : <><Play className="h-3 w-3" /> Run Build</>}
        </button>
      </div>

      {/* Bundle summary */}
      {files.length > 0 && (
        <div className="px-3 py-2 border-b border-[#21262d] shrink-0">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-semibold text-[#8b949e] uppercase tracking-widest">Bundle Output</span>
            <span className="text-[10px] text-[#8b949e]">Total: {fmt(totalSize)}</span>
          </div>

          {/* Stacked bar */}
          <div className="flex h-2 rounded overflow-hidden mb-3 gap-0.5">
            {sorted.slice(0, 8).map((f, i) => (
              <div
                key={i}
                style={{ width: `${pct(f.size, totalSize)}%`, backgroundColor: fileColor(f.name), minWidth: 2 }}
                title={`${f.name}: ${fmt(f.size)}`}
                className="rounded-sm"
              />
            ))}
          </div>

          {/* File list */}
          <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
            {sorted.map((f, i) => (
              <div key={i} className="group">
                <div className="flex items-center gap-2 mb-0.5">
                  <div className="h-2 w-2 rounded-sm shrink-0" style={{ backgroundColor: fileColor(f.name) }} />
                  <span className="text-[10px] text-[#e6edf3] truncate flex-1 font-mono">{f.name.replace("dist/", "")}</span>
                  <span className="text-[10px] text-[#8b949e] shrink-0">{fmt(f.size)}</span>
                </div>
                <div className="ml-4 flex items-center gap-2">
                  <div className="flex-1 h-1 bg-[#21262d] rounded overflow-hidden">
                    <div
                      className="h-full rounded"
                      style={{ width: `${pct(f.size, totalSize)}%`, backgroundColor: fileColor(f.name), opacity: 0.6 }}
                    />
                  </div>
                  {f.gzip && (
                    <span className="text-[9px] text-[#484f58] shrink-0">gzip: {fmt(f.gzip)}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Build output */}
      <div ref={outRef} className="flex-1 overflow-y-auto p-3 font-mono text-[11px] space-y-0.5">
        {output.length === 0 && !building && files.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-[#484f58] gap-3">
            <Archive className="h-8 w-8 opacity-30" />
            <div className="text-center">
              <p className="text-xs font-medium mb-1">No build data</p>
              <p className="text-[10px]">Run a build to analyze bundle sizes</p>
              {!projectId && <p className="text-[10px] mt-1 text-[#d29922]">Open a real project first</p>}
            </div>
          </div>
        )}
        {building && output.length === 0 && (
          <div className="flex items-center gap-2 text-[#58a6ff]">
            <Loader2 className="h-3 w-3 animate-spin" />
            <span>Running build…</span>
          </div>
        )}
        {output.map((line, i) => (
          <div key={i} className={`whitespace-pre-wrap break-all ${
            line.type === "error" ? "text-[#ff7b72]" :
            line.type === "stderr" ? "text-[#d29922]" :
            line.type === "info" ? "text-[#58a6ff]" : "text-[#8b949e]"
          }`}>
            <FileCode className="inline h-2.5 w-2.5 mr-1 opacity-40" />
            {line.text}
          </div>
        ))}
      </div>
    </div>
  );
}
