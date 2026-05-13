import { useState, useRef, useEffect, useCallback, useId } from "react";
import {
  Sparkles, Send, X, Code2, FileText, Wrench, ChevronDown, ClipboardCopy,
  Play, FilePen, FolderOpen, Search, Terminal, CheckCircle2, XCircle,
  AlertTriangle, ChevronRight, Loader2, Cpu, Bot, Zap, RefreshCw,
  GitBranch, FileSearch, Eye, Shield,
} from "lucide-react";
import ReactMarkdown from "react-markdown";

/* ─── Types ─── */

type AgentMode = "agent" | "chat" | "turbo";

interface TurnEvent {
  kind: "text" | "tool_call" | "approval" | "error";
  id?: string;
}
interface TextEvent extends TurnEvent {
  kind: "text";
  content: string;
}
interface ToolCallEvent extends TurnEvent {
  kind: "tool_call";
  id: string;
  tool: string;
  params: Record<string, unknown>;
  status: "pending" | "done" | "error";
  result?: string;
}
interface ApprovalEvent extends TurnEvent {
  kind: "approval";
  id: string;
  command: string;
  description: string;
  status: "pending" | "approved" | "denied";
  output?: string;
}
interface ErrorEvent extends TurnEvent {
  kind: "error";
  message: string;
}

type AnyEvent = TextEvent | ToolCallEvent | ApprovalEvent | ErrorEvent;

interface AgentTurn {
  turnId: string;
  events: AnyEvent[];
  isStreaming: boolean;
}

interface UserTurn {
  turnId: string;
  text: string;
}

type Turn = { role: "user"; data: UserTurn } | { role: "agent"; data: AgentTurn };

interface AIPanelProps {
  currentFile?: string;
  currentCode?: string;
  language?: string;
  initialMessage?: string;
  onClose?: () => void;
  onApplyCode?: (code: string, language: string) => void;
  onFileWrite?: (filePath: string, content: string) => void;
  fileTree?: string;
}

/* ─── Models ─── */
const MODELS = [
  { id: "claude-opus-4-7",  label: "Claude Opus 4.7",  badge: "Max" },
  { id: "claude-sonnet-4-5", label: "Claude Sonnet 4.5", badge: "Recommended" },
  { id: "claude-haiku-4-5", label: "Claude Haiku 4.5", badge: "Fast" },
  { id: "claude-opus-4-5", label: "Claude Opus 4.5", badge: "Powerful" },
];

/* ─── Helpers ─── */
function extractCodeBlocks(text: string) {
  const re = /```(\w*)\n([\s\S]*?)```/g;
  const blocks: { lang: string; code: string; start: number; end: number }[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null)
    blocks.push({ lang: m[1] || "plaintext", code: m[2], start: m.index, end: m.index + m[0].length });
  return blocks;
}

function MarkdownContent({
  text,
  onApply,
  currentFile,
}: {
  text: string;
  onApply?: (code: string, lang: string) => void;
  currentFile?: string;
}) {
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const blocks = extractCodeBlocks(text);

  if (blocks.length === 0) {
    return (
      <div className="prose prose-invert prose-xs max-w-none [&_p]:mb-2 [&_ul]:list-disc [&_ul]:pl-4 [&_ol]:list-decimal [&_ol]:pl-4 [&_li]:mb-0.5 [&_h1]:text-sm [&_h2]:text-sm [&_h3]:text-xs [&_strong]:text-[#e6edf3] [&_a]:text-[#58a6ff] [&_code]:text-[#ffa657] [&_code]:bg-[#161b22] [&_code]:px-1 [&_code]:rounded">
        <ReactMarkdown>{text}</ReactMarkdown>
      </div>
    );
  }

  const parts: React.ReactNode[] = [];
  let cursor = 0;
  blocks.forEach((block, idx) => {
    if (cursor < block.start) {
      parts.push(
        <div key={`prose-${idx}`} className="prose prose-invert prose-xs max-w-none [&_p]:mb-2 [&_ul]:list-disc [&_ul]:pl-4 [&_code]:text-[#ffa657] [&_code]:bg-[#161b22] [&_code]:px-1 [&_code]:rounded [&_strong]:text-[#e6edf3]">
          <ReactMarkdown>{text.slice(cursor, block.start)}</ReactMarkdown>
        </div>
      );
    }
    parts.push(
      <div key={`code-${idx}`} className="rounded-lg border border-[#30363d] overflow-hidden my-2">
        <div className="flex items-center gap-2 px-3 py-1.5 bg-[#21262d] border-b border-[#30363d]">
          <span className="text-[10px] font-mono text-[#8b949e] flex-1">{block.lang || "code"}</span>
          <button
            onClick={() => { navigator.clipboard.writeText(block.code).catch(() => {}); setCopiedIdx(idx); setTimeout(() => setCopiedIdx(null), 1500); }}
            className="flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded text-[#8b949e] hover:text-[#e6edf3] hover:bg-[#30363d] transition-colors">
            <ClipboardCopy className="h-2.5 w-2.5" />
            {copiedIdx === idx ? "Copied!" : "Copy"}
          </button>
          {onApply && (
            <button
              onClick={() => onApply(block.code, block.lang)}
              className="flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded bg-[#238636]/80 hover:bg-[#238636] text-[#3fb950] border border-[#3fb950]/20 transition-colors font-medium">
              <Play className="h-2.5 w-2.5" />
              Apply{currentFile ? ` to ${currentFile}` : ""}
            </button>
          )}
        </div>
        <pre className="p-3 overflow-x-auto bg-[#0d1117] text-[11px] leading-relaxed">
          <code className="text-[#e6edf3] font-mono">{block.code}</code>
        </pre>
      </div>
    );
    cursor = block.end;
  });
  if (cursor < text.length) {
    parts.push(
      <div key="prose-tail" className="prose prose-invert prose-xs max-w-none [&_p]:mb-2 [&_strong]:text-[#e6edf3]">
        <ReactMarkdown>{text.slice(cursor)}</ReactMarkdown>
      </div>
    );
  }
  return <div className="space-y-1">{parts}</div>;
}

