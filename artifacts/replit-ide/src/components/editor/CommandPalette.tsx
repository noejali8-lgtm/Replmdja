import { useEffect, useState, useCallback } from "react";
import { Command } from "cmdk";
import {
  Play, Square, Share2, Rocket, FileCode, Search, GitBranch,
  Terminal, Eye, Sparkles, Settings, FileText, Folder, FileJson,
  FileX, FilePlus, Download, Upload, RotateCcw, Split, Keyboard,
  Moon, Sun, Package, Database
} from "lucide-react";

interface FileNode {
  name: string;
  path: string;
  type: "file" | "dir";
  ext?: string;
}

interface CommandItem {
  id: string;
  label: string;
  description?: string;
  icon: React.ReactNode;
  shortcut?: string;
  action: () => void;
  group: string;
}

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
  files?: FileNode[];
  onFileSelect?: (file: FileNode) => void;
  onRun?: () => void;
  onStop?: () => void;
  onDeploy?: () => void;
  onShare?: () => void;
  onNewFile?: () => void;
  onToggleSplit?: () => void;
  onToggleAI?: () => void;
  onToggleTerminal?: () => void;
  onTogglePreview?: () => void;
  isRunning?: boolean;
}

function getFileIcon(ext = "") {
  const icons: Record<string, React.ReactNode> = {
    tsx: <FileCode className="h-4 w-4 text-blue-400" />,
    ts: <FileCode className="h-4 w-4 text-blue-400" />,
    jsx: <FileCode className="h-4 w-4 text-yellow-400" />,
    js: <FileCode className="h-4 w-4 text-yellow-400" />,
    css: <FileCode className="h-4 w-4 text-pink-400" />,
    json: <FileJson className="h-4 w-4 text-yellow-400" />,
    md: <FileText className="h-4 w-4 text-green-400" />,
    html: <FileCode className="h-4 w-4 text-orange-400" />,
  };
  return icons[ext] ?? <FileCode className="h-4 w-4 text-[#8b949e]" />;
}

