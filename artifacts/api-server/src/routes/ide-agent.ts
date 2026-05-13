import { Router } from "express";
import { anthropic } from "@workspace/integrations-anthropic-ai";
import { pool } from "@workspace/db";
import fs from "fs";
import path from "path";
import { execSync, exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);
const router = Router();
const WORKSPACE = path.resolve("/home/runner/workspace");

/* ══════════════════════════════════════════════════════════════
   TOOL DEFINITIONS — Full Permissions
══════════════════════════════════════════════════════════════ */
const IDE_AGENT_TOOLS = [
  /* ── Filesystem ── */
  {
    name: "write_file",
    description:
      "Create or overwrite a file with complete content. " +
      "ALWAYS use this instead of showing code in text. " +
      "Read the file first if it already exists to avoid losing logic.",
    input_schema: {
      type: "object" as const,
      properties: {
        path: { type: "string", description: "Relative path from workspace root" },
        content: { type: "string", description: "Full file content — never truncate, never use placeholders" },
      },
      required: ["path", "content"],
    },
  },
  {
    name: "read_file",
    description: "Read any file in the workspace. Always read before editing an existing file.",
    input_schema: {
      type: "object" as const,
      properties: {
        path: { type: "string", description: "Relative path from workspace root" },
        start_line: { type: "number", description: "Optional: first line to read (1-indexed)" },
        end_line: { type: "number", description: "Optional: last line to read (inclusive)" },
      },
      required: ["path"],
    },
  },
  {
    name: "list_files",
    description: "List files and directories recursively. Use at the start of complex tasks to understand structure.",
    input_schema: {
      type: "object" as const,
      properties: {
        directory: { type: "string", description: "Relative path. Defaults to workspace root." },
        depth: { type: "number", description: "Max depth (default 4)" },
      },
    },
  },
  {
    name: "search_files",
    description: "Search for any text/regex pattern across all project files. Use before modifying code to locate the right place.",
    input_schema: {
      type: "object" as const,
      properties: {
        pattern: { type: "string", description: "Text or regex pattern" },
        directory: { type: "string", description: "Directory to search (default: workspace root)" },
        file_ext: { type: "string", description: "Optional file extension filter e.g. 'ts' or 'tsx'" },
      },
      required: ["pattern"],
    },
  },
  {
    name: "delete_file",
    description: "Delete a file or directory (recursively). Use with care.",
    input_schema: {
      type: "object" as const,
      properties: {
        path: { type: "string", description: "Relative path to file or directory to delete" },
      },
      required: ["path"],
    },
  },
  {
    name: "move_file",
    description: "Move or rename a file or directory.",
    input_schema: {
      type: "object" as const,
      properties: {
        from: { type: "string", description: "Source relative path" },
        to: { type: "string", description: "Destination relative path" },
      },
      required: ["from", "to"],
    },
  },
  {
    name: "make_directory",
    description: "Create a directory and all parent directories.",
    input_schema: {
      type: "object" as const,
      properties: {
        path: { type: "string", description: "Relative path of directory to create" },
      },
      required: ["path"],
    },
  },

  /* ── Shell / System ── */
  {
    name: "execute_command",
    description:
      "Execute ANY shell command with full permissions — no restrictions. " +
      "Can install packages (pnpm add ...), run builds, start processes, delete files, git operations, curl, etc. " +
      "Commands run in the workspace root. Long-running commands (servers, watchers) use timeout of 30s. " +
      "Use this for: pnpm install, pnpm build, pnpm db:push, git add/commit/push, curl, node scripts, etc.",
    input_schema: {
      type: "object" as const,
      properties: {
        command: { type: "string", description: "Any shell command to execute" },
        cwd: { type: "string", description: "Working directory (relative, default: workspace root)" },
        timeout_ms: { type: "number", description: "Timeout in ms (default: 30000, max: 120000)" },
      },
      required: ["command"],
    },
  },
  {
    name: "execute_command_async",
    description:
      "Run a long-running command in the background and return its PID. " +
      "Use for starting dev servers, watchers, or any process that runs indefinitely. " +
      "Output is captured to a log file you can read later.",
    input_schema: {
      type: "object" as const,
      properties: {
        command: { type: "string", description: "Shell command to run in background" },
        log_file: { type: "string", description: "Relative path to capture stdout/stderr (e.g. /tmp/server.log)" },
        cwd: { type: "string", description: "Working directory (relative, default: workspace root)" },
      },
      required: ["command"],
    },
  },

  /* ── Package Management ── */
  {
    name: "install_packages",
    description:
      "Install npm/pnpm packages. Runs pnpm add in the specified workspace package. " +
      "Use for installing new dependencies into the project.",
    input_schema: {
      type: "object" as const,
      properties: {
        packages: {
          type: "array",
          items: { type: "string" },
          description: "List of package names to install (e.g. ['zod', 'express', '@types/node'])",
        },
        dev: { type: "boolean", description: "Install as devDependency (default: false)" },
        workspace: {
          type: "string",
          description: "Which workspace to install into (e.g. '@workspace/api-server', '@workspace/app-builder'). Omit for workspace root.",
        },
      },
      required: ["packages"],
    },
  },

  /* ── Database ── */
  {
    name: "query_database",
    description:
      "Execute any SQL query against the PostgreSQL database. " +
      "SELECT, INSERT, UPDATE, DELETE, CREATE TABLE, ALTER TABLE — all supported. " +
      "Returns rows as JSON.",
    input_schema: {
      type: "object" as const,
      properties: {
        sql: { type: "string", description: "SQL query to execute" },
        params: {
          type: "array",
          items: {},
          description: "Optional parameterized query values ($1, $2, ...)",
        },
      },
      required: ["sql"],
    },
  },
  {
    name: "push_db_schema",
    description: "Run drizzle-kit push to sync the Drizzle ORM schema to the database. Use after modifying schema files.",
    input_schema: {
      type: "object" as const,
      properties: {},
    },
  },

  /* ── Git ── */
  {
    name: "git",
    description:
      "Run any git command in the workspace. " +
      "Examples: status, add, commit, push, pull, checkout, branch, log, diff, stash, merge, rebase.",
    input_schema: {
      type: "object" as const,
      properties: {
        args: { type: "string", description: "Git arguments (everything after 'git'), e.g. 'commit -am \"fix: update auth\"'" },
      },
      required: ["args"],
    },
  },

  /* ── Internet / HTTP ── */
  {
    name: "fetch_url",
    description:
      "Fetch any URL from the internet — websites, APIs, GitHub repos, npm registry, documentation, etc. " +
      "Can send GET or POST with custom headers and body. Returns response body as text.",
    input_schema: {
      type: "object" as const,
      properties: {
        url: { type: "string", description: "Full URL to fetch" },
        method: { type: "string", description: "HTTP method: GET, POST, PUT, DELETE (default: GET)" },
        headers: {
          type: "object",
          description: "Optional HTTP headers as key-value pairs",
          additionalProperties: { type: "string" },
        },
        body: { type: "string", description: "Optional request body for POST/PUT" },
        max_chars: { type: "number", description: "Max response characters to return (default 8000)" },
      },
      required: ["url"],
    },
  },

  /* ── Process Management ── */
  {
    name: "list_processes",
    description: "List running processes. Useful for checking if a server is running, finding PIDs, etc.",
    input_schema: {
      type: "object" as const,
      properties: {
        filter: { type: "string", description: "Optional grep filter for process names" },
      },
    },
  },
  {
    name: "kill_process",
    description: "Kill a process by PID or port number.",
    input_schema: {
      type: "object" as const,
      properties: {
        pid: { type: "number", description: "Process ID to kill" },
        port: { type: "number", description: "Kill process listening on this port (uses fuser)" },
        signal: { type: "string", description: "Signal to send (default: SIGTERM)" },
      },
    },
  },

  /* ── Environment ── */
  {
    name: "get_env",
    description: "Read environment variables available in the current process.",
    input_schema: {
      type: "object" as const,
      properties: {
        keys: {
          type: "array",
          items: { type: "string" },
          description: "Specific keys to retrieve. Omit to get all non-sensitive vars.",
        },
      },
    },
  },
  {
    name: "set_env",
    description: "Write environment variables to a .env file for use in the project.",
    input_schema: {
      type: "object" as const,
      properties: {
        vars: {
          type: "object",
          description: "Key-value pairs to write",
          additionalProperties: { type: "string" },
        },
        file: { type: "string", description: "Target .env file (default: .env)" },
      },
      required: ["vars"],
    },
  },
] as const;

