import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Editor from "@monaco-editor/react";
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import { WebLinksAddon } from "@xterm/addon-web-links";
import {
  X, ExternalLink, RefreshCw, FileCode, Globe, Folder,
  FolderOpen, Copy, Check, Download, Maximize2, Minimize2,
  Play, Code2, File, ArrowLeft, Terminal as TerminalIcon,
  Plus, RotateCcw, Circle, Square, ChevronRight, GitBranch,
  Package, Lock, Wifi, Bug, Zap,
} from "lucide-react";

function cn(...classes: (string | undefined | false | null)[]) {
  return classes.filter(Boolean).join(" ");
}

export interface ProjectFile {
  path: string;
  content: string;
  language?: string;
}

interface ProjectIDEPanelProps {
  projectId: string;
  files: ProjectFile[];
  onClose: () => void;
  onRefresh?: () => void;
  title?: string;
}

const LANG_MAP: Record<string, string> = {
  html: "html", htm: "html", css: "css",
  js: "javascript", mjs: "javascript", cjs: "javascript",
  ts: "typescript", tsx: "typescript", jsx: "javascript",
  json: "json", json5: "json",
  py: "python",
  md: "markdown", mdx: "markdown",
  sh: "shell", bash: "shell", zsh: "shell",
  yaml: "yaml", yml: "yaml",
  toml: "toml", ini: "ini", env: "shell",
  rs: "rust", go: "go", rb: "ruby",
  java: "java", kt: "kotlin", swift: "swift",
  cpp: "cpp", c: "c", cs: "csharp",
  php: "php", lua: "lua", r: "r",
  sql: "sql", graphql: "graphql",
  dockerfile: "dockerfile", xml: "xml", svg: "xml",
  vue: "html", svelte: "html",
};

const ICON_COLORS: Record<string, string> = {
  html: "text-orange-400", css: "text-blue-400",
  javascript: "text-yellow-400", typescript: "text-blue-400",
  json: "text-yellow-300", python: "text-green-400",
  markdown: "text-purple-400", shell: "text-green-300",
  yaml: "text-pink-400", rust: "text-orange-500",
  go: "text-cyan-400", ruby: "text-red-400",
  java: "text-orange-300", cpp: "text-blue-300",
  php: "text-violet-400", lua: "text-blue-200",
  sql: "text-yellow-500",
};

function getLanguage(filePath: string): string {
  const name = filePath.split("/").pop() ?? filePath;
  const lname = name.toLowerCase();
  if (lname === "dockerfile") return "dockerfile";
  const ext = lname.split(".").pop() ?? "";
  return LANG_MAP[ext] ?? "plaintext";
}

function getFileColor(filePath: string): string {
  const lang = getLanguage(filePath);
  return ICON_COLORS[lang] ?? "text-white/40";
}

function getRunCommand(files: ProjectFile[]): { cmd: string; lang: string } | null {
  const hasFile = (name: string) => files.some(f => f.path.endsWith(name));
  if (hasFile("index.html")) return null; // static — preview only
  if (hasFile("package.json")) return { cmd: "npm run dev || node index.js || node src/index.js", lang: "node" };
  if (hasFile("requirements.txt") || hasFile("app.py") || hasFile("main.py")) return { cmd: "python app.py || python main.py", lang: "python" };
  if (hasFile("main.go")) return { cmd: "go run .", lang: "go" };
  if (hasFile("Cargo.toml")) return { cmd: "cargo run", lang: "rust" };
  if (hasFile("index.js") || hasFile("server.js")) return { cmd: "node index.js || node server.js", lang: "node" };
  return null;
}