/* ─── Tool card ─── */
const TOOL_META: Record<string, { icon: React.ReactNode; label: string; color: string; bg: string }> = {
  write_file:            { icon: <FilePen className="h-3 w-3" />,    label: "Write file",    color: "text-[#3fb950]", bg: "bg-[#238636]/20 border-[#238636]/40" },
  read_file:             { icon: <FileText className="h-3 w-3" />,   label: "Read file",     color: "text-[#58a6ff]", bg: "bg-[#1f6feb]/20 border-[#1f6feb]/40" },
  list_files:            { icon: <FolderOpen className="h-3 w-3" />, label: "List files",    color: "text-[#e3b341]", bg: "bg-[#9e6a03]/20 border-[#9e6a03]/40" },
  search_files:          { icon: <FileSearch className="h-3 w-3" />, label: "Search files",  color: "text-[#a371f7]", bg: "bg-[#6e40c9]/20 border-[#6e40c9]/40" },
  execute_command:       { icon: <Terminal className="h-3 w-3" />,   label: "Shell",         color: "text-[#ffa657]", bg: "bg-[#d18616]/20 border-[#d18616]/40" },
  execute_command_async: { icon: <Play className="h-3 w-3" />,       label: "Async shell",   color: "text-[#d29922]", bg: "bg-[#9e6a03]/20 border-[#9e6a03]/40" },
  install_packages:      { icon: <Wrench className="h-3 w-3" />,     label: "Install pkgs",  color: "text-[#3fb950]", bg: "bg-[#238636]/20 border-[#238636]/40" },
  query_database:        { icon: <Eye className="h-3 w-3" />,        label: "SQL query",     color: "text-[#76e3ea]", bg: "bg-[#1f6feb]/10 border-[#1f6feb]/30" },
  push_db_schema:        { icon: <Shield className="h-3 w-3" />,     label: "DB push",       color: "text-[#76e3ea]", bg: "bg-[#1f6feb]/10 border-[#1f6feb]/30" },
  git:                   { icon: <GitBranch className="h-3 w-3" />,  label: "Git",           color: "text-[#bc8cff]", bg: "bg-[#6e40c9]/20 border-[#6e40c9]/40" },
  fetch_url:             { icon: <Search className="h-3 w-3" />,     label: "Fetch URL",     color: "text-[#58a6ff]", bg: "bg-[#1f6feb]/20 border-[#1f6feb]/40" },
  delete_file:           { icon: <X className="h-3 w-3" />,          label: "Delete file",   color: "text-[#f85149]", bg: "bg-[#b91c1c]/20 border-[#f85149]/40" },
  move_file:             { icon: <ChevronRight className="h-3 w-3" />,label: "Move file",    color: "text-[#ffa657]", bg: "bg-[#d18616]/20 border-[#d18616]/40" },
  make_directory:        { icon: <FolderOpen className="h-3 w-3" />, label: "Make dir",      color: "text-[#e3b341]", bg: "bg-[#9e6a03]/20 border-[#9e6a03]/40" },
  list_processes:        { icon: <Cpu className="h-3 w-3" />,        label: "List procs",    color: "text-[#8b949e]", bg: "bg-[#21262d] border-[#30363d]" },
  kill_process:          { icon: <Zap className="h-3 w-3" />,        label: "Kill process",  color: "text-[#f85149]", bg: "bg-[#b91c1c]/20 border-[#f85149]/40" },
  get_env:               { icon: <Eye className="h-3 w-3" />,        label: "Get env",       color: "text-[#8b949e]", bg: "bg-[#21262d] border-[#30363d]" },
  set_env:               { icon: <Shield className="h-3 w-3" />,     label: "Set env",       color: "text-[#e3b341]", bg: "bg-[#9e6a03]/20 border-[#9e6a03]/40" },
};

