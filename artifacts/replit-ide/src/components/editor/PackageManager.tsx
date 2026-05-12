import { useState, useRef, useEffect } from "react";
import { Package, Search, Plus, Check, X, Loader2, Box, Terminal } from "lucide-react";

interface Pkg { name: string; version: string; description: string; installed?: boolean; size?: string; tag?: string }

const NPM_PACKAGES: Pkg[] = [
  { name: "react",            version: "19.1.0", description: "A JavaScript library for building user interfaces", installed: true, size: "2.1 MB" },
  { name: "react-dom",        version: "19.1.0", description: "React package for working with the DOM", installed: true, size: "1.8 MB" },
  { name: "vite",             version: "7.3.2",  description: "Next generation frontend tooling", installed: true, size: "4.2 MB" },
  { name: "typescript",       version: "5.9.2",  description: "TypeScript is a typed superset of JavaScript", installed: true, size: "72 MB" },
  { name: "tailwindcss",      version: "4.1.8",  description: "A utility-first CSS framework for rapid UI development", installed: false, size: "3.4 MB", tag: "Popular" },
  { name: "framer-motion",    version: "11.3.8", description: "Production-ready animation library for React", installed: false, size: "8.2 MB", tag: "Popular" },
  { name: "zustand",          version: "4.5.4",  description: "A small, fast and scalable state-management solution", installed: false, size: "1.2 MB" },
  { name: "axios",            version: "1.7.9",  description: "Promise based HTTP client for the browser and node.js", installed: false, size: "2.1 MB" },
  { name: "@tanstack/react-query", version: "5.0.0", description: "Powerful asynchronous state management for TS/JS", installed: false, size: "3.8 MB" },
  { name: "lucide-react",     version: "0.475.0",description: "Beautiful & consistent icon toolkit", installed: false, size: "1.4 MB", tag: "Recommended" },
  { name: "zod",              version: "3.23.8", description: "TypeScript-first schema validation", installed: false, size: "0.9 MB" },
  { name: "dayjs",            version: "1.11.13",description: "Fast 2kB alternative to Moment.js", installed: false, size: "0.4 MB" },
  { name: "recharts",         version: "2.12.7", description: "Redefined chart library built with React and D3", installed: false, size: "5.1 MB" },
  { name: "socket.io-client", version: "4.8.1",  description: "Realtime application framework (client)", installed: false, size: "3.7 MB" },
  { name: "express",          version: "5.0.0",  description: "Fast, unopinionated, minimalist web framework", installed: false, size: "1.2 MB", tag: "Popular" },
  { name: "drizzle-orm",      version: "0.45.0", description: "TypeScript ORM for PostgreSQL, MySQL, and SQLite", installed: false, size: "2.1 MB" },
];

const NIX_PACKAGES: Pkg[] = [
  { name: "nodejs_24",   version: "24.0.0",  description: "JavaScript runtime environment", installed: true },
  { name: "pnpm",        version: "10.11.0", description: "Fast, disk space efficient package manager", installed: true },
  { name: "git",         version: "2.47.0",  description: "Distributed version control system", installed: true },
  { name: "postgresql",  version: "16.4",    description: "Advanced open-source relational database", installed: true },
  { name: "python311",   version: "3.11.9",  description: "The Python programming language", installed: false, tag: "Popular" },
  { name: "rustc",       version: "1.81.0",  description: "A language empowering everyone to build reliable software", installed: false },
  { name: "go_1_23",     version: "1.23.0",  description: "The Go programming language", installed: false },
  { name: "jdk21",       version: "21.0.4",  description: "Open Java Development Kit 21", installed: false },
  { name: "ffmpeg",      version: "7.0.2",   description: "Record, convert and stream audio and video", installed: false },
  { name: "redis",       version: "7.4.0",   description: "In-memory data structure store", installed: false, tag: "Popular" },
  { name: "curl",        version: "8.11.0",  description: "Command line tool for transferring data with URLs", installed: true },
  { name: "sqlite",      version: "3.47.0",  description: "Self-contained, serverless, zero-configuration SQL database", installed: false },
];

interface PackageManagerProps {
  projectId?: number;
}

interface LogLine {
  text: string;
  type: "info" | "stdout" | "stderr" | "success" | "error";
}

