import { useState, useEffect } from "react";
import { BarChart2, Users, Clock, Globe, Zap, TrendingUp, Activity, ArrowUp, ArrowDown } from "lucide-react";

function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function generateHourlyData() {
  const r = seededRandom(42);
  return Array.from({ length: 24 }, (_, h) => ({
    hour: h,
    requests: Math.round(20 + r() * 300 + (h >= 9 && h <= 17 ? 200 : 0)),
    latency:  Math.round(40 + r() * 120),
    errors:   Math.round(r() * 8),
  }));
}

const DATA = generateHourlyData();
const MAX_REQ = Math.max(...DATA.map(d => d.requests));

interface MiniSparklineProps { values: number[]; color?: string; height?: number }
function MiniSparkline({ values, color = "#58a6ff", height = 32 }: MiniSparklineProps) {
  const max = Math.max(...values, 1);
  const pts = values.map((v, i) => `${(i / (values.length - 1)) * 100},${height - (v / max) * height}`).join(" ");
  return (
    <svg width="100%" height={height} viewBox={`0 0 100 ${height}`} preserveAspectRatio="none">
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
      <polyline points={`0,${height} ${pts} 100,${height}`} fill={color} fillOpacity="0.08" stroke="none" />
    </svg>
  );
}

interface BarProps { value: number; max: number; color?: string }
function Bar({ value, max, color = "#58a6ff" }: BarProps) {
  return (
    <div className="flex-1 flex items-end h-16 group cursor-default" title={String(value)}>
      <div
        className="w-full mx-px rounded-sm transition-all group-hover:opacity-80"
        style={{ height: `${(value / max) * 100}%`, background: color, minHeight: 2 }}
      />
    </div>
  );
}

const COUNTRIES = [
  { country: "United States",   pct: 38, flag: "🇺🇸" },
  { country: "Germany",         pct: 14, flag: "🇩🇪" },
  { country: "Saudi Arabia",    pct: 11, flag: "🇸🇦" },
  { country: "United Kingdom",  pct:  9, flag: "🇬🇧" },
  { country: "France",          pct:  7, flag: "🇫🇷" },
  { country: "Other",           pct: 21, flag: "🌍" },
];

const ENDPOINTS = [
  { path: "/api/chat",     calls: 4821, p99: "340ms", status: "ok" },
  { path: "/api/projects", calls: 2104, p99: "120ms", status: "ok" },
  { path: "/api/files",    calls: 1887, p99: " 88ms", status: "ok" },
  { path: "/api/deploy",   calls:  312, p99: "620ms", status: "warn" },
];

