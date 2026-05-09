import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Package, Search, Download, Trash2, CheckCircle2,
  Star, TrendingDown, TrendingUp, Filter, RefreshCw, Loader2,
  Zap, Shield, Brain, Code2, Database, Network, Settings,
  BookOpen, TestTube2, Globe, ShoppingBag
} from "lucide-react";
import { cn } from "@/lib/utils";

const BASE_URL = import.meta.env.BASE_URL?.replace(/\/$/, "") || "";

interface Plugin {
  id: number; name: string; displayName: string; description: string;
  category: string; type: string; icon: string; tags: string[];
  capabilities: string[]; rating: number; downloads: number;
  isInstalled: boolean; isEnabled: boolean; npmPackage: string | null;
}

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  "Core & Orchestration": Network, "Memory & Knowledge": Database,
  "Intelligence & Learning": Brain, "Code Quality & Testing": TestTube2,
  "Security & Compliance": Shield, "DevOps & Integration": Settings,
  Methodology: BookOpen, Marketplace: ShoppingBag, Integration: Globe,
  "Vector DB": Database, "LLM Framework": Brain, "Local LLM": Code2,
  "LLM Provider": Zap, Validation: CheckCircle2, Database: Database,
  Testing: TestTube2, Async: Zap, "Web Framework": Globe, Logging: Settings,
  "Real-time": Network, Cache: Database, Queue: Settings, Security: Shield, Runtime: Code2,
};

