import React, { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Plus, FolderOpen, Package, User, Home } from "lucide-react";

export function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [online, setOnline] = useState(navigator.onLine);

  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);

  const navItems = [
    { id: "home",       href: "/",            icon: Home,      label: "Home" },
    { id: "new",        href: "/editor",       icon: Plus,      label: "New",       isCreate: true },
    { id: "projects",   href: "/projects",     icon: FolderOpen, label: "Projects" },
    { id: "extensions", href: "/extensions",   icon: Package,   label: "Extensions" },
    { id: "profile",    href: "/profile",      icon: User,      label: "Profile" },
  ];

  return (
    <div className="flex flex-col h-screen bg-[#0d1117] text-[#e6edf3]">
      {/* Offline banner */}
      {!online && (
        <div className="bg-yellow-500/90 backdrop-blur-sm px-4 py-1.5 flex items-center justify-center gap-2 border-b border-yellow-400/50 shrink-0 z-50">
          <div className="w-1.5 h-1.5 rounded-full bg-yellow-900 animate-pulse" />
          <span className="text-[11px] font-semibold text-yellow-900">Offline — changes saved locally</span>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto overflow-x-hidden relative pb-16">
        {children}
      </main>

      {/* Bottom Nav — matches App Builder style exactly */}
      <div className="fixed bottom-0 left-0 right-0 z-50">
        <div className="bg-[#141414] border-t border-white/[0.08]">
          <nav className="flex justify-around items-center h-[62px] pb-safe max-w-screen-xl mx-auto">
            {navItems.map(item => {
              const Icon = item.icon;
              const isActive = item.id === "home"
                ? location === "/"
                : item.id === "new"
                ? false
                : location === item.href || location.startsWith(item.href + "/");
              const isCreate = item.isCreate;

              return (
                <Link key={item.id} href={item.href} className="flex-1 h-full">
                  <div
                    data-testid={`nav-tab-${item.id}`}
                    className="flex flex-col items-center justify-center w-full h-full gap-1 cursor-pointer relative"
                  >
                    {isActive && !isCreate && (
                      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-[2px] bg-white rounded-full" />
                    )}

                    {isCreate ? (
                      <>
                        <div className="w-[34px] h-[34px] rounded-[10px] flex items-center justify-center bg-white/10 hover:bg-white/20 text-white/70 transition-all">
                          <Icon size={18} strokeWidth={2} />
                        </div>
                        <span className="text-[9px] font-medium text-white/50">{item.label}</span>
                      </>
                    ) : (
                      <>
                        <div className="relative">
                          <Icon
                            size={20}
                            strokeWidth={isActive ? 2 : 1.5}
                            className={isActive ? "text-white" : "text-white/40"}
                          />
                          {item.id === "home" && (
                            <div className={`absolute -top-0.5 -right-1 w-1.5 h-1.5 rounded-full border border-[#141414] ${online ? "bg-green-400" : "bg-yellow-400"}`} />
                          )}
                        </div>
                        <span className={`text-[9px] font-medium ${isActive ? "text-white" : "text-white/40"}`}>
                          {item.label}
                        </span>
                      </>
                    )}
                  </div>
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
    </div>
  );
}
