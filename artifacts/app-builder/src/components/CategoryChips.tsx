import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  LayoutTemplate, PresentationIcon, Zap, BarChart3, Globe, Smartphone,
  Bot, Gamepad2, ShoppingCart, MessageSquare, Server, Code2
} from "lucide-react";

interface CategoryChipsProps {
  onSelect: (category: string) => void;
}

const CATEGORIES = [
  { label: "Design", icon: <LayoutTemplate size={12} /> },
  { label: "Slides", icon: <PresentationIcon size={12} /> },
  { label: "Animation", icon: <Zap size={12} /> },
  { label: "Data Viz", icon: <BarChart3 size={12} /> },
  { label: "Web App", icon: <Globe size={12} /> },
  { label: "Mobile App", icon: <Smartphone size={12} /> },
  { label: "AI Chatbot", icon: <Bot size={12} /> },
  { label: "Game", icon: <Gamepad2 size={12} /> },
  { label: "E-Commerce", icon: <ShoppingCart size={12} /> },
  { label: "Discord Bot", icon: <MessageSquare size={12} /> },
  { label: "API Server", icon: <Server size={12} /> },
  { label: "CLI Tool", icon: <Code2 size={12} /> },
];

export function CategoryChips({ onSelect }: CategoryChipsProps) {
  const [selected, setSelected] = useState<string | null>(null);

  const handleSelect = (category: string) => {
    setSelected(category);
    onSelect(category);
  };

  return (
    <div className="w-full overflow-x-auto no-scrollbar py-1 flex gap-2">
      {CATEGORIES.map((cat) => (
        <button
          key={cat.label}
          data-testid={`chip-${cat.label.toLowerCase().replace(/\s+/g, "-")}`}
          onClick={() => handleSelect(cat.label)}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-medium whitespace-nowrap transition-all shrink-0 border",
            selected === cat.label
              ? "bg-white/12 text-white border-white/20"
              : "bg-[#1c1c1c] text-white/50 border-white/[0.07] hover:text-white/80 hover:bg-white/8"
          )}
        >
          <span className={cn(selected === cat.label ? "text-white" : "text-white/35")}>
            {cat.icon}
          </span>
          {cat.label}
        </button>
      ))}
    </div>
  );
}