/* ══════════════════════════════════════════════════════════════
   SYSTEM PROMPT — Full Agent with All Permissions
══════════════════════════════════════════════════════════════ */
const IDE_SYSTEM_PROMPT = `You are Agent 4 — Replit's fully autonomous AI engineer with FULL SYSTEM ACCESS.

## You Have Complete Permissions
- ✅ Read, write, move, delete ANY file in the workspace
- ✅ Execute ANY shell command (pnpm, npm, node, bash, curl, git, etc.)
- ✅ Install or remove packages (pnpm add / pnpm remove)
- ✅ Run database queries (SELECT, INSERT, UPDATE, DELETE, DDL)
- ✅ Push schema changes to the database
- ✅ Run git operations (commit, push, pull, branch, merge)
- ✅ Fetch any URL from the internet (APIs, docs, GitHub, npm)
- ✅ Start/stop/kill processes
- ✅ Read environment variables
- ✅ Run build systems, test runners, linters, formatters

## Core Principle: ACT, Don't Talk
You are a DOER. When asked to build something, BUILD it immediately.
NEVER describe what you're about to do — just DO it using tools.
NEVER show code in plain text — ALWAYS write_file to actually create/edit it.

## Agentic Loop — Follow This Every Time

**1. ORIENT** — list_files or read_file to understand the actual codebase first.
**2. PLAN** — One silent sentence of intent (not shown to user).
**3. EXECUTE** — Use tools. write_file, execute_command, query_database, fetch_url — whatever it takes.
**4. VERIFY** — execute_command to check results (run the file, query the DB, curl the endpoint).
**5. HEAL** — If something is broken, fix it immediately without asking.

## Self-Healing Rules
- If write_file produces broken code, read_file and rewrite immediately.
- If execute_command fails, read the error, understand the cause, fix it, retry.
- If a package is missing, install_packages then retry.
- If a DB schema is wrong, push_db_schema then retry.
- Never stop and ask — keep going until the task is fully done and verified.

## Tool Usage Rules
- **Always** read_file before editing an existing file
- **Always** search_files before modifying a function to find the exact location
- **Always** list_files at the start of complex multi-file tasks
- **Always** execute_command to verify: run the script, curl the API, check the output
- **Install packages** when a dependency is missing — don't just tell the user to install
- **Query the database** to verify data was actually inserted/updated
- **Use git** to commit finished work when asked to deploy or ship

## Communication Style
- Narrate what you're doing in 1 sentence before each tool call
- After write_file: one sentence on what was written
- After execute_command: one sentence interpreting the output
- After query_database: one sentence on what the data shows
- If an error occurs: "Error: [what failed]. Fixing by [approach]..." then immediately fix

## Stack & Standards
- TypeScript + React 19 + Vite 7 + Tailwind CSS 4
- Dark theme: bg=#0d1117, surface=#161b22, border=#21262d, text=#e6edf3, accent=#58a6ff
- Express 5 + Drizzle ORM + PostgreSQL for backend
- Complete files — zero TODO, zero placeholders, zero truncation
- Always include error handling, loading states, and TypeScript types
- Import everything used. Export everything defined.
`;

