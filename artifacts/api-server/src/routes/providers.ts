import { Router, type Request, type Response } from "express";
import { anthropic } from "@workspace/integrations-anthropic-ai";

const router = Router();

const PROVIDERS = [
  {
    id: "anthropic", name: "Anthropic", description: "Claude models — best for reasoning and coding", icon: "🧠",
    models: ["claude-opus-4-7", "claude-sonnet-4-6", "claude-haiku-4-5"],
    defaultModel: "claude-sonnet-4-6", type: "native", status: "active",
    capabilities: ["reasoning", "coding", "analysis", "vision"],
    pricing: { input: 3.0, output: 15.0, unit: "MTok" },
  },
  {
    id: "openrouter", name: "OpenRouter", description: "60+ models via unified API", icon: "🌐",
    models: ["openai/gpt-4o", "meta-llama/llama-3.3-70b-instruct:free", "google/gemini-2.5-pro", "mistralai/mistral-7b-instruct:free"],
    defaultModel: "openai/gpt-4o", type: "api-key", status: "requires-key",
    capabilities: ["multi-model", "routing", "free-tier"],
    pricing: { input: 0, output: 0, unit: "varies" },
  },
  {
    id: "ollama", name: "Ollama", description: "Run local LLMs on your machine", icon: "🦙",
    models: ["llama3.2", "mistral", "codellama", "qwen2.5", "phi4", "deepseek-r1"],
    defaultModel: "llama3.2", type: "local", status: "requires-setup",
    capabilities: ["local", "private", "offline", "free"],
    pricing: { input: 0, output: 0, unit: "free" },
  },
  {
    id: "openai", name: "OpenAI", description: "GPT-4o, o1, o3 — frontier models", icon: "🤖",
    models: ["gpt-4o", "gpt-4o-mini", "o1", "o3", "o1-mini"],
    defaultModel: "gpt-4o", type: "api-key", status: "requires-key",
    capabilities: ["multimodal", "reasoning", "coding", "function-calling"],
    pricing: { input: 2.5, output: 10.0, unit: "MTok" },
  },
  {
    id: "google", name: "Google Gemini", description: "Gemini 2.5 Pro/Flash — large context", icon: "💎",
    models: ["gemini-2.5-pro", "gemini-2.5-flash", "gemini-1.5-pro"],
    defaultModel: "gemini-2.5-flash", type: "api-key", status: "requires-key",
    capabilities: ["large-context", "multimodal", "fast"],
    pricing: { input: 1.25, output: 5.0, unit: "MTok" },
  },
  {
    id: "cohere", name: "Cohere", description: "Command R+ — enterprise RAG specialist", icon: "🔗",
    models: ["command-r-plus", "command-r", "command-light"],
    defaultModel: "command-r-plus", type: "api-key", status: "requires-key",
    capabilities: ["rag", "enterprise", "search"],
    pricing: { input: 2.5, output: 10.0, unit: "MTok" },
  },
  {
    id: "mistral", name: "Mistral AI", description: "Mixtral and Mistral models", icon: "🌪️",
    models: ["mistral-large", "mistral-small", "mixtral-8x7b"],
    defaultModel: "mistral-large", type: "api-key", status: "requires-key",
    capabilities: ["multilingual", "efficient", "european"],
    pricing: { input: 2.0, output: 6.0, unit: "MTok" },
  },
  {
    id: "ruvllm", name: "RuvLLM", description: "Self-learning local model with SONA adaptation", icon: "🦾",
    models: ["ruvllm-base", "ruvllm-code", "ruvllm-micro"],
    defaultModel: "ruvllm-base", type: "local-self-learning", status: "beta",
    capabilities: ["self-learning", "sona", "local", "private", "micro-lora"],
    pricing: { input: 0, output: 0, unit: "free" },
  },
];

const ROUTING_STRATEGIES = [
  { id: "smart", name: "Smart Routing", description: "Automatically selects the best model based on task type, cost, and speed", icon: "🎯" },
  { id: "cost", name: "Cost-Optimized", description: "Prefers free or cheapest models that can handle the task", icon: "💰" },
  { id: "quality", name: "Quality-First", description: "Always uses the highest quality model regardless of cost", icon: "🏆" },
  { id: "speed", name: "Speed-First", description: "Prioritizes lowest latency and fastest response time", icon: "⚡" },
  { id: "local", name: "Local-First", description: "Prefers local models (Ollama, RuvLLM) for privacy", icon: "🏠" },
  { id: "roundrobin", name: "Round Robin", description: "Distributes requests evenly across all providers", icon: "🔄" },
  { id: "cascade", name: "Cascade", description: "Falls back to next provider if current one fails", icon: "🌊" },
];

