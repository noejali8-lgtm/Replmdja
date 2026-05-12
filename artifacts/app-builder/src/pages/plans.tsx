import { useState } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Check, Zap, Shield, Cpu, Globe, Users, Database,
  Crown, Star, Sparkles, ChevronRight, HelpCircle, X
} from "lucide-react";
import { cn } from "@/lib/utils";

type BillingCycle = "monthly" | "yearly";

interface Plan {
  id: string;
  name: string;
  desc: string;
  monthlyPrice: number;
  yearlyPrice: number;
  icon: React.ElementType;
  iconColor: string;
  iconBg: string;
  border: string;
  glow?: string;
  badge?: string;
  badgeColor?: string;
  popular?: boolean;
  features: string[];
  limits: { label: string; value: string }[];
  cta: string;
  ctaClass: string;
}

const PLANS: Plan[] = [
  {
    id: "free",
    name: "Free",
    desc: "For learners and hobby projects",
    monthlyPrice: 0,
    yearlyPrice: 0,
    icon: Star,
    iconColor: "text-white/60",
    iconBg: "bg-white/8",
    border: "border-white/[0.08]",
    features: [
      "3 public Repls",
      "0.5 vCPU · 512MB RAM",
      "Community support",
      "Basic AI assistance",
      "Replit DB (512MB)",
      "1 deployment",
    ],
    limits: [
      { label: "Compute", value: "0.5 vCPU" },
      { label: "RAM", value: "512 MB" },
      { label: "Storage", value: "1 GB" },
      { label: "Deployments", value: "1" },
    ],
    cta: "Current plan",
    ctaClass: "bg-white/6 border border-white/10 text-white/50 cursor-default",
  },
  {
    id: "core",
    name: "Replit Core",
    desc: "For developers who build seriously",
    monthlyPrice: 25,
    yearlyPrice: 20,
    icon: Crown,
    iconColor: "text-orange-400",
    iconBg: "bg-orange-500/15",
    border: "border-orange-500/30",
    glow: "shadow-[0_0_40px_rgba(249,115,22,0.08)]",
    badge: "Most Popular",
    badgeColor: "bg-orange-500/20 text-orange-400 border-orange-400/30",
    popular: true,
    features: [
      "Unlimited private Repls",
      "4 vCPU · 4GB RAM",
      "Priority AI agent",
      "Advanced deployments",
      "Custom domains",
      "Replit DB (5GB)",
      "Dedicated support",
      "1000 Cycles/month",
      "Replit Agent (full access)",
      "GitHub sync",
    ],
    limits: [
      { label: "Compute", value: "4 vCPU" },
      { label: "RAM", value: "4 GB" },
      { label: "Storage", value: "50 GB" },
      { label: "Deployments", value: "Unlimited" },
    ],
    cta: "Upgrade to Core",
    ctaClass: "bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold hover:brightness-110 active:scale-[0.98]",
  },
  {
    id: "teams",
    name: "Teams",
    desc: "For collaborative development teams",
    monthlyPrice: 40,
    yearlyPrice: 35,
    icon: Users,
    iconColor: "text-blue-400",
    iconBg: "bg-blue-500/15",
    border: "border-blue-500/25",
    badge: "Per seat",
    badgeColor: "bg-blue-500/20 text-blue-400 border-blue-400/30",
    features: [
      "Everything in Core",
      "Multiplayer editing",
      "Team projects & orgs",
      "SSO / SAML",
      "Advanced permissions",
      "SLA & dedicated support",
      "5000 Cycles/seat",
      "Audit logs",
      "Custom compute",
      "On-prem option",
    ],
    limits: [
      { label: "Compute", value: "8 vCPU" },
      { label: "RAM", value: "16 GB" },
      { label: "Storage", value: "500 GB" },
      { label: "Deployments", value: "Unlimited" },
    ],
    cta: "Contact Sales",
    ctaClass: "bg-blue-600 text-white hover:bg-blue-500 active:scale-[0.98]",
  },
];

interface CyclePackage {
  id: string;
  cycles: number;
  price: number;
  bonus?: number;
  popular?: boolean;
}

const CYCLE_PACKAGES: CyclePackage[] = [
  { id: "500",  cycles: 500,  price: 5 },
  { id: "1000", cycles: 1000, price: 10, popular: true },
  { id: "2000", cycles: 2000, price: 18, bonus: 200 },
  { id: "5000", cycles: 5000, price: 40, bonus: 1000 },
];