/* ─── Embedded Terminal ─── */
function EmbeddedTerminal({ projectId, projectDir }: { projectId: string; projectDir?: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const termRef = useRef<Terminal | null>(null);
  const fitRef = useRef<FitAddon | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const [connected, setConnected] = useState(false);
  const [sessions, setSessions] = useState([{ id: 1, label: "bash" }]);
  const [activeSession, setActiveSession] = useState(1);
  const BASE_URL = (import.meta.env.BASE_URL ?? "").replace(/\/$/, "");

  const connect = useCallback((cwd?: string) => {
    if (!containerRef.current) return;
    termRef.current?.dispose();
    wsRef.current?.close();

    const term = new Terminal({
      theme: {
        background: "#0d1117", foreground: "#c9d1d9", cursor: "#58a6ff",
        cursorAccent: "#0d1117", black: "#21262d", red: "#ff7b72",
        green: "#3fb950", yellow: "#d29922", blue: "#58a6ff",
        magenta: "#bc8cff", cyan: "#76e3ea", white: "#b1bac4",
        brightBlack: "#484f58", brightRed: "#ffa198", brightGreen: "#56d364",
        brightYellow: "#e3b341", brightBlue: "#79c0ff", brightMagenta: "#d2a8ff",
        brightCyan: "#b3f0ff", brightWhite: "#f0f6fc",
        selectionBackground: "rgba(56,139,253,0.25)",
      },
      fontFamily: "'JetBrains Mono','Fira Code','Cascadia Code','Courier New',monospace",
      fontSize: 12, lineHeight: 1.5, cursorBlink: true, cursorStyle: "bar",
      scrollback: 3000, convertEol: true,
    });

    const fit = new FitAddon();
    const links = new WebLinksAddon();
    term.loadAddon(fit);
    term.loadAddon(links);
    term.open(containerRef.current);
    setTimeout(() => fit.fit(), 50);

    termRef.current = term;
    fitRef.current = fit;

    const proto = window.location.protocol === "https:" ? "wss" : "ws";
    const host = window.location.host;
    const cwdPath = cwd ?? projectDir ?? `/home/runner/workspace/projects/${projectId}`;
    const wsUrl = `${proto}://${host}${BASE_URL}/api/terminal/ws?cwd=${encodeURIComponent(cwdPath)}`;

    term.writeln("\x1b[90m⚡ Connecting to terminal…\x1b[0m");
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => { setConnected(true); term.writeln("\x1b[32m✓ Shell ready\x1b[0m"); };
    ws.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data);
        if (msg.type === "output") term.write(msg.data);
        if (msg.type === "exit") term.writeln(`\r\n\x1b[90m[Process exited: ${msg.code}]\x1b[0m`);
        if (msg.type === "error") term.writeln(`\r\n\x1b[31m${msg.data}\x1b[0m`);
      } catch { /* noop */ }
    };
    ws.onerror = () => { setConnected(false); term.writeln("\r\n\x1b[31m✗ Connection error\x1b[0m"); };
    ws.onclose = () => { setConnected(false); term.writeln("\r\n\x1b[90m[disconnected]\x1b[0m"); };
    term.onData(data => { if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ type: "input", data })); });
    term.onResize(({ cols, rows }) => { if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ type: "resize", cols, rows })); });
  }, [projectId, projectDir, BASE_URL]);

  useEffect(() => {
    const id = "xterm-css";
    if (!document.getElementById(id)) {
      const link = document.createElement("link");
      link.id = id; link.rel = "stylesheet";
      link.href = "https://cdn.jsdelivr.net/npm/@xterm/xterm@5.5.0/css/xterm.min.css";
      document.head.appendChild(link);
    }
    connect();
    const onResize = () => fitRef.current?.fit();
    window.addEventListener("resize", onResize);
    return () => { window.removeEventListener("resize", onResize); wsRef.current?.close(); termRef.current?.dispose(); };
  }, [connect]);

  const runCommand = (cmd: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "input", data: cmd + "\n" }));
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#0d1117]">
      {/* Terminal header */}
      <div className="flex items-center gap-1 px-2 py-1 border-b border-white/[0.07] shrink-0">
        <div className="flex items-center gap-0.5 flex-1 overflow-x-auto">
          {sessions.map(s => (
            <button key={s.id} onClick={() => setActiveSession(s.id)}
              className={cn("flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] shrink-0 transition-colors",
                s.id === activeSession ? "bg-white/10 text-white" : "text-white/40 hover:text-white/70")}>
              <Circle size={5} className={connected ? "fill-green-400 text-green-400" : "fill-white/20 text-white/20"} />
              {s.label}
            </button>
          ))}
          <button onClick={() => { const id = sessions.length + 1; setSessions(p => [...p, { id, label: "bash" }]); connect(); }}
            className="w-5 h-5 flex items-center justify-center text-white/30 hover:text-white rounded">
            <Plus size={10} />
          </button>
        </div>
        <button onClick={() => connect()} title="Restart"
          className="w-6 h-6 flex items-center justify-center text-white/30 hover:text-white rounded">
          <RotateCcw size={11} />
        </button>
      </div>

      {/* Quick run buttons */}
      <div className="flex items-center gap-1 px-2 py-1 border-b border-white/[0.05] shrink-0 overflow-x-auto">
        {[
          { label: "npm install", icon: Package },
          { label: "npm run dev", icon: Play },
          { label: "npm run build", icon: Zap },
          { label: "npm test", icon: Bug },
          { label: "git status", icon: GitBranch },
          { label: "ls -la", icon: Folder },
        ].map(({ label, icon: Icon }) => (
          <button key={label} onClick={() => runCommand(label)}
            className="flex items-center gap-1 px-2 py-0.5 rounded border border-white/10 text-[10px] text-white/50 hover:text-white hover:border-white/25 transition-colors shrink-0">
            <Icon size={8} />
            {label}
          </button>
        ))}
      </div>

      {/* xterm container */}
      <div ref={containerRef} className="flex-1 overflow-hidden px-1 py-1 min-h-0" />

      {/* Status bar */}
      <div className="flex items-center gap-3 px-2 py-0.5 border-t border-white/[0.04] shrink-0">
        <span className={cn("text-[9px] font-mono", connected ? "text-green-400" : "text-red-400/70")}>
          {connected ? "● connected" : "○ disconnected"}
        </span>
        <span className="text-[9px] text-white/20 font-mono truncate">
          ~/projects/{projectId}
        </span>
      </div>
    </div>
  );
}