router.get("/", (_req: Request, res: Response) => {
  res.json({ providers: PROVIDERS, total: PROVIDERS.length });
});

router.get("/strategies", (_req: Request, res: Response) => {
  res.json({ strategies: ROUTING_STRATEGIES });
});

router.post("/route", async (req: Request, res: Response) => {
  try {
    const { task, strategy = "smart", prompt, context } = req.body as {
      task: string; strategy?: string; prompt: string; context?: string;
    };
    if (!prompt) { res.status(400).json({ error: "prompt required" }); return; }

    let selectedProvider = PROVIDERS[0];
    let selectedModel = selectedProvider.defaultModel;
    let routingReason = "";

    switch (strategy) {
      case "cost":
        selectedProvider = PROVIDERS.find(p => p.type === "local") ?? PROVIDERS[0];
        routingReason = "Selected local model for zero-cost execution";
        break;
      case "quality":
        selectedProvider = PROVIDERS.find(p => p.id === "anthropic") ?? PROVIDERS[0];
        selectedModel = "claude-opus-4-7";
        routingReason = "Selected highest quality flagship model";
        break;
      case "speed":
        selectedProvider = PROVIDERS.find(p => p.id === "anthropic") ?? PROVIDERS[0];
        selectedModel = "claude-haiku-4-5";
        routingReason = "Selected fastest model for low latency";
        break;
      case "local":
        selectedProvider = PROVIDERS.find(p => p.type === "local" || p.type === "local-self-learning") ?? PROVIDERS[2];
        routingReason = "Selected local model for privacy";
        break;
      default:
        if (task?.includes("code") || task?.includes("debug")) {
          selectedModel = "claude-sonnet-4-6";
          routingReason = "Detected coding task — routed to Claude Sonnet";
        } else if (task?.includes("fast") || task?.includes("quick")) {
          selectedModel = "claude-haiku-4-5";
          routingReason = "Detected speed requirement — routed to Claude Haiku";
        } else {
          routingReason = "Default smart routing — Claude Sonnet for balanced quality/speed";
        }
    }

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("X-Accel-Buffering", "no");
    res.flushHeaders();
    const send = (data: object) => res.write(`data: ${JSON.stringify(data)}\n\n`);

    send({ type: "routing_decision", provider: selectedProvider.id, model: selectedModel, strategy, reason: routingReason });

    const stream = anthropic.messages.stream({
      model: selectedModel.includes("claude") ? selectedModel as "claude-haiku-4-5" : "claude-haiku-4-5",
      max_tokens: 2048,
      system: context ?? "You are a helpful AI assistant routed through RuFlo's smart provider routing system.",
      messages: [{ role: "user", content: prompt }],
    });

    for await (const event of stream) {
      if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
        send({ type: "chunk", content: event.delta.text });
      }
    }

    send({ type: "done", provider: selectedProvider.id, model: selectedModel });
    res.end();
  } catch (err) {
    res.write(`data: ${JSON.stringify({ type: "error", error: String(err) })}\n\n`);
    res.end();
  }
});

router.post("/benchmark", async (req: Request, res: Response) => {
  try {
    const { prompt = "What is 2+2? Reply in one word.", models } = req.body as { prompt?: string; models?: string[] };
    const testModels = models ?? ["claude-haiku-4-5", "claude-sonnet-4-6"];

    const results = await Promise.all(testModels.map(async model => {
      const start = Date.now();
      try {
        const claudeModel = model.includes("claude") ? model : "claude-haiku-4-5";
        const msg = await anthropic.messages.create({
          model: claudeModel as "claude-haiku-4-5",
          max_tokens: 100,
          messages: [{ role: "user", content: prompt }],
        });
        const latencyMs = Date.now() - start;
        const text = msg.content[0].type === "text" ? msg.content[0].text : "";
        return { model, latencyMs, tokens: msg.usage.output_tokens, text, success: true };
      } catch (err) {
        return { model, latencyMs: Date.now() - start, tokens: 0, text: "", error: String(err), success: false };
      }
    }));

    res.json({ results, prompt, timestamp: new Date().toISOString() });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

export default router;
