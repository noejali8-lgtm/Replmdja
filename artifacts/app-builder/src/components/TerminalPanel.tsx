import { useEffect, useRef, useState } from "react";
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import { WebLinksAddon } from "@xterm/addon-web-links";
import { motion } from "framer-motion";
import { ArrowLeft, X, Maximize2, Minimize2, RotateCcw, Plus, Circle } from "lucide-react";
import { cn } from "@/lib/utils";

interface TerminalPanelProps {
  onClose: () => void;
  projectId?: number | null;
  projectDir?: string | null;
}

export function TerminalPanel({ onClose, projectId, projectDir }: TerminalPanelProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const termRef      = useRef<Terminal | null>(null);
  const fitRef       = useRef<FitAddon | null>(null);
  const wsRef        = useRef<WebSocket | null>(null);
  const [connected, setConnected]   = useState(false);
  const [error, setError]           = useState<string | null>(null);
  const [fullscreen, setFullscreen] = useState(false);
  const [sessions, setSessions]     = useState([{ id: 1, label: "bash" }]);
  const [activeSession]             = useState(1);

  const BASE_URL = import.meta.env.BASE_URL?.replace(/\/$/, "") || "";

  const connect = (cwd?: string) => {
    setError(null);

    if (!containerRef.current) return;

    /* destroy old term if any */
    if (termRef.current) { termRef.current.dispose(); termRef.current = null; }
    if (wsRef.current)   { wsRef.current.close(); wsRef.current = null; }

    const term = new Terminal({
      theme: {
        background:  "#0d1117",
        foreground:  "#c9d1d9",
        cursor:      "#58a6ff",
        cursorAccent:"#0d1117",
        black:       "#21262d",
        red:         "#ff7b72",
        green:       "#3fb950",
        yellow:      "#d29922",
        blue:        "#58a6ff",
        magenta:     "#bc8cff",
        cyan:        "#76e3ea",
        white:       "#b1bac4",
        brightBlack: "#484f58",
        brightRed:   "#ffa198",
        brightGreen: "#56d364",
        brightYellow:"#e3b341",
        brightBlue:  "#79c0ff",
        brightMagenta:"#d2a8ff",
        brightCyan:  "#b3f0ff",
        brightWhite: "#f0f6fc",
        selectionBackground: "rgba(56,139,253,0.25)",
      },
      fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', 'Courier New', monospace",
      fontSize: 13,
      lineHeight: 1.5,
      cursorBlink: true,
      cursorStyle: "bar",
      scrollback: 2000,
      convertEol: true,
    });

    const fit  = new FitAddon();
    const links = new WebLinksAddon();
    term.loadAddon(fit);
    term.loadAddon(links);
    term.open(containerRef.current);
    fit.fit();

    termRef.current = term;
    fitRef.current  = fit;

    term.writeln("\x1b[90m⚡ Connecting to shell…\x1b[0m");

    /* determine WebSocket URL */
    const proto  = window.location.protocol === "https:" ? "wss" : "ws";
    const host   = window.location.host;
    const cwdEnc = encodeURIComponent(cwd ?? projectDir ?? "/home/runner/workspace");
    const wsUrl  = `${proto}://${host}${BASE_URL}/api/terminal/ws?cwd=${cwdEnc}`;

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      setConnected(true);
      term.writeln("\x1b[32m✓ Connected\x1b[0m");
    };

    ws.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data);
        if (msg.type === "output") term.write(msg.data);
        if (msg.type === "exit")   term.writeln(`\r\n\x1b[90m[Process exited: ${msg.code}]\x1b[0m`);
        if (msg.type === "error")  { term.writeln(`\r\n\x1b[31m${msg.data}\x1b[0m`); setError(msg.data); }
      } catch { /**/ }
    };

    ws.onerror = () => {
      term.writeln("\r\n\x1b[31m✗ WebSocket error — check if API server is running\x1b[0m");
      setConnected(false);
    };

    ws.onclose = () => {
      setConnected(false);
      term.writeln("\r\n\x1b[90m[disconnected]\x1b[0m");
    };

    term.onData((data) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: "input", data }));
      }
    });

    term.onResize(({ cols, rows }) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: "resize", cols, rows }));
      }
    });
  };

  useEffect(() => {
    /* inject xterm css */
    const id = "xterm-css";
    if (!document.getElementById(id)) {
      const link = document.createElement("link");
      link.id   = id;
      link.rel  = "stylesheet";
      link.href = "https://cdn.jsdelivr.net/npm/@xterm/xterm@5.5.0/css/xterm.min.css";
      document.head.appendChild(link);
    }

    connect();

    const onResize = () => { fitRef.current?.fit(); };
    window.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("resize", onResize);
      wsRef.current?.close();
      termRef.current?.dispose();
    };
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => fitRef.current?.fit(), 100);
    return () => clearTimeout(timer);
  }, [fullscreen]);

  return (
    <motion.div
      initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
      transition={{ type: "spring", stiffness: 340, damping: 36 }}
      className={cn(
        "absolute z-50 flex flex-col bg-[#0d1117]",
        fullscreen ? "inset-0" : "inset-x-0 bottom-0 h-[70%] rounded-t-2xl border-t border-white/[0.08]"
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-1 px-3 py-2 border-b border-white/[0.07] shrink-0">
        {/* macOS-style dots */}
        <div className="flex items-center gap-1.5 mr-2">
          <button onClick={onClose}
            className="w-3 h-3 rounded-full bg-red-500/80 hover:bg-red-400 transition-colors flex items-center justify-center group">
            <X size={6} className="opacity-0 group-hover:opacity-100 text-red-900" />
          </button>
          <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
          <button onClick={() => setFullscreen(f => !f)}
            className="w-3 h-3 rounded-full bg-green-500/80 hover:bg-green-400 transition-colors" />
        </div>

        {/* Session tabs */}
        <div className="flex items-center gap-0.5 flex-1 overflow-x-auto no-scrollbar">
          {sessions.map(s => (
            <div key={s.id}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1 rounded-md text-[11px] shrink-0 transition-colors",
                s.id === activeSession ? "bg-white/10 text-white" : "text-white/40"
              )}>
              <Circle size={6} className={connected ? "fill-green-400 text-green-400" : "fill-white/20 text-white/20"} />
              {s.label}
            </div>
          ))}
          <button
            onClick={() => {
              const id = sessions.length + 1;
              setSessions(prev => [...prev, { id, label: "bash" }]);
              connect();
            }}
            className="w-6 h-6 flex items-center justify-center text-white/30 hover:text-white rounded transition-colors">
            <Plus size={12} />
          </button>
        </div>

        <button onClick={() => connect()}
          className="w-7 h-7 flex items-center justify-center text-white/30 hover:text-white rounded transition-colors"
          title="Restart shell">
          <RotateCcw size={13} />
        </button>
        <button onClick={() => setFullscreen(f => !f)}
          className="w-7 h-7 flex items-center justify-center text-white/30 hover:text-white rounded transition-colors">
          {fullscreen ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
        </button>
      </div>

      {/* Xterm container */}
      <div ref={containerRef} className="flex-1 overflow-hidden px-1 py-1" />

      {/* Status bar */}
      <div className="flex items-center gap-3 px-3 py-1 border-t border-white/[0.04] shrink-0">
        <span className={cn("text-[10px] font-mono", connected ? "text-green-400" : "text-red-400/70")}>
          {connected ? "● connected" : "○ disconnected"}
        </span>
        <span className="text-[10px] text-white/20 font-mono">
          {projectDir ? `📁 ${projectDir.split("/").slice(-2).join("/")}` : "~/workspace"}
        </span>
        {error && (
          <span className="text-[10px] text-yellow-400/70 font-mono truncate flex-1 text-right">
            ⚠ terminal unavailable — node-pty not compiled
          </span>
        )}
      </div>
    </motion.div>
  );
}
