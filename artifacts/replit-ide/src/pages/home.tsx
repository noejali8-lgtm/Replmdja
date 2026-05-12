import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { WorkspaceLayout } from "@/components/layout/WorkspaceLayout";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Send, Globe, Smartphone, Gamepad2, Blocks, Database,
  LayoutTemplate, Terminal, Github, Sparkles, Play, Circle,
  ArrowRight, Plus, Clock, Zap, RefreshCw
} from "lucide-react";

const API = "/api/projects";

interface Project {
  id: number;
  name: string;
  language: string;
  updatedAt: string;
  createdAt: string;
  running?: boolean;
}

const TEMPLATES = [
  { name: "React App",     lang: "react",  icon: <Globe className="h-5 w-5" />,        color: "from-blue-500/20 to-blue-600/10",    border: "border-blue-500/20",    badge: "Popular" },
  { name: "Python Script", lang: "python", icon: <Terminal className="h-5 w-5" />,      color: "from-green-500/20 to-green-600/10",  border: "border-green-500/20",   badge: "" },
  { name: "Node.js API",   lang: "node",   icon: <Blocks className="h-5 w-5" />,        color: "from-emerald-500/20 to-emerald-600/10", border: "border-emerald-500/20", badge: "" },
  { name: "Flask App",     lang: "flask",  icon: <Smartphone className="h-5 w-5" />,    color: "from-yellow-500/20 to-yellow-600/10", border: "border-yellow-500/20",  badge: "" },
  { name: "HTML Page",     lang: "html",   icon: <Gamepad2 className="h-5 w-5" />,      color: "from-orange-500/20 to-orange-600/10", border: "border-orange-500/20",  badge: "" },
  { name: "Data Science",  lang: "python", icon: <Database className="h-5 w-5" />,      color: "from-cyan-500/20 to-cyan-600/10",    border: "border-cyan-500/20",    badge: "" },
];

