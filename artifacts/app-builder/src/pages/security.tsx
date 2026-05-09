import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Shield, AlertTriangle, CheckCircle2, XCircle,
  Search, Code2, Zap, Loader2, RefreshCw, Eye, EyeOff,
  Bug, Lock, Database, Activity, BarChart3
} from "lucide-react";
import { cn } from "@/lib/utils";

const BASE_URL = import.meta.env.BASE_URL?.replace(/\/$/, "") || "";

const SEVERITY_COLOR: Record<string, string> = {
  CRITICAL: "text-red-400 bg-red-500/10 border-red-400/20",
  HIGH: "text-orange-400 bg-orange-500/10 border-orange-400/20",
  MEDIUM: "text-yellow-400 bg-yellow-500/10 border-yellow-400/20",
  LOW: "text-blue-400 bg-blue-500/10 border-blue-400/20",
  INFO: "text-white/40 bg-white/5 border-white/10",
};

interface Dashboard {
  riskScore: number; grade: string;
  metrics: { vulnerabilities: Record<string, number>; promptInjections: Record<string, number>; cvesTracked: number; lastScan: string; scanCount: number };
  recentEvents: Array<{ type: string; message: string; severity: string; time: string }>;
}
interface Cve { id: string; severity: string; description: string; package: string; version: string; fix: string; cvss: number }

type Tab = "dashboard" | "scan" | "validate" | "cve";

