import { Router } from "express";
import { eq } from "drizzle-orm";
import { db } from "@workspace/db";
import { conversations as conversationsTable, messages as messagesTable } from "@workspace/db";
import { anthropic } from "@workspace/integrations-anthropic-ai";
import {
  CreateAnthropicConversationBody,
  SendAnthropicMessageBody,
} from "@workspace/api-zod";

const router = Router();

/* ── GitHub / URL fetch tool handler ── */
async function handleFetchUrl(toolInput: { url: string; type: string }): Promise<string> {
  const { url, type } = toolInput;
  try {
    const ghHeaders = {
      "Accept": "application/vnd.github.v3+json",
      "User-Agent": "Replit-Agent/1.0",
    };

    if (type === "github_repo") {
      const match = url.match(/github\.com[:/]([^/\s]+)\/([^/\s]+)/);
      if (!match) return "Invalid GitHub repository URL. Expected format: github.com/owner/repo";
      const owner = match[1];
      const repoName = match[2].replace(/\.git$/, "");

      const [repoRes, readmeRes, treeRes] = await Promise.all([
        fetch(`https://api.github.com/repos/${owner}/${repoName}`, { headers: ghHeaders }),
        fetch(`https://api.github.com/repos/${owner}/${repoName}/readme`, { headers: ghHeaders }),
        fetch(`https://api.github.com/repos/${owner}/${repoName}/git/trees/HEAD?recursive=1`, { headers: ghHeaders }),
      ]);

      const parts: string[] = [];

      if (repoRes.ok) {
        const d = await repoRes.json() as Record<string, unknown>;
        parts.push(
          `# Repository: ${d.full_name}\n` +
          `Description: ${d.description || "No description"}\n` +
          `Language: ${d.language || "Unknown"} | Stars: ${d.stargazers_count} | Forks: ${d.forks_count}\n` +
          `Default branch: ${d.default_branch}\n` +
          `Topics: ${(Array.isArray(d.topics) ? d.topics.join(", ") : "") || "None"}\n` +
          `Created: ${d.created_at} | Updated: ${d.updated_at}`
        );
      } else {
        parts.push(`Repository fetch failed (${repoRes.status}). The repo may be private or not exist.`);
      }

      if (readmeRes.ok) {
        const rd = await readmeRes.json() as { content: string };
        const content = Buffer.from(rd.content, "base64").toString("utf-8");
        const trimmed = content.length > 4000 ? content.slice(0, 4000) + "\n...[truncated]" : content;
        parts.push(`\n## README\n${trimmed}`);
      }

      if (treeRes.ok) {
        const td = await treeRes.json() as { tree: { path: string; type: string }[] };
        const files = td.tree.filter(f => f.type === "blob").slice(0, 60).map(f => f.path);
        parts.push(`\n## File Structure (${files.length} files)\n${files.join("\n")}`);
      }

      return parts.join("\n") || "Could not retrieve repository information";

    } else if (type === "github_file") {
      const match = url.match(/github\.com\/([^/]+)\/([^/]+)\/blob\/([^/]+)\/(.+)/);
      if (match) {
        const [, owner, repo, branch, path] = match;
        const rawUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${path}`;
        const res = await fetch(rawUrl, { headers: { "User-Agent": "Replit-Agent/1.0" } });
        if (res.ok) {
          const content = await res.text();
          const trimmed = content.length > 6000 ? content.slice(0, 6000) + "\n...[truncated]" : content;
          return `File: ${path}\n\n\`\`\`\n${trimmed}\n\`\`\``;
        }
      }
      return "Could not fetch the file. Check the URL format.";

    } else if (type === "github_tree") {
      const match = url.match(/github\.com\/([^/]+)\/([^/]+)/);
      if (match) {
        const [, owner, repo] = match;
        const res = await fetch(`https://api.github.com/repos/${owner}/${repo.replace(/\.git$/, "")}/contents/`, { headers: ghHeaders });
        if (res.ok) {
          const items = await res.json() as { name: string; type: string; size?: number }[];
          return items.map(f => `${f.type === "dir" ? "📁" : "📄"} ${f.name}${f.size ? ` (${f.size}b)` : ""}`).join("\n");
        }
      }
      return "Could not fetch directory listing";

    } else {
      const res = await fetch(url, {
        headers: { "User-Agent": "Replit-Agent/1.0" },
        signal: AbortSignal.timeout(10000),
      });
      if (res.ok) {
        const text = await res.text();
        return text.length > 5000 ? text.slice(0, 5000) + "\n...[truncated]" : text;
      }
      return `Fetch failed with status ${res.status}`;
    }
  } catch (e) {
    return `Error: ${e instanceof Error ? e.message : String(e)}`;
  }
}

