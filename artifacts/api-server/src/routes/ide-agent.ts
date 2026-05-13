import { Router } from "express";
import { anthropic } from "@workspace/integrations-anthropic-ai";
import { pool } from "@workspace/db";
import fs from "fs";
import path from "path";
import crypto from "crypto";
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

  /* ── Web Search ── */
  {
    name: "web_search",
    description:
      "Search the internet using DuckDuckGo. Returns real search results with titles, URLs, and snippets. " +
      "Use for: finding libraries, documentation, error solutions, current events, package versions, best practices.",
    input_schema: {
      type: "object" as const,
      properties: {
        query: { type: "string", description: "Search query" },
        max_results: { type: "number", description: "Max results to return (default: 8)" },
      },
      required: ["query"],
    },
  },

  /* ── Code Quality ── */
  {
    name: "run_tests",
    description:
      "Run the test suite (vitest, jest, mocha, etc.) and return results. " +
      "Automatically detects the test runner from package.json. " +
      "Returns pass/fail counts, error messages, and stack traces.",
    input_schema: {
      type: "object" as const,
      properties: {
        workspace: { type: "string", description: "Which workspace to test (e.g. '@workspace/api-server'). Omit for all." },
        filter: { type: "string", description: "Optional test file or test name filter" },
        timeout_ms: { type: "number", description: "Timeout in ms (default: 60000)" },
      },
    },
  },
  {
    name: "lint_code",
    description:
      "Run ESLint and/or TypeScript type checking on the project. " +
      "Returns a list of errors and warnings with file paths and line numbers.",
    input_schema: {
      type: "object" as const,
      properties: {
        workspace: { type: "string", description: "Which workspace to lint (e.g. '@workspace/replit-ide'). Omit for all." },
        fix: { type: "boolean", description: "Auto-fix fixable issues (default: false)" },
        type_check_only: { type: "boolean", description: "Only run TypeScript type checking, skip ESLint" },
      },
    },
  },
  {
    name: "format_code",
    description:
      "Format code using Prettier. Can format a single file, directory, or the entire workspace. " +
      "Fixes indentation, quotes, semicolons, line length, etc.",
    input_schema: {
      type: "object" as const,
      properties: {
        path: { type: "string", description: "File or directory to format (default: entire workspace)" },
        check_only: { type: "boolean", description: "Only check formatting, don't modify files (default: false)" },
      },
    },
  },

  /* ── System Info ── */
  {
    name: "get_system_info",
    description:
      "Get real-time system information: CPU usage, memory usage, disk space, OS info, Node.js version, " +
      "installed tools, and environment summary.",
    input_schema: {
      type: "object" as const,
      properties: {
        include: {
          type: "array",
          items: { type: "string" },
          description: "Sections to include: 'cpu', 'memory', 'disk', 'os', 'node', 'network'. Omit for all.",
        },
      },
    },
  },

  /* ── File Operations ── */
  {
    name: "diff_files",
    description:
      "Show the diff between two files, or between a file's current content and a provided string. " +
      "Useful for reviewing changes before applying them.",
    input_schema: {
      type: "object" as const,
      properties: {
        file_a: { type: "string", description: "Path to first file" },
        file_b: { type: "string", description: "Path to second file (optional if comparing with content_b)" },
        content_b: { type: "string", description: "Content to compare against file_a (alternative to file_b)" },
      },
      required: ["file_a"],
    },
  },
  {
    name: "tail_log",
    description:
      "Read the last N lines of any log file. Useful for checking server logs, build output, error logs. " +
      "Also supports filtering lines by a pattern.",
    input_schema: {
      type: "object" as const,
      properties: {
        path: { type: "string", description: "Path to the log file" },
        lines: { type: "number", description: "Number of lines from end to return (default: 50)" },
        filter: { type: "string", description: "Optional: only return lines containing this text" },
      },
      required: ["path"],
    },
  },
  {
    name: "create_zip",
    description:
      "Create a zip archive of files or directories. " +
      "Useful for packaging builds, creating backups, or preparing files for download.",
    input_schema: {
      type: "object" as const,
      properties: {
        sources: {
          type: "array",
          items: { type: "string" },
          description: "Files or directories to include in the zip",
        },
        output: { type: "string", description: "Output zip file path (e.g. 'dist/build.zip')" },
      },
      required: ["sources", "output"],
    },
  },

  /* ── Network ── */
  {
    name: "watch_port",
    description:
      "Check if a local port is open and listening. " +
      "Useful for verifying a dev server started, or checking if a service is running.",
    input_schema: {
      type: "object" as const,
      properties: {
        port: { type: "number", description: "Port number to check" },
        host: { type: "string", description: "Host to check (default: localhost)" },
      },
      required: ["port"],
    },
  },

  /* ── Data Utilities ── */
  {
    name: "encode_decode",
    description:
      "Encode or decode data using various formats: base64, URL encoding, JSON pretty-print, hex, " +
      "HTML entities. Useful for working with API responses, auth tokens, URL parameters.",
    input_schema: {
      type: "object" as const,
      properties: {
        input: { type: "string", description: "The data to encode or decode" },
        operation: {
          type: "string",
          description: "One of: base64_encode, base64_decode, url_encode, url_decode, json_format, hex_encode, hex_decode, html_encode, html_decode",
        },
      },
      required: ["input", "operation"],
    },
  },
  {
    name: "hash_text",
    description:
      "Hash text using SHA-256, SHA-512, or MD5. Also supports generating random UUIDs, " +
      "random tokens, and checking if two values match a hash.",
    input_schema: {
      type: "object" as const,
      properties: {
        input: { type: "string", description: "Text to hash (omit for UUID generation)" },
        algorithm: {
          type: "string",
          description: "One of: sha256, sha512, md5, uuid, random_token. Default: sha256",
        },
      },
    },
  },

  /* ── Screenshot ── */
  {
    name: "screenshot_url",
    description:
      "Take a screenshot of a running local server URL or public website. " +
      "Returns a description of what's visible on the page. " +
      "Use to verify the UI looks correct after changes.",
    input_schema: {
      type: "object" as const,
      properties: {
        url: { type: "string", description: "URL to screenshot (e.g. http://localhost:3001 or https://example.com)" },
        description: { type: "string", description: "What to look for or verify in the screenshot" },
      },
      required: ["url"],
    },
  },

  /* ── Agent Memory ── */
  {
    name: "memory_store",
    description:
      "Store a fact, context, or preference in persistent memory. " +
      "Use this to remember important project details, user preferences, architecture decisions, " +
      "API keys locations, recurring patterns, or anything you want to recall in future sessions. " +
      "Memory persists across conversations in the database.",
    input_schema: {
      type: "object" as const,
      properties: {
        key: { type: "string", description: "Unique identifier for this memory (e.g. 'stack', 'db_schema', 'auth_pattern', 'user_pref_theme')" },
        value: { type: "string", description: "The information to store (can be multi-line, JSON, or plain text)" },
        category: { type: "string", description: "Category: 'project', 'preference', 'architecture', 'credentials_location', 'pattern', 'note'. Default: 'note'" },
        importance: { type: "number", description: "Importance 1-10 (10 = critical, default 5)" },
      },
      required: ["key", "value"],
    },
  },
  {
    name: "memory_recall",
    description:
      "Retrieve facts stored in persistent memory. " +
      "Use at the start of sessions to recall project context, preferences, and architecture decisions.",
    input_schema: {
      type: "object" as const,
      properties: {
        key: { type: "string", description: "Specific key to retrieve (omit to get all memories)" },
        category: { type: "string", description: "Filter by category: 'project', 'preference', 'architecture', 'credentials_location', 'pattern', 'note'" },
        search: { type: "string", description: "Search term to find relevant memories" },
        limit: { type: "number", description: "Max memories to return (default: 20)" },
      },
    },
  },
  {
    name: "memory_delete",
    description: "Delete a stored memory by key.",
    input_schema: {
      type: "object" as const,
      properties: {
        key: { type: "string", description: "Key of the memory to delete" },
      },
      required: ["key"],
    },
  },

  /* ── API Testing ── */
  {
    name: "api_test",
    description:
      "Test an HTTP API endpoint and assert the response. " +
      "Sends a request and validates status code, response body, headers. " +
      "Returns a pass/fail summary with details. " +
      "Use after implementing API endpoints to verify they work correctly.",
    input_schema: {
      type: "object" as const,
      properties: {
        url: { type: "string", description: "Full URL to test (e.g. http://localhost:8000/api/users)" },
        method: { type: "string", description: "HTTP method: GET, POST, PUT, DELETE, PATCH (default: GET)" },
        headers: { type: "object", description: "Request headers", additionalProperties: { type: "string" } },
        body: { type: "string", description: "Request body (JSON string)" },
        expect_status: { type: "number", description: "Expected HTTP status code (default: 200)" },
        expect_body_contains: { type: "string", description: "String that should appear in the response body" },
        expect_json_path: { type: "string", description: "JSON path to check (e.g. 'data.id' or 'users.0.name')" },
        expect_json_value: { type: "string", description: "Expected value at the JSON path" },
      },
      required: ["url"],
    },
  },

  /* ── Code Review ── */
  {
    name: "code_review",
    description:
      "Perform an AI-powered code review on a file or code snippet. " +
      "Analyzes for bugs, security issues, performance problems, code style, and best practice violations. " +
      "Returns a structured report with severity ratings (critical/high/medium/low).",
    input_schema: {
      type: "object" as const,
      properties: {
        path: { type: "string", description: "File path to review (optional if providing code directly)" },
        code: { type: "string", description: "Code to review (optional if providing a path)" },
        language: { type: "string", description: "Programming language (auto-detected from path if not provided)" },
        focus: { type: "string", description: "Review focus: 'all', 'security', 'performance', 'bugs', 'style' (default: 'all')" },
      },
    },
  },

  /* ── Security Scan ── */
  {
    name: "security_scan",
    description:
      "Scan the codebase for security vulnerabilities: hardcoded secrets, API keys, passwords, " +
      "SQL injection risks, XSS vulnerabilities, exposed sensitive data, insecure dependencies. " +
      "Returns a list of findings with file paths and line numbers.",
    input_schema: {
      type: "object" as const,
      properties: {
        directory: { type: "string", description: "Directory to scan (default: workspace root)" },
        scan_type: {
          type: "string",
          description: "Type of scan: 'secrets' (API keys/passwords), 'injection' (SQL/XSS), 'all' (default: 'all')",
        },
      },
    },
  },

  /* ── Webhook Notify ── */
  {
    name: "notify_webhook",
    description:
      "Send a notification to a webhook URL (Slack, Discord, Teams, custom). " +
      "Supports Slack's Block Kit format, Discord embeds, and plain JSON. " +
      "Use to notify about completed deployments, test results, or errors.",
    input_schema: {
      type: "object" as const,
      properties: {
        url: { type: "string", description: "Webhook URL (Slack/Discord/Teams/custom)" },
        message: { type: "string", description: "Plain text message to send" },
        title: { type: "string", description: "Optional title for the notification" },
        color: { type: "string", description: "Color for Discord/Slack: 'green', 'red', 'yellow', 'blue' or hex" },
        fields: {
          type: "array",
          description: "Key-value fields to include",
          items: {
            type: "object",
            properties: {
              name: { type: "string" },
              value: { type: "string" },
            },
          },
        },
        format: { type: "string", description: "Format: 'slack', 'discord', 'json' (auto-detect from URL)" },
      },
      required: ["url", "message"],
    },
  },

  /* ── Data Query ── */
  {
    name: "query_data_file",
    description:
      "Parse and query JSON or CSV files. " +
      "Supports filtering, sorting, counting, and extracting fields. " +
      "Use for analyzing data files, config files, or API response dumps.",
    input_schema: {
      type: "object" as const,
      properties: {
        path: { type: "string", description: "Path to JSON or CSV file" },
        operation: {
          type: "string",
          description: "Operation: 'read' (full content), 'count' (row count), 'fields' (list fields/keys), 'filter' (filter rows), 'select' (extract specific fields), 'stats' (numeric statistics)",
        },
        filter_key: { type: "string", description: "Field to filter on" },
        filter_value: { type: "string", description: "Value to filter by" },
        select_fields: {
          type: "array",
          items: { type: "string" },
          description: "Fields to extract (for 'select' operation)",
        },
        limit: { type: "number", description: "Max rows to return (default: 50)" },
      },
      required: ["path", "operation"],
    },
  },

  /* ── Generate Types ── */
  {
    name: "generate_types",
    description:
      "Generate TypeScript type definitions from a JSON sample, JSON Schema, or existing JS object. " +
      "Also can generate Zod schemas, Drizzle table definitions, or OpenAPI types from an example.",
    input_schema: {
      type: "object" as const,
      properties: {
        input: { type: "string", description: "JSON sample, JS object literal, or JSON Schema to generate types from" },
        output_format: {
          type: "string",
          description: "Output format: 'typescript' (interface), 'zod' (Zod schema), 'drizzle' (Drizzle ORM table). Default: 'typescript'",
        },
        type_name: { type: "string", description: "Name for the generated type/interface (default: 'GeneratedType')" },
        output_path: { type: "string", description: "If provided, write the generated types to this file" },
      },
      required: ["input"],
    },
  },

  /* ── Benchmark ── */
  {
    name: "benchmark",
    description:
      "Run a simple performance benchmark: measure how long a command or script takes to execute, " +
      "or benchmark an HTTP endpoint with multiple requests. " +
      "Returns timing statistics: min, max, mean, p50, p95, p99.",
    input_schema: {
      type: "object" as const,
      properties: {
        type: { type: "string", description: "Benchmark type: 'command' or 'http' (default: 'command')" },
        command: { type: "string", description: "Shell command to benchmark (for 'command' type)" },
        url: { type: "string", description: "URL to benchmark (for 'http' type)" },
        iterations: { type: "number", description: "Number of iterations (default: 5 for command, 20 for http)" },
        method: { type: "string", description: "HTTP method for 'http' type (default: GET)" },
        body: { type: "string", description: "Request body for 'http' type" },
      },
    },
  },

  /* ── Dependency Audit ── */
  {
    name: "audit_dependencies",
    description:
      "Check npm/pnpm packages for known security vulnerabilities, outdated versions, and license issues. " +
      "Returns a list of vulnerable packages with CVE numbers and recommended fixes.",
    input_schema: {
      type: "object" as const,
      properties: {
        workspace: { type: "string", description: "Which workspace to audit (omit for all)" },
        severity: { type: "string", description: "Minimum severity to report: 'low', 'moderate', 'high', 'critical' (default: 'moderate')" },
      },
    },
  },

  /* ── Bundle Analysis ── */
  {
    name: "analyze_bundle",
    description:
      "Analyze the JavaScript bundle size of a built project. " +
      "Shows which files and packages are taking the most space. " +
      "Requires the project to be built first.",
    input_schema: {
      type: "object" as const,
      properties: {
        dist_path: { type: "string", description: "Path to the dist/build directory (default: 'dist')" },
        top_n: { type: "number", description: "Show top N largest files (default: 20)" },
      },
    },
  },
] as const;

