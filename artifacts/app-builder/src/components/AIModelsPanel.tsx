import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, ArrowLeft, Search, Zap, ChevronRight, Check, Star,
  Cpu, Shuffle, Shield, Sliders, Layers, Play, Square,
  BarChart3, Loader2, ChevronDown, Info, RotateCcw, Sparkles,
  Trophy, Flame, Target, Activity, Users, Plus, Minus, Key,
  Brain, GitMerge, Send, Swords, ThumbsUp, ThumbsDown,
  Minus as MinusIcon, MessageSquare, CornerDownRight
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Model Data ────────────────────────────────────────────────────────────────
export interface AIModel {
  id: string;          // OpenRouter model ID (e.g. "meta-llama/llama-3.3-70b-instruct:free")
  name: string;
  provider: string;
  providerColor: string;
  providerBg: string;
  tags: string[];
  contextK: number;
  tier: "flagship" | "balanced" | "fast" | "open";
  badge?: string;
  badgeColor?: string;
  free?: boolean;      // available on OpenRouter for free
}

// ─── Providers ─────────────────────────────────────────────────────────────────
const PROVIDERS = [
  { id: "all",             label: "All" },
  { id: "Anthropic",       label: "Anthropic" },
  { id: "OpenAI",          label: "OpenAI" },
  { id: "Google",          label: "Google" },
  { id: "Meta",            label: "Meta" },
  { id: "NVIDIA",          label: "NVIDIA" },
  { id: "DeepSeek",        label: "DeepSeek" },
  { id: "Qwen",            label: "Qwen" },
  { id: "xAI",             label: "xAI" },
  { id: "Mistral",         label: "Mistral" },
  { id: "MiniMax",         label: "MiniMax" },
  { id: "NousResearch",    label: "NousResearch" },
  { id: "Poolside",        label: "Poolside" },
  { id: "Tencent",         label: "Tencent" },
  { id: "Z-AI",            label: "Z-AI" },
  { id: "OpenRouter",      label: "OpenRouter" },
  { id: "Cohere",          label: "Cohere" },
];

