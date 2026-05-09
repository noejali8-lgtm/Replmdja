import { useState } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Copy, Check, Terminal, Package, Cpu, Zap,
  ChevronRight, Bot, Shield, Brain, Network, Database,
  Code2, TestTube2, Settings, BookOpen, Star, Globe,
  Download, Server, Layers, Sparkles, GitBranch, Activity,
  ExternalLink
} from "lucide-react";
import { cn } from "@/lib/utils";

const ALL_PLUGINS = [
  { id: "ruflo-core", name: "Core", desc: "Agent lifecycle, spawn, memory, hooks", icon: "⚙️", color: "text-purple-400 bg-purple-500/10" },
  { id: "ruflo-swarm", name: "Swarm", desc: "Multi-agent swarm coordination & topologies", icon: "🐝", color: "text-amber-400 bg-amber-500/10" },
  { id: "ruflo-autopilot", name: "Autopilot", desc: "Autonomous goal-driven task execution", icon: "🚀", color: "text-blue-400 bg-blue-500/10" },
  { id: "ruflo-federation", name: "Federation", desc: "Cross-network agent federation", icon: "🌐", color: "text-teal-400 bg-teal-500/10" },
  { id: "ruflo-memory", name: "Memory", desc: "HNSW vector memory & knowledge graphs", icon: "🧠", color: "text-violet-400 bg-violet-500/10" },
  { id: "ruflo-security", name: "Security", desc: "CVE scanning, auth audit, hardening", icon: "🛡️", color: "text-red-400 bg-red-500/10" },
  { id: "ruflo-coder", name: "Coder", desc: "AI code generation, refactor & debug", icon: "💻", color: "text-blue-400 bg-blue-500/10" },
  { id: "ruflo-tester", name: "Tester", desc: "Unit, integration & e2e test generation", icon: "🧪", color: "text-yellow-400 bg-yellow-500/10" },
  { id: "ruflo-docs", name: "Docs", desc: "OpenAPI, markdown & inline doc generation", icon: "📚", color: "text-purple-400 bg-purple-500/10" },
  { id: "ruflo-devops", name: "DevOps", desc: "CI/CD, GitHub Actions, releases", icon: "🔄", color: "text-sky-400 bg-sky-500/10" },
  { id: "ruflo-goap", name: "GOAP", desc: "Goal-oriented action planning engine", icon: "🎯", color: "text-green-400 bg-green-500/10" },
  { id: "ruflo-mcp", name: "MCP", desc: "Model Context Protocol server & client", icon: "🔌", color: "text-orange-400 bg-orange-500/10" },
  { id: "ruflo-workers", name: "Workers", desc: "Background worker task scheduling", icon: "⚙️", color: "text-slate-400 bg-slate-500/10" },
  { id: "ruflo-plugins", name: "Plugins", desc: "Plugin marketplace & hot-swap runtime", icon: "🧩", color: "text-pink-400 bg-pink-500/10" },
  { id: "ruflo-providers", name: "Providers", desc: "60+ AI model provider integrations", icon: "🤖", color: "text-cyan-400 bg-cyan-500/10" },
  { id: "ruflo-github", name: "GitHub", desc: "PR reviews, issue triage, repo ops", icon: "🐙", color: "text-gray-300 bg-gray-500/10" },
  { id: "ruflo-neural", name: "Neural", desc: "SONA/SAFLA self-learning neural patterns", icon: "🌀", color: "text-fuchsia-400 bg-fuchsia-500/10" },
  { id: "ruflo-performance", name: "Performance", desc: "Profiling, benchmarking, optimization", icon: "⚡", color: "text-yellow-400 bg-yellow-500/10" },
  { id: "ruflo-architect", name: "Architect", desc: "System design, migration, repo structure", icon: "🏗️", color: "text-indigo-400 bg-indigo-500/10" },
  { id: "ruflo-ml", name: "ML", desc: "ML pipelines, neural net design & inference", icon: "🧬", color: "text-pink-400 bg-pink-500/10" },
  { id: "ruflo-monitoring", name: "Monitoring", desc: "Real-time metrics, alerts, dashboards", icon: "📡", color: "text-lime-400 bg-lime-500/10" },
  { id: "ruflo-consensus", name: "Consensus", desc: "Raft, CRDT, quorum & voting protocols", icon: "🗳️", color: "text-emerald-400 bg-emerald-500/10" },
  { id: "ruflo-sparc", name: "SPARC", desc: "SPARC specification-driven development", icon: "✨", color: "text-amber-400 bg-amber-500/10" },
  { id: "ruflo-mobile", name: "Mobile", desc: "React Native & app store agent flows", icon: "📱", color: "text-blue-400 bg-blue-500/10" },
  { id: "ruflo-finance", name: "Finance", desc: "Market prediction & financial analysis", icon: "📈", color: "text-green-400 bg-green-500/10" },
  { id: "ruflo-gamification", name: "Gamify", desc: "Challenges, assessments, leaderboards", icon: "🏅", color: "text-yellow-400 bg-yellow-500/10" },
  { id: "ruflo-stream", name: "Stream", desc: "Streaming pipelines & chain operations", icon: "🌊", color: "text-cyan-400 bg-cyan-500/10" },
  { id: "ruflo-agentdb", name: "AgentDB", desc: "Vector DB, semantic search, RAG", icon: "🗄️", color: "text-violet-400 bg-violet-500/10" },
  { id: "ruflo-tdd", name: "TDD", desc: "Test-driven development swarm patterns", icon: "🔬", color: "text-yellow-400 bg-yellow-500/10" },
  { id: "ruflo-meta", name: "Meta", desc: "Agents that create & manage other agents", icon: "🤖", color: "text-orange-300 bg-orange-500/10" },
  { id: "ruflo-hooks", name: "Hooks", desc: "Git hooks & event-driven automation", icon: "🪝", color: "text-emerald-400 bg-emerald-500/10" },
  { id: "ruflo-pairs", name: "Pairs", desc: "AI pair programming & collaboration", icon: "👥", color: "text-blue-400 bg-blue-500/10" },
];

