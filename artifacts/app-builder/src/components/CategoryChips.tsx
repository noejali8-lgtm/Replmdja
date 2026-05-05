import { useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface CategoryChipsProps {
  onSelect: (category: string) => void;
}

export function CategoryChips({ onSelect }: CategoryChipsProps) {
  const [selected, setSelected] = useState<string | null>(null);

  const categories = [
    "Design",
    "Slides",
    "Animation",
    "Data Visualization",
    "Web App",
    "Mobile App",
  ];

  const handleSelect = (category: string) => {
    setSelected(category);
    onSelect(category);
  };

  return (
    <div className="w-full overflow-x-auto no-scrollbar py-2 -mx-4 px-4 flex gap-2">
      {categories.map((category) => (
        <button
          key={category}
          data-testid={`chip-${category.toLowerCase().replace(/\s+/g, "-")}`}
          onClick={() => handleSelect(category)}
          className={cn(
            "relative px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors border",
            selected === category
              ? "text-primary-foreground border-primary"
              : "bg-secondary text-secondary-foreground border-border hover:bg-secondary/80 hover:text-foreground"
          )}
        >
          {selected === category && (
            <motion.div
              layoutId="chip-bg"
              className="absolute inset-0 rounded-full bg-primary -z-10"
              initial={false}
              transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
            />
          )}
          {category}
        </button>
      ))}
    </div>
  );
}
