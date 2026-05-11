import { useState, useEffect } from "react";
import { Cpu, MemoryStick, Activity, Wifi, WifiOff } from "lucide-react";

interface Stats {
  cpu:      { usage: number; cores: number; model: string; loadavg: number[] };
  memory:   { total: number; used: number; free: number; percent: number };
  uptime:   number;
  hostname?: string;
  platform?: string;
  arch?:     string;
}

function fmt(bytes: number): string {
  if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(0)} KB`;
  if (bytes < 1024 ** 3) return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
  return `${(bytes / 1024 ** 3).toFixed(2)} GB`;
}

function fmtUptime(s: number): string {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  return `${h}h ${m}m`;
}

interface MiniBarProps { value: number; warn?: number; danger?: number }
function MiniBar({ value, warn = 70, danger = 90 }: MiniBarProps) {
  const color = value >= danger ? "bg-[#f85149]" : value >= warn ? "bg-[#d29922]" : "bg-[#3fb950]";
  return (
    <div className="w-16 h-1.5 bg-[#30363d] rounded-full overflow-hidden">
      <div className={`h-full rounded-full transition-all duration-500 ${color}`} style={{ width: `${Math.min(value, 100)}%` }} />
    </div>
  );
}

export function ResourceMonitor() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [err, setErr] = useState(false);
  const [show, setShow] = useState(false);

  const fetch_ = async () => {
    try {
      const r = await fetch("/api/system/stats");
      if (!r.ok) throw new Error();
      setStats(await r.json());
      setErr(false);
    } catch {
      setErr(true);
    }
  };

  useEffect(() => {
    fetch_();
    const id = setInterval(fetch_, 4000);
    return () => clearInterval(id);
  }, []);

  if (!stats && !err) return null;

  return (
    <div className="relative">
      <button
        onClick={() => setShow(p => !p)}
        className="flex items-center gap-2 px-2 py-0.5 rounded hover:bg-white/10 transition-colors text-[10px]">
        {err ? (
          <WifiOff className="h-3 w-3 text-red-200" />
        ) : (
          <>
            <Cpu className="h-3 w-3" />
            <span>{stats?.cpu.usage ?? 0}%</span>
            <MiniBar value={stats?.cpu.usage ?? 0} />
            <MemoryStick className="h-3 w-3 ml-1" />
            <span>{fmt(stats?.memory.used ?? 0)}</span>
            <MiniBar value={stats?.memory.percent ?? 0} />
          </>
        )}
      </button>

      {show && stats && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setShow(false)} />
          <div className="absolute bottom-8 right-0 z-50 w-72 bg-[#161b22] border border-[#30363d] rounded-xl shadow-2xl p-4 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#e6edf3] flex items-center gap-1.5">
                <Activity className="h-3.5 w-3.5 text-[#58a6ff]" /> System Resources
              </span>
              <span className="text-[10px] text-[#8b949e]">Uptime {fmtUptime(stats.uptime)}</span>
            </div>

            {/* CPU */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-[#8b949e] flex items-center gap-1"><Cpu className="h-3 w-3" /> CPU</span>
                <span className={`font-mono font-bold ${stats.cpu.usage >= 90 ? "text-[#f85149]" : stats.cpu.usage >= 70 ? "text-[#d29922]" : "text-[#3fb950]"}`}>
                  {stats.cpu.usage}%
                </span>
              </div>
              <div className="h-2 bg-[#30363d] rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${stats.cpu.usage >= 90 ? "bg-[#f85149]" : stats.cpu.usage >= 70 ? "bg-[#d29922]" : "bg-[#3fb950]"}`}
                  style={{ width: `${stats.cpu.usage}%` }}
                />
              </div>
              <div className="text-[10px] text-[#484f58]">{stats.cpu.cores} cores · Load {stats.cpu.loadavg.map(v => v.toFixed(2)).join(" / ")}</div>
            </div>

            {/* Memory */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-[#8b949e] flex items-center gap-1"><MemoryStick className="h-3 w-3" /> Memory</span>
                <span className={`font-mono font-bold ${stats.memory.percent >= 90 ? "text-[#f85149]" : stats.memory.percent >= 75 ? "text-[#d29922]" : "text-[#3fb950]"}`}>
                  {stats.memory.percent}%
                </span>
              </div>
              <div className="h-2 bg-[#30363d] rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${stats.memory.percent >= 90 ? "bg-[#f85149]" : stats.memory.percent >= 75 ? "bg-[#d29922]" : "bg-[#58a6ff]"}`}
                  style={{ width: `${stats.memory.percent}%` }}
                />
              </div>
              <div className="text-[10px] text-[#484f58]">{fmt(stats.memory.used)} used / {fmt(stats.memory.total)} total · {fmt(stats.memory.free)} free</div>
            </div>

            {/* Info row */}
            <div className="pt-1 border-t border-[#21262d] flex items-center gap-3 text-[10px] text-[#484f58]">
              <Wifi className="h-3 w-3 text-green-400" />
              <span>{stats.hostname ?? "repl"} · {stats.platform} {stats.arch}</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
