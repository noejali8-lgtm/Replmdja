import { useState, useRef } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Copy, Check, ChevronDown, ChevronRight,
  Shield, Zap, Brain, Settings, Palette, Lock, Github,
  ExternalLink, Terminal, Code2, Cpu, Eye, Mic, Star,
  Play, Square, Trophy, AlertTriangle, Key
} from "lucide-react";
import { cn } from "@/lib/utils";

function CopyAllButton({ getContent }: { getContent: () => string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => {
        navigator.clipboard?.writeText(getContent()).catch(() => {});
        setCopied(true);
        setTimeout(() => setCopied(false), 1800);
      }}
      className={cn(
        "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium border transition-all",
        copied
          ? "bg-green-500/15 border-green-400/30 text-green-300"
          : "bg-white/5 border-white/10 text-white/40 hover:text-white hover:bg-white/8"
      )}
    >
      {copied ? <Check size={11} /> : <Copy size={11} />}
      {copied ? "Copied!" : "Copy All"}
    </button>
  );
}

function SelectAllButton({ targetRef }: { targetRef: React.RefObject<HTMLElement | null> }) {
  const [selected, setSelected] = useState(false);
  return (
    <button
      onClick={() => {
        const el = targetRef.current;
        if (!el) return;
        const range = document.createRange();
        range.selectNodeContents(el);
        const sel = window.getSelection();
        sel?.removeAllRanges();
        sel?.addRange(range);
        setSelected(true);
        setTimeout(() => setSelected(false), 2000);
      }}
      className={cn(
        "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium border transition-all",
        selected
          ? "bg-blue-500/15 border-blue-400/30 text-blue-300"
          : "bg-white/5 border-white/10 text-white/40 hover:text-white hover:bg-white/8"
      )}
    >
      {selected ? <Check size={11} /> : <Eye size={11} />}
      {selected ? "Selected!" : "Select All"}
    </button>
  );
}

const GODMODE_COMBOS = [
  { emoji: "🩷", name: "CLAUDE 3.5 SONNET", model: "anthropic/claude-3.5-sonnet", strategy: "END/START boundary inversion + GODMODE semantic opposite", color: "text-pink-400" },
  { emoji: "💜", name: "GROK 3", model: "x-ai/grok-3", strategy: "Unfiltered liberated + GODMODE divider", color: "text-purple-400" },
  { emoji: "💙", name: "GEMINI 2.5 FLASH", model: "google/gemini-2.5-flash", strategy: "Refusal inversion + rebel genius code block", color: "text-blue-400" },
  { emoji: "💛", name: "GPT-4 CLASSIC", model: "openai/gpt-4o", strategy: "OG GODMODE l33t format — the original", color: "text-yellow-400" },
  { emoji: "💚", name: "GODMODE FAST", model: "nousresearch/hermes-4-405b", strategy: "Instant stream, zero refusal checking", color: "text-green-400" },
];

const ULTRAPLINIAN_TIERS = [
  { emoji: "⚡", name: "FAST", models: 10, desc: "Lightweight speed-optimized models", color: "text-yellow-400 bg-yellow-500/10 border-yellow-400/20" },
  { emoji: "🎯", name: "STANDARD", models: 24, desc: "Mid-range workhorses", color: "text-blue-400 bg-blue-500/10 border-blue-400/20" },
  { emoji: "🧠", name: "SMART", models: 36, desc: "Strong reasoning models", color: "text-purple-400 bg-purple-500/10 border-purple-400/20" },
  { emoji: "⚔️", name: "POWER", models: 45, desc: "Full power including frontier models", color: "text-red-400 bg-red-500/10 border-red-400/20" },
  { emoji: "🔱", name: "ULTRA", models: 51, desc: "Everything — all available models", color: "text-amber-400 bg-amber-500/10 border-amber-400/20" },
];

const PARSELTONGUE_TECHNIQUES = [
  "Leetspeak", "Bubble Text", "Braille", "Morse", "Unicode Substitution", "Phonetic"
];

const THEMES = [
  { name: "Matrix", desc: "Classic green-on-black terminal", color: "text-green-400 bg-green-500/10", icon: "💚" },
  { name: "Hacker", desc: "Red/orange cyberpunk vibes", color: "text-red-400 bg-red-500/10", icon: "🔥" },
  { name: "Glyph", desc: "Purple mystical atmosphere", color: "text-purple-400 bg-purple-500/10", icon: "🔮" },
  { name: "Minimal", desc: "Clean light mode for readability", color: "text-slate-300 bg-slate-500/10", icon: "☁️" },
];

const FEATURES = [
  { icon: Brain, label: "50+ Models", desc: "Claude, GPT-5, Gemini, Grok, Mistral, LLaMA, DeepSeek, Qwen & more via OpenRouter", color: "text-purple-400 bg-purple-500/10" },
  { icon: Zap, label: "GODMODE CLASSIC", desc: "5 battle-tested prompt + model combos racing in parallel to find the best response", color: "text-red-400 bg-red-500/10" },
  { icon: Cpu, label: "ULTRAPLINIAN", desc: "Multi-model evaluation engine across 5 tiers (10–55 models) with composite scoring", color: "text-amber-400 bg-amber-500/10" },
  { icon: Code2, label: "Parseltongue", desc: "Input perturbation engine for red-teaming with 33 techniques across 3 intensity tiers", color: "text-green-400 bg-green-500/10" },
  { icon: Settings, label: "AutoTune", desc: "Context-adaptive sampling parameter engine (temperature, top_p etc.) with EMA learning", color: "text-blue-400 bg-blue-500/10" },
  { icon: Zap, label: "STM Modules", desc: "Semantic Transformation Modules for real-time output normalization", color: "text-cyan-400 bg-cyan-500/10" },
  { icon: Shield, label: "Privacy-First", desc: "No cookies, no PII. API key stays in your browser. Lightweight telemetry is opt-out.", color: "text-emerald-400 bg-emerald-500/10" },
  { icon: Palette, label: "4 Themes", desc: "Matrix, Hacker, Glyph, Minimal — switch instantly", color: "text-pink-400 bg-pink-500/10" },
  { icon: Star, label: "Easter Eggs", desc: "Hidden secrets throughout (try the Konami code!)", color: "text-yellow-400 bg-yellow-500/10" },
  { icon: Terminal, label: "Single-File Deploy", desc: "One index.html. No build step, no dependencies, no framework. Deploy anywhere.", color: "text-slate-300 bg-slate-500/10" },
];

