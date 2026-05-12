import { useMemo, useState } from "react";
import { Code2, ChevronRight, Function, Box, Type, Braces, FileCode, Search, Hash } from "lucide-react";

interface Symbol {
  name: string;
  kind: "function" | "class" | "interface" | "type" | "const" | "export" | "component";
  line: number;
  detail?: string;
}

interface Props {
  content?: string;
  language?: string;
  filename?: string;
  onNavigate?: (line: number) => void;
}

const KIND_CONFIG = {
  function:  { icon: <span className="text-[#d2a8ff] font-bold font-mono text-[11px]">ƒ</span>, color: "text-[#d2a8ff]", label: "Function" },
  class:     { icon: <Box className="h-3 w-3 text-[#ffa657]" />,       color: "text-[#ffa657]", label: "Class" },
  interface: { icon: <Type className="h-3 w-3 text-[#79c0ff]" />,       color: "text-[#79c0ff]", label: "Interface" },
  type:      { icon: <Type className="h-3 w-3 text-[#79c0ff]" />,       color: "text-[#79c0ff]", label: "Type" },
  const:     { icon: <Hash className="h-3 w-3 text-[#3fb950]" />,       color: "text-[#3fb950]", label: "Const" },
  export:    { icon: <Braces className="h-3 w-3 text-[#8b949e]" />,     color: "text-[#8b949e]", label: "Export" },
  component: { icon: <Code2 className="h-3 w-3 text-[#58a6ff]" />,      color: "text-[#58a6ff]", label: "Component" },
};

