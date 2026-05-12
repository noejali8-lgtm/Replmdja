import { useState, useEffect, useRef } from "react";
import { Bell, X, Check, CheckCheck, Info, CheckCircle2, AlertTriangle, XCircle, Trash2 } from "lucide-react";
import { notificationStore, type Notification, type NotifLevel } from "@/lib/notifications";

const LEVEL_CONFIG: Record<NotifLevel, { icon: React.ReactNode; color: string; bg: string; border: string }> = {
  info:    { icon: <Info          className="h-3.5 w-3.5" />, color: "text-[#58a6ff]",  bg: "bg-[#1f6feb]/10",  border: "border-[#1f6feb]/30" },
  success: { icon: <CheckCircle2 className="h-3.5 w-3.5" />, color: "text-[#3fb950]",  bg: "bg-[#238636]/10",  border: "border-[#238636]/30" },
  warning: { icon: <AlertTriangle className="h-3.5 w-3.5" />, color: "text-[#d29922]",  bg: "bg-[#9e6a03]/10",  border: "border-[#9e6a03]/30" },
  error:   { icon: <XCircle      className="h-3.5 w-3.5" />, color: "text-[#f85149]",  bg: "bg-[#da3633]/10",  border: "border-[#da3633]/30" },
};

function formatTs(ts: number) {
  const diff = Date.now() - ts;
  if (diff < 60_000)  return "just now";
  if (diff < 3600_000) return `${Math.floor(diff / 60_000)}m ago`;
  return `${Math.floor(diff / 3600_000)}h ago`;
}

export function NotificationsCenter() {
  const [notifs, setNotifs]   = useState<Notification[]>([]);
  const [open, setOpen]       = useState(false);
  const panelRef              = useRef<HTMLDivElement>(null);

  useEffect(() => notificationStore.subscribe(setNotifs), []);

  /* Close on outside click */
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const unread = notifs.filter(n => !n.read).length;

  return (
    <div className="relative" ref={panelRef}>
      {/* Bell button */}
      <button
        onClick={() => { setOpen(p => !p); if (!open) notificationStore.markAllRead(); }}
        className={`relative h-8 w-8 flex items-center justify-center rounded transition-colors border ${
          open ? "bg-[#21262d] border-[#484f58] text-[#e6edf3]" : "border-[#30363d] text-[#8b949e] hover:text-[#e6edf3] hover:bg-[#21262d]"
        }`}>
        <Bell className="h-4 w-4" />
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 h-4 min-w-4 px-0.5 flex items-center justify-center rounded-full bg-[#da3633] text-white text-[9px] font-bold">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {/* Dropdown panel */}
      {open && (
        <div className="absolute right-0 top-10 w-80 bg-[#161b22] border border-[#30363d] rounded-lg shadow-2xl z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-3 py-2 border-b border-[#21262d]">
            <span className="text-[12px] font-semibold text-[#e6edf3]">Notifications</span>
            <div className="flex items-center gap-1">
              {notifs.length > 0 && (
                <>
                  <button onClick={() => notificationStore.markAllRead()} title="Mark all read"
                    className="h-6 w-6 flex items-center justify-center rounded text-[#484f58] hover:text-[#8b949e] hover:bg-[#21262d] transition-colors">
                    <CheckCheck className="h-3.5 w-3.5" />
                  </button>
                  <button onClick={() => notificationStore.clear()} title="Clear all"
                    className="h-6 w-6 flex items-center justify-center rounded text-[#484f58] hover:text-[#f85149] hover:bg-[#21262d] transition-colors">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </>
              )}
              <button onClick={() => setOpen(false)}
                className="h-6 w-6 flex items-center justify-center rounded text-[#484f58] hover:text-[#8b949e] hover:bg-[#21262d] transition-colors">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto">
            {notifs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-[#484f58] gap-2">
                <Bell className="h-8 w-8 opacity-20" />
                <p className="text-xs">No notifications</p>
              </div>
            ) : (
              notifs.map(n => {
                const cfg = LEVEL_CONFIG[n.level];
                return (
                  <div key={n.id} className={`flex items-start gap-2.5 px-3 py-2.5 border-b border-[#21262d] hover:bg-[#21262d]/50 transition-colors ${!n.read ? "bg-[#21262d]/30" : ""}`}>
                    <span className={`shrink-0 mt-0.5 ${cfg.color}`}>{cfg.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-[12px] font-medium text-[#e6edf3] truncate">{n.title}</p>
                        <span className="text-[10px] text-[#484f58] shrink-0">{formatTs(n.ts)}</span>
                      </div>
                      {n.message && (
                        <p className="text-[11px] text-[#8b949e] mt-0.5 leading-snug">{n.message}</p>
                      )}
                      {n.action && (
                        <button
                          onClick={() => { n.action?.onClick?.(); if (n.action?.href) window.open(n.action.href, "_blank"); }}
                          className={`mt-1 text-[10px] px-2 py-0.5 rounded border ${cfg.bg} ${cfg.color} ${cfg.border} hover:opacity-80 transition-opacity`}>
                          {n.action.label}
                        </button>
                      )}
                    </div>
                    {!n.read && (
                      <button onClick={() => notificationStore.markRead(n.id)} className="shrink-0 mt-1">
                        <Circle className="h-2 w-2 fill-[#58a6ff] text-[#58a6ff]" />
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* Re-export for convenience */
function Circle({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 8 8" fill="currentColor"><circle cx="4" cy="4" r="4"/></svg>;
}
