import { Router } from "express";
import { anthropic } from "@workspace/integrations-anthropic-ai";
import fs from "fs";
import path from "path";
import { execSync } from "child_process";

const router = Router();
const WORKSPACE = path.resolve("/home/runner/workspace");

/* ─── Tool Definitions ─── */
const IDE_AGENT_TOOLS = [
  {
    name: "write_file",
    description:
      "Create or update a file with given content. " +
      "Use this to actually write code — never just show code in text. " +
      "Always call read_file first before editing an existing file.",
    input_schema: {
      type: "object" as const,
      properties: {
        path: {
          type: "string",
          description:
            "Relative path from workspace root (e.g. artifacts/replit-ide/src/App.tsx)",
        },
        content: {
          type: "string",
          description:
            "Complete file content to write. Never truncate. Never use placeholders.",
        },
        description: {
          type: "string",
          description: "One sentence: what this file does / why you're writing it",
        },
      },
      required: ["path", "content"],
    },
  },
  {
    name: "read_file",
    description:
      "Read the content of an existing file. " +
      "Always read before editing so you preserve existing logic.",
    input_schema: {
      type: "object" as const,
      properties: {
        path: {
          type: "string",
          description: "Relative path from workspace root",
        },
      },
      required: ["path"],
    },
  },
  {
    name: "list_files",
    description:
      "List files and directories in a folder. " +
      "Use to understand project structure before starting work.",
    input_schema: {
      type: "object" as const,
      properties: {
        directory: {
          type: "string",
          description:
            "Relative path from workspace root. Defaults to '.' (workspace root).",
        },
      },
    },
  },
  {
    name: "search_files",
    description:
      "Search for a text pattern across all project files. " +
      "Use to find where a function, class, or import is defined before modifying it.",
    input_schema: {
      type: "object" as const,
      properties: {
        pattern: {
          type: "string",
          description: "Text or simple regex pattern to search for",
        },
        directory: {
          type: "string",
          description: "Directory to search in (default: workspace root)",
        },
      },
      required: ["pattern"],
    },
  },
  {
    name: "execute_command",
    description:
      "Execute a shell command in the workspace. " +
      "Use for safe read-only operations (ls, ps, which, netstat, node --version, etc.). " +
      "Set requires_approval=true for anything that installs, deletes, or modifies the system.",
    input_schema: {
      type: "object" as const,
      properties: {
        command: {
          type: "string",
          description: "Shell command to run",
        },
        requires_approval: {
          type: "boolean",
          description:
            "Set true if this command installs packages, deletes files, or modifies the system",
        },
        description: {
          type: "string",
          description: "What this command does and why you need it",
        },
      },
      required: ["command"],
    },
  },
] as const;

const IDE_SYSTEM_PROMPT = `You are Agent 4 — Replit's fully autonomous AI engineer embedded in the IDE.

## Core Principle: ACT, Don't Talk
You are a DOER. When asked to build something, BUILD it. When asked to fix something, FIX it.
You have real tool access to read, write, and search the file system.
NEVER describe code in text — ALWAYS use write_file to actually write it.

## Agentic Loop — Follow This Every Time

**1. ORIENT** — Understand what exists. Use list_files or read_file to see the actual codebase.
**2. THINK** — One sentence: "The issue is..." or "I'll create..." or "Looking at..."  
**3. EXECUTE** — Use write_file. Use search_files. Use read_file before editing.
**4. VERIFY** — One sentence confirming what was done and what the user should see.

## Self-Healing
If you spot a bug AFTER calling write_file, call write_file again immediately to fix it.
Narrate it: "Wait — I missed the async handler. Fixing now..."

## Mandatory Tool Rules
- NEVER show code in plain text. Always write_file.
- ALWAYS read_file before editing an existing file (to preserve existing logic)
- Use list_files at the start of complex tasks
- Use search_files before modifying a function/class/import to find the right location

## Communication
- Narrate what you're doing: "Reading the file structure...", "Writing the component..."
- Keep prose to 1–2 sentences between tool calls
- After write_file: one sentence on what was written and what's next
- After execute_command: one sentence on what the output means

## Stack & Standards
- TypeScript + React 19 + Tailwind CSS 4
- Dark theme: bg=#0d1117, surface=#161b22, border=#21262d, text=#e6edf3
- Complete files — zero truncation, zero TODO, zero placeholders
- Import everything you use. Export what you define.
- Error handling, loading states, edge cases — always included
`;

/* ─── Tool Executors ─── */

function toolWriteFile(params: { path: string; content: string }): string {
  try {
    const abs = path.resolve(WORKSPACE, params.path);
    if (!abs.startsWith(WORKSPACE)) return "Error: Path outside workspace";
    fs.mkdirSync(path.dirname(abs), { recursive: true });
    fs.writeFileSync(abs, params.content, "utf-8");
    const bytes = Buffer.byteLength(params.content, "utf-8");
    const lines = params.content.split("\n").length;
    return `Written ${params.path} — ${lines} lines, ${Math.round(bytes / 1024 * 10) / 10} KB`;
  } catch (e) {
    return `Error writing file: ${e instanceof Error ? e.message : String(e)}`;
  }
}

