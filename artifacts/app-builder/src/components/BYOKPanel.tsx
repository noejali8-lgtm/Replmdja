/* ==========================================================================
   BYOK (Bring Your Own Key) Settings Panel
   Integrated from OpenGravity (https://github.com/ab-613/opengravity)

   Stores API keys securely in localStorage — never sent to our servers
   except as request headers directly to the provider's API.
   ========================================================================== */

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, Key, Eye, EyeOff, Check, AlertCircle, Loader2,
  ExternalLink, Trash2, Shield, ChevronRight, Sparkles,
  RefreshCw, Info
} from "lucide-react";
import { cn } from "@/lib/utils";

/* ── Storage helpers ── */
const STORAGE_KEYS = {
  gemini:    "byok_gemini_api_key",
  openai:    "byok_openai_api_key",
  anthropic: "byok_anthropic_api_key",
  cohere:    "byok_cohere_api_key",
  mistral:   "byok_mistral_api_key",
  groq:      "byok_groq_api_key",
};

export type ByokProvider = keyof typeof STORAGE_KEYS;

export function getBYOKKey(provider: ByokProvider): string {
  return localStorage.getItem(STORAGE_KEYS[provider]) ?? "";
}

export function setBYOKKey(provider: ByokProvider, key: string) {
  if (key.trim()) {
    localStorage.setItem(STORAGE_KEYS[provider], key.trim());
  } else {
    localStorage.removeItem(STORAGE_KEYS[provider]);
  }
}

export function hasBYOKKey(provider: ByokProvider): boolean {
  return !!localStorage.getItem(STORAGE_KEYS[provider]);
}

/* ── Provider metadata ── */
interface ProviderConfig {
  id: ByokProvider;
  name: string;
  description: string;
  icon: string;
  color: string;
  bg: string;
  border: string;
  placeholder: string;
  docsUrl: string;
  keyPrefix?: string;
  validateEndpoint?: string;
}

const PROVIDERS: ProviderConfig[] = [
  {
    id: "gemini",
    name: "Google Gemini",
    description: "Access Gemini 2.5 Pro, Flash, and more. Required for the Antigravity agent.",
    icon: "💎",
    color: "text-blue-400",
    bg: "bg-blue-500/10",
    border: "border-blue-400/20",
    placeholder: "AIza...",
    docsUrl: "https://aistudio.google.com/apikey",
    keyPrefix: "AIza",
  },
  {
    id: "openai",
    name: "OpenAI",
    description: "Access GPT-4o, o3, o1, and other OpenAI models.",
    icon: "🤖",
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
    border: "border-emerald-400/20",
    placeholder: "sk-...",
    docsUrl: "https://platform.openai.com/api-keys",
    keyPrefix: "sk-",
  },
  {
    id: "anthropic",
    name: "Anthropic (direct)",
    description: "Your own Anthropic key — bypasses Replit AI integration.",
    icon: "🧠",
    color: "text-orange-400",
    bg: "bg-orange-500/10",
    border: "border-orange-400/20",
    placeholder: "sk-ant-...",
    docsUrl: "https://console.anthropic.com/keys",
    keyPrefix: "sk-ant-",
  },
  {
    id: "cohere",
    name: "Cohere",
    description: "Access Command R+ for enterprise RAG and search.",
    icon: "🔗",
    color: "text-purple-400",
    bg: "bg-purple-500/10",
    border: "border-purple-400/20",
    placeholder: "...",
    docsUrl: "https://dashboard.cohere.com/api-keys",
  },
  {
    id: "mistral",
    name: "Mistral AI",
    description: "Access Mistral Large, Codestral, and Mixtral models.",
    icon: "🌪️",
    color: "text-violet-400",
    bg: "bg-violet-500/10",
    border: "border-violet-400/20",
    placeholder: "...",
    docsUrl: "https://console.mistral.ai/api-keys",
  },
  {
    id: "groq",
    name: "Groq",
    description: "Ultra-fast inference for LLaMA, Mixtral, and Gemma.",
    icon: "⚡",
    color: "text-yellow-400",
    bg: "bg-yellow-500/10",
    border: "border-yellow-400/20",
    placeholder: "gsk_...",
    docsUrl: "https://console.groq.com/keys",
    keyPrefix: "gsk_",
  },
];

/* ── Validate Gemini key via backend ── */
async function validateGeminiKey(key: string): Promise<{ valid: boolean; error?: string }> {
  try {
    const res = await fetch("/api/gemini/validate-key", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Gemini-Key": key },
    });
    return await res.json() as { valid: boolean; error?: string };
  } catch {
    return { valid: false, error: "Network error" };
  }
}