export function AnalyticsPanel() {
  const [range, setRange] = useState<"24h"|"7d"|"30d">("24h");
  const [tick, setTick]   = useState(0);

  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 5000);
    return () => clearInterval(id);
  }, []);

  const totalReq  = DATA.reduce((s, d) => s + d.requests, 0);
  const avgLatency = Math.round(DATA.reduce((s, d) => s + d.latency, 0) / DATA.length);
  const totalErrors = DATA.reduce((s, d) => s + d.errors, 0);
  const errorRate   = ((totalErrors / totalReq) * 100).toFixed(1);

  return (
    <div className="flex flex-col h-full bg-[#0d1117] text-[#e6edf3]">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-[#21262d] bg-[#161b22] shrink-0">
        <BarChart2 className="h-4 w-4 text-[#3fb950]" />
        <span className="text-xs font-semibold flex-1">Analytics</span>
        <div className="flex items-center gap-0.5">
          {(["24h","7d","30d"] as const).map(r => (
            <button key={r} onClick={() => setRange(r)}
              className={`text-[10px] px-2 py-0.5 rounded transition-colors ${range === r ? "bg-[#21262d] text-[#e6edf3]" : "text-[#484f58] hover:text-[#8b949e]"}`}>
              {r}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1">
          <div className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
          <span className="text-[9px] text-green-400">Live</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {/* KPI cards */}
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: "Requests", value: totalReq.toLocaleString(), sub: "+12% vs yesterday", icon: <Activity className="h-3.5 w-3.5" />, color: "text-[#58a6ff]", up: true },
            { label: "Avg Latency", value: `${avgLatency}ms`, sub: "-8ms improvement", icon: <Clock className="h-3.5 w-3.5" />, color: "text-[#3fb950]", up: false },
            { label: "Unique Users", value: "1,284", sub: "+5% this week", icon: <Users className="h-3.5 w-3.5" />, color: "text-[#a371f7]", up: true },
            { label: "Error Rate", value: `${errorRate}%`, sub: "Normal range", icon: <Zap className="h-3.5 w-3.5" />, color: "text-[#d29922]", up: false },
          ].map(kpi => (
            <div key={kpi.label} className="p-3 rounded-xl bg-[#161b22] border border-[#21262d]">
              <div className={`flex items-center gap-1.5 mb-1 ${kpi.color}`}>
                {kpi.icon}
                <span className="text-[10px] text-[#8b949e]">{kpi.label}</span>
              </div>
              <div className="text-base font-bold text-[#e6edf3]">{kpi.value}</div>
              <div className={`flex items-center gap-0.5 text-[9px] mt-0.5 ${kpi.up ? "text-[#3fb950]" : "text-[#3fb950]"}`}>
                {kpi.up ? <ArrowUp className="h-2.5 w-2.5" /> : <ArrowDown className="h-2.5 w-2.5" />}
                {kpi.sub}
              </div>
            </div>
          ))}
        </div>

        {/* Requests chart */}
        <div className="p-3 rounded-xl bg-[#161b22] border border-[#21262d]">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-semibold text-[#e6edf3]">Requests / hour</span>
            <span className="text-[10px] text-[#484f58]">Last 24h</span>
          </div>
          <div className="flex items-end gap-px h-16">
            {DATA.map((d, i) => (
              <Bar key={i} value={d.requests} max={MAX_REQ}
                color={d.hour >= 9 && d.hour <= 17 ? "#58a6ff" : "#30363d"} />
            ))}
          </div>
          <div className="flex justify-between mt-1 text-[9px] text-[#484f58]">
            <span>00:00</span><span>06:00</span><span>12:00</span><span>18:00</span><span>24:00</span>
          </div>
        </div>

        {/* Latency sparkline */}
        <div className="p-3 rounded-xl bg-[#161b22] border border-[#21262d]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold">Response Time</span>
            <span className="text-[10px] text-[#3fb950]">p99: {Math.max(...DATA.map(d => d.latency))}ms</span>
          </div>
          <MiniSparkline values={DATA.map(d => d.latency)} color="#3fb950" />
        </div>

        {/* Top endpoints */}
        <div className="p-3 rounded-xl bg-[#161b22] border border-[#21262d] space-y-2">
          <span className="text-[11px] font-semibold">Top Endpoints</span>
          {ENDPOINTS.map(ep => (
            <div key={ep.path} className="flex items-center gap-2 text-[10px]">
              <div className={`h-1.5 w-1.5 rounded-full shrink-0 ${ep.status === "ok" ? "bg-green-400" : "bg-[#d29922]"}`} />
              <span className="font-mono text-[#8b949e] flex-1 truncate">{ep.path}</span>
              <span className="text-[#484f58]">{ep.calls.toLocaleString()}</span>
              <span className={ep.status === "warn" ? "text-[#d29922]" : "text-[#484f58]"}>{ep.p99}</span>
            </div>
          ))}
        </div>

        {/* Geography */}
        <div className="p-3 rounded-xl bg-[#161b22] border border-[#21262d] space-y-2">
          <span className="text-[11px] font-semibold flex items-center gap-1.5">
            <Globe className="h-3.5 w-3.5 text-[#8b949e]" /> Traffic Sources
          </span>
          {COUNTRIES.map(c => (
            <div key={c.country} className="flex items-center gap-2 text-[10px]">
              <span>{c.flag}</span>
              <span className="text-[#8b949e] flex-1">{c.country}</span>
              <div className="w-16 h-1.5 bg-[#30363d] rounded-full overflow-hidden">
                <div className="h-full bg-[#58a6ff] rounded-full" style={{ width: `${c.pct}%` }} />
              </div>
              <span className="text-[#484f58] w-6 text-right">{c.pct}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
