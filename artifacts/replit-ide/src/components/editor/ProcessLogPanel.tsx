import { useState, useEffect, useRef, useCallback } from "react";
import {
  Play, Square, Circle, Trash2, Download, Search,
  AlertTriangle, Terminal, RefreshCw, Info, CheckCircle2, XCircle,
} from "lucide-react";

interface LogEntry {
  id: string;
  ts: number;
  type: "stdout" | "stderr" | "info" | "error";
  data: string;
}

interface ProcessStatus {
  running: boolean;
  pid?: number;
  cmd?: string;
  logCount?: number;
}

interface Props {
  projectId?: number;
}

function formatTs(ts: number) {
  return new Date(ts).toLocaleTimeString("en-US", {
    hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit",
  });
}

function lineColor(type: LogEntry["type"]) {
  if (type === "stderr" || type === "error") return "text-[#ffa198]";
  if (type === "info") return "text-[#58a6ff]";
  return "text-[#c9d1d9]";
}

function typeIcon(type: LogEntry["type"]) {
  if (type === "stderr" || type === "error") return <XCircle className="h-3 w-3 text-[#f85149]" />;
  if (type === "info") return <Info className="h-3 w-3 text-[#58a6ff]" />;
  return <CheckCircle2 className="h-3 w-3 text-[#3fb950]" />;
}

