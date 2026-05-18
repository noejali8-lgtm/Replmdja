import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, ExternalLink, RefreshCw, FileCode, Globe, ChevronRight,
  Folder, FolderOpen, Copy, Check, Download, Maximize2, Minimize2,
  Play, Code2, File, ArrowLeft,
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

function getLanguage(filePath: string): string {
  const ext = filePath.split(".").pop()?.toLowerCase() ?? "";
  const map: Record<string, string> = {
    html: "html", htm: "html", css: "css", js: "javascript",
    ts: "typescript", tsx: "tsx", jsx: "jsx", json: "json",
    py: "python", md: "markdown", txt: "text", sh: "bash",
    yaml: "yaml", yml: "yaml", env: "bash",
  };
  return map[ext] ?? "text";
}

function getFileIcon(filePath: string) {
  const ext = filePath.split(".").pop()?.toLowerCase() ?? "";
  const lang = getLanguage(filePath);
  const colors: Record<string, string> = {
    html: "text-orange-400", css: "text-blue-400", javascript: "text-yellow-400",
    typescript: "text-blue-500", tsx: "text-cyan-400", jsx: "text-cyan-400",
    json: "text-yellow-300", python: "text-green-400", markdown: "text-purple-400",
    bash: "text-green-300", yaml: "text-pink-400",
  };
  return { color: colors[lang] ?? "text-white/50", ext };
}

function SyntaxHighlight({ code, language }: { code: string; language: string }) {
  const highlighted = useCallback(() => {
    if (!code) return "";
    const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

    if (language === "html") {
      return esc(code)
        .replace(/(&lt;\/?)([\w-]+)/g, '<span class="text-red-400">$1$2</span>')
        .replace(/([\w-]+)(=)/g, '<span class="text-yellow-300">$1</span>$2')
        .replace(/("([^"]*)")/g, '<span class="text-green-300">$1</span>')
        .replace(/(&lt;!--[\s\S]*?--&gt;)/g, '<span class="text-white/30 italic">$1</span>');
    }

    if (language === "css") {
      return esc(code)
        .replace(/([\w-]+)\s*:/g, '<span class="text-blue-300">$1</span>:')
        .replace(/:\s*([^;{}\n]+)/g, ': <span class="text-green-300">$1</span>')
        .replace(/(\/\*[\s\S]*?\*\/)/g, '<span class="text-white/30 italic">$1</span>')
        .replace(/([.#]?[\w-]+)\s*\{/g, '<span class="text-yellow-300">$1</span> {');
    }

    if (language === "javascript" || language === "typescript" || language === "jsx" || language === "tsx") {
      return esc(code)
        .replace(/\b(const|let|var|function|class|return|if|else|for|while|import|export|from|default|async|await|try|catch|new|typeof|instanceof|of|in|true|false|null|undefined|void|this|super)\b/g, '<span class="text-purple-400">$1</span>')
        .replace(/\/\/.*/g, '<span class="text-white/30 italic">$&</span>')
        .replace(/("([^"\\]|\\.)*"|'([^'\\]|\\.)*'|`([^`\\]|\\.)*`)/g, '<span class="text-green-300">$1</span>')
        .replace(/\b(\d+\.?\d*)\b/g, '<span class="text-orange-300">$1</span>');
    }

    if (language === "python") {
      return esc(code)
        .replace(/\b(def|class|return|if|elif|else|for|while|import|from|as|with|try|except|finally|raise|pass|break|continue|and|or|not|in|is|True|False|None|lambda|yield|async|await)\b/g, '<span class="text-purple-400">$1</span>')
        .replace(/#.*/g, '<span class="text-white/30 italic">$&</span>')
        .replace(/("([^"\\]|\\.)*"|'([^'\\]|\\.)*')/g, '<span class="text-green-300">$1</span>')
        .replace(/\b(\d+\.?\d*)\b/g, '<span class="text-orange-300">$1</span>');
    }

    if (language === "json") {
      return esc(code)
        .replace(/"([^"]+)":/g, '<span class="text-blue-300">"$1"</span>:')
        .replace(/:\s*"([^"]+)"/g, ': <span class="text-green-300">"$1"</span>')
        .replace(/:\s*(\d+\.?\d*)/g, ': <span class="text-orange-300">$1</span>')
        .replace(/:\s*(true|false|null)/g, ': <span class="text-purple-400">$1</span>');
    }

    return esc(code);
  }, [code, language]);

  const lines = code.split("\n");
  const highlightedCode = highlighted();
  const highlightedLines = highlightedCode.split("\n");

  return (
    <div className="flex text-xs font-mono leading-5 overflow-auto h-full">
      <div className="select-none text-right pr-4 text-white/20 shrink-0 py-4"
        style={{ minWidth: `${String(lines.length).length * 8 + 16}px` }}>
        {lines.map((_, i) => (
          <div key={i}>{i + 1}</div>
        ))}
      </div>
      <pre className="flex-1 py-4 pr-4 overflow-auto text-white/80"
        dangerouslySetInnerHTML={{
          __html: highlightedLines.map(l => `<div class="min-h-[20px]">${l || " "}</div>`).join(""),
        }}
      />
    </div>
  );
}

function FileTreeItem({
  path: filePath, isSelected, onClick,
}: { path: string; isSelected: boolean; onClick: () => void }) {
  const { color, ext } = getFileIcon(filePath);
  const name = filePath.split("/").pop() ?? filePath;
  const dir = filePath.includes("/") ? filePath.split("/").slice(0, -1).join("/") : "";

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-2 px-3 py-1.5 text-xs text-left transition-colors rounded-md",
        isSelected
          ? "bg-blue-500/15 text-white border border-blue-500/25"
          : "text-white/60 hover:text-white hover:bg-white/5"
      )}
    >
      <FileCode size={12} className={color} />
      <span className="flex-1 truncate">{name}</span>
      {dir && <span className="text-white/25 text-[10px] truncate max-w-[60px]">{dir}/</span>}
      <span className="text-white/20 text-[10px]">{ext}</span>
    </button>
  );
}

