import { useEffect, useRef, useState, useCallback } from "react";
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import { WebLinksAddon } from "@xterm/addon-web-links";
import { Plus, X, RotateCcw, Maximize2, Minimize2, Circle } from "lucide-react";
import "@xterm/xterm/css/xterm.css";

interface Session {
  id: number;
  label: string;
  term: Terminal | null;
  fit: FitAddon | null;
  ws: WebSocket | null;
  connected: boolean;
}

interface TerminalPaneProps {
  cwd?: string;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
}

let sessionCounter = 1;

export function TerminalPane({ cwd, isExpanded, onToggleExpand }: TerminalPaneProps) {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [activeId, setActiveId] = useState<number | null>(null);
  const containerRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  const BASE_URL = (import.meta.env.BASE_URL ?? "").replace(/\/$/, "");

  const createSession = useCallback(() => {
    const id = sessionCounter++;
    const session: Session = { id, label: `bash ${id}`, term: null, fit: null, ws: null, connected: false };
    setSessions(prev => [...prev, session]);
    setActiveId(id);
    return id;
  }, []);

  const connectSession = useCallback((id: number, container: HTMLDivElement) => {
    const term = new Terminal({
      theme: {
        background: "#0d1117", foreground: "#c9d1d9", cursor: "#58a6ff",
        cursorAccent: "#0d1117", black: "#21262d", red: "#ff7b72",
        green: "#3fb950", yellow: "#d29922", blue: "#58a6ff",
        magenta: "#bc8cff", cyan: "#76e3ea", white: "#b1bac4",
        brightBlack: "#484f58", brightRed: "#ffa198", brightGreen: "#56d364",
        brightYellow: "#e3b341", brightBlue: "#79c0ff", brightMagenta: "#d2a8ff",
        brightCyan: "#b3f0ff", brightWhite: "#f0f6fc",
        selectionBackground: "rgba(56,139,253,0.25)",
      },
      fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
      fontSize: 13,
      lineHeight: 1.5,
      cursorBlink: true,
      cursorStyle: "bar",
      scrollback: 5000,
      convertEol: true,
    });

    const fit = new FitAddon();
    term.loadAddon(fit);
    term.loadAddon(new WebLinksAddon());
    term.open(container);

    setTimeout(() => {
      try { fit.fit(); } catch { /**/ }
    }, 50);

    term.writeln("\x1b[90m⚡ Connecting to shell…\x1b[0m");

    const proto = window.location.protocol === "https:" ? "wss" : "ws";
    const cwdEnc = encodeURIComponent(cwd ?? "/home/runner/workspace");
    const wsUrl = `${proto}://${window.location.host}${BASE_URL}/api/terminal/ws?cwd=${cwdEnc}`;

    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      term.writeln("\x1b[32m✓ Connected\x1b[0m\r\n");
      setSessions(prev => prev.map(s => s.id === id ? { ...s, connected: true } : s));
    };

    ws.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data);
        if (msg.type === "output") term.write(msg.data);
        if (msg.type === "exit") term.writeln(`\r\n\x1b[90m[Process exited: ${msg.code}]\x1b[0m`);
      } catch { /**/ }
    };

    ws.onerror = () => {
      term.writeln("\x1b[31m✗ Connection failed\x1b[0m");
    };

    ws.onclose = () => {
      term.writeln("\r\n\x1b[90m[Disconnected]\x1b[0m");
      setSessions(prev => prev.map(s => s.id === id ? { ...s, connected: false } : s));
    };

    term.onData(data => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: "input", data }));
      }
    });

    term.onResize(({ cols, rows }) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: "resize", cols, rows }));
      }
    });

    setSessions(prev => prev.map(s =>
      s.id === id ? { ...s, term, fit, ws } : s
    ));

    return { term, fit, ws };
  }, [cwd, BASE_URL]);

  const addSession = useCallback(() => {
    createSession();
  }, [createSession]);

  const closeSession = useCallback((id: number) => {
    setSessions(prev => {
      const session = prev.find(s => s.id === id);
      if (session) {
        try { session.ws?.close(); } catch { /**/ }
        try { session.term?.dispose(); } catch { /**/ }
      }
      const next = prev.filter(s => s.id !== id);
      if (activeId === id && next.length > 0) {
        setActiveId(next[next.length - 1].id);
      } else if (next.length === 0) {
        setActiveId(null);
      }
      return next;
    });
    containerRefs.current.delete(id);
  }, [activeId]);

  const restartSession = useCallback((id: number) => {
    setSessions(prev => {
      const session = prev.find(s => s.id === id);
      if (session) {
        try { session.ws?.close(); } catch { /**/ }
        try { session.term?.dispose(); } catch { /**/ }
      }
      return prev.map(s => s.id === id
        ? { ...s, term: null, fit: null, ws: null, connected: false }
        : s
      );
    });
  }, []);

  useEffect(() => {
    if (sessions.length === 0) {
      const id = sessionCounter++;
      setSessions([{ id, label: "bash", term: null, fit: null, ws: null, connected: false }]);
      setActiveId(id);
    }
  }, []);

  useEffect(() => {
    if (activeId === null) return;
    const container = containerRefs.current.get(activeId);
    if (!container) return;
    const session = sessions.find(s => s.id === activeId);
    if (!session || session.term) return;
    connectSession(activeId, container);
  }, [activeId, sessions, connectSession]);

  useEffect(() => {
    const handleResize = () => {
      sessions.forEach(s => {
        try { s.fit?.fit(); } catch { /**/ }
      });
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [sessions]);

  return (
    <div className="flex flex-col h-full bg-[#0d1117]">
      <div className="flex items-center gap-0.5 px-2 py-1 bg-[#161b22] border-b border-[#21262d] shrink-0">
        {sessions.map(s => (
          <div key={s.id}
            className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs cursor-pointer transition-colors group ${activeId === s.id ? "bg-[#0d1117] text-[#e6edf3]" : "text-[#8b949e] hover:text-[#e6edf3] hover:bg-[#21262d]"}`}
            onClick={() => setActiveId(s.id)}>
            <Circle className={`h-1.5 w-1.5 fill-current ${s.connected ? "text-green-400" : "text-[#484f58]"}`} />
            <span>{s.label}</span>
            <button
              onClick={e => { e.stopPropagation(); closeSession(s.id); }}
              className="opacity-0 group-hover:opacity-100 hover:text-red-400 transition-all ml-0.5">
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}

        <button onClick={addSession}
          className="h-6 w-6 flex items-center justify-center rounded text-[#484f58] hover:text-[#8b949e] hover:bg-[#21262d] transition-colors ml-1">
          <Plus className="h-3.5 w-3.5" />
        </button>

        <div className="flex-1" />

        {activeId !== null && (
          <button onClick={() => restartSession(activeId)}
            className="h-6 w-6 flex items-center justify-center rounded text-[#484f58] hover:text-[#8b949e] hover:bg-[#21262d] transition-colors"
            title="Restart terminal">
            <RotateCcw className="h-3 w-3" />
          </button>
        )}

        {onToggleExpand && (
          <button onClick={onToggleExpand}
            className="h-6 w-6 flex items-center justify-center rounded text-[#484f58] hover:text-[#8b949e] hover:bg-[#21262d] transition-colors">
            {isExpanded ? <Minimize2 className="h-3 w-3" /> : <Maximize2 className="h-3 w-3" />}
          </button>
        )}
      </div>

      <div className="flex-1 relative overflow-hidden">
        {sessions.map(s => (
          <div key={s.id}
            ref={el => {
              if (el) containerRefs.current.set(s.id, el);
            }}
            className={`absolute inset-0 p-2 ${activeId === s.id ? "block" : "hidden"}`}
            style={{ overflow: "hidden" }}
          />
        ))}
      </div>
    </div>
  );
}
