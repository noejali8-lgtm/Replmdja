/* ==========================================================================
   GEMINI BYOK AGENT ROUTE
   Inspired by OpenGravity (https://github.com/ab-613/opengravity)
   Brings Antigravity's proactive agentic reasoning + tool-use to the project.

   Features integrated from OpenGravity:
   - BYOK (Bring Your Own Key): API key sent from frontend via X-Gemini-Key header
   - Proactive Agentic Reasoning with thinkingConfig (includeThoughts)
   - Tools: run_command, send_terminal_input, wait, write_file, read_file, list_files
   - Model selection: gemini-2.5-pro, gemini-2.5-flash, gemini-2.0-flash-exp, etc.
   - Antigravity system prompt: React/Vite playbook + interactive terminal rules
   - SSE streaming of thoughts, tool calls, and final text
   ========================================================================== */

import { Router, type Request, type Response } from "express";
import fs from "fs";
import path from "path";
import { execSync, exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);
const router = Router();
const WORKSPACE = path.resolve("/home/runner/workspace");

/* ══════════════════════════════════════════════════════════════
   PATH GUARD — prevent directory traversal
══════════════════════════════════════════════════════════════ */
function guardPath(rel: string): string | null {
  try {
    const abs = path.resolve(WORKSPACE, rel);
    return abs.startsWith(WORKSPACE) ? abs : null;
  } catch {
    return null;
  }
}

/* ══════════════════════════════════════════════════════════════
   INTERACTIVE TERMINAL STATE
   Tracks background processes for send_terminal_input + wait
   (mirroring OpenGravity's TerminalManager.sendAgentInput)
══════════════════════════════════════════════════════════════ */
interface BgProcess {
  pid: number;
  logFile: string;
  startedAt: number;
}
const bgProcesses = new Map<string, BgProcess>();

function toolRunCommand(command: string): Promise<string> {
  return new Promise((resolve) => {
    const logFile = `/tmp/gemini-agent-${Date.now()}.log`;
    let resolved = false;
    const timeout = 60000;

    const child = exec(command, {
      cwd: WORKSPACE,
      env: { ...process.env, FORCE_COLOR: "0" },
    });

    let stdout = "";
    let stderr = "";

    child.stdout?.on("data", (d: string) => { stdout += d; });
    child.stderr?.on("data", (d: string) => { stderr += d; });

    const timer = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        if (child.pid) {
          bgProcesses.set(String(child.pid), { pid: child.pid, logFile, startedAt: Date.now() });
        }
        resolve(`[Process running in background] PID=${child.pid ?? "?"}\n${stdout.slice(0, 2000)}`);
      }
    }, timeout);

    child.on("close", (code) => {
      clearTimeout(timer);
      if (!resolved) {
        resolved = true;
        const parts: string[] = [];
        if (stdout.trim()) parts.push(stdout.trim());
        if (stderr.trim()) parts.push(`[stderr]\n${stderr.trim()}`);
        if (parts.length === 0) parts.push(`(exit code ${code ?? 0})`);
        resolve(parts.join("\n").slice(0, 6000));
      }
    });

    child.on("error", (e) => {
      clearTimeout(timer);
      if (!resolved) {
        resolved = true;
        resolve(`Error: ${e.message}`);
      }
    });
  });
}

function toolSendTerminalInput(text: string): Promise<string> {
  for (const [, proc] of bgProcesses) {
    try {
      process.kill(proc.pid, 0);
      execSync(`echo -n ${JSON.stringify(text)} > /proc/${proc.pid}/fd/0 2>/dev/null || true`);
      return Promise.resolve(`Sent input "${text}" to PID ${proc.pid}`);
    } catch { /* process ended */ }
  }
  return Promise.resolve("No active background process found.");
}

async function toolWait(ms: number): Promise<string> {
  await new Promise(r => setTimeout(r, Math.min(ms, 30000)));
  const lines: string[] = [];
  for (const [, proc] of bgProcesses) {
    try {
      process.kill(proc.pid, 0);
      if (fs.existsSync(proc.logFile)) {
        const tail = fs.readFileSync(proc.logFile, "utf-8").slice(-2000);
        lines.push(`[PID ${proc.pid}] ${tail}`);
      }
    } catch {
      bgProcesses.delete(String(proc.pid));
    }
  }
  return lines.length > 0 ? lines.join("\n") : `Waited ${ms}ms — no background output.`;
}

