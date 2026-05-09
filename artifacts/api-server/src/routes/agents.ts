import { Router, type Request, type Response } from "express";
import { eq, desc, and } from "drizzle-orm";
import { EventEmitter } from "events";
import { db } from "@workspace/db";
import { agents, agentTasks, agentLogs } from "@workspace/db";
import { anthropic } from "@workspace/integrations-anthropic-ai";

const router = Router();

/* ── Live log bus (in-memory SSE fan-out) ────────────────────────────────── */
const logBus = new EventEmitter();
logBus.setMaxListeners(500);

interface LogEntry {
  id?: number;
  agentId: number;
  taskId?: number | null;
  level: "INFO" | "EXEC" | "CHUNK" | "DONE" | "WARN" | "ERROR";
  message: string;
  createdAt: string;
}

async function writeLog(
  agentId: number,
  level: LogEntry["level"],
  message: string,
  taskId?: number | null,
): Promise<void> {
  try {
    const [row] = await db
      .insert(agentLogs)
      .values({ agentId, taskId: taskId ?? null, level, message })
      .returning();
    const entry: LogEntry = {
      id: row.id,
      agentId,
      taskId: row.taskId,
      level,
      message,
      createdAt: row.createdAt.toISOString(),
    };
    logBus.emit(`agent:${agentId}`, entry);
  } catch {
    /* non-fatal */
  }
}

