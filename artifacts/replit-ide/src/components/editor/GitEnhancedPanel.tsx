import { useState, useCallback, useEffect } from "react";
import {
  GitBranch, Sparkles, Check, RefreshCw, GitCommit, ChevronDown,
  ChevronRight, Plus, Minus, Upload, Download, GitMerge, AlertCircle,
  Settings, Loader2, X, ExternalLink
} from "lucide-react";

interface ChangedFile {
  path: string;
  status: "M" | "A" | "D" | "R" | "?";
  staged: boolean;
}

interface GitStatus {
  initialized: boolean;
  files: ChangedFile[];
  branch: string | null;
  ahead: number;
  behind: number;
  tracking: string | null;
}

interface Commit {
  hash: string;
  date: string;
  message: string;
  author_name: string;
}

interface GitEnhancedPanelProps {
  projectId?: number;
  projectName?: string;
}

const STATUS_COLOR: Record<string, string> = {
  M: "text-[#f2cc60]",
  A: "text-[#3fb950]",
  D: "text-[#f85149]",
  R: "text-[#79c0ff]",
  "?": "text-[#8b949e]",
};
const STATUS_LABEL: Record<string, string> = {
  M: "Modified", A: "Added", D: "Deleted", R: "Renamed", "?": "Untracked",
};

