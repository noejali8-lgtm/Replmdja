import { useState } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Search, X, ChevronDown, ChevronRight, MessageCircle,
  WifiOff, ShoppingBag, Video, Brain, Cloud, Bug, Smartphone, Shield,
  GraduationCap, DollarSign, Eye, Terminal, Users, Rocket, Mic, Cpu,
  RefreshCw, Layers, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

interface Feature {
  id: string;
  category: "vision" | "platform" | "future";
  icon: React.ReactNode;
  title: string;
  titleAr: string;
  badge: string;
  badgeColor: string;
  color: string;
  bg: string;
  border: string;
  desc: string;
  descAr: string;
}

const ALL_FEATURES: Feature[] = [
  {
    id: "offline", category: "vision",
    icon: <WifiOff size={18} />,
    title: "Hybrid Offline Mode", titleAr: "بيئة العمل الهجينة دون إنترنت",
    badge: "Coming Soon", badgeColor: "bg-sky-500/20 text-sky-300 border-sky-400/20",
    color: "text-sky-400", bg: "bg-sky-500/10", border: "border-sky-400/20",
    desc: "Smart Caching: code & test inside a local micro-container when offline, then auto-sync everything when you reconnect. Zero data loss.",
    descAr: "برمجة وتجربة في حاوية محلية أثناء انقطاع الإنترنت، ثم مزامنة تلقائية عند الاتصال. لا يوجد فقدان في البيانات.",
  },
  {
    id: "marketplace", category: "vision",
    icon: <ShoppingBag size={18} />,
    title: "Replit Marketplace", titleAr: "متجر الإضافات والمكونات",
    badge: "Roadmap", badgeColor: "bg-purple-500/20 text-purple-300 border-purple-400/20",
    color: "text-purple-400", bg: "bg-purple-500/10", border: "border-purple-400/20",
    desc: "An open marketplace where developers sell complete templates, ready-made API integrations, and custom in-editor tools — powered by Cycles.",
    descAr: "متجر مفتوح لبيع القوالب الجاهزة والتكاملات البرمجية وأدوات المحرر المخصصة بعملة Cycles.",
  },
  {
    id: "voice-video", category: "vision",
    icon: <Video size={18} />,
    title: "Native Voice & Video Collaboration", titleAr: "التعاون الصوتي والمرئي المدمج",
    badge: "Coming Soon", badgeColor: "bg-green-500/20 text-green-300 border-green-400/20",
    color: "text-green-400", bg: "bg-green-500/10", border: "border-green-400/20",
    desc: "Pair-programming with voice/video built directly into the IDE — no Zoom, no Slack needed. Both see the same cursor, same terminal, same AI agent.",
    descAr: "التزامل في البرمجة بالصوت والفيديو مباشرة من داخل المحرر — بدون أدوات خارجية.",
  },
  {
    id: "long-memory", category: "vision",
    icon: <Brain size={18} />,
    title: "Cross-Repl Long-term Memory", titleAr: "الذاكرة الطويلة الأمد العابرة للمشاريع",
    badge: "Coming Soon", badgeColor: "bg-violet-500/20 text-violet-300 border-violet-400/20",
    color: "text-violet-400", bg: "bg-violet-500/10", border: "border-violet-400/20",
    desc: "AI agent remembers your preferences, coding style, and architecture decisions across ALL your projects — never re-explains your stack.",
    descAr: "الذكاء الاصطناعي يتذكر أسلوبك البرمجي وقراراتك المعمارية عبر جميع مشاريعك.",
  },
  {
    id: "multi-cloud", category: "vision",
    icon: <Cloud size={18} />,
    title: "Multi-Cloud Orchestrator", titleAr: "مركز التحكم متعدد السحابات",
    badge: "Roadmap", badgeColor: "bg-blue-500/20 text-blue-300 border-blue-400/20",
    color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-400/20",
    desc: "Deploy to AWS, GCP, and Azure simultaneously from one Replit button. AI generates the Terraform/Pulumi config, handles secrets, runs health checks.",
    descAr: "نشر على AWS وGCP وAzure في آنٍ واحد بنقرة واحدة. الذكاء الاصطناعي يدير التكوين والأسرار الأمنية.",
  },
  {
    id: "visual-debug", category: "vision",
    icon: <Bug size={18} />,
    title: "Visual Debug & Time Travel", titleAr: "التصحيح البصري والرجوع في الزمن",
    badge: "Roadmap", badgeColor: "bg-orange-500/20 text-orange-300 border-orange-400/20",
    color: "text-orange-400", bg: "bg-orange-500/10", border: "border-orange-400/20",
    desc: "Record every program state as you run. Scrub back in time to any moment, inspect variables, replay execution. Like a DVR for your code.",
    descAr: "تسجيل كل حالة للبرنامج أثناء التشغيل. الرجوع إلى أي لحظة لفحص المتغيرات وإعادة تشغيل الكود.",
  },
  {
    id: "figma-to-repl", category: "vision",
    icon: <Layers size={18} />,
    title: "Figma → Repl in One Click", titleAr: "تحويل Figma إلى كود جاهز",
    badge: "Coming Soon", badgeColor: "bg-pink-500/20 text-pink-300 border-pink-400/20",
    color: "text-pink-400", bg: "bg-pink-500/10", border: "border-pink-400/20",
    desc: "Paste a Figma link → Replit AI converts every component into production React/Tailwind. It reads tokens, spacing, typography from the design file.",
    descAr: "الصق رابط Figma وشاهد الذكاء الاصطناعي يحوّله إلى مكونات React/Tailwind جاهزة للإنتاج.",
  },
  {
    id: "mobile-power", category: "vision",
    icon: <Smartphone size={18} />,
    title: "Mobile Power Tools", titleAr: "أدوات الموبايل الاحترافية",
    badge: "Coming Soon", badgeColor: "bg-teal-500/20 text-teal-300 border-teal-400/20",
    color: "text-teal-400", bg: "bg-teal-500/10", border: "border-teal-400/20",
    desc: "Bluetooth hardware integration, AR overlays, on-device ML inference, advanced camera APIs — build native-quality mobile apps entirely in browser.",
    descAr: "تكامل Bluetooth وتراكب الواقع المعزز والذكاء الاصطناعي على الجهاز — تطبيقات موبايل احترافية من المتصفح.",
  },
  {
    id: "security", category: "vision",
    icon: <Shield size={18} />,
    title: "Autonomous Security Auditor", titleAr: "مدقق الأمان الاستباقي",
    badge: "Roadmap", badgeColor: "bg-red-500/20 text-red-300 border-red-400/20",
    color: "text-red-400", bg: "bg-red-500/10", border: "border-red-400/20",
    desc: "AI security agent runs OWASP scans, checks for SQLi/XSS/CSRF, validates secrets, and fixes vulnerabilities — all before you deploy.",
    descAr: "عميل أمني يفحص الثغرات تلقائياً ويصلحها قبل النشر.",
  },
  {
    id: "academy", category: "vision",
    icon: <GraduationCap size={18} />,
    title: "AI Learning Academy", titleAr: "أكاديمية التعلم بالذكاء الاصطناعي",
    badge: "Coming Soon", badgeColor: "bg-amber-500/20 text-amber-300 border-amber-400/20",
    color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-400/20",
    desc: "Adaptive curriculum that detects your level, assigns projects, grades code, and teaches new concepts just-in-time as you build real apps.",
    descAr: "منهج تكيّفي يكتشف مستواك ويعيّن مشاريع ويصحح الكود ويعلّمك مفاهيم جديدة أثناء البناء الفعلي.",
  },
  {
    id: "bounties", category: "platform",
    icon: <DollarSign size={18} />,
    title: "Bounties & Cycles Economy", titleAr: "نظام المكافآت واقتصاد Cycles",
    badge: "Live", badgeColor: "bg-green-500/20 text-green-300 border-green-400/20",
    color: "text-green-400", bg: "bg-green-500/10", border: "border-green-400/20",
    desc: "Post Bounties for real cash (paid via Stripe), earn Cycles for helping others. Freelance marketplace built into the IDE. AI can claim Bounties.",
    descAr: "انشر مهام مدفوعة وكسب Cycles بمساعدة الآخرين. سوق عمل حر مدمج في المحرر.",
  },
  {
    id: "nix", category: "platform",
    icon: <Terminal size={18} />,
    title: "Nix & Full Linux Runtime", titleAr: "بيئة Linux الكاملة مع Nix",
    badge: "Live", badgeColor: "bg-green-500/20 text-green-300 border-green-400/20",
    color: "text-green-400", bg: "bg-green-500/10", border: "border-green-400/20",
    desc: "Full NixOS package manager gives you 80,000+ packages. Install ffmpeg, postgresql, python 3.12, cuda — all in one replit.nix config file.",
    descAr: "مدير حزم NixOS يمنحك 80,000+ حزمة. ثبّت أي أداة في ملف replit.nix واحد.",
  },
  {
    id: "vision-ai", category: "platform",
    icon: <Eye size={18} />,
    title: "Agent Visual Perception", titleAr: "الذكاء الاصطناعي يرى الشاشة",
    badge: "Live", badgeColor: "bg-green-500/20 text-green-300 border-green-400/20",
    color: "text-green-400", bg: "bg-green-500/10", border: "border-green-400/20",
    desc: "Agent sees screenshots of your running app, detects layout bugs, UI glitches, and CSS issues — then writes the fix automatically.",
    descAr: "العميل يرى لقطات شاشة تطبيقك ويكتشف الأخطاء البصرية ثم يصلحها تلقائياً.",
  },
  {
    id: "debugger", category: "platform",
    icon: <Settings size={18} />,
    title: "Debugger & Profiler", titleAr: "المصحح والمحلل الاحترافي",
    badge: "Live", badgeColor: "bg-green-500/20 text-green-300 border-green-400/20",
    color: "text-green-400", bg: "bg-green-500/10", border: "border-green-400/20",
    desc: "DAP-compliant debugger with breakpoints, step-through, variable watch, call-stack, memory inspector — AI explains every stack frame in plain English.",
    descAr: "مصحح احترافي مع نقاط توقف ومفتش متغيرات وشارح كود بالعربية.",
  },
  {
    id: "social", category: "platform",
    icon: <Users size={18} />,
    title: "Social Coding & Community", titleAr: "البرمجة الاجتماعية والمجتمع",
    badge: "Live", badgeColor: "bg-green-500/20 text-green-300 border-green-400/20",
    color: "text-green-400", bg: "bg-green-500/10", border: "border-green-400/20",
    desc: "Fork any community project instantly. Publish as open source. Followers, activity feed, starred Repls, and a community leaderboard.",
    descAr: "افرك أي مشروع مجتمعي فوراً. انشر مفتوح المصدر. متابعون وتغذية نشاط ولوحة قيادة.",
  },
  {
    id: "hosting", category: "platform",
    icon: <Rocket size={18} />,
    title: "Production Grade Hosting", titleAr: "الاستضافة الاحترافية",
    badge: "Live", badgeColor: "bg-green-500/20 text-green-300 border-green-400/20",
    color: "text-green-400", bg: "bg-green-500/10", border: "border-green-400/20",
    desc: "Custom domains with free SSL. Zero-downtime deploys, autoscaling, health checks, one-click rollback — enterprise reliability for indie developers.",
    descAr: "نطاقات مخصصة مع SSL مجاني. نشر بلا توقف، توسع تلقائي، فحص صحة، وتراجع بنقرة واحدة.",
  },
  {
    id: "voice-ai", category: "future",
    icon: <Mic size={18} />,
    title: "AI Voice Pair Programming", titleAr: "البرمجة الصوتية بالذكاء الاصطناعي",
    badge: "Future", badgeColor: "bg-purple-500/20 text-purple-300 border-purple-400/20",
    color: "text-purple-400", bg: "bg-purple-500/10", border: "border-purple-400/20",
    desc: "Talk to the AI during coding: 'Why is this function slow?' — hands-free pair programming while you think out loud. Under active research.",
    descAr: "تحدث مع الذكاء الاصطناعي أثناء البرمجة: اطرح أسئلة بصوتك واحصل على إجابات فورية — برمجة ثنائية بلا استخدام اليدين.",
  },
  {
    id: "gpu", category: "future",
    icon: <Cpu size={18} />,
    title: "GPU Support for AI/ML", titleAr: "دعم معالجات GPU للذكاء الاصطناعي",
    badge: "Limited Beta", badgeColor: "bg-yellow-500/20 text-yellow-300 border-yellow-400/20",
    color: "text-yellow-400", bg: "bg-yellow-500/10", border: "border-yellow-400/20",
    desc: "Powerful GPUs for training large AI models directly in Replit. Train transformers, fine-tune LLMs, run CUDA workloads — no cloud ML setup needed.",
    descAr: "معالجات رسومية قوية لتدريب نماذج الذكاء الاصطناعي في Replit. دون الحاجة إلى بنية تحتية خاصة.",
  },
  {
    id: "local-sync", category: "future",
    icon: <RefreshCw size={18} />,
    title: "Local Sync", titleAr: "المزامنة المحلية مع جهازك",
    badge: "Future", badgeColor: "bg-cyan-500/20 text-cyan-300 border-cyan-400/20",
    color: "text-cyan-400", bg: "bg-cyan-500/10", border: "border-cyan-400/20",
    desc: "Real-time file sync between your local machine and Replit cloud — no Git required. Edit in VS Code locally, see it appear in Replit instantly.",
    descAr: "مزامنة فورية بين جهازك وسحابة Replit. عدّل في VS Code محلياً وشاهد التغييرات فوراً في Replit.",
  },
];