const AGENT_CATALOG = [
  { name: "code-analyzer", type: "code-quality", description: "Analyzes code quality, complexity, and maintainability", capabilities: ["code-analysis", "metrics", "suggestions"], icon: "🔍" },
  { name: "coder", type: "development", description: "Writes, refactors, and debugs code across all languages", capabilities: ["code-generation", "refactoring", "debugging"], icon: "💻" },
  { name: "tester", type: "testing", description: "Generates unit, integration, and e2e tests automatically", capabilities: ["test-generation", "coverage", "tdd"], icon: "🧪" },
  { name: "security-manager", type: "security", description: "Scans for vulnerabilities, CVEs, and security issues", capabilities: ["cve-scan", "audit", "remediation"], icon: "🛡️" },
  { name: "docs-api-openapi", type: "documentation", description: "Generates and maintains API documentation", capabilities: ["openapi", "docs-generation", "markdown"], icon: "📚" },
  { name: "arch-system-design", type: "architecture", description: "Designs system architecture and data flows", capabilities: ["system-design", "diagrams", "patterns"], icon: "🏗️" },
  { name: "reviewer", type: "code-review", description: "Reviews PRs and provides actionable feedback", capabilities: ["pr-review", "feedback", "standards"], icon: "👁️" },
  { name: "researcher", type: "research", description: "Researches libraries, tools, and best practices", capabilities: ["research", "comparison", "recommendations"], icon: "🔬" },
  { name: "planner", type: "planning", description: "Creates project plans, milestones, and task breakdowns", capabilities: ["planning", "milestones", "estimation"], icon: "📋" },
  { name: "performance-analyzer", type: "performance", description: "Identifies bottlenecks and optimization opportunities", capabilities: ["profiling", "optimization", "benchmarking"], icon: "⚡" },
  { name: "performance-optimizer", type: "performance", description: "Applies performance optimizations automatically", capabilities: ["optimization", "caching", "lazy-loading"], icon: "🚀" },
  { name: "dev-backend-api", type: "development", description: "Builds and maintains backend APIs and services", capabilities: ["api-design", "express", "rest"], icon: "🔧" },
  { name: "data-ml-model", type: "ml", description: "Designs ML pipelines and model architectures", capabilities: ["ml", "data-processing", "models"], icon: "🧠" },
  { name: "coordinator", type: "coordination", description: "Coordinates multi-agent workflows and task delegation", capabilities: ["orchestration", "delegation", "routing"], icon: "🎯" },
  { name: "orchestrator-task", type: "orchestration", description: "Manages complex multi-step task execution", capabilities: ["task-management", "sequencing", "parallel-exec"], icon: "🎼" },
  { name: "specification", type: "specs", description: "Writes detailed technical specifications", capabilities: ["specs", "requirements", "acceptance-criteria"], icon: "📝" },
  { name: "implementer-sparc-coder", type: "sparc", description: "Implements features using SPARC methodology", capabilities: ["sparc", "tdd", "specification-driven"], icon: "⚙️" },
  { name: "pseudocode", type: "planning", description: "Converts requirements to pseudocode and flowcharts", capabilities: ["pseudocode", "flowcharts", "logic-design"], icon: "📊" },
  { name: "refinement", type: "quality", description: "Refines and improves existing implementations", capabilities: ["refactoring", "improvement", "polish"], icon: "✨" },
  { name: "benchmark-suite", type: "testing", description: "Creates comprehensive benchmark test suites", capabilities: ["benchmarking", "performance-testing", "metrics"], icon: "📈" },
  { name: "production-validator", type: "validation", description: "Validates production readiness and deployment", capabilities: ["validation", "health-checks", "pre-deploy"], icon: "✅" },
  { name: "release-manager", type: "devops", description: "Manages releases, changelogs, and versioning", capabilities: ["releases", "semver", "changelogs"], icon: "🎁" },
  { name: "ops-cicd-github", type: "devops", description: "Manages CI/CD pipelines and GitHub Actions", capabilities: ["ci-cd", "github-actions", "automation"], icon: "🔄" },
  { name: "migration-plan", type: "architecture", description: "Plans database and system migrations", capabilities: ["migrations", "planning", "rollback-strategy"], icon: "🗃️" },
  { name: "repo-architect", type: "architecture", description: "Designs repository structure and module boundaries", capabilities: ["repo-structure", "modules", "dependencies"], icon: "📦" },
  { name: "load-balancer", type: "infrastructure", description: "Designs load balancing strategies", capabilities: ["load-balancing", "scaling", "distribution"], icon: "⚖️" },
  { name: "resource-allocator", type: "infrastructure", description: "Optimizes resource allocation across agents", capabilities: ["resource-management", "allocation", "optimization"], icon: "💾" },
  { name: "memory-coordinator", type: "memory", description: "Manages shared memory and knowledge graphs", capabilities: ["memory-management", "knowledge-graphs", "retrieval"], icon: "🧩" },
  { name: "sona-learning-optimizer", type: "learning", description: "Applies SONA neural patterns for self-optimization", capabilities: ["self-learning", "pattern-recognition", "adaptation"], icon: "🌀" },
  { name: "safla-neural", type: "learning", description: "Self-Adaptive Feedback Loop Architecture neural engine", capabilities: ["neural-patterns", "feedback-loops", "adaptation"], icon: "🧬" },
  { name: "neural-network", type: "ml", description: "Designs and trains neural network architectures", capabilities: ["neural-networks", "training", "inference"], icon: "🕸️" },
  { name: "goal-planner", type: "planning", description: "Breaks down high-level goals into executable plans", capabilities: ["goal-decomposition", "planning", "goap"], icon: "🎯" },
  { name: "code-goal-planner", type: "planning", description: "Translates code goals into actionable agent tasks", capabilities: ["code-planning", "task-breakdown", "execution"], icon: "🗺️" },
  { name: "swarm", type: "swarm", description: "Coordinates swarm-level agent collaboration", capabilities: ["swarm-coordination", "consensus", "topology"], icon: "🐝" },
  { name: "hierarchical-coordinator", type: "swarm", description: "Manages hierarchical agent tree structures", capabilities: ["hierarchy", "delegation", "parent-child"], icon: "🌳" },
  { name: "mesh-coordinator", type: "swarm", description: "Coordinates peer-to-peer mesh agent networks", capabilities: ["mesh-networking", "peer-discovery", "routing"], icon: "🕸️" },
  { name: "consensus-coordinator", type: "swarm", description: "Achieves consensus across distributed agents", capabilities: ["consensus", "voting", "agreement-protocols"], icon: "🤝" },
  { name: "queen-coordinator", type: "swarm", description: "Queen-bee pattern for swarm direction and control", capabilities: ["queen-pattern", "swarm-direction", "control"], icon: "👑" },
  { name: "gossip-coordinator", type: "swarm", description: "Propagates information via gossip protocol", capabilities: ["gossip-protocol", "information-spread", "eventual-consistency"], icon: "💬" },
  { name: "raft-manager", type: "swarm", description: "Implements Raft consensus for distributed state", capabilities: ["raft", "leader-election", "log-replication"], icon: "⚓" },
  { name: "byzantine-coordinator", type: "swarm", description: "Handles Byzantine fault tolerance", capabilities: ["byzantine-fault-tolerance", "fault-detection", "resilience"], icon: "🏛️" },
  { name: "crdt-synchronizer", type: "swarm", description: "Synchronizes state using CRDTs", capabilities: ["crdt", "conflict-resolution", "distributed-state"], icon: "🔄" },
  { name: "topology-optimizer", type: "swarm", description: "Optimizes swarm topology for performance", capabilities: ["topology", "optimization", "adaptive-routing"], icon: "🌐" },
  { name: "collective-intelligence-coordinator", type: "swarm", description: "Harnesses collective agent intelligence", capabilities: ["collective-intelligence", "emergence", "swarm-iq"], icon: "🧠" },
  { name: "matrix-optimizer", type: "optimization", description: "Optimizes multi-dimensional agent task matrices", capabilities: ["matrix-computation", "optimization", "parallel-tasks"], icon: "⬛" },
  { name: "pagerank-analyzer", type: "analysis", description: "Applies PageRank to prioritize tasks and agents", capabilities: ["pagerank", "graph-analysis", "prioritization"], icon: "📊" },
  { name: "scout-explorer", type: "discovery", description: "Explores codebases and discovers patterns", capabilities: ["code-discovery", "pattern-detection", "mapping"], icon: "🔭" },
  { name: "worker-specialist", type: "workers", description: "Manages specialized background worker tasks", capabilities: ["background-tasks", "scheduling", "automation"], icon: "⚙️" },
  { name: "workflow-automation", type: "automation", description: "Automates repetitive workflows and processes", capabilities: ["workflow", "automation", "triggers"], icon: "🤖" },
  { name: "github-modes", type: "github", description: "Advanced GitHub operation modes", capabilities: ["github", "repos", "automation"], icon: "🐙" },
  { name: "github-pr-manager", type: "github", description: "Manages GitHub pull requests lifecycle", capabilities: ["pr-management", "reviews", "merging"], icon: "🔀" },
  { name: "issue-tracker", type: "github", description: "Tracks and manages issues intelligently", capabilities: ["issue-tracking", "triage", "prioritization"], icon: "🎫" },
  { name: "project-board-sync", type: "github", description: "Synchronizes project boards and kanban state", capabilities: ["project-management", "kanban", "sync"], icon: "📌" },
  { name: "authentication", type: "security", description: "Implements and audits authentication systems", capabilities: ["auth", "oauth", "jwt", "mfa"], icon: "🔐" },
  { name: "agentic-payments", type: "payments", description: "Manages agentic payment flows and billing", capabilities: ["payments", "billing", "stripe"], icon: "💳" },
  { name: "app-store", type: "distribution", description: "Manages app store submissions and metadata", capabilities: ["app-store", "submissions", "aso"], icon: "🏪" },
  { name: "spec-mobile-react-native", type: "mobile", description: "Specifies React Native mobile applications", capabilities: ["react-native", "mobile", "specifications"], icon: "📱" },
  { name: "performance-monitor", type: "monitoring", description: "Monitors real-time performance metrics", capabilities: ["monitoring", "metrics", "alerts"], icon: "📡" },
  { name: "adaptive-coordinator", type: "coordination", description: "Adapts coordination strategy based on context", capabilities: ["adaptive", "context-aware", "routing"], icon: "🦋" },
  { name: "automation-smart-agent", type: "automation", description: "Smart automation with context understanding", capabilities: ["smart-automation", "nlp", "execution"], icon: "🤖" },
  { name: "base-template-generator", type: "scaffolding", description: "Generates project templates and boilerplates", capabilities: ["scaffolding", "templates", "boilerplate"], icon: "🏗️" },
  { name: "challenges", type: "gamification", description: "Creates coding challenges and assessments", capabilities: ["challenges", "assessments", "scoring"], icon: "🏅" },
  { name: "sync-coordinator", type: "coordination", description: "Synchronizes state across distributed agents", capabilities: ["synchronization", "state-management", "distributed"], icon: "🔃" },
  { name: "quorum-manager", type: "consensus", description: "Manages quorum-based decision making", capabilities: ["quorum", "voting", "decisions"], icon: "🗳️" },
  { name: "swarm-memory-manager", type: "memory", description: "Manages shared swarm memory and knowledge", capabilities: ["swarm-memory", "knowledge", "sharing"], icon: "🧠" },
  { name: "v3-queen-coordinator", type: "swarm", description: "V3 enhanced queen coordinator with learning", capabilities: ["v3", "queen-pattern", "learning"], icon: "👑" },
  { name: "v3-memory-specialist", type: "memory", description: "V3 advanced memory management specialist", capabilities: ["v3", "memory", "advanced"], icon: "💾" },
  { name: "v3-performance-engineer", type: "performance", description: "V3 performance engineering and optimization", capabilities: ["v3", "performance", "engineering"], icon: "⚡" },
  { name: "v3-security-architect", type: "security", description: "V3 enterprise security architecture", capabilities: ["v3", "security", "architecture"], icon: "🛡️" },
  { name: "v3-integration-architect", type: "integration", description: "V3 system integration architecture", capabilities: ["v3", "integration", "systems"], icon: "🔗" },
  { name: "trading-predictor", type: "finance", description: "Predicts market trends using agent intelligence", capabilities: ["trading", "prediction", "finance"], icon: "📈" },
  { name: "user-tools", type: "productivity", description: "User-facing productivity tools and utilities", capabilities: ["productivity", "utilities", "user-tools"], icon: "🛠️" },
  { name: "sandbox", type: "testing", description: "Sandboxed execution environment for safe testing", capabilities: ["sandbox", "isolation", "safe-execution"], icon: "📦" },
  { name: "multi-repo-swarm", type: "swarm", description: "Coordinates agents across multiple repositories", capabilities: ["multi-repo", "cross-repo", "synchronization"], icon: "🗂️" },
  { name: "agentdb-advanced", type: "memory", description: "Advanced AgentDB operations and querying", capabilities: ["agentdb", "vector-search", "advanced-queries"], icon: "🗄️" },
  { name: "agentdb-learning", type: "learning", description: "AgentDB learning and self-improvement patterns", capabilities: ["agentdb", "learning", "self-improvement"], icon: "📖" },
  { name: "agentdb-vector-search", type: "memory", description: "HNSW vector search for ultra-fast retrieval", capabilities: ["hnsw", "vector-search", "semantic-similarity"], icon: "🔎" },
  { name: "stream-chain", type: "streaming", description: "Chains streaming operations across agents", capabilities: ["streaming", "chaining", "pipelines"], icon: "🌊" },
  { name: "flow-nexus-neural", type: "neural", description: "Neural flow nexus for emergent intelligence", capabilities: ["neural-flow", "emergence", "intelligence"], icon: "🌀" },
  { name: "hive-mind", type: "swarm", description: "Hive mind collective intelligence patterns", capabilities: ["hive-mind", "collective", "emergence"], icon: "🐝" },
  { name: "sparc-coordinator", type: "sparc", description: "Coordinates SPARC methodology execution", capabilities: ["sparc", "methodology", "coordination"], icon: "✨" },
  { name: "pair-programming", type: "development", description: "AI pair programming and code collaboration", capabilities: ["pair-programming", "collaboration", "real-time"], icon: "👥" },
  { name: "workflow", type: "automation", description: "Generic workflow automation and management", capabilities: ["workflows", "automation", "triggers"], icon: "📋" },
  { name: "tdd-london-swarm", type: "testing", description: "London-style TDD with swarm verification", capabilities: ["tdd", "london-style", "mocking"], icon: "🧪" },
  { name: "code-review-swarm", type: "code-review", description: "Swarm-based comprehensive code review", capabilities: ["swarm-review", "multi-perspective", "consensus"], icon: "👓" },
  { name: "release-swarm", type: "devops", description: "Swarm-coordinated release management", capabilities: ["release", "swarm", "deployment"], icon: "🚢" },
  { name: "swarm-issue", type: "github", description: "Swarm-based issue resolution", capabilities: ["issue-swarm", "resolution", "collaboration"], icon: "🐛" },
  { name: "swarm-pr", type: "github", description: "Swarm-based PR review and approval", capabilities: ["pr-swarm", "review", "approval"], icon: "🔀" },
  { name: "performance-benchmarker", type: "testing", description: "Benchmarks agent and system performance", capabilities: ["benchmarking", "profiling", "comparison"], icon: "⏱️" },
  { name: "claims", type: "verification", description: "Verifies agent claims and outputs", capabilities: ["verification", "fact-checking", "validation"], icon: "✔️" },
  { name: "verification-quality", type: "quality", description: "Quality verification and assurance", capabilities: ["qa", "verification", "quality"], icon: "🏅" },
  { name: "agent-agent", type: "meta", description: "Meta-agent that creates and manages other agents", capabilities: ["meta-agent", "agent-creation", "management"], icon: "🤖" },
  { name: "skill-builder", type: "meta", description: "Builds and manages agent skills dynamically", capabilities: ["skill-creation", "management", "deployment"], icon: "🧰" },
  { name: "hooks-automation", type: "automation", description: "Git hooks and event automation", capabilities: ["hooks", "git", "events", "automation"], icon: "🪝" },
];

