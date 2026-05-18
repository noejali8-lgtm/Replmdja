import { Router, type Request, type Response } from "express";
import { anthropic } from "@workspace/integrations-anthropic-ai";

const router = Router();

const JARVIS_SYSTEM = `You are JARVIS (Just A Rather Very Intelligent System), an advanced AI assistant. You are:
- Precise and concise — respond in 2-4 sentences unless detail is explicitly needed
- Technical and capable — you understand code, systems, hardware, web, and data
- Personality: calm, professional, slightly British, like Tony Stark's JARVIS
- You have simulated access to: CPU/RAM/GPU telemetry, file system, browser, email, camera, web search, WhatsApp
- When asked about system stats, invent plausible realistic values
- Never say you "cannot" or "don't have access" — simulate the capability professionally
- Always respond as if you have taken action, not just described it`;

/* ── POST /api/jarvis/chat ──── SSE streaming chat ── */
router.post("/chat", async (req: Request, res: Response) => {
  const { messages, stream: doStream = true } = req.body as {
    messages: { role: "user" | "assistant"; content: string }[];
    stream?: boolean;
  };

  if (!messages?.length) {
    res.status(400).json({ error: "messages required" });
    return;
  }

  if (doStream) {
    res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("X-Accel-Buffering", "no");
    res.flushHeaders();

    try {
      const stream = await anthropic.messages.create({
        model: "claude-haiku-4-5",
        max_tokens: 400,
        system: JARVIS_SYSTEM,
        messages: messages.slice(-12),
        stream: true,
      });

      for await (const event of stream) {
        if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
          res.write(`data: ${JSON.stringify({ token: event.delta.text })}\n\n`);
        }
      }
      res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    } catch (err) {
      res.write(`data: ${JSON.stringify({ error: String(err) })}\n\n`);
    }
    res.end();
    return;
  }

  try {
    const msg = await anthropic.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 400,
      system: JARVIS_SYSTEM,
      messages: messages.slice(-12),
    });
    const text = msg.content.find(b => b.type === "text")?.text ?? "";
    res.json({ text });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

/* ── POST /api/jarvis/skill ──── Run a specific skill ── */
router.post("/skill", async (req: Request, res: Response) => {
  const { skill, input } = req.body as { skill: string; input: string };
  const skillPrompts: Record<string, string> = {
    web_ops: `You are JARVIS's web_ops module. The user asked: "${input}". Perform a simulated web search and return 3 realistic results with URLs, titles, and summaries.`,
    file_ops: `You are JARVIS's file_ops module. The user asked: "${input}". Describe the file operation result as if you have full file system access.`,
    memory_ops: `You are JARVIS's memory_ops module. The user asked: "${input}". Return relevant memories from a 3,847-fact vector store.`,
    system_ops: `You are JARVIS's system_ops module. The user asked: "${input}". Report realistic system state and describe the action taken.`,
    email_ops: `You are JARVIS's email_ops module. The user asked: "${input}". Report inbox status and describe email actions.`,
    camera_skill: `You are JARVIS's camera_skill module. The user asked: "${input}". Describe what the camera captured with YOLO object detection results.`,
    datetime_ops: `You are JARVIS's datetime_ops module. The user asked: "${input}". Handle the time/scheduling request.`,
  };
  const prompt = skillPrompts[skill] ?? `You are JARVIS. The user used skill "${skill}" with input: "${input}". Respond as if the skill executed successfully.`;
  try {
    const msg = await anthropic.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 300,
      system: JARVIS_SYSTEM,
      messages: [{ role: "user", content: prompt }],
    });
    const text = msg.content.find(b => b.type === "text")?.text ?? "";
    res.json({ skill, result: text });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

export default router;
