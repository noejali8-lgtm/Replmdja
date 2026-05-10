import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "wouter";
import {
  ArrowLeft, Terminal, Download, Copy, Check, ExternalLink,
  MessageSquare, Zap, Shield, Globe, Star, ChevronDown, ChevronRight,
  Package, Code2, Cpu, Network, Layers, Lock, Bot, Webhook
} from "lucide-react";
import { cn } from "@/lib/utils";

const CHANNELS = [
  { name: "Discord", icon: "💬", color: "text-indigo-400", bg: "bg-indigo-500/10 border-indigo-400/20", desc: "Bot integration for Discord servers", status: "stable" },
  { name: "Telegram", icon: "✈️", color: "text-sky-400", bg: "bg-sky-500/10 border-sky-400/20", desc: "Native Telegram bot support", status: "stable" },
  { name: "WhatsApp", icon: "📱", color: "text-green-400", bg: "bg-green-500/10 border-green-400/20", desc: "WhatsApp Business API gateway", status: "beta" },
  { name: "Slack", icon: "⚡", color: "text-yellow-400", bg: "bg-yellow-500/10 border-yellow-400/20", desc: "Slack app with slash commands", status: "stable" },
  { name: "CLI", icon: "⌨️", color: "text-white", bg: "bg-white/5 border-white/10", desc: "Terminal interface for power users", status: "stable" },
  { name: "Web API", icon: "🌐", color: "text-purple-400", bg: "bg-purple-500/10 border-purple-400/20", desc: "REST + SSE streaming API", status: "stable" },
  { name: "MCP", icon: "🔗", color: "text-teal-400", bg: "bg-teal-500/10 border-teal-400/20", desc: "Model Context Protocol support", status: "new" },
  { name: "iMessage", icon: "🍎", color: "text-blue-400", bg: "bg-blue-500/10 border-blue-400/20", desc: "Apple Messages relay", status: "beta" },
];

const FEATURES = [
  { icon: <Bot size={16} />, title: "Multi-Model Routing", desc: "Route queries to GPT-4, Claude, Gemini, LLaMA, and 60+ models. Switch models per-channel.", color: "text-purple-400", bg: "bg-purple-500/10 border-purple-400/20" },
  { icon: <Network size={16} />, title: "Multi-Channel Gateway", desc: "One gateway, all platforms. Discord, Telegram, Slack, WhatsApp, CLI — unified config.", color: "text-blue-400", bg: "bg-blue-500/10 border-blue-400/20" },
  { icon: <Zap size={16} />, title: "Streaming Responses", desc: "Server-Sent Events for real-time token streaming. No waiting for full responses.", color: "text-yellow-400", bg: "bg-yellow-500/10 border-yellow-400/20" },
  { icon: <Lock size={16} />, title: "Self-Hosted & Private", desc: "100% on your infrastructure. No data leaves your server. Full audit trail.", color: "text-green-400", bg: "bg-green-500/10 border-green-400/20" },
  { icon: <Webhook size={16} />, title: "Webhook Support", desc: "Incoming webhooks for external triggers. Integrate with any automation platform.", color: "text-orange-400", bg: "bg-orange-500/10 border-orange-400/20" },
  { icon: <Cpu size={16} />, title: "MCP Protocol", desc: "Model Context Protocol — expose tools, memory, and context to any MCP-compatible AI.", color: "text-teal-400", bg: "bg-teal-500/10 border-teal-400/20" },
  { icon: <Layers size={16} />, title: "Plugin System", desc: "Extensible plugin architecture. Add custom middleware, filters, and response transformers.", color: "text-pink-400", bg: "bg-pink-500/10 border-pink-400/20" },
  { icon: <Shield size={16} />, title: "Rate Limiting & Auth", desc: "Built-in rate limits, API key auth, per-user quotas, and abuse prevention.", color: "text-red-400", bg: "bg-red-500/10 border-red-400/20" },
];

