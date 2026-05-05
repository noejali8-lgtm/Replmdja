import { useState, useRef, useEffect } from "react";
import { Plus, ArrowUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";

interface CreateInputProps {
  value: string;
  onChange: (val: string) => void;
  onSubmit: () => void;
}

export function CreateInput({ value, onChange, onSubmit }: CreateInputProps) {
  const [planEnabled, setPlanEnabled] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [value]);

  return (
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

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary/50 border border-border">
          <span className="text-xs font-medium text-muted-foreground">Plan</span>
          <Switch 
            checked={planEnabled}
            onCheckedChange={setPlanEnabled}
            data-testid="switch-plan"
            className="scale-75 data-[state=checked]:bg-primary"
          />
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
  );
}