export function CommandPalette({
  open, onClose, files = [], onFileSelect, onRun, onStop, onDeploy,
  onShare, onNewFile, onToggleSplit, onToggleAI, onToggleTerminal,
  onTogglePreview, isRunning,
}: CommandPaletteProps) {
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!open) setSearch("");
  }, [open]);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [onClose]);

  const commands: CommandItem[] = [
    {
      id: "run", label: isRunning ? "Stop Project" : "Run Project",
      description: isRunning ? "Stop the running server" : "Start the development server",
      icon: isRunning ? <Square className="h-4 w-4 text-red-400" /> : <Play className="h-4 w-4 text-green-400" />,
      shortcut: "⌘↵", group: "Actions",
      action: () => { isRunning ? onStop?.() : onRun?.(); onClose(); },
    },
    {
      id: "deploy", label: "Deploy to Production",
      description: "Build and deploy your project",
      icon: <Rocket className="h-4 w-4 text-purple-400" />,
      shortcut: "⌘⇧D", group: "Actions",
      action: () => { onDeploy?.(); onClose(); },
    },
    {
      id: "share", label: "Share Project",
      description: "Copy shareable link",
      icon: <Share2 className="h-4 w-4 text-blue-400" />,
      shortcut: "⌘⇧S", group: "Actions",
      action: () => { onShare?.(); onClose(); },
    },
    {
      id: "new-file", label: "New File",
      description: "Create a new file",
      icon: <FilePlus className="h-4 w-4 text-[#8b949e]" />,
      shortcut: "⌘N", group: "File",
      action: () => { onNewFile?.(); onClose(); },
    },
    {
      id: "toggle-split", label: "Toggle Split Editor",
      description: "Split editor view side by side",
      icon: <Split className="h-4 w-4 text-[#8b949e]" />,
      shortcut: "⌘\\", group: "View",
      action: () => { onToggleSplit?.(); onClose(); },
    },
    {
      id: "toggle-terminal", label: "Toggle Terminal",
      description: "Show or hide the terminal",
      icon: <Terminal className="h-4 w-4 text-[#8b949e]" />,
      shortcut: "⌘`", group: "View",
      action: () => { onToggleTerminal?.(); onClose(); },
    },
    {
      id: "toggle-preview", label: "Toggle Preview",
      description: "Show or hide live preview",
      icon: <Eye className="h-4 w-4 text-[#8b949e]" />,
      shortcut: "⌘⇧P", group: "View",
      action: () => { onTogglePreview?.(); onClose(); },
    },
    {
      id: "toggle-ai", label: "Toggle AI Panel",
      description: "Show or hide the AI assistant",
      icon: <Sparkles className="h-4 w-4 text-purple-400" />,
      shortcut: "⌘⇧A", group: "View",
      action: () => { onToggleAI?.(); onClose(); },
    },
  ];

  const flatFiles = (function flatten(nodes: FileNode[]): FileNode[] {
    return nodes.flatMap(n => n.type === "file" ? [n] : flatten((n as any).children ?? []));
  })(files as any);

  return (
    <div className={`fixed inset-0 z-50 flex items-start justify-center pt-[15vh] ${open ? "" : "pointer-events-none"}`}>
      <div className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity ${open ? "opacity-100" : "opacity-0"}`}
        onClick={onClose} />

      <div className={`relative w-full max-w-xl bg-[#161b22] border border-[#30363d] rounded-xl shadow-2xl overflow-hidden transition-all ${open ? "opacity-100 scale-100" : "opacity-0 scale-95 pointer-events-none"}`}>
        <Command className="w-full" shouldFilter>
          <div className="flex items-center gap-3 px-4 py-3 border-b border-[#30363d]">
            <Search className="h-4 w-4 text-[#8b949e] shrink-0" />
            <Command.Input
              value={search}
              onValueChange={setSearch}
              placeholder="Search files and commands…"
              className="flex-1 bg-transparent text-[#e6edf3] text-sm placeholder-[#484f58] outline-none"
              autoFocus
            />
            <kbd className="text-[10px] px-1.5 py-0.5 rounded bg-[#21262d] border border-[#30363d] text-[#8b949e]">ESC</kbd>
          </div>

          <Command.List className="max-h-[400px] overflow-y-auto p-2">
            <Command.Empty className="py-8 text-center text-sm text-[#484f58]">
              No results found.
            </Command.Empty>

            {flatFiles.length > 0 && (
              <Command.Group heading={
                <span className="text-[10px] font-semibold text-[#484f58] uppercase tracking-widest px-2 py-1 block">Files</span>
              }>
                {flatFiles.map(f => (
                  <Command.Item
                    key={f.path}
                    value={`file ${f.name} ${f.path}`}
                    onSelect={() => { onFileSelect?.(f); onClose(); }}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer text-sm text-[#e6edf3] hover:bg-[#21262d] data-[selected=true]:bg-[#21262d] transition-colors">
                    {getFileIcon(f.ext)}
                    <span className="flex-1 truncate">{f.name}</span>
                    <span className="text-[10px] text-[#484f58] truncate max-w-[120px]">{f.path}</span>
                  </Command.Item>
                ))}
              </Command.Group>
            )}

            {["Actions", "File", "View"].map(group => {
              const items = commands.filter(c => c.group === group);
              return (
                <Command.Group key={group} heading={
                  <span className="text-[10px] font-semibold text-[#484f58] uppercase tracking-widest px-2 py-1 block">{group}</span>
                }>
                  {items.map(cmd => (
                    <Command.Item
                      key={cmd.id}
                      value={`cmd ${cmd.label} ${cmd.description}`}
                      onSelect={cmd.action}
                      className="flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer text-sm text-[#e6edf3] hover:bg-[#21262d] data-[selected=true]:bg-[#21262d] transition-colors">
                      {cmd.icon}
                      <div className="flex-1 min-w-0">
                        <div className="font-medium">{cmd.label}</div>
                        {cmd.description && (
                          <div className="text-[11px] text-[#8b949e] truncate">{cmd.description}</div>
                        )}
                      </div>
                      {cmd.shortcut && (
                        <kbd className="text-[10px] px-1.5 py-0.5 rounded bg-[#21262d] border border-[#30363d] text-[#8b949e] shrink-0">{cmd.shortcut}</kbd>
                      )}
                    </Command.Item>
                  ))}
                </Command.Group>
              );
            })}
          </Command.List>

          <div className="flex items-center gap-4 px-4 py-2 border-t border-[#30363d] text-[10px] text-[#484f58]">
            <span className="flex items-center gap-1"><kbd className="px-1 rounded bg-[#21262d] border border-[#30363d]">↑↓</kbd> navigate</span>
            <span className="flex items-center gap-1"><kbd className="px-1 rounded bg-[#21262d] border border-[#30363d]">↵</kbd> select</span>
            <span className="flex items-center gap-1"><kbd className="px-1 rounded bg-[#21262d] border border-[#30363d]">ESC</kbd> close</span>
          </div>
        </Command>
      </div>
    </div>
  );
}
