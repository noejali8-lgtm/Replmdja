import { Router } from "express";
import { db, projects } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { pgTable, serial, integer, text, timestamp } from "drizzle-orm/pg-core";
import { createId } from "@paralleldrive/cuid2";

const router = Router();

/* ─── In-memory store (replace with DB table in production) ─── */
const secretsStore = new Map<number, Map<string, string>>();

function getProjectSecrets(projectId: number): Map<string, string> {
  if (!secretsStore.has(projectId)) {
    secretsStore.set(projectId, new Map());
  }
  return secretsStore.get(projectId)!;
}

/* ── Auth guard ── */
function requireProject(projectId: number) {
  return db.select().from(projects).where(eq(projects.id, projectId)).limit(1);
}

/* ── List secrets (keys only, not values) ── */
router.get("/:id/secrets", async (req, res) => {
  const id = Number(req.params.id);
  const [p] = await requireProject(id);
  if (!p) { res.status(404).json({ error: "Not found" }); return; }

  const secrets = getProjectSecrets(id);
  const keys = Array.from(secrets.keys()).map(key => ({
    key,
    hasValue: secrets.get(key) !== "",
    preview: (secrets.get(key) ?? "").slice(0, 3) + "***",
  }));
  res.json({ secrets: keys });
});

/* ── Get secret value (for editing) ── */
router.get("/:id/secrets/:key", async (req, res) => {
  const id = Number(req.params.id);
  const [p] = await requireProject(id);
  if (!p) { res.status(404).json({ error: "Not found" }); return; }

  const secrets = getProjectSecrets(id);
  const value = secrets.get(req.params.key);
  if (value === undefined) { res.status(404).json({ error: "Secret not found" }); return; }
  res.json({ key: req.params.key, value });
});

/* ── Create / Update secret ── */
router.put("/:id/secrets/:key", async (req, res) => {
  const id = Number(req.params.id);
  const [p] = await requireProject(id);
  if (!p) { res.status(404).json({ error: "Not found" }); return; }

  const { value = "" } = req.body ?? {};
  const key = req.params.key.toUpperCase().replace(/[^A-Z0-9_]/g, "_");
  if (!key) { res.status(400).json({ error: "Invalid key" }); return; }

  const secrets = getProjectSecrets(id);
  secrets.set(key, String(value));
  res.json({ ok: true, key });
});

/* ── Delete secret ── */
router.delete("/:id/secrets/:key", async (req, res) => {
  const id = Number(req.params.id);
  const [p] = await requireProject(id);
  if (!p) { res.status(404).json({ error: "Not found" }); return; }

  const secrets = getProjectSecrets(id);
  secrets.delete(req.params.key);
  res.json({ ok: true });
});

/* ── Export secrets as env object (used internally by run endpoint) ── */
export function getProjectEnv(projectId: number): Record<string, string> {
  const secrets = secretsStore.get(projectId) ?? new Map();
  return Object.fromEntries(secrets.entries());
}

export default router;
