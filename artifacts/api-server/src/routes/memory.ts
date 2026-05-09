import { Router, type Request, type Response } from "express";
import { eq, desc, and, sql } from "drizzle-orm";
import { db } from "@workspace/db";
import { memoryEntries, reasoningBank, trajectories } from "@workspace/db";
import { anthropic } from "@workspace/integrations-anthropic-ai";

const router = Router();

function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  return normA && normB ? dot / (Math.sqrt(normA) * Math.sqrt(normB)) : 0;
}

function simpleEmbed(text: string): number[] {
  const dim = 128;
  const vec = new Array(dim).fill(0);
  for (let i = 0; i < text.length; i++) {
    vec[i % dim] += text.charCodeAt(i) / 128;
  }
  const norm = Math.sqrt(vec.reduce((s, v) => s + v * v, 0)) || 1;
  return vec.map(v => v / norm);
}

router.get("/", async (req: Request, res: Response) => {
  try {
    const { namespace, limit = "50" } = req.query as { namespace?: string; limit?: string };
    let q = db.select().from(memoryEntries).orderBy(desc(memoryEntries.updatedAt)).$dynamic();
    if (namespace) q = q.where(eq(memoryEntries.namespace, namespace));
    const entries = await q.limit(parseInt(limit));
    res.json({ entries, total: entries.length });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

router.post("/", async (req: Request, res: Response) => {
  try {
    const { key, value, namespace, agentId, metadata, importance, isPinned } = req.body as {
      key: string; value: string; namespace?: string; agentId?: number;
      metadata?: Record<string, unknown>; importance?: number; isPinned?: boolean;
    };
    if (!key || !value) { res.status(400).json({ error: "key and value required" }); return; }

    const embedding = simpleEmbed(`${key} ${value}`);

    const existing = await db.select().from(memoryEntries)
      .where(and(eq(memoryEntries.key, key), eq(memoryEntries.namespace, namespace ?? "global")))
      .limit(1);

    let entry;
    if (existing.length) {
      [entry] = await db.update(memoryEntries).set({
        value, embedding, metadata: metadata ?? {}, importance: importance ?? 0.5,
        updatedAt: new Date(), accessCount: sql`${memoryEntries.accessCount} + 1`,
      }).where(eq(memoryEntries.id, existing[0].id)).returning();
    } else {
      [entry] = await db.insert(memoryEntries).values({
        key, value, namespace: namespace ?? "global", agentId,
        embedding, metadata: metadata ?? {}, importance: importance ?? 0.5,
        isPinned: isPinned ?? false,
      }).returning();
    }
    res.status(201).json(entry);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

router.post("/search", async (req: Request, res: Response) => {
  try {
    const { query, namespace, limit = 10, threshold = 0.3 } = req.body as {
      query: string; namespace?: string; limit?: number; threshold?: number;
    };
    if (!query) { res.status(400).json({ error: "query required" }); return; }

    let dbQuery = db.select().from(memoryEntries).orderBy(desc(memoryEntries.importance)).$dynamic();
    if (namespace) dbQuery = dbQuery.where(eq(memoryEntries.namespace, namespace));
    const all = await dbQuery.limit(500);

    const queryEmbed = simpleEmbed(query);
    const scored = all
      .map(e => ({
        ...e,
        score: e.embedding ? cosineSimilarity(queryEmbed, e.embedding as number[]) : 0,
      }))
      .filter(e => e.score >= threshold)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    for (const e of scored) {
      await db.update(memoryEntries).set({
        accessCount: sql`${memoryEntries.accessCount} + 1`,
        lastAccessedAt: new Date(),
      }).where(eq(memoryEntries.id, e.id));
    }

    res.json({ results: scored, query, total: scored.length });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    await db.delete(memoryEntries).where(eq(memoryEntries.id, id));
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

router.get("/reasoning", async (_req: Request, res: Response) => {
  try {
    const entries = await db.select().from(reasoningBank).orderBy(desc(reasoningBank.confidence)).limit(100);
    res.json({ entries, total: entries.length });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

router.post("/reasoning", async (req: Request, res: Response) => {
  try {
    const { taskType, pattern, solution, confidence } = req.body as {
      taskType: string; pattern: string; solution: string; confidence?: number;
    };
    if (!taskType || !pattern || !solution) { res.status(400).json({ error: "taskType, pattern, solution required" }); return; }
    const embedding = simpleEmbed(`${taskType} ${pattern}`);
    const [entry] = await db.insert(reasoningBank).values({
      taskType, pattern, solution, confidence: confidence ?? 0.5,
      embedding, usageCount: 0, successCount: 0,
    }).returning();
    res.status(201).json(entry);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

router.get("/trajectories", async (_req: Request, res: Response) => {
  try {
    const list = await db.select().from(trajectories).orderBy(desc(trajectories.createdAt)).limit(50);
    res.json({ trajectories: list, total: list.length });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

router.post("/trajectories", async (req: Request, res: Response) => {
  try {
    const { agentId, taskDescription, steps, outcome, reward } = req.body as {
      agentId?: number; taskDescription: string;
      steps: Array<{ action: string; result: string; timestamp: string }>;
      outcome: string; reward?: number;
    };
    if (!taskDescription || !outcome) { res.status(400).json({ error: "taskDescription and outcome required" }); return; }

    const sonaScore = (reward ?? 0) * 0.4 + (steps?.length ?? 0) * 0.1;
    const [traj] = await db.insert(trajectories).values({
      agentId, taskDescription, steps: steps ?? [], outcome, reward: reward ?? 0,
      sonaScore: Math.min(sonaScore, 1), learnedPatterns: [],
    }).returning();
    res.status(201).json(traj);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

router.post("/recall", async (req: Request, res: Response) => {
  try {
    const { prompt, namespace, agentId } = req.body as { prompt: string; namespace?: string; agentId?: number };
    if (!prompt) { res.status(400).json({ error: "prompt required" }); return; }

    let q = db.select().from(memoryEntries).orderBy(desc(memoryEntries.importance)).$dynamic();
    if (namespace) q = q.where(eq(memoryEntries.namespace, namespace));
    if (agentId) q = q.where(eq(memoryEntries.agentId, agentId));
    const memories = await q.limit(20);

    if (!memories.length) { res.json({ answer: "No memories found.", memories: [] }); return; }

    const memCtx = memories.map(m => `[${m.key}]: ${m.value}`).join("\n");
    const msg = await anthropic.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 1024,
      system: `You are a memory recall agent. Use the following stored memories to answer the question:\n\n${memCtx}`,
      messages: [{ role: "user", content: prompt }],
    });
    const answer = msg.content[0].type === "text" ? msg.content[0].text : "";
    res.json({ answer, memories, sourceCount: memories.length });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

export default router;
