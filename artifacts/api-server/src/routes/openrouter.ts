import { Router, type Request, type Response } from "express";

const router = Router();

/* ── POST /api/openrouter/ensemble ─────────────────────────────────────────────
   Calls multiple OpenRouter models in parallel, then synthesises using the
   first model's response.  Streams results back as newline-delimited JSON.
   Body: { models: string[], prompt: string, apiKey: string }
   ─────────────────────────────────────────────────────────────────────────── */
router.post("/ensemble", async (req: Request, res: Response) => {
  const { models, prompt, apiKey } = req.body as {
    models: string[];
    prompt: string;
    apiKey: string;
  };

  if (!apiKey) {
    res.status(401).json({ error: "OpenRouter API key required" });
    return;
  }
  if (!models || models.length === 0) {
    res.status(400).json({ error: "At least one model required" });
    return;
  }
  if (!prompt) {
    res.status(400).json({ error: "Prompt required" });
    return;
  }

  res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders();

  const send = (data: object) => {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  const callModel = async (modelId: string): Promise<{ modelId: string; text: string; error?: string }> => {
    try {
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://replit.com",
          "X-Title": "Replit Agent Ensemble",
        },
        body: JSON.stringify({
          model: modelId,
          messages: [{ role: "user", content: prompt }],
          max_tokens: 512,
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        return { modelId, text: "", error: `HTTP ${response.status}: ${errText.slice(0, 200)}` };
      }

      const json = await response.json() as {
        choices?: { message?: { content?: string } }[];
        error?: { message: string };
      };

      if (json.error) {
        return { modelId, text: "", error: json.error.message };
      }

      const text = json.choices?.[0]?.message?.content ?? "";
      return { modelId, text };
    } catch (err) {
      return { modelId, text: "", error: String(err) };
    }
  };

  send({ type: "status", phase: "diverge", message: `Querying ${models.length} models in parallel...` });

  // Phase 1: Diverge — call all models in parallel
  const results = await Promise.all(models.map(m => callModel(m)));

  const successful = results.filter(r => !r.error && r.text.length > 0);

  for (const result of results) {
    send({
      type: "model_response",
      modelId: result.modelId,
      text: result.text,
      error: result.error,
    });
  }

  if (successful.length === 0) {
    send({ type: "error", message: "All models failed. Check your API key and model IDs." });
    res.end();
    return;
  }

  // Phase 2: Synthesize
  send({ type: "status", phase: "synthesize", message: `Synthesising ${successful.length} responses...` });

  const synthPrompt = `You are a synthesis engine. Multiple AI models were asked the following question:\n\n"${prompt}"\n\nHere are their responses:\n\n${successful.map((r, i) => `**Model ${i + 1} (${r.modelId.split("/").pop()}):**\n${r.text}`).join("\n\n---\n\n")}\n\nNow synthesise the best elements from all responses into one comprehensive, accurate, and coherent answer. Do not mention the individual models. Just provide the synthesised answer directly.`;

  try {
    const synthResponse = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://replit.com",
        "X-Title": "Replit Agent Ensemble Synthesis",
      },
      body: JSON.stringify({
        model: successful[0].modelId,
        messages: [{ role: "user", content: synthPrompt }],
        max_tokens: 1024,
        temperature: 0.3,
      }),
    });

    if (synthResponse.ok) {
      const synthJson = await synthResponse.json() as {
        choices?: { message?: { content?: string } }[];
      };
      const synthesis = synthJson.choices?.[0]?.message?.content ?? "";
      send({ type: "synthesis", text: synthesis });
    } else {
      // Fallback: return best response
      const best = successful.reduce((a, b) => b.text.length > a.text.length ? b : a);
      send({ type: "synthesis", text: best.text });
    }
  } catch {
    const best = successful.reduce((a, b) => b.text.length > a.text.length ? b : a);
    send({ type: "synthesis", text: best.text });
  }

  send({ type: "done" });
  res.end();
});

/* ── GET /api/openrouter/models ────────────────────────────────────────────────
   Returns a list of free OpenRouter models (no API key required to list them).
   ─────────────────────────────────────────────────────────────────────────── */
router.get("/models", async (_req: Request, res: Response) => {
  try {
    const r = await fetch("https://openrouter.ai/api/v1/models", {
      headers: { "Content-Type": "application/json" },
    });
    if (!r.ok) {
      res.json({ data: [] });
      return;
    }
    const json = await r.json() as { data: { id: string; pricing: { prompt: string } }[] };
    const free = json.data.filter(m => m.pricing?.prompt === "0");
    res.json({ data: free });
  } catch {
    res.json({ data: [] });
  }
});

export default router;
