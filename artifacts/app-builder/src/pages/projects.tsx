import { useState } from "react";
import { motion } from "framer-motion";
import { Search, MonitorSmartphone, Layers, BarChart3, Presentation, Wand2 } from "lucide-react";
import { Input } from "@/components/ui/input";

const SAMPLE_PROJECTS = [
  { id: 1, name: "Portfolio Website", type: "Web App", time: "2 hours ago", icon: MonitorSmartphone, color: "text-blue-400" },
  { id: 2, name: "Data Dashboard", type: "React", time: "5 hours ago", icon: BarChart3, color: "text-green-400" },
  { id: 3, name: "API Server", type: "Python", time: "1 day ago", icon: Layers, color: "text-yellow-400" },
  { id: 4, name: "Pitch Deck", type: "Slides", time: "2 days ago", icon: Presentation, color: "text-purple-400" },
  { id: 5, name: "Logo Generator", type: "AI App", time: "3 days ago", icon: Wand2, color: "text-pink-400" },
];

export default function Projects() {
  const [search, setSearch] = useState("");

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="flex flex-col h-full px-4 pt-12 pb-24 max-w-[480px] mx-auto w-full"
    >
      <h1 className="text-2xl font-bold mb-6 text-foreground">Projects</h1>
      
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
        <Input 
          placeholder="Search projects..." 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10 bg-secondary/50 border-border focus-visible:ring-primary rounded-xl"
          data-testid="input-search-projects"
        />
      </div>

      <div className="flex flex-col gap-3 overflow-y-auto no-scrollbar pb-8">
        {SAMPLE_PROJECTS.map((project) => {
          const Icon = project.icon;
          return (
            <div 
              key={project.id}
              className="flex items-center gap-4 p-4 rounded-xl bg-card border border-card-border hover:bg-secondary/50 cursor-pointer transition-colors"
              data-testid={`card-project-${project.id}`}
            >
              <div className={`w-10 h-10 rounded-lg bg-secondary flex items-center justify-center ${project.color}`}>
                <Icon size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-foreground truncate">{project.name}</h3>
                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                  <span>{project.time}</span>
                  <span>•</span>
                  <span className="px-1.5 py-0.5 rounded-md bg-secondary text-secondary-foreground">{project.type}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}