const INSTALL_STEPS = [
  {
    step: 1,
    title: "Run the installer",
    desc: "One-line install script for macOS and Linux",
    code: "curl -fsSL https://openclaw.ai/install.sh | bash",
    lang: "bash",
  },
  {
    step: 2,
    title: "Configure your AI provider",
    desc: "Set your OpenRouter, Anthropic, or OpenAI API key",
    code: `openclaw config set ai.provider openrouter
openclaw config set ai.key sk-or-v1-YOUR_KEY_HERE`,
    lang: "bash",
  },
  {
    step: 3,
    title: "Add a channel",
    desc: "Connect your first messaging platform",
    code: `# Discord
openclaw channel add discord --token BOT_TOKEN

# Telegram
openclaw channel add telegram --token BOT_TOKEN

# Slack
openclaw channel add slack --token xoxb-YOUR_SLACK_TOKEN`,
    lang: "bash",
  },
  {
    step: 4,
    title: "Start the gateway",
    desc: "Launch OpenClaw and start serving requests",
    code: `openclaw start
# 🦞 OpenClaw gateway running on :8080
# ✓ Discord connected
# ✓ Telegram connected`,
    lang: "bash",
  },
];

const DOCKER_COMPOSE = `services:
  openclaw:
    image: ghcr.io/openclaw/openclaw:latest
    ports:
      - "8080:8080"
    environment:
      - OPENROUTER_API_KEY=\${OPENROUTER_API_KEY}
      - DISCORD_TOKEN=\${DISCORD_TOKEN}
    volumes:
      - ./config:/app/config
    restart: unless-stopped`;