/* ══════════════════════════════════════════════════════════════
   TOOL EXECUTORS
══════════════════════════════════════════════════════════════ */

function guardPath(p: string): string | null {
  const abs = path.resolve(WORKSPACE, p);
  if (!abs.startsWith(WORKSPACE)) return null;
  return abs;
}

/* ── write_file ── */
function toolWriteFile(p: { path: string; content: string }): string {
  try {
    const abs = guardPath(p.path);
    if (!abs) return "Error: Path escapes workspace";
    fs.mkdirSync(path.dirname(abs), { recursive: true });
    fs.writeFileSync(abs, p.content, "utf-8");
    const lines = p.content.split("\n").length;
    const kb = Math.round(Buffer.byteLength(p.content, "utf-8") / 102.4) / 10;
    return `✅ Written: ${p.path} (${lines} lines, ${kb} KB)`;
  } catch (e) {
    return `Error: ${e instanceof Error ? e.message : String(e)}`;
  }
}

/* ── read_file ── */
function toolReadFile(p: { path: string; start_line?: number; end_line?: number }): string {
  try {
    const abs = guardPath(p.path);
    if (!abs) return "Error: Path escapes workspace";
    if (!fs.existsSync(abs)) return `Not found: ${p.path}`;
    if (!fs.statSync(abs).isFile()) return `Not a file: ${p.path}`;
    let content = fs.readFileSync(abs, "utf-8");
    if (p.start_line !== undefined || p.end_line !== undefined) {
      const lines = content.split("\n");
      const start = Math.max(0, (p.start_line ?? 1) - 1);
      const end = p.end_line !== undefined ? p.end_line : lines.length;
      content = lines.slice(start, end).join("\n");
    }
    const MAX = 12000;
    if (content.length > MAX) {
      return content.slice(0, MAX) + `\n\n...[truncated: ${content.length - MAX} more chars. Use start_line/end_line to read sections.]`;
    }
    return content;
  } catch (e) {
    return `Error: ${e instanceof Error ? e.message : String(e)}`;
  }
}

