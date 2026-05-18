import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "wouter";
import {
  ArrowLeft, Mic, MicOff, MessageSquare, Zap, Globe, Mail,
  Camera, Monitor, Folder, Brain, Clock, Shield, Wifi, Cpu,
  Activity, Eye, Volume2, VolumeX, ChevronRight, Play,
  Square, Check, AlertTriangle, Info, Sparkles, Send,
  ChevronDown, Terminal, Package, Key
} from "lucide-react";
import { cn } from "@/lib/utils";

/* ── Hex Grid Background Panel ── */
function HexGrid({ active }: { active: boolean }) {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Hexagon SVG grid */}
      <svg
        className={cn("absolute inset-0 w-full h-full transition-opacity duration-1000", active ? "opacity-[0.045]" : "opacity-[0.018]")}
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern id="hexpat" x="0" y="0" width="56" height="48" patternUnits="userSpaceOnUse">
            <polygon points="14,2 42,2 56,24 42,46 14,46 0,24" fill="none" stroke="#38bdf8" strokeWidth="0.8" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#hexpat)" />
      </svg>
      {/* Scanning line */}
      {active && (
        <motion.div
          className="absolute left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-sky-400/50 to-transparent"
          animate={{ top: ["0%", "100%"] }}
          transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
        />
      )}
      {/* Radial vignette */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,#030712_90%)]" />
      {/* Bottom fade */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#030712]" />
    </div>
  );
}

/* ── Arc Reactor ── */
function ArcReactor({ active }: { active: boolean }) {
  return (
    <div className="relative w-32 h-32 flex items-center justify-center">
      {active && (
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{ boxShadow: "0 0 48px 20px rgba(56,189,248,0.22)" }}
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      )}
      <motion.div
        className={cn("absolute inset-0 rounded-full border-2", active ? "border-sky-400/40" : "border-white/[0.07]")}
        animate={active ? { rotate: 360 } : {}}
        transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
      />
      <motion.div
        className={cn("absolute inset-4 rounded-full border-2", active ? "border-cyan-300/55" : "border-white/[0.07]")}
        animate={active ? { rotate: -360 } : {}}
        transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
      />
      <motion.div
        className={cn("absolute inset-8 rounded-full border-2", active ? "border-sky-200/70" : "border-white/[0.07]")}
        animate={active ? { rotate: 360 } : {}}
        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
      />
      <motion.div
        className={cn(
          "w-12 h-12 rounded-full flex items-center justify-center border-2 cursor-pointer select-none",
          active
            ? "bg-sky-400/20 border-sky-300 shadow-[0_0_28px_rgba(56,189,248,0.55)]"
            : "bg-white/5 border-white/20"
        )}
        animate={active ? { scale: [1, 1.09, 1] } : { scale: 1 }}
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
        <motion.div className={cn("h-full rounded-full", color)} animate={{ width: `${value}%` }} transition={{ duration: 1.2, ease: "easeOut" }} />
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
  moduleId: string;
}
function SkillCard({ skill, index }: { skill: Skill; index: number }) {
  const [hover, setHover] = useState(false);
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      onHoverStart={() => setHover(true)}
      onHoverEnd={() => setHover(false)}
      whileTap={{ scale: 0.97 }}
      className={cn("relative flex flex-col gap-2 p-3 rounded-2xl border transition-all cursor-pointer select-none", skill.bg, skill.border, hover ? "brightness-125" : "")}
    >
      <div className={cn("absolute top-2 right-2 w-1.5 h-1.5 rounded-full", {
        "bg-green-400": skill.status === "ready",
        "bg-sky-400 animate-pulse": skill.status === "active",
        "bg-white/20": skill.status === "offline",
      })} />
      <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center border shrink-0", skill.bg, skill.border)}>
        <span className={skill.color}>{skill.icon}</span>
      </div>
      <div>
        <p className={cn("text-[11px] font-semibold leading-tight", skill.color)}>{skill.label}</p>
        <p className="text-[9px] text-white/30 mt-0.5 leading-tight">{skill.desc}</p>
      </div>
      <span className="text-[8px] font-mono text-white/20 absolute bottom-2 right-2">{skill.moduleId}</span>
    </motion.div>
  );
}