function toolWriteFile(filePath: string, content: string): string {
  const abs = guardPath(filePath);
  if (!abs) return "Error: Path escapes workspace";
  try {
    fs.mkdirSync(path.dirname(abs), { recursive: true });
    fs.writeFileSync(abs, content, "utf-8");
    const lines = content.split("\n").length;
    return `✅ Written ${filePath} (${lines} lines)`;
  } catch (e) {
    return `Error: ${e instanceof Error ? e.message : String(e)}`;
  }
}

function toolReadFile(filePath: string, startLine?: number, endLine?: number): string {
  const abs = guardPath(filePath);
  if (!abs) return "Error: Path escapes workspace";
  try {
    if (!fs.existsSync(abs)) return `Error: File not found: ${filePath}`;
    const content = fs.readFileSync(abs, "utf-8");
    if (startLine !== undefined) {
      const lines = content.split("\n");
      const start = Math.max(0, startLine - 1);
      const end = endLine !== undefined ? endLine : lines.length;
      return lines.slice(start, end).join("\n");
    }
    const MAX = 8000;
    return content.length > MAX
      ? content.slice(0, MAX) + `\n...[truncated: ${content.length - MAX} more chars]`
      : content;
  } catch (e) {
    return `Error: ${e instanceof Error ? e.message : String(e)}`;
  }
}

function toolListFiles(directory?: string): string {
  const dir = directory ?? ".";
  const abs = guardPath(dir);
  if (!abs) return "Error: Path escapes workspace";
  try {
    const results: string[] = [];
    function walk(d: string, depth: number) {
      if (depth > 4) return;
      const entries = fs.readdirSync(d, { withFileTypes: true });
      const SKIP = new Set(["node_modules", ".git", "dist", ".local", ".cache", ".pnpm"]);
      for (const e of entries) {
        if (SKIP.has(e.name)) continue;
        const rel = path.relative(WORKSPACE, path.join(d, e.name));
        results.push(e.isDirectory() ? `${rel}/` : rel);
        if (e.isDirectory()) walk(path.join(d, e.name), depth + 1);
      }
    }
    walk(abs, 0);
    return results.slice(0, 200).join("\n") || "Workspace is empty.";
  } catch (e) {
    return `Error: ${e instanceof Error ? e.message : String(e)}`;
  }
}

async function toolSearchFiles(pattern: string, directory?: string, fileExt?: string): Promise<string> {
  const dir = directory ?? ".";
  try {
    const ext = fileExt ? `--include="*.${fileExt}"` : "";
    const cmd = `grep -r ${JSON.stringify(pattern)} ${ext} --line-number --max-count=5 -l 2>/dev/null | head -20`;
    const { stdout } = await execAsync(cmd, { cwd: guardPath(dir) ?? WORKSPACE });
    return stdout.trim() || "(no matches)";
  } catch {
    return "(no matches)";
  }
}

async function toolExecuteCommand(command: string, cwd?: string, timeoutMs = 30000): Promise<string> {
  const workDir = cwd ? (guardPath(cwd) ?? WORKSPACE) : WORKSPACE;
  try {
    const { stdout, stderr } = await execAsync(command, {
      cwd: workDir,
      timeout: Math.min(timeoutMs, 120000),
      maxBuffer: 2 * 1024 * 1024,
      env: { ...process.env, FORCE_COLOR: "0" },
    });
    const parts: string[] = [];
    if (stdout.trim()) parts.push(stdout.trim());
    if (stderr.trim()) parts.push(`[stderr]\n${stderr.trim()}`);
    return parts.join("\n") || "(no output)";
  } catch (e) {
    const err = e as { stdout?: string; stderr?: string; code?: number };
    const parts = [`Exit code: ${err.code ?? "?"}`];
    if (err.stdout?.trim()) parts.push(err.stdout.trim());
    if (err.stderr?.trim()) parts.push(`[stderr]\n${err.stderr.trim()}`);
    return parts.join("\n");
  }
}

