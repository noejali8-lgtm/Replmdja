import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "wouter";
import {
  X, Bot, Network, Database, Settings, Package, Cpu,
  Shield, Globe, Target, Plug, ChevronRight, ChevronLeft,
  Sparkles, Zap, Brain, Star, Lock, Layers
} from "lucide-react";
import { cn } from "@/lib/utils";

interface CapabilitiesTourProps {
  onClose: () => void;
}

const SLIDES = [
  {
    id: "welcome",
    icon: Sparkles,
    color: "text-purple-400",
    bg: "bg-purple-500/10",
    border: "border-purple-400/20",
    title: "Welcome to RuFlo",
    subtitle: "The Autonomous Agent Operating System",
    description: "RuFlo brings 100+ specialized AI agents, swarm intelligence, self-learning memory, and enterprise security — all in one unified platform.",
    features: ["100+ Specialized Agents", "Swarm Coordination", "HNSW Vector Memory", "AIDefence Security"],
    route: null,
  },
  {
    id: "agents",
    icon: Bot,
    color: "text-purple-400",
    bg: "bg-purple-500/10",
    border: "border-purple-400/20",
    title: "100+ Specialized Agents",
    subtitle: "Agent Catalog & Live Execution",
    description: "Spawn any of 100+ pre-built specialist agents — from code review to ML model design. Each agent has defined capabilities and can execute tasks via Claude with real-time streaming output.",
    features: ["Development & Code Agents", "Security & Testing Agents", "Swarm Coordination Agents", "Self-Learning SONA Agents"],
    route: "/agents",
    cta: "Open Agent System",
  },
  {
    id: "swarm",
    icon: Network,
    color: "text-amber-400",
    bg: "bg-amber-500/10",
    border: "border-amber-400/20",
    title: "Swarm Coordination",
    subtitle: "Hierarchical · Mesh · Adaptive",
    description: "Coordinate multiple agents as a team. Choose hierarchical (tree), mesh (peer-to-peer), or adaptive (self-optimizing) topology. Agents achieve consensus via distributed voting.",
    features: ["3 Swarm Topologies", "Consensus Voting", "Real-time SSE Coordination", "Byzantine Fault Tolerance"],
    route: "/swarm",
    cta: "Open Swarm",
  },
  {
    id: "memory",
    icon: Database,
    color: "text-violet-400",
    bg: "bg-violet-500/10",
    border: "border-violet-400/20",
    title: "AgentDB Vector Memory",
    subtitle: "HNSW-Indexed · SONA Learning",
    description: "Store, search, and recall agent memories using HNSW-indexed cosine similarity search. The ReasoningBank learns from successful patterns, and SONA trajectories improve future performance.",
    features: ["HNSW Vector Search", "ReasoningBank Patterns", "SONA Trajectory Learning", "AI Memory Recall"],
    route: "/memory",
    cta: "Open AgentDB",
  },
  {
    id: "workers",
    icon: Settings,
    color: "text-sky-400",
    bg: "bg-sky-500/10",
    border: "border-sky-400/20",
    title: "12 Background Workers",
    subtitle: "Scheduled · Automated · Monitored",
    description: "12 specialized background workers run on cron schedules — security audits, CVE scanning, memory consolidation, swarm health monitoring, trajectory learning, and more.",
    features: ["Security Audit Worker", "CVE Scanner", "Memory Consolidator", "SONA Trajectory Learner"],
    route: "/workers",
    cta: "Open Workers",
  },
  {
    id: "plugins",
    icon: Package,
    color: "text-pink-400",
    bg: "bg-pink-500/10",
    border: "border-pink-400/20",
    title: "Plugin Marketplace",
    subtitle: "32 Native + 21 npm Plugins",
    description: "Extend RuFlo with 53 plugins across 12 categories. Native plugins like RuVector, AgentDB, and AIDefence are built-in. npm plugins add LangChain, Playwright, FastAPI, and more.",
    features: ["32 Native Plugins", "21 npm Packages", "12 Categories", "One-Click Install"],
    route: "/plugins",
    cta: "Open Marketplace",
  },
  {
    id: "providers",
    icon: Cpu,
    color: "text-cyan-400",
    bg: "bg-cyan-500/10",
    border: "border-cyan-400/20",
    title: "Multi-Provider AI Routing",
    subtitle: "8 Providers · 7 Routing Strategies",
    description: "Smart routing across 8 AI providers — Anthropic, OpenAI, Google, Mistral, Cohere, Ollama, and RuvLLM. Choose from 7 strategies: Smart, Cost, Quality, Speed, Local-First, Round-Robin, or Cascade.",
    features: ["8 AI Providers", "Smart Auto-Routing", "Model Benchmarking", "Local Privacy Mode"],
    route: "/providers",
    cta: "Open Providers",
  },
  {
    id: "security",
    icon: Shield,
    color: "text-red-400",
    bg: "bg-red-500/10",
    border: "border-red-400/20",
    title: "AIDefence Security",
    subtitle: "CVE Scanning · Prompt Injection Prevention",
    description: "Enterprise-grade security with AIDefence prompt injection detection (18 patterns), CVE scanning, code vulnerability analysis, and real-time risk scoring with grade-based assessment.",
    features: ["Prompt Injection Detection", "CVE Vulnerability DB", "Code Security Scan", "Real-time Risk Score"],
    route: "/security",
    cta: "Open Security",
  },
  {
    id: "federation",
    icon: Globe,
    color: "text-blue-400",
    bg: "bg-blue-500/10",
    border: "border-blue-400/20",
    title: "Agent Federation",
    subtitle: "Zero-Trust · Multi-Region · Encrypted",
    description: "Connect agents across multiple machines and regions via zero-trust mTLS federation. Delegate tasks to remote nodes, broadcast messages, and monitor node health in real time.",
    features: ["Zero-Trust mTLS", "Multi-Region Nodes", "Encrypted Messaging", "Remote Task Delegation"],
    route: "/federation",
    cta: "Open Federation",
  },
  {
    id: "goap",
    icon: Target,
    color: "text-indigo-400",
    bg: "bg-indigo-500/10",
    border: "border-indigo-400/20",
    title: "GOAP A* Goal Planner",
    subtitle: "Goal-Oriented Action Planning",
    description: "Convert plain-English goals into detailed, executable multi-agent plans using the A* algorithm. Decompose complex goals into hierarchical sub-goals with agent assignments and time estimates.",
    features: ["A* Path Planning", "Hierarchical Goal Trees", "8 Goal Templates", "Agent Assignment"],
    route: "/goap",
    cta: "Open Goal Planner",
  },
  {
    id: "mcp",
    icon: Plug,
    color: "text-teal-400",
    bg: "bg-teal-500/10",
    border: "border-teal-400/20",
    title: "MCP Server Management",
    subtitle: "18 Built-in Tools + External Servers",
    description: "Manage Model Context Protocol servers. 18 built-in tools cover memory, agents, swarms, security, planning, and federation. Connect external MCP servers and call their tools directly.",
    features: ["18 Native Tools", "External Server Connect", "Tool Discovery", "Parallel Execution"],
    route: "/mcp",
    cta: "Open MCP",
  },
  {
    id: "ready",
    icon: Star,
    color: "text-yellow-400",
    bg: "bg-yellow-500/10",
    border: "border-yellow-400/20",
    title: "You're Ready to Build",
    subtitle: "The Future of Agentic AI",
    description: "Everything is initialized and ready. Spawn your first agent, create a swarm, or let the GOAP planner generate a full multi-agent plan from your goal.",
    features: ["Start with Agents →", "Create a Swarm →", "Plan a Goal →", "Explore the Marketplace →"],
    route: null,
  },
];