export function GitEnhancedPanel({ projectId, projectName = "project" }: GitEnhancedPanelProps) {
  const [status, setStatus] = useState<GitStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [committing, setCommitting] = useState(false);
  const [committed, setCommitted] = useState(false);
  const [commitMsg, setCommitMsg] = useState("");
  const [generatingMsg, setGeneratingMsg] = useState(false);
  const [showStaged, setShowStaged] = useState(true);
  const [showUnstaged, setShowUnstaged] = useState(true);
  const [showLog, setShowLog] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [log, setLog] = useState<Commit[]>([]);
  const [remoteUrl, setRemoteUrl] = useState("");
  const [githubToken, setGithubToken] = useState("");
  const [pushing, setPushing] = useState(false);
  const [pulling, setPulling] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  const api = useCallback(async (path: string, opts?: RequestInit) => {
    const res = await fetch(`/api/projects/${projectId}${path}`, {
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      ...opts,
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({ error: "Request failed" })) as { error?: string };
      throw new Error(data.error ?? "Request failed");
    }
    return res.json();
  }, [projectId]);

  const fetchStatus = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    setError("");
    try {
      const data = await api("/git/status") as GitStatus;
      setStatus(data);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }, [projectId, api]);

  useEffect(() => { fetchStatus(); }, [fetchStatus]);

  const initRepo = async () => {
    if (!projectId) return;
    setLoading(true);
    try {
      await api("/git/init", { method: "POST", body: "{}" });
      await fetchStatus();
      setInfo("Repository initialised!");
      setTimeout(() => setInfo(""), 3000);
    } catch (e) { setError(String(e)); } finally { setLoading(false); }
  };

  const stageFile = async (filePath: string) => {
    try {
      await api("/git/stage", { method: "POST", body: JSON.stringify({ paths: [filePath] }) });
      await fetchStatus();
    } catch (e) { setError(String(e)); }
  };

  const unstageFile = async (filePath: string) => {
    try {
      await api("/git/unstage", { method: "POST", body: JSON.stringify({ paths: [filePath] }) });
      await fetchStatus();
    } catch (e) { setError(String(e)); }
  };

  const stageAll = async () => {
    try {
      await api("/git/stage", { method: "POST", body: JSON.stringify({ paths: [] }) });
      await fetchStatus();
    } catch (e) { setError(String(e)); }
  };

  const unstageAll = async () => {
    try {
      await api("/git/unstage", { method: "POST", body: JSON.stringify({ paths: [] }) });
      await fetchStatus();
    } catch (e) { setError(String(e)); }
  };

  const generateCommitMessage = useCallback(async () => {
    if (!projectId) return;
    setGeneratingMsg(true);
    try {
      const data = await api("/git/ai-message", { method: "POST", body: "{}" }) as { message: string };
      setCommitMsg(data.message);
    } catch {
      const fallbacks = [
        "feat: update project files",
        "chore: improve code structure",
        "fix: resolve edge case bugs",
        "refactor: clean up components",
      ];
      setCommitMsg(fallbacks[Math.floor(Math.random() * fallbacks.length)]);
    } finally {
      setGeneratingMsg(false);
    }
  }, [projectId, api]);

  const commit = useCallback(async () => {
    if (!commitMsg.trim() || !projectId) return;
    setCommitting(true);
    setError("");
    try {
      await api("/git/commit", { method: "POST", body: JSON.stringify({ message: commitMsg.trim() }) });
      setCommitted(true);
      setCommitMsg("");
      setTimeout(async () => {
        setCommitted(false);
        await fetchStatus();
      }, 2500);
    } catch (e) { setError(String(e)); } finally { setCommitting(false); }
  }, [commitMsg, projectId, api, fetchStatus]);

  const fetchLog = useCallback(async () => {
    if (!projectId) return;
    try {
      const data = await api("/git/log") as { commits: Commit[] };
      setLog(data.commits);
      setShowLog(true);
    } catch { setLog([]); setShowLog(true); }
  }, [projectId, api]);

  const setRemote = async () => {
    if (!remoteUrl.trim()) return;
    try {
      await api("/git/remote", { method: "POST", body: JSON.stringify({ url: remoteUrl.trim() }) });
      setInfo("Remote origin set!");
      setTimeout(() => setInfo(""), 3000);
    } catch (e) { setError(String(e)); }
  };

  const push = async () => {
    setPushing(true); setError("");
    try {
      await api("/git/push", { method: "POST", body: JSON.stringify({ token: githubToken || undefined }) });
      setInfo("Pushed successfully!");
      setTimeout(() => { setInfo(""); fetchStatus(); }, 3000);
    } catch (e) { setError(String(e)); } finally { setPushing(false); }
  };

  const pull = async () => {
    setPulling(true); setError("");
    try {
      await api("/git/pull", { method: "POST", body: "{}" });
      setInfo("Pulled successfully!");
      setTimeout(() => { setInfo(""); fetchStatus(); }, 3000);
    } catch (e) { setError(String(e)); } finally { setPulling(false); }
  };

  if (!projectId) {
    return (
      <div className="flex flex-col h-full items-center justify-center gap-3 bg-[#0d1117]">
        <GitBranch className="h-8 w-8 text-[#30363d]" />
        <p className="text-xs text-[#484f58]">Open a project to use Git</p>
      </div>
    );
  }

  if (committed) {
    return (
      <div className="flex flex-col h-full items-center justify-center gap-3 bg-[#0d1117]">
        <div className="h-12 w-12 rounded-full bg-[#238636]/20 border border-[#238636]/30 flex items-center justify-center">
          <Check className="h-6 w-6 text-[#3fb950]" />
        </div>
        <p className="text-sm font-medium text-[#e6edf3]">Committed!</p>
        <p className="text-xs text-[#8b949e]">On branch {status?.branch ?? "main"}</p>
      </div>
    );
  }

  /* ── Not initialised ── */
  if (status && !status.initialized) {
    return (
      <div className="flex flex-col h-full bg-[#0d1117] text-[#e6edf3]">
        <div className="flex items-center gap-2 px-3 py-2 border-b border-[#21262d] bg-[#161b22]">
          <GitBranch className="h-3.5 w-3.5 text-[#a371f7]" />
          <span className="text-[10px] font-semibold text-[#8b949e] uppercase tracking-widest flex-1">Source Control</span>
        </div>
        <div className="flex flex-col items-center justify-center flex-1 gap-4 p-6 text-center">
          <div className="h-14 w-14 rounded-2xl bg-[#161b22] border border-[#21262d] flex items-center justify-center">
            <GitBranch className="h-7 w-7 text-[#484f58]" />
          </div>
          <div>
            <p className="text-sm font-medium text-[#e6edf3] mb-1">No Git repository</p>
            <p className="text-[11px] text-[#484f58]">Initialise to start tracking changes in <span className="font-mono text-[#8b949e]">{projectName}</span></p>
          </div>
          <button onClick={initRepo} disabled={loading}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#238636] hover:bg-[#2ea043] text-white text-xs font-medium transition-colors disabled:opacity-50">
            {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <GitBranch className="h-3.5 w-3.5" />}
            Initialise Repository
          </button>
        </div>
      </div>
    );
  }

  const staged   = (status?.files ?? []).filter(f => f.staged);
  const unstaged = (status?.files ?? []).filter(f => !f.staged);

  return (
    <div className="flex flex-col h-full bg-[#0d1117] text-[#e6edf3] overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-[#21262d] bg-[#161b22] shrink-0">
        <GitBranch className="h-3.5 w-3.5 text-[#a371f7]" />
        <span className="text-[10px] font-semibold text-[#8b949e] uppercase tracking-widest flex-1">Source Control</span>
        {status?.branch && (
          <span className="text-[10px] font-mono text-[#8b949e] bg-[#21262d] px-1.5 py-0.5 rounded border border-[#30363d]">
            {status.branch}
          </span>
        )}
        {status?.ahead != null && status.ahead > 0 && (
          <span className="text-[9px] text-[#3fb950]">↑{status.ahead}</span>
        )}
        {status?.behind != null && status.behind > 0 && (
          <span className="text-[9px] text-[#f85149]">↓{status.behind}</span>
        )}
        <button onClick={() => setShowSettings(p => !p)} title="Remote settings"
          className="h-5 w-5 flex items-center justify-center rounded text-[#484f58] hover:text-[#8b949e] hover:bg-[#21262d] transition-colors">
          <Settings className="h-3 w-3" />
        </button>
        <button onClick={fetchStatus} disabled={loading} title="Refresh"
          className="h-5 w-5 flex items-center justify-center rounded text-[#484f58] hover:text-[#8b949e] hover:bg-[#21262d] transition-colors">
          <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Error / Info banner */}
      {(error || info) && (
        <div className={`mx-2 mt-1.5 px-3 py-2 rounded-lg text-[10px] flex items-start gap-2 ${
          error ? "bg-[#f85149]/10 border border-[#f85149]/20 text-[#f85149]" : "bg-[#3fb950]/10 border border-[#3fb950]/20 text-[#3fb950]"
        }`}>
          {error ? <AlertCircle className="h-3 w-3 mt-0.5 shrink-0" /> : <Check className="h-3 w-3 mt-0.5 shrink-0" />}
          <span className="flex-1">{error || info}</span>
          <button onClick={() => { setError(""); setInfo(""); }}><X className="h-3 w-3" /></button>
        </div>
      )}

      {/* Remote settings panel */}
      {showSettings && (
        <div className="border-b border-[#21262d] bg-[#161b22] p-3 space-y-2">
          <p className="text-[10px] font-semibold text-[#8b949e] uppercase tracking-widest">Remote Settings</p>
          <input
            value={remoteUrl}
            onChange={e => setRemoteUrl(e.target.value)}
            placeholder="https://github.com/user/repo.git"
            className="w-full bg-[#0d1117] border border-[#30363d] rounded px-2.5 py-1.5 text-[11px] font-mono text-[#e6edf3] placeholder-[#484f58] outline-none focus:border-[#58a6ff] transition-colors"
          />
          <input
            value={githubToken}
            onChange={e => setGithubToken(e.target.value)}
            type="password"
            placeholder="GitHub token (for push/pull)"
            className="w-full bg-[#0d1117] border border-[#30363d] rounded px-2.5 py-1.5 text-[11px] font-mono text-[#e6edf3] placeholder-[#484f58] outline-none focus:border-[#58a6ff] transition-colors"
          />
          <div className="flex gap-1.5">
            <button onClick={setRemote}
              className="flex-1 py-1 rounded bg-[#21262d] hover:bg-[#30363d] text-[#e6edf3] text-[10px] transition-colors">
              Set Remote
            </button>
            <button onClick={push} disabled={pushing}
              className="flex-1 flex items-center justify-center gap-1 py-1 rounded bg-[#238636] hover:bg-[#2ea043] text-white text-[10px] transition-colors disabled:opacity-50">
              {pushing ? <Loader2 className="h-3 w-3 animate-spin" /> : <Upload className="h-3 w-3" />} Push
            </button>
            <button onClick={pull} disabled={pulling}
              className="flex-1 flex items-center justify-center gap-1 py-1 rounded bg-[#1f6feb]/30 hover:bg-[#1f6feb]/50 text-[#58a6ff] text-[10px] transition-colors disabled:opacity-50">
              {pulling ? <Loader2 className="h-3 w-3 animate-spin" /> : <Download className="h-3 w-3" />} Pull
            </button>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto">
        {/* Staged changes */}
        <div className="border-b border-[#21262d]">
          <button onClick={() => setShowStaged(p => !p)}
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
              {staged.length === 0
                ? <p className="text-[10px] text-[#484f58] px-5 py-2">No staged changes</p>
                : staged.map(f => (
                  <div key={f.path}
                    className="flex items-center gap-2 px-4 py-1.5 hover:bg-[#161b22] group transition-colors">
                    <span className={`font-mono text-[10px] shrink-0 ${STATUS_COLOR[f.status]}`}
                      title={STATUS_LABEL[f.status]}>{f.status}</span>
                    <span className="truncate flex-1 text-[11px] text-[#c9d1d9]">{f.path.split("/").pop()}</span>
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
          <button onClick={() => setShowUnstaged(p => !p)}
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
              {unstaged.length === 0
                ? <p className="text-[10px] text-[#484f58] px-5 py-2">Working tree clean</p>
                : unstaged.map(f => (
                  <div key={f.path}
                    className="flex items-center gap-2 px-4 py-1.5 hover:bg-[#161b22] group transition-colors">
                    <span className={`font-mono text-[10px] shrink-0 ${STATUS_COLOR[f.status]}`}
                      title={STATUS_LABEL[f.status]}>{f.status}</span>
                    <span className="truncate flex-1 text-[11px] text-[#c9d1d9]">{f.path.split("/").pop()}</span>
                    <button onClick={() => stageFile(f.path)}
                      className="opacity-0 group-hover:opacity-100 h-4 w-4 flex items-center justify-center rounded text-[#484f58] hover:text-[#3fb950] transition-all">
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>
                ))}
            </div>
          )}
        </div>

        {/* Commit log */}
        {showLog && (
          <div className="border-b border-[#21262d]">
            <div className="flex items-center gap-1.5 px-3 py-1.5">
              <GitMerge className="h-3 w-3 text-[#8b949e]" />
              <span className="text-[10px] font-semibold text-[#8b949e] uppercase tracking-widest flex-1">Recent Commits</span>
              <button onClick={() => setShowLog(false)}>
                <X className="h-3 w-3 text-[#484f58] hover:text-[#8b949e]" />
              </button>
            </div>
            {log.length === 0
              ? <p className="text-[10px] text-[#484f58] px-5 py-2">No commits yet</p>
              : log.map(c => (
                <div key={c.hash} className="px-4 py-2 border-b border-[#21262d]/50 hover:bg-[#161b22] group">
                  <p className="text-[11px] text-[#e6edf3] truncate">{c.message}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="font-mono text-[9px] text-[#58a6ff]">{c.hash.slice(0, 7)}</span>
                    <span className="text-[9px] text-[#484f58]">{c.author_name}</span>
                    <span className="text-[9px] text-[#484f58] ml-auto">{new Date(c.date).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>

      {/* Commit area */}
      <div className="shrink-0 p-3 border-t border-[#21262d] space-y-2 bg-[#0d1117]">
        {!showLog && (
          <button onClick={fetchLog}
            className="w-full flex items-center justify-center gap-1.5 py-1 rounded text-[9px] text-[#484f58] hover:text-[#8b949e] transition-colors">
            <ExternalLink className="h-3 w-3" /> View commit history
          </button>
        )}

        <div className="relative">
          <textarea
            value={commitMsg}
            onChange={e => setCommitMsg(e.target.value)}
            placeholder="Commit message…"
            rows={2}
            className="w-full bg-[#161b22] border border-[#30363d] rounded px-2.5 py-2 text-xs text-[#e6edf3] placeholder-[#484f58] outline-none focus:border-[#58a6ff] resize-none transition-colors pr-7"
          />
          {commitMsg && (
            <button onClick={() => setCommitMsg("")}
              className="absolute right-2 top-2 text-[#484f58] hover:text-[#f85149] transition-colors">
              <X className="h-3 w-3" />
            </button>
          )}
        </div>

        <button onClick={generateCommitMessage} disabled={generatingMsg}
          className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded border border-[#a371f7]/30 bg-[#a371f7]/10 text-[#a371f7] text-xs hover:bg-[#a371f7]/20 transition-colors disabled:opacity-50">
          {generatingMsg
            ? <><Loader2 className="h-3 w-3 animate-spin" /> Generating…</>
            : <><Sparkles className="h-3 w-3" /> AI Commit Message</>}
        </button>

        <button onClick={commit}
          disabled={committing || !commitMsg.trim() || staged.length === 0}
          className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded bg-[#238636] hover:bg-[#2ea043] text-white text-xs font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
          {committing
            ? <><Loader2 className="h-3 w-3 animate-spin" /> Committing…</>
            : <><GitCommit className="h-3 w-3" /> Commit {staged.length > 0 ? `(${staged.length})` : ""}</>}
        </button>

        {staged.length === 0 && (status?.files?.length ?? 0) > 0 && (
          <p className="text-[10px] text-[#484f58] text-center">Stage files to commit</p>
        )}
        {(status?.files?.length ?? 0) === 0 && status?.initialized && (
          <p className="text-[10px] text-[#484f58] text-center">Working tree clean</p>
        )}
      </div>
    </div>
  );
}