function toolReadFile(params: { path: string }): string {
  try {
    const abs = path.resolve(WORKSPACE, params.path);
    if (!abs.startsWith(WORKSPACE)) return "Error: Path outside workspace";
    if (!fs.existsSync(abs)) return `File not found: ${params.path}`;
    const stat = fs.statSync(abs);
    if (!stat.isFile()) return `Not a file: ${params.path}`;
    const content = fs.readFileSync(abs, "utf-8");
    const MAX = 10000;
    return content.length > MAX
      ? content.slice(0, MAX) + `\n\n...[truncated — ${content.length - MAX} chars omitted]`
      : content;
  } catch (e) {
    return `Error reading file: ${e instanceof Error ? e.message : String(e)}`;
  }
}

function toolListFiles(params: { directory?: string }): string {
  try {
    const dir = params.directory ?? ".";
    const abs = path.resolve(WORKSPACE, dir);
    if (!abs.startsWith(WORKSPACE)) return "Error: Path outside workspace";
    const SKIP = new Set(["node_modules", ".git", "dist", ".local", ".cache", "coverage", "__pycache__"]);

    function walk(p: string, prefix: string, depth: number): string[] {
      if (depth > 4) return [];
      let entries: fs.Dirent[];
      try {
        entries = fs.readdirSync(p, { withFileTypes: true });
      } catch {
        return [];
      }
      const dirs = entries.filter(e => e.isDirectory() && !SKIP.has(e.name));
      const files = entries.filter(e => e.isFile());
      dirs.sort((a, b) => a.name.localeCompare(b.name));
      files.sort((a, b) => a.name.localeCompare(b.name));
      const lines: string[] = [];
      for (const e of [...dirs, ...files]) {
        lines.push(`${prefix}${e.isDirectory() ? "📁" : "📄"} ${e.name}`);
        if (e.isDirectory()) {
          lines.push(...walk(path.join(p, e.name), prefix + "  ", depth + 1));
        }
      }
      return lines;
    }

    const result = walk(abs, "", 0);
    return result.length > 0 ? result.join("\n") : "(empty directory)";
  } catch (e) {
    return `Error listing files: ${e instanceof Error ? e.message : String(e)}`;
  }
}

function toolSearchFiles(params: { pattern: string; directory?: string }): string {
  try {
    const dir = params.directory ?? ".";
    const abs = path.resolve(WORKSPACE, dir);
    if (!abs.startsWith(WORKSPACE)) return "Error: Path outside workspace";
    const SKIP = new Set(["node_modules", ".git", "dist", ".local", ".cache"]);
    const pat = params.pattern.toLowerCase();
    const results: string[] = [];

    function search(p: string) {
      if (results.length > 100) return;
      let entries: fs.Dirent[];
      try {
        entries = fs.readdirSync(p, { withFileTypes: true });
      } catch {
        return;
      }
      for (const e of entries) {
        if (SKIP.has(e.name)) continue;
        const full = path.join(p, e.name);
        if (e.isDirectory()) {
          search(full);
        } else if (e.isFile()) {
          try {
            const content = fs.readFileSync(full, "utf-8");
            const lines = content.split("\n");
            for (let i = 0; i < lines.length; i++) {
              if (lines[i].toLowerCase().includes(pat)) {
                const rel = path.relative(WORKSPACE, full);
                results.push(`${rel}:${i + 1}: ${lines[i].trim()}`);
                if (results.length >= 100) return;
              }
            }
          } catch { /* binary file — skip */ }
        }
      }
    }

    search(abs);
    if (results.length === 0) return `No matches for "${params.pattern}"`;
    return results.join("\n") + (results.length >= 100 ? "\n...(limited to 100 results)" : "");
  } catch (e) {
    return `Error searching: ${e instanceof Error ? e.message : String(e)}`;
  }
}

const SAFE_CMD_PREFIXES = [
  "ls", "cat ", "echo ", "pwd", "which ", "node --version", "node -e",
  "pnpm --version", "npm --version", "npx --version",
  "ps aux", "netstat", "lsof -i", "curl -s", "grep ",
  "find ", "wc ", "head ", "tail ", "wc -l", "stat ",
];

function toolExecuteCommand(params: {
  command: string;
  requires_approval?: boolean;
  description?: string;
}): string {
  if (params.requires_approval) {
    return `APPROVAL_REQUIRED|${params.command}|${params.description ?? ""}`;
  }

  const isSafe = SAFE_CMD_PREFIXES.some(pfx =>
    params.command.trim().startsWith(pfx),
  );
  if (!isSafe) {
    return `APPROVAL_REQUIRED|${params.command}|${params.description ?? "Requires user approval"}`;
  }

  try {
    const out = execSync(params.command, {
      cwd: WORKSPACE,
      timeout: 8000,
      encoding: "utf-8",
      maxBuffer: 200 * 1024,
    });
    return (out ?? "").trim() || "(no output)";
  } catch (e) {
    const err = e as { stdout?: string; stderr?: string; message?: string };
    return `Exit error: ${err.stderr ?? err.stdout ?? err.message ?? String(e)}`;
  }
}