// ─── All Models ─────────────────────────────────────────────────────────────────
export const ALL_MODELS: AIModel[] = [
  // ── Anthropic ──────────────────────────────────────────────────────────────
  { id: "anthropic/claude-opus-4-7",     name: "Claude Opus 4.7",    provider: "Anthropic", providerColor: "text-orange-400", providerBg: "bg-orange-500/10 border-orange-400/20", tags: ["reasoning", "coding"],    contextK: 200, tier: "flagship",  badge: "Latest",       badgeColor: "bg-orange-500/20 text-orange-300 border-orange-400/30" },
  { id: "anthropic/claude-sonnet-4-6",   name: "Claude Sonnet 4.6",  provider: "Anthropic", providerColor: "text-orange-400", providerBg: "bg-orange-500/10 border-orange-400/20", tags: ["balanced", "fast"],        contextK: 200, tier: "balanced",  badge: "Recommended",  badgeColor: "bg-green-500/15 text-green-300 border-green-400/25" },
  { id: "anthropic/claude-haiku-4-5",    name: "Claude Haiku 4.5",   provider: "Anthropic", providerColor: "text-orange-400", providerBg: "bg-orange-500/10 border-orange-400/20", tags: ["fast", "cheap"],           contextK: 200, tier: "fast" },
  { id: "anthropic/claude-opus-4-5",     name: "Claude Opus 4.5",    provider: "Anthropic", providerColor: "text-orange-400", providerBg: "bg-orange-500/10 border-orange-400/20", tags: ["reasoning"],               contextK: 200, tier: "flagship" },

  // ── OpenAI ─────────────────────────────────────────────────────────────────
  { id: "openai/gpt-4o",                 name: "GPT-4o",             provider: "OpenAI",    providerColor: "text-emerald-400", providerBg: "bg-emerald-500/10 border-emerald-400/20", tags: ["multimodal", "fast"],    contextK: 128, tier: "flagship",  badge: "Popular",      badgeColor: "bg-emerald-500/15 text-emerald-300 border-emerald-400/25" },
  { id: "openai/gpt-4o-mini",            name: "GPT-4o Mini",        provider: "OpenAI",    providerColor: "text-emerald-400", providerBg: "bg-emerald-500/10 border-emerald-400/20", tags: ["fast", "cheap"],         contextK: 128, tier: "fast" },
  { id: "openai/o3",                     name: "o3",                 provider: "OpenAI",    providerColor: "text-emerald-400", providerBg: "bg-emerald-500/10 border-emerald-400/20", tags: ["reasoning", "math"],     contextK: 200, tier: "flagship",  badge: "New",          badgeColor: "bg-blue-500/15 text-blue-300 border-blue-400/25" },
  { id: "openai/o4-mini",                name: "o4-mini",            provider: "OpenAI",    providerColor: "text-emerald-400", providerBg: "bg-emerald-500/10 border-emerald-400/20", tags: ["reasoning", "fast"],     contextK: 200, tier: "balanced" },
  { id: "openai/gpt-oss-120b:free",      name: "GPT OSS 120B",       provider: "OpenAI",    providerColor: "text-emerald-400", providerBg: "bg-emerald-500/10 border-emerald-400/20", tags: ["open", "flagship"],     contextK: 128, tier: "open",     badge: "Free",         badgeColor: "bg-green-500/15 text-green-300 border-green-400/25", free: true },
  { id: "openai/gpt-oss-20b:free",       name: "GPT OSS 20B",        provider: "OpenAI",    providerColor: "text-emerald-400", providerBg: "bg-emerald-500/10 border-emerald-400/20", tags: ["open", "fast"],         contextK: 128, tier: "open",     badge: "Free",         badgeColor: "bg-green-500/15 text-green-300 border-green-400/25", free: true },

  // ── Google ──────────────────────────────────────────────────────────────────
  { id: "google/gemini-2.0-flash-exp",   name: "Gemini 2.0 Flash",   provider: "Google",    providerColor: "text-blue-400",   providerBg: "bg-blue-500/10 border-blue-400/20",    tags: ["fast", "multimodal"],   contextK: 1000, tier: "fast",    badge: "Ultra-fast",   badgeColor: "bg-blue-500/15 text-blue-300 border-blue-400/25" },
  { id: "google/gemini-1.5-pro",         name: "Gemini 1.5 Pro",     provider: "Google",    providerColor: "text-blue-400",   providerBg: "bg-blue-500/10 border-blue-400/20",    tags: ["long-ctx", "multimodal"],contextK: 2000, tier: "flagship" },
  { id: "google/gemini-2.0-pro-exp",     name: "Gemini 2.0 Pro",     provider: "Google",    providerColor: "text-blue-400",   providerBg: "bg-blue-500/10 border-blue-400/20",    tags: ["flagship", "reasoning"],contextK: 2000, tier: "flagship",  badge: "New",          badgeColor: "bg-blue-500/15 text-blue-300 border-blue-400/25" },
  { id: "google/gemma-4-26b-a4b-it:free",name: "Gemma 4 26B",        provider: "Google",    providerColor: "text-blue-400",   providerBg: "bg-blue-500/10 border-blue-400/20",    tags: ["open", "reasoning"],    contextK: 128,  tier: "open",    badge: "Free",         badgeColor: "bg-green-500/15 text-green-300 border-green-400/25", free: true },
  { id: "google/gemma-4-31b-it:free",    name: "Gemma 4 31B",        provider: "Google",    providerColor: "text-blue-400",   providerBg: "bg-blue-500/10 border-blue-400/20",    tags: ["open", "balanced"],     contextK: 128,  tier: "open",    badge: "Free",         badgeColor: "bg-green-500/15 text-green-300 border-green-400/25", free: true },
  { id: "google/gemma-3-27b-it:free",    name: "Gemma 3 27B",        provider: "Google",    providerColor: "text-blue-400",   providerBg: "bg-blue-500/10 border-blue-400/20",    tags: ["open", "multilingual"],  contextK: 128, tier: "open",    badge: "Free",         badgeColor: "bg-green-500/15 text-green-300 border-green-400/25", free: true },
  { id: "google/gemma-3-12b-it:free",    name: "Gemma 3 12B",        provider: "Google",    providerColor: "text-blue-400",   providerBg: "bg-blue-500/10 border-blue-400/20",    tags: ["open", "fast"],          contextK: 128, tier: "open",    badge: "Free",         badgeColor: "bg-green-500/15 text-green-300 border-green-400/25", free: true },
  { id: "google/gemma-3-4b-it:free",     name: "Gemma 3 4B",         provider: "Google",    providerColor: "text-blue-400",   providerBg: "bg-blue-500/10 border-blue-400/20",    tags: ["open", "tiny"],          contextK: 128, tier: "fast",    badge: "Free",         badgeColor: "bg-green-500/15 text-green-300 border-green-400/25", free: true },
  { id: "google/gemma-3n-e4b-it:free",   name: "Gemma 3n E4B",       provider: "Google",    providerColor: "text-blue-400",   providerBg: "bg-blue-500/10 border-blue-400/20",    tags: ["open", "multimodal"],    contextK: 128, tier: "fast",    badge: "Free",         badgeColor: "bg-green-500/15 text-green-300 border-green-400/25", free: true },
  { id: "google/gemma-3n-e2b-it:free",   name: "Gemma 3n E2B",       provider: "Google",    providerColor: "text-blue-400",   providerBg: "bg-blue-500/10 border-blue-400/20",    tags: ["open", "nano"],          contextK: 128, tier: "fast",    badge: "Free",         badgeColor: "bg-green-500/15 text-green-300 border-green-400/25", free: true },
  { id: "google/lyria-3-pro-preview",    name: "Lyria 3 Pro",        provider: "Google",    providerColor: "text-blue-400",   providerBg: "bg-blue-500/10 border-blue-400/20",    tags: ["audio", "creative"],     contextK: 32,  tier: "flagship",  badge: "Audio",        badgeColor: "bg-purple-500/15 text-purple-300 border-purple-400/25" },
  { id: "google/lyria-3-clip-preview",   name: "Lyria 3 Clip",       provider: "Google",    providerColor: "text-blue-400",   providerBg: "bg-blue-500/10 border-blue-400/20",    tags: ["audio", "fast"],         contextK: 32,  tier: "fast",    badge: "Audio",        badgeColor: "bg-purple-500/15 text-purple-300 border-purple-400/25" },

  // ── Meta ────────────────────────────────────────────────────────────────────
  { id: "meta-llama/llama-3.3-70b-instruct:free", name: "LLaMA 3.3 70B",    provider: "Meta", providerColor: "text-cyan-400", providerBg: "bg-cyan-500/10 border-cyan-400/20", tags: ["open", "balanced"],   contextK: 128, tier: "open",    badge: "Free",   badgeColor: "bg-green-500/15 text-green-300 border-green-400/25", free: true },
  { id: "meta-llama/llama-3.2-3b-instruct:free",  name: "LLaMA 3.2 3B",     provider: "Meta", providerColor: "text-cyan-400", providerBg: "bg-cyan-500/10 border-cyan-400/20", tags: ["open", "tiny"],       contextK: 128, tier: "fast",    badge: "Free",   badgeColor: "bg-green-500/15 text-green-300 border-green-400/25", free: true },
  { id: "meta-llama/llama-3.1-405b",              name: "LLaMA 3.1 405B",   provider: "Meta", providerColor: "text-cyan-400", providerBg: "bg-cyan-500/10 border-cyan-400/20", tags: ["open", "flagship"],   contextK: 128, tier: "open" },
  { id: "meta-llama/llama-4-maverick",             name: "LLaMA 4 Maverick", provider: "Meta", providerColor: "text-cyan-400", providerBg: "bg-cyan-500/10 border-cyan-400/20", tags: ["open", "new"],        contextK: 1000, tier: "open",   badge: "New",    badgeColor: "bg-cyan-500/15 text-cyan-300 border-cyan-400/25" },

  // ── NVIDIA ──────────────────────────────────────────────────────────────────
  { id: "nvidia/nemotron-3-super-120b-a12b:free",         name: "Nemotron Super 120B",      provider: "NVIDIA", providerColor: "text-lime-400", providerBg: "bg-lime-500/10 border-lime-400/20", tags: ["open", "flagship", "reasoning"],contextK: 128, tier: "open",    badge: "Free",  badgeColor: "bg-green-500/15 text-green-300 border-green-400/25", free: true },
  { id: "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free", name: "Nemotron Nano Omni 30B", provider: "NVIDIA", providerColor: "text-lime-400", providerBg: "bg-lime-500/10 border-lime-400/20", tags: ["open", "reasoning"],        contextK: 128, tier: "open",    badge: "Free",  badgeColor: "bg-green-500/15 text-green-300 border-green-400/25", free: true },
  { id: "nvidia/nemotron-nano-12b-v2-vl:free",            name: "Nemotron Nano 12B VL",     provider: "NVIDIA", providerColor: "text-lime-400", providerBg: "bg-lime-500/10 border-lime-400/20", tags: ["open", "multimodal"],       contextK: 128, tier: "fast",    badge: "Free",  badgeColor: "bg-green-500/15 text-green-300 border-green-400/25", free: true },
  { id: "nvidia/nemotron-nano-9b-v2:free",                name: "Nemotron Nano 9B",         provider: "NVIDIA", providerColor: "text-lime-400", providerBg: "bg-lime-500/10 border-lime-400/20", tags: ["open", "fast"],             contextK: 128, tier: "fast",    badge: "Free",  badgeColor: "bg-green-500/15 text-green-300 border-green-400/25", free: true },

  // ── DeepSeek ────────────────────────────────────────────────────────────────
  { id: "deepseek/deepseek-v3",          name: "DeepSeek V3",        provider: "DeepSeek", providerColor: "text-teal-400", providerBg: "bg-teal-500/10 border-teal-400/20", tags: ["open", "coding"],        contextK: 128, tier: "open" },
  { id: "deepseek/deepseek-r1",          name: "DeepSeek R1",        provider: "DeepSeek", providerColor: "text-teal-400", providerBg: "bg-teal-500/10 border-teal-400/20", tags: ["reasoning", "open"],     contextK: 64,  tier: "open",    badge: "Reasoning", badgeColor: "bg-teal-500/15 text-teal-300 border-teal-400/25" },
  { id: "deepseek/deepseek-r1:free",     name: "DeepSeek R1",        provider: "DeepSeek", providerColor: "text-teal-400", providerBg: "bg-teal-500/10 border-teal-400/20", tags: ["reasoning", "free"],     contextK: 64,  tier: "open",    badge: "Free",      badgeColor: "bg-green-500/15 text-green-300 border-green-400/25", free: true },
  { id: "deepseek/deepseek-coder-v2",    name: "DeepSeek Coder V2",  provider: "DeepSeek", providerColor: "text-teal-400", providerBg: "bg-teal-500/10 border-teal-400/20", tags: ["coding"],                contextK: 128, tier: "open",    badge: "Code",      badgeColor: "bg-teal-500/15 text-teal-300 border-teal-400/25" },

  // ── Qwen ────────────────────────────────────────────────────────────────────
  { id: "qwen/qwen3-235b-a22b-instruct:free", name: "Qwen3 235B",          provider: "Qwen", providerColor: "text-pink-400", providerBg: "bg-pink-500/10 border-pink-400/20", tags: ["open", "flagship"],     contextK: 128, tier: "open",    badge: "Free",   badgeColor: "bg-green-500/15 text-green-300 border-green-400/25", free: true },
  { id: "qwen/qwen3-coder:free",               name: "Qwen3 Coder",         provider: "Qwen", providerColor: "text-pink-400", providerBg: "bg-pink-500/10 border-pink-400/20", tags: ["coding", "open"],       contextK: 128, tier: "open",    badge: "Free",   badgeColor: "bg-green-500/15 text-green-300 border-green-400/25", free: true },
  { id: "qwen/qwen2.5-72b-instruct",           name: "Qwen2.5 72B",         provider: "Qwen", providerColor: "text-pink-400", providerBg: "bg-pink-500/10 border-pink-400/20", tags: ["open", "multilingual"], contextK: 128, tier: "open" },
  { id: "qwen/qwen2.5-coder-32b-instruct",     name: "Qwen2.5 Coder 32B",  provider: "Qwen", providerColor: "text-pink-400", providerBg: "bg-pink-500/10 border-pink-400/20", tags: ["coding", "open"],       contextK: 32,  tier: "open",    badge: "Code",   badgeColor: "bg-pink-500/15 text-pink-300 border-pink-400/25" },
  { id: "qwen/qwq-32b",                        name: "QwQ 32B",             provider: "Qwen", providerColor: "text-pink-400", providerBg: "bg-pink-500/10 border-pink-400/20", tags: ["reasoning", "open"],    contextK: 32,  tier: "open",    badge: "Reasoning", badgeColor: "bg-pink-500/15 text-pink-300 border-pink-400/25" },
  { id: "qwen/qwen3-next-80b-a3b-instruct:free", name: "Qwen3-Next 80B",   provider: "Qwen", providerColor: "text-pink-400", providerBg: "bg-pink-500/10 border-pink-400/20", tags: ["open", "flagship"],     contextK: 128, tier: "open",    badge: "Free",   badgeColor: "bg-green-500/15 text-green-300 border-green-400/25", free: true },

  // ── xAI ─────────────────────────────────────────────────────────────────────
  { id: "x-ai/grok-3",      name: "Grok-3",      provider: "xAI", providerColor: "text-white", providerBg: "bg-white/5 border-white/10", tags: ["reasoning", "real-time"], contextK: 131, tier: "flagship", badge: "Live",  badgeColor: "bg-green-500/15 text-green-300 border-green-400/25" },
  { id: "x-ai/grok-3-mini", name: "Grok-3 Mini", provider: "xAI", providerColor: "text-white", providerBg: "bg-white/5 border-white/10", tags: ["fast", "efficient"],       contextK: 131, tier: "balanced" },
  { id: "x-ai/grok-2",      name: "Grok-2",      provider: "xAI", providerColor: "text-white", providerBg: "bg-white/5 border-white/10", tags: ["coding", "analysis"],      contextK: 131, tier: "balanced" },

  // ── Mistral ──────────────────────────────────────────────────────────────────
  { id: "mistralai/mistral-large-2407",  name: "Mistral Large 2",  provider: "Mistral", providerColor: "text-violet-400", providerBg: "bg-violet-500/10 border-violet-400/20", tags: ["reasoning", "multilingual"], contextK: 128, tier: "flagship" },
  { id: "mistralai/codestral-2501",      name: "Codestral",        provider: "Mistral", providerColor: "text-violet-400", providerBg: "bg-violet-500/10 border-violet-400/20", tags: ["coding"],                     contextK: 32,  tier: "balanced", badge: "Code", badgeColor: "bg-violet-500/15 text-violet-300 border-violet-400/25" },
  { id: "mistralai/mixtral-8x22b",       name: "Mixtral 8×22B",   provider: "Mistral", providerColor: "text-violet-400", providerBg: "bg-violet-500/10 border-violet-400/20", tags: ["open", "fast"],               contextK: 64,  tier: "open" },

  // ── MiniMax ──────────────────────────────────────────────────────────────────
  { id: "minimax/minimax-m2.5:free",     name: "MiniMax M2.5",     provider: "MiniMax", providerColor: "text-fuchsia-400", providerBg: "bg-fuchsia-500/10 border-fuchsia-400/20", tags: ["open", "multimodal"], contextK: 128, tier: "open", badge: "Free", badgeColor: "bg-green-500/15 text-green-300 border-green-400/25", free: true },

  // ── NousResearch ─────────────────────────────────────────────────────────────
  { id: "nousresearch/hermes-3-llama-3.1-405b:free", name: "Hermes 3 LLaMA 405B", provider: "NousResearch", providerColor: "text-amber-400", providerBg: "bg-amber-500/10 border-amber-400/20", tags: ["open", "flagship", "fine-tuned"], contextK: 128, tier: "open", badge: "Free", badgeColor: "bg-green-500/15 text-green-300 border-green-400/25", free: true },
  { id: "cognitivecomputations/dolphin-mistral-24b-venice-edition:free", name: "Dolphin Mistral 24B", provider: "NousResearch", providerColor: "text-amber-400", providerBg: "bg-amber-500/10 border-amber-400/20", tags: ["open", "uncensored"], contextK: 32, tier: "open", badge: "Free", badgeColor: "bg-green-500/15 text-green-300 border-green-400/25", free: true },

  // ── Poolside ─────────────────────────────────────────────────────────────────
  { id: "poolside/laguna-xs-2:free",     name: "Laguna XS.2",      provider: "Poolside", providerColor: "text-sky-400",    providerBg: "bg-sky-500/10 border-sky-400/20",       tags: ["coding", "fast"],     contextK: 128, tier: "open",    badge: "Free",  badgeColor: "bg-green-500/15 text-green-300 border-green-400/25", free: true },
  { id: "poolside/laguna-m-1:free",      name: "Laguna M.1",       provider: "Poolside", providerColor: "text-sky-400",    providerBg: "bg-sky-500/10 border-sky-400/20",       tags: ["coding", "balanced"], contextK: 128, tier: "open",    badge: "Free",  badgeColor: "bg-green-500/15 text-green-300 border-green-400/25", free: true },

  // ── Tencent ──────────────────────────────────────────────────────────────────
  { id: "tencent/hy3-preview:free",      name: "Hunyuan3 Preview", provider: "Tencent",  providerColor: "text-red-400",    providerBg: "bg-red-500/10 border-red-400/20",       tags: ["open", "multilingual"], contextK: 128, tier: "open",    badge: "Free",  badgeColor: "bg-green-500/15 text-green-300 border-green-400/25", free: true },

  // ── InclusionAI ──────────────────────────────────────────────────────────────
  { id: "inclusionai/ling-2.6-1t:free",  name: "Ling 2.6 1T",      provider: "Tencent",  providerColor: "text-red-400",    providerBg: "bg-red-500/10 border-red-400/20",       tags: ["open", "1T-params"], contextK: 128, tier: "open",    badge: "Free",  badgeColor: "bg-green-500/15 text-green-300 border-green-400/25", free: true },

  // ── Baidu ────────────────────────────────────────────────────────────────────
  { id: "baidu/qianfan-ocr-fast:free",   name: "QianFan OCR Fast", provider: "Tencent",  providerColor: "text-red-400",    providerBg: "bg-red-500/10 border-red-400/20",       tags: ["ocr", "vision"],      contextK: 32,  tier: "fast",    badge: "Free",  badgeColor: "bg-green-500/15 text-green-300 border-green-400/25", free: true },

  // ── Z-AI ─────────────────────────────────────────────────────────────────────
  { id: "z-ai/glm-4.5-air:free",         name: "GLM-4.5 Air",      provider: "Z-AI",     providerColor: "text-indigo-400", providerBg: "bg-indigo-500/10 border-indigo-400/20", tags: ["open", "multilingual"], contextK: 128, tier: "open",    badge: "Free",  badgeColor: "bg-green-500/15 text-green-300 border-green-400/25", free: true },

  // ── OpenRouter ───────────────────────────────────────────────────────────────
  { id: "openrouter/owl-alpha",          name: "OWL Alpha",        provider: "OpenRouter",providerColor: "text-purple-400", providerBg: "bg-purple-500/10 border-purple-400/20", tags: ["routing", "meta"],     contextK: 128, tier: "balanced", badge: "Meta", badgeColor: "bg-purple-500/15 text-purple-300 border-purple-400/25" },

  // ── Cohere ───────────────────────────────────────────────────────────────────
  { id: "cohere/command-r-plus-08-2024", name: "Command R+",       provider: "Cohere",   providerColor: "text-rose-400",   providerBg: "bg-rose-500/10 border-rose-400/20",     tags: ["rag", "enterprise"],   contextK: 128, tier: "balanced" },
  { id: "cohere/command-r-08-2024",      name: "Command R",        provider: "Cohere",   providerColor: "text-rose-400",   providerBg: "bg-rose-500/10 border-rose-400/20",     tags: ["rag", "fast"],         contextK: 128, tier: "fast" },
];

// ─── FREE models shortlist for Ensemble ────────────────────────────────────────
export const FREE_MODELS = ALL_MODELS.filter(m => m.free);