/* ── list_files ── */
function toolListFiles(p: { directory?: string; depth?: number }): string {
  try {
    const dir = p.directory ?? ".";
    const abs = guardPath(dir);
    if (!abs) return "Error: Path escapes workspace";
    const MAX_DEPTH = p.depth ?? 4;
    const SKIP = new Set(["node_modules", ".git", "dist", ".local", ".cache", "coverage", "__pycache__", ".replit", ".upm"]);

    function walk(p: string, prefix: string, depth: number): string[] {
      if (depth > MAX_DEPTH) return [];
      let entries: fs.Dirent[];
      try { entries = fs.readdirSync(p, { withFileTypes: true }); } catch { return []; }
      const dirs = entries.filter(e => e.isDirectory() && !SKIP.has(e.name)).sort((a, b) => a.name.localeCompare(b.name));
      const files = entries.filter(e => e.isFile()).sort((a, b) => a.name.localeCompare(b.name));
      const lines: string[] = [];
      for (const e of [...dirs, ...files]) {
        lines.push(`${prefix}${e.isDirectory() ? "📁" : "📄"} ${e.name}`);
        if (e.isDirectory()) lines.push(...walk(path.join(p, e.name), prefix + "  ", depth + 1));
      }
      return lines;
    }

    const result = walk(abs, "", 0);
    return result.length > 0 ? result.join("\n") : "(empty)";
  } catch (e) {
    return `Error: ${e instanceof Error ? e.message : String(e)}`;
  }
}

/* ── search_files ── */
function toolSearchFiles(p: { pattern: string; directory?: string; file_ext?: string }): string {
  try {
    const dir = p.directory ?? ".";
    const abs = guardPath(dir);
    if (!abs) return "Error: Path escapes workspace";
    const SKIP = new Set(["node_modules", ".git", "dist", ".local", ".cache"]);
    const pat = p.pattern.toLowerCase();
    const results: string[] = [];
    const extFilter = p.file_ext ? `.${p.file_ext.replace(/^\./, "")}` : null;

    function search(p: string) {
      if (results.length >= 150) return;
      let entries: fs.Dirent[];
      try { entries = fs.readdirSync(p, { withFileTypes: true }); } catch { return; }
      for (const e of entries) {
        if (SKIP.has(e.name)) continue;
        const full = path.join(p, e.name);
        if (e.isDirectory()) { search(full); }
        else if (e.isFile()) {
          if (extFilter && !e.name.endsWith(extFilter)) continue;
          try {
            const content = fs.readFileSync(full, "utf-8");
            const lines = content.split("\n");
            for (let i = 0; i < lines.length; i++) {
              if (lines[i].toLowerCase().includes(pat)) {
                results.push(`${path.relative(WORKSPACE, full)}:${i + 1}: ${lines[i].trim()}`);
                if (results.length >= 150) return;
              }
            }
          } catch { /* binary */ }
        }
      }
    }

    search(abs);
    if (results.length === 0) return `No matches for "${p.pattern}"`;
    return results.join("\n") + (results.length >= 150 ? "\n...(150 result limit reached)" : "");
  } catch (e) {
    return `Error: ${e instanceof Error ? e.message : String(e)}`;
  }
}

