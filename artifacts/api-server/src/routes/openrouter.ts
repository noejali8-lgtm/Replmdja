import { Router, type Request, type Response } from "express";

const router = Router();

// ── shared helper ─────────────────────────────────────────────────────────────
async function callModel(
  modelId: string,
  messages: { role: string; content: string }[],
  apiKey: string,
  maxTokens = 512,
  temperature = 0.7,
): Promise<{ text: string; error?: string }> {
  try {
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://replit.com",
        "X-Title": "Replit Agent",
      },
      body: JSON.stringify({ model: modelId, messages, max_tokens: maxTokens, temperature }),
    });
    if (!res.ok) {
      const t = await res.text();
      return { text: "", error: `HTTP ${res.status}: ${t.slice(0, 200)}` };
    }
    const json = await res.json() as {
      choices?: { message?: { content?: string } }[];
      error?: { message: string };
    };
    if (json.error) return { text: "", error: json.error.message };
    return { text: json.choices?.[0]?.message?.content ?? "" };
  } catch (err) {
    return { text: "", error: String(err) };
  }
}

function sseSetup(res: Response) {
  res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders();
  return (data: object) => res.write(`data: ${JSON.stringify(data)}\n\n`);
}

/* ── POST /api/openrouter/ensemble ───────────────────────────────────────────
   Diverge: all models answer in parallel.
   Synthesise: best model merges all answers.
   Body: { models: string[], prompt: string, apiKey: string }
   ─────────────────────────────────────────────────────────────────────────── */
router.post("/ensemble", async (req: Request, res: Response) => {
  const { models, prompt, apiKey } = req.body as {
    models: string[];
    prompt: string;
    apiKey: string;
  };
  if (!apiKey) { res.status(401).json({ error: "OpenRouter API key required" }); return; }
  if (!models?.length) { res.status(400).json({ error: "At least one model required" }); return; }
  if (!prompt) { res.status(400).json({ error: "Prompt required" }); return; }

  const send = sseSetup(res);
  send({ type: "status", phase: "diverge", message: `Querying ${models.length} models in parallel…` });

  const msgs = [{ role: "user", content: prompt }];
  const results = await Promise.all(
    models.map(async (id) => {
      const { text, error } = await callModel(id, msgs, apiKey);
      send({ type: "model_response", modelId: id, text, error });
      return { modelId: id, text, error };
    }),
  );

  const ok = results.filter((r) => !r.error && r.text);
  if (!ok.length) { send({ type: "error", message: "All models failed. Check your API key." }); res.end(); return; }

  send({ type: "status", phase: "synthesize", message: `Synthesising ${ok.length} responses…` });

  const synthPrompt =
    `You are a synthesis engine. Multiple AI models answered:\n\n"${prompt}"\n\n` +
    ok.map((r, i) => `**Model ${i + 1} (${r.modelId.split("/").pop()}):**\n${r.text}`).join("\n\n---\n\n") +
    `\n\nSynthesize the best elements into one comprehensive, accurate answer. No meta-commentary — just the answer.`;

  const { text: synthesis } = await callModel(ok[0].modelId, [{ role: "user", content: synthPrompt }], apiKey, 1024, 0.3);
  send({ type: "synthesis", text: synthesis || ok.reduce((a, b) => b.text.length > a.text.length ? b : a).text });
  send({ type: "done" });
  res.end();
});

/* ── POST /api/openrouter/debate ─────────────────────────────────────────────
   Phase 1 – Diverge: models answer independently.
   Phase 2 – Debate:  each model sees all other answers, challenges/refines.
   Phase 3 – Synthesise: merges debate outputs.
   Body: { models: string[], prompt: string, apiKey: string }
   ─────────────────────────────────────────────────────────────────────────── */
