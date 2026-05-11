import { useState, useMemo } from "react";
import { Check, X, ChevronDown, ChevronRight, Minus, Plus } from "lucide-react";

type DiffLine = {
  type: "same" | "added" | "removed";
  text: string;
  oldNo?: number;
  newNo?: number;
};

function diffLines(oldText: string, newText: string): DiffLine[] {
  const a = oldText.split("\n");
  const b = newText.split("\n");
  const m = a.length, n = b.length;
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1] + 1
        : Math.max(dp[i - 1][j], dp[i][j - 1]);

  const result: DiffLine[] = [];
  let i = m, j = n;
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && a[i - 1] === b[j - 1]) {
      result.unshift({ type: "same", text: a[i - 1] });
      i--; j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      result.unshift({ type: "added", text: b[j - 1] });
      j--;
    } else {
      result.unshift({ type: "removed", text: a[i - 1] });
      i--;
    }
  }
  return result;
}

interface DiffViewerProps {
  fileName: string;
  originalCode: string;
  proposedCode: string;
  language?: string;
  onAccept: (code: string) => void;
  onReject: () => void;
}

export function DiffViewer({
  fileName,
  originalCode,
  proposedCode,
  onAccept,
  onReject,
}: DiffViewerProps) {
  const [showContext, setShowContext] = useState(true);
  const [collapsedHunks, setCollapsedHunks] = useState<Set<number>>(new Set());

  const lines = useMemo(() => diffLines(originalCode, proposedCode), [originalCode, proposedCode]);

  const addedCount = lines.filter(l => l.type === "added").length;
  const removedCount = lines.filter(l => l.type === "removed").length;

  /* Assign line numbers */
  let oldNo = 0, newNo = 0;
  const numbered = lines.map(l => {
    if (l.type === "same") { oldNo++; newNo++; return { ...l, oldNo, newNo }; }
    if (l.type === "removed") { oldNo++; return { ...l, oldNo }; }
    newNo++; return { ...l, newNo };
  });

  /* Group into hunks (sections of changes with surrounding context) */
  const CONTEXT = 3;
  const isChanged = (idx: number) => lines[idx]?.type !== "same";
  const inHunk = new Set<number>();
  for (let idx = 0; idx < lines.length; idx++) {
    if (isChanged(idx)) {
      for (let c = Math.max(0, idx - CONTEXT); c <= Math.min(lines.length - 1, idx + CONTEXT); c++)
        inHunk.add(c);
    }
  }

  const displayLines = showContext ? numbered : numbered.filter((_, idx) => inHunk.has(idx) || lines[idx].type !== "same");

  const toggleHunk = (i: number) =>
    setCollapsedHunks(prev => { const s = new Set(prev); s.has(i) ? s.delete(i) : s.add(i); return s; });

  return (
    <div className="flex flex-col h-full bg-[#0d1117] text-[#e6edf3] overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-2.5 border-b border-[#21262d] bg-[#161b22] shrink-0">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <span className="text-xs font-semibold text-[#e6edf3] truncate">{fileName}</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#3fb950]/10 text-[#3fb950] border border-[#3fb950]/20">
            +{addedCount}
          </span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#f85149]/10 text-[#f85149] border border-[#f85149]/20">
            -{removedCount}
          </span>
        </div>

        <button
          onClick={() => setShowContext(p => !p)}
          className="text-[10px] px-2 py-1 rounded border border-[#30363d] text-[#8b949e] hover:text-[#e6edf3] hover:bg-[#21262d] transition-colors shrink-0">
          {showContext ? "Changes only" : "Full file"}
        </button>

        <button
          onClick={onReject}
          className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded border border-[#f85149]/30 text-[#f85149] hover:bg-[#f85149]/10 transition-colors shrink-0">
          <X className="h-3.5 w-3.5" /> Reject
        </button>

        <button
          onClick={() => onAccept(proposedCode)}
          className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded bg-[#238636] hover:bg-[#2ea043] text-white font-medium transition-colors shrink-0">
          <Check className="h-3.5 w-3.5" /> Accept
        </button>
      </div>

      {/* Diff body */}
      <div className="flex-1 overflow-y-auto font-mono text-[11px] leading-5">
        <table className="w-full border-collapse">
          <tbody>
            {displayLines.map((line, idx) => {
              const isSkipped = !showContext && idx > 0 && lines.indexOf(numbered[idx - 1 < 0 ? 0 : idx - 1]) + 1 < lines.indexOf(numbered.find(n => n === line) ?? numbered[0]);

              return (
                <tr
                  key={idx}
                  className={
                    line.type === "added"
                      ? "bg-[#0d4429]/60 hover:bg-[#0d4429]"
                      : line.type === "removed"
                      ? "bg-[#4b1c1c]/60 hover:bg-[#4b1c1c]"
                      : "hover:bg-[#161b22]/50"
                  }>
                  {/* Old line number */}
                  <td className="w-10 text-right pr-2 py-0 text-[#484f58] select-none border-r border-[#21262d] shrink-0 align-top">
                    {line.type !== "added" ? line.oldNo : ""}
                  </td>
                  {/* New line number */}
                  <td className="w-10 text-right pr-2 py-0 text-[#484f58] select-none border-r border-[#30363d] shrink-0 align-top">
                    {line.type !== "removed" ? line.newNo : ""}
                  </td>
                  {/* Gutter */}
                  <td className="w-6 text-center py-0 select-none shrink-0 align-top">
                    {line.type === "added" && <Plus className="h-3 w-3 text-[#3fb950] inline" />}
                    {line.type === "removed" && <Minus className="h-3 w-3 text-[#f85149] inline" />}
                    {line.type === "same" && <span className="text-[#484f58]"> </span>}
                  </td>
                  {/* Code */}
                  <td className={`py-0 px-3 whitespace-pre overflow-hidden ${
                    line.type === "added" ? "text-[#3fb950]" :
                    line.type === "removed" ? "text-[#f85149]" :
                    "text-[#e6edf3]"
                  }`}>
                    {line.text || " "}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Footer actions */}
      <div className="flex items-center justify-between px-4 py-2 border-t border-[#21262d] bg-[#161b22] shrink-0">
        <span className="text-[10px] text-[#8b949e]">
          Review changes carefully before accepting
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={onReject}
            className="text-xs text-[#8b949e] hover:text-[#f85149] transition-colors px-2 py-1">
            Discard
          </button>
          <button
            onClick={() => onAccept(proposedCode)}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded bg-[#238636] hover:bg-[#2ea043] text-white font-medium transition-colors">
            <Check className="h-3 w-3" /> Apply changes
          </button>
        </div>
      </div>
    </div>
  );
}
