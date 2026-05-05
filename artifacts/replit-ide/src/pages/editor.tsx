import { useState, useRef, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import {
  Play, Square, Share2, Rocket, ChevronRight, ChevronDown,
  FileCode, FolderOpen, Folder, X, Terminal, Eye, ArrowLeft,
  Monitor, Sparkles, Globe, Plus, LayoutTemplate, PanelRight,
  RefreshCw, ExternalLink, Maximize2, Send, Bot, RotateCcw,
  Settings, GitBranch, Search, Bell, ChevronUp, Copy, Check,
  FileJson, FileText, Cpu, Wifi, WifiOff, CircleDot, Package
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

/* ─── Types ─────────────────────────────────────────── */
type FileNode = {
  name: string;
  type: "file" | "folder";
  children?: FileNode[];
  content?: string;
  language?: string;
};

type Panel = "files" | "editor" | "preview" | "agent" | "console";

/* ─── Mock file tree ─────────────────────────────────── */
const INITIAL_FILES: FileNode[] = [
  {
    name: "src", type: "folder", children: [
      {
        name: "App.tsx", type: "file", language: "tsx",
        content: `import { useState } from 'react';

function Counter() {
  const [count, setCount] = useState(0);
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      background: 'linear-gradient(135deg,#0d1117 0%,#161b22 100%)',
      color: '#e6edf3',
      fontFamily: 'system-ui,sans-serif'
    }}>
      <h1 style={{fontSize:'3rem',fontWeight:700,
        background:'linear-gradient(90deg,#58a6ff,#a371f7)',
        WebkitBackgroundClip:'text',
        WebkitTextFillColor:'transparent',
        marginBottom:'1rem'}}>
        Hello, World!
      </h1>
      <p style={{color:'#8b949e',fontSize:'1.1rem',marginBottom:'2rem'}}>
        Built with React + TypeScript
      </p>
      <div style={{
        background:'#21262d',border:'1px solid #30363d',
        borderRadius:'12px',padding:'2rem 3rem',textAlign:'center'
      }}>
        <p style={{fontSize:'4rem',fontWeight:700,margin:'0 0 1rem',
          color:'#58a6ff'}}>{count}</p>
        <div style={{display:'flex',gap:'0.75rem'}}>
          <button
            onClick={() => setCount(c => c - 1)}
            style={{padding:'0.5rem 1.5rem',background:'#21262d',
              color:'#e6edf3',border:'1px solid #30363d',
              borderRadius:'8px',cursor:'pointer',fontSize:'1.2rem'}}>
            −
          </button>
          <button
            onClick={() => setCount(0)}
            style={{padding:'0.5rem 1.5rem',background:'#21262d',
              color:'#8b949e',border:'1px solid #30363d',
              borderRadius:'8px',cursor:'pointer'}}>
            Reset
          </button>
          <button
            onClick={() => setCount(c => c + 1)}
            style={{padding:'0.5rem 1.5rem',background:'#1f6feb',
              color:'white',border:'none',
              borderRadius:'8px',cursor:'pointer',fontSize:'1.2rem'}}>
            +
          </button>
        </div>
      </div>
      <p style={{marginTop:'2rem',color:'#484f58',fontSize:'0.85rem'}}>
        Running on localhost:5173
      </p>
    </div>
  );
}

export default function App() {
  return <Counter />;
}`
      },
      {
        name: "index.tsx", type: "file", language: "tsx",
        content: `import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

ReactDOM.createRoot(
  document.getElementById('root')!
).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);`
      },
      {
        name: "index.css", type: "file", language: "css",
        content: `* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont,
    'Segoe UI', Roboto, Oxygen, sans-serif;
  background: #0d1117;
  color: #e6edf3;
}

#root {
  min-height: 100vh;
}`
      },
    ]
  },
  {
    name: "public", type: "folder", children: [
      {
        name: "index.html", type: "file", language: "html",
        content: `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport"
      content="width=device-width, initial-scale=1.0" />
    <title>My App</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/index.tsx"></script>
  </body>
</html>`
      },
    ]
  },
  {
    name: "package.json", type: "file", language: "json",
    content: `{
  "name": "my-web-app",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "@vitejs/plugin-react": "^4.0.0",
    "typescript": "^5.0.0",
    "vite": "^4.4.0"
  }
}`
  },
  {
    name: "README.md", type: "file", language: "md",
    content: `# My Web App

A React + TypeScript app built with Vite.

## Getting Started

\`\`\`bash
npm install
npm run dev
\`\`\`

Open [http://localhost:5173](http://localhost:5173).

## Features
- ⚡ Vite for fast development
- ⚛️ React 18
- 🔷 TypeScript
- 🎨 CSS3
`
  },
];

/* ─── AI agent messages ──────────────────────────────── */
const INITIAL_AI_MSGS = [
  { role: "agent", text: "Hi! I'm your AI Agent powered by **Claude Opus** — the most capable AI available.\n\nI can see your current file and help you:\n- 🐛 Debug errors\n- ✨ Add new features\n- 🔄 Refactor code\n- 📖 Explain any code\n\nWhat would you like to do?" },
];

/* ─── Syntax highlight (simple) ─────────────────────── */
function highlight(raw: string, lang = "txt") {
  const esc = raw.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  if (lang === "tsx" || lang === "jsx" || lang === "ts" || lang === "js") {
    return esc
      .replace(/\b(import|from|export|default|function|const|let|var|return|if|else|class|extends|new|typeof|void|null|undefined|true|false|async|await|of|in|for|while|do|switch|case|break|continue|throw|try|catch|finally|type|interface|enum)\b/g,
        '<span style="color:#ff7b72">$1</span>')
      .replace(/("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`)/g,
        '<span style="color:#a5d6ff">$1</span>')
      .replace(/(\/\/[^\n]*)/g, '<span style="color:#8b949e">$1</span>')
      .replace(/\b([A-Z][a-zA-Z0-9]*)\b/g, '<span style="color:#ffa657">$1</span>')
      .replace(/\b(\d+\.?\d*)\b/g, '<span style="color:#79c0ff">$1</span>');
  }
  if (lang === "css") {
    return esc
      .replace(/(\/\*[\s\S]*?\*\/)/g, '<span style="color:#8b949e">$1</span>')
      .replace(/([.#]?[a-zA-Z-]+)(\s*\{)/g, '<span style="color:#7ee787">$1</span>$2')
      .replace(/([a-z-]+)(\s*:)/g, '<span style="color:#79c0ff">$1</span>$2')
      .replace(/(#[0-9a-fA-F]{3,8})/g, '<span style="color:#ffa657">$1</span>');
  }
  if (lang === "json") {
    return esc
      .replace(/("(?:[^"\\]|\\.)*")\s*:/g, '<span style="color:#79c0ff">$1</span>:')
      .replace(/:\s*("(?:[^"\\]|\\.)*")/g, ': <span style="color:#a5d6ff">$1</span>')
      .replace(/\b(true|false|null)\b/g, '<span style="color:#ff7b72">$1</span>')
      .replace(/\b(\d+\.?\d*)\b/g, '<span style="color:#ffa657">$1</span>');
  }
  return esc;
}

/* ─── Preview HTML builder ───────────────────────────── */
function buildPreviewHtml(appCode: string): string {
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
  <script type="text/babel" data-type="module">
    ${appCode.replace(/^import.*$/gm, "").replace(/export default /, "const __DefaultExport = ")}
    const root = ReactDOM.createRoot(document.getElementById('root'));
    root.render(React.createElement(typeof __DefaultExport !== 'undefined' ? __DefaultExport : () => React.createElement('div', {style:{padding:'2rem',color:'#8b949e'}}, 'Loading...')));
  </script>
</body>
</html>`;
}

/* ─── File tree item ─────────────────────────────────── */
function FileTreeItem({ node, depth = 0, onSelect, selectedName }: {
  node: FileNode; depth?: number;
  onSelect: (n: FileNode) => void; selectedName: string;
}) {
  const [open, setOpen] = useState(depth < 1);

  const getIcon = (name: string) => {
    if (name.endsWith(".tsx") || name.endsWith(".jsx")) return <FileCode className="h-3.5 w-3.5 text-blue-400 shrink-0" />;
    if (name.endsWith(".css")) return <FileCode className="h-3.5 w-3.5 text-pink-400 shrink-0" />;
    if (name.endsWith(".json")) return <FileJson className="h-3.5 w-3.5 text-yellow-400 shrink-0" />;
    if (name.endsWith(".md")) return <FileText className="h-3.5 w-3.5 text-green-400 shrink-0" />;
    if (name.endsWith(".html")) return <FileCode className="h-3.5 w-3.5 text-orange-400 shrink-0" />;
    return <FileCode className="h-3.5 w-3.5 text-muted-foreground shrink-0" />;
  };

  if (node.type === "folder") {
    return (
      <div>
        <button onClick={() => setOpen(!open)}
          className="w-full flex items-center gap-1.5 py-1 text-xs text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors"
          style={{ paddingLeft: `${8 + depth * 12}px` }}
          data-testid={`folder-${node.name}`}>
          {open ? <ChevronDown className="h-3 w-3 shrink-0" /> : <ChevronRight className="h-3 w-3 shrink-0" />}
          {open ? <FolderOpen className="h-3.5 w-3.5 text-blue-300 shrink-0" /> : <Folder className="h-3.5 w-3.5 text-blue-300 shrink-0" />}
          <span>{node.name}</span>
        </button>
        {open && node.children?.map(c => (
          <FileTreeItem key={c.name} node={c} depth={depth + 1} onSelect={onSelect} selectedName={selectedName} />
        ))}
      </div>
    );
  }
  return (
    <button onClick={() => onSelect(node)}
      className={`w-full flex items-center gap-1.5 py-1 text-xs transition-colors ${selectedName === node.name ? "bg-primary/15 text-primary border-l-2 border-primary" : "text-muted-foreground hover:text-foreground hover:bg-white/5"}`}
      style={{ paddingLeft: `${20 + depth * 12}px` }}
      data-testid={`file-${node.name}`}>
      {getIcon(node.name)}
      <span>{node.name}</span>
    </button>
  );
}

/* ─── Main Editor ────────────────────────────────────── */
export default function Editor() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const [files, setFiles] = useState(INITIAL_FILES);
  const [selectedFile, setSelectedFile] = useState<FileNode>(INITIAL_FILES[0].children![0]);
  const [openTabs, setOpenTabs] = useState<FileNode[]>([INITIAL_FILES[0].children![0]]);
  const [isRunning, setIsRunning] = useState(false);
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [activePanel, setActivePanel] = useState<Panel>("editor");
  const [agentMessages, setAgentMessages] = useState(INITIAL_AI_MSGS);
  const [agentInput, setAgentInput] = useState("");
  const [agentTyping, setAgentTyping] = useState(false);
  const [chatHistory, setChatHistory] = useState<{ role: "user" | "assistant"; content: string }[]>([]);
  const [terminalLines, setTerminalLines] = useState([
    { text: "> Ready. Press Run to start your project.", color: "#8b949e" },
  ]);
  const [previewUrl, setPreviewUrl] = useState("localhost:5173");
  const [consoleExpanded, setConsoleExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const agentEndRef = useRef<HTMLDivElement>(null);

  // scroll agent to bottom
  useEffect(() => { agentEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [agentMessages]);

  const getAppCode = useCallback(() => {
    const appFile = files[0]?.children?.find(f => f.name === "App.tsx");
    return appFile?.content || "";
  }, [files]);

  const handleRun = () => {
    setIsRunning(true);
    setTerminalLines([
      { text: "> npm run dev", color: "#7ee787" },
      { text: "", color: "#8b949e" },
      { text: "  VITE v4.4.0  ready in 312 ms", color: "#79c0ff" },
      { text: "", color: "#8b949e" },
      { text: "  ➜  Local:   http://localhost:5173/", color: "#7ee787" },
      { text: "  ➜  Network: http://172.31.0.1:5173/", color: "#8b949e" },
    ]);
    const html = buildPreviewHtml(getAppCode());
    setPreviewHtml(html);
    setActivePanel("preview");
    toast({ title: "Running", description: "Server started on port 5173" });
  };

  const handleStop = () => {
    setIsRunning(false);
    setPreviewHtml(null);
    setTerminalLines(prev => [...prev, { text: "> Server stopped.", color: "#f85149" }]);
    toast({ title: "Stopped" });
  };

  const handleRefreshPreview = () => {
    if (iframeRef.current && previewHtml) {
      const html = buildPreviewHtml(getAppCode());
      setPreviewHtml(html);
    }
  };

  const handleFileSelect = (node: FileNode) => {
    setSelectedFile(node);
    if (!openTabs.find(t => t.name === node.name)) setOpenTabs(p => [...p, node]);
    setActivePanel("editor");
  };

  const closeTab = (e: React.MouseEvent, node: FileNode) => {
    e.stopPropagation();
    const next = openTabs.filter(t => t.name !== node.name);
    setOpenTabs(next);
    if (selectedFile.name === node.name && next.length) setSelectedFile(next[next.length - 1]);
  };

  const handleCodeChange = (val: string) => {
    setSelectedFile(prev => ({ ...prev, content: val }));
    // update in file tree
    setFiles(prev => {
      const update = (nodes: FileNode[]): FileNode[] => nodes.map(n => {
        if (n.name === selectedFile.name && n.type === "file") return { ...n, content: val };
        if (n.children) return { ...n, children: update(n.children) };
        return n;
      });
      return update(prev);
    });
  };

  const handleShare = () => {
    navigator.clipboard.writeText("https://replit.com/@N/my-web-app").catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({ title: "Link copied!" });
  };

  const handleDeploy = () => {
    toast({ title: "Deploying...", description: "Building and deploying to Replit hosting" });
    setTimeout(() => toast({ title: "Deployed!", description: "Live at https://my-web-app.replit.app" }), 2500);
  };

  const sendAgentMessage = async () => {
    if (!agentInput.trim() || agentTyping) return;
    const userMsg = agentInput.trim();
    setAgentMessages(p => [...p, { role: "user", text: userMsg }]);
    setAgentInput("");
    setAgentTyping(true);

    const newHistory: { role: "user" | "assistant"; content: string }[] = [
      ...chatHistory,
      { role: "user", content: userMsg },
    ];

    // Add empty streaming message placeholder
    setAgentMessages(p => [...p, { role: "agent", text: "" }]);

    try {
      const response = await fetch("/api/anthropic/code-assist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMsg,
          code: selectedFile.content || "",
          language: selectedFile.language || "txt",
          filename: selectedFile.name || "unknown",
          history: chatHistory,
        }),
      });

      if (!response.ok || !response.body) {
        throw new Error(`API error: ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullText = "";
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const data = JSON.parse(line.slice(6));
            if (data.content) {
              fullText += data.content;
              const snapshot = fullText;
              setAgentMessages(p => {
                const msgs = [...p];
                msgs[msgs.length - 1] = { role: "agent", text: snapshot };
                return msgs;
              });
            }
            if (data.done || data.error) break;
          } catch {/* ignore parse errors */}
        }
      }

      setChatHistory([...newHistory, { role: "assistant", content: fullText }]);
    } catch (err) {
      setAgentMessages(p => {
        const msgs = [...p];
        msgs[msgs.length - 1] = { role: "agent", text: "Sorry, I couldn't connect to the AI. Make sure the API server is running." };
        return msgs;
      });
    } finally {
      setAgentTyping(false);
    }
  };

  const codeLines = (selectedFile.content || "").split("\n");

  /* ──── RENDER ──── */
  return (
    <div className="flex flex-col h-screen bg-[#0d1117] text-[#e6edf3] overflow-hidden select-none" data-testid="editor-root">

      {/* ── Top toolbar ── */}
      <div className="h-12 flex items-center gap-2 px-3 border-b border-[#21262d] bg-[#161b22] shrink-0 z-20">
        {/* Back + project name */}
        <button onClick={() => setLocation("/")}
          className="flex items-center gap-1.5 text-[#8b949e] hover:text-[#e6edf3] text-sm px-2 py-1 rounded hover:bg-[#21262d] transition-colors"
          data-testid="button-back">
          <ArrowLeft className="h-4 w-4" />
        </button>

        <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-[#21262d] border border-[#30363d]">
          <div className="h-4 w-4 rounded bg-gradient-to-br from-[#58a6ff] to-[#a371f7] flex items-center justify-center">
            <span className="text-white text-[8px] font-bold">R</span>
          </div>
          <span className="text-sm font-medium">my-web-app</span>
          <ChevronDown className="h-3 w-3 text-[#8b949e]" />
        </div>

        <div className="flex items-center gap-1 ml-1">
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#1f6feb]/20 text-[#58a6ff] border border-[#1f6feb]/30">main</span>
        </div>

        <div className="flex-1" />

        {/* Run / Stop */}
        {isRunning ? (
          <button onClick={handleStop}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#da3633] hover:bg-[#f85149] text-white text-xs font-medium transition-colors"
            data-testid="button-stop">
            <Square className="h-3.5 w-3.5" /> Stop
          </button>
        ) : (
          <button onClick={handleRun}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#238636] hover:bg-[#2ea043] text-white text-xs font-medium transition-colors"
            data-testid="button-run">
            <Play className="h-3.5 w-3.5" /> Run
          </button>
        )}

        <button onClick={handleShare}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#21262d] hover:bg-[#30363d] border border-[#30363d] text-xs transition-colors"
          data-testid="button-share">
          {copied ? <Check className="h-3.5 w-3.5 text-green-400" /> : <Share2 className="h-3.5 w-3.5" />}
          <span className="hidden sm:inline">Share</span>
        </button>

        <button onClick={handleDeploy}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#6e40c9] hover:bg-[#8957e5] text-white text-xs font-medium transition-colors"
          data-testid="button-deploy">
          <Rocket className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Deploy</span>
        </button>

        <button className="h-8 w-8 flex items-center justify-center rounded hover:bg-[#21262d] text-[#8b949e] transition-colors"
          data-testid="button-settings">
          <Settings className="h-4 w-4" />
        </button>
      </div>

      {/* ── Main workspace ── */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── Left sidebar icons (desktop) ── */}
        <div className="hidden md:flex flex-col items-center w-10 border-r border-[#21262d] bg-[#161b22] py-2 gap-1 shrink-0">
          {[
            { icon: <FileCode className="h-4 w-4" />, label: "Files", panel: "files" as Panel },
            { icon: <Search className="h-4 w-4" />, label: "Search", panel: "files" as Panel },
            { icon: <GitBranch className="h-4 w-4" />, label: "Git", panel: "files" as Panel },
            { icon: <Package className="h-4 w-4" />, label: "Packages", panel: "files" as Panel },
          ].map(item => (
            <button key={item.label}
              onClick={() => setActivePanel(item.panel)}
              title={item.label}
              className="h-8 w-8 flex items-center justify-center rounded text-[#8b949e] hover:text-[#e6edf3] hover:bg-[#21262d] transition-colors"
              data-testid={`sidebar-${item.label.toLowerCase()}`}>
              {item.icon}
            </button>
          ))}
          <div className="flex-1" />
          <button title="Settings" className="h-8 w-8 flex items-center justify-center rounded text-[#8b949e] hover:text-[#e6edf3] hover:bg-[#21262d] transition-colors">
            <Settings className="h-4 w-4" />
          </button>
        </div>

        {/* ── File explorer (desktop) ── */}
        <div className="hidden md:flex flex-col w-48 border-r border-[#21262d] bg-[#161b22] shrink-0 overflow-y-auto">
          <div className="flex items-center justify-between px-3 py-2 border-b border-[#21262d]">
            <span className="text-[10px] font-semibold text-[#8b949e] uppercase tracking-widest">Files</span>
            <button className="h-5 w-5 flex items-center justify-center rounded hover:bg-[#21262d] text-[#8b949e]"
              data-testid="button-new-file">
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="py-1 flex-1">
            {files.map(n => <FileTreeItem key={n.name} node={n} onSelect={handleFileSelect} selectedName={selectedFile.name} />)}
          </div>
        </div>

        {/* ── CENTER: editor or mobile panels ── */}
        <div className="flex flex-col flex-1 overflow-hidden">
          {/* ── Tabs bar ── */}
          {(activePanel === "editor" || true) && (
            <div className="flex items-center border-b border-[#21262d] bg-[#161b22] overflow-x-auto shrink-0" style={{ minHeight: 36 }}>
              {openTabs.map(tab => (
                <div key={tab.name} onClick={() => { setSelectedFile(tab); setActivePanel("editor"); }}
                  className={`flex items-center gap-1.5 px-3 py-2 text-xs border-r border-[#21262d] cursor-pointer shrink-0 transition-colors ${selectedFile.name === tab.name && activePanel === "editor" ? "bg-[#0d1117] text-[#e6edf3] border-t-2 border-t-[#58a6ff]" : "text-[#8b949e] hover:text-[#e6edf3] hover:bg-[#21262d]"}`}
                  data-testid={`tab-${tab.name}`}>
                  <FileCode className="h-3 w-3 shrink-0" />
                  {tab.name}
                  {openTabs.length > 1 && (
                    <button onClick={e => closeTab(e, tab)}
                      className="h-3.5 w-3.5 flex items-center justify-center rounded hover:bg-[#30363d] ml-1"
                      data-testid={`close-${tab.name}`}>
                      <X className="h-2.5 w-2.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* ── Split: editor + preview ── */}
          <div className="flex flex-1 overflow-hidden">

            {/* Code editor (hidden on mobile when other panel active) */}
            <div className={`flex-1 overflow-auto bg-[#0d1117] ${activePanel !== "editor" && activePanel !== "files" && activePanel !== "agent" && activePanel !== "console" ? "hidden md:flex" : "flex"} flex-col`}>
              {activePanel === "files" ? (
                /* Mobile file explorer */
                <div className="flex flex-col flex-1 overflow-y-auto md:hidden">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-[#21262d]">
                    <span className="text-sm font-semibold">Files</span>
                    <button className="text-[#8b949e]"><Plus className="h-4 w-4" /></button>
                  </div>
                  {files.map(n => <FileTreeItem key={n.name} node={n} onSelect={handleFileSelect} selectedName={selectedFile.name} />)}
                </div>
              ) : activePanel === "agent" ? (
                /* Mobile agent panel */
                <div className="flex flex-col flex-1 overflow-hidden md:hidden">
                  <AgentPanel messages={agentMessages} input={agentInput} typing={agentTyping}
                    onInput={setAgentInput} onSend={sendAgentMessage} endRef={agentEndRef} />
                </div>
              ) : activePanel === "console" ? (
                /* Mobile console */
                <div className="flex flex-col flex-1 overflow-y-auto md:hidden">
                  <div className="flex items-center px-4 py-2 border-b border-[#21262d]">
                    <Terminal className="h-4 w-4 mr-2 text-[#8b949e]" />
                    <span className="text-sm">Console</span>
                  </div>
                  <div className="flex-1 p-4 font-mono text-xs space-y-0.5 overflow-y-auto">
                    {terminalLines.map((l, i) => (
                      <div key={i} style={{ color: l.color }}>{l.text || "\u00A0"}</div>
                    ))}
                    {isRunning && <div style={{ color: "#7ee787" }} className="animate-pulse">● Server running on port 5173</div>}
                  </div>
                </div>
              ) : activePanel === "preview" ? (
                /* Mobile preview */
                <div className="flex flex-col flex-1 overflow-hidden md:hidden">
                  <PreviewPanel
                    previewHtml={previewHtml}
                    isRunning={isRunning}
                    iframeRef={iframeRef}
                    url={previewUrl}
                    onRefresh={handleRefreshPreview}
                    onRun={handleRun}
                  />
                </div>
              ) : (
                /* Code editor */
                <div className="flex flex-1 overflow-auto">
                  <div className="w-10 shrink-0 text-right pt-4 pb-4 font-mono text-[11px] leading-6 text-[#484f58] select-none bg-[#0d1117] border-r border-[#21262d]/50">
                    {codeLines.map((_, i) => (
                      <div key={i} className="pr-3">{i + 1}</div>
                    ))}
                  </div>
                  <pre className="flex-1 p-4 text-[12px] font-mono leading-6 overflow-x-auto outline-none">
                    {codeLines.map((line, i) => (
                      <div key={i}
                        className="hover:bg-white/[0.03] px-1 rounded cursor-text"
                        dangerouslySetInnerHTML={{ __html: highlight(line, selectedFile.language || "txt") || "\u00A0" }}
                      />
                    ))}
                  </pre>
                </div>
              )}
            </div>

            {/* ── Desktop right panels ── */}
            <div className="hidden md:flex flex-col border-l border-[#21262d]" style={{ width: "45%" }}>
              {/* Panel switcher */}
              <div className="flex items-center border-b border-[#21262d] bg-[#161b22] shrink-0">
                {[
                  { id: "preview" as Panel, icon: <Monitor className="h-3.5 w-3.5" />, label: "Preview" },
                  { id: "console" as Panel, icon: <Terminal className="h-3.5 w-3.5" />, label: "Console" },
                  { id: "agent" as Panel, icon: <Sparkles className="h-3.5 w-3.5" />, label: "Agent" },
                ].map(p => (
                  <button key={p.id} onClick={() => setActivePanel(p.id)}
                    className={`flex items-center gap-1.5 px-4 py-2 text-xs border-r border-[#21262d] transition-colors ${activePanel === p.id ? "bg-[#0d1117] text-[#e6edf3] border-t-2 border-t-[#a371f7]" : "text-[#8b949e] hover:text-[#e6edf3] hover:bg-[#21262d]"}`}
                    data-testid={`panel-tab-${p.id}`}>
                    {p.icon} {p.label}
                  </button>
                ))}
                <div className="flex-1" />
                {activePanel === "preview" && isRunning && (
                  <div className="flex items-center gap-2 pr-2">
                    <button onClick={handleRefreshPreview}
                      className="h-6 w-6 flex items-center justify-center rounded hover:bg-[#21262d] text-[#8b949e]"
                      data-testid="button-refresh-preview">
                      <RefreshCw className="h-3.5 w-3.5" />
                    </button>
                    <button className="h-6 w-6 flex items-center justify-center rounded hover:bg-[#21262d] text-[#8b949e]">
                      <ExternalLink className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
              </div>

              {/* Panel content */}
              <div className="flex-1 overflow-hidden bg-[#0d1117]">
                {activePanel === "preview" && (
                  <PreviewPanel
                    previewHtml={previewHtml}
                    isRunning={isRunning}
                    iframeRef={iframeRef}
                    url={previewUrl}
                    onRefresh={handleRefreshPreview}
                    onRun={handleRun}
                  />
                )}
                {activePanel === "console" && (
                  <div className="flex flex-col h-full">
                    <div className="flex-1 overflow-y-auto p-4 font-mono text-xs space-y-0.5">
                      {terminalLines.map((l, i) => (
                        <div key={i} style={{ color: l.color }}>{l.text || "\u00A0"}</div>
                      ))}
                      {isRunning && <div style={{ color: "#7ee787" }} className="animate-pulse">● Server running on port 5173</div>}
                    </div>
                    <div className="border-t border-[#21262d] flex items-center px-3 py-2 gap-2">
                      <span style={{ color: "#7ee787" }} className="font-mono text-xs">$</span>
                      <input className="flex-1 bg-transparent font-mono text-xs text-[#e6edf3] outline-none placeholder-[#484f58]"
                        placeholder="Enter command..."
                        onKeyDown={e => {
                          if (e.key === "Enter" && (e.target as HTMLInputElement).value) {
                            const val = (e.target as HTMLInputElement).value;
                            setTerminalLines(p => [...p, { text: `$ ${val}`, color: "#7ee787" }, { text: `bash: ${val}: command not found`, color: "#f85149" }]);
                            (e.target as HTMLInputElement).value = "";
                          }
                        }}
                        data-testid="input-terminal"
                      />
                    </div>
                  </div>
                )}
                {activePanel === "agent" && (
                  <AgentPanel messages={agentMessages} input={agentInput} typing={agentTyping}
                    onInput={setAgentInput} onSend={sendAgentMessage} endRef={agentEndRef} />
                )}
              </div>
            </div>
          </div>

          {/* ── Status bar ── */}
          <div className="hidden md:flex h-6 items-center gap-4 px-3 border-t border-[#21262d] bg-[#161b22] shrink-0 text-[10px] text-[#8b949e]">
            <div className="flex items-center gap-1">
              {isRunning
                ? <><CircleDot className="h-3 w-3 text-green-400" /><span className="text-green-400">Running</span></>
                : <><CircleDot className="h-3 w-3" /><span>Stopped</span></>
              }
            </div>
            <span>|</span>
            <div className="flex items-center gap-1">
              <GitBranch className="h-3 w-3" /> main
            </div>
            <span>|</span>
            <span>{selectedFile.language?.toUpperCase() || "TXT"}</span>
            <span>|</span>
            <span>{codeLines.length} lines</span>
            <div className="flex-1" />
            <div className="flex items-center gap-1">
              {isRunning ? <Wifi className="h-3 w-3 text-green-400" /> : <WifiOff className="h-3 w-3" />}
              <span>{isRunning ? "localhost:5173" : "Offline"}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Bottom toolbar (mobile, like Replit app) ── */}
      <div className="md:hidden flex items-center justify-around h-14 border-t border-[#21262d] bg-[#161b22] shrink-0 px-2">
        {[
          { id: "files" as Panel, icon: <FileCode className="h-5 w-5" />, label: "Files" },
          { id: "editor" as Panel, icon: <LayoutTemplate className="h-5 w-5" />, label: "Editor" },
          { id: "agent" as Panel, icon: <Sparkles className="h-5 w-5" />, label: "Agent" },
          { id: "preview" as Panel, icon: <Monitor className="h-5 w-5" />, label: "Preview" },
          { id: "console" as Panel, icon: <Terminal className="h-5 w-5" />, label: "Console" },
        ].map(p => (
          <button key={p.id} onClick={() => setActivePanel(p.id)}
            className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg transition-all ${activePanel === p.id ? "text-[#a371f7] bg-[#a371f7]/10" : "text-[#8b949e] hover:text-[#e6edf3]"}`}
            data-testid={`mobile-tab-${p.id}`}>
            {p.icon}
            <span className="text-[9px] font-medium">{p.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ─── Preview Panel ──────────────────────────────────── */
function PreviewPanel({ previewHtml, isRunning, iframeRef, url, onRefresh, onRun }: {
  previewHtml: string | null;
  isRunning: boolean;
  iframeRef: React.RefObject<HTMLIFrameElement | null>;
  url: string;
  onRefresh: () => void;
  onRun: () => void;
}) {
  return (
    <div className="flex flex-col h-full">
      {/* URL bar */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-[#21262d] bg-[#161b22] shrink-0">
        <div className={`h-2 w-2 rounded-full ${isRunning ? "bg-green-400" : "bg-[#484f58]"}`} />
        <div className="flex-1 flex items-center bg-[#0d1117] border border-[#21262d] rounded px-2 py-1 gap-2">
          <Globe className="h-3 w-3 text-[#8b949e] shrink-0" />
          <span className="text-xs font-mono text-[#8b949e] truncate flex-1">
            {isRunning ? `https://${url}` : "Not running"}
          </span>
        </div>
        <button onClick={onRefresh}
          className="h-6 w-6 flex items-center justify-center rounded hover:bg-[#21262d] text-[#8b949e]"
          data-testid="button-refresh">
          <RefreshCw className="h-3.5 w-3.5" />
        </button>
        <button className="h-6 w-6 flex items-center justify-center rounded hover:bg-[#21262d] text-[#8b949e]">
          <Maximize2 className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* iframe / placeholder */}
      <div className="flex-1 overflow-hidden relative bg-white">
        {previewHtml ? (
          <iframe
            ref={iframeRef}
            srcDoc={previewHtml}
            title="Preview"
            className="w-full h-full border-none"
            sandbox="allow-scripts allow-same-origin"
            data-testid="preview-iframe"
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-full bg-[#0d1117] text-[#8b949e] gap-4">
            <Monitor className="h-16 w-16 opacity-20" />
            <div className="text-center">
              <p className="text-sm font-medium text-[#e6edf3] mb-1">Preview is not running</p>
              <p className="text-xs mb-4">Click Run to start your development server</p>
              <button onClick={onRun}
                className="flex items-center gap-2 mx-auto px-4 py-2 rounded bg-[#238636] hover:bg-[#2ea043] text-white text-sm font-medium transition-colors"
                data-testid="button-run-from-preview">
                <Play className="h-4 w-4" /> Run
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Markdown renderer (no external deps) ───────────── */
function renderMarkdown(text: string) {
  const lines = text.split("\n");
  const elements: React.ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Code block
    if (line.startsWith("```")) {
      const lang = line.slice(3).trim();
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].startsWith("```")) {
        codeLines.push(lines[i]);
        i++;
      }
      elements.push(
        <div key={i} className="my-2 rounded-lg overflow-hidden border border-[#30363d]">
          {lang && (
            <div className="flex items-center gap-2 px-3 py-1 bg-[#161b22] border-b border-[#30363d]">
              <span className="text-[10px] font-mono text-[#8b949e] uppercase">{lang}</span>
            </div>
          )}
          <pre className="bg-[#0d1117] p-3 overflow-x-auto">
            <code className="text-xs font-mono text-[#e6edf3] leading-relaxed whitespace-pre">
              {codeLines.join("\n")}
            </code>
          </pre>
        </div>
      );
      i++;
      continue;
    }

    // Bullet
    if (line.match(/^[-*•]\s/)) {
      elements.push(
        <div key={i} className="flex gap-2 text-sm leading-relaxed">
          <span className="text-[#58a6ff] mt-0.5 shrink-0">•</span>
          <span>{inlineFormat(line.slice(2))}</span>
        </div>
      );
      i++;
      continue;
    }

    // Heading
    if (line.startsWith("### ")) {
      elements.push(<p key={i} className="text-sm font-semibold text-[#e6edf3] mt-3 mb-1">{inlineFormat(line.slice(4))}</p>);
      i++;
      continue;
    }
    if (line.startsWith("## ")) {
      elements.push(<p key={i} className="text-sm font-bold text-[#58a6ff] mt-3 mb-1">{inlineFormat(line.slice(3))}</p>);
      i++;
      continue;
    }
    if (line.startsWith("# ")) {
      elements.push(<p key={i} className="text-base font-bold text-[#58a6ff] mt-2 mb-1">{inlineFormat(line.slice(2))}</p>);
      i++;
      continue;
    }

    // Empty line → spacer
    if (line.trim() === "") {
      elements.push(<div key={i} className="h-1" />);
      i++;
      continue;
    }

    // Normal paragraph
    elements.push(<p key={i} className="text-sm leading-relaxed">{inlineFormat(line)}</p>);
    i++;
  }

  return <>{elements}</>;
}

function inlineFormat(text: string): React.ReactNode {
  const parts = text.split(/(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*)/g);
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith("**") && part.endsWith("**")) {
          return <strong key={i} className="font-semibold text-[#e6edf3]">{part.slice(2, -2)}</strong>;
        }
        if (part.startsWith("*") && part.endsWith("*") && part.length > 2) {
          return <em key={i} className="italic">{part.slice(1, -1)}</em>;
        }
        if (part.startsWith("`") && part.endsWith("`")) {
          return <code key={i} className="px-1.5 py-0.5 rounded bg-[#161b22] border border-[#30363d] font-mono text-[11px] text-[#ffa657]">{part.slice(1, -1)}</code>;
        }
        return <span key={i}>{part}</span>;
      })}
    </>
  );
}

/* ─── Agent Panel ────────────────────────────────────── */
function AgentPanel({ messages, input, typing, onInput, onSend, endRef }: {
  messages: { role: string; text: string }[];
  input: string;
  typing: boolean;
  onInput: (v: string) => void;
  onSend: () => void;
  endRef: React.RefObject<HTMLDivElement | null>;
}) {
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-[#21262d] bg-[#161b22] shrink-0">
        <div className="h-6 w-6 rounded bg-gradient-to-br from-[#58a6ff] to-[#a371f7] flex items-center justify-center">
          <Sparkles className="h-3.5 w-3.5 text-white" />
        </div>
        <div>
          <span className="text-sm font-semibold">AI Agent</span>
        </div>
        <div className="ml-auto flex items-center gap-1.5">
          <div className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#a371f7]/20 text-[#a371f7] border border-[#a371f7]/30 font-medium">Claude Opus</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((m, i) => (
          <div key={i} className={`flex gap-3 ${m.role === "user" ? "flex-row-reverse" : ""}`}>
            <div className={`h-7 w-7 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${m.role === "agent" ? "bg-gradient-to-br from-[#58a6ff] to-[#a371f7] text-white" : "bg-[#30363d] text-[#e6edf3]"}`}>
              {m.role === "agent" ? <Sparkles className="h-3.5 w-3.5" /> : "U"}
            </div>
            <div
              className={`max-w-[85%] rounded-xl px-3 py-2.5 ${m.role === "agent" ? "bg-[#21262d] text-[#e6edf3] rounded-tl-none" : "bg-[#1f6feb] text-white rounded-tr-none"}`}
              data-testid={`msg-${m.role}-${i}`}
            >
              {m.role === "agent"
                ? (m.text === ""
                  ? <div className="flex gap-1 py-1">{[0,1,2].map(j => <div key={j} className="h-1.5 w-1.5 rounded-full bg-[#58a6ff] animate-bounce" style={{ animationDelay: `${j*0.15}s` }} />)}</div>
                  : renderMarkdown(m.text))
                : <p className="text-sm leading-relaxed">{m.text}</p>
              }
            </div>
          </div>
        ))}
        {typing && agentMessages_typing_placeholder()}
        <div ref={endRef} />
      </div>

      <div className="border-t border-[#21262d] p-3 bg-[#161b22] shrink-0">
        <div className={`flex items-end gap-2 bg-[#21262d] rounded-xl border px-3 py-2 transition-colors ${typing ? "border-[#a371f7]/50" : "border-[#30363d]"}`}>
          <textarea
            value={input}
            onChange={e => onInput(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); onSend(); } }}
            placeholder={typing ? "Claude is thinking..." : "Ask about your code..."}
            rows={1}
            disabled={typing}
            className="flex-1 bg-transparent text-sm text-[#e6edf3] placeholder-[#484f58] outline-none resize-none disabled:opacity-50"
            style={{ maxHeight: 100 }}
            data-testid="input-agent"
          />
          <button onClick={onSend} disabled={typing}
            className="h-7 w-7 flex items-center justify-center rounded-lg bg-[#a371f7] hover:bg-[#8957e5] text-white transition-colors shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
            data-testid="button-agent-send">
            {typing ? <div className="h-3 w-3 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Send className="h-3.5 w-3.5" />}
          </button>
        </div>
        <p className="text-[10px] text-[#484f58] text-center mt-2">Reads your current file • Claude Opus 4.7</p>
      </div>
    </div>
  );
}

function agentMessages_typing_placeholder() { return null; }
