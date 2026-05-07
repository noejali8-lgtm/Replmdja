import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bot, Play, Square, ChevronLeft, Sparkles, FileText, FolderOpen,
  Terminal, CheckCircle2, Loader2, AlertCircle, Code2, Database,
  Globe, Zap, RotateCcw, Send, Plus, ArrowRight, Cpu, Package,
  GitBranch, Eye, Rocket, X, FileCode, Braces, Shield, Search
} from "lucide-react";
import { useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

type AgentStep = {
  id: string;
  type: "thinking" | "file" | "code" | "install" | "run" | "fix" | "done" | "error";
  title: string;
  detail?: string;
  code?: string;
  lang?: string;
  status: "pending" | "running" | "done" | "error";
};

type Preset = {
  label: string;
  desc: string;
  icon: React.ReactNode;
  color: string;
  steps: AgentStep[];
};

const PRESETS: Preset[] = [
  {
    label: "نظام إدارة صيدلية",
    desc: "Python + PostgreSQL + واجهة ويب",
    icon: <Database size={16} />,
    color: "text-blue-400",
    steps: [
      { id: "1", type: "thinking", title: "تحليل المتطلبات", detail: "نظام صيدلية: جرد، مرضى، وصفات، مبيعات...", status: "pending" },
      { id: "2", type: "file", title: "إنشاء هيكل المشروع", detail: "pharmacy/\n  ├── app.py\n  ├── models.py\n  ├── routes/\n  └── templates/", status: "pending" },
      { id: "3", type: "code", title: "كتابة نماذج البيانات (models.py)", lang: "python", code: `from flask_sqlalchemy import SQLAlchemy
db = SQLAlchemy()

class Medicine(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    quantity = db.Column(db.Integer, default=0)
    price = db.Column(db.Float, nullable=False)
    expiry = db.Column(db.Date)

class Patient(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    prescriptions = db.relationship('Prescription', backref='patient')

class Prescription(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    patient_id = db.Column(db.Integer, db.ForeignKey('patient.id'))
    medicine_id = db.Column(db.Integer, db.ForeignKey('medicine.id'))
    dosage = db.Column(db.String(50))
    date = db.Column(db.DateTime)`, status: "pending" },
      { id: "4", type: "install", title: "تثبيت الاعتماديات", detail: "pip install flask flask-sqlalchemy psycopg2 flask-login", status: "pending" },
      { id: "5", type: "code", title: "كتابة الخادم الرئيسي (app.py)", lang: "python", code: `from flask import Flask, render_template, request, jsonify
from models import db, Medicine, Patient, Prescription
import os

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = os.environ['DATABASE_URL']
db.init_app(app)

@app.route('/api/medicines', methods=['GET'])
def get_medicines():
    meds = Medicine.query.filter(Medicine.quantity > 0).all()
    return jsonify([{'id': m.id, 'name': m.name,
                     'qty': m.quantity, 'price': m.price} for m in meds])

@app.route('/api/sell', methods=['POST'])
def sell():
    data = request.json
    med = Medicine.query.get_or_404(data['medicine_id'])
    if med.quantity < data['qty']:
        return jsonify({'error': 'كمية غير كافية'}), 400
    med.quantity -= data['qty']
    db.session.commit()
    return jsonify({'success': True, 'remaining': med.quantity})

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(host='0.0.0.0', port=3000)`, status: "pending" },
      { id: "6", type: "run", title: "تشغيل الخادم واختباره", detail: "python app.py — Running on http://0.0.0.0:3000", status: "pending" },
      { id: "7", type: "fix", title: "اكتشاف وإصلاح خطأ", detail: "NameError: 'datetime' not defined → import datetime added", status: "pending" },
      { id: "8", type: "done", title: "التطبيق جاهز وشغّال!", detail: "نظام الصيدلية يعمل على المنفذ 3000", status: "pending" },
    ],
  },
  {
    label: "موقع متجر إلكتروني",
    desc: "React + Node.js + Stripe",
    icon: <Globe size={16} />,
    color: "text-green-400",
    steps: [
      { id: "1", type: "thinking", title: "تصميم هيكل المتجر", detail: "منتجات، عربة تسوق، دفع إلكتروني، مصادقة...", status: "pending" },
      { id: "2", type: "file", title: "إنشاء monorepo", detail: "store/\n  ├── frontend/ (React+Vite)\n  ├── backend/ (Express)\n  └── shared/", status: "pending" },
      { id: "3", type: "install", title: "تثبيت الحزم", detail: "npm install react vite stripe express mongoose", status: "pending" },
      { id: "4", type: "code", title: "واجهة المنتجات (ProductGrid.tsx)", lang: "tsx", code: `export function ProductGrid({ products }) {
  return (
    <div className="grid grid-cols-3 gap-6">
      {products.map(p => (
        <div key={p.id} className="card">
          <img src={p.image} alt={p.name} />
          <h3>{p.name}</h3>
          <p className="price">\${p.price}</p>
          <button onClick={() => addToCart(p)}>
            أضف للسلة 🛒
          </button>
        </div>
      ))}
    </div>
  );
}`, status: "pending" },
      { id: "5", type: "code", title: "ربط Stripe للدفع", lang: "js", code: `const stripe = require('stripe')(process.env.STRIPE_SECRET);

app.post('/create-checkout', async (req, res) => {
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: req.body.items.map(item => ({
      price_data: {
        currency: 'usd',
        product_data: { name: item.name },
        unit_amount: item.price * 100,
      },
      quantity: item.qty,
    })),
    mode: 'payment',
    success_url: '/success',
    cancel_url: '/cancel',
  });
  res.json({ url: session.url });
});`, status: "pending" },
      { id: "6", type: "run", title: "تشغيل التطبيق", detail: "Frontend: port 5173 | Backend: port 3000", status: "pending" },
      { id: "7", type: "done", title: "متجرك يعمل!", detail: "100% جاهز — أضف منتجاتك الآن", status: "pending" },
    ],
  },
  {
    label: "بوت واتساب ذكي",
    desc: "Node.js + Twilio + OpenAI",
    icon: <Zap size={16} />,
    color: "text-emerald-400",
    steps: [
      { id: "1", type: "thinking", title: "تحليل متطلبات البوت", detail: "استقبال رسائل → معالجة AI → إرسال رد تلقائي", status: "pending" },
      { id: "2", type: "file", title: "إنشاء ملفات المشروع", detail: "whatsapp-bot/\n  ├── index.js\n  ├── ai.js\n  └── .env", status: "pending" },
      { id: "3", type: "install", title: "تثبيت twilio + openai", detail: "npm install express twilio openai dotenv", status: "pending" },
      { id: "4", type: "code", title: "كتابة البوت الذكي", lang: "js", code: `const { OpenAI } = require('openai');
const twilio = require('twilio');
const openai = new OpenAI({ apiKey: process.env.OPENAI_KEY });

app.post('/webhook', async (req, res) => {
  const { Body, From } = req.body;
  const twiml = new twilio.twiml.MessagingResponse();

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: 'أنت مساعد ذكي باللغة العربية' },
      { role: 'user', content: Body }
    ]
  });

  const reply = completion.choices[0].message.content;
  twiml.message(reply);
  res.type('text/xml').send(twiml.toString());
});`, status: "pending" },
      { id: "5", type: "run", title: "تشغيل الخادم وربط Twilio", detail: "Webhook URL: https://your-repl.replit.app/webhook", status: "pending" },
      { id: "6", type: "done", title: "البوت شغّال!", detail: "أرسل رسالة واتساب وشاهد الرد الذكي", status: "pending" },
    ],
  },
];

type StepIconProps = { type: AgentStep["type"]; status: AgentStep["status"] };
function StepIcon({ type, status }: StepIconProps) {
  if (status === "running") return <Loader2 size={14} className="text-blue-400 animate-spin" />;
  if (status === "done") return <CheckCircle2 size={14} className="text-green-400" />;
  if (status === "error") return <AlertCircle size={14} className="text-red-400" />;
  const icons: Record<AgentStep["type"], React.ReactNode> = {
    thinking: <Cpu size={14} className="text-purple-400/40" />,
    file: <FolderOpen size={14} className="text-yellow-400/40" />,
    code: <Code2 size={14} className="text-blue-400/40" />,
    install: <Package size={14} className="text-orange-400/40" />,
    run: <Play size={14} className="text-green-400/40" />,
    fix: <AlertCircle size={14} className="text-amber-400/40" />,
    done: <CheckCircle2 size={14} className="text-green-400/40" />,
    error: <X size={14} className="text-red-400/40" />,
  };
  return <>{icons[type]}</>;
}

export default function ReplitAgent() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [selectedPreset, setSelectedPreset] = useState<number | null>(null);
  const [customPrompt, setCustomPrompt] = useState("");
  const [steps, setSteps] = useState<AgentStep[]>([]);
  const [running, setRunning] = useState(false);
  const [currentStep, setCurrentStep] = useState(-1);
  const [done, setDone] = useState(false);
  const [expandedCode, setExpandedCode] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const reset = () => {
    setSteps([]); setRunning(false); setCurrentStep(-1); setDone(false);
    setSelectedPreset(null); setCustomPrompt(""); setExpandedCode(null);
    if (intervalRef.current) clearInterval(intervalRef.current);
  };

  const startAgent = (preset?: Preset) => {
    const activeSteps: AgentStep[] = preset
      ? preset.steps.map(s => ({ ...s, status: "pending" }))
      : [
          { id: "1", type: "thinking", title: "تحليل الطلب بالذكاء الاصطناعي", detail: customPrompt, status: "pending" },
          { id: "2", type: "file", title: "إنشاء هيكل المشروع", detail: "يتم تحديد اللغة والإطار المناسب...", status: "pending" },
          { id: "3", type: "code", title: "كتابة الكود الأساسي", lang: "js", code: `// تم إنشاؤه بواسطة Replit Agent\n// بناءً على: ${customPrompt}\n\nconst app = require('./app');\napp.listen(3000, () => console.log('🚀 Server running'));`, status: "pending" },
          { id: "4", type: "install", title: "تثبيت الحزم المطلوبة", detail: "يتم تحليل الكود وتحديد الاعتماديات...", status: "pending" },
          { id: "5", type: "run", title: "تشغيل المشروع", detail: "الخادم يعمل على المنفذ 3000", status: "pending" },
          { id: "6", type: "done", title: "مشروعك جاهز!", detail: customPrompt, status: "pending" },
        ];

    setSteps(activeSteps);
    setRunning(true);
    setDone(false);
    setCurrentStep(0);
    toast({ title: "🤖 الوكيل بدأ العمل", description: preset?.label ?? customPrompt });
  };

  useEffect(() => {
    if (!running || currentStep < 0 || currentStep >= steps.length) return;
    setSteps(prev => prev.map((s, i) => i === currentStep ? { ...s, status: "running" } : s));
    const delay = steps[currentStep].type === "thinking" ? 1400 : steps[currentStep].type === "code" ? 2200 : 1200;
    const t = setTimeout(() => {
      setSteps(prev => prev.map((s, i) => i === currentStep ? { ...s, status: "done" } : s));
      if (currentStep + 1 < steps.length) {
        setCurrentStep(c => c + 1);
      } else {
        setRunning(false);
        setDone(true);
        toast({ title: "✅ الوكيل أنهى العمل!", description: "مشروعك جاهز للاستخدام" });
      }
    }, delay);
    setTimeout(() => scrollRef.current?.scrollTo({ top: 9999, behavior: "smooth" }), 100);
    return () => clearTimeout(t);
  }, [currentStep, running]);

  const completedCount = steps.filter(s => s.status === "done").length;

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
      className="flex flex-col min-h-full max-w-[480px] mx-auto w-full">

      {/* Header */}
      <div className="px-4 pt-10 pb-4 sticky top-0 bg-background/95 backdrop-blur-md z-10 border-b border-white/5">
        <div className="flex items-center gap-3">
          <button onClick={() => setLocation("/explore")}
            className="w-8 h-8 rounded-lg bg-white/6 border border-white/10 flex items-center justify-center text-white/50 hover:text-white transition-colors">
            <ChevronLeft size={16} />
          </button>
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center shrink-0">
            <Bot size={16} className="text-white" />
          </div>
          <div className="flex-1">
            <h1 className="text-base font-bold text-white leading-tight">Replit Agent</h1>
            <p className="text-[10px] text-white/40">وكيل AI يبني مشاريعك تلقائياً</p>
          </div>
          {running && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-purple-500/15 border border-purple-400/25 rounded-full">
              <div className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-pulse" />
              <span className="text-[10px] text-purple-400 font-semibold">{completedCount}/{steps.length}</span>
            </div>
          )}
          {(running || steps.length > 0) && (
            <button onClick={reset} className="text-white/30 hover:text-white/60 transition-colors"><RotateCcw size={15} /></button>
          )}
        </div>
      </div>

      <div className="flex-1 flex flex-col px-4 py-4 gap-4 pb-8">
        {/* Intro */}
        {steps.length === 0 && (
          <>
            <div className="bg-gradient-to-br from-purple-500/10 to-blue-500/10 border border-purple-400/20 rounded-2xl p-4">
              <p className="text-sm text-white/80 leading-relaxed mb-3">
                <span className="text-purple-400 font-bold">Replit Agent</span> ليس مجرد دردشة — هو <span className="text-white font-semibold">مبرمج آلي</span> يكتب الكود، ينشئ الملفات، يثبت المكتبات، ويُصلح الأخطاء بنفسه حتى يظهر مشروعك كاملاً.
              </p>
              <div className="flex items-center gap-2 text-xs text-white/50">
                <CheckCircle2 size={12} className="text-green-400" /> يفهم السياق الكامل للمشروع
              </div>
              <div className="flex items-center gap-2 text-xs text-white/50 mt-1">
                <CheckCircle2 size={12} className="text-green-400" /> يُصلح الأخطاء تلقائياً
              </div>
              <div className="flex items-center gap-2 text-xs text-white/50 mt-1">
                <CheckCircle2 size={12} className="text-green-400" /> يعمل بأي لغة أو إطار
              </div>
            </div>

            {/* Preset cards */}
            <div>
              <p className="text-[11px] font-bold text-white/40 uppercase tracking-widest mb-2">مشاريع جاهزة للبناء</p>
              <div className="space-y-2">
                {PRESETS.map((preset, i) => (
                  <button key={i} onClick={() => { setSelectedPreset(i); startAgent(preset); }}
                    className="w-full flex items-center gap-3 px-4 py-3.5 bg-[#1a1a1a] border border-white/8 rounded-2xl hover:border-white/20 hover:bg-white/3 transition-all active:scale-[0.98] text-left"
                    data-testid={`preset-${i}`}>
                    <div className={cn("w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center", preset.color)}>
                      {preset.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white">{preset.label}</p>
                      <p className="text-xs text-white/40 truncate">{preset.desc}</p>
                    </div>
                    <ArrowRight size={14} className="text-white/20 shrink-0" />
                  </button>
                ))}
              </div>
            </div>

            {/* Custom prompt */}
            <div className="bg-[#1a1a1a] border border-white/8 rounded-2xl p-4">
              <p className="text-[11px] font-bold text-white/40 uppercase tracking-widest mb-3">أو اكتب فكرتك</p>
              <textarea value={customPrompt} onChange={e => setCustomPrompt(e.target.value)}
                placeholder="مثال: ابنِ لي تطبيقاً لإدارة المهام مع قاعدة بيانات وواجهة عربية..."
                className="w-full bg-black/30 border border-white/10 rounded-xl px-3 py-3 text-sm text-white placeholder:text-white/25 outline-none focus:border-purple-400/50 resize-none min-h-[90px] transition-colors"
                data-testid="custom-prompt"
              />
              <button onClick={() => { if (customPrompt.trim()) startAgent(); }}
                disabled={!customPrompt.trim()}
                className="mt-3 w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-purple-500/20 border border-purple-400/35 text-purple-300 text-sm font-bold disabled:opacity-40 transition-all active:scale-[0.98]">
                <Bot size={15} />
                ابدأ البناء مع Agent
                <Sparkles size={13} />
              </button>
            </div>
          </>
        )}

        {/* Steps log */}
        {steps.length > 0 && (
          <>
            {done && (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                className="bg-green-500/10 border border-green-400/30 rounded-2xl p-4 text-center">
                <CheckCircle2 size={28} className="text-green-400 mx-auto mb-2" />
                <p className="text-sm font-bold text-green-400">مشروعك جاهز! 🎉</p>
                <p className="text-xs text-white/50 mt-1">تم بناء {steps.length} مكون بنجاح</p>
                <div className="flex gap-2 mt-3">
                  <button onClick={() => toast({ title: "🚀 جاري النشر...", description: "يتم رفع المشروع للإنترنت" })}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-blue-500/20 border border-blue-400/30 text-blue-400 text-xs font-bold">
                    <Rocket size={12} /> نشر المشروع
                  </button>
                  <button onClick={() => toast({ title: "👁 فتح المعاينة", description: "يتم فتح Webview" })}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-white/8 border border-white/12 text-white/60 text-xs font-bold">
                    <Eye size={12} /> معاينة
                  </button>
                </div>
                <button onClick={reset} className="mt-2 w-full py-2 rounded-xl text-white/30 text-xs hover:text-white/60 transition-colors">
                  بناء مشروع جديد
                </button>
              </motion.div>
            )}

            <div ref={scrollRef} className="space-y-2 overflow-y-auto max-h-[60vh] no-scrollbar">
              {steps.map((step, i) => (
                <motion.div key={step.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                  className={cn("bg-[#1a1a1a] border rounded-2xl overflow-hidden transition-all",
                    step.status === "running" ? "border-blue-400/40 shadow-[0_0_20px_rgba(96,165,250,0.1)]" :
                    step.status === "done" ? "border-white/8" : "border-white/5 opacity-50")}>
                  <div className="flex items-center gap-3 px-4 py-3">
                    <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border",
                      step.status === "running" ? "bg-blue-500/15 border-blue-400/30" :
                      step.status === "done" ? "bg-green-500/10 border-green-400/20" : "bg-white/4 border-white/8")}>
                      <StepIcon type={step.type} status={step.status} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={cn("text-xs font-semibold", step.status === "done" ? "text-white" : "text-white/50")}>{step.title}</p>
                      {step.status === "running" && (
                        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-[11px] text-blue-400 mt-0.5 truncate">{step.detail}</motion.p>
                      )}
                      {step.status === "done" && step.detail && (
                        <p className="text-[11px] text-white/35 mt-0.5 truncate">{step.detail}</p>
                      )}
                    </div>
                    {step.code && step.status === "done" && (
                      <button onClick={() => setExpandedCode(expandedCode === step.id ? null : step.id)}
                        className="text-[10px] text-blue-400 border border-blue-400/30 px-2 py-0.5 rounded-lg hover:bg-blue-500/10 transition-colors">
                        {expandedCode === step.id ? "إخفاء" : "كود"}
                      </button>
                    )}
                  </div>
                  <AnimatePresence>
                    {step.code && expandedCode === step.id && (
                      <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="overflow-hidden">
                        <div className="border-t border-white/5 bg-black/40 px-4 py-3">
                          <pre className="text-[11px] font-mono text-green-400 overflow-x-auto whitespace-pre-wrap max-h-[200px] overflow-y-auto no-scrollbar">{step.code}</pre>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  {step.status === "running" && (
                    <div className="h-0.5 bg-blue-500/20 overflow-hidden">
                      <motion.div className="h-full bg-blue-400" initial={{ width: "0%" }} animate={{ width: "100%" }} transition={{ duration: 1.5, ease: "linear" }} />
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </>
        )}
      </div>
    </motion.div>
  );
}