export function ProcessLogPanel({ projectId }: Props) {
  const [logs, setLogs]         = useState<LogEntry[]>([]);
  const [status, setStatus]     = useState<ProcessStatus>({ running: false });
  const [search, setSearch]     = useState("");
  const [autoScroll, setAutoScroll] = useState(true);
  const [showStderr, setShowStderr] = useState(true);
  const [showStdout, setShowStdout] = useState(true);
  const [loading, setLoading]   = useState(false);
  const bottomRef   = useRef<HTMLDivElement>(null);
  const esRef       = useRef<EventSource | null>(null);
  const seqRef      = useRef(0);

  const baseUrl = projectId ? `/api/projects/${projectId}/process` : null;

  /* Poll status */
  useEffect(() => {
    if (!baseUrl) return;
    const poll = async () => {
      try {
        const r = await fetch(`${baseUrl}/status`);
        if (r.ok) setStatus(await r.json());
      } catch { /* offline */ }
    };
    poll();
    const id = setInterval(poll, 3000);
    return () => clearInterval(id);
  }, [baseUrl]);

  /* SSE log stream */
  const connectStream = useCallback(() => {
    if (!baseUrl) return;
    esRef.current?.close();
    const es = new EventSource(`${baseUrl}/logs`);
    esRef.current = es;
    es.onmessage = e => {
      try {
        const entry = JSON.parse(e.data) as Omit<LogEntry, "id">;
        const id = `${entry.ts}-${seqRef.current++}`;
        setLogs(prev => [...prev.slice(-1000), { ...entry, id }]);
      } catch { /* */ }
    };
    es.onerror = () => { es.close(); };
  }, [baseUrl]);

  useEffect(() => {
    connectStream();
    return () => esRef.current?.close();
  }, [connectStream]);

  useEffect(() => {
    if (autoScroll) bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs, autoScroll]);

  const handleStart = async () => {
    if (!baseUrl) return;
    setLoading(true);
    setLogs([]);
    try {
      await fetch(`${baseUrl}/start`, { method: "POST" });
      setStatus(s => ({ ...s, running: true }));
      connectStream();
    } finally {
      setLoading(false);
    }
  };

  const handleStop = async () => {
    if (!baseUrl) return;
    setLoading(true);
    try {
      await fetch(`${baseUrl}/stop`, { method: "POST" });
      setStatus(s => ({ ...s, running: false }));
    } finally {
      setLoading(false);
    }
  };

  const downloadLogs = () => {
    const text = logs.map(l => `[${formatTs(l.ts)}] [${l.type.toUpperCase()}] ${l.data}`).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([text], { type: "text/plain" }));
    a.download = `project-${projectId}-logs.txt`;
    a.click();
  };

  const filtered = logs.filter(l => {
    if (!showStdout && l.type === "stdout") return false;
    if (!showStderr && (l.type === "stderr" || l.type === "error")) return false;
    if (search && !l.data.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const errCount = logs.filter(l => l.type === "stderr" || l.type === "error").length;

  if (!projectId) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-[#484f58] gap-3 p-4">
        <Terminal className="h-10 w-10 opacity-20" />
        <p className="text-xs text-center">Open a project to stream live logs</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[#0d1117] text-[#e6edf3] font-mono text-[11px]">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2 bg-[#161b22] border-b border-[#21262d] shrink-0">
        <Terminal className="h-3.5 w-3.5 text-[#8b949e] shrink-0" />
        <span className="font-sans text-[11px] font-semibold text-[#8b949e] uppercase tracking-wider flex-1">
          Process Logs
        </span>
        {status.running ? (
          <button
            onClick={handleStop}
            disabled={loading}
            className="flex items-center gap-1 px-2 py-0.5 rounded bg-[#da3633] hover:bg-[#f85149] text-white text-[10px] transition-colors disabled:opacity-50">
            <Square className="h-2.5 w-2.5" /> Stop
          </button>
        ) : (
          <button
            onClick={handleStart}
            disabled={loading}
            className="flex items-center gap-1 px-2 py-0.5 rounded bg-[#238636] hover:bg-[#2ea043] text-white text-[10px] transition-colors disabled:opacity-50">
            <Play className="h-2.5 w-2.5" /> Start
          </button>
        )}
      </div>

      {/* Status bar */}
      <div className="flex items-center gap-3 px-3 py-1 bg-[#0d1117] border-b border-[#21262d] shrink-0">
        <div className="flex items-center gap-1">
          <Circle className={`h-2 w-2 ${status.running ? "fill-[#3fb950] text-[#3fb950]" : "fill-[#484f58] text-[#484f58]"}`} />
          <span className={`text-[10px] ${status.running ? "text-[#3fb950]" : "text-[#484f58]"}`}>
            {status.running ? "Running" : "Stopped"}
          </span>
        </div>
        {status.pid && <span className="text-[10px] text-[#484f58]">PID {status.pid}</span>}
        {status.cmd && (
          <span className="text-[10px] text-[#484f58] truncate flex-1 hidden sm:block" title={status.cmd}>
            {status.cmd}
          </span>
        )}
        {errCount > 0 && (
          <span className="text-[10px] text-[#f85149] flex items-center gap-0.5">
            <AlertTriangle className="h-2.5 w-2.5" /> {errCount}
          </span>
        )}
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#161b22] border-b border-[#21262d] shrink-0 flex-wrap">
        <div className="flex items-center gap-1 bg-[#21262d] border border-[#30363d] rounded px-2 py-0.5 flex-1 min-w-[100px]">
          <Search className="h-3 w-3 text-[#484f58] shrink-0" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Filter logs…"
            className="bg-transparent text-xs text-[#e6edf3] placeholder-[#484f58] outline-none flex-1 min-w-0"
          />
        </div>
        <button
          onClick={() => setShowStdout(p => !p)}
          className={`px-1.5 py-0.5 rounded text-[10px] border transition-colors ${showStdout ? "bg-[#3fb950]/10 text-[#3fb950] border-[#3fb950]/30" : "text-[#484f58] border-[#30363d]"}`}>
          stdout
        </button>
        <button
          onClick={() => setShowStderr(p => !p)}
          className={`px-1.5 py-0.5 rounded text-[10px] border transition-colors ${showStderr ? "bg-[#f85149]/10 text-[#f85149] border-[#f85149]/30" : "text-[#484f58] border-[#30363d]"}`}>
          stderr
        </button>
        <button
          onClick={() => setAutoScroll(p => !p)}
          className={`px-1.5 py-0.5 rounded text-[10px] border transition-colors ${autoScroll ? "bg-[#1f6feb]/10 text-[#58a6ff] border-[#58a6ff]/30" : "text-[#484f58] border-[#30363d]"}`}>
          Auto-scroll
        </button>
        <button onClick={connectStream} title="Reconnect" className="h-6 w-6 flex items-center justify-center rounded text-[#484f58] hover:text-[#e6edf3] hover:bg-[#21262d] transition-colors">
          <RefreshCw className="h-3 w-3" />
        </button>
        <button onClick={downloadLogs} title="Download" className="h-6 w-6 flex items-center justify-center rounded text-[#484f58] hover:text-[#e6edf3] hover:bg-[#21262d] transition-colors">
          <Download className="h-3 w-3" />
        </button>
        <button onClick={() => setLogs([])} title="Clear" className="h-6 w-6 flex items-center justify-center rounded text-[#484f58] hover:text-[#f85149] hover:bg-[#21262d] transition-colors">
          <Trash2 className="h-3 w-3" />
        </button>
      </div>

      {/* Log output */}
      <div className="flex-1 overflow-y-auto py-1">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-24 text-[#484f58] gap-2">
            <Terminal className="h-6 w-6 opacity-30" />
            <span className="font-sans text-xs">
              {status.running ? "Waiting for output…" : "Start the process to see logs"}
            </span>
          </div>
        ) : (
          filtered.map(log => (
            <div
              key={log.id}
              className={`flex items-start gap-2 px-3 py-0.5 hover:bg-[#161b22] group border-l-2 border-l-transparent ${
                log.type === "stderr" || log.type === "error" ? "hover:border-l-[#f85149]" :
                log.type === "info" ? "hover:border-l-[#58a6ff]" : "hover:border-l-[#3fb950]"
              }`}>
              <span className="text-[#484f58] shrink-0 tabular-nums">{formatTs(log.ts)}</span>
              <span className="shrink-0 mt-0.5">{typeIcon(log.type)}</span>
              <pre className={`flex-1 whitespace-pre-wrap break-all ${lineColor(log.type)}`}>
                {log.data.replace(/\r\n/g, "\n").trimEnd()}
              </pre>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* Footer */}
      <div className="flex items-center gap-4 px-3 py-1 border-t border-[#21262d] bg-[#161b22] shrink-0 text-[10px] text-[#484f58] font-sans">
        <span>{filtered.length} lines</span>
        {errCount > 0 && <span className="text-[#f85149]">{errCount} errors</span>}
        <div className="flex-1" />
        <span className={status.running ? "text-[#3fb950]" : "text-[#484f58]"}>
          {status.running ? "● Live" : "○ Idle"}
        </span>
      </div>
    </div>
  );
}
