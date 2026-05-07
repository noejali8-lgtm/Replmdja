import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronDown, ChevronRight, Github, GitBranch, Zap, Users, Globe, Database,
  Rocket, Bot, Code2, Layers, Shield, Terminal, Bug, TestTube2, FileText,
  Palette, Server, LayoutDashboard, FolderOpen, Blocks, BookOpen, MessageSquare,
  Lock, BarChart3, Cpu, Play, Settings, Monitor, Package, Search, Star,
  CheckCircle2, ArrowRight, Activity
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Section {
  id: string;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  content: React.ReactNode;
}

function StepCard({ number, title, desc }: { number: number; title: string; desc: string }) {
  return (
    <div className="flex gap-3 py-3 border-b border-white/5 last:border-0">
      <div className="w-7 h-7 rounded-lg bg-blue-500/20 border border-blue-400/30 flex items-center justify-center shrink-0 text-xs font-bold text-blue-400 mt-0.5">
        {number}
      </div>
      <div>
        <p className="text-sm font-semibold text-white leading-tight">{title}</p>
        <p className="text-xs text-white/50 leading-relaxed mt-0.5">{desc}</p>
      </div>
    </div>
  );
}

function FeatureRow({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="flex gap-3 py-3 border-b border-white/5 last:border-0">
      <div className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0 text-white/60 mt-0.5">
        {icon}
      </div>
      <div>
        <p className="text-sm font-semibold text-white leading-tight">{title}</p>
        <p className="text-xs text-white/50 leading-relaxed mt-0.5">{desc}</p>
      </div>
    </div>
  );
}

function ToolTag({ label, color = "bg-white/8 text-white/60" }: { label: string; color?: string }) {
  return (
    <span className={cn("inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium border border-white/8", color)}>
      {label}
    </span>
  );
}

function SidebarItem({ icon, label, desc }: { icon: React.ReactNode; label: string; desc: string }) {
  return (
    <div className="flex items-start gap-3 py-2.5 border-b border-white/5 last:border-0">
      <div className="w-7 h-7 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center shrink-0 text-white/50 mt-0.5">
        {icon}
      </div>
      <div>
        <p className="text-xs font-semibold text-white">{label}</p>
        <p className="text-[11px] text-white/45 leading-relaxed mt-0.5">{desc}</p>
      </div>
    </div>
  );
}

function DeployCard({ title, badge, desc, badgeColor }: { title: string; badge: string; desc: string; badgeColor: string }) {
  return (
    <div className="bg-white/3 border border-white/8 rounded-xl p-3.5 flex gap-3">
      <div className={cn("px-2 py-0.5 rounded-md text-[10px] font-bold border shrink-0 mt-0.5 h-fit", badgeColor)}>
        {badge}
      </div>
      <div>
        <p className="text-sm font-semibold text-white">{title}</p>
        <p className="text-xs text-white/50 leading-relaxed mt-0.5">{desc}</p>
      </div>
    </div>
  );
}

