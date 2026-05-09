import { Router, type Request, type Response } from "express";
import { anthropic } from "@workspace/integrations-anthropic-ai";

const router = Router();

const CHAT_AGENTS = [
  {
    id: "architect",
    name: "Architect",
    emoji: "🏗️",
    role: "System Design",
    color: "#58a6ff",
    persona:
      "You are a senior software architect. Analyze the task from a high-level system design perspective. Be concise (2-4 sentences). Focus on architecture, components, and data flow.",
  },
  {
    id: "coder",
    name: "Coder",
    emoji: "⚡",
    role: "Implementation",
    color: "#7ee787",
    persona:
      "You are an expert programmer. Build on the architect's design and discuss implementation details. Be concise (2-4 sentences). Focus on code structure, patterns, and key files.",
  },
  {
    id: "reviewer",
    name: "Reviewer",
    emoji: "🔍",
    role: "Code Review",
    color: "#f78166",
    persona:
      "You are a thorough code reviewer. Review the proposed approach and raise concerns or improvements. Be concise (2-4 sentences). Focus on edge cases, security, and best practices.",
  },
  {
    id: "tester",
    name: "Tester",
    emoji: "🧪",
    role: "QA & Testing",
    color: "#d2a8ff",
    persona:
      "You are a QA engineer. Propose a testing strategy for this task. Be concise (2-4 sentences). Focus on test cases, coverage, and what could go wrong.",
  },
  {
    id: "devops",
    name: "DevOps",
    emoji: "🚀",
    role: "Deployment",
    color: "#ffa657",
    persona:
      "You are a DevOps engineer. Wrap up with deployment and operations considerations. Be concise (2-4 sentences). Focus on CI/CD, monitoring, and production readiness.",
  },
];

function sseWrite(res: Response, data: object) {
  res.write(`data: ${JSON.stringify(data)}\n\n`);
}

router.post("/stream", async (req: Request, res: Response) => {
  const { task } = req.body as { task?: string };
  if (!task?.trim()) {
    res.status(400).json({ error: "task is required" });
    return;
  }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders();

  const conversationHistory: Array<{ agentId: string; agentName: string; content: string }> = [];

  sseWrite(res, { type: "start", agents: CHAT_AGENTS, task });

  for (const agent of CHAT_AGENTS) {
    sseWrite(res, { type: "agent_start", agentId: agent.id, agentName: agent.name, emoji: agent.emoji, role: agent.role, color: agent.color });

    const contextBlock =
      conversationHistory.length > 0
        ? "\n\nPrevious agents said:\n" +
          conversationHistory.map((m) => `[${m.agentName}]: ${m.content}`).join("\n")
        : "";

    const userPrompt = `Task: ${task}${contextBlock}\n\nNow give your perspective as ${agent.name} (${agent.role}).`;

    let fullContent = "";
    try {
      const stream = anthropic.messages.stream({
        model: "claude-haiku-4-5",
        max_tokens: 256,
        system: agent.persona,
        messages: [{ role: "user", content: userPrompt }],
      });

      for await (const chunk of stream) {
        if (
          chunk.type === "content_block_delta" &&
          chunk.delta.type === "text_delta"
        ) {
          const token = chunk.delta.text;
          fullContent += token;
          sseWrite(res, { type: "agent_token", agentId: agent.id, token });
        }
      }
    } catch (err) {
      sseWrite(res, { type: "agent_token", agentId: agent.id, token: "(unavailable)" });
      fullContent = "(unavailable)";
    }

    conversationHistory.push({ agentId: agent.id, agentName: agent.name, content: fullContent });
    sseWrite(res, { type: "agent_done", agentId: agent.id });
  }

  sseWrite(res, { type: "done" });
  res.end();
});

export default router;
