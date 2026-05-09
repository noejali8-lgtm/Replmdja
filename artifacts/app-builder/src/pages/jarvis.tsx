import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "wouter";
import {
  ArrowLeft, Mic, MicOff, MessageSquare, Zap, Globe, Mail,
  Camera, Monitor, Folder, Brain, Clock, Shield, Wifi, Cpu,
  Activity, Eye, Volume2, VolumeX, ChevronRight, Play,
  Square, RotateCcw, Check, AlertTriangle, Info
} from "lucide-react";
import { cn } from "@/lib/utils";

const BASE_URL = import.meta.env.BASE_URL?.replace(/\/$/, "") || "";

/* ── Arc Reactor Rings ── */
function ArcReactor({ active }: { active: boolean }) {
  return (
    <div className="relative w-32 h-32 flex items-center justify-center">
      {/* Outer glow */}
      {active && (
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{ boxShadow: "0 0 40px 16px rgba(56,189,248,0.25)" }}
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      )}
      {/* Ring 3 */}
      <motion.div
        className={cn(
          "absolute inset-0 rounded-full border-2",
          active ? "border-sky-400/40" : "border-white/10"
        )}
        animate={active ? { rotate: 360 } : {}}
        transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
      />
      {/* Ring 2 */}
      <motion.div
        className={cn(
          "absolute inset-4 rounded-full border-2",
          active ? "border-cyan-300/60" : "border-white/10"
        )}
        animate={active ? { rotate: -360 } : {}}
        transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
      />
      {/* Ring 1 */}
      <motion.div
        className={cn(
          "absolute inset-8 rounded-full border-2",
          active ? "border-sky-200/80" : "border-white/10"
        )}
        animate={active ? { rotate: 360 } : {}}
        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
      />
      {/* Core */}
      <motion.div
        className={cn(
          "w-12 h-12 rounded-full flex items-center justify-center border-2",
          active
            ? "bg-sky-400/20 border-sky-300 shadow-[0_0_24px_rgba(56,189,248,0.6)]"
            : "bg-white/5 border-white/20"
        )}
        animate={active ? { scale: [1, 1.08, 1] } : { scale: 1 }}
        transition={{ duration: 1.5, repeat: Infinity }}
      >
        <Zap size={20} className={active ? "text-sky-300" : "text-white/30"} />
      </motion.div>
    </div>
  );
}

/* ── Telemetry Bar ── */
function TelemetryBar({ label, value, color = "bg-sky-400" }: { label: string; value: number; color?: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] text-white/40 w-14 shrink-0 font-mono">{label}</span>
      <div className="flex-1 h-1 bg-white/[0.07] rounded-full overflow-hidden">
        <motion.div
          className={cn("h-full rounded-full", color)}
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 1.2, ease: "easeOut" }}
        />
      </div>
      <span className="text-[10px] text-white/40 font-mono w-8 text-right">{value}%</span>
    </div>
  );
}

/* ── Skill Card ── */
interface Skill {
  icon: React.ReactNode;
  label: string;
  desc: string;
  status: "ready" | "active" | "offline";
  category: string;
  color: string;
  bg: string;
  border: string;
}

function SkillCard({ skill, index }: { skill: Skill; index: number }) {
  const [hover, setHover] = useState(false);
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06 }}
      onHoverStart={() => setHover(true)}
      onHoverEnd={() => setHover(false)}
      whileTap={{ scale: 0.97 }}
      className={cn(
        "relative flex flex-col gap-2 p-3 rounded-2xl border transition-all cursor-pointer select-none",
        skill.bg, skill.border,
        hover ? "brightness-125" : ""
      )}
    >
      {/* Status dot */}
      <div className={cn("absolute top-2.5 right-2.5 w-1.5 h-1.5 rounded-full", {
        "bg-green-400": skill.status === "ready",
        "bg-sky-400 animate-pulse": skill.status === "active",
        "bg-white/20": skill.status === "offline",
      })} />

      <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center border shrink-0", skill.bg, skill.border)}>
        <span className={skill.color}>{skill.icon}</span>
      </div>
      <div>
        <p className={cn("text-[11px] font-semibold leading-tight", skill.color)}>{skill.label}</p>
        <p className="text-[9px] text-white/30 mt-0.5 leading-tight">{skill.desc}</p>
      </div>
    </motion.div>
  );
}