export default function PluginsPage() {
  const [, navigate] = useLocation();
  const [plugins, setPlugins] = useState<Plugin[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [installing, setInstalling] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [typeFilter, setTypeFilter] = useState<"all" | "native" | "npm">("all");
  const [showInstalled, setShowInstalled] = useState(false);
  const [tab, setTab] = useState<"browse" | "installed">("browse");

  useEffect(() => { fetchPlugins(); }, []);

  async function fetchPlugins() {
    setLoading(true);
    try {
      const r = await fetch(`${BASE_URL}/api/plugins`);
      const d = await r.json() as { plugins: Plugin[]; categories: string[] };
      setPlugins(d.plugins ?? []);
      setCategories(d.categories ?? []);
    } catch { /* ignore */ }
    setLoading(false);
  }

  async function installPlugin(name: string) {
    setInstalling(name);
    try {
      await fetch(`${BASE_URL}/api/plugins/${name}/install`, { method: "POST" });
      setPlugins(ps => ps.map(p => p.name === name ? { ...p, isInstalled: true, isEnabled: true } : p));
    } catch { /* ignore */ }
    setInstalling(null);
  }

  async function uninstallPlugin(name: string) {
    setInstalling(name);
    try {
      await fetch(`${BASE_URL}/api/plugins/${name}/uninstall`, { method: "POST" });
      setPlugins(ps => ps.map(p => p.name === name ? { ...p, isInstalled: false, isEnabled: false } : p));
    } catch { /* ignore */ }
    setInstalling(null);
  }

  const filtered = plugins.filter(p => {
    if (tab === "installed" && !p.isInstalled) return false;
    if (category !== "all" && p.category !== category) return false;
    if (typeFilter !== "all" && p.type !== typeFilter) return false;
    if (search && !p.displayName.toLowerCase().includes(search.toLowerCase()) && !p.description.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const installed = plugins.filter(p => p.isInstalled);
  const native = plugins.filter(p => p.type === "native");
  const npm = plugins.filter(p => p.type === "npm");

  function renderStars(rating: number) {
    return Array.from({ length: 5 }, (_, i) => (
      <Star key={i} size={9} className={i < Math.round(rating) ? "text-yellow-400 fill-yellow-400" : "text-white/20"} />
    ));
  }

  return (
    <div className="min-h-screen bg-[#0d1117] text-white flex flex-col">
      <div className="sticky top-0 z-20 bg-[#0d1117]/95 backdrop-blur border-b border-white/[0.08] px-4 pt-safe">
        <div className="flex items-center gap-3 py-3">
          <button onClick={() => navigate("/")} className="p-1.5 rounded-lg hover:bg-white/5 text-white/60 hover:text-white transition-colors">
            <ArrowLeft size={20} />
          </button>
          <Package size={18} className="text-pink-400" />
          <span className="font-semibold flex-1">Plugin Marketplace</span>
          <span className="text-[10px] font-mono bg-pink-500/20 text-pink-300 border border-pink-400/20 px-2 py-0.5 rounded-full">{native.length + npm.length} PLUGINS</span>
        </div>
        <div className="flex gap-1 pb-3">
          {(["browse", "installed"] as const).map(t => (
            <button key={t} onClick={() => setTab(t)} className={cn("flex-1 py-1.5 rounded-lg text-[12px] font-medium capitalize transition-colors", tab === t ? "bg-white/10 text-white" : "text-white/40 hover:text-white/70")}>
              {t === "browse" ? `Browse (${plugins.length})` : `Installed (${installed.length})`}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pb-24 px-4 pt-4 space-y-3">
        {tab === "browse" && (
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: "Native Plugins", value: native.length, color: "text-pink-300" },
              { label: "npm Plugins", value: npm.length, color: "text-blue-300" },
              { label: "Installed", value: installed.length, color: "text-green-300" },
            ].map(({ label, value, color }) => (
              <div key={label} className="bg-[#161b22] border border-white/[0.06] rounded-xl p-3 text-center">
                <div className={cn("text-xl font-bold", color)}>{value}</div>
                <div className="text-[9px] text-white/30 mt-0.5">{label}</div>
              </div>
            ))}
          </div>
        )}

        <div className="relative">
          <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search plugins..." className="w-full bg-[#161b22] border border-white/[0.06] rounded-lg py-2 pl-8 pr-3 text-[12px] placeholder:text-white/30 focus:outline-none focus:border-pink-500/50" />
        </div>

        <div className="flex gap-1.5 flex-wrap">
          {(["all", "native", "npm"] as const).map(t => (
            <button key={t} onClick={() => setTypeFilter(t)} className={cn("px-2.5 py-1 rounded-full text-[10px] font-medium border transition-colors uppercase", typeFilter === t ? "bg-pink-600/30 border-pink-400/40 text-pink-300" : "bg-white/5 border-white/10 text-white/50 hover:text-white/80")}>
              {t}
            </button>
          ))}
        </div>

        <div className="flex gap-1.5 overflow-x-auto pb-1">
          <button onClick={() => setCategory("all")} className={cn("shrink-0 px-2.5 py-1 rounded-full text-[10px] border transition-colors", category === "all" ? "bg-pink-600/30 border-pink-400/40 text-pink-300" : "bg-white/5 border-white/10 text-white/50")}>All</button>
          {categories.slice(0, 8).map(cat => {
            const Icon = CATEGORY_ICONS[cat] ?? Package;
            return (
              <button key={cat} onClick={() => setCategory(cat)} className={cn("shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] border transition-colors whitespace-nowrap", category === cat ? "bg-pink-600/30 border-pink-400/40 text-pink-300" : "bg-white/5 border-white/10 text-white/50 hover:text-white/80")}>
                <Icon size={9} />{cat}
              </button>
            );
          })}
        </div>

        <div className="text-[11px] text-white/30">{filtered.length} plugins</div>

        <div className="space-y-2">
          {filtered.map(plugin => {
            const isAction = installing === plugin.name;
            return (
              <div key={plugin.name} className={cn("bg-[#161b22] border rounded-xl p-3 transition-all", plugin.isInstalled ? "border-green-400/20" : "border-white/[0.06]")}>
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-lg shrink-0">
                    {plugin.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[13px] font-medium truncate">{plugin.displayName}</span>
                      <span className={cn("text-[9px] px-1.5 py-0.5 rounded border shrink-0", plugin.type === "native" ? "bg-pink-500/15 text-pink-300 border-pink-400/25" : "bg-blue-500/15 text-blue-300 border-blue-400/25")}>{plugin.type}</span>
                      {plugin.isInstalled && <span className="text-[9px] bg-green-500/15 text-green-300 border border-green-400/20 px-1.5 py-0.5 rounded shrink-0">✓ installed</span>}
                    </div>
                    <p className="text-[11px] text-white/50 mt-0.5 line-clamp-2">{plugin.description}</p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <div className="flex gap-0.5">{renderStars(plugin.rating)}</div>
                      <span className="text-[9px] text-white/30">{plugin.rating.toFixed(1)}</span>
                      <span className="text-[9px] text-white/20">·</span>
                      <span className="text-[9px] text-white/30">{plugin.downloads.toLocaleString()} downloads</span>
                      {plugin.npmPackage && <span className="text-[9px] font-mono text-white/20">{plugin.npmPackage}</span>}
                    </div>
                  </div>
                  <div className="shrink-0">
                    {plugin.isInstalled ? (
                      <button onClick={() => uninstallPlugin(plugin.name)} disabled={isAction}
                        className="px-2.5 py-1.5 bg-red-500/10 border border-red-400/20 rounded-lg text-red-400 text-[11px] flex items-center gap-1 hover:bg-red-500/20 transition-colors disabled:opacity-50">
                        {isAction ? <Loader2 size={10} className="animate-spin" /> : <Trash2 size={10} />}
                      </button>
                    ) : (
                      <button onClick={() => installPlugin(plugin.name)} disabled={isAction}
                        className="px-2.5 py-1.5 bg-pink-600/20 border border-pink-400/30 rounded-lg text-pink-300 text-[11px] flex items-center gap-1 hover:bg-pink-600/30 transition-colors disabled:opacity-50">
                        {isAction ? <Loader2 size={10} className="animate-spin" /> : <Download size={10} />}
                        Get
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
