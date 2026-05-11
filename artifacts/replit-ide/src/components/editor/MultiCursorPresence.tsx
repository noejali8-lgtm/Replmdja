import { useEffect, useState } from "react";
import { Users } from "lucide-react";

interface Collaborator {
  id: string;
  name: string;
  color: string;
  initials: string;
  line: number;
  col: number;
  file: string;
  active: boolean;
  lastSeen: number;
}

const DEMO_COLLABORATORS: Collaborator[] = [
  { id: "c1", name: "Alice Chen",    color: "#58a6ff", initials: "AC", line: 12, col: 8,  file: "src/App.tsx",          active: true,  lastSeen: Date.now() },
  { id: "c2", name: "Bob Martinez",  color: "#3fb950", initials: "BM", line: 34, col: 22, file: "src/components/Nav.tsx", active: true,  lastSeen: Date.now() },
  { id: "c3", name: "Carol Lin",     color: "#a371f7", initials: "CL", line: 7,  col: 4,  file: "src/App.tsx",          active: false, lastSeen: Date.now() - 120000 },
];

interface MultiCursorPresenceProps {
  currentFile?: string;
  compact?: boolean;
}

function formatLastSeen(ts: number): string {
  const diff = Date.now() - ts;
  if (diff < 60000) return "just now";
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  return `${Math.floor(diff / 3600000)}h ago`;
}

export function MultiCursorPresence({ currentFile, compact = false }: MultiCursorPresenceProps) {
  const [collaborators, setCollaborators] = useState<Collaborator[]>(DEMO_COLLABORATORS);
  const [, setTick] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCollaborators(prev => prev.map(c => {
        if (!c.active) return c;
        return {
          ...c,
          line: Math.max(1, c.line + Math.floor((Math.random() - 0.4) * 3)),
          col: Math.max(0, c.col + Math.floor((Math.random() - 0.5) * 8)),
          lastSeen: Date.now(),
        };
      }));
      setTick(t => t + 1);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const active = collaborators.filter(c => c.active);
  const inThisFile = active.filter(c => c.file === currentFile);

  if (compact) {
    return (
      <div className="flex items-center gap-1">
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
        <span className="text-[10px] text-[#3fb950]">{active.length} online</span>
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
        {collaborators.map(c => (
          <div key={c.id}
            className={`flex items-center gap-2.5 px-2 py-2 rounded transition-colors ${c.active ? "hover:bg-[#161b22]" : "opacity-50"}`}>
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
        ))}
      </div>

      <div className="px-3 py-2 border-t border-[#21262d] bg-[#161b22] shrink-0">
        <button className="w-full py-1.5 rounded border border-dashed border-[#30363d] text-[10px] text-[#484f58] hover:text-[#8b949e] hover:border-[#484f58] transition-colors">
          Invite collaborators
        </button>
      </div>
    </div>
  );
}
