import { useState, useCallback } from "react";
import { Package, Check, X, Loader2, Search, Star, Download, Zap, Palette, Wrench, Brain } from "lucide-react";

interface Extension {
  name: string;
  pkg: string;
  desc: string;
  category: "formatter" | "linter" | "theme" | "ai" | "language" | "utility";
  stars?: string;
  version?: string;
}

const EXTENSIONS: Extension[] = [
  { name: "Prettier",         pkg: "prettier",                    desc: "Opinionated code formatter",          category: "formatter", stars: "47k", version: "3.x" },
  { name: "ESLint",           pkg: "eslint",                      desc: "JavaScript & TypeScript linter",      category: "linter",    stars: "24k", version: "9.x" },
  { name: "Tailwind CSS",     pkg: "tailwindcss",                 desc: "Utility-first CSS framework",         category: "utility",   stars: "81k", version: "4.x" },
  { name: "TypeScript",       pkg: "typescript",                  desc: "Typed JavaScript at any scale",       category: "language",  stars: "100k", version: "5.x" },
  { name: "Vite",             pkg: "vite",                        desc: "Next-generation frontend tooling",    category: "utility",   stars: "67k", version: "7.x" },
  { name: "Vitest",           pkg: "vitest",                      desc: "Blazing-fast unit test framework",    category: "utility",   stars: "13k", version: "3.x" },
  { name: "Zod",              pkg: "zod",                         desc: "TypeScript-first schema validation",  category: "utility",   stars: "33k", version: "3.x" },
  { name: "Axios",            pkg: "axios",                       desc: "Promise-based HTTP client",           category: "utility",   stars: "104k", version: "1.x" },
  { name: "Lodash",           pkg: "lodash",                      desc: "Utility functions for JavaScript",    category: "utility",   stars: "59k", version: "4.x" },
  { name: "Dayjs",            pkg: "dayjs",                       desc: "Lightweight date/time library",       category: "utility",   stars: "46k", version: "1.x" },
  { name: "Framer Motion",    pkg: "framer-motion",               desc: "Production-ready animation library",  category: "utility",   stars: "22k", version: "12.x" },
  { name: "Zustand",          pkg: "zustand",                     desc: "Minimal state management",            category: "utility",   stars: "47k", version: "5.x" },
  { name: "React Query",      pkg: "@tanstack/react-query",       desc: "Async state management for React",   category: "utility",   stars: "42k", version: "5.x" },
  { name: "Drizzle ORM",      pkg: "drizzle-orm",                 desc: "TypeScript ORM for SQL databases",    category: "utility",   stars: "24k", version: "0.x" },
  { name: "Express",          pkg: "express",                     desc: "Fast Node.js web framework",          category: "utility",   stars: "64k", version: "5.x" },
  { name: "Radix UI",         pkg: "@radix-ui/react-dialog",      desc: "Accessible UI component primitives",  category: "utility",   stars: "15k", version: "1.x" },
  { name: "class-variance-authority", pkg: "class-variance-authority", desc: "Build type-safe UI variants", category: "utility", stars: "5k", version: "0.x" },
];

const CATEGORY_ICONS: Record<Extension["category"], React.ReactNode> = {
  formatter: <Wrench  className="h-3 w-3 text-[#58a6ff]" />,
  linter:    <Zap     className="h-3 w-3 text-[#d29922]" />,
  theme:     <Palette className="h-3 w-3 text-[#a371f7]" />,
  ai:        <Brain   className="h-3 w-3 text-[#3fb950]" />,
  language:  <Package className="h-3 w-3 text-[#e36209]" />,
  utility:   <Package className="h-3 w-3 text-[#8b949e]" />,
};

interface InstallState {
  status: "idle" | "installing" | "installed" | "error";
  output?: string;
}

interface Props {
  projectId?: number;
}

