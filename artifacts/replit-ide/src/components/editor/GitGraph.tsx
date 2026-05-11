import { useState } from "react";
import { GitBranch, GitMerge, Circle, Tag, RefreshCw, User } from "lucide-react";

interface GitCommit {
  hash: string;
  shortHash: string;
  message: string;
  author: string;
  date: string;
  branch?: string;
  tags?: string[];
  parents: string[];
  column: number;
}

type BranchColor = { stroke: string; text: string; bg: string };

const BRANCH_COLORS: BranchColor[] = [
  { stroke: "#58a6ff", text: "text-[#58a6ff]",  bg: "bg-[#1f6feb]/20" },
  { stroke: "#a371f7", text: "text-[#a371f7]",  bg: "bg-[#8957e5]/20" },
  { stroke: "#3fb950", text: "text-[#3fb950]",  bg: "bg-[#238636]/20" },
  { stroke: "#d29922", text: "text-[#d29922]",  bg: "bg-[#d29922]/20" },
  { stroke: "#f85149", text: "text-[#f85149]",  bg: "bg-[#f85149]/20" },
];

const COMMITS: GitCommit[] = [
  { hash: "a1b2c3d4", shortHash: "a1b2c3d", message: "feat: add authentication system", author: "Alice", date: "2m ago", branch: "main", tags: ["v2.1.0"], parents: ["b2c3d4e5"], column: 0 },
  { hash: "b2c3d4e5", shortHash: "b2c3d4e", message: "feat: AI commit message generator", author: "Bob", date: "1h ago", branch: "feat/ai-commits", parents: ["c3d4e5f6", "d4e5f6a7"], column: 1 },
  { hash: "c3d4e5f6", shortHash: "c3d4e5f", message: "fix: resolve race condition in WS handler", author: "Alice", date: "3h ago", branch: "main", parents: ["e5f6a7b8"], column: 0 },
  { hash: "d4e5f6a7", shortHash: "d4e5f6a", message: "feat: add log streaming panel", author: "Carol", date: "5h ago", branch: "feat/logs", parents: ["e5f6a7b8"], column: 2 },
  { hash: "e5f6a7b8", shortHash: "e5f6a7b", message: "refactor: split editor into components", author: "Alice", date: "8h ago", branch: "main", parents: ["f6a7b8c9"], column: 0 },
  { hash: "f6a7b8c9", shortHash: "f6a7b8c", message: "chore: update dependencies", author: "Bob", date: "1d ago", branch: "main", parents: ["a7b8c9d0"], column: 0 },
  { hash: "a7b8c9d0", shortHash: "a7b8c9d", message: "feat: multi-cursor presence indicators", author: "Carol", date: "1d ago", branch: "main", parents: ["b8c9d0e1"], column: 0 },
  { hash: "b8c9d0e1", shortHash: "b8c9d0e", message: "feat: vulnerability scanner panel", author: "Alice", date: "2d ago", branch: "main", tags: ["v2.0.0"], parents: ["c9d0e1f2"], column: 0 },
  { hash: "c9d0e1f2", shortHash: "c9d0e1f", message: "fix: terminal resize on split view", author: "Bob", date: "3d ago", branch: "main", parents: ["d0e1f2a3"], column: 0 },
  { hash: "d0e1f2a3", shortHash: "d0e1f2a", message: "initial commit", author: "Alice", date: "5d ago", branch: "main", tags: ["v1.0.0"], parents: [], column: 0 },
];

const BRANCHES = [
  { name: "main", color: BRANCH_COLORS[0], ahead: 0, behind: 0 },
  { name: "feat/ai-commits", color: BRANCH_COLORS[1], ahead: 2, behind: 1 },
  { name: "feat/logs", color: BRANCH_COLORS[2], ahead: 1, behind: 3 },
];

const COL_WIDTH = 18;
const ROW_HEIGHT = 44;