export function PackageManager({ projectId }: PackageManagerProps) {
  const [tab, setTab]               = useState<"npm" | "nix">("npm");
  const [search, setSearch]         = useState("");
  const [pkgs, setPkgs]             = useState(NPM_PACKAGES);
  const [nixPkgs, setNixPkgs]       = useState(NIX_PACKAGES);
  const [installing, setInstalling] = useState<string | null>(null);
  const [logs, setLogs]             = useState<LogLine[]>([]);
  const [customPkg, setCustomPkg]   = useState("");
  const logsEndRef = useRef<HTMLDivElement>(null);

  const list = tab === "npm" ? pkgs : nixPkgs;
  const filtered = list.filter(p =>
    !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.description.toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  const installReal = async (name: string) => {
    if (!projectId) {
      // Fallback: simulate if no project ID
      setInstalling(name);
      setLogs([{ text: `$ npm install ${name}`, type: "info" }, { text: "Resolving packages…", type: "stdout" }]);
      await new Promise(r => setTimeout(r, 600));
      setLogs(p => [...p, { text: `Downloading ${name}…`, type: "stdout" }]);
      await new Promise(r => setTimeout(r, 800));
      setLogs(p => [...p, { text: `✓ Successfully installed ${name}`, type: "success" }]);
      if (tab === "npm") setPkgs(p => p.map(x => x.name === name ? { ...x, installed: true } : x));
      else setNixPkgs(p => p.map(x => x.name === name ? { ...x, installed: true } : x));
      setInstalling(null);
      return;
    }

    setInstalling(name);
    setLogs([]);

    try {
      const res = await fetch(`/api/projects/${projectId}/install`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ packages: [name], manager: tab === "npm" ? "npm" : "pip" }),
      });

      if (!res.body) throw new Error("No response body");
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data:")) continue;
          try {
            const event = JSON.parse(line.slice(5).trim()) as { type: string; data: string };
            setLogs(p => [...p, { text: event.data, type: event.type as LogLine["type"] }]);
            if (event.type === "success") {
              if (tab === "npm") setPkgs(p => p.map(x => x.name === name ? { ...x, installed: true } : x));
              else setNixPkgs(p => p.map(x => x.name === name ? { ...x, installed: true } : x));
            }
          } catch { /**/ }
        }
      }
    } catch (e) {
      setLogs(p => [...p, { text: `Error: ${e instanceof Error ? e.message : "Unknown error"}`, type: "error" }]);
    } finally {
      setInstalling(null);
    }
  };

  const installCustom = () => {
    const name = customPkg.trim();
    if (!name) return;
    setCustomPkg("");
    installReal(name);
  };

  const uninstall = (name: string) => {
    if (tab === "npm") setPkgs(p => p.map(x => x.name === name ? { ...x, installed: false } : x));
    else setNixPkgs(p => p.map(x => x.name === name ? { ...x, installed: false } : x));
    setLogs([{ text: `$ npm remove ${name}`, type: "info" }, { text: `✓ Removed ${name}`, type: "success" }]);
  };

  return (
    <div className="flex flex-col h-full bg-[#0d1117] text-[#e6edf3]">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-[#21262d] bg-[#161b22] shrink-0">
        <Package className="h-4 w-4 text-[#f2cc60]" />
        <span className="text-xs font-semibold flex-1">Package Manager</span>
        <span className="text-[10px] text-[#484f58]">{list.filter(p => p.installed).length} installed</span>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 px-2 py-1.5 border-b border-[#21262d] shrink-0">
        {(["npm", "nix"] as const).map(t => (
          <button key={t} onClick={() => { setTab(t); setSearch(""); }}
            className={`flex items-center gap-1.5 px-3 py-1 rounded text-[11px] font-medium transition-colors ${tab === t ? "bg-[#21262d] text-[#e6edf3]" : "text-[#8b949e] hover:text-[#e6edf3]"}`}>
            {t === "npm" ? <Box className="h-3 w-3" /> : <Terminal className="h-3 w-3" />}
            {t === "npm" ? "npm / pnpm" : "Nix Packages"}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="px-2 py-1.5 border-b border-[#21262d] shrink-0">
        <div className="flex items-center gap-2 bg-[#21262d] border border-[#30363d] rounded-lg px-2 py-1.5">
          <Search className="h-3 w-3 text-[#484f58] shrink-0" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder={`Search ${tab === "npm" ? "npm" : "Nix"} packages…`}
            className="flex-1 bg-transparent text-xs text-[#e6edf3] placeholder-[#484f58] outline-none" />
        </div>
      </div>

      {/* Custom install input */}
      {tab === "npm" && (
        <div className="px-2 py-1.5 border-b border-[#21262d] shrink-0">
          <div className="flex items-center gap-1.5">
            <input
              value={customPkg}
              onChange={e => setCustomPkg(e.target.value)}
              onKeyDown={e => e.key === "Enter" && installCustom()}
              placeholder="Install any package (e.g. lodash)"
              className="flex-1 bg-[#161b22] border border-[#30363d] rounded-lg px-2 py-1.5 text-xs text-[#e6edf3] placeholder-[#484f58] outline-none focus:border-[#58a6ff] transition-colors"
            />
            <button
              onClick={installCustom}
              disabled={!customPkg.trim() || !!installing}
              className="flex items-center gap-1 px-2 py-1.5 rounded-lg bg-[#238636] text-white text-[10px] font-medium hover:bg-[#2ea043] disabled:opacity-40 transition-colors"
            >
              {installing ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />}
              Install
            </button>
          </div>
        </div>
      )}

      {/* Package list */}
      <div className="flex-1 overflow-y-auto">
        {filtered.map(pkg => (
          <div key={pkg.name} className="flex items-start gap-3 px-3 py-2.5 border-b border-[#21262d]/50 hover:bg-[#161b22] transition-colors">
            <div className="h-7 w-7 rounded bg-[#21262d] flex items-center justify-center shrink-0 mt-0.5">
              {tab === "npm" ? <Box className="h-3.5 w-3.5 text-[#f2cc60]" /> : <Terminal className="h-3.5 w-3.5 text-[#58a6ff]" />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-[12px] font-medium text-[#e6edf3] truncate">{pkg.name}</span>
                <span className="text-[9px] text-[#484f58]">v{pkg.version}</span>
                {pkg.tag && (
                  <span className="text-[9px] px-1 py-0.5 rounded bg-[#1f6feb]/20 text-[#58a6ff] border border-[#1f6feb]/20">{pkg.tag}</span>
                )}
              </div>
              <p className="text-[10px] text-[#8b949e] truncate">{pkg.description}</p>
              {pkg.size && <p className="text-[9px] text-[#484f58] mt-0.5">{pkg.size}</p>}
            </div>
            <div className="shrink-0">
              {pkg.installed ? (
                <button onClick={() => uninstall(pkg.name)}
                  className="flex items-center gap-1 text-[10px] px-2 py-1 rounded border border-green-500/30 text-green-400 hover:border-[#f85149]/30 hover:text-[#f85149] hover:bg-[#f85149]/5 transition-all group">
                  <Check className="h-2.5 w-2.5 group-hover:hidden" />
                  <X className="h-2.5 w-2.5 hidden group-hover:block" />
                  <span className="group-hover:hidden">Installed</span>
                  <span className="hidden group-hover:block">Remove</span>
                </button>
              ) : (
                <button onClick={() => installReal(pkg.name)}
                  disabled={installing === pkg.name}
                  className="flex items-center gap-1 text-[10px] px-2 py-1 rounded border border-[#30363d] text-[#8b949e] hover:text-[#e6edf3] hover:bg-[#21262d] hover:border-[#484f58] transition-colors disabled:opacity-50">
                  {installing === pkg.name ? <Loader2 className="h-2.5 w-2.5 animate-spin" /> : <Plus className="h-2.5 w-2.5" />}
                  {installing === pkg.name ? "Installing…" : "Install"}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Install log */}
      {logs.length > 0 && (
        <div className="border-t border-[#21262d] bg-[#0d1117] p-2 max-h-28 overflow-y-auto shrink-0">
          {logs.map((l, i) => (
            <p key={i} className={`font-mono text-[10px] leading-relaxed ${
              l.type === "success" ? "text-[#3fb950]"
              : l.type === "error" ? "text-[#f85149]"
              : l.type === "stderr" ? "text-[#e3b341]"
              : l.text.startsWith("$") ? "text-[#8b949e]"
              : "text-[#484f58]"
            }`}>{l.text}</p>
          ))}
          <div ref={logsEndRef} />
        </div>
      )}
    </div>
  );
}
