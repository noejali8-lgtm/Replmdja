import { useState, useEffect, useCallback } from "react";
import { Network, ExternalLink, RefreshCw, Circle, Globe, Lock, Copy, Check, Server } from "lucide-react";

interface PortInfo {
  port: number;
  label: string;
  status: "open" | "closed" | "checking";
  url?: string;
  pid?: number;
}

interface Props {
  projectId?: number;
  previewUrl?: string | null;
}

const WELL_KNOWN: { port: number; label: string }[] = [
  { port: 8000,  label: "API Server" },
  { port: 5000,  label: "App Builder" },
  { port: 3001,  label: "Replit IDE" },
  { port: 3000,  label: "Dev Server" },
  { port: 4000,  label: "Frontend" },
  { port: 5173,  label: "Vite" },
  { port: 5432,  label: "PostgreSQL" },
  { port: 6379,  label: "Redis" },
];

async function checkPort(port: number): Promise<"open" | "closed"> {
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 1500);
    const r = await fetch(`http://localhost:${port}`, { signal: ctrl.signal, mode: "no-cors" });
    clearTimeout(timer);
    return "open";
  } catch (e) {
    const err = e as Error;
    if (err.name === "AbortError") return "closed";
    // A network error from no-cors still means the port responded
    return err.message.includes("Failed to fetch") && !err.message.includes("abort") ? "open" : "closed";
  }
}