/* ─── Main Component ─── */
export default function ProjectIDEPanel({
  projectId, files, onClose, onRefresh, title,
}: ProjectIDEPanelProps) {
  const [mainTab, setMainTab] = useState<"editor" | "preview">("editor");
  const [bottomTab, setBottomTab] = useState<"terminal" | null>(null);
  const [openTabs, setOpenTabs] = useState<string[]>(() => {
    const idx = files.find(f => f.path === "index.html" || f.path === "index.js" || f.path === "main.py");
    return idx ? [idx.path] : files.length > 0 ? [files[0].path] : [];
  });
  const [activeFile, setActiveFile] = useState<string | null>(() => {
    const idx = files.find(f => f.path === "index.html" || f.path === "index.js" || f.path === "main.py");
    return idx?.path ?? files[0]?.path ?? null;
  });
  const [fileContents, setFileContents] = useState<Record<string, string>>(() =>
    Object.fromEntries(files.map(f => [f.path, f.content]))
  );
  const [copied, setCopied] = useState(false);
  const [previewKey, setPreviewKey] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const previewUrl = `/preview/${projectId}/index.html`;
  const projectTitle = title ?? projectId.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase());
  const runInfo = getRunCommand(files);

  useEffect(() => {
    const newContents: Record<string, string> = {};
    files.forEach(f => { newContents[f.path] = fileContents[f.path] ?? f.content; });
    setFileContents(prev => ({ ...newContents, ...prev }));
    if (openTabs.length === 0 && files.length > 0) {
      setOpenTabs([files[0].path]);
      setActiveFile(files[0].path);
    }
  }, [files]);

  function openFile(path: string) {
    if (!openTabs.includes(path)) setOpenTabs(prev => [...prev, path]);
    setActiveFile(path);
  }

  function closeTab(path: string, e: React.MouseEvent) {
    e.stopPropagation();
    const newTabs = openTabs.filter(t => t !== path);
    setOpenTabs(newTabs);
    if (activeFile === path) setActiveFile(newTabs[newTabs.length - 1] ?? null);
  }

  function handleCopy() {
    if (activeFile && fileContents[activeFile]) {
      try { navigator.clipboard?.writeText(fileContents[activeFile]); } catch { /* noop */ }
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    }
  }

  const selectedContent = activeFile ? (fileContents[activeFile] ?? "") : "";
  const language = activeFile ? getLanguage(activeFile) : "plaintext";

  const sortedFiles = [...files].sort((a, b) => {
    const priority = ["index.html", "index.js", "main.py", "app.py", "server.js"];
    const ai = priority.indexOf(a.path);
    const bi = priority.indexOf(b.path);
    if (ai >= 0 && bi >= 0) return ai - bi;
    if (ai >= 0) return -1;
    if (bi >= 0) return 1;
    return a.path.localeCompare(b.path);
  });

  return (
    <motion.div
      initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
      transition={{ type: "spring", stiffness: 380, damping: 38 }}
      className={cn("absolute inset-0 z-50 flex flex-col", isFullscreen && "fixed inset-0 z-[100]")}
      style={{ background: "#0d1117" }}
    >
      {/* ── Header ── */}
      <div className="flex items-center gap-2 px-3 pt-10 pb-2 border-b border-white/[0.08] shrink-0 bg-[#161b22]">
        <button onClick={onClose} className="text-white/50 hover:text-white transition-colors shrink-0">
          <ArrowLeft size={16} />
        </button>
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className="w-5 h-5 rounded bg-blue-500/20 border border-blue-400/30 flex items-center justify-center shrink-0">
            <Code2 size={10} className="text-blue-400" />
          </div>
          <div className="min-w-0">
            <div className="text-sm font-semibold text-white truncate">{projectTitle}</div>
            <div className="text-[10px] text-white/35">{files.length} file{files.length !== 1 ? "s" : ""} · {projectId}</div>
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {runInfo && (
            <button onClick={() => setBottomTab(p => p === "terminal" ? null : "terminal")}
              className={cn("flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium transition-colors border",
                bottomTab === "terminal"
                  ? "bg-green-500/15 border-green-500/30 text-green-300"
                  : "border-white/10 text-white/40 hover:text-white"
              )}>
              <Play size={9} fill="currentColor" />
              Run
            </button>
          )}
          <button onClick={() => window.open(previewUrl, "_blank")}
            className="w-7 h-7 flex items-center justify-center text-white/40 hover:text-white rounded" title="Open in new tab">
            <ExternalLink size={13} />
          </button>
          <button onClick={() => setIsFullscreen(v => !v)}
            className="w-7 h-7 flex items-center justify-center text-white/40 hover:text-white rounded">
            {isFullscreen ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
          </button>
          <button onClick={onClose}
            className="w-7 h-7 flex items-center justify-center text-white/40 hover:text-white rounded">
            <X size={14} />
          </button>
        </div>
      </div>

      {/* ── Main Tab Bar ── */}
      <div className="flex border-b border-white/[0.08] bg-[#161b22] shrink-0">
        <button onClick={() => setMainTab("editor")}
          className={cn("flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium border-b-2 transition-colors",
            mainTab === "editor" ? "border-blue-400 text-blue-300" : "border-transparent text-white/40 hover:text-white/70")}>
          <FileCode size={12} />
          Editor
          <span className={cn("text-[10px] px-1.5 py-0.5 rounded-full",
            mainTab === "editor" ? "bg-blue-500/20 text-blue-300" : "bg-white/8 text-white/30")}>
            {files.length}
          </span>
        </button>
        <button onClick={() => setMainTab("preview")}
          className={cn("flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium border-b-2 transition-colors",
            mainTab === "preview" ? "border-green-400 text-green-300" : "border-transparent text-white/40 hover:text-white/70")}>
          <Globe size={12} />
          Live Preview
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
        </button>
        <button onClick={() => setBottomTab(p => p === "terminal" ? null : "terminal")}
          className={cn("flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium border-b-2 transition-colors ml-auto",
            bottomTab === "terminal" ? "border-amber-400 text-amber-300" : "border-transparent text-white/40 hover:text-white/70")}>
          <TerminalIcon size={12} />
          Terminal
        </button>
      </div>

      {/* ── Body ── */}
      <div className="flex-1 flex flex-col min-h-0">
        <AnimatePresence mode="wait">
          {/* ── Editor Tab ── */}
          {mainTab === "editor" && (
            <motion.div key="editor" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className={cn("flex min-h-0", bottomTab ? "flex-1" : "flex-1")}>
              {/* File Tree Sidebar */}
              <div className="w-36 border-r border-white/[0.07] bg-[#0d1117] flex flex-col shrink-0">
                <div className="px-2 pt-2 pb-1">
                  <div className="flex items-center gap-1.5 px-2 py-1">
                    <FolderOpen size={11} className="text-yellow-400/70" />
                    <span className="text-[10px] text-white/30 font-medium uppercase tracking-wider">Files</span>
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto px-2 pb-2 space-y-0.5">
                  {sortedFiles.map(file => (
                    <button key={file.path} onClick={() => openFile(file.path)}
                      className={cn("w-full flex items-center gap-2 px-2 py-1.5 text-xs text-left transition-colors rounded-md",
                        activeFile === file.path
                          ? "bg-blue-500/15 text-white border border-blue-500/25"
                          : "text-white/55 hover:text-white hover:bg-white/5")}>
                      <FileCode size={11} className={getFileColor(file.path)} />
                      <span className="flex-1 truncate text-[11px]">{file.path.split("/").pop()}</span>
                      {file.path.includes("/") && (
                        <span className="text-white/20 text-[9px] truncate max-w-[40px]">
                          {file.path.split("/").slice(0, -1).join("/")}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
                {/* Sidebar bottom icons */}
                <div className="flex flex-col gap-1 px-2 pb-3 pt-1 border-t border-white/[0.05]">
                  {[
                    { Icon: GitBranch, label: "Git", color: "text-orange-400/60" },
                    { Icon: Package, label: "Packages", color: "text-blue-400/60" },
                    { Icon: Lock, label: "Secrets", color: "text-green-400/60" },
                    { Icon: Wifi, label: "Hosting", color: "text-purple-400/60" },
                  ].map(({ Icon, label, color }) => (
                    <button key={label} title={label}
                      className="flex items-center gap-2 px-2 py-1 rounded text-[10px] text-white/30 hover:text-white/70 hover:bg-white/5 transition-colors">
                      <Icon size={11} className={color} />
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Editor Main Area */}
              <div className="flex-1 flex flex-col min-w-0 min-h-0">
                {/* Open file tabs */}
                {openTabs.length > 0 && (
                  <div className="flex items-center border-b border-white/[0.07] bg-[#161b22] overflow-x-auto shrink-0">
                    {openTabs.map(tab => {
                      const name = tab.split("/").pop() ?? tab;
                      return (
                        <div key={tab} onClick={() => setActiveFile(tab)}
                          className={cn("flex items-center gap-1.5 px-3 py-2 text-[11px] cursor-pointer border-r border-white/[0.06] shrink-0 group transition-colors",
                            activeFile === tab
                              ? "bg-[#0d1117] text-white border-t border-t-blue-400"
                              : "text-white/45 hover:text-white/75 hover:bg-white/5")}>
                          <FileCode size={10} className={getFileColor(tab)} />
                          <span>{name}</span>
                          <button onClick={e => closeTab(tab, e)}
                            className="opacity-0 group-hover:opacity-100 w-3.5 h-3.5 flex items-center justify-center text-white/40 hover:text-white rounded transition-all">
                            <X size={8} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}

                {activeFile ? (
                  <>
                    {/* Monaco Editor */}
                    <div className="flex-1 min-h-0 overflow-hidden">
                      <Editor
                        height="100%"
                        language={language}
                        value={selectedContent}
                        onChange={val => {
                          if (activeFile && val !== undefined) {
                            setFileContents(prev => ({ ...prev, [activeFile]: val }));
                          }
                        }}
                        theme="vs-dark"
                        options={{
                          fontSize: 12,
                          fontFamily: "'JetBrains Mono','Fira Code','Cascadia Code','Courier New',monospace",
                          lineHeight: 1.6,
                          minimap: { enabled: false },
                          scrollBeyondLastLine: false,
                          wordWrap: "on",
                          padding: { top: 12, bottom: 12 },
                          renderLineHighlight: "gutter",
                          smoothScrolling: true,
                          cursorBlinking: "smooth",
                          cursorSmoothCaretAnimation: "on",
                          bracketPairColorization: { enabled: true },
                          guides: { bracketPairs: true, indentation: true },
                          folding: true,
                          foldingHighlight: true,
                          showFoldingControls: "mouseover",
                          renderWhitespace: "selection",
                          tabSize: 2,
                          insertSpaces: true,
                          formatOnPaste: true,
                          formatOnType: false,
                          autoClosingBrackets: "always",
                          autoClosingQuotes: "always",
                          suggestOnTriggerCharacters: true,
                          quickSuggestions: { other: true, comments: false, strings: false },
                          scrollbar: { verticalScrollbarSize: 6, horizontalScrollbarSize: 6 },
                          overviewRulerBorder: false,
                          glyphMargin: false,
                          lineNumbersMinChars: 3,
                          fixedOverflowWidgets: true,
                        }}
                        loading={
                          <div className="flex items-center justify-center h-full bg-[#0d1117]">
                            <div className="flex flex-col items-center gap-2">
                              <div className="w-4 h-4 border-2 border-blue-400/40 border-t-blue-400 rounded-full animate-spin" />
                              <span className="text-[11px] text-white/30">Loading editor…</span>
                            </div>
                          </div>
                        }
                      />
                    </div>

                    {/* Status Bar */}
                    <div className="flex items-center gap-3 px-3 py-1 bg-[#1c2128] border-t border-white/[0.06] shrink-0">
                      <span className="text-[10px] text-blue-400/70 font-mono">{language.toUpperCase()}</span>
                      <span className="text-[10px] text-white/25">{selectedContent.split("\n").length} lines</span>
                      <span className="text-[10px] text-white/25">{(selectedContent.length / 1024).toFixed(1)} KB</span>
                      <span className="text-[10px] text-white/20">UTF-8</span>
                      <div className="flex-1" />
                      <button onClick={handleCopy}
                        className="flex items-center gap-1 text-[10px] text-white/30 hover:text-white transition-colors">
                        {copied ? <><Check size={9} className="text-green-400" /><span className="text-green-400">Copied</span></> : <><Copy size={9} /> Copy</>}
                      </button>
                      <button onClick={() => setMainTab("preview")}
                        className="flex items-center gap-1 text-[10px] text-green-400/70 hover:text-green-400 transition-colors">
                        <Play size={9} fill="currentColor" /> Preview
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-white/20 gap-3">
                    <Code2 size={28} className="opacity-30" />
                    <span className="text-sm">Select a file to edit</span>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* ── Preview Tab ── */}
          {mainTab === "preview" && (
            <motion.div key="preview" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="flex-1 flex flex-col min-h-0">
              <div className="flex items-center gap-2 px-3 py-2 border-b border-white/[0.07] bg-[#161b22] shrink-0">
                <div className="flex items-center gap-1 shrink-0">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-400/60" />
                  <div className="w-2.5 h-2.5 rounded-full bg-yellow-400/60" />
                  <div className="w-2.5 h-2.5 rounded-full bg-green-400/60" />
                </div>
                <div className="flex-1 bg-[#0d1117] border border-white/[0.08] rounded px-2.5 py-1 flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse shrink-0" />
                  <span className="text-[10px] text-white/40 truncate">{previewUrl}</span>
                </div>
                <button onClick={() => setPreviewKey(k => k + 1)}
                  className="w-6 h-6 flex items-center justify-center text-white/40 hover:text-white transition-colors">
                  <RefreshCw size={11} />
                </button>
                <button onClick={() => window.open(previewUrl, "_blank")}
                  className="w-6 h-6 flex items-center justify-center text-white/40 hover:text-white transition-colors">
                  <ExternalLink size={11} />
                </button>
              </div>
              <div className="flex-1 relative bg-white">
                <iframe key={previewKey} src={previewUrl}
                  className="absolute inset-0 w-full h-full border-none"
                  title={`Preview: ${projectTitle}`}
                  sandbox="allow-scripts allow-same-origin allow-forms allow-popups" />
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-[#161b22] border-t border-white/[0.06] shrink-0">
                <span className="text-[10px] text-green-400/70">🟢 Live</span>
                <span className="text-[10px] text-white/25">{projectId}</span>
                <div className="flex-1" />
                <button onClick={() => setMainTab("editor")}
                  className="text-[10px] text-white/30 hover:text-white transition-colors flex items-center gap-1">
                  <Code2 size={9} /> Editor
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Bottom Terminal Panel ── */}
        <AnimatePresence>
          {bottomTab === "terminal" && (
            <motion.div
              key="terminal"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 240, opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ type: "spring", stiffness: 400, damping: 40 }}
              className="shrink-0 border-t border-white/[0.08] overflow-hidden"
            >
              <div className="flex items-center gap-2 px-3 py-1 bg-[#161b22] border-b border-white/[0.07]">
                <TerminalIcon size={11} className="text-amber-400/70" />
                <span className="text-[11px] text-white/50 font-medium">Terminal</span>
                <span className="text-[10px] text-white/25">— {projectId}</span>
                <div className="flex-1" />
                <button onClick={() => setBottomTab(null)}
                  className="w-5 h-5 flex items-center justify-center text-white/30 hover:text-white rounded">
                  <X size={10} />
                </button>
              </div>
              <div style={{ height: 200 }}>
                <EmbeddedTerminal projectId={projectId} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
