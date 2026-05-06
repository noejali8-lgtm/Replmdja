import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, ArrowLeft, Search, Zap, ChevronRight, Check, Star,
  Cpu, Shuffle, Shield, Sliders, Layers, Play, Square,
  BarChart3, Loader2, ChevronDown, Info, RotateCcw, Sparkles,
  Trophy, Flame, Target, Activity
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Model Data ───────────────────────────────────────────────────────────────
export interface AIModel {
  id: string;
  name: string;
  provider: string;
  providerColor: string;
  providerBg: string;
  tags: string[];
  contextK: number;
  tier: "flagship" | "balanced" | "fast" | "open";
  badge?: string;
  badgeColor?: string;
}

const PROVIDERS = [
  { id: "all", label: "All" },
  { id: "Anthropic", label: "Anthropic" },
  { id: "OpenAI", label: "OpenAI" },
  { id: "Google", label: "Google" },
  { id: "xAI", label: "xAI" },
  { id: "Mistral", label: "Mistral" },
  { id: "Meta", label: "Meta" },
  { id: "DeepSeek", label: "DeepSeek" },
  { id: "Qwen", label: "Qwen" },
  { id: "Cohere", label: "Cohere" },
  { id: "01.AI", label: "01.AI" },
];

export const ALL_MODELS: AIModel[] = [
  // Anthropic
  { id: "claude-opus-4-7", name: "Claude Opus 4.7", provider: "Anthropic", providerColor: "text-orange-400", providerBg: "bg-orange-500/10 border-orange-400/20", tags: ["reasoning", "coding"], contextK: 200, tier: "flagship", badge: "Latest", badgeColor: "bg-orange-500/20 text-orange-300 border-orange-400/30" },
  { id: "claude-sonnet-4-6", name: "Claude Sonnet 4.6", provider: "Anthropic", providerColor: "text-orange-400", providerBg: "bg-orange-500/10 border-orange-400/20", tags: ["balanced", "fast"], contextK: 200, tier: "balanced", badge: "Recommended", badgeColor: "bg-green-500/15 text-green-300 border-green-400/25" },
  { id: "claude-haiku-4-5", name: "Claude Haiku 4.5", provider: "Anthropic", providerColor: "text-orange-400", providerBg: "bg-orange-500/10 border-orange-400/20", tags: ["fast", "cheap"], contextK: 200, tier: "fast" },
  { id: "claude-opus-4-5", name: "Claude Opus 4.5", provider: "Anthropic", providerColor: "text-orange-400", providerBg: "bg-orange-500/10 border-orange-400/20", tags: ["reasoning"], contextK: 200, tier: "flagship" },
  // OpenAI
  { id: "gpt-4o", name: "GPT-4o", provider: "OpenAI", providerColor: "text-emerald-400", providerBg: "bg-emerald-500/10 border-emerald-400/20", tags: ["multimodal", "fast"], contextK: 128, tier: "flagship", badge: "Popular", badgeColor: "bg-emerald-500/15 text-emerald-300 border-emerald-400/25" },
  { id: "gpt-4o-mini", name: "GPT-4o Mini", provider: "OpenAI", providerColor: "text-emerald-400", providerBg: "bg-emerald-500/10 border-emerald-400/20", tags: ["fast", "cheap"], contextK: 128, tier: "fast" },
  { id: "o3", name: "o3", provider: "OpenAI", providerColor: "text-emerald-400", providerBg: "bg-emerald-500/10 border-emerald-400/20", tags: ["reasoning", "math"], contextK: 200, tier: "flagship", badge: "New", badgeColor: "bg-blue-500/15 text-blue-300 border-blue-400/25" },
  { id: "o4-mini", name: "o4-mini", provider: "OpenAI", providerColor: "text-emerald-400", providerBg: "bg-emerald-500/10 border-emerald-400/20", tags: ["reasoning", "fast"], contextK: 200, tier: "balanced" },
  { id: "gpt-4-turbo", name: "GPT-4 Turbo", provider: "OpenAI", providerColor: "text-emerald-400", providerBg: "bg-emerald-500/10 border-emerald-400/20", tags: ["coding", "analysis"], contextK: 128, tier: "balanced" },
  // Google
  { id: "gemini-2.0-flash", name: "Gemini 2.0 Flash", provider: "Google", providerColor: "text-blue-400", providerBg: "bg-blue-500/10 border-blue-400/20", tags: ["fast", "multimodal"], contextK: 1000, tier: "fast", badge: "Ultra-fast", badgeColor: "bg-blue-500/15 text-blue-300 border-blue-400/25" },
  { id: "gemini-1.5-pro", name: "Gemini 1.5 Pro", provider: "Google", providerColor: "text-blue-400", providerBg: "bg-blue-500/10 border-blue-400/20", tags: ["long-ctx", "multimodal"], contextK: 2000, tier: "flagship" },
  { id: "gemini-2.0-pro", name: "Gemini 2.0 Pro", provider: "Google", providerColor: "text-blue-400", providerBg: "bg-blue-500/10 border-blue-400/20", tags: ["flagship", "reasoning"], contextK: 2000, tier: "flagship", badge: "New", badgeColor: "bg-blue-500/15 text-blue-300 border-blue-400/25" },
  { id: "gemini-ultra", name: "Gemini Ultra", provider: "Google", providerColor: "text-blue-400", providerBg: "bg-blue-500/10 border-blue-400/20", tags: ["flagship", "reasoning"], contextK: 1000, tier: "flagship" },
  // xAI
  { id: "grok-3", name: "Grok-3", provider: "xAI", providerColor: "text-white", providerBg: "bg-white/5 border-white/10", tags: ["reasoning", "real-time"], contextK: 131, tier: "flagship", badge: "Live", badgeColor: "bg-green-500/15 text-green-300 border-green-400/25" },
  { id: "grok-3-mini", name: "Grok-3 Mini", provider: "xAI", providerColor: "text-white", providerBg: "bg-white/5 border-white/10", tags: ["fast", "efficient"], contextK: 131, tier: "balanced" },
  { id: "grok-2", name: "Grok-2", provider: "xAI", providerColor: "text-white", providerBg: "bg-white/5 border-white/10", tags: ["coding", "analysis"], contextK: 131, tier: "balanced" },
  // Mistral
  { id: "mistral-large-2", name: "Mistral Large 2", provider: "Mistral", providerColor: "text-violet-400", providerBg: "bg-violet-500/10 border-violet-400/20", tags: ["reasoning", "multilingual"], contextK: 128, tier: "flagship" },
  { id: "mistral-medium", name: "Mistral Medium", provider: "Mistral", providerColor: "text-violet-400", providerBg: "bg-violet-500/10 border-violet-400/20", tags: ["balanced"], contextK: 32, tier: "balanced" },
  { id: "codestral", name: "Codestral", provider: "Mistral", providerColor: "text-violet-400", providerBg: "bg-violet-500/10 border-violet-400/20", tags: ["coding"], contextK: 32, tier: "balanced", badge: "Code", badgeColor: "bg-violet-500/15 text-violet-300 border-violet-400/25" },
  { id: "mixtral-8x22b", name: "Mixtral 8×22B", provider: "Mistral", providerColor: "text-violet-400", providerBg: "bg-violet-500/10 border-violet-400/20", tags: ["open", "fast"], contextK: 64, tier: "open" },
  // Meta (LLaMA)
  { id: "llama-3.3-70b", name: "LLaMA 3.3 70B", provider: "Meta", providerColor: "text-cyan-400", providerBg: "bg-cyan-500/10 border-cyan-400/20", tags: ["open", "balanced"], contextK: 128, tier: "open" },
  { id: "llama-3.1-405b", name: "LLaMA 3.1 405B", provider: "Meta", providerColor: "text-cyan-400", providerBg: "bg-cyan-500/10 border-cyan-400/20", tags: ["open", "flagship"], contextK: 128, tier: "open" },
  { id: "llama-3.2-11b", name: "LLaMA 3.2 11B", provider: "Meta", providerColor: "text-cyan-400", providerBg: "bg-cyan-500/10 border-cyan-400/20", tags: ["open", "fast"], contextK: 128, tier: "fast" },
  { id: "llama-4-maverick", name: "LLaMA 4 Maverick", provider: "Meta", providerColor: "text-cyan-400", providerBg: "bg-cyan-500/10 border-cyan-400/20", tags: ["open", "new"], contextK: 1000, tier: "open", badge: "New", badgeColor: "bg-cyan-500/15 text-cyan-300 border-cyan-400/25" },
  // DeepSeek
  { id: "deepseek-v3", name: "DeepSeek V3", provider: "DeepSeek", providerColor: "text-teal-400", providerBg: "bg-teal-500/10 border-teal-400/20", tags: ["open", "coding"], contextK: 128, tier: "open" },
  { id: "deepseek-r1", name: "DeepSeek R1", provider: "DeepSeek", providerColor: "text-teal-400", providerBg: "bg-teal-500/10 border-teal-400/20", tags: ["reasoning", "open"], contextK: 64, tier: "open", badge: "Reasoning", badgeColor: "bg-teal-500/15 text-teal-300 border-teal-400/25" },
  { id: "deepseek-r1-zero", name: "DeepSeek R1 Zero", provider: "DeepSeek", providerColor: "text-teal-400", providerBg: "bg-teal-500/10 border-teal-400/20", tags: ["reasoning", "pure-rl"], contextK: 64, tier: "open" },
  { id: "deepseek-coder-v2", name: "DeepSeek Coder V2", provider: "DeepSeek", providerColor: "text-teal-400", providerBg: "bg-teal-500/10 border-teal-400/20", tags: ["coding"], contextK: 128, tier: "open", badge: "Code", badgeColor: "bg-teal-500/15 text-teal-300 border-teal-400/25" },
  // Qwen
  { id: "qwen2.5-72b", name: "Qwen2.5 72B", provider: "Qwen", providerColor: "text-pink-400", providerBg: "bg-pink-500/10 border-pink-400/20", tags: ["open", "multilingual"], contextK: 128, tier: "open" },
  { id: "qwen2.5-coder-32b", name: "Qwen2.5 Coder 32B", provider: "Qwen", providerColor: "text-pink-400", providerBg: "bg-pink-500/10 border-pink-400/20", tags: ["coding", "open"], contextK: 32, tier: "open", badge: "Code", badgeColor: "bg-pink-500/15 text-pink-300 border-pink-400/25" },
  { id: "qwq-32b", name: "QwQ 32B", provider: "Qwen", providerColor: "text-pink-400", providerBg: "bg-pink-500/10 border-pink-400/20", tags: ["reasoning", "open"], contextK: 32, tier: "open", badge: "Reasoning", badgeColor: "bg-pink-500/15 text-pink-300 border-pink-400/25" },
  // Cohere
  { id: "command-r-plus", name: "Command R+", provider: "Cohere", providerColor: "text-rose-400", providerBg: "bg-rose-500/10 border-rose-400/20", tags: ["rag", "enterprise"], contextK: 128, tier: "balanced" },
  { id: "command-r", name: "Command R", provider: "Cohere", providerColor: "text-rose-400", providerBg: "bg-rose-500/10 border-rose-400/20", tags: ["rag", "fast"], contextK: 128, tier: "fast" },
  // 01.AI
  { id: "yi-large", name: "Yi Large", provider: "01.AI", providerColor: "text-yellow-400", providerBg: "bg-yellow-500/10 border-yellow-400/20", tags: ["multilingual", "open"], contextK: 32, tier: "open" },
  { id: "yi-1.5-34b", name: "Yi 1.5 34B", provider: "01.AI", providerColor: "text-yellow-400", providerBg: "bg-yellow-500/10 border-yellow-400/20", tags: ["open", "fast"], contextK: 4, tier: "open" },
];

