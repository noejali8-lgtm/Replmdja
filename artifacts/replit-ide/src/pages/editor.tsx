import { useState } from "react";
import { useLocation } from "wouter";
import { Play, Square, Share2, Rocket, ChevronRight, ChevronDown, FileCode, FolderOpen, Folder, X, Terminal, Eye, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

type FileNode = {
  name: string;
  type: "file" | "folder";
  children?: FileNode[];
  content?: string;
  language?: string;
};

const FILE_TREE: FileNode[] = [
  {
    name: "src",
    type: "folder",
    children: [
      { name: "App.tsx", type: "file", language: "tsx", content: `import React from 'react';
import { useState } from 'react';

function App() {
  const [count, setCount] = useState(0);

  return (
    <div className="App">
      <header className="App-header">
        <h1>Hello, World!</h1>
        <p>Count: {count}</p>
        <button onClick={() => setCount(count + 1)}>
          Click me
        </button>
      </header>
    </div>
  );
}

export default App;` },
      { name: "index.tsx", type: "file", language: "tsx", content: `import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);` },
      { name: "index.css", type: "file", language: "css", content: `:root {
  font-family: Inter, system-ui, sans-serif;
  line-height: 1.5;
  color: #ffffff;
  background-color: #0d1117;
}

.App {
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
}

.App-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

button {
  padding: 0.5rem 1rem;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 1rem;
}

button:hover {
  background: #2563eb;
}` },
    ],
  },
  {
    name: "public",
    type: "folder",
    children: [
      { name: "index.html", type: "file", language: "html", content: `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>My App</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/index.tsx"></script>
  </body>
</html>` },
    ],
  },
  { name: "package.json", type: "file", language: "json", content: `{
  "name": "my-web-app",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.0.0",
    "typescript": "^5.0.0",
    "vite": "^4.4.0"
  }
}` },
  { name: "README.md", type: "file", language: "md", content: `# My Web App

A React application built with Vite and TypeScript.

## Getting Started

\`\`\`bash
npm install
npm run dev
\`\`\`

## Features
- React 18
- TypeScript
- Vite build tool
- Hot module replacement
` },
];

const TERMINAL_LINES = [
  { text: "> npm run dev", color: "text-green-400" },
  { text: "", color: "text-muted-foreground" },
  { text: "  VITE v4.4.0  ready in 312 ms", color: "text-blue-400" },
  { text: "", color: "text-muted-foreground" },
  { text: "  ➜  Local:   http://localhost:5173/", color: "text-green-400" },
  { text: "  ➜  Network: http://172.31.0.1:5173/", color: "text-muted-foreground" },
  { text: "  ➜  press h to show help", color: "text-muted-foreground" },
];

function getTokens(line: string, language: string) {
  if (language === "tsx" || language === "jsx" || language === "ts" || language === "js") {
    return line
      .replace(/(import|from|export|default|function|const|let|var|return|if|else|class|extends|new|typeof|void|null|undefined|true|false|async|await)/g, '<span class="text-purple-400">$1</span>')
      .replace(/(".*?"|'.*?'|`.*?`)/g, '<span class="text-green-400">$1</span>')
      .replace(/(\/\/.*$)/g, '<span class="text-gray-500">$1</span>')
      .replace(/(\{|\}|\(|\)|\[|\])/g, '<span class="text-yellow-400">$1</span>');
  }
  if (language === "css") {
    return line
      .replace(/(\/\*.*?\*\/)/g, '<span class="text-gray-500">$1</span>')
      .replace(/([a-z-]+)(\s*:)/g, '<span class="text-blue-400">$1</span>$2')
      .replace(/(#[0-9a-fA-F]{3,6}|rgba?\([^)]+\))/g, '<span class="text-orange-400">$1</span>');
  }
  if (language === "html") {
    return line
      .replace(/(&lt;[^&]*&gt;)/g, '<span class="text-red-400">$1</span>')
      .replace(/(&lt;\/?[a-z]+)/g, '<span class="text-red-400">$1</span>')
      .replace(/(\/&gt;|&gt;)/g, '<span class="text-red-400">$1</span>');
  }
  return line;
}

function FileTreeItem({ node, depth = 0, onSelect, selectedFile }: {
  node: FileNode;
  depth?: number;
  onSelect: (node: FileNode) => void;
  selectedFile: string;
}) {
  const [open, setOpen] = useState(depth === 0);

  if (node.type === "folder") {
    return (
      <div>
        <button
          onClick={() => setOpen(!open)}
          className="w-full flex items-center gap-1 px-2 py-1 text-sm hover:bg-accent/50 transition-colors text-muted-foreground hover:text-foreground"
          style={{ paddingLeft: `${(depth + 1) * 12}px` }}
          data-testid={`folder-${node.name}`}
        >
          {open ? <ChevronDown className="h-3 w-3 shrink-0" /> : <ChevronRight className="h-3 w-3 shrink-0" />}
          {open ? <FolderOpen className="h-3.5 w-3.5 shrink-0 text-blue-400" /> : <Folder className="h-3.5 w-3.5 shrink-0 text-blue-400" />}
          <span>{node.name}</span>
        </button>
        {open && node.children?.map((child) => (
          <FileTreeItem key={child.name} node={child} depth={depth + 1} onSelect={onSelect} selectedFile={selectedFile} />
        ))}
      </div>
    );
  }

  return (
    <button
      onClick={() => onSelect(node)}
      className={`w-full flex items-center gap-1.5 px-2 py-1 text-sm transition-colors ${
        selectedFile === node.name
          ? "bg-primary/10 text-primary"
          : "hover:bg-accent/50 text-muted-foreground hover:text-foreground"
      }`}
      style={{ paddingLeft: `${(depth + 1) * 12 + 16}px` }}
      data-testid={`file-${node.name}`}
    >
      <FileCode className="h-3.5 w-3.5 shrink-0" />
      <span>{node.name}</span>
    </button>
  );
}

export default function Editor() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [selectedFile, setSelectedFile] = useState<FileNode>(FILE_TREE[0].children![0]);
  const [openTabs, setOpenTabs] = useState<FileNode[]>([FILE_TREE[0].children![0]]);
  const [isRunning, setIsRunning] = useState(false);
  const [activePanel, setActivePanel] = useState<"terminal" | "preview">("terminal");

  const handleRun = () => {
    setIsRunning(true);
    toast({ title: "Building...", description: "Compiling your project" });
    setTimeout(() => {
      setIsRunning(false);
      toast({ title: "Build successful", description: "Your app is running on port 5173" });
    }, 2000);
  };

  const handleStop = () => {
    setIsRunning(false);
    toast({ title: "Stopped", description: "The server has been stopped" });
  };

  const handleShare = () => {
    toast({ title: "Link copied!", description: "Share link copied to clipboard" });
  };

  const handleDeploy = () => {
    toast({ title: "Deploying...", description: "Your project is being deployed" });
  };

  const handleFileSelect = (node: FileNode) => {
    setSelectedFile(node);
    if (!openTabs.find(t => t.name === node.name)) {
      setOpenTabs([...openTabs, node]);
    }
  };

  const closeTab = (e: React.MouseEvent, node: FileNode) => {
    e.stopPropagation();
    const newTabs = openTabs.filter(t => t.name !== node.name);
    setOpenTabs(newTabs);
    if (selectedFile.name === node.name && newTabs.length > 0) {
      setSelectedFile(newTabs[newTabs.length - 1]);
    }
  };

  const codeLines = (selectedFile.content || "").split("\n");

  return (
    <div className="flex flex-col h-screen bg-background text-foreground dark overflow-hidden">
      {/* Top toolbar */}
      <div className="h-12 flex items-center justify-between px-3 border-b border-border bg-card/80 backdrop-blur shrink-0">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-2 text-muted-foreground hover:text-foreground"
            onClick={() => setLocation("/")}
            data-testid="button-back"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            <span className="text-sm">My Web App</span>
          </Button>
        </div>
        <div className="flex items-center gap-2">
          {isRunning ? (
            <Button
              size="sm"
              variant="destructive"
              className="h-8 gap-1.5"
              onClick={handleStop}
              data-testid="button-stop"
            >
              <Square className="h-3.5 w-3.5" />
              Stop
            </Button>
          ) : (
            <Button
              size="sm"
              className="h-8 gap-1.5 bg-green-600 hover:bg-green-700 text-white"
              onClick={handleRun}
              data-testid="button-run"
            >
              <Play className="h-3.5 w-3.5" />
              Run
            </Button>
          )}
          <Button
            size="sm"
            variant="outline"
            className="h-8 gap-1.5"
            onClick={handleShare}
            data-testid="button-share"
          >
            <Share2 className="h-3.5 w-3.5" />
            Share
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-8 gap-1.5 border-primary/50 text-primary hover:bg-primary/10"
            onClick={handleDeploy}
            data-testid="button-deploy"
          >
            <Rocket className="h-3.5 w-3.5" />
            Deploy
          </Button>
        </div>
      </div>

      {/* Main layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* File explorer */}
        <div className="w-48 border-r border-border bg-sidebar flex flex-col shrink-0 overflow-y-auto">
          <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider border-b border-border">
            Files
          </div>
          <div className="py-1">
            {FILE_TREE.map((node) => (
              <FileTreeItem key={node.name} node={node} onSelect={handleFileSelect} selectedFile={selectedFile.name} />
            ))}
          </div>
        </div>

        {/* Editor + panels */}
        <div className="flex flex-col flex-1 overflow-hidden">
          {/* File tabs */}
          <div className="flex items-center border-b border-border bg-card/40 overflow-x-auto shrink-0">
            {openTabs.map((tab) => (
              <div
                key={tab.name}
                onClick={() => setSelectedFile(tab)}
                className={`flex items-center gap-2 px-4 py-2 text-sm border-r border-border cursor-pointer shrink-0 ${
                  selectedFile.name === tab.name
                    ? "bg-background text-foreground border-t-2 border-t-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent/30"
                }`}
                data-testid={`tab-${tab.name}`}
              >
                <FileCode className="h-3.5 w-3.5" />
                <span>{tab.name}</span>
                <button
                  onClick={(e) => closeTab(e, tab)}
                  className="h-4 w-4 rounded hover:bg-accent flex items-center justify-center"
                  data-testid={`close-tab-${tab.name}`}
                >
                  <X className="h-2.5 w-2.5" />
                </button>
              </div>
            ))}
          </div>

          {/* Code + preview split */}
          <div className="flex flex-1 overflow-hidden">
            {/* Code editor */}
            <div className="flex-1 overflow-auto bg-background">
              <div className="flex min-w-0">
                {/* Line numbers */}
                <div className="w-12 shrink-0 text-right pr-4 pt-4 pb-4 text-xs text-muted-foreground/40 font-mono select-none bg-card/20 border-r border-border/30">
                  {codeLines.map((_, i) => (
                    <div key={i} className="leading-6">{i + 1}</div>
                  ))}
                </div>
                {/* Code */}
                <pre className="flex-1 p-4 text-xs font-mono leading-6 overflow-x-auto">
                  {codeLines.map((line, i) => (
                    <div
                      key={i}
                      className="hover:bg-accent/20 px-1 rounded"
                      dangerouslySetInnerHTML={{
                        __html: getTokens(
                          line.replace(/</g, "&lt;").replace(/>/g, "&gt;"),
                          selectedFile.language || "txt"
                        )
                      }}
                    />
                  ))}
                </pre>
              </div>
            </div>

            {/* Right preview panel */}
            <div className="w-64 border-l border-border bg-card/20 flex flex-col shrink-0 hidden lg:flex">
              <div className="flex items-center border-b border-border px-3 py-2">
                <button
                  onClick={() => setActivePanel("preview")}
                  className={`flex items-center gap-1.5 text-xs px-2 py-1 rounded mr-2 ${activePanel === "preview" ? "bg-primary/20 text-primary" : "text-muted-foreground hover:text-foreground"}`}
                  data-testid="button-preview-tab"
                >
                  <Eye className="h-3.5 w-3.5" />
                  Preview
                </button>
                <button
                  onClick={() => setActivePanel("terminal")}
                  className={`flex items-center gap-1.5 text-xs px-2 py-1 rounded ${activePanel === "terminal" ? "bg-primary/20 text-primary" : "text-muted-foreground hover:text-foreground"}`}
                  data-testid="button-terminal-tab"
                >
                  <Terminal className="h-3.5 w-3.5" />
                  Console
                </button>
              </div>
              {activePanel === "preview" ? (
                <div className="flex-1 flex items-center justify-center text-muted-foreground text-xs p-4 text-center">
                  <div>
                    <Eye className="h-8 w-8 mx-auto mb-2 opacity-30" />
                    <p>Run your project to see the preview</p>
                  </div>
                </div>
              ) : (
                <div className="flex-1 overflow-auto p-3 font-mono text-xs">
                  {TERMINAL_LINES.map((line, i) => (
                    <div key={i} className={line.color}>{line.text || "\u00A0"}</div>
                  ))}
                  {isRunning && (
                    <div className="text-green-400 animate-pulse">{">"} Rebuilding...</div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Bottom terminal (always visible) */}
          <div className="h-32 border-t border-border bg-card/30 shrink-0 overflow-auto p-3 font-mono text-xs lg:hidden">
            <div className="flex items-center gap-2 mb-2 text-muted-foreground">
              <Terminal className="h-3.5 w-3.5" />
              <span>Terminal</span>
            </div>
            {TERMINAL_LINES.map((line, i) => (
              <div key={i} className={line.color}>{line.text || "\u00A0"}</div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
