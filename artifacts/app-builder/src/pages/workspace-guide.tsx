import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play, Square, Share2, Rocket, ChevronDown, ChevronLeft,
  FolderOpen, Folder, FileText, Plus, Upload, Download, MoreVertical,
  GitBranch, GitCommit, GitMerge, Package, Lock, Database, Clock,
  Terminal, Monitor, Globe, RefreshCw, ExternalLink, Maximize2,
  Settings, Cpu, Wifi, WifiOff, CircleDot, Search, Bot, Sparkles,
  Users, MessageSquare, Code2, Bug, Zap, AlertCircle, CheckCircle2,
  Loader2, Eye, EyeOff, Key, X, Check, Copy, ArrowRight,
  LayoutTemplate, Layers, Type, AlignJustify, Keyboard, WrapText,
  FileCode, Braces, Shield, Activity, BarChart3
} from "lucide-react";
import { useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

/* ─── Helper UI components ──────────────────────────────── */
function ActionBtn({
  icon, label, color = "bg-white/8 border-white/12 text-white/70",
  onClick, badge, active = false
}: {
  icon: React.ReactNode; label: string; color?: string;
  onClick?: () => void; badge?: string; active?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-semibold transition-all active:scale-[0.97] hover:opacity-90 relative",
        active ? "bg-green-500/20 border-green-400/40 text-green-400" : color
      )}
    >
      {icon}
      <span>{label}</span>
      {badge && (
        <span className="absolute -top-1.5 -right-1.5 bg-blue-500 text-white text-[9px] font-bold px-1.5 rounded-full leading-tight">{badge}</span>
      )}
    </button>
  );
}

function InfoRow({ icon, title, desc, code }: { icon: React.ReactNode; title: string; desc: string; code?: string }) {
  return (
    <div className="flex gap-3 py-3 border-b border-white/5 last:border-0">
      <div className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0 text-white/60 mt-0.5">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-white leading-tight">{title}</p>
        <p className="text-xs text-white/50 leading-relaxed mt-0.5">{desc}</p>
        {code && (
          <div className="mt-1.5 bg-black/30 border border-white/8 rounded-lg px-2.5 py-1.5">
            <code className="text-[11px] font-mono text-green-400">{code}</code>
          </div>
        )}
      </div>
    </div>
  );
}

function StatusDot({ active, label }: { active: boolean; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className={cn("w-2 h-2 rounded-full", active ? "bg-green-400 shadow-[0_0_6px_#4ade80]" : "bg-red-400")} />
      <span className="text-[11px] text-white/50">{label}</span>
    </div>
  );
}

function CodeBlock({ code, lang = "bash" }: { code: string; lang?: string }) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    toast({ title: "تم النسخ", description: code });
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className="relative mt-2 bg-black/40 border border-white/10 rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-white/8">
        <span className="text-[10px] font-mono text-white/30">{lang}</span>
        <button onClick={copy} className="text-white/30 hover:text-white/70 transition-colors">
          {copied ? <Check size={12} /> : <Copy size={12} />}
        </button>
      </div>
      <pre className="px-3 py-2.5 text-[12px] font-mono text-green-400 overflow-x-auto whitespace-pre-wrap">{code}</pre>
    </div>
  );
}

/* ─── Section wrapper ──────────────────────────────────── */
function Section({
  id, icon, iconBg, title, subtitle, defaultOpen = false, children
}: {
  id: string; icon: React.ReactNode; iconBg: string;
  title: string; subtitle: string; defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="bg-[#1a1a1a] border border-white/8 rounded-2xl overflow-hidden">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center gap-3 px-4 py-4 text-left hover:bg-white/3 transition-colors active:bg-white/5"
        data-testid={`section-${id}`}
      >
        <div className={cn("w-9 h-9 rounded-xl border border-white/10 flex items-center justify-center shrink-0", iconBg)}>
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white leading-tight">{title}</p>
          <p className="text-xs text-white/40 mt-0.5 truncate">{subtitle}</p>
        </div>
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.18 }} className="text-white/30 shrink-0">
          <ChevronDown size={18} />
        </motion.div>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-5 pt-1 border-t border-white/5 space-y-4">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   HEADER BAR SECTION