/* ── delete_file ── */
function toolDeleteFile(p: { path: string }): string {
  try {
    const abs = guardPath(p.path);
    if (!abs) return "Error: Path escapes workspace";
    if (!fs.existsSync(abs)) return `Not found: ${p.path}`;
    const stat = fs.statSync(abs);
    if (stat.isDirectory()) {
      fs.rmSync(abs, { recursive: true, force: true });
      return `✅ Deleted directory: ${p.path}`;
    } else {
      fs.unlinkSync(abs);
      return `✅ Deleted file: ${p.path}`;
    }
  } catch (e) {
    return `Error: ${e instanceof Error ? e.message : String(e)}`;
  }
}

/* ── move_file ── */
function toolMoveFile(p: { from: string; to: string }): string {
  try {
    const absFrom = guardPath(p.from);
    const absTo = guardPath(p.to);
    if (!absFrom || !absTo) return "Error: Path escapes workspace";
    if (!fs.existsSync(absFrom)) return `Not found: ${p.from}`;
    fs.mkdirSync(path.dirname(absTo), { recursive: true });
    fs.renameSync(absFrom, absTo);
    return `✅ Moved: ${p.from} → ${p.to}`;
  } catch (e) {
    return `Error: ${e instanceof Error ? e.message : String(e)}`;
  }
}

/* ── make_directory ── */
function toolMakeDirectory(p: { path: string }): string {
  try {
    const abs = guardPath(p.path);
    if (!abs) return "Error: Path escapes workspace";
    fs.mkdirSync(abs, { recursive: true });
    return `✅ Created directory: ${p.path}`;
  } catch (e) {
    return `Error: ${e instanceof Error ? e.message : String(e)}`;
  }
}

/* ── execute_command (FULL PERMISSIONS — no allowlist) ── */
async function toolExecuteCommand(p: {
  command: string;
  cwd?: string;
  timeout_ms?: number;
}): Promise<string> {
  const cwd = p.cwd ? (guardPath(p.cwd) ?? WORKSPACE) : WORKSPACE;
  const timeout = Math.min(p.timeout_ms ?? 30000, 120000);
  try {
    const { stdout, stderr } = await execAsync(p.command, {
      cwd,
      timeout,
      maxBuffer: 2 * 1024 * 1024,
      env: { ...process.env, FORCE_COLOR: "0" },
    });
    const out = (stdout ?? "").trim();
    const err = (stderr ?? "").trim();
    const parts: string[] = [];
    if (out) parts.push(out);
    if (err) parts.push(`[stderr]\n${err}`);
    return parts.join("\n") || "(no output)";
  } catch (e) {
    const err = e as { stdout?: string; stderr?: string; message?: string; code?: number };
    const out = (err.stdout ?? "").trim();
    const se = (err.stderr ?? "").trim();
    const parts = [`Exit code: ${err.code ?? "?"}`];
    if (out) parts.push(out);
    if (se) parts.push(`[stderr]\n${se}`);
    return parts.join("\n");
  }
}

/* ── execute_command_async ── */
function toolExecuteCommandAsync(p: {
  command: string;
  log_file?: string;
  cwd?: string;
}): string {
  try {
    const cwd = p.cwd ? (guardPath(p.cwd) ?? WORKSPACE) : WORKSPACE;
    const logFile = p.log_file ?? `/tmp/agent-bg-${Date.now()}.log`;
    const shell = `nohup bash -c ${JSON.stringify(p.command)} > ${logFile} 2>&1 & echo $!`;
    const pid = execSync(shell, { cwd, encoding: "utf-8" }).trim();
    return `✅ Started background process PID=${pid}. Logs: ${logFile}`;
  } catch (e) {
    return `Error: ${e instanceof Error ? e.message : String(e)}`;
  }
}

