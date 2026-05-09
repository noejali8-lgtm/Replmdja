import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, ChevronLeft, ChevronRight, Rocket, Globe, Check,
  Plus, Trash2, Loader2, Server, Zap, Shield, CheckCircle2,
  Terminal
} from "lucide-react";
import { cn } from "@/lib/utils";

type Step = "region" | "env" | "launch";

const REGIONS = [
  { id: "us-east", label: "US East", sublabel: "Virginia · N. America", flag: "🇺🇸", latency: "~12ms", servers: 8 },
  { id: "us-west", label: "US West", sublabel: "Oregon · N. America", flag: "🇺🇸", latency: "~28ms", servers: 4 },
  { id: "eu-west", label: "EU West", sublabel: "Frankfurt · Europe", flag: "🇩🇪", latency: "~85ms", servers: 6 },
  { id: "ap-south", label: "Asia Pacific", sublabel: "Singapore · Asia", flag: "🇸🇬", latency: "~145ms", servers: 4 },
];

const DEPLOY_LOG_STEPS = [
  { delay: 0,    text: "Initializing deployment pipeline…",        ok: false },
  { delay: 600,  text: "Building Docker image…",                   ok: false },
  { delay: 1400, text: "Running security scan…",                   ok: false },
  { delay: 2000, text: "Pushing image to registry…",               ok: false },
  { delay: 2800, text: "Allocating compute resources…",            ok: false },
  { delay: 3400, text: "Provisioning load balancer…",              ok: false },
  { delay: 4000, text: "Injecting environment variables…",         ok: false },
  { delay: 4600, text: "Applying health check configuration…",     ok: false },
  { delay: 5200, text: "Starting container replicas (3/3)…",       ok: false },
  { delay: 6000, text: "Running smoke tests…",                     ok: false },
  { delay: 6800, text: "Warming CDN edge nodes…",                  ok: false },
  { delay: 7400, text: "Deployment complete.",                      ok: true  },
];

interface EnvVar { key: string; value: string; }

interface DeploySheetProps {
  onClose: () => void;
}

