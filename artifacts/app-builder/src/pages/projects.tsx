import { useState } from "react";
import { useLocation } from "wouter";
import { motion as m } from "framer-motion";
import { Search, MonitorSmartphone, Layers, BarChart3, Presentation, Wand2, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";

const SAMPLE_PROJECTS = [
  { id: 1, name: "Portfolio Website", type: "Web App", time: "2 hours ago", icon: MonitorSmartphone, color: "text-blue-400", bg: "bg-blue-500/15" },
  { id: 2, name: "Data Dashboard", type: "React", time: "5 hours ago", icon: BarChart3, color: "text-green-400", bg: "bg-green-500/15" },
  { id: 3, name: "API Server", type: "Python", time: "1 day ago", icon: Layers, color: "text-yellow-400", bg: "bg-yellow-500/15" },
  { id: 4, name: "Pitch Deck", type: "Slides", time: "2 days ago", icon: Presentation, color: "text-purple-400", bg: "bg-purple-500/15" },
  { id: 5, name: "Logo Generator", type: "AI App", time: "3 days ago", icon: Wand2, color: "text-pink-400", bg: "bg-pink-500/15" },
];

export default function Projects() {
  const [search, setSearch] = useState("");
  const [, setLocation] = useLocation();

  const filtered = SAMPLE_PROJECTS.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.type.toLowerCase().includes(search.toLowerCase())
  );

  const handleOpenProject = (project: typeof SAMPLE_PROJECTS[0]) => {
    sessionStorage.setItem("chat_prompt", `Open project: ${project.name}`);
    setLocation("/chat");
  };

  return (
    <m.div
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
          className="pl-10 bg-secondary/50 border-border focus-visible:ring-primary rounded-xl h-11"
          data-testid="input-search-projects"
        />
      </div>

      <div className="flex flex-col gap-3 overflow-y-auto no-scrollbar pb-8">
        {filtered.map((project, i) => {
          const Icon = project.icon;
          return (
            <m.button
              key={project.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => handleOpenProject(project)}
              className="flex items-center gap-4 p-4 rounded-xl bg-card border border-card-border hover:bg-secondary/50 active:scale-[0.98] cursor-pointer transition-all text-left w-full"
              data-testid={`card-project-${project.id}`}
            >
              <div className={`w-11 h-11 rounded-xl ${project.bg} flex items-center justify-center shrink-0`}>
                <Icon size={22} className={project.color} />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-foreground truncate">{project.name}</h3>
                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                  <span>{project.time}</span>
                  <span>•</span>
                  <span className="px-1.5 py-0.5 rounded-md bg-secondary text-secondary-foreground font-medium">
                    {project.type}
                  </span>
                </div>
              </div>
              <ChevronRight size={16} className="text-muted-foreground shrink-0" />
            </m.button>
          );
        })}

        {filtered.length === 0 && (
          <div className="text-center text-muted-foreground py-16">
            <Search size={40} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm">No projects found</p>
          </div>
        )}
      </div>
    </m.div>
  );
}