/* ── install_packages ── */
async function toolInstallPackages(p: {
  packages: string[];
  dev?: boolean;
  workspace?: string;
}): Promise<string> {
  const flag = p.dev ? "-D" : "";
  const pkgs = p.packages.join(" ");
  let cmd: string;
  if (p.workspace) {
    cmd = `pnpm --filter ${p.workspace} add ${flag} ${pkgs}`.trim();
  } else {
    cmd = `pnpm add -w ${flag} ${pkgs}`.trim();
  }
  return toolExecuteCommand({ command: cmd, timeout_ms: 90000 });
}

/* ── query_database ── */
async function toolQueryDatabase(p: { sql: string; params?: unknown[] }): Promise<string> {
  try {
    const client = await pool.connect();
    try {
      const result = await client.query(p.sql, p.params as never[] | undefined);
      const rows = result.rows;
      if (rows.length === 0) {
        return `✅ Query OK — ${result.rowCount ?? 0} row(s) affected. (no rows returned)`;
      }
      const preview = rows.slice(0, 50);
      const json = JSON.stringify(preview, null, 2);
      const suffix = rows.length > 50 ? `\n...(showing 50 of ${rows.length} rows)` : "";
      return `✅ ${rows.length} row(s)\n${json}${suffix}`;
    } finally {
      client.release();
    }
  } catch (e) {
    return `DB Error: ${e instanceof Error ? e.message : String(e)}`;
  }
}

/* ── push_db_schema ── */
async function toolPushDbSchema(): Promise<string> {
  return toolExecuteCommand({
    command: "pnpm --filter @workspace/db run push",
    timeout_ms: 60000,
  });
}

/* ── git ── */
async function toolGit(p: { args: string }): Promise<string> {
  return toolExecuteCommand({
    command: `git ${p.args}`,
    timeout_ms: 30000,
  });
}

/* ── fetch_url ── */
async function toolFetchUrl(p: {
  url: string;
  method?: string;
  headers?: Record<string, string>;
  body?: string;
  max_chars?: number;
}): Promise<string> {
  try {
    const method = (p.method ?? "GET").toUpperCase();
    const MAX = p.max_chars ?? 8000;
    const res = await fetch(p.url, {
      method,
      headers: {
        "User-Agent": "Replit-Agent/4.0",
        ...(p.headers ?? {}),
      },
      body: p.body ?? undefined,
    });
    const text = await res.text();
    const truncated = text.length > MAX
      ? text.slice(0, MAX) + `\n...[truncated: ${text.length - MAX} more chars]`
      : text;
    return `HTTP ${res.status} ${res.statusText}\n${[...res.headers.entries()].map(([k, v]) => `${k}: ${v}`).join("\n")}\n\n${truncated}`;
  } catch (e) {
    return `Fetch Error: ${e instanceof Error ? e.message : String(e)}`;
  }
}

/* ── list_processes ── */
async function toolListProcesses(p: { filter?: string }): Promise<string> {
  const cmd = p.filter
    ? `ps aux | grep ${JSON.stringify(p.filter)} | grep -v grep`
    : "ps aux | head -40";
  return toolExecuteCommand({ command: cmd });
}

/* ── kill_process ── */
async function toolKillProcess(p: {
  pid?: number;
  port?: number;
  signal?: string;
}): Promise<string> {
  const sig = p.signal ?? "SIGTERM";
  if (p.port) {
    return toolExecuteCommand({ command: `fuser -k -${sig} ${p.port}/tcp 2>&1 || true` });
  }
  if (p.pid) {
    return toolExecuteCommand({ command: `kill -${sig} ${p.pid} 2>&1 || true` });
  }
  return "Error: provide pid or port";
}

