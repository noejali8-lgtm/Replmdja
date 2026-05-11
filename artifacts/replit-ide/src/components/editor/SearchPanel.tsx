import { useState, useEffect, useCallback } from "react";
import { Search, Replace, X, ChevronDown, ChevronRight, FileCode, CaseSensitive, Regex, WholeWord } from "lucide-react";

interface SearchResult {
  filePath: string;
  fileName: string;
  line: number;
  col: number;
  lineText: string;
  matchStart: number;
  matchEnd: number;
}

interface FileNode {
  name: string;
  path: string;
  type: "file" | "dir";
  ext?: string;
  content?: string;
  children?: FileNode[];
}

interface SearchPanelProps {
  files: FileNode[];
  onFileSelect?: (file: FileNode, line?: number) => void;
}

function flattenFiles(nodes: FileNode[]): FileNode[] {
  return nodes.flatMap(n => n.type === "file" ? [n] : flattenFiles(n.children ?? []));
}

function searchInFile(file: FileNode, query: string, flags: { caseSensitive: boolean; regex: boolean; wholeWord: boolean }): SearchResult[] {
  if (!file.content || !query) return [];
  const results: SearchResult[] = [];

  try {
    let pattern: RegExp;
    if (flags.regex) {
      pattern = new RegExp(query, flags.caseSensitive ? "g" : "gi");
    } else {
      const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const word = flags.wholeWord ? `\\b${escaped}\\b` : escaped;
      pattern = new RegExp(word, flags.caseSensitive ? "g" : "gi");
    }

    const lines = file.content.split("\n");
    for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
      const lineText = lines[lineIdx];
      let match: RegExpExecArray | null;
      pattern.lastIndex = 0;
      while ((match = pattern.exec(lineText)) !== null) {
        results.push({
          filePath: file.path,
          fileName: file.name,
          line: lineIdx + 1,
          col: match.index + 1,
          lineText: lineText.trim(),
          matchStart: match.index,
          matchEnd: match.index + match[0].length,
        });
        if (!flags.regex && !query.includes("g")) {
          pattern.lastIndex = match.index + 1;
        }
      }
    }
  } catch { /**/ }

  return results;
}

