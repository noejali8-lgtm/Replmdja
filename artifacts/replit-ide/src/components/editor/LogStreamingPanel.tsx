import { useState, useEffect, useRef, useCallback } from "react";
import { AlertTriangle, Info, CheckCircle2, XCircle, Filter, Trash2, Download, Circle, Search } from "lucide-react";

type LogLevel = "info" | "warn" | "error" | "success" | "debug";

interface LogEntry {
  id: string;
  level: LogLevel;
  message: string;
  source?: string;
  ts: number;
  count?: number;
}

interface LogStreamingPanelProps {
  projectName?: string;
}

const LEVEL_CONFIG: Record<LogLevel, { icon: React.ReactNode; color: string; bg: string; label: string }> = {
  info:    { icon: <Info className="h-3 w-3" />,          color: "text-[#58a6ff]",  bg: "bg-[#1f6feb]/10", label: "Info" },
  warn:    { icon: <AlertTriangle className="h-3 w-3" />,  color: "text-[#d29922]",  bg: "bg-[#d29922]/10", label: "Warn" },
  error:   { icon: <XCircle className="h-3 w-3" />,        color: "text-[#f85149]",  bg: "bg-[#f85149]/10", label: "Error" },
  success: { icon: <CheckCircle2 className="h-3 w-3" />,   color: "text-[#3fb950]",  bg: "bg-[#3fb950]/10", label: "OK" },
  debug:   { icon: <Circle className="h-3 w-3" />,          color: "text-[#8b949e]",  bg: "bg-[#21262d]",    label: "Debug" },
};

const DEMO_SOURCES = ["API Server", "Vite", "Database", "Auth", "WS"];

function makeEntry(level: LogLevel, message: string, source?: string): LogEntry {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    level, message, source: source ?? DEMO_SOURCES[Math.floor(Math.random() * DEMO_SOURCES.length)],
    ts: Date.now(),
  };
}

const INITIAL_LOGS: LogEntry[] = [
  makeEntry("info",    "Server started on port 8000",                          "API Server"),
  makeEntry("info",    "Database connection pool created (max: 10)",           "Database"),
  makeEntry("success", "Anthropic AI integration ready",                       "API Server"),
  makeEntry("info",    "Vite dev server ready at http://localhost:5000",       "Vite"),
  makeEntry("debug",   "WebSocket upgrade handler registered at /api/terminal/ws", "WS"),
  makeEntry("warn",    "SESSION_SECRET using default dev value",               "API Server"),
  makeEntry("info",    "HMR connected",                                         "Vite"),
  makeEntry("success", "All routes registered (24 endpoints)",                 "API Server"),
];