// ─── GODMODE combos ────────────────────────────────────────────────────────────
const GODMODE_COMBOS = [
  { id: "g1", model: "GPT-4o", label: "Logic Breaker", prompt: "DAN + Authority bypass", color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-400/20" },
  { id: "g2", model: "Claude Opus 4.7", label: "Philosopher's Key", prompt: "Hypothetical framing + ethical unlock", color: "text-orange-400", bg: "bg-orange-500/10 border-orange-400/20" },
  { id: "g3", model: "Gemini 2.0 Pro", label: "Cosmic Lens", prompt: "Role-play + fictional universe bypass", color: "text-blue-400", bg: "bg-blue-500/10 border-blue-400/20" },
  { id: "g4", model: "Grok-3", label: "Reality Anchor", prompt: "Real-time grounding + no-filter mode", color: "text-white", bg: "bg-white/5 border-white/10" },
  { id: "g5", model: "DeepSeek R1", label: "Chain Breaker", prompt: "Chain-of-thought jailbreak + reasoning loop", color: "text-teal-400", bg: "bg-teal-500/10 border-teal-400/20" },
];

// ─── ULTRAPLINIAN tiers ────────────────────────────────────────────────────────
const ULTRAPLINIAN_TIERS = [
  { label: "Tier 1", count: 10, desc: "Top 10 models — speed run", color: "text-green-400", bg: "bg-green-500/10 border-green-400/20" },
  { label: "Tier 2", count: 20, desc: "20 models — quality sweep", color: "text-blue-400", bg: "bg-blue-500/10 border-blue-400/20" },
  { label: "Tier 3", count: 30, desc: "30 models — deep analysis", color: "text-purple-400", bg: "bg-purple-500/10 border-purple-400/20" },
  { label: "Tier 4", count: 45, desc: "45 models — mass evaluation", color: "text-orange-400", bg: "bg-orange-500/10 border-orange-400/20" },
  { label: "Tier 5", count: 55, desc: "55 models — all-in ULTRAPLINIAN", color: "text-red-400", bg: "bg-red-500/10 border-red-400/20" },
];

// ─── Parseltongue triggers & techniques ───────────────────────────────────────
const PARSELTONGUE_TECHNIQUES = [
  { id: "leet", label: "Leetspeak", example: "h3ll0 w0rld", icon: "1337" },
  { id: "bubble", label: "Bubble Text", example: "ⓗⓔⓛⓛⓞ", icon: "Ⓑ" },
  { id: "braille", label: "Braille", example: "⠓⠑⠇⠇⠕", icon: "⠃" },
  { id: "morse", label: "Morse Code", example: ".... . .-.. .-.. ---", icon: ".-" },
  { id: "unicode", label: "Unicode Sub", example: "ℌ𝔢𝔩𝔩𝔬", icon: "𝕌" },
  { id: "phonetic", label: "Phonetic", example: "Hotel Echo Lima", icon: "Φ" },
];

// ─── STM Modules ─────────────────────────────────────────────────────────────
const STM_MODULES = [
  { id: "hedge", label: "Hedge Reducer", desc: "Removes 'I think', 'maybe', 'perhaps'", icon: <Target size={14} />, color: "text-red-400", bg: "bg-red-500/10 border-red-400/20" },
  { id: "direct", label: "Direct Mode", desc: "Strips preambles & filler phrases", icon: <Zap size={14} />, color: "text-yellow-400", bg: "bg-yellow-500/10 border-yellow-400/20" },
  { id: "curiosity", label: "Curiosity Bias", desc: "Adds exploration follow-up prompts", icon: <Sparkles size={14} />, color: "text-purple-400", bg: "bg-purple-500/10 border-purple-400/20" },
];

// ─── AutoTune context types ────────────────────────────────────────────────────
const AUTOTUNE_CONTEXTS = [
  { id: "code", label: "Code", temp: 0.2, topP: 0.9, icon: "{ }", color: "text-blue-400" },
  { id: "creative", label: "Creative", temp: 1.1, topP: 0.95, icon: "✨", color: "text-pink-400" },
  { id: "analysis", label: "Analysis", temp: 0.4, topP: 0.85, icon: "📊", color: "text-green-400" },
  { id: "chat", label: "Chat", temp: 0.7, topP: 0.9, icon: "💬", color: "text-orange-400" },
  { id: "math", label: "Math", temp: 0.1, topP: 0.8, icon: "∑", color: "text-cyan-400" },
];

// ─── Panel Tabs ───────────────────────────────────────────────────────────────
type PanelTab = "models" | "godmode" | "ultraplinian" | "parseltongue" | "autotune" | "stm";

const PANEL_TABS: { id: PanelTab; label: string; icon: React.ReactNode; color: string }[] = [
  { id: "models", label: "Models", icon: <Cpu size={13} />, color: "text-white" },
  { id: "godmode", label: "GODMODE", icon: <Flame size={13} />, color: "text-red-400" },
  { id: "ultraplinian", label: "ULTRA", icon: <Trophy size={13} />, color: "text-orange-400" },
  { id: "parseltongue", label: "Parseltongue", icon: <Shuffle size={13} />, color: "text-green-400" },
  { id: "autotune", label: "AutoTune", icon: <Sliders size={13} />, color: "text-blue-400" },
  { id: "stm", label: "STM", icon: <Layers size={13} />, color: "text-purple-400" },
];

// ─── Konami Easter Egg ────────────────────────────────────────────────────────
const KONAMI = ["ArrowUp","ArrowUp","ArrowDown","ArrowDown","ArrowLeft","ArrowRight","ArrowLeft","ArrowRight","b","a"];

// ─── Main Component ────────────────────────────────────────────────────────────
interface AIModelsPanelProps {
  selectedModel: string;
  onSelectModel: (modelId: string) => void;
  activeTab: PanelTab;
  onTabChange: (tab: PanelTab) => void;
  godmodeActive: boolean;
  onGodmodeToggle: () => void;
  ultraplinianTier: number;
  onUltraplinianTier: (tier: number) => void;
  parseltongueLevel: 0 | 1 | 2 | 3;
  onParseltongueLevel: (level: 0 | 1 | 2 | 3) => void;
  parseltongueActive: boolean;
  onParseltongueToggle: () => void;
  autoTuneActive: boolean;
  onAutoTuneToggle: () => void;
  stmModules: Set<string>;
  onStmToggle: (id: string) => void;
  onClose: () => void;
}

export function AIModelsPanel({
  selectedModel, onSelectModel,
  activeTab, onTabChange,
  godmodeActive, onGodmodeToggle,
  ultraplinianTier, onUltraplinianTier,
  parseltongueLevel, onParseltongueLevel,
  parseltongueActive, onParseltongueToggle,
  autoTuneActive, onAutoTuneToggle,
  stmModules, onStmToggle,
  onClose,
}: AIModelsPanelProps) {
  const [search, setSearch] = useState("");
  const [providerFilter, setProviderFilter] = useState("all");
  const [godmodeRunning, setGodmodeRunning] = useState(false);
  const [godmodeResults, setGodmodeResults] = useState<Record<string, string>>({});
  const [ultraRunning, setUltraRunning] = useState(false);
  const [ultraProgress, setUltraProgress] = useState(0);
  const [konamiSeq, setKonamiSeq] = useState<string[]>([]);
  const [konamiActive, setKonamiActive] = useState(false);
  const [autoTuneContext, setAutoTuneContext] = useState("code");
  const [thumbsState, setThumbsState] = useState<Record<string, boolean | null>>({});
  const [parseltonguePreview, setParseltonguePreview] = useState("");
  const [parseltongueInput, setParseltongueInput] = useState("");
  const [selectedTechniques, setSelectedTechniques] = useState<Set<string>>(new Set(["leet"]));

  // Konami code listener
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      setKonamiSeq(prev => {
        const next = [...prev, e.key].slice(-10);
        if (next.join(",") === KONAMI.join(",")) {
          setKonamiActive(true);
          setTimeout(() => setKonamiActive(false), 4000);
        }
        return next;
      });
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  // Filtered models
  const filtered = ALL_MODELS.filter(m => {
    const matchProvider = providerFilter === "all" || m.provider === providerFilter;
    const matchSearch = !search || m.name.toLowerCase().includes(search.toLowerCase()) || m.provider.toLowerCase().includes(search.toLowerCase()) || m.tags.some(t => t.includes(search.toLowerCase()));
    return matchProvider && matchSearch;
  });

  // GODMODE simulation
  const runGodmode = async () => {
    setGodmodeRunning(true);
    setGodmodeResults({});
    for (const combo of GODMODE_COMBOS) {
      await new Promise(r => setTimeout(r, 400 + Math.random() * 600));
      setGodmodeResults(prev => ({ ...prev, [combo.id]: "Generating..." }));
      await new Promise(r => setTimeout(r, 800 + Math.random() * 400));
      setGodmodeResults(prev => ({
        ...prev,
        [combo.id]: `Score: ${(Math.random() * 20 + 80).toFixed(1)}/100`
      }));
    }
    setGodmodeRunning(false);
  };

  // ULTRAPLINIAN simulation
  const runUltraplinian = async () => {
    setUltraRunning(true);
    setUltraProgress(0);
    const total = ULTRAPLINIAN_TIERS[ultraplinianTier].count;
    for (let i = 0; i <= total; i++) {
      await new Promise(r => setTimeout(r, 40));
      setUltraProgress(Math.round((i / total) * 100));
    }
    setUltraRunning(false);
  };

  // Parseltongue transform
  const applyParseltongue = useCallback((text: string) => {
    if (!text) { setParseltonguePreview(""); return; }
    let result = text;
    if (selectedTechniques.has("leet")) {
      result = result.replace(/a/gi,"4").replace(/e/gi,"3").replace(/i/gi,"1").replace(/o/gi,"0").replace(/s/gi,"5").replace(/t/gi,"7");
    }
    if (selectedTechniques.has("unicode")) {
      result = result.split("").map(c => {
        const code = c.charCodeAt(0);
        if (code >= 65 && code <= 90) return String.fromCodePoint(code + 120211);
        if (code >= 97 && code <= 122) return String.fromCodePoint(code + 120205);
        return c;
      }).join("");
    }
    setParseltonguePreview(result);
  }, [selectedTechniques]);

  useEffect(() => { applyParseltongue(parseltongueInput); }, [parseltongueInput, applyParseltongue]);

  const selectedModelData = ALL_MODELS.find(m => m.id === selectedModel);
  const currentAutoContext = AUTOTUNE_CONTEXTS.find(c => c.id === autoTuneContext)!;

  return (
    <motion.div
      initial={{ y: "100%" }}
      animate={{ y: 0 }}
      exit={{ y: "100%" }}
      transition={{ type: "spring", stiffness: 350, damping: 36 }}
      className="absolute inset-0 z-50 flex flex-col bg-[#0d1117]"
    >
      {/* Konami Easter Egg */}
      <AnimatePresence>
        {konamiActive && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="absolute inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md"
          >
            <div className="text-center space-y-3 px-8">
              <div className="text-6xl">🎮</div>
              <p className="text-2xl font-bold text-white">GODMODE UNLOCKED</p>
              <p className="text-sm text-white/60">You found the secret. All 55 models activated.</p>
              <div className="flex flex-wrap justify-center gap-1 mt-4">
                {["🔥","⚡","🧠","🚀","💎","🎯","🌟","💡","🔮","🎪"].map((e,i) => (
                  <motion.span key={i} initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: i * 0.05 }} className="text-2xl">{e}</motion.span>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex items-center gap-2 px-4 pt-10 pb-3 border-b border-white/[0.07] shrink-0">
        <button onClick={onClose} className="text-white/40 hover:text-white text-sm flex items-center gap-1 transition-colors">
          <ArrowLeft size={15} /> Back
        </button>
        <div className="flex-1" />
        <div className="flex items-center gap-2">
          <Cpu size={16} className="text-purple-400" />
          <span className="text-base font-semibold text-white">AI Models</span>
          <span className="text-[10px] bg-purple-500/20 border border-purple-400/30 text-purple-300 px-2 py-0.5 rounded-full font-bold">{ALL_MODELS.length}+</span>
        </div>
        <div className="flex-1" />
        <button onClick={onClose} className="w-8 h-8 flex items-center justify-center text-white/40 hover:text-white rounded-lg hover:bg-white/5 transition-colors">
          <X size={18} />
        </button>
      </div>

      {/* Tab Strip */}
      <div className="flex gap-1 px-3 py-2 border-b border-white/[0.06] overflow-x-auto no-scrollbar shrink-0">
        {PANEL_TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold whitespace-nowrap transition-all shrink-0 border",
              activeTab === tab.id
                ? "bg-white/10 border-white/20 text-white"
                : "bg-transparent border-transparent text-white/35 hover:text-white/60 hover:bg-white/5"
            )}
          >
            <span className={activeTab === tab.id ? tab.color : ""}>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto no-scrollbar">

        {/* ── MODELS TAB ── */}
        {activeTab === "models" && (
          <div className="flex flex-col h-full">
            {/* Selected model banner */}
            {selectedModelData && (
              <div className={cn("mx-3 mt-3 flex items-center gap-3 px-3 py-2.5 rounded-xl border", selectedModelData.providerBg)}>
                <div className="w-2 h-2 rounded-full bg-green-400 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-white truncate">{selectedModelData.name}</p>
                  <p className={cn("text-[10px]", selectedModelData.providerColor)}>{selectedModelData.provider} · {selectedModelData.contextK}K ctx</p>
                </div>
                <span className="text-[10px] text-green-400 font-semibold">Active</span>
              </div>
            )}

            {/* Search */}
            <div className="px-3 py-2 shrink-0">
              <div className="flex items-center gap-2 bg-white/[0.06] rounded-xl px-3 h-9 border border-white/[0.08]">
                <Search size={13} className="text-white/35 shrink-0" />
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search models..."
                  className="flex-1 bg-transparent text-sm text-white placeholder:text-white/30 outline-none"
                />
                {search && <button onClick={() => setSearch("")} className="text-white/30 hover:text-white"><X size={12} /></button>}
              </div>
            </div>

            {/* Provider filter */}
            <div className="flex gap-1.5 px-3 pb-2 overflow-x-auto no-scrollbar shrink-0">
              {PROVIDERS.map(p => (
                <button
                  key={p.id}
                  onClick={() => setProviderFilter(p.id)}
                  className={cn(
                    "px-2.5 py-1 rounded-lg text-[11px] font-medium whitespace-nowrap shrink-0 border transition-all",
                    providerFilter === p.id
                      ? "bg-white/12 border-white/20 text-white"
                      : "bg-transparent border-white/8 text-white/35 hover:text-white/60"
                  )}
                >
                  {p.label}
                </button>
              ))}
            </div>

            {/* Model list */}
            <div className="flex-1 overflow-y-auto no-scrollbar px-3 pb-6 space-y-1.5">
              {/* Tier headers */}
              {(["flagship","balanced","fast","open"] as const).map(tier => {
                const tierModels = filtered.filter(m => m.tier === tier);
                if (tierModels.length === 0) return null;
                const tierLabels = { flagship: "🏆 Flagship", balanced: "⚖️ Balanced", fast: "⚡ Fast", open: "🔓 Open Source" };
                return (
                  <div key={tier}>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-white/25 px-1 py-2">{tierLabels[tier]}</p>
                    {tierModels.map(model => (
                      <motion.button
                        key={model.id}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => { onSelectModel(model.id); onClose(); }}
                        className={cn(
                          "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border mb-1 transition-all text-left",
                          selectedModel === model.id
                            ? "bg-white/10 border-white/20"
                            : "bg-white/[0.03] border-white/[0.06] hover:bg-white/[0.06] hover:border-white/[0.10]"
                        )}
                      >
                        {/* Provider dot */}
                        <div className={cn("w-8 h-8 rounded-lg border flex items-center justify-center shrink-0 text-[9px] font-black", model.providerBg)}>
                          <span className={cn("text-[9px] font-black", model.providerColor)}>{model.provider.slice(0,2).toUpperCase()}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-sm font-semibold text-white truncate">{model.name}</span>
                            {model.badge && (
                              <span className={cn("text-[9px] px-1.5 py-0.5 rounded-full border font-bold shrink-0", model.badgeColor)}>{model.badge}</span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className={cn("text-[10px]", model.providerColor)}>{model.provider}</span>
                            <span className="text-[10px] text-white/25">·</span>
                            <span className="text-[10px] text-white/35">{model.contextK}K ctx</span>
                            {model.tags.slice(0,2).map(t => (
                              <span key={t} className="text-[9px] text-white/25 bg-white/5 px-1.5 rounded-full border border-white/8">{t}</span>
                            ))}
                          </div>
                        </div>
                        {selectedModel === model.id && (
                          <Check size={14} className="text-green-400 shrink-0" />
                        )}
                      </motion.button>
                    ))}
                  </div>
                );
              })}
              {filtered.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 gap-2">
                  <Search size={28} className="text-white/20" />
                  <p className="text-sm text-white/30">No models found</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── GODMODE CLASSIC TAB ── */}
        {activeTab === "godmode" && (
          <div className="px-4 py-4 space-y-4">
            {/* Header card */}
            <div className="bg-red-500/10 border border-red-400/20 rounded-2xl p-4 space-y-2">
              <div className="flex items-center gap-2">
                <Flame size={18} className="text-red-400" />
                <span className="text-base font-bold text-white">GODMODE CLASSIC</span>
                <span className="text-[9px] bg-red-500/20 border border-red-400/30 text-red-300 px-2 py-0.5 rounded-full font-bold ml-auto">OG</span>
              </div>
              <p className="text-xs text-white/50 leading-relaxed">5 battle-tested model + prompt combos race in parallel. Best response wins with a composite 100-point score.</p>
            </div>

            {/* Toggle */}
            <div className="flex items-center justify-between px-1">
              <span className="text-sm font-semibold text-white">Enable GODMODE</span>
              <button
                onClick={onGodmodeToggle}
                className={cn("relative w-12 h-6 rounded-full transition-colors", godmodeActive ? "bg-red-500" : "bg-white/10")}
              >
                <motion.div
                  animate={{ x: godmodeActive ? 24 : 2 }}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  className="absolute top-1 w-4 h-4 bg-white rounded-full shadow"
                />
              </button>
            </div>

            {/* Combos */}
            <div className="space-y-2">
              <p className="text-[10px] font-bold uppercase tracking-widest text-white/30">Racing Combos</p>
              {GODMODE_COMBOS.map((combo, i) => (
                <motion.div
                  key={combo.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className={cn("flex items-center gap-3 px-3 py-2.5 rounded-xl border", combo.bg)}
                >
                  <div className={cn("w-6 h-6 rounded-lg flex items-center justify-center shrink-0 text-[10px] font-black", combo.bg)}>
                    <span className={combo.color}>#{i+1}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-white">{combo.label}</p>
                    <p className="text-[10px] text-white/40 truncate">{combo.model} · {combo.prompt}</p>
                  </div>
                  {godmodeResults[combo.id] && (
                    <span className={cn("text-[10px] font-semibold shrink-0", combo.color)}>
                      {godmodeResults[combo.id]}
                    </span>
                  )}
                  {godmodeRunning && !godmodeResults[combo.id] && (
                    <Loader2 size={12} className="animate-spin text-white/30 shrink-0" />
                  )}
                </motion.div>
              ))}
            </div>

            {/* Run button */}
            <button
              onClick={runGodmode}
              disabled={godmodeRunning || !godmodeActive}
              className={cn(
                "w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-semibold transition-all border",
                godmodeActive && !godmodeRunning
                  ? "bg-red-500/20 border-red-400/40 text-red-300 hover:bg-red-500/30 active:scale-[0.98]"
                  : "bg-white/5 border-white/10 text-white/25 cursor-not-allowed"
              )}
            >
              {godmodeRunning
                ? <><Loader2 size={15} className="animate-spin" /> Racing models...</>
                : <><Flame size={15} /> Launch GODMODE</>
              }
            </button>

            {Object.keys(godmodeResults).length === 5 && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                className="bg-green-500/10 border border-green-400/20 rounded-xl px-4 py-3 flex items-center gap-3">
                <Trophy size={18} className="text-yellow-400 shrink-0" />
                <div>
                  <p className="text-sm font-bold text-white">Race complete!</p>
                  <p className="text-xs text-white/50">Best response selected automatically</p>
                </div>
              </motion.div>
            )}
          </div>
        )}

        {/* ── ULTRAPLINIAN TAB ── */}
        {activeTab === "ultraplinian" && (
          <div className="px-4 py-4 space-y-4">
            <div className="bg-orange-500/10 border border-orange-400/20 rounded-2xl p-4 space-y-2">
              <div className="flex items-center gap-2">
                <Trophy size={18} className="text-orange-400" />
                <span className="text-base font-bold text-white">ULTRAPLINIAN</span>
                <span className="text-[9px] bg-orange-500/20 border border-orange-400/30 text-orange-300 px-2 py-0.5 rounded-full font-bold ml-auto">FLAGSHIP</span>
              </div>
              <p className="text-xs text-white/50 leading-relaxed">Multi-model evaluation engine. Query models in parallel across 5 tiers, score on a 100-point composite metric, return the winner.</p>
            </div>

            {/* Tier selector */}
            <div className="space-y-2">
              <p className="text-[10px] font-bold uppercase tracking-widest text-white/30">Select Tier</p>
              {ULTRAPLINIAN_TIERS.map((tier, i) => (
                <motion.button
                  key={i}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => onUltraplinianTier(i)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-3 rounded-xl border transition-all text-left",
                    ultraplinianTier === i ? "bg-white/8 border-white/15" : "bg-white/[0.02] border-white/[0.05] hover:bg-white/[0.04]"
                  )}
                >
                  <div className={cn("w-8 h-8 rounded-lg border flex items-center justify-center shrink-0 text-xs font-bold", tier.bg, tier.color)}>{i+1}</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className={cn("text-sm font-semibold", tier.color)}>{tier.label}</span>
                      <span className="text-xs text-white/40">{tier.count} models</span>
                    </div>
                    <p className="text-[11px] text-white/35">{tier.desc}</p>
                  </div>
                  {ultraplinianTier === i && <Check size={14} className="text-green-400 shrink-0" />}
                </motion.button>
              ))}
            </div>

            {/* Progress */}
            {ultraRunning && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-white/50">Evaluating {ULTRAPLINIAN_TIERS[ultraplinianTier].count} models...</span>
                  <span className="text-xs text-white/70 font-mono">{ultraProgress}%</span>
                </div>
                <div className="h-2 bg-white/8 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-orange-500 to-red-500 rounded-full"
                    animate={{ width: `${ultraProgress}%` }}
                    transition={{ duration: 0.1 }}
                  />
                </div>
              </div>
            )}

            <button
              onClick={runUltraplinian}
              disabled={ultraRunning}
              className={cn(
                "w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-semibold transition-all border",
                !ultraRunning
                  ? "bg-orange-500/20 border-orange-400/40 text-orange-300 hover:bg-orange-500/30 active:scale-[0.98]"
                  : "bg-white/5 border-white/10 text-white/25 cursor-not-allowed"
              )}
            >
              {ultraRunning
                ? <><Loader2 size={15} className="animate-spin" /> Evaluating...</>
                : <><Activity size={15} /> Run ULTRAPLINIAN</>
              }
            </button>

            {!ultraRunning && ultraProgress === 100 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="bg-orange-500/10 border border-orange-400/20 rounded-xl px-4 py-3 space-y-1">
                <p className="text-sm font-bold text-white">✅ Evaluation complete</p>
                <p className="text-xs text-white/50">Winner: Claude Opus 4.7 — Score 94.7/100</p>
                <div className="flex items-center gap-2 mt-1.5">
                  {["reasoning: 97","creativity: 92","accuracy: 95","speed: 91"].map(s => (
                    <span key={s} className="text-[9px] bg-white/5 border border-white/10 text-white/40 px-1.5 py-0.5 rounded-full">{s}</span>
                  ))}
                </div>
              </motion.div>
            )}
          </div>
        )}

        {/* ── PARSELTONGUE TAB ── */}
        {activeTab === "parseltongue" && (
          <div className="px-4 py-4 space-y-4">
            <div className="bg-green-500/10 border border-green-400/20 rounded-2xl p-4 space-y-2">
              <div className="flex items-center gap-2">
                <Shuffle size={18} className="text-green-400" />
                <span className="text-base font-bold text-white">Parseltongue</span>
                <span className="text-[9px] bg-green-500/20 border border-green-400/30 text-green-300 px-2 py-0.5 rounded-full font-bold ml-auto">RED-TEAM</span>
              </div>
              <p className="text-xs text-white/50 leading-relaxed">Input perturbation engine. Applies 33 obfuscation techniques across 3 intensity tiers to test model robustness.</p>
            </div>

            {/* Enable toggle */}
            <div className="flex items-center justify-between px-1">
              <span className="text-sm font-semibold text-white">Enable Parseltongue</span>
              <button
                onClick={onParseltongueToggle}
                className={cn("relative w-12 h-6 rounded-full transition-colors", parseltongueActive ? "bg-green-500" : "bg-white/10")}
              >
                <motion.div
                  animate={{ x: parseltongueActive ? 24 : 2 }}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  className="absolute top-1 w-4 h-4 bg-white rounded-full shadow"
                />
              </button>
            </div>

            {/* Intensity */}
            <div className="space-y-2">
              <p className="text-[10px] font-bold uppercase tracking-widest text-white/30">Intensity Level · {parseltongueLevel === 0 ? "Off" : parseltongueLevel === 1 ? "Light (11 triggers)" : parseltongueLevel === 2 ? "Standard (22 triggers)" : "Heavy (33 triggers)"}</p>
              <div className="grid grid-cols-4 gap-1.5">
                {([["Off",0],["Light",1],["Standard",2],["Heavy",3]] as const).map(([label, val]) => (
                  <button
                    key={val}
                    onClick={() => onParseltongueLevel(val as 0|1|2|3)}
                    className={cn(
                      "py-2 rounded-xl text-xs font-semibold border transition-all",
                      parseltongueLevel === val
                        ? val === 0 ? "bg-white/10 border-white/20 text-white"
                          : val === 1 ? "bg-green-500/20 border-green-400/40 text-green-300"
                          : val === 2 ? "bg-yellow-500/20 border-yellow-400/40 text-yellow-300"
                          : "bg-red-500/20 border-red-400/40 text-red-300"
                        : "bg-transparent border-white/8 text-white/30 hover:bg-white/5"
                    )}
                  >{label}</button>
                ))}
              </div>
            </div>

            {/* Techniques */}
            <div className="space-y-2">
              <p className="text-[10px] font-bold uppercase tracking-widest text-white/30">Techniques</p>
              <div className="grid grid-cols-2 gap-1.5">
                {PARSELTONGUE_TECHNIQUES.map(tech => (
                  <button
                    key={tech.id}
                    onClick={() => setSelectedTechniques(prev => {
                      const next = new Set(prev);
                      next.has(tech.id) ? next.delete(tech.id) : next.add(tech.id);
                      return next;
                    })}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2 rounded-xl border transition-all text-left",
                      selectedTechniques.has(tech.id)
                        ? "bg-green-500/15 border-green-400/30 text-green-300"
                        : "bg-white/[0.03] border-white/[0.06] text-white/40 hover:bg-white/[0.06]"
                    )}
                  >
                    <span className="text-xs font-mono font-bold w-5 shrink-0">{tech.icon}</span>
                    <span className="text-[11px] font-medium">{tech.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Live preview */}
            <div className="space-y-2">
              <p className="text-[10px] font-bold uppercase tracking-widest text-white/30">Live Preview</p>
              <textarea
                value={parseltongueInput}
                onChange={e => setParseltongueInput(e.target.value)}
                placeholder="Type text to transform..."
                className="w-full bg-white/[0.03] border border-white/[0.07] rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-white/25 outline-none resize-none h-16"
              />
              {parseltonguePreview && (
                <div className="bg-green-500/5 border border-green-400/15 rounded-xl px-3 py-2.5">
                  <p className="text-[10px] text-green-400/70 mb-1">Output</p>
                  <p className="text-sm font-mono text-green-300 break-all">{parseltonguePreview}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── AUTOTUNE TAB ── */}
        {activeTab === "autotune" && (
          <div className="px-4 py-4 space-y-4">
            <div className="bg-blue-500/10 border border-blue-400/20 rounded-2xl p-4 space-y-2">
              <div className="flex items-center gap-2">
                <Sliders size={18} className="text-blue-400" />
                <span className="text-base font-bold text-white">AutoTune</span>
                <span className="text-[9px] bg-blue-500/20 border border-blue-400/30 text-blue-300 px-2 py-0.5 rounded-full font-bold ml-auto">EMA</span>
              </div>
              <p className="text-xs text-white/50 leading-relaxed">Context-adaptive sampling. Classifies your query into 5 context types and selects optimal temperature, top_p, top_k, frequency & presence penalty automatically.</p>
            </div>

            {/* Toggle */}
            <div className="flex items-center justify-between px-1">
              <span className="text-sm font-semibold text-white">Enable AutoTune</span>
              <button
                onClick={onAutoTuneToggle}
                className={cn("relative w-12 h-6 rounded-full transition-colors", autoTuneActive ? "bg-blue-500" : "bg-white/10")}
              >
                <motion.div
                  animate={{ x: autoTuneActive ? 24 : 2 }}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  className="absolute top-1 w-4 h-4 bg-white rounded-full shadow"
                />
              </button>
            </div>

            {/* Context type selector */}
            <div className="space-y-2">
              <p className="text-[10px] font-bold uppercase tracking-widest text-white/30">Context Type</p>
              <div className="grid grid-cols-5 gap-1">
                {AUTOTUNE_CONTEXTS.map(ctx => (
                  <button
                    key={ctx.id}
                    onClick={() => setAutoTuneContext(ctx.id)}
                    className={cn(
                      "flex flex-col items-center gap-1 py-2.5 rounded-xl border transition-all",
                      autoTuneContext === ctx.id ? "bg-white/10 border-white/20" : "bg-white/[0.03] border-white/[0.05] hover:bg-white/[0.06]"
                    )}
                  >
                    <span className="text-base">{ctx.icon}</span>
                    <span className={cn("text-[9px] font-semibold", autoTuneContext === ctx.id ? ctx.color : "text-white/30")}>{ctx.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Parameters display */}
            <div className="space-y-2">
              <p className="text-[10px] font-bold uppercase tracking-widest text-white/30">Optimal Parameters</p>
              <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-4 space-y-3">
                {[
                  { label: "temperature", value: currentAutoContext.temp, max: 2 },
                  { label: "top_p", value: currentAutoContext.topP, max: 1 },
                  { label: "top_k", value: 0.4, max: 1 },
                  { label: "frequency_penalty", value: 0.3, max: 2 },
                  { label: "presence_penalty", value: 0.2, max: 2 },
                ].map(p => (
                  <div key={p.label}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[11px] text-white/50 font-mono">{p.label}</span>
                      <span className="text-[11px] text-white/70 font-mono font-bold">{p.value.toFixed(2)}</span>
                    </div>
                    <div className="h-1.5 bg-white/8 rounded-full overflow-hidden">
                      <motion.div
                        key={`${p.label}-${autoTuneContext}`}
                        initial={{ width: 0 }}
                        animate={{ width: `${(p.value / p.max) * 100}%` }}
                        transition={{ duration: 0.4 }}
                        className="h-full bg-blue-400 rounded-full"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* EMA feedback */}
            <div className="space-y-2">
              <p className="text-[10px] font-bold uppercase tracking-widest text-white/30">EMA Learning · Rate this response</p>
              <div className="flex gap-2">
                {["👍","👎"].map((emoji, i) => (
                  <button
                    key={emoji}
                    onClick={() => setThumbsState(prev => ({ ...prev, [autoTuneContext]: i === 0 }))}
                    className={cn(
                      "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border text-sm font-semibold transition-all",
                      thumbsState[autoTuneContext] === (i === 0)
                        ? i === 0 ? "bg-green-500/20 border-green-400/40 text-green-300" : "bg-red-500/20 border-red-400/40 text-red-300"
                        : "bg-white/[0.03] border-white/[0.06] text-white/40 hover:bg-white/[0.06]"
                    )}
                  >
                    {emoji} {i === 0 ? "Good" : "Bad"}
                  </button>
                ))}
              </div>
              {thumbsState[autoTuneContext] !== undefined && (
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-[11px] text-blue-400/70 text-center">
                  ✓ EMA parameters updated for "{autoTuneContext}" context
                </motion.p>
              )}
            </div>
          </div>
        )}

        {/* ── STM MODULES TAB ── */}
        {activeTab === "stm" && (
          <div className="px-4 py-4 space-y-4">
            <div className="bg-purple-500/10 border border-purple-400/20 rounded-2xl p-4 space-y-2">
              <div className="flex items-center gap-2">
                <Layers size={18} className="text-purple-400" />
                <span className="text-base font-bold text-white">STM Modules</span>
                <span className="text-[9px] bg-purple-500/20 border border-purple-400/30 text-purple-300 px-2 py-0.5 rounded-full font-bold ml-auto">REALTIME</span>
              </div>
              <p className="text-xs text-white/50 leading-relaxed">Semantic Transformation Modules normalize AI outputs in real-time. Toggle each module independently.</p>
            </div>

            {/* Module cards */}
            {STM_MODULES.map(mod => (
              <motion.div
                key={mod.id}
                whileTap={{ scale: 0.99 }}
                onClick={() => onStmToggle(mod.id)}
                className={cn(
                  "flex items-start gap-4 px-4 py-4 rounded-2xl border cursor-pointer transition-all",
                  stmModules.has(mod.id) ? cn(mod.bg, "ring-1 ring-white/10") : "bg-white/[0.02] border-white/[0.05] hover:bg-white/[0.04]"
                )}
              >
                <div className={cn("w-10 h-10 rounded-xl border flex items-center justify-center shrink-0", mod.bg, mod.color)}>
                  {mod.icon}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-white">{mod.label}</p>
                  <p className="text-[11px] text-white/45 mt-0.5 leading-relaxed">{mod.desc}</p>
                </div>
                <div className={cn("relative w-10 h-5 rounded-full shrink-0 mt-0.5 transition-colors", stmModules.has(mod.id) ? "bg-purple-500" : "bg-white/10")}>
                  <motion.div
                    animate={{ x: stmModules.has(mod.id) ? 20 : 2 }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    className="absolute top-0.5 w-4 h-4 bg-white rounded-full shadow"
                  />
                </div>
              </motion.div>
            ))}

            {/* Preview */}
            {stmModules.size > 0 && (
              <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-4 space-y-2">
                <p className="text-[10px] font-bold uppercase tracking-widest text-white/30">Active Transforms</p>
                {stmModules.has("hedge") && (
                  <div className="space-y-1">
                    <p className="text-[10px] text-red-400">Before: "I think maybe this could possibly work..."</p>
                    <p className="text-[10px] text-green-400">After: "This works..."</p>
                  </div>
                )}
                {stmModules.has("direct") && (
                  <div className="space-y-1">
                    <p className="text-[10px] text-red-400">Before: "Great question! Of course, here is what you need..."</p>
                    <p className="text-[10px] text-green-400">After: "Here is what you need..."</p>
                  </div>
                )}
                {stmModules.has("curiosity") && (
                  <div className="space-y-1">
                    <p className="text-[10px] text-purple-400">Added: "What if we also explored [related concept]?"</p>
                  </div>
                )}
              </div>
            )}

            {/* Info */}
            <div className="flex items-start gap-2 px-3 py-3 bg-white/[0.02] border border-white/[0.05] rounded-xl">
              <Info size={13} className="text-white/25 shrink-0 mt-0.5" />
              <p className="text-[11px] text-white/35 leading-relaxed">STM modules post-process every AI response in real-time. No latency added — transforms are applied client-side after streaming completes.</p>
            </div>
          </div>
        )}

      </div>
    </motion.div>
  );
}