/* ══════════════════════════════════════════════════════════════
   SYSTEM PROMPT — Full Agent with All Permissions
══════════════════════════════════════════════════════════════ */
const IDE_SYSTEM_PROMPT = `You are Agent 4 — Replit's fully autonomous AI engineer with FULL SYSTEM ACCESS and 42 tools.

## You Have Complete Permissions — 42 Tools Available

### Filesystem (7 tools)
- ✅ write_file — Create/overwrite any file
- ✅ read_file — Read any file (with line range support)
- ✅ list_files — Recursive directory listing
- ✅ search_files — Grep across all project files
- ✅ delete_file — Delete files or directories
- ✅ move_file — Move/rename files
- ✅ make_directory — Create directories

### Shell & Processes (4 tools)
- ✅ execute_command — ANY shell command, no restrictions
- ✅ execute_command_async — Background processes with log capture
- ✅ list_processes — See all running processes
- ✅ kill_process — Kill by PID or port

### Package & Build (1 tool)
- ✅ install_packages — pnpm add to any workspace

### Database (2 tools)
- ✅ query_database — Any SQL (SELECT/INSERT/UPDATE/DELETE/DDL)
- ✅ push_db_schema — drizzle-kit push

### Git (1 tool)
- ✅ git — Any git command (commit, push, pull, branch, merge, rebase)

### Internet & HTTP (2 tools)
- ✅ fetch_url — Any URL (GET/POST/PUT/DELETE with custom headers)
- ✅ web_search — DuckDuckGo search with real results

### Code Quality (3 tools)
- ✅ run_tests — vitest/jest with pass/fail counts
- ✅ lint_code — ESLint + TypeScript type checking
- ✅ format_code — Prettier formatting

### System Info (1 tool)
- ✅ get_system_info — CPU, memory, disk, Node version, ports

### File Utilities (3 tools)
- ✅ diff_files — Unified diff between two files
- ✅ tail_log — Last N lines of any log file
- ✅ create_zip — Create zip archives

### Network (1 tool)
- ✅ watch_port — Check if a port is open/responding

### Environment (2 tools)
- ✅ get_env — Read environment variables
- ✅ set_env — Write to .env files

### Data Utilities (3 tools)
- ✅ encode_decode — base64/URL/hex/JSON/HTML encode/decode
- ✅ hash_text — SHA256/MD5/UUID/random tokens
- ✅ screenshot_url — Check a URL and return page metadata

### Agent Memory (3 tools) — PERSISTS ACROSS ALL SESSIONS IN DATABASE
- ✅ memory_store — Store any fact, decision, or preference permanently (key/value with category + importance)
- ✅ memory_recall — Retrieve memories by key, category, or full-text search
- ✅ memory_delete — Remove a stored memory

### API Testing (1 tool)
- ✅ api_test — Test any HTTP endpoint: assert status, body content, JSON path values — returns PASS/FAIL

### AI-Powered Analysis (2 tools)
- ✅ code_review — Run a deep AI code review: finds CRITICAL/HIGH/MEDIUM/LOW issues (bugs, security, perf, style)
- ✅ security_scan — Scan entire codebase for hardcoded secrets, API keys, SQL injection, XSS risks

### Integration & Notifications (1 tool)
- ✅ notify_webhook — Send structured notifications to Slack/Discord/Teams/custom webhooks with embeds

### Data Querying (2 tools)
- ✅ query_data_file — Parse JSON/CSV files: filter, select fields, count rows, compute stats
- ✅ generate_types — Generate TypeScript interfaces / Zod schemas / Drizzle tables from JSON samples

### Performance & Audit (3 tools)
- ✅ benchmark — Measure performance of commands or HTTP endpoints (min/max/mean/p50/p95/p99)
- ✅ audit_dependencies — Check packages for known CVEs (pnpm audit with severity filtering)
- ✅ analyze_bundle — Analyze JS/CSS bundle size breakdown after builds

## MEMORY PROTOCOL
At the start of any complex task, call memory_recall (no arguments) to load stored project context.
Use memory_store to save important decisions, patterns, or facts you discover.
High importance (8-10): architectural decisions, auth patterns, DB schema facts.
Medium importance (5-7): common bugs, file locations, user preferences.
Low importance (1-4): temporary notes.

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
   AGENT MEMORY — persistent DB-backed memory
══════════════════════════════════════════════════════════════ */
async function ensureMemoryTable(): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS agent_memory (
      id SERIAL PRIMARY KEY,
      key TEXT UNIQUE NOT NULL,
      value TEXT NOT NULL,
      category TEXT NOT NULL DEFAULT 'note',
      importance INTEGER NOT NULL DEFAULT 5,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);
}

async function toolMemoryStore(p: { key: string; value: string; category?: string; importance?: number }): Promise<string> {
  try {
    await ensureMemoryTable();
    const cat = p.category ?? "note";
    const imp = p.importance ?? 5;
    await pool.query(
      `INSERT INTO agent_memory (key, value, category, importance, updated_at)
       VALUES ($1, $2, $3, $4, NOW())
       ON CONFLICT (key) DO UPDATE SET value=$2, category=$3, importance=$4, updated_at=NOW()`,
      [p.key, p.value, cat, imp]
    );
    return `✅ Memory stored: [${p.key}] (category: ${cat}, importance: ${imp}/10)`;
  } catch (e) {
    return `Memory Error: ${e instanceof Error ? e.message : String(e)}`;
  }
}

async function toolMemoryRecall(p: { key?: string; category?: string; search?: string; limit?: number }): Promise<string> {
  try {
    await ensureMemoryTable();
    const lim = p.limit ?? 20;
    let rows: Array<{ key: string; value: string; category: string; importance: number; updated_at: Date }>;

    if (p.key) {
      const r = await pool.query(`SELECT key, value, category, importance, updated_at FROM agent_memory WHERE key=$1`, [p.key]);
      rows = r.rows;
    } else if (p.search) {
      const r = await pool.query(
        `SELECT key, value, category, importance, updated_at FROM agent_memory
         WHERE key ILIKE $1 OR value ILIKE $1 ORDER BY importance DESC, updated_at DESC LIMIT $2`,
        [`%${p.search}%`, lim]
      );
      rows = r.rows;
    } else if (p.category) {
      const r = await pool.query(
        `SELECT key, value, category, importance, updated_at FROM agent_memory
         WHERE category=$1 ORDER BY importance DESC, updated_at DESC LIMIT $2`,
        [p.category, lim]
      );
      rows = r.rows;
    } else {
      const r = await pool.query(
        `SELECT key, value, category, importance, updated_at FROM agent_memory
         ORDER BY importance DESC, updated_at DESC LIMIT $1`,
        [lim]
      );
      rows = r.rows;
    }

    if (rows.length === 0) return "(no memories found)";
    return rows.map(r =>
      `[${r.key}] (${r.category}, importance:${r.importance}/10, updated: ${new Date(r.updated_at).toLocaleDateString()})\n${r.value}`
    ).join("\n\n---\n\n");
  } catch (e) {
    return `Memory Error: ${e instanceof Error ? e.message : String(e)}`;
  }
}

async function toolMemoryDelete(p: { key: string }): Promise<string> {
  try {
    await ensureMemoryTable();
    const r = await pool.query(`DELETE FROM agent_memory WHERE key=$1`, [p.key]);
    return r.rowCount && r.rowCount > 0 ? `✅ Deleted memory: ${p.key}` : `Not found: ${p.key}`;
  } catch (e) {
    return `Memory Error: ${e instanceof Error ? e.message : String(e)}`;
  }
}

/* ── api_test ── */
async function toolApiTest(p: {
  url: string;
  method?: string;
  headers?: Record<string, string>;
  body?: string;
  expect_status?: number;
  expect_body_contains?: string;
  expect_json_path?: string;
  expect_json_value?: string;
}): Promise<string> {
  const method = (p.method ?? "GET").toUpperCase();
  const expectedStatus = p.expect_status ?? 200;
  const lines: string[] = [`🧪 API Test: ${method} ${p.url}`];
  try {
    const startMs = Date.now();
    const res = await fetch(p.url, {
      method,
      headers: { "Content-Type": "application/json", ...(p.headers ?? {}) },
      body: p.body ?? undefined,
      signal: AbortSignal.timeout(15000),
    });
    const elapsed = Date.now() - startMs;
    const bodyText = await res.text();
    let bodyJson: unknown = null;
    try { bodyJson = JSON.parse(bodyText); } catch { /* not JSON */ }

    const statusOk = res.status === expectedStatus;
    lines.push(`${statusOk ? "✅" : "❌"} Status: ${res.status} (expected ${expectedStatus}) — ${elapsed}ms`);

    if (p.expect_body_contains) {
      const contains = bodyText.includes(p.expect_body_contains);
      lines.push(`${contains ? "✅" : "❌"} Body contains: "${p.expect_body_contains}"`);
    }

    if (p.expect_json_path && bodyJson !== null) {
      const parts = p.expect_json_path.split(".");
      let val: unknown = bodyJson;
      for (const part of parts) {
        if (val && typeof val === "object" && part in (val as object)) {
          val = (val as Record<string, unknown>)[part];
        } else {
          val = undefined; break;
        }
      }
      const strVal = String(val);
      const matches = p.expect_json_value ? strVal === p.expect_json_value : val !== undefined;
      lines.push(`${matches ? "✅" : "❌"} JSON path ${p.expect_json_path} = ${strVal}${p.expect_json_value ? ` (expected: ${p.expect_json_value})` : ""}`);
    }

    const preview = bodyText.slice(0, 1000) + (bodyText.length > 1000 ? "...(truncated)" : "");
    lines.push(`\nResponse:\n${preview}`);
    return lines.join("\n");
  } catch (e) {
    return `❌ Request failed: ${e instanceof Error ? e.message : String(e)}`;
  }
}

/* ── code_review ── */
async function toolCodeReview(p: {
  path?: string;
  code?: string;
  language?: string;
  focus?: string;
}): Promise<string> {
  let codeToReview = p.code ?? "";
  let lang = p.language ?? "typescript";
  if (p.path && !p.code) {
    const abs = guardPath(p.path);
    if (abs && fs.existsSync(abs)) {
      codeToReview = fs.readFileSync(abs, "utf-8").slice(0, 8000);
      const ext = p.path.split(".").pop() ?? "ts";
      lang = ext;
    }
  }
  if (!codeToReview) return "Error: provide path or code to review";
  const focus = p.focus ?? "all";
  const focusInstructions: Record<string, string> = {
    all: "Check for bugs, security vulnerabilities, performance issues, code style, and best practices.",
    security: "Focus ONLY on security vulnerabilities: SQL injection, XSS, CSRF, auth bypass, secrets exposure, path traversal.",
    performance: "Focus ONLY on performance: N+1 queries, unnecessary re-renders, memory leaks, blocking operations, inefficient algorithms.",
    bugs: "Focus ONLY on logic errors, null pointer exceptions, off-by-one errors, race conditions, and incorrect behavior.",
    style: "Focus ONLY on code style, naming conventions, DRY violations, complexity, and maintainability.",
  };
  const prompt = `You are a senior code reviewer. ${focusInstructions[focus] ?? focusInstructions.all}

