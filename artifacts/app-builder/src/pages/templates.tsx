import { useState } from "react";
import { useLocation } from "wouter";
import { motion as m } from "framer-motion";
import {
  Globe, Smartphone, Database, Bot, BarChart3, Server,
  BookOpen, Gamepad2, ShoppingCart, MessageSquare, Layers,
  Code2, Zap, Search, Star, TrendingUp, Clock
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";

interface Template {
  id: number;
  name: string;
  desc: string;
  lang: string;
  icon: React.ElementType;
  color: string;
  bg: string;
  uses: string;
  tag: "Popular" | "New" | "AI" | "Official";
  tagColor: string;
}

const TEMPLATES: Template[] = [
  { id: 1, name: "React + Vite", desc: "تطبيق React حديث مع Vite وTailwind CSS", lang: "TypeScript", icon: Globe, color: "text-blue-400", bg: "bg-blue-500/15", uses: "128k", tag: "Popular", tagColor: "bg-yellow-500/20 text-yellow-400 border-yellow-400/30" },
  { id: 2, name: "Python Flask", desc: "خادم ويب بسيط مع Flask وقاعدة بيانات", lang: "Python", icon: Server, color: "text-green-400", bg: "bg-green-500/15", uses: "95k", tag: "Popular", tagColor: "bg-yellow-500/20 text-yellow-400 border-yellow-400/30" },
  { id: 3, name: "Node.js + Express", desc: "REST API متكامل مع Express وMongoDB", lang: "JavaScript", icon: Layers, color: "text-yellow-400", bg: "bg-yellow-500/15", uses: "87k", tag: "Popular", tagColor: "bg-yellow-500/20 text-yellow-400 border-yellow-400/30" },
  { id: 4, name: "AI Chatbot", desc: "بوت محادثة ذكي مع Anthropic Claude API", lang: "TypeScript", icon: Bot, color: "text-purple-400", bg: "bg-purple-500/15", uses: "43k", tag: "AI", tagColor: "bg-purple-500/20 text-purple-400 border-purple-400/30" },
  { id: 5, name: "Data Dashboard", desc: "لوحة تحكم لعرض البيانات والإحصائيات", lang: "Python", icon: BarChart3, color: "text-cyan-400", bg: "bg-cyan-500/15", uses: "61k", tag: "Popular", tagColor: "bg-yellow-500/20 text-yellow-400 border-yellow-400/30" },
  { id: 6, name: "Mobile App (Flutter)", desc: "تطبيق موبايل يعمل على iOS وAndroid", lang: "Dart", icon: Smartphone, color: "text-pink-400", bg: "bg-pink-500/15", uses: "29k", tag: "Official", tagColor: "bg-blue-500/20 text-blue-400 border-blue-400/30" },
  { id: 7, name: "Next.js Full Stack", desc: "تطبيق كامل مع SSR وAPI Routes وقاعدة بيانات", lang: "TypeScript", icon: Zap, color: "text-orange-400", bg: "bg-orange-500/15", uses: "112k", tag: "New", tagColor: "bg-green-500/20 text-green-400 border-green-400/30" },
  { id: 8, name: "Discord Bot", desc: "بوت لـ Discord مع أوامر Slash ومزايا متقدمة", lang: "JavaScript", icon: MessageSquare, color: "text-indigo-400", bg: "bg-indigo-500/15", uses: "78k", tag: "Popular", tagColor: "bg-yellow-500/20 text-yellow-400 border-yellow-400/30" },
  { id: 9, name: "E-Commerce Store", desc: "متجر إلكتروني مع Stripe وإدارة المنتجات", lang: "TypeScript", icon: ShoppingCart, color: "text-emerald-400", bg: "bg-emerald-500/15", uses: "34k", tag: "Official", tagColor: "bg-blue-500/20 text-blue-400 border-blue-400/30" },
  { id: 10, name: "PostgreSQL Database", desc: "قاعدة بيانات SQL مع Drizzle ORM وAPI", lang: "TypeScript", icon: Database, color: "text-teal-400", bg: "bg-teal-500/15", uses: "55k", tag: "Official", tagColor: "bg-blue-500/20 text-blue-400 border-blue-400/30" },
  { id: 11, name: "2D Game (p5.js)", desc: "لعبة ثنائية الأبعاد تعمل مباشرة في المتصفح", lang: "JavaScript", icon: Gamepad2, color: "text-red-400", bg: "bg-red-500/15", uses: "47k", tag: "Popular", tagColor: "bg-yellow-500/20 text-yellow-400 border-yellow-400/30" },
  { id: 12, name: "AI Image Generator", desc: "مولد صور بالذكاء الاصطناعي مع DALL-E API", lang: "Python", icon: Star, color: "text-amber-400", bg: "bg-amber-500/15", uses: "38k", tag: "AI", tagColor: "bg-purple-500/20 text-purple-400 border-purple-400/30" },
];

const TAGS = ["الكل", "Popular", "New", "AI", "Official"];
const LANGS = ["الكل", "TypeScript", "Python", "JavaScript", "Dart"];

export default function Templates() {
  const [search, setSearch] = useState("");
  const [activeTag, setActiveTag] = useState("الكل");
  const [activeLang, setActiveLang] = useState("الكل");
  const [, setLocation] = useLocation();

  const filtered = TEMPLATES.filter(t => {
    const matchSearch = !search || t.name.toLowerCase().includes(search.toLowerCase()) || t.lang.toLowerCase().includes(search.toLowerCase()) || t.desc.toLowerCase().includes(search.toLowerCase());
    const matchTag = activeTag === "الكل" || t.tag === activeTag;
    const matchLang = activeLang === "الكل" || t.lang === activeLang;
    return matchSearch && matchTag && matchLang;
  });

  const handleUse = (template: Template) => {
    sessionStorage.setItem("chat_prompt", `أريد استخدام قالب "${template.name}" (${template.lang}). ${template.desc}`);
    setLocation("/chat");
  };

  return (
    <m.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="flex flex-col min-h-full pb-24 max-w-[480px] mx-auto w-full"
    >
      {/* Header */}
      <div className="px-4 pt-12 pb-4">
        <div className="flex items-center gap-2 mb-1">
          <BookOpen size={14} className="text-blue-400" />
          <span className="text-xs font-semibold text-blue-400 uppercase tracking-widest">مكتبة القوالب</span>
        </div>
        <h1 className="text-2xl font-bold text-white">Templates</h1>
        <p className="text-sm text-white/40 mt-1">ابدأ مشروعك من قالب جاهز بدلاً من الصفر</p>
      </div>

      {/* Search */}
      <div className="px-4 mb-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" size={16} />
          <Input
            placeholder="ابحث عن قالب..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 bg-[#1c1c1c] border-white/10 text-white placeholder:text-white/25 rounded-xl h-11 focus-visible:ring-blue-500/30 focus-visible:border-white/20"
            data-testid="input-search-templates"
          />
        </div>
      </div>

      {/* Tag filters */}
      <div className="px-4 mb-2 overflow-x-auto no-scrollbar">
        <div className="flex gap-2 pb-1">
          {TAGS.map(tag => (
            <button
              key={tag}
              onClick={() => setActiveTag(tag)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all border shrink-0",
                activeTag === tag
                  ? "bg-blue-500/25 border-blue-400/40 text-blue-400"
                  : "bg-white/4 border-white/8 text-white/45 hover:text-white/70 hover:bg-white/8"
              )}
              data-testid={`filter-tag-${tag}`}
            >
              {tag === "Popular" && <TrendingUp size={11} />}
              {tag === "New" && <Clock size={11} />}
              {tag === "AI" && <Bot size={11} />}
              {tag === "Official" && <Star size={11} />}
              {tag}
            </button>
          ))}
        </div>
      </div>

      {/* Language filters */}
      <div className="px-4 mb-4 overflow-x-auto no-scrollbar">
        <div className="flex gap-2 pb-1">
          {LANGS.map(lang => (
            <button
              key={lang}
              onClick={() => setActiveLang(lang)}
              className={cn(
                "px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-all border shrink-0",
                activeLang === lang
                  ? "bg-white/15 border-white/25 text-white"
                  : "bg-transparent border-white/6 text-white/35 hover:text-white/60"
              )}
              data-testid={`filter-lang-${lang}`}
            >
              {lang}
            </button>
          ))}
        </div>
      </div>

      {/* Template grid */}
      <div className="px-4 space-y-3">
        {filtered.map((template, i) => {
          const Icon = template.icon;
          return (
            <m.button
              key={template.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              onClick={() => handleUse(template)}
              className="w-full flex items-start gap-3.5 p-4 rounded-2xl bg-[#1a1a1a] border border-white/8 hover:border-white/15 hover:bg-white/3 active:scale-[0.99] transition-all text-left"
              data-testid={`template-${template.id}`}
            >
              <div className={cn("w-11 h-11 rounded-xl flex items-center justify-center shrink-0", template.bg)}>
                <Icon size={22} className={template.color} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <h3 className="text-sm font-semibold text-white leading-tight truncate">{template.name}</h3>
                  <span className={cn("text-[10px] font-bold px-1.5 py-0.5 rounded-md border shrink-0", template.tagColor)}>
                    {template.tag}
                  </span>
                </div>
                <p className="text-xs text-white/45 leading-relaxed line-clamp-2">{template.desc}</p>
                <div className="flex items-center gap-3 mt-2">
                  <span className="text-[11px] font-medium text-white/30 bg-white/5 px-2 py-0.5 rounded-md border border-white/6">
                    {template.lang}
                  </span>
                  <span className="text-[11px] text-white/25 flex items-center gap-1">
                    <Code2 size={10} /> {template.uses} uses
                  </span>
                </div>
              </div>
            </m.button>
          );
        })}

        {filtered.length === 0 && (
          <div className="text-center py-16">
            <Search size={40} className="mx-auto mb-3 text-white/15" />
            <p className="text-sm text-white/30">لا توجد قوالب مطابقة</p>
          </div>
        )}
      </div>
    </m.div>
  );
}
