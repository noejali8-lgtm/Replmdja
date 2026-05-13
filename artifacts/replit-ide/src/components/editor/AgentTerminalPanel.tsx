import { useState, useRef, useEffect, useCallback } from "react";
import {
  Bot, Send, Trash2, Terminal, FilePen, FileText, FolderOpen, FileSearch,
  Package, Database, GitBranch, Globe, Cpu, Loader2, CheckCircle2,
  XCircle, ChevronDown, ChevronRight, Zap, Play, Square,
  Folder, Trash, ArrowRightLeft, Server, Eye, Wifi,
} from "lucide-react";

/* ══════════════════════════════════════════════
   Types
══════════════════════════════════════════════ */
type LogKind =
  | "command"    // user input
  | "text"       // AI narration
  | "tool_call"  // tool being called
  | "tool_ok"    // tool succeeded
  | "tool_err"   // tool failed
  | "separator"
  | "system";

interface LogLine {
  id: number;
  kind: LogKind;
  tool?: string;
  params?: Record<string, unknown>;
  content: string;
  ts: string;
  expandable?: boolean;
  expanded?: boolean;
}

/* ══════════════════════════════════════════════
   Tool metadata
══════════════════════════════════════════════ */
const TOOL_META: Record<string, {
  icon: React.ReactNode;
  label: string;
  color: string;
  prefix: string;
}> = {
  write_file:            { icon: <FilePen className="h-3 w-3" />,        label: "Write",    color: "#3fb950", prefix: "✎" },
  read_file:             { icon: <FileText className="h-3 w-3" />,       label: "Read",     color: "#58a6ff", prefix: "📄" },
  list_files:            { icon: <FolderOpen className="h-3 w-3" />,     label: "List",     color: "#e3b341", prefix: "📁" },
  search_files:          { icon: <FileSearch className="h-3 w-3" />,     label: "Search",   color: "#a371f7", prefix: "🔍" },
  delete_file:           { icon: <Trash className="h-3 w-3" />,          label: "Delete",   color: "#f85149", prefix: "🗑" },
  move_file:             { icon: <ArrowRightLeft className="h-3 w-3" />, label: "Move",     color: "#ffa657", prefix: "↔" },
  make_directory:        { icon: <Folder className="h-3 w-3" />,         label: "Mkdir",    color: "#e3b341", prefix: "📂" },
  execute_command:       { icon: <Terminal className="h-3 w-3" />,       label: "Shell",    color: "#ffa657", prefix: "$" },
  execute_command_async: { icon: <Play className="h-3 w-3" />,           label: "Async",    color: "#d29922", prefix: "⚡" },
  install_packages:      { icon: <Package className="h-3 w-3" />,        label: "Install",  color: "#3fb950", prefix: "📦" },
  query_database:        { icon: <Database className="h-3 w-3" />,       label: "SQL",      color: "#76e3ea", prefix: "🗄" },
  push_db_schema:        { icon: <Server className="h-3 w-3" />,         label: "DB Push",  color: "#76e3ea", prefix: "⬆" },
  git:                   { icon: <GitBranch className="h-3 w-3" />,      label: "Git",      color: "#bc8cff", prefix: "⎇" },
  fetch_url:             { icon: <Globe className="h-3 w-3" />,          label: "Fetch",    color: "#58a6ff", prefix: "🌐" },
  list_processes:        { icon: <Cpu className="h-3 w-3" />,            label: "Procs",    color: "#8b949e", prefix: "⚙" },
  kill_process:          { icon: <Square className="h-3 w-3" />,         label: "Kill",     color: "#f85149", prefix: "✕" },
  get_env:               { icon: <Eye className="h-3 w-3" />,            label: "Env",      color: "#8b949e", prefix: "🔒" },
  set_env:               { icon: <Wifi className="h-3 w-3" />,           label: "SetEnv",   color: "#3fb950", prefix: "📝" },
};

function getToolMeta(tool: string) {
  return TOOL_META[tool] ?? { icon: <Cpu className="h-3 w-3" />, label: tool, color: "#8b949e", prefix: "⚙" };
}

