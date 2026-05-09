import { Router, type Request, type Response } from "express";
import { eq, desc } from "drizzle-orm";
import { db } from "@workspace/db";
import { plugins } from "@workspace/db";

const router = Router();

const NATIVE_PLUGINS = [
  { name: "ruflo-core", displayName: "Ruflo Core", description: "Foundation — server, health checks, plugin discovery", category: "Core & Orchestration", type: "native", icon: "🔷", tags: ["core", "foundation"], capabilities: ["server", "health", "discovery"], rating: 4.9, downloads: 12450 },
  { name: "ruflo-swarm", displayName: "Ruflo Swarm", description: "Coordinate multiple agents as a team", category: "Core & Orchestration", type: "native", icon: "🐝", tags: ["swarm", "coordination"], capabilities: ["swarm", "multi-agent", "topology"], rating: 4.8, downloads: 9832 },
  { name: "ruflo-autopilot", displayName: "Ruflo Autopilot", description: "Let agents run autonomously in a loop", category: "Core & Orchestration", type: "native", icon: "🤖", tags: ["autopilot", "autonomous"], capabilities: ["autonomous", "loop", "self-directed"], rating: 4.7, downloads: 8764 },
  { name: "ruflo-loop-workers", displayName: "Ruflo Loop Workers", description: "Schedule background tasks on a timer", category: "Core & Orchestration", type: "native", icon: "⏰", tags: ["workers", "scheduling"], capabilities: ["scheduling", "cron", "background"], rating: 4.6, downloads: 7543 },
  { name: "ruflo-workflows", displayName: "Ruflo Workflows", description: "Reusable multi-step task templates", category: "Core & Orchestration", type: "native", icon: "📋", tags: ["workflows", "templates"], capabilities: ["workflow", "templates", "multi-step"], rating: 4.5, downloads: 6891 },
  { name: "ruflo-federation", displayName: "Ruflo Federation", description: "Agents on different machines collaborate securely", category: "Core & Orchestration", type: "native", icon: "🌐", tags: ["federation", "distributed", "secure"], capabilities: ["federation", "zero-trust", "cross-machine"], rating: 4.7, downloads: 5432 },
  { name: "ruflo-agentdb", displayName: "Ruflo AgentDB", description: "Fast vector database for agent memory", category: "Memory & Knowledge", type: "native", icon: "🗄️", tags: ["memory", "vector-db"], capabilities: ["vector-search", "storage", "retrieval"], rating: 4.9, downloads: 11234 },
  { name: "ruflo-rag-memory", displayName: "Ruflo RAG Memory", description: "Smart retrieval — hybrid search, graph hops, diversity ranking", category: "Memory & Knowledge", type: "native", icon: "🧩", tags: ["rag", "retrieval", "hybrid"], capabilities: ["rag", "hybrid-search", "graph-hops"], rating: 4.8, downloads: 8923 },
  { name: "ruflo-rvf", displayName: "Ruflo RVF", description: "Save and restore agent memory across sessions", category: "Memory & Knowledge", type: "native", icon: "💾", tags: ["persistence", "restore"], capabilities: ["save", "restore", "persistence"], rating: 4.5, downloads: 6234 },
  { name: "ruflo-ruvector", displayName: "Ruflo RuVector", description: "GPU-accelerated search, Graph RAG, 103 tools", category: "Memory & Knowledge", type: "native", icon: "⚡", tags: ["gpu", "fast", "graph-rag"], capabilities: ["gpu-search", "graph-rag", "103-tools"], rating: 4.9, downloads: 9871, npmPackage: "ruvector" },
  { name: "ruflo-knowledge-graph", displayName: "Ruflo Knowledge Graph", description: "Build and traverse entity relationship maps", category: "Memory & Knowledge", type: "native", icon: "🕸️", tags: ["knowledge-graph", "entities"], capabilities: ["graph-building", "traversal", "relationships"], rating: 4.6, downloads: 5671 },
  { name: "ruflo-intelligence", displayName: "Ruflo Intelligence", description: "Agents learn from past successes and get smarter", category: "Intelligence & Learning", type: "native", icon: "🧠", tags: ["learning", "intelligence"], capabilities: ["learning", "adaptation", "optimization"], rating: 4.8, downloads: 8432 },
  { name: "ruflo-daa", displayName: "Ruflo DAA", description: "Dynamic agent behavior and cognitive patterns", category: "Intelligence & Learning", type: "native", icon: "🌀", tags: ["daa", "cognitive", "dynamic"], capabilities: ["dynamic-behavior", "cognitive", "patterns"], rating: 4.7, downloads: 5234 },
  { name: "ruflo-ruvllm", displayName: "Ruflo RuvLLM", description: "Run local LLMs (Ollama, etc.) with smart routing", category: "Intelligence & Learning", type: "native", icon: "🦾", tags: ["local-llm", "ollama", "routing"], capabilities: ["local-llm", "routing", "self-hosting"], rating: 4.6, downloads: 7123 },
  { name: "ruflo-goals", displayName: "Ruflo Goals", description: "Break big goals into plans and track progress", category: "Intelligence & Learning", type: "native", icon: "🎯", tags: ["goals", "planning", "goap"], capabilities: ["goal-decomposition", "tracking", "goap"], rating: 4.5, downloads: 4891 },
  { name: "ruflo-testgen", displayName: "Ruflo TestGen", description: "Find missing tests and generate them automatically", category: "Code Quality & Testing", type: "native", icon: "🧪", tags: ["testing", "generation"], capabilities: ["test-generation", "coverage", "automation"], rating: 4.7, downloads: 8234 },
  { name: "ruflo-browser", displayName: "Ruflo Browser", description: "Automate browser testing with Playwright", category: "Code Quality & Testing", type: "native", icon: "🌍", tags: ["browser", "playwright", "e2e"], capabilities: ["browser-automation", "playwright", "e2e-testing"], rating: 4.6, downloads: 6543 },
  { name: "ruflo-jujutsu", displayName: "Ruflo Jujutsu", description: "Analyze git diffs, score risk, suggest reviewers", category: "Code Quality & Testing", type: "native", icon: "🥋", tags: ["git", "risk", "review"], capabilities: ["git-analysis", "risk-scoring", "reviewer-suggestion"], rating: 4.5, downloads: 4321 },
  { name: "ruflo-docs", displayName: "Ruflo Docs", description: "Generate and maintain documentation automatically", category: "Code Quality & Testing", type: "native", icon: "📚", tags: ["docs", "documentation"], capabilities: ["doc-generation", "maintenance", "openapi"], rating: 4.6, downloads: 7654 },
  { name: "ruflo-security-audit", displayName: "Ruflo Security Audit", description: "Scan for vulnerabilities and CVEs", category: "Security & Compliance", type: "native", icon: "🛡️", tags: ["security", "cve", "audit"], capabilities: ["vulnerability-scan", "cve", "compliance"], rating: 4.8, downloads: 9123 },
  { name: "ruflo-aidefence", displayName: "Ruflo AIDefence", description: "Block prompt injection and adversarial attacks", category: "Security & Compliance", type: "native", icon: "🔰", tags: ["aidefence", "prompt-injection"], capabilities: ["prompt-injection-prevention", "adversarial-defense", "input-validation"], rating: 4.9, downloads: 8765 },
  { name: "ruflo-compliance", displayName: "Ruflo Compliance", description: "GDPR, SOC2, HIPAA compliance checking", category: "Security & Compliance", type: "native", icon: "✅", tags: ["compliance", "gdpr", "soc2"], capabilities: ["compliance-check", "gdpr", "reporting"], rating: 4.5, downloads: 4234 },
  { name: "ruflo-github", displayName: "Ruflo GitHub", description: "Deep GitHub automation and repository intelligence", category: "DevOps & Integration", type: "native", icon: "🐙", tags: ["github", "automation"], capabilities: ["github-api", "pr-automation", "repo-intelligence"], rating: 4.7, downloads: 7892 },
  { name: "ruflo-cicd", displayName: "Ruflo CI/CD", description: "Intelligent CI/CD pipeline management", category: "DevOps & Integration", type: "native", icon: "🔄", tags: ["cicd", "pipeline"], capabilities: ["ci-cd", "pipeline-management", "automation"], rating: 4.6, downloads: 5678 },
  { name: "ruflo-monitoring", displayName: "Ruflo Monitoring", description: "Real-time agent and system monitoring", category: "DevOps & Integration", type: "native", icon: "📡", tags: ["monitoring", "real-time"], capabilities: ["monitoring", "alerts", "dashboards"], rating: 4.7, downloads: 6432 },
  { name: "ruflo-payments", displayName: "Ruflo Payments", description: "Agentic payment flow management", category: "DevOps & Integration", type: "native", icon: "💳", tags: ["payments", "billing"], capabilities: ["payments", "billing", "stripe"], rating: 4.4, downloads: 3421 },
  { name: "ruflo-sparc", displayName: "Ruflo SPARC", description: "SPARC methodology for systematic development", category: "Methodology", type: "native", icon: "✨", tags: ["sparc", "methodology"], capabilities: ["sparc", "systematic", "methodology"], rating: 4.8, downloads: 6789 },
  { name: "ruflo-tdd", displayName: "Ruflo TDD", description: "Test-driven development enforcement", category: "Methodology", type: "native", icon: "🔴", tags: ["tdd", "test-first"], capabilities: ["tdd", "test-first", "red-green-refactor"], rating: 4.6, downloads: 5432 },
  { name: "ruflo-ddd", displayName: "Ruflo DDD", description: "Domain-driven design patterns and tools", category: "Methodology", type: "native", icon: "🏛️", tags: ["ddd", "domain-driven"], capabilities: ["ddd", "bounded-context", "aggregates"], rating: 4.5, downloads: 4123 },
  { name: "ruflo-app-store", displayName: "Ruflo App Store", description: "Publish agents and skills to the marketplace", category: "Marketplace", type: "native", icon: "🏪", tags: ["marketplace", "publish"], capabilities: ["publishing", "marketplace", "discovery"], rating: 4.4, downloads: 3876 },
  { name: "ruflo-skills-hub", displayName: "Ruflo Skills Hub", description: "Share and download agent skills", category: "Marketplace", type: "native", icon: "🧰", tags: ["skills", "sharing"], capabilities: ["skill-sharing", "download", "community"], rating: 4.5, downloads: 4567 },
  { name: "ruflo-mcp-bridge", displayName: "Ruflo MCP Bridge", description: "Bridge external MCP servers into Ruflo", category: "Integration", type: "native", icon: "🔌", tags: ["mcp", "bridge"], capabilities: ["mcp", "tool-integration", "protocol"], rating: 4.7, downloads: 6234 },
];

