import { Router, type Request, type Response } from "express";
import { anthropic } from "@workspace/integrations-anthropic-ai";

const router = Router();

interface GoapState { [key: string]: boolean | number | string }
interface GoapAction {
  id: string; name: string; description: string;
  preconditions: GoapState; effects: GoapState;
  cost: number; agentType?: string;
}
interface GoapNode { state: GoapState; actions: GoapAction[]; g: number; h: number }

function heuristic(state: GoapState, goal: GoapState): number {
  let unmet = 0;
  for (const [k, v] of Object.entries(goal)) {
    if (state[k] !== v) unmet++;
  }
  return unmet;
}

function stateMatches(state: GoapState, target: GoapState): boolean {
  return Object.entries(target).every(([k, v]) => state[k] === v);
}

function applyAction(state: GoapState, action: GoapAction): GoapState {
  return { ...state, ...action.effects };
}

function goapAStar(initialState: GoapState, goal: GoapState, actions: GoapAction[]): GoapAction[] | null {
  const open: Array<GoapNode & { f: number; parent: GoapNode | null; action: GoapAction | null }> = [];
  const closed = new Set<string>();

  const startH = heuristic(initialState, goal);
  open.push({ state: initialState, actions: [], g: 0, h: startH, f: startH, parent: null, action: null });

  let iterations = 0;
  while (open.length > 0 && iterations < 500) {
    iterations++;
    open.sort((a, b) => a.f - b.f);
    const current = open.shift()!;
    const stateKey = JSON.stringify(current.state);
    if (closed.has(stateKey)) continue;
    closed.add(stateKey);

    if (stateMatches(current.state, goal)) return current.actions;

    for (const action of actions) {
      if (!stateMatches(current.state, action.preconditions)) continue;
      const newState = applyAction(current.state, action);
      const newKey = JSON.stringify(newState);
      if (closed.has(newKey)) continue;
      const g = current.g + action.cost;
      const h = heuristic(newState, goal);
      open.push({ state: newState, actions: [...current.actions, action], g, h, f: g + h, parent: current, action });
    }
  }
  return null;
}

router.post("/plan", async (req: Request, res: Response) => {
  try {
    const { goal, context, complexity = "medium" } = req.body as {
      goal: string; context?: string; complexity?: "simple" | "medium" | "complex";
    };
    if (!goal) { res.status(400).json({ error: "goal required" }); return; }

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("X-Accel-Buffering", "no");
    res.flushHeaders();
    const send = (data: object) => res.write(`data: ${JSON.stringify(data)}\n\n`);

    send({ type: "planning_start", goal });

    const stream = anthropic.messages.stream({
      model: "claude-sonnet-4-6",
      max_tokens: 4096,
      system: `You are a GOAP (Goal-Oriented Action Planning) A* planner. Convert plain-English goals into detailed, executable agent plans.

For each plan, produce:
1. **Goal Analysis** — break down what success looks like
2. **Current State Assessment** — what we know/have now
3. **Action Graph** — ordered steps with dependencies (A* optimal path)
4. **Agent Assignments** — which specialist agent handles each step
5. **Risk Mitigation** — potential failures and fallbacks
6. **Success Criteria** — measurable outcomes

Format each action as:
\`\`\`
[Step N] <Action Name>
- Agent: <agent-type>
- Preconditions: <what must be true before>
- Effects: <what changes after>
- Cost: <complexity 1-10>
- Estimated time: <duration>
\`\`\`

Complexity level: ${complexity}
${context ? `Context: ${context}` : ""}`,
      messages: [{ role: "user", content: `Create a GOAP A* plan for this goal: "${goal}"` }],
    });

    for await (const event of stream) {
      if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
        send({ type: "chunk", content: event.delta.text });
      }
    }
    send({ type: "plan_done" });
    res.end();
  } catch (err) {
    res.write(`data: ${JSON.stringify({ type: "error", error: String(err) })}\n\n`);
    res.end();
  }
});

router.post("/solve", (req: Request, res: Response) => {
  try {
    const { initialState, goal, actions } = req.body as {
      initialState: GoapState; goal: GoapState; actions: GoapAction[];
    };
    if (!initialState || !goal || !actions?.length) {
      res.status(400).json({ error: "initialState, goal, actions required" }); return;
    }
    const plan = goapAStar(initialState, goal, actions);
    if (!plan) { res.json({ success: false, plan: null, message: "No valid plan found" }); return; }
    const totalCost = plan.reduce((s, a) => s + a.cost, 0);
    res.json({ success: true, plan, steps: plan.length, totalCost, message: `Found optimal plan with ${plan.length} steps` });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

router.post("/decompose", async (req: Request, res: Response) => {
  try {
    const { goal, maxDepth = 3 } = req.body as { goal: string; maxDepth?: number };
    if (!goal) { res.status(400).json({ error: "goal required" }); return; }

    const msg = await anthropic.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 2048,
      system: "You are a goal decomposition system. Break goals into hierarchical sub-goals. Return valid JSON.",
      messages: [{
        role: "user", content: `Decompose this goal into a hierarchy of sub-goals (max depth ${maxDepth}):\n"${goal}"\n\nReturn JSON: { "goal": string, "subgoals": [{ "goal": string, "subgoals": [...], "agentType": string, "estimatedMinutes": number, "priority": "critical"|"high"|"medium"|"low" }] }`
      }],
    });

    const text = msg.content[0].type === "text" ? msg.content[0].text : "{}";
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      const decomposed = jsonMatch ? JSON.parse(jsonMatch[0]) : { goal, subgoals: [] };
      res.json({ original: goal, decomposed, maxDepth });
    } catch {
      res.json({ original: goal, decomposed: { goal, subgoals: [] }, rawOutput: text });
    }
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

router.get("/templates", (_req: Request, res: Response) => {
  res.json({
    templates: [
      { id: "build-saas", name: "Build a SaaS Product", description: "Full-stack SaaS with auth, billing, and dashboard", complexity: "complex", estimatedAgents: 8 },
      { id: "refactor-codebase", name: "Refactor Legacy Codebase", description: "Modernize old code with tests and documentation", complexity: "complex", estimatedAgents: 6 },
      { id: "add-feature", name: "Add New Feature", description: "Design, implement, test, and document a new feature", complexity: "medium", estimatedAgents: 4 },
      { id: "security-audit", name: "Security Audit & Remediation", description: "Scan, identify, and fix security vulnerabilities", complexity: "medium", estimatedAgents: 3 },
      { id: "api-migration", name: "API Migration", description: "Migrate REST to GraphQL or upgrade API version", complexity: "complex", estimatedAgents: 5 },
      { id: "performance-optimization", name: "Performance Optimization", description: "Profile, identify bottlenecks, and optimize", complexity: "medium", estimatedAgents: 4 },
      { id: "fix-bug", name: "Debug & Fix Bug", description: "Reproduce, diagnose, fix, and verify a bug", complexity: "simple", estimatedAgents: 2 },
      { id: "write-tests", name: "Write Test Suite", description: "Achieve 80%+ test coverage with unit and e2e tests", complexity: "medium", estimatedAgents: 3 },
    ]
  });
});

export default router;