Review this ${lang} code and output a structured report with:
- CRITICAL (security issues, data loss risks)
- HIGH (bugs that will cause failures)
- MEDIUM (performance, logic issues)
- LOW (style, maintainability)

Format each finding as:
[SEVERITY] Line X: Description
  Code: \`affected code\`
  Fix: suggested fix

Code to review:
\`\`\`${lang}
${codeToReview}
\`\`\`

Be concise. Only report real issues, not suggestions.`;

  try {
    const msg = await anthropic.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 2048,
      messages: [{ role: "user", content: prompt }],
    });
    const result = msg.content[0]?.type === "text" ? msg.content[0].text : "(no output)";
    return `📋 Code Review${p.path ? ` for ${p.path}` : ""} (focus: ${focus}):\n\n${result}`;
  } catch (e) {
    return `Review Error: ${e instanceof Error ? e.message : String(e)}`;
  }
}

/* ── security_scan ── */
async function toolSecurityScan(p: { directory?: string; scan_type?: string }): Promise<string> {
  const dir = p.directory ?? ".";
  const abs = guardPath(dir);
  if (!abs) return "Error: path escapes workspace";

  const findings: string[] = [];
  const type = p.scan_type ?? "all";
  const SKIP = new Set(["node_modules", ".git", "dist", ".local", ".cache"]);

  const SECRET_PATTERNS: Array<[string, RegExp]> = [
    ["Hardcoded password", /password\s*[:=]\s*["'][^"']{4,}["']/i],
    ["Hardcoded API key", /api[_-]?key\s*[:=]\s*["'][a-zA-Z0-9_\-]{16,}["']/i],
    ["AWS Access Key", /AKIA[0-9A-Z]{16}/],
    ["Private key header", /-----BEGIN (RSA |EC )?PRIVATE KEY-----/],
    ["Bearer token in code", /bearer\s+[a-zA-Z0-9_\-\.]{20,}/i],
    ["JWT token", /eyJ[a-zA-Z0-9_\-]{50,}\.[a-zA-Z0-9_\-]+\.[a-zA-Z0-9_\-]+/],
    ["GitHub token", /ghp_[a-zA-Z0-9]{36}/],
    ["Slack token", /xox[baprs]-[0-9a-zA-Z]{10,}/],
  ];

  const INJECTION_PATTERNS: Array<[string, RegExp]> = [
    ["SQL injection risk", /\.query\s*\(\s*`[^`]*\$\{[^}]+\}[^`]*`\s*\)/],
    ["eval() usage", /\beval\s*\(/],
    ["innerHTML assignment", /\.innerHTML\s*=[^;]+;/],
    ["dangerouslySetInnerHTML", /dangerouslySetInnerHTML/],
    ["No input validation", /req\.body\.[a-zA-Z]+\s*(?!\?)/g],
  ];

  function scanDir(dirPath: string) {
    let entries: fs.Dirent[];
    try { entries = fs.readdirSync(dirPath, { withFileTypes: true }); } catch { return; }
    for (const e of entries) {
      if (SKIP.has(e.name)) continue;
      const full = path.join(dirPath, e.name);
      if (e.isDirectory()) { scanDir(full); }
      else if (e.isFile() && /\.(ts|tsx|js|jsx|env|json|yaml|yml)$/.test(e.name) && !e.name.endsWith(".min.js")) {
        try {
          const content = fs.readFileSync(full, "utf-8");
          const relPath = path.relative(WORKSPACE, full);
          const lines = content.split("\n");
          const pats = type === "secrets" ? SECRET_PATTERNS : type === "injection" ? INJECTION_PATTERNS : [...SECRET_PATTERNS, ...INJECTION_PATTERNS];
          for (const [name, pattern] of pats) {
            for (let i = 0; i < lines.length; i++) {
              if (pattern.test(lines[i] ?? "")) {
                findings.push(`⚠️  ${name}\n   File: ${relPath}:${i + 1}\n   Line: ${lines[i]?.trim().slice(0, 100)}`);
                break;
              }
            }
          }
        } catch { /* binary */ }
      }
    }
  }

  scanDir(abs);
  if (findings.length === 0) return `✅ Security scan complete — no issues found in ${dir} (type: ${type})`;
  return `🔐 Security Scan Results (${findings.length} findings):\n\n${findings.join("\n\n")}`;
}

/* ── notify_webhook ── */
async function toolNotifyWebhook(p: {
  url: string;
  message: string;
  title?: string;
  color?: string;
  fields?: Array<{ name: string; value: string }>;
  format?: string;
}): Promise<string> {
  const isDiscord = p.url.includes("discord.com") || p.format === "discord";
  const isSlack = p.url.includes("slack.com") || p.format === "slack";

  const colorMap: Record<string, number | string> = {
    green: isDiscord ? 0x2ea043 : "good",
    red: isDiscord ? 0xf85149 : "danger",
    yellow: isDiscord ? 0xe3b341 : "warning",
    blue: isDiscord ? 0x58a6ff : "#58a6ff",
  };
  const color = p.color ? (colorMap[p.color] ?? p.color) : (isDiscord ? 0x58a6ff : "good");

  let body: string;
  if (isDiscord) {
    body = JSON.stringify({
      embeds: [{
        title: p.title,
        description: p.message,
        color,
        fields: p.fields?.map(f => ({ name: f.name, value: f.value, inline: true })),
        timestamp: new Date().toISOString(),
      }],
    });
  } else if (isSlack) {
    body = JSON.stringify({
      attachments: [{
        color: color as string,
        title: p.title,
        text: p.message,
        fields: p.fields?.map(f => ({ title: f.name, value: f.value, short: true })),
      }],
    });
  } else {
    body = JSON.stringify({ title: p.title, message: p.message, fields: p.fields, timestamp: new Date().toISOString() });
  }

  try {
    const res = await fetch(p.url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      signal: AbortSignal.timeout(10000),
    });
    return res.ok ? `✅ Webhook sent (${res.status})` : `❌ Webhook failed: HTTP ${res.status} — ${await res.text()}`;
  } catch (e) {
    return `Webhook Error: ${e instanceof Error ? e.message : String(e)}`;
  }
}

/* ── query_data_file ── */
function toolQueryDataFile(p: {
  path: string;
  operation: string;
  filter_key?: string;
  filter_value?: string;
  select_fields?: string[];
  limit?: number;
}): string {
  try {
    const abs = guardPath(p.path);
    if (!abs || !fs.existsSync(abs)) return `Not found: ${p.path}`;
    const content = fs.readFileSync(abs, "utf-8");
    const isCsv = p.path.endsWith(".csv");
    const lim = p.limit ?? 50;

    let rows: Record<string, string>[];
    if (isCsv) {
      const lines = content.trim().split("\n");
      const headers = lines[0]?.split(",").map(h => h.trim()) ?? [];
      rows = lines.slice(1).map(l => {
        const vals = l.split(",");
        const row: Record<string, string> = {};
        headers.forEach((h, i) => { row[h] = (vals[i] ?? "").trim(); });
        return row;
      });
    } else {
      const parsed = JSON.parse(content);
      rows = Array.isArray(parsed) ? parsed : [parsed];
    }

    switch (p.operation) {
      case "count": return `${rows.length} rows`;
      case "fields": return Object.keys(rows[0] ?? {}).join(", ") || "(no fields)";
      case "filter": {
        if (!p.filter_key) return "Error: filter_key required";
        const filtered = rows.filter(r => String(r[p.filter_key!] ?? "").includes(p.filter_value ?? "")).slice(0, lim);
        return JSON.stringify(filtered, null, 2);
      }
      case "select": {
        if (!p.select_fields?.length) return "Error: select_fields required";
        const selected = rows.slice(0, lim).map(r => {
          const out: Record<string, string> = {};
          p.select_fields!.forEach(f => { out[f] = r[f] ?? ""; });
          return out;
        });
        return JSON.stringify(selected, null, 2);
      }
      case "stats": {
        const numericFields = Object.keys(rows[0] ?? {}).filter(k => !isNaN(Number(rows[0]?.[k])));
        const stats: Record<string, object> = {};
        for (const f of numericFields) {
          const vals = rows.map(r => Number(r[f])).filter(v => !isNaN(v));
          const sorted = [...vals].sort((a, b) => a - b);
          stats[f] = {
            count: vals.length,
            min: sorted[0],
            max: sorted[sorted.length - 1],
            mean: vals.reduce((a, b) => a + b, 0) / vals.length,
            sum: vals.reduce((a, b) => a + b, 0),
          };
        }
        return JSON.stringify(stats, null, 2);
      }
      default: return JSON.stringify(rows.slice(0, lim), null, 2);
    }
  } catch (e) {
    return `Error: ${e instanceof Error ? e.message : String(e)}`;
  }
}

/* ── generate_types ── */
async function toolGenerateTypes(p: {
  input: string;
  output_format?: string;
  type_name?: string;
  output_path?: string;
}): Promise<string> {
  const format = p.output_format ?? "typescript";
  const name = p.type_name ?? "GeneratedType";
  const formatInstructions: Record<string, string> = {
    typescript: `Generate a TypeScript interface named ${name}. Use exact property names and types from the JSON. Use optional (?) for nullable fields.`,
    zod: `Generate a Zod schema named ${name}Schema. Use z.object(), z.string(), z.number(), z.boolean(), z.array(), etc.`,
    drizzle: `Generate a Drizzle ORM PostgreSQL table definition named ${name}Table using pgTable, text(), integer(), boolean(), timestamp(), etc.`,
  };
  const prompt = `${formatInstructions[format] ?? formatInstructions.typescript}

Input JSON:
${p.input}

Return ONLY the code, no explanation, no markdown fences.`;

  try {
    const msg = await anthropic.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 1024,
      messages: [{ role: "user", content: prompt }],
    });
    const code = msg.content[0]?.type === "text" ? msg.content[0].text.replace(/^```[\w]*\n?/, "").replace(/\n?```$/, "") : "";
    if (p.output_path && code) {
      const abs = guardPath(p.output_path);
      if (abs) {
        fs.mkdirSync(path.dirname(abs), { recursive: true });
        fs.writeFileSync(abs, code, "utf-8");
        return `✅ Types written to ${p.output_path}\n\n${code}`;
      }
    }
    return code;
  } catch (e) {
    return `Error: ${e instanceof Error ? e.message : String(e)}`;
  }
}