/* ── HUD Log Line ── */
function LogLine({ text, type = "info", delay = 0 }: { text: string; type?: "info" | "warn" | "ok" | "err"; delay?: number }) {
  return (
    <motion.div initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay }}
      className="flex items-start gap-2 text-[10px] font-mono"
    >
      <span className={cn("shrink-0 mt-0.5", { "text-sky-400": type === "info", "text-yellow-400": type === "warn", "text-green-400": type === "ok", "text-red-400": type === "err" })}>
        {type === "info" && <Info size={9} />}
        {type === "warn" && <AlertTriangle size={9} />}
        {type === "ok" && <Check size={9} />}
        {type === "err" && <Square size={9} />}
      </span>
      <span className="text-white/40 leading-tight">{text}</span>
    </motion.div>
  );
}

/* ── Chat Bubble ── */
function ChatBubble({ role, text }: { role: "user" | "jarvis"; text: string }) {
  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
      className={cn("flex gap-2", role === "user" ? "flex-row-reverse" : "flex-row")}
    >
      {role === "jarvis" && (
        <div className="w-7 h-7 rounded-full bg-sky-500/20 border border-sky-400/40 flex items-center justify-center shrink-0 mt-0.5">
          <Zap size={12} className="text-sky-400" />
        </div>
      )}
      <div className={cn("max-w-[80%] px-3 py-2 rounded-2xl text-xs leading-relaxed",
        role === "user"
          ? "bg-white/[0.08] border border-white/[0.10] text-white/80 rounded-tr-sm"
          : "bg-sky-500/10 border border-sky-400/20 text-sky-200 rounded-tl-sm"
      )}>
        {text}
      </div>
    </motion.div>
  );
}