function langIcon(lang: string) {
  switch (lang) {
    case "react": return <Globe className="h-4 w-4" />;
    case "python": case "flask": return <Terminal className="h-4 w-4" />;
    case "node": return <Blocks className="h-4 w-4" />;
    default: return <Database className="h-4 w-4" />;
  }
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

export default function Home() {
  const [, setLocation] = useLocation();
  const [idea, setIdea]                 = useState("");
  const [isPlanMode, setIsPlanMode]     = useState(false);
  const [isGithubOpen, setIsGithubOpen] = useState(false);
  const [isNewOpen, setIsNewOpen]       = useState(false);
  const [githubUrl, setGithubUrl]       = useState("");
  const [newName, setNewName]           = useState("");
  const [newLang, setNewLang]           = useState("react");
  const [creating, setCreating]         = useState(false);

  const [projects, setProjects]   = useState<Project[]>([]);
  const [loadingProj, setLoadingProj] = useState(true);

  useEffect(() => {
    fetch(API, { credentials: "include" })
      .then(r => r.ok ? r.json() : [])
      .then(setProjects)
      .catch(() => {})
      .finally(() => setLoadingProj(false));
  }, []);

  const handleSend = async () => {
    if (!idea.trim()) return;
    // Create project from idea, navigate to editor
    const name = idea.trim().slice(0, 40).replace(/[^a-zA-Z0-9 ]/g, "") || "my-project";
    setCreating(true);
    try {
      const res = await fetch(API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name, language: "react", description: idea.trim() }),
      });
      if (res.ok) {
        const project: Project = await res.json();
        setLocation(`/editor?id=${project.id}&project=${encodeURIComponent(project.name)}&idea=${encodeURIComponent(idea.trim())}&plan=${isPlanMode ? "1" : "0"}`);
      } else {
        setLocation("/editor");
      }
    } catch {
      setLocation("/editor");
    } finally {
      setCreating(false);
    }
  };

  const handleTemplate = async (t: typeof TEMPLATES[0]) => {
    setCreating(true);
    try {
      const res = await fetch(API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name: t.name.toLowerCase().replace(/\s+/g, "-"), language: t.lang }),
      });
      if (res.ok) {
        const project: Project = await res.json();
        setLocation(`/editor?id=${project.id}&project=${encodeURIComponent(project.name)}`);
      }
    } catch { /**/ } finally { setCreating(false); }
  };

  const handleImport = () => {
    if (!githubUrl.trim()) return;
    setIsGithubOpen(false);
    setLocation("/editor");
  };

  const handleCreate = async () => {
    if (!newName.trim()) return;
    setCreating(true);
    try {
      const res = await fetch(API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name: newName.trim(), language: newLang }),
      });
      if (res.ok) {
        const project: Project = await res.json();
        setIsNewOpen(false);
        setNewName("");
        setLocation(`/editor?id=${project.id}&project=${encodeURIComponent(project.name)}`);
      }
    } catch { /**/ } finally { setCreating(false); }
  };

  const recent = [...projects].sort((a, b) => new Date(b.updatedAt ?? b.createdAt).getTime() - new Date(a.updatedAt ?? a.createdAt).getTime()).slice(0, 6);

  return (
    <WorkspaceLayout>
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-10 pb-24">

        {/* ── Hero ── */}
        <section className="text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#1f6feb]/10 border border-[#1f6feb]/20 text-[#58a6ff] text-xs mb-2">
            <Sparkles className="h-3.5 w-3.5" />
            <span>AI-powered development</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight" data-testid="heading-hero">
            What do you want to<br />
            <span className="bg-gradient-to-r from-[#58a6ff] to-[#a371f7] bg-clip-text text-transparent">
              build today?
            </span>
          </h1>

          {/* Idea input */}
          <div className="relative max-w-2xl mx-auto">
            <div className="absolute -inset-px rounded-2xl bg-gradient-to-r from-[#1f6feb]/30 to-[#a371f7]/30 blur" />
            <div className="relative flex flex-col bg-[#161b22] border border-[#30363d] rounded-2xl overflow-hidden shadow-xl shadow-black/30">
              <textarea
                value={idea}
                onChange={e => setIdea(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                placeholder="Describe your idea, Replit will bring it to life..."
                rows={3}
                className="w-full bg-transparent px-4 pt-4 pb-2 text-sm text-[#e6edf3] placeholder-[#484f58] outline-none resize-none"
                data-testid="input-idea"
              />
              <div className="flex items-center justify-between px-3 py-2 border-t border-[#21262d]">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setIsGithubOpen(true)}
                    className="flex items-center gap-1.5 text-xs text-[#8b949e] hover:text-[#e6edf3] px-2 py-1 rounded hover:bg-[#21262d] transition-colors"
                    data-testid="button-add-files">
                    <Plus className="h-3.5 w-3.5" /> Add files
                  </button>
                  <button
                    onClick={() => setIsPlanMode(!isPlanMode)}
                    className={`flex items-center gap-1.5 text-xs px-2 py-1 rounded transition-colors ${isPlanMode ? "bg-[#a371f7]/20 text-[#a371f7] border border-[#a371f7]/30" : "text-[#8b949e] hover:text-[#e6edf3] hover:bg-[#21262d]"}`}
                    data-testid="toggle-plan">
                    <div className={`h-3.5 w-6 rounded-full border transition-colors ${isPlanMode ? "bg-[#a371f7] border-[#a371f7]" : "bg-transparent border-[#484f58]"} relative`}>
                      <div className={`absolute top-0.5 h-2 w-2 rounded-full bg-white transition-all ${isPlanMode ? "left-[14px]" : "left-[1px]"}`} />
                    </div>
                    Plan
                  </button>
                </div>
                <button
                  onClick={handleSend}
                  disabled={!idea.trim() || creating}
                  className="h-8 w-8 rounded-xl bg-[#a371f7] hover:bg-[#8957e5] disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
                  data-testid="button-send-idea">
                  {creating
                    ? <RefreshCw className="h-4 w-4 text-white animate-spin" />
                    : <Send className="h-4 w-4 text-white" />}
                </button>
              </div>
            </div>
          </div>

          {/* Quick actions */}
          <div className="flex flex-wrap items-center justify-center gap-2">
            <button onClick={() => setIsGithubOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#161b22] border border-[#30363d] text-xs text-[#8b949e] hover:text-[#e6edf3] hover:border-[#58a6ff]/50 transition-all"
              data-testid="button-import-github">
              <Github className="h-3.5 w-3.5" /> Import from GitHub
            </button>
            <button onClick={() => setIsNewOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#161b22] border border-[#30363d] text-xs text-[#8b949e] hover:text-[#e6edf3] hover:border-[#a371f7]/50 transition-all"
              data-testid="button-use-template">
              <Zap className="h-3.5 w-3.5" /> New project
            </button>
          </div>
        </section>

        {/* ── Templates ── */}
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-[#8b949e] uppercase tracking-widest">Start from a template</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {TEMPLATES.map(t => (
              <button key={t.name} onClick={() => handleTemplate(t)} disabled={creating}
                className={`group relative text-left p-4 rounded-xl bg-gradient-to-br ${t.color} border ${t.border} hover:border-[#58a6ff]/40 transition-all disabled:opacity-60`}
                data-testid={`template-${t.name.toLowerCase().replace(/[^a-z]/g, "-")}`}>
                {t.badge && (
                  <span className="absolute top-2 right-2 text-[9px] px-1.5 py-0.5 rounded-full bg-[#a371f7]/20 text-[#a371f7] border border-[#a371f7]/30">{t.badge}</span>
                )}
                <div className="text-[#58a6ff] mb-2">{t.icon}</div>
                <div className="text-xs font-medium text-[#e6edf3] group-hover:text-white">{t.name}</div>
              </button>
            ))}
          </div>
        </section>

        {/* ── Recent projects ── */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-[#8b949e] uppercase tracking-widest flex items-center gap-2">
              <Clock className="h-4 w-4" /> Recent Projects
            </h2>
            <button onClick={() => setLocation("/projects")}
              className="flex items-center gap-1 text-xs text-[#58a6ff] hover:text-[#79c0ff] transition-colors"
              data-testid="link-view-all">
              View all <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>

          {loadingProj ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-16 rounded-xl bg-[#161b22] border border-[#21262d] animate-pulse" />
              ))}
            </div>
          ) : recent.length === 0 ? (
            <div className="py-12 text-center text-[#484f58] text-sm border border-dashed border-[#21262d] rounded-xl">
              <LayoutTemplate className="h-8 w-8 mx-auto mb-2 opacity-40" />
              No projects yet — create one above!
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {recent.map(p => (
                <button key={p.id}
                  onClick={() => setLocation(`/editor?id=${p.id}&project=${encodeURIComponent(p.name)}`)}
                  className="group text-left flex items-center gap-3 p-4 rounded-xl bg-[#161b22] border border-[#21262d] hover:border-[#30363d] hover:bg-[#21262d] transition-all"
                  data-testid={`card-project-${p.id}`}>
                  <div className="h-10 w-10 rounded-lg bg-[#21262d] group-hover:bg-[#30363d] flex items-center justify-center text-[#58a6ff] shrink-0 transition-colors">
                    {langIcon(p.language)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-sm font-medium text-[#e6edf3] truncate group-hover:text-white">{p.name}</span>
                      {p.running && <Circle className="h-2 w-2 text-green-400 fill-green-400 shrink-0" />}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-[#8b949e]">
                      <span className="capitalize">{p.language}</span>
                      <span>·</span>
                      <span>{timeAgo(p.updatedAt ?? p.createdAt)}</span>
                    </div>
                  </div>
                  <Play className="h-4 w-4 text-[#8b949e] group-hover:text-[#58a6ff] opacity-0 group-hover:opacity-100 transition-all shrink-0" />
                </button>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* ── Import from GitHub modal ── */}
      <Dialog open={isGithubOpen} onOpenChange={setIsGithubOpen}>
        <DialogContent className="bg-[#161b22] border-[#30363d] text-[#e6edf3]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Github className="h-5 w-5" /> Import from GitHub
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Label className="text-[#8b949e] text-xs">Repository URL</Label>
            <Input placeholder="https://github.com/username/repo"
              value={githubUrl} onChange={e => setGithubUrl(e.target.value)}
              className="mt-2 bg-[#0d1117] border-[#30363d] text-[#e6edf3] placeholder-[#484f58]"
              data-testid="input-github-url" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsGithubOpen(false)}
              className="border-[#30363d] text-[#8b949e] hover:text-[#e6edf3]">Cancel</Button>
            <Button onClick={handleImport} className="bg-[#238636] hover:bg-[#2ea043] text-white"
              data-testid="button-confirm-import">Import Repository</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── New project modal ── */}
      <Dialog open={isNewOpen} onOpenChange={setIsNewOpen}>
        <DialogContent className="bg-[#161b22] border-[#30363d] text-[#e6edf3]">
          <DialogHeader>
            <DialogTitle>Create New Project</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-[#8b949e] text-xs">Project Name</Label>
              <Input placeholder="my-awesome-project" value={newName}
                onChange={e => setNewName(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleCreate()}
                autoFocus
                className="bg-[#0d1117] border-[#30363d] text-[#e6edf3] placeholder-[#484f58]"
                data-testid="input-project-name" />
            </div>
            <div className="space-y-2">
              <Label className="text-[#8b949e] text-xs">Template</Label>
              <Select value={newLang} onValueChange={setNewLang}>
                <SelectTrigger className="bg-[#0d1117] border-[#30363d] text-[#e6edf3]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#161b22] border-[#30363d]">
                  <SelectItem value="react">⚛️  React + Vite</SelectItem>
                  <SelectItem value="node">🟩  Node.js</SelectItem>
                  <SelectItem value="python">🐍  Python</SelectItem>
                  <SelectItem value="flask">🌶️  Flask</SelectItem>
                  <SelectItem value="html">🌐  HTML / CSS / JS</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsNewOpen(false)}
              className="border-[#30363d] text-[#8b949e] hover:text-[#e6edf3]">Cancel</Button>
            <Button onClick={handleCreate} disabled={!newName.trim() || creating}
              className="bg-[#1f6feb] hover:bg-[#388bfd] text-white"
              data-testid="button-create-project">
              {creating ? <><RefreshCw className="h-4 w-4 animate-spin mr-2" />Creating...</> : "Create Project"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </WorkspaceLayout>
  );
}