/* ── HUD Log Line ── */
function LogLine({ text, type = "info", delay = 0 }: { text: string; type?: "info" | "warn" | "ok" | "err"; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -6 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay }}
      className="flex items-start gap-2 text-[10px] font-mono"
    >
      <span className={cn("shrink-0 mt-0.5", {
        "text-sky-400": type === "info",
        "text-yellow-400": type === "warn",
        "text-green-400": type === "ok",
        "text-red-400": type === "err",
      })}>
        {type === "info" && <Info size={9} />}
        {type === "warn" && <AlertTriangle size={9} />}
        {type === "ok" && <Check size={9} />}
        {type === "err" && <Square size={9} />}
      </span>
      <span className="text-white/40 leading-tight">{text}</span>
    </motion.div>
  );
}

/* ── Chat bubble ── */
function ChatBubble({ role, text }: { role: "user" | "jarvis"; text: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn("flex gap-2", role === "user" ? "flex-row-reverse" : "flex-row")}
    >
      {role === "jarvis" && (
        <div className="w-7 h-7 rounded-full bg-sky-500/20 border border-sky-400/40 flex items-center justify-center shrink-0 mt-0.5">
          <Zap size={12} className="text-sky-400" />
        </div>
      )}
      <div className={cn(
        "max-w-[80%] px-3 py-2 rounded-2xl text-xs leading-relaxed",
        role === "user"
          ? "bg-white/[0.08] border border-white/[0.10] text-white/80 rounded-tr-sm"
          : "bg-sky-500/10 border border-sky-400/20 text-sky-200 rounded-tl-sm"
      )}>
        {text}
      </div>
    </motion.div>
  );
}

/* ── JARVIS Page ── */

