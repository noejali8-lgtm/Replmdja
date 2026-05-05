import React from "react";
import { Link, useLocation } from "wouter";
import { Plus, Folder, User, Package } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  const navItems = [
    { href: "/", icon: <Plus className="h-5 w-5" />, label: "New", testId: "nav-new-project" },
    { href: "/projects", icon: <Folder className="h-5 w-5" />, label: "Projects", testId: "nav-projects" },
    { href: "/extensions", icon: <Package className="h-5 w-5" />, label: "Extensions", testId: "nav-extensions" },
    { href: "/profile", icon: <User className="h-5 w-5" />, label: "Profile", testId: "nav-profile" },
  ];

  return (
    <div className="flex flex-col h-screen bg-background text-foreground dark">
      {/* Top Nav */}
      <header className="h-14 flex items-center justify-between px-4 border-b border-border bg-card/50 backdrop-blur-md z-10 shrink-0">
        <div className="flex items-center gap-4">
          <Link href="/" className="font-semibold text-lg tracking-tight hover:text-primary transition-colors" data-testid="link-home">
            My Workspace
          </Link>
        </div>
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8 cursor-pointer hover:ring-2 hover:ring-primary transition-all" data-testid="avatar-user">
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
        <div className="flex items-center gap-6 px-6">
          {navItems.map(item => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${
                location === item.href ? "text-primary" : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
              }`}
              data-testid={item.testId}
            >
              {item.icon}
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}