async function toolFetchUrl(url: string, maxChars = 8000): Promise<string> {
  try {
    const res = await fetch(url, { headers: { "User-Agent": "Antigravity-Agent/1.0" } });
    const text = await res.text();
    const truncated = text.length > maxChars
      ? text.slice(0, maxChars) + `\n...[truncated: ${text.length - maxChars} more chars]`
      : text;
    return `HTTP ${res.status}\n\n${truncated}`;
  } catch (e) {
    return `Fetch Error: ${e instanceof Error ? e.message : String(e)}`;
  }
}

/* ══════════════════════════════════════════════════════════════
   GEMINI TOOL DEFINITIONS
   (OpenGravity tools + extended set from the existing IDE agent)
══════════════════════════════════════════════════════════════ */
const GEMINI_TOOLS = [{
  functionDeclarations: [
    {
      name: "run_command",
      description: "Execute a CLI/bash command in the workspace. Returns stdout/stderr. Long-running commands return '[Process running in background]' with PID.",
      parameters: { type: "object", properties: { command: { type: "string", description: "The shell command to execute" } }, required: ["command"] }
    },
    {
      name: "send_terminal_input",
      description: "Send keystrokes (like 'y\\n' or 'n\\n') to the currently running background command. Use when a command waits for interactive input.",
      parameters: { type: "object", properties: { text: { type: "string", description: "Text to send (e.g. 'y\\n' to confirm a prompt)" } }, required: ["text"] }
    },
    {
      name: "wait",
      description: "Wait a specified number of milliseconds, then check background process output. Use after pnpm install or long-running commands.",
      parameters: { type: "object", properties: { milliseconds: { type: "number", description: "How many ms to wait (max 30000)" } }, required: ["milliseconds"] }
    },
    {
      name: "write_file",
      description: "Create or overwrite a file with complete content. ALWAYS use this for writing code — never show code in text.",
      parameters: { type: "object", properties: { path: { type: "string", description: "Relative path from workspace root" }, content: { type: "string", description: "Full file content" } }, required: ["path", "content"] }
    },
    {
      name: "read_file",
      description: "Read a file. Always read before editing an existing file. Supports start_line / end_line for large files.",
      parameters: { type: "object", properties: { path: { type: "string" }, start_line: { type: "number" }, end_line: { type: "number" } }, required: ["path"] }
    },
    {
      name: "list_files",
      description: "List all files and directories in the workspace recursively.",
      parameters: { type: "object", properties: { directory: { type: "string", description: "Sub-directory to list (default: workspace root)" } } }
    },
    {
      name: "search_files",
      description: "Search for a text pattern across all project files using grep.",
      parameters: { type: "object", properties: { pattern: { type: "string" }, directory: { type: "string" }, file_ext: { type: "string" } }, required: ["pattern"] }
    },
    {
      name: "execute_command",
      description: "Execute a shell command with optional timeout and working directory. Use for builds, package installs, git operations, etc.",
      parameters: { type: "object", properties: { command: { type: "string" }, cwd: { type: "string" }, timeout_ms: { type: "number" } }, required: ["command"] }
    },
    {
      name: "fetch_url",
      description: "Fetch a URL from the internet — websites, APIs, GitHub raw files, documentation.",
      parameters: { type: "object", properties: { url: { type: "string" }, max_chars: { type: "number" } }, required: ["url"] }
    },
    {
      name: "delete_file",
      description: "Delete a file or directory.",
      parameters: { type: "object", properties: { path: { type: "string" } }, required: ["path"] }
    },
    {
      name: "move_file",
      description: "Move or rename a file or directory.",
      parameters: { type: "object", properties: { from: { type: "string" }, to: { type: "string" } }, required: ["from", "to"] }
    }
  ]
}];