const FILTER_TABS = [
  { id: "all", label: "الكل", count: ALL_FEATURES.length },
  { id: "vision", label: "🚀 رؤية", count: ALL_FEATURES.filter(f => f.category === "vision").length },
  { id: "platform", label: "⚡ منصة", count: ALL_FEATURES.filter(f => f.category === "platform").length },
  { id: "future", label: "🔮 مستقبل", count: ALL_FEATURES.filter(f => f.category === "future").length },
] as const;

type FilterTab = typeof FILTER_TABS[number]["id"];

function FeatureRow({ f, onLearnMore }: { f: Feature; onLearnMore: (f: Feature) => void }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn("rounded-2xl border overflow-hidden", f.bg, f.border)}
    >
      <button
        onClick={() => setExpanded(v => !v)}
        className="w-full flex items-center gap-3 px-4 py-3.5 text-left"
      >
        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border", f.bg, f.border)}>
          <span className={f.color}>{f.icon}</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-semibold text-white">{f.title}</p>
            <span className={cn("text-[9px] font-bold px-1.5 py-0.5 rounded-full border", f.badgeColor)}>{f.badge}</span>
          </div>
          <p className={cn("text-xs font-medium mt-0.5", f.color)}>{f.titleAr}</p>
        </div>
        <motion.div animate={{ rotate: expanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown size={14} className="text-white/30 shrink-0" />
        </motion.div>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-3">
              <p className="text-xs text-white/60 leading-relaxed">{f.desc}</p>
              <p className="text-xs text-white/40 leading-relaxed text-right font-medium" dir="rtl">{f.descAr}</p>
              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => onLearnMore(f)}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-semibold transition-all border",
                    f.color, f.border, "bg-white/[0.06] hover:bg-white/[0.12]"
                  )}
                >
                  <MessageCircle size={12} />
                  Ask AI about this →
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function FeaturesPage() {
  const [, setLocation] = useLocation();
  const [filter, setFilter] = useState<FilterTab>("all");
  const [search, setSearch] = useState("");

  const filtered = ALL_FEATURES.filter(f => {
    const matchCat = filter === "all" || f.category === filter;
    const q = search.toLowerCase();
    const matchSearch = !q ||
      f.title.toLowerCase().includes(q) ||
      f.titleAr.includes(q) ||
      f.desc.toLowerCase().includes(q);
    return matchCat && matchSearch;
  });

  const handleLearnMore = (f: Feature) => {
    sessionStorage.setItem("chat_prompt", `Tell me more about "${f.title}" (${f.titleAr}) on Replit. How does it work and when can I use it?`);
    setLocation("/chat");
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -30 }}
      transition={{ duration: 0.22 }}
      className="relative flex flex-col h-[100dvh] max-w-[480px] mx-auto w-full bg-[#0d1117] overflow-hidden"
    >
      {/* Header */}
      <div className="shrink-0 px-4 pt-10 pb-3 border-b border-white/[0.07] bg-[#0d1117]">
        <div className="flex items-center gap-2 mb-4">
          <button
            onClick={() => setLocation("/")}
            className="w-9 h-9 flex items-center justify-center text-white/50 hover:text-white rounded-xl hover:bg-white/8 transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="flex-1 text-center">
            <h1 className="text-base font-semibold text-white">Platform Features</h1>
            <p className="text-[11px] text-white/35 mt-0.5" dir="rtl">ميزات المنصة</p>
          </div>
          <div className="w-9 h-9" />
        </div>

        {/* Search */}
        <div className="flex items-center gap-2 bg-white/[0.05] border border-white/[0.10] rounded-xl px-3 h-9">
          <Search size={13} className="text-white/30 shrink-0" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search features..."
            className="flex-1 bg-transparent text-sm text-white placeholder:text-white/25 outline-none"
          />
          {search && (
            <button onClick={() => setSearch("")} className="text-white/30 hover:text-white/70 transition-colors">
              <X size={12} />
            </button>
          )}
        </div>
      </div>

      {/* Filter tabs */}
      <div className="shrink-0 px-4 py-2.5 border-b border-white/[0.06] bg-[#0d1117]">
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
          {FILTER_TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border shrink-0",
                filter === tab.id
                  ? "bg-white/12 border-white/25 text-white"
                  : "bg-transparent border-white/8 text-white/40 hover:text-white/70"
              )}
            >
              {tab.label}
              <span className={cn(
                "text-[9px] font-bold px-1 py-0.5 rounded-full",
                filter === tab.id ? "bg-white/15 text-white/80" : "bg-white/5 text-white/25"
              )}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Feature list */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2 pb-8">
        <AnimatePresence mode="popLayout">
          {filtered.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center gap-3 py-16 text-center"
            >
              <div className="w-12 h-12 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center">
                <Search size={18} className="text-white/25" />
              </div>
              <p className="text-sm text-white/40">No features match your search</p>
            </motion.div>
          ) : (
            filtered.map((f, i) => (
              <motion.div key={f.id} layout transition={{ delay: i * 0.03 }}>
                <FeatureRow f={f} onLearnMore={handleLearnMore} />
              </motion.div>
            ))
          )}
        </AnimatePresence>

        <div className="pt-4 text-center">
          <p className="text-[11px] text-white/20">
            {filtered.length} of {ALL_FEATURES.length} features shown
          </p>
          <button
            onClick={() => handleLearnMore({ id: "all", title: "all Replit features", titleAr: "", category: "vision" } as Feature)}
            className="mt-2 flex items-center gap-1 text-[11px] text-white/35 hover:text-white/60 transition-colors mx-auto"
          >
            <MessageCircle size={10} />
            Ask AI to compare all features
            <ChevronRight size={10} />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
