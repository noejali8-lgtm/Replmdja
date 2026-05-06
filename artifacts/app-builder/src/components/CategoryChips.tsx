import { useState } from "react";
import { cn } from "@/lib/utils";
import { LayoutTemplate, PresentationIcon, Zap, BarChart3, Globe, Smartphone } from "lucide-react";

interface CategoryChipsProps {
  onSelect: (category: string) => void;
}

const CATEGORIES = [
  { label: "Design", icon: <LayoutTemplate size={13} /> },
  { label: "Slides", icon: <PresentationIcon size={13} /> },
  { label: "Animation", icon: <Zap size={13} /> },
  { label: "Data Visualization", icon: <BarChart3 size={13} /> },
  { label: "Web App", icon: <Globe size={13} /> },
  { label: "Mobile App", icon: <Smartphone size={13} /> },
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
            "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[13px] font-medium whitespace-nowrap transition-all shrink-0",
            selected === cat.label
              ? "bg-white/15 text-white border border-white/25"
              : "bg-[#1e1e1e] text-white/55 border border-white/[0.07] hover:text-white/80 hover:bg-white/10"
          )}
        >
          <span className={cn(selected === cat.label ? "text-white" : "text-white/40")}>
            {cat.icon}
          </span>
          {cat.label}
        </button>
      ))}
    </div>
  );
}
