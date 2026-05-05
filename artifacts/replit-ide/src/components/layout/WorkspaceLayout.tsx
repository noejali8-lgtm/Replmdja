import React from "react";
import { Link, useLocation } from "wouter";
import { Plus, Folder, User, Github } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

export function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  return (
    <div className="flex flex-col h-screen bg-background text-foreground dark">
      {/* Top Nav */}
      <header className="h-14 flex items-center justify-between px-4 border-b border-border bg-card/50 backdrop-blur-md z-10 shrink-0">
        <div className="flex items-center gap-4">
          <Link href="/" className="font-semibold text-lg tracking-tight hover:text-primary transition-colors data-testid='link-home'">
            My Workspace
          </Link>
        </div>
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8 cursor-pointer hover:ring-2 hover:ring-primary transition-all data-testid='avatar-user'">
            <AvatarFallback className="bg-primary/20 text-primary text-sm font-medium">
              N
            </AvatarFallback>
          </Avatar>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto overflow-x-hidden relative">
        {children}
      </main>

      {/* Bottom Nav */}
      <nav className="h-16 flex items-center justify-center border-t border-border bg-card/80 backdrop-blur-xl shrink-0 sticky bottom-0">
        <div className="flex items-center gap-8 px-6">
          <Link
            href="/"
            className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${
              location === "/" ? "text-primary" : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
            }`}
            data-testid="nav-new-project"
          >
            <Plus className="h-5 w-5" />
            <span className="text-[10px] font-medium">New</span>
          </Link>
          <Link
            href="/projects"
            className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${
              location === "/projects" ? "text-primary" : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
            }`}
            data-testid="nav-projects"
          >
            <Folder className="h-5 w-5" />
            <span className="text-[10px] font-medium">Projects</span>
          </Link>
          <Link
            href="/profile"
            className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${
              location === "/profile" ? "text-primary" : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
            }`}
            data-testid="nav-profile"
          >
            <User className="h-5 w-5" />
            <span className="text-[10px] font-medium">Profile</span>
          </Link>
        </div>
      </nav>
    </div>
  );
}