const PATH_A_COMMANDS = [
  "# Add the marketplace",
  "/plugin marketplace add ruvnet/ruflo",
  "",
  "# Install core + any plugins you need",
  "/plugin install ruflo-core@ruflo",
  "/plugin install ruflo-swarm@ruflo",
  "/plugin install ruflo-autopilot@ruflo",
  "/plugin install ruflo-federation@ruflo",
];

const PATH_B_COMMANDS = [
  "# One-line install",
  "curl -fsSL https://cdn.jsdelivr.net/gh/ruvnet/ruflo@main/scripts/install.sh | bash",
  "",
  "# Or via npx (interactive setup)",
  "npx ruflo@latest init wizard",
  "",
  "# Or install globally",
  "npm install -g ruflo@latest",
  "",
  "# Register MCP server in Claude Code",
  "claude mcp add ruflo -- npx ruflo@latest mcp start",
];

const PATH_A_FEATURES = ["Slash commands", "Agent definitions per-plugin", "Zero workspace files"];
const PATH_B_FEATURES = ["98 agents", "60+ commands", "30 skills", "MCP server", "Hooks + daemon", ".claude/ + .claude-flow/ setup"];

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => {
        navigator.clipboard?.writeText(text).catch(() => {});
        setCopied(true);
        setTimeout(() => setCopied(false), 1800);
      }}
      className={cn(
        "flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium transition-all shrink-0",
        copied
          ? "bg-green-500/20 border border-green-400/30 text-green-300"
          : "bg-white/5 border border-white/10 text-white/40 hover:text-white hover:bg-white/10"
      )}
    >
      {copied ? <Check size={10} /> : <Copy size={10} />}
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