function GraphColumn({ commits }: { commits: GitCommit[] }) {
  const maxCol = Math.max(...commits.map(c => c.column));
  const width = (maxCol + 1) * COL_WIDTH + 8;

  return (
    <svg width={width} style={{ flexShrink: 0, overflow: "visible" }}>
      {commits.map((commit, i) => {
        const cx = commit.column * COL_WIDTH + 10;
        const cy = i * ROW_HEIGHT + ROW_HEIGHT / 2;
        const color = BRANCH_COLORS[commit.column % BRANCH_COLORS.length].stroke;

        return (
          <g key={commit.hash}>
            {commit.parents.map((pHash) => {
              const pIdx = commits.findIndex(c => c.hash === pHash);
              if (pIdx === -1) return null;
              const parent = commits[pIdx];
              const px = parent.column * COL_WIDTH + 10;
              const py = pIdx * ROW_HEIGHT + ROW_HEIGHT / 2;
              const pColor = BRANCH_COLORS[parent.column % BRANCH_COLORS.length].stroke;

              if (commit.column === parent.column) {
                return (
                  <line key={pHash} x1={cx} y1={cy} x2={px} y2={py}
                    stroke={color} strokeWidth={2} strokeLinecap="round" />
                );
              }
              return (
                <path key={pHash}
                  d={`M ${cx} ${cy} C ${cx} ${(cy + py) / 2}, ${px} ${(cy + py) / 2}, ${px} ${py}`}
                  fill="none" stroke={pColor} strokeWidth={2} strokeLinecap="round" />
              );
            })}
            <circle cx={cx} cy={cy} r={5} fill="#0d1117" stroke={color} strokeWidth={2} />
            {i === 0 && (
              <circle cx={cx} cy={cy} r={3} fill={color} />
            )}
          </g>
        );
      })}
    </svg>
  );
}

