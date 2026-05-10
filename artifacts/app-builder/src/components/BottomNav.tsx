import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { FolderOpen, Plus, User, BookOpen, Compass, Grip } from "lucide-react";
import { cn } from "@/lib/utils";

export function BottomNav() {
  const [location] = useLocation();
  const [online, setOnline] = useState(navigator.onLine);

  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => { window.removeEventListener("online", on); window.removeEventListener("offline", off); };
  }, []);

  const tabs = [
    { id: "account", path: "/account", icon: User, label: "Account" },
    { id: "explore", path: "/explore", icon: Compass, label: "Explore" },
    { id: "create", path: "/", icon: Plus, label: "Create" },
    { id: "templates", path: "/templates", icon: BookOpen, label: "Templates" },
    { id: "projects", path: "/projects", icon: FolderOpen, label: "Projects" },
    { id: "openclaw", path: "/openclaw", icon: Grip, label: "OpenClaw" },
  ];

  const isExploreActive = location === "/explore"
    || location === "/workspace-guide"
    || location === "/replit-agent"
    || location === "/advanced-features"
    || location === "/pro-features";

  return (
    <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] z-50">
      {/* Offline banner */}
      {!online && (
        <div className="bg-yellow-500/90 backdrop-blur-sm px-4 py-1.5 flex items-center justify-center gap-2 border-t border-yellow-400/50">
          <div className="w-1.5 h-1.5 rounded-full bg-yellow-900 animate-pulse" />
          <span className="text-[11px] font-semibold text-yellow-900">وضع Offline — التعديلات تُحفظ محلياً</span>
        </div>
      )}
      <div className="bg-[#141414] border-t border-white/[0.08]">
        <nav className="flex justify-around items-center h-[62px] pb-safe">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = tab.id === "create"
              ? location === "/"
              : tab.id === "explore"
              ? isExploreActive
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
                        isActive ? "bg-white text-black" : "bg-white/10 text-white/70"
                      )}>
                        <Icon size={18} strokeWidth={2} />
                      </div>
                      <span className={cn("text-[9px] font-medium", isActive ? "text-white" : "text-white/50")}>{tab.label}</span>
                    </>
                  ) : (
                    <>
                      <div className="relative">
                        <Icon size={20} strokeWidth={isActive ? 2 : 1.5} className={isActive ? "text-white" : "text-white/40"} />
                        {tab.id === "explore" && (
                          <div className={cn("absolute -top-0.5 -right-1 w-1.5 h-1.5 rounded-full border border-[#141414]", online ? "bg-green-400" : "bg-yellow-400")} />
                        )}
                      </div>
                      <span className={cn("text-[9px] font-medium", isActive ? "text-white" : "text-white/40")}>{tab.label}</span>
                    </>
                  )}
                </div>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
