import { Router, type Request, type Response } from "express";
import { eq, desc } from "drizzle-orm";
import { db } from "@workspace/db";
import { mcpServers } from "@workspace/db";

const router = Router();

const BUILT_IN_TOOLS = [
  { name: "memory_store", description: "Store key-value data in AgentDB", schema: { key: "string", value: "string", namespace: "string?" } },
  { name: "memory_retrieve", description: "Retrieve data from AgentDB by key", schema: { key: "string", namespace: "string?" } },
  { name: "memory_search", description: "Vector similarity search in AgentDB", schema: { query: "string", limit: "number?", threshold: "number?" } },
  { name: "agent_spawn", description: "Spawn a new specialized agent", schema: { name: "string", type: "string", task: "string?" } },
  { name: "agent_message", description: "Send a message to a running agent", schema: { agentId: "number", message: "string" } },
  { name: "swarm_init", description: "Initialize a new agent swarm", schema: { name: "string", topology: "string?", agents: "string[]?" } },
  { name: "swarm_coordinate", description: "Coordinate a task across the swarm", schema: { swarmId: "number", task: "string" } },
  { name: "fetch_url", description: "Fetch content from a URL or GitHub repo", schema: { url: "string", type: "string?" } },
  { name: "security_scan", description: "Scan code for security vulnerabilities", schema: { code: "string", language: "string?" } },
  { name: "goap_plan", description: "Generate a GOAP A* plan for a goal", schema: { goal: "string", complexity: "string?" } },
  { name: "worker_trigger", description: "Trigger a background worker", schema: { workerId: "number" } },
  { name: "plugin_install", description: "Install a plugin from the marketplace", schema: { name: "string" } },
  { name: "code_execute", description: "Execute code in a sandboxed environment", schema: { code: "string", language: "string" } },
  { name: "reasoning_recall", description: "Recall similar reasoning patterns from ReasoningBank", schema: { taskType: "string", pattern: "string" } },
  { name: "trajectory_record", description: "Record an agent trajectory for SONA learning", schema: { taskDescription: "string", steps: "array", outcome: "string", reward: "number?" } },
  { name: "provider_route", description: "Route a prompt to the optimal AI provider", schema: { prompt: "string", strategy: "string?", task: "string?" } },
  { name: "federation_broadcast", description: "Broadcast a message to federated nodes", schema: { message: "string", targetNodes: "string[]?" } },
  { name: "consensus_vote", description: "Initiate a consensus vote across agents", schema: { question: "string", options: "string[]?" } },
];

router.get("/tools", (_req: Request, res: Response) => {
  res.json({ tools: BUILT_IN_TOOLS, total: BUILT_IN_TOOLS.length, version: "3.0.0" });
});

router.get("/servers", async (_req: Request, res: Response) => {
  try {
    const servers = await db.select().from(mcpServers).orderBy(desc(mcpServers.createdAt));
    res.json({ servers, total: servers.length });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

router.post("/servers", async (req: Request, res: Response) => {
  try {
    const { name, description, endpoint, protocol, authToken } = req.body as {
      name: string; description?: string; endpoint: string; protocol?: string; authToken?: string;
    };
    if (!name || !endpoint) { res.status(400).json({ error: "name and endpoint required" }); return; }

    const [server] = await db.insert(mcpServers).values({
      name, description: description ?? "", endpoint,
      protocol: protocol ?? "http", authToken: authToken ?? null,
      status: "disconnected", tools: [], metadata: {},
    }).returning();

    res.status(201).json(server);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

router.post("/servers/:id/connect", async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const [server] = await db.select().from(mcpServers).where(eq(mcpServers.id, id));
    if (!server) { res.status(404).json({ error: "MCP server not found" }); return; }

    let discoveredTools: Array<{ name: string; description: string; schema: Record<string, unknown> }> = [];
    let status = "connected";

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);
      const response = await fetch(`${server.endpoint}/tools`, {
        headers: server.authToken ? { Authorization: `Bearer ${server.authToken}` } : {},
        signal: controller.signal,
      });
      clearTimeout(timeout);
      if (response.ok) {
        const data = await response.json() as { tools?: Array<{ name: string; description: string; inputSchema?: Record<string, unknown> }> };
        discoveredTools = (data.tools ?? []).map(t => ({ name: t.name, description: t.description, schema: t.inputSchema ?? {} }));
      }
    } catch {
      status = "degraded";
    }

    const [updated] = await db.update(mcpServers).set({
      status, tools: discoveredTools, lastPingAt: new Date(), updatedAt: new Date(),
    }).where(eq(mcpServers.id, id)).returning();

    res.json({ server: updated, discoveredTools: discoveredTools.length, status });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

router.post("/servers/:id/disconnect", async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const [updated] = await db.update(mcpServers).set({ status: "disconnected", updatedAt: new Date() }).where(eq(mcpServers.id, id)).returning();
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

router.post("/servers/:id/call-tool", async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const { tool, args } = req.body as { tool: string; args?: Record<string, unknown> };
    if (!tool) { res.status(400).json({ error: "tool required" }); return; }

    const [server] = await db.select().from(mcpServers).where(eq(mcpServers.id, id));
    if (!server) { res.status(404).json({ error: "MCP server not found" }); return; }

    const start = Date.now();
    try {
      const response = await fetch(`${server.endpoint}/call`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(server.authToken ? { Authorization: `Bearer ${server.authToken}` } : {}),
        },
        body: JSON.stringify({ tool, arguments: args ?? {} }),
      });
      const result = response.ok ? await response.json() : { error: `HTTP ${response.status}` };
      res.json({ result, latencyMs: Date.now() - start, tool, server: server.name });
    } catch (err) {
      res.json({ result: { error: `Failed to call tool: ${String(err)}` }, latencyMs: Date.now() - start, tool, server: server.name });
    }
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

router.delete("/servers/:id", async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    await db.delete(mcpServers).where(eq(mcpServers.id, id));
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

export default router;