function CopyBtn({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => {
        try { navigator.clipboard?.writeText(code); } catch { /* noop */ }
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
      className={cn(
        "flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-medium border transition-all",
        copied
          ? "bg-green-500/15 border-green-400/30 text-green-300"
          : "bg-white/5 border-white/10 text-white/40 hover:text-white/70 hover:bg-white/8"
      )}
    >
      {copied ? <Check size={10} /> : <Copy size={10} />}
      {copied ? "Copied!" : "Copy"}
    </button>
  );
}

function CodeBlock({ code, lang = "bash" }: { code: string; lang?: string }) {
  return (
    <div className="relative bg-[#0d1117] border border-white/[0.08] rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-white/[0.05]">
        <span className="text-[10px] text-white/30 font-mono">{lang}</span>
        <CopyBtn code={code} />
      </div>
      <pre className="px-4 py-3 text-xs text-green-300/90 font-mono leading-relaxed overflow-x-auto no-scrollbar whitespace-pre-wrap break-words">
        {code}
      </pre>
    </div>
  );
}

export default function OpenClawPage() {
  const [, navigate] = useLocation();
  const [expandedStep, setExpandedStep] = useState<number | null>(0);
  const [showDocker, setShowDocker] = useState(false);

  return (
    <div className="min-h-screen bg-[#0d1117] text-white pb-[74px]">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-[#0d1117]/95 backdrop-blur-sm border-b border-white/[0.06]">
        <div className="flex items-center gap-3 px-4 py-3">
          <button onClick={() => navigate("/")} className="w-8 h-8 flex items-center justify-center rounded-xl bg-white/[0.05] hover:bg-white/[0.08] transition-colors">
            <ArrowLeft size={16} className="text-white/60" />
          </button>
          <div className="flex items-center gap-2 flex-1">
            <span className="text-base font-bold text-white">OpenClaw</span>
            <span className="text-[10px] bg-red-500/20 border border-red-400/30 text-red-300 px-2 py-0.5 rounded-full font-bold">AI GATEWAY</span>
          </div>
          <a
            href="https://openclaw.ai"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white/[0.05] border border-white/10 text-xs text-white/60 hover:text-white/90 transition-colors"
          >
            <Globe size={12} />
            openclaw.ai
          </a>
        </div>
      </div>

      <div className="px-4 py-5 space-y-6 pb-20">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-red-500/10 via-orange-500/5 to-transparent border border-red-400/20 rounded-2xl p-5 space-y-3"
        >
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-red-500/15 border border-red-400/20 flex items-center justify-center text-2xl">
              🦞
            </div>
            <div>
              <h1 className="text-lg font-black text-white leading-tight">OpenClaw</h1>
              <p className="text-xs text-red-400/80 font-medium">All your chats, one gateway.</p>
            </div>
          </div>
          <p className="text-sm text-white/60 leading-relaxed">
            A self-hosted AI gateway that connects Discord, Telegram, Slack, WhatsApp, and more to 60+ AI models. Route, transform, and stream AI responses across all your messaging platforms from one server.
          </p>
          <div className="flex flex-wrap gap-2">
            {["Open Source", "Self-Hosted", "Privacy-First", "MCP Ready", "60+ Models"].map(tag => (
              <span key={tag} className="text-[10px] bg-white/5 border border-white/10 text-white/50 px-2 py-0.5 rounded-full">{tag}</span>
            ))}
          </div>
          <div className="flex gap-2">
            <a
              href="https://openclaw.ai"
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-red-500/20 border border-red-400/30 text-red-300 text-sm font-semibold hover:bg-red-500/30 transition-colors"
            >
              <ExternalLink size={14} />
              Visit openclaw.ai
            </a>
            <a
              href="https://github.com/openclaw/openclaw"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white/60 text-sm font-semibold hover:bg-white/8 transition-colors"
            >
              <Star size={14} />
              Star
            </a>
          </div>
        </motion.div>

        {/* Supported Channels */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="space-y-3"
        >
          <p className="text-[11px] font-bold uppercase tracking-widest text-white/30">Supported Channels</p>
          <div className="grid grid-cols-2 gap-2">
            {CHANNELS.map((ch, i) => (
              <motion.div
                key={ch.name}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.05 + i * 0.04 }}
                className={cn("flex items-center gap-2.5 px-3 py-2.5 rounded-xl border", ch.bg)}
              >
                <span className="text-lg shrink-0">{ch.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className={cn("text-xs font-semibold", ch.color)}>{ch.name}</p>
                    <span className={cn(
                      "text-[8px] font-bold px-1 py-0 rounded-full border shrink-0",
                      ch.status === "stable" ? "bg-green-500/20 border-green-400/30 text-green-300" :
                      ch.status === "beta" ? "bg-yellow-500/20 border-yellow-400/30 text-yellow-300" :
                      "bg-blue-500/20 border-blue-400/30 text-blue-300"
                    )}>
                      {ch.status.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-[9px] text-white/35 leading-tight">{ch.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Quick Install */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-3"
        >
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-bold uppercase tracking-widest text-white/30">Quick Install</p>
            <button
              onClick={() => setShowDocker(v => !v)}
              className={cn(
                "flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-medium border transition-all",
                showDocker
                  ? "bg-blue-500/15 border-blue-400/30 text-blue-300"
                  : "bg-white/5 border-white/10 text-white/40 hover:text-white/70"
              )}
            >
              <Package size={10} />
              {showDocker ? "Hide Docker" : "Docker Compose"}
            </button>
          </div>

          <AnimatePresence>
            {showDocker && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <CodeBlock code={DOCKER_COMPOSE} lang="yaml" />
              </motion.div>
            )}
          </AnimatePresence>

          <div className="space-y-2">
            {INSTALL_STEPS.map((step, i) => (
              <motion.div
                key={step.step}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.12 + i * 0.05 }}
                className="bg-white/[0.02] border border-white/[0.06] rounded-xl overflow-hidden"
              >
                <button
                  onClick={() => setExpandedStep(expandedStep === i ? null : i)}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/[0.03] transition-colors"
                >
                  <div className="w-7 h-7 rounded-lg bg-red-500/15 border border-red-400/20 flex items-center justify-center shrink-0">
                    <span className="text-xs font-black text-red-400">{step.step}</span>
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-sm font-semibold text-white">{step.title}</p>
                    <p className="text-[11px] text-white/40">{step.desc}</p>
                  </div>
                  {expandedStep === i
                    ? <ChevronDown size={14} className="text-white/30 shrink-0" />
                    : <ChevronRight size={14} className="text-white/30 shrink-0" />
                  }
                </button>
                <AnimatePresence>
                  {expandedStep === i && (
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: "auto" }}
                      exit={{ height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 pb-4">
                        <CodeBlock code={step.code} lang={step.lang} />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Features */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="space-y-3"
        >
          <p className="text-[11px] font-bold uppercase tracking-widest text-white/30">Features</p>
          <div className="space-y-2">
            {FEATURES.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.18 + i * 0.04 }}
                className={cn("flex items-start gap-3 px-4 py-3 rounded-xl border", f.bg)}
              >
                <div className={cn("w-8 h-8 rounded-lg border flex items-center justify-center shrink-0 mt-0.5", f.bg, f.color)}>
                  {f.icon}
                </div>
                <div className="flex-1">
                  <p className={cn("text-xs font-semibold", f.color)}>{f.title}</p>
                  <p className="text-[11px] text-white/45 mt-0.5 leading-relaxed">{f.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Configuration example */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-3"
        >
          <p className="text-[11px] font-bold uppercase tracking-widest text-white/30">Config Example</p>
          <CodeBlock
            lang="yaml"
            code={`# openclaw.yaml
ai:
  provider: openrouter
  key: \${OPENROUTER_API_KEY}
  model: openai/gpt-4o          # default model
  fallback: deepseek/deepseek-r1:free

channels:
  discord:
    token: \${DISCORD_TOKEN}
    model: anthropic/claude-opus-4-7  # channel-specific model
    system_prompt: "You are a helpful Discord bot."

  telegram:
    token: \${TELEGRAM_TOKEN}
    streaming: true
    max_tokens: 2048

  slack:
    token: \${SLACK_TOKEN}
    slash_command: /ai

gateway:
  port: 8080
  rate_limit: 60/min
  auth_required: false`}
          />
        </motion.div>

        {/* MCP Section */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="bg-teal-500/10 border border-teal-400/20 rounded-2xl p-4 space-y-3"
        >
          <div className="flex items-center gap-2">
            <Code2 size={16} className="text-teal-400" />
            <span className="text-sm font-bold text-white">Model Context Protocol (MCP)</span>
            <span className="text-[9px] bg-teal-500/20 border border-teal-400/30 text-teal-300 px-2 py-0.5 rounded-full font-bold ml-auto">NEW</span>
          </div>
          <p className="text-xs text-white/50 leading-relaxed">
            OpenClaw exposes an MCP server endpoint, allowing any MCP-compatible AI client (Claude Desktop, Cursor, etc.) to connect and use your channels, history, and tools.
          </p>
          <CodeBlock
            lang="json"
            code={`{
  "mcpServers": {
    "openclaw": {
      "url": "http://localhost:8080/mcp",
      "transport": "sse"
    }
  }
}`}
          />
        </motion.div>

        {/* Links */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="space-y-2"
        >
          <p className="text-[11px] font-bold uppercase tracking-widest text-white/30">Resources</p>
          {[
            { label: "Documentation", url: "https://openclaw.ai/docs", icon: <Terminal size={13} /> },
            { label: "GitHub Repository", url: "https://github.com/openclaw/openclaw", icon: <Code2 size={13} /> },
            { label: "OpenClaw Integrations", url: "https://openclaw.ai/integrations", icon: <Network size={13} /> },
            { label: "Trust & Privacy", url: "https://trust.openclaw.ai/", icon: <Shield size={13} /> },
          ].map(link => (
            <a
              key={link.label}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/[0.025] border border-white/[0.06] hover:bg-white/[0.04] transition-colors group"
            >
              <div className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center text-white/40 group-hover:text-white/70 transition-colors shrink-0">
                {link.icon}
              </div>
              <span className="text-sm text-white/70 group-hover:text-white/90 transition-colors flex-1">{link.label}</span>
              <ExternalLink size={12} className="text-white/25 group-hover:text-white/50 transition-colors shrink-0" />
            </a>
          ))}
        </motion.div>

        {/* Footer note */}
        <div className="text-center space-y-1 py-2">
          <p className="text-[10px] text-white/20">Built by Molty 🦞 · Independent project, not affiliated with Anthropic</p>
          <p className="text-[10px] text-white/15">Sponsored by OpenAI, GitHub, NVIDIA, Vercel, Blacksmith, Convex</p>
        </div>
      </div>
    </div>
  );
}
