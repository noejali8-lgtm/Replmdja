import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft, ChevronDown, WifiOff, Wifi, Loader2, Check, X,
  Layers, Palette, Package, Bug, Shield, Bot, Cloud,
  GitBranch, ArrowRight, Plus, Trash2, RefreshCw, Play, Square,
  Cpu, BarChart3, Activity, Clock, AlertTriangle, CheckCircle2,
  User, Lock, Eye, EyeOff, Globe, Zap, Server, Database,
  Settings, Star, Download, UploadCloud, Timer,
  Network, FileText, Code2, Sparkles, Rocket, Key, Users,
  ChevronRight, Monitor, Terminal, Search
} from "lucide-react";
import { useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

function Section({ id, icon, iconBg, title, subtitle, badge, children }: {
  id: string; icon: React.ReactNode; iconBg: string;
  title: string; subtitle: string; badge?: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="bg-[#1a1a1a] border border-white/8 rounded-2xl overflow-hidden">
      <button onClick={() => setOpen(v => !v)}
        className="w-full flex items-center gap-3 px-4 py-4 text-left hover:bg-white/3 transition-colors active:bg-white/5">
        <div className={cn("w-9 h-9 rounded-xl border border-white/10 flex items-center justify-center shrink-0", iconBg)}>
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-white leading-tight">{title}</p>
            {badge && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-purple-500/25 text-purple-400 border border-purple-400/30">{badge}</span>}
          </div>
          <p className="text-xs text-white/40 mt-0.5 truncate">{subtitle}</p>
        </div>
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.18 }} className="text-white/30 shrink-0">
          <ChevronDown size={18} />
        </motion.div>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
            <div className="px-4 pb-5 pt-1 border-t border-white/5 space-y-4">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* 1. OFFLINE MODE */
function OfflineSection() {
  const { toast } = useToast();
  const [online, setOnline] = useState(true);
  const [syncQueue, setSyncQueue] = useState([
    { id: 1, file: "src/App.tsx", change: "+47 lines", time: "منذ 2 دقيقة", synced: false },
    { id: 2, file: "package.json", change: "تحديث إصدار", time: "منذ 5 دقائق", synced: false },
    { id: 3, file: "README.md", change: "إضافة توثيق", time: "منذ 8 دقائق", synced: true },
  ]);
  const [syncing, setSyncing] = useState(false);
  const [storageUsed, setStorageUsed] = useState(42);

  const toggleOffline = () => {
    setOnline(v => !v);
    toast({ title: online ? "📴 وضع Offline مُفعَّل" : "📶 عادت الاتصال — جاري المزامنة...", description: online ? "يتم حفظ تعديلاتك محلياً" : "" });
  };

  const syncAll = async () => {
    if (!online) { toast({ title: "لا يوجد إنترنت", description: "ستتم المزامنة عند عودة الاتصال" }); return; }
    setSyncing(true);
    await new Promise(r => setTimeout(r, 1800));
    setSyncQueue(q => q.map(i => ({ ...i, synced: true })));
    setSyncing(false);
    toast({ title: "✅ تمت المزامنة بنجاح", description: `${syncQueue.filter(q => !q.synced).length} تعديلات محلية رُفعت` });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-4 py-3 bg-white/3 border border-white/8 rounded-xl">
        <div className="flex items-center gap-2">
          {online ? <Wifi size={16} className="text-green-400" /> : <WifiOff size={16} className="text-red-400" />}
          <div>
            <p className="text-xs font-semibold text-white">{online ? "متصل بالإنترنت" : "وضع Offline"}</p>
            <p className="text-[11px] text-white/40">{online ? "المزامنة تلقائية" : "التعديلات محلية فقط"}</p>
          </div>
        </div>
        <button onClick={toggleOffline}
          className={cn("px-3 py-1.5 rounded-lg text-xs font-bold border transition-all", online ? "bg-red-500/15 border-red-400/30 text-red-400" : "bg-green-500/15 border-green-400/30 text-green-400")}>
          {online ? "محاكاة Offline" : "إعادة الاتصال"}
        </button>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-[11px] font-bold text-white/40 uppercase tracking-widest">قائمة انتظار المزامنة</p>
          <button onClick={syncAll} disabled={syncing || !online}
            className="flex items-center gap-1 text-[11px] text-blue-400 hover:text-blue-300 disabled:opacity-40 transition-colors">
            {syncing ? <Loader2 size={11} className="animate-spin" /> : <RefreshCw size={11} />}
            {syncing ? "مزامنة..." : "مزامنة الكل"}
          </button>
        </div>
        <div className="space-y-1.5">
          {syncQueue.map(item => (
            <div key={item.id} className="flex items-center gap-3 px-3 py-2.5 bg-black/20 border border-white/6 rounded-xl">
              <FileText size={13} className="text-white/40 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-mono text-white/70 truncate">{item.file}</p>
                <p className="text-[10px] text-white/30">{item.change} · {item.time}</p>
              </div>
              {item.synced
                ? <CheckCircle2 size={13} className="text-green-400 shrink-0" />
                : <div className={cn("w-2 h-2 rounded-full shrink-0", online ? "bg-yellow-400 animate-pulse" : "bg-gray-600")} />}
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-1">
        <div className="flex justify-between text-[11px] text-white/40">
          <span>التخزين المحلي (Local Cache)</span>
          <span>{storageUsed}%</span>
        </div>
        <div className="h-2 bg-white/8 rounded-full overflow-hidden">
          <div className="h-full bg-blue-400 rounded-full" style={{ width: `${storageUsed}%` }} />
        </div>
        <p className="text-[10px] text-white/25">42MB من 100MB مستخدمة — التعديلات تُحفظ كـ IndexedDB</p>
      </div>

      <div className="bg-blue-500/8 border border-blue-400/20 rounded-xl px-3 py-2.5 text-xs text-blue-300/80 leading-relaxed">
        🔄 المزامنة تتم مثل <span className="text-white">Google Docs</span> — عند عودة الإنترنت يتم دمج التعديلات المحلية تلقائياً مع حل تعارضات الكود.
      </div>
    </div>
  );
}

/* 2. DOCKER SECTION */
function DockerSection() {
  const { toast } = useToast();
  const [containers, setContainers] = useState([
    { id: "app", name: "web-app", image: "node:20-alpine", port: "3000:3000", status: "stopped", cpu: 0, ram: 0 },
    { id: "db", name: "postgres", image: "postgres:16", port: "5432:5432", status: "stopped", cpu: 0, ram: 0 },
    { id: "cache", name: "redis", image: "redis:7", port: "6379:6379", status: "stopped", cpu: 0, ram: 0 },
  ]);
  const [starting, setStarting] = useState(false);

  const startAll = async () => {
    setStarting(true);
    toast({ title: "🐳 تشغيل Docker Compose...", description: "جاري تحميل الصور وبدء الحاويات" });
    for (let i = 0; i < containers.length; i++) {
      await new Promise(r => setTimeout(r, 900));
      setContainers(prev => prev.map((c, idx) => idx === i
        ? { ...c, status: "running", cpu: Math.floor(Math.random() * 15) + 2, ram: Math.floor(Math.random() * 100) + 50 }
        : c));
    }
    setStarting(false);
    toast({ title: "✅ جميع الحاويات تعمل!", description: "docker-compose up -d — 3 services" });
  };

  const stopAll = () => {
    setContainers(prev => prev.map(c => ({ ...c, status: "stopped", cpu: 0, ram: 0 })));
    toast({ title: "⏹ تم إيقاف الحاويات", description: "docker-compose down" });
  };

  const allRunning = containers.every(c => c.status === "running");

  return (
    <div className="space-y-4">
      <div className="bg-[#0d1117] border border-white/10 rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-3 py-2 border-b border-white/8">
          <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-blue-500" /><span className="text-xs font-mono text-white/50">docker-compose.yml</span></div>
          <div className="flex gap-2">
            <button onClick={allRunning ? stopAll : startAll} disabled={starting}
              className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all",
                allRunning ? "bg-red-500/20 border-red-400/30 text-red-400" : "bg-green-500/20 border-green-400/30 text-green-400")}>
              {starting ? <Loader2 size={11} className="animate-spin" /> : allRunning ? <Square size={11} fill="currentColor" /> : <Play size={11} fill="currentColor" />}
              {starting ? "جاري التشغيل..." : allRunning ? "Stop All" : "Start All"}
            </button>
          </div>
        </div>
        <div className="divide-y divide-white/5">
          {containers.map(c => (
            <div key={c.id} className="flex items-center gap-3 px-3 py-3">
              <div className={cn("w-2.5 h-2.5 rounded-full shrink-0", c.status === "running" ? "bg-green-400 shadow-[0_0_6px_#4ade80]" : "bg-white/20")} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-white">{c.name}</span>
                  <span className="text-[10px] font-mono text-white/30">{c.image}</span>
                </div>
                <p className="text-[10px] text-white/25 font-mono">:{c.port}</p>
              </div>
              {c.status === "running" && (
                <div className="text-right">
                  <p className="text-[10px] text-white/40">CPU: <span className="text-green-400">{c.cpu}%</span></p>
                  <p className="text-[10px] text-white/40">RAM: <span className="text-blue-400">{c.ram}MB</span></p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="bg-[#0d1117] border border-white/10 rounded-xl p-3">
        <pre className="text-[11px] font-mono text-green-400/80 leading-relaxed">{`version: '3.9'
services:
  web-app:
    build: .
    ports: ["3000:3000"]
    depends_on: [postgres, redis]
    environment:
      DATABASE_URL: postgres://postgres:password@postgres:5432/app
      REDIS_URL: redis://redis:6379

  postgres:
    image: postgres:16
    volumes: [pgdata:/var/lib/postgresql/data]
    environment:
      POSTGRES_PASSWORD: password

  redis:
    image: redis:7

volumes:
  pgdata:`}</pre>
      </div>
    </div>
  );
}

/* 3. UI CUSTOMIZATION */
function UICustomSection() {
  const { toast } = useToast();
  const [theme, setTheme] = useState("github-dark");
  const [fontSize, setFontSize] = useState(14);
  const [panelPos, setPanelPos] = useState<"right" | "bottom" | "float">("right");
  const themes = [
    { id: "github-dark", label: "GitHub Dark", bg: "#0d1117", accent: "#58a6ff" },
    { id: "dracula", label: "Dracula", bg: "#282a36", accent: "#bd93f9" },
    { id: "monokai", label: "Monokai", bg: "#272822", accent: "#f92672" },
    { id: "solarized", label: "Solarized Dark", bg: "#002b36", accent: "#268bd2" },
    { id: "nord", label: "Nord", bg: "#2e3440", accent: "#88c0d0" },
    { id: "catppuccin", label: "Catppuccin", bg: "#1e1e2e", accent: "#cba6f7" },
  ];
  const active = themes.find(t => t.id === theme)!;

  return (
    <div className="space-y-4">
      <div>
        <p className="text-[11px] font-bold text-white/40 uppercase tracking-widest mb-2">اختر المظهر (Theme)</p>
        <div className="grid grid-cols-3 gap-2">
          {themes.map(t => (
            <button key={t.id} onClick={() => { setTheme(t.id); toast({ title: `🎨 ${t.label}`, description: "تم تطبيق المظهر" }); }}
              className={cn("flex flex-col items-center gap-1.5 p-2.5 rounded-xl border text-[10px] font-semibold transition-all active:scale-95",
                theme === t.id ? "border-white/30 bg-white/8 text-white" : "border-white/8 bg-white/3 text-white/40 hover:border-white/15")}>
              <div className="w-full h-5 rounded-lg" style={{ background: t.bg, border: `2px solid ${t.accent}` }} />
              {t.label.split(" ")[0]}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="text-[11px] font-bold text-white/40 uppercase tracking-widest mb-2">موضع لوحة الإخراج</p>
        <div className="grid grid-cols-3 gap-2">
          {(["right", "bottom", "float"] as const).map(pos => (
            <button key={pos} onClick={() => { setPanelPos(pos); toast({ title: `🪟 Panel: ${pos}`, description: "" }); }}
              className={cn("py-2 rounded-xl border text-[11px] font-semibold transition-all",
                panelPos === pos ? "bg-blue-500/20 border-blue-400/35 text-blue-400" : "bg-white/4 border-white/8 text-white/40")}>
              {pos === "right" ? "يمين" : pos === "bottom" ? "أسفل" : "عائمة"}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-[#0d1117] border border-white/10 rounded-xl overflow-hidden" style={{ background: active.bg }}>
        <div className="px-3 py-2 border-b border-white/10 flex items-center gap-2">
          <div className="flex gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-red-500/60" /><div className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" /><div className="w-2.5 h-2.5 rounded-full bg-green-500/60" /></div>
          <span className="text-[10px] font-mono text-white/30">معاينة المظهر</span>
        </div>
        <div className="p-3">
          <code className="font-mono" style={{ fontSize, color: active.accent }}>
            {`const hello = "مرحباً بك في Replit!";`}
          </code>
        </div>
      </div>

      <div>
        <p className="text-[11px] font-bold text-white/40 uppercase tracking-widest mb-2">حجم الخط — {fontSize}px</p>
        <div className="flex items-center gap-3">
          <button onClick={() => setFontSize(s => Math.max(10, s - 1))} className="w-8 h-8 rounded-lg bg-white/6 border border-white/10 text-white/60 font-bold text-lg flex items-center justify-center">−</button>
          <div className="flex-1 h-2 bg-white/8 rounded-full">
            <div className="h-full rounded-full bg-white/40" style={{ width: `${((fontSize - 10) / 14) * 100}%` }} />
          </div>
          <button onClick={() => setFontSize(s => Math.min(24, s + 1))} className="w-8 h-8 rounded-lg bg-white/6 border border-white/10 text-white/60 font-bold text-lg flex items-center justify-center">+</button>
          <span className="text-xs font-mono text-white/50 w-8 text-center">{fontSize}</span>
        </div>
      </div>
    </div>
  );
}

/* 4. EXTENSION MARKETPLACE */
function ExtensionsSection() {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [installed, setInstalled] = useState<string[]>(["prettier", "eslint"]);
  const extensions = [
    { id: "prettier", name: "Prettier", desc: "تنسيق الكود تلقائياً", author: "Prettier", stars: 4.9, color: "text-pink-400" },
    { id: "eslint", name: "ESLint", desc: "فحص جودة الكود", author: "ESLint", stars: 4.8, color: "text-blue-400" },
    { id: "copilot", name: "AI Copilot", desc: "إكمال الكود بالذكاء الاصطناعي", author: "Replit", stars: 4.9, color: "text-purple-400" },
    { id: "gitlens", name: "GitLens", desc: "تاريخ Git لكل سطر", author: "GitKraken", stars: 4.7, color: "text-orange-400" },
    { id: "rest", name: "REST Client", desc: "اختبار APIs مباشرة", author: "Community", stars: 4.6, color: "text-green-400" },
    { id: "docker-ext", name: "Docker Tools", desc: "إدارة الحاويات بصرياً", author: "Docker", stars: 4.5, color: "text-cyan-400" },
  ].filter(e => e.name.toLowerCase().includes(search.toLowerCase()) || e.desc.includes(search));

  const toggle = (id: string, name: string) => {
    if (installed.includes(id)) { setInstalled(p => p.filter(i => i !== id)); toast({ title: `🗑 ${name} أُزيلت`, description: "" }); }
    else { setInstalled(p => [...p, id]); toast({ title: `✅ ${name} مُثبَّتة`, description: "ستظهر في المحرر فوراً" }); }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 bg-black/30 border border-white/10 rounded-xl px-3 py-2">
        <Search size={13} className="text-white/30" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="ابحث عن إضافة..."
          className="flex-1 bg-transparent text-xs text-white placeholder:text-white/30 outline-none" />
      </div>
      <div className="space-y-2">
        {extensions.map(ext => (
          <div key={ext.id} className="flex items-center gap-3 px-3 py-3 bg-black/20 border border-white/6 rounded-xl">
            <div className={cn("w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-lg shrink-0", ext.color)}>
              <Package size={16} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-white">{ext.name}</span>
                <span className="text-[10px] text-yellow-400">★{ext.stars}</span>
              </div>
              <p className="text-[11px] text-white/40 truncate">{ext.desc}</p>
              <p className="text-[10px] text-white/25">by {ext.author}</p>
            </div>
            <button onClick={() => toggle(ext.id, ext.name)}
              className={cn("px-3 py-1.5 rounded-lg text-[11px] font-bold border transition-all shrink-0",
                installed.includes(ext.id) ? "bg-red-500/15 border-red-400/25 text-red-400" : "bg-blue-500/15 border-blue-400/25 text-blue-400")}>
              {installed.includes(ext.id) ? "إزالة" : "تثبيت"}
            </button>
          </div>
        ))}
      </div>
      <div className="text-center text-xs text-white/30 py-2">
        {installed.length} مثبتة · {extensions.length} متاحة · متجر مفتوح للمطورين
      </div>
    </div>
  );
}

/* 5. VISUAL DEBUGGER / MEMORY PROFILER */
function DebuggerSection() {
  const { toast } = useToast();
  const [cpuHistory, setCpuHistory] = useState<number[]>([12, 18, 25, 15, 30, 45, 22, 18, 35, 28]);
  const [ramHistory, setRamHistory] = useState<number[]>([40, 42, 45, 44, 50, 65, 58, 55, 62, 60]);
  const [running, setRunning] = useState(false);
  const [currentLine, setCurrentLine] = useState(-1);
  const [history, setHistory] = useState<number[]>([]);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const codeLines = [
    "function processOrders(orders) {",
    "  let total = 0;",
    "  for (let i = 0; i < orders.length; i++) {",
    "    const order = orders[i];",
    "    total += order.price * order.qty;",
    "  }",
    "  return total;",
    "}",
  ];

  const startDebug = () => {
    setRunning(true);
    setCurrentLine(0);
    setHistory([]);
    toast({ title: "🐛 Debugger بدأ", description: "يمكنك الآن التنقل خطوة بخطوة" });
  };

  const stepForward = () => {
    if (currentLine < codeLines.length - 1) { setHistory(h => [...h, currentLine]); setCurrentLine(c => c + 1); }
    else { setRunning(false); toast({ title: "✅ انتهى التنفيذ", description: "total = 1,247.50" }); }
  };

  const stepBack = () => {
    if (history.length > 0) { setCurrentLine(history[history.length - 1]); setHistory(h => h.slice(0, -1)); toast({ title: "⏪ Time-travel: رجعنا سطراً", description: "" }); }
  };

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setCpuHistory(h => [...h.slice(1), Math.floor(Math.random() * 50) + 10]);
        setRamHistory(h => [...h.slice(1), Math.floor(Math.random() * 30) + 45]);
      }, 800);
    } else if (intervalRef.current !== null) clearInterval(intervalRef.current);
    return () => { if (intervalRef.current !== null) clearInterval(intervalRef.current); };
  }, [running]);

  const maxCpu = Math.max(...cpuHistory);

  return (
    <div className="space-y-4">
      <div className="bg-[#0d1117] border border-white/10 rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-3 py-2 border-b border-white/8">
          <span className="text-xs font-mono text-white/40">processOrders.js</span>
          <div className="flex gap-1.5">
            <button onClick={startDebug} disabled={running && currentLine >= 0}
              className="px-2 py-1 rounded-lg bg-green-500/20 border border-green-400/30 text-green-400 text-[10px] font-bold">▶ Debug</button>
            <button onClick={stepBack} disabled={history.length === 0}
              className="px-2 py-1 rounded-lg bg-orange-500/15 border border-orange-400/25 text-orange-400 text-[10px] font-bold disabled:opacity-40">⏪</button>
            <button onClick={stepForward} disabled={!running || currentLine < 0}
              className="px-2 py-1 rounded-lg bg-blue-500/15 border border-blue-400/25 text-blue-400 text-[10px] font-bold disabled:opacity-40">⏩</button>
          </div>
        </div>
        {codeLines.map((line, i) => (
          <div key={i} className={cn("flex items-center px-3 py-0.5 font-mono text-[12px] transition-all",
            i === currentLine ? "bg-yellow-400/10 border-l-2 border-yellow-400" : "")}>
            <span className="w-6 text-white/20 text-right mr-3">{i + 1}</span>
            <span className={i === currentLine ? "text-yellow-300" : "text-white/50"}>{line}</span>
          </div>
        ))}
      </div>

      {running && currentLine >= 0 && (
        <div className="bg-black/20 border border-white/8 rounded-xl p-3">
          <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-2">المتغيرات الحالية</p>
          {[
            { name: "total", value: currentLine < 2 ? "0" : (currentLine * 124.5).toFixed(2) },
            { name: "i", value: currentLine < 3 ? "—" : String(Math.max(0, currentLine - 3)) },
            { name: "orders.length", value: "7" },
          ].map(v => (
            <div key={v.name} className="flex items-center gap-2 py-1">
              <span className="font-mono text-[11px] text-cyan-400">{v.name}</span>
              <span className="text-white/20">=</span>
              <span className="font-mono text-[11px] text-yellow-400">{v.value}</span>
            </div>
          ))}
        </div>
      )}

      <div className="space-y-2">
        <p className="text-[11px] font-bold text-white/40 uppercase tracking-widest">Memory Profiler (لحظي)</p>
        <div className="flex items-end gap-0.5 h-16 px-1">
          {cpuHistory.map((val, i) => (
            <div key={i} className="flex-1 rounded-sm transition-all" style={{ height: `${val}%`, background: val > 60 ? "#f87171" : val > 40 ? "#facc15" : "#4ade80", opacity: i === cpuHistory.length - 1 ? 1 : 0.5 + (i / cpuHistory.length) * 0.5 }} />
          ))}
        </div>
        <div className="flex justify-between text-[10px] text-white/30">
          <span>CPU (آخر 10 ثوانٍ) — أعلى: {maxCpu}%</span>
          <span className={cn(maxCpu > 60 ? "text-red-400" : "text-green-400")}>{cpuHistory[cpuHistory.length - 1]}% الآن</span>
        </div>
      </div>

      <div className="bg-purple-500/8 border border-purple-400/20 rounded-xl px-3 py-2.5 text-xs text-purple-300/80 leading-relaxed">
        ⏪ <strong>Time-travel Debugging:</strong> اضغط ⏪ للعودة خطوة للخلف في تنفيذ الكود — ميزة احترافية نادرة حتى في VS Code.
      </div>
    </div>
  );
}

/* 6. GRANULAR PERMISSIONS */
function PermissionsSection() {
  const { toast } = useToast();
  const [permissions, setPermissions] = useState([
    { user: "Ahmed", role: "Frontend Dev", files: { "src/components/": true, ".env": false, "src/api/": false, "package.json": true } },
    { user: "Sara", role: "Backend Dev", files: { "src/components/": false, ".env": true, "src/api/": true, "package.json": true } },
    { user: "Omar", role: "Designer", files: { "src/components/": true, ".env": false, "src/api/": false, "package.json": false } },
  ]);

  const toggle = (userIdx: number, file: string) => {
    setPermissions(prev => prev.map((u, i) => i === userIdx ? { ...u, files: { ...u.files, [file]: !u.files[file as keyof typeof u.files] } } : u));
    toast({ title: "🔐 صلاحية محدّثة", description: `${permissions[userIdx].user} ← ${file}` });
  };

  const files = ["src/components/", ".env", "src/api/", "package.json"];

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-white/8">
              <th className="text-left py-2 pr-3 text-white/40 font-semibold text-[10px] uppercase">المطور</th>
              {files.map(f => <th key={f} className="text-center py-2 px-1 text-white/40 font-mono text-[9px]">{f.replace("src/", "")}</th>)}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {permissions.map((user, ui) => (
              <tr key={user.user}>
                <td className="py-2.5 pr-3">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-blue-500/40 flex items-center justify-center text-[10px] font-bold text-blue-300">{user.user[0]}</div>
                    <div>
                      <p className="text-white text-[11px] font-semibold">{user.user}</p>
                      <p className="text-white/30 text-[10px]">{user.role}</p>
                    </div>
                  </div>
                </td>
                {files.map(file => (
                  <td key={file} className="text-center py-2.5 px-1">
                    <button onClick={() => toggle(ui, file)}
                      className={cn("w-7 h-5 rounded-full border transition-all mx-auto flex items-center justify-center",
                        user.files[file as keyof typeof user.files] ? "bg-green-500/30 border-green-400/40" : "bg-red-500/15 border-red-400/20")}>
                      {user.files[file as keyof typeof user.files]
                        ? <Check size={10} className="text-green-400" />
                        : <X size={10} className="text-red-400" />}
                    </button>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="bg-amber-500/8 border border-amber-400/20 rounded-xl px-3 py-2.5 text-xs text-amber-300/80 leading-relaxed">
        🔐 كل مطور يرى فقط الملفات المسموح له — حتى الـ .env يبقى مخفياً تماماً عن من لا يملك صلاحية.
      </div>
    </div>
  );
}

/* 7. PRIVATE AI */
function PrivateAISection() {
  const { toast } = useToast();
  const [mode, setMode] = useState<"cloud" | "local">("cloud");
  const [selectedModel, setSelectedModel] = useState("llama-3.2-3b");
  const [loading, setLoading] = useState(false);
  const models = [
    { id: "llama-3.2-3b", name: "Llama 3.2 3B", size: "2.1GB", speed: "سريع جداً", privacy: "100%" },
    { id: "llama-3.1-8b", name: "Llama 3.1 8B", size: "4.7GB", speed: "سريع", privacy: "100%" },
    { id: "deepseek-coder-1.3b", name: "DeepSeek Coder 1.3B", size: "0.8GB", speed: "فوري", privacy: "100%" },
    { id: "phi-3-mini", name: "Phi-3 Mini", size: "2.3GB", speed: "سريع", privacy: "100%" },
  ];

  const activate = async () => {
    setLoading(true);
    await new Promise(r => setTimeout(r, 2000));
    setLoading(false);
    toast({ title: `🔒 ${models.find(m => m.id === selectedModel)?.name} محلي نشط`, description: "كودك لن يغادر جهازك أبداً" });
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2">
        {(["cloud", "local"] as const).map(m => (
          <button key={m} onClick={() => setMode(m)}
            className={cn("flex flex-col items-center gap-2 p-3 rounded-xl border text-xs font-semibold transition-all",
              mode === m ? "bg-blue-500/20 border-blue-400/35 text-blue-400" : "bg-white/4 border-white/8 text-white/40")}>
            {m === "cloud" ? <><Globe size={16} /><span>Cloud AI (افتراضي)</span><span className="text-[10px] opacity-60">يُرسل الكود لخوادم Replit</span></> : <><Shield size={16} /><span>Local AI (خصوصي)</span><span className="text-[10px] opacity-60">كودك يبقى محلياً 100%</span></>}
          </button>
        ))}
      </div>

      {mode === "local" && (
        <div className="space-y-2">
          <p className="text-[11px] font-bold text-white/40 uppercase tracking-widest">اختر نموذجاً محلياً</p>
          {models.map(m => (
            <button key={m.id} onClick={() => setSelectedModel(m.id)}
              className={cn("w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border text-left transition-all",
                selectedModel === m.id ? "bg-blue-500/15 border-blue-400/30" : "bg-black/20 border-white/6 hover:border-white/15")}>
              <div className={cn("w-2 h-2 rounded-full shrink-0", selectedModel === m.id ? "bg-blue-400" : "bg-white/20")} />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-white">{m.name}</p>
                <p className="text-[10px] text-white/40">{m.size} · {m.speed}</p>
              </div>
              <span className="text-[10px] text-green-400 bg-green-500/10 border border-green-400/20 px-1.5 py-0.5 rounded-full">🔒 {m.privacy}</span>
            </button>
          ))}
          <button onClick={activate} disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-blue-500/20 border border-blue-400/30 text-blue-400 text-sm font-bold disabled:opacity-50 transition-all">
            {loading ? <Loader2 size={15} className="animate-spin" /> : <Shield size={15} />}
            {loading ? "جاري تحميل النموذج..." : "تفعيل النموذج المحلي"}
          </button>
        </div>
      )}
    </div>
  );
}

/* 8. CLOUD DEPLOY */
function CloudDeploySection() {
  const { toast } = useToast();
  const [deploying, setDeploying] = useState<string | null>(null);
  const providers = [
    { id: "aws", name: "AWS (Amazon)", service: "EC2 + S3 + RDS", color: "text-orange-400", bg: "bg-orange-500/10 border-orange-400/20", logo: "AWS" },
    { id: "gcp", name: "Google Cloud", service: "Cloud Run + Cloud SQL", color: "text-blue-400", bg: "bg-blue-500/10 border-blue-400/20", logo: "GCP" },
    { id: "azure", name: "Microsoft Azure", service: "App Service + CosmosDB", color: "text-cyan-400", bg: "bg-cyan-500/10 border-cyan-400/20", logo: "AZ" },
    { id: "vercel", name: "Vercel", service: "Serverless + Edge", color: "text-white", bg: "bg-white/8 border-white/15", logo: "▲" },
    { id: "railway", name: "Railway", service: "Full-stack + DB", color: "text-purple-400", bg: "bg-purple-500/10 border-purple-400/20", logo: "Ry" },
  ];

  const deploy = async (id: string, name: string) => {
    setDeploying(id);
    toast({ title: `🚀 نشر على ${name}...`, description: "جاري بناء المشروع وإعداد السيرفر" });
    await new Promise(r => setTimeout(r, 2500));
    setDeploying(null);
    toast({ title: `✅ نُشر بنجاح على ${name}!`, description: `https://my-app.${id}.app — يعمل الآن 24/7` });
  };

  return (
    <div className="space-y-2">
      {providers.map(p => (
        <div key={p.id} className={cn("flex items-center gap-3 px-4 py-3 border rounded-xl", p.bg)}>
          <div className={cn("w-10 h-10 rounded-xl bg-black/30 border border-white/10 flex items-center justify-center font-bold text-sm shrink-0", p.color)}>
            {p.logo}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white">{p.name}</p>
            <p className="text-[11px] text-white/40 truncate">{p.service}</p>
          </div>
          <button onClick={() => deploy(p.id, p.name)} disabled={deploying === p.id}
            className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold border shrink-0 transition-all", p.bg, p.color)}>
            {deploying === p.id ? <Loader2 size={11} className="animate-spin" /> : <Rocket size={11} />}
            {deploying === p.id ? "نشر..." : "نشر"}
          </button>
        </div>
      ))}
    </div>
  );
}

/* 9. VISUAL GIT TIMELINE */
function GitTimelineSection() {
  const { toast } = useToast();
  const [selected, setSelected] = useState<number | null>(null);
  const commits = [
    { id: "a1b2", msg: "إضافة صفحة تسجيل الدخول", author: "Ahmed", time: "منذ 5 دقائق", files: 3, additions: 127, deletions: 0, branch: "main" },
    { id: "c3d4", msg: "إصلاح خطأ في التحقق من البريد", author: "Ahmed", time: "منذ 25 دقيقة", files: 1, additions: 12, deletions: 8, branch: "main" },
    { id: "e5f6", msg: "تصميم واجهة الرئيسية", author: "Sara", time: "منذ ساعة", files: 7, additions: 354, deletions: 20, branch: "feature/ui" },
    { id: "g7h8", msg: "إعداد قاعدة البيانات", author: "Omar", time: "منذ 3 ساعات", files: 2, additions: 89, deletions: 0, branch: "main" },
    { id: "i9j0", msg: "بداية المشروع 🚀", author: "Ahmed", time: "منذ يوم", files: 5, additions: 234, deletions: 0, branch: "main" },
  ];

  return (
    <div className="space-y-3">
      <div className="relative">
        <div className="absolute left-[19px] top-0 bottom-0 w-px bg-white/8" />
        {commits.map((commit, i) => (
          <button key={commit.id} onClick={() => setSelected(selected === i ? null : i)}
            className="relative flex items-start gap-3 w-full text-left mb-2 group">
            <div className={cn("w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 z-10 transition-all",
              selected === i ? "bg-blue-500/25 border-blue-400/50" : "bg-[#1a1a1a] border-white/10 group-hover:border-white/25")}>
              <GitBranch size={14} className={selected === i ? "text-blue-400" : "text-white/40"} />
            </div>
            <div className="flex-1 pt-1">
              <p className="text-xs font-semibold text-white leading-tight">{commit.msg}</p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[10px] text-white/30">{commit.author}</span>
                <span className="text-[10px] text-white/20">·</span>
                <span className="text-[10px] text-white/30">{commit.time}</span>
                <span className="text-[9px] font-mono bg-white/5 border border-white/10 px-1.5 py-0.5 rounded text-white/30">{commit.id}</span>
              </div>
              <AnimatePresence>
                {selected === i && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden mt-2">
                    <div className="bg-black/30 border border-white/8 rounded-xl p-3 space-y-1">
                      <div className="flex gap-3 text-[11px]">
                        <span className="text-white/40">{commit.files} ملفات</span>
                        <span className="text-green-400">+{commit.additions}</span>
                        <span className="text-red-400">-{commit.deletions}</span>
                        <span className="text-blue-400">{commit.branch}</span>
                      </div>
                      <div className="flex gap-2 mt-2">
                        <button onClick={e => { e.stopPropagation(); toast({ title: `⏪ استعادة إلى: ${commit.msg}`, description: "جاري إعادة المشروع لهذه النقطة..." }); }}
                          className="text-[10px] text-orange-400 border border-orange-400/25 px-2 py-1 rounded-lg hover:bg-orange-500/10 transition-colors">
                          استعادة هذه النقطة
                        </button>
                        <button onClick={e => { e.stopPropagation(); toast({ title: `👁 معاينة ${commit.id}`, description: "يتم فتح الكود في هذه اللحظة..." }); }}
                          className="text-[10px] text-blue-400 border border-blue-400/25 px-2 py-1 rounded-lg hover:bg-blue-500/10 transition-colors">
                          معاينة الكود
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

export default function AdvancedFeatures() {
  const [, setLocation] = useLocation();
  const features = [
    { id: "offline", icon: <WifiOff size={16} className="text-yellow-400" />, bg: "bg-yellow-500/15", title: "Offline Mode", subtitle: "العمل بدون إنترنت مع مزامنة تلقائية", badge: "جديد", content: <OfflineSection /> },
    { id: "docker", icon: <Layers size={16} className="text-blue-400" />, bg: "bg-blue-500/15", title: "Docker Compose", subtitle: "تشغيل عدة حاويات بملف واحد", badge: "Pro", content: <DockerSection /> },
    { id: "ui", icon: <Palette size={16} className="text-pink-400" />, bg: "bg-pink-500/15", title: "تخصيص الواجهة", subtitle: "مظاهر، خطوط، وتخطيطات حرة", content: <UICustomSection /> },
    { id: "ext", icon: <Package size={16} className="text-purple-400" />, bg: "bg-purple-500/15", title: "متجر الإضافات", subtitle: "آلاف الإضافات من المجتمع", content: <ExtensionsSection /> },
    { id: "debug", icon: <Bug size={16} className="text-red-400" />, bg: "bg-red-500/15", title: "Debugger المرئي", subtitle: "Memory Profiler + Time-travel", badge: "متقدم", content: <DebuggerSection /> },
    { id: "perms", icon: <Shield size={16} className="text-green-400" />, bg: "bg-green-500/15", title: "صلاحيات الملفات", subtitle: "تحكم دقيق لكل مطور في الفريق", content: <PermissionsSection /> },
    { id: "ai", icon: <Bot size={16} className="text-cyan-400" />, bg: "bg-cyan-500/15", title: "AI خاص ومحلي", subtitle: "نماذج تعمل دون إرسال كودك للخارج", badge: "خصوصية", content: <PrivateAISection /> },
    { id: "cloud", icon: <Cloud size={16} className="text-orange-400" />, bg: "bg-orange-500/15", title: "نشر سحابي بضغطة", subtitle: "AWS · GCP · Azure · Vercel · Railway", content: <CloudDeploySection /> },
    { id: "git", icon: <GitBranch size={16} className="text-amber-400" />, bg: "bg-amber-500/15", title: "Git Timeline المرئي", subtitle: "استعادة أي لحظة من تاريخ مشروعك", content: <GitTimelineSection /> },
  ];

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
      className="flex flex-col min-h-full pb-24 max-w-[480px] mx-auto w-full">
      <div className="px-4 pt-10 pb-4 sticky top-0 bg-background/95 backdrop-blur-md z-10 border-b border-white/5">
        <div className="flex items-center gap-3">
          <button onClick={() => setLocation("/explore")}
            className="w-8 h-8 rounded-lg bg-white/6 border border-white/10 flex items-center justify-center text-white/50 hover:text-white transition-colors">
            <ChevronLeft size={16} />
          </button>
          <div>
            <h1 className="text-lg font-bold text-white leading-tight">الميزات المتقدمة</h1>
            <p className="text-[11px] text-white/40">9 ميزات — كل شيء يعمل</p>
          </div>
          <div className="ml-auto px-2 py-1 bg-purple-500/15 border border-purple-400/25 rounded-full">
            <span className="text-[10px] text-purple-400 font-bold">9 ميزات</span>
          </div>
        </div>
      </div>

      <div className="px-4 py-4 space-y-2.5">
        {features.map((f, i) => (
          <motion.div key={f.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
            <Section id={f.id} icon={f.icon} iconBg={f.bg} title={f.title} subtitle={f.subtitle} badge={f.badge}>
              {f.content}
            </Section>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