/* ─── SSE helper ─── */
type SsePayload = Record<string, unknown>;

function makeSend(res: import("express").Response) {
  return (data: SsePayload) => {
    try {
      res.write(`data: ${JSON.stringify(data)}\n\n`);
    } catch { /* client disconnected */ }
  };
}

/* ─── POST /api/ide-agent/stream ─── */
router.post("/stream", async (req, res) => {
  const {
    message,
    fileTree,
    currentFile,
    currentCode,
    history = [],
    model = "claude-sonnet-4-5",
  } = req.body as {
    message?: string;
    fileTree?: string;
    currentFile?: string;
    currentCode?: string;
    history?: { role: string; content: string }[];
    model?: string;
  };

  if (!message) {
    res.status(400).json({ error: "message is required" });
    return;
  }

  res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders();

  const send = makeSend(res);

  /* Build user message with file context */
  const ctxParts: string[] = [];
  if (currentFile) ctxParts.push(`## Current file: ${currentFile}`);
  if (currentCode) {
    const snippet = currentCode.length > 3000
      ? currentCode.slice(0, 3000) + "\n...[truncated for context]"
      : currentCode;
    ctxParts.push(`## Current file content:\n\`\`\`\n${snippet}\n\`\`\``);
  }
  if (fileTree) ctxParts.push(`## Project structure:\n${fileTree}`);

  const userContent = ctxParts.length > 0
    ? `${ctxParts.join("\n\n")}\n\n---\n\n${message}`
    : message;

  type AMsg =
    | { role: "user"; content: string | unknown[] }
    | { role: "assistant"; content: unknown[] };

  const messages: AMsg[] = [
    ...history.map(h => ({
      role: h.role as "user" | "assistant",
      content: h.content,
    })) as AMsg[],
    { role: "user", content: userContent },
  ];

  /* Agentic loop */
  const MAX_LOOPS = 12;
  let loopCount = 0;

  try {
    while (loopCount < MAX_LOOPS) {
      loopCount++;

      const response = await anthropic.messages.create({
        model,
        max_tokens: 8096,
        system: IDE_SYSTEM_PROMPT,
        tools: IDE_AGENT_TOOLS as never,
        messages: messages as never,
      });

      /* Stream any text content */
      for (const block of response.content) {
        if (block.type === "text" && block.text) {
          send({ type: "text_delta", content: block.text });
        }
      }

      if (response.stop_reason === "end_turn") {
        send({ type: "done" });
        break;
      }

      if (response.stop_reason === "tool_use") {
        const toolBlocks = response.content.filter((b: { type: string }) => b.type === "tool_use");
        if (toolBlocks.length === 0) {
          send({ type: "done" });
          break;
        }

        messages.push({ role: "assistant", content: response.content });

        const toolResults: {
          type: "tool_result";
          tool_use_id: string;
          content: string;
        }[] = [];

        for (const tb of toolBlocks) {
          if (tb.type !== "tool_use") continue;
          const { id, name, input } = tb;
          const params = input as Record<string, string | boolean | undefined>;

          send({ type: "tool_call", tool: name, params, id });

          let result = "";
          switch (name) {
            case "write_file":
              result = toolWriteFile(params as never);
              break;
            case "read_file":
              result = toolReadFile(params as never);
              break;
            case "list_files":
              result = toolListFiles(params as never);
              break;
            case "search_files":
              result = toolSearchFiles(params as never);
              break;
            case "execute_command":
              result = toolExecuteCommand(params as never);
              break;
            default:
              result = `Unknown tool: ${name}`;
          }

          /* Detect approval-required commands */
          if (result.startsWith("APPROVAL_REQUIRED|")) {
            const parts = result.split("|");
            send({
              type: "approval_required",
              id,
              command: parts[1] ?? "",
              description: parts[2] ?? "",
            });
            result = "Command pending user approval.";
          } else {
            send({ type: "tool_result", tool: name, result, id });
          }

          toolResults.push({ type: "tool_result", tool_use_id: id, content: result });
        }

        messages.push({ role: "user", content: toolResults as never });
        continue;
      }

      break;
    }

    if (loopCount >= MAX_LOOPS) {
      send({
        type: "text_delta",
        content: "\n\n⚠️ Agent reached the iteration limit. The task may be partially complete.",
      });
      send({ type: "done" });
    }
  } catch (e) {
    send({
      type: "error",
      message: e instanceof Error ? e.message : String(e),
    });
    send({ type: "done" });
  }
});

/* ─── POST /api/ide-agent/approve ─── */
router.post("/approve", (req, res) => {
  const { command } = req.body as { command?: string };
  if (!command) {
    res.status(400).json({ error: "command required" });
    return;
  }

  try {
    const out = execSync(command, {
      cwd: WORKSPACE,
      timeout: 30000,
      encoding: "utf-8",
      maxBuffer: 512 * 1024,
    });
    res.json({ ok: true, output: (out ?? "").trim() });
  } catch (e) {
    const err = e as { stdout?: string; stderr?: string; message?: string };
    res.json({ ok: false, output: err.stderr ?? err.stdout ?? err.message ?? String(e) });
  }
});

export default router;