export function GitGraph() {
  const [activeBranch, setActiveBranch] = useState("main");
  const [selectedCommit, setSelectedCommit] = useState<string | null>(null);
  const [tab, setTab] = useState<"graph" | "branches">("graph");

  const selected = COMMITS.find(c => c.hash === selectedCommit);

  return (
    <div className="flex flex-col h-full bg-[#0d1117] text-[#e6edf3]">
      <div className="flex items-center gap-2 px-3 py-2 border-b border-[#21262d] bg-[#161b22] shrink-0">
        <GitBranch className="h-3.5 w-3.5 text-[#a371f7]" />
        <span className="text-[10px] font-semibold text-[#8b949e] uppercase tracking-widest flex-1">Git Graph</span>
        <button className="h-5 w-5 flex items-center justify-center rounded text-[#484f58] hover:text-[#8b949e] hover:bg-[#21262d] transition-colors">
          <RefreshCw className="h-3 w-3" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center px-1 border-b border-[#21262d] shrink-0">
        {(["graph", "branches"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-3 py-1.5 text-[10px] font-medium capitalize transition-colors ${tab === t ? "text-[#e6edf3] border-b-2 border-[#a371f7]" : "text-[#8b949e] hover:text-[#e6edf3]"}`}>
            {t}
          </button>
        ))}
      </div>

      {tab === "branches" ? (
        <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
          {BRANCHES.map(br => (
            <button
              key={br.name}
              onClick={() => setActiveBranch(br.name)}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded border text-left transition-colors ${
                activeBranch === br.name ? `${br.color.bg} border-current/20` : "bg-[#161b22] border-[#21262d] hover:border-[#30363d]"
              }`}>
              <GitBranch className={`h-3.5 w-3.5 shrink-0 ${br.color.text}`} />
              <span className="text-xs font-medium flex-1 truncate">{br.name}</span>
              {activeBranch === br.name && (
                <span className="text-[9px] px-1 rounded bg-[#3fb950]/20 text-[#3fb950] border border-[#3fb950]/20">active</span>
              )}
              <div className="flex items-center gap-1 text-[9px] text-[#484f58]">
                {br.ahead > 0 && <span className="text-[#3fb950]">↑{br.ahead}</span>}
                {br.behind > 0 && <span className="text-[#f85149]">↓{br.behind}</span>}
              </div>
            </button>
          ))}
          <div className="mt-3 pt-3 border-t border-[#21262d]">
            <button className="w-full flex items-center gap-2 px-3 py-2 rounded border border-dashed border-[#30363d] text-xs text-[#484f58] hover:text-[#8b949e] hover:border-[#484f58] transition-colors">
              <GitBranch className="h-3.5 w-3.5" /> New branch
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto">
            <div className="flex min-w-0">
              {/* Graph column */}
              <div className="shrink-0 pt-2">
                <GraphColumn commits={COMMITS} />
              </div>

              {/* Commit info */}
              <div className="flex-1 min-w-0">
                {COMMITS.map((commit, i) => {
                  const isSelected = selectedCommit === commit.hash;
                  const colColor = BRANCH_COLORS[commit.column % BRANCH_COLORS.length];
                  return (
                    <div
                      key={commit.hash}
                      onClick={() => setSelectedCommit(isSelected ? null : commit.hash)}
                      className={`flex flex-col justify-center px-2 cursor-pointer transition-colors border-l-2 ${
                        isSelected ? `bg-[#161b22] border-l-[${colColor.stroke}]` : "border-l-transparent hover:bg-[#161b22]/50"
                      }`}
                      style={{ height: ROW_HEIGHT, borderLeftColor: isSelected ? colColor.stroke : "transparent" }}>
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="text-[11px] text-[#e6edf3] truncate flex-1">{commit.message}</span>
                        {commit.tags?.map(tag => (
                          <span key={tag} className="shrink-0 flex items-center gap-0.5 text-[9px] px-1 rounded bg-[#d29922]/20 text-[#d29922] border border-[#d29922]/20">
                            <Tag className="h-2 w-2" />{tag}
                          </span>
                        ))}
                        {commit.branch && (
                          <span className={`shrink-0 text-[9px] px-1 rounded border ${colColor.bg} ${colColor.text} border-current/20`}>
                            {commit.branch}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[9px] font-mono text-[#484f58]">{commit.shortHash}</span>
                        <span className="text-[9px] text-[#484f58]">{commit.author}</span>
                        <span className="text-[9px] text-[#484f58]">{commit.date}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Commit detail */}
          {selected && (
            <div className="shrink-0 border-t border-[#21262d] bg-[#161b22] p-3 space-y-2">
              <div className="flex items-start gap-2">
                <div className="h-6 w-6 rounded-full bg-[#21262d] flex items-center justify-center shrink-0">
                  <User className="h-3.5 w-3.5 text-[#8b949e]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-[#e6edf3]">{selected.message}</p>
                  <p className="text-[10px] text-[#8b949e] mt-0.5">{selected.author} · {selected.date}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-[10px]">
                <span className="font-mono text-[#58a6ff]">{selected.hash.slice(0, 12)}</span>
                {selected.parents.length > 0 && (
                  <span className="text-[#484f58]">parent: <span className="font-mono text-[#484f58]">{selected.parents[0].slice(0, 7)}</span></span>
                )}
              </div>
              <div className="flex gap-2">
                <button className="flex-1 py-1 rounded bg-[#21262d] hover:bg-[#30363d] text-xs text-[#8b949e] border border-[#30363d] transition-colors flex items-center justify-center gap-1">
                  <GitMerge className="h-3 w-3" /> Checkout
                </button>
                <button className="flex-1 py-1 rounded bg-[#21262d] hover:bg-[#30363d] text-xs text-[#8b949e] border border-[#30363d] transition-colors flex items-center justify-center gap-1">
                  <GitBranch className="h-3 w-3" /> Branch here
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