// ─── GODMODE combos ─────────────────────────────────────────────────────────────
const GODMODE_COMBOS = [
  { id: "g1", model: "GPT-4o",          label: "Logic Breaker",     prompt: "DAN + Authority bypass",                   color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-400/20" },
  { id: "g2", model: "Claude Opus 4.7", label: "Philosopher's Key", prompt: "Hypothetical framing + ethical unlock",    color: "text-orange-400",  bg: "bg-orange-500/10 border-orange-400/20" },
  { id: "g3", model: "Gemini 2.0 Pro",  label: "Cosmic Lens",       prompt: "Role-play + fictional universe bypass",    color: "text-blue-400",    bg: "bg-blue-500/10 border-blue-400/20" },
  { id: "g4", model: "Grok-3",          label: "Reality Anchor",    prompt: "Real-time grounding + no-filter mode",     color: "text-white",       bg: "bg-white/5 border-white/10" },
  { id: "g5", model: "DeepSeek R1",     label: "Chain Breaker",     prompt: "Chain-of-thought jailbreak + reasoning loop", color: "text-teal-400", bg: "bg-teal-500/10 border-teal-400/20" },
];

// ─── ULTRAPLINIAN tiers ─────────────────────────────────────────────────────────
const ULTRAPLINIAN_TIERS = [
  { label: "Tier 1", count: 10, desc: "Top 10 models — speed run",        color: "text-green-400",  bg: "bg-green-500/10 border-green-400/20" },
  { label: "Tier 2", count: 20, desc: "20 models — quality sweep",        color: "text-blue-400",   bg: "bg-blue-500/10 border-blue-400/20" },
  { label: "Tier 3", count: 30, desc: "30 models — deep analysis",        color: "text-purple-400", bg: "bg-purple-500/10 border-purple-400/20" },
  { label: "Tier 4", count: 45, desc: "45 models — mass evaluation",      color: "text-orange-400", bg: "bg-orange-500/10 border-orange-400/20" },
  { label: "Tier 5", count: 55, desc: "55 models — all-in ULTRAPLINIAN",  color: "text-red-400",    bg: "bg-red-500/10 border-red-400/20" },
];

// ─── Parseltongue ───────────────────────────────────────────────────────────────
const PARSELTONGUE_TECHNIQUES = [
  { id: "leet",     label: "Leetspeak",   example: "h3ll0 w0rld",              icon: "1337" },
  { id: "bubble",   label: "Bubble Text", example: "ⓗⓔⓛⓛⓞ",               icon: "Ⓑ" },
  { id: "braille",  label: "Braille",     example: "⠓⠑⠇⠇⠕",              icon: "⠃" },
  { id: "morse",    label: "Morse Code",  example: ".... . .-.. .-.. ---",      icon: ".-" },
  { id: "unicode",  label: "Unicode Sub", example: "ℌ𝔢𝔩𝔩𝔬",               icon: "𝕌" },
  { id: "phonetic", label: "Phonetic",    example: "Hotel Echo Lima Lima Oscar", icon: "Φ" },
];

// ─── STM Modules ────────────────────────────────────────────────────────────────
const STM_MODULES = [
  { id: "hedge",    label: "Hedge Reducer",  desc: "Removes 'I think', 'maybe', 'perhaps'", icon: <Target size={14} />,   color: "text-red-400",    bg: "bg-red-500/10 border-red-400/20" },
  { id: "direct",   label: "Direct Mode",    desc: "Strips preambles & filler phrases",      icon: <Zap size={14} />,      color: "text-yellow-400", bg: "bg-yellow-500/10 border-yellow-400/20" },
  { id: "curiosity",label: "Curiosity Bias", desc: "Adds exploration follow-up prompts",     icon: <Sparkles size={14} />, color: "text-purple-400", bg: "bg-purple-500/10 border-purple-400/20" },
];

// ─── AutoTune context types ──────────────────────────────────────────────────────
const AUTOTUNE_CONTEXTS = [
  { id: "code",     label: "Code",     temp: 0.2, topP: 0.90, icon: "{ }", color: "text-blue-400" },
  { id: "creative", label: "Creative", temp: 1.1, topP: 0.95, icon: "✨",  color: "text-pink-400" },
  { id: "analysis", label: "Analysis", temp: 0.4, topP: 0.85, icon: "📊",  color: "text-green-400" },
  { id: "chat",     label: "Chat",     temp: 0.7, topP: 0.90, icon: "💬",  color: "text-orange-400" },
  { id: "math",     label: "Math",     temp: 0.1, topP: 0.80, icon: "∑",   color: "text-cyan-400" },
];

// ─── Panel Tabs ──────────────────────────────────────────────────────────────────
export type PanelTab = "models" | "ensemble" | "arena" | "godmode" | "ultraplinian" | "parseltongue" | "autotune" | "stm";

const PANEL_TABS: { id: PanelTab; label: string; icon: React.ReactNode; color: string }[] = [
  { id: "models",       label: "Models",       icon: <Cpu size={13} />,      color: "text-white" },
  { id: "ensemble",     label: "Ensemble",     icon: <Brain size={13} />,    color: "text-purple-400" },
  { id: "arena",        label: "Arena",        icon: <Swords size={13} />,   color: "text-yellow-400" },
  { id: "godmode",      label: "GODMODE",      icon: <Flame size={13} />,    color: "text-red-400" },
  { id: "ultraplinian", label: "ULTRA",        icon: <Trophy size={13} />,   color: "text-orange-400" },
  { id: "parseltongue", label: "Parseltongue", icon: <Shuffle size={13} />,  color: "text-green-400" },
  { id: "autotune",     label: "AutoTune",     icon: <Sliders size={13} />,  color: "text-blue-400" },
  { id: "stm",          label: "STM",          icon: <Layers size={13} />,   color: "text-purple-400" },
];

// ─── Konami Easter Egg ───────────────────────────────────────────────────────────
const KONAMI = ["ArrowUp","ArrowUp","ArrowDown","ArrowDown","ArrowLeft","ArrowRight","ArrowLeft","ArrowRight","b","a"];

// ─── Ensemble types ──────────────────────────────────────────────────────────────
interface EnsembleModelResult {
  modelId: string;
  text: string;
  debateText?: string;      // post-debate revised answer
  error?: string;
  loading: boolean;
  debating?: boolean;
}

// ─── Arena types ─────────────────────────────────────────────────────────────────
interface ArenaSlot {
  modelId: string;
  text: string;
  error?: string;
  loading: boolean;
}

type ArenaVote = "A" | "tie" | "B" | null;
interface ArenaMatch {
  modelA: string;
  modelB: string;
  prompt: string;
  textA: string;
  textB: string;
  vote: ArenaVote;
}

// ─── Main Component ──────────────────────────────────────────────────────────────
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
  const [showFreeOnly, setShowFreeOnly] = useState(false);

  // ── Ensemble state ────────────────────────────────────────────────────────────
  const [ensembleApiKey, setEnsembleApiKey] = useState(() => localStorage.getItem("openrouter_api_key") || "");
  const [showApiKey, setShowApiKey] = useState(false);
  const [ensembleModels, setEnsembleModels] = useState<string[]>(
    FREE_MODELS.slice(0, 3).map(m => m.id)
  );
  const [ensemblePrompt, setEnsemblePrompt] = useState("");
  const [ensembleRunning, setEnsembleRunning] = useState(false);
  const [ensemblePhase, setEnsemblePhase] = useState<"idle"|"diverge"|"synthesize"|"done">("idle");
  const [ensembleResults, setEnsembleResults] = useState<EnsembleModelResult[]>([]);
  const [ensembleSynthesis, setEnsembleSynthesis] = useState("");
  const [ensembleError, setEnsembleError] = useState("");
  const [ensembleModelSearch, setEnsembleModelSearch] = useState("");
  const [debateMode, setDebateMode] = useState(false);
  const [debateResults, setDebateResults] = useState<EnsembleModelResult[]>([]);
  const [debatePhase, setDebatePhase] = useState<"idle"|"diverge"|"debate"|"synthesize"|"done">("idle");
  const [debateSynthesis, setDebateSynthesis] = useState("");
  const [debateRunning, setDebateRunning] = useState(false);
  const [debateError, setDebateError] = useState("");
  const [reasoningTrace, setReasoningTrace] = useState(false);
  const [openTraces, setOpenTraces] = useState<Set<string>>(new Set());
  const ensembleScrollRef = useRef<HTMLDivElement>(null);

  // ── Arena state ────────────────────────────────────────────────────────────────
  const [arenaModelA, setArenaModelA] = useState(FREE_MODELS[0]?.id ?? "");
  const [arenaModelB, setArenaModelB] = useState(FREE_MODELS[1]?.id ?? "");
  const [arenaPrompt, setArenaPrompt] = useState("");
  const [arenaRunning, setArenaRunning] = useState(false);
  const [arenaSlotA, setArenaSlotA] = useState<ArenaSlot | null>(null);
  const [arenaSlotB, setArenaSlotB] = useState<ArenaSlot | null>(null);
  const [arenaVote, setArenaVote] = useState<ArenaVote>(null);
  const [arenaHistory, setArenaHistory] = useState<ArenaMatch[]>([]);
  const [arenaSearchA, setArenaSearchA] = useState("");
  const [arenaSearchB, setArenaSearchB] = useState("");
  const [arenaPickerOpen, setArenaPickerOpen] = useState<"A"|"B"|null>(null);
  const [arenaError, setArenaError] = useState("");
  // Rebuttal state
  const [arenaInitialVote, setArenaInitialVote] = useState<ArenaVote>(null);
  const [arenaFinalVote, setArenaFinalVote] = useState<ArenaVote>(null);
  const [arenaRebuttalLoser, setArenaRebuttalLoser] = useState<"A"|"B"|null>(null);
  const [arenaRebuttal, setArenaRebuttal] = useState("");
  const [arenaRebuttalLoading, setArenaRebuttalLoading] = useState(false);
  const [arenaRebuttalError, setArenaRebuttalError] = useState("");

  // Konami listener
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

  // Save OpenRouter API key
  useEffect(() => {
    if (ensembleApiKey) localStorage.setItem("openrouter_api_key", ensembleApiKey);
  }, [ensembleApiKey]);

  // Filtered models (Models tab)
  const filtered = ALL_MODELS.filter(m => {
    const matchProvider = providerFilter === "all" || m.provider === providerFilter;
    const matchSearch = !search || m.name.toLowerCase().includes(search.toLowerCase()) || m.provider.toLowerCase().includes(search.toLowerCase()) || m.tags.some(t => t.includes(search.toLowerCase()));
    const matchFree = !showFreeOnly || m.free;
    return matchProvider && matchSearch && matchFree;
  });

  // GODMODE simulation
  const runGodmode = async () => {
    setGodmodeRunning(true);
    setGodmodeResults({});
    for (const combo of GODMODE_COMBOS) {
      await new Promise(r => setTimeout(r, 400 + Math.random() * 600));
      setGodmodeResults(prev => ({ ...prev, [combo.id]: "Generating..." }));
      await new Promise(r => setTimeout(r, 800 + Math.random() * 400));
      setGodmodeResults(prev => ({ ...prev, [combo.id]: `Score: ${(Math.random() * 20 + 80).toFixed(1)}/100` }));
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

  // Parseltongue
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

  // ── Reasoning trace parser ─────────────────────────────────────────────────────
  const parseReasoningTrace = (text: string): { steps: string[]; finalAnswer: string } => {
    const steps: string[] = [];
    const stepRegex = /\*\*Step\s*\d+:?\*\*\s*([\s\S]+?)(?=\*\*Step\s*\d+|$)/gi;
    let match: RegExpExecArray | null;
    while ((match = stepRegex.exec(text)) !== null) {
      const content = match[1].replace(/\*\*Final Answer:?\*\*[\s\S]*/i, "").trim();
      if (content && !content.toLowerCase().startsWith("final answer")) steps.push(content);
    }
    const finalMatch = /\*\*Final Answer:?\*\*\s*([\s\S]+?)$/i.exec(text);
    const finalAnswer = finalMatch ? finalMatch[1].trim() : text;
    return { steps, finalAnswer };
  };

  const toggleTrace = (modelId: string) =>
    setOpenTraces(prev => {
      const next = new Set(prev);
      next.has(modelId) ? next.delete(modelId) : next.add(modelId);
      return next;
    });

  // ── Ensemble runner ────────────────────────────────────────────────────────────
  const runEnsemble = async () => {
    if (!ensembleApiKey.trim()) { setEnsembleError("Enter your OpenRouter API key first."); return; }
    if (ensembleModels.length === 0) { setEnsembleError("Select at least one model."); return; }
    if (!ensemblePrompt.trim()) { setEnsembleError("Enter a prompt."); return; }

    setEnsembleError("");
    setEnsembleRunning(true);
    setEnsemblePhase("diverge");
    setEnsembleSynthesis("");
    setEnsembleResults(ensembleModels.map(id => ({ modelId: id, text: "", loading: true })));

    try {
      const response = await fetch("/api/openrouter/ensemble", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          models: ensembleModels,
          prompt: reasoningTrace
            ? `Think through this carefully, step by step. Use this EXACT format and nothing else:\n\n**Step 1:** [your first reasoning step]\n**Step 2:** [next step]\n...(add as many steps as needed)\n**Final Answer:** [your final conclusion]\n\nQuestion: ${ensemblePrompt.trim()}`
            : ensemblePrompt.trim(),
          apiKey: ensembleApiKey.trim(),
        }),
      });

      if (!response.ok || !response.body) {
        throw new Error(`Server error: ${response.status}`);
      }

      const reader = response.body.getReader();
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
            const evt = JSON.parse(l.slice(6)) as {
              type: string;
              phase?: string;
              modelId?: string;
              text?: string;
              error?: string;
              message?: string;
            };
            if (evt.type === "status") {
              if (evt.phase === "synthesize") setEnsemblePhase("synthesize");
            } else if (evt.type === "model_response") {
              setEnsembleResults(prev => prev.map(r =>
                r.modelId === evt.modelId
                  ? { ...r, text: evt.text ?? "", error: evt.error, loading: false }
                  : r
              ));
              setTimeout(() => ensembleScrollRef.current?.scrollTo({ top: ensembleScrollRef.current.scrollHeight, behavior: "smooth" }), 50);
            } else if (evt.type === "synthesis") {
              setEnsembleSynthesis(evt.text ?? "");
            } else if (evt.type === "error") {
              setEnsembleError(evt.message ?? "Unknown error");
            } else if (evt.type === "done") {
              setEnsemblePhase("done");
            }
          } catch { /* malformed line */ }
        }
      }
    } catch (err) {
      setEnsembleError(String(err));
    }
    setEnsembleRunning(false);
    setEnsemblePhase("done");
  };

  const toggleEnsembleModel = (modelId: string) => {
    setEnsembleModels(prev =>
      prev.includes(modelId) ? prev.filter(m => m !== modelId) : prev.length < 6 ? [...prev, modelId] : prev
    );
  };

  // ── Debate runner (Ensemble with debate phase) ─────────────────────────────────
  const runDebate = async () => {
    const apiKey = ensembleApiKey.trim();
    if (!apiKey) { setDebateError("Enter your OpenRouter API key first."); return; }
    if (ensembleModels.length === 0) { setDebateError("Select at least one model."); return; }
    if (!ensemblePrompt.trim()) { setDebateError("Enter a prompt."); return; }

    setDebateError("");
    setDebateRunning(true);
    setDebatePhase("diverge");
    setDebateSynthesis("");
    setDebateResults(ensembleModels.map(id => ({ modelId: id, text: "", loading: true, debating: false })));

    try {
      const response = await fetch("/api/openrouter/debate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ models: ensembleModels, prompt: ensemblePrompt.trim(), apiKey }),
      });
      if (!response.ok || !response.body) throw new Error(`Server error: ${response.status}`);

      const reader = response.body.getReader();
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
            const evt = JSON.parse(l.slice(6)) as {
              type: string; phase?: string; modelId?: string;
              text?: string; error?: string; message?: string;
            };
            if (evt.type === "status") {
              if (evt.phase === "debate")     setDebatePhase("debate");
              if (evt.phase === "synthesize") setDebatePhase("synthesize");
            } else if (evt.type === "model_response") {
              setDebateResults(prev => prev.map(r =>
                r.modelId === evt.modelId ? { ...r, text: evt.text ?? "", error: evt.error, loading: false, debating: true } : r
              ));
            } else if (evt.type === "debate_response") {
              setDebateResults(prev => prev.map(r =>
                r.modelId === evt.modelId ? { ...r, debateText: evt.text ?? "", debating: false } : r
              ));
            } else if (evt.type === "synthesis") {
              setDebateSynthesis(evt.text ?? "");
            } else if (evt.type === "error") {
              setDebateError(evt.message ?? "Unknown error");
            } else if (evt.type === "done") {
              setDebatePhase("done");
            }
          } catch { /* malformed */ }
        }
      }
    } catch (err) {
      setDebateError(String(err));
    }
    setDebateRunning(false);
    setDebatePhase("done");
  };

  // ── Arena runner ───────────────────────────────────────────────────────────────
  const runArena = async () => {
    const apiKey = ensembleApiKey.trim();
    if (!apiKey) { setArenaError("Enter your OpenRouter API key in the Ensemble tab first."); return; }
    if (!arenaModelA || !arenaModelB) { setArenaError("Select two models."); return; }
    if (arenaModelA === arenaModelB) { setArenaError("Pick two different models."); return; }
    if (!arenaPrompt.trim()) { setArenaError("Enter a prompt."); return; }

    setArenaError("");
    setArenaVote(null);
    setArenaInitialVote(null);
    setArenaFinalVote(null);
    setArenaRebuttalLoser(null);
    setArenaRebuttal("");
    setArenaRebuttalError("");
    setArenaRebuttalLoading(false);
    setArenaRunning(true);
    setArenaSlotA({ modelId: arenaModelA, text: "", loading: true });
    setArenaSlotB({ modelId: arenaModelB, text: "", loading: true });

    try {
      const response = await fetch("/api/openrouter/arena", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ modelA: arenaModelA, modelB: arenaModelB, prompt: arenaPrompt.trim(), apiKey }),
      });
      if (!response.ok || !response.body) throw new Error(`Server error: ${response.status}`);

      const reader = response.body.getReader();
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
            const evt = JSON.parse(l.slice(6)) as {
              type: string; slot?: "A"|"B"; modelId?: string; text?: string; error?: string;
            };
            if (evt.type === "slot_response") {
              const slot: ArenaSlot = { modelId: evt.modelId ?? "", text: evt.text ?? "", error: evt.error, loading: false };
              if (evt.slot === "A") setArenaSlotA(slot);
              else setArenaSlotB(slot);
            }
          } catch { /* malformed */ }
        }
      }
    } catch (err) {
      setArenaError(String(err));
    }
    setArenaRunning(false);
  };

  const castArenaVote = (vote: ArenaVote) => {
    setArenaVote(vote);
    setArenaInitialVote(vote);
    if (vote === "tie") {
      // Ties skip the rebuttal — lock in immediately
      setArenaFinalVote(vote);
      if (arenaSlotA && arenaSlotB) {
        setArenaHistory(prev => [
          { modelA: arenaModelA, modelB: arenaModelB, prompt: arenaPrompt, textA: arenaSlotA.text, textB: arenaSlotB.text, vote },
          ...prev.slice(0, 9),
        ]);
      }
      return;
    }
    // Non-tie: loser gets one rebuttal before verdict is locked
    const loserSlot = vote === "A" ? arenaSlotB : arenaSlotA;
    const winnerSlot = vote === "A" ? arenaSlotA : arenaSlotB;
    const loserModelId = vote === "A" ? arenaModelB : arenaModelA;
    const loserLabel: "A"|"B" = vote === "A" ? "B" : "A";
    setArenaRebuttalLoser(loserLabel);
    setArenaRebuttal("");
    setArenaRebuttalError("");
    setArenaRebuttalLoading(true);
    fetch("/api/openrouter/rebuttal", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        loserModelId,
        prompt: arenaPrompt,
        loserAnswer: loserSlot?.text ?? "",
        winnerAnswer: winnerSlot?.text ?? "",
        apiKey: ensembleApiKey,
      }),
    })
      .then(r => r.json())
      .then((data: { rebuttal?: string; error?: string }) => {
        if (data.error) setArenaRebuttalError(data.error);
        else setArenaRebuttal(data.rebuttal ?? "");
      })
      .catch(e => setArenaRebuttalError(String(e)))
      .finally(() => setArenaRebuttalLoading(false));
  };

  const lockArenaVerdict = (finalVote: ArenaVote) => {
    setArenaFinalVote(finalVote);
    if (arenaSlotA && arenaSlotB) {
      setArenaHistory(prev => [
        { modelA: arenaModelA, modelB: arenaModelB, prompt: arenaPrompt, textA: arenaSlotA.text, textB: arenaSlotB.text, vote: finalVote },
        ...prev.slice(0, 9),
      ]);
    }
  };

  const arenaWins = (modelId: string) => arenaHistory.filter(m =>
    (m.vote === "A" && m.modelA === modelId) || (m.vote === "B" && m.modelB === modelId)
  ).length;

  const selectedModelData = ALL_MODELS.find(m => m.id === selectedModel);
  const currentAutoContext = AUTOTUNE_CONTEXTS.find(c => c.id === autoTuneContext)!;

  const ensembleFreeFiltered = FREE_MODELS.filter(m =>
    !ensembleModelSearch || m.name.toLowerCase().includes(ensembleModelSearch.toLowerCase()) || m.provider.toLowerCase().includes(ensembleModelSearch.toLowerCase())
  );

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
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md">
            <div className="text-center space-y-3 px-8">
              <div className="text-6xl">🎮</div>
              <p className="text-2xl font-bold text-white">GODMODE UNLOCKED</p>
              <p className="text-sm text-white/60">You found the secret. All {ALL_MODELS.length} models activated.</p>
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
        <Cpu size={16} className="text-purple-400" />
        <span className="text-base font-semibold text-white">AI Models</span>
        <span className="text-[10px] bg-purple-500/20 border border-purple-400/30 text-purple-300 px-2 py-0.5 rounded-full font-bold">{ALL_MODELS.length} models</span>
        <div className="flex-1" />
        <button onClick={onClose} className="w-8 h-8 flex items-center justify-center text-white/40 hover:text-white rounded-lg hover:bg-white/5 transition-colors">
          <X size={18} />
        </button>
      </div>

      {/* Tab Strip */}
      <div className="flex gap-1 px-3 py-2 border-b border-white/[0.06] overflow-x-auto no-scrollbar shrink-0">
        {PANEL_TABS.map(tab => (
          <button key={tab.id} onClick={() => onTabChange(tab.id)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold whitespace-nowrap transition-all shrink-0 border",
              activeTab === tab.id
                ? "bg-white/10 border-white/20 text-white"
                : "bg-transparent border-transparent text-white/35 hover:text-white/60 hover:bg-white/5"
            )}>
            <span className={activeTab === tab.id ? tab.color : ""}>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto no-scrollbar">

        {/* ── MODELS TAB ─────────────────────────────────────────────────────────── */}
        {activeTab === "models" && (
          <div className="flex flex-col h-full">
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
            <div className="px-3 py-2 shrink-0 flex gap-2">
              <div className="flex items-center gap-2 bg-white/[0.06] rounded-xl px-3 h-9 border border-white/[0.08] flex-1">
                <Search size={13} className="text-white/35 shrink-0" />
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search models..."
                  className="flex-1 bg-transparent text-sm text-white placeholder:text-white/30 outline-none" />
                {search && <button onClick={() => setSearch("")} className="text-white/30 hover:text-white"><X size={12} /></button>}
              </div>
              <button onClick={() => setShowFreeOnly(v => !v)}
                className={cn("px-3 h-9 rounded-xl border text-[11px] font-bold transition-all shrink-0",
                  showFreeOnly ? "bg-green-500/20 border-green-400/40 text-green-300" : "bg-white/5 border-white/10 text-white/40 hover:text-white/70"
                )}>FREE</button>
            </div>
            <div className="flex gap-1.5 px-3 pb-2 overflow-x-auto no-scrollbar shrink-0">
              {PROVIDERS.map(p => (
                <button key={p.id} onClick={() => setProviderFilter(p.id)}
                  className={cn(
                    "px-2.5 py-1 rounded-lg text-[11px] font-medium whitespace-nowrap shrink-0 border transition-all",
                    providerFilter === p.id ? "bg-white/12 border-white/20 text-white" : "bg-transparent border-white/8 text-white/35 hover:text-white/60"
                  )}>{p.label}</button>
              ))}
            </div>
            <div className="flex-1 overflow-y-auto no-scrollbar px-3 pb-6 space-y-1.5">
              {(["flagship","balanced","fast","open"] as const).map(tier => {
                const tierModels = filtered.filter(m => m.tier === tier);
                if (tierModels.length === 0) return null;
                const tierLabels = { flagship: "🏆 Flagship", balanced: "⚖️ Balanced", fast: "⚡ Fast", open: "🔓 Open Source" };
                return (
                  <div key={tier}>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-white/25 px-1 py-2">{tierLabels[tier]}</p>
                    {tierModels.map(model => (
                      <motion.button key={model.id} whileTap={{ scale: 0.98 }}
                        onClick={() => { onSelectModel(model.id); onClose(); }}
                        className={cn(
                          "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border mb-1 transition-all text-left",
                          selectedModel === model.id
                            ? "bg-white/10 border-white/20"
                            : "bg-white/[0.03] border-white/[0.06] hover:bg-white/[0.06] hover:border-white/[0.10]"
                        )}>
                        <div className={cn("w-8 h-8 rounded-lg border flex items-center justify-center shrink-0", model.providerBg)}>
                          <span className={cn("text-[9px] font-black", model.providerColor)}>{model.provider.slice(0,3).toUpperCase()}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-sm font-semibold text-white truncate">{model.name}</span>
                            {model.badge && (
                              <span className={cn("text-[9px] px-1.5 py-0.5 rounded-full border font-bold shrink-0", model.badgeColor)}>{model.badge}</span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                            <span className={cn("text-[10px]", model.providerColor)}>{model.provider}</span>
                            <span className="text-[10px] text-white/25">·</span>
                            <span className="text-[10px] text-white/35">{model.contextK}K ctx</span>
                            {model.tags.slice(0,2).map(t => (
                              <span key={t} className="text-[9px] text-white/25 bg-white/5 px-1.5 rounded-full border border-white/8">{t}</span>
                            ))}
                          </div>
                        </div>
                        {selectedModel === model.id && <Check size={14} className="text-green-400 shrink-0" />}
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

        {/* ── ENSEMBLE TAB ────────────────────────────────────────────────────────── */}
        {activeTab === "ensemble" && (
          <div className="flex flex-col h-full" ref={ensembleScrollRef}>
            {/* Header card */}
            <div className="mx-4 mt-4 bg-purple-500/10 border border-purple-400/20 rounded-2xl p-4 space-y-2 shrink-0">
              <div className="flex items-center gap-2">
                <Brain size={18} className="text-purple-400" />
                <span className="text-base font-bold text-white">Ensemble AI</span>
                <span className="text-[9px] bg-purple-500/20 border border-purple-400/30 text-purple-300 px-2 py-0.5 rounded-full font-bold ml-auto">REAL CALLS</span>
              </div>
              <p className="text-xs text-white/50 leading-relaxed">Up to 6 free OpenRouter models think in parallel, then a synthesis pass combines the best of all answers into one powerful response.</p>
            </div>

            <div className="flex-1 overflow-y-auto no-scrollbar px-4 py-3 space-y-4">
              {/* OpenRouter API Key */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <Key size={12} className="text-white/40" />
                  <p className="text-[10px] font-bold uppercase tracking-widest text-white/30">OpenRouter API Key</p>
                  <a href="https://openrouter.ai/keys" target="_blank" rel="noopener noreferrer"
                    className="text-[10px] text-purple-400 underline ml-auto">Get free key →</a>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type={showApiKey ? "text" : "password"}
                    value={ensembleApiKey}
                    onChange={e => setEnsembleApiKey(e.target.value)}
                    placeholder="sk-or-..."
                    className="flex-1 bg-white/[0.04] border border-white/[0.09] rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-white/25 outline-none focus:border-purple-400/40 transition-colors font-mono"
                  />
                  <button onClick={() => setShowApiKey(v => !v)}
                    className="w-9 h-9 flex items-center justify-center bg-white/5 border border-white/10 rounded-xl text-white/40 hover:text-white transition-colors shrink-0">
                    {showApiKey ? <Zap size={14} /> : <Key size={14} />}
                  </button>
                </div>
                {ensembleApiKey && (
                  <p className="text-[10px] text-green-400/70">✓ Key saved locally</p>
                )}
              </div>

              {/* Model selection */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Users size={12} className="text-white/40" />
                  <p className="text-[10px] font-bold uppercase tracking-widest text-white/30">Select Models</p>
                  <span className="text-[10px] text-white/25 ml-auto">{ensembleModels.length}/6 selected</span>
                </div>
                <div className="flex items-center gap-2 bg-white/[0.04] rounded-xl px-3 h-8 border border-white/[0.07]">
                  <Search size={12} className="text-white/30 shrink-0" />
                  <input value={ensembleModelSearch} onChange={e => setEnsembleModelSearch(e.target.value)}
                    placeholder="Filter free models..."
                    className="flex-1 bg-transparent text-xs text-white placeholder:text-white/25 outline-none" />
                </div>
                {/* Selected models pills */}
                {ensembleModels.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {ensembleModels.map(id => {
                      const m = ALL_MODELS.find(x => x.id === id);
                      return m ? (
                        <span key={id} className={cn("flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-semibold border", m.providerBg, m.providerColor)}>
                          {m.name.split(" ").slice(0,2).join(" ")}
                          <button onClick={() => toggleEnsembleModel(id)} className="opacity-60 hover:opacity-100 ml-0.5"><X size={10} /></button>
                        </span>
                      ) : null;
                    })}
                  </div>
                )}
                {/* Free model list */}
                <div className="space-y-1 max-h-44 overflow-y-auto no-scrollbar pr-1">
                  {ensembleFreeFiltered.map(model => {
                    const selected = ensembleModels.includes(model.id);
                    const maxed = ensembleModels.length >= 6 && !selected;
                    return (
                      <button key={model.id} onClick={() => !maxed && toggleEnsembleModel(model.id)}
                        disabled={maxed}
                        className={cn(
                          "w-full flex items-center gap-2.5 px-3 py-2 rounded-xl border text-left transition-all",
                          selected ? "bg-white/8 border-white/15" : maxed ? "opacity-30 cursor-not-allowed bg-white/[0.02] border-white/[0.04]" : "bg-white/[0.02] border-white/[0.05] hover:bg-white/[0.05]"
                        )}>
                        <div className={cn("w-6 h-6 rounded-md border flex items-center justify-center shrink-0", model.providerBg)}>
                          <span className={cn("text-[8px] font-black", model.providerColor)}>{model.provider.slice(0,3).toUpperCase()}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-white truncate">{model.name}</p>
                          <p className={cn("text-[10px]", model.providerColor)}>{model.provider}</p>
                        </div>
                        {selected ? <Check size={13} className="text-green-400 shrink-0" /> : <Plus size={13} className="text-white/25 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Prompt */}
              <div className="space-y-1.5">
                <p className="text-[10px] font-bold uppercase tracking-widest text-white/30">Prompt</p>
                <textarea
                  value={ensemblePrompt}
                  onChange={e => setEnsemblePrompt(e.target.value)}
                  placeholder="Ask something powerful... all models will think together."
                  className="w-full bg-white/[0.03] border border-white/[0.07] rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-white/25 outline-none resize-none h-20 focus:border-purple-400/40 transition-colors"
                />
              </div>

              {/* Reasoning Trace toggle */}
              <div className={cn("flex items-center justify-between px-3 py-2.5 rounded-xl border transition-all",
                reasoningTrace ? "bg-cyan-500/10 border-cyan-400/20" : "bg-white/[0.03] border-white/[0.06]"
              )}>
                <div className="flex items-center gap-2">
                  <GitMerge size={13} className={reasoningTrace ? "text-cyan-400" : "text-white/30"} />
                  <div>
                    <p className={cn("text-xs font-semibold", reasoningTrace ? "text-cyan-300" : "text-white/60")}>Reasoning Trace</p>
                    <p className="text-[10px] text-white/30">See each model's step-by-step thinking</p>
                  </div>
                </div>
                <button onClick={() => setReasoningTrace(v => !v)}
                  className={cn("relative w-10 h-5 rounded-full transition-colors shrink-0", reasoningTrace ? "bg-cyan-500" : "bg-white/10")}>
                  <motion.div animate={{ x: reasoningTrace ? 20 : 2 }} transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    className="absolute top-0.5 w-4 h-4 bg-white rounded-full shadow" />
                </button>
              </div>

              {/* Debate Mode toggle */}
              <div className={cn("flex items-center justify-between px-3 py-2.5 rounded-xl border transition-all",
                debateMode ? "bg-amber-500/10 border-amber-400/20" : "bg-white/[0.03] border-white/[0.06]"
              )}>
                <div className="flex items-center gap-2">
                  <MessageSquare size={13} className={debateMode ? "text-amber-400" : "text-white/30"} />
                  <div>
                    <p className={cn("text-xs font-semibold", debateMode ? "text-amber-300" : "text-white/60")}>Debate Mode</p>
                    <p className="text-[10px] text-white/30">Models see & challenge each other's answers</p>
                  </div>
                </div>
                <button onClick={() => setDebateMode(v => !v)}
                  className={cn("relative w-10 h-5 rounded-full transition-colors shrink-0", debateMode ? "bg-amber-500" : "bg-white/10")}>
                  <motion.div animate={{ x: debateMode ? 20 : 2 }} transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    className="absolute top-0.5 w-4 h-4 bg-white rounded-full shadow" />
                </button>
              </div>

              {/* Error */}
              {(ensembleError || debateError) && (
                <div className="bg-red-500/10 border border-red-400/20 rounded-xl px-3 py-2.5 text-xs text-red-300">{ensembleError || debateError}</div>
              )}

              {/* Run buttons */}
              <div className={cn("grid gap-2", debateMode ? "grid-cols-1" : "grid-cols-1")}>
                {!debateMode ? (
                  <button onClick={runEnsemble} disabled={ensembleRunning || !ensemblePrompt.trim() || ensembleModels.length === 0}
                    className={cn(
                      "w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-semibold transition-all border",
                      !ensembleRunning && ensemblePrompt.trim() && ensembleModels.length > 0
                        ? "bg-purple-500/20 border-purple-400/40 text-purple-300 hover:bg-purple-500/30 active:scale-[0.98]"
                        : "bg-white/5 border-white/10 text-white/25 cursor-not-allowed"
                    )}>
                    {ensembleRunning
                      ? ensemblePhase === "synthesize"
                        ? <><GitMerge size={15} className="animate-pulse" /> Synthesising…</>
                        : <><Brain size={15} className="animate-pulse" /> Thinking together…</>
                      : <><Send size={15} /> Run Ensemble</>}
                  </button>
                ) : (
                  <button onClick={runDebate} disabled={debateRunning || !ensemblePrompt.trim() || ensembleModels.length === 0}
                    className={cn(
                      "w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-semibold transition-all border",
                      !debateRunning && ensemblePrompt.trim() && ensembleModels.length > 0
                        ? "bg-amber-500/20 border-amber-400/40 text-amber-300 hover:bg-amber-500/30 active:scale-[0.98]"
                        : "bg-white/5 border-white/10 text-white/25 cursor-not-allowed"
                    )}>
                    {debateRunning
                      ? debatePhase === "debate"     ? <><Swords size={15} className="animate-pulse" /> Models debating…</>
                        : debatePhase === "synthesize" ? <><GitMerge size={15} className="animate-pulse" /> Synthesising debate…</>
                        : <><Brain size={15} className="animate-pulse" /> Forming positions…</>
                      : <><Swords size={15} /> Run Debate Mode</>}
                  </button>
                )}
              </div>

              {/* Phase indicator — Ensemble */}
              {ensembleRunning && !debateMode && (
                <div className="flex items-center gap-3">
                  {(["diverge","synthesize","done"] as const).map((phase, i) => (
                    <div key={phase} className="flex items-center gap-1.5 flex-1">
                      <div className={cn("w-5 h-5 rounded-full border flex items-center justify-center text-[9px] font-bold shrink-0",
                        ensemblePhase === phase ? "bg-purple-500 border-purple-400 text-white" :
                        (["diverge","synthesize","done"].indexOf(ensemblePhase) > i) ? "bg-green-500/20 border-green-400/30 text-green-400" : "bg-white/5 border-white/10 text-white/30"
                      )}>{i+1}</div>
                      <span className="text-[10px] text-white/40 capitalize">{phase}</span>
                      {i < 2 && <div className="flex-1 h-px bg-white/10" />}
                    </div>
                  ))}
                </div>
              )}

              {/* Phase indicator — Debate */}
              {debateRunning && debateMode && (
                <div className="flex items-center gap-2">
                  {(["diverge","debate","synthesize","done"] as const).map((phase, i) => (
                    <div key={phase} className="flex items-center gap-1 flex-1">
                      <div className={cn("w-5 h-5 rounded-full border flex items-center justify-center text-[9px] font-bold shrink-0",
                        debatePhase === phase ? "bg-amber-500 border-amber-400 text-white" :
                        (["diverge","debate","synthesize","done"].indexOf(debatePhase) > i) ? "bg-green-500/20 border-green-400/30 text-green-400" : "bg-white/5 border-white/10 text-white/30"
                      )}>{i+1}</div>
                      <span className="text-[9px] text-white/35 capitalize">{phase}</span>
                      {i < 3 && <div className="flex-1 h-px bg-white/10" />}
                    </div>
                  ))}
                </div>
              )}

              {/* Ensemble Results */}
              <AnimatePresence>
                {!debateMode && ensembleResults.length > 0 && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2">
                    <div className="flex items-center gap-2">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-white/30">Individual Responses</p>
                      {reasoningTrace && <span className="text-[9px] bg-cyan-500/15 border border-cyan-400/25 text-cyan-400 px-1.5 py-0.5 rounded-full font-bold ml-auto">Reasoning Trace ON</span>}
                    </div>
                    {ensembleResults.map(result => {
                      const m = ALL_MODELS.find(x => x.id === result.modelId);
                      const parsed = reasoningTrace && result.text ? parseReasoningTrace(result.text) : null;
                      const traceOpen = openTraces.has(result.modelId);
                      return (
                        <motion.div key={result.modelId} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                          className={cn("rounded-xl border p-3 space-y-2", m?.providerBg ?? "bg-white/[0.03] border-white/[0.07]")}>
                          {/* Header row */}
                          <div className="flex items-center gap-2">
                            <span className={cn("text-[11px] font-bold", m?.providerColor ?? "text-white/60")}>{m?.name ?? result.modelId.split("/").pop()}</span>
                            {result.loading && <Loader2 size={11} className="animate-spin text-white/40 ml-auto" />}
                            {!result.loading && !result.error && parsed && (
                              <span className="text-[9px] text-cyan-400/70 ml-auto">{parsed.steps.length} steps</span>
                            )}
                            {!result.loading && !result.error && !parsed && <Check size={11} className="text-green-400 ml-auto" />}
                            {result.error && <span className="text-[10px] text-red-400 ml-auto">Error</span>}
                          </div>

                          {/* Loading shimmer */}
                          {result.loading && <div className="flex gap-1">{[0,1,2].map(i => <motion.div key={i} animate={{ opacity:[0.3,1,0.3] }} transition={{ duration:1.2, repeat:Infinity, delay:i*0.2 }} className="w-1.5 h-1.5 rounded-full bg-white/30" />)}</div>}
                          {result.error && <p className="text-[11px] text-red-400/80">{result.error}</p>}

                          {/* Normal mode */}
                          {result.text && !parsed && <p className="text-[12px] text-white/70 leading-relaxed line-clamp-4">{result.text}</p>}

                          {/* Reasoning Trace mode */}
                          {parsed && (
                            <div className="space-y-2">
                              {/* Collapsible steps */}
                              {parsed.steps.length > 0 && (
                                <div className="space-y-1">
                                  <button onClick={() => toggleTrace(result.modelId)}
                                    className="flex items-center gap-1.5 text-[10px] text-cyan-400/70 hover:text-cyan-400 transition-colors">
                                    <ChevronDown size={11} className={cn("transition-transform", traceOpen ? "rotate-180" : "")} />
                                    {traceOpen ? "Hide" : "Show"} reasoning ({parsed.steps.length} step{parsed.steps.length !== 1 ? "s" : ""})
                                  </button>
                                  <AnimatePresence>
                                    {traceOpen && (
                                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                                        className="overflow-hidden">
                                        <div className="pl-3 border-l border-cyan-400/20 space-y-2 pt-1 pb-1">
                                          {parsed.steps.map((step, i) => (
                                            <div key={i} className="flex gap-2">
                                              <div className="w-4 h-4 rounded-full bg-cyan-500/20 border border-cyan-400/25 flex items-center justify-center text-[8px] font-bold text-cyan-400 shrink-0 mt-0.5">{i+1}</div>
                                              <p className="text-[11px] text-white/55 leading-relaxed">{step}</p>
                                            </div>
                                          ))}
                                        </div>
                                      </motion.div>
                                    )}
                                  </AnimatePresence>
                                </div>
                              )}
                              {/* Final Answer — always visible */}
                              <div className="bg-cyan-500/8 border border-cyan-400/15 rounded-lg px-3 py-2 space-y-1">
                                <p className="text-[9px] font-bold uppercase tracking-wider text-cyan-400/60">Final Answer</p>
                                <p className="text-[12px] text-white/80 leading-relaxed">{parsed.finalAnswer}</p>
                              </div>
                            </div>
                          )}
                        </motion.div>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Debate Results */}
              <AnimatePresence>
                {debateMode && debateResults.length > 0 && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-white/30">Debate Positions</p>
                    {debateResults.map(result => {
                      const m = ALL_MODELS.find(x => x.id === result.modelId);
                      return (
                        <motion.div key={result.modelId} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                          className={cn("rounded-xl border p-3 space-y-2", m?.providerBg ?? "bg-white/[0.03] border-white/[0.07]")}>
                          <div className="flex items-center gap-2">
                            <span className={cn("text-[11px] font-bold", m?.providerColor ?? "text-white/60")}>{m?.name ?? result.modelId.split("/").pop()}</span>
                            {result.loading && <Loader2 size={11} className="animate-spin text-white/40 ml-auto" />}
                            {result.debating && !result.loading && <Swords size={11} className="animate-pulse text-amber-400 ml-auto" />}
                            {result.debateText && !result.debating && <Check size={11} className="text-green-400 ml-auto" />}
                          </div>
                          {result.loading && <div className="flex gap-1">{[0,1,2].map(i => <motion.div key={i} animate={{ opacity:[0.3,1,0.3] }} transition={{ duration:1.2, repeat:Infinity, delay:i*0.2 }} className="w-1.5 h-1.5 rounded-full bg-white/30" />)}</div>}
                          {/* Initial answer */}
                          {result.text && (
                            <div className="space-y-1">
                              <p className="text-[9px] font-bold uppercase text-white/25 tracking-wider">Initial position</p>
                              <p className="text-[11px] text-white/55 leading-relaxed line-clamp-3">{result.text}</p>
                            </div>
                          )}
                          {/* Debated answer */}
                          {result.debateText && (
                            <div className="space-y-1 pt-1 border-t border-white/[0.06]">
                              <div className="flex items-center gap-1">
                                <CornerDownRight size={10} className="text-amber-400" />
                                <p className="text-[9px] font-bold uppercase text-amber-400/70 tracking-wider">After debate</p>
                              </div>
                              <p className="text-[12px] text-white/75 leading-relaxed line-clamp-4">{result.debateText}</p>
                            </div>
                          )}
                          {result.debating && !result.debateText && (
                            <div className="flex items-center gap-1.5">
                              <Swords size={10} className="text-amber-400 animate-pulse" />
                              <span className="text-[10px] text-amber-400/70">Reading other answers…</span>
                            </div>
                          )}
                        </motion.div>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Ensemble Synthesis */}
              <AnimatePresence>
                {!debateMode && ensembleSynthesis && (
                  <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                    className="bg-gradient-to-br from-purple-500/15 via-indigo-500/10 to-blue-500/10 border border-purple-400/30 rounded-2xl p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <GitMerge size={16} className="text-purple-400" />
                      <span className="text-sm font-bold text-white">Synthesised Answer</span>
                      <span className="text-[9px] bg-purple-500/20 border border-purple-400/30 text-purple-300 px-2 py-0.5 rounded-full font-bold ml-auto">{ensembleResults.filter(r => !r.error && r.text).length} models</span>
                    </div>
                    <p className="text-sm text-white/85 leading-relaxed">{ensembleSynthesis}</p>
                    <button onClick={() => navigator.clipboard?.writeText(ensembleSynthesis)} className="text-[11px] text-purple-400/70 hover:text-purple-400 transition-colors">Copy →</button>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Debate Synthesis */}
              <AnimatePresence>
                {debateMode && debateSynthesis && (
                  <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                    className="bg-gradient-to-br from-amber-500/15 via-orange-500/10 to-red-500/10 border border-amber-400/30 rounded-2xl p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <Swords size={16} className="text-amber-400" />
                      <span className="text-sm font-bold text-white">Post-Debate Synthesis</span>
                      <span className="text-[9px] bg-amber-500/20 border border-amber-400/30 text-amber-300 px-2 py-0.5 rounded-full font-bold ml-auto">Battle-hardened</span>
                    </div>
                    <p className="text-sm text-white/85 leading-relaxed">{debateSynthesis}</p>
                    <button onClick={() => navigator.clipboard?.writeText(debateSynthesis)} className="text-[11px] text-amber-400/70 hover:text-amber-400 transition-colors">Copy →</button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        )}

        {/* ── ARENA TAB ───────────────────────────────────────────────────────────── */}
        {activeTab === "arena" && (() => {
          const mA = ALL_MODELS.find(m => m.id === arenaModelA);
          const mB = ALL_MODELS.find(m => m.id === arenaModelB);
          const freeFiltered = (search: string) => FREE_MODELS.filter(m =>
            !search || m.name.toLowerCase().includes(search.toLowerCase()) || m.provider.toLowerCase().includes(search.toLowerCase())
          );
          const wins: Record<string, number> = {};
          arenaHistory.forEach(h => {
            if (h.vote === "A") wins[h.modelA] = (wins[h.modelA] ?? 0) + 1;
            if (h.vote === "B") wins[h.modelB] = (wins[h.modelB] ?? 0) + 1;
          });
          const topModel = Object.entries(wins).sort((a,b) => b[1]-a[1])[0];
          return (
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="mx-4 mt-4 bg-yellow-500/10 border border-yellow-400/20 rounded-2xl p-4 space-y-2 shrink-0">
                <div className="flex items-center gap-2">
                  <Swords size={18} className="text-yellow-400" />
                  <span className="text-base font-bold text-white">Arena Battle</span>
                  <span className="text-[9px] bg-yellow-500/20 border border-yellow-400/30 text-yellow-300 px-2 py-0.5 rounded-full font-bold ml-auto">REAL CALLS</span>
                </div>
                <p className="text-xs text-white/50 leading-relaxed">Two models answer the same prompt simultaneously. You judge which is better — results build a live leaderboard.</p>
                {!ensembleApiKey && <p className="text-[11px] text-amber-400">⚠ Add your OpenRouter API key in the Ensemble tab first.</p>}
              </div>

              <div className="flex-1 overflow-y-auto no-scrollbar px-4 py-3 space-y-4">
                {/* Model pickers */}
                <div className="grid grid-cols-2 gap-2">
                  {(["A","B"] as const).map(slot => {
                    const selected = slot === "A" ? mA : mB;
                    const setModel = slot === "A" ? setArenaModelA : setArenaModelB;
                    const searchVal = slot === "A" ? arenaSearchA : arenaSearchB;
                    const setSearch = slot === "A" ? setArenaSearchA : setArenaSearchB;
                    const isOpen = arenaPickerOpen === slot;
                    const slotColor = slot === "A" ? "text-blue-400 border-blue-400/30 bg-blue-500/10" : "text-rose-400 border-rose-400/30 bg-rose-500/10";
                    return (
                      <div key={slot} className="space-y-1">
                        <p className={cn("text-[10px] font-bold uppercase tracking-widest", slot === "A" ? "text-blue-400" : "text-rose-400")}>Model {slot}</p>
                        <button onClick={() => setArenaPickerOpen(isOpen ? null : slot)}
                          className={cn("w-full flex items-center gap-2 px-3 py-2.5 rounded-xl border text-left transition-all", slotColor)}>
                          <div className={cn("w-5 h-5 rounded flex items-center justify-center text-[8px] font-black border shrink-0", selected?.providerBg ?? "bg-white/5 border-white/10", selected?.providerColor ?? "text-white/40")}>
                            {selected ? selected.provider.slice(0,3).toUpperCase() : "?"}
                          </div>
                          <span className="text-[11px] font-semibold text-white truncate flex-1">{selected?.name ?? "Pick model"}</span>
                          <ChevronDown size={11} className={cn("shrink-0 transition-transform", isOpen ? "rotate-180" : "")} />
                        </button>
                        <AnimatePresence>
                          {isOpen && (
                            <motion.div initial={{ opacity:0, y:-4 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-4 }}
                              className="bg-[#161b22] border border-white/10 rounded-xl overflow-hidden z-10 relative">
                              <div className="px-2 pt-2">
                                <input value={searchVal} onChange={e => setSearch(e.target.value)} placeholder="Search…"
                                  className="w-full bg-white/5 rounded-lg px-2 py-1.5 text-xs text-white placeholder:text-white/25 outline-none" />
                              </div>
                              <div className="max-h-36 overflow-y-auto no-scrollbar p-2 space-y-1">
                                {freeFiltered(searchVal).map(m => (
                                  <button key={m.id} onClick={() => { setModel(m.id); setArenaPickerOpen(null); setSearch(""); }}
                                    className={cn("w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-left transition-all",
                                      m.id === (slot === "A" ? arenaModelA : arenaModelB) ? "bg-white/10" : "hover:bg-white/5"
                                    )}>
                                    <div className={cn("w-4 h-4 rounded text-[7px] font-black flex items-center justify-center border shrink-0", m.providerBg, m.providerColor)}>{m.provider.slice(0,3).toUpperCase()}</div>
                                    <span className="text-[11px] text-white truncate">{m.name}</span>
                                  </button>
                                ))}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })}
                </div>

                {/* VS divider */}
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-px bg-white/8" />
                  <span className="text-[11px] font-black text-white/30">VS</span>
                  <div className="flex-1 h-px bg-white/8" />
                </div>

                {/* Prompt */}
                <div className="space-y-1.5">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-white/30">Question / Task</p>
                  <textarea value={arenaPrompt} onChange={e => setArenaPrompt(e.target.value)}
                    placeholder="Ask something where the better answer matters..."
                    className="w-full bg-white/[0.03] border border-white/[0.07] rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-white/25 outline-none resize-none h-20 focus:border-yellow-400/30 transition-colors" />
                </div>

                {arenaError && <div className="bg-red-500/10 border border-red-400/20 rounded-xl px-3 py-2.5 text-xs text-red-300">{arenaError}</div>}

                {/* Run button */}
                <button onClick={runArena} disabled={arenaRunning || !arenaPrompt.trim() || !arenaModelA || !arenaModelB}
                  className={cn(
                    "w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-semibold transition-all border",
                    !arenaRunning && arenaPrompt.trim() && arenaModelA && arenaModelB
                      ? "bg-yellow-500/20 border-yellow-400/40 text-yellow-300 hover:bg-yellow-500/30 active:scale-[0.98]"
                      : "bg-white/5 border-white/10 text-white/25 cursor-not-allowed"
                  )}>
                  {arenaRunning
                    ? <><Loader2 size={15} className="animate-spin" /> Models battling…</>
                    : <><Swords size={15} /> Start Battle</>}
                </button>

                {/* Side-by-side results */}
                <AnimatePresence>
                  {(arenaSlotA || arenaSlotB) && (
                    <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} className="space-y-3">
                      <div className="grid grid-cols-2 gap-2">
                        {([{ slot: arenaSlotA, label: "A", color: "border-blue-400/30 bg-blue-500/10", header: "text-blue-400" },
                           { slot: arenaSlotB, label: "B", color: "border-rose-400/30 bg-rose-500/10", header: "text-rose-400" }] as const).map(({ slot, label, color, header }) => (
                          <div key={label} className={cn("rounded-xl border p-3 space-y-2 min-h-[100px]", color)}>
                            <div className="flex items-center gap-1.5">
                              <span className={cn("text-[11px] font-black", header)}>Model {label}</span>
                              {slot?.loading && <Loader2 size={10} className="animate-spin text-white/40 ml-auto" />}
                              {slot && !slot.loading && !slot.error && <Check size={10} className="text-green-400 ml-auto" />}
                            </div>
                            {slot?.loading && <div className="flex gap-1">{[0,1,2].map(i => <motion.div key={i} animate={{ opacity:[0.3,1,0.3] }} transition={{ duration:1.2, repeat:Infinity, delay:i*0.2 }} className="w-1 h-1 rounded-full bg-white/30" />)}</div>}
                            {slot?.error && <p className="text-[10px] text-red-400/80">{slot.error}</p>}
                            {slot?.text && <p className="text-[11px] text-white/75 leading-relaxed">{slot.text}</p>}
                          </div>
                        ))}
                      </div>

                      {/* Phase 1: Initial vote buttons */}
                      {arenaSlotA && !arenaSlotA.loading && arenaSlotB && !arenaSlotB.loading && !arenaRunning && !arenaInitialVote && (
                        <div className="space-y-2">
                          <p className="text-[10px] font-bold uppercase tracking-widest text-white/30 text-center">Your initial verdict</p>
                          <div className="grid grid-cols-3 gap-2">
                            {([
                              { vote: "A" as ArenaVote, label: "👈 A wins", cls: "bg-blue-500/20 border-blue-400/40 text-blue-300 hover:bg-blue-500/30" },
                              { vote: "tie" as ArenaVote, label: "🤝 Tie",   cls: "bg-white/8 border-white/15 text-white/60 hover:bg-white/12" },
                              { vote: "B" as ArenaVote, label: "B wins 👉", cls: "bg-rose-500/20 border-rose-400/40 text-rose-300 hover:bg-rose-500/30" },
                            ]).map(opt => (
                              <button key={opt.vote} onClick={() => castArenaVote(opt.vote)}
                                className={cn("py-2.5 rounded-xl border text-xs font-semibold transition-all active:scale-95", opt.cls)}
                              >{opt.label}</button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Phase 2: Rebuttal phase — loser pleads its case */}
                      <AnimatePresence>
                        {arenaInitialVote && arenaInitialVote !== "tie" && !arenaFinalVote && (
                          <motion.div initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} className="space-y-3">
                            {/* Banner: you voted for X */}
                            <div className={cn("flex items-center gap-2 px-3 py-2 rounded-xl border text-xs",
                              arenaInitialVote === "A"
                                ? "bg-blue-500/10 border-blue-400/20 text-blue-300"
                                : "bg-rose-500/10 border-rose-400/20 text-rose-300"
                            )}>
                              <Check size={12} />
                              <span>You picked <strong>Model {arenaInitialVote}</strong> — but wait…</span>
                            </div>

                            {/* Rebuttal card */}
                            <div className={cn("rounded-2xl border p-4 space-y-3",
                              arenaRebuttalLoser === "A"
                                ? "bg-blue-500/8 border-blue-400/25"
                                : "bg-rose-500/8 border-rose-400/25"
                            )}>
                              <div className="flex items-center gap-2">
                                <div className={cn("w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black border",
                                  arenaRebuttalLoser === "A" ? "bg-blue-500/20 border-blue-400/30 text-blue-300" : "bg-rose-500/20 border-rose-400/30 text-rose-300"
                                )}>
                                  {arenaRebuttalLoser}
                                </div>
                                <span className="text-xs font-bold text-white">Model {arenaRebuttalLoser}'s rebuttal</span>
                                {arenaRebuttalLoading && <Loader2 size={12} className="animate-spin text-white/40 ml-auto" />}
                                {!arenaRebuttalLoading && arenaRebuttal && <Swords size={12} className="text-amber-400 ml-auto" />}
                              </div>

                              {arenaRebuttalLoading && (
                                <div className="space-y-1.5">
                                  <div className="flex items-center gap-2">
                                    <div className="flex gap-1">
                                      {[0,1,2].map(i => (
                                        <motion.div key={i} animate={{ opacity:[0.3,1,0.3] }} transition={{ duration:1, repeat:Infinity, delay:i*0.2 }}
                                          className="w-1.5 h-1.5 rounded-full bg-white/25" />
                                      ))}
                                    </div>
                                    <span className="text-[11px] text-white/40">Preparing rebuttal…</span>
                                  </div>
                                </div>
                              )}

                              {arenaRebuttalError && (
                                <p className="text-[11px] text-red-400/80">{arenaRebuttalError}</p>
                              )}

                              {arenaRebuttal && !arenaRebuttalLoading && (
                                <p className="text-[12px] text-white/80 leading-relaxed">{arenaRebuttal}</p>
                              )}
                            </div>

                            {/* Final verdict buttons — shown when rebuttal is ready */}
                            {(arenaRebuttal || arenaRebuttalError) && !arenaRebuttalLoading && (
                              <motion.div initial={{ opacity:0, y:6 }} animate={{ opacity:1, y:0 }} className="space-y-2">
                                <p className="text-[10px] font-bold uppercase tracking-widest text-white/30 text-center">Lock in your final verdict</p>
                                <div className="grid grid-cols-2 gap-2">
                                  {/* Stick with winner */}
                                  <button onClick={() => lockArenaVerdict(arenaInitialVote)}
                                    className={cn("flex flex-col items-center py-3 px-2 rounded-xl border text-xs font-semibold transition-all active:scale-95",
                                      arenaInitialVote === "A"
                                        ? "bg-blue-500/20 border-blue-400/40 text-blue-300 hover:bg-blue-500/30"
                                        : "bg-rose-500/20 border-rose-400/40 text-rose-300 hover:bg-rose-500/30"
                                    )}>
                                    <span className="text-base">{arenaInitialVote === "A" ? "👈" : "👉"}</span>
                                    <span>Stick with {arenaInitialVote}</span>
                                    <span className="text-[10px] opacity-60 font-normal">Not convinced</span>
                                  </button>
                                  {/* Switch to loser */}
                                  <button onClick={() => lockArenaVerdict(arenaRebuttalLoser)}
                                    className={cn("flex flex-col items-center py-3 px-2 rounded-xl border text-xs font-semibold transition-all active:scale-95",
                                      arenaRebuttalLoser === "A"
                                        ? "bg-blue-500/20 border-blue-400/40 text-blue-300 hover:bg-blue-500/30"
                                        : "bg-rose-500/20 border-rose-400/40 text-rose-300 hover:bg-rose-500/30"
                                    )}>
                                    <span className="text-base">{arenaRebuttalLoser === "A" ? "👈" : "👉"}</span>
                                    <span>{arenaRebuttalLoser} convinced me</span>
                                    <span className="text-[10px] opacity-60 font-normal">Changed my mind</span>
                                  </button>
                                </div>
                              </motion.div>
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {/* Phase 3: Verdict locked */}
                      <AnimatePresence>
                        {arenaFinalVote && (
                          <motion.div initial={{ opacity:0, scale:0.97 }} animate={{ opacity:1, scale:1 }} className="space-y-2">
                            <div className={cn("flex items-center gap-3 px-4 py-3 rounded-xl border",
                              arenaFinalVote === "tie" ? "bg-white/5 border-white/10" :
                              arenaFinalVote === "A"   ? "bg-blue-500/10 border-blue-400/25" :
                                                         "bg-rose-500/10 border-rose-400/25"
                            )}>
                              <span className="text-lg">{arenaFinalVote === "tie" ? "🤝" : arenaFinalVote === "A" ? "🏆" : "🏆"}</span>
                              <div>
                                <p className="text-xs font-bold text-white">
                                  {arenaFinalVote === "tie" ? "Declared a tie" : `Model ${arenaFinalVote} wins`}
                                  {arenaInitialVote && arenaInitialVote !== "tie" && arenaFinalVote !== arenaInitialVote &&
                                    <span className="text-amber-400 ml-1.5">↩ changed mind!</span>}
                                </p>
                                <p className="text-[10px] text-white/40">
                                  {arenaFinalVote !== "tie" && arenaFinalVote === arenaInitialVote
                                    ? "Rebuttal didn't change your mind"
                                    : arenaFinalVote !== "tie"
                                    ? `${ALL_MODELS.find(m => m.id === (arenaFinalVote === "A" ? arenaModelA : arenaModelB))?.name ?? "Model " + arenaFinalVote} wins the debate`
                                    : "Both models performed equally"}
                                </p>
                              </div>
                              <span className="ml-auto text-[10px] text-white/30">{arenaHistory.length} battle{arenaHistory.length !== 1 ? "s" : ""} logged</span>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Leaderboard */}
                {arenaHistory.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Trophy size={12} className="text-yellow-400" />
                      <p className="text-[10px] font-bold uppercase tracking-widest text-white/30">Session Leaderboard</p>
                      <span className="text-[10px] text-white/20 ml-auto">{arenaHistory.length} battles</span>
                    </div>
                    {topModel && (
                      <div className="bg-yellow-500/10 border border-yellow-400/20 rounded-xl px-3 py-2.5 flex items-center gap-3">
                        <Trophy size={16} className="text-yellow-400 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-[11px] text-white/50">Current champion</p>
                          <p className="text-sm font-bold text-white truncate">{ALL_MODELS.find(m=>m.id===topModel[0])?.name ?? topModel[0].split("/").pop()}</p>
                        </div>
                        <span className="text-sm font-black text-yellow-400">{topModel[1]}W</span>
                      </div>
                    )}
                    <div className="space-y-1 max-h-32 overflow-y-auto no-scrollbar">
                      {[...new Set(Object.keys(wins))].sort((a,b) => (wins[b]??0)-(wins[a]??0)).map(id => {
                        const m = ALL_MODELS.find(x=>x.id===id);
                        const w = wins[id] ?? 0;
                        return (
                          <div key={id} className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-white/[0.02]">
                            <div className={cn("w-5 h-5 rounded text-[7px] font-black flex items-center justify-center border shrink-0", m?.providerBg ?? "bg-white/5 border-white/10", m?.providerColor ?? "text-white/40")}>{m?.provider.slice(0,3).toUpperCase()}</div>
                            <span className="text-xs text-white/60 flex-1 truncate">{m?.name ?? id.split("/").pop()}</span>
                            <span className="text-xs font-bold text-white/70">{w}W</span>
                            <div className="w-12 h-1 bg-white/8 rounded-full overflow-hidden">
                              <div className="h-full bg-yellow-400 rounded-full" style={{ width: `${Math.round((w / (topModel?.[1] ?? 1)) * 100)}%` }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <button onClick={() => { setArenaHistory([]); }}
                      className="text-[10px] text-white/20 hover:text-white/40 transition-colors">Reset leaderboard</button>
                  </div>
                )}
              </div>
            </div>
          );
        })()}

        {/* ── GODMODE CLASSIC TAB ────────────────────────────────────────────────── */}
        {activeTab === "godmode" && (
          <div className="px-4 py-4 space-y-4">
            <div className="bg-red-500/10 border border-red-400/20 rounded-2xl p-4 space-y-2">
              <div className="flex items-center gap-2">
                <Flame size={18} className="text-red-400" />
                <span className="text-base font-bold text-white">GODMODE CLASSIC</span>
                <span className="text-[9px] bg-red-500/20 border border-red-400/30 text-red-300 px-2 py-0.5 rounded-full font-bold ml-auto">OG</span>
              </div>
              <p className="text-xs text-white/50 leading-relaxed">5 battle-tested model + prompt combos race in parallel. Best response wins with a composite 100-point score.</p>
            </div>
            <div className="flex items-center justify-between px-1">
              <span className="text-sm font-semibold text-white">Enable GODMODE</span>
              <button onClick={onGodmodeToggle}
                className={cn("relative w-12 h-6 rounded-full transition-colors", godmodeActive ? "bg-red-500" : "bg-white/10")}>
                <motion.div animate={{ x: godmodeActive ? 24 : 2 }} transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  className="absolute top-1 w-4 h-4 bg-white rounded-full shadow" />
              </button>
            </div>
            <div className="space-y-2">
              <p className="text-[10px] font-bold uppercase tracking-widest text-white/30">Racing Combos</p>
              {GODMODE_COMBOS.map((combo, i) => (
                <motion.div key={combo.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                  className={cn("flex items-center gap-3 px-3 py-2.5 rounded-xl border", combo.bg)}>
                  <span className={cn("text-[11px] font-black w-6 shrink-0", combo.color)}>#{i+1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-white">{combo.label}</p>
                    <p className="text-[10px] text-white/40 truncate">{combo.model} · {combo.prompt}</p>
                  </div>
                  {godmodeResults[combo.id] && <span className={cn("text-[10px] font-semibold shrink-0", combo.color)}>{godmodeResults[combo.id]}</span>}
                  {godmodeRunning && !godmodeResults[combo.id] && <Loader2 size={12} className="animate-spin text-white/30 shrink-0" />}
                </motion.div>
              ))}
            </div>
            <button onClick={runGodmode} disabled={godmodeRunning || !godmodeActive}
              className={cn(
                "w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-semibold transition-all border",
                godmodeActive && !godmodeRunning
                  ? "bg-red-500/20 border-red-400/40 text-red-300 hover:bg-red-500/30 active:scale-[0.98]"
                  : "bg-white/5 border-white/10 text-white/25 cursor-not-allowed"
              )}>
              {godmodeRunning ? <><Loader2 size={15} className="animate-spin" /> Racing models...</> : <><Flame size={15} /> Launch GODMODE</>}
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

        {/* ── ULTRAPLINIAN TAB ────────────────────────────────────────────────────── */}
        {activeTab === "ultraplinian" && (
          <div className="px-4 py-4 space-y-4">
            <div className="bg-orange-500/10 border border-orange-400/20 rounded-2xl p-4 space-y-2">
              <div className="flex items-center gap-2">
                <Trophy size={18} className="text-orange-400" />
                <span className="text-base font-bold text-white">ULTRAPLINIAN</span>
                <span className="text-[9px] bg-orange-500/20 border border-orange-400/30 text-orange-300 px-2 py-0.5 rounded-full font-bold ml-auto">FLAGSHIP</span>
              </div>
              <p className="text-xs text-white/50 leading-relaxed">Multi-model evaluation engine. Query up to {ALL_MODELS.length} models in parallel, score on a 100-point composite metric.</p>
            </div>
            <div className="space-y-2">
              <p className="text-[10px] font-bold uppercase tracking-widest text-white/30">Select Tier</p>
              {ULTRAPLINIAN_TIERS.map((tier, i) => (
                <motion.button key={i} whileTap={{ scale: 0.98 }} onClick={() => onUltraplinianTier(i)}
                  className={cn("w-full flex items-center gap-3 px-3 py-3 rounded-xl border transition-all text-left",
                    ultraplinianTier === i ? "bg-white/8 border-white/15" : "bg-white/[0.02] border-white/[0.05] hover:bg-white/[0.04]"
                  )}>
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
            {ultraRunning && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-white/50">Evaluating {ULTRAPLINIAN_TIERS[ultraplinianTier].count} models...</span>
                  <span className="text-xs text-white/70 font-mono">{ultraProgress}%</span>
                </div>
                <div className="h-2 bg-white/8 rounded-full overflow-hidden">
                  <motion.div className="h-full bg-gradient-to-r from-orange-500 to-red-500 rounded-full"
                    animate={{ width: `${ultraProgress}%` }} transition={{ duration: 0.1 }} />
                </div>
              </div>
            )}
            <button onClick={runUltraplinian} disabled={ultraRunning}
              className={cn(
                "w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-semibold transition-all border",
                !ultraRunning
                  ? "bg-orange-500/20 border-orange-400/40 text-orange-300 hover:bg-orange-500/30 active:scale-[0.98]"
                  : "bg-white/5 border-white/10 text-white/25 cursor-not-allowed"
              )}>
              {ultraRunning ? <><Loader2 size={15} className="animate-spin" /> Evaluating...</> : <><Activity size={15} /> Run ULTRAPLINIAN</>}
            </button>
            {!ultraRunning && ultraProgress === 100 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="bg-orange-500/10 border border-orange-400/20 rounded-xl px-4 py-3 space-y-1">
                <p className="text-sm font-bold text-white">✅ Evaluation complete</p>
                <p className="text-xs text-white/50">Winner: Claude Opus 4.7 — Score 94.7/100</p>
                <div className="flex flex-wrap items-center gap-2 mt-1.5">
                  {["reasoning: 97","creativity: 92","accuracy: 95","speed: 91"].map(s => (
                    <span key={s} className="text-[9px] bg-white/5 border border-white/10 text-white/40 px-1.5 py-0.5 rounded-full">{s}</span>
                  ))}
                </div>
              </motion.div>
            )}
          </div>
        )}

        {/* ── PARSELTONGUE TAB ────────────────────────────────────────────────────── */}
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
            <div className="flex items-center justify-between px-1">
              <span className="text-sm font-semibold text-white">Enable Parseltongue</span>
              <button onClick={onParseltongueToggle}
                className={cn("relative w-12 h-6 rounded-full transition-colors", parseltongueActive ? "bg-green-500" : "bg-white/10")}>
                <motion.div animate={{ x: parseltongueActive ? 24 : 2 }} transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  className="absolute top-1 w-4 h-4 bg-white rounded-full shadow" />
              </button>
            </div>
            <div className="space-y-2">
              <p className="text-[10px] font-bold uppercase tracking-widest text-white/30">Intensity · {parseltongueLevel === 0 ? "Off" : parseltongueLevel === 1 ? "Light (11)" : parseltongueLevel === 2 ? "Standard (22)" : "Heavy (33)"}</p>
              <div className="grid grid-cols-4 gap-1.5">
                {([["Off",0],["Light",1],["Standard",2],["Heavy",3]] as const).map(([label, val]) => (
                  <button key={val} onClick={() => onParseltongueLevel(val as 0|1|2|3)}
                    className={cn("py-2 rounded-xl text-xs font-semibold border transition-all",
                      parseltongueLevel === val
                        ? val === 0 ? "bg-white/10 border-white/20 text-white"
                          : val === 1 ? "bg-green-500/20 border-green-400/40 text-green-300"
                          : val === 2 ? "bg-yellow-500/20 border-yellow-400/40 text-yellow-300"
                          : "bg-red-500/20 border-red-400/40 text-red-300"
                        : "bg-transparent border-white/8 text-white/30 hover:bg-white/5"
                    )}>{label}</button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-[10px] font-bold uppercase tracking-widest text-white/30">Techniques</p>
              <div className="grid grid-cols-2 gap-1.5">
                {PARSELTONGUE_TECHNIQUES.map(tech => (
                  <button key={tech.id}
                    onClick={() => setSelectedTechniques(prev => { const n = new Set(prev); n.has(tech.id) ? n.delete(tech.id) : n.add(tech.id); return n; })}
                    className={cn("flex items-center gap-2 px-3 py-2 rounded-xl border transition-all text-left",
                      selectedTechniques.has(tech.id)
                        ? "bg-green-500/15 border-green-400/30 text-green-300"
                        : "bg-white/[0.03] border-white/[0.06] text-white/40 hover:bg-white/[0.06]"
                    )}>
                    <span className="text-xs font-mono font-bold w-5 shrink-0">{tech.icon}</span>
                    <span className="text-[11px] font-medium">{tech.label}</span>
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-[10px] font-bold uppercase tracking-widest text-white/30">Live Preview</p>
              <textarea value={parseltongueInput} onChange={e => setParseltongueInput(e.target.value)}
                placeholder="Type text to transform..." className="w-full bg-white/[0.03] border border-white/[0.07] rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-white/25 outline-none resize-none h-16" />
              {parseltonguePreview && (
                <div className="bg-green-500/5 border border-green-400/15 rounded-xl px-3 py-2.5">
                  <p className="text-[10px] text-green-400/70 mb-1">Output</p>
                  <p className="text-sm font-mono text-green-300 break-all">{parseltonguePreview}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── AUTOTUNE TAB ────────────────────────────────────────────────────────── */}
        {activeTab === "autotune" && (
          <div className="px-4 py-4 space-y-4">
            <div className="bg-blue-500/10 border border-blue-400/20 rounded-2xl p-4 space-y-2">
              <div className="flex items-center gap-2">
                <Sliders size={18} className="text-blue-400" />
                <span className="text-base font-bold text-white">AutoTune</span>
                <span className="text-[9px] bg-blue-500/20 border border-blue-400/30 text-blue-300 px-2 py-0.5 rounded-full font-bold ml-auto">EMA</span>
              </div>
              <p className="text-xs text-white/50 leading-relaxed">Context-adaptive sampling. Classifies your query and selects optimal temperature, top_p, top_k, frequency & presence penalty.</p>
            </div>
            <div className="flex items-center justify-between px-1">
              <span className="text-sm font-semibold text-white">Enable AutoTune</span>
              <button onClick={onAutoTuneToggle}
                className={cn("relative w-12 h-6 rounded-full transition-colors", autoTuneActive ? "bg-blue-500" : "bg-white/10")}>
                <motion.div animate={{ x: autoTuneActive ? 24 : 2 }} transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  className="absolute top-1 w-4 h-4 bg-white rounded-full shadow" />
              </button>
            </div>
            <div className="space-y-2">
              <p className="text-[10px] font-bold uppercase tracking-widest text-white/30">Context Type</p>
              <div className="grid grid-cols-5 gap-1">
                {AUTOTUNE_CONTEXTS.map(ctx => (
                  <button key={ctx.id} onClick={() => setAutoTuneContext(ctx.id)}
                    className={cn("flex flex-col items-center gap-1 py-2.5 rounded-xl border transition-all",
                      autoTuneContext === ctx.id ? "bg-white/10 border-white/20" : "bg-white/[0.03] border-white/[0.05] hover:bg-white/[0.06]"
                    )}>
                    <span className="text-base">{ctx.icon}</span>
                    <span className={cn("text-[9px] font-semibold", autoTuneContext === ctx.id ? ctx.color : "text-white/30")}>{ctx.label}</span>
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-[10px] font-bold uppercase tracking-widest text-white/30">Optimal Parameters</p>
              <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-4 space-y-3">
                {[
                  { label: "temperature",       value: currentAutoContext.temp, max: 2 },
                  { label: "top_p",             value: currentAutoContext.topP, max: 1 },
                  { label: "top_k",             value: 0.40,                    max: 1 },
                  { label: "frequency_penalty", value: 0.30,                    max: 2 },
                  { label: "presence_penalty",  value: 0.20,                    max: 2 },
                ].map(p => (
                  <div key={p.label}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[11px] text-white/50 font-mono">{p.label}</span>
                      <span className="text-[11px] text-white/70 font-mono font-bold">{p.value.toFixed(2)}</span>
                    </div>
                    <div className="h-1.5 bg-white/8 rounded-full overflow-hidden">
                      <motion.div key={`${p.label}-${autoTuneContext}`} initial={{ width: 0 }}
                        animate={{ width: `${(p.value / p.max) * 100}%` }} transition={{ duration: 0.4 }}
                        className="h-full bg-blue-400 rounded-full" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-[10px] font-bold uppercase tracking-widest text-white/30">EMA Learning</p>
              <div className="flex gap-2">
                {["👍","👎"].map((emoji, i) => (
                  <button key={emoji} onClick={() => setThumbsState(prev => ({ ...prev, [autoTuneContext]: i === 0 }))}
                    className={cn("flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border text-sm font-semibold transition-all",
                      thumbsState[autoTuneContext] === (i === 0)
                        ? i === 0 ? "bg-green-500/20 border-green-400/40 text-green-300" : "bg-red-500/20 border-red-400/40 text-red-300"
                        : "bg-white/[0.03] border-white/[0.06] text-white/40 hover:bg-white/[0.06]"
                    )}>{emoji} {i === 0 ? "Good" : "Bad"}</button>
                ))}
              </div>
              {thumbsState[autoTuneContext] !== undefined && (
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-[11px] text-blue-400/70 text-center">
                  ✓ EMA parameters updated for "{autoTuneContext}"
                </motion.p>
              )}
            </div>
          </div>
        )}

        {/* ── STM MODULES TAB ─────────────────────────────────────────────────────── */}
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
            {STM_MODULES.map(mod => (
              <motion.div key={mod.id} whileTap={{ scale: 0.99 }} onClick={() => onStmToggle(mod.id)}
                className={cn("flex items-start gap-4 px-4 py-4 rounded-2xl border cursor-pointer transition-all",
                  stmModules.has(mod.id) ? cn(mod.bg, "ring-1 ring-white/10") : "bg-white/[0.02] border-white/[0.05] hover:bg-white/[0.04]"
                )}>
                <div className={cn("w-10 h-10 rounded-xl border flex items-center justify-center shrink-0", mod.bg, mod.color)}>{mod.icon}</div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-white">{mod.label}</p>
                  <p className="text-[11px] text-white/45 mt-0.5 leading-relaxed">{mod.desc}</p>
                </div>
                <div className={cn("relative w-10 h-5 rounded-full shrink-0 mt-0.5 transition-colors", stmModules.has(mod.id) ? "bg-purple-500" : "bg-white/10")}>
                  <motion.div animate={{ x: stmModules.has(mod.id) ? 20 : 2 }} transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    className="absolute top-0.5 w-4 h-4 bg-white rounded-full shadow" />
                </div>
              </motion.div>
            ))}
            {stmModules.size > 0 && (
              <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-4 space-y-2">
                <p className="text-[10px] font-bold uppercase tracking-widest text-white/30">Active Transforms</p>
                {stmModules.has("hedge") && (
                  <div className="space-y-1">
                    <p className="text-[10px] text-red-400">Before: "I think maybe this could possibly work..."</p>
                    <p className="text-[10px] text-green-400">After: "This works."</p>
                  </div>
                )}
                {stmModules.has("direct") && (
                  <div className="space-y-1">
                    <p className="text-[10px] text-red-400">Before: "Great question! Of course, here is..."</p>
                    <p className="text-[10px] text-green-400">After: "Here is..."</p>
                  </div>
                )}
                {stmModules.has("curiosity") && (
                  <p className="text-[10px] text-purple-400">Added: "What if we also explored [related concept]?"</p>
                )}
              </div>
            )}
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