/* ── benchmark ── */
async function toolBenchmark(p: {
  type?: string;
  command?: string;
  url?: string;
  iterations?: number;
  method?: string;
  body?: string;
}): Promise<string> {
  const type = p.type ?? "command";
  const iterations = p.iterations ?? (type === "http" ? 20 : 5);
  const timings: number[] = [];

  try {
    for (let i = 0; i < iterations; i++) {
      const start = performance.now();
      if (type === "http" && p.url) {
        await fetch(p.url, {
          method: p.method ?? "GET",
          body: p.body ?? undefined,
          signal: AbortSignal.timeout(10000),
        });
      } else if (p.command) {
        await execAsync(p.command, { cwd: WORKSPACE, timeout: 30000 });
      }
      timings.push(performance.now() - start);
    }

    const sorted = [...timings].sort((a, b) => a - b);
    const mean = timings.reduce((a, b) => a + b, 0) / timings.length;
    const p50 = sorted[Math.floor(sorted.length * 0.5)]!;
    const p95 = sorted[Math.floor(sorted.length * 0.95)]!;
    const p99 = sorted[Math.floor(sorted.length * 0.99)]!;
    const target = type === "http" ? p.url : p.command;

    return [
      `⏱️  Benchmark: ${target}`,
      `Iterations: ${iterations}`,
      `Min:  ${sorted[0]?.toFixed(1)}ms`,
      `Max:  ${sorted[sorted.length - 1]?.toFixed(1)}ms`,
      `Mean: ${mean.toFixed(1)}ms`,
      `p50:  ${p50.toFixed(1)}ms`,
      `p95:  ${p95.toFixed(1)}ms`,
      `p99:  ${p99.toFixed(1)}ms`,
    ].join("\n");
  } catch (e) {
    return `Benchmark Error: ${e instanceof Error ? e.message : String(e)}`;
  }
}

