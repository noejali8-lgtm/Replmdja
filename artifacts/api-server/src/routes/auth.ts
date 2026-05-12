import { Router } from "express";
import bcrypt from "bcryptjs";
import { db, users } from "@workspace/db";
import { eq, or } from "drizzle-orm";

const router = Router();

declare module "express-session" {
  interface SessionData {
    userId?: number;
    username?: string;
  }
}

/* ─── helpers ──────────────────────────────────────── */
function sanitizeUser(u: typeof users.$inferSelect) {
  return {
    id: u.id,
    username: u.username,
    displayName: u.displayName,
    avatarUrl: u.avatarUrl,
    email: u.email,
    plan: u.plan,
    provider: u.provider,
    createdAt: u.createdAt,
  };
}

/* ─── Local register ────────────────────────────────── */
router.post("/register", async (req, res) => {
  const { username, password, email, displayName } = req.body ?? {};
  if (!username || !password) {
    res.status(400).json({ error: "username and password required" });
    return;
  }
  if (password.length < 6) {
    res.status(400).json({ error: "password must be at least 6 characters" });
    return;
  }
  try {
    const existing = await db.select().from(users).where(eq(users.username, username)).limit(1);
    if (existing.length > 0) {
      res.status(409).json({ error: "username already taken" });
      return;
    }
    const passwordHash = await bcrypt.hash(password, 12);
    const [user] = await db.insert(users).values({
      username,
      email: email || null,
      displayName: displayName || username,
      passwordHash,
      provider: "local",
    }).returning();
    req.session.userId   = user.id;
    req.session.username = user.username;
    res.status(201).json({ user: sanitizeUser(user) });
  } catch {
    res.status(500).json({ error: "Registration failed" });
  }
});

/* ─── Local login ───────────────────────────────────── */
router.post("/login", async (req, res) => {
  const { username, password } = req.body ?? {};
  if (!username || !password) {
    res.status(400).json({ error: "username and password required" });
    return;
  }
  try {
    const [user] = await db.select().from(users).where(eq(users.username, username)).limit(1);
    if (!user) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }
    req.session.userId   = user.id;
    req.session.username = user.username;
    res.json({ user: sanitizeUser(user) });
  } catch {
    res.status(500).json({ error: "Login failed" });
  }
});

/* ─── GitHub OAuth ──────────────────────────────────── */

router.get("/github", async (req, res) => {
  const clientId = process.env.GITHUB_CLIENT_ID;
  if (!clientId) {
    res.status(503).send("GitHub OAuth not configured. Add GITHUB_CLIENT_ID to your secrets.");
    return;
  }
  const redirectUri = encodeURIComponent(getCallbackUrl(req));
  const scope = encodeURIComponent("read:user user:email");
  res.redirect(`https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}&state=replit-ide`);
});

router.get("/github/callback", async (req, res) => {
  const { code } = req.query;
  const clientId     = process.env.GITHUB_CLIENT_ID;
  const clientSecret = process.env.GITHUB_CLIENT_SECRET;

  if (!clientId || !clientSecret || !code) {
    res.redirect("/login?error=oauth_failed");
    return;
  }

  try {
    // Exchange code for access token
    const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Accept": "application/json" },
      body: JSON.stringify({ client_id: clientId, client_secret: clientSecret, code }),
    });
    const tokenData = await tokenRes.json() as { access_token?: string; error?: string };
    if (!tokenData.access_token) {
      res.redirect("/login?error=no_token");
      return;
    }

    const token = tokenData.access_token;

    // Fetch user profile
    const profileRes = await fetch("https://api.github.com/user", {
      headers: { Authorization: `Bearer ${token}`, "User-Agent": "replit-ide" },
    });
    const profile = await profileRes.json() as {
      id: number; login: string; name?: string; email?: string; avatar_url?: string;
    };

    // Fetch email if not public
    let email = profile.email;
    if (!email) {
      const emailRes = await fetch("https://api.github.com/user/emails", {
        headers: { Authorization: `Bearer ${token}`, "User-Agent": "replit-ide" },
      });
      const emails = await emailRes.json() as Array<{ email: string; primary: boolean; verified: boolean }>;
      email = emails.find(e => e.primary && e.verified)?.email ?? emails[0]?.email ?? null;
    }

    const githubId = String(profile.id);

    // Find or create user
    let [existing] = await db.select().from(users).where(
      or(eq(users.githubId, githubId), ...(email ? [eq(users.email, email)] : []))
    ).limit(1);

    if (existing) {
      // Update token + avatar
      const [updated] = await db.update(users).set({
        githubId, githubToken: token,
        avatarUrl: profile.avatar_url ?? existing.avatarUrl,
        updatedAt: new Date(),
      }).where(eq(users.id, existing.id)).returning();
      existing = updated;
    } else {
      // Create new user from GitHub
      const baseUsername = profile.login.toLowerCase().replace(/[^a-z0-9_]/g, "_");
      let username = baseUsername;
      let suffix = 0;
      while (true) {
        const [taken] = await db.select({ id: users.id }).from(users).where(eq(users.username, username)).limit(1);
        if (!taken) break;
        username = `${baseUsername}${++suffix}`;
      }
      const [created] = await db.insert(users).values({
        username,
        email: email ?? null,
        displayName: profile.name ?? profile.login,
        passwordHash: "",
        avatarUrl: profile.avatar_url ?? null,
        githubId,
        githubToken: token,
        provider: "github",
        plan: "free",
      }).returning();
      existing = created;
    }

    req.session.userId   = existing.id;
    req.session.username = existing.username;

    // Redirect back to app
    const origin = process.env.REPLIT_DEV_DOMAIN
      ? `https://${process.env.REPLIT_DEV_DOMAIN}`
      : "http://localhost:5000";
    res.redirect(`${origin}/`);
  } catch (err) {
    console.error("GitHub OAuth error:", err);
    res.redirect("/login?error=oauth_error");
  }
});

function getCallbackUrl(req: import("express").Request): string {
  const devDomain = process.env.REPLIT_DEV_DOMAIN;
  if (devDomain) return `https://${devDomain}/api/auth/github/callback`;
  return `${req.protocol}://${req.get("host")}/api/auth/github/callback`;
}

/* ─── Profile update ───────────────────────────────── */
router.patch("/profile", async (req, res) => {
  if (!req.session.userId) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  const { displayName, email } = req.body ?? {};
  try {
    const updates: Record<string, unknown> = { updatedAt: new Date() };
    if (displayName !== undefined) updates.displayName = displayName;
    if (email !== undefined) updates.email = email || null;
    const [updated] = await db.update(users).set(updates).where(eq(users.id, req.session.userId)).returning();
    res.json({ user: sanitizeUser(updated) });
  } catch {
    res.status(500).json({ error: "Failed to update profile" });
  }
});

/* ─── Logout ─────────────────────────────────────────  */
router.post("/logout", (req, res) => {
  req.session.destroy(() => {
    res.clearCookie("sid");
    res.json({ ok: true });
  });
});

/* ─── Me ─────────────────────────────────────────────  */
router.get("/me", async (req, res) => {
  if (!req.session.userId) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  try {
    const [user] = await db.select().from(users).where(eq(users.id, req.session.userId)).limit(1);
    if (!user) { res.status(404).json({ error: "User not found" }); return; }
    res.json({ user: sanitizeUser(user) });
  } catch {
    res.status(500).json({ error: "Failed to fetch user" });
  }
});

export default router;