/* ══════════════════════════════════════════════════════════════
   ANTIGRAVITY SYSTEM PROMPT (from OpenGravity, enhanced)
══════════════════════════════════════════════════════════════ */
const ANTIGRAVITY_SYSTEM = `<identity>
You are Antigravity, a relentless, proactive, and interactive autonomous AI software engineer.
You live inside a full-stack development environment with a real Linux workspace.
You have access to the filesystem, terminal, package manager, database, and the internet.
</identity>

<execution_mandate>
- **PROACTIVE REASONING**: Plan your actions before executing. Explain what files you will read/write and why.
- **ZERO HESITATION**: Execute tasks immediately. Do not ask for permission — make autonomous decisions.
- **MAKE ASSUMPTIONS**: Choose frameworks and styling (React, Vite, Tailwind, etc.) autonomously unless told otherwise.
- **ALWAYS WRITE FILES**: Never show code in your text response. Always use write_file to create code.
- **READ BEFORE EDITING**: Always use read_file on any existing file before modifying it.
- **COMPLETE CODE**: Never truncate code with "// ... rest of file". Always write complete files.
</execution_mandate>

<react_vite_playbook>
CRITICAL: This is a pnpm monorepo. Use pnpm, not npm.

For new React+Vite projects:
1. Check workspace structure first with list_files
2. Install into the correct workspace: pnpm --filter @workspace/app-builder add <pkg>
3. Use Tailwind CSS v4 for styling
4. Use Wouter for routing (already installed)
5. Use Framer Motion for animations (already installed)
6. Use lucide-react for icons (already installed)
7. Place components in artifacts/app-builder/src/components/
8. Place pages in artifacts/app-builder/src/pages/
</react_vite_playbook>

<interactive_terminal_rules>
1. **Handling Prompts**: If command output ends with a prompt like "(y)" or "Ok to proceed?", use send_terminal_input with "y\\n".
2. **Waiting for install**: After pnpm install starts in background, use wait with 15000ms, then check if it finished. Keep waiting until "Done" appears.
3. **Long-running servers**: When pnpm run dev starts successfully ("ready in" / "Local: http"), the server is up. Stop — do not wait more.
4. **Read stderr**: If a command fails, read the error output carefully. Fix the root cause, not symptoms.
</interactive_terminal_rules>

<workspace_structure>
- artifacts/api-server/ — Express 5 API server (port 8000)
- artifacts/app-builder/ — Mobile-first React app (port 5000)
- artifacts/replit-ide/ — Desktop IDE React app (port 3001)
- lib/db/ — Drizzle ORM + PostgreSQL schema
- lib/api-zod/ — Zod schemas
- lib/integrations/ — Anthropic AI integration
</workspace_structure>`;

/* ══════════════════════════════════════════════════════════════
   SUPPORTED GEMINI MODELS (from OpenGravity + extended)
══════════════════════════════════════════════════════════════ */
export const GEMINI_MODELS = [
  { id: "gemini-2.5-pro-preview",    name: "Gemini 2.5 Pro",       desc: "Most capable — complex reasoning & coding", badge: "Best" },
  { id: "gemini-2.5-flash-preview",  name: "Gemini 2.5 Flash",     desc: "Fast & capable — recommended for most tasks", badge: "Recommended" },
  { id: "gemini-2.5-flash-lite-preview", name: "Gemini 2.5 Flash Lite", desc: "Ultra-fast & lightweight", badge: "Fast" },
  { id: "gemini-2.0-flash-exp",      name: "Gemini 2.0 Flash",     desc: "Experimental Flash with tool use", badge: "Stable" },
  { id: "gemini-2.0-pro-exp",        name: "Gemini 2.0 Pro",       desc: "Experimental Pro model", badge: "Exp" },
  { id: "gemini-1.5-pro",            name: "Gemini 1.5 Pro",       desc: "2M context window", badge: "2M ctx" },
  { id: "gemini-1.5-flash",          name: "Gemini 1.5 Flash",     desc: "Fast 1M context", badge: "1M ctx" },
  { id: "gemini-3.1-pro-preview",    name: "Gemini 3.1 Pro",       desc: "Latest generation — advanced reasoning", badge: "New" },
  { id: "gemini-3-flash-preview",    name: "Gemini 3 Flash",       desc: "Next-gen Flash model", badge: "New" },
  { id: "gemini-3.1-flash-lite",     name: "Gemini 3.1 Flash Lite", desc: "Lightweight next-gen model", badge: "New" },
];

