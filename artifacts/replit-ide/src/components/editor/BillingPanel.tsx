import { useState, useEffect } from "react";
import { CreditCard, Check, Zap, Loader2, X, Star, Users, Shield } from "lucide-react";

interface Plan {
  id: string;
  name: string;
  price: number;
  features: string[];
  projectLimit: number;
  ramMb: number;
}

interface Subscription {
  plan: string;
  status: string;
  planDetails: Plan;
}

const PLAN_ICONS: Record<string, React.ReactNode> = {
  free:    <Zap className="h-4 w-4 text-[#8b949e]" />,
  starter: <Star className="h-4 w-4 text-[#f2cc60]" />,
  pro:     <Shield className="h-4 w-4 text-[#58a6ff]" />,
  team:    <Users className="h-4 w-4 text-[#a371f7]" />,
};

const PLAN_COLORS: Record<string, string> = {
  free:    "border-[#30363d]",
  starter: "border-[#f2cc60]/40",
  pro:     "border-[#58a6ff]/40",
  team:    "border-[#a371f7]/40",
};

const PLAN_BUTTON_COLORS: Record<string, string> = {
  free:    "bg-[#21262d] hover:bg-[#30363d] text-[#e6edf3]",
  starter: "bg-[#f2cc60]/20 hover:bg-[#f2cc60]/30 text-[#f2cc60] border border-[#f2cc60]/30",
  pro:     "bg-[#58a6ff]/20 hover:bg-[#58a6ff]/30 text-[#58a6ff] border border-[#58a6ff]/30",
  team:    "bg-[#a371f7]/20 hover:bg-[#a371f7]/30 text-[#a371f7] border border-[#a371f7]/30",
};

export function BillingPanel() {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkingOut, setCheckingOut] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([
      fetch("/api/billing/subscription", { credentials: "include" }).then(r => r.json()),
      fetch("/api/billing/plans", { credentials: "include" }).then(r => r.json()),
    ]).then(([sub, plansData]) => {
      setSubscription(sub as Subscription);
      setPlans((plansData as { plans: Plan[] }).plans ?? []);
    }).catch(() => setError("Failed to load billing info"))
      .finally(() => setLoading(false));
  }, []);

  const checkout = async (planId: string) => {
    if (planId === "free") return;
    setCheckingOut(planId);
    setError("");
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ plan: planId }),
      });
      const data = await res.json() as { url?: string; error?: string };
      if (data.url) {
        window.open(data.url, "_blank");
      } else {
        setError(data.error ?? "Checkout failed");
      }
    } catch (e) {
      setError(String(e));
    } finally {
      setCheckingOut(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full bg-[#0d1117]">
        <Loader2 className="h-5 w-5 animate-spin text-[#484f58]" />
      </div>
    );
  }

  const currentPlan = subscription?.plan ?? "free";

  return (
    <div className="flex flex-col h-full bg-[#0d1117] text-[#e6edf3] overflow-y-auto">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-[#21262d] bg-[#161b22] shrink-0">
        <CreditCard className="h-3.5 w-3.5 text-[#58a6ff]" />
        <span className="text-[10px] font-semibold text-[#8b949e] uppercase tracking-widest flex-1">Billing & Plans</span>
      </div>

      {/* Current plan badge */}
      <div className="mx-3 mt-3 mb-2 p-3 rounded-xl bg-[#161b22] border border-[#21262d]">
        <div className="flex items-center gap-2 mb-1">
          {PLAN_ICONS[currentPlan]}
          <p className="text-sm font-semibold text-[#e6edf3]">
            {subscription?.planDetails?.name ?? "Starter"}
          </p>
          <span className={`ml-auto text-[9px] px-2 py-0.5 rounded-full font-medium ${
            subscription?.status === "active"
              ? "bg-[#238636]/20 text-[#3fb950] border border-[#238636]/30"
              : "bg-[#f85149]/20 text-[#f85149] border border-[#f85149]/30"
          }`}>
            {subscription?.status ?? "active"}
          </span>
        </div>
        <p className="text-[10px] text-[#484f58]">
          {subscription?.planDetails?.projectLimit === -1
            ? "Unlimited projects"
            : `Up to ${subscription?.planDetails?.projectLimit ?? 3} projects`}
          {" · "}
          {((subscription?.planDetails?.ramMb ?? 512) / 1024).toFixed(1).replace(".0", "")} GB RAM
        </p>
      </div>

      {/* Error */}
      {error && (
        <div className="mx-3 mb-2 px-3 py-2 rounded-lg bg-[#f85149]/10 border border-[#f85149]/20 flex items-start gap-2">
          <span className="text-[10px] text-[#f85149] flex-1">{error}</span>
          <button onClick={() => setError("")}><X className="h-3 w-3 text-[#f85149]" /></button>
        </div>
      )}

      {/* Plans */}
      <div className="p-3 space-y-2">
        <p className="text-[10px] font-semibold text-[#8b949e] uppercase tracking-widest mb-3">Available Plans</p>
        {plans.map(plan => {
          const isCurrent = plan.id === currentPlan;
          return (
            <div key={plan.id}
              className={`rounded-xl border bg-[#161b22] overflow-hidden transition-colors ${
                isCurrent ? PLAN_COLORS[plan.id] + " ring-1 ring-offset-1 ring-offset-[#0d1117] ring-" + PLAN_COLORS[plan.id].replace("border-", "") : "border-[#21262d]"
              }`}>
              <div className="p-3">
                <div className="flex items-center gap-2 mb-2">
                  {PLAN_ICONS[plan.id]}
                  <span className="text-sm font-semibold text-[#e6edf3]">{plan.name}</span>
                  {isCurrent && (
                    <span className="ml-auto text-[9px] bg-[#238636]/20 text-[#3fb950] border border-[#238636]/30 px-2 py-0.5 rounded-full">
                      Current
                    </span>
                  )}
                  {!isCurrent && (
                    <span className="ml-auto text-sm font-bold text-[#e6edf3]">
                      {plan.price === 0 ? "Free" : `$${plan.price}/mo`}
                    </span>
                  )}
                </div>

                <ul className="space-y-1 mb-3">
                  {plan.features.map(f => (
                    <li key={f} className="flex items-start gap-1.5">
                      <Check className="h-3 w-3 text-[#3fb950] mt-0.5 shrink-0" />
                      <span className="text-[10px] text-[#8b949e]">{f}</span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => !isCurrent && checkout(plan.id)}
                  disabled={isCurrent || checkingOut !== null || plan.id === "free"}
                  className={`w-full py-1.5 rounded-lg text-[11px] font-medium transition-colors flex items-center justify-center gap-1.5 ${
                    isCurrent
                      ? "bg-[#21262d] text-[#484f58] cursor-default"
                      : plan.id === "free"
                        ? "bg-[#21262d] text-[#484f58] cursor-default"
                        : PLAN_BUTTON_COLORS[plan.id]
                  } disabled:opacity-60`}>
                  {checkingOut === plan.id
                    ? <><Loader2 className="h-3 w-3 animate-spin" /> Opening checkout…</>
                    : isCurrent
                      ? "Current plan"
                      : plan.id === "free"
                        ? "Free forever"
                        : `Upgrade to ${plan.name}`}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Stripe note */}
      <div className="mx-3 mb-4 px-3 py-2 rounded-lg bg-[#1c2128] border border-[#21262d]">
        <p className="text-[9px] text-[#484f58] leading-relaxed">
          Payments are securely processed via Stripe. Add <code className="text-[#58a6ff]">STRIPE_SECRET_KEY</code> to your project secrets to enable payments.
        </p>
      </div>
    </div>
  );
}