function ToolCard({
  event,
  onApplyCode,
  onFileWrite,
}: {
  event: ToolCallEvent;
  onApplyCode?: (code: string, lang: string) => void;
  onFileWrite?: (filePath: string, content: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const meta = TOOL_META[event.tool] ?? { icon: <Cpu className="h-3 w-3" />, label: event.tool, color: "text-[#8b949e]", bg: "bg-[#21262d] border-[#30363d]" };

  const filePath = (event.params.path ?? event.params.directory ?? "") as string;
  const command = (event.params.command ?? "") as string;
  const desc = (event.params.description ?? "") as string;

  const isWrite = event.tool === "write_file";
  const isRead = event.tool === "read_file";
  const isExec = event.tool === "execute_command";

  return (
    <div className={`rounded-lg border ${meta.bg} my-1.5 overflow-hidden`}>
      <div
        className="flex items-center gap-2 px-2.5 py-1.5 cursor-pointer select-none"
        onClick={() => setExpanded(x => !x)}>
        <span className={meta.color}>{meta.icon}</span>
        <span className={`text-[10px] font-medium ${meta.color}`}>{meta.label}</span>
        {filePath && (
          <span className="text-[10px] text-[#8b949e] font-mono truncate flex-1">{filePath}</span>
        )}
        {isExec && command && (
          <span className="text-[10px] text-[#ffa657] font-mono truncate flex-1">{command}</span>
        )}
        <div className="ml-auto flex items-center gap-1.5 shrink-0">
          {event.status === "pending" && (
            <Loader2 className="h-3 w-3 text-[#8b949e] animate-spin" />
          )}
          {event.status === "done" && (
            <CheckCircle2 className="h-3 w-3 text-[#3fb950]" />
          )}
          {event.status === "error" && (
            <XCircle className="h-3 w-3 text-[#f85149]" />
          )}
          <ChevronRight className={`h-3 w-3 text-[#8b949e] transition-transform ${expanded ? "rotate-90" : ""}`} />
        </div>
      </div>

      {expanded && (
        <div className="border-t border-current/10 px-2.5 pb-2">
          {desc && (
            <p className="text-[10px] text-[#8b949e] italic mt-1.5 mb-1">{desc}</p>
          )}

          {isWrite && Boolean(event.params.content) && (
            <div className="flex gap-1.5 mt-1.5">
              {onApplyCode && (
                <button
                  onClick={() => {
                    const ext = (filePath.split(".").pop() ?? "").toLowerCase();
                    onApplyCode(String(event.params.content), ext);
                  }}
                  className="flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded bg-[#238636]/80 text-[#3fb950] border border-[#3fb950]/30 hover:bg-[#238636] transition-colors">
                  <Eye className="h-2.5 w-2.5" /> View diff
                </button>
              )}
              {onFileWrite && event.status === "done" && (
                <button
                  onClick={() => onFileWrite(filePath, event.params.content as string)}
                  className="flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded bg-[#1f6feb]/80 text-[#58a6ff] border border-[#58a6ff]/30 hover:bg-[#1f6feb] transition-colors">
                  <FilePen className="h-2.5 w-2.5" /> Open in editor
                </button>
              )}
            </div>
          )}

          {event.result && (
            <pre className="mt-1.5 text-[10px] text-[#8b949e] font-mono bg-[#0d1117] rounded p-2 overflow-x-auto max-h-48 overflow-y-auto whitespace-pre-wrap leading-relaxed">
              {isRead || event.tool === "list_files" || event.tool === "search_files"
                ? event.result.slice(0, 1500) + (event.result.length > 1500 ? "\n...(truncated)" : "")
                : event.result}
            </pre>
          )}

          {isExec && !event.result && event.status === "pending" && (
            <p className="text-[10px] text-[#8b949e] mt-1.5 animate-pulse">Running…</p>
          )}
        </div>
      )}
    </div>
  );
}

/* ─── Approval card ─── */
function ApprovalCard({
  event,
  onApprove,
  onDeny,
}: {
  event: ApprovalEvent;
  onApprove: (id: string) => void;
  onDeny: (id: string) => void;
}) {
  return (
    <div className="rounded-lg border bg-[#9e6a03]/20 border-[#9e6a03]/40 my-1.5 overflow-hidden">
      <div className="flex items-center gap-2 px-2.5 py-1.5">
        <Shield className="h-3 w-3 text-[#e3b341]" />
        <span className="text-[10px] font-medium text-[#e3b341]">Approval required</span>
      </div>
      <div className="border-t border-[#9e6a03]/30 px-2.5 pb-2.5">
        <pre className="mt-1.5 text-[10px] text-[#ffa657] font-mono bg-[#0d1117] rounded p-2 overflow-x-auto whitespace-pre-wrap">
          $ {event.command}
        </pre>
        {event.description && (
          <p className="text-[10px] text-[#8b949e] mt-1 mb-2">{event.description}</p>
        )}
        {event.status === "pending" && (
          <div className="flex gap-2 mt-2">
            <button
              onClick={() => onApprove(event.id)}
              className="flex items-center gap-1 text-[10px] px-2 py-1 rounded bg-[#238636] text-white hover:bg-[#2ea043] transition-colors font-medium">
              <CheckCircle2 className="h-3 w-3" /> Approve
            </button>
            <button
              onClick={() => onDeny(event.id)}
              className="flex items-center gap-1 text-[10px] px-2 py-1 rounded bg-[#da3633] text-white hover:bg-[#f85149] transition-colors font-medium">
              <XCircle className="h-3 w-3" /> Deny
            </button>
          </div>
        )}
        {event.status === "approved" && (
          <div className="flex items-center gap-1.5 mt-2">
            <CheckCircle2 className="h-3 w-3 text-[#3fb950]" />
            <span className="text-[10px] text-[#3fb950]">Approved — running…</span>
          </div>
        )}
        {event.status === "denied" && (
          <div className="flex items-center gap-1.5 mt-2">
            <XCircle className="h-3 w-3 text-[#f85149]" />
            <span className="text-[10px] text-[#f85149]">Denied by user</span>
          </div>
        )}
        {event.output && (
          <pre className="mt-1.5 text-[10px] text-[#8b949e] font-mono bg-[#0d1117] rounded p-2 overflow-x-auto max-h-32 overflow-y-auto whitespace-pre-wrap">
            {event.output}
          </pre>
        )}
      </div>
    </div>
  );
}

/* ─── Quick actions ─── */
const QUICK_ACTIONS = [
  { icon: <Code2 className="h-3 w-3" />, label: "Explain code", prompt: "Explain what this code does in detail, covering the key logic and patterns." },
  { icon: <Wrench className="h-3 w-3" />, label: "Fix bugs", prompt: "Find and fix any bugs or issues in this code." },
  { icon: <Sparkles className="h-3 w-3" />, label: "Refactor", prompt: "Refactor this code to be cleaner and more maintainable, following best practices." },
  { icon: <GitBranch className="h-3 w-3" />, label: "Add tests", prompt: "Write comprehensive unit tests for this code." },
];

/* ─── Mode config ─── */
const MODE_CONFIG: Record<AgentMode, { label: string; icon: React.ReactNode; desc: string; endpoint: string }> = {
  agent: {
    label: "Agent",
    icon: <Bot className="h-3 w-3" />,
    desc: "Reads & writes files autonomously",
    endpoint: "/api/ide-agent/stream",
  },
  chat: {
    label: "Chat",
    icon: <Sparkles className="h-3 w-3" />,
    desc: "Conversational code help",
    endpoint: "/api/anthropic/code-assist",
  },
  turbo: {
    label: "Turbo",
    icon: <Zap className="h-3 w-3" />,
    desc: "Maximum speed, minimal prose",
    endpoint: "/api/ide-agent/stream",
  },
};

/* ─── Main component ─── */
export function AIPanel({
  currentFile,
  currentCode,
  language = "txt",
  initialMessage,
  onClose,
  onApplyCode,
  onFileWrite,
  fileTree,
}: AIPanelProps) {
  const [turns, setTurns] = useState<Turn[]>([]);
  const [input, setInput] = useState(initialMessage ?? "");
  const [isStreaming, setIsStreaming] = useState(false);
  const [mode, setMode] = useState<AgentMode>("agent");
  const [selectedModel, setSelectedModel] = useState(MODELS[0].id);
  const [showModelPicker, setShowModelPicker] = useState(false);
  const [chatHistory, setChatHistory] = useState<{ role: string; content: string }[]>([]);
  const [filesWritten, setFilesWritten] = useState(0);

  const endRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const idGen = useId();
  const turnCounter = useRef(0);
  const nextId = () => `${idGen}-${++turnCounter.current}`;

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [turns]);

  useEffect(() => {
    if (initialMessage) { setInput(initialMessage); textareaRef.current?.focus(); }
  }, [initialMessage]);

  /* ─── Mutate an agent turn ─── */
  const mutateTurn = useCallback((turnId: string, updater: (t: AgentTurn) => AgentTurn) => {
    setTurns(prev => prev.map(t =>
      t.role === "agent" && t.data.turnId === turnId
        ? { ...t, data: updater(t.data) }
        : t
    ));
  }, []);

  /* ─── Mutate a specific event in an agent turn ─── */
  const mutateEvent = useCallback(<T extends AnyEvent>(turnId: string, eventId: string, updater: (e: T) => T) => {
    mutateTurn(turnId, turn => ({
      ...turn,
      events: turn.events.map(ev =>
        ev.id === eventId ? updater(ev as T) : ev
      ),
    }));
  }, [mutateTurn]);

  /* ─── Append text to last text event in a turn ─── */
  const appendText = useCallback((turnId: string, chunk: string) => {
    mutateTurn(turnId, turn => {
      const events = [...turn.events];
      const last = events[events.length - 1];
      if (last && last.kind === "text") {
        events[events.length - 1] = { ...last, content: last.content + chunk } as TextEvent;
      } else {
        events.push({ kind: "text", content: chunk } as TextEvent);
      }
      return { ...turn, events };
    });
  }, [mutateTurn]);

  /* ─── Handle approval ─── */
  const handleApprove = useCallback(async (turnId: string, eventId: string, command: string) => {
    mutateEvent<ApprovalEvent>(turnId, eventId, ev => ({ ...ev, status: "approved" }));
    try {
      const res = await fetch("/api/ide-agent/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ command }),
      });
      const json = await res.json() as { ok: boolean; output: string };
      mutateEvent<ApprovalEvent>(turnId, eventId, ev => ({
        ...ev,
        output: json.output,
        status: json.ok ? "approved" : "denied",
      }));
    } catch (e) {
      mutateEvent<ApprovalEvent>(turnId, eventId, ev => ({
        ...ev,
        output: `Error: ${e instanceof Error ? e.message : String(e)}`,
      }));
    }
  }, [mutateEvent]);

  const handleDeny = useCallback((turnId: string, eventId: string) => {
    mutateEvent<ApprovalEvent>(turnId, eventId, ev => ({ ...ev, status: "denied" }));
  }, [mutateEvent]);

  /* ─── Send message ─── */
  const sendMessage = useCallback(async (overrideText?: string) => {
    const text = (overrideText ?? input).trim();
    if (!text || isStreaming) return;
    setInput("");
    setIsStreaming(true);

    const userTurnId = nextId();
    const agentTurnId = nextId();

    setTurns(prev => [
      ...prev,
      { role: "user", data: { turnId: userTurnId, text } },
      { role: "agent", data: { turnId: agentTurnId, events: [], isStreaming: true } },
    ]);

    const newHistory = [...chatHistory, { role: "user", content: text }];
    const cfg = MODE_CONFIG[mode];

    try {
      if (mode === "chat") {
        /* ── Classic streaming chat ── */
        const res = await fetch("/api/anthropic/code-assist", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: text,
            code: currentCode ?? "",
            language,
            filename: currentFile ?? "unknown",
            history: chatHistory,
            model: selectedModel,
          }),
        });
        if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`);

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buf = "";
        let full = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buf += decoder.decode(value, { stream: true });
          const lines = buf.split("\n");
          buf = lines.pop() ?? "";
          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            try {
              const data = JSON.parse(line.slice(6)) as { content?: string; done?: boolean };
              if (data.content) { full += data.content; appendText(agentTurnId, data.content); }
              if (data.done) break;
            } catch { /**/ }
          }
        }

        mutateTurn(agentTurnId, t => ({ ...t, isStreaming: false }));
        setChatHistory([...newHistory, { role: "assistant", content: full }]);

      } else {
        /* ── Agentic loop ── */
        const turboSystem = mode === "turbo"
          ? "You are in Turbo mode — maximum speed, zero fluff. One sentence max before code. Write complete, working code immediately. No preamble. No conclusion."
          : undefined;

        const res = await fetch(cfg.endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: text,
            fileTree,
            currentFile,
            currentCode,
            history: chatHistory,
            model: selectedModel,
            ...(turboSystem ? { systemOverride: turboSystem } : {}),
          }),
        });
        if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`);

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buf = "";
        const toolCallEvents: Map<string, string> = new Map(); /* sseId → turnEventId */
        let localFilesWritten = 0;

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buf += decoder.decode(value, { stream: true });
          const lines = buf.split("\n");
          buf = lines.pop() ?? "";

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            let evt: Record<string, unknown>;
            try { evt = JSON.parse(line.slice(6)) as Record<string, unknown>; }
            catch { continue; }

            switch (evt.type) {
              case "text_delta":
                if (typeof evt.content === "string") appendText(agentTurnId, evt.content);
                break;

              case "tool_call": {
                const evId = nextId();
                toolCallEvents.set(evt.id as string, evId);
                const toolEvt: ToolCallEvent = {
                  kind: "tool_call",
                  id: evId,
                  tool: evt.tool as string,
                  params: evt.params as Record<string, unknown>,
                  status: "pending",
                };
                mutateTurn(agentTurnId, t => ({ ...t, events: [...t.events, toolEvt] }));
                break;
              }

              case "tool_result": {
                const evId = toolCallEvents.get(evt.id as string);
                if (evId) {
                  const result = evt.result as string;
                  mutateEvent<ToolCallEvent>(agentTurnId, evId, ev => ({
                    ...ev,
                    status: result.startsWith("Error") ? "error" : "done",
                    result,
                  }));

                  /* If write_file succeeded, notify editor + count */
                  if (evt.tool === "write_file" && !result.startsWith("Error")) {
                    localFilesWritten++;
                    setFilesWritten(c => c + 1);
                    const toolCallEv = (() => {
                      let found: ToolCallEvent | undefined;
                      setTurns(prev => {
                        for (const t of prev) {
                          if (t.role === "agent" && t.data.turnId === agentTurnId) {
                            found = t.data.events.find(
                              e => e.id === evId && e.kind === "tool_call"
                            ) as ToolCallEvent | undefined;
                          }
                        }
                        return prev;
                      });
                      return found;
                    })();
                    if (toolCallEv && onFileWrite) {
                      onFileWrite(
                        toolCallEv.params.path as string,
                        toolCallEv.params.content as string,
                      );
                    }
                  }
                }
                break;
              }

              case "approval_required": {
                const evId = nextId();
                toolCallEvents.set(evt.id as string, evId);
                const approvalEvt: ApprovalEvent = {
                  kind: "approval",
                  id: evId,
                  command: evt.command as string,
                  description: evt.description as string,
                  status: "pending",
                };
                mutateTurn(agentTurnId, t => ({ ...t, events: [...t.events, approvalEvt] }));
                break;
              }

              case "error":
                mutateTurn(agentTurnId, t => ({
                  ...t,
                  events: [...t.events, { kind: "error", message: evt.message as string } as ErrorEvent],
                }));
                break;

              case "done":
                break;
            }
          }
        }

        mutateTurn(agentTurnId, t => ({ ...t, isStreaming: false }));

        /* Rebuild history for next turn */
        const lastText = (() => {
          let txt = "";
          setTurns(prev => {
            const agentTurn = prev.find(t => t.role === "agent" && t.data.turnId === agentTurnId);
            if (agentTurn && agentTurn.role === "agent") {
              txt = agentTurn.data.events
                .filter(e => e.kind === "text")
                .map(e => (e as TextEvent).content)
                .join("");
            }
            return prev;
          });
          return txt;
        })();
        setChatHistory([...newHistory, { role: "assistant", content: lastText || `(${localFilesWritten} files written)` }]);
      }
    } catch (e) {
      mutateTurn(agentTurnId, t => ({
        ...t,
        isStreaming: false,
        events: [...t.events, { kind: "error", message: e instanceof Error ? e.message : String(e) } as ErrorEvent],
      }));
    } finally {
      setIsStreaming(false);
    }
  }, [
    input, isStreaming, mode, chatHistory, selectedModel,
    currentCode, currentFile, language, fileTree,
    appendText, mutateTurn, mutateEvent, onFileWrite,
  ]);

  /* ─── Render ─── */
  const currentModel = MODELS.find(m => m.id === selectedModel) ?? MODELS[0];
  const isFirstMessage = turns.length === 0;

  return (
    <div className="flex flex-col h-full bg-[#0d1117] text-[#e6edf3]">

      {/* ── Header ── */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-[#21262d] bg-[#161b22] shrink-0">
        <div className="h-6 w-6 rounded bg-gradient-to-br from-[#58a6ff] to-[#a371f7] flex items-center justify-center shrink-0">
          <Sparkles className="h-3.5 w-3.5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold">Agent 4</span>
            {filesWritten > 0 && (
              <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-[#238636]/30 text-[#3fb950] border border-[#238636]/40">
                {filesWritten} file{filesWritten !== 1 ? "s" : ""} written
              </span>
            )}
          </div>
          {currentFile && (
            <p className="text-[10px] text-[#8b949e] truncate">{currentFile}</p>
          )}
        </div>

        <button
          onClick={() => setShowModelPicker(!showModelPicker)}
          className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-[#a371f7]/20 text-[#a371f7] border border-[#a371f7]/30 hover:bg-[#a371f7]/30 transition-colors shrink-0">
          <span className="hidden sm:block">{currentModel.label.split(" ").slice(-1)[0]}</span>
          <ChevronDown className="h-2.5 w-2.5" />
        </button>

        {onClose && (
          <button
            onClick={onClose}
            className="h-6 w-6 flex items-center justify-center rounded text-[#8b949e] hover:text-[#e6edf3] hover:bg-[#21262d] transition-colors">
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Model picker */}
      {showModelPicker && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setShowModelPicker(false)} />
          <div className="absolute right-2 top-12 z-50 bg-[#161b22] border border-[#30363d] rounded-lg shadow-xl py-1 min-w-[220px]">
            {MODELS.map(m => (
              <button key={m.id} onClick={() => { setSelectedModel(m.id); setShowModelPicker(false); }}
                className={`w-full flex items-center justify-between px-3 py-2 text-xs hover:bg-[#21262d] transition-colors ${selectedModel === m.id ? "text-[#58a6ff]" : "text-[#e6edf3]"}`}>
                <span>{m.label}</span>
                <span className={`px-1.5 py-0.5 rounded text-[9px] ${m.badge === "Recommended" ? "bg-[#1f6feb]/20 text-[#58a6ff]" : m.badge === "Fast" ? "bg-green-500/20 text-green-400" : "bg-[#a371f7]/20 text-[#a371f7]"}`}>
                  {m.badge}
                </span>
              </button>
            ))}
          </div>
        </>
      )}

      {/* ── Mode tabs ── */}
      <div className="flex border-b border-[#21262d] bg-[#0d1117] shrink-0">
        {(Object.entries(MODE_CONFIG) as [AgentMode, typeof MODE_CONFIG[AgentMode]][]).map(([modeKey, cfg]) => (
          <button
            key={modeKey}
            onClick={() => setMode(modeKey)}
            title={cfg.desc}
            className={`flex items-center gap-1.5 px-3 py-2 text-[10px] font-medium transition-colors border-b-2 ${
              mode === modeKey
                ? "border-[#a371f7] text-[#a371f7] bg-[#a371f7]/5"
                : "border-transparent text-[#8b949e] hover:text-[#e6edf3]"
            }`}>
            {cfg.icon as React.ReactNode}
            {cfg.label}
          </button>
        ))}
        <div className="flex-1" />
        <button
          onClick={() => { setTurns([]); setChatHistory([]); setFilesWritten(0); }}
          title="Clear conversation"
          className="px-2 text-[#484f58] hover:text-[#8b949e] transition-colors">
          <RefreshCw className="h-3 w-3" />
        </button>
      </div>

      {/* Mode badge */}
      {mode === "agent" && turns.length === 0 && (
        <div className="mx-3 mt-3 p-2.5 rounded-lg bg-[#161b22] border border-[#21262d] text-[10px] text-[#8b949e] leading-relaxed shrink-0">
          <div className="flex items-center gap-1.5 mb-1.5">
            <Bot className="h-3 w-3 text-[#a371f7]" />
            <span className="font-medium text-[#a371f7]">Agent 4 — Full permissions</span>
            <span className="ml-auto px-1.5 py-0.5 rounded-full bg-[#238636]/20 border border-[#238636]/30 text-[9px] text-[#3fb950]">18 tools</span>
          </div>
          <div className="grid grid-cols-2 gap-1 mb-1.5">
            {[
              { icon: <Terminal className="h-2.5 w-2.5" />, label: "Shell commands", color: "text-[#ffa657]" },
              { icon: <FilePen className="h-2.5 w-2.5" />, label: "Read/write files", color: "text-[#3fb950]" },
              { icon: <Eye className="h-2.5 w-2.5" />, label: "Query database", color: "text-[#76e3ea]" },
              { icon: <GitBranch className="h-2.5 w-2.5" />, label: "Git operations", color: "text-[#bc8cff]" },
              { icon: <Wrench className="h-2.5 w-2.5" />, label: "Install packages", color: "text-[#3fb950]" },
              { icon: <Search className="h-2.5 w-2.5" />, label: "Browse URLs", color: "text-[#58a6ff]" },
            ].map(cap => (
              <div key={cap.label} className={`flex items-center gap-1 ${cap.color}`}>
                {cap.icon}
                <span className="text-[9px]">{cap.label}</span>
              </div>
            ))}
          </div>
          <p className="text-[9px] text-[#484f58]">No approval gates — all capabilities unlocked. Use the Agent Terminal tab for live shell execution.</p>
        </div>
      )}

      {/* ── Messages ── */}
      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {turns.map(turn => (
          <div key={turn.data.turnId}>
            {turn.role === "user" ? (
              <div className="flex gap-2 flex-row-reverse">
                <div className="h-6 w-6 rounded-full flex items-center justify-center shrink-0 text-[10px] font-bold bg-[#30363d] text-[#e6edf3]">U</div>
                <div className="max-w-[92%] rounded-xl px-3 py-2 text-xs leading-relaxed bg-[#1f6feb] text-white rounded-tr-none">
                  {turn.data.text}
                </div>
              </div>
            ) : (
              <div className="flex gap-2">
                <div className="h-6 w-6 rounded-full flex items-center justify-center shrink-0 bg-gradient-to-br from-[#58a6ff] to-[#a371f7] text-white">
                  {turn.data.isStreaming
                    ? <Loader2 className="h-3 w-3 animate-spin" />
                    : <Sparkles className="h-3 w-3" />
                  }
                </div>
                <div className="max-w-[92%] rounded-xl px-3 py-2 text-xs leading-relaxed bg-[#161b22] text-[#e6edf3] rounded-tl-none flex-1 min-w-0">
                  {turn.data.events.length === 0 && turn.data.isStreaming && (
                    <div className="flex gap-1 py-1">
                      {[0, 1, 2].map(j => (
                        <div key={j} className="h-1.5 w-1.5 rounded-full bg-[#58a6ff] animate-bounce" style={{ animationDelay: `${j * 0.15}s` }} />
                      ))}
                    </div>
                  )}
                  {turn.data.events.map((ev, i) => {
                    if (ev.kind === "text") {
                      return (
                        <MarkdownContent
                          key={i}
                          text={(ev as TextEvent).content}
                          onApply={onApplyCode}
                          currentFile={currentFile}
                        />
                      );
                    }
                    if (ev.kind === "tool_call") {
                      const tev = ev as ToolCallEvent;
                      return (
                        <ToolCard
                          key={i}
                          event={tev}
                          onApplyCode={onApplyCode}
                          onFileWrite={onFileWrite}
                        />
                      );
                    }
                    if (ev.kind === "approval") {
                      const aev = ev as ApprovalEvent;
                      return (
                        <ApprovalCard
                          key={i}
                          event={aev}
                          onApprove={(id) => handleApprove(turn.data.turnId, id, aev.command)}
                          onDeny={(id) => handleDeny(turn.data.turnId, id)}
                        />
                      );
                    }
                    if (ev.kind === "error") {
                      return (
                        <div key={i} className="flex items-start gap-1.5 my-1.5 p-2 rounded bg-[#da3633]/20 border border-[#f85149]/30 text-[10px] text-[#f85149]">
                          <AlertTriangle className="h-3 w-3 shrink-0 mt-0.5" />
                          {(ev as ErrorEvent).message}
                        </div>
                      );
                    }
                    return null;
                  })}
                </div>
              </div>
            )}
          </div>
        ))}
        <div ref={endRef} />
      </div>

      {/* ── Quick actions (first message only) ── */}
      {isFirstMessage && !isStreaming && (
        <div className="px-3 pb-2 grid grid-cols-2 gap-1.5 shrink-0">
          {QUICK_ACTIONS.map(a => (
            <button
              key={a.label}
              onClick={() => sendMessage(a.prompt)}
              className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg bg-[#161b22] border border-[#21262d] text-[10px] text-[#8b949e] hover:text-[#e6edf3] hover:border-[#30363d] transition-colors text-left">
              <span className="text-[#58a6ff]">{a.icon}</span>
              {a.label}
            </button>
          ))}
        </div>
      )}

      {/* ── Input ── */}
      <div className="border-t border-[#21262d] p-2 bg-[#161b22] shrink-0">
        <div className={`flex items-end gap-2 bg-[#21262d] rounded-xl border px-3 py-2 transition-colors ${isStreaming ? "border-[#a371f7]/50" : "border-[#30363d]"}`}>
          <textarea
            ref={textareaRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
            placeholder={
              isStreaming
                ? mode === "agent" ? "Agent is working…" : "Claude is thinking…"
                : mode === "agent"
                  ? "Tell the agent what to build or fix…"
                  : mode === "turbo"
                    ? "Ask anything — Turbo mode: instant code…"
                    : "Ask about your code… (⌘I for inline)"
            }
            rows={1}
            disabled={isStreaming}
            className="flex-1 bg-transparent text-xs text-[#e6edf3] placeholder-[#484f58] outline-none resize-none disabled:opacity-50"
            style={{ maxHeight: 100 }}
          />
          <button
            onClick={() => sendMessage()}
            disabled={isStreaming || !input.trim()}
            className="h-6 w-6 flex items-center justify-center rounded-lg bg-[#a371f7] hover:bg-[#8957e5] text-white transition-colors shrink-0 disabled:opacity-30">
            {isStreaming
              ? <div className="h-3 w-3 border border-white/30 border-t-white rounded-full animate-spin" />
              : <Send className="h-3 w-3" />
            }
          </button>
        </div>
        <p className="text-[9px] text-[#484f58] text-center mt-1.5">
          {MODE_CONFIG[mode].desc} · {currentModel.label}
        </p>
      </div>
    </div>
  );
}