export default function ProjectIDEPanel({
  projectId, files, onClose, onRefresh, title,
}: ProjectIDEPanelProps) {
  const [activeTab, setActiveTab] = useState<"files" | "preview">("files");
  const [selectedFile, setSelectedFile] = useState<ProjectFile | null>(files[0] ?? null);
  const [copied, setCopied] = useState(false);
  const [previewKey, setPreviewKey] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState("");
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const previewUrl = `/preview/${projectId}/index.html`;
  const projectTitle = title ?? projectId.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase());

  useEffect(() => {
    if (files.length > 0 && !selectedFile) {
      const indexFile = files.find(f => f.path === "index.html" || f.path === "index.js");
      setSelectedFile(indexFile ?? files[0]);
    }
  }, [files, selectedFile]);

  function handleCopy() {
    if (selectedFile) {
      try { navigator.clipboard?.writeText(selectedFile.content); } catch { /* noop */ }
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    }
  }

  function handleRefreshPreview() {
    setPreviewKey(k => k + 1);
    onRefresh?.();
  }

  function startEdit() {
    if (selectedFile) {
      setEditContent(selectedFile.content);
      setIsEditing(true);
    }
  }

  const language = selectedFile ? getLanguage(selectedFile.path) : "text";

  const sortedFiles = [...files].sort((a, b) => {
    if (a.path === "index.html") return -1;
    if (b.path === "index.html") return 1;
    return a.path.localeCompare(b.path);
  });

  return (
    <motion.div
      initial={{ y: "100%" }}
      animate={{ y: 0 }}
      exit={{ y: "100%" }}
      transition={{ type: "spring", stiffness: 380, damping: 38 }}
      className={cn(
        "absolute inset-0 z-50 flex flex-col",
        isFullscreen ? "fixed inset-0 z-[100]" : ""
      )}
      style={{ background: "#0d1117" }}
    >
      {/* Header */}
      <div className="flex items-center gap-2 px-3 pt-10 pb-2.5 border-b border-white/[0.08] shrink-0 bg-[#161b22]">
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
          <button
            onClick={() => window.open(previewUrl, "_blank")}
            className="w-7 h-7 flex items-center justify-center text-white/40 hover:text-white transition-colors rounded"
            title="Open in new tab"
          >
            <ExternalLink size={13} />
          </button>
          <button
            onClick={() => setIsFullscreen(v => !v)}
            className="w-7 h-7 flex items-center justify-center text-white/40 hover:text-white transition-colors rounded"
            title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
          >
            {isFullscreen ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
          </button>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center text-white/40 hover:text-white transition-colors rounded"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Tab Bar */}
      <div className="flex border-b border-white/[0.08] bg-[#161b22] shrink-0">
        <button
          onClick={() => setActiveTab("files")}
          className={cn(
            "flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium border-b-2 transition-colors",
            activeTab === "files"
              ? "border-blue-400 text-blue-300"
              : "border-transparent text-white/40 hover:text-white/70"
          )}
        >
          <FileCode size={12} />
          Editor
          <span className={cn(
            "text-[10px] px-1.5 py-0.5 rounded-full",
            activeTab === "files" ? "bg-blue-500/20 text-blue-300" : "bg-white/8 text-white/30"
          )}>
            {files.length}
          </span>
        </button>
        <button
          onClick={() => setActiveTab("preview")}
          className={cn(
            "flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium border-b-2 transition-colors",
            activeTab === "preview"
              ? "border-green-400 text-green-300"
              : "border-transparent text-white/40 hover:text-white/70"
          )}
        >
          <Globe size={12} />
          Live Preview
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
        </button>
      </div>

      {/* Files Tab */}
      <AnimatePresence mode="wait">
        {activeTab === "files" && (
          <motion.div
            key="files"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-1 min-h-0"
          >
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
                  <FileTreeItem
                    key={file.path}
                    path={file.path}
                    isSelected={selectedFile?.path === file.path}
                    onClick={() => {
                      setSelectedFile(file);
                      setIsEditing(false);
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Code Editor Area */}
            <div className="flex-1 flex flex-col min-w-0">
              {selectedFile ? (
                <>
                  {/* File Tab Header */}
                  <div className="flex items-center gap-2 px-3 py-2 border-b border-white/[0.07] bg-[#161b22] shrink-0">
                    <div className={getFileIcon(selectedFile.path).color}>
                      <File size={11} />
                    </div>
                    <span className="text-xs text-white/70 flex-1 truncate">{selectedFile.path}</span>
                    <div className="flex items-center gap-1">
                      {isEditing ? (
                        <button
                          onClick={() => setIsEditing(false)}
                          className="text-[10px] px-2 py-0.5 rounded border border-white/10 text-white/50 hover:text-white transition-colors"
                        >
                          Done
                        </button>
                      ) : (
                        <button
                          onClick={startEdit}
                          className="text-[10px] px-2 py-0.5 rounded border border-white/10 text-white/50 hover:text-white transition-colors"
                        >
                          Edit
                        </button>
                      )}
                      <button
                        onClick={handleCopy}
                        className="w-6 h-6 flex items-center justify-center text-white/30 hover:text-white transition-colors"
                      >
                        {copied ? <Check size={11} className="text-green-400" /> : <Copy size={11} />}
                      </button>
                    </div>
                  </div>

                  {/* Code View / Edit */}
                  <div className="flex-1 overflow-auto bg-[#0d1117]">
                    {isEditing ? (
                      <textarea
                        value={editContent}
                        onChange={e => setEditContent(e.target.value)}
                        spellCheck={false}
                        className="w-full h-full bg-transparent text-xs font-mono text-white/80 p-4 outline-none resize-none leading-5"
                        style={{ tabSize: 2 }}
                      />
                    ) : (
                      <SyntaxHighlight
                        code={selectedFile.content}
                        language={language}
                      />
                    )}
                  </div>

                  {/* Status Bar */}
                  <div className="flex items-center gap-3 px-3 py-1 bg-[#161b22] border-t border-white/[0.06] shrink-0">
                    <span className="text-[10px] text-white/25">
                      {language.toUpperCase()}
                    </span>
                    <span className="text-[10px] text-white/25">
                      {selectedFile.content.split("\n").length} lines
                    </span>
                    <span className="text-[10px] text-white/25">
                      {(selectedFile.content.length / 1024).toFixed(1)}KB
                    </span>
                    <div className="flex-1" />
                    <button
                      onClick={() => setActiveTab("preview")}
                      className="flex items-center gap-1 text-[10px] text-green-400/70 hover:text-green-400 transition-colors"
                    >
                      <Play size={9} fill="currentColor" />
                      Preview
                    </button>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-white/20 text-sm">
                  Select a file to view
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Preview Tab */}
        {activeTab === "preview" && (
          <motion.div
            key="preview"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 flex flex-col min-h-0"
          >
            {/* Preview Controls */}
            <div className="flex items-center gap-2 px-3 py-2 border-b border-white/[0.07] bg-[#161b22] shrink-0">
              <div className="flex items-center gap-1 shrink-0">
                <div className="w-2.5 h-2.5 rounded-full bg-red-400/60" />
                <div className="w-2.5 h-2.5 rounded-full bg-yellow-400/60" />
                <div className="w-2.5 h-2.5 rounded-full bg-green-400/60" />
              </div>
              <div className="flex-1 bg-[#0d1117] border border-white/[0.08] rounded px-2.5 py-1 flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-green-400 animate-pulse shrink-0" />
                <span className="text-[10px] text-white/40 truncate">{previewUrl}</span>
              </div>
              <button
                onClick={handleRefreshPreview}
                className="w-6 h-6 flex items-center justify-center text-white/40 hover:text-white transition-colors shrink-0"
                title="Refresh preview"
              >
                <RefreshCw size={11} />
              </button>
              <button
                onClick={() => window.open(previewUrl, "_blank")}
                className="w-6 h-6 flex items-center justify-center text-white/40 hover:text-white transition-colors shrink-0"
                title="Open in new tab"
              >
                <ExternalLink size={11} />
              </button>
            </div>

            {/* Iframe */}
            <div className="flex-1 relative bg-white">
              <iframe
                ref={iframeRef}
                key={previewKey}
                src={previewUrl}
                className="absolute inset-0 w-full h-full border-none"
                title={`Preview: ${projectTitle}`}
                sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
              />
            </div>

            {/* Preview Bottom Bar */}
            <div className="flex items-center gap-2 px-3 py-1.5 bg-[#161b22] border-t border-white/[0.06] shrink-0">
              <span className="text-[10px] text-green-400/70">🟢 Live</span>
              <span className="text-[10px] text-white/25">Project: {projectId}</span>
              <div className="flex-1" />
              <button
                onClick={() => setActiveTab("files")}
                className="text-[10px] text-white/30 hover:text-white transition-colors flex items-center gap-1"
              >
                <Code2 size={9} /> Editor
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
