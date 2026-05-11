import { useState, useEffect, useCallback, useRef } from "react";
import { useLocation } from "wouter";
import { PanelGroup, Panel, PanelResizeHandle } from "react-resizable-panels";
import {
  ArrowLeft, Play, Square, Share2, Rocket, Settings, Check,
  FileCode, Search, GitBranch, Terminal, Eye, Sparkles, Monitor,
  ChevronDown, X, Circle, Maximize2, Minimize2, Split, Package,
  Database, Lock, RefreshCw, ExternalLink, ChevronRight, Plus,
  Layers, Code2, Globe
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { MonacoEditorPane, getLanguage, type CursorPosition } from "@/components/editor/MonacoEditor";
import { TerminalPane } from "@/components/editor/TerminalPane";
import { CommandPalette } from "@/components/editor/CommandPalette";
import { StatusBar } from "@/components/editor/StatusBar";
import { FileTree, type FileNode } from "@/components/editor/FileTree";
import { AIPanel } from "@/components/editor/AIPanel";
import { SearchPanel } from "@/components/editor/SearchPanel";

/* ─── Types ─────────────────────────────────────────── */
type SidePanel = "files" | "search" | "git" | "extensions" | "secrets" | "database";
type BottomPanel = "terminal" | "preview" | "console";

interface Tab {
  path: string;
  name: string;
  ext: string;
  content: string;
  savedContent: string;
  language: string;
}

interface ConsoleLine {
  text: string;
  level: "info" | "warn" | "error" | "success";
  ts: string;
}

/* ─── Initial demo file tree ─────────────────────────── */
const APP_TSX = `import { useState } from "react";

function App() {
  const [count, setCount] = useState(0);
  const [message, setMessage] = useState("Hello, World!");

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #0d1117 0%, #161b22 100%)",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      color: "#e6edf3",
      fontFamily: "system-ui, sans-serif",
      gap: "2rem",
    }}>
      <div style={{ textAlign: "center" }}>
        <h1 style={{ fontSize: "3rem", fontWeight: "bold", marginBottom: "0.5rem" }}>
          ⚡ {message}
        </h1>
        <p style={{ color: "#8b949e", fontSize: "1.1rem" }}>
          Built with React + TypeScript
        </p>
      </div>

      <div style={{
        background: "#21262d",
        border: "1px solid #30363d",
        borderRadius: "12px",
        padding: "2rem",
        textAlign: "center",
        minWidth: "240px",
      }}>
        <p style={{ color: "#8b949e", marginBottom: "1rem", fontSize: "0.9rem" }}>Counter</p>
        <div style={{ fontSize: "3rem", fontWeight: "bold", color: "#58a6ff", marginBottom: "1rem" }}>
          {count}
        </div>
        <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center" }}>
          <button onClick={() => setCount(c => c - 1)}
            style={{ padding: "0.5rem 1.25rem", borderRadius: "8px", border: "1px solid #30363d", background: "#30363d", color: "#e6edf3", cursor: "pointer", fontSize: "1.1rem", fontWeight: "bold" }}>
            −
          </button>
          <button onClick={() => setCount(c => c + 1)}
            style={{ padding: "0.5rem 1.25rem", borderRadius: "8px", border: "none", background: "#238636", color: "white", cursor: "pointer", fontSize: "1.1rem", fontWeight: "bold" }}>
            +
          </button>
          <button onClick={() => setCount(0)}
            style={{ padding: "0.5rem 1.25rem", borderRadius: "8px", border: "1px solid #f85149", background: "transparent", color: "#f85149", cursor: "pointer", fontSize: "0.85rem" }}>
            Reset
          </button>
        </div>
      </div>

      <input value={message} onChange={e => setMessage(e.target.value)}
        placeholder="Type a message…"
        style={{ background: "#161b22", border: "1px solid #30363d", borderRadius: "8px", padding: "0.75rem 1rem", color: "#e6edf3", fontSize: "1rem", outline: "none", width: "300px" }}
      />
    </div>
  );
}

export default App;
`;

const MAIN_TSX = `import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
`;

const INDEX_CSS = `*, *::before, *::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: system-ui, -apple-system, sans-serif;
  background: #0d1117;
  color: #e6edf3;
}

#root {
  min-height: 100vh;
}
`;

const PKG_JSON = `{
  "name": "my-web-app",
  "version": "0.1.0",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^19.0.0",
    "react-dom": "^19.0.0"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^5.0.0",
    "typescript": "^5.0.0",
    "vite": "^7.0.0"
  }
}
`;

const README_MD = `# My Web App

A React + TypeScript app built with Vite.

## Getting Started

\`\`\`bash
npm install
npm run dev
\`\`\`

## Features

- ⚡ Vite for lightning-fast builds
- ⚛️ React 19
- 🔷 TypeScript
- 🎨 CSS3
- 🚀 Deploy to Replit in one click
`;

const DEMO_TREE: FileNode[] = [
  {
    name: "my-web-app", path: "my-web-app", type: "dir",
    children: [
      {
        name: "src", path: "my-web-app/src", type: "dir",
        children: [
          { name: "App.tsx", path: "my-web-app/src/App.tsx", type: "file", ext: "tsx", content: APP_TSX } as FileNode & { content: string },
          { name: "main.tsx", path: "my-web-app/src/main.tsx", type: "file", ext: "tsx", content: MAIN_TSX } as FileNode & { content: string },
          { name: "index.css", path: "my-web-app/src/index.css", type: "file", ext: "css", content: INDEX_CSS } as FileNode & { content: string },
        ],
      },
      { name: "package.json", path: "my-web-app/package.json", type: "file", ext: "json", content: PKG_JSON } as FileNode & { content: string },
      { name: "README.md", path: "my-web-app/README.md", type: "file", ext: "md", content: README_MD } as FileNode & { content: string },
    ],
  },
];

/* ─── Helpers ────────────────────────────────────────── */
function flattenTree(nodes: FileNode[]): (FileNode & { content?: string })[] {
  return nodes.flatMap(n =>
    n.type === "file"
      ? [n as FileNode & { content?: string }]
      : flattenTree(n.children ?? [])
  );
}

function buildPreviewHtml(code: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>Preview</title>
  <script src="https://unpkg.com/react@18/umd/react.development.js"></script>
  <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
  <style>*{margin:0;padding:0;box-sizing:border-box}body{background:#0d1117;color:#e6edf3;font-family:system-ui,sans-serif}</style>
</head>
<body>
  <div id="root"></div>
  <script type="text/babel">
    ${code.replace(/^import\s+.*?(\n|;)/gm, "").replace(/export\s+default\s+/, "const __App = ")}
    const _root = ReactDOM.createRoot(document.getElementById('root'));
    _root.render(React.createElement(typeof __App !== 'undefined' ? __App : () => React.createElement('div', {style:{padding:'2rem',color:'#8b949e'}}, 'Export default not found')));
  </script>
</body>
</html>`;
}

function nodeToTab(node: FileNode & { content?: string }): Tab {
  const content = node.content ?? "";
  return {
    path: node.path,
    name: node.name,
    ext: node.ext ?? "",
    content,
    savedContent: content,
    language: getLanguage(node.ext ?? ""),
  };
}

const STORAGE_KEY = "replit-ide-open-tabs";

function addToTree(nodes: FileNode[], parentPath: string, newNode: FileNode): FileNode[] {
  if (!parentPath) return [...nodes, newNode];
  return nodes.map(n => {
    if (n.path === parentPath && n.type === "dir") return { ...n, children: [...(n.children ?? []), newNode] };
    if (n.children) return { ...n, children: addToTree(n.children, parentPath, newNode) };
    return n;
  });
}

function removeFromTree(nodes: FileNode[], targetPath: string): FileNode[] {
  return nodes
    .filter(n => n.path !== targetPath)
    .map(n => n.children ? { ...n, children: removeFromTree(n.children, targetPath) } : n);
}

function renameInTree(nodes: FileNode[], oldPath: string, newName: string, newPath: string): FileNode[] {
  return nodes.map(n => {
    if (n.path === oldPath) return { ...n, name: newName, path: newPath };
    if (n.children) return { ...n, children: renameInTree(n.children, oldPath, newName, newPath) };
    return n;
  });
}

/* ─── Main Editor Component ──────────────────────────── */
export default function Editor() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  /* Layout */
  const [sidePanel, setSidePanel] = useState<SidePanel>("files");
  const [bottomPanel, setBottomPanel] = useState<BottomPanel>("terminal");
  const [showAI, setShowAI] = useState(true);
  const [showBottom, setShowBottom] = useState(true);
  const [showSide, setShowSide] = useState(true);
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [isSplitView, setIsSplitView] = useState(false);
  const [isBottomExpanded, setIsBottomExpanded] = useState(false);

  /* Editor */
  const [tabs, setTabs] = useState<Tab[]>([]);
  const [activeTabIdx, setActiveTabIdx] = useState(0);
  const [splitTabIdx, setSplitTabIdx] = useState(1);
  const [tree, setTree] = useState<FileNode[]>(DEMO_TREE);
  const [cursorPos, setCursorPos] = useState<CursorPosition>({ line: 1, column: 1 });
  const [aiPrompt, setAiPrompt] = useState<string | undefined>();

  /* Runtime */
  const [isRunning, setIsRunning] = useState(false);
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [consoleLines, setConsoleLines] = useState<ConsoleLine[]>([
    { text: "Ready. Click Run to start your project.", level: "info", ts: new Date().toLocaleTimeString() },
  ]);
  const [copied, setCopied] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const activeTab = tabs[activeTabIdx] ?? null;
  const splitTab = tabs[splitTabIdx] ?? null;

  /* ─── Init tabs from localStorage ─── */
  useEffect(() => {
    const allFiles = flattenTree(DEMO_TREE);
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const paths: string[] = JSON.parse(saved);
        const restored = paths.map(p => allFiles.find(f => f.path === p)).filter(Boolean).map(f => nodeToTab(f!));
        if (restored.length > 0) { setTabs(restored); return; }
      }
    } catch { /**/ }
    const def = allFiles[0];
    if (def) setTabs([nodeToTab(def)]);
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tabs.map(t => t.path)));
  }, [tabs]);

  /* ─── Keyboard shortcuts ─── */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const ctrl = e.ctrlKey || e.metaKey;
      if (ctrl && e.key === "k") { e.preventDefault(); setShowCommandPalette(true); }
      if (ctrl && e.key === "`") { e.preventDefault(); setShowBottom(p => !p); }
      if (ctrl && e.key === "\\") { e.preventDefault(); setIsSplitView(p => !p); }
      if (ctrl && e.shiftKey && e.key.toUpperCase() === "F") { e.preventDefault(); setSidePanel("search"); setShowSide(true); }
      if (ctrl && e.shiftKey && e.key.toUpperCase() === "A") { e.preventDefault(); setShowAI(p => !p); }
      if (ctrl && e.shiftKey && e.key.toUpperCase() === "P") { e.preventDefault(); setBottomPanel("preview"); setShowBottom(true); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  /* ─── File operations ─── */
  const openFile = useCallback((node: FileNode & { content?: string }) => {
    if (node.type !== "file") return;
    const existing = tabs.findIndex(t => t.path === node.path);
    if (existing >= 0) { setActiveTabIdx(existing); return; }
    const tab = nodeToTab(node);
    setTabs(prev => {
      const next = [...prev, tab];
      setActiveTabIdx(next.length - 1);
      return next;
    });
  }, [tabs]);

  const closeTab = (e: React.MouseEvent, idx: number) => {
    e.stopPropagation();
    setTabs(prev => {
      if (prev.length === 1) return prev;
      const next = prev.filter((_, i) => i !== idx);
      if (activeTabIdx >= next.length) setActiveTabIdx(next.length - 1);
      else if (activeTabIdx === idx) setActiveTabIdx(Math.max(0, idx - 1));
      return next;
    });
  };

  const handleCodeChange = useCallback((val: string) => {
    setTabs(prev => prev.map((t, i) => i === activeTabIdx ? { ...t, content: val } : t));
  }, [activeTabIdx]);

  const saveActiveFile = useCallback(async () => {
    if (!activeTab) return;
    setTabs(prev => prev.map((t, i) => i === activeTabIdx ? { ...t, savedContent: t.content } : t));
    toast({ title: "Saved", description: activeTab.name });
    try {
      await fetch(`/api/files/write?path=${encodeURIComponent(activeTab.path)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: activeTab.content }),
      });
    } catch { /**/ }
  }, [activeTab, activeTabIdx, toast]);

  const handleNewFile = useCallback((parentPath: string) => {
    const name = window.prompt("File name (e.g. utils.ts):");
    if (!name?.trim()) return;
    const trimmed = name.trim();
    const path = parentPath ? `${parentPath}/${trimmed}` : `my-web-app/${trimmed}`;
    const ext = trimmed.split(".").pop() ?? "";
    const newNode = { name: trimmed, path, type: "file" as const, ext, content: "" };
    setTree(prev => addToTree(prev, parentPath, newNode));
    openFile(newNode);
  }, [openFile]);

  const handleNewFolder = useCallback((parentPath: string) => {
    const name = window.prompt("Folder name:");
    if (!name?.trim()) return;
    const trimmed = name.trim();
    const path = parentPath ? `${parentPath}/${trimmed}` : `my-web-app/${trimmed}`;
    const newNode: FileNode = { name: trimmed, path, type: "dir", children: [] };
    setTree(prev => addToTree(prev, parentPath, newNode));
  }, []);

  const handleDelete = useCallback((node: FileNode) => {
    if (!window.confirm(`Delete "${node.name}"?`)) return;
    setTree(prev => removeFromTree(prev, node.path));
    setTabs(prev => prev.filter(t => !t.path.startsWith(node.path)));
  }, []);

  const handleRename = useCallback((node: FileNode, newName: string) => {
    const newPath = node.path.replace(/[^/]+$/, newName);
    setTree(prev => renameInTree(prev, node.path, newName, newPath));
    setTabs(prev => prev.map(t =>
      t.path === node.path
        ? { ...t, name: newName, path: newPath, ext: newName.split(".").pop() ?? "", language: getLanguage(newName.split(".").pop() ?? "") }
        : t
    ));
  }, []);

  const handleDownload = useCallback((node: FileNode) => {
    const tab = tabs.find(t => t.path === node.path);
    const content = tab?.content ?? (node as any).content ?? "";
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = node.name; a.click();
    URL.revokeObjectURL(url);
  }, [tabs]);

  /* ─── Run / Stop ─── */
  const handleRun = useCallback(() => {
    setIsRunning(true);
    const appTab = tabs.find(t => t.name === "App.tsx");
    const appFile = flattenTree(tree).find(f => f.name === "App.tsx");
    const code = appTab?.content ?? appFile?.content ?? "";
    setPreviewHtml(buildPreviewHtml(code));
    setBottomPanel("preview");
    setShowBottom(true);
    setConsoleLines([
      { text: "> npm run dev", level: "success", ts: new Date().toLocaleTimeString() },
      { text: "VITE v7.3.2  ready in 312 ms", level: "info", ts: new Date().toLocaleTimeString() },
      { text: "➜  Local:   http://localhost:5173/", level: "success", ts: new Date().toLocaleTimeString() },
      { text: "➜  Network: http://172.31.0.1:5173/", level: "info", ts: new Date().toLocaleTimeString() },
    ]);
    toast({ title: "Running", description: "Dev server started on port 5173" });
  }, [tabs, tree, toast]);

  const handleStop = useCallback(() => {
    setIsRunning(false);
    setPreviewHtml(null);
    setConsoleLines(prev => [...prev, { text: "Process terminated.", level: "error", ts: new Date().toLocaleTimeString() }]);
    toast({ title: "Stopped" });
  }, [toast]);

  const handleDeploy = useCallback(() => {
    toast({ title: "Deploying…", description: "Building for production." });
    setTimeout(() => toast({ title: "Deployed!", description: "Live at https://my-web-app.replit.app" }), 2500);
  }, [toast]);

  const handleShare = useCallback(() => {
    navigator.clipboard.writeText(window.location.href).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({ title: "Link copied!" });
  }, [toast]);

  const dirtyPaths = new Set(tabs.filter(t => t.content !== t.savedContent).map(t => t.path));
  const breadcrumbs = activeTab ? activeTab.path.split("/") : [];
  const filesForSearch = flattenTree(tree).map(f => ({
    ...f,
    content: tabs.find(t => t.path === f.path)?.content ?? f.content ?? "",
  }));

  /* ─── Sidebar toggle button ─── */
  function SideBtn({ icon, id, title }: { icon: React.ReactNode; id: SidePanel; title: string }) {
    return (
      <button
        title={title}
        onClick={() => {
          if (sidePanel === id && showSide) setShowSide(false);
          else { setSidePanel(id); setShowSide(true); }
        }}
        className={`h-9 w-9 flex items-center justify-center rounded transition-colors ${sidePanel === id && showSide ? "text-[#e6edf3] bg-[#21262d]" : "text-[#8b949e] hover:text-[#e6edf3] hover:bg-[#21262d]"}`}>
        {icon}
      </button>
    );
  }

  /* ─── RENDER ─── */
  return (
    <div className="flex flex-col h-screen bg-[#0d1117] text-[#e6edf3] overflow-hidden select-none">

      {/* Command Palette */}
      <CommandPalette
        open={showCommandPalette}
        onClose={() => setShowCommandPalette(false)}
        files={flattenTree(tree)}
        onFileSelect={openFile}
        onRun={handleRun}
        onStop={handleStop}
        onDeploy={handleDeploy}
        onShare={handleShare}
        onNewFile={() => handleNewFile("")}
        onToggleSplit={() => setIsSplitView(p => !p)}
        onToggleAI={() => setShowAI(p => !p)}
        onToggleTerminal={() => { setShowBottom(p => !p); setBottomPanel("terminal"); }}
        onTogglePreview={() => { setShowBottom(true); setBottomPanel("preview"); }}
        isRunning={isRunning}
      />

      {/* ── Header ── */}
      <div className="h-11 flex items-center gap-2 px-3 border-b border-[#21262d] bg-[#161b22] shrink-0 z-20">
        <button onClick={() => setLocation("/")}
          className="flex items-center gap-1.5 text-[#8b949e] hover:text-[#e6edf3] px-2 py-1 rounded hover:bg-[#21262d] transition-colors shrink-0">
          <ArrowLeft className="h-4 w-4" />
        </button>

        <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-[#21262d] border border-[#30363d]">
          <div className="h-4 w-4 rounded bg-gradient-to-br from-[#58a6ff] to-[#a371f7] flex items-center justify-center shrink-0">
            <span className="text-white text-[8px] font-bold">R</span>
          </div>
          <span className="text-xs font-medium">my-web-app</span>
          <ChevronDown className="h-3 w-3 text-[#8b949e]" />
        </div>

        <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#1f6feb]/20 text-[#58a6ff] border border-[#1f6feb]/30">main</span>

        {/* Command palette trigger (desktop) */}
        <button onClick={() => setShowCommandPalette(true)}
          className="hidden md:flex items-center gap-2 flex-1 max-w-xs px-3 py-1 rounded bg-[#21262d] border border-[#30363d] text-xs text-[#484f58] hover:text-[#8b949e] hover:border-[#484f58] transition-colors">
          <Search className="h-3 w-3" />
          <span>Search files, commands…</span>
          <kbd className="ml-auto text-[9px] px-1 rounded bg-[#0d1117] border border-[#30363d]">⌘K</kbd>
        </button>

        <div className="flex-1" />

        <div className="flex items-center gap-1">
          {isRunning ? (
            <button onClick={handleStop}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#da3633] hover:bg-[#f85149] text-white text-xs font-medium transition-colors">
              <Square className="h-3.5 w-3.5" /> Stop
            </button>
          ) : (
            <button onClick={handleRun}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#238636] hover:bg-[#2ea043] text-white text-xs font-medium transition-colors">
              <Play className="h-3.5 w-3.5" /> Run
            </button>
          )}

          <button onClick={handleShare}
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded bg-[#21262d] hover:bg-[#30363d] border border-[#30363d] text-xs transition-colors">
            {copied ? <Check className="h-3.5 w-3.5 text-green-400" /> : <Share2 className="h-3.5 w-3.5" />}
            <span className="hidden lg:inline">Share</span>
          </button>

          <button onClick={handleDeploy}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded bg-[#6e40c9] hover:bg-[#8957e5] text-white text-xs font-medium transition-colors">
            <Rocket className="h-3.5 w-3.5" />
            <span className="hidden lg:inline">Deploy</span>
          </button>

          <button onClick={() => setShowAI(p => !p)}
            title="AI Panel (⌘⇧A)"
            className={`h-8 w-8 flex items-center justify-center rounded transition-colors border ${showAI ? "bg-[#a371f7]/20 border-[#a371f7]/30 text-[#a371f7]" : "border-[#30363d] text-[#8b949e] hover:text-[#e6edf3] hover:bg-[#21262d]"}`}>
            <Sparkles className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* ── Workspace ── */}
      <div className="flex flex-1 overflow-hidden">

        {/* Activity bar */}
        <div className="flex flex-col items-center w-10 border-r border-[#21262d] bg-[#161b22] py-1.5 gap-0.5 shrink-0">
          <SideBtn icon={<FileCode className="h-4 w-4" />} id="files" title="Explorer (⌘⇧E)" />
          <SideBtn icon={<Search className="h-4 w-4" />} id="search" title="Search (⌘⇧F)" />
          <SideBtn icon={<GitBranch className="h-4 w-4" />} id="git" title="Source Control" />
          <SideBtn icon={<Package className="h-4 w-4" />} id="extensions" title="Extensions" />
          <div className="flex-1" />
          <SideBtn icon={<Lock className="h-4 w-4" />} id="secrets" title="Secrets" />
          <SideBtn icon={<Database className="h-4 w-4" />} id="database" title="Database" />
        </div>

        <PanelGroup direction="horizontal" className="flex-1 overflow-hidden">

          {/* ── Side panel ── */}
          {showSide && (
            <>
              <Panel defaultSize={18} minSize={12} maxSize={35}>
                <div className="flex flex-col h-full border-r border-[#21262d] bg-[#0d1117] overflow-hidden">
                  {sidePanel === "files" && (
                    <FileTree
                      tree={tree}
                      selectedPath={activeTab?.path}
                      dirtyPaths={dirtyPaths}
                      onSelect={openFile}
                      onNewFile={handleNewFile}
                      onNewFolder={handleNewFolder}
                      onRename={handleRename}
                      onDelete={handleDelete}
                      onDownload={handleDownload}
                    />
                  )}
                  {sidePanel === "search" && (
                    <SearchPanel files={filesForSearch} onFileSelect={(f) => openFile(f)} />
                  )}
                  {sidePanel === "git" && (
                    <div className="flex flex-col h-full p-3">
                      <p className="text-[10px] font-semibold text-[#8b949e] uppercase tracking-widest mb-3">Source Control</p>
                      {dirtyPaths.size > 0 ? (
                        <div className="space-y-1">
                          <p className="text-[10px] text-[#8b949e] mb-2">Changes ({dirtyPaths.size})</p>
                          {[...dirtyPaths].map(p => (
                            <div key={p} className="flex items-center gap-2 text-xs text-[#f2cc60] px-2 py-1 rounded bg-[#21262d]">
                              <Circle className="h-1.5 w-1.5 fill-[#f2cc60]" />
                              <span className="truncate">{p.split("/").pop()}</span>
                              <span className="ml-auto text-[#484f58] font-mono">M</span>
                            </div>
                          ))}
                          <button className="w-full mt-3 px-3 py-1.5 rounded bg-[#238636] hover:bg-[#2ea043] text-white text-xs transition-colors">
                            Commit Changes
                          </button>
                        </div>
                      ) : (
                        <div className="text-center text-[#484f58] text-xs pt-8">
                          <GitBranch className="h-8 w-8 mx-auto opacity-30 mb-2" />
                          <p>No pending changes</p>
                        </div>
                      )}
                    </div>
                  )}
                  {sidePanel === "extensions" && (
                    <div className="flex flex-col h-full p-3 gap-2 overflow-y-auto">
                      <p className="text-[10px] font-semibold text-[#8b949e] uppercase tracking-widest">Extensions</p>
                      {[
                        { name: "Prettier", desc: "Code formatter", installed: true },
                        { name: "ESLint", desc: "JavaScript linter", installed: true },
                        { name: "GitHub Copilot", desc: "AI completions", installed: false },
                        { name: "Tailwind CSS", desc: "IntelliSense support", installed: false },
                        { name: "Error Lens", desc: "Inline error display", installed: false },
                      ].map(ext => (
                        <div key={ext.name} className="flex items-start gap-2 p-2 rounded bg-[#161b22] border border-[#21262d]">
                          <div className="h-6 w-6 rounded bg-[#21262d] flex items-center justify-center shrink-0">
                            <Package className="h-3.5 w-3.5 text-[#8b949e]" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[11px] font-medium text-[#e6edf3]">{ext.name}</p>
                            <p className="text-[10px] text-[#8b949e]">{ext.desc}</p>
                          </div>
                          <button className={`text-[9px] px-1.5 py-0.5 rounded border transition-colors shrink-0 ${ext.installed ? "border-green-500/30 text-green-400 bg-green-500/10" : "border-[#30363d] text-[#8b949e] hover:bg-[#21262d]"}`}>
                            {ext.installed ? "✓" : "Install"}
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  {sidePanel === "secrets" && (
                    <div className="flex flex-col h-full p-3">
                      <p className="text-[10px] font-semibold text-[#8b949e] uppercase tracking-widest mb-3">Secrets</p>
                      <p className="text-[10px] text-[#8b949e] mb-3">Environment variables injected at runtime</p>
                      <button className="flex items-center gap-2 px-3 py-2 rounded border border-dashed border-[#30363d] text-xs text-[#8b949e] hover:text-[#e6edf3] hover:border-[#484f58] transition-colors w-full">
                        <Plus className="h-3.5 w-3.5" /> Add secret
                      </button>
                    </div>
                  )}
                  {sidePanel === "database" && (
                    <div className="flex flex-col h-full p-3 gap-2">
                      <p className="text-[10px] font-semibold text-[#8b949e] uppercase tracking-widest">Database</p>
                      <div className="flex items-center gap-2 p-2 rounded bg-[#161b22] border border-green-500/20">
                        <Circle className="h-2 w-2 fill-green-400 text-green-400" />
                        <span className="text-xs text-green-400">PostgreSQL connected</span>
                      </div>
                      <p className="text-[10px] text-[#8b949e]">Manage your database via the Database panel in the App Builder.</p>
                    </div>
                  )}
                </div>
              </Panel>
              <PanelResizeHandle className="w-px bg-[#21262d] hover:bg-[#58a6ff] transition-colors cursor-col-resize" />
            </>
          )}

          {/* ── Editor + Bottom ── */}
          <Panel defaultSize={showAI ? 55 : 82} minSize={30}>
            <PanelGroup direction="vertical" className="h-full">
              {/* Editor */}
              <Panel defaultSize={isBottomExpanded ? 20 : 65} minSize={20}>
                <div className="flex flex-col h-full">

                  {/* Tabs */}
                  <div className="flex items-center border-b border-[#21262d] bg-[#161b22] overflow-x-auto shrink-0">
                    {tabs.map((tab, i) => {
                      const dirty = tab.content !== tab.savedContent;
                      const isActive = i === activeTabIdx;
                      return (
                        <div key={tab.path} onClick={() => setActiveTabIdx(i)}
                          className={`flex items-center gap-1.5 px-4 py-2 text-xs cursor-pointer border-r border-[#21262d] transition-colors group shrink-0 min-w-0 ${isActive ? "bg-[#0d1117] text-[#e6edf3] border-t-2 border-t-[#e36209]" : "text-[#8b949e] hover:text-[#e6edf3] hover:bg-[#21262d]"}`}>
                          {dirty
                            ? <Circle className="h-2 w-2 fill-[#f2cc60] text-[#f2cc60] shrink-0" />
                            : <div className="w-2 h-2 shrink-0" />
                          }
                          <span className="truncate max-w-[120px]">{tab.name}</span>
                          <button onClick={e => closeTab(e, i)}
                            className="opacity-0 group-hover:opacity-100 hover:text-red-400 transition-all shrink-0">
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      );
                    })}
                    <button onClick={() => handleNewFile("")}
                      className="h-full px-3 text-[#484f58] hover:text-[#8b949e] hover:bg-[#21262d] transition-colors shrink-0">
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                    {/* Split toggle */}
                    <div className="ml-auto px-2 shrink-0">
                      <button onClick={() => setIsSplitView(p => !p)}
                        title="Split Editor (⌘\)"
                        className={`h-6 w-6 flex items-center justify-center rounded transition-colors ${isSplitView ? "text-[#58a6ff] bg-[#1f6feb]/20" : "text-[#484f58] hover:text-[#8b949e] hover:bg-[#21262d]"}`}>
                        <Split className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Breadcrumbs */}
                  {activeTab && (
                    <div className="flex items-center gap-0.5 px-3 py-1 bg-[#0d1117] border-b border-[#21262d] text-[10px] text-[#8b949e] shrink-0 overflow-x-auto">
                      {breadcrumbs.map((part, i) => (
                        <span key={i} className="flex items-center gap-0.5 shrink-0">
                          {i > 0 && <ChevronRight className="h-2.5 w-2.5 opacity-50" />}
                          <span className={i === breadcrumbs.length - 1 ? "text-[#e6edf3]" : ""}>{part}</span>
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Editor panes */}
                  <div className="flex flex-1 overflow-hidden">
                    {activeTab ? (
                      <>
                        <div className="flex-1 overflow-hidden">
                          <MonacoEditorPane
                            value={activeTab.content}
                            language={activeTab.language}
                            onChange={handleCodeChange}
                            onSave={saveActiveFile}
                            onCursorChange={setCursorPos}
                            onInlineAssist={(selection) => {
                              setShowAI(true);
                              if (selection) {
                                setAiPrompt(`Please explain and improve this code:\n\`\`\`${activeTab.language}\n${selection}\n\`\`\``);
                              } else {
                                setAiPrompt("What would you like help with in this file?");
                              }
                            }}
                          />
                        </div>
                        {isSplitView && splitTab && (
                          <>
                            <div className="w-px bg-[#21262d]" />
                            <div className="flex-1 overflow-hidden flex flex-col">
                              <div className="flex items-center gap-2 px-3 py-1.5 border-b border-[#21262d] bg-[#161b22] shrink-0">
                                {tabs.map((t, i) => (
                                  <button key={t.path}
                                    onClick={() => setSplitTabIdx(i)}
                                    className={`text-xs px-2 py-0.5 rounded transition-colors ${splitTabIdx === i ? "text-[#58a6ff] bg-[#1f6feb]/10" : "text-[#8b949e] hover:text-[#e6edf3]"}`}>
                                    {t.name}
                                  </button>
                                ))}
                              </div>
                              <div className="flex-1 overflow-hidden">
                                <MonacoEditorPane
                                  value={splitTab.content}
                                  language={splitTab.language}
                                  onChange={() => {}}
                                  readOnly
                                />
                              </div>
                            </div>
                          </>
                        )}
                      </>
                    ) : (
                      <div className="flex flex-col items-center justify-center flex-1 text-[#484f58] gap-4 bg-[#0d1117]">
                        <Code2 className="h-12 w-12 opacity-20" />
                        <div className="text-center">
                          <p className="text-sm font-medium text-[#8b949e] mb-1">No file open</p>
                          <p className="text-xs">Select a file from the explorer or press</p>
                          <kbd className="mt-1 inline-block px-1.5 py-0.5 rounded bg-[#21262d] border border-[#30363d] text-[10px]">⌘K</kbd>
                          <span className="text-xs"> to search</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </Panel>

              {/* Bottom panel */}
              {showBottom && (
                <>
                  <PanelResizeHandle className="h-px bg-[#21262d] hover:bg-[#58a6ff] transition-colors cursor-row-resize" />
                  <Panel defaultSize={isBottomExpanded ? 80 : 35} minSize={15} maxSize={isBottomExpanded ? 85 : 65}>
                    <div className="flex flex-col h-full bg-[#0d1117]">
                      {/* Bottom tab bar */}
                      <div className="flex items-center gap-0.5 px-2 py-1 border-b border-[#21262d] bg-[#161b22] shrink-0">
                        {[
                          { id: "terminal" as const, icon: <Terminal className="h-3 w-3" />, label: "Terminal" },
                          { id: "preview" as const, icon: <Globe className="h-3 w-3" />, label: "Preview" },
                          { id: "console" as const, icon: <Layers className="h-3 w-3" />, label: "Console" },
                        ].map(p => (
                          <button key={p.id} onClick={() => setBottomPanel(p.id)}
                            className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs transition-colors ${bottomPanel === p.id ? "bg-[#0d1117] text-[#e6edf3]" : "text-[#8b949e] hover:text-[#e6edf3] hover:bg-[#21262d]"}`}>
                            {p.icon}
                            <span>{p.label}</span>
                            {p.id === "terminal" && <Circle className="h-1.5 w-1.5 fill-green-400 text-green-400" />}
                          </button>
                        ))}
                        <div className="flex-1" />
                        <button onClick={() => setIsBottomExpanded(p => !p)}
                          className="h-6 w-6 flex items-center justify-center rounded text-[#484f58] hover:text-[#8b949e] hover:bg-[#21262d] transition-colors">
                          {isBottomExpanded ? <Minimize2 className="h-3 w-3" /> : <Maximize2 className="h-3 w-3" />}
                        </button>
                        <button onClick={() => setShowBottom(false)}
                          className="h-6 w-6 flex items-center justify-center rounded text-[#484f58] hover:text-red-400 hover:bg-[#21262d] transition-colors">
                          <X className="h-3 w-3" />
                        </button>
                      </div>

                      <div className="flex-1 overflow-hidden">
                        {bottomPanel === "terminal" && <TerminalPane cwd="/home/runner/workspace" />}

                        {bottomPanel === "preview" && (
                          <div className="flex flex-col h-full">
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-[#161b22] border-b border-[#21262d] shrink-0">
                              <div className="flex gap-1.5">
                                <div className="h-2.5 w-2.5 rounded-full bg-[#f85149]" />
                                <div className="h-2.5 w-2.5 rounded-full bg-[#d29922]" />
                                <div className="h-2.5 w-2.5 rounded-full bg-[#3fb950]" />
                              </div>
                              <div className="flex-1 flex items-center gap-2 bg-[#0d1117] border border-[#30363d] rounded px-2 py-0.5 text-[10px] text-[#8b949e]">
                                <Globe className="h-2.5 w-2.5" />
                                <span className="truncate">{isRunning ? "localhost:5173" : "Not running"}</span>
                              </div>
                              <button
                                onClick={() => {
                                  const tab = tabs.find(t => t.name === "App.tsx");
                                  if (tab) setPreviewHtml(buildPreviewHtml(tab.content));
                                }}
                                className="h-5 w-5 flex items-center justify-center rounded text-[#484f58] hover:text-[#8b949e] hover:bg-[#21262d] transition-colors">
                                <RefreshCw className="h-3 w-3" />
                              </button>
                              <button className="h-5 w-5 flex items-center justify-center rounded text-[#484f58] hover:text-[#8b949e] hover:bg-[#21262d] transition-colors">
                                <ExternalLink className="h-3 w-3" />
                              </button>
                            </div>
                            {previewHtml ? (
                              <iframe ref={iframeRef} srcDoc={previewHtml}
                                title="Preview" className="flex-1 border-none bg-white"
                                sandbox="allow-scripts allow-same-origin" />
                            ) : (
                              <div className="flex flex-col items-center justify-center flex-1 text-[#484f58] gap-3">
                                <Monitor className="h-10 w-10 opacity-20" />
                                <div className="text-center">
                                  <p className="text-xs font-medium text-[#8b949e] mb-1">Preview not running</p>
                                  <button onClick={handleRun}
                                    className="flex items-center gap-1.5 mx-auto px-3 py-1.5 rounded bg-[#238636] hover:bg-[#2ea043] text-white text-xs transition-colors mt-2">
                                    <Play className="h-3.5 w-3.5" /> Run Project
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {bottomPanel === "console" && (
                          <div className="flex flex-col h-full font-mono text-[11px]">
                            <div className="flex-1 overflow-y-auto p-3 space-y-0.5">
                              {consoleLines.map((line, i) => (
                                <div key={i} className={`flex items-start gap-2 ${
                                  line.level === "error" ? "text-[#ff7b72]" :
                                  line.level === "warn" ? "text-[#d29922]" :
                                  line.level === "success" ? "text-[#3fb950]" : "text-[#8b949e]"
                                }`}>
                                  <span className="text-[#484f58] shrink-0">[{line.ts}]</span>
                                  <span>{line.text}</span>
                                </div>
                              ))}
                            </div>
                            <div className="border-t border-[#21262d] px-3 py-1.5 flex items-center gap-2 bg-[#161b22] shrink-0">
                              <span className="text-[#3fb950]">$</span>
                              <input className="flex-1 bg-transparent text-[#e6edf3] text-xs outline-none placeholder-[#484f58]"
                                placeholder="Run a command…" />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </Panel>
                </>
              )}
            </PanelGroup>
          </Panel>

          {/* ── AI Panel ── */}
          {showAI && (
            <>
              <PanelResizeHandle className="w-px bg-[#21262d] hover:bg-[#a371f7] transition-colors cursor-col-resize" />
              <Panel defaultSize={25} minSize={20} maxSize={40}>
                <div className="h-full border-l border-[#21262d] relative">
                  <AIPanel
                    currentFile={activeTab?.name}
                    currentCode={activeTab?.content}
                    language={activeTab?.language}
                    initialMessage={aiPrompt}
                    onClose={() => { setShowAI(false); setAiPrompt(undefined); }}
                  />
                </div>
              </Panel>
            </>
          )}
        </PanelGroup>
      </div>

      {/* ── Status Bar ── */}
      <StatusBar
        language={activeTab?.language}
        line={cursorPos.line}
        column={cursorPos.column}
        branch="main"
        isDirty={!!activeTab && activeTab.content !== activeTab.savedContent}
        isConnected
        fileName={activeTab?.name}
        fileSize={activeTab ? new Blob([activeTab.content]).size : undefined}
        onBranchClick={() => { setSidePanel("git"); setShowSide(true); }}
      />
    </div>
  );
}
