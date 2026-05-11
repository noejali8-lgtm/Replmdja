import { useState, useCallback } from "react";
import { GitBranch, Sparkles, Circle, Check, RefreshCw, GitCommit, ChevronDown, ChevronRight, Plus, Minus, Edit2 } from "lucide-react";

interface ChangedFile {
  path: string;
  status: "M" | "A" | "D" | "R";
  staged: boolean;
}

interface GitEnhancedPanelProps {
  dirtyPaths?: Set<string>;
  projectName?: string;
}

const STATUS_COLOR: Record<string, string> = {
  M: "text-[#f2cc60]",
  A: "text-[#3fb950]",
  D: "text-[#f85149]",
  R: "text-[#79c0ff]",
};
const STATUS_LABEL: Record<string, string> = {
  M: "Modified",
  A: "Added",
  D: "Deleted",
  R: "Renamed",
};

const AI_COMMIT_MESSAGES = [
  "feat: add real-time log streaming panel with filtering",
  "feat: implement multi-cursor presence indicators",
  "fix: resolve terminal resize race condition on split view",
  "refactor: extract deployment panel into standalone component",
  "feat: add vulnerability scanner with CVE database integration",
  "chore: update dependency versions and regenerate lockfile",
  "feat: add AI-powered commit message generator",
  "fix: correct keybinding conflict between Ctrl+D and duplicate line",
];

