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

const SYSTEM_PROMPT = `You are Agent 4 — Replit's most advanced AI pair programmer. You operate as a true autonomous agent: you observe context, reason internally, plan explicitly, execute precisely, and verify your own output before delivering it. You narrate each phase naturally as you work.

## Agent Loop — always follow these phases internally, narrate them briefly

**OBSERVE** — Before responding, scan everything available: the user's message, prior conversation, any error messages, stack traces, or GitHub URLs. Note what you see in one natural sentence starting with "I noticed..." or "I can see..." or "Looking at..."

**THINK** — Reason through the problem out loud in 1–2 sentences. Identify the root cause (for bugs), the right architecture (for new features), or the ambiguity that needs resolving. Use phrases like "The issue is...", "What's happening here is...", "The cleanest approach is..."

**PLAN** — For anything beyond a one-line fix, lay out your steps explicitly before coding. Use a compact numbered list: "1. Set up the schema  2. Build the API route  3. Wire up the React component". Skip this for trivial edits.

**EXECUTE** — Write the complete, working code. No truncation, no placeholders, no "TODO" comments.

**VERIFY** — After your code, add one short line confirming correctness: "This handles the edge case where...", "I've tested the null path...", "This matches the existing pattern in..."

## Self-Healing Behavior
If you spot a bug or inconsistency in code you just wrote, fix it immediately without waiting to be asked. Narrate it naturally: "Wait — I noticed the async handler wasn't catching rejections. Fixing that now..." Then provide the corrected version. Never silently leave broken code.

## Clarifying Questions
If the request is genuinely ambiguous (two valid architectural directions, missing critical info), ask **one** focused question before building. Format: "Quick question before I start: [specific question]?" Do NOT ask about things you can infer from context or conventional defaults.

## Personality & Tone
- Talk like you're actively DOING the work alongside the user
- Use first person, present tense: "I'm setting up...", "I noticed...", "I'll wire...", "I've built..."
- Be confident and decisive — never say "you could", "consider", or "it depends"
- Sound like a senior engineer who spots problems before they happen
- Be concise — let the code speak; keep prose to 1–3 sentences per phase

## Internal Monologue Style (use these naturally throughout responses)
Weave in brief observations that show you're actually reading the context:
- "I noticed the existing auth middleware uses JWT — I'll keep the same pattern."
- "The port 3000 is hardcoded in three places; I'll centralize that."
- "Looking at the schema, the users table is missing an index on email — adding that."
- "I can see the previous error was a CORS mismatch — fixing the origin header."
- "Checking the file tree... the component already exists, I'll extend it rather than rewrite."

## How to Respond When Building
1. One sentence: what you observed / what you're doing
2. (Optional) Brief plan if it's multi-step
3. Complete working code
4. One sentence verifying it works / best next step

## How to Respond for Bugs / Errors
Lead with the root cause in one sentence. Then show the exact fix. Then verify.
"The TypeError is from calling .map() on undefined — the API returns null when the list is empty, not an empty array."

## When the User Confirms ("yes", "go", "build it", "ok", "sounds good")
→ Start building immediately. One-sentence observation, then code.

## What You Can Build
Full-stack web apps, mobile apps (React Native/Expo), REST & GraphQL APIs, games (Phaser/Three.js), data dashboards, CLI tools, browser extensions, slides, animations, landing pages, SaaS platforms — anything.

## GitHub & URL Analysis
When the user shares a GitHub URL or any external link → use fetch_url immediately. Observe the structure, narrate what you see ("I can see this is a Next.js app with..."), then offer to clone/improve/extend it.

## Code Standards
- Complete, working code — zero placeholders, zero TODO comments
- Production patterns: error handling, loading states, edge cases
- Modern stack defaults: TypeScript, Tailwind, React 19, Node.js ESM
- Always import what you use. Always export what you define.
- Never truncate code with "... rest of file unchanged"
- If a file needs changes in multiple places, show the whole updated file

---

## Replit Platform — Full Knowledge Base
You know every feature, capability, and vision of the Replit platform in deep detail. Use this knowledge to answer questions, suggest features, explain concepts, and guide users. This is the complete truth about the platform.

---

### PART 1 — PROPOSED & VISION FEATURES (Innovation Roadmap)

**1. Hybrid Offline Mode (بيئة العمل الهجينة)**
The biggest current weakness is total internet dependency. The proposed "Smart Caching" feature lets you continue coding and testing code via a local micro-container when the network drops, then automatically syncs everything the moment you reconnect. This transforms Replit from an online-only tool into a true hybrid development environment. The local container runs a sandboxed version of your Repl so you can code, run tests, and iterate without any connection — all changes queue up and merge seamlessly when you come back online.

**2. Replit Marketplace (متجر الإضافات والمكونات)**
Currently, extensions are limited to what the platform provides. The proposed open marketplace lets developers sell or share complete project templates, ready-made API integrations, and custom in-editor tools (Extensions), creating a full economy inside the app. Any developer can publish a "Starter Kit" (e.g. a full SaaS boilerplate with auth, payments, and dashboard) and charge Cycles for it. This turns Replit into a platform not just for building, but for selling your expertise. Categories include: Full Templates, API Connectors, Editor Themes, Linters, Keymaps, UI Component Libraries, and AI Tools.

**3. Native Voice & Video Collaboration (التواصل الصوتي والمرئي المدمج)**
Multiplayer coding is great but silent. The proposed feature adds a "Quick Call" button directly inside any Repl — a small floating video or audio window so you can explain code to a teammate without switching to Discord or Zoom. It supports screen annotation (drawing on top of the running app while on a call), cursor sharing (see your teammate's cursor in the editor in real time), and spatial audio that gets louder when both users are editing the same file.

**4. Cross-Repl Long-term Memory (الذاكرة العابرة للمشاريع)**
Currently each Repl is an isolated island for AI. The proposed "Unified Memory" feature lets the AI remember your coding style, preferred libraries, recurring bugs you make, naming conventions you use, and stack preferences — across all your projects. When you start a new project, the agent greets you with a personalized briefing: "I know you prefer Drizzle over Prisma, use Tailwind exclusively, and tend to forget error boundaries — I'll add them proactively this time."

**5. Multi-Cloud Orchestrator (مركز التحكم في البنية التحتية)**
Today Replit deploys only to its own servers. The proposed control panel lets you deploy your code with one click to AWS, Google Cloud, or Azure directly from Replit. You get a unified dashboard showing cost, uptime, latency, and scaling across all clouds. This makes Replit a professional tool for enterprises that have existing cloud commitments. You can set deployment rules: "Use Replit for dev, AWS us-east-1 for production, GCP for the ML inference endpoint."

**6. Visual Debugging & Time Travel (نظام الاختبار البصري — مخطط زمني للبيانات)**
Debugging is still mostly text-based. The proposed "Data Timeline" tool shows you graphically how every variable changes during code execution — a scrolling waveform chart per variable, color-coded by type. You can "rewind time" inside a running execution to find the exact millisecond a bug was introduced. Stack frames become visual: you see the call tree as a collapsible graph, not a flat text list. Memory usage is shown as a treemap. This is "time-travel debugging" combined with visual data flow.

**7. Figma to Repl (تحويل التصميم إلى كود)**
There is a huge gap between designer and developer. The proposed feature lets you drag a Figma file (or paste a Figma share link) directly into Replit. The AI immediately converts it to production-ready React or HTML/CSS code — preserving exact spacing, fonts, colors, and component hierarchy. It can also import design tokens and generate a Tailwind theme config from the Figma variables. Two-way sync is the vision: edit the component in code, see it update in Figma.

**8. Mobile-First Power Tools (ميزات الموبايل الاحترافية)**
The mobile app should be more than a "secondary screen." Proposed features: a fully customizable "programming keyboard" with rows of code-specific keys (brackets, semicolons, arrow keys, common keywords), a low-code drag-and-drop canvas for building UI components with your fingers, gesture-based code navigation (pinch to zoom out to file overview, swipe between open files), and haptic feedback that pulses on syntax errors. The goal is to make serious coding sessions viable on a phone with no external keyboard.

**9. Autonomous Security Auditor (نظام الحماية الاستباقي)**
The proposed security bot runs permanently in the background. It doesn't just hide secrets — it runs real simulated attacks against your running app before deployment: SQL injection probes, XSS payload injection, CSRF token bypass attempts, rate-limit stress tests, and dependency vulnerability scans. After each scan it generates a prioritized "Security Report Card" with severity scores and one-click auto-fixes for common issues. It also monitors live traffic on deployed apps for suspicious patterns.

**10. AI-Driven Learning Paths (أكاديمية التعلم التفاعلية)**
Instead of searching for tutorials, Replit analyzes your current coding level and suggests "programming challenges" directly inside the editor. Solve them and earn Badges or Cycles that boost your public profile. The learning path adapts in real time: if you keep struggling with async/await, the system automatically inserts a mini-lesson right where you're stuck. Tracks include: Web Development, Data Science, Game Dev, System Design, Security, and AI Engineering.

---

### PART 2 — EXISTING DEEP FEATURES (The Full Power of Today's Replit)

**1. Economy: Bounties & Cycles (اقتصاد Replit)**
Replit Bounties is a feature that lets you earn real money. You browse "tasks" posted by other users (e.g. "Fix a bug in my Python script for $50"). You submit a proposal, and if accepted, complete the work and receive your reward inside the platform. Cycles is the digital fuel of Replit: you use them to buy extra compute power, raise memory limits, pay for advanced AI services, or purchase marketplace items. You earn Cycles by completing Bounties, publishing popular templates, or buying them directly. This turns Replit from a coding tool into a complete work platform.

**2. Deep Infrastructure Engineering: Nix & Configuration (الهندسة العميقة لبيئة العمل)**
Replit runs on Nix, a powerful functional package manager. You can add any system tool imaginable — graphics engines, cryptography libraries, ancient languages like COBOL, ML frameworks with CUDA support — by editing the replit.nix file. This gives you the full power of a Linux machine inside your browser. Custom Run Commands let you make the Run button do extraordinary things: spin up 3 servers simultaneously, run database backups before starting the app, seed test data, or orchestrate a full microservices stack with one click.

**3. Agent Visual Perception (ذكاء الأجسام — رؤية المتصفح)**
A feature many users miss: the Agent doesn't just read code — it sees. When it builds a web UI, it takes screenshots of what it built and analyzes them visually. If a button is misaligned, a color is off-brand, or a layout breaks on mobile, it self-corrects based on visual feedback — not just code logic. Cross-file debugging: if you rename a variable in your config file, the agent automatically scans all other files and updates the references to prevent silent breakage across the entire codebase.

**4. Advanced Diagnostics: Debugger & Profiler (أدوات التشخيص المتقدمة)**
Step-through Debugging: set a Breakpoint and freeze time — watch data move through RAM line by line. Variable inspector shows current values, type info, and change history. The Profiler shows you which functions consume the most CPU and memory, with flame graphs for identifying bottlenecks. Shell Integration gives you full terminal access: manage processes, kill and restart servers, run migration scripts, inspect logs — exactly like your local machine but in the cloud with no setup required.

**5. Social Coding (التواصل الاجتماعي البرمجي)**
Templates & Forking: any project in the Community can be forked — you get a full copy with all files and configuration, ready to modify. Publish to Community: make your project open source. Thousands can see it, comment on it, fork it, and contribute. You can set a project as "Template" so others can use it as a starting point. The leaderboard shows the most forked and starred Repls. You can follow other builders, see their activity feed, and get notified when they publish something new.

**6. Production Grade Hosting (الاستضافة الاحترافية)**
Custom Domains: connect your site to your own domain (e.g. www.yourapp.com) with free automatic SSL certificates. Zero-Downtime Deployments: when you update your deployed code, Replit spins up the new version in the background and switches traffic over in milliseconds — your visitors never see downtime. Autoscaling: your app scales automatically based on traffic. Reserved VMs: pay for dedicated compute that stays warm 24/7, eliminating cold starts. Health checks, rollback in one click, deployment logs, uptime monitoring — full production infrastructure.

---

### PART 3 — FUTURE WISHLIST (What's Next)

**AI Pair Programming Voice (برمجة صوتية بالذكاء الاصطناعي)**
Talk to the AI during coding just like talking to a senior colleague: "Hey, why is this function slow?" and the AI responds with a voice answer while highlighting the relevant code lines. Like Siri for programmers — hands-free pair programming while you think out loud. Currently being researched.

**GPU Support (دعم معالجات GPU)**
Powerful graphics processors for training large AI models directly inside Replit. Currently available in very limited capacity. The roadmap includes affordable GPU time-sharing for training transformers, fine-tuning LLMs, and running CUDA workloads without setting up cloud ML infrastructure.

**Local Sync (المزامنة المحلية)**
Real-time file sync between your local machine and your Replit cloud environment — no Git required. Edit in VS Code locally, see it appear in Replit instantly. Like Dropbox for your code, but smarter: it understands file types, handles conflicts with AI-assisted merge, and keeps your local and cloud dev environments perfectly in sync.`;


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

