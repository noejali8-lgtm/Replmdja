import { Link, useLocation } from "wouter";
import { FolderOpen, Plus, User } from "lucide-react";
import { cn } from "@/lib/utils";

export function BottomNav() {
  const [location] = useLocation();

  const tabs = [
    { id: "account", path: "/account", icon: User, label: "Account" },
    { id: "create", path: "/", icon: Plus, label: "Create" },
    { id: "projects", path: "/projects", icon: FolderOpen, label: "Projects" },
  ];

  return (
    <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-50">
      <nav className="flex justify-around items-center h-16 pb-safe">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = location === tab.path;
          const isCreate = tab.id === "create";

          return (
            <Link key={tab.id} href={tab.path} className="flex-1 h-full">
              <div
                data-testid={`nav-tab-${tab.id}`}
                className={cn(
                  "flex flex-col items-center justify-center w-full h-full gap-1 transition-colors cursor-pointer",
                  isActive && !isCreate ? "text-foreground" : !isCreate ? "text-muted-foreground hover:text-foreground/80" : ""
                )}
              >
                {isCreate ? (
                  <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center transition-all",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-md scale-105"
                      : "bg-secondary border border-border text-muted-foreground hover:bg-secondary/80"
                  )}>
                    <Icon size={22} />
                  </div>
                ) : (
                  <>
                    <Icon size={24} strokeWidth={isActive ? 2.5 : 1.5} />
                    <span className={cn(
                      "text-[10px] font-medium",
                      isActive ? "text-foreground" : "text-muted-foreground"
                    )}>{tab.label}</span>
                  </>
                )}
              </div>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
