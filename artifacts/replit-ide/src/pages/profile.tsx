import { useLocation } from "wouter";
import { WorkspaceLayout } from "@/components/layout/WorkspaceLayout";
import { MOCK_PROJECTS, MOCK_USER } from "@/lib/mock-data";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Star, Users, UserPlus, FolderOpen, Globe, Smartphone, Gamepad2, Blocks, Database, LayoutTemplate, Terminal, Award, Zap, Code2, Trophy } from "lucide-react";

function ProjectTypeIcon({ type }: { type: string }) {
  const cls = "h-4 w-4";
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

const ACHIEVEMENTS = [
  { icon: <Code2 className="h-5 w-5" />, label: "First Project", color: "text-blue-400", bg: "bg-blue-400/10" },
  { icon: <Zap className="h-5 w-5" />, label: "Speed Builder", color: "text-yellow-400", bg: "bg-yellow-400/10" },
  { icon: <Star className="h-5 w-5" />, label: "Rising Star", color: "text-orange-400", bg: "bg-orange-400/10" },
  { icon: <Trophy className="h-5 w-5" />, label: "Power User", color: "text-purple-400", bg: "bg-purple-400/10" },
  { icon: <Award className="h-5 w-5" />, label: "Open Source", color: "text-green-400", bg: "bg-green-400/10" },
];

export default function Profile() {
  const [, setLocation] = useLocation();
  const user = MOCK_USER;

  return (
    <WorkspaceLayout>
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        {/* Profile header */}
        <Card className="bg-card/40 border-border/50">
          <CardContent className="pt-8 pb-6">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
              <Avatar className="h-20 w-20 border-2 border-primary/30" data-testid="avatar-profile">
                <AvatarFallback className="bg-primary/20 text-primary text-2xl font-bold">
                  {user.avatar}
                </AvatarFallback>
              </Avatar>
              <div className="text-center sm:text-left flex-1">
                <h1 className="text-2xl font-bold" data-testid="text-profile-name">{user.name}</h1>
                <p className="text-muted-foreground text-sm mb-2" data-testid="text-username">{user.username}</p>
                <p className="text-sm text-foreground/80 max-w-md">{user.bio}</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4"
                  data-testid="button-edit-profile"
                >
                  Edit Profile
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Projects", value: user.stats.projects, icon: <FolderOpen className="h-4 w-4" /> },
            { label: "Followers", value: user.stats.followers.toLocaleString(), icon: <Users className="h-4 w-4" /> },
            { label: "Following", value: user.stats.following, icon: <UserPlus className="h-4 w-4" /> },
            { label: "Stars", value: user.stats.stars, icon: <Star className="h-4 w-4" /> },
          ].map((stat) => (
            <Card key={stat.label} className="bg-card/40 border-border/50" data-testid={`stat-${stat.label.toLowerCase()}`}>
              <CardContent className="pt-4 pb-4 text-center">
                <div className="flex items-center justify-center gap-1.5 text-muted-foreground mb-1">
                  {stat.icon}
                  <span className="text-xs">{stat.label}</span>
                </div>
                <p className="text-2xl font-bold text-foreground">{stat.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Achievements */}
        <Card className="bg-card/40 border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Trophy className="h-4 w-4 text-yellow-400" />
              Achievements
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              {ACHIEVEMENTS.map((a) => (
                <div
                  key={a.label}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg border border-border/50 ${a.bg}`}
                  data-testid={`achievement-${a.label.toLowerCase().replace(" ", "-")}`}
                >
                  <span className={a.color}>{a.icon}</span>
                  <span className="text-xs font-medium text-foreground">{a.label}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent projects */}
        <Card className="bg-card/40 border-border/50">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <CardTitle className="text-base">Recent Projects</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              className="text-primary hover:text-primary/80 h-7 text-xs"
              onClick={() => setLocation("/projects")}
              data-testid="button-view-all-projects"
            >
              View all
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {MOCK_PROJECTS.slice(0, 4).map((project) => (
              <div
                key={project.id}
                className="flex items-center justify-between py-2 border-b border-border/30 last:border-0 cursor-pointer hover:text-primary transition-colors group"
                onClick={() => setLocation("/editor")}
                data-testid={`project-row-${project.id}`}
              >
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-accent/50 flex items-center justify-center text-primary/70 group-hover:text-primary transition-colors">
                    <ProjectTypeIcon type={project.type} />
                  </div>
                  <div>
                    <p className="text-sm font-medium group-hover:text-primary transition-colors">{project.name}</p>
                    <p className="text-xs text-muted-foreground">{project.lastModified}</p>
                  </div>
                </div>
                <Badge variant="outline" className="text-xs border-border/50">
                  {project.language}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </WorkspaceLayout>
  );
}