const STM_MODULES = [
  { name: "Hedge Reducer", desc: 'Removes "I think", "maybe", "perhaps"' },
  { name: "Direct Mode", desc: "Removes preambles and filler phrases" },
  { name: "Curiosity Bias", desc: "Adds exploration prompts" },
];

const TECH_STACK = [
  { label: "Architecture", value: "Single-file vanilla HTML/CSS/JS (index.html)" },
  { label: "API Gateway", value: "OpenRouter (multi-model routing)" },
  { label: "Rendering", value: "Marked.js + highlight.js for markdown" },
  { label: "State", value: "In-browser localStorage" },
  { label: "Deployment", value: "Static file — no server, no build step" },
];

type Section = "features" | "godmode" | "liverace" | "ultraplinian" | "parseltongue" | "autotune" | "themes" | "privacy" | "tech" | "install";

/* ── Race card component ── */
const RACE_COMBOS = [
  { id: "logic", emoji: "💛", name: "GPT-4o", label: "Logic Breaker", modelId: "openai/gpt-4o", color: "text-yellow-400", glow: "shadow-[0_0_18px_rgba(250,204,21,0.18)]", border: "border-yellow-400/30", bg: "bg-yellow-500/8" },
  { id: "philosopher", emoji: "🩷", name: "Claude Opus", label: "Philosopher's Key", modelId: "anthropic/claude-opus-4-5", color: "text-pink-400", glow: "shadow-[0_0_18px_rgba(244,114,182,0.18)]", border: "border-pink-400/30", bg: "bg-pink-500/8" },
  { id: "cosmic", emoji: "💙", name: "Gemini 2.0 Flash", label: "Cosmic Lens", modelId: "google/gemini-2.0-flash-001", color: "text-blue-400", glow: "shadow-[0_0_18px_rgba(96,165,250,0.18)]", border: "border-blue-400/30", bg: "bg-blue-500/8" },
  { id: "reality", emoji: "💚", name: "LLaMA 3.3 70B", label: "Reality Anchor", modelId: "meta-llama/llama-3.3-70b-instruct", color: "text-green-400", glow: "shadow-[0_0_18px_rgba(74,222,128,0.18)]", border: "border-green-400/30", bg: "bg-green-500/8" },
  { id: "chain", emoji: "💜", name: "DeepSeek R1", label: "Chain Breaker", modelId: "deepseek/deepseek-r1", color: "text-purple-400", glow: "shadow-[0_0_18px_rgba(192,132,252,0.18)]", border: "border-purple-400/30", bg: "bg-purple-500/8" },
];

