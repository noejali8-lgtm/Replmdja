import { useState, useEffect, useCallback, useRef } from "react";
import { useLocation, useSearch } from "wouter";
import { PanelGroup, Panel, PanelResizeHandle } from "react-resizable-panels";
import {
  ArrowLeft, Play, Square, Share2, Rocket, Settings, Check,
  FileCode, Search, GitBranch, Terminal, Eye, Sparkles, Monitor,
  ChevronDown, X, Circle, Maximize2, Minimize2, Split, Package,
  Database, Lock, RefreshCw, ExternalLink, ChevronRight, Plus,
  Layers, Code2, Globe, AlertTriangle, Bug, Box, BarChart2, Camera,
  Shield, Mic, ScrollText, GitGraph, Zap, Keyboard, Users, Activity,
  Network, GitMerge, Server, CreditCard
} from "lucide-react";
import { useProjectFiles } from "@/hooks/useProjectFiles";
import { SecretsPanel } from "@/components/editor/SecretsPanel";
import { useToast } from "@/hooks/use-toast";
import { MonacoEditorPane, getLanguage, type CursorPosition } from "@/components/editor/MonacoEditor";
import { TerminalPane } from "@/components/editor/TerminalPane";
import { CommandPalette } from "@/components/editor/CommandPalette";
import { StatusBar } from "@/components/editor/StatusBar";
import { FileTree, type FileNode } from "@/components/editor/FileTree";
import { AIPanel } from "@/components/editor/AIPanel";
import { SearchPanel } from "@/components/editor/SearchPanel";
import { DiffViewer } from "@/components/editor/DiffViewer";
import { ResourceMonitor } from "@/components/editor/ResourceMonitor";
import { DebugPanel } from "@/components/editor/DebugPanel";
import { DatabaseGUI } from "@/components/editor/DatabaseGUI";
import { PackageManager } from "@/components/editor/PackageManager";
import { AIReviewer } from "@/components/editor/AIReviewer";
import { SnapshotPanel } from "@/components/editor/SnapshotPanel";
import { AnalyticsPanel } from "@/components/editor/AnalyticsPanel";
import { VoiceCommand, type VoiceCommandAction } from "@/components/editor/VoiceCommand";
import { LogStreamingPanel } from "@/components/editor/LogStreamingPanel";
import { EnvironmentTemplates } from "@/components/editor/EnvironmentTemplates";
import { VulnerabilityScanner } from "@/components/editor/VulnerabilityScanner";
import { AuditLogs } from "@/components/editor/AuditLogs";
import { GitGraph as GitGraphPanel } from "@/components/editor/GitGraph";
import { DeploymentPanel } from "@/components/editor/DeploymentPanel";
import { MultiCursorPresence } from "@/components/editor/MultiCursorPresence";
import { KeybindingsPanel } from "@/components/editor/KeybindingsPanel";
import { GitEnhancedPanel } from "@/components/editor/GitEnhancedPanel";
import { SelfHealingPanel } from "@/components/editor/SelfHealingPanel";
import { BillingPanel } from "@/components/editor/BillingPanel";
import { sound } from "@/lib/soundSystem";

/* ─── Types ─────────────────────────────────────────── */
type SidePanel = "files" | "search" | "git" | "extensions" | "secrets" | "database" | "debug" | "packages" | "analytics" | "snapshots" | "review" | "gitgraph" | "templates" | "vulnscan" | "auditlogs" | "deployment" | "presence" | "keybindings" | "selfheal" | "billing";
type BottomPanel = "terminal" | "preview" | "console" | "logs";

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

interface DiffState {
  originalCode: string;
  proposedCode: string;
  language: string;
  tabIdx: number;
}

/* ─── Default demo file contents ─────────────────────── */
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

/* ─── File-content stubs keyed by path ─── */
const DEFAULT_CONTENTS: Record<string, string> = {
  "src/App.tsx": APP_TSX,
  "src/main.tsx": MAIN_TSX,
  "src/index.css": INDEX_CSS,
  "package.json": PKG_JSON,
  "README.md": README_MD,
};