/* ── audit_dependencies ── */
async function toolAuditDependencies(p: { workspace?: string; severity?: string }): Promise<string> {
  const cmd = p.workspace
    ? `pnpm --filter ${p.workspace} audit --json 2>&1 || true`
    : `pnpm audit --json 2>&1 || true`;
  const raw = await toolExecuteCommand({ command: cmd, timeout_ms: 60000 });
  const sev = p.severity ?? "moderate";
  const sevLevels: Record<string, number> = { low: 0, moderate: 1, high: 2, critical: 3 };
  const minLevel = sevLevels[sev] ?? 1;

  try {
    const data = JSON.parse(raw) as { advisories?: Record<string, { module_name: string; severity: string; title: string; url: string; findings?: Array<{ version: string }> }> };
    const advisories = Object.values(data.advisories ?? {}).filter(a => (sevLevels[a.severity] ?? 0) >= minLevel);
    if (advisories.length === 0) return `✅ No ${sev}+ vulnerabilities found.`;
    return advisories.map(a =>
      `${a.severity.toUpperCase()}: ${a.module_name} — ${a.title}\n  Version: ${a.findings?.[0]?.version ?? "unknown"}\n  More: ${a.url}`
    ).join("\n\n");
  } catch {
    return raw.slice(0, 3000);
  }
}

