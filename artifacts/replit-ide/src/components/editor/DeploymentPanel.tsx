import { useState, useEffect } from "react";
import { Rocket, CheckCircle2, XCircle, Clock, Globe, RefreshCw, RotateCcw, ChevronRight, Circle, Zap, Shield, BarChart2, AlertTriangle } from "lucide-react";

type DeployStatus = "idle" | "building" | "deploying" | "live" | "failed" | "rolling-back";

interface Deployment {
  id: string;
  version: string;
  status: "live" | "success" | "failed" | "rolled-back";
  ts: number;
  duration: number;
  commit: string;
  branch: string;
  url?: string;
}

const HISTORY: Deployment[] = [
  { id: "d1", version: "v2.1.0", status: "live", ts: Date.now() - 120000, duration: 48, commit: "a1b2c3d", branch: "main", url: "https://my-project.replit.app" },
  { id: "d2", version: "v2.0.1", status: "success", ts: Date.now() - 3600000, duration: 52, commit: "e5f6a7b", branch: "main" },
  { id: "d3", version: "v2.0.0", status: "failed", ts: Date.now() - 7200000, duration: 31, commit: "c3d4e5f", branch: "main" },
  { id: "d4", version: "v1.9.2", status: "success", ts: Date.now() - 86400000, duration: 45, commit: "b8c9d0e", branch: "main" },
  { id: "d5", version: "v1.9.1", status: "rolled-back", ts: Date.now() - 172800000, duration: 41, commit: "d0e1f2a", branch: "main" },
];

const BUILD_STEPS = [
  { id: "install",  label: "Installing dependencies",  icon: "📦", duration: 1200 },
  { id: "build",    label: "Building project",          icon: "🔨", duration: 1800 },
  { id: "optimize", label: "Optimizing assets",         icon: "⚡", duration: 800 },
  { id: "upload",   label: "Uploading to edge",         icon: "☁️", duration: 1000 },
  { id: "routing",  label: "Configuring routing",       icon: "🌐", duration: 600 },
  { id: "health",   label: "Health checks passing",     icon: "✅", duration: 400 },
];

function formatTs(ts: number) {
  const diff = Date.now() - ts;
  if (diff < 60000) return "just now";
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return `${Math.floor(diff / 86400000)}d ago`;
}

