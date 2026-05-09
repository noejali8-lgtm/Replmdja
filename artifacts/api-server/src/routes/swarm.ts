import { Router, type Request, type Response } from "express";
import { eq, desc } from "drizzle-orm";
import { EventEmitter } from "events";
import { db } from "@workspace/db";
import { swarms, swarmMessages, agents } from "@workspace/db";
import { anthropic } from "@workspace/integrations-anthropic-ai";

const router = Router();

/* ── Swarm viz event bus (SSE fan-out) ───────────────────────────────────── */
const swarmBus = new EventEmitter();
swarmBus.setMaxListeners(200);

interface VizEvent {
  type: "viz_phase" | "viz_done" | "viz_init" | "connected";
  swarmId: number;
  phase?: string;
  topology?: string;
  timestamp: string;
}

function emitViz(swarmId: number, payload: Omit<VizEvent, "swarmId" | "timestamp">) {
  const event: VizEvent = { ...payload, swarmId, timestamp: new Date().toISOString() };
  swarmBus.emit(`swarm:${swarmId}`, event);
}

router.get("/", async (_req: Request, res: Response) => {
  try {
    const swarmList = await db.select().from(swarms).orderBy(desc(swarms.createdAt));
    res.json({ swarms: swarmList, total: swarmList.length });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

router.post("/", async (req: Request, res: Response) => {
  try {
    const { name, topology, description, config } = req.body as {
      name: string; topology?: string; description?: string;
      config?: { maxAgents?: number; consensusThreshold?: number; learningRate?: number; adaptiveRouting?: boolean };
    };
    if (!name) { res.status(400).json({ error: "name required" }); return; }
    const [swarm] = await db.insert(swarms).values({
      name, topology: topology ?? "hierarchical",
      description: description ?? "",
      config: {
        maxAgents: config?.maxAgents ?? 10,
        consensusThreshold: config?.consensusThreshold ?? 0.7,
        learningRate: config?.learningRate ?? 0.01,
        adaptiveRouting: config?.adaptiveRouting ?? true,
      },
    }).returning();
    res.status(201).json(swarm);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

router.get("/:id", async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const [swarm] = await db.select().from(swarms).where(eq(swarms.id, id));
    if (!swarm) { res.status(404).json({ error: "Swarm not found" }); return; }
    const messages = await db.select().from(swarmMessages).where(eq(swarmMessages.swarmId, id)).orderBy(desc(swarmMessages.createdAt)).limit(50);
    const swarmAgents = await db.select().from(agents).where(eq(agents.swarmId, id));
    res.json({ ...swarm, messages, agents: swarmAgents });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

/* ── GET /api/swarm/:id/events/stream — live viz SSE ─────────────────────── */
router.get("/:id/events/stream", (req: Request, res: Response) => {
  const swarmId = parseInt(req.params.id);

  res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders();

  const send = (d: object) => res.write(`data: ${JSON.stringify(d)}\n\n`);
  send({ type: "connected", swarmId });

  const listener = (ev: VizEvent) => { try { send(ev); } catch { /* ignore */ } };
  swarmBus.on(`swarm:${swarmId}`, listener);

  const heartbeat = setInterval(() => {
    try { res.write(": heartbeat\n\n"); } catch { /* ignore */ }
  }, 20000);

  req.on("close", () => {
    swarmBus.off(`swarm:${swarmId}`, listener);
    clearInterval(heartbeat);
  });
});

/* ── POST /api/swarm/:id/coordinate ──────────────────────────────────────── */
router.post("/:id/coordinate", async (req: Request, res: Response) => {
  try {
    const swarmId = parseInt(req.params.id);
    const { task, topology } = req.body as { task: string; topology?: string };
    if (!task) { res.status(400).json({ error: "task required" }); return; }

    const [swarm] = await db.select().from(swarms).where(eq(swarms.id, swarmId));
    if (!swarm) { res.status(404).json({ error: "Swarm not found" }); return; }

    await db.update(swarms).set({ status: "running", updatedAt: new Date() }).where(eq(swarms.id, swarmId));

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("X-Accel-Buffering", "no");
    res.flushHeaders();
    const send = (data: object) => res.write(`data: ${JSON.stringify(data)}\n\n`);

    const topo = topology ?? swarm.topology;
    send({ type: "swarm_init", swarmId, topology: topo, task });
    emitViz(swarmId, { type: "viz_init", topology: topo });

    const phases = topo === "hierarchical"
      ? ["analyze", "delegate", "execute", "consolidate", "report"]
      : topo === "mesh"
      ? ["broadcast", "negotiate", "parallel-execute", "consensus", "merge"]
      : ["assess", "adapt-topology", "route", "execute", "learn"];

    for (const phase of phases) {
      send({ type: "phase_start", phase });
      emitViz(swarmId, { type: "viz_phase", phase, topology: topo });

      await db.insert(swarmMessages).values({
        swarmId, type: "phase", payload: { phase, task, timestamp: new Date().toISOString() }
      });

      const stream = anthropic.messages.stream({
        model: "claude-haiku-4-5",
        max_tokens: 1024,
        system: `You are the ${topo} swarm coordinator executing the "${phase}" phase.`,
        messages: [{ role: "user", content: `Phase: ${phase}\nTask: ${task}\nTopology: ${topo}` }],
      });

      let phaseOutput = "";
      for await (const event of stream) {
        if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
          phaseOutput += event.delta.text;
          send({ type: "phase_chunk", phase, content: event.delta.text });
        }
      }
      send({ type: "phase_done", phase, result: phaseOutput });
    }

    const metrics = swarm.metrics as { totalTasks: number; successRate: number; activeAgents: number; throughput: number };
    await db.update(swarms).set({
      status: "idle", updatedAt: new Date(),
      metrics: { ...metrics, totalTasks: metrics.totalTasks + 1, successRate: 1 }
    }).where(eq(swarms.id, swarmId));

    emitViz(swarmId, { type: "viz_done" });
    send({ type: "swarm_done", swarmId });
    res.end();
  } catch (err) {
    res.write(`data: ${JSON.stringify({ type: "error", error: String(err) })}\n\n`);
    res.end();
  }
});

router.post("/:id/consensus", async (req: Request, res: Response) => {
  try {
    const swarmId = parseInt(req.params.id);
    const { question, options } = req.body as { question: string; options?: string[] };
    if (!question) { res.status(400).json({ error: "question required" }); return; }

    const votes: Record<string, number> = {};
    const opts = options ?? ["approve", "reject", "abstain"];
    const swarmAgents = await db.select().from(agents).where(eq(agents.swarmId, swarmId));
    const voterCount = Math.max(swarmAgents.length, 3);

    for (let i = 0; i < voterCount; i++) {
      const pick = opts[Math.floor(Math.random() * opts.length)];
      votes[pick] = (votes[pick] ?? 0) + 1;
    }

    const sorted = Object.entries(votes).sort(([, a], [, b]) => b - a);
    const winner = sorted[0][0];
    const threshold = 0.7;
    const winnerRatio = sorted[0][1] / voterCount;
    const consensus = winnerRatio >= threshold;

    await db.insert(swarmMessages).values({
      swarmId, type: "consensus",
      payload: { question, votes, winner, consensus, threshold, voterCount }
    });

    res.json({ question, votes, winner, consensus, threshold, winnerRatio: winnerRatio.toFixed(2), voterCount });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    await db.delete(swarms).where(eq(swarms.id, id));
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

export default router;