══════════════════════════════════════════════════════════ */
function HeaderBarSection() {
  const { toast } = useToast();
  const [running, setRunning] = useState(false);
  const [runTimer, setRunTimer] = useState<ReturnType<typeof setTimeout> | null>(null);

  const handleRun = () => {
    if (running) {
      setRunning(false);
      if (runTimer) clearTimeout(runTimer);
      toast({ title: "⏹ تم إيقاف التشغيل", description: "تم إيقاف المشروع بنجاح" });
    } else {
      setRunning(true);
      toast({ title: "▶ جاري تشغيل المشروع...", description: "يتم تحميل الاعتماديات وتشغيل الخادم" });
      const t = setTimeout(() => setRunning(false), 8000);
      setRunTimer(t);
    }
  };

  return (
    <div className="space-y-4">
      {/* Visual mock of header bar */}
      <div className="bg-[#0d1117] border border-white/10 rounded-xl overflow-hidden">
        <div className="flex items-center gap-2 px-3 py-2.5 border-b border-white/8">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500/70" />
            <div className="w-3 h-3 rounded-full bg-yellow-500/70" />
            <div className="w-3 h-3 rounded-full bg-green-500/70" />
          </div>
          <span className="text-xs text-white/40 mx-auto font-mono">my-web-app — Replit</span>
        </div>
        <div className="flex items-center gap-2 px-3 py-2.5 overflow-x-auto no-scrollbar">
          <button
            onClick={handleRun}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 border",
              running
                ? "bg-red-500/20 border-red-400/40 text-red-400"
                : "bg-green-500/20 border-green-400/40 text-green-400"
            )}
            data-testid="btn-run"
          >
            {running ? <><Square size={11} fill="currentColor" /> Stop</> : <><Play size={11} fill="currentColor" /> Run</>}
          </button>
          {running && (
            <motion.div initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: "auto" }} className="flex items-center gap-1 text-[11px] text-green-400 shrink-0">
              <Loader2 size={10} className="animate-spin" />
              <span>Running...</span>
            </motion.div>
          )}
          <div className="flex-1" />
          {[
            { icon: <Sparkles size={13} />, label: "AI", tip: "Replit AI", color: "text-purple-400 bg-purple-500/10 border-purple-400/20" },
            { icon: <Users size={13} />, label: "Invite", tip: "دعوة للتعاون", color: "text-blue-400 bg-blue-500/10 border-blue-400/20" },
            { icon: <MessageSquare size={13} />, label: "Threads", tip: "المحادثات", color: "text-white/50 bg-white/5 border-white/10" },
            { icon: <Rocket size={13} />, label: "Deploy", tip: "النشر", color: "text-orange-400 bg-orange-500/10 border-orange-400/20" },
          ].map(item => (
            <button
              key={item.label}
              onClick={() => toast({ title: item.tip, description: `تم الضغط على زر ${item.label}` })}
              className={cn("flex items-center gap-1 px-2 py-1.5 rounded-lg text-[11px] font-semibold border shrink-0 transition-all active:scale-95", item.color)}
              data-testid={`hdr-btn-${item.label.toLowerCase()}`}
            >
              {item.icon}
              <span className="hidden sm:inline">{item.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Details */}
      <div>
        <InfoRow icon={<Play size={14} className="text-green-400" />} title="زر Run (▶)" desc="هو المحرك الرئيسي. يقوم بتنفيذ الأمر المكتوب في ملف .replit. إذا لم يكن الملف موجوداً، يحاول التخمين بناءً على لغة المشروع." />
        <InfoRow icon={<Sparkles size={14} className="text-purple-400" />} title="الذكاء الاصطناعي (Replit AI)" desc="أيقونة تشبه البريق تفتح لك شات ذكاء اصطناعي يفهم كامل مشروعك ويساعدك في البرمجة." />
        <InfoRow icon={<Users size={14} className="text-blue-400" />} title="Invite (دعوة)" desc="يولد رابطاً للسماح للآخرين بالدخول معك في المشروع برمجياً في نفس اللحظة — Multiplayer." />
        <InfoRow icon={<MessageSquare size={14} className="text-white/60" />} title="Threads (المحادثات)" desc="تسمح بوضع تعليقات على أسطر كود محددة لمناقشتها مع فريقك. ميزة لم تكن موجودة قديماً." />
        <InfoRow icon={<Rocket size={14} className="text-orange-400" />} title="Deployment (الصاروخ 🚀)" desc="لنشر مشروعك ليصبح تطبيقاً حقيقياً يعمل 24/7 برابط احترافي." />
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   SIDEBAR SECTION
══════════════════════════════════════════════════════════ */
function SidebarSection() {
  const { toast } = useToast();
  const [showSecretValue, setShowSecretValue] = useState(false);
  const [commitMsg, setCommitMsg] = useState("");
  const [pushing, setPushing] = useState(false);
  const [searchPkg, setSearchPkg] = useState("");
  const [installed, setInstalled] = useState<string[]>(["react", "express"]);
  const [dbKey, setDbKey] = useState("");
  const [dbVal, setDbVal] = useState("");
  const [dbStore, setDbStore] = useState<Record<string, string>>({ user_name: "Ahmed", theme: "dark" });
  const [scheduleTime, setScheduleTime] = useState("08:00");
  const [scheduleEnabled, setScheduleEnabled] = useState(false);

  const handlePush = async () => {
    if (!commitMsg.trim()) { toast({ title: "✏️ اكتب رسالة Commit أولاً", description: "مطلوب وصف للتعديلات" }); return; }
    setPushing(true);
    toast({ title: "📤 جاري الرفع إلى GitHub...", description: commitMsg });
    await new Promise(r => setTimeout(r, 1800));
    setPushing(false);
    toast({ title: "✅ تم الرفع بنجاح", description: `main ← ${commitMsg}` });
    setCommitMsg("");
  };

  const handleInstall = () => {
    const pkg = searchPkg.trim().toLowerCase();
    if (!pkg) return;
    if (installed.includes(pkg)) { toast({ title: "📦 المكتبة مثبتة مسبقاً", description: pkg }); return; }
    setInstalled(p => [...p, pkg]);
    toast({ title: `📦 تم تثبيت ${pkg}`, description: "npm install " + pkg });
    setSearchPkg("");
  };

  const handleDbSet = () => {
    if (!dbKey.trim()) { toast({ title: "اكتب المفتاح (Key)", description: "" }); return; }
    setDbStore(s => ({ ...s, [dbKey]: dbVal }));
    toast({ title: "💾 تم الحفظ في قاعدة البيانات", description: `${dbKey} = "${dbVal}"` });
    setDbKey(""); setDbVal("");
  };

  const subsections = [
    {
      id: "files",
      label: "أولاً: إدارة الملفات (Files)",
      color: "text-yellow-400",
      content: (
        <div className="space-y-3">
          <div className="bg-[#0d1117] border border-white/10 rounded-xl p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-white/60 uppercase tracking-widest">Files</span>
              <div className="flex gap-1.5">
                {[
                  { icon: <FileText size={13} />, tip: "ملف جديد", action: () => toast({ title: "📄 ملف جديد", description: "أدخل اسم الملف..." }) },
                  { icon: <Folder size={13} />, tip: "مجلد جديد", action: () => toast({ title: "📁 مجلد جديد", description: "أدخل اسم المجلد..." }) },
                  { icon: <MoreVertical size={13} />, tip: "رفع / تحميل", action: () => toast({ title: "⋮ خيارات", description: "Upload / Download as zip" }) },
                ].map((btn, i) => (
                  <button key={i} onClick={btn.action} title={btn.tip}
                    className="w-6 h-6 rounded-lg bg-white/6 border border-white/10 flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-all">
                    {btn.icon}
                  </button>
                ))}
              </div>
            </div>
            {[
              { name: "src/", type: "folder" },
              { name: "src/App.tsx", type: "file" },
              { name: "src/index.tsx", type: "file" },
              { name: "package.json", type: "file" },
              { name: ".replit", type: "file" },
            ].map((f, i) => (
              <div key={i} className="flex items-center gap-2 py-1 hover:bg-white/4 rounded-lg px-1 cursor-pointer transition-colors"
                onClick={() => toast({ title: f.name, description: f.type === "folder" ? "مجلد — انقر لفتحه" : "ملف — انقر لتعديله" })}>
                {f.type === "folder" ? <FolderOpen size={13} className="text-yellow-400/70" /> : <FileCode size={13} className="text-blue-400/70" />}
                <span className="text-xs font-mono text-white/60">{f.name}</span>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-3 gap-2">
            {[
              { icon: <Plus size={13} />, label: "ملف جديد", color: "bg-blue-500/15 border-blue-400/25 text-blue-400" },
              { icon: <Upload size={13} />, label: "رفع ملف", color: "bg-white/8 border-white/12 text-white/60" },
              { icon: <Download size={13} />, label: "تنزيل ZIP", color: "bg-white/8 border-white/12 text-white/60" },
            ].map(btn => (
              <button key={btn.label} onClick={() => toast({ title: btn.label, description: "تم الضغط على الزر" })}
                className={cn("flex flex-col items-center gap-1.5 p-3 rounded-xl border text-[11px] font-semibold transition-all active:scale-95", btn.color)}>
                {btn.icon}
                {btn.label}
              </button>
            ))}
          </div>
        </div>
      ),
    },
    {
      id: "git",
      label: "Git (شعار الفرع) — GitHub",
      color: "text-orange-400",
      content: (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs text-green-400 bg-green-500/10 border border-green-400/20 rounded-xl px-3 py-2">
            <GitBranch size={13} />
            <span className="font-mono font-semibold">main</span>
            <span className="text-white/30">— متصل بـ GitHub</span>
          </div>
          <input
            value={commitMsg}
            onChange={e => setCommitMsg(e.target.value)}
            placeholder="وصف التعديلات (Commit message)..."
            className="w-full bg-black/30 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white placeholder:text-white/30 outline-none focus:border-white/25"
            data-testid="input-commit-msg"
          />
          <div className="grid grid-cols-2 gap-2">
            <button onClick={handlePush}
              disabled={pushing}
              className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-orange-500/20 border border-orange-400/30 text-orange-400 text-xs font-bold transition-all active:scale-95 disabled:opacity-50"
              data-testid="btn-push">
              {pushing ? <Loader2 size={13} className="animate-spin" /> : <GitCommit size={13} />}
              {pushing ? "جاري الرفع..." : "Commit & Push"}
            </button>
            <button onClick={() => toast({ title: "📥 Git Pull", description: "جاري جلب آخر التحديثات من GitHub..." })}
              className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white/8 border border-white/12 text-white/60 text-xs font-bold transition-all active:scale-95">
              <GitMerge size={13} />
              Pull
            </button>
          </div>
        </div>
      ),
    },
    {
      id: "packages",
      label: "Packages (الصندوق) — مدير المكتبات",
      color: "text-blue-400",
      content: (
        <div className="space-y-3">
          <div className="flex gap-2">
            <input
              value={searchPkg}
              onChange={e => setSearchPkg(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleInstall()}
              placeholder="ابحث عن مكتبة... (مثال: axios)"
              className="flex-1 bg-black/30 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder:text-white/30 outline-none focus:border-white/25"
              data-testid="input-pkg-search"
            />
            <button onClick={handleInstall}
              className="px-3 py-2 rounded-xl bg-blue-500/20 border border-blue-400/30 text-blue-400 text-xs font-bold transition-all active:scale-95">
              <Plus size={13} />
            </button>
          </div>
          <div className="space-y-1.5">
            <p className="text-[10px] text-white/30 uppercase tracking-widest font-semibold">مثبتة ({installed.length})</p>
            {installed.map(pkg => (
              <div key={pkg} className="flex items-center gap-2 px-3 py-2 bg-white/3 border border-white/8 rounded-xl">
                <Package size={12} className="text-blue-400/70" />
                <span className="text-xs font-mono text-white/70 flex-1">{pkg}</span>
                <button onClick={() => { setInstalled(p => p.filter(p2 => p2 !== pkg)); toast({ title: `🗑 تمت إزالة ${pkg}`, description: "" }); }}
                  className="text-white/20 hover:text-red-400 transition-colors">
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        </div>
      ),
    },
    {
      id: "secrets",
      label: "Secrets (القفل) — أمان المفاتيح",
      color: "text-green-400",
      content: (
        <div className="space-y-3">
          <div className="bg-amber-500/8 border border-amber-400/20 rounded-xl px-3 py-2.5 flex gap-2">
            <Shield size={14} className="text-amber-400 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-300/80 leading-relaxed">
              لا تظهر هذه القيم في الكود أبداً. يتم استدعاؤها عبر <code className="font-mono bg-black/30 px-1 rounded">os.environ['KEY']</code>
            </p>
          </div>
          {[
            { key: "OPENAI_API_KEY", val: "sk-proj-••••••••••••••••" },
            { key: "DATABASE_URL", val: "postgresql://user:pass@host/db" },
          ].map(secret => (
            <div key={secret.key} className="flex items-center gap-2 px-3 py-2.5 bg-black/30 border border-white/8 rounded-xl">
              <Key size={12} className="text-green-400/70 shrink-0" />
              <span className="text-xs font-mono text-white/70 flex-1">{secret.key}</span>
              <button onClick={() => setShowSecretValue(v => !v)} className="text-white/20 hover:text-white/60 transition-colors">
                {showSecretValue ? <EyeOff size={12} /> : <Eye size={12} />}
              </button>
              <span className="text-xs font-mono text-white/30">{showSecretValue ? secret.val : "••••••••"}</span>
            </div>
          ))}
          <button onClick={() => toast({ title: "🔑 إضافة مفتاح جديد", description: "أدخل اسم المفتاح وقيمته" })}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-green-500/10 border border-green-400/25 text-green-400 text-xs font-bold transition-all active:scale-95">
            <Plus size={13} /> إضافة Secret جديد
          </button>
        </div>
      ),
    },
    {
      id: "database",
      label: "Database — قاعدة بيانات Key-Value",
      color: "text-cyan-400",
      content: (
        <div className="space-y-3">
          <p className="text-xs text-white/40 leading-relaxed">مخزن Key-Value مدمج، مجاني وسريع، خاص بمشروعك فقط.</p>
          <div className="flex gap-2">
            <input value={dbKey} onChange={e => setDbKey(e.target.value)} placeholder="المفتاح (Key)"
              className="flex-1 bg-black/30 border border-white/10 rounded-lg px-2.5 py-2 text-xs text-white placeholder:text-white/30 outline-none focus:border-white/25" />
            <input value={dbVal} onChange={e => setDbVal(e.target.value)} placeholder="القيمة (Value)"
              className="flex-1 bg-black/30 border border-white/10 rounded-lg px-2.5 py-2 text-xs text-white placeholder:text-white/30 outline-none focus:border-white/25" />
            <button onClick={handleDbSet}
              className="px-3 py-2 rounded-lg bg-cyan-500/20 border border-cyan-400/30 text-cyan-400 text-xs font-bold transition-all active:scale-95">
              <Check size={13} />
            </button>
          </div>
          <div className="space-y-1.5">
            {Object.entries(dbStore).map(([k, v]) => (
              <div key={k} className="flex items-center gap-2 px-3 py-2 bg-black/20 border border-white/6 rounded-xl font-mono text-xs">
                <span className="text-cyan-400">{k}</span>
                <span className="text-white/20">→</span>
                <span className="text-white/60 flex-1">{v}</span>
                <button onClick={() => { setDbStore(s => { const n = { ...s }; delete n[k]; return n; }); toast({ title: `🗑 حُذف: ${k}`, description: "" }); }}
                  className="text-white/15 hover:text-red-400 transition-colors"><X size={11} /></button>
              </div>
            ))}
          </div>
        </div>
      ),
    },
    {
      id: "schedule",
      label: "Schedule (الساعة) — جدولة المهام",
      color: "text-purple-400",
      content: (
        <div className="space-y-3">
          <div className="bg-purple-500/8 border border-purple-400/20 rounded-xl px-3 py-2">
            <p className="text-xs text-purple-300/80">ميزة مدفوعة — لتشغيل الكود في وقت محدد تلقائياً (مثلاً: إرسال تقرير كل صباح).</p>
          </div>
          <div className="flex items-center gap-3 px-3 py-3 bg-black/20 border border-white/8 rounded-xl">
            <Clock size={15} className="text-purple-400 shrink-0" />
            <div className="flex-1">
              <p className="text-xs font-semibold text-white">وقت التشغيل اليومي</p>
              <input type="time" value={scheduleTime} onChange={e => setScheduleTime(e.target.value)}
                className="text-xs font-mono text-purple-400 bg-transparent outline-none mt-0.5" />
            </div>
            <button onClick={() => { setScheduleEnabled(v => !v); toast({ title: scheduleEnabled ? "⏸ تم إيقاف الجدولة" : "⏰ تم تفعيل الجدولة", description: `كل يوم الساعة ${scheduleTime}` }); }}
              className={cn("px-3 py-1.5 rounded-lg text-xs font-bold border transition-all", scheduleEnabled ? "bg-purple-500/30 border-purple-400/40 text-purple-300" : "bg-white/6 border-white/10 text-white/40")}>
              {scheduleEnabled ? "مُفعَّل" : "تفعيل"}
            </button>
          </div>
          <CodeBlock code={`# يتم تشغيل هذا كل يوم الساعة ${scheduleTime}\npython daily_report.py`} lang="cron" />
        </div>
      ),
    },
  ];

  const [openSub, setOpenSub] = useState<string | null>("files");

  return (
    <div className="space-y-2">
      {subsections.map(sub => (
        <div key={sub.id} className="bg-black/20 border border-white/8 rounded-xl overflow-hidden">
          <button onClick={() => setOpenSub(openSub === sub.id ? null : sub.id)}
            className="w-full flex items-center justify-between px-3.5 py-3 text-left hover:bg-white/3 transition-colors">
            <span className={cn("text-xs font-semibold", sub.color)}>{sub.label}</span>
            <motion.div animate={{ rotate: openSub === sub.id ? 180 : 0 }} transition={{ duration: 0.15 }}>
              <ChevronDown size={14} className="text-white/30" />
            </motion.div>
          </button>
          <AnimatePresence>
            {openSub === sub.id && (
              <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} transition={{ duration: 0.18 }} className="overflow-hidden">
                <div className="px-3.5 pb-4 pt-1 border-t border-white/5">{sub.content}</div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ))}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   CODE EDITOR SECTION
══════════════════════════════════════════════════════════ */
function CodeEditorSection() {
  const { toast } = useToast();
  const [breakpoints, setBreakpoints] = useState<Set<number>>(new Set([3]));
  const [showBubble, setShowBubble] = useState<{ line: number; x: number } | null>(null);

  const codeLines = [
    { n: 1, code: `import { useState } from 'react';`, color: "text-blue-400" },
    { n: 2, code: ``, color: "" },
    { n: 3, code: `function Counter() {`, color: "text-orange-400" },
    { n: 4, code: `  const [count, setCount] = useState(0);`, color: "text-white/70" },
    { n: 5, code: `  return (`, color: "text-white/70" },
    { n: 6, code: `    <div className="counter">`, color: "text-green-400" },
    { n: 7, code: `      <h1>{count}</h1>`, color: "text-green-400" },
    { n: 8, code: `      <button onClick={() => setCount(c => c + 1)}>`, color: "text-green-400" },
    { n: 9, code: `        +1`, color: "text-white/70" },
    { n: 10, code: `      </button>`, color: "text-green-400" },
  ];

  const toggleBreakpoint = (line: number) => {
    setBreakpoints(prev => {
      const n = new Set(prev);
      if (n.has(line)) { n.delete(line); toast({ title: `🔴 أُزيلت نقطة الإيقاف من السطر ${line}`, description: "" }); }
      else { n.add(line); toast({ title: `🔴 نقطة إيقاف (Breakpoint) في السطر ${line}`, description: "سيتوقف الكود هنا عند التشغيل" }); }
      return n;
    });
  };

  return (
    <div className="space-y-4">
      <p className="text-xs text-white/50 leading-relaxed">المنطقة الوسطى حيث تكتب الكود. اضغط على رقم السطر لوضع Breakpoint، أو حدد كوداً لرؤية Code Bubbles.</p>

      {/* Mock editor */}
      <div className="bg-[#0d1117] border border-white/10 rounded-xl overflow-hidden">
        <div className="flex items-center gap-2 px-3 py-2 border-b border-white/8 bg-[#161b22]">
          <FileCode size={13} className="text-orange-400" />
          <span className="text-xs font-mono text-white/60">App.tsx</span>
          <div className="w-1.5 h-1.5 rounded-full bg-orange-400/70 ml-1" title="تعديلات غير محفوظة" />
        </div>
        <div className="relative">
          {codeLines.map(line => (
            <div key={line.n} className="flex items-center group hover:bg-white/3 transition-colors relative">
              {/* Gutter / line number */}
              <button
                onClick={() => toggleBreakpoint(line.n)}
                className="w-10 shrink-0 flex items-center justify-end pr-2 text-[11px] text-white/20 hover:text-red-400 transition-colors font-mono py-0.5 relative"
                data-testid={`gutter-${line.n}`}
              >
                {breakpoints.has(line.n) && (
                  <div className="absolute left-1 w-3 h-3 rounded-full bg-red-500 flex items-center justify-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-300" />
                  </div>
                )}
                <span className={cn(breakpoints.has(line.n) ? "text-red-400" : "")}>{line.n}</span>
              </button>
              {/* Code */}
              <button
                onClick={() => line.code && setShowBubble(b => b?.line === line.n ? null : { line: line.n, x: 0 })}
                className={cn("flex-1 text-left px-3 py-0.5 font-mono text-[12px] transition-colors", line.color || "text-white/50")}
              >
                {line.code || <span className="opacity-0">·</span>}
              </button>
              {/* Code Bubble */}
              <AnimatePresence>
                {showBubble?.line === line.n && line.code && (
                  <motion.div
                    initial={{ opacity: 0, y: -4, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="absolute right-2 top-0 z-10 flex gap-1"
                  >
                    {[
                      { label: "شرح", icon: <Eye size={10} />, action: () => toast({ title: "🤖 Replit AI — شرح الكود", description: `"${line.code.trim()}" — هذا السطر يُعرّف...` }) },
                      { label: "تعديل", icon: <Code2 size={10} />, action: () => toast({ title: "✏️ Replit AI — تعديل", description: "صف ما تريد تغييره..." }) },
                    ].map(b => (
                      <button key={b.label} onClick={b.action}
                        className="flex items-center gap-1 px-2 py-1 bg-purple-500/90 text-white text-[10px] font-semibold rounded-lg shadow-lg">
                        {b.icon}{b.label}
                      </button>
                    ))}
                    <button onClick={() => setShowBubble(null)} className="px-1.5 py-1 bg-white/10 text-white/60 text-[10px] rounded-lg">
                      <X size={10} />
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-blue-500/8 border border-blue-400/20 rounded-xl px-3 py-2.5 text-xs text-blue-300/80 leading-relaxed">
        💡 <strong>Gutter:</strong> اضغط على أرقام الأسطر لوضع نقاط إيقاف. <strong>Code Bubbles:</strong> اضغط على السطر لرؤية خيارات الذكاء الاصطناعي.
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   PANEL AREA SECTION
══════════════════════════════════════════════════════════ */
function PanelSection() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<"console" | "shell" | "webview">("console");
  const [consoleLines, setConsoleLines] = useState([
    { type: "log", text: "Server running on port 3000" },
    { type: "log", text: "Database connected successfully" },
    { type: "warn", text: "⚠ Deprecated: use fetch() instead of axios" },
    { type: "err", text: "❌ TypeError: Cannot read property 'map' of undefined" },
  ]);
  const [shellInput, setShellInput] = useState("");
  const [shellOutput, setShellOutput] = useState<string[]>([
    "$ ls -la",
    "total 48",
    "drwxr-xr-x  src/",
    "-rw-r--r--  package.json",
    "-rw-r--r--  .replit",
    "$ ",
  ]);

  const runShell = () => {
    if (!shellInput.trim()) return;
    const cmd = shellInput.trim();
    let response = "";
    if (cmd === "ls") response = "src/  package.json  .replit  README.md";
    else if (cmd === "top") response = "PID  CPU   MEM  COMMAND\n1    0.1%  12M  node\n2    0.0%  4M   bash";
    else if (cmd === "pwd") response = "/home/runner/my-web-app";
    else if (cmd.startsWith("echo ")) response = cmd.replace("echo ", "");
    else if (cmd === "clear") { setShellOutput(["$ "]); setShellInput(""); return; }
    else response = `bash: ${cmd}: command not found`;

    setShellOutput(p => [...p, `$ ${cmd}`, response, "$ "]);
    setShellInput("");
    toast({ title: `⌨ ${cmd}`, description: response.split("\n")[0] });
  };

  const webviewUrl = "https://my-web-app.username.replit.app";

  return (
    <div className="space-y-3">
      {/* Tab bar */}
      <div className="flex gap-1 bg-black/30 border border-white/8 rounded-xl p-1">
        {(["console", "shell", "webview"] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={cn("flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all",
              activeTab === tab ? "bg-white/12 text-white" : "text-white/35 hover:text-white/60")}
            data-testid={`panel-tab-${tab}`}>
            {tab === "console" && <Terminal size={12} />}
            {tab === "shell" && <Code2 size={12} />}
            {tab === "webview" && <Globe size={12} />}
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Console */}
      {activeTab === "console" && (
        <div className="bg-[#0d1117] border border-white/10 rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-3 py-2 border-b border-white/8">
            <span className="text-xs font-semibold text-white/50">Console</span>
            <button onClick={() => { setConsoleLines([]); toast({ title: "🧹 تم مسح الـ Console", description: "" }); }}
              className="text-[11px] text-white/25 hover:text-white/60 transition-colors">مسح</button>
          </div>
          <div className="p-3 space-y-1.5 min-h-[120px] max-h-[200px] overflow-y-auto no-scrollbar">
            {consoleLines.length === 0
              ? <p className="text-xs text-white/20 italic">Console فارغ...</p>
              : consoleLines.map((line, i) => (
                  <div key={i} className={cn("text-[12px] font-mono", line.type === "err" ? "text-red-400" : line.type === "warn" ? "text-yellow-400" : "text-white/60")}>
                    {line.text}
                  </div>
                ))}
          </div>
          <div className="px-3 py-2 border-t border-white/8">
            <button onClick={() => { setConsoleLines(p => [...p, { type: "log", text: `[${new Date().toLocaleTimeString()}] New log entry` }]); }}
              className="text-[11px] text-blue-400 hover:text-blue-300 transition-colors">+ إضافة سطر تجريبي</button>
          </div>
        </div>
      )}

      {/* Shell */}
      {activeTab === "shell" && (
        <div className="bg-[#0d1117] border border-white/10 rounded-xl overflow-hidden">
          <div className="px-3 py-2 border-b border-white/8 flex items-center gap-2">
            <Terminal size={13} className="text-green-400" />
            <span className="text-xs font-semibold text-white/50">Shell (Linux Bash)</span>
          </div>
          <div className="p-3 space-y-0.5 min-h-[120px] max-h-[180px] overflow-y-auto no-scrollbar font-mono text-[12px]">
            {shellOutput.map((line, i) => (
              <div key={i} className={cn(line.startsWith("$") ? "text-green-400" : "text-white/50")}>{line}</div>
            ))}
          </div>
          <div className="flex gap-2 px-3 py-2 border-t border-white/8">
            <span className="text-xs font-mono text-green-400 self-center">$</span>
            <input value={shellInput} onChange={e => setShellInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && runShell()}
              placeholder="اكتب أمراً... (ls, top, pwd, echo ...)"
              className="flex-1 bg-transparent text-xs font-mono text-white placeholder:text-white/20 outline-none"
              data-testid="shell-input" />
            <button onClick={runShell} className="text-green-400 hover:text-green-300 transition-colors">
              <ArrowRight size={13} />
            </button>
          </div>
        </div>
      )}

      {/* Webview */}
      {activeTab === "webview" && (
        <div className="bg-[#0d1117] border border-white/10 rounded-xl overflow-hidden">
          <div className="px-3 py-2 border-b border-white/8 flex items-center gap-2">
            <div className="flex-1 flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-2 py-1.5">
              <Globe size={11} className="text-white/30 shrink-0" />
              <span className="text-[11px] font-mono text-white/40 flex-1 truncate">{webviewUrl}</span>
              <button onClick={() => { navigator.clipboard.writeText(webviewUrl); toast({ title: "📋 تم نسخ الرابط", description: webviewUrl }); }}>
                <Copy size={11} className="text-white/30 hover:text-white/70" />
              </button>
            </div>
            <button onClick={() => toast({ title: "🔄 تحديث الـ Webview", description: "" })} className="text-white/30 hover:text-white/70 transition-colors"><RefreshCw size={14} /></button>
            <button onClick={() => toast({ title: "↗ فتح في تبويب جديد", description: webviewUrl })} className="text-white/30 hover:text-white/70 transition-colors"><ExternalLink size={14} /></button>
          </div>
          <div className="h-32 flex items-center justify-center bg-gradient-to-br from-[#0d1117] to-[#161b22] relative">
            <div className="text-center">
              <div className="text-2xl font-bold text-white mb-1">Hello, World!</div>
              <div className="text-sm text-white/40">مشروعك يعمل هنا</div>
            </div>
            <div className="absolute bottom-2 right-2">
              <button onClick={() => toast({ title: "⛶ فتح بحجم كامل", description: "" })} className="text-white/20 hover:text-white/60 transition-colors">
                <Maximize2 size={14} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   STATUS BAR SECTION
══════════════════════════════════════════════════════════ */
function StatusBarSection() {
  const { toast } = useToast();
  const [cpu, setCpu] = useState(23);
  const [ram, setRam] = useState(41);
  const [connected, setConnected] = useState(true);

  const simulate = () => {
    const newCpu = Math.floor(Math.random() * 90) + 5;
    const newRam = Math.floor(Math.random() * 80) + 10;
    setCpu(newCpu);
    setRam(newRam);
    if (newCpu > 80) toast({ title: "⚠️ استهلاك CPU مرتفع!", description: `${newCpu}% — قد تحتاج لتحسين كودك` });
    if (newRam > 75) toast({ title: "⚠️ استهلاك RAM مرتفع!", description: `${newRam}% — تحقق من تسرب الذاكرة` });
  };

  return (
    <div className="space-y-4">
      {/* Mock status bar */}
      <div className="bg-[#161b22] border border-white/10 rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-3 py-2.5 border-b border-white/8">
          <span className="text-[10px] font-semibold text-white/30 uppercase tracking-widest">شريط الحالة السفلي</span>
          <button onClick={() => { setConnected(v => !v); toast({ title: connected ? "📴 انقطع الاتصال" : "📶 تم الاتصال", description: "" }); }}
            className="text-[11px] text-white/30 hover:text-white/60 transition-colors">
            {connected ? "محاكاة انقطاع" : "إعادة الاتصال"}
          </button>
        </div>
        <div className="flex items-center gap-4 px-3 py-2.5">
          {/* CPU */}
          <div className="flex items-center gap-2 flex-1" onClick={() => toast({ title: "CPU Usage", description: `${cpu}% — ${cpu > 80 ? "مرتفع جداً!" : cpu > 50 ? "مقبول" : "طبيعي"}` })}>
            <Cpu size={13} className={cn(cpu > 80 ? "text-red-400" : cpu > 50 ? "text-yellow-400" : "text-green-400")} />
            <div className="flex-1">
              <div className="flex justify-between text-[10px] text-white/40 mb-0.5">
                <span>CPU</span><span className={cn(cpu > 80 ? "text-red-400" : cpu > 50 ? "text-yellow-400" : "text-green-400")}>{cpu}%</span>
              </div>
              <div className="h-1 bg-white/8 rounded-full overflow-hidden">
                <div className={cn("h-full rounded-full transition-all duration-500", cpu > 80 ? "bg-red-400" : cpu > 50 ? "bg-yellow-400" : "bg-green-400")} style={{ width: `${cpu}%` }} />
              </div>
            </div>
          </div>
          {/* RAM */}
          <div className="flex items-center gap-2 flex-1" onClick={() => toast({ title: "RAM Usage", description: `${ram}% — ${ram > 75 ? "عالٍ جداً!" : "طبيعي"}` })}>
            <BarChart3 size={13} className={cn(ram > 75 ? "text-red-400" : "text-blue-400")} />
            <div className="flex-1">
              <div className="flex justify-between text-[10px] text-white/40 mb-0.5">
                <span>RAM</span><span className={cn(ram > 75 ? "text-red-400" : "text-blue-400")}>{ram}%</span>
              </div>
              <div className="h-1 bg-white/8 rounded-full overflow-hidden">
                <div className={cn("h-full rounded-full transition-all duration-500", ram > 75 ? "bg-red-400" : "bg-blue-400")} style={{ width: `${ram}%` }} />
              </div>
            </div>
          </div>
          {/* Connection */}
          <div className="flex items-center gap-1.5">
            {connected ? <Wifi size={14} className="text-green-400" /> : <WifiOff size={14} className="text-red-400" />}
            <span className={cn("text-[10px] font-semibold", connected ? "text-green-400" : "text-red-400")}>
              {connected ? "متصل" : "منقطع"}
            </span>
          </div>
        </div>
      </div>

      <button onClick={simulate}
        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white/6 border border-white/10 text-white/50 text-xs font-semibold transition-all hover:bg-white/10 active:scale-95">
        <Activity size={13} /> محاكاة حمل عالٍ على النظام
      </button>

      <InfoRow icon={<Cpu size={14} className="text-red-400" />} title="Resources (الموارد)" desc="يعرض عداداً لاستهلاك الـ RAM والـ CPU. إذا تحول للون الأحمر، فهذا يعني أن كودك يستهلك موارد الجهاز السحابي بشكل مفرط." />
      <InfoRow icon={<Wifi size={14} className="text-green-400" />} title="Connection Status" desc="يوضح جودة اتصالك بخوادم Replit ومدى استقرار الاتصال." />
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   SETTINGS SECTION
══════════════════════════════════════════════════════════ */
function SettingsSection() {
  const { toast } = useToast();
  const [layout, setLayout] = useState<"side" | "stacked">("side");
  const [fontSize, setFontSize] = useState(14);
  const [indent, setIndent] = useState(2);
  const [keybindings, setKeybindings] = useState<"default" | "vim" | "emacs">("default");
  const [wrapping, setWrapping] = useState(false);

  const notify = (label: string, val: string) => toast({ title: `⚙️ ${label}`, description: val });

  return (
    <div className="space-y-4">
      {/* Layout */}
      <div className="space-y-2">
        <p className="text-[11px] font-semibold text-white/40 uppercase tracking-widest">Layout (تخطيط الواجهة)</p>
        <div className="grid grid-cols-2 gap-2">
          {([["side", "جنباً إلى جنب", <Layers size={14} />], ["stacked", "أعلى وأسفل", <LayoutTemplate size={14} />]] as const).map(([val, label, icon]) => (
            <button key={val} onClick={() => { setLayout(val); notify("Layout", label as string); }}
              className={cn("flex items-center gap-2 p-3 rounded-xl border text-xs font-semibold transition-all active:scale-95",
                layout === val ? "bg-blue-500/20 border-blue-400/35 text-blue-400" : "bg-white/4 border-white/8 text-white/40 hover:bg-white/8")}>
              {icon as React.ReactNode}
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Font size */}
      <div className="space-y-2">
        <p className="text-[11px] font-semibold text-white/40 uppercase tracking-widest">Font Size (حجم الخط) — {fontSize}px</p>
        <div className="flex items-center gap-3">
          <button onClick={() => { setFontSize(s => Math.max(10, s - 1)); notify("Font Size", `${fontSize - 1}px`); }}
            className="w-8 h-8 rounded-lg bg-white/6 border border-white/10 text-white/60 font-bold text-lg flex items-center justify-center active:scale-95">−</button>
          <div className="flex-1 h-1.5 bg-white/8 rounded-full relative">
            <div className="h-full bg-white/40 rounded-full transition-all" style={{ width: `${((fontSize - 10) / 14) * 100}%` }} />
          </div>
          <button onClick={() => { setFontSize(s => Math.min(24, s + 1)); notify("Font Size", `${fontSize + 1}px`); }}
            className="w-8 h-8 rounded-lg bg-white/6 border border-white/10 text-white/60 font-bold text-lg flex items-center justify-center active:scale-95">+</button>
          <span className="text-sm font-mono text-white/60 w-10 text-center">{fontSize}</span>
        </div>
        <div className="bg-black/20 border border-white/8 rounded-xl p-3">
          <code className="font-mono text-blue-400" style={{ fontSize }}>{`const x = 42;`}</code>
        </div>
      </div>

      {/* Indent */}
      <div className="space-y-2">
        <p className="text-[11px] font-semibold text-white/40 uppercase tracking-widest">Indent Size (المسافة البادئة)</p>
        <div className="grid grid-cols-4 gap-2">
          {[1, 2, 4, 8].map(val => (
            <button key={val} onClick={() => { setIndent(val); notify("Indent Size", `${val} مسافات`); }}
              className={cn("py-2 rounded-xl border text-xs font-bold font-mono transition-all active:scale-95",
                indent === val ? "bg-white/15 border-white/25 text-white" : "bg-white/4 border-white/8 text-white/40")}>
              {val}
            </button>
          ))}
        </div>
      </div>

      {/* Keybindings */}
      <div className="space-y-2">
        <p className="text-[11px] font-semibold text-white/40 uppercase tracking-widest">Keybindings (اختصارات لوحة المفاتيح)</p>
        <div className="grid grid-cols-3 gap-2">
          {([["default", "Default"], ["vim", "Vim"], ["emacs", "Emacs"]] as const).map(([val, label]) => (
            <button key={val} onClick={() => { setKeybindings(val); notify("Keybindings", label); }}
              className={cn("py-2.5 rounded-xl border text-xs font-semibold transition-all active:scale-95",
                keybindings === val ? "bg-purple-500/20 border-purple-400/35 text-purple-400" : "bg-white/4 border-white/8 text-white/40")}>
              {label}
            </button>
          ))}
        </div>
        {keybindings !== "default" && (
          <div className="bg-purple-500/8 border border-purple-400/20 rounded-xl px-3 py-2">
            <p className="text-xs text-purple-300/80">{keybindings === "vim" ? "وضع Vim: اضغط i للإدخال، Esc للخروج، :wq للحفظ" : "وضع Emacs: Ctrl+X Ctrl+S للحفظ، Ctrl+X Ctrl+C للخروج"}</p>
          </div>
        )}
      </div>

      {/* Wrapping */}
      <div className="flex items-center justify-between px-4 py-3 bg-white/3 border border-white/8 rounded-xl">
        <div className="flex items-center gap-2">
          <WrapText size={15} className="text-white/50" />
          <div>
            <p className="text-xs font-semibold text-white">Wrapping (التفاف الأسطر)</p>
            <p className="text-[11px] text-white/40">الأسطر الطويلة تنزل لسطر جديد</p>
          </div>
        </div>
        <button onClick={() => { setWrapping(v => !v); notify("Wrapping", wrapping ? "مُعطَّل" : "مُفعَّل"); }}
          className={cn("w-11 h-6 rounded-full border transition-all relative", wrapping ? "bg-blue-500/40 border-blue-400/50" : "bg-white/8 border-white/12")}>
          <div className={cn("absolute top-0.5 w-5 h-5 rounded-full transition-all", wrapping ? "right-0.5 bg-blue-400" : "left-0.5 bg-white/40")} />
        </button>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   HIDDEN FEATURES SECTION
══════════════════════════════════════════════════════════ */
function HiddenFeaturesSection() {
  const { toast } = useToast();
  const [replitContent, setReplitContent] = useState(`run = "npm run dev"
language = "nodejs"

[env]
PORT = "3000"

[nix]
channel = "stable-23_11"

[[ports]]
localPort = 3000
externalPort = 80`);

  const [ignoreContent, setIgnoreContent] = useState(`node_modules/
.env
dist/
.cache/
*.log`);

  const [uptimeEnabled, setUptimeEnabled] = useState(false);
  const [editingReplit, setEditingReplit] = useState(false);
  const [editingIgnore, setEditingIgnore] = useState(false);

  return (
    <div className="space-y-4">
      {/* .replit file */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText size={14} className="text-yellow-400" />
            <p className="text-xs font-semibold text-white">ملف .replit</p>
          </div>
          <button onClick={() => setEditingReplit(v => !v)}
            className="text-[11px] text-white/30 hover:text-white/60 transition-colors border border-white/10 px-2 py-1 rounded-lg">
            {editingReplit ? "إغلاق" : "تعديل"}
          </button>
        </div>
        <p className="text-xs text-white/45 leading-relaxed">هو "عقل" المشروع. يمكنك فيه كتابة أوامر مخصصة تُنفذ بمجرد ضغط زر Run، وإعداد المنافذ والمتغيرات.</p>
        <div className="bg-[#0d1117] border border-white/10 rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-3 py-2 border-b border-white/8">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-yellow-400/60" />
              <span className="text-[11px] font-mono text-white/40">.replit</span>
            </div>
            <button onClick={() => toast({ title: "✅ تم حفظ .replit", description: "سيُطبَّق عند التشغيل التالي" })}
              className="text-[11px] text-blue-400 hover:text-blue-300 transition-colors">حفظ</button>
          </div>
          {editingReplit
            ? <textarea value={replitContent} onChange={e => setReplitContent(e.target.value)}
                className="w-full bg-transparent p-3 font-mono text-[12px] text-green-400 outline-none resize-none min-h-[140px]" />
            : <pre className="p-3 font-mono text-[12px] text-green-400 overflow-x-auto">{replitContent}</pre>
          }
        </div>
      </div>

      {/* .replitignore */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText size={14} className="text-white/40" />
            <p className="text-xs font-semibold text-white">ملف .replitignore</p>
          </div>
          <button onClick={() => setEditingIgnore(v => !v)}
            className="text-[11px] text-white/30 hover:text-white/60 transition-colors border border-white/10 px-2 py-1 rounded-lg">
            {editingIgnore ? "إغلاق" : "تعديل"}
          </button>
        </div>
        <p className="text-xs text-white/45 leading-relaxed">لإخبار النظام بالملفات التي لا تريد رفعها أو مزامنتها مع GitHub.</p>
        <div className="bg-[#0d1117] border border-white/10 rounded-xl overflow-hidden">
          <div className="flex items-center gap-2 px-3 py-2 border-b border-white/8">
            <div className="w-2 h-2 rounded-full bg-white/20" />
            <span className="text-[11px] font-mono text-white/40">.replitignore</span>
          </div>
          {editingIgnore
            ? <textarea value={ignoreContent} onChange={e => setIgnoreContent(e.target.value)}
                className="w-full bg-transparent p-3 font-mono text-[12px] text-white/50 outline-none resize-none min-h-[100px]" />
            : <pre className="p-3 font-mono text-[12px] text-white/50 overflow-x-auto">{ignoreContent}</pre>
          }
        </div>
      </div>

      {/* Uptime */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Activity size={14} className="text-green-400" />
          <p className="text-xs font-semibold text-white">Uptime — إبقاء التطبيق حياً</p>
        </div>
        <p className="text-xs text-white/45 leading-relaxed">ميزة تضمن بقاء تطبيقك حياً حتى لو أغلقت المتصفح. للحسابات المدفوعة أو عبر خدمات خارجية مثل UptimeRobot.</p>
        <div className="flex items-center justify-between px-4 py-3 bg-white/3 border border-white/8 rounded-xl">
          <div>
            <p className="text-xs font-semibold text-white">تفعيل Uptime Monitor</p>
            <p className="text-[11px] text-white/40">يرسل ping كل 5 دقائق لإبقاء المشروع نشطاً</p>
          </div>
          <button onClick={() => { setUptimeEnabled(v => !v); toast({ title: uptimeEnabled ? "⏸ تم إيقاف Uptime" : "✅ تم تفعيل Uptime", description: uptimeEnabled ? "" : "المشروع سيبقى نشطاً 24/7" }); }}
            className={cn("w-11 h-6 rounded-full border transition-all relative", uptimeEnabled ? "bg-green-500/40 border-green-400/50" : "bg-white/8 border-white/12")}>
            <div className={cn("absolute top-0.5 w-5 h-5 rounded-full transition-all", uptimeEnabled ? "right-0.5 bg-green-400" : "left-0.5 bg-white/40")} />
          </button>
        </div>
        {uptimeEnabled && (
          <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 px-3 py-2.5 bg-green-500/8 border border-green-400/20 rounded-xl">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <p className="text-xs text-green-400 font-semibold">مشروعك يعمل الآن 24/7 — آخر ping منذ 4 دقائق</p>
          </motion.div>
        )}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   MAIN PAGE
══════════════════════════════════════════════════════════ */
export default function WorkspaceGuide() {
  const [, setLocation] = useLocation();

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="flex flex-col min-h-full pb-24 max-w-[480px] mx-auto w-full"
    >
      {/* Header */}
      <div className="px-4 pt-10 pb-4 sticky top-0 bg-background/95 backdrop-blur-md z-10 border-b border-white/5">
        <div className="flex items-center gap-3">
          <button onClick={() => setLocation("/explore")}
            className="w-8 h-8 rounded-lg bg-white/6 border border-white/10 flex items-center justify-center text-white/50 hover:text-white transition-colors">
            <ChevronLeft size={16} />
          </button>
          <div>
            <h1 className="text-lg font-bold text-white leading-tight">دليل بيئة العمل</h1>
            <p className="text-[11px] text-white/40">Workspace — كل أداة بتفصيل كامل</p>
          </div>
          <div className="ml-auto flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-[10px] text-green-400 font-semibold">تفاعلي</span>
          </div>
        </div>
      </div>

      {/* Intro */}
      <div className="px-4 py-4">
        <div className="bg-white/3 border border-white/8 rounded-2xl px-4 py-3 text-xs text-white/50 leading-relaxed">
          كل قسم قابل للفتح والإغلاق. <span className="text-white/80">كل زر يعمل فعلياً</span> — جرّب الضغط على أي شيء!
        </div>
      </div>

      {/* Sections */}
      <div className="px-4 space-y-2.5">
        <Section id="header" icon={<Play size={16} className="text-green-400" />} iconBg="bg-green-500/15" title="شريط الأدوات العلوي" subtitle="Header Bar — غرفة التحكم" defaultOpen={true}>
          <HeaderBarSection />
        </Section>

        <Section id="sidebar" icon={<FolderOpen size={16} className="text-yellow-400" />} iconBg="bg-yellow-500/15" title="اللوحة الجانبية اليسرى" subtitle="Tools Sidebar — القوة الحقيقية">
          <SidebarSection />
        </Section>

        <Section id="editor" icon={<Code2 size={16} className="text-blue-400" />} iconBg="bg-blue-500/15" title="محرر الكود" subtitle="Code Editor — Breakpoints & Code Bubbles">
          <CodeEditorSection />
        </Section>

        <Section id="panels" icon={<Monitor size={16} className="text-purple-400" />} iconBg="bg-purple-500/15" title="منطقة العرض والتحكم" subtitle="Console · Shell · Webview">
          <PanelSection />
        </Section>

        <Section id="statusbar" icon={<Activity size={16} className="text-cyan-400" />} iconBg="bg-cyan-500/15" title="شريط الحالة السفلي" subtitle="RAM · CPU · Connection Status">
          <StatusBarSection />
        </Section>

        <Section id="settings" icon={<Settings size={16} className="text-slate-400" />} iconBg="bg-slate-500/15" title="الإعدادات التفصيلية" subtitle="Layout · Font · Keybindings · Wrapping">
          <SettingsSection />
        </Section>

        <Section id="hidden" icon={<Zap size={16} className="text-amber-400" />} iconBg="bg-amber-500/15" title="ميزات مخفية واحترافية" subtitle=".replit · .replitignore · Uptime">
          <HiddenFeaturesSection />
        </Section>
      </div>

      <div className="h-4" />
    </motion.div>
  );
}