export function ExtensionsPanel({ projectId }: Props) {
  const [installed, setInstalled] = useState<Record<string, InstallState>>({});
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<Extension["category"] | "all">("all");
  const [activeLog, setActiveLog] = useState<string | null>(null);

  const install = useCallback(async (ext: Extension) => {
    if (!projectId) return;
    setInstalled(prev => ({ ...prev, [ext.pkg]: { status: "installing", output: "" } }));
    setActiveLog(ext.pkg);

    try {
      const resp = await fetch(`/api/projects/${projectId}/install`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packages: [ext.pkg] }),
      });
      if (!resp.ok || !resp.body) throw new Error("Network error");

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let chunks = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split("\n\n");
        buffer = parts.pop() ?? "";
        for (const part of parts) {
          const line = part.replace(/^data: /, "").trim();
          if (!line) continue;
          try {
            const ev = JSON.parse(line) as { type: string; data?: string; code?: number };
            if (ev.data) {
              chunks += ev.data;
              setInstalled(prev => ({ ...prev, [ext.pkg]: { status: "installing", output: chunks } }));
            }
            if (ev.type === "success" || (ev.type === "done" && ev.code === 0)) {
              setInstalled(prev => ({ ...prev, [ext.pkg]: { status: "installed", output: chunks } }));
            } else if (ev.type === "error") {
              setInstalled(prev => ({ ...prev, [ext.pkg]: { status: "error", output: chunks } }));
            }
          } catch { /* */ }
        }
      }
    } catch (err) {
      setInstalled(prev => ({ ...prev, [ext.pkg]: { status: "error", output: String(err) } }));
    }
  }, [projectId]);

  const uninstall = useCallback(async (ext: Extension) => {
    if (!projectId) return;
    setInstalled(prev => ({ ...prev, [ext.pkg]: { status: "installing" } }));
    try {
      const r = await fetch(`/api/projects/${projectId}/packages/uninstall`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packages: [ext.pkg] }),
      });
      if (r.ok) {
        setInstalled(prev => ({ ...prev, [ext.pkg]: { status: "idle" } }));
      } else {
        setInstalled(prev => ({ ...prev, [ext.pkg]: { status: "error", output: "Uninstall failed" } }));
      }
    } catch (err) {
      setInstalled(prev => ({ ...prev, [ext.pkg]: { status: "error", output: String(err) } }));
    }
  }, [projectId]);

  const categories: (Extension["category"] | "all")[] = ["all", "formatter", "linter", "utility", "language", "theme", "ai"];

  const filtered = EXTENSIONS.filter(ext => {
    if (activeCategory !== "all" && ext.category !== activeCategory) return false;
    if (search && !ext.name.toLowerCase().includes(search.toLowerCase()) && !ext.pkg.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const currentLog = activeLog ? installed[activeLog]?.output : null;

  return (
    <div className="flex flex-col h-full bg-[#0d1117] text-[#e6edf3]">
      {/* Header */}
      <div className="px-3 pt-3 pb-2 border-b border-[#21262d] shrink-0">
        <p className="text-[10px] font-semibold text-[#8b949e] uppercase tracking-widest mb-2">Extensions</p>
        <div className="flex items-center gap-1.5 bg-[#21262d] border border-[#30363d] rounded px-2 py-1">
          <Search className="h-3 w-3 text-[#484f58] shrink-0" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search extensions…"
            className="bg-transparent text-xs text-[#e6edf3] placeholder-[#484f58] outline-none flex-1"
          />
        </div>
        {/* Category filter */}
        <div className="flex gap-1 mt-2 flex-wrap">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-1.5 py-0.5 rounded text-[10px] border transition-colors capitalize ${
                activeCategory === cat
                  ? "bg-[#1f6feb] border-[#1f6feb]/50 text-white"
                  : "text-[#8b949e] border-[#30363d] hover:bg-[#21262d]"
              }`}>
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Extension list */}
      <div className="flex-1 overflow-y-auto p-2 gap-1.5 flex flex-col">
        {!projectId && (
          <div className="text-[10px] text-[#d29922] bg-[#d29922]/10 border border-[#d29922]/20 rounded p-2 mb-1">
            Open a project to install extensions
          </div>
        )}
        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center h-20 text-[#484f58] gap-1">
            <Search className="h-5 w-5 opacity-30" />
            <span className="text-xs">No extensions found</span>
          </div>
        )}
        {filtered.map(ext => {
          const state = installed[ext.pkg] ?? { status: "idle" };
          return (
            <div key={ext.pkg} className="rounded bg-[#161b22] border border-[#21262d] hover:border-[#30363d] transition-colors">
              <div className="flex items-start gap-2 p-2">
                <div className="h-7 w-7 rounded bg-[#21262d] flex items-center justify-center shrink-0 mt-0.5">
                  {CATEGORY_ICONS[ext.category]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="text-[11px] font-medium text-[#e6edf3] truncate">{ext.name}</p>
                    {ext.version && (
                      <span className="text-[9px] text-[#484f58] shrink-0">{ext.version}</span>
                    )}
                  </div>
                  <p className="text-[10px] text-[#8b949e] leading-tight">{ext.desc}</p>
                  {ext.stars && (
                    <div className="flex items-center gap-0.5 mt-0.5">
                      <Star className="h-2.5 w-2.5 text-[#d29922]" />
                      <span className="text-[9px] text-[#484f58]">{ext.stars}</span>
                      <Download className="h-2.5 w-2.5 text-[#484f58] ml-1" />
                      <span className="text-[9px] text-[#484f58]">{ext.pkg}</span>
                    </div>
                  )}
                </div>
                <div className="shrink-0 flex flex-col items-end gap-1">
                  {state.status === "installing" ? (
                    <div className="flex items-center gap-1 text-[9px] text-[#58a6ff]">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      <span>Installing…</span>
                    </div>
                  ) : state.status === "installed" ? (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => uninstall(ext)}
                        title="Uninstall"
                        className="flex items-center gap-0.5 text-[9px] text-[#f85149] hover:bg-[#f85149]/10 px-1 py-0.5 rounded transition-colors">
                        <X className="h-2.5 w-2.5" />
                      </button>
                      <span className="flex items-center gap-0.5 text-[9px] text-[#3fb950] border border-[#3fb950]/30 bg-[#3fb950]/10 px-1.5 py-0.5 rounded">
                        <Check className="h-2.5 w-2.5" /> Installed
                      </span>
                    </div>
                  ) : state.status === "error" ? (
                    <button
                      onClick={() => install(ext)}
                      disabled={!projectId}
                      className="text-[9px] text-[#f85149] border border-[#f85149]/30 bg-[#f85149]/10 px-1.5 py-0.5 rounded hover:bg-[#f85149]/20 transition-colors disabled:opacity-40">
                      Retry
                    </button>
                  ) : (
                    <button
                      onClick={() => install(ext)}
                      disabled={!projectId}
                      className="text-[9px] text-[#8b949e] border border-[#30363d] px-1.5 py-0.5 rounded hover:bg-[#21262d] hover:text-[#e6edf3] transition-colors disabled:opacity-40">
                      Install
                    </button>
                  )}
                  {state.output && (
                    <button
                      onClick={() => setActiveLog(activeLog === ext.pkg ? null : ext.pkg)}
                      className="text-[9px] text-[#484f58] hover:text-[#8b949e]">
                      {activeLog === ext.pkg ? "hide log" : "show log"}
                    </button>
                  )}
                </div>
              </div>
              {/* Install log */}
              {activeLog === ext.pkg && currentLog && (
                <div className="border-t border-[#21262d] bg-[#0d1117] px-2 py-1.5 rounded-b max-h-24 overflow-y-auto">
                  <pre className="text-[9px] text-[#8b949e] whitespace-pre-wrap break-all font-mono">{currentLog}</pre>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="px-3 py-1.5 border-t border-[#21262d] bg-[#161b22] shrink-0 text-[10px] text-[#484f58]">
        {filtered.length} extensions · npm-powered
      </div>
    </div>
  );
}