export function CapabilitiesTour({ onClose }: CapabilitiesTourProps) {
  const [, navigate] = useLocation();
  const [slide, setSlide] = useState(0);
  const [direction, setDirection] = useState(1);

  const current = SLIDES[slide];
  const isFirst = slide === 0;
  const isLast = slide === SLIDES.length - 1;

  function goNext() {
    setDirection(1);
    setSlide(s => Math.min(s + 1, SLIDES.length - 1));
  }

  function goPrev() {
    setDirection(-1);
    setSlide(s => Math.max(s - 1, 0));
  }

  function handleCta() {
    if (current.route) {
      onClose();
      navigate(current.route);
    }
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "ArrowRight" || e.key === "ArrowDown") goNext();
      else if (e.key === "ArrowLeft" || e.key === "ArrowUp") goPrev();
      else if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const Icon = current.icon;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-end sm:items-center justify-center p-4"
        onClick={e => e.target === e.currentTarget && onClose()}
      >
        <motion.div
          initial={{ y: 80, opacity: 0, scale: 0.96 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 80, opacity: 0, scale: 0.96 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="w-full max-w-sm bg-[#161b22] border border-white/[0.08] rounded-2xl overflow-hidden"
        >
          <div className="relative overflow-hidden">
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={slide}
                custom={direction}
                initial={{ x: direction * 60, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -direction * 60, opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="p-6"
              >
                <div className="flex items-center justify-between mb-5">
                  <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center", current.bg, `border ${current.border}`)}>
                    <Icon size={22} className={current.color} />
                  </div>
                  <div className="flex items-center gap-1">
                    {SLIDES.map((_, i) => (
                      <button key={i} onClick={() => { setDirection(i > slide ? 1 : -1); setSlide(i); }}
                        className={cn("rounded-full transition-all", i === slide ? `w-4 h-1.5 ${current.color.replace("text-", "bg-")}` : "w-1.5 h-1.5 bg-white/20")} />
                    ))}
                  </div>
                  <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 text-white/40 hover:text-white transition-colors">
                    <X size={16} />
                  </button>
                </div>

                <div className="mb-1">
                  <div className={cn("text-[10px] font-medium uppercase tracking-wider mb-1", current.color)}>{current.subtitle}</div>
                  <h2 className="text-[20px] font-bold text-white leading-tight">{current.title}</h2>
                </div>

                <p className="text-[12px] text-white/55 leading-relaxed mt-2 mb-4">{current.description}</p>

                <div className="grid grid-cols-2 gap-1.5 mb-5">
                  {current.features.map((f, i) => (
                    <div key={i} className={cn("flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg", current.bg, `border ${current.border}`)}>
                      <Sparkles size={9} className={current.color} />
                      <span className="text-[10px] text-white/70">{f}</span>
                    </div>
                  ))}
                </div>

                <div className="text-[10px] text-white/20 text-right">{slide + 1} / {SLIDES.length}</div>
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="px-6 pb-6 flex gap-2">
            <button onClick={goPrev} disabled={isFirst}
              className="flex items-center gap-1.5 px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-[12px] text-white/50 hover:text-white hover:bg-white/10 disabled:opacity-30 transition-colors">
              <ChevronLeft size={14} />
            </button>

            {current.route ? (
              <button onClick={handleCta}
                className={cn("flex-1 py-2.5 rounded-xl text-[12px] font-medium flex items-center justify-center gap-1.5 transition-colors border", current.bg, current.border, current.color, "hover:opacity-80")}>
                {current.cta} <ChevronRight size={13} />
              </button>
            ) : isLast ? (
              <button onClick={onClose}
                className="flex-1 py-2.5 rounded-xl text-[12px] font-medium bg-gradient-to-r from-purple-600/50 to-blue-600/50 border border-purple-400/30 text-white flex items-center justify-center gap-1.5 hover:from-purple-600/70 hover:to-blue-600/70 transition-all">
                <Star size={13} className="text-yellow-400" /> Start Building
              </button>
            ) : (
              <button onClick={goNext}
                className="flex-1 py-2.5 rounded-xl text-[12px] font-medium bg-white/5 border border-white/10 text-white/70 flex items-center justify-center gap-1.5 hover:bg-white/10 transition-colors">
                Next Feature <ChevronRight size={13} />
              </button>
            )}

            {!isLast && (
              <button onClick={goNext}
                className="flex items-center gap-1.5 px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-[12px] text-white/50 hover:text-white hover:bg-white/10 transition-colors">
                <ChevronRight size={14} />
              </button>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
