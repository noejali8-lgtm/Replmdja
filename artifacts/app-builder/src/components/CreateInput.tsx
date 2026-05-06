import { useState, useRef, useEffect } from "react";
import { Plus, ArrowUp, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface CreateInputProps {
  value: string;
  onChange: (val: string) => void;
  onSubmit: () => void;
}

type AgentMode = "Core+" | "Power" | "Economy" | "Lite";

const AGENT_MODES: { id: AgentMode; label: string; desc: string; color: string; badge?: string }[] = [
  { id: "Core+", label: "Core+", desc: "Latest & most capable models. Best quality.", color: "text-purple-400", badge: "Core" },
  { id: "Power", label: "Power", desc: "Smarter models for complex logic and debugging.", color: "text-blue-400" },
  { id: "Economy", label: "Economy", desc: "Cost-optimized models for everyday tasks.", color: "text-white" },
  { id: "Lite", label: "Lite", desc: "Fast and lightweight. Great for simple edits.", color: "text-white/60" },
];

export function CreateInput({ value, onChange, onSubmit }: CreateInputProps) {
  const [planEnabled, setPlanEnabled] = useState(false);
  const [agentMode, setAgentMode] = useState<AgentMode>("Economy");
  const [showModes, setShowModes] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [value]);

  return (
    <div className="relative">
      <AnimatePresence>
        {showModes && (
          <>
            <div className="fixed inset-0 z-30" onClick={() => setShowModes(false)} />
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.97 }}
              transition={{ duration: 0.15 }}
              className="absolute bottom-full mb-2 left-0 right-0 z-40 bg-[#1c1c1c] border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
            >
              <div className="p-3">
                <p className="text-xs text-white/40 font-semibold uppercase tracking-widest px-1 mb-2">
                  Agent modes
                </p>
                <div className="grid grid-cols-4 gap-1.5 mb-3">
                  {AGENT_MODES.map((mode) => (
                    <button
                      key={mode.id}
                      onClick={() => { setAgentMode(mode.id); setShowModes(false); }}
                      className={cn(
                        "relative px-3 py-2 rounded-xl text-sm font-semibold transition-all border",
                        agentMode === mode.id
                          ? "bg-white/10 border-white/20 text-white"
                          : "bg-transparent border-transparent text-white/40 hover:bg-white/5"
                      )}
                      data-testid={`agent-mode-${mode.id.toLowerCase().replace("+", "-plus")}`}
                    >
                      {mode.badge && (
                        <span className="absolute -top-1.5 -left-1 text-[9px] bg-purple-500 text-white px-1 rounded-sm font-bold leading-none py-0.5">
                          {mode.badge}
                        </span>
                      )}
                      <span className={mode.color}>{mode.id}</span>
                    </button>
                  ))}
                </div>
                <div className="px-2 py-2 bg-white/5 rounded-xl">
                  <p className="text-xs text-white/50 leading-relaxed">
                    {AGENT_MODES.find(m => m.id === agentMode)?.desc}
                  </p>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <div className="bg-[#1c1c1c] rounded-2xl border border-white/[0.08] overflow-hidden">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              onSubmit();
            }
          }}
          placeholder="Describe your idea, Replit will bring it to life..."
          className="w-full bg-transparent resize-none outline-none text-white placeholder:text-white/35 min-h-[52px] max-h-[120px] text-[15px] px-4 pt-4 pb-2"
          data-testid="input-prompt"
        />

        <div className="flex items-center gap-2 px-3 pb-3">
          <button
            className="w-7 h-7 rounded-full bg-white/8 flex items-center justify-center text-white/50 hover:text-white transition-colors border border-white/10"
            data-testid="button-add-attachment"
          >
            <Plus size={15} />
          </button>

          <button
            onClick={() => setPlanEnabled(v => !v)}
            className={cn(
              "flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium transition-all border",
              planEnabled
                ? "bg-white/15 border-white/25 text-white"
                : "bg-transparent border-white/12 text-white/50 hover:border-white/20 hover:text-white/70"
            )}
            data-testid="switch-plan"
          >
            <div className={cn(
              "w-3.5 h-3.5 rounded-sm border flex items-center justify-center shrink-0 transition-colors",
              planEnabled ? "bg-white border-white" : "border-white/30"
            )}>
              {planEnabled && <div className="w-1.5 h-1.5 bg-black rounded-sm" />}
            </div>
            Plan
          </button>

          <div className="flex-1" />

          <button
            onClick={onSubmit}
            disabled={!value.trim()}
            className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center transition-all",
              value.trim()
                ? "bg-[#2563eb] text-white hover:bg-blue-500 active:scale-95"
                : "bg-white/8 text-white/25 cursor-not-allowed"
            )}
            data-testid="button-send"
          >
            <ArrowUp size={17} />
          </button>
        </div>
      </div>
    </div>
  );
}