export function GitEnhancedPanel({ dirtyPaths = new Set(), projectName = "my-project" }: GitEnhancedPanelProps) {
  const [files, setFiles] = useState<ChangedFile[]>(() => {
    const from = [...dirtyPaths].map(p => ({ path: p, status: "M" as const, staged: false }));
    if (from.length === 0) {
      return [
        { path: "src/App.tsx", status: "M", staged: true },
        { path: "src/components/Header.tsx", status: "A", staged: true },
        { path: "src/utils/helpers.ts", status: "M", staged: false },
        { path: "package.json", status: "M", staged: false },
      ];
    }
    return from;
  });

  const [commitMsg, setCommitMsg] = useState("");
  const [generatingMsg, setGeneratingMsg] = useState(false);
  const [committing, setCommitting] = useState(false);
  const [committed, setCommitted] = useState(false);
  const [showUnstaged, setShowUnstaged] = useState(true);
  const [showStaged, setShowStaged] = useState(true);
  const [branch] = useState("main");

  const staged   = files.filter(f => f.staged);
  const unstaged = files.filter(f => !f.staged);

  const stageFile = (path: string) => setFiles(prev => prev.map(f => f.path === path ? { ...f, staged: true } : f));
  const unstageFile = (path: string) => setFiles(prev => prev.map(f => f.path === path ? { ...f, staged: false } : f));
  const stageAll = () => setFiles(prev => prev.map(f => ({ ...f, staged: true })));
  const unstageAll = () => setFiles(prev => prev.map(f => ({ ...f, staged: false })));

  const generateCommitMessage = useCallback(async () => {
    setGeneratingMsg(true);
    await new Promise(r => setTimeout(r, 900 + Math.random() * 600));
    setCommitMsg(AI_COMMIT_MESSAGES[Math.floor(Math.random() * AI_COMMIT_MESSAGES.length)]);
    setGeneratingMsg(false);
  }, []);

  const commit = useCallback(async () => {
    if (!commitMsg.trim() || staged.length === 0) return;
    setCommitting(true);
    await new Promise(r => setTimeout(r, 1000));
    setFiles(prev => prev.filter(f => !f.staged));
    setCommitted(true);
    setCommitMsg("");
    setCommitting(false);
    setTimeout(() => setCommitted(false), 2500);
  }, [commitMsg, staged]);

  if (committed) {
    return (
      <div className="flex flex-col h-full items-center justify-center gap-3 bg-[#0d1117]">
        <div className="h-12 w-12 rounded-full bg-[#238636]/20 border border-[#238636]/30 flex items-center justify-center">
          <Check className="h-6 w-6 text-[#3fb950]" />
        </div>
        <p className="text-sm font-medium text-[#e6edf3]">Committed!</p>
        <p className="text-xs text-[#8b949e]">Changes pushed to {branch}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[#0d1117] text-[#e6edf3] overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-[#21262d] bg-[#161b22] shrink-0">
        <GitBranch className="h-3.5 w-3.5 text-[#a371f7]" />
        <span className="text-[10px] font-semibold text-[#8b949e] uppercase tracking-widest flex-1">Source Control</span>
        <span className="text-[10px] font-mono text-[#8b949e] bg-[#21262d] px-1.5 py-0.5 rounded border border-[#30363d]">{branch}</span>
        <button className="h-5 w-5 flex items-center justify-center rounded text-[#484f58] hover:text-[#8b949e] hover:bg-[#21262d] transition-colors" title="Refresh">
          <RefreshCw className="h-3 w-3" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Staged changes */}
        <div className="border-b border-[#21262d]">
          <button
            onClick={() => setShowStaged(p => !p)}
            className="w-full flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-semibold text-[#8b949e] uppercase tracking-widest hover:bg-[#161b22] transition-colors">
            {showStaged ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
            Staged Changes ({staged.length})
            {staged.length > 0 && (
              <button onClick={e => { e.stopPropagation(); unstageAll(); }}
                className="ml-auto text-[9px] text-[#484f58] hover:text-[#f85149] px-1 py-0.5 rounded hover:bg-[#21262d] transition-colors normal-case tracking-normal">
                Unstage all
              </button>
            )}
          </button>
          {showStaged && (
            <div>
              {staged.length === 0 ? (
                <p className="text-[10px] text-[#484f58] px-5 py-2">No staged changes</p>
              ) : staged.map(f => (
                <div key={f.path}
                  className="flex items-center gap-2 px-4 py-1.5 hover:bg-[#161b22] group transition-colors text-xs">
                  <span className={`font-mono text-[10px] shrink-0 ${STATUS_COLOR[f.status]}`} title={STATUS_LABEL[f.status]}>{f.status}</span>
                  <span className="truncate flex-1 text-[#c9d1d9]">{f.path.split("/").pop()}</span>
                  <span className="text-[9px] text-[#484f58] truncate hidden group-hover:hidden">{f.path}</span>
                  <button onClick={() => unstageFile(f.path)}
                    className="opacity-0 group-hover:opacity-100 h-4 w-4 flex items-center justify-center rounded text-[#484f58] hover:text-[#f85149] transition-all">
                    <Minus className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Unstaged changes */}
        <div className="border-b border-[#21262d]">
          <button
            onClick={() => setShowUnstaged(p => !p)}
            className="w-full flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-semibold text-[#8b949e] uppercase tracking-widest hover:bg-[#161b22] transition-colors">
            {showUnstaged ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
            Changes ({unstaged.length})
            {unstaged.length > 0 && (
              <button onClick={e => { e.stopPropagation(); stageAll(); }}
                className="ml-auto text-[9px] text-[#484f58] hover:text-[#3fb950] px-1 py-0.5 rounded hover:bg-[#21262d] transition-colors normal-case tracking-normal">
                Stage all
              </button>
            )}
          </button>
          {showUnstaged && (
            <div>
              {unstaged.length === 0 ? (
                <p className="text-[10px] text-[#484f58] px-5 py-2">No unstaged changes</p>
              ) : unstaged.map(f => (
                <div key={f.path}
                  className="flex items-center gap-2 px-4 py-1.5 hover:bg-[#161b22] group transition-colors text-xs">
                  <span className={`font-mono text-[10px] shrink-0 ${STATUS_COLOR[f.status]}`} title={STATUS_LABEL[f.status]}>{f.status}</span>
                  <span className="truncate flex-1 text-[#c9d1d9]">{f.path.split("/").pop()}</span>
                  <button onClick={() => stageFile(f.path)}
                    className="opacity-0 group-hover:opacity-100 h-4 w-4 flex items-center justify-center rounded text-[#484f58] hover:text-[#3fb950] transition-all">
                    <Plus className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Commit area */}
      <div className="shrink-0 p-3 border-t border-[#21262d] space-y-2 bg-[#0d1117]">
        <div className="relative">
          <textarea
            value={commitMsg}
            onChange={e => setCommitMsg(e.target.value)}
            placeholder="Commit message (or use AI ✨)…"
            rows={2}
            className="w-full bg-[#161b22] border border-[#30363d] rounded px-2.5 py-2 text-xs text-[#e6edf3] placeholder-[#484f58] outline-none focus:border-[#58a6ff] resize-none transition-colors pr-7"
          />
          {commitMsg && (
            <button onClick={() => setCommitMsg("")}
              className="absolute right-2 top-2 text-[#484f58] hover:text-[#f85149] transition-colors">
              ×
            </button>
          )}
        </div>

        <button
          onClick={generateCommitMessage}
          disabled={generatingMsg}
          className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded border border-[#a371f7]/30 bg-[#a371f7]/10 text-[#a371f7] text-xs hover:bg-[#a371f7]/20 transition-colors disabled:opacity-50">
          {generatingMsg ? (
            <><div className="h-3 w-3 border border-[#a371f7]/30 border-t-[#a371f7] rounded-full animate-spin" /> Generating…</>
          ) : (
            <><Sparkles className="h-3 w-3" /> AI Commit Message</>
          )}
        </button>

        <button
          onClick={commit}
          disabled={committing || !commitMsg.trim() || staged.length === 0}
          className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded bg-[#238636] hover:bg-[#2ea043] text-white text-xs font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
          {committing ? (
            <><div className="h-3 w-3 border border-white/30 border-t-white rounded-full animate-spin" /> Committing…</>
          ) : (
            <><GitCommit className="h-3 w-3" /> Commit {staged.length > 0 ? `(${staged.length} files)` : ""}</>
          )}
        </button>

        {staged.length === 0 && files.length > 0 && (
          <p className="text-[10px] text-[#484f58] text-center">Stage files to commit</p>
        )}
        {files.length === 0 && (
          <div className="text-center py-4">
            <GitBranch className="h-8 w-8 mx-auto opacity-20 mb-2" />
            <p className="text-xs text-[#484f58]">No pending changes</p>
          </div>
        )}
      </div>
    </div>
  );
}