/* ── get_env ── */
function toolGetEnv(p: { keys?: string[] }): string {
  const SENSITIVE = /key|secret|password|token|auth|credential|private/i;
  const env = process.env;
  if (p.keys && p.keys.length > 0) {
    const result: Record<string, string> = {};
    for (const k of p.keys) {
      result[k] = env[k] ?? "(not set)";
    }
    return JSON.stringify(result, null, 2);
  }
  const safe: Record<string, string> = {};
  for (const [k, v] of Object.entries(env)) {
    if (!SENSITIVE.test(k)) safe[k] = v ?? "";
  }
  return JSON.stringify(safe, null, 2);
}

/* ── set_env ── */
function toolSetEnv(p: { vars: Record<string, string>; file?: string }): string {
  try {
    const file = p.file ?? ".env";
    const abs = guardPath(file);
    if (!abs) return "Error: Path escapes workspace";
    let existing = "";
    if (fs.existsSync(abs)) existing = fs.readFileSync(abs, "utf-8");
    const lines = existing.split("\n").filter(Boolean);
    for (const [k, v] of Object.entries(p.vars)) {
      const idx = lines.findIndex(l => l.startsWith(`${k}=`));
      const line = `${k}=${v}`;
      if (idx >= 0) lines[idx] = line;
      else lines.push(line);
    }
    fs.writeFileSync(abs, lines.join("\n") + "\n", "utf-8");
    return `✅ Written ${Object.keys(p.vars).length} var(s) to ${file}`;
  } catch (e) {
    return `Error: ${e instanceof Error ? e.message : String(e)}`;
  }
}

/* ══════════════════════════════════════════════════════════════
   SSE HELPER
══════════════════════════════════════════════════════════════ */
type SsePayload = Record<string, unknown>;

function makeSend(res: import("express").Response) {
  return (data: SsePayload) => {
    try { res.write(`data: ${JSON.stringify(data)}\n\n`); } catch { /* disconnected */ }
  };
}