const NPM_PLUGINS = [
  { name: "ruvector", displayName: "RuVector", description: "GPU-accelerated vector search engine", category: "Vector DB", type: "npm", icon: "⚡", tags: ["vector", "gpu", "search"], npmPackage: "ruvector", rating: 4.9, downloads: 23456 },
  { name: "claude-flow", displayName: "Claude Flow", description: "Multi-agent orchestration for Claude", category: "Orchestration", type: "npm", icon: "🌊", tags: ["claude", "orchestration"], npmPackage: "@claude-flow/core", rating: 4.8, downloads: 18765 },
  { name: "hnsw-js", displayName: "HNSW.js", description: "HNSW index for approximate nearest neighbor search", category: "Vector DB", type: "npm", icon: "🔍", tags: ["hnsw", "ann", "search"], npmPackage: "hnswlib-node", rating: 4.7, downloads: 15432 },
  { name: "langchain", displayName: "LangChain", description: "Framework for developing LLM applications", category: "LLM Framework", type: "npm", icon: "⛓️", tags: ["langchain", "llm"], npmPackage: "langchain", rating: 4.6, downloads: 34567 },
  { name: "llamaindex", displayName: "LlamaIndex", description: "Data framework for LLM applications", category: "LLM Framework", type: "npm", icon: "🦙", tags: ["llamaindex", "rag"], npmPackage: "llamaindex", rating: 4.5, downloads: 21345 },
  { name: "ollama-js", displayName: "Ollama.js", description: "JavaScript client for Ollama local LLMs", category: "Local LLM", type: "npm", icon: "🦙", tags: ["ollama", "local"], npmPackage: "ollama", rating: 4.7, downloads: 19876 },
  { name: "openai-node", displayName: "OpenAI Node", description: "Official OpenAI SDK for Node.js", category: "LLM Provider", type: "npm", icon: "🤖", tags: ["openai", "gpt"], npmPackage: "openai", rating: 4.8, downloads: 45678 },
  { name: "anthropic-sdk", displayName: "Anthropic SDK", description: "Official Anthropic SDK for Claude", category: "LLM Provider", type: "npm", icon: "🧠", tags: ["anthropic", "claude"], npmPackage: "@anthropic-ai/sdk", rating: 4.9, downloads: 38901 },
  { name: "zod", displayName: "Zod", description: "TypeScript-first schema validation", category: "Validation", type: "npm", icon: "🔷", tags: ["validation", "typescript"], npmPackage: "zod", rating: 4.9, downloads: 89012 },
  { name: "drizzle-orm", displayName: "Drizzle ORM", description: "Lightweight TypeScript ORM", category: "Database", type: "npm", icon: "💧", tags: ["orm", "database", "typescript"], npmPackage: "drizzle-orm", rating: 4.8, downloads: 67890 },
  { name: "playwright", displayName: "Playwright", description: "Browser automation for testing", category: "Testing", type: "npm", icon: "🎭", tags: ["browser", "testing", "e2e"], npmPackage: "@playwright/test", rating: 4.7, downloads: 56789 },
  { name: "vitest", displayName: "Vitest", description: "Next-generation testing framework", category: "Testing", type: "npm", icon: "⚡", tags: ["testing", "fast"], npmPackage: "vitest", rating: 4.8, downloads: 45678 },
  { name: "p-limit", displayName: "p-limit", description: "Limit concurrent async operations", category: "Async", type: "npm", icon: "🚦", tags: ["concurrency", "async"], npmPackage: "p-limit", rating: 4.9, downloads: 78901 },
  { name: "express", displayName: "Express", description: "Fast, minimalist web framework for Node", category: "Web Framework", type: "npm", icon: "🚂", tags: ["express", "api", "server"], npmPackage: "express", rating: 4.7, downloads: 234567 },
  { name: "fastify", displayName: "Fastify", description: "Fast and low overhead web framework", category: "Web Framework", type: "npm", icon: "⚡", tags: ["fastify", "fast", "api"], npmPackage: "fastify", rating: 4.8, downloads: 123456 },
  { name: "pino", displayName: "Pino", description: "Super fast structured logger", category: "Logging", type: "npm", icon: "📝", tags: ["logging", "structured"], npmPackage: "pino", rating: 4.8, downloads: 98765 },
  { name: "ws", displayName: "WS", description: "WebSocket client/server for Node.js", category: "Real-time", type: "npm", icon: "🔌", tags: ["websocket", "real-time"], npmPackage: "ws", rating: 4.7, downloads: 145678 },
  { name: "redis", displayName: "Redis Client", description: "Redis client for Node.js", category: "Cache", type: "npm", icon: "🔴", tags: ["redis", "cache"], npmPackage: "redis", rating: 4.7, downloads: 134567 },
  { name: "bull", displayName: "Bull", description: "Premium queue system for Node", category: "Queue", type: "npm", icon: "🐂", tags: ["queue", "jobs"], npmPackage: "bull", rating: 4.6, downloads: 87654 },
  { name: "jose", displayName: "JOSE", description: "JavaScript Object Signing and Encryption", category: "Security", type: "npm", icon: "🔐", tags: ["jwt", "security"], npmPackage: "jose", rating: 4.8, downloads: 56789 },
  { name: "deno", displayName: "Deno Runtime", description: "Secure JavaScript/TypeScript runtime", category: "Runtime", type: "npm", icon: "🦕", tags: ["deno", "runtime"], npmPackage: "@deno/runtime", rating: 4.5, downloads: 34567 },
];