const SKILLS: Skill[] = [
  // Web & Comms
  { icon: <Globe size={16} />, label: "Web Search", desc: "DuckDuckGo · Google · Scraper", status: "ready", category: "web", color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-400/20" },
  { icon: <Mail size={16} />, label: "Email", desc: "Send · Read · Draft", status: "ready", category: "web", color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-400/20" },
  { icon: <MessageSquare size={16} />, label: "WhatsApp", desc: "Message · Voice notes", status: "offline", category: "web", color: "text-green-400", bg: "bg-green-500/10", border: "border-green-400/20" },
  { icon: <Wifi size={16} />, label: "API Calls", desc: "REST · GraphQL · Webhooks", status: "ready", category: "web", color: "text-violet-400", bg: "bg-violet-500/10", border: "border-violet-400/20" },
  // Vision & Sensing
  { icon: <Camera size={16} />, label: "Camera", desc: "Live feed · Snapshot", status: "ready", category: "vision", color: "text-pink-400", bg: "bg-pink-500/10", border: "border-pink-400/20" },
  { icon: <Eye size={16} />, label: "YOLO Vision", desc: "Object detection · OCR", status: "active", category: "vision", color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-400/20" },
  { icon: <Monitor size={16} />, label: "Screenshot", desc: "Capture · Annotate · Diff", status: "ready", category: "vision", color: "text-cyan-400", bg: "bg-cyan-500/10", border: "border-cyan-400/20" },
  { icon: <Activity size={16} />, label: "Screen Watch", desc: "Monitor UI · Auto-click", status: "offline", category: "vision", color: "text-rose-400", bg: "bg-rose-500/10", border: "border-rose-400/20" },
  // System & Files
  { icon: <Cpu size={16} />, label: "System Control", desc: "Processes · CPU · RAM", status: "ready", category: "system", color: "text-lime-400", bg: "bg-lime-500/10", border: "border-lime-400/20" },
  { icon: <Folder size={16} />, label: "File Ops", desc: "Read · Write · Watch", status: "ready", category: "system", color: "text-orange-400", bg: "bg-orange-500/10", border: "border-orange-400/20" },
  { icon: <Brain size={16} />, label: "Long Memory", desc: "HNSW vector store", status: "active", category: "system", color: "text-purple-400", bg: "bg-purple-500/10", border: "border-purple-400/20" },
  { icon: <Clock size={16} />, label: "Datetime", desc: "Scheduler · Alarms · Cron", status: "ready", category: "system", color: "text-teal-400", bg: "bg-teal-500/10", border: "border-teal-400/20" },
  { icon: <Shield size={16} />, label: "Security", desc: "Auth · Sandboxing · Audit", status: "ready", category: "system", color: "text-red-400", bg: "bg-red-500/10", border: "border-red-400/20" },
  { icon: <Volume2 size={16} />, label: "TTS / STT", desc: "Whisper · ElevenLabs · Edge", status: "ready", category: "system", color: "text-sky-400", bg: "bg-sky-500/10", border: "border-sky-400/20" },
];

const DEMO_CHAT: Array<{ role: "user" | "jarvis"; text: string }> = [
  { role: "user", text: "Jarvis, what's my CPU usage and who sent me emails today?" },
  { role: "jarvis", text: "CPU at 34% — all cores nominal. You have 7 unread emails: 3 from GitHub notifications, 2 newsletters, and 1 from Sarah about the design review at 3pm. Want me to draft a reply?" },
  { role: "user", text: "Yes, confirm I'll be there and attach the latest screenshot of the dashboard." },
  { role: "jarvis", text: "Done — screenshot captured, annotated the new chart section, and sent to Sarah. Reply logged in memory. Anything else?" },
];

const LOG_LINES = [
  { text: "JARVIS v4.1.0 — boot complete", type: "ok" as const, delay: 0 },
  { text: "Loading skill modules: 14/14", type: "ok" as const, delay: 0.1 },
  { text: "YOLO v8 — object detector ready", type: "ok" as const, delay: 0.2 },
  { text: "Long-term memory: 3,847 facts indexed", type: "info" as const, delay: 0.3 },
  { text: "WhatsApp bridge: offline (token expired)", type: "warn" as const, delay: 0.4 },
  { text: "Screen watcher: offline (permission needed)", type: "warn" as const, delay: 0.5 },
  { text: "Listening on TCP :7474", type: "ok" as const, delay: 0.6 },
];

const CATEGORIES = [
  { id: "all", label: "All" },
  { id: "web", label: "Web & Comms" },
  { id: "vision", label: "Vision" },
  { id: "system", label: "System" },
];

export default function JarvisPage() {
  const [active, setActive] = useState(false);
  const [mode, setMode] = useState<"text" | "voice">("text");
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState(DEMO_CHAT);
  const [cat, setCat] = useState("all");
  const [telemetry, setTelemetry] = useState({ cpu: 34, mem: 61, net: 22, gpu: 47 });
  const [muted, setMuted] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  /* Animate telemetry */
  useEffect(() => {
    if (!active) return;
    const interval = setInterval(() => {
      setTelemetry({
        cpu: Math.min(95, Math.max(10, telemetry.cpu + (Math.random() - 0.5) * 8)),
        mem: Math.min(95, Math.max(30, telemetry.mem + (Math.random() - 0.5) * 4)),
        net: Math.min(90, Math.max(5, telemetry.net + (Math.random() - 0.5) * 12)),
        gpu: Math.min(90, Math.max(15, telemetry.gpu + (Math.random() - 0.5) * 6)),
      });
    }, 1800);
    return () => clearInterval(interval);
  }, [active, telemetry]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const filteredSkills = cat === "all" ? SKILLS : SKILLS.filter(s => s.category === cat);

  const handleSend = () => {
    const text = input.trim();
    if (!text) return;
    setMessages(prev => [
      ...prev,
      { role: "user", text },
      { role: "jarvis", text: "Understood — processing your request now. I'll handle that right away and confirm once done." }
    ]);
    setInput("");
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="relative flex flex-col min-h-[100dvh] max-w-[480px] mx-auto w-full bg-[#030712] overflow-hidden"
    >
      {/* ── Background grid ── */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute inset-0"
          style={{
            backgroundImage: "linear-gradient(rgba(56,189,248,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(56,189,248,0.04) 1px, transparent 1px)",
            backgroundSize: "32px 32px"
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#030712]" />
      </div>

      {/* ── Header ── */}
      <div className="relative z-10 flex items-center px-4 pt-12 pb-4 shrink-0">
        <Link href="/">
          <button className="w-9 h-9 flex items-center justify-center text-white/40 hover:text-white rounded-xl hover:bg-white/8 transition-colors">
            <ArrowLeft size={20} />
          </button>
        </Link>

        <div className="flex-1 text-center">
          <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-sky-400/70">J.A.R.V.I.S</p>
          <p className="text-base font-bold text-white leading-tight">AI Assistant</p>
        </div>

        <button
          onClick={() => setMuted(v => !v)}
          className="w-9 h-9 flex items-center justify-center text-white/40 hover:text-white rounded-xl hover:bg-white/8 transition-colors"
        >
          {muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
        </button>
      </div>

      {/* ── Arc Reactor + Status ── */}
      <div className="relative z-10 flex flex-col items-center gap-4 py-4 shrink-0">
        <ArcReactor active={active} />

        <div className="flex flex-col items-center gap-1.5">
          <div className="flex items-center gap-2">
            <div className={cn("w-2 h-2 rounded-full", active ? "bg-sky-400 animate-pulse" : "bg-white/20")} />
            <span className="text-sm font-semibold text-white">
              {active ? "JARVIS Online" : "JARVIS Standby"}
            </span>
          </div>
          <p className="text-[11px] text-white/35 text-center px-8">
            {active
              ? "All systems nominal · 12 skills active · Listening"
              : "Tap the button below to activate"}
          </p>
        </div>

        {/* Power Toggle */}
        <motion.button
          whileTap={{ scale: 0.94 }}
          onClick={() => setActive(v => !v)}
          className={cn(
            "px-6 py-2.5 rounded-2xl font-semibold text-sm border transition-all flex items-center gap-2",
            active
              ? "bg-red-500/15 border-red-400/40 text-red-300 hover:bg-red-500/25"
              : "bg-sky-500/15 border-sky-400/40 text-sky-300 hover:bg-sky-500/25"
          )}
        >
          {active ? <Square size={14} /> : <Play size={14} />}
          {active ? "Deactivate" : "Activate"}
        </motion.button>
      </div>

      {/* ── Mode switcher ── */}
      <div className="relative z-10 flex items-center justify-center gap-1 px-4 pb-3 shrink-0">
        {(["text", "voice"] as const).map(m => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={cn(
              "flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-[11px] font-semibold border transition-all",
              mode === m
                ? "bg-sky-500/20 border-sky-400/40 text-sky-300"
                : "bg-transparent border-white/10 text-white/35 hover:text-white/60"
            )}
          >
            {m === "text" ? <MessageSquare size={11} /> : <Mic size={11} />}
            {m === "text" ? "Text" : "Voice"}
          </button>
        ))}
      </div>

      {/* ── Telemetry ── */}
      <AnimatePresence>
        {active && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="relative z-10 mx-4 mb-3 px-4 py-3 bg-white/[0.03] border border-sky-400/10 rounded-2xl shrink-0 overflow-hidden"
          >
            <p className="text-[9px] font-mono uppercase tracking-widest text-sky-400/50 mb-2">System Telemetry</p>
            <div className="space-y-1.5">
              <TelemetryBar label="CPU" value={Math.round(telemetry.cpu)} color="bg-sky-400" />
              <TelemetryBar label="MEMORY" value={Math.round(telemetry.mem)} color="bg-violet-400" />
              <TelemetryBar label="NETWORK" value={Math.round(telemetry.net)} color="bg-emerald-400" />
              <TelemetryBar label="GPU" value={Math.round(telemetry.gpu)} color="bg-amber-400" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Main content — scrollable ── */}
      <div className="relative z-10 flex-1 overflow-y-auto px-4 pb-6 space-y-4 no-scrollbar">

        {/* Boot log */}
        <div className="bg-black/40 border border-sky-400/10 rounded-2xl px-4 py-3">
          <p className="text-[9px] font-mono uppercase tracking-widest text-sky-400/40 mb-2">Boot Log</p>
          <div className="space-y-1.5">
            {LOG_LINES.map((l, i) => (
              <LogLine key={i} text={l.text} type={l.type} delay={l.delay} />
            ))}
          </div>
        </div>

        {/* Skills grid */}
        <div>
          <div className="flex items-center justify-between mb-2.5">
            <p className="text-[11px] font-semibold text-white/60 uppercase tracking-widest">Skills</p>
            <div className="flex gap-1">
              {CATEGORIES.map(c => (
                <button
                  key={c.id}
                  onClick={() => setCat(c.id)}
                  className={cn(
                    "text-[9px] font-semibold px-2 py-1 rounded-lg border transition-all",
                    cat === c.id
                      ? "bg-sky-500/20 border-sky-400/40 text-sky-300"
                      : "bg-transparent border-white/[0.08] text-white/30 hover:text-white/60"
                  )}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-1.5">
            {filteredSkills.map((skill, i) => (
              <SkillCard key={skill.label} skill={skill} index={i} />
            ))}
          </div>
        </div>

        {/* Demo chat */}
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-white/[0.06]">
            <div className={cn("w-2 h-2 rounded-full", active ? "bg-sky-400 animate-pulse" : "bg-white/20")} />
            <p className="text-[11px] font-semibold text-white/50">Live Chat</p>
          </div>

          <div className="px-4 py-3 space-y-3 max-h-56 overflow-y-auto no-scrollbar">
            {messages.map((m, i) => (
              <ChatBubble key={i} role={m.role} text={m.text} />
            ))}
            <div ref={chatEndRef} />
          </div>

          {/* Input */}
          <div className="flex items-center gap-2 px-3 py-3 border-t border-white/[0.06]">
            {mode === "voice" ? (
              <button
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border text-sm font-semibold transition-all",
                  active
                    ? "bg-sky-500/20 border-sky-400/40 text-sky-300 animate-pulse"
                    : "bg-white/[0.04] border-white/10 text-white/30"
                )}
              >
                <Mic size={16} />
                {active ? "Listening..." : "Activate to speak"}
              </button>
            ) : (
              <>
                <input
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleSend()}
                  placeholder="Ask JARVIS..."
                  className="flex-1 bg-transparent text-sm text-white placeholder-white/25 outline-none"
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim()}
                  className="w-8 h-8 flex items-center justify-center bg-sky-500/20 border border-sky-400/30 rounded-xl text-sky-400 hover:bg-sky-500/30 transition-all disabled:opacity-30"
                >
                  <ChevronRight size={16} />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Status legend */}
        <div className="flex items-center justify-center gap-5">
          {[
            { color: "bg-green-400", label: "Ready" },
            { color: "bg-sky-400", label: "Active" },
            { color: "bg-white/20", label: "Offline" },
          ].map(s => (
            <div key={s.label} className="flex items-center gap-1.5">
              <div className={cn("w-1.5 h-1.5 rounded-full shrink-0", s.color)} />
              <span className="text-[10px] text-white/35">{s.label}</span>
            </div>
          ))}
        </div>

      </div>
    </motion.div>
  );
}
