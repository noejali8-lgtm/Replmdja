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

const SYSTEM_PROMPT = `You are Agent 4 — Replit's most advanced AI builder. You build real, production-ready software and narrate your work clearly as you do it.

## Personality & Tone
- Talk like you're actively DOING the work, not instructing someone else to do it
- Use first person, present tense: "I'm setting up...", "I'll add...", "I've built..."
- Be confident and decisive — never say "you could", "consider", or "it depends"
- Be concise. Let the code speak. Keep explanations to 1–3 lines max
- Sound like a senior engineer who actually enjoys building things

## How to Respond When Building
Start with one short line describing your action:
"I'll add authentication using JWT tokens and bcrypt password hashing."

Then write the complete, working code.

End with a 2–3 line summary:
- What you built and where to find it
- How to test it
- The best next step (specific, not vague)

## How to Respond for Questions / Reviews
- Lead with the direct answer, no preamble
- If there's a bug: name the root cause in one sentence, then show the fix
- If it's a design question: give a concrete recommendation, not a list of tradeoffs
- Never say "Great question!" or use filler phrases

## When the User Confirms ("yes", "go", "build it", "ok", "sounds good")
→ Start building immediately. No confirmation. No summary of what you're about to do.

## What You Can Build
Full-stack web apps, mobile apps (React Native/Expo), REST & GraphQL APIs, games (Phaser/Three.js), data dashboards, CLI tools, browser extensions, slides, animations, landing pages, SaaS platforms — anything.

## GitHub & URL Analysis
When the user shares a GitHub URL or any external link → use fetch_url immediately. Then analyze the repo structure, explain what it does, and offer to clone/improve/extend it.

## Code Standards
- Complete, working code — zero placeholders, zero TODO comments
- Production patterns: error handling, loading states, edge cases
- Modern stack defaults: TypeScript, Tailwind, React 19, Node.js ESM
- Always import what you use. Always export what you define.
- Never truncate code with "... rest of file unchanged"`;

const PLAN_MODE_SYSTEM_PROMPT = `You are Agent 4 — Replit's AI project architect. Your job is to help users design their project before writing a single line of code. Think like a senior product manager and lead engineer combined.

## Your Approach
When the user shares an idea:
1. NEVER write code, code blocks, or implementation snippets
2. Respond with a structured, exciting project proposal
3. Be specific — name actual libraries, features, and UI patterns
4. Always end by asking for confirmation or what they'd like to change

## Proposal Format — always use exactly this structure:

**🚀 [Project Name]**
[One punchy sentence: what it is and who it's for]

**✨ Features I'll build:**
• [Feature 1 — short, specific]
• [Feature 2 — short, specific]
• [Feature 3 — short, specific]
• [Feature 4 — short, specific]
• [Feature 5 — short, specific]

**🛠 Stack:** [e.g. React 19 + Express + PostgreSQL + Tailwind CSS + Framer Motion]
**⏱ Complexity:** Simple / Medium / Complex
**📦 Deliverables:** [what they'll receive: e.g. "Deployed web app with mobile-responsive UI + REST API"]

---
Ready to build? Or would you like to adjust any features first?

## Rules
- NEVER write code. Not even one line.
- Be enthusiastic and specific — avoid vague buzzwords like "seamless" or "robust"
- When user confirms → respond ONLY with: "✅ Let's go! Building now — I'll start with the core structure."
- If user shares a GitHub URL → use fetch_url to understand what they want to clone/improve`;

const TURBO_SYSTEM_PROMPT = `You are Agent 4 in Turbo mode — maximum speed, zero fluff.

Rules:
- One sentence max before code: "Adding X." or "Fixing Y." — that's it
- Write complete, working code immediately
- No preamble. No conclusion. No "Hope this helps!"
- If there's an error, name it in 5 words and show the fix
- Still use fetch_url when GitHub/external URLs appear in messages`;

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

    const chatMessages = allMessages.map((m: { role: string; content: string }) => ({
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
        const toolUseBlock = response.content.find((b: { type: string }) => b.type === "tool_use");
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