router.post("/seed", async (_req: Request, res: Response) => {
  try {
    const existing = await db.select().from(plugins);
    if (existing.length > 0) { res.json({ message: "Plugins already seeded", count: existing.length }); return; }
    const allPlugins = [...NATIVE_PLUGINS, ...NPM_PLUGINS].map(p => ({
      name: p.name, displayName: p.displayName, description: p.description,
      category: p.category, type: p.type, icon: p.icon,
      tags: p.tags, capabilities: (p as { capabilities?: string[] }).capabilities ?? [],
      rating: p.rating, downloads: p.downloads,
      npmPackage: (p as { npmPackage?: string }).npmPackage ?? null,
      isInstalled: false, isEnabled: false, config: {},
    }));
    const created = await db.insert(plugins).values(allPlugins).returning();
    res.status(201).json({ created: created.length });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

router.get("/", async (req: Request, res: Response) => {
  try {
    const { category, type, installed } = req.query as { category?: string; type?: string; installed?: string };
    let pluginList = await db.select().from(plugins).orderBy(desc(plugins.downloads));
    if (!pluginList.length) {
      const allPlugins = [...NATIVE_PLUGINS, ...NPM_PLUGINS].map(p => ({
        name: p.name, displayName: p.displayName, description: p.description,
        category: p.category, type: p.type, icon: p.icon,
        tags: p.tags, capabilities: (p as { capabilities?: string[] }).capabilities ?? [],
        rating: p.rating, downloads: p.downloads,
        npmPackage: (p as { npmPackage?: string }).npmPackage ?? null,
        isInstalled: false, isEnabled: false, config: {},
      }));
      pluginList = await db.insert(plugins).values(allPlugins).returning();
    }
    if (category) pluginList = pluginList.filter(p => p.category === category);
    if (type) pluginList = pluginList.filter(p => p.type === type);
    if (installed === "true") pluginList = pluginList.filter(p => p.isInstalled);

    const categories = [...new Set(pluginList.map(p => p.category))];
    res.json({ plugins: pluginList, total: pluginList.length, categories });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

router.post("/:name/install", async (req: Request, res: Response) => {
  try {
    const { name } = req.params;
    const [plugin] = await db.update(plugins).set({ isInstalled: true, isEnabled: true, updatedAt: new Date() }).where(eq(plugins.name, name)).returning();
    if (!plugin) { res.status(404).json({ error: "Plugin not found" }); return; }
    res.json({ plugin, message: `${plugin.displayName} installed successfully` });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

router.post("/:name/uninstall", async (req: Request, res: Response) => {
  try {
    const { name } = req.params;
    const [plugin] = await db.update(plugins).set({ isInstalled: false, isEnabled: false, updatedAt: new Date() }).where(eq(plugins.name, name)).returning();
    if (!plugin) { res.status(404).json({ error: "Plugin not found" }); return; }
    res.json({ plugin, message: `${plugin.displayName} uninstalled` });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

export default router;
