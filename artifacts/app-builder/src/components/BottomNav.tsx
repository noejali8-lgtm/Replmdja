import { Link, useLocation } from "wouter";
import { FolderOpen, Plus, User, BookOpen, Compass } from "lucide-react";
import { cn } from "@/lib/utils";

export function BottomNav() {
  const [location] = useLocation();

  const tabs = [
    { id: "account", path: "/account", icon: User, label: "Account" },
    { id: "explore", path: "/explore", icon: Compass, label: "Explore" },
    { id: "create", path: "/", icon: Plus, label: "Create" },
    { id: "templates", path: "/templates", icon: BookOpen, label: "Templates" },
    { id: "projects", path: "/projects", icon: FolderOpen, label: "Projects" },
  ];

  return (
    <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] bg-[#141414] border-t border-white/[0.08] z-50">
      <nav className="flex justify-around items-center h-[62px] pb-safe">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = tab.id === "create"
            ? location === "/"
            : location === tab.path || location.startsWith(tab.path + "/");
          const isCreate = tab.id === "create";

          return (
            <Link key={tab.id} href={tab.path} className="flex-1 h-full">
              <div
                data-testid={`nav-tab-${tab.id}`}
                className="flex flex-col items-center justify-center w-full h-full gap-1 cursor-pointer relative"
              >
                {isActive && !isCreate && (
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-[2px] bg-white rounded-full" />
                )}

                {isCreate ? (
                  <>
                    <div className={cn(
                      "w-[34px] h-[34px] rounded-[10px] flex items-center justify-center transition-all",
                      isActive
                        ? "bg-white text-black"
                        : "bg-white/10 text-white/70"
                    )}>
                      <Icon size={18} strokeWidth={2} />
                    </div>
                    <span className={cn(
                      "text-[9px] font-medium",
                      isActive ? "text-white" : "text-white/50"
                    )}>{tab.label}</span>
                  </>
                ) : (
                  <>
                    <Icon
                      size={20}
                      strokeWidth={isActive ? 2 : 1.5}
                      className={isActive ? "text-white" : "text-white/40"}
                    />
                    <span className={cn(
                      "text-[9px] font-medium",
                      isActive ? "text-white" : "text-white/40"
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