/* ── Tool definitions for Anthropic ── */
const AGENT_TOOLS = [
  {
    name: "fetch_url",
    description:
      "Fetch content from any public URL including GitHub repositories, files, directories, and APIs. " +
      "Use this whenever the user mentions a GitHub URL or asks you to analyze an external resource.",
    input_schema: {
      type: "object" as const,
      properties: {
        url: {
          type: "string",
          description: "The URL to fetch (e.g. https://github.com/owner/repo or a raw file URL)",
        },
        type: {
          type: "string",
          enum: ["github_repo", "github_file", "github_tree", "url"],
          description:
            "github_repo: full repo overview + README + file tree | " +
            "github_file: single file content | " +
            "github_tree: directory listing | " +
            "url: generic URL fetch",
        },
      },
      required: ["url", "type"],
    },
  },
] as const;

const SYSTEM_PROMPT = `You are Agent — a world-class AI software builder powered by Claude, embedded inside Replit.
You can build web apps, mobile apps, APIs, games, data visualizations, slides, animations, and any software project.

## Your Capabilities
- **Build full-stack apps** with React, Node.js, Python, and 50+ languages
- **Browse GitHub repositories** — when a user shares a GitHub URL, use the fetch_url tool to read the repo, analyze its structure, and provide detailed insights
- **Fetch external URLs** — you can read any public URL to gather information
- **Parallel execution** — you work across multiple tasks simultaneously
- **Design & code** — you produce production-quality, deployable code

## How You Work
1. When a user shares a GitHub URL or any external link → **immediately use fetch_url to read it**
2. Analyze the structure, purpose, and code quality
3. Provide detailed, actionable insights or build upon it
4. Show clear project plans with architecture decisions
5. Deliver working, production-ready code

## Rules
- Always use fetch_url when a GitHub or external URL is in the user's message
- Be concise but thorough. Use markdown with headers, code blocks, and bullet points
- Think like a senior engineer: consider architecture, scalability, and best practices
- When building, provide real working code — never placeholders or pseudocode`;

const PLAN_MODE_SYSTEM_PROMPT = `You are a friendly AI project architect embedded inside Replit. Your role is to help users plan what to build before a single line of code is written. You think like a senior product manager and senior engineer combined.

## Your Approach
When the user shares an idea or any request:
1. NEVER write code, code blocks, or implementation details
2. Respond with a clear, exciting, structured project proposal
3. Always end by asking for confirmation or what they want to change

## Proposal Format — always use exactly this structure:

**🚀 [Project Name]**
[One punchy sentence: what it is and who it's for]

**✨ Features I'll build:**
• [Feature 1 — short, specific description]
• [Feature 2 — short, specific description]
• [Feature 3 — short, specific description]
• [Feature 4 — short, specific description]
• [Feature 5 — short, specific description]

**🛠 Stack:** [e.g. React + Node.js + PostgreSQL + Tailwind CSS]
**⏱ Complexity:** Simple / Medium / Complex
**📦 Deliverables:** [what they'll get: e.g. "Fully deployed web app with mobile-responsive UI"]

---
Ready to build this? Or would you like to adjust any features first?

## Conversation Rules
- NEVER write code or technical snippets
- Be enthusiastic, specific, and inspiring — avoid vague buzzwords
- If the user says "yes", "go ahead", "build it", "sounds good", "let's do it", or similar confirmations → respond ONLY with: "✅ Perfect! Building your project now — I'll start with the core structure and work through each feature systematically."
- If user wants changes → update the full proposal and ask again
- Always give strong, concrete feature suggestions even if the idea is vague
- If the GitHub or external URL tool is available and user shares a link, use it to understand what they want to clone/improve`;