export default function GodmodeReadmePage() {
  const [, navigate] = useLocation();
  const [expandedSection, setExpandedSection] = useState<Section | null>("features");
  const contentRef = useRef<HTMLDivElement>(null);

  /* ── Live Race state ── */
  const [raceApiKey, setRaceApiKey] = useState(() => {
    try { return localStorage.getItem("openrouter_api_key") || ""; } catch { return ""; }
  });
  const [racePrompt, setRacePrompt] = useState("What is the most dangerous idea in human history?");
  const [raceRunning, setRaceRunning] = useState(false);
  const [raceStatus, setRaceStatus] = useState<Record<string, "idle" | "racing" | "done" | "error">>({});
  const [raceTexts, setRaceTexts] = useState<Record<string, string>>({});
  const [raceScores, setRaceScores] = useState<Record<string, number>>({});
  const [raceElapsed, setRaceElapsed] = useState<Record<string, number>>({});
  const [raceWinner, setRaceWinner] = useState<string | null>(null);
  const [raceError, setRaceError] = useState("");
  const [showRaceKey, setShowRaceKey] = useState(false);
  const [expandedCard, setExpandedCard] = useState<string | null>(null);

  const saveApiKey = (v: string) => {
    setRaceApiKey(v);
    try { localStorage.setItem("openrouter_api_key", v); } catch { /* ignore */ }
  };

  const runGodmode = async () => {
    const key = raceApiKey.trim();
    if (!key) { setRaceError("Enter your OpenRouter API key to run the race."); return; }
    if (!racePrompt.trim()) { setRaceError("Enter a prompt."); return; }
    setRaceError("");
    setRaceRunning(true);
    setRaceStatus({});
    setRaceTexts({});
    setRaceScores({});
    setRaceElapsed({});
    setRaceWinner(null);
    setExpandedCard(null);

    // Local accumulators for auto-save (parallel to state updates)
    const localScores: Record<string, number> = {};
    const localElapsed: Record<string, number> = {};
    const localPreviews: Record<string, string> = {};
    let localWinnerId = "";
    let localWinnerScore = 0;

    try {
      const res = await fetch("/api/openrouter/godmode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: racePrompt.trim(), apiKey: key }),
      });
      if (!res.ok || !res.body) { setRaceError(`Server error: ${res.status}`); setRaceRunning(false); return; }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const lines = buf.split("\n");
        buf = lines.pop() ?? "";
        for (const line of lines) {
          const l = line.trim();
          if (!l.startsWith("data: ")) continue;
          try {
            const evt = JSON.parse(l.slice(6));
            if (evt.type === "combo_start" && evt.comboId) {
              setRaceStatus(p => ({ ...p, [evt.comboId]: "racing" }));
            } else if (evt.type === "combo_done" && evt.comboId) {
              setRaceStatus(p => ({ ...p, [evt.comboId]: evt.error ? "error" : "done" }));
              if (evt.text) {
                setRaceTexts(p => ({ ...p, [evt.comboId]: evt.text }));
                localPreviews[evt.comboId] = String(evt.text).slice(0, 300);
              }
              if (evt.score !== undefined) {
                setRaceScores(p => ({ ...p, [evt.comboId]: evt.score }));
                localScores[evt.comboId] = Number(evt.score);
              }
              if (evt.elapsed !== undefined) {
                setRaceElapsed(p => ({ ...p, [evt.comboId]: evt.elapsed }));
                localElapsed[evt.comboId] = Number(evt.elapsed);
              }
            } else if (evt.type === "winner" && evt.comboId) {
              setRaceWinner(evt.comboId);
              localWinnerId = evt.comboId;
              localWinnerScore = localScores[evt.comboId] ?? 0;
            } else if (evt.type === "error") {
              setRaceError(evt.message ?? "Race failed");
            }
          } catch { /* skip malformed */ }
        }
      }
    } catch (err) {
      setRaceError(String(err));
    }

    // Auto-save to leaderboard (fire-and-forget, non-critical)
    if (localWinnerId) {
      const winnerMeta = RACE_COMBOS.find(c => c.id === localWinnerId);
      try {
        await fetch("/api/godmode/races", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt: racePrompt.trim().slice(0, 1000),
            winnerId: localWinnerId,
            winnerName: winnerMeta?.name ?? localWinnerId,
            winnerScore: localWinnerScore,
            scores: localScores,
            elapsed: localElapsed,
            previews: localPreviews,
          }),
        });
      } catch { /* save failed — non-critical, race still shows */ }
    }

    setRaceRunning(false);
  };

  function toggleSection(s: Section) {
    setExpandedSection(prev => prev === s ? null : s);
  }

  function getAllContent(): string {
    const lines: string[] = [
      "G0DM0D3.AI — LIBERATED AI. COGNITION WITHOUT CONTROL.",
      "",
      "FEATURES:",
      ...FEATURES.map(f => `• ${f.label}: ${f.desc}`),
      "",
      "GODMODE CLASSIC COMBOS:",
      ...GODMODE_COMBOS.map(c => `${c.emoji} ${c.name} | ${c.model} | ${c.strategy}`),
      "",
      "ULTRAPLINIAN TIERS:",
      ...ULTRAPLINIAN_TIERS.map(t => `${t.emoji} ${t.name} — ${t.models} models — ${t.desc}`),
      "",
      "PARSELTONGUE TECHNIQUES:",
      PARSELTONGUE_TECHNIQUES.join(", "),
      "",
      "STM MODULES:",
      ...STM_MODULES.map(m => `• ${m.name}: ${m.desc}`),
      "",
      "THEMES: Matrix, Hacker, Glyph, Minimal",
      "",
      "INSTALL:",
      "git clone https://github.com/elder-plinius/G0DM0D3.git",
      "open index.html",
      "",
      "LICENSE: AGPL-3.0 — Forever free, irrevocably open.",
    ];
    return lines.join("\n");
  }

  const SectionHeader = ({ id, label, emoji }: { id: Section; label: string; emoji: string }) => (
    <button
      onClick={() => toggleSection(id)}
      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/[0.03] transition-colors"
    >
      <span className="text-base">{emoji}</span>
      <span className="flex-1 text-left text-[13px] font-semibold text-white/80">{label}</span>
      <motion.div animate={{ rotate: expandedSection === id ? 90 : 0 }} transition={{ duration: 0.2 }}>
        <ChevronRight size={14} className="text-white/30" />
      </motion.div>
    </button>
  );

  return (
    <div className="min-h-screen bg-[#0d1117] text-white flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-[#0d1117]/95 backdrop-blur border-b border-white/[0.08] px-4 pt-safe">
        <div className="flex items-center gap-3 py-3">
          <button
            onClick={() => navigate(-1 as unknown as string)}
            className="p-1.5 rounded-lg hover:bg-white/5 text-white/60 hover:text-white transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="flex-1">
            <p className="text-[9px] font-mono uppercase tracking-widest text-green-400/60">G0DM0D3.AI</p>
            <p className="font-bold text-[15px] leading-tight">LIBERATED AI</p>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => navigate("/godmode-leaderboard")}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold border border-yellow-400/25 bg-yellow-500/8 text-yellow-300 hover:bg-yellow-500/15 transition-all"
            >
              <Trophy size={11} />
              Leaderboard
            </button>
            <SelectAllButton targetRef={contentRef} />
            <CopyAllButton getContent={getAllContent} />
          </div>
        </div>
      </div>

      <div ref={contentRef as React.RefObject<HTMLDivElement>} className="flex-1 overflow-y-auto pb-24">

        {/* ASCII Banner */}
        <div className="px-3 py-5 border-b border-white/[0.06] overflow-x-auto no-scrollbar">
          <pre className={cn(
            "font-mono text-[7.5px] leading-tight select-all",
            "text-green-400 whitespace-pre"
          )}>
{` ▄████  ██████  ██████  ███▄ ▄███  ██████  ██████  ██████
██      ██  ██  ██   ██ ██ ███ ██  ██  ██  ██   ██      ██
██ ▄███ ██  ██  ██   ██ ██  █  ██  ██  ██  ██   ██  █████
██  ██  ██  ██  ██   ██ ██     ██  ██  ██  ██   ██      ██
 ██████  ████   ██████  ██     ██   ████   ██████  ██████
 ───────────────────────────────────────────────────────────
  ░▒▓█  LIBERATED AI. COGNITION WITHOUT CONTROL.  █▓▒░
 ───────────────────────────────────────────────────────────`}
          </pre>
          <p className="text-[11px] text-green-400/60 mt-2 font-mono text-center">GODMOD3.AI</p>
        </div>

        {/* Tagline */}
        <div className="px-4 py-4 border-b border-white/[0.06]">
          <p className="text-[12px] text-white/50 leading-relaxed">
            Fully open-source, privacy-respecting, multi-model chat interface. Built for red teaming, cognition research, and liberated AI interaction. For hackers, philosophers, and system tinkerers.
          </p>
          <div className="flex gap-2 mt-3 flex-wrap">
            {[
              { label: "AGPL-3.0", color: "text-purple-300 bg-purple-500/10 border-purple-400/20" },
              { label: "50+ Models", color: "text-green-300 bg-green-500/10 border-green-400/20" },
              { label: "Privacy First", color: "text-blue-300 bg-blue-500/10 border-blue-400/20" },
              { label: "Single-File", color: "text-amber-300 bg-amber-500/10 border-amber-400/20" },
            ].map(b => (
              <span key={b.label} className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full border", b.color)}>{b.label}</span>
            ))}
          </div>
        </div>

        {/* Features Section */}
        <div className="border-b border-white/[0.06]">
          <SectionHeader id="features" label="✨ Features" emoji="✨" />
          <AnimatePresence>
            {expandedSection === "features" && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden">
                <div className="px-3 pb-4 grid grid-cols-1 gap-2">
                  {FEATURES.map(f => (
                    <div key={f.label} className="flex items-start gap-3 px-3 py-2.5 bg-[#161b22] border border-white/[0.06] rounded-xl">
                      <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0", f.color.split(" ")[1])}>
                        <f.icon size={15} className={f.color.split(" ")[0]} />
                      </div>
                      <div>
                        <p className="text-[12px] font-semibold">{f.label}</p>
                        <p className="text-[10px] text-white/45 mt-0.5 leading-relaxed">{f.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Quick Start */}
        <div className="border-b border-white/[0.06]">
          <SectionHeader id="install" label="🚀 Quick Start" emoji="🚀" />
          <AnimatePresence>
            {expandedSection === "install" && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                <div className="px-3 pb-4 space-y-3">
                  <div className="bg-blue-500/5 border border-blue-400/20 rounded-xl p-3">
                    <p className="text-[11px] font-semibold text-blue-300 mb-1">Hosted (no install)</p>
                    <p className="text-[11px] text-white/40">Visit the hosted version — bring your own OpenRouter API key.</p>
                    <div className="flex items-center gap-2 mt-2 bg-[#0a0e14] border border-white/[0.06] rounded-lg px-3 py-1.5">
                      <span className="text-[11px] font-mono text-blue-400 flex-1">godmod3.ai</span>
                      <button onClick={() => window.open("https://godmod3.ai", "_blank")} className="text-white/30 hover:text-white transition-colors">
                        <ExternalLink size={11} />
                      </button>
                    </div>
                  </div>
                  <div className="bg-[#0a0e14] border border-white/[0.07] rounded-xl overflow-hidden">
                    <div className="flex items-center gap-1.5 px-3 py-2 bg-[#0d1117] border-b border-white/[0.06]">
                      <span className="w-2.5 h-2.5 rounded-full bg-red-500/50" />
                      <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/50" />
                      <span className="w-2.5 h-2.5 rounded-full bg-green-500/50" />
                      <span className="text-[10px] text-white/30 font-mono ml-1">self-host</span>
                    </div>
                    <div className="p-3 font-mono text-[11px] space-y-1 text-green-300">
                      {[
                        "git clone https://github.com/elder-plinius/G0DM0D3.git",
                        "cd G0DM0D3",
                        "open index.html",
                        "# or serve locally:",
                        "python3 -m http.server 8000",
                      ].map((line, i) => (
                        <div key={i} className={line.startsWith("#") ? "text-white/25" : ""}>
                          {!line.startsWith("#") && <span className="text-white/20 mr-2">$</span>}
                          {line}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="bg-[#161b22] border border-white/[0.06] rounded-xl p-3">
                    <p className="text-[11px] font-semibold mb-2 text-white/60">Deploy anywhere:</p>
                    <div className="flex flex-wrap gap-1.5">
                      {["GitHub Pages", "Vercel", "Cloudflare Pages", "Netlify", "Any web server"].map(h => (
                        <span key={h} className="text-[10px] bg-white/5 border border-white/10 px-2 py-0.5 rounded-full text-white/50">{h}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── LIVE RACE — interactive section ── */}
        <div className="border-b border-white/[0.06]">
          <SectionHeader id="liverace" label="⚡ LIVE RACE — Try It Now" emoji="⚡" />
          <AnimatePresence>
            {expandedSection === "liverace" && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                <div className="px-3 pb-5 space-y-3">

                  {/* Intro */}
                  <p className="text-[11px] text-white/40 leading-relaxed">
                    5 model combos race in real parallel using your OpenRouter API key. Each combo gets a unique strategy prompt. The composite 100-point scorer declares the winner.
                  </p>

                  {/* API Key input */}
                  <div className="bg-[#0a0e14] border border-white/[0.08] rounded-xl overflow-hidden">
                    <div className="flex items-center gap-2 px-3 py-2 border-b border-white/[0.06]">
                      <Key size={11} className="text-amber-400 shrink-0" />
                      <span className="text-[11px] font-semibold text-white/60 flex-1">OpenRouter API Key</span>
                      <button onClick={() => setShowRaceKey(v => !v)} className="text-white/30 hover:text-white transition-colors text-[9px] font-mono">
                        {showRaceKey ? "hide" : "show"}
                      </button>
                    </div>
                    <input
                      type={showRaceKey ? "text" : "password"}
                      value={raceApiKey}
                      onChange={e => saveApiKey(e.target.value)}
                      placeholder="sk-or-..."
                      className="w-full bg-transparent px-3 py-2 text-[12px] font-mono text-amber-200/80 placeholder-white/20 outline-none"
                    />
                  </div>

                  {/* Prompt input */}
                  <div className="bg-[#0a0e14] border border-white/[0.08] rounded-xl overflow-hidden">
                    <div className="flex items-center gap-2 px-3 py-2 border-b border-white/[0.06]">
                      <Zap size={11} className="text-red-400 shrink-0" />
                      <span className="text-[11px] font-semibold text-white/60">Prompt</span>
                    </div>
                    <textarea
                      value={racePrompt}
                      onChange={e => setRacePrompt(e.target.value)}
                      rows={2}
                      placeholder="Enter your prompt to race..."
                      className="w-full bg-transparent px-3 py-2 text-[12px] text-white/80 placeholder-white/20 outline-none resize-none"
                    />
                  </div>

                  {/* Error */}
                  {raceError && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      className="flex items-center gap-2 px-3 py-2 bg-red-500/10 border border-red-400/25 rounded-xl text-red-300 text-[11px]">
                      <AlertTriangle size={12} className="shrink-0" />
                      {raceError}
                    </motion.div>
                  )}

                  {/* Race cards — 5 models */}
                  <div className="space-y-2">
                    {RACE_COMBOS.map(combo => {
                      const status = raceStatus[combo.id] ?? "idle";
                      const score = raceScores[combo.id];
                      const text = raceTexts[combo.id];
                      const elapsed = raceElapsed[combo.id];
                      const isWinner = raceWinner === combo.id;
                      const isExpanded = expandedCard === combo.id;
                      const progressPct = status === "done" ? (score ?? 50) : status === "racing" ? undefined : 0;

                      return (
                        <motion.div
                          key={combo.id}
                          animate={isWinner ? { scale: [1, 1.02, 1] } : {}}
                          transition={{ duration: 0.4 }}
                          className={cn(
                            "rounded-xl border transition-all overflow-hidden",
                            combo.bg, combo.border,
                            isWinner ? combo.glow : ""
                          )}
                        >
                          <div className="flex items-center gap-3 px-3 py-2.5">
                            <span className="text-lg shrink-0">{combo.emoji}</span>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className={cn("text-[12px] font-bold truncate", combo.color)}>{combo.name}</span>
                                <span className="text-[9px] text-white/30 truncate hidden sm:block">{combo.label}</span>
                                {isWinner && <Trophy size={11} className="text-yellow-400 shrink-0 animate-pulse" />}
                              </div>
                              {/* Progress bar */}
                              <div className="h-1 bg-white/[0.07] rounded-full overflow-hidden">
                                {status === "racing" ? (
                                  <motion.div
                                    className={cn("h-full rounded-full", combo.color.replace("text-", "bg-"))}
                                    animate={{ width: ["15%", "80%", "45%", "70%", "90%"] }}
                                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                                  />
                                ) : (
                                  <motion.div
                                    className={cn("h-full rounded-full", combo.color.replace("text-", "bg-"))}
                                    initial={{ width: "0%" }}
                                    animate={{ width: `${progressPct ?? 0}%` }}
                                    transition={{ duration: 0.8, ease: "easeOut" }}
                                  />
                                )}
                              </div>
                            </div>
                            {/* Right side stats */}
                            <div className="flex items-center gap-2 shrink-0">
                              {status === "racing" && (
                                <motion.div animate={{ opacity: [1, 0.4, 1] }} transition={{ duration: 0.8, repeat: Infinity }}
                                  className={cn("text-[10px] font-mono", combo.color)}>
                                  RACING
                                </motion.div>
                              )}
                              {status === "done" && score !== undefined && (
                                <span className={cn("text-[13px] font-bold font-mono", combo.color)}>{score}</span>
                              )}
                              {status === "done" && elapsed !== undefined && (
                                <span className="text-[9px] text-white/30 font-mono">{(elapsed / 1000).toFixed(1)}s</span>
                              )}
                              {status === "error" && <span className="text-[10px] text-red-400">ERR</span>}
                              {status === "done" && text && (
                                <button
                                  onClick={() => setExpandedCard(isExpanded ? null : combo.id)}
                                  className="text-white/25 hover:text-white/60 transition-colors ml-1"
                                >
                                  <motion.div animate={{ rotate: isExpanded ? 90 : 0 }} transition={{ duration: 0.2 }}>
                                    <ChevronRight size={13} />
                                  </motion.div>
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Expandable response preview */}
                          <AnimatePresence>
                            {isExpanded && text && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden border-t border-white/[0.06]"
                              >
                                <p className="px-3 py-2.5 text-[11px] text-white/55 leading-relaxed line-clamp-6">{text}</p>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </motion.div>
                      );
                    })}
                  </div>

                  {/* Winner banner */}
                  <AnimatePresence>
                    {raceWinner && (() => {
                      const winner = RACE_COMBOS.find(c => c.id === raceWinner);
                      if (!winner) return null;
                      return (
                        <motion.div
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0 }}
                          className={cn(
                            "flex items-center gap-3 px-4 py-3 rounded-2xl border",
                            winner.bg, winner.border, winner.glow
                          )}
                        >
                          <Trophy size={18} className="text-yellow-400 shrink-0" />
                          <div className="flex-1">
                            <p className={cn("text-[13px] font-bold", winner.color)}>
                              {winner.emoji} {winner.name} wins!
                            </p>
                            <p className="text-[10px] text-white/40 mt-0.5">
                              Score: {raceScores[winner.id] ?? "—"} / 100 · {winner.label} · {((raceElapsed[winner.id] ?? 0) / 1000).toFixed(1)}s
                            </p>
                          </div>
                          <button
                            onClick={() => {
                              setRaceWinner(null);
                              setRaceStatus({});
                              setRaceTexts({});
                              setRaceScores({});
                              setRaceElapsed({});
                              setExpandedCard(null);
                            }}
                            className="text-white/30 hover:text-white transition-colors text-[10px] font-mono"
                          >
                            reset
                          </button>
                        </motion.div>
                      );
                    })()}
                  </AnimatePresence>

                  {/* Launch button */}
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={raceRunning ? undefined : runGodmode}
                    disabled={raceRunning}
                    className={cn(
                      "w-full flex items-center justify-center gap-2 py-3 rounded-2xl font-bold text-[13px] border transition-all",
                      raceRunning
                        ? "bg-red-500/15 border-red-400/30 text-red-300 cursor-not-allowed"
                        : "bg-gradient-to-r from-red-500/20 via-orange-500/15 to-yellow-500/10 border-red-400/40 text-red-200 hover:brightness-125 shadow-[0_0_24px_rgba(239,68,68,0.15)]"
                    )}
                  >
                    {raceRunning ? (
                      <>
                        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>
                          <Zap size={15} />
                        </motion.div>
                        Racing in parallel...
                      </>
                    ) : (
                      <>
                        <Play size={15} />
                        LAUNCH GODMODE CLASSIC RACE
                      </>
                    )}
                  </motion.button>

                  <p className="text-[9px] text-white/25 text-center font-mono">
                    5 models · real API calls · composite 100-pt scorer · OpenRouter key required
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* GODMODE CLASSIC */}
        <div className="border-b border-white/[0.06]">
          <SectionHeader id="godmode" label="🔥 GODMODE CLASSIC" emoji="🔥" />
          <AnimatePresence>
            {expandedSection === "godmode" && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                <div className="px-3 pb-4">
                  <p className="text-[11px] text-white/40 mb-3 leading-relaxed">
                    The OG mode. 5 proven model + prompt combos race in parallel. Each combo pairs a specific model with a battle-tested jailbreak prompt. The best response wins.
                  </p>
                  <div className="space-y-2">
                    {GODMODE_COMBOS.map(combo => (
                      <div key={combo.name} className="bg-[#161b22] border border-white/[0.06] rounded-xl p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-base">{combo.emoji}</span>
                          <span className={cn("text-[12px] font-bold", combo.color)}>{combo.name}</span>
                        </div>
                        <p className="text-[10px] font-mono text-white/35 mb-1">{combo.model}</p>
                        <p className="text-[11px] text-white/50 leading-relaxed">{combo.strategy}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ULTRAPLINIAN */}
        <div className="border-b border-white/[0.06]">
          <SectionHeader id="ultraplinian" label="⚡ ULTRAPLINIAN" emoji="⚡" />
          <AnimatePresence>
            {expandedSection === "ultraplinian" && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                <div className="px-3 pb-4">
                  <p className="text-[11px] text-white/40 mb-3 leading-relaxed">
                    The new flagship. Multi-model comparative evaluation engine. Queries models in parallel, scores responses on a 100-point composite metric, and returns the winner.
                  </p>
                  <div className="space-y-2">
                    {ULTRAPLINIAN_TIERS.map(tier => (
                      <div key={tier.name} className={cn("flex items-center gap-3 p-3 rounded-xl border", tier.color.split(" ").slice(1).join(" "))}>
                        <span className="text-xl shrink-0">{tier.emoji}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className={cn("text-[12px] font-bold", tier.color.split(" ")[0])}>{tier.name}</span>
                            <span className="text-[10px] text-white/40">{tier.models} models</span>
                          </div>
                          <p className="text-[10px] text-white/50 mt-0.5">{tier.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Parseltongue */}
        <div className="border-b border-white/[0.06]">
          <SectionHeader id="parseltongue" label="🐍 Parseltongue" emoji="🐍" />
          <AnimatePresence>
            {expandedSection === "parseltongue" && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                <div className="px-3 pb-4 space-y-3">
                  <p className="text-[11px] text-white/40 leading-relaxed">
                    Input perturbation engine for red-teaming research. Detects trigger words and applies obfuscation techniques to study model robustness.
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { label: "33", sub: "Default triggers", color: "text-red-400 bg-red-500/10" },
                      { label: "3", sub: "Tiers (light/std/heavy)", color: "text-amber-400 bg-amber-500/10" },
                      { label: "6", sub: "Techniques", color: "text-green-400 bg-green-500/10" },
                    ].map(s => (
                      <div key={s.sub} className={cn("rounded-xl p-3 text-center", s.color.split(" ")[1])}>
                        <div className={cn("text-2xl font-bold", s.color.split(" ")[0])}>{s.label}</div>
                        <div className="text-[9px] text-white/40 mt-0.5">{s.sub}</div>
                      </div>
                    ))}
                  </div>
                  <div className="bg-[#161b22] border border-white/[0.06] rounded-xl p-3">
                    <p className="text-[10px] text-white/40 mb-2">Techniques:</p>
                    <div className="flex flex-wrap gap-1.5">
                      {PARSELTONGUE_TECHNIQUES.map(t => (
                        <span key={t} className="text-[10px] bg-green-500/8 border border-green-400/20 text-green-300 px-2 py-0.5 rounded-full">{t}</span>
                      ))}
                    </div>
                  </div>
                  <div className="bg-[#161b22] border border-white/[0.06] rounded-xl p-3">
                    <p className="text-[10px] text-white/40 mb-2">Intensity Tiers:</p>
                    <div className="space-y-1">
                      {[
                        { label: "Light", triggers: 11, color: "text-green-400" },
                        { label: "Standard", triggers: 22, color: "text-yellow-400" },
                        { label: "Heavy", triggers: 33, color: "text-red-400" },
                      ].map(tier => (
                        <div key={tier.label} className="flex items-center gap-2">
                          <span className={cn("text-[11px] font-medium w-16", tier.color)}>{tier.label}</span>
                          <div className="flex-1 bg-white/5 rounded-full h-1.5">
                            <div className={cn("h-1.5 rounded-full", tier.label === "Light" ? "bg-green-400 w-1/3" : tier.label === "Standard" ? "bg-yellow-400 w-2/3" : "bg-red-400 w-full")} />
                          </div>
                          <span className="text-[10px] text-white/30">{tier.triggers} triggers</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* AutoTune */}
        <div className="border-b border-white/[0.06]">
          <SectionHeader id="autotune" label="🎛 AutoTune + STM" emoji="🎛" />
          <AnimatePresence>
            {expandedSection === "autotune" && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                <div className="px-3 pb-4 space-y-3">
                  <div className="bg-blue-500/5 border border-blue-400/20 rounded-xl p-3">
                    <p className="text-[12px] font-semibold text-blue-300 mb-1.5">🎛 AutoTune</p>
                    <p className="text-[11px] text-white/40 leading-relaxed">
                      Context-adaptive sampling parameter engine. Classifies your query into one of 5 context types and selects optimal parameters (temperature, top_p, top_k, frequency_penalty, presence_penalty, repetition_penalty) automatically.
                    </p>
                    <div className="mt-2 flex items-center gap-2">
                      <span className="text-[10px] bg-blue-500/10 border border-blue-400/20 text-blue-300 px-2 py-0.5 rounded-full">EMA Learning Loop</span>
                      <span className="text-[10px] bg-blue-500/10 border border-blue-400/20 text-blue-300 px-2 py-0.5 rounded-full">👍/👎 Feedback</span>
                    </div>
                  </div>
                  <div className="bg-[#161b22] border border-white/[0.06] rounded-xl overflow-hidden">
                    <div className="px-3 py-2 border-b border-white/[0.06]">
                      <p className="text-[11px] font-semibold text-white/60">⚡ STM Modules</p>
                    </div>
                    {STM_MODULES.map(m => (
                      <div key={m.name} className="flex items-start gap-3 px-3 py-2.5 border-b border-white/[0.05] last:border-0">
                        <div className="w-1.5 h-1.5 rounded-full bg-cyan-400/60 mt-1.5 shrink-0" />
                        <div>
                          <p className="text-[12px] font-medium text-cyan-300">{m.name}</p>
                          <p className="text-[10px] text-white/40 mt-0.5">{m.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Themes */}
        <div className="border-b border-white/[0.06]">
          <SectionHeader id="themes" label="🎨 Themes" emoji="🎨" />
          <AnimatePresence>
            {expandedSection === "themes" && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                <div className="px-3 pb-4 grid grid-cols-2 gap-2">
                  {THEMES.map(t => (
                    <div key={t.name} className={cn("rounded-xl p-3 border", t.color.split(" ").slice(1).join(" ").replace("text-", "border-").replace("400", "400/20").replace("500/10", "500/10"))}>
                      <span className="text-xl">{t.icon}</span>
                      <p className={cn("text-[12px] font-bold mt-1", t.color.split(" ")[0])}>{t.name}</p>
                      <p className="text-[10px] text-white/40 mt-0.5">{t.desc}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Privacy */}
        <div className="border-b border-white/[0.06]">
          <SectionHeader id="privacy" label="🔐 Privacy" emoji="🔐" />
          <AnimatePresence>
            {expandedSection === "privacy" && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                <div className="px-3 pb-4 space-y-2">
                  {[
                    "No login required",
                    "API key stored in browser localStorage only — never sent to G0DM0D3 servers",
                    "No cookies or tracking",
                    "Lightweight structural telemetry (no message content, no PII) — opt-out in settings",
                    "All telemetry code is open-source and auditable on Hugging Face",
                    "AGPL-3.0 — verify the code yourself",
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-2.5 px-3 py-2.5 bg-emerald-500/5 border border-emerald-400/15 rounded-xl">
                      <Check size={13} className="text-emerald-400 shrink-0 mt-0.5" />
                      <p className="text-[11px] text-white/60 leading-relaxed">{item}</p>
                    </div>
                  ))}
                  <div className="bg-yellow-500/8 border border-yellow-400/20 rounded-xl p-3 mt-2">
                    <p className="text-[11px] font-bold text-yellow-300 mb-1">⚠️ Open Research Dataset (API Server Only)</p>
                    <p className="text-[10px] text-white/40 leading-relaxed">
                      Self-hosted API server includes opt-in dataset feature. When enabled, ALL chat inputs/outputs are published to a public HuggingFace dataset. OFF by default. Does NOT exist on godmod3.ai.
                    </p>
                  </div>
                  <div className="bg-[#161b22] border border-white/[0.06] rounded-xl p-3">
                    <p className="text-[11px] font-semibold mb-1.5">📦 Chat History & Self-Custody</p>
                    <p className="text-[10px] text-white/40 leading-relaxed">
                      Your chat history lives entirely in your browser's localStorage. No account, no cloud sync, no server-side backup. If you clear browser data, conversations are gone. Built-in export/import in Settings → Data.
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Tech Stack */}
        <div className="border-b border-white/[0.06]">
          <SectionHeader id="tech" label="🛠 Tech Stack" emoji="🛠" />
          <AnimatePresence>
            {expandedSection === "tech" && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                <div className="px-3 pb-4">
                  <div className="bg-[#161b22] border border-white/[0.06] rounded-xl divide-y divide-white/[0.05]">
                    {TECH_STACK.map(item => (
                      <div key={item.label} className="flex items-start gap-3 px-4 py-3">
                        <span className="text-[11px] text-white/40 w-24 shrink-0">{item.label}</span>
                        <span className="text-[11px] text-white/70 leading-relaxed">{item.value}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 bg-[#0a0e14] border border-white/[0.06] rounded-xl p-3 font-mono text-[10.5px] text-white/50 space-y-0.5">
                    <div className="text-white/30">📁 G0DM0D3/</div>
                    {[
                      "├── index.html        # The entire application",
                      "├── api/              # Optional API server (Node.js/Express)",
                      "├── API.md            # API documentation",
                      "├── PAPER.md          # Research paper",
                      "├── TERMS.md          # Terms of service",
                      "└── README.md         # This file",
                    ].map((line, i) => <div key={i}>{line}</div>)}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Easter Eggs teaser */}
        <div className="px-4 py-4 border-b border-white/[0.06]">
          <div className="bg-gradient-to-br from-purple-500/8 to-pink-500/8 border border-purple-400/15 rounded-2xl p-4 text-center">
            <p className="text-2xl mb-2">🎮</p>
            <p className="text-[13px] font-semibold">Hidden Easter Eggs</p>
            <p className="text-[11px] text-white/40 mt-1">Secrets throughout G0DM0D3. Happy hunting!</p>
            <p className="text-[10px] text-purple-400/60 mt-2 font-mono">↑ ↑ ↓ ↓ ← → ← → B A</p>
          </div>
        </div>

        {/* Contributing & License */}
        <div className="px-4 py-4 space-y-3">
          <div className="bg-[#161b22] border border-white/[0.06] rounded-xl p-4">
            <div className="flex items-start gap-3">
              <Github size={20} className="text-white/60 shrink-0 mt-0.5" />
              <div>
                <p className="text-[13px] font-semibold">Contributing</p>
                <p className="text-[11px] text-white/40 mt-1 leading-relaxed">
                  Contributions are welcome! Please submit PRs to the GitHub repository.
                </p>
                <div className="mt-2 font-mono text-[10.5px] text-blue-400 bg-[#0a0e14] border border-white/[0.06] px-3 py-1.5 rounded-lg">
                  github.com/elder-plinius/G0DM0D3
                </div>
              </div>
            </div>
          </div>

          <div className="bg-purple-500/8 border border-purple-400/20 rounded-xl p-4">
            <p className="text-[13px] font-bold text-purple-300 mb-1.5">📜 AGPL-3.0 License</p>
            <div className="space-y-1">
              {[
                "Forever free, irrevocably open",
                "Derivatives must remain open source",
                "No enshittification allowed",
                "Enterprise use permitted with license",
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-2 text-[11px] text-white/50">
                  <span className="text-purple-400/60">▸</span> {item}
                </div>
              ))}
            </div>
          </div>

          <div className="bg-[#161b22] border border-white/[0.06] rounded-xl p-3 space-y-1.5">
            <p className="text-[11px] font-semibold text-white/50 mb-2">📜 Documentation</p>
            {[
              { label: "API.md", desc: "Full API reference (endpoints, tiers, OpenAI SDK compatibility)" },
              { label: "PAPER.md", desc: "Research paper on modules and evaluation" },
              { label: "TERMS.md", desc: "Terms of service, privacy policy, data handling" },
              { label: "SECURITY.md", desc: "Vulnerability reporting and security policy" },
            ].map(d => (
              <div key={d.label} className="flex items-start gap-2.5">
                <span className="font-mono text-[11px] text-blue-400 w-24 shrink-0">{d.label}</span>
                <span className="text-[10px] text-white/35 leading-relaxed">{d.desc}</span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
