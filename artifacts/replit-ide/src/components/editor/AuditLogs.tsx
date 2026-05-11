import { useState, useEffect } from "react";
import { Activity, FileText, GitBranch, Terminal, Sparkles, User, Download, Trash2, Search } from "lucide-react";

type AuditAction =
  | "file_create" | "file_edit" | "file_delete" | "file_rename"
  | "git_commit" | "git_push" | "git_branch"
  | "terminal_cmd"
  | "ai_assist" | "snapshot_create" | "snapshot_restore"
  | "deploy" | "secret_add" | "pkg_install";

interface AuditEntry {
  id: string;
  action: AuditAction;
  description: string;
  ts: number;
  user?: string;
  meta?: Record<string, string>;
}

const ACTION_CONFIG: Record<AuditAction, { icon: React.ReactNode; color: string; category: string }> = {
  file_create:       { icon: <FileText className="h-3 w-3" />,   color: "text-[#3fb950]",  category: "Files"    },
  file_edit:         { icon: <FileText className="h-3 w-3" />,   color: "text-[#58a6ff]",  category: "Files"    },
  file_delete:       { icon: <FileText className="h-3 w-3" />,   color: "text-[#f85149]",  category: "Files"    },
  file_rename:       { icon: <FileText className="h-3 w-3" />,   color: "text-[#d29922]",  category: "Files"    },
  git_commit:        { icon: <GitBranch className="h-3 w-3" />,  color: "text-[#a371f7]",  category: "Git"      },
  git_push:          { icon: <GitBranch className="h-3 w-3" />,  color: "text-[#a371f7]",  category: "Git"      },
  git_branch:        { icon: <GitBranch className="h-3 w-3" />,  color: "text-[#a371f7]",  category: "Git"      },
  terminal_cmd:      { icon: <Terminal className="h-3 w-3" />,   color: "text-[#8b949e]",  category: "Terminal" },
  ai_assist:         { icon: <Sparkles className="h-3 w-3" />,   color: "text-[#d2a8ff]",  category: "AI"       },
  snapshot_create:   { icon: <Activity className="h-3 w-3" />,   color: "text-[#58a6ff]",  category: "System"   },
  snapshot_restore:  { icon: <Activity className="h-3 w-3" />,   color: "text-[#d29922]",  category: "System"   },
  deploy:            { icon: <Activity className="h-3 w-3" />,   color: "text-[#a371f7]",  category: "System"   },
  secret_add:        { icon: <User className="h-3 w-3" />,       color: "text-[#f2cc60]",  category: "Security" },
  pkg_install:       { icon: <Download className="h-3 w-3" />,   color: "text-[#3fb950]",  category: "System"   },
};

function makeEntry(action: AuditAction, description: string, meta?: Record<string, string>): AuditEntry {
  return { id: `${Date.now()}-${Math.random().toString(36).slice(2)}`, action, description, ts: Date.now() - Math.floor(Math.random() * 3600000), user: "you", meta };
}

const INITIAL: AuditEntry[] = [
  makeEntry("file_create",     "Created src/components/Header.tsx"),
  makeEntry("file_edit",       "Edited src/App.tsx (3 changes)"),
  makeEntry("terminal_cmd",    "pnpm install"),
  makeEntry("ai_assist",       "AI rewrote AuthProvider component"),
  makeEntry("file_edit",       "Edited src/pages/index.tsx"),
  makeEntry("snapshot_create", "Auto-checkpoint created"),
  makeEntry("git_commit",      "feat: add auth system (12 files)"),
  makeEntry("file_rename",     "Renamed Header.tsx → Navbar.tsx"),
  makeEntry("pkg_install",     "Installed: tailwindcss@3.4.1"),
  makeEntry("ai_assist",       "AI generated unit tests for utils.ts"),
  makeEntry("terminal_cmd",    "pnpm run build"),
  makeEntry("deploy",          "Deployed to production (v1.2.0)"),
].sort((a, b) => b.ts - a.ts);

function formatRelative(ts: number): string {
  const diff = Date.now() - ts;
  if (diff < 60000) return `${Math.floor(diff / 1000)}s ago`;
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  return `${Math.floor(diff / 3600000)}h ago`;
}