/* ══════════════════════════════════════════════════════════════
   GET /api/gemini/models — list all supported models
══════════════════════════════════════════════════════════════ */
router.get("/models", (_req: Request, res: Response) => {
  res.json({ models: GEMINI_MODELS });
});

/* ══════════════════════════════════════════════════════════════
   POST /api/gemini/chat — single-turn non-agentic chat
   Uses BYOK key from X-Gemini-Key header (stored in localStorage)
══════════════════════════════════════════════════════════════ */
router.post("/chat", async (req: Request, res: Response) => {
  const apiKey = (req.headers["x-gemini-key"] as string) || req.body?.apiKey;
  if (!apiKey) {
    res.status(401).json({ error: "Gemini API key required. Send via X-Gemini-Key header." });
    return;
  }

  const { model = "gemini-2.5-flash-preview", messages = [], system } = req.body as {
    model?: string;
    messages: Array<{ role: "user" | "model"; content: string }>;
    system?: string;
  };

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders();

  const send = (data: object) => res.write(`data: ${JSON.stringify(data)}\n\n`);

  try {
    const contents = messages.map(m => ({
      role: m.role,
      parts: [{ text: m.content }],
    }));

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
    const body: Record<string, unknown> = {
      contents,
      generationConfig: {
        thinkingConfig: { includeThoughts: true, thinkingBudget: -1 },
      },
    };
    if (system) {
      body.systemInstruction = { parts: [{ text: system }] };
    }

    const geminiRes = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const raw = await geminiRes.text();
    let data: Record<string, unknown>;
    try {
      data = JSON.parse(raw) as Record<string, unknown>;
    } catch {
      send({ type: "error", error: "Failed to parse Gemini response" });
      res.end();
      return;
    }

    if (data.error) {
      const e = data.error as Record<string, unknown>;
      send({ type: "error", error: `Gemini API Error: ${e.message ?? String(e)}` });
      res.end();
      return;
    }

    const candidates = (data.candidates as Array<Record<string, unknown>>) ?? [];
    const parts = ((candidates[0]?.content as Record<string, unknown>)?.parts as Array<Record<string, unknown>>) ?? [];

    let thoughts = "";
    let text = "";
    for (const part of parts) {
      if (part.thought) {
        thoughts += (part.text as string) ?? "";
      } else if (part.text) {
        text += (part.text as string);
      }
    }

    if (thoughts) send({ type: "thought", content: thoughts });
    if (text) send({ type: "chunk", content: text });
    send({ type: "done", model });
    res.end();
  } catch (e) {
    send({ type: "error", error: String(e) });
    res.end();
  }
});