router.post("/debate", async (req: Request, res: Response) => {
  const { models, prompt, apiKey } = req.body as {
    models: string[];
    prompt: string;
    apiKey: string;
  };
  if (!apiKey) { res.status(401).json({ error: "OpenRouter API key required" }); return; }
  if (!models?.length) { res.status(400).json({ error: "At least one model required" }); return; }
  if (!prompt) { res.status(400).json({ error: "Prompt required" }); return; }

  const send = sseSetup(res);

  // ── Phase 1: Diverge ──────────────────────────────────────────────────────
  send({ type: "status", phase: "diverge", message: `${models.length} models forming initial positions…` });

  const initial = await Promise.all(
    models.map(async (id) => {
      const { text, error } = await callModel(id, [{ role: "user", content: prompt }], apiKey, 400, 0.75);
      send({ type: "model_response", modelId: id, text, error, round: 0 });
      return { modelId: id, text, error };
    }),
  );

  const okInitial = initial.filter((r) => !r.error && r.text);
  if (!okInitial.length) { send({ type: "error", message: "All models failed in diverge phase." }); res.end(); return; }

  // ── Phase 2: Debate ───────────────────────────────────────────────────────
  send({ type: "status", phase: "debate", message: "Models are reading each other's answers and debating…" });

  const debateResults = await Promise.all(
    okInitial.map(async (mine) => {
      const othersText = okInitial
        .filter((r) => r.modelId !== mine.modelId)
        .map((r, i) => `**Opponent ${i + 1} (${r.modelId.split("/").pop()}):** ${r.text}`)
        .join("\n\n");

      const debatePrompt =
        `The original question was: "${prompt}"\n\n` +
        `Your initial answer was:\n${mine.text}\n\n` +
        (othersText
          ? `Other AI models gave these answers:\n\n${othersText}\n\n` +
            `Critically review the other answers. Identify flaws, gaps, or stronger points. ` +
            `Then write your FINAL, improved answer that incorporates the best insights and corrects any mistakes. ` +
            `Be direct and confident.`
          : `Critically review your own answer. Identify any gaps or mistakes and write your improved final answer.`);

      const { text, error } = await callModel(mine.modelId, [{ role: "user", content: debatePrompt }], apiKey, 512, 0.65);
      send({ type: "debate_response", modelId: mine.modelId, text, error, round: 1 });
      return { modelId: mine.modelId, text: text || mine.text, error };
    }),
  );

  const okDebate = debateResults.filter((r) => r.text);

  // ── Phase 3: Synthesise ───────────────────────────────────────────────────
  send({ type: "status", phase: "synthesize", message: "Synthesising post-debate positions…" });

  const finalPool = okDebate.length ? okDebate : okInitial;
  const synthPrompt =
    `The following AI models debated the question: "${prompt}"\n\n` +
    `Here are their final post-debate positions:\n\n` +
    finalPool.map((r, i) => `**Model ${i + 1} (${r.modelId.split("/").pop()}):**\n${r.text}`).join("\n\n---\n\n") +
    `\n\nNow produce a single, definitive synthesis that:\n` +
    `1. Integrates the strongest arguments from each model\n` +
    `2. Resolves any remaining contradictions\n` +
    `3. Delivers a clear, confident final answer\n\n` +
    `No meta-commentary. Just the synthesised answer.`;

  const best = finalPool.reduce((a, b) => b.text.length > a.text.length ? b : a);
  const { text: synthesis } = await callModel(best.modelId, [{ role: "user", content: synthPrompt }], apiKey, 1024, 0.25);
  send({ type: "synthesis", text: synthesis || best.text });
  send({ type: "done" });
  res.end();
});

/* ── POST /api/openrouter/arena ──────────────────────────────────────────────
   Calls two models in parallel; streams both slots (A / B).
   Body: { modelA: string, modelB: string, prompt: string, apiKey: string }
   ─────────────────────────────────────────────────────────────────────────── */
router.post("/arena", async (req: Request, res: Response) => {
  const { modelA, modelB, prompt, apiKey } = req.body as {
    modelA: string;
    modelB: string;
    prompt: string;
    apiKey: string;
  };
  if (!apiKey) { res.status(401).json({ error: "OpenRouter API key required" }); return; }
  if (!modelA || !modelB) { res.status(400).json({ error: "Two models required" }); return; }
  if (!prompt) { res.status(400).json({ error: "Prompt required" }); return; }

  const send = sseSetup(res);
  send({ type: "status", message: "Both models are answering…" });

  const msgs = [{ role: "user", content: prompt }];
  await Promise.all([
    callModel(modelA, msgs, apiKey, 768, 0.7).then(({ text, error }) =>
      send({ type: "slot_response", slot: "A", modelId: modelA, text, error }),
    ),
    callModel(modelB, msgs, apiKey, 768, 0.7).then(({ text, error }) =>
      send({ type: "slot_response", slot: "B", modelId: modelB, text, error }),
    ),
  ]);

  send({ type: "done" });
  res.end();
});

/* ── GET /api/openrouter/models ──────────────────────────────────────────────
   Proxies the OpenRouter free-models list (no auth required to list).
   ─────────────────────────────────────────────────────────────────────────── */
router.get("/models", async (_req: Request, res: Response) => {
  try {
    const r = await fetch("https://openrouter.ai/api/v1/models");
    if (!r.ok) { res.json({ data: [] }); return; }
    const json = await r.json() as { data: { id: string; pricing: { prompt: string } }[] };
    res.json({ data: json.data.filter((m) => m.pricing?.prompt === "0") });
  } catch {
    res.json({ data: [] });
  }
});

export default router;
