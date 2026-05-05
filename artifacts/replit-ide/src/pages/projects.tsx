import { useState } from "react";
import { useLocation } from "wouter";
import { WorkspaceLayout } from "@/components/layout/WorkspaceLayout";
import { MOCK_PROJECTS, type Project } from "@/lib/mock-data";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, Globe, Smartphone, Gamepad2, Blocks, Database, LayoutTemplate, Terminal, Circle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const FILTER_TABS = ["All", "Web App", "Mobile", "Game", "API", "Data", "Design"];

function ProjectTypeIcon({ type }: { type: string }) {
  const cls = "h-5 w-5";
  switch (type) {
    case "Web App": return <Globe className={cls} />;
    case "Mobile": return <Smartphone className={cls} />;
    case "Game": return <Gamepad2 className={cls} />;
    case "API": return <Blocks className={cls} />;
    case "Data": return <Database className={cls} />;
    case "Design": return <LayoutTemplate className={cls} />;
    default: return <Terminal className={cls} />;
  }
}

function languageColor(lang: string): string {
  const map: Record<string, string> = {
    React: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    JavaScript: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    Python: "bg-green-500/20 text-green-400 border-green-500/30",
    "Node.js": "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    "React Native": "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
  };
  return map[lang] || "bg-muted/50 text-muted-foreground border-border";
}

export default function Projects() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [projects, setProjects] = useState<Project[]>(MOCK_PROJECTS);
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newType, setNewType] = useState("Web App");
  const [newLang, setNewLang] = useState("React");

  const filtered = projects.filter((p) => {
    const matchFilter = filter === "All" || p.type === filter;
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.language.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  const handleCreate = () => {
    if (!newName.trim()) return;
    const newProject: Project = {
      id: String(projects.length + 1),
      name: newName,
      language: newLang,
      type: newType,
      lastModified: "just now",
      status: "stopped",
    };
    setProjects([newProject, ...projects]);
    setIsCreateOpen(false);
    setNewName("");
    toast({ title: "Project created!", description: `${newName} has been created` });
    setLocation("/editor");
  };

  return (
    <WorkspaceLayout>
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold" data-testid="heading-projects">My Projects</h1>
          <Button
            onClick={() => setIsCreateOpen(true)}
            className="gap-2"
            data-testid="button-create-project"
          >
            <Plus className="h-4 w-4" />
            New Project
          </Button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search projects..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
            data-testid="input-search"
          />
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 flex-wrap">
          {FILTER_TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                filter === tab
                  ? "bg-primary text-primary-foreground shadow"
                  : "bg-card text-muted-foreground hover:bg-accent hover:text-foreground border border-border"
              }`}
              data-testid={`filter-${tab.toLowerCase().replace(" ", "-")}`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Project grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((project) => (
            <Card
              key={project.id}
              className="group cursor-pointer bg-card/40 hover:bg-card border-border/50 hover:border-primary/30 transition-all"
              onClick={() => setLocation("/editor")}
              data-testid={`card-project-${project.id}`}
            >
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="h-10 w-10 rounded-lg bg-accent/50 flex items-center justify-center text-primary group-hover:scale-105 transition-transform">
                    <ProjectTypeIcon type={project.type} />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Circle
                      className={`h-2 w-2 ${project.status === "running" ? "text-green-400 fill-green-400" : "text-muted-foreground/40 fill-muted-foreground/40"}`}
                    />
                    <span className="text-xs text-muted-foreground capitalize">{project.status}</span>
                  </div>
                </div>
                <h3 className="font-semibold mb-1 group-hover:text-primary transition-colors">{project.name}</h3>
                <div className="flex items-center justify-between">
                  <Badge
                    variant="outline"
                    className={`text-xs ${languageColor(project.language)}`}
                  >
                    {project.language}
                  </Badge>
                  <span className="text-xs text-muted-foreground">{project.lastModified}</span>
                </div>
              </CardContent>
            </Card>
          ))}
          {filtered.length === 0 && (
            <div className="col-span-3 text-center py-16 text-muted-foreground">
              <Terminal className="h-12 w-12 mx-auto mb-3 opacity-20" />
              <p>No projects found</p>
            </div>
          )}
        </div>
      </div>

      {/* Create project modal */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-md" data-testid="modal-create-project">
          <DialogHeader>
            <DialogTitle>Create New Project</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="project-name">Project Name</Label>
              <Input
                id="project-name"
                placeholder="My awesome project"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                data-testid="input-project-name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="project-type">Project Type</Label>
              <Select value={newType} onValueChange={setNewType}>
                <SelectTrigger id="project-type" data-testid="select-project-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Web App">Web App</SelectItem>
                  <SelectItem value="Mobile">Mobile</SelectItem>
                  <SelectItem value="Game">Game</SelectItem>
                  <SelectItem value="API">API</SelectItem>
                  <SelectItem value="Data">Data</SelectItem>
                  <SelectItem value="Design">Design</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="project-language">Language / Framework</Label>
              <Select value={newLang} onValueChange={setNewLang}>
                <SelectTrigger id="project-language" data-testid="select-project-language">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="React">React</SelectItem>
                  <SelectItem value="JavaScript">JavaScript</SelectItem>
                  <SelectItem value="Python">Python</SelectItem>
                  <SelectItem value="Node.js">Node.js</SelectItem>
                  <SelectItem value="React Native">React Native</SelectItem>
                  <SelectItem value="TypeScript">TypeScript</SelectItem>
                  <SelectItem value="Vue">Vue</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)} data-testid="button-cancel-create">Cancel</Button>
            <Button onClick={handleCreate} data-testid="button-confirm-create">Create Project</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </WorkspaceLayout>
  );
}