function formatParam(tool: string, params: Record<string, unknown>): string {
  if (tool === "write_file")       return String(params.path ?? "");
  if (tool === "read_file")        return String(params.path ?? "");
  if (tool === "list_files")       return String(params.directory ?? ".");
  if (tool === "search_files")     return `"${params.pattern}" in ${params.directory ?? "."}`;
  if (tool === "delete_file")      return String(params.path ?? "");
  if (tool === "move_file")        return `${params.from} → ${params.to}`;
  if (tool === "make_directory")   return String(params.path ?? "");
  if (tool === "execute_command")  return String(params.command ?? "");
  if (tool === "execute_command_async") return String(params.command ?? "");
  if (tool === "install_packages") return (params.packages as string[] ?? []).join(" ");
  if (tool === "query_database")   return String(params.sql ?? "").slice(0, 80);
  if (tool === "push_db_schema")   return "drizzle-kit push";
  if (tool === "git")              return `git ${params.args ?? ""}`;
  if (tool === "fetch_url")        return String(params.url ?? "");
  if (tool === "list_processes")   return String(params.filter ?? "all");
  if (tool === "kill_process")     return params.port ? `port ${params.port}` : `pid ${params.pid}`;
  if (tool === "get_env")          return (params.keys as string[] | undefined)?.join(", ") ?? "all";
  if (tool === "set_env")          return Object.keys(params.vars as object ?? {}).join(", ");
  return "";
}