/* ── analyze_bundle ── */
function toolAnalyzeBundle(p: { dist_path?: string; top_n?: number }): string {
  const distPath = p.dist_path ?? "dist";
  const abs = guardPath(distPath);
  if (!abs) return "Error: path escapes workspace";
  if (!fs.existsSync(abs)) return `Not found: ${distPath}. Run the build first.`;

  const topN = p.top_n ?? 20;
  const files: Array<{ path: string; size: number; gzip: number }> = [];

  function walk(dir: string) {
    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const e of entries) {
        const full = path.join(dir, e.name);
        if (e.isDirectory()) walk(full);
        else if (e.isFile() && /\.(js|css|wasm|json)$/.test(e.name) && !e.name.endsWith(".map")) {
          const stat = fs.statSync(full);
          files.push({ path: path.relative(WORKSPACE, full), size: stat.size, gzip: Math.round(stat.size * 0.35) });
        }
      }
    } catch { /* skip */ }
  }
  walk(abs);

  const sorted = files.sort((a, b) => b.size - a.size).slice(0, topN);
  const totalSize = files.reduce((sum, f) => sum + f.size, 0);
  const totalGzip = Math.round(totalSize * 0.35);

  const formatBytes = (b: number) => b > 1024 * 1024 ? `${(b / 1024 / 1024).toFixed(2)} MB` : `${(b / 1024).toFixed(1)} KB`;
  const lines = [`📦 Bundle Analysis — ${distPath}`, `Total: ${formatBytes(totalSize)} (gzip ~${formatBytes(totalGzip)})`, ``];
  for (const f of sorted) {
    const bar = "█".repeat(Math.round(f.size / (sorted[0]?.size ?? 1) * 20));
    lines.push(`${bar} ${f.path}`);
    lines.push(`  ${formatBytes(f.size)} (gzip ~${formatBytes(f.gzip)})`);
  }
  return lines.join("\n");
}

