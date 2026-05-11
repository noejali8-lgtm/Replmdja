import { useState, useRef, useCallback } from "react";
import {
  ChevronRight, ChevronDown, Folder, FolderOpen, FileCode,
  FileText, FileJson, FilePlus, FolderPlus, Pencil, Trash2, Download, Circle
} from "lucide-react";

export interface FileNode {
  name: string;
  path: string;
  type: "file" | "dir";
  ext?: string;
  size?: number;
  children?: FileNode[];
  isDirty?: boolean;
}

interface ContextMenu {
  x: number; y: number;
  node: FileNode;
}

interface FileTreeProps {
  tree: FileNode[];
  selectedPath?: string;
  dirtyPaths?: Set<string>;
  onSelect: (node: FileNode) => void;
  onNewFile?: (parentPath: string) => void;
  onNewFolder?: (parentPath: string) => void;
  onRename?: (node: FileNode, newName: string) => void;
  onDelete?: (node: FileNode) => void;
  onDownload?: (node: FileNode) => void;
}

function getFileIcon(name: string, ext = "") {
  const lower = name.toLowerCase();
  if (lower.endsWith(".tsx") || lower.endsWith(".jsx")) return <FileCode className="h-3.5 w-3.5 text-blue-400 shrink-0" />;
  if (lower.endsWith(".ts") || lower.endsWith(".js")) return <FileCode className="h-3.5 w-3.5 text-yellow-400 shrink-0" />;
  if (lower.endsWith(".css") || lower.endsWith(".scss")) return <FileCode className="h-3.5 w-3.5 text-pink-400 shrink-0" />;
  if (lower.endsWith(".json")) return <FileJson className="h-3.5 w-3.5 text-yellow-300 shrink-0" />;
  if (lower.endsWith(".md") || lower.endsWith(".mdx")) return <FileText className="h-3.5 w-3.5 text-green-400 shrink-0" />;
  if (lower.endsWith(".html") || lower.endsWith(".htm")) return <FileCode className="h-3.5 w-3.5 text-orange-400 shrink-0" />;
  if (lower.endsWith(".py")) return <FileCode className="h-3.5 w-3.5 text-blue-300 shrink-0" />;
  if (lower.endsWith(".rs")) return <FileCode className="h-3.5 w-3.5 text-orange-300 shrink-0" />;
  if (lower.endsWith(".go")) return <FileCode className="h-3.5 w-3.5 text-cyan-400 shrink-0" />;
  if (lower.endsWith(".sh") || lower.endsWith(".bash")) return <FileCode className="h-3.5 w-3.5 text-green-300 shrink-0" />;
  return <FileCode className="h-3.5 w-3.5 text-[#8b949e] shrink-0" />;
}

interface TreeItemProps {
  node: FileNode;
  depth: number;
  selectedPath?: string;
  dirtyPaths?: Set<string>;
  onSelect: (node: FileNode) => void;
  onContextMenu: (e: React.MouseEvent, node: FileNode) => void;
  renamingPath?: string;
  onRenameCommit?: (node: FileNode, name: string) => void;
  defaultOpen?: boolean;
}