const CYCLE_USES = [
  { icon: "⚡", label: "AI Agent Usage", desc: "Run AI agents beyond your plan's allotment" },
  { icon: "🚀", label: "Compute Boosts", desc: "Scale up CPU/RAM for intensive workloads" },
  { icon: "🌐", label: "Deployments", desc: "Deploy additional repls and custom domains" },
  { icon: "🔒", label: "Private Repls", desc: "Create extra private repls beyond your quota" },
];

export default function Plans() {
  const [, setLocation] = useLocation();
  const [billing, setBilling] = useState<BillingCycle>("yearly");
  const [selectedPkg, setSelectedPkg] = useState("1000");
  const [showCycleInfo, setShowCycleInfo] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex flex-col min-h-full pb-24 max-w-[480px] mx-auto w-full"
    >
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-12 pb-4">
        <button
          onClick={() => setLocation(-1 as any)}
          className="w-8 h-8 flex items-center justify-center text-white/50 hover:text-white transition-colors rounded-xl hover:bg-white/6"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1">
          <h1 className="text-[17px] font-bold text-white">Plans & Pricing</h1>
          <p className="text-[11px] text-white/35">Choose the right plan for you</p>
        </div>
      </div>

      {/* Billing toggle */}
      <div className="flex items-center justify-center mb-5 px-4">
        <div className="flex items-center bg-white/5 border border-white/10 rounded-full p-1 gap-1">
          <button
            onClick={() => setBilling("monthly")}
            className={cn(
              "px-4 py-1.5 rounded-full text-[12px] font-semibold transition-all",
              billing === "monthly" ? "bg-white text-black" : "text-white/50 hover:text-white"
            )}
          >
            Monthly
          </button>
          <button
            onClick={() => setBilling("yearly")}
            className={cn(
              "flex items-center gap-1.5 px-4 py-1.5 rounded-full text-[12px] font-semibold transition-all",
              billing === "yearly" ? "bg-white text-black" : "text-white/50 hover:text-white"
            )}
          >
            Yearly
            <span className={cn(
              "text-[9px] font-bold px-1.5 py-0.5 rounded-full",
              billing === "yearly" ? "bg-green-500/30 text-green-700" : "bg-green-500/20 text-green-400"
            )}>
              Save 20%
            </span>
          </button>
        </div>
      </div>

      {/* Plan cards */}
      <div className="px-4 space-y-3 mb-6">
        {PLANS.map((plan, i) => {
          const Icon = plan.icon;
          const price = billing === "yearly" ? plan.yearlyPrice : plan.monthlyPrice;

          return (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }}
              className={cn(
                "rounded-2xl border p-4 transition-all relative overflow-hidden",
                plan.border,
                plan.glow ?? "",
                plan.popular ? "bg-[#1a1412]" : "bg-[#151515]"
              )}
            >
              {plan.popular && (
                <div className="absolute inset-0 pointer-events-none">
                  <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-orange-500/50 to-transparent" />
                </div>
              )}

              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center", plan.iconBg)}>
                    <Icon size={17} className={plan.iconColor} />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h3 className="text-[14px] font-bold text-white">{plan.name}</h3>
                      {plan.badge && (
                        <span className={cn("text-[9px] font-bold px-1.5 py-0.5 rounded-full border", plan.badgeColor)}>
                          {plan.badge}
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-white/35">{plan.desc}</p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-[20px] font-bold text-white leading-none">
                    {price === 0 ? "Free" : `$${price}`}
                  </p>
                  {price > 0 && (
                    <p className="text-[10px] text-white/30">/month</p>
                  )}
                </div>
              </div>

              {/* Limits */}
              <div className="grid grid-cols-4 gap-1.5 mb-3">
                {plan.limits.map(limit => (
                  <div key={limit.label} className="flex flex-col items-center gap-0.5 px-1.5 py-2 rounded-xl bg-white/[0.03] border border-white/[0.05]">
                    <span className="text-[11px] font-bold text-white">{limit.value}</span>
                    <span className="text-[9px] text-white/30">{limit.label}</span>
                  </div>
                ))}
              </div>

              {/* Features */}
              <div className="space-y-1.5 mb-3">
                {plan.features.map(f => (
                  <div key={f} className="flex items-center gap-2">
                    <div className={cn("w-3.5 h-3.5 rounded-full flex items-center justify-center shrink-0", plan.iconBg)}>
                      <Check size={8} className={plan.iconColor} />
                    </div>
                    <span className="text-[12px] text-white/60">{f}</span>
                  </div>
                ))}
              </div>

              <button className={cn("w-full py-2.5 rounded-xl text-[13px] transition-all", plan.ctaClass)}>
                {plan.cta}
              </button>
            </motion.div>
          );
        })}
      </div>

      {/* Cycles section */}
      <div className="px-4 mb-6">
        <div className="rounded-2xl border border-white/[0.08] overflow-hidden">
          <div
            className="flex items-center justify-between px-4 py-3.5 bg-[#151515] cursor-pointer"
            onClick={() => setShowCycleInfo(v => !v)}
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-purple-500/15 border border-purple-400/25 flex items-center justify-center">
                <Zap size={15} className="text-purple-400" />
              </div>
              <div>
                <h3 className="text-[13px] font-bold text-white">Replit Cycles</h3>
                <p className="text-[10px] text-white/35">Virtual currency for extra compute & features</p>
              </div>
            </div>
            <ChevronRight size={14} className={cn("text-white/25 transition-transform", showCycleInfo && "rotate-90")} />
          </div>

          <AnimatePresence>
            {showCycleInfo && (
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: "auto" }}
                exit={{ height: 0 }}
                className="overflow-hidden"
              >
                <div className="px-4 pb-4 pt-0 bg-[#141414] border-t border-white/[0.06]">
                  {/* What are Cycles */}
                  <p className="text-[12px] text-white/45 py-3 leading-relaxed">
                    Cycles are Replit's virtual currency. Use them to access extra compute, AI features, and more — on top of your plan.
                  </p>

                  {/* Use cases */}
                  <div className="grid grid-cols-2 gap-1.5 mb-4">
                    {CYCLE_USES.map(use => (
                      <div key={use.label} className="flex items-start gap-2 p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                        <span className="text-base">{use.icon}</span>
                        <div>
                          <p className="text-[11px] font-semibold text-white">{use.label}</p>
                          <p className="text-[9px] text-white/35 mt-0.5 leading-relaxed">{use.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Buy packages */}
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-white/30 mb-2">Buy Cycles</p>
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    {CYCLE_PACKAGES.map(pkg => (
                      <button
                        key={pkg.id}
                        onClick={() => setSelectedPkg(pkg.id)}
                        className={cn(
                          "relative px-3 py-3 rounded-xl border text-left transition-all",
                          selectedPkg === pkg.id
                            ? "bg-purple-500/15 border-purple-400/30"
                            : "bg-white/[0.03] border-white/[0.06] hover:bg-white/[0.06]"
                        )}
                      >
                        {pkg.popular && (
                          <span className="absolute top-1.5 right-1.5 text-[8px] font-bold px-1 py-0.5 rounded-full bg-purple-500/20 border border-purple-400/30 text-purple-400">
                            Popular
                          </span>
                        )}
                        <p className="text-[13px] font-bold text-white">{pkg.cycles.toLocaleString()} 🪙</p>
                        <p className="text-[12px] text-white/50">${pkg.price}</p>
                        {pkg.bonus && (
                          <p className="text-[10px] text-green-400 mt-0.5">+{pkg.bonus} bonus</p>
                        )}
                      </button>
                    ))}
                  </div>

                  <button className="w-full py-2.5 rounded-xl text-[13px] font-semibold bg-purple-600 text-white hover:bg-purple-500 active:scale-[0.98] transition-all">
                    Buy {CYCLE_PACKAGES.find(p => p.id === selectedPkg)?.cycles.toLocaleString()} Cycles for ${CYCLE_PACKAGES.find(p => p.id === selectedPkg)?.price}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* FAQ */}
      <div className="px-4 pb-4">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-white/30 mb-3">FAQ</p>
        <div className="space-y-2">
          {[
            { q: "Can I cancel anytime?", a: "Yes — cancel anytime with no penalties. Your plan stays active until the end of the billing period." },
            { q: "What happens to my repls if I downgrade?", a: "Public repls stay public. Private repls become read-only until you upgrade or make them public." },
            { q: "Do unused Cycles roll over?", a: "Yes, Cycles never expire as long as your account is active." },
            { q: "Is there a student discount?", a: "Yes! Verify your .edu email for 50% off Replit Core." },
          ].map((faq, i) => (
            <details key={i} className="group px-3.5 py-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
              <summary className="flex items-center justify-between cursor-pointer text-[12px] font-semibold text-white/70 list-none">
                {faq.q}
                <ChevronRight size={13} className="text-white/25 transition-transform group-open:rotate-90 shrink-0 ml-2" />
              </summary>
              <p className="text-[11px] text-white/40 mt-2 leading-relaxed">{faq.a}</p>
            </details>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