export function AuditLogs() {
  const [logs, setLogs] = useState<AuditEntry[]>(INITIAL);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string>("all");
  const [, setTick] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setTick(p => p + 1), 30000);
    return () => clearInterval(t);
  }, []);

  const categories = ["all", ...Array.from(new Set(Object.values(ACTION_CONFIG).map(c => c.category)))];

  const filtered = logs.filter(l => {
    const cat = ACTION_CONFIG[l.action].category;
    return (category === "all" || cat === category) &&
      (!search || l.description.toLowerCase().includes(search.toLowerCase()) || l.action.includes(search.toLowerCase()));
  });

  const exportLogs = () => {
    const text = logs.map(l => `[${new Date(l.ts).toISOString()}] [${l.action}] ${l.description}`).join("\n");
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "audit-log.txt"; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col h-full bg-[#0d1117] text-[#e6edf3]">
      <div className="flex items-center gap-2 px-3 py-2 border-b border-[#21262d] bg-[#161b22] shrink-0">
        <Activity className="h-3.5 w-3.5 text-[#58a6ff]" />
        <span className="text-[10px] font-semibold text-[#8b949e] uppercase tracking-widest flex-1">Audit Log</span>
        <button onClick={exportLogs} title="Export" className="h-5 w-5 flex items-center justify-center rounded text-[#484f58] hover:text-[#8b949e] hover:bg-[#21262d] transition-colors">
          <Download className="h-3 w-3" />
        </button>
        <button onClick={() => setLogs([])} title="Clear" className="h-5 w-5 flex items-center justify-center rounded text-[#484f58] hover:text-[#f85149] hover:bg-[#21262d] transition-colors">
          <Trash2 className="h-3 w-3" />
        </button>
      </div>

      {/* Search */}
      <div className="px-3 py-2 border-b border-[#21262d] space-y-2 shrink-0">
        <div className="flex items-center gap-1.5 bg-[#21262d] border border-[#30363d] rounded px-2 py-1">
          <Search className="h-3 w-3 text-[#484f58] shrink-0" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Filter actions…"
            className="flex-1 bg-transparent text-xs text-[#e6edf3] placeholder-[#484f58] outline-none" />
        </div>
        <div className="flex gap-1 flex-wrap">
          {categories.map(cat => (
            <button key={cat} onClick={() => setCategory(cat)}
              className={`text-[9px] px-1.5 py-0.5 rounded capitalize border transition-colors ${
                category === cat ? "bg-[#1f6feb]/20 text-[#58a6ff] border-[#1f6feb]/30" : "text-[#484f58] border-[#30363d] hover:border-[#484f58]"
              }`}>
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Entries */}
      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 gap-2 text-[#484f58]">
            <Activity className="h-8 w-8 opacity-20" />
            <p className="text-xs">No audit entries found</p>
          </div>
        ) : (
          <div className="py-1">
            {filtered.map((entry, i) => {
              const cfg = ACTION_CONFIG[entry.action];
              const showDate = i === 0 || new Date(filtered[i - 1].ts).toDateString() !== new Date(entry.ts).toDateString();
              return (
                <div key={entry.id}>
                  {showDate && (
                    <div className="flex items-center gap-2 px-3 py-2">
                      <div className="flex-1 h-px bg-[#21262d]" />
                      <span className="text-[9px] text-[#484f58]">{new Date(entry.ts).toLocaleDateString()}</span>
                      <div className="flex-1 h-px bg-[#21262d]" />
                    </div>
                  )}
                  <div className="flex items-start gap-2.5 px-3 py-1.5 hover:bg-[#161b22] group transition-colors">
                    <div className={`mt-0.5 shrink-0 ${cfg.color}`}>{cfg.icon}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] text-[#e6edf3] truncate">{entry.description}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[9px] text-[#484f58]">{formatRelative(entry.ts)}</span>
                        <span className="text-[9px] px-1 rounded bg-[#21262d] text-[#484f58] capitalize">{cfg.category}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="px-3 py-1.5 border-t border-[#21262d] bg-[#161b22] shrink-0 text-[10px] text-[#484f58]">
        {filtered.length} of {logs.length} events
      </div>
    </div>
  );
}