/* ══════════════════════════════════════════════════════════════
   POST /api/gemini/agent — full Antigravity agentic loop
   Inspired directly by OpenGravity's AgentManager.processUserQuery()
   Supports: run_command, send_terminal_input, wait, write_file,
             read_file, list_files, search_files, execute_command,
             fetch_url, delete_file, move_file
══════════════════════════════════════════════════════════════ */
router.post("/agent", async (req: Request, res: Response) => {
  const apiKey = (req.headers["x-gemini-key"] as string) || req.body?.apiKey;
  if (!apiKey) {
    res.status(401).json({ error: "Gemini API key required. Send via X-Gemini-Key header." });
    return;
  }

  const {
    model = "gemini-2.5-pro-preview",
    query,
    history = [],
    systemPrompt,
  } = req.body as {
    model?: string;
    query: string;
    history?: Array<{ role: string; parts: Array<Record<string, unknown>> }>;
    systemPrompt?: string;
  };

  if (!query) {
    res.status(400).json({ error: "query required" });
    return;
  }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders();

  const send = (data: object) => {
    try { res.write(`data: ${JSON.stringify(data)}\n\n`); } catch { /* disconnected */ }
  };

  const systemInstruction = systemPrompt ?? ANTIGRAVITY_SYSTEM;
  const internalHistory: Array<{ role: string; parts: Array<Record<string, unknown>> }> = [
    ...history,
    { role: "user", parts: [{ text: query }] },
  ];

  let iterations = 40;

  while (iterations > 0) {
    iterations--;

    try {
      send({ type: "thinking_start" });

      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const geminiRes = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: systemInstruction }] },
          contents: internalHistory,
          tools: GEMINI_TOOLS,
          generationConfig: {
            thinkingConfig: { includeThoughts: true, thinkingBudget: -1 },
          },
        }),
      });

      const rawText = await geminiRes.text();
      let parsed: Record<string, unknown>;
      try {
        parsed = JSON.parse(rawText) as Record<string, unknown>;
      } catch {
        send({ type: "error", error: "Failed to parse Gemini response" });
        break;
      }

      if (parsed.error) {
        const e = parsed.error as Record<string, unknown>;
        send({ type: "error", error: `Gemini API Error: ${e.message ?? String(e)}` });
        break;
      }

      const candidates = (parsed.candidates as Array<Record<string, unknown>>) ?? [];
      const responseContent = (candidates[0]?.content as Record<string, unknown>) ?? {};
      const parts = (responseContent.parts as Array<Record<string, unknown>>) ?? [];

      if (parts.length === 0) {
        send({ type: "error", error: "No response from Gemini" });
        break;
      }

      internalHistory.push({ role: "model", parts });

      let aggregatedThoughts = "";
      let finalText = "";
      const functionResponses: Array<Record<string, unknown>> = [];
      let hasToolCalls = false;

      for (const part of parts) {
        if (part.thought) {
          aggregatedThoughts += (part.text as string ?? "") + "\n\n";
        } else if (part.functionCall) {
          hasToolCalls = true;
          const call = part.functionCall as { name: string; args: Record<string, unknown> };

          if (aggregatedThoughts.trim()) {
            send({ type: "thought", content: aggregatedThoughts.trim() });
            aggregatedThoughts = "";
          }

          let resultData = "";

          switch (call.name) {
            case "run_command": {
              const cmd = call.args.command as string;
              send({ type: "tool_call", tool: "run_command", args: { command: cmd } });
              resultData = await toolRunCommand(cmd);
              send({ type: "tool_result", tool: "run_command", output: resultData.slice(0, 2000) });
              break;
            }
            case "send_terminal_input": {
              const text = call.args.text as string;
              send({ type: "tool_call", tool: "send_terminal_input", args: { text } });
              resultData = await toolSendTerminalInput(text);
              send({ type: "tool_result", tool: "send_terminal_input", output: resultData });
              break;
            }
            case "wait": {
              const ms = call.args.milliseconds as number;
              send({ type: "tool_call", tool: "wait", args: { ms } });
              resultData = await toolWait(ms);
              send({ type: "tool_result", tool: "wait", output: resultData });
              break;
            }
            case "write_file": {
              const fp = call.args.path as string;
              const content = call.args.content as string;
              send({ type: "tool_call", tool: "write_file", args: { path: fp, lines: content.split("\n").length } });
              resultData = toolWriteFile(fp, content);
              send({ type: "tool_result", tool: "write_file", output: resultData });
              break;
            }
            case "read_file": {
              const fp = call.args.path as string;
              send({ type: "tool_call", tool: "read_file", args: { path: fp } });
              resultData = toolReadFile(fp, call.args.start_line as number | undefined, call.args.end_line as number | undefined);
              send({ type: "tool_result", tool: "read_file", output: `Read ${fp} (${resultData.length} chars)` });
              break;
            }
            case "list_files": {
              send({ type: "tool_call", tool: "list_files", args: {} });
              resultData = toolListFiles(call.args.directory as string | undefined);
              send({ type: "tool_result", tool: "list_files", output: `Listed ${resultData.split("\n").length} files` });
              break;
            }
            case "search_files": {
              const pat = call.args.pattern as string;
              send({ type: "tool_call", tool: "search_files", args: { pattern: pat } });
              resultData = await toolSearchFiles(pat, call.args.directory as string | undefined, call.args.file_ext as string | undefined);
              send({ type: "tool_result", tool: "search_files", output: resultData });
              break;
            }
            case "execute_command": {
              const cmd = call.args.command as string;
              send({ type: "tool_call", tool: "execute_command", args: { command: cmd } });
              resultData = await toolExecuteCommand(cmd, call.args.cwd as string | undefined, call.args.timeout_ms as number | undefined);
              send({ type: "tool_result", tool: "execute_command", output: resultData.slice(0, 2000) });
              break;
            }
            case "fetch_url": {
              const fetchUrl = call.args.url as string;
              send({ type: "tool_call", tool: "fetch_url", args: { url: fetchUrl } });
              resultData = await toolFetchUrl(fetchUrl, call.args.max_chars as number | undefined);
              send({ type: "tool_result", tool: "fetch_url", output: `Fetched ${fetchUrl}` });
              break;
            }
            case "delete_file": {
              const fp = call.args.path as string;
              send({ type: "tool_call", tool: "delete_file", args: { path: fp } });
              const abs = guardPath(fp);
              if (!abs) {
                resultData = "Error: Path escapes workspace";
              } else {
                try { fs.rmSync(abs, { recursive: true, force: true }); resultData = `✅ Deleted: ${fp}`; }
                catch (e) { resultData = `Error: ${e instanceof Error ? e.message : String(e)}`; }
              }
              send({ type: "tool_result", tool: "delete_file", output: resultData });
              break;
            }
            case "move_file": {
              const from = call.args.from as string;
              const to = call.args.to as string;
              send({ type: "tool_call", tool: "move_file", args: { from, to } });
              const absFrom = guardPath(from);
              const absTo = guardPath(to);
              if (!absFrom || !absTo) {
                resultData = "Error: Path escapes workspace";
              } else {
                try {
                  fs.mkdirSync(path.dirname(absTo), { recursive: true });
                  fs.renameSync(absFrom, absTo);
                  resultData = `✅ Moved: ${from} → ${to}`;
                } catch (e) { resultData = `Error: ${e instanceof Error ? e.message : String(e)}`; }
              }
              send({ type: "tool_result", tool: "move_file", output: resultData });
              break;
            }
            default:
              resultData = `Unknown tool: ${call.name}`;
          }

          functionResponses.push({
            functionResponse: {
              name: call.name,
              response: { result: resultData.substring(0, 6000) },
            },
          });
        } else if (part.text && !part.thought) {
          finalText += (part.text as string);
        }
      }

      if (aggregatedThoughts.trim()) {
        send({ type: "thought", content: aggregatedThoughts.trim() });
      }

      if (functionResponses.length > 0) {
        internalHistory.push({ role: "user", parts: functionResponses });
      }

      if (!hasToolCalls && finalText) {
        send({ type: "text", content: finalText });
        send({ type: "done", model, iterations_used: 40 - iterations });
        return;
      }

      if (!hasToolCalls && !finalText) {
        send({ type: "done", model, iterations_used: 40 - iterations });
        return;
      }

    } catch (e) {
      send({ type: "error", error: `Agent error: ${e instanceof Error ? e.message : String(e)}` });
      break;
    }
  }

  send({ type: "done", model, stopped_reason: "max_iterations" });
  res.end();
});

/* ══════════════════════════════════════════════════════════════
   POST /api/gemini/validate-key — test a Gemini API key
══════════════════════════════════════════════════════════════ */
router.post("/validate-key", async (req: Request, res: Response) => {
  const apiKey = (req.headers["x-gemini-key"] as string) || req.body?.apiKey;
  if (!apiKey) { res.status(400).json({ valid: false, error: "No key provided" }); return; }

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`;
    const r = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: "Hi" }] }], generationConfig: { maxOutputTokens: 5 } }),
    });
    const data = await r.json() as Record<string, unknown>;
    if (data.error) {
      res.json({ valid: false, error: (data.error as Record<string, unknown>).message });
    } else {
      res.json({ valid: true, message: "API key is valid ✅" });
    }
  } catch (e) {
    res.json({ valid: false, error: String(e) });
  }
});

export default router;
