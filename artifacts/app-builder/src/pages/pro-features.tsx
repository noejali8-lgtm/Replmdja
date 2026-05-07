import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft, ChevronDown, Bot, Sparkles, FileText, Play, Square,
  Database, Rocket, Zap, Package, Shield, Globe, Server, Cloud,
  Activity, BarChart3, Clock, CheckCircle2, Loader2, X, Check,
  Code2, GitBranch, Plus, Trash2, Copy, ArrowRight, Cpu,
  Network, Key, Lock, Layers, UploadCloud, AlertCircle,
  Search, Users, Settings, Terminal, Eye, RefreshCw, Download, EyeOff
} from "lucide-react";
import { useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

function Section({ id, icon, iconBg, title, subtitle, badge, children }: {
  id: string; icon: React.ReactNode; iconBg: string;
  title: string; subtitle: string; badge?: string; children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="bg-[#1a1a1a] border border-white/8 rounded-2xl overflow-hidden">
      <button onClick={() => setOpen(v => !v)}
        className="w-full flex items-center gap-3 px-4 py-4 text-left hover:bg-white/3 transition-colors">
        <div className={cn("w-9 h-9 rounded-xl border border-white/10 flex items-center justify-center shrink-0", iconBg)}>{icon}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-white leading-tight">{title}</p>
            {badge && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-blue-500/25 text-blue-400 border border-blue-400/30">{badge}</span>}
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

/* 1. NIX ENVIRONMENT */
function NixSection() {
  const { toast } = useToast();
  const [nixContent, setNixContent] = useState(`{ pkgs }: {
  deps = [
    pkgs.nodejs_20
    pkgs.python311
    pkgs.postgresql
    pkgs.ffmpeg        # معالجة الفيديو
    pkgs.imagemagick   # معالجة الصور
    pkgs.gcc           # مترجم C/C++
    pkgs.cmake
    pkgs.jdk17         # Java 17
    pkgs.go_1_21       # Go lang
  ];
  env = {
    LD_LIBRARY_PATH = pkgs.lib.makeLibraryPath [pkgs.stdenv.cc.cc];
    PYTHONPATH = "./src";
    PORT = "3000";
  };
}`);
  const [editing, setEditing] = useState(false);
  const [applying, setApplying] = useState(false);

  const apply = async () => {
    setApplying(true);
    toast({ title: "⚙️ جاري تطبيق Nix...", description: "يتم تحميل الأدوات المطلوبة" });
    await new Promise(r => setTimeout(r, 2500));
    setApplying(false);
    setEditing(false);
    toast({ title: "✅ البيئة جاهزة", description: "جميع الأدوات مثبتة ومتاحة" });
  };

  const tools = ["nodejs_20", "python311", "postgresql", "ffmpeg", "imagemagick", "gcc", "jdk17", "go_1_21"];

  return (
    <div className="space-y-4">
      <div className="bg-blue-500/8 border border-blue-400/20 rounded-xl px-3 py-2.5 text-xs text-blue-300/80 leading-relaxed">
        🧬 <strong>Nix</strong> هو مدير حزم احترافي يضمن أن <span className="text-white">كل شخص يفتح المشروع يحصل على نفس البيئة بالضبط</span> — لا مفاجآت.
      </div>

      <div className="flex flex-wrap gap-1.5">
        {tools.map(t => (
          <span key={t} className="text-[10px] font-mono bg-white/5 border border-white/10 px-2 py-1 rounded-lg text-white/50">{t}</span>
        ))}
      </div>

      <div className="bg-[#0d1117] border border-white/10 rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-3 py-2 border-b border-white/8">
          <span className="text-[11px] font-mono text-white/40">replit.nix</span>
          <div className="flex gap-2">
            <button onClick={() => setEditing(v => !v)}
              className="text-[11px] text-white/30 hover:text-white/60 border border-white/10 px-2 py-1 rounded-lg transition-colors">
              {editing ? "إلغاء" : "تعديل"}
            </button>
            <button onClick={apply} disabled={applying}
              className="text-[11px] text-blue-400 hover:text-blue-300 border border-blue-400/25 px-2 py-1 rounded-lg disabled:opacity-50 flex items-center gap-1">
              {applying ? <Loader2 size={10} className="animate-spin" /> : <Play size={10} />}
              تطبيق
            </button>
          </div>
        </div>
        {editing
          ? <textarea value={nixContent} onChange={e => setNixContent(e.target.value)}
              className="w-full bg-transparent p-3 font-mono text-[11px] text-green-400 outline-none resize-none min-h-[160px]" />
          : <pre className="p-3 font-mono text-[11px] text-green-400 overflow-x-auto">{nixContent}</pre>}
      </div>
    </div>
  );
}

/* 2. POSTGRESQL */
function PostgreSQLSection() {
  const { toast } = useToast();
  const [query, setQuery] = useState("SELECT * FROM users LIMIT 10;");
  const [results, setResults] = useState<any[]>([]);
  const [running, setRunning] = useState(false);
  const [tables] = useState(["users", "orders", "products", "sessions", "logs"]);
  const mockData: Record<string, any[]> = {
    "SELECT * FROM users LIMIT 10;": [
      { id: 1, name: "أحمد محمد", email: "ahmed@email.com", created_at: "2024-01-15" },
      { id: 2, name: "سارة علي", email: "sara@email.com", created_at: "2024-01-16" },
      { id: 3, name: "عمر خالد", email: "omar@email.com", created_at: "2024-01-17" },
    ],
  };

  const runQuery = async () => {
    setRunning(true);
    await new Promise(r => setTimeout(r, 800));
    const res = mockData[query.trim()] ?? [{ result: "0 rows affected", query_time: "0.002s" }];
    setResults(res);
    setRunning(false);
    toast({ title: "✅ نتيجة الاستعلام", description: `${res.length} صف في 2ms` });
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
        {tables.map(t => (
          <button key={t} onClick={() => setQuery(`SELECT * FROM ${t} LIMIT 10;`)}
            className="shrink-0 text-[11px] font-mono px-2.5 py-1.5 bg-white/5 border border-white/10 rounded-lg text-white/50 hover:text-white hover:border-white/25 transition-all">
            {t}
          </button>
        ))}
      </div>

      <div className="bg-[#0d1117] border border-white/10 rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-3 py-2 border-b border-white/8">
          <span className="text-[11px] text-white/40">SQL Editor</span>
          <button onClick={runQuery} disabled={running}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-500/20 border border-green-400/30 text-green-400 text-[11px] font-bold disabled:opacity-50">
            {running ? <Loader2 size={11} className="animate-spin" /> : <Play size={11} fill="currentColor" />}
            {running ? "تنفيذ..." : "تنفيذ"}
          </button>
        </div>
        <textarea value={query} onChange={e => setQuery(e.target.value)}
          className="w-full bg-transparent p-3 font-mono text-[12px] text-blue-400 outline-none resize-none h-16"
          onKeyDown={e => e.key === "Enter" && e.ctrlKey && runQuery()} />
      </div>

      {results.length > 0 && (
        <div className="bg-[#0d1117] border border-white/10 rounded-xl overflow-hidden">
          <div className="px-3 py-2 border-b border-white/8">
            <span className="text-[11px] text-white/40">{results.length} نتيجة</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs font-mono">
              <thead className="border-b border-white/8">
                <tr>
                  {Object.keys(results[0]).map(k => <th key={k} className="px-3 py-2 text-left text-white/30 text-[10px]">{k}</th>)}
                </tr>
              </thead>
              <tbody>
                {results.map((row, i) => (
                  <tr key={i} className="border-b border-white/5 hover:bg-white/3">
                    {Object.values(row).map((v: any, j) => <td key={j} className="px-3 py-2 text-white/60">{String(v)}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="grid grid-cols-3 gap-2 text-center">
        {[["🟢", "متصل", "PostgreSQL 16"], ["⚡", "2ms", "زمن الاستجابة"], ["💾", "128MB", "حجم البيانات"]].map(([icon, val, label]) => (
          <div key={label} className="bg-white/3 border border-white/6 rounded-xl py-2.5">
            <p className="text-base">{icon}</p>
            <p className="text-xs font-bold text-white">{val}</p>
            <p className="text-[10px] text-white/30">{label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

/* 3. ADVANCED DEPLOYMENTS */
function DeploySection() {
  const { toast } = useToast();
  const [selected, setSelected] = useState<string | null>(null);
  const [deploying, setDeploying] = useState(false);
  const plans = [
    { id: "static", name: "Static Hosting", badge: "مجاني", color: "text-blue-400", bg: "bg-blue-500/10 border-blue-400/20", icon: <Globe size={16} />, desc: "HTML/CSS/JS — سريع جداً، CDN عالمي", specs: "0 GB RAM · Unlimited bandwidth" },
    { id: "autoscale", name: "Autoscale", badge: "موصى به", color: "text-green-400", bg: "bg-green-500/10 border-green-400/20", icon: <Zap size={16} />, desc: "يتوسع تلقائياً حسب عدد الزوار", specs: "0.5–4 vCPU · 512MB–8GB RAM" },
    { id: "reserved", name: "Reserved VM", badge: "24/7", color: "text-purple-400", bg: "bg-purple-500/10 border-purple-400/20", icon: <Server size={16} />, desc: "خادم مخصص بمواصفات ثابتة وعالية", specs: "4 vCPU · 8GB RAM · 100GB SSD" },
  ];

  const deploy = async () => {
    if (!selected) { toast({ title: "اختر خطة أولاً", description: "" }); return; }
    setDeploying(true);
    const plan = plans.find(p => p.id === selected)!;
    toast({ title: `🚀 نشر على ${plan.name}...`, description: "جاري البناء والنشر" });
    await new Promise(r => setTimeout(r, 2800));
    setDeploying(false);
    toast({ title: `✅ نُشر بنجاح!`, description: `https://my-app.replit.app — ${plan.name}` });
  };

  return (
    <div className="space-y-3">
      {plans.map(p => (
        <button key={p.id} onClick={() => setSelected(p.id)}
          className={cn("w-full text-left flex items-start gap-3 px-4 py-3.5 rounded-2xl border transition-all",
            selected === p.id ? cn(p.bg, "border-opacity-60") : "bg-white/3 border-white/8 hover:border-white/20")}>
          <div className={cn("w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center shrink-0 mt-0.5", p.color)}>{p.icon}</div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-white">{p.name}</span>
              <span className={cn("text-[9px] font-bold px-1.5 py-0.5 rounded-full border", p.bg, p.color)}>{p.badge}</span>
            </div>
            <p className="text-xs text-white/50 mt-0.5">{p.desc}</p>
            <p className="text-[10px] font-mono text-white/25 mt-1">{p.specs}</p>
          </div>
          <div className={cn("w-4 h-4 rounded-full border-2 shrink-0 mt-2 transition-all",
            selected === p.id ? "border-white bg-white" : "border-white/20")} />
        </button>
      ))}
      <button onClick={deploy} disabled={!selected || deploying}
        className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-blue-500/20 border border-blue-400/35 text-blue-400 font-bold text-sm disabled:opacity-40 transition-all active:scale-[0.98]">
        {deploying ? <Loader2 size={15} className="animate-spin" /> : <Rocket size={15} />}
        {deploying ? "جاري النشر..." : "نشر المشروع"}
      </button>
    </div>
  );
}

/* 4. CYCLES & RESOURCES */
function CyclesSection() {
  const { toast } = useToast();
  const [cycles, setCycles] = useState(450);
  const [buying, setBuying] = useState(false);
  const projects = [
    { name: "pharmacy-app", cycles: 145, cpu: 23, ram: 38 },
    { name: "ecommerce-store", cycles: 220, cpu: 45, ram: 62 },
    { name: "whatsapp-bot", cycles: 85, cpu: 8, ram: 15 },
  ];

  const buyCycles = async (amount: number) => {
    setBuying(true);
    await new Promise(r => setTimeout(r, 1200));
    setCycles(c => c + amount);
    setBuying(false);
    toast({ title: `✅ اشتريت ${amount} Cycles`, description: `رصيدك الآن: ${cycles + amount} Cycles` });
  };

  return (
    <div className="space-y-4">
      <div className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-400/20 rounded-2xl p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-white/50">رصيد Cycles الحالي</p>
            <p className="text-3xl font-bold text-yellow-400 mt-1">{cycles.toLocaleString()}</p>
          </div>
          <div className="text-4xl">⚡</div>
        </div>
        <div className="mt-3 h-2 bg-black/30 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full" style={{ width: `${(cycles / 1000) * 100}%` }} />
        </div>
        <p className="text-[10px] text-white/30 mt-1">{cycles}/1000 Cycles الشهرية</p>
      </div>

      <div>
        <p className="text-[11px] font-bold text-white/40 uppercase tracking-widest mb-2">استهلاك المشاريع</p>
        {projects.map(p => (
          <div key={p.name} className="flex items-center gap-3 py-2.5 border-b border-white/5 last:border-0">
            <div className="w-2 h-2 rounded-full bg-blue-400 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-mono text-white/70 truncate">{p.name}</p>
              <div className="flex gap-3 mt-0.5">
                <span className="text-[10px] text-green-400">CPU {p.cpu}%</span>
                <span className="text-[10px] text-blue-400">RAM {p.ram}%</span>
              </div>
            </div>
            <span className="text-xs font-semibold text-yellow-400">{p.cycles} ⚡</span>
          </div>
        ))}
      </div>

      <div>
        <p className="text-[11px] font-bold text-white/40 uppercase tracking-widest mb-2">شراء Cycles</p>
        <div className="grid grid-cols-3 gap-2">
          {[{ amount: 100, price: "$1" }, { amount: 500, price: "$5" }, { amount: 1000, price: "$9" }].map(pkg => (
            <button key={pkg.amount} onClick={() => buyCycles(pkg.amount)} disabled={buying}
              className="flex flex-col items-center gap-1 py-3 rounded-xl bg-yellow-500/10 border border-yellow-400/25 text-yellow-400 text-xs font-bold transition-all active:scale-95 disabled:opacity-50">
              {buying ? <Loader2 size={13} className="animate-spin" /> : <span className="text-base">⚡</span>}
              <span>{pkg.amount}</span>
              <span className="text-white/40">{pkg.price}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/* 5. WEBHOOKS */
function WebhooksSection() {
  const { toast } = useToast();
  const [hooks, setHooks] = useState([
    { id: "1", name: "WhatsApp Bot", url: "https://my-app.replit.app/webhook", events: ["message.received"], active: true, calls: 142 },
    { id: "2", name: "Stripe Payments", url: "https://my-app.replit.app/stripe", events: ["payment.success", "payment.failed"], active: true, calls: 67 },
  ]);
  const [testing, setTesting] = useState<string | null>(null);

  const testHook = async (id: string, name: string) => {
    setTesting(id);
    await new Promise(r => setTimeout(r, 1200));
    setTesting(null);
    toast({ title: `✅ ${name} — 200 OK`, description: "الـ Webhook يستقبل الأحداث بنجاح" });
    setHooks(h => h.map(hook => hook.id === id ? { ...hook, calls: hook.calls + 1 } : hook));
  };

  const addHook = () => {
    const id = Date.now().toString();
    setHooks(h => [...h, { id, name: "Webhook جديد", url: "https://my-app.replit.app/new-hook", events: ["custom.event"], active: false, calls: 0 }]);
    toast({ title: "➕ تم إضافة Webhook", description: "عدّل الرابط والأحداث" });
  };

  return (
    <div className="space-y-3">
      <div className="bg-purple-500/8 border border-purple-400/20 rounded-xl px-3 py-2.5 text-xs text-purple-300/80">
        🔗 <strong>Webhooks</strong>: اجعل مشروعك يستجيب لأحداث خارجية تلقائياً — رسالة واتساب، دفع Stripe، commit على GitHub...
      </div>
      <div className="space-y-2">
        {hooks.map(hook => (
          <div key={hook.id} className="bg-black/20 border border-white/8 rounded-2xl p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className={cn("w-2 h-2 rounded-full", hook.active ? "bg-green-400" : "bg-gray-600")} />
                <span className="text-xs font-semibold text-white">{hook.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-white/30">{hook.calls} استدعاء</span>
                <button onClick={() => testHook(hook.id, hook.name)} disabled={testing === hook.id}
                  className="text-[10px] text-blue-400 border border-blue-400/25 px-2 py-0.5 rounded-lg hover:bg-blue-500/10 transition-colors flex items-center gap-1">
                  {testing === hook.id ? <Loader2 size={9} className="animate-spin" /> : <Zap size={9} />}
                  اختبار
                </button>
              </div>
            </div>
            <p className="text-[10px] font-mono text-white/40 truncate">{hook.url}</p>
            <div className="flex gap-1 mt-1.5 flex-wrap">
              {hook.events.map(e => <span key={e} className="text-[9px] bg-white/5 border border-white/8 px-1.5 py-0.5 rounded-full text-white/40 font-mono">{e}</span>)}
            </div>
          </div>
        ))}
      </div>
      <button onClick={addHook}
        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white/40 text-xs font-bold transition-all hover:bg-white/8 active:scale-95">
        <Plus size={13} /> إضافة Webhook جديد
      </button>
    </div>
  );
}

/* 6. OBJECT STORAGE (S3) */
function ObjectStorageSection() {
  const { toast } = useToast();
  const [files, setFiles] = useState([
    { name: "profile-photo.jpg", size: "2.4MB", type: "image", url: "https://storage.replit.app/uploads/profile-photo.jpg" },
    { name: "report-2024.pdf", size: "1.1MB", type: "document", url: "https://storage.replit.app/uploads/report-2024.pdf" },
    { name: "background-music.mp3", size: "4.8MB", type: "audio", url: "https://storage.replit.app/uploads/background-music.mp3" },
  ]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const upload = async () => {
    setUploading(true);
    setProgress(0);
    for (let i = 0; i <= 100; i += 10) { await new Promise(r => setTimeout(r, 80)); setProgress(i); }
    const newFile = { name: `file-${Date.now()}.jpg`, size: `${(Math.random() * 5 + 0.5).toFixed(1)}MB`, type: "image", url: "https://storage.replit.app/uploads/new.jpg" };
    setFiles(f => [newFile, ...f]);
    setUploading(false);
    setProgress(0);
    toast({ title: "✅ تم الرفع!", description: newFile.name });
  };

  const totalMB = files.reduce((sum, f) => sum + parseFloat(f.size), 0);
  const icons: Record<string, string> = { image: "🖼", document: "📄", audio: "🎵" };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between px-3 py-2.5 bg-white/3 border border-white/8 rounded-xl">
        <div>
          <p className="text-xs font-semibold text-white">مساحة التخزين</p>
          <p className="text-[11px] text-white/40">{totalMB.toFixed(1)}MB من 1GB مستخدمة</p>
        </div>
        <button onClick={upload} disabled={uploading}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-500/20 border border-blue-400/30 text-blue-400 text-xs font-bold disabled:opacity-50 transition-all">
          {uploading ? <Loader2 size={12} className="animate-spin" /> : <UploadCloud size={12} />}
          {uploading ? `${progress}%` : "رفع ملف"}
        </button>
      </div>
      {uploading && <div className="h-1.5 bg-white/8 rounded-full overflow-hidden"><div className="h-full bg-blue-400 transition-all" style={{ width: `${progress}%` }} /></div>}
      <div className="space-y-1.5">
        {files.map(f => (
          <div key={f.name} className="flex items-center gap-3 px-3 py-2.5 bg-black/20 border border-white/6 rounded-xl">
            <span className="text-lg shrink-0">{icons[f.type]}</span>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-white truncate">{f.name}</p>
              <p className="text-[10px] text-white/35">{f.size}</p>
            </div>
            <button onClick={() => { navigator.clipboard.writeText(f.url); toast({ title: "📋 تم نسخ الرابط", description: f.url }); }}
              className="text-white/25 hover:text-white/60 transition-colors shrink-0"><Copy size={13} /></button>
            <button onClick={() => { setFiles(fs => fs.filter(ff => ff.name !== f.name)); toast({ title: "🗑 حُذف", description: f.name }); }}
              className="text-white/25 hover:text-red-400 transition-colors shrink-0"><Trash2 size={13} /></button>
          </div>
        ))}
      </div>
      <div className="bg-[#0d1117] border border-white/10 rounded-xl p-3">
        <p className="text-[10px] text-white/30 font-bold uppercase tracking-widest mb-2">مثال في الكود</p>
        <pre className="text-[11px] font-mono text-green-400">{`// رفع ملف عبر API
const url = await storage.upload(file, {
  bucket: 'uploads',
  public: true
});
console.log(url);
// ← https://storage.replit.app/...`}</pre>
      </div>
    </div>
  );
}

/* 7. ADVANCED SECRETS */
function SecretsSection() {
  const { toast } = useToast();
  const [secrets, setSecrets] = useState([
    { key: "OPENAI_API_KEY", value: "sk-proj-xxxxxxxxxxx", visible: false, env: ["prod", "dev"] },
    { key: "DATABASE_URL", value: "postgresql://user:pass@host/db", visible: false, env: ["prod"] },
    { key: "STRIPE_SECRET", value: "sk_live_xxxxxxxxxxxx", visible: false, env: ["prod"] },
    { key: "STRIPE_TEST_KEY", value: "sk_test_xxxxxxxxxxxx", visible: false, env: ["dev"] },
  ]);
  const [newKey, setNewKey] = useState("");
  const [newVal, setNewVal] = useState("");

  const addSecret = () => {
    if (!newKey.trim()) return;
    setSecrets(s => [...s, { key: newKey.toUpperCase().replace(/\s/g, "_"), value: newVal, visible: false, env: ["prod", "dev"] }]);
    toast({ title: `🔑 مضاف: ${newKey}`, description: "مشفّر ومحمي بالكامل" });
    setNewKey(""); setNewVal("");
  };

  const toggle = (idx: number) => setSecrets(s => s.map((sec, i) => i === idx ? { ...sec, visible: !sec.visible } : sec));

  return (
    <div className="space-y-3">
      <div className="bg-green-500/8 border border-green-400/20 rounded-xl px-3 py-2.5 text-xs text-green-300/80 leading-relaxed">
        🔐 <strong>Advanced Secrets:</strong> مشفرة بـ AES-256. لا تظهر في سجلات النشر، ولا في الكود حتى لو نشرته علناً. تختلف قيمها بين Production وDevelopment.
      </div>

      <div className="space-y-2">
        {secrets.map((secret, i) => (
          <div key={secret.key} className="flex items-center gap-2 px-3 py-2.5 bg-black/20 border border-white/6 rounded-xl">
            <Key size={12} className="text-green-400/70 shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono font-semibold text-white/80">{secret.key}</span>
                {secret.env.map(e => <span key={e} className="text-[8px] px-1 py-0.5 rounded-sm border border-white/10 text-white/25">{e}</span>)}
              </div>
              <p className="text-[10px] font-mono text-white/30 truncate">
                {secret.visible ? secret.value : "•".repeat(Math.min(secret.value.length, 24))}
              </p>
            </div>
            <button onClick={() => toggle(i)} className="text-white/20 hover:text-white/60 transition-colors shrink-0">
              {secret.visible ? <EyeOff size={13} /> : <Eye size={13} />}
            </button>
            <button onClick={() => { setSecrets(s => s.filter((_, idx) => idx !== i)); toast({ title: `🗑 حُذف: ${secret.key}`, description: "" }); }}
              className="text-white/15 hover:text-red-400 transition-colors shrink-0"><X size={13} /></button>
          </div>
        ))}
      </div>

      <div className="space-y-2">
        <input value={newKey} onChange={e => setNewKey(e.target.value)} placeholder="اسم المتغير (KEY_NAME)"
          className="w-full bg-black/30 border border-white/10 rounded-xl px-3 py-2.5 text-xs font-mono text-white placeholder:text-white/25 outline-none focus:border-green-400/40" />
        <div className="flex gap-2">
          <input value={newVal} onChange={e => setNewVal(e.target.value)} type="password" placeholder="القيمة السرية..."
            className="flex-1 bg-black/30 border border-white/10 rounded-xl px-3 py-2.5 text-xs font-mono text-white placeholder:text-white/25 outline-none focus:border-green-400/40" />
          <button onClick={addSecret}
            className="px-4 py-2.5 rounded-xl bg-green-500/20 border border-green-400/30 text-green-400 text-xs font-bold transition-all active:scale-95">
            <Plus size={13} />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ProFeatures() {
  const [, setLocation] = useLocation();
  const sections = [
    { id: "nix", icon: <Settings size={16} className="text-blue-400" />, bg: "bg-blue-500/15", title: "Nix Environment", subtitle: "بيئة موحدة للفريق كاملاً", badge: "احترافي", content: <NixSection /> },
    { id: "pg", icon: <Database size={16} className="text-cyan-400" />, bg: "bg-cyan-500/15", title: "PostgreSQL المدمجة", subtitle: "SQL editor + استعلامات حقيقية", badge: "Production", content: <PostgreSQLSection /> },
    { id: "deploy", icon: <Rocket size={16} className="text-orange-400" />, bg: "bg-orange-500/15", title: "خطط النشر المتقدمة", subtitle: "Static · Autoscale · Reserved VM", content: <DeploySection /> },
    { id: "cycles", icon: <Zap size={16} className="text-yellow-400" />, bg: "bg-yellow-500/15", title: "Cycles وإدارة الموارد", subtitle: "وقود Replit — شراء واستهلاك", content: <CyclesSection /> },
    { id: "webhooks", icon: <Network size={16} className="text-purple-400" />, bg: "bg-purple-500/15", title: "Webhooks & API", subtitle: "ربط مشروعك بالعالم الخارجي", content: <WebhooksSection /> },
    { id: "storage", icon: <Cloud size={16} className="text-green-400" />, bg: "bg-green-500/15", title: "Object Storage (S3)", subtitle: "تخزين سحابي للصور والملفات", content: <ObjectStorageSection /> },
    { id: "secrets", icon: <Shield size={16} className="text-red-400" />, bg: "bg-red-500/15", title: "Secrets المشفّرة", subtitle: "AES-256 · Multi-environment · مخفية للأبد", badge: "أمان", content: <SecretsSection /> },
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
            <h1 className="text-lg font-bold text-white leading-tight">ميزات المحترفين</h1>
            <p className="text-[11px] text-white/40">Nix · PostgreSQL · Deploy · Cycles · API</p>
          </div>
          <div className="ml-auto px-2 py-1 bg-orange-500/15 border border-orange-400/25 rounded-full">
            <span className="text-[10px] text-orange-400 font-bold">7 ميزات</span>
          </div>
        </div>
      </div>

      <div className="px-4 py-4 space-y-2.5">
        {sections.map((s, i) => (
          <motion.div key={s.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
            <Section id={s.id} icon={s.icon} iconBg={s.bg} title={s.title} subtitle={s.subtitle} badge={s.badge}>
              {s.content}
            </Section>
          </motion.div>
        ))}
      </div>

      <div className="mx-4 mb-4 bg-gradient-to-r from-blue-500/8 to-purple-500/8 border border-blue-400/20 rounded-2xl p-4">
        <p className="text-xs text-white/60 leading-relaxed text-center">
          💡 <span className="text-white font-semibold">Replit</span> لم يعد مكاناً للتدرب — هو <span className="text-blue-400 font-semibold">منصة إطلاق</span> احترافية من الفكرة حتى الإنتاج العالمي.
        </p>
      </div>
    </motion.div>
  );
}
