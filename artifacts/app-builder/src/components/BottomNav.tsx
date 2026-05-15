import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { FolderOpen, Plus, User, BookOpen, Compass } from "lucide-react";
import { cn } from "@/lib/utils";

/* Gemini diamond icon inline */
function GeminiIcon({ size = 20, active = false }: { size?: number; active?: boolean }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M12 2C12 2 14.5 8 20 12C14.5 16 12 22 12 22C12 22 9.5 16 4 12C9.5 8 12 2 12 2Z"
        fill={active ? "#60a5fa" : "currentColor"}
        fillOpacity={active ? 1 : 0.45}
        stroke={active ? "#93c5fd" : "none"}
        strokeWidth="0.5"
      />
    </svg>
  );
}

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
    { id: "account",  path: "/account",   icon: User,      label: "Account",   gemini: false },
    { id: "explore",  path: "/explore",   icon: Compass,   label: "Explore",   gemini: false },
    { id: "create",   path: "/",          icon: Plus,      label: "Create",    gemini: false },
    { id: "projects", path: "/projects",  icon: FolderOpen,label: "Projects",  gemini: false },
    { id: "gemini",   path: "/gemini",    icon: null,      label: "Gemini",    gemini: true  },
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
            const isGemini = tab.id === "gemini";

            return (
              <Link key={tab.id} href={tab.path} className="flex-1 h-full">
                <div
                  data-testid={`nav-tab-${tab.id}`}
                  className="flex flex-col items-center justify-center w-full h-full gap-1 cursor-pointer relative"
                >
                  {isActive && !isCreate && (
                    <div className={cn(
                      "absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-[2px] rounded-full",
                      isGemini ? "bg-blue-400" : "bg-white"
                    )} />
                  )}

                  {isCreate ? (
                    <>
                      <div className={cn(
                        "w-[34px] h-[34px] rounded-[10px] flex items-center justify-center transition-all",
                        isActive ? "bg-white text-black" : "bg-white/10 text-white/70"
                      )}>
                        {Icon && <Icon size={18} strokeWidth={2} />}
                      </div>
                      <span className={cn("text-[9px] font-medium", isActive ? "text-white" : "text-white/50")}>{tab.label}</span>
                    </>
                  ) : isGemini ? (
                    <>
                      <div className={cn(
                        "w-[34px] h-[34px] rounded-[10px] flex items-center justify-center transition-all",
                        isActive
                          ? "bg-blue-500/20 border border-blue-400/40"
                          : "bg-white/[0.04] border border-white/[0.07]"
                      )}>
                        <GeminiIcon size={18} active={isActive} />
                      </div>
                      <span className={cn("text-[9px] font-medium", isActive ? "text-blue-300" : "text-white/40")}>{tab.label}</span>
                    </>
                  ) : (
                    <>
                      <div className="relative">
                        {Icon && <Icon size={20} strokeWidth={isActive ? 2 : 1.5} className={isActive ? "text-white" : "text-white/40"} />}
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