function parseSymbols(content: string, language: string): Symbol[] {
  const symbols: Symbol[] = [];
  const lines = content.split("\n");

  lines.forEach((line, idx) => {
    const ln = idx + 1;
    const t  = line.trim();

    if (language === "typescript" || language === "javascript") {
      // React functional components (export function Foo / export const Foo = ...)
      let m = t.match(/^export\s+(?:default\s+)?function\s+([A-Z][A-Za-z0-9_]*)\s*[(<]/);
      if (m) { symbols.push({ name: m[1], kind: "component", line: ln }); return; }

      m = t.match(/^export\s+const\s+([A-Z][A-Za-z0-9_]*)\s*[=:]/);
      if (m) {
        const isComponent = content.slice(content.indexOf(m[0])).match(/return\s*\(/);
        symbols.push({ name: m[1], kind: isComponent ? "component" : "const", line: ln }); return;
      }

      // Regular functions
      m = t.match(/^(?:export\s+)?(?:async\s+)?function\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*[(<]/);
      if (m) { symbols.push({ name: m[1], kind: "function", line: ln }); return; }

      // Arrow functions
      m = t.match(/^(?:export\s+)?const\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*=\s*(?:async\s*)?\(/);
      if (m) { symbols.push({ name: m[1], kind: "function", line: ln }); return; }

      // Classes
      m = t.match(/^(?:export\s+)?(?:abstract\s+)?class\s+([A-Za-z_][A-Za-z0-9_]*)/);
      if (m) { symbols.push({ name: m[1], kind: "class", line: ln }); return; }

      // Interfaces
      m = t.match(/^(?:export\s+)?interface\s+([A-Za-z_][A-Za-z0-9_]*)/);
      if (m) { symbols.push({ name: m[1], kind: "interface", line: ln }); return; }

      // Type aliases
      m = t.match(/^(?:export\s+)?type\s+([A-Za-z_][A-Za-z0-9_]*)\s*=/);
      if (m) { symbols.push({ name: m[1], kind: "type", line: ln }); return; }

      // Consts
      m = t.match(/^(?:export\s+)?const\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*=/);
      if (m) { symbols.push({ name: m[1], kind: "const", line: ln }); return; }
    }

    if (language === "python") {
      let m = t.match(/^def\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\(/);
      if (m) { symbols.push({ name: m[1], kind: "function", line: ln }); return; }
      m = t.match(/^class\s+([A-Za-z_][A-Za-z0-9_]*)/);
      if (m) { symbols.push({ name: m[1], kind: "class", line: ln }); return; }
    }

    if (language === "go") {
      let m = t.match(/^func\s+(?:\([^)]+\)\s+)?([a-zA-Z_][a-zA-Z0-9_]*)\s*\(/);
      if (m) { symbols.push({ name: m[1], kind: "function", line: ln }); return; }
      m = t.match(/^type\s+([A-Za-z_][A-Za-z0-9_]*)\s+struct/);
      if (m) { symbols.push({ name: m[1], kind: "class", line: ln }); return; }
    }
  });

  return symbols;
}

export function OutlinePanel({ content, language, filename, onNavigate }: Props) {
  const [search, setSearch] = useState("");
  const [expandedKinds, setExpandedKinds] = useState(new Set<string>(["function", "class", "component", "interface", "type", "const", "export"]));

  const symbols = useMemo(() => {
    if (!content || !language) return [];
    return parseSymbols(content, language);
  }, [content, language]);

  const filtered = search
    ? symbols.filter(s => s.name.toLowerCase().includes(search.toLowerCase()))
    : symbols;

  const byKind = filtered.reduce<Record<string, Symbol[]>>((acc, s) => {
    (acc[s.kind] ??= []).push(s);
    return acc;
  }, {});

  const toggleKind = (kind: string) => {
    setExpandedKinds(prev => {
      const next = new Set(prev);
      next.has(kind) ? next.delete(kind) : next.add(kind);
      return next;
    });
  };

  if (!content) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-[#484f58] gap-2 p-4">
        <FileCode className="h-8 w-8 opacity-20" />
        <p className="text-xs text-center">Open a file to see its outline</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[#0d1117] text-[#e6edf3]">
      {/* Header */}
      <div className="px-3 py-2 bg-[#161b22] border-b border-[#21262d] shrink-0">
        <div className="flex items-center gap-2 mb-2">
          <Code2 className="h-3.5 w-3.5 text-[#8b949e]" />
          <span className="text-[11px] font-semibold text-[#8b949e] uppercase tracking-wider">Outline</span>
          {filename && <span className="text-[10px] text-[#484f58] truncate">{filename}</span>}
        </div>
        <div className="flex items-center gap-1.5 bg-[#21262d] border border-[#30363d] rounded px-2 py-0.5">
          <Search className="h-3 w-3 text-[#484f58] shrink-0" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Filter symbols…"
            className="bg-transparent text-xs text-[#e6edf3] placeholder-[#484f58] outline-none flex-1"
          />
        </div>
      </div>

      {/* Symbol list */}
      <div className="flex-1 overflow-y-auto py-1">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-24 text-[#484f58] gap-1">
            <Code2 className="h-6 w-6 opacity-20" />
            <p className="text-xs">{search ? "No matching symbols" : "No symbols found"}</p>
          </div>
        ) : search ? (
          /* Flat list when searching */
          filtered.map((s, i) => {
            const cfg = KIND_CONFIG[s.kind];
            return (
              <button key={i} onClick={() => onNavigate?.(s.line)}
                className="w-full flex items-center gap-2 px-3 py-1 hover:bg-[#161b22] transition-colors text-left group">
                <span className="shrink-0 w-4 flex items-center justify-center">{cfg.icon}</span>
                <span className={`flex-1 text-[12px] truncate ${cfg.color}`}>{s.name}</span>
                <span className="text-[10px] text-[#484f58] shrink-0 opacity-0 group-hover:opacity-100">Ln {s.line}</span>
              </button>
            );
          })
        ) : (
          /* Grouped by kind */
          Object.entries(byKind).map(([kind, items]) => {
            const cfg = KIND_CONFIG[kind as keyof typeof KIND_CONFIG];
            const expanded = expandedKinds.has(kind);
            return (
              <div key={kind}>
                <button onClick={() => toggleKind(kind)}
                  className="w-full flex items-center gap-1.5 px-2 py-1 hover:bg-[#21262d] transition-colors">
                  <ChevronRight className={`h-3 w-3 text-[#484f58] shrink-0 transition-transform ${expanded ? "rotate-90" : ""}`} />
                  <span className="shrink-0">{cfg.icon}</span>
                  <span className={`text-[10px] font-semibold uppercase tracking-wider ${cfg.color}`}>{cfg.label}s</span>
                  <span className="text-[9px] text-[#484f58] ml-auto">{items.length}</span>
                </button>
                {expanded && items.map((s, i) => (
                  <button key={i} onClick={() => onNavigate?.(s.line)}
                    className="w-full flex items-center gap-2 pl-8 pr-3 py-0.5 hover:bg-[#161b22] transition-colors group">
                    <span className={`flex-1 text-[12px] truncate text-left ${cfg.color}`}>{s.name}</span>
                    <span className="text-[10px] text-[#484f58] shrink-0 opacity-0 group-hover:opacity-100">:{s.line}</span>
                  </button>
                ))}
              </div>
            );
          })
        )}
      </div>

      {/* Footer */}
      <div className="px-3 py-1 border-t border-[#21262d] bg-[#161b22] shrink-0 text-[10px] text-[#484f58]">
        {symbols.length} symbols · {language}
      </div>
    </div>
  );
}
