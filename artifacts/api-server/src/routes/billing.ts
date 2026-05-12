import { Router } from "express";
import { db, users, subscriptions } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();

const PLANS = {
  free: {
    id: "free",
    name: "Starter",
    price: 0,
    priceId: null,
    features: [
      "3 projects",
      "512 MB RAM per project",
      "Community support",
      "Public projects only",
    ],
    projectLimit: 3,
    ramMb: 512,
  },
  starter: {
    id: "starter",
    name: "Hacker",
    price: 7,
    priceId: process.env.STRIPE_PRICE_STARTER ?? null,
    features: [
      "10 projects",
      "2 GB RAM per project",
      "Always-on projects",
      "Private projects",
      "Email support",
    ],
    projectLimit: 10,
    ramMb: 2048,
  },
  pro: {
    id: "pro",
    name: "Pro",
    price: 20,
    priceId: process.env.STRIPE_PRICE_PRO ?? null,
    features: [
      "Unlimited projects",
      "8 GB RAM per project",
      "Custom domains",
      "Priority support",
      "AI credits included",
      "Advanced deployments",
    ],
    projectLimit: -1,
    ramMb: 8192,
  },
  team: {
    id: "team",
    name: "Teams",
    price: 40,
    priceId: process.env.STRIPE_PRICE_TEAM ?? null,
    features: [
      "Everything in Pro",
      "Team collaboration",
      "SSO / SAML",
      "Audit logs",
      "Dedicated support",
      "SLA guarantee",
    ],
    projectLimit: -1,
    ramMb: 16384,
  },
};

/* ── List available plans ── */
router.get("/plans", (_req, res) => {
  res.json({ plans: Object.values(PLANS) });
});

/* ── Get current user subscription ── */
router.get("/subscription", async (req, res) => {
  if (!req.session?.userId) {
    res.json({ plan: "free", status: "active", subscription: null });
    return;
  }
  try {
    const [sub] = await db.select().from(subscriptions)
      .where(eq(subscriptions.userId, req.session.userId)).limit(1);
    const [user] = await db.select({ plan: users.plan }).from(users)
      .where(eq(users.id, req.session.userId)).limit(1);

    res.json({
      plan: user?.plan ?? "free",
      status: sub?.status ?? "active",
      subscription: sub ?? null,
      planDetails: PLANS[user?.plan as keyof typeof PLANS] ?? PLANS.free,
    });
  } catch {
    res.status(500).json({ error: "Failed to fetch subscription" });
  }
});

/* ── Create Stripe checkout session ── */
router.post("/checkout", async (req, res) => {
  if (!req.session?.userId) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  const { plan } = req.body ?? {};
  const planData = PLANS[plan as keyof typeof PLANS];
  if (!planData || !planData.priceId) {
    res.status(400).json({ error: "Invalid plan or Stripe not configured" });
    return;
  }

  // Check if Stripe is configured
  if (!process.env.STRIPE_SECRET_KEY) {
    res.status(503).json({ error: "Stripe is not configured. Add STRIPE_SECRET_KEY to your project secrets." });
    return;
  }

  try {
    const { default: Stripe } = await import("stripe");
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2025-04-30.basil" });

    const [user] = await db.select().from(users).where(eq(users.id, req.session.userId)).limit(1);
    if (!user) { res.status(404).json({ error: "User not found" }); return; }

    // Get or create Stripe customer
    let [sub] = await db.select().from(subscriptions).where(eq(subscriptions.userId, user.id)).limit(1);
    let customerId = sub?.stripeCustomerId;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email ?? undefined,
        name: user.displayName ?? user.username,
        metadata: { userId: String(user.id) },
      });
      customerId = customer.id;
    }

    const origin = process.env.REPLIT_DEV_DOMAIN
      ? `https://${process.env.REPLIT_DEV_DOMAIN}`
      : "http://localhost:5000";

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ["card"],
      line_items: [{ price: planData.priceId, quantity: 1 }],
      mode: "subscription",
      success_url: `${origin}/billing?success=1`,
      cancel_url:  `${origin}/billing?canceled=1`,
      metadata: { userId: String(user.id), plan },
    });

    res.json({ url: session.url });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

/* ── Stripe webhook ── */
router.post("/webhook", async (req, res) => {
  const sig = req.headers["stripe-signature"] as string;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret || !process.env.STRIPE_SECRET_KEY) {
    res.json({ ok: true });
    return;
  }

  try {
    const { default: Stripe } = await import("stripe");
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2025-04-30.basil" });
    const event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as { metadata?: { userId?: string; plan?: string }; customer?: string; subscription?: string };
      const userId = Number(session.metadata?.userId);
      const plan   = session.metadata?.plan ?? "free";
      if (userId) {
        await db.update(users).set({ plan, updatedAt: new Date() }).where(eq(users.id, userId));
        const [existing] = await db.select().from(subscriptions).where(eq(subscriptions.userId, userId)).limit(1);
        if (existing) {
          await db.update(subscriptions).set({
            plan, status: "active",
            stripeCustomerId: String(session.customer ?? ""),
            stripeSubId: String(session.subscription ?? ""),
            updatedAt: new Date(),
          }).where(eq(subscriptions.userId, userId));
        } else {
          await db.insert(subscriptions).values({
            userId, plan, status: "active",
            stripeCustomerId: String(session.customer ?? ""),
            stripeSubId: String(session.subscription ?? ""),
          });
        }
      }
    }

    if (event.type === "customer.subscription.deleted") {
      const sub = event.data.object as { metadata?: { userId?: string } };
      const userId = Number(sub.metadata?.userId);
      if (userId) {
        await db.update(users).set({ plan: "free", updatedAt: new Date() }).where(eq(users.id, userId));
        await db.update(subscriptions).set({ plan: "free", status: "canceled", updatedAt: new Date() })
          .where(eq(subscriptions.userId, userId));
      }
    }

    res.json({ ok: true });
  } catch (err) {
    res.status(400).json({ error: String(err) });
  }
});

/* ── Cancel subscription ── */
router.post("/cancel", async (req, res) => {
  if (!req.session?.userId) { res.status(401).json({ error: "Not authenticated" }); return; }

  if (!process.env.STRIPE_SECRET_KEY) {
    res.status(503).json({ error: "Stripe not configured" });
    return;
  }

  try {
    const { default: Stripe } = await import("stripe");
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2025-04-30.basil" });

    const [sub] = await db.select().from(subscriptions)
      .where(eq(subscriptions.userId, req.session.userId)).limit(1);

    if (!sub?.stripeSubId) { res.status(404).json({ error: "No active subscription" }); return; }

    await stripe.subscriptions.update(sub.stripeSubId, { cancel_at_period_end: true });
    await db.update(subscriptions).set({ cancelAtPeriodEnd: true, updatedAt: new Date() })
      .where(eq(subscriptions.userId, req.session.userId));

    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

export default router;