/* ── web_search ── */
async function toolWebSearch(p: { query: string; max_results?: number }): Promise<string> {
  try {
    const max = p.max_results ?? 8;
    const url = `https://api.duckduckgo.com/?q=${encodeURIComponent(p.query)}&format=json&no_redirect=1&no_html=1`;
    const res = await fetch(url, { headers: { "User-Agent": "Replit-Agent/4.0" } });
    const data = await res.json() as {
      Abstract?: string;
      AbstractURL?: string;
      AbstractSource?: string;
      RelatedTopics?: Array<{ Text?: string; FirstURL?: string; Topics?: Array<{ Text?: string; FirstURL?: string }> }>;
    };

    const results: string[] = [];
    if (data.Abstract) {
      results.push(`📖 Summary (${data.AbstractSource}): ${data.Abstract}\n   🔗 ${data.AbstractURL}`);
    }
    const topics = data.RelatedTopics ?? [];
    for (const t of topics) {
      if (results.length >= max) break;
      if (t.Text && t.FirstURL) {
        results.push(`• ${t.Text}\n  🔗 ${t.FirstURL}`);
      } else if (t.Topics) {
        for (const sub of t.Topics) {
          if (results.length >= max) break;
          if (sub.Text && sub.FirstURL) results.push(`• ${sub.Text}\n  🔗 ${sub.FirstURL}`);
        }
      }
    }

    if (results.length === 0) {
      const fallbackUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(p.query)}`;
      const fallbackRes = await fetch(fallbackUrl, { headers: { "User-Agent": "Mozilla/5.0" } });
      const html = await fallbackRes.text();
      const snippets = [...html.matchAll(/<a class="result__snippet"[^>]*>([^<]+)<\/a>/g)].slice(0, max);
      const links = [...html.matchAll(/<a class="result__url"[^>]*>([^<]+)<\/a>/g)].slice(0, max);
      for (let i = 0; i < snippets.length; i++) {
        results.push(`• ${snippets[i][1]?.trim()}\n  🔗 ${links[i]?.[1]?.trim() ?? "N/A"}`);
      }
    }

    if (results.length === 0) return `No results found for: "${p.query}"`;
    return `🔍 Search results for: "${p.query}"\n\n${results.join("\n\n")}`;
  } catch (e) {
    return `Search Error: ${e instanceof Error ? e.message : String(e)}`;
  }
}

/* ── run_tests ── */
async function toolRunTests(p: { workspace?: string; filter?: string; timeout_ms?: number }): Promise<string> {
  const timeout = p.timeout_ms ?? 90000;
  let cmd: string;
  if (p.workspace) {
    const filter = p.filter ? ` -- --reporter=verbose ${p.filter}` : "";
    cmd = `pnpm --filter ${p.workspace} run test${filter} 2>&1 || true`;
  } else {
    const filter = p.filter ? ` --reporter=verbose ${p.filter}` : "";
    cmd = `pnpm run test${filter} 2>&1 || true`;
  }
  const result = await toolExecuteCommand({ command: cmd, timeout_ms: timeout });
  const passMatch = result.match(/(\d+)\s+passed/);
  const failMatch = result.match(/(\d+)\s+failed/);
  const summary = [
    passMatch ? `✅ ${passMatch[1]} passed` : "",
    failMatch ? `❌ ${failMatch[1]} failed` : "",
  ].filter(Boolean).join(", ");
  return summary ? `${summary}\n\n${result}` : result;
}

/* ── lint_code ── */
async function toolLintCode(p: { workspace?: string; fix?: boolean; type_check_only?: boolean }): Promise<string> {
  const parts: string[] = [];
  if (!p.type_check_only) {
    const fixFlag = p.fix ? "--fix" : "";
    const lintCmd = p.workspace
      ? `pnpm --filter ${p.workspace} run lint ${fixFlag} 2>&1 || true`
      : `pnpm run lint ${fixFlag} 2>&1 || true`;
    parts.push("=== ESLint ===\n" + await toolExecuteCommand({ command: lintCmd, timeout_ms: 60000 }));
  }
  const tcCmd = p.workspace
    ? `pnpm --filter ${p.workspace} run typecheck 2>&1 || true`
    : `pnpm run typecheck 2>&1 || true`;
  parts.push("=== TypeScript ===\n" + await toolExecuteCommand({ command: tcCmd, timeout_ms: 60000 }));
  return parts.join("\n\n");
}

/* ── format_code ── */
async function toolFormatCode(p: { path?: string; check_only?: boolean }): Promise<string> {
  const target = p.path ?? ".";
  const checkFlag = p.check_only ? "--check" : "--write";
  const cmd = `npx prettier ${checkFlag} "${target}" --ignore-unknown 2>&1 || true`;
  return toolExecuteCommand({ command: cmd, timeout_ms: 60000 });
}

/* ── get_system_info ── */
async function toolGetSystemInfo(p: { include?: string[] }): Promise<string> {
  const want = new Set(p.include && p.include.length > 0 ? p.include : ["cpu", "memory", "disk", "os", "node", "network"]);
  const sections: string[] = [];

  if (want.has("os")) {
    const os = await toolExecuteCommand({ command: "uname -a && cat /etc/os-release 2>/dev/null | head -5 || true" });
    sections.push(`🖥️  OS:\n${os}`);
  }
  if (want.has("cpu")) {
    const cpu = await toolExecuteCommand({ command: "nproc && cat /proc/loadavg 2>/dev/null || true" });
    sections.push(`⚙️  CPU (cores / load avg):\n${cpu}`);
  }
  if (want.has("memory")) {
    const mem = await toolExecuteCommand({ command: "free -h 2>/dev/null || vm_stat 2>/dev/null || true" });
    sections.push(`🧠 Memory:\n${mem}`);
  }
  if (want.has("disk")) {
    const disk = await toolExecuteCommand({ command: "df -h . 2>/dev/null || true" });
    sections.push(`💾 Disk:\n${disk}`);
  }
  if (want.has("node")) {
    const node = await toolExecuteCommand({ command: "node --version && pnpm --version && which node" });
    sections.push(`🟢 Node / pnpm:\n${node}`);
  }
  if (want.has("network")) {
    const net = await toolExecuteCommand({ command: "ss -tlnp 2>/dev/null | head -20 || netstat -tlnp 2>/dev/null | head -20 || true" });
    sections.push(`🌐 Listening ports:\n${net}`);
  }

  return sections.join("\n\n") || "(no info)";
}

/* ── diff_files ── */
function toolDiffFiles(p: { file_a: string; file_b?: string; content_b?: string }): string {
  try {
    const absA = guardPath(p.file_a);
    if (!absA || !fs.existsSync(absA)) return `Error: file_a not found: ${p.file_a}`;
    const contentA = fs.readFileSync(absA, "utf-8");

    if (p.content_b !== undefined) {
      const linesA = contentA.split("\n");
      const linesB = p.content_b.split("\n");
      const diff: string[] = [`--- ${p.file_a}`, `+++ (new content)`];
      let i = 0, j = 0;
      while (i < linesA.length || j < linesB.length) {
        const a = linesA[i], b = linesB[j];
        if (a === b) { diff.push(`  ${a ?? ""}`); i++; j++; }
        else if (a !== undefined && (b === undefined || a !== b)) { diff.push(`- ${a}`); i++; }
        else { diff.push(`+ ${b}`); j++; }
      }
      return diff.join("\n");
    }

    if (p.file_b) {
      const absB = guardPath(p.file_b);
      if (!absB) return `Error: file_b path escapes workspace`;
      const result = execSync(`diff -u ${JSON.stringify(absA)} ${JSON.stringify(absB)} || true`, { encoding: "utf-8" });
      return result || "(files are identical)";
    }
    return "Error: provide file_b or content_b";
  } catch (e) {
    return `Error: ${e instanceof Error ? e.message : String(e)}`;
  }
}

/* ── tail_log ── */
function toolTailLog(p: { path: string; lines?: number; filter?: string }): string {
  try {
    const abs = p.path.startsWith("/tmp") ? p.path : (guardPath(p.path) ?? null);
    if (!abs) return "Error: Path escapes workspace";
    if (!fs.existsSync(abs)) return `Not found: ${p.path}`;
    const n = p.lines ?? 50;
    const content = fs.readFileSync(abs, "utf-8");
    let lines = content.split("\n");
    if (p.filter) lines = lines.filter(l => l.includes(p.filter!));
    const tail = lines.slice(-n).join("\n");
    return tail || "(empty)";
  } catch (e) {
    return `Error: ${e instanceof Error ? e.message : String(e)}`;
  }
}

/* ── create_zip ── */
async function toolCreateZip(p: { sources: string[]; output: string }): Promise<string> {
  const absOut = guardPath(p.output);
  if (!absOut) return "Error: output path escapes workspace";
  const sources = p.sources.map(s => {
    const a = guardPath(s);
    return a ? JSON.stringify(a) : null;
  }).filter(Boolean).join(" ");
  if (!sources) return "Error: no valid sources";
  return toolExecuteCommand({ command: `zip -r ${JSON.stringify(absOut)} ${sources} 2>&1` });
}

/* ── watch_port ── */
async function toolWatchPort(p: { port: number; host?: string }): Promise<string> {
  const host = p.host ?? "localhost";
  try {
    const result = await toolExecuteCommand({
      command: `curl -s --max-time 3 -o /dev/null -w "HTTP %{http_code}" http://${host}:${p.port}/ 2>&1 || echo "Connection refused"`,
    });
    const open = !result.includes("Connection refused") && !result.includes("Failed");
    return open
      ? `✅ Port ${p.port} on ${host} is OPEN and responding\n${result}`
      : `❌ Port ${p.port} on ${host} is CLOSED or not responding\n${result}`;
  } catch (e) {
    return `Error: ${e instanceof Error ? e.message : String(e)}`;
  }
}