export function DeploySheet({ onClose }: DeploySheetProps) {
  const [step, setStep] = useState<Step>("region");
  const [selectedRegion, setSelectedRegion] = useState("us-east");
  const [envVars, setEnvVars] = useState<EnvVar[]>([
    { key: "NODE_ENV", value: "production" },
    { key: "PORT", value: "8080" },
  ]);
  const [launching, setLaunching] = useState(false);
  const [logLines, setLogLines] = useState<{ text: string; ok: boolean; done: boolean }[]>([]);
  const [deployDone, setDeployDone] = useState(false);
  const logEndRef = useRef<HTMLDivElement>(null);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logLines]);

  useEffect(() => () => timersRef.current.forEach(clearTimeout), []);

  function addEnvVar() {
    setEnvVars(prev => [...prev, { key: "", value: "" }]);
  }

  function removeEnvVar(i: number) {
    setEnvVars(prev => prev.filter((_, idx) => idx !== i));
  }

  function updateEnvVar(i: number, field: "key" | "value", val: string) {
    setEnvVars(prev => prev.map((e, idx) => idx === i ? { ...e, [field]: val } : e));
  }

  function startLaunch() {
    setLaunching(true);
    setStep("launch");
    setLogLines([]);
    setDeployDone(false);

    DEPLOY_LOG_STEPS.forEach((s, i) => {
      const t = setTimeout(() => {
        setLogLines(prev => [...prev, { text: s.text, ok: s.ok, done: true }]);
        if (i === DEPLOY_LOG_STEPS.length - 1) setDeployDone(true);
      }, s.delay);
      timersRef.current.push(t);
    });
  }

  const region = REGIONS.find(r => r.id === selectedRegion)!;
  const STEPS: { id: Step; label: string }[] = [
    { id: "region", label: "Region" },
    { id: "env", label: "Env Vars" },
    { id: "launch", label: "Launch" },
  ];
  const stepIdx = STEPS.findIndex(s => s.id === step);

  return (
    <motion.div
      initial={{ y: "100%" }}
      animate={{ y: 0 }}
      exit={{ y: "100%" }}
      transition={{ type: "spring", stiffness: 350, damping: 36 }}
      className="absolute inset-0 z-50 flex flex-col bg-[#0d1117]"
    >
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-safe pt-10 pb-3 border-b border-white/[0.08] shrink-0">
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg hover:bg-white/5 text-white/50 hover:text-white transition-colors"
        >
          <ChevronLeft size={20} />
        </button>
        <div className="flex items-center gap-2 flex-1">
          <Rocket size={16} className="text-blue-400" />
          <span className="font-semibold">Deploy</span>
        </div>
        <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/5 text-white/40">
          <X size={18} />
        </button>
      </div>

      {/* Step indicators */}
      <div className="px-4 py-3 border-b border-white/[0.06] shrink-0">
        <div className="flex items-center gap-2">
          {STEPS.map((s, i) => (
            <div key={s.id} className="flex items-center gap-2 flex-1">
              <div className={cn(
                "w-6 h-6 rounded-full border flex items-center justify-center text-[11px] font-bold transition-all shrink-0",
                i < stepIdx
                  ? "bg-green-500 border-green-400 text-white"
                  : i === stepIdx
                  ? "bg-blue-500/20 border-blue-400 text-blue-300"
                  : "bg-white/5 border-white/10 text-white/30"
              )}>
                {i < stepIdx ? <Check size={10} /> : i + 1}
              </div>
              <span className={cn(
                "text-[11px] font-medium transition-colors",
                i === stepIdx ? "text-white" : i < stepIdx ? "text-green-400" : "text-white/30"
              )}>
                {s.label}
              </span>
              {i < STEPS.length - 1 && (
                <div className={cn("h-px flex-1 transition-colors", i < stepIdx ? "bg-green-500/40" : "bg-white/10")} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">

          {/* Step 1: Region */}
          {step === "region" && (
            <motion.div key="region" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
              className="px-4 py-5 space-y-3">
              <div className="mb-4">
                <h2 className="text-[15px] font-semibold">Choose deployment region</h2>
                <p className="text-[12px] text-white/40 mt-1">Select where your app will be hosted. You can add more regions after deploying.</p>
              </div>
              {REGIONS.map(r => (
                <button
                  key={r.id}
                  onClick={() => setSelectedRegion(r.id)}
                  className={cn(
                    "w-full flex items-center gap-3 p-3.5 rounded-xl border text-left transition-all",
                    selectedRegion === r.id
                      ? "bg-blue-500/10 border-blue-400/40"
                      : "bg-[#161b22] border-white/[0.06] hover:border-white/[0.12]"
                  )}
                >
                  <span className="text-2xl shrink-0">{r.flag}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={cn("text-[13px] font-semibold", selectedRegion === r.id ? "text-blue-300" : "text-white")}>{r.label}</span>
                      <span className="text-[10px] text-white/30">{r.sublabel}</span>
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-[10px] text-green-400">⚡ {r.latency}</span>
                      <span className="text-[10px] text-white/30">{r.servers} servers</span>
                    </div>
                  </div>
                  <div className={cn(
                    "w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center transition-all",
                    selectedRegion === r.id ? "bg-blue-400 border-blue-400" : "border-white/20"
                  )}>
                    {selectedRegion === r.id && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                  </div>
                </button>
              ))}

              {/* Extras */}
              <div className="grid grid-cols-3 gap-2 mt-2">
                {[
                  { icon: Zap, label: "Auto-scale", desc: "Up to 100× on demand", color: "text-yellow-400" },
                  { icon: Shield, label: "DDoS protect", desc: "Included free", color: "text-green-400" },
                  { icon: Globe, label: "CDN", desc: "280+ edge nodes", color: "text-blue-400" },
                ].map(({ icon: Icon, label, desc, color }) => (
                  <div key={label} className="bg-[#161b22] border border-white/[0.06] rounded-xl p-2.5 text-center">
                    <Icon size={14} className={cn("mx-auto mb-1", color)} />
                    <div className="text-[10px] font-semibold text-white/70">{label}</div>
                    <div className="text-[9px] text-white/35 mt-0.5">{desc}</div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Step 2: Env vars */}
          {step === "env" && (
            <motion.div key="env" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
              className="px-4 py-5 space-y-3">
              <div className="mb-4">
                <h2 className="text-[15px] font-semibold">Environment variables</h2>
                <p className="text-[12px] text-white/40 mt-1">These will be injected securely into your deployment. Values are encrypted at rest.</p>
              </div>

              <div className="space-y-2">
                {envVars.map((ev, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input
                      value={ev.key}
                      onChange={e => updateEnvVar(i, "key", e.target.value)}
                      placeholder="KEY"
                      className="flex-1 bg-[#161b22] border border-white/[0.08] rounded-lg px-3 py-2 text-[12px] font-mono placeholder:text-white/20 focus:outline-none focus:border-purple-500/40 text-white/80"
                    />
                    <input
                      value={ev.value}
                      onChange={e => updateEnvVar(i, "value", e.target.value)}
                      placeholder="value"
                      type={ev.key.toLowerCase().includes("secret") || ev.key.toLowerCase().includes("key") || ev.key.toLowerCase().includes("token") ? "password" : "text"}
                      className="flex-1 bg-[#161b22] border border-white/[0.08] rounded-lg px-3 py-2 text-[12px] font-mono placeholder:text-white/20 focus:outline-none focus:border-purple-500/40 text-white/80"
                    />
                    <button
                      onClick={() => removeEnvVar(i)}
                      className="w-8 h-8 flex items-center justify-center text-white/25 hover:text-red-400 transition-colors shrink-0"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>

              <button
                onClick={addEnvVar}
                className="w-full py-2.5 bg-[#161b22] border border-dashed border-white/[0.12] rounded-xl text-white/40 text-[12px] flex items-center justify-center gap-1.5 hover:border-white/20 hover:text-white/60 transition-colors"
              >
                <Plus size={12} />
                Add variable
              </button>

              <div className="bg-[#161b22] border border-white/[0.06] rounded-xl p-3 flex items-start gap-2.5">
                <Shield size={14} className="text-green-400 shrink-0 mt-0.5" />
                <p className="text-[11px] text-white/40 leading-relaxed">
                  All secret values are AES-256 encrypted and never exposed in logs or build output.
                </p>
              </div>
            </motion.div>
          )}

          {/* Step 3: Launch */}
          {step === "launch" && (
            <motion.div key="launch" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
              className="px-4 py-5 space-y-4">
              {!launching && (
                <div className="space-y-4">
                  <div className="mb-4">
                    <h2 className="text-[15px] font-semibold">Confirm deployment</h2>
                    <p className="text-[12px] text-white/40 mt-1">Review your configuration before launching.</p>
                  </div>
                  <div className="bg-[#161b22] border border-white/[0.06] rounded-xl divide-y divide-white/[0.05]">
                    <div className="flex items-center justify-between px-4 py-3">
                      <span className="text-[12px] text-white/50">Region</span>
                      <span className="text-[12px] font-medium">{region.flag} {region.label}</span>
                    </div>
                    <div className="flex items-center justify-between px-4 py-3">
                      <span className="text-[12px] text-white/50">Latency</span>
                      <span className="text-[12px] text-green-400">{region.latency}</span>
                    </div>
                    <div className="flex items-center justify-between px-4 py-3">
                      <span className="text-[12px] text-white/50">Servers</span>
                      <span className="text-[12px]">{region.servers} nodes</span>
                    </div>
                    <div className="flex items-center justify-between px-4 py-3">
                      <span className="text-[12px] text-white/50">Env vars</span>
                      <span className="text-[12px]">{envVars.filter(e => e.key.trim()).length} configured</span>
                    </div>
                    <div className="flex items-center justify-between px-4 py-3">
                      <span className="text-[12px] text-white/50">Scale</span>
                      <span className="text-[12px]">Auto (0 → 100×)</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Terminal log */}
              {(launching || step === "launch") && logLines.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Terminal size={12} className="text-white/40" />
                    <span className="text-[10px] text-white/40 font-mono">deploy log</span>
                    {!deployDone && launching && (
                      <Loader2 size={10} className="text-purple-400 animate-spin ml-auto" />
                    )}
                    {deployDone && <CheckCircle2 size={10} className="text-green-400 ml-auto" />}
                  </div>
                  <div className="bg-[#0a0e14] border border-white/[0.07] rounded-xl p-3 font-mono text-[10.5px] space-y-1 max-h-64 overflow-y-auto">
                    {logLines.map((line, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -4 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-start gap-2"
                      >
                        {line.ok ? (
                          <CheckCircle2 size={10} className="text-green-400 shrink-0 mt-0.5" />
                        ) : (
                          <span className="w-2 h-2 rounded-full bg-blue-400/60 shrink-0 mt-1 animate-pulse" />
                        )}
                        <span className={line.ok ? "text-green-300 font-semibold" : "text-white/60"}>{line.text}</span>
                      </motion.div>
                    ))}
                    <div ref={logEndRef} />
                  </div>
                </div>
              )}

              {/* Success */}
              {deployDone && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-green-500/8 border border-green-400/25 rounded-2xl p-5 text-center space-y-2"
                >
                  <div className="w-12 h-12 rounded-2xl bg-green-500/15 border border-green-400/30 flex items-center justify-center mx-auto">
                    <Rocket size={22} className="text-green-400" />
                  </div>
                  <p className="text-[15px] font-bold text-green-300">Deployed!</p>
                  <p className="text-[11px] text-white/40">Your app is live on {region.label}</p>
                  <div className="bg-[#0d1117] border border-white/[0.08] rounded-xl px-3 py-2 font-mono text-[11px] text-blue-400">
                    https://your-app.replit.app
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer navigation */}
      <div className="shrink-0 px-4 py-3 border-t border-white/[0.07] bg-[#0d1117]">
        {step === "region" && (
          <button
            onClick={() => setStep("env")}
            className="w-full py-3 bg-blue-600/20 border border-blue-400/30 rounded-xl text-blue-300 text-[14px] font-semibold flex items-center justify-center gap-2 hover:bg-blue-600/30 transition-colors"
          >
            Continue <ChevronRight size={15} />
          </button>
        )}
        {step === "env" && (
          <div className="flex gap-2">
            <button
              onClick={() => setStep("region")}
              className="flex-1 py-3 bg-white/5 border border-white/10 rounded-xl text-white/60 text-[13px] font-medium hover:bg-white/8 transition-colors"
            >
              Back
            </button>
            <button
              onClick={() => setStep("launch")}
              className="flex-1 py-3 bg-blue-600/20 border border-blue-400/30 rounded-xl text-blue-300 text-[14px] font-semibold flex items-center justify-center gap-2 hover:bg-blue-600/30 transition-colors"
            >
              Review <ChevronRight size={15} />
            </button>
          </div>
        )}
        {step === "launch" && !deployDone && (
          <div className="flex gap-2">
            {!launching && (
              <button
                onClick={() => setStep("env")}
                className="flex-[0.5] py-3 bg-white/5 border border-white/10 rounded-xl text-white/60 text-[13px] font-medium hover:bg-white/8 transition-colors"
              >
                Back
              </button>
            )}
            <button
              onClick={startLaunch}
              disabled={launching}
              className={cn(
                "flex-1 py-3 rounded-xl text-[14px] font-bold flex items-center justify-center gap-2 transition-all",
                launching
                  ? "bg-purple-600/20 border border-purple-400/30 text-purple-300 cursor-wait"
                  : "bg-gradient-to-r from-blue-600/40 to-purple-600/40 border border-blue-400/40 text-white hover:from-blue-600/50 hover:to-purple-600/50"
              )}
            >
              {launching ? (
                <><Loader2 size={14} className="animate-spin" /> Deploying…</>
              ) : (
                <><Rocket size={14} /> Launch</>
              )}
            </button>
          </div>
        )}
        {deployDone && (
          <button
            onClick={onClose}
            className="w-full py-3 bg-green-600/20 border border-green-400/30 rounded-xl text-green-300 text-[14px] font-semibold hover:bg-green-600/30 transition-colors"
          >
            Done
          </button>
        )}
      </div>
    </motion.div>
  );
}