export function DeploymentPanel() {
  const [status, setStatus] = useState<DeployStatus>("idle");
  const [currentStep, setCurrentStep] = useState(-1);
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());
  const [history, setHistory] = useState<Deployment[]>(HISTORY);
  const [tab, setTab] = useState<"overview" | "history" | "settings">("overview");
  const [rollingBack, setRollingBack] = useState<string | null>(null);

  const currentDeployment = history.find(d => d.status === "live");

  const startDeploy = async () => {
    setStatus("building");
    setCurrentStep(0);
    setCompletedSteps(new Set());

    for (let i = 0; i < BUILD_STEPS.length; i++) {
      setCurrentStep(i);
      await new Promise(r => setTimeout(r, BUILD_STEPS[i].duration));
      setCompletedSteps(prev => new Set([...prev, BUILD_STEPS[i].id]));
    }

    setStatus("live");
    const newDeploy: Deployment = {
      id: `d${Date.now()}`, version: "v2.2.0", status: "live",
      ts: Date.now(), duration: Math.round(BUILD_STEPS.reduce((a, s) => a + s.duration, 0) / 1000),
      commit: Math.random().toString(36).slice(2, 9), branch: "main",
      url: "https://my-project.replit.app"
    };
    setHistory(prev => [newDeploy, ...prev.map(d => d.status === "live" ? { ...d, status: "success" as const } : d)]);
    setTimeout(() => setStatus("idle"), 100);
  };

  const rollback = async (deployId: string) => {
    setRollingBack(deployId);
    await new Promise(r => setTimeout(r, 1800));
    setHistory(prev => prev.map(d => {
      if (d.id === deployId) return { ...d, status: "live" as const };
      if (d.status === "live") return { ...d, status: "rolled-back" as const };
      return d;
    }));
    setRollingBack(null);
  };

  const isDeploying = status === "building" || status === "deploying";

  return (
    <div className="flex flex-col h-full bg-[#0d1117] text-[#e6edf3]">
      <div className="flex items-center gap-2 px-3 py-2 border-b border-[#21262d] bg-[#161b22] shrink-0">
        <Rocket className="h-3.5 w-3.5 text-[#a371f7]" />
        <span className="text-[10px] font-semibold text-[#8b949e] uppercase tracking-widest flex-1">Deployment</span>
        {currentDeployment && (
          <span className="flex items-center gap-1 text-[9px] text-[#3fb950]">
            <Circle className="h-1.5 w-1.5 fill-[#3fb950]" /> Live
          </span>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center px-1 border-b border-[#21262d] shrink-0">
        {(["overview", "history", "settings"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-3 py-1.5 text-[10px] font-medium capitalize transition-colors ${tab === t ? "text-[#e6edf3] border-b-2 border-[#a371f7]" : "text-[#8b949e] hover:text-[#e6edf3]"}`}>
            {t}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto">
        {tab === "overview" && (
          <div className="p-3 space-y-3">
            {/* Live deployment card */}
            {currentDeployment && (
              <div className="rounded-lg border border-[#3fb950]/20 bg-[#3fb950]/5 p-3">
                <div className="flex items-center gap-2 mb-2">
                  <Circle className="h-2 w-2 fill-[#3fb950] text-[#3fb950] animate-pulse" />
                  <span className="text-xs font-semibold text-[#3fb950]">Live — {currentDeployment.version}</span>
                  <span className="ml-auto text-[10px] text-[#484f58]">{formatTs(currentDeployment.ts)}</span>
                </div>
                {currentDeployment.url && (
                  <a href={currentDeployment.url} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-[11px] text-[#58a6ff] hover:underline">
                    <Globe className="h-3 w-3" />{currentDeployment.url}
                  </a>
                )}
                <div className="flex items-center gap-2 mt-2 text-[10px] text-[#484f58]">
                  <span>commit: <span className="font-mono text-[#8b949e]">{currentDeployment.commit}</span></span>
                  <span>·</span>
                  <span>built in {currentDeployment.duration}s</span>
                </div>
              </div>
            )}

            {/* Stats row */}
            <div className="grid grid-cols-3 gap-2">
              {[
                { icon: <Zap className="h-3.5 w-3.5" />, label: "Avg build", value: "46s", color: "text-[#58a6ff]" },
                { icon: <Shield className="h-3.5 w-3.5" />, label: "Uptime", value: "99.9%", color: "text-[#3fb950]" },
                { icon: <BarChart2 className="h-3.5 w-3.5" />, label: "Requests", value: "1.2k/h", color: "text-[#a371f7]" },
              ].map(stat => (
                <div key={stat.label} className="flex flex-col items-center justify-center p-2 rounded bg-[#161b22] border border-[#21262d] gap-1">
                  <span className={stat.color}>{stat.icon}</span>
                  <span className="text-sm font-bold text-[#e6edf3]">{stat.value}</span>
                  <span className="text-[9px] text-[#484f58] text-center">{stat.label}</span>
                </div>
              ))}
            </div>

            {/* Deploy button */}
            <button
              onClick={startDeploy}
              disabled={isDeploying}
              className="w-full py-2.5 rounded bg-[#6e40c9] hover:bg-[#8957e5] disabled:bg-[#21262d] disabled:text-[#484f58] text-white text-sm font-medium transition-colors flex items-center justify-center gap-2">
              {isDeploying ? (
                <><div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Deploying…</>
              ) : (
                <><Rocket className="h-4 w-4" />Deploy to Production</>
              )}
            </button>

            {/* Build progress */}
            {isDeploying && (
              <div className="rounded-lg border border-[#21262d] bg-[#161b22] p-3 space-y-2">
                <p className="text-[10px] font-semibold text-[#8b949e] uppercase tracking-widest mb-2">Build Progress</p>
                {BUILD_STEPS.map((step, i) => {
                  const isDone = completedSteps.has(step.id);
                  const isCurrent = i === currentStep && !isDone;
                  return (
                    <div key={step.id} className="flex items-center gap-2.5 text-xs">
                      {isDone ? (
                        <CheckCircle2 className="h-3.5 w-3.5 text-[#3fb950] shrink-0" />
                      ) : isCurrent ? (
                        <div className="h-3.5 w-3.5 border-2 border-[#58a6ff]/30 border-t-[#58a6ff] rounded-full animate-spin shrink-0" />
                      ) : (
                        <Circle className="h-3.5 w-3.5 text-[#30363d] shrink-0" />
                      )}
                      <span className={isDone ? "text-[#3fb950]" : isCurrent ? "text-[#e6edf3]" : "text-[#484f58]"}>
                        {step.icon} {step.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {tab === "history" && (
          <div className="p-2 space-y-1.5">
            {history.map(deploy => (
              <div key={deploy.id}
                className={`rounded-lg border p-2.5 transition-colors ${
                  deploy.status === "live" ? "border-[#3fb950]/20 bg-[#3fb950]/5" :
                  deploy.status === "failed" ? "border-[#f85149]/20 bg-[#f85149]/5" :
                  "border-[#21262d] bg-[#161b22]"
                }`}>
                <div className="flex items-center gap-2">
                  {deploy.status === "live" && <CheckCircle2 className="h-3.5 w-3.5 text-[#3fb950] shrink-0" />}
                  {deploy.status === "success" && <CheckCircle2 className="h-3.5 w-3.5 text-[#58a6ff] shrink-0" />}
                  {deploy.status === "failed" && <XCircle className="h-3.5 w-3.5 text-[#f85149] shrink-0" />}
                  {deploy.status === "rolled-back" && <RotateCcw className="h-3.5 w-3.5 text-[#d29922] shrink-0" />}
                  <span className="text-xs font-medium flex-1">{deploy.version}</span>
                  <span className={`text-[9px] px-1.5 py-0.5 rounded border ${
                    deploy.status === "live" ? "text-[#3fb950] bg-[#3fb950]/10 border-[#3fb950]/20" :
                    deploy.status === "failed" ? "text-[#f85149] bg-[#f85149]/10 border-[#f85149]/20" :
                    deploy.status === "rolled-back" ? "text-[#d29922] bg-[#d29922]/10 border-[#d29922]/20" :
                    "text-[#8b949e] bg-[#21262d] border-[#30363d]"
                  }`}>{deploy.status}</span>
                </div>
                <div className="flex items-center gap-3 mt-1.5 text-[10px] text-[#484f58]">
                  <span className="font-mono">{deploy.commit}</span>
                  <span>{deploy.branch}</span>
                  <span>{formatTs(deploy.ts)}</span>
                  <span>{deploy.duration}s</span>
                </div>
                {deploy.status !== "live" && deploy.status !== "failed" && (
                  <button
                    onClick={() => rollback(deploy.id)}
                    disabled={rollingBack !== null}
                    className="mt-2 flex items-center gap-1 text-[10px] text-[#8b949e] hover:text-[#d29922] transition-colors disabled:opacity-50">
                    {rollingBack === deploy.id ? (
                      <><RefreshCw className="h-3 w-3 animate-spin" /> Rolling back…</>
                    ) : (
                      <><RotateCcw className="h-3 w-3" /> Rollback to this</>
                    )}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {tab === "settings" && (
          <div className="p-3 space-y-4">
            {[
              { label: "Production URL", value: "https://my-project.replit.app", editable: false },
              { label: "Auto-deploy on push", value: "Enabled", toggle: true },
              { label: "Deploy branch", value: "main", editable: true },
              { label: "Build command", value: "pnpm build", editable: true },
              { label: "Output directory", value: "dist", editable: true },
            ].map(setting => (
              <div key={setting.label}>
                <p className="text-[10px] text-[#8b949e] mb-1">{setting.label}</p>
                {setting.toggle ? (
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-[#3fb950]">{setting.value}</span>
                    <div className="h-5 w-9 rounded-full bg-[#238636] relative cursor-pointer">
                      <div className="absolute right-0.5 top-0.5 h-4 w-4 rounded-full bg-white" />
                    </div>
                  </div>
                ) : (
                  <input defaultValue={setting.value} readOnly={!setting.editable}
                    className="w-full bg-[#21262d] border border-[#30363d] rounded px-2 py-1.5 text-xs text-[#e6edf3] outline-none focus:border-[#58a6ff] transition-colors read-only:text-[#8b949e] font-mono" />
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
