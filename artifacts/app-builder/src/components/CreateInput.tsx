import { useState, useRef, useEffect } from "react";
import { Plus, ArrowUp, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";
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
  { id: "Economy", label: "Economy", desc: "Cost-optimized models for everyday tasks. Delivers a strong balance of speed and quality. Best mode for most builds.", color: "text-foreground" },
  { id: "Lite", label: "Lite", desc: "Fast and lightweight. Great for simple edits.", color: "text-muted-foreground" },
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
      {/* Agent Modes Panel */}
      <AnimatePresence>
        {showModes && (
          <>
            <div className="fixed inset-0 z-30" onClick={() => setShowModes(false)} />
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.97 }}
              transition={{ duration: 0.15 }}
              className="absolute bottom-full mb-2 left-0 right-0 z-40 bg-card border border-border rounded-2xl shadow-2xl overflow-hidden"
            >
              <div className="p-3">
                <p className="text-xs text-muted-foreground font-semibold uppercase tracking-widest px-1 mb-2">
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
                          ? "bg-secondary border-border text-foreground"
                          : "bg-transparent border-transparent text-muted-foreground hover:bg-secondary/50"
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
                <div className="px-1 py-2 bg-secondary/40 rounded-xl">
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {AGENT_MODES.find(m => m.id === agentMode)?.desc}
                  </p>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Input Card */}
      <div className="bg-card rounded-xl border border-card-border p-3 shadow-lg flex flex-col gap-3">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Describe your idea, Replit will bring it to life..."
          className="w-full bg-transparent resize-none outline-none text-foreground placeholder:text-muted-foreground min-h-[44px] max-h-[120px] text-base"
          data-testid="input-prompt"
        />

        <div className="flex items-center justify-between mt-1">
          <button
            className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors border border-border"
            data-testid="button-add-attachment"
          >
            <Plus size={18} />
          </button>

          <div className="flex items-center gap-2">
            {/* Plan toggle */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary/50 border border-border">
              <span className="text-xs font-medium text-muted-foreground">Plan</span>
              <Switch
                checked={planEnabled}
                onCheckedChange={setPlanEnabled}
                data-testid="switch-plan"
                className="scale-75 data-[state=checked]:bg-primary"
              />
            </div>

            {/* Agent mode selector */}
            <button
              onClick={() => setShowModes(!showModes)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-secondary/50 border border-border hover:bg-secondary transition-colors"
              data-testid="button-agent-mode"
            >
              <span className="text-xs font-medium text-foreground">⠿ {agentMode}</span>
              <ChevronDown size={12} className="text-muted-foreground" />
            </button>
          </div>

          <button
            onClick={onSubmit}
            disabled={!value.trim()}
            className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center transition-all",
              value.trim()
                ? "bg-primary text-primary-foreground shadow-md hover:brightness-110"
                : "bg-secondary text-muted-foreground opacity-50 cursor-not-allowed"
            )}
            data-testid="button-send"
          >
            <ArrowUp size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
