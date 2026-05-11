import { useState } from "react";
import { Shield, X, Loader2, AlertTriangle, CheckCircle, Zap, RefreshCw, ChevronDown, ChevronRight } from "lucide-react";
import ReactMarkdown from "react-markdown";

interface ReviewFinding {
  severity: "critical" | "high" | "medium" | "low" | "info";
  category: string;
  title: string;
  description: string;
  line?: number;
}

interface ReviewResult {
  score: number;
  summary: string;
  findings: ReviewFinding[];
  raw: string;
}

interface AIReviewerProps {
  code?: string;
  language?: string;
  filename?: string;
  onClose?: () => void;
}

const SEV_CONFIG = {
  critical: { color: "text-[#f85149]", bg: "bg-[#f85149]/10", border: "border-[#f85149]/30", label: "Critical" },
  high:     { color: "text-[#ff9a00]", bg: "bg-[#ff9a00]/10", border: "border-[#ff9a00]/30", label: "High" },
  medium:   { color: "text-[#d29922]", bg: "bg-[#d29922]/10", border: "border-[#d29922]/30", label: "Medium" },
  low:      { color: "text-[#3fb950]", bg: "bg-[#3fb950]/10", border: "border-[#3fb950]/30", label: "Low" },
  info:     { color: "text-[#58a6ff]", bg: "bg-[#58a6ff]/10", border: "border-[#58a6ff]/30", label: "Info" },
};

function ScoreRing({ score }: { score: number }) {
  const r = 28, c = 2 * Math.PI * r;
  const pct = score / 100;
  const color = score >= 80 ? "#3fb950" : score >= 60 ? "#d29922" : "#f85149";
  return (
    <svg width="72" height="72" className="-rotate-90">
      <circle cx="36" cy="36" r={r} fill="none" stroke="#21262d" strokeWidth="5" />
      <circle cx="36" cy="36" r={r} fill="none" stroke={color} strokeWidth="5"
        strokeDasharray={c} strokeDashoffset={c * (1 - pct)} strokeLinecap="round"
        style={{ transition: "stroke-dashoffset 1s ease" }} />
      <text x="36" y="36" textAnchor="middle" dominantBaseline="central"
        className="rotate-90" fill={color} fontSize="16" fontWeight="700"
        style={{ transform: "rotate(90deg)", transformOrigin: "36px 36px" }}>
        {score}
      </text>
    </svg>
  );
}