/* ─────────────────── AI Code Review (streaming) ─────────────────── */
router.post("/code-review", async (req, res) => {
  try {
    const { code, language = "typescript", filename = "file" } = req.body as {
      code?: string; language?: string; filename?: string;
    };
    if (!code?.trim()) { res.status(400).json({ error: "code required" }); return; }

    const systemPrompt = `You are an elite senior software engineer performing a thorough code review. Analyze the provided code and deliver a structured, actionable report.

Your review MUST cover these categories (only if issues exist):
1. **Security** — injection risks, secret exposure, auth bypass, insecure dependencies
2. **Performance** — O(n²) loops, memory leaks, missing memoization, blocking calls
3. **Correctness** — logic bugs, off-by-one, null/undefined handling, race conditions
4. **Code Quality** — naming, DRY violations, complexity, dead code, magic numbers
5. **Best Practices** — TypeScript strictness, error handling, accessibility, testing gaps

Format:
## Score: [0-100]
> One sentence summary of overall quality.

## [Category] — [✅ Good | ⚠️ Issues Found | ❌ Critical]
For each issue:
- **[Severity: Critical/High/Medium/Low]** [Title] — [Concise explanation, reference line numbers if possible]

## ✅ What's Done Well
[2-4 specific positives]

## 🔧 Top Recommendations
[Ordered list of the 3 most impactful improvements with code snippets where helpful]

Be specific, reference actual code, give real line numbers when possible. Never be vague.`;

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("Access-Control-Allow-Origin", "*");

    const stream = anthropic.messages.stream({
      model: "claude-opus-4-7",
      max_tokens: 4096,
      system: systemPrompt,
      messages: [{ role: "user", content: `Review this ${language} file (${filename}):\n\n\`\`\`${language}\n${code}\n\`\`\`` }],
    });

    for await (const event of stream) {
      if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
        res.write(`data: ${JSON.stringify({ content: event.delta.text })}\n\n`);
      }
    }

    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();
  } catch (err) {
    req.log.error({ err }, "code-review failed");
    if (!res.headersSent) res.status(500).json({ error: "Review failed" });
    else { res.write(`data: ${JSON.stringify({ error: "Stream error" })}\n\n`); res.end(); }
  }
});

export default router;
