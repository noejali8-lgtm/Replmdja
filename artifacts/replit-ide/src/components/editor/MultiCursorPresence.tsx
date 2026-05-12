import { useState, useEffect, useMemo } from "react";
import { Users, Wifi, WifiOff, UserPlus } from "lucide-react";
import { usePresence, type RemoteCursor } from "@/hooks/usePresence";

interface MultiCursorPresenceProps {
  currentFile?: string;
  compact?: boolean;
  projectId?: string | number;
}

function formatLastSeen(_ts: number): string {
  return "just now";
}

function getUserId(): string {
  let id = sessionStorage.getItem("presence-uid");
  if (!id) {
    id = `user-${Math.random().toString(36).slice(2, 8)}`;
    sessionStorage.setItem("presence-uid", id);
  }
  return id;
}

function getUsername(): string {
  return localStorage.getItem("ide-username") ?? "Anonymous";
}

function cursorToCollaborator(c: RemoteCursor) {
  const parts = c.username.split(" ");
  const initials = parts.length >= 2
    ? (parts[0][0] + parts[1][0]).toUpperCase()
    : c.username.slice(0, 2).toUpperCase();
  return {
    id: c.userId,
    name: c.username,
    color: c.color,
    initials,
    line: c.line,
    col: c.column,
    file: c.file,
    active: true,
    lastSeen: Date.now(),
  };
}

export function MultiCursorPresence({ currentFile, compact = false, projectId = "default" }: MultiCursorPresenceProps) {
  const userId = useMemo(() => getUserId(), []);
  const username = useMemo(() => getUsername(), []);

  const { connected, cursors, myColor } = usePresence({
    projectId,
    userId,
    username,
    currentFile,
  });

  const collaborators = cursors.map(cursorToCollaborator);
  const active = collaborators.filter(c => c.active);
  const inThisFile = active.filter(c => c.file === currentFile);

  const [, setTick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setTick(n => n + 1), 10000);
    return () => clearInterval(t);
  }, []);

  if (compact) {
    return (
      <div className="flex items-center gap-1.5">
        {connected ? (
          <Wifi className="h-3 w-3 text-[#3fb950]" title="Live presence active" />
        ) : (
          <WifiOff className="h-3 w-3 text-[#484f58]" title="Offline" />
        )}
        {active.slice(0, 3).map((c, i) => (
          <div
            key={c.id}
            title={`${c.name} — ${c.file}:${c.line}`}
            className="h-5 w-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white cursor-default"
            style={{ backgroundColor: c.color, marginLeft: i > 0 ? -4 : 0, border: "1.5px solid #0d1117" }}>
            {c.initials}
          </div>
        ))}
        {active.length > 3 && (
          <span className="text-[9px] text-[#484f58] ml-1">+{active.length - 3}</span>
        )}
        {active.length === 0 && (
          <span className="text-[9px] text-[#484f58]">Only you</span>
        )}
        {active.length > 0 && (
          <Users className="h-3 w-3 text-[#484f58] ml-0.5" />
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[#0d1117] text-[#e6edf3]">
      <div className="flex items-center gap-2 px-3 py-2 border-b border-[#21262d] bg-[#161b22] shrink-0">
        <Users className="h-3.5 w-3.5 text-[#58a6ff]" />
        <span className="text-[10px] font-semibold text-[#8b949e] uppercase tracking-widest flex-1">Collaborators</span>
        <div className="flex items-center gap-1.5">
          {connected
            ? <Wifi className="h-3 w-3 text-[#3fb950]" />
            : <WifiOff className="h-3 w-3 text-[#484f58]" />
          }
          <span className={`text-[10px] ${connected ? "text-[#3fb950]" : "text-[#484f58]"}`}>
            {connected ? `${active.length} online` : "offline"}
          </span>
        </div>
      </div>

      {/* You */}
      <div className="px-3 py-2 border-b border-[#21262d] bg-[#161b22]/40 shrink-0">
        <p className="text-[10px] text-[#484f58] mb-1.5">You</p>
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 rounded-full flex items-center justify-center text-[9px] font-bold text-white shrink-0"
            style={{ backgroundColor: myColor }}>
            {username.slice(0, 2).toUpperCase()}
          </div>
          <span className="text-[11px] text-[#e6edf3]">{username}</span>
          {currentFile && (
            <span className="text-[10px] text-[#484f58] truncate">{currentFile}</span>
          )}
        </div>
      </div>

      {currentFile && inThisFile.length > 0 && (
        <div className="px-3 py-2 border-b border-[#21262d] bg-[#161b22]/50 shrink-0">
          <p className="text-[10px] text-[#8b949e] mb-1.5">In this file</p>
          <div className="space-y-1">
            {inThisFile.map(c => (
              <div key={c.id} className="flex items-center gap-2 text-xs">
                <div className="h-5 w-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white shrink-0"
                  style={{ backgroundColor: c.color }}>
                  {c.initials}
                </div>
                <span className="flex-1 truncate text-[11px]">{c.name}</span>
                <span className="text-[10px] font-mono" style={{ color: c.color }}>:{c.line}:{c.col}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
        {collaborators.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-8 text-center">
            <Users className="h-8 w-8 text-[#30363d]" />
            <p className="text-[11px] text-[#484f58]">No one else here yet</p>
            <p className="text-[10px] text-[#30363d]">Share this project to collaborate in real-time</p>
          </div>
        ) : (
          collaborators.map(c => (
            <div key={c.id}
              className="flex items-center gap-2.5 px-2 py-2 rounded transition-colors hover:bg-[#161b22]">
              <div className="relative shrink-0">
                <div className="h-7 w-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
                  style={{ backgroundColor: c.color }}>
                  {c.initials}
                </div>
                <div className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-[#0d1117] ${c.active ? "bg-[#3fb950]" : "bg-[#484f58]"}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate">{c.name}</p>
                <p className="text-[10px] text-[#484f58] truncate">{c.active ? c.file : `Last seen ${formatLastSeen(c.lastSeen)}`}</p>
              </div>
              {c.active && (
                <div className="shrink-0 text-[9px] font-mono px-1.5 py-0.5 rounded border"
                  style={{ color: c.color, borderColor: c.color + "40", backgroundColor: c.color + "15" }}>
                  :{c.line}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      <div className="px-3 py-2 border-t border-[#21262d] bg-[#161b22] shrink-0">
        <button className="w-full py-1.5 rounded border border-dashed border-[#30363d] text-[10px] text-[#484f58] hover:text-[#8b949e] hover:border-[#484f58] transition-colors flex items-center justify-center gap-1.5">
          <UserPlus className="h-3 w-3" />
          Invite collaborators
        </button>
      </div>
    </div>
  );
}