const DEFAULT_TREE: FileNode[] = [
  {
    name: "src", path: "src", type: "dir",
    children: [
      { name: "App.tsx",   path: "src/App.tsx",   type: "file", ext: "tsx" },
      { name: "main.tsx",  path: "src/main.tsx",  type: "file", ext: "tsx" },
      { name: "index.css", path: "src/index.css", type: "file", ext: "css" },
    ],
  },
  { name: "package.json", path: "package.json", type: "file", ext: "json" },
  { name: "README.md",    path: "README.md",    type: "file", ext: "md"   },
];

/* ─── Persistence helpers ─────────────────────────────── */
function lsKey(project: string, suffix: string) {
  return `ide-${project}-${suffix}`;
}
function saveTree(project: string, tree: FileNode[]) {
  try { localStorage.setItem(lsKey(project, "tree"), JSON.stringify(tree)); } catch { /**/ }
}
function loadTree(project: string): FileNode[] | null {
  try {
    const raw = localStorage.getItem(lsKey(project, "tree"));
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}
function saveContent(project: string, path: string, content: string) {
  try { localStorage.setItem(lsKey(project, `file:${path}`), content); } catch { /**/ }
}
function loadContent(project: string, path: string): string | null {
  return localStorage.getItem(lsKey(project, `file:${path}`));
}
function deleteContent(project: string, path: string) {
  localStorage.removeItem(lsKey(project, `file:${path}`));
}
function saveOpenTabs(project: string, paths: string[]) {
  try { localStorage.setItem(lsKey(project, "tabs"), JSON.stringify(paths)); } catch { /**/ }
}
function loadOpenTabs(project: string): string[] | null {
  try {
    const raw = localStorage.getItem(lsKey(project, "tabs"));
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

/* ─── Tree helpers ───────────────────────────────────── */
function flattenTree(nodes: FileNode[]): FileNode[] {
  return nodes.flatMap(n => n.type === "file" ? [n] : flattenTree(n.children ?? []));
}

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

/* ─── Preview builder (in-browser Babel) ─────────────── */
function buildPreviewHtml(allFiles: { path: string; content: string }[]): string {
  const appFile = allFiles.find(f => f.path.endsWith("App.tsx") || f.path.endsWith("App.jsx"));
  const cssFile = allFiles.find(f => f.path.endsWith("index.css") || f.path.endsWith("App.css"));
  const appCode = appFile?.content ?? "export default () => <div>No App.tsx found</div>;";
  const cssCode = cssFile?.content ?? "";

  const cleanedCode = appCode
    .replace(/^import\s+.*?from\s+['"][^'"]+['"]\s*;?\s*$/gm, "")
    .replace(/export\s+default\s+/, "const __App = ")
    .replace(/export\s+\{[^}]+\}\s*;?/g, "");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>Browser Preview</title>
  <script src="https://unpkg.com/react@18/umd/react.development.js"></script>
  <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{background:#0d1117;color:#e6edf3;font-family:system-ui,sans-serif}
    ${cssCode}
  </style>
</head>
<body>
  <div id="root"></div>
  <script type="text/babel" data-presets="react,typescript">
    const { useState, useEffect, useRef, useCallback, useMemo } = React;
    ${cleanedCode}
    try {
      const _root = ReactDOM.createRoot(document.getElementById('root'));
      _root.render(React.createElement(typeof __App !== 'undefined' ? __App : () => React.createElement('div', {style:{padding:'2rem',color:'#8b949e',textAlign:'center'}}, '⚠️ No default export found in App.tsx')));
    } catch(e) {
      document.getElementById('root').innerHTML = '<div style="padding:1.5rem;color:#ff7b72;font-family:monospace;font-size:13px;background:#161b22;border:1px solid #f85149;border-radius:8px;margin:1rem"><strong>Runtime Error</strong><br/><br/>' + e.message + '</div>';
    }
  </script>
</body>
</html>`;
}

/* ─── Resolve file content (localStorage → defaults) ─── */
function resolveContent(project: string, path: string): string {
  const saved = loadContent(project, path);
  if (saved !== null) return saved;
  const relative = path.replace(/^[^/]+\//, "");
  return DEFAULT_CONTENTS[path] ?? DEFAULT_CONTENTS[relative] ?? "";
}

function nodeToTab(project: string, node: FileNode): Tab {
  const content = resolveContent(project, node.path);
  return {
    path: node.path,
    name: node.name,
    ext: node.ext ?? "",
    content,
    savedContent: content,
    language: getLanguage(node.ext ?? ""),
  };
}

/* ─── Main Editor Component ──────────────────────────── */
export default function Editor() {
  const [, setLocation] = useLocation();
  const search = useSearch();
  const params = new URLSearchParams(search);
  const projectName = params.get("project") ?? "my-web-app";
  const projectId = params.get("id") ? Number(params.get("id")) : null;
  const initialIdea = params.get("idea") ?? "";
  const initialPlan = params.get("plan") === "1";

  /* ─── Real file API hook ─── */
  const fileApi = useProjectFiles(projectId);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const stopRunRef = useRef<(() => void) | null>(null);

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

  /* Diff viewer */
  const [diffState, setDiffState] = useState<DiffState | null>(null);

  /* Editor */
  const [tabs, setTabs] = useState<Tab[]>([]);
  const [activeTabIdx, setActiveTabIdx] = useState(0);
  const [splitTabIdx, setSplitTabIdx] = useState(1);
  const [tree, setTree] = useState<FileNode[]>([]);
  const [cursorPos, setCursorPos] = useState<CursorPosition>({ line: 1, column: 1 });
  const [aiPrompt, setAiPrompt] = useState<string | undefined>(initialIdea || undefined);

  /* Runtime */
  const [isRunning, setIsRunning] = useState(false);
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [consoleLines, setConsoleLines] = useState<ConsoleLine[]>([
    { text: "Ready. Click Run to launch the in-browser preview.", level: "info", ts: new Date().toLocaleTimeString() },
  ]);
  const [copied, setCopied] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const activeTab = tabs[activeTabIdx] ?? null;
  const splitTab = tabs[splitTabIdx] ?? null;

  /* ─── Init: load tree + first file ─── */
  useEffect(() => {
    if (projectId) {
      /* Real project — load from filesystem via API */
      fileApi.loadProject(projectId).then(({ tree: apiTree, firstFile }) => {
        setTree(apiTree);
        if (firstFile) {
          fileApi.readFile(firstFile.path).then(content => {
            const tab: Tab = {
              path: firstFile.path, name: firstFile.name,
              ext: firstFile.ext ?? firstFile.name.split(".").pop() ?? "",
              content, savedContent: content,
              language: getLanguage(firstFile.ext ?? firstFile.name.split(".").pop() ?? ""),
            };
            setTabs([tab]);
          });
        }
      }).catch(() => {
        /* Fallback to localStorage on error */
        const savedTree = loadTree(projectName) ?? DEFAULT_TREE;
        setTree(savedTree);
        const def = flattenTree(savedTree)[0];
        if (def) setTabs([nodeToTab(projectName, def)]);
      });
    } else {
      /* Demo mode — use localStorage */
      const savedTree = loadTree(projectName) ?? DEFAULT_TREE;
      setTree(savedTree);
      const allFiles = flattenTree(savedTree);
      const savedTabPaths = loadOpenTabs(projectName);
      if (savedTabPaths?.length) {
        const restored = savedTabPaths
          .map(p => allFiles.find(f => f.path === p))
          .filter(Boolean)
          .map(f => nodeToTab(projectName, f!));
        if (restored.length > 0) { setTabs(restored); return; }
      }
      const def = allFiles[0];
      if (def) setTabs([nodeToTab(projectName, def)]);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, projectName]);

  /* Persist open tab list (localStorage only in demo mode) */
  useEffect(() => {
    if (!projectId && tabs.length > 0) saveOpenTabs(projectName, tabs.map(t => t.path));
  }, [tabs, projectName, projectId]);

  /* Persist tree structure (localStorage only in demo mode) */
  useEffect(() => {
    if (!projectId && tree.length > 0) saveTree(projectName, tree);
  }, [tree, projectName, projectId]);

  /* ─── Auto-open AI panel if launched with an idea ─── */
  useEffect(() => {
    if (initialIdea) {
      setShowAI(true);
      setBottomPanel("terminal");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
      if (e.key === "Escape" && diffState) { setDiffState(null); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [diffState]);

  /* ─── File operations ─── */
  const openFile = useCallback((node: FileNode) => {
    if (node.type !== "file") return;
    const existing = tabs.findIndex(t => t.path === node.path);
    if (existing >= 0) { setActiveTabIdx(existing); return; }
    if (projectId) {
      /* Load content from real API */
      fileApi.readFile(node.path).then(content => {
        const ext = node.ext ?? node.name.split(".").pop() ?? "";
        const tab: Tab = { path: node.path, name: node.name, ext, content, savedContent: content, language: getLanguage(ext) };
        setTabs(prev => { const next = [...prev, tab]; setActiveTabIdx(next.length - 1); return next; });
      });
    } else {
      const tab = nodeToTab(projectName, node);
      setTabs(prev => { const next = [...prev, tab]; setActiveTabIdx(next.length - 1); return next; });
    }
  }, [tabs, projectName, projectId, fileApi]);

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
    sound.play("save");
    toast({ title: "Saved", description: activeTab.name });
    if (projectId) {
      /* Real project — save to filesystem */
      await fileApi.writeFile(activeTab.path, activeTab.content).catch(() => {});
    } else {
      /* Demo mode — save to localStorage */
      saveContent(projectName, activeTab.path, activeTab.content);
    }
  }, [activeTab, activeTabIdx, projectName, projectId, fileApi, toast]);

  const handleNewFile = useCallback((parentPath: string) => {
    const name = window.prompt("File name (e.g. utils.ts):");
    if (!name?.trim()) return;
    const trimmed = name.trim();
    const filePath = parentPath ? `${parentPath}/${trimmed}` : trimmed;
    const ext = trimmed.split(".").pop() ?? "";
    const newNode: FileNode = { name: trimmed, path: filePath, type: "file", ext };
    if (projectId) {
      fileApi.createFile(filePath, "").then(() => {
        setTree(prev => addToTree(prev, parentPath, newNode));
        openFile(newNode);
      });
    } else {
      saveContent(projectName, filePath, "");
      setTree(prev => addToTree(prev, parentPath, newNode));
      openFile(newNode);
    }
  }, [openFile, projectName, projectId, fileApi]);

  const handleNewFolder = useCallback((parentPath: string) => {
    const name = window.prompt("Folder name:");
    if (!name?.trim()) return;
    const trimmed = name.trim();
    const dirPath = parentPath ? `${parentPath}/${trimmed}` : trimmed;
    const newNode: FileNode = { name: trimmed, path: dirPath, type: "dir", children: [] };
    if (projectId) {
      fileApi.createDir(dirPath).then(() => setTree(prev => addToTree(prev, parentPath, newNode)));
    } else {
      setTree(prev => addToTree(prev, parentPath, newNode));
    }
  }, [projectId, fileApi]);

  const handleDelete = useCallback((node: FileNode) => {
    if (!window.confirm(`Delete "${node.name}"?`)) return;
    setTree(prev => removeFromTree(prev, node.path));
    setTabs(prev => prev.filter(t => !t.path.startsWith(node.path)));
    if (projectId) {
      fileApi.deleteFile(node.path).catch(() => {});
    } else {
      flattenTree([node]).forEach(f => deleteContent(projectName, f.path));
    }
  }, [projectName, projectId, fileApi]);

  const handleRename = useCallback((node: FileNode, newName: string) => {
    const newPath = node.path.replace(/[^/]+$/, newName);
    setTree(prev => renameInTree(prev, node.path, newName, newPath));
    setTabs(prev => prev.map(t =>
      t.path === node.path
        ? { ...t, name: newName, path: newPath, ext: newName.split(".").pop() ?? "", language: getLanguage(newName.split(".").pop() ?? "") }
        : t
    ));
    if (projectId) {
      const tab = tabs.find(t => t.path === node.path);
      const content = tab?.content ?? "";
      fileApi.renameFile(node.path, newPath, content).catch(() => {});
    } else {
      const oldContent = loadContent(projectName, node.path) ?? resolveContent(projectName, node.path);
      saveContent(projectName, newPath, oldContent);
      deleteContent(projectName, node.path);
    }
  }, [tabs, projectName, projectId, fileApi]);

  const handleDownload = useCallback((node: FileNode) => {
    const tab = tabs.find(t => t.path === node.path);
    const content = tab?.content ?? (projectId ? "" : resolveContent(projectName, node.path));
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = node.name; a.click();
    URL.revokeObjectURL(url);
  }, [tabs, projectName, projectId]);

  /* ─── AI code apply → diff viewer ─── */
  const handleApplyCode = useCallback((code: string, lang: string) => {
    if (!activeTab) {
      toast({ title: "No file open", description: "Open a file first to apply changes." });
      return;
    }
    setDiffState({
      originalCode: activeTab.content,
      proposedCode: code,
      language: lang || activeTab.language,
      tabIdx: activeTabIdx,
    });
  }, [activeTab, activeTabIdx, toast]);

  const handleDiffAccept = useCallback((newCode: string) => {
    if (!diffState) return;
    setTabs(prev => prev.map((t, i) =>
      i === diffState.tabIdx ? { ...t, content: newCode } : t
    ));
    setDiffState(null);
    toast({ title: "Changes applied", description: "Code updated. Press Ctrl+S to save." });
  }, [diffState, toast]);

  const handleDiffReject = useCallback(() => {
    setDiffState(null);
  }, []);

  /* ─── Run / Stop ─── */
  const allFilesForPreview = flattenTree(tree).map(f => ({
    path: f.path,
    content: tabs.find(t => t.path === f.path)?.content ?? resolveContent(projectName, f.path),
  }));

  const handleRun = useCallback(async () => {
    if (projectId) {
      /* Real project — save first, then run via API with SSE streaming */
      if (activeTab) await fileApi.writeFile(activeTab.path, activeTab.content).catch(() => {});
      setIsRunning(true);
      setBottomPanel("console");
      setShowBottom(true);
      sound.play("success");
      const startTs = new Date().toLocaleTimeString();
      setConsoleLines([{ text: "▶  Starting your project…", level: "info", ts: startTs }]);
      const stopFn = await fileApi.runProject((type, data) => {
        const ts = new Date().toLocaleTimeString();
        const level: ConsoleLine["level"] =
          type === "error" ? "error" : type === "stderr" ? "warn" :
          type === "exit" ? "warn" : type === "ready" || type === "success" ? "success" : "info";
        setConsoleLines(prev => [...prev, { text: data, level, ts }]);
        if (type === "url") {
          setPreviewUrl(data);
          setBottomPanel("preview");
        }
      });
      stopRunRef.current = stopFn;
    } else {
      /* Demo mode — in-browser Babel */
      setIsRunning(true);
      setPreviewHtml(buildPreviewHtml(allFilesForPreview));
      setBottomPanel("preview");
      setShowBottom(true);
      sound.play("success");
      const ts = new Date().toLocaleTimeString();
      setConsoleLines([
        { text: "⚠  Browser Preview — in-browser Babel (no real server)", level: "warn", ts },
        { text: "✓ Preview ready", level: "success", ts },
      ]);
      toast({ title: "Preview running", description: "In-browser Babel preview" });
    }
  }, [projectId, activeTab, fileApi, allFilesForPreview, toast]);

  const handleStop = useCallback(async () => {
    setIsRunning(false);
    setPreviewHtml(null);
    setPreviewUrl(null);
    sound.play("close");
    setConsoleLines(prev => [...prev, { text: "■ Stopped.", level: "error", ts: new Date().toLocaleTimeString() }]);
    if (projectId) {
      stopRunRef.current?.();
      stopRunRef.current = null;
      await fileApi.stopProject().catch(() => {});
    }
    toast({ title: "Stopped" });
  }, [projectId, fileApi, toast]);

  const handleDeploy = useCallback(() => {
    sound.play("deploy");
    toast({ title: "Deploying…", description: "Building and deploying your project." });
    setTimeout(() => {
      sound.play("success");
      toast({ title: "Deployed!", description: `Live at https://${fileApi.projectInfo?.slug ?? projectName}.replit.app` });
    }, 2500);
  }, [fileApi.projectInfo, projectName, toast]);

  /* ─── Voice command handler ─── */
  const handleVoiceCommand = useCallback((action: VoiceCommandAction, _raw: string) => {
    switch (action) {
      case "save":           saveActiveFile(); break;
      case "run":            handleRun(); break;
      case "stop":           handleStop(); break;
      case "new-file":       handleNewFile(""); break;
      case "toggle-terminal": setShowBottom(p => !p); setBottomPanel("terminal"); break;
      case "toggle-ai":      setShowAI(p => !p); break;
      case "toggle-search":  setSidePanel("search"); setShowSide(true); break;
      case "deploy":         handleDeploy(); break;
      case "split-editor":   setIsSplitView(p => !p); break;
      case "close-tab":      if (tabs.length > 1) setTabs(p => { const n = p.filter((_, i) => i !== activeTabIdx); setActiveTabIdx(Math.max(0, activeTabIdx - 1)); return n; }); break;
      case "zoom-in":        document.documentElement.style.fontSize = "14px"; break;
      case "zoom-out":       document.documentElement.style.fontSize = "12px"; break;
    }
  }, [saveActiveFile, handleRun, handleStop, handleNewFile, handleDeploy, tabs, activeTabIdx]);

  /* ─── Snapshot restore handler ─── */
  const handleSnapshotRestore = useCallback((files: { path: string; content: string }[]) => {
    if (projectId) {
      Promise.all(files.map(f => fileApi.writeFile(f.path, f.content))).catch(() => {});
    } else {
      files.forEach(f => saveContent(projectName, f.path, f.content));
    }
    setTabs(prev => prev.map(t => {
      const restored = files.find(f => f.path === t.path);
      return restored ? { ...t, content: restored.content, savedContent: restored.content } : t;
    }));
    toast({ title: "Snapshot restored", description: `${files.length} files restored.` });
  }, [projectName, projectId, fileApi, toast]);

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
    content: tabs.find(t => t.path === f.path)?.content ?? resolveContent(projectName, f.path),
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
          <span className="text-xs font-medium truncate max-w-[120px]">{projectName}</span>
          <ChevronDown className="h-3 w-3 text-[#8b949e]" />
        </div>

        <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#1f6feb]/20 text-[#58a6ff] border border-[#1f6feb]/30">main</span>

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

          <VoiceCommand onCommand={handleVoiceCommand} />

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
        <div className="flex flex-col items-center w-10 border-r border-[#21262d] bg-[#161b22] py-1.5 gap-0.5 shrink-0 overflow-y-auto">
          <SideBtn icon={<FileCode className="h-4 w-4" />} id="files" title="Explorer (⌘⇧E)" />
          <SideBtn icon={<Search className="h-4 w-4" />} id="search" title="Search (⌘⇧F)" />
          <SideBtn icon={<GitBranch className="h-4 w-4" />} id="git" title="Source Control + AI Commits" />
          <SideBtn icon={<GitGraph className="h-4 w-4" />} id="gitgraph" title="Git Graph" />
          <SideBtn icon={<Package className="h-4 w-4" />} id="extensions" title="Extensions" />
          <SideBtn icon={<Bug className="h-4 w-4" />} id="debug" title="Debugger" />
          <SideBtn icon={<Zap className="h-4 w-4" />} id="selfheal" title="Self-Healing AI" />
          <SideBtn icon={<Box className="h-4 w-4" />} id="packages" title="Package Manager" />
          <SideBtn icon={<BarChart2 className="h-4 w-4" />} id="analytics" title="Analytics Dashboard" />
          <SideBtn icon={<Camera className="h-4 w-4" />} id="snapshots" title="Snapshots" />
          <SideBtn icon={<Shield className="h-4 w-4" />} id="review" title="AI Code Review" />
          <SideBtn icon={<Network className="h-4 w-4" />} id="vulnscan" title="Vulnerability Scanner" />
          <SideBtn icon={<Activity className="h-4 w-4" />} id="auditlogs" title="Audit Log" />
          <SideBtn icon={<Users className="h-4 w-4" />} id="presence" title="Collaborators" />
          <div className="flex-1" />
          <SideBtn icon={<Layers className="h-4 w-4" />} id="templates" title="Environment Templates" />
          <SideBtn icon={<Keyboard className="h-4 w-4" />} id="keybindings" title="Keybindings" />
          <SideBtn icon={<Rocket className="h-4 w-4" />} id="deployment" title="Deployment" />
          <SideBtn icon={<Lock className="h-4 w-4" />} id="secrets" title="Secrets" />
          <SideBtn icon={<Database className="h-4 w-4" />} id="database" title="Database GUI" />
          <SideBtn icon={<CreditCard className="h-4 w-4" />} id="billing" title="Billing & Plans" />
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
                    <GitEnhancedPanel projectId={projectId ?? undefined} projectName={projectName} />
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
                    <SecretsPanel projectId={projectId ?? undefined} />
                  )}
                  {sidePanel === "database" && <DatabaseGUI />}
                  {sidePanel === "debug"    && <DebugPanel currentFile={activeTab?.name} currentLine={cursorPos.line} />}
                  {sidePanel === "packages" && <PackageManager projectId={projectId ?? undefined} />}
                  {sidePanel === "analytics"&& <AnalyticsPanel />}
                  {sidePanel === "snapshots" && (
                    <SnapshotPanel
                      project={projectName}
                      currentFiles={flattenTree(tree).map(f => ({ path: f.path, content: tabs.find(t => t.path === f.path)?.content ?? resolveContent(projectName, f.path) }))}
                      onRestore={handleSnapshotRestore}
                    />
                  )}
                  {sidePanel === "review" && (
                    <AIReviewer
                      code={activeTab?.content}
                      language={activeTab?.language}
                      filename={activeTab?.name}
                    />
                  )}
                  {sidePanel === "gitgraph"   && <GitGraphPanel />}
                  {sidePanel === "templates"  && <EnvironmentTemplates />}
                  {sidePanel === "vulnscan"   && <VulnerabilityScanner />}
                  {sidePanel === "auditlogs"  && <AuditLogs />}
                  {sidePanel === "deployment" && <DeploymentPanel />}
                  {sidePanel === "presence"   && <MultiCursorPresence currentFile={activeTab?.path} projectId={projectName} />}
                  {sidePanel === "keybindings"&& <KeybindingsPanel />}
                  {sidePanel === "selfheal"   && <SelfHealingPanel currentFile={activeTab?.name} />}
                  {sidePanel === "billing"    && <BillingPanel />}
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
                      <span className="text-[#8b949e] shrink-0">{projectName}</span>
                      {breadcrumbs.map((part, i) => (
                        <span key={i} className="flex items-center gap-0.5 shrink-0">
                          <ChevronRight className="h-2.5 w-2.5 opacity-50" />
                          <span className={i === breadcrumbs.length - 1 ? "text-[#e6edf3]" : ""}>{part}</span>
                        </span>
                      ))}
                    </div>
                  )}

                  {/* ── Diff Viewer overlay ── */}
                  {diffState ? (
                    <div className="flex-1 overflow-hidden">
                      <DiffViewer
                        fileName={tabs[diffState.tabIdx]?.name ?? "file"}
                        originalCode={diffState.originalCode}
                        proposedCode={diffState.proposedCode}
                        language={diffState.language}
                        onAccept={handleDiffAccept}
                        onReject={handleDiffReject}
                      />
                    </div>
                  ) : (
                    /* Editor panes */
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
                  )}
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
                          { id: "preview" as const, icon: <Globe className="h-3 w-3" />, label: "Browser Preview" },
                          { id: "console" as const, icon: <Layers className="h-3 w-3" />, label: "Console" },
                          { id: "logs" as const, icon: <ScrollText className="h-3 w-3" />, label: "Logs" },
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
                            {/* Preview toolbar */}
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-[#161b22] border-b border-[#21262d] shrink-0">
                              <div className="flex gap-1.5">
                                <div className="h-2.5 w-2.5 rounded-full bg-[#f85149]" />
                                <div className="h-2.5 w-2.5 rounded-full bg-[#d29922]" />
                                <div className="h-2.5 w-2.5 rounded-full bg-[#3fb950]" />
                              </div>
                              <div className="flex-1 flex items-center gap-2 bg-[#0d1117] border border-[#30363d] rounded px-2 py-0.5 text-[10px] text-[#8b949e]">
                                <Globe className="h-2.5 w-2.5 shrink-0" />
                                <span className="truncate">{previewUrl ?? "Browser Preview"}</span>
                              </div>
                              {!previewUrl && (
                                <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-[#d29922]/10 border border-[#d29922]/20 text-[9px] text-[#d29922] shrink-0">
                                  <AlertTriangle className="h-2.5 w-2.5" />
                                  <span>In-browser</span>
                                </div>
                              )}
                              {previewUrl && (
                                <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-[#3fb950]/10 border border-[#3fb950]/20 text-[9px] text-[#3fb950] shrink-0">
                                  <Server className="h-2.5 w-2.5" />
                                  <span>Live server</span>
                                </div>
                              )}
                              <button
                                onClick={() => {
                                  if (previewUrl) {
                                    const iframe = document.querySelector<HTMLIFrameElement>("#preview-iframe");
                                    if (iframe) iframe.src = iframe.src;
                                  } else {
                                    setPreviewHtml(buildPreviewHtml(allFilesForPreview));
                                  }
                                }}
                                className="h-5 w-5 flex items-center justify-center rounded text-[#484f58] hover:text-[#8b949e] hover:bg-[#21262d] transition-colors">
                                <RefreshCw className="h-3 w-3" />
                              </button>
                              <button onClick={() => previewUrl && window.open(previewUrl, "_blank")}
                                className="h-5 w-5 flex items-center justify-center rounded text-[#484f58] hover:text-[#8b949e] hover:bg-[#21262d] transition-colors">
                                <ExternalLink className="h-3 w-3" />
                              </button>
                            </div>
                            {previewUrl ? (
                              <iframe id="preview-iframe" src={previewUrl}
                                title="Live Preview" className="flex-1 border-none bg-white" />
                            ) : previewHtml ? (
                              <iframe ref={iframeRef} srcDoc={previewHtml}
                                title="Browser Preview" className="flex-1 border-none bg-white"
                                sandbox="allow-scripts allow-same-origin" />
                            ) : (
                              <div className="flex flex-col items-center justify-center flex-1 text-[#484f58] gap-3">
                                <Monitor className="h-10 w-10 opacity-20" />
                                <div className="text-center">
                                  <p className="text-xs font-medium text-[#8b949e] mb-1">Preview not running</p>
                                  <p className="text-[10px] text-[#484f58] mb-3">
                                    {projectId ? "Press Run to start a real dev server" : "In-browser Babel preview (React/HTML)"}
                                  </p>
                                  <button onClick={handleRun}
                                    className="flex items-center gap-1.5 mx-auto px-3 py-1.5 rounded bg-[#238636] hover:bg-[#2ea043] text-white text-xs transition-colors">
                                    <Play className="h-3.5 w-3.5" /> Run
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

                        {bottomPanel === "logs" && (
                          <LogStreamingPanel projectName={projectName} />
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
                    onApplyCode={handleApplyCode}
                    fileTree={(() => {
                      function renderTree(nodes: FileNode[], prefix = ""): string {
                        return nodes.map(n => {
                          const line = `${prefix}${n.type === "dir" ? "📁" : "📄"} ${n.name}`;
                          if (n.type === "dir" && n.children) return line + "\n" + renderTree(n.children, prefix + "  ");
                          return line;
                        }).join("\n");
                      }
                      return renderTree(tree);
                    })()}
                    onFileWrite={(filePath, content) => {
                      const ext = filePath.split(".").pop() ?? "";
                      const lang = getLanguage(ext);
                      const existingIdx = tabs.findIndex(t => t.path === filePath);
                      if (existingIdx >= 0) {
                        setTabs(prev => prev.map((t, i) =>
                          i === existingIdx ? { ...t, content, savedContent: content } : t
                        ));
                        setActiveTabIdx(existingIdx);
                      } else {
                        const name = filePath.split("/").pop() ?? filePath;
                        const newTab: Tab = { path: filePath, name, ext, content, savedContent: content, language: lang };
                        setTabs(prev => { const n = [...prev, newTab]; setActiveTabIdx(n.length - 1); return n; });
                      }
                      /* Save to real filesystem if projectId, else localStorage */
                      if (projectId) {
                        fileApi.writeFile(filePath, content).catch(() => {});
                      } else {
                        saveContent(projectName, filePath, content);
                      }
                      const parts = filePath.split("/");
                      const newNode: FileNode = { name: parts[parts.length - 1] ?? filePath, path: filePath, type: "file", ext };
                      setTree(prev => {
                        const exists = flattenTree(prev).some(f => f.path === filePath);
                        if (exists) return prev;
                        const parent = parts.slice(0, -1).join("/");
                        return addToTree(prev, parent, newNode);
                      });
                      sound.play("save");
                    }}
                  />
                </div>
              </Panel>
            </>
          )}
        </PanelGroup>
      </div>

      {/* ── Status Bar ── */}
      <div className="relative">
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
        <div className="absolute right-2 top-0 h-full flex items-center text-white">
          <ResourceMonitor />
        </div>
      </div>
    </div>
  );
}