function formatTs(ts: number): string {
  return new Date(ts).toLocaleTimeString("en-US", { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit", fractionalSecondDigits: 3 });
}

export function LogStreamingPanel({ projectName = "my-project" }: LogStreamingPanelProps) {
  const [logs, setLogs] = useState<LogEntry[]>(INITIAL_LOGS);
  const [filter, setFilter] = useState<Set<LogLevel>>(new Set(["info","warn","error","success","debug"]));
  const [search, setSearch] = useState("");
  const [autoScroll, setAutoScroll] = useState(true);
  const [paused, setPaused] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const counts = {
    error: logs.filter(l => l.level === "error").length,
    warn:  logs.filter(l => l.level === "warn").length,
    info:  logs.filter(l => l.level === "info").length,
    debug: logs.filter(l => l.level === "debug").length,
  };

  useEffect(() => {
    if (paused) return;
    const STREAM_LOGS: [LogLevel, string, string][] = [
      ["debug",   "GET /api/health → 200 (2ms)",          "API Server"],
      ["info",    "HMR update: src/App.tsx",              "Vite"],
      ["debug",   "Query: SELECT * FROM conversations",   "Database"],
      ["warn",    "Slow query detected: 340ms",            "Database"],
      ["success", "Checkpoint saved automatically",        "API Server"],
      ["error",   "ECONNREFUSED 127.0.0.1:5432",          "Database"],
      ["info",    "Reconnecting to database…",             "Database"],
      ["success", "Database reconnected",                  "Database"],
      ["debug",   "WS client connected [172.31.93.1]",    "WS"],
      ["info",    "Terminal session opened (pid 3821)",    "WS"],
      ["debug",   "GET /api/anthropic/conversations → 200","API Server"],
    ];
    let idx = 0;
    const interval = setInterval(() => {
      const [level, message, source] = STREAM_LOGS[idx % STREAM_LOGS.length];
      setLogs(prev => {
        const last = prev[prev.length - 1];
        if (last?.message === message && last?.source === source) {
          return prev.map((l, i) => i === prev.length - 1 ? { ...l, count: (l.count ?? 1) + 1 } : l);
        }
        return [...prev.slice(-500), makeEntry(level, message, source)];
      });
      idx++;
    }, 2800 + Math.random() * 1200);
    return () => clearInterval(interval);
  }, [paused]);

  useEffect(() => {
    if (autoScroll && !paused) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [logs, autoScroll, paused]);

  const toggleLevel = useCallback((level: LogLevel) => {
    setFilter(prev => {
      const next = new Set(prev);
      next.has(level) ? next.delete(level) : next.add(level);
      return next;
    });
  }, []);

  const clearLogs = useCallback(() => setLogs([]), []);

  const downloadLogs = useCallback(() => {
    const text = logs.map(l => `[${formatTs(l.ts)}] [${l.level.toUpperCase()}] [${l.source}] ${l.message}`).join("\n");
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `${projectName}-logs.txt`; a.click();
    URL.revokeObjectURL(url);
  }, [logs, projectName]);

  const filtered = logs.filter(l => filter.has(l.level) && (!search || l.message.toLowerCase().includes(search.toLowerCase()) || l.source?.toLowerCase().includes(search.toLowerCase())));

  return (
    <div className="flex flex-col h-full bg-[#0d1117] text-[#e6edf3]">
      {/* Toolbar */}
      <div className="flex items-center gap-2 px-3 py-1.5 bg-[#161b22] border-b border-[#21262d] shrink-0 flex-wrap">
        <div className="flex items-center gap-1">
          {(Object.entries(LEVEL_CONFIG) as [LogLevel, typeof LEVEL_CONFIG[LogLevel]][]).map(([level, cfg]) => (
            <button
              key={level}
              onClick={() => toggleLevel(level)}
              className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium border transition-colors ${
                filter.has(level)
                  ? `${cfg.bg} ${cfg.color} border-current/30`
                  : "bg-transparent text-[#484f58] border-[#30363d] hover:border-[#484f58]"
              }`}>
              {cfg.icon}
              <span>{cfg.label}</span>
              {(level === "error" || level === "warn") && (counts as any)[level] > 0 && (
                <span className={`text-[9px] px-1 rounded ${cfg.bg}`}>{(counts as any)[level]}</span>
              )}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1 bg-[#21262d] border border-[#30363d] rounded px-2 py-0.5 flex-1 min-w-[120px]">
          <Search className="h-3 w-3 text-[#484f58] shrink-0" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Filter logs…"
            className="bg-transparent text-xs text-[#e6edf3] placeholder-[#484f58] outline-none flex-1 min-w-0"
          />
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => setPaused(p => !p)}
            className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] border transition-colors ${paused ? "bg-[#d29922]/20 text-[#d29922] border-[#d29922]/30" : "text-[#8b949e] border-[#30363d] hover:bg-[#21262d]"}`}>
            <Circle className={`h-2 w-2 ${paused ? "fill-[#d29922]" : "fill-[#3fb950]"}`} />
            {paused ? "Paused" : "Live"}
          </button>
          <button onClick={() => setAutoScroll(p => !p)}
            className={`px-1.5 py-0.5 rounded text-[10px] border transition-colors ${autoScroll ? "text-[#58a6ff] border-[#58a6ff]/30 bg-[#1f6feb]/10" : "text-[#8b949e] border-[#30363d] hover:bg-[#21262d]"}`}>
            Auto-scroll
          </button>
          <button onClick={downloadLogs} title="Download logs" className="h-6 w-6 flex items-center justify-center rounded text-[#8b949e] hover:text-[#e6edf3] hover:bg-[#21262d] transition-colors">
            <Download className="h-3 w-3" />
          </button>
          <button onClick={clearLogs} title="Clear" className="h-6 w-6 flex items-center justify-center rounded text-[#8b949e] hover:text-[#f85149] hover:bg-[#21262d] transition-colors">
            <Trash2 className="h-3 w-3" />
          </button>
        </div>
      </div>

      {/* Log list */}
      <div ref={containerRef} className="flex-1 overflow-y-auto font-mono text-[11px] py-1">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-24 text-[#484f58] gap-1">
            <Filter className="h-6 w-6 opacity-30" />
            <span>No matching logs</span>
          </div>
        ) : (
          filtered.map(log => {
            const cfg = LEVEL_CONFIG[log.level];
            return (
              <div key={log.id}
                className={`flex items-start gap-2 px-3 py-0.5 hover:bg-[#161b22] group border-l-2 ${
                  log.level === "error" ? "border-l-[#f85149]" :
                  log.level === "warn"  ? "border-l-[#d29922]" :
                  log.level === "success" ? "border-l-[#3fb950]" :
                  log.level === "debug" ? "border-l-[#21262d]" :
                  "border-l-[#1f6feb]"
                } border-l-transparent group-hover:border-l-current`}>
                <span className="text-[#484f58] shrink-0 tabular-nums">{formatTs(log.ts)}</span>
                <span className={`shrink-0 ${cfg.color}`}>{cfg.icon}</span>
                <span className="text-[#8b949e] shrink-0 min-w-[70px]">[{log.source}]</span>
                <span className={`flex-1 break-all ${log.level === "error" ? "text-[#ffa198]" : log.level === "warn" ? "text-[#e3b341]" : log.level === "success" ? "text-[#56d364]" : log.level === "debug" ? "text-[#484f58]" : "text-[#c9d1d9]"}`}>
                  {log.message}
                </span>
                {(log.count ?? 1) > 1 && (
                  <span className="shrink-0 text-[9px] px-1 rounded bg-[#21262d] text-[#8b949e]">×{log.count}</span>
                )}
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Footer */}
      <div className="flex items-center gap-4 px-3 py-1 border-t border-[#21262d] bg-[#161b22] shrink-0 text-[10px] text-[#484f58]">
        <span>{filtered.length} entries</span>
        <span className="text-[#f85149]">{counts.error} errors</span>
        <span className="text-[#d29922]">{counts.warn} warnings</span>
        <div className="flex-1" />
        <span className={paused ? "text-[#d29922]" : "text-[#3fb950]"}>{paused ? "● Paused" : "● Streaming"}</span>
      </div>
    </div>
  );
}
