import { Router } from "express";
import bcrypt from "bcryptjs";
import { db, users } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();

declare module "express-session" {
  interface SessionData {
    userId?: number;
    username?: string;
  }
}

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
    }).returning({ id: users.id, username: users.username, displayName: users.displayName });
    req.session.userId   = user.id;
    req.session.username = user.username;
    res.status(201).json({ user: { id: user.id, username: user.username, displayName: user.displayName } });
  } catch (err) {
    res.status(500).json({ error: "Registration failed" });
  }
});

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
    res.json({ user: { id: user.id, username: user.username, displayName: user.displayName, avatarUrl: user.avatarUrl } });
  } catch {
    res.status(500).json({ error: "Login failed" });
  }
});

router.patch("/profile", async (req, res) => {
  if (!req.session.userId) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  const { displayName, email } = req.body ?? {};
  try {
    const updates: Partial<typeof users.$inferInsert> = {};
    if (displayName !== undefined) updates.displayName = displayName;
    if (email !== undefined) updates.email = email || null;
    await db.update(users).set(updates).where(eq(users.id, req.session.userId));
    const [updated] = await db.select({
      id: users.id, username: users.username,
      displayName: users.displayName, avatarUrl: users.avatarUrl,
      email: users.email, createdAt: users.createdAt,
    }).from(users).where(eq(users.id, req.session.userId)).limit(1);
    res.json({ user: updated });
  } catch {
    res.status(500).json({ error: "Failed to update profile" });
  }
});

router.post("/logout", (req, res) => {
  req.session.destroy(() => {
    res.clearCookie("sid");
    res.json({ ok: true });
  });
});

router.get("/me", async (req, res) => {
  if (!req.session.userId) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  try {
    const [user] = await db.select({
      id: users.id, username: users.username,
      displayName: users.displayName, avatarUrl: users.avatarUrl,
      email: users.email, createdAt: users.createdAt,
    }).from(users).where(eq(users.id, req.session.userId)).limit(1);
    if (!user) { res.status(404).json({ error: "User not found" }); return; }
    res.json({ user });
  } catch {
    res.status(500).json({ error: "Failed to fetch user" });
  }
});

export default router;
