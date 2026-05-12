import { useState, useRef, useCallback } from "react";
import { FlaskConical, Play, Square, Check, X, ChevronRight, Loader2, AlertCircle, Terminal } from "lucide-react";

interface TestResult {
  name: string;
  status: "pass" | "fail";
  duration?: number;
}

interface Props {
  projectId?: number;
}

export function TestRunnerPanel({ projectId }: Props) {
  const [running, setRunning] = useState(false);
  const [output, setOutput] = useState<{ text: string; type: string }[]>([]);
  const [results, setResults] = useState<TestResult[]>([]);
  const [pass, setPass] = useState(0);
  const [fail, setFail] = useState(0);
  const [done, setDone] = useState(false);
  const [exitCode, setExitCode] = useState<number | null>(null);
  const [script, setScript] = useState("test");
  const abortRef = useRef<(() => void) | null>(null);
  const outputRef = useRef<HTMLDivElement>(null);

  const run = useCallback(async () => {
    if (!projectId) {
      setOutput([{ text: "⚠ Open a real project to run tests.", type: "warn" }]);
      return;
    }
    setRunning(true);
    setDone(false);
    setOutput([]);
    setResults([]);
    setPass(0);
    setFail(0);
    setExitCode(null);

    const controller = new AbortController();
    abortRef.current = () => controller.abort();

    try {
      const resp = await fetch(`/api/projects/${projectId}/test`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ script }),
        signal: controller.signal,
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
            const ev = JSON.parse(line.slice(5).trim()) as Record<string, unknown>;
            if (ev.type === "done") {
              setPass(Number(ev.pass ?? 0));
              setFail(Number(ev.fail ?? 0));
              setResults((ev.results as TestResult[]) ?? []);
              setExitCode(Number(ev.code ?? 0));
              setDone(true);
            } else if (ev.data) {
              setOutput(p => [...p, { text: String(ev.data), type: String(ev.type) }]);
              setTimeout(() => outputRef.current?.scrollTo(0, outputRef.current.scrollHeight), 0);
            }
          } catch { /* */ }
        }
      }
    } catch (e) {
      if ((e as Error).name !== "AbortError") {
        setOutput(p => [...p, { text: `Error: ${(e as Error).message}`, type: "error" }]);
      }
    } finally {
      setRunning(false);
      abortRef.current = null;
    }
  }, [projectId, script]);

  const stop = () => { abortRef.current?.(); setRunning(false); };

  const textColor = (type: string) =>
    type === "error" ? "text-[#ff7b72]" :
    type === "stderr" ? "text-[#d29922]" :
    type === "info" ? "text-[#58a6ff]" :
    "text-[#8b949e]";

  return (
    <div className="flex flex-col h-full bg-[#0d1117] text-[#e6edf3] overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-[#21262d] bg-[#161b22] shrink-0">
        <FlaskConical className="h-4 w-4 text-[#3fb950]" />
        <span className="text-xs font-semibold flex-1">Test Runner</span>
        {done && (
          <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${fail === 0 ? "bg-[#3fb950]/10 text-[#3fb950] border border-[#3fb950]/20" : "bg-[#f85149]/10 text-[#ff7b72] border border-[#f85149]/20"}`}>
            {pass}✓ {fail}✗
          </span>
        )}
      </div>

      {/* Controls */}
      <div className="px-3 py-2 border-b border-[#21262d] flex items-center gap-2 shrink-0">
        <div className="flex items-center gap-1 bg-[#161b22] border border-[#30363d] rounded px-2 py-1 flex-1">
          <Terminal className="h-3 w-3 text-[#484f58] shrink-0" />
          <span className="text-[10px] text-[#484f58] shrink-0">npm run</span>
          <input
            value={script}
            onChange={e => setScript(e.target.value)}
            className="flex-1 bg-transparent text-xs text-[#e6edf3] outline-none min-w-0"
            placeholder="test"
          />
        </div>
        {running ? (
          <button onClick={stop}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded bg-[#da3633] text-white text-[11px] font-medium hover:bg-[#f85149] transition-colors shrink-0">
            <Square className="h-3 w-3" /> Stop
          </button>
        ) : (
          <button onClick={run}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded bg-[#238636] text-white text-[11px] font-medium hover:bg-[#2ea043] transition-colors shrink-0">
            {running ? <Loader2 className="h-3 w-3 animate-spin" /> : <Play className="h-3 w-3" />}
            Run
          </button>
        )}
      </div>

      {/* Results summary */}
      {done && results.length > 0 && (
        <div className="px-3 py-2 border-b border-[#21262d] shrink-0">
          <p className="text-[10px] font-semibold text-[#8b949e] uppercase tracking-widest mb-1.5">Results</p>
          <div className="space-y-0.5 max-h-32 overflow-y-auto">
            {results.map((r, i) => (
              <div key={i} className="flex items-center gap-2 py-0.5">
                {r.status === "pass"
                  ? <Check className="h-3 w-3 text-[#3fb950] shrink-0" />
                  : <X className="h-3 w-3 text-[#ff7b72] shrink-0" />}
                <span className={`text-[11px] truncate ${r.status === "pass" ? "text-[#e6edf3]" : "text-[#ff7b72]"}`}>
                  {r.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Done state when no named results */}
      {done && results.length === 0 && (
        <div className={`mx-3 my-2 px-3 py-2 rounded border text-[11px] shrink-0 ${exitCode === 0 ? "bg-[#3fb950]/10 border-[#3fb950]/20 text-[#3fb950]" : "bg-[#f85149]/10 border-[#f85149]/20 text-[#ff7b72]"}`}>
          {exitCode === 0 ? <><Check className="inline h-3 w-3 mr-1" />All tests passed</> : <><AlertCircle className="inline h-3 w-3 mr-1" />Tests failed (exit {exitCode})</>}
        </div>
      )}

      {/* Output */}
      <div ref={outputRef} className="flex-1 overflow-y-auto p-3 font-mono text-[11px] space-y-0.5">
        {output.length === 0 && !running && (
          <div className="flex flex-col items-center justify-center h-full text-[#484f58] gap-3">
            <FlaskConical className="h-8 w-8 opacity-30" />
            <div className="text-center">
              <p className="text-xs font-medium mb-1">No tests run yet</p>
              <p className="text-[10px]">Press Run to execute your test suite</p>
              {!projectId && <p className="text-[10px] mt-1 text-[#d29922]">Open a real project first</p>}
            </div>
          </div>
        )}
        {running && output.length === 0 && (
          <div className="flex items-center gap-2 text-[#58a6ff]">
            <Loader2 className="h-3 w-3 animate-spin" />
            <span>Starting test runner…</span>
          </div>
        )}
        {output.map((line, i) => (
          <div key={i} className={`whitespace-pre-wrap break-all ${textColor(line.type)}`}>
            {line.type === "info" && <ChevronRight className="inline h-3 w-3 mr-0.5 opacity-60" />}
            {line.text}
          </div>
        ))}
      </div>
    </div>
  );
}