export function AIReviewer({ code, language = "typescript", filename = "file", onClose }: AIReviewerProps) {
  const [streaming, setStreaming]   = useState(false);
  const [raw, setRaw]               = useState("");
  const [result, setResult]         = useState<ReviewResult | null>(null);
  const [expanded, setExpanded]     = useState<Set<number>>(new Set([0]));

  const toggleExpand = (i: number) =>
    setExpanded(p => { const s = new Set(p); s.has(i) ? s.delete(i) : s.add(i); return s; });

  const runReview = async () => {
    if (!code) return;
    setStreaming(true); setRaw(""); setResult(null);

    try {
      const res = await fetch("/api/anthropic/code-review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, language, filename }),
      });

      if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`);

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let full = "", buf = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const lines = buf.split("\n");
        buf = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const d = JSON.parse(line.slice(6));
            if (d.content) { full += d.content; setRaw(full); }
            if (d.done) break;
          } catch { /**/ }
        }
      }

      /* Parse structured findings from the AI response */
      const scoreMatch = full.match(/Score:\s*(\d+)/i);
      const score = scoreMatch ? parseInt(scoreMatch[1]) : 75;
      setResult({ score, summary: "", findings: [], raw: full });
    } catch (e) {
      setRaw(`Error: ${String(e)}`);
    } finally {
      setStreaming(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#0d1117] text-[#e6edf3]">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-[#21262d] bg-[#161b22] shrink-0">
        <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-[#388bfd] to-[#a371f7] flex items-center justify-center shrink-0">
          <Shield className="h-4 w-4 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <span className="text-sm font-semibold">AI Code Reviewer</span>
          <p className="text-[10px] text-[#8b949e] truncate">{filename} · {language}</p>
        </div>
        {onClose && (
          <button onClick={onClose} className="h-7 w-7 flex items-center justify-center rounded text-[#8b949e] hover:text-[#e6edf3] hover:bg-[#21262d] transition-colors">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {!raw && !streaming && (
          <div className="flex flex-col items-center justify-center h-full gap-6 px-6 text-center">
            <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-[#388bfd]/20 to-[#a371f7]/20 border border-[#388bfd]/20 flex items-center justify-center">
              <Shield className="h-10 w-10 text-[#58a6ff]" />
            </div>
            <div>
              <h3 className="font-semibold text-[#e6edf3] mb-1">Full Code Analysis</h3>
              <p className="text-[11px] text-[#8b949e]">
                AI will scan for security vulnerabilities, performance issues, code smells, and best practice violations.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 w-full text-[10px]">
              {[
                { icon: <Shield className="h-3 w-3" />, label: "Security Scan" },
                { icon: <Zap className="h-3 w-3" />,    label: "Performance" },
                { icon: <CheckCircle className="h-3 w-3" />, label: "Best Practices" },
                { icon: <AlertTriangle className="h-3 w-3" />, label: "Code Smells" },
              ].map(item => (
                <div key={item.label} className="flex items-center gap-2 p-2 rounded-lg bg-[#161b22] border border-[#21262d] text-[#8b949e]">
                  <span className="text-[#58a6ff]">{item.icon}</span>
                  {item.label}
                </div>
              ))}
            </div>
            {!code ? (
              <p className="text-[10px] text-[#484f58]">Open a file to review its code</p>
            ) : (
              <button onClick={runReview}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#1f6feb] to-[#6e40c9] hover:from-[#388bfd] hover:to-[#8957e5] text-white text-sm font-medium transition-all shadow-lg shadow-[#1f6feb]/20">
                <Shield className="h-4 w-4" />
                Run Code Review
              </button>
            )}
          </div>
        )}

        {(streaming || raw) && (
          <div className="p-4 space-y-4">
            {/* Score */}
            {result && (
              <div className="flex items-center gap-4 p-4 rounded-xl bg-[#161b22] border border-[#21262d]">
                <ScoreRing score={result.score} />
                <div>
                  <p className="text-sm font-semibold">{result.score >= 80 ? "Good" : result.score >= 60 ? "Needs Work" : "Needs Attention"}</p>
                  <p className="text-[11px] text-[#8b949e]">Overall code quality score</p>
                </div>
              </div>
            )}

            {/* Streaming markdown */}
            <div className="prose prose-invert prose-xs max-w-none text-[12px] leading-relaxed
              [&_h1]:text-sm [&_h1]:font-bold [&_h1]:text-[#e6edf3] [&_h1]:mt-4 [&_h1]:mb-2
              [&_h2]:text-xs [&_h2]:font-semibold [&_h2]:text-[#58a6ff] [&_h2]:mt-3 [&_h2]:mb-1
              [&_h3]:text-xs [&_h3]:font-medium [&_h3]:text-[#e6edf3] [&_h3]:mt-2 [&_h3]:mb-1
              [&_p]:text-[#8b949e] [&_p]:mb-2
              [&_ul]:list-disc [&_ul]:pl-4 [&_ul]:space-y-0.5
              [&_li]:text-[#8b949e]
              [&_strong]:text-[#e6edf3]
              [&_code]:text-[#ffa657] [&_code]:bg-[#161b22] [&_code]:px-1 [&_code]:rounded
              [&_pre]:bg-[#0d1117] [&_pre]:border [&_pre]:border-[#30363d] [&_pre]:rounded-lg [&_pre]:p-3">
              <ReactMarkdown>{raw || "Analyzing…"}</ReactMarkdown>
            </div>

            {streaming && (
              <div className="flex items-center gap-2 text-xs text-[#8b949e]">
                <Loader2 className="h-3.5 w-3.5 animate-spin text-[#58a6ff]" />
                Analyzing code…
              </div>
            )}

            {!streaming && raw && (
              <button onClick={runReview}
                className="flex items-center gap-1.5 text-xs text-[#8b949e] hover:text-[#e6edf3] px-2 py-1 rounded hover:bg-[#21262d] transition-colors">
                <RefreshCw className="h-3 w-3" /> Re-run review
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