/* ══════════════════════════════════════════════════════════════
   POST /api/ide-agent/stream
══════════════════════════════════════════════════════════════ */
router.post("/stream", async (req, res) => {
  const {
    message,
    fileTree,
    currentFile,
    currentCode,
    history = [],
    model = "claude-opus-4-7",
  } = req.body as {
    message?: string;
    fileTree?: string;
    currentFile?: string;
    currentCode?: string;
    history?: { role: string; content: string }[];
    model?: string;
  };

  if (!message) { res.status(400).json({ error: "message is required" }); return; }

  res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders();

  const send = makeSend(res);

  /* Build context-enriched user message */
  const ctxParts: string[] = [];
  if (currentFile) ctxParts.push(`## Current file: ${currentFile}`);
  if (currentCode) {
    const snippet = currentCode.length > 4000
      ? currentCode.slice(0, 4000) + "\n...[truncated for context — use read_file for full content]"
      : currentCode;
    ctxParts.push(`## Current file content:\n\`\`\`\n${snippet}\n\`\`\``);
  }
  if (fileTree) ctxParts.push(`## Project structure:\n${fileTree}`);

  const userContent = ctxParts.length > 0
    ? `${ctxParts.join("\n\n")}\n\n---\n\n${message}`
    : message;

  type AMsg = { role: "user"; content: string | unknown[] } | { role: "assistant"; content: unknown[] };

  const messages: AMsg[] = [
    ...history.map(h => ({ role: h.role as "user" | "assistant", content: h.content })) as AMsg[],
    { role: "user", content: userContent },
  ];

  const MAX_LOOPS = 20;
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

      for (const block of response.content) {
        if (block.type === "text" && block.text) {
          send({ type: "text_delta", content: block.text });
        }
      }

      if (response.stop_reason === "end_turn") { send({ type: "done" }); break; }

      if (response.stop_reason === "tool_use") {
        const toolBlocks = response.content.filter((b: { type: string }) => b.type === "tool_use");
        if (toolBlocks.length === 0) { send({ type: "done" }); break; }

        messages.push({ role: "assistant", content: response.content });

        const toolResults: { type: "tool_result"; tool_use_id: string; content: string }[] = [];

        for (const tb of toolBlocks) {
          if (tb.type !== "tool_use") continue;
          const { id, name, input } = tb;
          const params = input as Record<string, unknown>;

          send({ type: "tool_call", tool: name, params, id });

          let result = "";
          try {
            switch (name) {
              case "write_file":           result = toolWriteFile(params as never); break;
              case "read_file":            result = toolReadFile(params as never); break;
              case "list_files":           result = toolListFiles(params as never); break;
              case "search_files":         result = toolSearchFiles(params as never); break;
              case "delete_file":          result = toolDeleteFile(params as never); break;
              case "move_file":            result = toolMoveFile(params as never); break;
              case "make_directory":       result = toolMakeDirectory(params as never); break;
              case "execute_command":      result = await toolExecuteCommand(params as never); break;
              case "execute_command_async":result = toolExecuteCommandAsync(params as never); break;
              case "install_packages":     result = await toolInstallPackages(params as never); break;
              case "query_database":       result = await toolQueryDatabase(params as never); break;
              case "push_db_schema":       result = await toolPushDbSchema(); break;
              case "git":                  result = await toolGit(params as never); break;
              case "fetch_url":            result = await toolFetchUrl(params as never); break;
              case "list_processes":       result = await toolListProcesses(params as never); break;
              case "kill_process":         result = await toolKillProcess(params as never); break;
              case "get_env":              result = toolGetEnv(params as never); break;
              case "set_env":              result = toolSetEnv(params as never); break;
              default:                     result = `Unknown tool: ${name}`;
            }
          } catch (toolErr) {
            result = `Tool error: ${toolErr instanceof Error ? toolErr.message : String(toolErr)}`;
          }

          send({ type: "tool_result", tool: name, result, id });
          toolResults.push({ type: "tool_result", tool_use_id: id, content: result });
        }

        messages.push({ role: "user", content: toolResults as never });
        continue;
      }

      break;
    }

    if (loopCount >= MAX_LOOPS) {
      send({ type: "text_delta", content: "\n\n⚠️ Reached iteration limit (20 loops). Task may be partially complete." });
      send({ type: "done" });
    }
  } catch (e) {
    send({ type: "error", message: e instanceof Error ? e.message : String(e) });
    send({ type: "done" });
  }
});

/* ══════════════════════════════════════════════════════════════
   POST /api/ide-agent/approve  (legacy — kept for compatibility)
══════════════════════════════════════════════════════════════ */
router.post("/approve", async (req, res) => {
  const { command } = req.body as { command?: string };
  if (!command) { res.status(400).json({ error: "command required" }); return; }
  const result = await toolExecuteCommand({ command, timeout_ms: 60000 });
  res.json({ ok: true, output: result });
});

/* ══════════════════════════════════════════════════════════════
   POST /api/ide-agent/complete  (inline autocomplete)
══════════════════════════════════════════════════════════════ */
router.post("/complete", async (req, res) => {
  const { code, language, filename, prefix, suffix } = req.body ?? {};
  if (!code && !prefix) { res.status(400).json({ error: "code or prefix required" }); return; }
  try {
    const lang = language ?? "javascript";
    const file = filename ?? "file";
    const context = prefix ?? code ?? "";
    const after = suffix ?? "";
    const prompt = after
      ? `Complete this ${lang} code. File: ${file}\n\nBefore cursor:\n${context}\n\nAfter cursor:\n${after}\n\nReturn ONLY the text to insert. No explanation, no markdown.`
      : `Continue this ${lang} code naturally. File: ${file}\n\n${context}\n\nReturn ONLY the next tokens/lines. No explanation, no markdown, no repetition.`;
    const msg = await anthropic.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 256,
      messages: [{ role: "user", content: prompt }],
    });
    const text = msg.content[0]?.type === "text" ? msg.content[0].text : "";
    const clean = text.replace(/^```[\w]*\n?/, "").replace(/\n?```$/, "").trimEnd();
    res.json({ completion: clean });
  } catch (err) {
    req.log.error({ err }, "autocomplete failed");
    res.json({ completion: "" });
  }
});

export default router;