router.get("/catalog", async (_req: Request, res: Response) => {
  res.json({ agents: AGENT_CATALOG, total: AGENT_CATALOG.length });
});

router.get("/", async (_req: Request, res: Response) => {
  try {
    const agentList = await db.select().from(agents).orderBy(desc(agents.createdAt));
    res.json({ agents: agentList, total: agentList.length });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

router.post("/", async (req: Request, res: Response) => {
  try {
    const { name, type, description, capabilities, config } = req.body as {
      name: string; type: string; description: string;
      capabilities?: string[]; config?: Record<string, unknown>;
    };
    if (!name || !type || !description) {
      res.status(400).json({ error: "name, type, description required" }); return;
    }
    const catalogEntry = AGENT_CATALOG.find(a => a.name === name);
    const [agent] = await db.insert(agents).values({
      name, type, description,
      capabilities: capabilities ?? catalogEntry?.capabilities ?? [],
      config: config ?? {},
      status: "idle",
    }).returning();
    res.status(201).json(agent);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

router.post("/spawn-catalog", async (req: Request, res: Response) => {
  try {
    const { agentNames } = req.body as { agentNames: string[] };
    if (!agentNames?.length) { res.status(400).json({ error: "agentNames required" }); return; }
    const toInsert = agentNames
      .map(n => AGENT_CATALOG.find(a => a.name === n))
      .filter(Boolean)
      .map(a => ({ name: a!.name, type: a!.type, description: a!.description, capabilities: a!.capabilities, config: {}, status: "idle" as const }));
    if (!toInsert.length) { res.status(404).json({ error: "No matching agents found" }); return; }
    const created = await db.insert(agents).values(toInsert).returning();
    res.status(201).json({ spawned: created, count: created.length });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

router.get("/:id", async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const [agent] = await db.select().from(agents).where(eq(agents.id, id));
    if (!agent) { res.status(404).json({ error: "Agent not found" }); return; }
    const tasks = await db.select().from(agentTasks).where(eq(agentTasks.agentId, id)).orderBy(desc(agentTasks.createdAt)).limit(20);
    res.json({ ...agent, tasks });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

router.patch("/:id/status", async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const { status } = req.body as { status: string };
    const [updated] = await db.update(agents).set({ status, updatedAt: new Date() }).where(eq(agents.id, id)).returning();
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

/* ── GET /api/agents/:id/logs — history (last 200) ──────────────────────── */
router.get("/:id/logs", async (req: Request, res: Response) => {
  try {
    const agentId = parseInt(req.params.id);
    const logs = await db
      .select()
      .from(agentLogs)
      .where(eq(agentLogs.agentId, agentId))
      .orderBy(desc(agentLogs.createdAt))
      .limit(200);
    res.json({ logs: logs.reverse() });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

/* ── GET /api/agents/:id/logs/stream — live SSE ──────────────────────────── */
router.get("/:id/logs/stream", async (req: Request, res: Response) => {
  const agentId = parseInt(req.params.id);

  res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders();

  const send = (entry: LogEntry) =>
    res.write(`data: ${JSON.stringify(entry)}\n\n`);

  /* Send last 50 historical logs first */
  try {
    const history = await db
      .select()
      .from(agentLogs)
      .where(eq(agentLogs.agentId, agentId))
      .orderBy(desc(agentLogs.createdAt))
      .limit(50);
    history.reverse().forEach(row =>
      send({
        id: row.id,
        agentId: row.agentId,
        taskId: row.taskId,
        level: row.level as LogEntry["level"],
        message: row.message,
        createdAt: row.createdAt.toISOString(),
      }),
    );
  } catch { /* ignore */ }

  res.write(`data: ${JSON.stringify({ type: "connected", agentId })}\n\n`);

  const listener = (entry: LogEntry) => send(entry);
  logBus.on(`agent:${agentId}`, listener);

  const heartbeat = setInterval(() => {
    try { res.write(": heartbeat\n\n"); } catch { /* ignore */ }
  }, 20000);

  req.on("close", () => {
    logBus.off(`agent:${agentId}`, listener);
    clearInterval(heartbeat);
  });
});

/* ── POST /api/agents/:id/run ─────────────────────────────────────────────── */
router.post("/:id/run", async (req: Request, res: Response) => {
  try {
    const agentId = parseInt(req.params.id);
    const { task, input } = req.body as { task: string; input?: Record<string, unknown> };
    if (!task) { res.status(400).json({ error: "task required" }); return; }

    const [agent] = await db.select().from(agents).where(eq(agents.id, agentId));
    if (!agent) { res.status(404).json({ error: "Agent not found" }); return; }

    await db.update(agents).set({ status: "running", updatedAt: new Date() }).where(eq(agents.id, agentId));

    const [taskRow] = await db.insert(agentTasks).values({
      agentId, type: task, status: "running",
      input: input ?? {}, startedAt: new Date(),
    }).returning();

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("X-Accel-Buffering", "no");
    res.flushHeaders();
    const send = (data: object) => res.write(`data: ${JSON.stringify(data)}\n\n`);

    send({ type: "agent_start", agentId, agentName: agent.name, taskId: taskRow.id });
    await writeLog(agentId, "EXEC", `Task started: ${task}`, taskRow.id);
    await writeLog(agentId, "INFO", `Agent: ${agent.name} | Capabilities: ${agent.capabilities.join(", ")}`, taskRow.id);

    const systemPrompt = `You are the "${agent.name}" agent — ${agent.description}.
Your capabilities: ${agent.capabilities.join(", ")}.
Execute the task with precision and return structured results.`;

    let fullOutput = "";
    await writeLog(agentId, "INFO", `Connecting to AI model (claude-haiku-4-5)…`, taskRow.id);

    const stream = anthropic.messages.stream({
      model: "claude-haiku-4-5",
      max_tokens: 4096,
      system: systemPrompt,
      messages: [{ role: "user", content: `Task: ${task}\n\nInput: ${JSON.stringify(input ?? {})}` }],
    });

    let chunkBuffer = "";
    let chunkCount = 0;

    for await (const event of stream) {
      if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
        const text = event.delta.text;
        fullOutput += text;
        chunkBuffer += text;
        send({ type: "chunk", content: text });

        /* Flush buffer as a log line every ~80 chars or on newline */
        if (chunkBuffer.includes("\n") || chunkBuffer.length >= 80) {
          const lines = chunkBuffer.split("\n");
          for (let i = 0; i < lines.length - 1; i++) {
            const line = lines[i].trim();
            if (line) {
              chunkCount++;
              await writeLog(agentId, "CHUNK", line, taskRow.id);
            }
          }
          chunkBuffer = lines[lines.length - 1];
        }
      }
    }

    /* Flush remaining buffer */
    if (chunkBuffer.trim()) {
      await writeLog(agentId, "CHUNK", chunkBuffer.trim(), taskRow.id);
    }

    const metrics = agent.metrics as { tasksCompleted: number; successRate: number; avgResponseMs: number; tokensUsed: number; lastActive: string | null };
    await db.update(agents).set({
      status: "idle", updatedAt: new Date(),
      metrics: { ...metrics, tasksCompleted: metrics.tasksCompleted + 1, successRate: 1, lastActive: new Date().toISOString() }
    }).where(eq(agents.id, agentId));

    await db.update(agentTasks).set({
      status: "completed", output: { result: fullOutput },
      completedAt: new Date(),
    }).where(eq(agentTasks.id, taskRow.id));

    await writeLog(agentId, "DONE", `Task completed successfully. Output: ${fullOutput.length} chars, ${chunkCount} log lines`, taskRow.id);

    send({ type: "agent_done", taskId: taskRow.id, output: fullOutput });
    res.end();
  } catch (err) {
    res.write(`data: ${JSON.stringify({ type: "error", error: String(err) })}\n\n`);
    res.end();
  }
});

router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    await db.delete(agents).where(eq(agents.id, id));
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

export default router;
