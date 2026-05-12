import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { WorkspaceLayout } from "@/components/layout/WorkspaceLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Plus, Search, Globe, Smartphone, Gamepad2, Blocks, Database,
  LayoutTemplate, Terminal, Circle, Trash2, RefreshCw, AlertCircle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const API = "/api/projects";

const FILTER_TABS = ["All", "Web App", "Mobile", "Game", "API", "Data", "node", "python", "react", "flask"];

interface Project {
  id: number;
  name: string;
  slug: string;
  language: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  running?: boolean;
  port?: number | null;
}

function ProjectTypeIcon({ lang }: { lang: string }) {
  const cls = "h-5 w-5";
  switch (lang) {
    case "react": return <Globe className={cls} />;
    case "python": case "flask": return <Terminal className={cls} />;
    case "node": return <Blocks className={cls} />;
    default: return <Database className={cls} />;
  }
}

function langColor(lang: string): string {
  const map: Record<string, string> = {
    react:    "bg-blue-500/20 text-blue-400 border-blue-500/30",
    node:     "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    python:   "bg-green-500/20 text-green-400 border-green-500/30",
    flask:    "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    html:     "bg-orange-500/20 text-orange-400 border-orange-500/30",
  };
  return map[lang] ?? "bg-muted/50 text-muted-foreground border-border";
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function Projects() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const [projects, setProjects]       = useState<Project[]>([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState("");
  const [filter, setFilter]           = useState("All");
  const [search, setSearch]           = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isDeleting, setIsDeleting]   = useState<number | null>(null);
  const [creating, setCreating]       = useState(false);

  const [newName, setNewName]     = useState("");
  const [newLang, setNewLang]     = useState("react");
  const [newDesc, setNewDesc]     = useState("");

  async function fetchProjects() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(API, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load");
      setProjects(await res.json());
    } catch {
      setError("Could not load projects");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchProjects(); }, []);

  const filtered = projects.filter(p => {
    const matchFilter = filter === "All" || p.language === filter.toLowerCase() || p.language === filter;
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.language.toLowerCase().includes(search.toLowerCase()) ||
      (p.description ?? "").toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  async function handleCreate() {
    if (!newName.trim()) return;
    setCreating(true);
    try {
      const res = await fetch(API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name: newName.trim(), language: newLang, description: newDesc }),
      });
      if (!res.ok) throw new Error("Failed to create");
      const project: Project = await res.json();
      setIsCreateOpen(false);
      setNewName(""); setNewDesc("");
      toast({ title: "Project created!", description: project.name });
      setLocation(`/editor?id=${project.id}&project=${encodeURIComponent(project.name)}`);
    } catch {
      toast({ title: "Error", description: "Failed to create project", variant: "destructive" });
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(id: number, e: React.MouseEvent) {
    e.stopPropagation();
    setIsDeleting(id);
    try {
      await fetch(`${API}/${id}`, { method: "DELETE", credentials: "include" });
      setProjects(ps => ps.filter(p => p.id !== id));
      toast({ title: "Project deleted" });
    } catch {
      toast({ title: "Error", description: "Failed to delete", variant: "destructive" });
    } finally {
      setIsDeleting(null);
    }
  }

  return (
    <WorkspaceLayout>
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold" data-testid="heading-projects">My Projects</h1>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={fetchProjects} title="Refresh">
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button onClick={() => setIsCreateOpen(true)} className="gap-2" data-testid="button-create-project">
              <Plus className="h-4 w-4" /> New Project
            </Button>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search projects..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9"
            data-testid="input-search"
          />
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 flex-wrap">
          {FILTER_TABS.map(tab => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                filter === tab
                  ? "bg-primary text-primary-foreground shadow"
                  : "bg-card text-muted-foreground hover:bg-accent hover:text-foreground border border-border"
              }`}
              data-testid={`filter-${tab.toLowerCase().replace(/\s+/g, "-")}`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span className="text-sm">{error}</span>
            <Button size="sm" variant="ghost" onClick={fetchProjects} className="ml-auto h-7">Retry</Button>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-32 rounded-xl bg-card/40 border border-border/50 animate-pulse" />
            ))}
          </div>
        )}

        {/* Project grid */}
        {!loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(project => (
              <Card
                key={project.id}
                className="group cursor-pointer bg-card/40 hover:bg-card border-border/50 hover:border-primary/30 transition-all"
                onClick={() => setLocation(`/editor?id=${project.id}&project=${encodeURIComponent(project.name)}`)}
                data-testid={`card-project-${project.id}`}
              >
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="h-10 w-10 rounded-lg bg-accent/50 flex items-center justify-center text-primary group-hover:scale-105 transition-transform">
                      <ProjectTypeIcon lang={project.language} />
                    </div>
                    <div className="flex items-center gap-2">
                      {project.running && (
                        <div className="flex items-center gap-1">
                          <Circle className="h-2 w-2 text-green-400 fill-green-400" />
                          <span className="text-xs text-green-400">running</span>
                        </div>
                      )}
                      <button
                        onClick={e => handleDelete(project.id, e)}
                        className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-500/20 text-muted-foreground hover:text-red-400 transition-all"
                        title="Delete project"
                      >
                        {isDeleting === project.id
                          ? <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                          : <Trash2 className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                  </div>
                  <h3 className="font-semibold mb-1 group-hover:text-primary transition-colors truncate">{project.name}</h3>
                  {project.description && (
                    <p className="text-xs text-muted-foreground mb-2 line-clamp-1">{project.description}</p>
                  )}
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className={`text-xs ${langColor(project.language)}`}>
                      {project.language}
                    </Badge>
                    <span className="text-xs text-muted-foreground">{timeAgo(project.updatedAt ?? project.createdAt)}</span>
                  </div>
                </CardContent>
              </Card>
            ))}

            {filtered.length === 0 && !loading && (
              <div className="col-span-3 text-center py-20 text-muted-foreground">
                <Terminal className="h-12 w-12 mx-auto mb-4 opacity-20" />
                <p className="text-base font-medium mb-1">No projects found</p>
                <p className="text-sm opacity-60 mb-4">
                  {projects.length === 0 ? "Create your first project to get started" : "Try a different search or filter"}
                </p>
                {projects.length === 0 && (
                  <Button onClick={() => setIsCreateOpen(true)} className="gap-2">
                    <Plus className="h-4 w-4" /> Create First Project
                  </Button>
                )}
              </div>
            )}
          </div>
        )}
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
                placeholder="my-awesome-project"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleCreate()}
                autoFocus
                data-testid="input-project-name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="project-lang">Language / Framework</Label>
              <Select value={newLang} onValueChange={setNewLang}>
                <SelectTrigger id="project-lang" data-testid="select-project-language">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="react">⚛️  React + Vite</SelectItem>
                  <SelectItem value="node">🟩  Node.js</SelectItem>
                  <SelectItem value="python">🐍  Python</SelectItem>
                  <SelectItem value="flask">🌶️  Flask</SelectItem>
                  <SelectItem value="html">🌐  HTML / CSS / JS</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="project-desc">Description <span className="text-muted-foreground text-xs">(optional)</span></Label>
              <Input
                id="project-desc"
                placeholder="What does this project do?"
                value={newDesc}
                onChange={e => setNewDesc(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={!newName.trim() || creating} data-testid="button-confirm-create">
              {creating ? <><RefreshCw className="h-4 w-4 animate-spin mr-2" />Creating...</> : "Create Project"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </WorkspaceLayout>
  );
}