export function PortForwardingPanel({ projectId, previewUrl }: Props) {
  const [ports, setPorts] = useState<PortInfo[]>(
    WELL_KNOWN.map(p => ({ ...p, status: "checking" as const }))
  );
  const [copied, setCopied] = useState<number | null>(null);
  const [processPort, setProcessPort] = useState<number | null>(null);
  const [scanning, setScanning] = useState(false);

  const copyUrl = (url: string, port: number) => {
    navigator.clipboard.writeText(url).then(() => {
      setCopied(port);
      setTimeout(() => setCopied(null), 1500);
    });
  };

  const scan = useCallback(async () => {
    setScanning(true);

    // Check project process port
    if (projectId) {
      try {
        const r = await fetch(`/api/projects/${projectId}/process/status`);
        if (r.ok) {
          const data = await r.json() as { running: boolean; pid?: number };
          if (data.running && data.pid) {
            const port = 3500 + projectId;
            setProcessPort(port);
          }
        }
      } catch { /* */ }
    }

    // Check all well-known ports in parallel
    const results = await Promise.all(
      WELL_KNOWN.map(async p => {
        const status = await checkPort(p.port);
        const devDomain = (window as Window & { __REPLIT_DEV_DOMAIN__?: string }).__REPLIT_DEV_DOMAIN__;
        const url = devDomain
          ? `https://${devDomain}`.replace(/:\d+/, `:${p.port}`)
          : `http://localhost:${p.port}`;
        return { ...p, status, url } as PortInfo;
      })
    );

    // Add project process port if not in well-known list
    if (projectId) {
      const pPort = 3500 + projectId;
      if (!results.find(r => r.port === pPort)) {
        const status = await checkPort(pPort);
        const url = `http://localhost:${pPort}`;
        results.push({ port: pPort, label: `Project (ID ${projectId})`, status, url });
      }
    }

    results.sort((a, b) => (a.status === "open" ? -1 : 1) || a.port - b.port);
    setPorts(results);
    setScanning(false);
  }, [projectId]);

  useEffect(() => {
    scan();
    const interval = setInterval(scan, 15000);
    return () => clearInterval(interval);
  }, [scan]);

  const open = ports.filter(p => p.status === "open");
  const closed = ports.filter(p => p.status === "closed");

  return (
    <div className="flex flex-col h-full bg-[#0d1117] text-[#e6edf3]">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 bg-[#161b22] border-b border-[#21262d] shrink-0">
        <div className="flex items-center gap-2">
          <Network className="h-3.5 w-3.5 text-[#8b949e]" />
          <span className="text-[11px] font-semibold text-[#8b949e] uppercase tracking-wider">Port Forwarding</span>
        </div>
        <button onClick={scan} disabled={scanning}
          className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] bg-[#21262d] border border-[#30363d] text-[#8b949e] hover:text-[#e6edf3] transition-colors disabled:opacity-40">
          <RefreshCw className={`h-3 w-3 ${scanning ? "animate-spin" : ""}`} />
          Scan
        </button>
      </div>

      {/* Summary */}
      <div className="flex items-center gap-3 px-3 py-1.5 border-b border-[#21262d] bg-[#0d1117] shrink-0">
        <div className="flex items-center gap-1">
          <Circle className="h-2 w-2 fill-[#3fb950] text-[#3fb950]" />
          <span className="text-[10px] text-[#3fb950]">{open.length} open</span>
        </div>
        <div className="flex items-center gap-1">
          <Circle className="h-2 w-2 fill-[#484f58] text-[#484f58]" />
          <span className="text-[10px] text-[#484f58]">{closed.length} closed</span>
        </div>
        {previewUrl && (
          <div className="flex items-center gap-1 ml-auto">
            <Globe className="h-2.5 w-2.5 text-[#58a6ff]" />
            <span className="text-[10px] text-[#58a6ff] truncate max-w-[80px]">Live preview active</span>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto py-1">
        {/* Open ports */}
        {open.length > 0 && (
          <div>
            <p className="px-3 py-1.5 text-[10px] font-semibold text-[#3fb950] uppercase tracking-wider">
              Open Ports
            </p>
            {open.map(p => (
              <div key={p.port} className="flex items-center gap-2 px-3 py-2 hover:bg-[#161b22] border-b border-[#21262d]/50 transition-colors">
                <Server className="h-3.5 w-3.5 text-[#3fb950] shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[12px] font-mono text-[#e6edf3] font-semibold">{p.port}</span>
                    <span className="text-[10px] text-[#8b949e]">{p.label}</span>
                  </div>
                  {p.url && (
                    <span className="text-[10px] text-[#484f58] font-mono truncate block">{p.url}</span>
                  )}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {p.url && (
                    <>
                      <button onClick={() => copyUrl(p.url!, p.port)}
                        title="Copy URL"
                        className="h-6 w-6 flex items-center justify-center rounded text-[#484f58] hover:text-[#e6edf3] hover:bg-[#21262d] transition-colors">
                        {copied === p.port ? <Check className="h-3 w-3 text-[#3fb950]" /> : <Copy className="h-3 w-3" />}
                      </button>
                      <button onClick={() => window.open(p.url, "_blank")}
                        title="Open in new tab"
                        className="h-6 w-6 flex items-center justify-center rounded text-[#484f58] hover:text-[#e6edf3] hover:bg-[#21262d] transition-colors">
                        <ExternalLink className="h-3 w-3" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Closed ports */}
        {closed.length > 0 && (
          <div>
            <p className="px-3 py-1.5 text-[10px] font-semibold text-[#484f58] uppercase tracking-wider">
              Closed / Not Running
            </p>
            {closed.map(p => (
              <div key={p.port} className="flex items-center gap-2 px-3 py-1.5 border-b border-[#21262d]/30 opacity-50">
                <Lock className="h-3.5 w-3.5 text-[#484f58] shrink-0" />
                <span className="text-[12px] font-mono text-[#484f58] font-semibold">{p.port}</span>
                <span className="text-[10px] text-[#484f58]">{p.label}</span>
              </div>
            ))}
          </div>
        )}

        {scanning && ports.every(p => p.status === "checking") && (
          <div className="flex flex-col items-center justify-center h-24 text-[#484f58] gap-2">
            <RefreshCw className="h-5 w-5 animate-spin" />
            <p className="text-xs">Scanning ports…</p>
          </div>
        )}
      </div>

      <div className="px-3 py-1.5 border-t border-[#21262d] bg-[#161b22] shrink-0 text-[10px] text-[#484f58]">
        Auto-refreshes every 15s
      </div>
    </div>
  );
}
