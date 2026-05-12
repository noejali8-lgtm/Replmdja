import { useState, useRef, useCallback } from "react";
import { Gauge, Play, Square, AlertCircle, Loader2, Zap } from "lucide-react";

interface TickStats {
  elapsed: number;
  total: number;
  errors: number;
  rps: number;
  latency: { avg: number; p50: number; p95: number; p99: number; min?: number; max?: number };
}

interface Props {
  projectId?: number;
}

function StatBox({ label, value, unit = "", color = "text-[#e6edf3]" }: { label: string; value: string | number; unit?: string; color?: string }) {
  return (
    <div className="bg-[#161b22] border border-[#21262d] rounded p-2 flex flex-col gap-0.5">
      <span className="text-[9px] text-[#484f58] uppercase tracking-widest">{label}</span>
      <div className="flex items-baseline gap-1">
        <span className={`text-base font-bold font-mono ${color}`}>{value}</span>
        {unit && <span className="text-[9px] text-[#484f58]">{unit}</span>}
      </div>
    </div>
  );
}

export function LoadTesterPanel({ projectId }: Props) {
  const [url, setUrl] = useState("http://localhost:3000");
  const [concurrency, setConcurrency] = useState(10);
  const [duration, setDuration] = useState(10);
  const [method, setMethod] = useState("GET");
  const [running, setRunning] = useState(false);
  const [stats, setStats] = useState<TickStats | null>(null);
  const [done, setDone] = useState(false);
  const [history, setHistory] = useState<number[]>([]);
  const abortRef = useRef<(() => void) | null>(null);

  const run = useCallback(async () => {
    if (!url.trim()) return;
    setRunning(true);
    setDone(false);
    setStats(null);
    setHistory([]);

    const ctrl = new AbortController();
    abortRef.current = () => ctrl.abort();

    try {
      const resp = await fetch(`/api/projects/${projectId ?? 0}/loadtest`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ url: url.trim(), concurrency, duration, method }),
        signal: ctrl.signal,
      });

      if (!resp.body) throw new Error("No SSE body");
      const reader = resp.body.getReader();
      const dec = new TextDecoder();
      let buf = "";

      while (true) {
        const { done: d, value } = await reader.read();
        if (d) break;
        buf += dec.decode(value, { stream: true });
        const lines = buf.split("\n");
        buf = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.startsWith("data:")) continue;
          try {
            const ev = JSON.parse(line.slice(5).trim()) as Record<string, unknown> & TickStats;
            if (ev.type === "tick" || ev.type === "done") {
              setStats(ev);
              setHistory(h => [...h.slice(-29), Number(ev.rps)]);
              if (ev.type === "done") setDone(true);
            }
          } catch { /* */ }
        }
      }
    } catch (e) {
      if ((e as Error).name !== "AbortError") {
        console.error("Load test error:", e);
      }
    } finally {
      setRunning(false);
    }
  }, [url, concurrency, duration, method, projectId]);

  const stop = () => { abortRef.current?.(); setRunning(false); };

  const maxRps = Math.max(...history, 1);

  return (
    <div className="flex flex-col h-full bg-[#0d1117] text-[#e6edf3] overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-[#21262d] bg-[#161b22] shrink-0">
        <Gauge className="h-4 w-4 text-[#58a6ff]" />
        <span className="text-xs font-semibold flex-1">Load Tester</span>
        {running && <span className="flex items-center gap-1 text-[10px] text-[#f2cc60]"><Zap className="h-3 w-3 animate-pulse" /> Testing</span>}
        {done && !running && <span className="text-[10px] text-[#3fb950]">✓ Done</span>}
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Config */}
        <div className="px-3 py-2.5 border-b border-[#21262d] space-y-2.5">
          <div>
            <label className="text-[10px] text-[#8b949e] block mb-1">Target URL</label>
            <input
              value={url}
              onChange={e => setUrl(e.target.value)}
              disabled={running}
              className="w-full bg-[#161b22] border border-[#30363d] rounded px-2 py-1.5 text-xs text-[#e6edf3] placeholder-[#484f58] outline-none focus:border-[#58a6ff] transition-colors disabled:opacity-50"
              placeholder="https://your-app.example.com/api/ping"
            />
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="text-[10px] text-[#8b949e] block mb-1">Method</label>
              <select
                value={method}
                onChange={e => setMethod(e.target.value)}
                disabled={running}
                className="w-full bg-[#161b22] border border-[#30363d] rounded px-1.5 py-1.5 text-xs text-[#e6edf3] outline-none disabled:opacity-50"
              >
                {["GET", "POST", "PUT", "DELETE", "HEAD"].map(m => <option key={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] text-[#8b949e] block mb-1">Concurrent</label>
              <input
                type="number"
                min={1} max={50}
                value={concurrency}
                onChange={e => setConcurrency(Number(e.target.value))}
                disabled={running}
                className="w-full bg-[#161b22] border border-[#30363d] rounded px-2 py-1.5 text-xs text-[#e6edf3] outline-none disabled:opacity-50"
              />
            </div>
            <div>
              <label className="text-[10px] text-[#8b949e] block mb-1">Seconds</label>
              <input
                type="number"
                min={1} max={60}
                value={duration}
                onChange={e => setDuration(Number(e.target.value))}
                disabled={running}
                className="w-full bg-[#161b22] border border-[#30363d] rounded px-2 py-1.5 text-xs text-[#e6edf3] outline-none disabled:opacity-50"
              />
            </div>
          </div>

          {running ? (
            <button onClick={stop}
              className="w-full flex items-center justify-center gap-2 py-1.5 rounded bg-[#da3633] hover:bg-[#f85149] text-white text-xs font-medium transition-colors">
              <Square className="h-3 w-3" /> Stop Test
            </button>
          ) : (
            <button onClick={run}
              disabled={!url.trim()}
              className="w-full flex items-center justify-center gap-2 py-1.5 rounded bg-[#1f6feb] hover:bg-[#388bfd] text-white text-xs font-medium transition-colors disabled:opacity-40">
              <Play className="h-3 w-3" /> Start Load Test
            </button>
          )}
        </div>

        {/* Live stats */}
        {stats && (
          <div className="px-3 py-2.5 space-y-3">
            {/* RPS sparkline */}
            {history.length > 1 && (
              <div>
                <p className="text-[10px] text-[#8b949e] mb-1.5">Requests/sec over time</p>
                <div className="flex items-end gap-0.5 h-10 bg-[#161b22] rounded p-1">
                  {history.map((v, i) => (
                    <div
                      key={i}
                      className="flex-1 bg-[#1f6feb] rounded-sm opacity-80 transition-all"
                      style={{ height: `${Math.round((v / maxRps) * 100)}%`, minHeight: 1 }}
                      title={`${v} rps`}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Core metrics */}
            <div className="grid grid-cols-2 gap-1.5">
              <StatBox label="Requests" value={stats.total} />
              <StatBox
                label="RPS"
                value={stats.rps}
                unit="req/s"
                color="text-[#58a6ff]"
              />
              <StatBox
                label="Errors"
                value={stats.errors}
                color={stats.errors > 0 ? "text-[#ff7b72]" : "text-[#3fb950]"}
              />
              <StatBox
                label="Error Rate"
                value={stats.total > 0 ? `${Math.round((stats.errors / stats.total) * 100)}` : "0"}
                unit="%"
                color={stats.errors > 0 ? "text-[#ff7b72]" : "text-[#3fb950]"}
              />
            </div>

            {/* Latency */}
            <div>
              <p className="text-[10px] text-[#8b949e] mb-1.5 uppercase tracking-widest font-semibold">Latency (ms)</p>
              <div className="grid grid-cols-2 gap-1.5">
                <StatBox label="avg" value={stats.latency.avg} unit="ms" />
                <StatBox label="p50" value={stats.latency.p50} unit="ms" />
                <StatBox label="p95" value={stats.latency.p95} unit="ms" color="text-[#d29922]" />
                <StatBox label="p99" value={stats.latency.p99} unit="ms" color="text-[#ff7b72]" />
              </div>
              {stats.latency.min !== undefined && (
                <div className="grid grid-cols-2 gap-1.5 mt-1.5">
                  <StatBox label="min" value={stats.latency.min} unit="ms" color="text-[#3fb950]" />
                  <StatBox label="max" value={stats.latency.max ?? 0} unit="ms" color="text-[#ff7b72]" />
                </div>
              )}
            </div>

            {done && (
              <div className="text-[10px] text-[#8b949e] text-center border border-[#21262d] rounded py-1.5">
                Completed in {stats.elapsed}s — {stats.total} total requests
              </div>
            )}
          </div>
        )}

        {!stats && !running && (
          <div className="flex flex-col items-center justify-center py-12 text-[#484f58] gap-3 px-3">
            <Gauge className="h-8 w-8 opacity-30" />
            <div className="text-center">
              <p className="text-xs font-medium mb-1">No test data</p>
              <p className="text-[10px]">Enter a URL and start a load test</p>
              <p className="text-[9px] mt-2 text-[#484f58] opacity-80">Max 50 concurrent / 60s duration</p>
            </div>
          </div>
        )}

        {running && !stats && (
          <div className="flex items-center justify-center gap-2 py-8 text-[#58a6ff] text-xs">
            <Loader2 className="h-4 w-4 animate-spin" />
            Warming up…
          </div>
        )}
      </div>
    </div>
  );
}
