import { useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { LayoutTemplate, Presentation, Zap, BarChart3, Globe, Smartphone } from "lucide-react";

interface CategoryChipsProps {
  onSelect: (category: string) => void;
}

const CATEGORIES = [
  { label: "Design", icon: <LayoutTemplate size={14} /> },
  { label: "Slides", icon: <Presentation size={14} /> },
  { label: "Animation", icon: <Zap size={14} /> },
  { label: "Data Visualization", icon: <BarChart3 size={14} /> },
  { label: "Web App", icon: <Globe size={14} /> },
  { label: "Mobile App", icon: <Smartphone size={14} /> },
];

export function CategoryChips({ onSelect }: CategoryChipsProps) {
  const [selected, setSelected] = useState<string | null>(null);

  const handleSelect = (category: string) => {
    setSelected(category);
    onSelect(category);
  };

  return (
    <div className="w-full overflow-x-auto no-scrollbar py-2 -mx-4 px-4 flex gap-2">
      {CATEGORIES.map((cat) => (
        <button
          key={cat.label}
          data-testid={`chip-${cat.label.toLowerCase().replace(/\s+/g, "-")}`}
          onClick={() => handleSelect(cat.label)}
          className={cn(
            "relative flex items-center gap-1.5 px-3.5 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors border shrink-0",
            selected === cat.label
              ? "text-primary-foreground border-primary"
              : "bg-secondary text-secondary-foreground border-border hover:bg-secondary/80 hover:text-foreground"
          )}
        >
          {selected === cat.label && (
            <motion.div
              layoutId="chip-bg"
              className="absolute inset-0 rounded-full bg-primary -z-10"
              initial={false}
              transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
            />
          )}
          <span className={cn(selected === cat.label ? "text-primary-foreground" : "text-muted-foreground")}>
            {cat.icon}
          </span>
          {cat.label}
        </button>
      ))}
    </div>
  );
}