function CodeBlock({ lines }: { lines: string[] }) {
  const full = lines.filter(l => !l.startsWith("#") && l.trim()).join("\n");
  return (
    <div className="relative bg-[#0a0e14] border border-white/[0.07] rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 border-b border-white/[0.06] bg-[#0d1117]">
        <div className="flex gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500/50" />
          <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/50" />
          <span className="w-2.5 h-2.5 rounded-full bg-green-500/50" />
        </div>
        <CopyButton text={full} />
      </div>
      <div className="p-3 font-mono text-[11px] leading-relaxed space-y-0.5">
        {lines.map((line, i) => (
          <div key={i} className={cn(
            "leading-relaxed",
            line.startsWith("#") ? "text-white/25" : line === "" ? "h-2" : "text-green-300"
          )}>
            {line !== "" && (
              <>
                {!line.startsWith("#") && <span className="text-white/20 mr-2">$</span>}
                {line}
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

type PathTab = "A" | "B";

export default function RufloInstallPage() {
  const [, navigate] = useLocation();
  const [pathTab, setPathTab] = useState<PathTab>("B");
  const [installedPlugins, setInstalledPlugins] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");

  const filteredPlugins = ALL_PLUGINS.filter(p =>
    !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.desc.toLowerCase().includes(search.toLowerCase())
  );

  function togglePlugin(id: string) {
    setInstalledPlugins(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  const pluginInstallCmds = [
    "/plugin marketplace add ruvnet/ruflo",
    ...Array.from(installedPlugins).map(id => `/plugin install ${id}@ruflo`),
  ];

  return (
    <div className="min-h-screen bg-[#0d1117] text-white flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-[#0d1117]/95 backdrop-blur border-b border-white/[0.08] px-4 pt-safe">
        <div className="flex items-center gap-3 py-3">
          <button
            onClick={() => navigate("/")}
            className="p-1.5 rounded-lg hover:bg-white/5 text-white/60 hover:text-white transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="flex items-center gap-2 flex-1">
            <span className="text-lg">🦊</span>
            <span className="font-semibold">Ruflo</span>
            <span className="text-[10px] font-mono bg-purple-500/20 text-purple-300 border border-purple-400/20 px-2 py-0.5 rounded-full ml-auto">
              QUICK START
            </span>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pb-24 px-4 pt-4 space-y-5">

        {/* Hero */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="bg-gradient-to-br from-purple-500/10 via-[#161b22] to-[#161b22] border border-purple-400/20 rounded-2xl p-5">
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 rounded-2xl bg-purple-500/20 border border-purple-400/30 flex items-center justify-center text-2xl shrink-0">
                🦊
              </div>
              <div>
                <h1 className="text-lg font-bold text-white">Ruflo Agent System</h1>
                <p className="text-[12px] text-white/50 mt-1 leading-relaxed">
                  98 specialist agents · 60+ commands · 30 skills · MCP server · hooks daemon
                </p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 mt-4">
              {[
                { icon: Bot, label: "98 Agents", color: "text-purple-400" },
                { icon: Terminal, label: "60+ Commands", color: "text-green-400" },
                { icon: Server, label: "MCP Server", color: "text-blue-400" },
              ].map(({ icon: Icon, label, color }) => (
                <div key={label} className="bg-white/5 rounded-xl p-2.5 text-center">
                  <Icon size={16} className={cn("mx-auto mb-1", color)} />
                  <div className="text-[10px] text-white/60 font-medium">{label}</div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Path selector */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <h2 className="text-[12px] font-semibold text-white/50 uppercase tracking-wider mb-3">Choose install path</h2>
          <div className="grid grid-cols-2 gap-2">
            {(["A", "B"] as PathTab[]).map(path => (
              <button
                key={path}
                onClick={() => setPathTab(path)}
                className={cn(
                  "p-3 rounded-xl border text-left transition-all",
                  pathTab === path
                    ? path === "A"
                      ? "bg-blue-500/10 border-blue-400/40 text-blue-300"
                      : "bg-purple-500/10 border-purple-400/40 text-purple-300"
                    : "bg-[#161b22] border-white/[0.06] text-white/40 hover:text-white/70"
                )}
              >
                <div className="text-[10px] font-bold uppercase tracking-widest mb-1">
                  Path {path}
                </div>
                <div className="text-[12px] font-semibold">
                  {path === "A" ? "Claude Code Plugins" : "Full CLI Install"}
                </div>
                <div className="text-[10px] mt-1 opacity-70">
                  {path === "A" ? "Lite · Slash commands only" : "Production · Everything works"}
                </div>
              </button>
            ))}
          </div>
        </motion.div>

        {/* Path A */}
        <AnimatePresence mode="wait">
          {pathTab === "A" && (
            <motion.div key="path-a" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
              <div className="bg-blue-500/5 border border-blue-400/20 rounded-xl p-3">
                <div className="flex items-start gap-2 mb-2">
                  <Package size={14} className="text-blue-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[12px] font-semibold text-blue-300">Claude Code Plugins (Lite)</p>
                    <p className="text-[11px] text-white/40 mt-0.5">Adds slash commands + agent definitions. No MCP server registered.</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {PATH_A_FEATURES.map(f => (
                    <span key={f} className="text-[9px] bg-blue-500/10 border border-blue-400/20 text-blue-300 px-2 py-0.5 rounded-full">{f}</span>
                  ))}
                </div>
              </div>

              <CodeBlock lines={PATH_A_COMMANDS} />

              {/* Plugin picker */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-[12px] font-semibold text-white/60">All 32 Plugins</h3>
                  {installedPlugins.size > 0 && (
                    <span className="text-[10px] text-purple-300 bg-purple-500/10 border border-purple-400/20 px-2 py-0.5 rounded-full">
                      {installedPlugins.size} selected
                    </span>
                  )}
                </div>
                <div className="relative mb-2">
                  <input
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Filter plugins..."
                    className="w-full bg-[#161b22] border border-white/[0.06] rounded-lg py-2 pl-3 pr-3 text-[12px] placeholder:text-white/25 focus:outline-none focus:border-purple-500/40"
                  />
                </div>
                <div className="space-y-1.5 max-h-80 overflow-y-auto">
                  {filteredPlugins.map(plugin => {
                    const installed = installedPlugins.has(plugin.id);
                    return (
                      <button
                        key={plugin.id}
                        onClick={() => togglePlugin(plugin.id)}
                        className={cn(
                          "w-full flex items-center gap-3 p-2.5 rounded-xl border transition-all text-left",
                          installed
                            ? "bg-purple-500/10 border-purple-400/30"
                            : "bg-[#161b22] border-white/[0.06] hover:border-white/[0.12]"
                        )}
                      >
                        <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center text-sm shrink-0", plugin.color.split(" ")[1])}>
                          {plugin.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-[12px] font-medium truncate">{plugin.name}</div>
                          <div className="text-[10px] text-white/40 truncate">{plugin.desc}</div>
                        </div>
                        <div className={cn(
                          "w-4 h-4 rounded border shrink-0 flex items-center justify-center transition-all",
                          installed ? "bg-purple-500 border-purple-400" : "border-white/20"
                        )}>
                          {installed && <Check size={9} className="text-white" />}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {installedPlugins.size > 0 && (
                  <div className="mt-3">
                    <p className="text-[11px] text-white/40 mb-2">Install selected plugins:</p>
                    <CodeBlock lines={pluginInstallCmds} />
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* Path B */}
          {pathTab === "B" && (
            <motion.div key="path-b" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
              <div className="bg-purple-500/5 border border-purple-400/20 rounded-xl p-3">
                <div className="flex items-start gap-2 mb-2">
                  <Zap size={14} className="text-purple-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[12px] font-semibold text-purple-300">Full CLI Install (Production)</p>
                    <p className="text-[11px] text-white/40 mt-0.5">Full Ruflo loop. Everything works as documented.</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {PATH_B_FEATURES.map(f => (
                    <span key={f} className="text-[9px] bg-purple-500/10 border border-purple-400/20 text-purple-300 px-2 py-0.5 rounded-full">{f}</span>
                  ))}
                </div>
              </div>

              <CodeBlock lines={PATH_B_COMMANDS} />

              {/* What you get */}
              <div className="bg-[#161b22] border border-white/[0.06] rounded-xl p-4 space-y-3">
                <h3 className="text-[12px] font-semibold text-white/60">What Path B installs</h3>
                {[
                  { icon: "📁", label: ".claude/", desc: "Claude settings, slash commands, agent hooks" },
                  { icon: "🌀", label: ".claude-flow/", desc: "98 agent definitions, swarm configs, memory" },
                  { icon: "📋", label: "CLAUDE.md", desc: "Project context injected into every session" },
                  { icon: "🔌", label: "MCP Server", desc: "memory_store, swarm_init, agent_spawn registered" },
                  { icon: "🪝", label: "Hooks", desc: "Pre/post tool call hooks for agent orchestration" },
                  { icon: "👾", label: "Daemon", desc: "Background agent daemon for persistent tasks" },
                ].map(item => (
                  <div key={item.label} className="flex items-start gap-2.5">
                    <span className="text-base shrink-0">{item.icon}</span>
                    <div>
                      <span className="text-[12px] font-mono font-semibold text-white/80">{item.label}</span>
                      <p className="text-[10px] text-white/40 mt-0.5">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Comparison table */}
              <div className="bg-[#161b22] border border-white/[0.06] rounded-xl overflow-hidden">
                <div className="grid grid-cols-3 bg-[#0d1117] text-[10px] font-semibold text-white/40 uppercase tracking-wider">
                  <div className="px-3 py-2">Feature</div>
                  <div className="px-3 py-2 text-center border-l border-white/[0.06]">Path A</div>
                  <div className="px-3 py-2 text-center border-l border-white/[0.06]">Path B</div>
                </div>
                {[
                  ["Slash commands", true, true],
                  ["Agent definitions", true, true],
                  ["MCP server", false, true],
                  ["Memory tools", false, true],
                  ["Hooks installed", false, true],
                  ["Daemon", false, true],
                  ["30 skills", false, true],
                  ["60+ commands", false, true],
                  ["Workspace files", false, true],
                ].map(([label, a, b]) => (
                  <div key={label as string} className="grid grid-cols-3 border-t border-white/[0.05]">
                    <div className="px-3 py-2 text-[11px] text-white/60">{label as string}</div>
                    <div className="px-3 py-2 text-center border-l border-white/[0.05]">
                      {a ? <Check size={12} className="text-blue-400 mx-auto" /> : <span className="text-white/15 text-[12px]">—</span>}
                    </div>
                    <div className="px-3 py-2 text-center border-l border-white/[0.05]">
                      {b ? <Check size={12} className="text-purple-400 mx-auto" /> : <span className="text-white/15 text-[12px]">—</span>}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* All plugins grid */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <h2 className="text-[12px] font-semibold text-white/50 uppercase tracking-wider mb-3">All 32 Plugins</h2>
          <div className="grid grid-cols-2 gap-2">
            {ALL_PLUGINS.map(plugin => (
              <div key={plugin.id} className="bg-[#161b22] border border-white/[0.06] rounded-xl p-3 flex items-start gap-2.5">
                <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center text-sm shrink-0 mt-0.5", plugin.color.split(" ")[1])}>
                  {plugin.icon}
                </div>
                <div className="min-w-0">
                  <div className={cn("text-[11px] font-semibold", plugin.color.split(" ")[0])}>{plugin.name}</div>
                  <div className="text-[9px] text-white/35 mt-0.5 leading-relaxed line-clamp-2">{plugin.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* NPX link */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <div className="bg-[#161b22] border border-white/[0.06] rounded-xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-green-500/10 border border-green-400/20 flex items-center justify-center shrink-0">
              <Terminal size={18} className="text-green-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-semibold">Interactive wizard</p>
              <p className="text-[10px] text-white/40 font-mono mt-0.5 truncate">npx ruflo@latest init wizard</p>
            </div>
            <CopyButton text="npx ruflo@latest init wizard" />
          </div>
        </motion.div>

      </div>
    </div>
  );
}