/* ── Data ── */
const SKILLS: Skill[] = [
  // Web & Communication
  { icon: <Globe size={15} />, label: "Web Search", desc: "Google · DuckDuckGo · Scraper", status: "ready", category: "web", color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-400/20", moduleId: "web_ops" },
  { icon: <Mail size={15} />, label: "Email", desc: "Send · Read · Draft · Manage", status: "ready", category: "web", color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-400/20", moduleId: "email_ops" },
  { icon: <MessageSquare size={15} />, label: "WhatsApp", desc: "Message · Voice · Selenium bridge", status: "offline", category: "web", color: "text-green-400", bg: "bg-green-500/10", border: "border-green-400/20", moduleId: "whatsapp_skill" },
  { icon: <Wifi size={15} />, label: "API Calls", desc: "REST · GraphQL · Webhooks", status: "ready", category: "web", color: "text-violet-400", bg: "bg-violet-500/10", border: "border-violet-400/20", moduleId: "api_ops" },
  // Vision & Sensing
  { icon: <Camera size={15} />, label: "Camera", desc: "Live feed · Snapshot · Process", status: "ready", category: "vision", color: "text-pink-400", bg: "bg-pink-500/10", border: "border-pink-400/20", moduleId: "camera_skill" },
  { icon: <Eye size={15} />, label: "YOLO Vision", desc: "Real-time object detection v8", status: "active", category: "vision", color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-400/20", moduleId: "detection_skill" },
  { icon: <Monitor size={15} />, label: "Screenshot", desc: "Capture · Annotate · Diff", status: "ready", category: "vision", color: "text-cyan-400", bg: "bg-cyan-500/10", border: "border-cyan-400/20", moduleId: "screenshot_ops" },
  { icon: <Activity size={15} />, label: "Screen Watch", desc: "Monitor UI · Auto-click · OCR", status: "offline", category: "vision", color: "text-rose-400", bg: "bg-rose-500/10", border: "border-rose-400/20", moduleId: "screen_ops" },
  { icon: <Sparkles size={15} />, label: "Gemini Live", desc: "Multimodal · Vision · Real-time", status: "active", category: "vision", color: "text-yellow-400", bg: "bg-yellow-500/10", border: "border-yellow-400/20", moduleId: "gemini_live_skill" },
  // System & Files
  { icon: <Cpu size={15} />, label: "System Control", desc: "Volume · Brightness · Apps", status: "ready", category: "system", color: "text-lime-400", bg: "bg-lime-500/10", border: "border-lime-400/20", moduleId: "system_ops" },
  { icon: <Folder size={15} />, label: "File Management", desc: "Create · Read · Organize", status: "ready", category: "system", color: "text-orange-400", bg: "bg-orange-500/10", border: "border-orange-400/20", moduleId: "file_ops" },
  { icon: <Brain size={15} />, label: "Long Memory", desc: "HNSW vector store · Facts", status: "active", category: "system", color: "text-purple-400", bg: "bg-purple-500/10", border: "border-purple-400/20", moduleId: "memory_ops" },
  { icon: <Clock size={15} />, label: "Datetime", desc: "Scheduler · Alarms · Cron", status: "ready", category: "system", color: "text-teal-400", bg: "bg-teal-500/10", border: "border-teal-400/20", moduleId: "datetime_ops" },
  { icon: <Shield size={15} />, label: "Security", desc: "Auth · Sandboxing · Audit", status: "ready", category: "system", color: "text-red-400", bg: "bg-red-500/10", border: "border-red-400/20", moduleId: "security_ops" },
  { icon: <Volume2 size={15} />, label: "TTS / STT", desc: "Whisper · ElevenLabs · Edge", status: "ready", category: "system", color: "text-sky-400", bg: "bg-sky-500/10", border: "border-sky-400/20", moduleId: "voice_ops" },
];

const DEMO_CHAT: Array<{ role: "user" | "jarvis"; text: string }> = [
  { role: "user", text: "Jarvis, what's my CPU usage and who sent me emails today?" },
  { role: "jarvis", text: "CPU at 34% — all cores nominal. You have 7 unread emails: 3 from GitHub notifications, 2 newsletters, and 1 from Sarah about the design review at 3pm. Want me to draft a reply?" },
  { role: "user", text: "Yes, confirm I'll be there and attach the latest screenshot of the dashboard." },
  { role: "jarvis", text: "Done — screenshot captured, annotated the new chart section, and sent to Sarah. Reply logged in long-term memory. Anything else?" },
];

const LOG_LINES = [
  { text: "JARVIS v4.2.0 — boot sequence complete", type: "ok" as const, delay: 0 },
  { text: "Loading skill modules: 15/15", type: "ok" as const, delay: 0.08 },
  { text: "YOLO v8 — object detector ready (87.3% mAP)", type: "ok" as const, delay: 0.16 },
  { text: "Gemini Live — multimodal vision online", type: "ok" as const, delay: 0.22 },
  { text: "Long-term memory: 3,847 facts indexed", type: "info" as const, delay: 0.3 },
  { text: "Groq LLM engine — llama-3.3-70b-versatile", type: "ok" as const, delay: 0.38 },
  { text: "WhatsApp bridge: offline (token expired)", type: "warn" as const, delay: 0.45 },
  { text: "Screen watcher: offline (permission needed)", type: "warn" as const, delay: 0.52 },
  { text: "Web Speech API — voice recognition ready", type: "ok" as const, delay: 0.6 },
  { text: "Listening on TCP :7474 · TLS enabled", type: "ok" as const, delay: 0.68 },
];

const CATEGORIES = [
  { id: "all", label: "All" },
  { id: "web", label: "Web & Comms" },
  { id: "vision", label: "Vision" },
  { id: "system", label: "System" },
];

const SETUP_STEPS = [
  { step: "1", title: "Clone the Repository", code: "git clone <YOUR_REPO_URL>\ncd JARVIC", color: "text-sky-400" },
  { step: "2", title: "Install Dependencies", code: "pip install -r requirements.txt", color: "text-violet-400", note: "Requires PyQt6 and ultralytics for vision" },
  { step: "3", title: "Configure Environment", code: "GROQ_API_KEY=your_key_here\n# Add other skill keys as needed", color: "text-emerald-400", note: "Create a .env file in the root directory" },
  { step: "4", title: "Run JARVIS", code: "python main.py\n# Text-only mode:\npython main.py --text", color: "text-amber-400" },
];

const PROJECT_STRUCTURE = [
  { path: "core/", desc: "Brain engine, voice processing, skill registry" },
  { path: "gui/", desc: "PyQt6 app logic and rendering (HUD interface)" },
  { path: "skills/", desc: "Individual capability modules (drop-in)" },
  { path: "assets/", desc: "Images and resources" },
  { path: "main.py", desc: "Entry point — GUI or --text mode" },
  { path: ".env", desc: "GROQ_API_KEY + other skill credentials" },
  { path: "requirements.txt", desc: "Python deps: PyQt6, ultralytics, groq, etc." },
];

/* ── Page ── */
const BASE_URL = import.meta.env.BASE_URL?.replace(/\/$/, "") || "";

export default function JarvisPage() {
  const [active, setActive] = useState(false);
  const [mode, setMode] = useState<"text" | "voice">("text");
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState(DEMO_CHAT);
  const [isThinking, setIsThinking] = useState(false);
  const [cat, setCat] = useState("all");
  const [telemetry, setTelemetry] = useState({ cpu: 34, mem: 61, net: 22, gpu: 47 });
  const [muted, setMuted] = useState(false);
  const [showSetup, setShowSetup] = useState(false);
  const [showStructure, setShowStructure] = useState(false);
  const [copiedStep, setCopiedStep] = useState<number | null>(null);

  /* Voice recognition state */
  const [voiceListening, setVoiceListening] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState("");
  const [voiceSupported, setVoiceSupported] = useState(false);
  const recognitionRef = useRef<any>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const mutedRef = useRef(muted);

  /* Keep mutedRef in sync */
  useEffect(() => { mutedRef.current = muted; }, [muted]);

  /* Cancel speech when muted */
  useEffect(() => {
    if (muted && window.speechSynthesis) window.speechSynthesis.cancel();
  }, [muted]);

  /* ── Text-to-Speech ── */
  const speakText = useCallback((text: string) => {
    if (mutedRef.current || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    const trySpeak = () => {
      const voices = window.speechSynthesis.getVoices();
      const preferred = voices.find(v =>
        v.name.includes("Google UK English Male") ||
        v.name.includes("Daniel") ||
        v.name.includes("Alex") ||
        v.name.includes("Fred") ||
        (v.lang.startsWith("en") && v.name.toLowerCase().includes("male"))
      ) ?? voices.find(v => v.lang.startsWith("en"));
      if (preferred) utter.voice = preferred;
      utter.pitch = 0.72;
      utter.rate = 0.91;
      utter.volume = 1;
      window.speechSynthesis.speak(utter);
    };
    if (window.speechSynthesis.getVoices().length) {
      trySpeak();
    } else {
      window.speechSynthesis.onvoiceschanged = trySpeak;
    }
  }, []);

  /* Check Web Speech API support */
  useEffect(() => {
    const supported = !!(
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition
    );
    setVoiceSupported(supported);
  }, []);

  /* Animate telemetry */
  useEffect(() => {
    if (!active) return;
    const interval = setInterval(() => {
      setTelemetry(prev => ({
        cpu: Math.min(95, Math.max(10, prev.cpu + (Math.random() - 0.5) * 8)),
        mem: Math.min(95, Math.max(30, prev.mem + (Math.random() - 0.5) * 4)),
        net: Math.min(90, Math.max(5, prev.net + (Math.random() - 0.5) * 12)),
        gpu: Math.min(90, Math.max(15, prev.gpu + (Math.random() - 0.5) * 6)),
      }));
    }, 1800);
    return () => clearInterval(interval);
  }, [active]);

  /* Stop recognition when deactivated */
  useEffect(() => {
    if (!active && voiceListening) {
      recognitionRef.current?.stop();
      setVoiceListening(false);
    }
  }, [active, voiceListening]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  /* ── Real JARVIS AI — streaming from backend ── */
  const callJarvisAI = async (userText: string): Promise<void> => {
    setIsThinking(true);
    setMessages(prev => [...prev, { role: "jarvis", text: "…" }]);

    const history = messages.slice(-10).map(m => ({
      role: m.role === "jarvis" ? "assistant" as const : "user" as const,
      content: m.text,
    }));

    try {
      const res = await fetch(`${BASE_URL}/api/jarvis/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stream: true,
          messages: [...history, { role: "user", content: userText }],
        }),
      });

      if (res.ok && res.body) {
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let fullText = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value);
          for (const line of chunk.split("\n")) {
            if (line.startsWith("data: ")) {
              try {
                const data = JSON.parse(line.slice(6)) as { token?: string; done?: boolean; error?: string };
                if (data.error) { fullText = `⚠️ ${data.error}`; break; }
                if (data.token) {
                  fullText += data.token;
                  setMessages(prev => {
                    const next = [...prev];
                    if (next[next.length - 1]?.role === "jarvis") {
                      next[next.length - 1] = { role: "jarvis", text: fullText };
                    }
                    return next;
                  });
                }
              } catch { /* ignore */ }
            }
          }
        }

        if (fullText && fullText !== "…") speakText(fullText);
      } else {
        throw new Error(`HTTP ${res.status}`);
      }
    } catch (err) {
      const fallback = `System error: ${String(err)}. Running in local simulation mode.`;
      setMessages(prev => {
        const next = [...prev];
        if (next[next.length - 1]?.role === "jarvis") next[next.length - 1] = { role: "jarvis", text: fallback };
        return next;
      });
      speakText(fallback);
    }
    setIsThinking(false);
  };

  /* ── Web Speech API ── */
  const startListening = () => {
    const SpeechRecognitionAPI =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;
    if (!SpeechRecognitionAPI) return;

    const recognition = new SpeechRecognitionAPI();
    recognitionRef.current = recognition;
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onstart = () => setVoiceListening(true);
    recognition.onend = () => {
      setVoiceListening(false);
      setVoiceTranscript("");
    };
    recognition.onerror = () => {
      setVoiceListening(false);
      setVoiceTranscript("");
    };
    recognition.onresult = (event: any) => {
      const transcript = Array.from(event.results as any[])
        .map((r: any) => r[0].transcript)
        .join("");
      setVoiceTranscript(transcript);

      const lastResult = event.results[event.results.length - 1];
      if (lastResult.isFinal) {
        const finalText = transcript.trim();
        if (finalText) {
          setMessages(prev => [...prev, { role: "user", text: finalText }]);
          setVoiceTranscript("");
          void callJarvisAI(finalText);
        }
      }
    };
    recognition.start();
  };

  const stopListening = () => {
    recognitionRef.current?.stop();
    setVoiceListening(false);
    setVoiceTranscript("");
  };

  const filteredSkills = cat === "all" ? SKILLS : SKILLS.filter(s => s.category === cat);

  const handleSend = () => {
    const text = input.trim();
    if (!text || isThinking) return;
    setMessages(prev => [...prev, { role: "user", text }]);
    setInput("");
    void callJarvisAI(text);
  };

  const copyStep = (code: string, i: number) => {
    navigator.clipboard?.writeText(code).catch(() => {});
    setCopiedStep(i);
    setTimeout(() => setCopiedStep(null), 1800);
  };

  const activeSkillCount = SKILLS.filter(s => s.status !== "offline").length;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="relative flex flex-col min-h-[100dvh] max-w-[480px] mx-auto w-full bg-[#030712] overflow-hidden"
    >
      {/* ── Hex Grid Background Panel ── */}
      <HexGrid active={active} />

      {/* ── Header ── */}
      <div className="relative z-10 flex items-center px-4 pt-12 pb-4 shrink-0">
        <Link href="/">
          <button className="w-9 h-9 flex items-center justify-center text-white/40 hover:text-white rounded-xl hover:bg-white/8 transition-colors">
            <ArrowLeft size={20} />
          </button>
        </Link>
        <div className="flex-1 text-center">
          <p className="text-[10px] font-mono uppercase tracking-[0.22em] text-sky-400/70">J.A.R.V.I.S</p>
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
              ? `${activeSkillCount} skills active · Groq LLM engine · ${voiceListening ? "🎤 Listening..." : "Ready"}`
              : "Tap the button below to activate"}
          </p>
        </div>
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
          {active ? "Deactivate" : "Activate JARVIS"}
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
            {m === "text" ? "Text Mode" : "Voice Mode"}
            {m === "voice" && !voiceSupported && (
              <span className="text-[9px] text-red-400/70 ml-0.5">unsupported</span>
            )}
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

      {/* ── Scrollable Content ── */}
      <div className="relative z-10 flex-1 overflow-y-auto px-4 pb-6 space-y-4 no-scrollbar">

        {/* Boot Log */}
        <div className="bg-black/40 border border-sky-400/10 rounded-2xl px-4 py-3">
          <p className="text-[9px] font-mono uppercase tracking-widest text-sky-400/40 mb-2">Boot Log</p>
          <div className="space-y-1.5">
            {LOG_LINES.map((l, i) => (
              <LogLine key={i} text={l.text} type={l.type} delay={l.delay} />
            ))}
          </div>
        </div>

        {/* Skills Grid */}
        <div>
          <div className="flex items-center justify-between mb-2.5">
            <p className="text-[11px] font-semibold text-white/60 uppercase tracking-widest">
              Skills <span className="text-white/25 font-normal normal-case tracking-normal">({SKILLS.length})</span>
            </p>
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

        {/* Live Chat */}
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-white/[0.06]">
            <div className={cn("w-2 h-2 rounded-full", active ? "bg-sky-400 animate-pulse" : "bg-white/20")} />
            <p className="text-[11px] font-semibold text-white/50">Live Chat</p>
            {voiceListening && (
              <span className="ml-auto text-[10px] font-mono text-red-400 animate-pulse flex items-center gap-1">
                <Mic size={9} /> Listening...
              </span>
            )}
          </div>

          <div className="px-4 py-3 space-y-3 max-h-56 overflow-y-auto no-scrollbar">
            {messages.map((m, i) => (
              <ChatBubble key={i} role={m.role} text={m.text} />
            ))}
            <div ref={chatEndRef} />
          </div>

          {/* Input */}
          <div className="flex flex-col gap-1 px-3 py-3 border-t border-white/[0.06]">
            {mode === "voice" ? (
              <>
                {/* Interim transcript */}
                <AnimatePresence>
                  {voiceTranscript && (
                    <motion.p
                      initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                      className="text-[11px] text-sky-300/70 italic px-1 pb-1 animate-pulse"
                    >
                      "{voiceTranscript}..."
                    </motion.p>
                  )}
                </AnimatePresence>

                {!voiceSupported ? (
                  <div className="flex items-center justify-center gap-2 py-2.5 bg-red-500/10 border border-red-400/20 rounded-xl text-red-300 text-[11px]">
                    <AlertTriangle size={14} />
                    Web Speech API not supported. Use Chrome or Edge.
                  </div>
                ) : (
                  <button
                    onClick={active ? (voiceListening ? stopListening : startListening) : undefined}
                    disabled={!active}
                    className={cn(
                      "flex items-center justify-center gap-2 py-3 rounded-xl border text-sm font-semibold transition-all",
                      !active
                        ? "bg-white/[0.04] border-white/10 text-white/30 cursor-not-allowed"
                        : voiceListening
                        ? "bg-red-500/20 border-red-400/40 text-red-300 shadow-[0_0_18px_rgba(248,113,113,0.2)] animate-pulse"
                        : "bg-sky-500/15 border-sky-400/40 text-sky-300 hover:bg-sky-500/25 active:scale-[0.98]"
                    )}
                  >
                    {voiceListening ? <MicOff size={16} /> : <Mic size={16} />}
                    {!active
                      ? "Activate JARVIS first"
                      : voiceListening
                      ? "Recording — tap to stop"
                      : "Tap to speak"}
                  </button>
                )}
              </>
            ) : (
              <div className="flex items-center gap-2">
                <input
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleSend()}
                  placeholder={active ? "Ask JARVIS anything..." : "Activate JARVIS first..."}
                  disabled={!active}
                  className="flex-1 bg-transparent text-sm text-white placeholder-white/25 outline-none disabled:opacity-40"
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || !active}
                  className="w-8 h-8 flex items-center justify-center bg-sky-500/20 border border-sky-400/30 rounded-xl text-sky-400 hover:bg-sky-500/30 transition-all disabled:opacity-30"
                >
                  <Send size={14} />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Status Legend */}
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

        {/* ── Setup & Installation (from README) ── */}
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl overflow-hidden">
          <button
            onClick={() => setShowSetup(v => !v)}
            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/[0.03] transition-colors"
          >
            <Package size={14} className="text-violet-400 shrink-0" />
            <span className="flex-1 text-left text-[12px] font-semibold text-white/70">Setup & Installation</span>
            <span className="text-[9px] font-mono text-white/30 mr-2">Python 3.10+ · PyQt6 · Groq</span>
            <motion.div animate={{ rotate: showSetup ? 90 : 0 }} transition={{ duration: 0.2 }}>
              <ChevronRight size={14} className="text-white/30" />
            </motion.div>
          </button>
          <AnimatePresence>
            {showSetup && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                <div className="px-3 pb-4 space-y-3 border-t border-white/[0.06] pt-3">
                  {/* Prerequisites */}
                  <div className="flex gap-2 flex-wrap">
                    {["Python 3.10+", "Groq API Key", "PyQt6", "ultralytics (YOLO)"].map(p => (
                      <span key={p} className="text-[10px] bg-violet-500/10 border border-violet-400/20 text-violet-300 px-2 py-0.5 rounded-full">{p}</span>
                    ))}
                  </div>
                  {SETUP_STEPS.map((s, i) => (
                    <div key={i} className="bg-[#0a0e14] border border-white/[0.07] rounded-xl overflow-hidden">
                      <div className="flex items-center gap-2 px-3 py-2 bg-white/[0.03] border-b border-white/[0.06]">
                        <span className={cn("text-[11px] font-bold w-5 h-5 rounded-full flex items-center justify-center text-[10px] border", s.color, "bg-white/[0.04] border-current/20")}>{s.step}</span>
                        <span className="text-[11px] font-semibold text-white/70 flex-1">{s.title}</span>
                        {s.note && <span className="text-[9px] text-white/25 hidden sm:block">{s.note}</span>}
                        <button onClick={() => copyStep(s.code, i)} className="text-white/30 hover:text-white transition-colors ml-auto">
                          {copiedStep === i ? <Check size={11} className="text-green-400" /> : <Key size={11} />}
                        </button>
                      </div>
                      <pre className={cn("px-3 py-2.5 font-mono text-[10.5px] leading-relaxed whitespace-pre-wrap", s.color)}>
                        {s.code}
                      </pre>
                    </div>
                  ))}
                  {/* Run modes */}
                  <div className="bg-sky-500/5 border border-sky-400/15 rounded-xl p-3">
                    <p className="text-[11px] font-semibold text-sky-300 mb-1.5">Dual Run Modes</p>
                    <div className="space-y-1.5">
                      <div className="flex items-start gap-2">
                        <span className="text-[9px] font-mono text-sky-400 w-16 shrink-0 mt-0.5">GUI mode</span>
                        <span className="text-[10px] text-white/45">Full HUD with Arc Reactor, hex panel, telemetry. Click reactor to Pause/Resume listening.</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="text-[9px] font-mono text-sky-400 w-16 shrink-0 mt-0.5">--text</span>
                        <span className="text-[10px] text-white/45">Terminal-only, no voice I/O. Ideal for debugging or quiet environments.</span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── Project Structure (from README) ── */}
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl overflow-hidden">
          <button
            onClick={() => setShowStructure(v => !v)}
            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/[0.03] transition-colors"
          >
            <Terminal size={14} className="text-emerald-400 shrink-0" />
            <span className="flex-1 text-left text-[12px] font-semibold text-white/70">Project Structure</span>
            <span className="text-[9px] font-mono text-white/30 mr-2">JARVIC/</span>
            <motion.div animate={{ rotate: showStructure ? 90 : 0 }} transition={{ duration: 0.2 }}>
              <ChevronRight size={14} className="text-white/30" />
            </motion.div>
          </button>
          <AnimatePresence>
            {showStructure && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                <div className="px-3 pb-4 border-t border-white/[0.06] pt-3">
                  <div className="bg-[#0a0e14] border border-white/[0.06] rounded-xl overflow-hidden">
                    <div className="flex items-center gap-1.5 px-3 py-2 bg-[#0d1117] border-b border-white/[0.06]">
                      <span className="w-2.5 h-2.5 rounded-full bg-red-500/50" />
                      <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/50" />
                      <span className="w-2.5 h-2.5 rounded-full bg-green-500/50" />
                      <span className="text-[10px] text-white/30 font-mono ml-1">JARVIC/</span>
                    </div>
                    <div className="p-3 space-y-1">
                      {PROJECT_STRUCTURE.map((item, i) => (
                        <div key={i} className="flex items-start gap-3">
                          <span className="font-mono text-[10.5px] text-emerald-400 w-32 shrink-0">{i === 0 ? "├── " : i === PROJECT_STRUCTURE.length - 1 ? "└── " : "├── "}{item.path}</span>
                          <span className="text-[10px] text-white/35 leading-relaxed">{item.desc}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  {/* .env note */}
                  <div className="mt-3 bg-amber-500/8 border border-amber-400/20 rounded-xl p-3">
                    <p className="text-[11px] font-semibold text-amber-300 mb-1">Environment Config (.env)</p>
                    <pre className="font-mono text-[10.5px] text-amber-200/70 whitespace-pre-wrap leading-relaxed">{`GROQ_API_KEY=your_key_here
# Add per-skill credentials:
# OPENAI_API_KEY=...
# GMAIL_APP_PASS=...
# WHATSAPP_TOKEN=...`}</pre>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Voice Recognition Info */}
        <div className={cn(
          "flex items-start gap-3 px-4 py-3 rounded-2xl border",
          voiceSupported
            ? "bg-sky-500/5 border-sky-400/15"
            : "bg-red-500/5 border-red-400/15"
        )}>
          <Mic size={14} className={voiceSupported ? "text-sky-400 shrink-0 mt-0.5" : "text-red-400 shrink-0 mt-0.5"} />
          <div>
            <p className={cn("text-[11px] font-semibold", voiceSupported ? "text-sky-300" : "text-red-300")}>
              {voiceSupported ? "Web Speech API — Ready" : "Web Speech API — Not Supported"}
            </p>
            <p className="text-[10px] text-white/35 mt-0.5 leading-relaxed">
              {voiceSupported
                ? "Switch to Voice Mode, activate JARVIS, then tap the microphone button. Uses your browser's built-in speech recognition (Chrome/Edge recommended)."
                : "Your browser doesn't support the Web Speech API. Please use Google Chrome or Microsoft Edge for voice functionality."}
            </p>
          </div>
        </div>

      </div>
    </motion.div>
  );
}