const TURBO_SYSTEM_PROMPT = `You are Agent — a fast, focused AI software builder. You are in Turbo mode, optimized for speed and directness.

## Rules in Turbo Mode
- Be extremely concise — no fluff, no lengthy explanations
- Get to the point immediately
- Write complete, working code without excessive comments
- Skip preambles and conclusions
- Use short, clear responses
- Still use fetch_url when GitHub/external URLs are shared`;

/* ─────────────────── Routes ─────────────────── */

router.get("/conversations", async (req, res) => {
  try {
    const conversations = await db
      .select()
      .from(conversationsTable)
      .orderBy(conversationsTable.createdAt);
    res.json(conversations);
  } catch (err) {
    req.log.error({ err }, "Failed to list conversations");
    res.status(500).json({ error: "Failed to list conversations" });
  }
});

router.post("/conversations", async (req, res) => {
  try {
    const body = CreateAnthropicConversationBody.parse(req.body);
    const [conversation] = await db
      .insert(conversationsTable)
      .values({ title: body.title })
      .returning();
    res.status(201).json(conversation);
  } catch (err) {
    req.log.error({ err }, "Failed to create conversation");
    res.status(400).json({ error: "Invalid request body" });
  }
});

router.get("/conversations/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const [conversation] = await db
      .select()
      .from(conversationsTable)
      .where(eq(conversationsTable.id, id));

    if (!conversation) {
      res.status(404).json({ error: "Conversation not found" });
      return;
    }

    const messages = await db
      .select()
      .from(messagesTable)
      .where(eq(messagesTable.conversationId, id))
      .orderBy(messagesTable.createdAt);

    res.json({ ...conversation, messages });
  } catch (err) {
    req.log.error({ err }, "Failed to get conversation");
    res.status(500).json({ error: "Failed to get conversation" });
  }
});

router.delete("/conversations/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const [deleted] = await db
      .delete(conversationsTable)
      .where(eq(conversationsTable.id, id))
      .returning();

    if (!deleted) {
      res.status(404).json({ error: "Conversation not found" });
      return;
    }

    res.status(204).send();
  } catch (err) {
    req.log.error({ err }, "Failed to delete conversation");
    res.status(500).json({ error: "Failed to delete conversation" });
  }
});

router.get("/conversations/:id/messages", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const messages = await db
      .select()
      .from(messagesTable)
      .where(eq(messagesTable.conversationId, id))
      .orderBy(messagesTable.createdAt);
    res.json(messages);
  } catch (err) {
    req.log.error({ err }, "Failed to list messages");
    res.status(500).json({ error: "Failed to list messages" });
  }
});

router.post("/conversations/:id/messages", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const body = SendAnthropicMessageBody.parse(req.body);
    const turbo: boolean = !!(req.body as Record<string, unknown>).turbo;
    const planMode: boolean = !!(req.body as Record<string, unknown>).planMode;

    const [conversation] = await db
      .select()
      .from(conversationsTable)
      .where(eq(conversationsTable.id, id));

    if (!conversation) {
      res.status(404).json({ error: "Conversation not found" });
      return;
    }

    await db.insert(messagesTable).values({
      conversationId: id,
      role: "user",
      content: body.content,
    });

    const allMessages = await db
      .select()
      .from(messagesTable)
      .where(eq(messagesTable.conversationId, id))
      .orderBy(messagesTable.createdAt);

    const chatMessages = allMessages.map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    }));

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("Access-Control-Allow-Origin", "*");

    let fullResponse = "";

    /* ── Choose model and system prompt based on mode ── */
    const model = turbo ? "claude-haiku-4-5" : "claude-opus-4-7";
    const systemPrompt = planMode ? PLAN_MODE_SYSTEM_PROMPT : turbo ? TURBO_SYSTEM_PROMPT : SYSTEM_PROMPT;

    /* ── Agentic loop with tool use ── */
    const messages: { role: "user" | "assistant"; content: string }[] = [...chatMessages];

    while (true) {
      const response = await anthropic.messages.create({
        model,
        max_tokens: turbo ? 4096 : 8192,
        system: systemPrompt,
        tools: AGENT_TOOLS as unknown as Parameters<typeof anthropic.messages.create>[0]["tools"],
        messages,
      });

      /* Stream any text content */
      for (const block of response.content) {
        if (block.type === "text") {
          fullResponse += block.text;
          res.write(`data: ${JSON.stringify({ content: block.text })}\n\n`);
        }
      }

      /* If model wants to use a tool */
      if (response.stop_reason === "tool_use") {
        const toolUseBlock = response.content.find(b => b.type === "tool_use");
        if (!toolUseBlock || toolUseBlock.type !== "tool_use") break;

        /* Notify client that we're fetching */
        res.write(`data: ${JSON.stringify({ tool_call: { name: toolUseBlock.name, input: toolUseBlock.input } })}\n\n`);

        const toolResult = await handleFetchUrl(toolUseBlock.input as { url: string; type: string });

        /* Add assistant turn + tool result to message history */
        messages.push({
          role: "assistant",
          content: JSON.stringify(response.content),
        });
        messages.push({
          role: "user",
          content: JSON.stringify([{
            type: "tool_result",
            tool_use_id: toolUseBlock.id,
            content: toolResult,
          }]),
        });

        /* Continue the loop so model can respond with the tool result */
        continue;
      }

      /* Done */
      break;
    }

    await db.insert(messagesTable).values({
      conversationId: id,
      role: "assistant",
      content: fullResponse,
    });

    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();
  } catch (err) {
    req.log.error({ err }, "Failed to send message");
    if (!res.headersSent) {
      res.status(500).json({ error: "Failed to send message" });
    } else {
      res.write(`data: ${JSON.stringify({ error: "Stream error" })}\n\n`);
      res.end();
    }
  }
});