function ts() {
  return new Date().toLocaleTimeString("en-US", { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

/* ══════════════════════════════════════════════
   QUICK TASKS
══════════════════════════════════════════════ */
const QUICK_TASKS = [
  { label: "List files",         cmd: "Show me the project file structure" },
  { label: "Git status",         cmd: "git status" },
  { label: "Web search",         cmd: "Search the web for: latest React 19 features" },
  { label: "System info",        cmd: "Show me CPU, memory, disk, and Node.js version" },
  { label: "Running processes",  cmd: "Show me all running processes and open ports" },
  { label: "DB tables",          cmd: "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'" },
  { label: "Run tests",          cmd: "Run all tests and show pass/fail results" },
  { label: "Lint + typecheck",   cmd: "Run ESLint and TypeScript typecheck on the workspace" },
  { label: "Format code",        cmd: "Format all TypeScript files with Prettier" },
  { label: "Node version",       cmd: "node --version && pnpm --version" },
  { label: "Install deps",       cmd: "Install all workspace dependencies with pnpm" },
  { label: "Git log",            cmd: "git log --oneline -10" },
  { label: "Check port 3001",    cmd: "Check if port 3001 is open and responding" },
  { label: "Check port 8000",    cmd: "Check if port 8000 is open and responding" },
  { label: "Gen UUID",           cmd: "Generate a new UUID" },
  { label: "Env vars",           cmd: "Show me all non-sensitive environment variables" },
];

/* ══════════════════════════════════════════════
   COMPONENT
══════════════════════════════════════════════ */
interface AgentTerminalPanelProps {
  currentFile?: string;
  currentCode?: string;
  fileTree?: string;
}

let lineCounter = 0;
function mkId() { return ++lineCounter; }

export function AgentTerminalPanel({ currentFile, currentCode, fileTree }: AgentTerminalPanelProps) {
  const [lines, setLines] = useState<LogLine[]>([
    {
      id: mkId(), kind: "system", ts: ts(),
      content: "Agent Terminal ready — type a task or shell command, the AI will execute it live.",
    },
  ]);
  const [input, setInput] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [history, setHistory] = useState<string[]>([]);
  const [histIdx, setHistIdx] = useState(-1);
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const addLine = useCallback((line: Omit<LogLine, "id" | "ts">) => {
    setLines(prev => [...prev, { ...line, id: mkId(), ts: ts() }]);
  }, []);

  const updateLastOfKind = useCallback((kind: LogKind, tool: string, updater: (l: LogLine) => LogLine) => {
    setLines(prev => {
      const idx = [...prev].reverse().findIndex(l => l.kind === kind && l.tool === tool);
      if (idx < 0) return prev;
      const realIdx = prev.length - 1 - idx;
      const next = [...prev];
      next[realIdx] = updater(next[realIdx]);
      return next;
    });
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [lines]);

  const runTask = useCallback(async (task: string) => {
    if (!task.trim() || isRunning) return;
    setInput("");
    setIsRunning(true);
    setHistory(h => [task, ...h.slice(0, 49)]);
    setHistIdx(-1);

    addLine({ kind: "command", content: task });

    const toolPending = new Map<string, { id: number; tool: string }>();

    try {
      const res = await fetch("/api/ide-agent/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: task,
          currentFile,
          currentCode,
          fileTree,
          model: "claude-opus-4-7",
        }),
      });

      if (!res.ok || !res.body) {
        addLine({ kind: "tool_err", content: `HTTP ${res.status}: ${res.statusText}` });
        setIsRunning(false);
        return;
      }

      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let buf = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        const rawLines = buf.split("\n");
        buf = rawLines.pop() ?? "";

        for (const rawLine of rawLines) {
          if (!rawLine.startsWith("data: ")) continue;
          let evt: Record<string, unknown>;
          try { evt = JSON.parse(rawLine.slice(6)) as Record<string, unknown>; }
          catch { continue; }

          switch (evt.type) {
            case "text_delta": {
              if (typeof evt.content !== "string" || !evt.content) break;
              setLines(prev => {
                const last = prev[prev.length - 1];
                if (last?.kind === "text") {
                  const next = [...prev];
                  next[next.length - 1] = { ...last, content: last.content + evt.content };
                  return next;
                }
                return [...prev, { id: mkId(), kind: "text", content: evt.content as string, ts: ts() }];
              });
              break;
            }

            case "tool_call": {
              const id = mkId();
              const tool = evt.tool as string;
              const params = evt.params as Record<string, unknown>;
              const sseId = evt.id as string;
              toolPending.set(sseId, { id, tool });
              addLine({ kind: "tool_call", tool, params, content: formatParam(tool, params) });
              break;
            }

            case "tool_result": {
              const sseId = evt.id as string;
              const pending = toolPending.get(sseId);
              const result = String(evt.result ?? "");
              const isError = result.toLowerCase().startsWith("error") || result.toLowerCase().startsWith("db error");
              if (pending) {
                updateLastOfKind("tool_call", pending.tool, l => ({
                  ...l,
                  kind: isError ? "tool_err" : "tool_ok",
                  content: l.content,
                }));
                if (result && result !== "(no output)" && result.trim()) {
                  const isLong = result.length > 300;
                  const lineId = mkId();
                  setLines(prev => [...prev, {
                    id: lineId, kind: isError ? "tool_err" : "tool_ok",
                    tool: pending.tool,
                    content: isLong ? result.slice(0, 300) + `\n...[${result.length - 300} more chars]` : result,
                    ts: ts(),
                    expandable: isLong,
                  }]);
                }
                toolPending.delete(sseId);
              }
              break;
            }

            case "error":
              addLine({ kind: "tool_err", content: `Agent error: ${evt.message ?? "Unknown"}` });
              break;

            case "done":
              break;
          }
        }
      }
    } catch (e) {
      addLine({ kind: "tool_err", content: `Connection error: ${e instanceof Error ? e.message : String(e)}` });
    } finally {
      addLine({ kind: "separator", content: "" });
      setIsRunning(false);
    }
  }, [isRunning, addLine, updateLastOfKind, currentFile, currentCode, fileTree]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      runTask(input);
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      const next = Math.min(histIdx + 1, history.length - 1);
      setHistIdx(next);
      setInput(history[next] ?? "");
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      const next = Math.max(histIdx - 1, -1);
      setHistIdx(next);
      setInput(next === -1 ? "" : (history[next] ?? ""));
    }
  };

  const toggleExpand = (id: number) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  /* ── Render a single log line ── */
  function renderLine(line: LogLine) {
    const meta = line.tool ? getToolMeta(line.tool) : null;

    if (line.kind === "separator") {
      return <div key={line.id} className="h-px bg-[#21262d] my-2 opacity-50" />;
    }

    if (line.kind === "system") {
      return (
        <div key={line.id} className="flex items-start gap-2 text-[#484f58] italic text-[10px] py-0.5">
          <span className="text-[#30363d] shrink-0 tabular-nums">{line.ts}</span>
          <Bot className="h-3 w-3 shrink-0 mt-0.5 text-[#a371f7]" />
          <span>{line.content}</span>
        </div>
      );
    }

    if (line.kind === "command") {
      return (
        <div key={line.id} className="flex items-start gap-2 py-1.5">
          <span className="text-[#30363d] shrink-0 tabular-nums text-[10px] mt-0.5">{line.ts}</span>
          <span className="text-[#3fb950] font-bold text-[11px] shrink-0">▶</span>
          <span className="text-[#e6edf3] font-mono text-[11px] break-all">{line.content}</span>
        </div>
      );
    }

    if (line.kind === "text") {
      return (
        <div key={line.id} className="flex items-start gap-2 py-0.5">
          <span className="text-[#30363d] shrink-0 tabular-nums text-[10px] mt-0.5">{line.ts}</span>
          <Zap className="h-3 w-3 shrink-0 mt-0.5 text-[#a371f7]" />
          <span className="text-[#c9d1d9] text-[11px] leading-relaxed whitespace-pre-wrap break-all">{line.content}</span>
        </div>
      );
    }

    if (line.kind === "tool_call" || line.kind === "tool_ok" || line.kind === "tool_err") {
      const isCall = line.kind === "tool_call";
      const isOk = line.kind === "tool_ok";
      const isErr = line.kind === "tool_err";
      const color = meta?.color ?? "#8b949e";
      const expanded = expandedIds.has(line.id);

      if (!line.tool) {
        return (
          <div key={line.id} className="flex items-start gap-2 py-0.5 pl-6">
            <span className="text-[#30363d] shrink-0 tabular-nums text-[10px] mt-0.5">{line.ts}</span>
            <pre className={`text-[10px] font-mono whitespace-pre-wrap break-all leading-relaxed ${isErr ? "text-[#ff7b72]" : "text-[#8b949e]"}`}>
              {line.content}
            </pre>
          </div>
        );
      }

      return (
        <div key={line.id} className={`rounded my-0.5 overflow-hidden`}>
          <div className={`flex items-center gap-2 px-2 py-1 rounded ${
            isCall ? "bg-[#161b22] border border-[#21262d]" :
            isOk ? "bg-[#0d1117]" : "bg-[#0d1117]"
          }`}>
            <span className="shrink-0 text-[10px] text-[#30363d] tabular-nums w-14">{line.ts}</span>
            <span style={{ color }} className="shrink-0">{meta?.icon}</span>
            <span style={{ color }} className="text-[10px] font-medium font-mono shrink-0 w-16">{meta?.label}</span>
            <span className="text-[10px] font-mono text-[#8b949e] flex-1 truncate">{line.content}</span>
            {isCall && <Loader2 className="h-3 w-3 text-[#484f58] animate-spin shrink-0" />}
            {isOk && !line.content.includes("\n") && <CheckCircle2 className="h-3 w-3 text-[#3fb950] shrink-0" />}
            {isErr && !line.content.includes("\n") && <XCircle className="h-3 w-3 text-[#f85149] shrink-0" />}
          </div>

          {line.kind !== "tool_call" && line.content && (line.content.includes("\n") || line.content.length > 60) && (
            <div className="border-l-2 ml-6" style={{ borderColor: isErr ? "#f85149" : (meta?.color ?? "#30363d") }}>
              <button
                onClick={() => toggleExpand(line.id)}
                className="flex items-center gap-1 px-2 py-0.5 text-[9px] text-[#484f58] hover:text-[#8b949e] transition-colors">
                {expanded ? <ChevronDown className="h-2.5 w-2.5" /> : <ChevronRight className="h-2.5 w-2.5" />}
                {expanded ? "Collapse" : `Show output (${line.content.split("\n").length} lines)`}
              </button>
              {expanded && (
                <pre className={`px-3 pb-2 text-[10px] font-mono whitespace-pre-wrap break-all leading-relaxed max-h-64 overflow-y-auto ${isErr ? "text-[#ff7b72]" : "text-[#8b949e]"}`}>
                  {line.content}
                </pre>
              )}
            </div>
          )}
        </div>
      );
    }

    return null;
  }

  return (
    <div className="flex flex-col h-full bg-[#0d1117] font-mono">

      {/* ── Header ── */}
      <div className="flex items-center gap-2 px-3 py-1.5 border-b border-[#21262d] bg-[#161b22] shrink-0">
        <div className="h-5 w-5 rounded bg-gradient-to-br from-[#ffa657] to-[#a371f7] flex items-center justify-center shrink-0">
          <Terminal className="h-3 w-3 text-white" />
        </div>
        <span className="text-xs font-semibold text-[#e6edf3]">Agent Terminal</span>
        <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-[#238636]/20 border border-[#238636]/30">
          <span className="h-1.5 w-1.5 rounded-full bg-[#3fb950] animate-pulse" />
          <span className="text-[9px] text-[#3fb950] font-sans">Full permissions</span>
        </div>
        <div className="flex-1" />
        <button
          onClick={() => { setLines([{ id: mkId(), kind: "system", ts: ts(), content: "Terminal cleared." }]); setExpandedIds(new Set()); }}
          title="Clear"
          className="h-6 w-6 flex items-center justify-center rounded text-[#484f58] hover:text-[#8b949e] hover:bg-[#21262d] transition-colors">
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* ── Quick task chips ── */}
      <div className="flex items-center gap-1 px-2 py-1.5 border-b border-[#21262d] bg-[#0d1117] overflow-x-auto shrink-0 scrollbar-none">
        {QUICK_TASKS.map(q => (
          <button
            key={q.label}
            onClick={() => runTask(q.cmd)}
            disabled={isRunning}
            className="flex items-center gap-1 px-2 py-0.5 rounded-full border border-[#30363d] bg-[#161b22] text-[9px] text-[#8b949e] hover:text-[#e6edf3] hover:border-[#484f58] hover:bg-[#21262d] transition-colors shrink-0 disabled:opacity-40">
            {q.label}
          </button>
        ))}
      </div>

      {/* ── Output log ── */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-0.5">
        {lines.map(line => renderLine(line))}
        {isRunning && (
          <div className="flex items-center gap-2 py-1 text-[#a371f7]">
            <Loader2 className="h-3 w-3 animate-spin shrink-0" />
            <span className="text-[10px] animate-pulse">Agent working…</span>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* ── Input ── */}
      <div className="border-t border-[#21262d] bg-[#0d1117] px-3 py-2 shrink-0">
        <div className={`flex items-center gap-2 rounded-lg border px-3 py-2 transition-colors ${isRunning ? "border-[#21262d] bg-[#0d1117]" : "border-[#30363d] bg-[#161b22] focus-within:border-[#a371f7]"}`}>
          <span className="text-[#3fb950] font-bold text-sm shrink-0">❯</span>
          <input
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isRunning}
            placeholder={isRunning ? "Agent is working…" : "Type a task or shell command… (↑↓ history)"}
            className="flex-1 bg-transparent text-[11px] text-[#e6edf3] outline-none placeholder-[#484f58] font-mono"
            autoFocus
          />
          <button
            onClick={() => runTask(input)}
            disabled={isRunning || !input.trim()}
            className="h-6 w-6 flex items-center justify-center rounded bg-[#a371f7]/20 text-[#a371f7] hover:bg-[#a371f7]/40 transition-colors disabled:opacity-30 shrink-0">
            {isRunning ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
          </button>
        </div>
        <div className="flex items-center gap-3 mt-1 px-1">
          <span className="text-[9px] text-[#30363d]">Enter ↵ run · ↑↓ history · Full permissions enabled</span>
          {currentFile && <span className="text-[9px] text-[#484f58] ml-auto truncate">ctx: {currentFile}</span>}
        </div>
      </div>
    </div>
  );
}