const SECTIONS: Section[] = [
  {
    id: "github",
    title: "استيراد من GitHub",
    subtitle: "كيف تعمل العملية خطوة بخطوة",
    icon: <Github size={18} />,
    color: "text-white",
    bgColor: "bg-white/10",
    content: (
      <div className="space-y-1">
        <StepCard
          number={1}
          title="الاتصال (Authentication)"
          desc="عند وضع رابط مستودع (Repository)، يطلب Replit إذناً للوصول إلى حسابك في GitHub إذا كان المشروع خاصاً."
        />
        <StepCard
          number={2}
          title="النسخ (Cloning)"
          desc="يقوم Replit بإنشاء حاوية (Container) جديدة، ثم يرسل أمراً لخوادم GitHub لنسخ كافة ملفات الكود، المجلدات، وتاريخ التعديلات (Commits) إلى هذه المساحة."
        />
        <StepCard
          number={3}
          title="التحليل (Analysis)"
          desc="بمجرد وصول الملفات، يقوم Replit تلقائياً بالتعرف على لغة البرمجة المستخدمة ويقوم بإعداد البيئة التشغيلية المناسبة لها."
        />
        <StepCard
          number={4}
          title="المزامنة الثنائية (Two-way Sync)"
          desc="لا يكتفي Replit بجلب الملفات فقط، بل يسمح لك بتعديل الكود ثم عمل Push لإرسال التعديلات مرة أخرى إلى GitHub، أو عمل Pull لجلب التحديثات الجديدة."
        />
        <div className="mt-4 bg-blue-500/8 border border-blue-400/20 rounded-xl px-4 py-3">
          <p className="text-xs text-blue-300/90 leading-relaxed">
            <span className="font-semibold">نصيحة:</span> تأكد من اختيار الخيار الصحيح للخصوصية — Private للمشاريع السرية و Public للمشاريع المفتوحة.
          </p>
        </div>
      </div>
    ),
  },
  {
    id: "features",
    title: "مميزات Replit",
    subtitle: "بيئة تطوير متكاملة سحابية",
    icon: <Zap size={18} />,
    color: "text-yellow-400",
    bgColor: "bg-yellow-500/15",
    content: (
      <div className="space-y-1">
        <FeatureRow
          icon={<Play size={15} />}
          title="التشغيل الفوري (Zero Setup)"
          desc="لا تحتاج لتثبيت لغات برمجة أو مكتبات على جهازك. بمجرد فتح المشروع، يوفر لك Replit كل ما تحتاجه لتشغيل الكود بضغطة زر واحدة."
        />
        <FeatureRow
          icon={<Users size={15} />}
          title="البرمجة الجماعية (Multiplayer)"
          desc="يمكنك دعوة أصدقائك أو زملائك للعمل على نفس الملف في نفس الوقت. سترى مؤشرات الماوس الخاصة بهم وهم يكتبون الكود معك، تماماً مثل مستندات Google Docs."
        />
        <FeatureRow
          icon={<Globe size={15} />}
          title="استضافة المواقع والتطبيقات (Hosting)"
          desc="إذا كنت تبني موقع ويب أو Bot، فإن Replit يمنحك رابطاً مباشراً للمشروع ليعمل على الإنترنت فوراً دون الحاجة لشراء استضافة منفصلة."
        />
        <FeatureRow
          icon={<Bot size={15} />}
          title="الذكاء الاصطناعي (Replit AI)"
          desc="مساعد ذكي يساعدك في إكمال الكود تلقائياً، شرح الأكواد المعقدة، وإصلاح الأخطاء البرمجية واقتراح الحلول."
        />
        <FeatureRow
          icon={<Code2 size={15} />}
          title="دعم أكثر من 50 لغة برمجة"
          desc="Python, JavaScript, Java, C++, PHP, Go, Rust والمزيد."
        />
        <FeatureRow
          icon={<Database size={15} />}
          title="قاعدة بيانات مدمجة (Replit DB)"
          desc="يوفر قاعدة بيانات بسيطة وسهلة الاستخدام لتخزين بيانات تطبيقك دون الحاجة لإعداد خوادم خارجية."
        />
        <FeatureRow
          icon={<Rocket size={15} />}
          title="أدوات النشر (Deployments)"
          desc="يمكنك نقل مشروعك من مرحلة التطوير إلى مرحلة الإنتاج (Production) على خوادم قوية لضمان تحمل عدد كبير من المستخدمين."
        />
      </div>
    ),
  },
  {
    id: "dashboard",
    title: "لوحة التحكم الرئيسية",
    subtitle: "Dashboard — مركز إدارة مشاريعك",
    icon: <LayoutDashboard size={18} />,
    color: "text-blue-400",
    bgColor: "bg-blue-500/15",
    content: (
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-2">
          {[
            { icon: <FolderOpen size={14} />, label: "Home", desc: "آخر المشاريع التي عملت عليها" },
            { icon: <Layers size={14} />, label: "My Repls", desc: "كافة مشاريعك منظمة في مجلدات" },
            { icon: <BookOpen size={14} />, label: "Templates", desc: "مكتبة ضخمة من القوالب الجاهزة" },
            { icon: <MessageSquare size={14} />, label: "Community", desc: "نشر مشاريعك وعمل Fork للآخرين" },
            { icon: <Users size={14} />, label: "Teams", desc: "للمدارس والشركات — العمل الجماعي المنظم" },
            { icon: <Star size={14} />, label: "Create Repl (+)", desc: "إنشاء مشروع جديد من قالب" },
          ].map(item => (
            <div key={item.label} className="bg-white/3 border border-white/8 rounded-xl p-3">
              <div className="flex items-center gap-2 mb-1.5">
                <div className="w-6 h-6 rounded-lg bg-white/8 flex items-center justify-center text-white/60">
                  {item.icon}
                </div>
                <span className="text-xs font-bold text-white font-mono">{item.label}</span>
              </div>
              <p className="text-[11px] text-white/45 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    id: "workspace",
    title: "محرر الكود (Workspace)",
    subtitle: "ورشة العمل الرئيسية مقسمة إلى ثلاثة أجزاء",
    icon: <Monitor size={18} />,
    color: "text-green-400",
    bgColor: "bg-green-500/15",
    content: (
      <div className="space-y-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-2">أ — الشريط الجانبي الأيسر</p>
          <div className="space-y-0.5">
            <SidebarItem icon={<FolderOpen size={13} />} label="Files (الملفات)" desc="لإضافة ملفات، مجلدات، أو رفع ملفات من جهازك" />
            <SidebarItem icon={<Github size={13} />} label="Git" desc="للربط مع GitHub، عمل Commit (حفظ نسخة)، أو Push (رفع)" />
            <SidebarItem icon={<Package size={13} />} label="Packages" desc="مدير الحزم — يتيح لك البحث عن أي مكتبة وتثبيتها بضغطة زر" />
            <SidebarItem icon={<Shield size={13} />} label="Secrets (البيئة)" desc="أداة للأمان — تضع فيها الـ API Keys وكلمات المرور بحيث لا يراها أحد" />
            <SidebarItem icon={<Database size={13} />} label="Database" desc="قاعدة بيانات Key-Value مدمجة وسهلة الاستخدام للمبتدئين" />
            <SidebarItem icon={<Terminal size={13} />} label="Shell" desc="نافذة Terminal كاملة (Linux) تتيح لك كتابة أوامر مباشرة للنظام" />
          </div>
        </div>
        <div className="h-px bg-white/8" />
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-2">ب — منطقة الكود (Code Editor)</p>
          <div className="flex flex-wrap gap-2">
            <ToolTag label="تلوين برمجي" />
            <ToolTag label="إكمال تلقائي" />
            <ToolTag label="تعاون لحظي" />
            <ToolTag label="زر Run" color="bg-green-500/15 text-green-400 border-green-400/20" />
          </div>
        </div>
        <div className="h-px bg-white/8" />
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-2">ج — الجانب الأيمن (Output)</p>
          <div className="flex flex-wrap gap-2">
            <ToolTag label="Console — مخرجات الكود" />
            <ToolTag label="Webview — معاينة المواقع" color="bg-blue-500/15 text-blue-400 border-blue-400/20" />
          </div>
        </div>
      </div>
    ),
  },
  {
    id: "ai",
    title: "أدوات الذكاء الاصطناعي",
    subtitle: "Replit AI — الميزة التي جعلت Replit يتفوق",
    icon: <Bot size={18} />,
    color: "text-purple-400",
    bgColor: "bg-purple-500/15",
    content: (
      <div className="space-y-1">
        <FeatureRow
          icon={<Zap size={15} />}
          title="Complete Code"
          desc="يقترح عليك السطر التالي أثناء الكتابة تلقائياً بناءً على السياق."
        />
        <FeatureRow
          icon={<BookOpen size={15} />}
          title="Explain Code"
          desc="تحدد كوداً معيناً وتطلب منه شرحه باللغة الطبيعية بدون مصطلحات تقنية معقدة."
        />
        <FeatureRow
          icon={<Code2 size={15} />}
          title="Edit Code"
          desc='تطلب منه مثلاً: "حول هذه القائمة إلى جدول" وسيقوم بتعديل الكود فوراً.'
        />
        <FeatureRow
          icon={<MessageSquare size={15} />}
          title="Chat (المساعد)"
          desc="مساعد برمجي موجود دائماً بجانبك لحل المشاكل البرمجية والإجابة على أسئلتك."
        />
      </div>
    ),
  },
  {
    id: "advanced",
    title: "أدوات متقدمة",
    subtitle: "Advanced Tools للمطورين المحترفين",
    icon: <Cpu size={18} />,
    color: "text-orange-400",
    bgColor: "bg-orange-500/15",
    content: (
      <div className="space-y-1">
        <FeatureRow
          icon={<Bug size={15} />}
          title="Debugger"
          desc="لتتبع الكود خطوة بخطوة واكتشاف الثغرات البرمجية بدقة عالية."
        />
        <FeatureRow
          icon={<TestTube2 size={15} />}
          title="Unit Testing"
          desc="أداة مدمجة لعمل اختبارات للتأكد من جودة الكود وصحة نتائجه."
        />
        <FeatureRow
          icon={<FileText size={15} />}
          title="Markdown Preview"
          desc="لعرض ملفات الشرح (README) بشكلها النهائي المنسق بدون الحاجة لتطبيق خارجي."
        />
        <FeatureRow
          icon={<Blocks size={15} />}
          title="Extensions"
          desc="متجر إضافات يتيح لك إضافة ميزات جديدة للمحرر مثل سمات الألوان أو أدوات الإنتاجية."
        />
      </div>
    ),
  },
  {
    id: "deploy",
    title: "النشر والاستضافة",
    subtitle: "Deployment — من التطوير إلى الإنتاج",
    icon: <Rocket size={18} />,
    color: "text-cyan-400",
    bgColor: "bg-cyan-500/15",
    content: (
      <div className="space-y-3">
        <DeployCard
          title="Static"
          badge="HTML"
          badgeColor="bg-blue-500/20 border-blue-400/30 text-blue-400"
          desc="لاستضافة المواقع البسيطة المبنية بـ HTML/CSS بدون خادم خلفي."
        />
        <DeployCard
          title="Autoscale"
          badge="AUTO"
          badgeColor="bg-green-500/20 border-green-400/30 text-green-400"
          desc="للتطبيقات التي تحتاج موارد متغيرة حسب عدد الزوار — يتوسع تلقائياً."
        />
        <DeployCard
          title="Reserved VM"
          badge="24/7"
          badgeColor="bg-purple-500/20 border-purple-400/30 text-purple-400"
          desc="حجز خادم بمواصفات محددة ليبقى مشروعك يعمل للأبد دون توقف."
        />
        <div className="bg-amber-500/8 border border-amber-400/20 rounded-xl px-4 py-3">
          <p className="text-xs text-amber-300/90 leading-relaxed">
            <span className="font-semibold">ملاحظة:</span> في الخطة المجانية يتوقف المشروع عند إغلاقه. في الخطة المدفوعة يبقى يعمل 24/7.
          </p>
        </div>
      </div>
    ),
  },
  {
    id: "settings",
    title: "الإعدادات",
    subtitle: "Settings — تحكم كامل في بيئة العمل",
    icon: <Settings size={18} />,
    color: "text-slate-400",
    bgColor: "bg-slate-500/15",
    content: (
      <div className="space-y-1">
        <FeatureRow
          icon={<Layers size={15} />}
          title="Layout (تخطيط الواجهة)"
          desc="تغيير شكل الواجهة بين Stacked (مكدس) أو Side-by-side (جانباً)."
        />
        <FeatureRow
          icon={<Palette size={15} />}
          title="Theme (السمة)"
          desc="تبديل بين الوضع الليلي (Dark) والنهاري (Light) حسب تفضيلك."
        />
        <FeatureRow
          icon={<Search size={15} />}
          title="Font Size (حجم الخط)"
          desc="التحكم في حجم الخط لراحة العين أثناء الكتابة البرمجية."
        />
        <FeatureRow
          icon={<AlignJustify size={15} />}
          title="Indentation (المسافات البادئة)"
          desc="اختيار المسافات بين الأكواد — Tabs أو Spaces — وفقاً لأسلوبك البرمجي."
        />
      </div>
    ),
  },
];

function AlignJustify({ size, className }: { size?: number; className?: string }) {
  return (
    <svg width={size || 15} height={size || 15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="18" x2="15" y2="18" />
    </svg>
  );
}

function SectionCard({ section }: { section: Section }) {
  const [open, setOpen] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-[#1a1a1a] border border-white/8 rounded-2xl overflow-hidden"
    >
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center gap-3 px-4 py-4 text-left hover:bg-white/3 transition-colors active:bg-white/5"
        data-testid={`section-${section.id}`}
      >
        <div className={cn("w-9 h-9 rounded-xl border border-white/10 flex items-center justify-center shrink-0", section.bgColor, section.color)}>
          {section.icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white leading-tight">{section.title}</p>
          <p className="text-xs text-white/40 mt-0.5 truncate">{section.subtitle}</p>
        </div>
        <motion.div
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="text-white/30 shrink-0"
        >
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
            <div className="px-4 pb-5 pt-1 border-t border-white/5">
              {section.content}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function Explore() {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="flex flex-col min-h-full pb-24 max-w-[480px] mx-auto w-full"
    >
      {/* Hero */}
      <div className="px-4 pt-12 pb-5">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-7 h-7 rounded-lg bg-blue-500/20 border border-blue-400/30 flex items-center justify-center">
            <BookOpen size={14} className="text-blue-400" />
          </div>
          <span className="text-xs font-semibold text-blue-400 uppercase tracking-widest">دليل Replit</span>
        </div>
        <h1 className="text-2xl font-bold text-white leading-tight">اكتشف Replit</h1>
        <p className="text-sm text-white/45 mt-1 leading-relaxed">
          Replit هو "نظام تشغيل للبرمجة" في المتصفح — يبدأ كنوتة بسيطة لكتابة الكود وينتهي كخادم احترافي يستضيف تطبيقات عالمية.
        </p>
      </div>

      {/* Stats bar */}
      <div className="mx-4 mb-5 bg-white/3 border border-white/8 rounded-2xl p-4 grid grid-cols-3 gap-4">
        {[
          { label: "لغة برمجة", value: "+50" },
          { label: "مستخدم نشط", value: "+30M" },
          { label: "نموذج AI", value: "+60" },
        ].map(stat => (
          <div key={stat.label} className="text-center">
            <p className="text-lg font-bold text-white">{stat.value}</p>
            <p className="text-[10px] text-white/40 mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Sections */}
      <div className="px-4 space-y-2.5">
        {SECTIONS.map((section, i) => (
          <motion.div
            key={section.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
          >
            <SectionCard section={section} />
          </motion.div>
        ))}
      </div>

      {/* Footer tip */}
      <div className="mx-4 mt-5 bg-blue-500/8 border border-blue-400/20 rounded-2xl p-4 flex gap-3">
        <CheckCircle2 size={18} className="text-blue-400 shrink-0 mt-0.5" />
        <p className="text-xs text-white/60 leading-relaxed">
          <span className="font-semibold text-white">باختصار:</span> Replit هو بيئة تطوير متكاملة (IDE) سحابية. يمكنك البدء بها مجاناً، كتابة الكود، اختباره، ونشره — كل ذلك بدون تثبيت أي شيء.
        </p>
      </div>

      <div className="h-4" />
    </motion.div>
  );
}