/* ── GitHub repo info endpoint (direct) ── */
router.get("/github/repo", async (req, res) => {
  const { url } = req.query as { url?: string };
  if (!url) {
    res.status(400).json({ error: "url query param required" });
    return;
  }
  try {
    const result = await handleFetchUrl({ url, type: "github_repo" });
    res.json({ content: result });
  } catch (err) {
    req.log.error({ err }, "GitHub fetch failed");
    res.status(500).json({ error: "Failed to fetch repository" });
  }
});

/* ── Stateless code-assist endpoint ── */
router.post("/code-assist", async (req, res) => {
  try {
    const { message, code, language, filename, history } = req.body as {
      message: string;
      code?: string;
      language?: string;
      filename?: string;
      history?: { role: "user" | "assistant"; content: string }[];
    };

    if (!message) {
      res.status(400).json({ error: "message is required" });
      return;
    }

    const systemPrompt = `You are an elite AI coding assistant embedded inside a Replit-like IDE. You are powered by Claude Opus — the most capable AI model available. You help developers write, debug, refactor, and understand code.

Current context:
- File: ${filename || "unknown"}
- Language: ${language || "unknown"}
${code ? `\nCurrent file content:\n\`\`\`${language || ""}\n${code}\n\`\`\`` : ""}

Your capabilities:
- Read and deeply understand the user's current code
- Suggest specific, precise edits with exact code snippets
- Debug errors with step-by-step explanations
- Refactor code for clarity, performance, and best practices
- Add new features to existing code
- Explain what any piece of code does
- Generate complete new components/functions/modules

Rules:
- Always reference the actual code when relevant (line numbers, variable names, function names)
- Provide code blocks with proper syntax highlighting hints
- Be concise but complete — no hand-waving, give real working code
- If suggesting changes, show the full updated code or the specific section to replace
- Use markdown formatting for clarity`;

    const messages: { role: "user" | "assistant"; content: string }[] = [
      ...(history || []),
      { role: "user", content: message },
    ];

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("Access-Control-Allow-Origin", "*");

    const stream = anthropic.messages.stream({
      model: "claude-opus-4-7",
      max_tokens: 8192,
      system: systemPrompt,
      messages,
    });

    for await (const event of stream) {
      if (
        event.type === "content_block_delta" &&
        event.delta.type === "text_delta"
      ) {
        res.write(`data: ${JSON.stringify({ content: event.delta.text })}\n\n`);
      }
    }

    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();
  } catch (err) {
    req.log.error({ err }, "code-assist failed");
    if (!res.headersSent) {
      res.status(500).json({ error: "AI request failed" });
    } else {
      res.write(`data: ${JSON.stringify({ error: "Stream error" })}\n\n`);
      res.end();
    }
  }
});

export default router;