function TreeItem({
  node, depth, selectedPath, dirtyPaths, onSelect, onContextMenu,
  renamingPath, onRenameCommit, defaultOpen = false,
}: TreeItemProps) {
  const [open, setOpen] = useState(defaultOpen || depth < 1);
  const [renameVal, setRenameVal] = useState(node.name);
  const renameRef = useRef<HTMLInputElement>(null);

  const isDirty = dirtyPaths?.has(node.path);
  const isSelected = selectedPath === node.path;
  const isRenaming = renamingPath === node.path;

  const handleClick = () => {
    if (node.type === "dir") setOpen(!open);
    else onSelect(node);
  };

  if (node.type === "dir") {
    return (
      <div>
        <div
          onClick={handleClick}
          onContextMenu={e => onContextMenu(e, node)}
          className={`flex items-center gap-1.5 py-0.5 text-xs cursor-pointer transition-colors group hover:bg-[#21262d] ${isSelected ? "bg-[#1f6feb]/10" : ""}`}
          style={{ paddingLeft: `${6 + depth * 12}px` }}>
          {open ? <ChevronDown className="h-3 w-3 shrink-0 text-[#8b949e]" /> : <ChevronRight className="h-3 w-3 shrink-0 text-[#8b949e]" />}
          {open
            ? <FolderOpen className="h-3.5 w-3.5 text-[#58a6ff] shrink-0" />
            : <Folder className="h-3.5 w-3.5 text-[#58a6ff] shrink-0" />
          }
          {isRenaming ? (
            <input
              ref={renameRef}
              value={renameVal}
              onChange={e => setRenameVal(e.target.value)}
              onBlur={() => onRenameCommit?.(node, renameVal)}
              onKeyDown={e => {
                if (e.key === "Enter") onRenameCommit?.(node, renameVal);
                if (e.key === "Escape") onRenameCommit?.(node, node.name);
              }}
              className="flex-1 bg-[#0d1117] border border-[#58a6ff] rounded px-1 text-[#e6edf3] outline-none text-xs"
              autoFocus
              onClick={e => e.stopPropagation()}
            />
          ) : (
            <span className="text-[#e6edf3] truncate">{node.name}</span>
          )}
        </div>
        {open && node.children?.map(child => (
          <TreeItem key={child.path} node={child} depth={depth + 1}
            selectedPath={selectedPath} dirtyPaths={dirtyPaths}
            onSelect={onSelect} onContextMenu={onContextMenu}
            renamingPath={renamingPath} onRenameCommit={onRenameCommit}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      onClick={handleClick}
      onContextMenu={e => onContextMenu(e, node)}
      className={`flex items-center gap-1.5 py-0.5 text-xs cursor-pointer transition-colors group ${
        isSelected
          ? "bg-[#1f6feb]/20 text-[#58a6ff] border-l-2 border-[#1f6feb]"
          : "text-[#8b949e] hover:text-[#e6edf3] hover:bg-[#21262d]"
      }`}
      style={{ paddingLeft: `${18 + depth * 12}px` }}>
      {getFileIcon(node.name, node.ext)}
      {isRenaming ? (
        <input
          ref={renameRef}
          value={renameVal}
          onChange={e => setRenameVal(e.target.value)}
          onBlur={() => onRenameCommit?.(node, renameVal)}
          onKeyDown={e => {
            if (e.key === "Enter") onRenameCommit?.(node, renameVal);
            if (e.key === "Escape") onRenameCommit?.(node, node.name);
          }}
          className="flex-1 bg-[#0d1117] border border-[#58a6ff] rounded px-1 text-[#e6edf3] outline-none text-xs"
          autoFocus
          onClick={e => e.stopPropagation()}
        />
      ) : (
        <span className="flex-1 truncate">{node.name}</span>
      )}
      {isDirty && <Circle className="h-1.5 w-1.5 fill-[#f2cc60] text-[#f2cc60] shrink-0" />}
    </div>
  );
}

export function FileTree({
  tree, selectedPath, dirtyPaths, onSelect, onNewFile, onNewFolder,
  onRename, onDelete, onDownload,
}: FileTreeProps) {
  const [contextMenu, setContextMenu] = useState<ContextMenu | null>(null);
  const [renamingPath, setRenamingPath] = useState<string | undefined>();

  const handleContextMenu = useCallback((e: React.MouseEvent, node: FileNode) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ x: e.clientX, y: e.clientY, node });
  }, []);

  const closeContext = () => setContextMenu(null);

  const handleRenameCommit = (node: FileNode, newName: string) => {
    setRenamingPath(undefined);
    if (newName && newName !== node.name) onRename?.(node, newName);
  };

  return (
    <div className="flex flex-col h-full" onClick={closeContext}>
      <div className="flex items-center justify-between px-3 py-2 border-b border-[#21262d] shrink-0">
        <span className="text-[10px] font-semibold text-[#8b949e] uppercase tracking-widest">Explorer</span>
        <div className="flex items-center gap-0.5">
          <button onClick={() => onNewFile?.("")}
            title="New File"
            className="h-5 w-5 flex items-center justify-center rounded text-[#8b949e] hover:text-[#e6edf3] hover:bg-[#21262d] transition-colors">
            <FilePlus className="h-3.5 w-3.5" />
          </button>
          <button onClick={() => onNewFolder?.("")}
            title="New Folder"
            className="h-5 w-5 flex items-center justify-center rounded text-[#8b949e] hover:text-[#e6edf3] hover:bg-[#21262d] transition-colors">
            <FolderPlus className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-1">
        {tree.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-[#484f58] text-xs gap-2">
            <Folder className="h-8 w-8 opacity-30" />
            <span>No files</span>
          </div>
        ) : (
          tree.map(node => (
            <TreeItem key={node.path} node={node} depth={0}
              selectedPath={selectedPath} dirtyPaths={dirtyPaths}
              onSelect={onSelect} onContextMenu={handleContextMenu}
              renamingPath={renamingPath} onRenameCommit={handleRenameCommit}
              defaultOpen
            />
          ))
        )}
      </div>

      {contextMenu && (
        <>
          <div className="fixed inset-0 z-40" onClick={closeContext} />
          <div
            className="fixed z-50 bg-[#161b22] border border-[#30363d] rounded-lg shadow-2xl py-1 min-w-[180px] text-xs"
            style={{ left: contextMenu.x, top: contextMenu.y }}>
            {contextMenu.node.type === "dir" && (
              <>
                <button
                  onClick={() => { onNewFile?.(contextMenu.node.path); closeContext(); }}
                  className="w-full flex items-center gap-2 px-3 py-1.5 text-[#e6edf3] hover:bg-[#21262d] transition-colors">
                  <FilePlus className="h-3.5 w-3.5 text-[#8b949e]" />
                  New File
                </button>
                <button
                  onClick={() => { onNewFolder?.(contextMenu.node.path); closeContext(); }}
                  className="w-full flex items-center gap-2 px-3 py-1.5 text-[#e6edf3] hover:bg-[#21262d] transition-colors">
                  <FolderPlus className="h-3.5 w-3.5 text-[#8b949e]" />
                  New Folder
                </button>
                <div className="h-px bg-[#30363d] my-1" />
              </>
            )}
            <button
              onClick={() => { setRenamingPath(contextMenu.node.path); closeContext(); }}
              className="w-full flex items-center gap-2 px-3 py-1.5 text-[#e6edf3] hover:bg-[#21262d] transition-colors">
              <Pencil className="h-3.5 w-3.5 text-[#8b949e]" />
              Rename
            </button>
            {contextMenu.node.type === "file" && (
              <button
                onClick={() => { onDownload?.(contextMenu.node); closeContext(); }}
                className="w-full flex items-center gap-2 px-3 py-1.5 text-[#e6edf3] hover:bg-[#21262d] transition-colors">
                <Download className="h-3.5 w-3.5 text-[#8b949e]" />
                Download
              </button>
            )}
            <div className="h-px bg-[#30363d] my-1" />
            <button
              onClick={() => { onDelete?.(contextMenu.node); closeContext(); }}
              className="w-full flex items-center gap-2 px-3 py-1.5 text-red-400 hover:bg-[#21262d] transition-colors">
              <Trash2 className="h-3.5 w-3.5" />
              Delete
            </button>
          </div>
        </>
      )}
    </div>
  );
}