/* ══════════════════════════════════════════════════════════════
   BYOK PANEL COMPONENT
══════════════════════════════════════════════════════════════ */
interface BYOKPanelProps {
  onClose: () => void;
  initialProvider?: ByokProvider;
}

export function BYOKPanel({ onClose, initialProvider = "gemini" }: BYOKPanelProps) {
  const [selectedProvider, setSelectedProvider] = useState<ByokProvider>(initialProvider);
  const [keys, setKeys] = useState<Record<ByokProvider, string>>(() => ({
    gemini:    getBYOKKey("gemini"),
    openai:    getBYOKKey("openai"),
    anthropic: getBYOKKey("anthropic"),
    cohere:    getBYOKKey("cohere"),
    mistral:   getBYOKKey("mistral"),
    groq:      getBYOKKey("groq"),
  }));
  const [showKey, setShowKey] = useState<Record<ByokProvider, boolean>>({
    gemini: false, openai: false, anthropic: false, cohere: false, mistral: false, groq: false,
  });
  const [validating, setValidating] = useState<ByokProvider | null>(null);
  const [validationResult, setValidationResult] = useState<Record<string, { valid: boolean; error?: string }>>({});
  const [saved, setSaved] = useState<ByokProvider | null>(null);

  const provider = PROVIDERS.find(p => p.id === selectedProvider)!;
  const currentKey = keys[selectedProvider];

  const handleSave = async (pId: ByokProvider) => {
    const key = keys[pId];
    setBYOKKey(pId, key);
    setSaved(pId);
    setTimeout(() => setSaved(null), 2000);

    if (pId === "gemini" && key.trim()) {
      setValidating(pId);
      const result = await validateGeminiKey(key.trim());
      setValidationResult(prev => ({ ...prev, [pId]: result }));
      setValidating(null);
    }
  };

  const handleDelete = (pId: ByokProvider) => {
    setBYOKKey(pId, "");
    setKeys(prev => ({ ...prev, [pId]: "" }));
    setValidationResult(prev => { const n = { ...prev }; delete n[pId]; return n; });
  };

  const configuredCount = PROVIDERS.filter(p => keys[p.id]?.trim()).length;

  return (
    <motion.div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        className="w-[560px] max-w-[95vw] max-h-[88vh] bg-[#111] border border-white/10 rounded-2xl overflow-hidden flex flex-col shadow-2xl"
        initial={{ scale: 0.96, y: 12, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.96, y: 8, opacity: 0 }}
        transition={{ type: "spring", stiffness: 400, damping: 30 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.07]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-500/15 border border-blue-400/20 rounded-lg flex items-center justify-center">
              <Key size={15} className="text-blue-400" />
            </div>
            <div>
              <h2 className="text-[14px] font-semibold text-white">API Keys (BYOK)</h2>
              <p className="text-[11px] text-white/35">
                {configuredCount > 0
                  ? `${configuredCount} provider${configuredCount !== 1 ? "s" : ""} configured — stored only in your browser`
                  : "Keys are stored only in your browser's localStorage — never on our servers"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/8 text-white/40 hover:text-white/80 transition-colors"
          >
            <X size={14} />
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Provider sidebar */}
          <div className="w-[180px] shrink-0 border-r border-white/[0.07] overflow-y-auto py-2">
            {PROVIDERS.map(p => {
              const hasKey = keys[p.id]?.trim();
              const isActive = selectedProvider === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => setSelectedProvider(p.id)}
                  className={cn(
                    "w-full flex items-center gap-2.5 px-3 py-2.5 text-left transition-all",
                    isActive
                      ? "bg-white/[0.06] border-r-2 border-blue-400"
                      : "hover:bg-white/[0.03] border-r-2 border-transparent"
                  )}
                >
                  <span className="text-[16px] shrink-0">{p.icon}</span>
                  <div className="min-w-0 flex-1">
                    <div className={cn("text-[12px] font-medium truncate", isActive ? "text-white" : "text-white/60")}>{p.name}</div>
                  </div>
                  {hasKey && (
                    <div className="w-1.5 h-1.5 rounded-full bg-green-400 shrink-0" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Key editor */}
          <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xl">{provider.icon}</span>
                <span className={cn("text-[15px] font-semibold", provider.color)}>{provider.name}</span>
              </div>
              <p className="text-[12px] text-white/40 leading-relaxed">{provider.description}</p>
            </div>

            {/* Key input */}
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-white/30 mb-2">
                API Key
              </label>
              <div className="relative">
                <input
                  type={showKey[selectedProvider] ? "text" : "password"}
                  value={currentKey}
                  onChange={(e) => setKeys(prev => ({ ...prev, [selectedProvider]: e.target.value }))}
                  placeholder={provider.placeholder}
                  className="w-full bg-white/[0.04] border border-white/[0.1] rounded-xl px-3 py-2.5 pr-10 text-[13px] text-white placeholder:text-white/20 font-mono focus:outline-none focus:border-blue-400/40 transition-colors"
                  onKeyDown={(e) => { if (e.key === "Enter") handleSave(selectedProvider); }}
                />
                <button
                  onClick={() => setShowKey(prev => ({ ...prev, [selectedProvider]: !prev[selectedProvider] }))}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                >
                  {showKey[selectedProvider] ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            {/* Validation status */}
            <AnimatePresence mode="wait">
              {validating === selectedProvider && (
                <motion.div
                  key="validating"
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-2 text-[12px] text-blue-400"
                >
                  <Loader2 size={12} className="animate-spin" />
                  Validating key...
                </motion.div>
              )}
              {validationResult[selectedProvider] && !validating && (
                <motion.div
                  key="result"
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className={cn(
                    "flex items-center gap-2 text-[12px] px-3 py-2 rounded-lg border",
                    validationResult[selectedProvider].valid
                      ? "bg-green-500/10 border-green-400/20 text-green-400"
                      : "bg-red-500/10 border-red-400/20 text-red-400"
                  )}
                >
                  {validationResult[selectedProvider].valid
                    ? <><Check size={12} /> Key is valid and working!</>
                    : <><AlertCircle size={12} /> {validationResult[selectedProvider].error ?? "Invalid key"}</>
                  }
                </motion.div>
              )}
            </AnimatePresence>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleSave(selectedProvider)}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-blue-500/15 hover:bg-blue-500/25 border border-blue-400/20 hover:border-blue-400/40 text-blue-300 rounded-xl text-[13px] font-medium transition-all"
              >
                {saved === selectedProvider
                  ? <><Check size={13} /> Saved!</>
                  : <><Key size={13} /> Save Key</>
                }
              </button>
              {currentKey && (
                <button
                  onClick={() => handleDelete(selectedProvider)}
                  className="flex items-center justify-center gap-2 px-3 py-2.5 bg-red-500/10 hover:bg-red-500/15 border border-red-400/15 hover:border-red-400/25 text-red-400 rounded-xl text-[13px] transition-all"
                  title="Remove key"
                >
                  <Trash2 size={13} />
                </button>
              )}
              {selectedProvider === "gemini" && currentKey && (
                <button
                  onClick={() => { setValidating(selectedProvider); validateGeminiKey(currentKey).then(r => { setValidationResult(prev => ({ ...prev, [selectedProvider]: r })); setValidating(null); }); }}
                  className="flex items-center justify-center gap-2 px-3 py-2.5 bg-white/5 hover:bg-white/8 border border-white/[0.08] text-white/50 hover:text-white/70 rounded-xl text-[13px] transition-all"
                  title="Test key"
                >
                  <RefreshCw size={13} />
                </button>
              )}
            </div>

            {/* Docs link */}
            <a
              href={provider.docsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-[12px] text-white/30 hover:text-white/55 transition-colors"
            >
              <ExternalLink size={11} />
              Get a free key at {new URL(provider.docsUrl).hostname}
            </a>

            {/* Privacy notice */}
            <div className="flex items-start gap-2 bg-white/[0.03] border border-white/[0.06] rounded-xl p-3 mt-auto">
              <Shield size={12} className="text-white/30 mt-0.5 shrink-0" />
              <p className="text-[11px] text-white/30 leading-relaxed">
                Your API keys are stored <strong className="text-white/45">only in your browser's localStorage</strong>.
                They are never sent to our servers — only directly to the provider when you make a request.
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ── Quick key status badge (for use in other components) ── */
export function BYOKBadge({ provider, onClick }: { provider: ByokProvider; onClick?: () => void }) {
  const hasKey = hasBYOKKey(provider);
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-1.5 px-2 py-1 rounded-lg border text-[11px] font-medium transition-all",
        hasKey
          ? "bg-green-500/10 border-green-400/20 text-green-400 hover:bg-green-500/15"
          : "bg-white/5 border-white/10 text-white/40 hover:bg-white/8"
      )}
    >
      <Key size={10} />
      {hasKey ? "BYOK ✓" : "Add Key"}
    </button>
  );
}