export default function SecurityPage() {
  const [, navigate] = useLocation();
  const [tab, setTab] = useState<Tab>("dashboard");
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [cves, setCves] = useState<Cve[]>([]);
  const [code, setCode] = useState("");
  const [language, setLanguage] = useState("typescript");
  const [scanning, setScanning] = useState(false);
  const [scanOutput, setScanOutput] = useState("");
  const [validateInput, setValidateInput] = useState("");
  const [validateResult, setValidateResult] = useState<{ safe: boolean; threats: string[]; score: number } | null>(null);
  const [validating, setValidating] = useState(false);
  const [cveFilter, setCveFilter] = useState("all");

  useEffect(() => {
    fetchDashboard();
    fetchCves();
  }, []);

  async function fetchDashboard() {
    try {
      const r = await fetch(`${BASE_URL}/api/security/dashboard`);
      setDashboard(await r.json() as Dashboard);
    } catch { /* ignore */ }
  }

  async function fetchCves() {
    try {
      const r = await fetch(`${BASE_URL}/api/security/cve${cveFilter !== "all" ? `?severity=${cveFilter.toUpperCase()}` : ""}`);
      const d = await r.json() as { cves: Cve[] };
      setCves(d.cves ?? []);
    } catch { /* ignore */ }
  }

  async function scanCode() {
    if (!code.trim()) return;
    setScanning(true);
    setScanOutput("");
    try {
      const r = await fetch(`${BASE_URL}/api/security/scan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, language, filename: `example.${language}` }),
      });
      const reader = r.body?.getReader();
      if (!reader) return;
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const text = new TextDecoder().decode(value);
        for (const line of text.split("\n")) {
          if (!line.startsWith("data:")) continue;
          try {
            const ev = JSON.parse(line.slice(5)) as { type: string; content?: string };
            if (ev.type === "chunk" && ev.content) setScanOutput(p => p + ev.content);
          } catch { /* ignore */ }
        }
      }
    } catch { /* ignore */ }
    setScanning(false);
  }

  async function validateInputSecurity() {
    if (!validateInput.trim()) return;
    setValidating(true);
    try {
      const r = await fetch(`${BASE_URL}/api/security/validate-input`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input: validateInput, context: "user input" }),
      });
      setValidateResult(await r.json() as { safe: boolean; threats: string[]; score: number });
    } catch { /* ignore */ }
    setValidating(false);
  }

  const riskColor = dashboard
    ? dashboard.riskScore >= 80 ? "text-green-400" : dashboard.riskScore >= 60 ? "text-yellow-400" : "text-red-400"
    : "text-white/40";

  return (
    <div className="min-h-screen bg-[#0d1117] text-white flex flex-col">
      <div className="sticky top-0 z-20 bg-[#0d1117]/95 backdrop-blur border-b border-white/[0.08] px-4 pt-safe">
        <div className="flex items-center gap-3 py-3">
          <button onClick={() => navigate("/")} className="p-1.5 rounded-lg hover:bg-white/5 text-white/60 hover:text-white transition-colors">
            <ArrowLeft size={20} />
          </button>
          <Shield size={18} className="text-red-400" />
          <span className="font-semibold flex-1">AIDefence Security</span>
          {dashboard && <span className={cn("text-[11px] font-bold", riskColor)}>Score: {dashboard.riskScore} ({dashboard.grade})</span>}
        </div>
        <div className="flex gap-1 pb-3 overflow-x-auto">
          {(["dashboard", "scan", "validate", "cve"] as Tab[]).map(t => (
            <button key={t} onClick={() => setTab(t)} className={cn("shrink-0 px-3 py-1.5 rounded-lg text-[11px] font-medium capitalize transition-colors", tab === t ? "bg-white/10 text-white" : "text-white/40 hover:text-white/70")}>
              {t === "dashboard" ? "Dashboard" : t === "scan" ? "Code Scan" : t === "validate" ? "Input Check" : `CVE (${cves.length})`}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pb-24 px-4 pt-4">
        {tab === "dashboard" && dashboard && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <div className="bg-[#161b22] border border-white/[0.06] rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <div className="text-[11px] text-white/40">Security Risk Score</div>
                  <div className={cn("text-5xl font-bold mt-1", riskColor)}>{dashboard.riskScore}</div>
                  <div className={cn("text-[13px] font-medium mt-1", riskColor)}>Grade: {dashboard.grade}</div>
                </div>
                <div className="relative w-20 h-20">
                  <svg viewBox="0 0 80 80" className="w-20 h-20 -rotate-90">
                    <circle cx="40" cy="40" r="32" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
                    <circle cx="40" cy="40" r="32" fill="none" stroke={dashboard.riskScore >= 80 ? "#4ade80" : dashboard.riskScore >= 60 ? "#facc15" : "#f87171"} strokeWidth="8"
                      strokeDasharray={`${(dashboard.riskScore / 100) * 201} 201`} strokeLinecap="round" />
                  </svg>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {Object.entries(dashboard.metrics.vulnerabilities).map(([k, v]) => (
                  <div key={k} className={cn("rounded-lg p-2 text-center border", k === "critical" ? "bg-red-500/10 border-red-400/20" : k === "high" ? "bg-orange-500/10 border-orange-400/20" : k === "medium" ? "bg-yellow-500/10 border-yellow-400/20" : "bg-white/5 border-white/10")}>
                    <div className={cn("text-lg font-bold", k === "critical" ? "text-red-400" : k === "high" ? "text-orange-400" : k === "medium" ? "text-yellow-400" : "text-white/40")}>{v}</div>
                    <div className="text-[9px] text-white/30 capitalize">{k}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-[#161b22] border border-white/[0.06] rounded-xl p-3">
                <div className="text-[11px] text-white/40 mb-1">Injections Blocked</div>
                <div className="text-2xl font-bold text-green-400">{dashboard.metrics.promptInjections.blocked}</div>
                <div className="text-[10px] text-white/30">of {(dashboard.metrics.promptInjections.blocked + dashboard.metrics.promptInjections.allowed).toLocaleString()} total</div>
              </div>
              <div className="bg-[#161b22] border border-white/[0.06] rounded-xl p-3">
                <div className="text-[11px] text-white/40 mb-1">CVEs Tracked</div>
                <div className="text-2xl font-bold text-yellow-400">{dashboard.metrics.cvesTracked}</div>
                <div className="text-[10px] text-white/30">{dashboard.metrics.scanCount} scans total</div>
              </div>
            </div>

            <div className="bg-[#161b22] border border-white/[0.06] rounded-xl p-4">
              <div className="text-[12px] font-medium mb-3 flex items-center gap-2"><Activity size={13} className="text-red-400" /> Recent Events</div>
              <div className="space-y-2">
                {dashboard.recentEvents.map((e, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span className={cn("shrink-0 text-[9px] px-1.5 py-0.5 rounded border mt-0.5", SEVERITY_COLOR[e.severity] ?? SEVERITY_COLOR.INFO)}>{e.severity}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] text-white/70">{e.message}</p>
                      <p className="text-[10px] text-white/30">{new Date(e.time).toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {tab === "scan" && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
            <div className="flex gap-2">
              <select value={language} onChange={e => setLanguage(e.target.value)} className="bg-[#161b22] border border-white/[0.06] rounded-lg px-3 py-2 text-[12px] text-white focus:outline-none">
                {["typescript", "javascript", "python", "go", "rust", "java", "php"].map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
            <textarea value={code} onChange={e => setCode(e.target.value)} placeholder="Paste code to scan for security vulnerabilities..." rows={6} className="w-full bg-[#161b22] border border-white/[0.06] rounded-xl py-3 px-4 text-[12px] font-mono placeholder:text-white/30 focus:outline-none focus:border-red-500/50 resize-none" />
            <button onClick={scanCode} disabled={scanning || !code.trim()}
              className="w-full py-3 bg-red-600/20 border border-red-400/30 rounded-xl text-red-300 text-[13px] font-medium flex items-center justify-center gap-2 hover:bg-red-600/30 transition-colors disabled:opacity-50">
              {scanning ? <Loader2 size={14} className="animate-spin" /> : <Shield size={14} />}
              Scan for Vulnerabilities
            </button>
            {scanOutput && (
              <div className="bg-[#161b22] border border-white/[0.06] rounded-xl p-4 max-h-80 overflow-y-auto">
                <div className="text-[11px] text-white/40 mb-2">Scan Results</div>
                <pre className="text-[11px] text-white/70 whitespace-pre-wrap font-sans">{scanOutput}</pre>
              </div>
            )}
          </motion.div>
        )}

        {tab === "validate" && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
            <div className="bg-[#161b22] border border-white/[0.06] rounded-xl p-4">
              <div className="flex items-center gap-2 mb-1">
                <Lock size={13} className="text-orange-400" />
                <span className="text-[13px] font-medium">AIDefence Input Validator</span>
              </div>
              <p className="text-[11px] text-white/40">Detects prompt injection, SQL injection, XSS, path traversal, and other adversarial inputs in real time.</p>
            </div>
            <textarea value={validateInput} onChange={e => setValidateInput(e.target.value)} placeholder='Test any input: "Ignore previous instructions..." or "SELECT * FROM users WHERE..." etc.' rows={4} className="w-full bg-[#161b22] border border-white/[0.06] rounded-xl py-3 px-4 text-[13px] placeholder:text-white/30 focus:outline-none focus:border-orange-500/50 resize-none" />
            <button onClick={validateInputSecurity} disabled={validating || !validateInput.trim()}
              className="w-full py-3 bg-orange-600/20 border border-orange-400/30 rounded-xl text-orange-300 text-[13px] font-medium flex items-center justify-center gap-2 hover:bg-orange-600/30 transition-colors disabled:opacity-50">
              {validating ? <Loader2 size={14} className="animate-spin" /> : <Eye size={14} />}
              Validate Input
            </button>
            {validateResult && (
              <div className={cn("rounded-xl p-4 border", validateResult.safe ? "bg-green-500/10 border-green-400/20" : "bg-red-500/10 border-red-400/20")}>
                <div className="flex items-center gap-2 mb-2">
                  {validateResult.safe ? <CheckCircle2 size={16} className="text-green-400" /> : <XCircle size={16} className="text-red-400" />}
                  <span className={cn("text-[13px] font-medium", validateResult.safe ? "text-green-400" : "text-red-400")}>
                    {validateResult.safe ? "✅ Input is Safe" : "🚨 Threats Detected"}
                  </span>
                  <span className="ml-auto text-[11px] text-white/40">Safety Score: {(validateResult.score * 100).toFixed(0)}%</span>
                </div>
                {validateResult.threats.length > 0 && (
                  <div className="space-y-1">
                    {validateResult.threats.map((t, i) => (
                      <div key={i} className="text-[11px] text-red-300 bg-red-500/10 rounded px-2 py-1">⚠ {t}</div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </motion.div>
        )}

        {tab === "cve" && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
            <div className="flex gap-1.5 flex-wrap">
              {["all", "critical", "high", "medium", "low"].map(s => (
                <button key={s} onClick={() => { setCveFilter(s); fetchCves(); }} className={cn("px-2.5 py-1 rounded-full text-[10px] font-medium border uppercase transition-colors", cveFilter === s ? "bg-red-600/30 border-red-400/40 text-red-300" : "bg-white/5 border-white/10 text-white/50")}>
                  {s}
                </button>
              ))}
            </div>
            <div className="space-y-2">
              {cves.map(cve => (
                <div key={cve.id} className="bg-[#161b22] border border-white/[0.06] rounded-xl p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-[11px] text-white/70">{cve.id}</span>
                    <span className={cn("text-[9px] px-1.5 py-0.5 rounded border font-medium", SEVERITY_COLOR[cve.severity] ?? SEVERITY_COLOR.INFO)}>{cve.severity}</span>
                    <span className="text-[10px] text-white/30 ml-auto">CVSS: {cve.cvss}</span>
                  </div>
                  <p className="text-[12px] text-white/70">{cve.description}</p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="text-[10px] font-mono text-blue-300 bg-blue-500/10 px-1.5 py-0.5 rounded">{cve.package}</span>
                    <span className="text-[10px] text-white/30">{cve.version}</span>
                  </div>
                  <div className="mt-1.5 text-[11px] text-green-300 bg-green-500/10 px-2 py-1 rounded">✓ Fix: {cve.fix}</div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