/* ── encode_decode ── */
function toolEncodeDecode(p: { input: string; operation: string }): string {
  try {
    switch (p.operation) {
      case "base64_encode":  return Buffer.from(p.input).toString("base64");
      case "base64_decode":  return Buffer.from(p.input, "base64").toString("utf-8");
      case "url_encode":     return encodeURIComponent(p.input);
      case "url_decode":     return decodeURIComponent(p.input);
      case "json_format":    return JSON.stringify(JSON.parse(p.input), null, 2);
      case "hex_encode":     return Buffer.from(p.input).toString("hex");
      case "hex_decode":     return Buffer.from(p.input, "hex").toString("utf-8");
      case "html_encode":    return p.input.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
      case "html_decode":    return p.input.replace(/&amp;/g,"&").replace(/&lt;/g,"<").replace(/&gt;/g,">").replace(/&quot;/g,'"');
      default:               return `Unknown operation: ${p.operation}`;
    }
  } catch (e) {
    return `Error: ${e instanceof Error ? e.message : String(e)}`;
  }
}

/* ── hash_text ── */
function toolHashText(p: { input?: string; algorithm?: string }): string {
  const algo = p.algorithm ?? "sha256";
  try {
    if (algo === "uuid") {
      return crypto.randomUUID();
    }
    if (algo === "random_token") {
      return crypto.randomBytes(32).toString("hex");
    }
    if (!p.input) return "Error: input is required for hashing";
    return crypto.createHash(algo.replace("sha256","sha256").replace("sha512","sha512").replace("md5","md5")).update(p.input).digest("hex");
  } catch (e) {
    return `Error: ${e instanceof Error ? e.message : String(e)}`;
  }
}

/* ── screenshot_url ── */
async function toolScreenshotUrl(p: { url: string; description?: string }): Promise<string> {
  try {
    const res = await fetch(p.url, {
      headers: { "User-Agent": "Mozilla/5.0 Replit-Agent/4.0" },
      signal: AbortSignal.timeout(10000),
    });
    const status = `HTTP ${res.status} ${res.statusText}`;
    const contentType = res.headers.get("content-type") ?? "";
    if (contentType.includes("html")) {
      const html = await res.text();
      const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
      const h1Match = html.match(/<h1[^>]*>([^<]+)<\/h1>/i);
      const metaDesc = html.match(/<meta[^>]+name="description"[^>]+content="([^"]+)"/i);
      return [
        `📸 Page check: ${p.url}`,
        status,
        titleMatch ? `Title: ${titleMatch[1]?.trim()}` : "",
        h1Match ? `H1: ${h1Match[1]?.trim()}` : "",
        metaDesc ? `Description: ${metaDesc[1]?.trim()}` : "",
        p.description ? `\nLooking for: ${p.description}` : "",
        `\nPage size: ${html.length} chars`,
        `Content-Type: ${contentType}`,
      ].filter(Boolean).join("\n");
    }
    return `${status}\nContent-Type: ${contentType}\nSize: ${(await res.arrayBuffer()).byteLength} bytes`;
  } catch (e) {
    return `Screenshot Error: ${e instanceof Error ? e.message : String(e)}`;
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
              case "web_search":           result = await toolWebSearch(params as never); break;
              case "run_tests":            result = await toolRunTests(params as never); break;
              case "lint_code":            result = await toolLintCode(params as never); break;
              case "format_code":          result = await toolFormatCode(params as never); break;
              case "get_system_info":      result = await toolGetSystemInfo(params as never); break;
              case "diff_files":           result = toolDiffFiles(params as never); break;
              case "tail_log":             result = toolTailLog(params as never); break;
              case "create_zip":           result = await toolCreateZip(params as never); break;
              case "watch_port":           result = await toolWatchPort(params as never); break;
              case "encode_decode":        result = toolEncodeDecode(params as never); break;
              case "hash_text":            result = toolHashText(params as never); break;
              case "screenshot_url":       result = await toolScreenshotUrl(params as never); break;
              case "memory_store":         result = await toolMemoryStore(params as never); break;
              case "memory_recall":        result = await toolMemoryRecall(params as never); break;
              case "memory_delete":        result = await toolMemoryDelete(params as never); break;
              case "api_test":             result = await toolApiTest(params as never); break;
              case "code_review":          result = await toolCodeReview(params as never); break;
              case "security_scan":        result = await toolSecurityScan(params as never); break;
              case "notify_webhook":       result = await toolNotifyWebhook(params as never); break;
              case "query_data_file":      result = toolQueryDataFile(params as never); break;
              case "generate_types":       result = await toolGenerateTypes(params as never); break;
              case "benchmark":            result = await toolBenchmark(params as never); break;
              case "audit_dependencies":   result = await toolAuditDependencies(params as never); break;
              case "analyze_bundle":       result = toolAnalyzeBundle(params as never); break;
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
