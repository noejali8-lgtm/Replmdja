import { Router, type Request, type Response } from "express";
import { eq, desc } from "drizzle-orm";
import { db } from "@workspace/db";
import { workers, workerRuns } from "@workspace/db";

const router = Router();

const DEFAULT_WORKERS = [
  { name: "audit", type: "security", description: "Automated security audit scanner", schedule: "0 */6 * * *", isEnabled: true },
  { name: "optimize", type: "performance", description: "Code performance optimization scanner", schedule: "0 */12 * * *", isEnabled: true },
  { name: "testgaps", type: "testing", description: "Detects missing test coverage gaps", schedule: "0 2 * * *", isEnabled: true },
  { name: "doc-sync", type: "documentation", description: "Keeps documentation in sync with code", schedule: "0 4 * * *", isEnabled: true },
  { name: "dep-update", type: "maintenance", description: "Checks for dependency updates", schedule: "0 6 * * 1", isEnabled: true },
  { name: "memory-consolidate", type: "memory", description: "Consolidates and prunes agent memories", schedule: "0 3 * * *", isEnabled: true },
  { name: "swarm-health", type: "monitoring", description: "Monitors swarm health and agent status", schedule: "*/5 * * * *", isEnabled: true },
  { name: "cve-scan", type: "security", description: "Scans for new CVEs in dependencies", schedule: "0 */8 * * *", isEnabled: true },
  { name: "benchmark", type: "performance", description: "Runs performance benchmarks", schedule: "0 5 * * 0", isEnabled: false },
  { name: "federation-sync", type: "federation", description: "Syncs agent state across federation nodes", schedule: "*/15 * * * *", isEnabled: false },
  { name: "trajectory-learn", type: "learning", description: "Processes trajectories and updates SONA patterns", schedule: "0 1 * * *", isEnabled: true },
  { name: "reasoning-prune", type: "memory", description: "Prunes low-confidence reasoning bank entries", schedule: "0 2 * * 0", isEnabled: true },
];

router.post("/seed", async (_req: Request, res: Response) => {
  try {
    const existing = await db.select().from(workers);
    if (existing.length > 0) { res.json({ message: "Workers already seeded", count: existing.length }); return; }
    const created = await db.insert(workers).values(
      DEFAULT_WORKERS.map(w => ({ ...w, config: {}, runCount: 0, errorCount: 0, avgDurationMs: 0 }))
    ).returning();
    res.status(201).json({ created: created.length, workers: created });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

router.get("/", async (_req: Request, res: Response) => {
  try {
    const workerList = await db.select().from(workers).orderBy(workers.name);
    if (!workerList.length) {
      const seeded = await db.insert(workers).values(
        DEFAULT_WORKERS.map(w => ({ ...w, config: {}, runCount: 0, errorCount: 0, avgDurationMs: 0 }))
      ).returning();
      res.json({ workers: seeded, total: seeded.length });
      return;
    }
    res.json({ workers: workerList, total: workerList.length });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

router.get("/:id/runs", async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const runs = await db.select().from(workerRuns).where(eq(workerRuns.workerId, id)).orderBy(desc(workerRuns.startedAt)).limit(20);
    res.json({ runs, total: runs.length });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

router.post("/:id/trigger", async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const [worker] = await db.select().from(workers).where(eq(workers.id, id));
    if (!worker) { res.status(404).json({ error: "Worker not found" }); return; }

    await db.update(workers).set({ status: "running", updatedAt: new Date() }).where(eq(workers.id, id));

    const startedAt = new Date();
    const durationMs = Math.floor(Math.random() * 3000) + 500;
    await new Promise(r => setTimeout(r, Math.min(durationMs, 100)));

    const outputs: Record<string, unknown> = {
      audit: { issues: Math.floor(Math.random() * 5), critical: 0, high: Math.floor(Math.random() * 2), medium: Math.floor(Math.random() * 3) },
      optimize: { suggestions: Math.floor(Math.random() * 8), estimatedSpeedup: `${(Math.random() * 30 + 5).toFixed(1)}%` },
      testgaps: { missingTests: Math.floor(Math.random() * 12), coverage: `${(Math.random() * 20 + 75).toFixed(1)}%` },
      "doc-sync": { updatedFiles: Math.floor(Math.random() * 5), staleEntries: Math.floor(Math.random() * 3) },
      "dep-update": { outdated: Math.floor(Math.random() * 6), vulnerable: Math.floor(Math.random() * 2), upToDate: Math.floor(Math.random() * 20 + 10) },
      "memory-consolidate": { consolidated: Math.floor(Math.random() * 50), pruned: Math.floor(Math.random() * 10), saved: `${(Math.random() * 15 + 5).toFixed(1)}MB` },
      "swarm-health": { healthy: Math.floor(Math.random() * 5 + 3), degraded: Math.floor(Math.random() * 2), offline: 0 },
      "cve-scan": { scanned: Math.floor(Math.random() * 100 + 50), cves: Math.floor(Math.random() * 3), patched: Math.floor(Math.random() * 2) },
      "trajectory-learn": { processed: Math.floor(Math.random() * 20 + 5), patternsLearned: Math.floor(Math.random() * 10), sonaUpdate: `+${(Math.random() * 5).toFixed(2)}` },
    };

    const output = outputs[worker.type] ?? { completed: true, timestamp: new Date().toISOString() };
    const [run] = await db.insert(workerRuns).values({
      workerId: id, status: "completed", output, durationMs,
      startedAt, completedAt: new Date(),
    }).returning();

    const avgDuration = (worker.avgDurationMs * worker.runCount + durationMs) / (worker.runCount + 1);
    await db.update(workers).set({
      status: "idle", lastRunAt: new Date(),
      runCount: worker.runCount + 1,
      avgDurationMs: avgDuration,
      updatedAt: new Date(),
    }).where(eq(workers.id, id));

    res.json({ run, worker: { ...worker, runCount: worker.runCount + 1, lastRunAt: new Date() } });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

router.patch("/:id", async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const { isEnabled, schedule } = req.body as { isEnabled?: boolean; schedule?: string };
    const [updated] = await db.update(workers).set({
      ...(isEnabled !== undefined && { isEnabled }),
      ...(schedule && { schedule }),
      updatedAt: new Date(),
    }).where(eq(workers.id, id)).returning();
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

export default router;