export function SearchPanel({ files, onFileSelect }: SearchPanelProps) {
  const [query, setQuery] = useState("");
  const [replaceText, setReplaceText] = useState("");
  const [showReplace, setShowReplace] = useState(false);
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [useRegex, setUseRegex] = useState(false);
  const [wholeWord, setWholeWord] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [isSearching, setIsSearching] = useState(false);

  const doSearch = useCallback(() => {
    if (!query.trim()) { setResults([]); return; }
    setIsSearching(true);
    const flat = flattenFiles(files);
    const allResults: SearchResult[] = [];
    for (const file of flat) {
      allResults.push(...searchInFile(file, query, { caseSensitive, regex: useRegex, wholeWord }));
      if (allResults.length > 500) break;
    }
    setResults(allResults);
    setIsSearching(false);
  }, [query, caseSensitive, useRegex, wholeWord, files]);

  useEffect(() => {
    const t = setTimeout(doSearch, 300);
    return () => clearTimeout(t);
  }, [doSearch]);

  const groupedByFile = results.reduce<Record<string, SearchResult[]>>((acc, r) => {
    if (!acc[r.filePath]) acc[r.filePath] = [];
    acc[r.filePath].push(r);
    return acc;
  }, {});

  const toggleCollapse = (path: string) => {
    setCollapsed(prev => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  };

  return (
    <div className="flex flex-col h-full bg-[#0d1117] text-[#e6edf3]">
      <div className="p-3 space-y-2 border-b border-[#21262d] shrink-0">
        <div className="flex items-center gap-1">
          <button onClick={() => setShowReplace(!showReplace)}
            className="text-[#8b949e] hover:text-[#e6edf3] transition-colors p-0.5">
            {showReplace ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
          </button>

          <div className="flex-1 flex items-center gap-2 bg-[#21262d] border border-[#30363d] rounded px-2 py-1">
            <Search className="h-3.5 w-3.5 text-[#484f58] shrink-0" />
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search in files…"
              className="flex-1 bg-transparent text-[#e6edf3] text-xs placeholder-[#484f58] outline-none"
              autoFocus
            />
            {query && (
              <button onClick={() => setQuery("")} className="text-[#484f58] hover:text-[#8b949e]">
                <X className="h-3 w-3" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-0.5">
            <button onClick={() => setCaseSensitive(!caseSensitive)}
              title="Match Case"
              className={`p-1 rounded transition-colors ${caseSensitive ? "bg-[#1f6feb] text-white" : "text-[#484f58] hover:text-[#8b949e] hover:bg-[#21262d]"}`}>
              <CaseSensitive className="h-3.5 w-3.5" />
            </button>
            <button onClick={() => setWholeWord(!wholeWord)}
              title="Match Whole Word"
              className={`p-1 rounded transition-colors ${wholeWord ? "bg-[#1f6feb] text-white" : "text-[#484f58] hover:text-[#8b949e] hover:bg-[#21262d]"}`}>
              <WholeWord className="h-3.5 w-3.5" />
            </button>
            <button onClick={() => setUseRegex(!useRegex)}
              title="Use Regular Expression"
              className={`p-1 rounded transition-colors ${useRegex ? "bg-[#1f6feb] text-white" : "text-[#484f58] hover:text-[#8b949e] hover:bg-[#21262d]"}`}>
              <Regex className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {showReplace && (
          <div className="flex items-center gap-2 bg-[#21262d] border border-[#30363d] rounded px-2 py-1 ml-5">
            <Replace className="h-3.5 w-3.5 text-[#484f58] shrink-0" />
            <input
              value={replaceText}
              onChange={e => setReplaceText(e.target.value)}
              placeholder="Replace…"
              className="flex-1 bg-transparent text-[#e6edf3] text-xs placeholder-[#484f58] outline-none"
            />
          </div>
        )}

        {results.length > 0 && (
          <div className="text-[10px] text-[#8b949e] ml-5">
            {results.length} result{results.length !== 1 ? "s" : ""} in {Object.keys(groupedByFile).length} file{Object.keys(groupedByFile).length !== 1 ? "s" : ""}
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto">
        {isSearching && (
          <div className="flex items-center gap-2 p-4 text-[#8b949e] text-xs">
            <div className="h-3 w-3 border border-[#58a6ff]/30 border-t-[#58a6ff] rounded-full animate-spin" />
            Searching…
          </div>
        )}

        {!isSearching && query && results.length === 0 && (
          <div className="p-4 text-center text-[#484f58] text-xs">No results found</div>
        )}

        {!isSearching && Object.entries(groupedByFile).map(([filePath, fileResults]) => {
          const isCollapsed = collapsed.has(filePath);
          const file = flattenFiles(files).find(f => f.path === filePath);
          return (
            <div key={filePath} className="border-b border-[#21262d]">
              <button
                onClick={() => toggleCollapse(filePath)}
                className="w-full flex items-center gap-2 px-3 py-2 hover:bg-[#161b22] transition-colors text-left">
                {isCollapsed ? <ChevronRight className="h-3 w-3 text-[#8b949e] shrink-0" /> : <ChevronDown className="h-3 w-3 text-[#8b949e] shrink-0" />}
                <FileCode className="h-3.5 w-3.5 text-[#58a6ff] shrink-0" />
                <span className="text-xs text-[#e6edf3] truncate flex-1">{fileResults[0].fileName}</span>
                <span className="text-[10px] text-[#484f58] bg-[#21262d] px-1.5 py-0.5 rounded-full shrink-0">{fileResults.length}</span>
              </button>

              {!isCollapsed && fileResults.map((r, i) => (
                <button
                  key={i}
                  onClick={() => file && onFileSelect?.(file, r.line)}
                  className="w-full flex items-start gap-3 px-8 py-1.5 hover:bg-[#161b22] transition-colors text-left">
                  <span className="text-[10px] text-[#484f58] shrink-0 min-w-[28px] text-right font-mono">{r.line}</span>
                  <span className="text-[11px] font-mono truncate">{highlightMatch(r.lineText, r)}</span>
                </button>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );

  function highlightMatch(text: string, result: SearchResult) {
    const trimStart = result.lineText.length > text.length ? 0 : 0;
    const before = text.substring(0, result.matchStart - trimStart);
    const match = text.substring(result.matchStart - trimStart, result.matchEnd - trimStart);
    const after = text.substring(result.matchEnd - trimStart);
    return (
      <>
        <span className="text-[#8b949e]">{before}</span>
        <span className="bg-[#f2cc60]/30 text-[#f2cc60]">{match}</span>
        <span className="text-[#8b949e]">{after}</span>
      </>
    );
  }
}
