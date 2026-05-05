import React, { useState } from "react";
import { WorkspaceLayout } from "@/components/layout/WorkspaceLayout";
import { MOCK_PROJECTS } from "@/lib/mock-data";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Send, Terminal, LayoutTemplate, Database, Globe, Smartphone, Gamepad2, Blocks, Github } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { useLocation } from "wouter";

const CATEGORIES = ["All", "Design", "Slides", "Animation", "Data", "Web App", "Mobile", "Game", "API"];

function getCategoryIcon(type: string) {
  switch (type) {
    case "Web App": return <Globe className="h-4 w-4" />;
    case "Mobile": return <Smartphone className="h-4 w-4" />;
    case "Game": return <Gamepad2 className="h-4 w-4" />;
    case "API": return <Blocks className="h-4 w-4" />;
    case "Data": return <Database className="h-4 w-4" />;
    case "Design": return <LayoutTemplate className="h-4 w-4" />;
    default: return <Terminal className="h-4 w-4" />;
  }
}

export default function Home() {
  const [, setLocation] = useLocation();
  const [activeCategory, setActiveCategory] = useState("All");
  const [idea, setIdea] = useState("");
  const [isPlanMode, setIsPlanMode] = useState(false);
  const [isGithubModalOpen, setIsGithubModalOpen] = useState(false);
  const [githubUrl, setGithubUrl] = useState("");

  const filteredProjects = MOCK_PROJECTS.filter(p => activeCategory === "All" || p.type === activeCategory).slice(0, 4);

  const handleSend = () => {
    if (!idea.trim()) return;
    setLocation("/editor");
  };

  const handleImportGithub = () => {
    if (!githubUrl.trim()) return;
    setIsGithubModalOpen(false);
    setLocation("/editor");
  };

  return (
    <WorkspaceLayout>
      <div className="max-w-4xl mx-auto px-4 py-8 md:py-12 space-y-12">
        <section className="space-y-6 text-center max-w-2xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground" data-testid="heading-hero">
            Hi N, what do you want to make?
          </h1>
          
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/50 to-primary rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-500"></div>
            <div className="relative flex flex-col bg-card border border-border rounded-2xl p-2 shadow-xl">
              <textarea 
                value={idea}
                onChange={(e) => setIdea(e.target.value)}
                placeholder="Describe your idea..." 
                className="w-full bg-transparent border-none focus:ring-0 resize-none h-24 p-3 text-lg placeholder:text-muted-foreground/60"
                data-testid="input-idea"
              />
              <div className="flex items-center justify-between p-2 border-t border-border/50 mt-2">
                <div className="flex items-center space-x-3 bg-muted/30 py-1.5 px-3 rounded-lg border border-border/50">
                  <Switch 
                    id="plan-mode" 
                    checked={isPlanMode} 
                    onCheckedChange={setIsPlanMode}
                    data-testid="toggle-plan"
                  />
                  <Label htmlFor="plan-mode" className="text-sm font-medium cursor-pointer">Plan</Label>
                </div>
                <Button 
                  size="icon" 
                  className="rounded-xl h-10 w-10 shrink-0" 
                  onClick={handleSend}
                  data-testid="button-send-idea"
                >
                  <Send className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>

          <div className="flex justify-center">
            <Dialog open={isGithubModalOpen} onOpenChange={setIsGithubModalOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="rounded-full shadow-sm" data-testid="button-import-github">
                  <Github className="mr-2 h-4 w-4" />
                  Import from GitHub
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Import from GitHub</DialogTitle>
                </DialogHeader>
                <div className="py-4">
                  <Input 
                    placeholder="https://github.com/username/repo" 
                    value={githubUrl}
                    onChange={(e) => setGithubUrl(e.target.value)}
                    data-testid="input-github-url"
                  />
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsGithubModalOpen(false)}>Cancel</Button>
                  <Button onClick={handleImportGithub} data-testid="button-confirm-import">Import</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </section>

        <section className="space-y-6">
          <div className="flex overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0 gap-2 snap-x">
            {CATEGORIES.map(category => (
              <button
                key={category}
                onClick={() => setActiveCategory(category)}
                className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium transition-all snap-start ${
                  activeCategory === category 
                    ? "bg-primary text-primary-foreground shadow-md shadow-primary/20" 
                    : "bg-card/80 text-muted-foreground hover:bg-accent hover:text-foreground border border-border"
                }`}
                data-testid={`tab-category-${category.toLowerCase().replace(" ", "-")}`}
              >
                {category}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {filteredProjects.map((project) => (
              <Card 
                key={project.id} 
                className="group overflow-hidden bg-card/40 hover:bg-card/80 border-border/50 hover:border-primary/30 transition-all cursor-pointer"
                onClick={() => setLocation("/editor")}
                data-testid={`card-project-${project.id}`}
              >
                <CardContent className="p-5 flex items-start gap-4">
                  <div className="h-12 w-12 rounded-xl bg-accent flex items-center justify-center text-primary group-hover:scale-110 group-hover:bg-primary/20 transition-all shrink-0">
                    {getCategoryIcon(project.type)}
                  </div>
                  <div className="space-y-1 flex-1 min-w-0">
                    <h3 className="font-semibold text-base truncate group-hover:text-primary transition-colors">{project.name}</h3>
                    <div className="flex items-center text-xs text-muted-foreground gap-2">
                      <span className="truncate">{project.language}</span>
                      <span>•</span>
                      <span className="truncate">{project.lastModified}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {filteredProjects.length === 0 && (
              <div className="col-span-1 sm:col-span-2 text-center py-12 text-muted-foreground">
                No projects found in this category.
              </div>
            )}
          </div>
        </section>
      </div>
    </WorkspaceLayout>
  );
}
