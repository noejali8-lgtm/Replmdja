import { Link, useLocation } from "wouter";
import { FolderOpen, Plus, User } from "lucide-react";
import { cn } from "@/lib/utils";

export function BottomNav() {
  const [location] = useLocation();

  const tabs = [
    { id: "create", path: "/", icon: Plus, label: "Create" },
    { id: "projects", path: "/projects", icon: FolderOpen, label: "Projects" },
    { id: "account", path: "/account", icon: User, label: "Account" },
  ];

  return (
    <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-50">
      <nav className="flex justify-around items-center h-16 pb-safe">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = location === tab.path;

          return (
            <Link key={tab.id} href={tab.path} className="w-full flex-1 h-full">
              <div
                data-testid={`nav-tab-${tab.id}`}
                className={cn(
                  "flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors cursor-pointer",
                  isActive ? "text-foreground" : "text-muted-foreground hover:text-foreground/80"
                )}
              >
                <Icon size={24} className={cn(isActive && tab.id === "create" && "rounded-full bg-primary text-primary-foreground p-1")} />
              </div>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
