import { Router } from "express";
import { db, projects } from "@workspace/db";
import { eq } from "drizzle-orm";
import { spawn, execSync } from "child_process";
import { anthropic } from "@workspace/integrations-anthropic-ai";
import fs from "fs";
import path from "path";

const router = Router({ mergeParams: true });

const PYTHON = "/nix/store/h097imm3w6dpx10qynrd2sz9fks2wbq8-python3-3.12.11/bin/python3";

async function getProject(id: number) {
  const [p] = await db.select().from(projects).where(eq(projects.id, id)).limit(1);
  return p ?? null;
}

function makeSse(res: import("express").Response) {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders();
  return (data: object) => {
    try { res.write(`data: ${JSON.stringify(data)}\n\n`); } catch { /* client gone */ }
  };
}

/* ─── GET /:id/packages — list installed packages from package.json ── */
router.get("/:id/packages", async (req, res) => {
  const p = await getProject(Number(req.params.id));
  if (!p) { res.status(404).json({ error: "Not found" }); return; }

  const pkgPath = path.join(p.dirPath, "package.json");
  const reqPath = path.join(p.dirPath, "requirements.txt");

  if (fs.existsSync(pkgPath)) {
    try {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
      res.json({
        manager: "npm",
        dependencies: pkg.dependencies ?? {},
        devDependencies: pkg.devDependencies ?? {},
        scripts: pkg.scripts ?? {},
        name: pkg.name,
        version: pkg.version,
      });
    } catch {
      res.json({ manager: "npm", dependencies: {}, devDependencies: {}, scripts: {} });
    }
  } else if (fs.existsSync(reqPath)) {
    const lines = fs
      .readFileSync(reqPath, "utf-8")
      .split("\n")
      .filter(l => l.trim() && !l.startsWith("#"));
    res.json({ manager: "pip", packages: lines });
  } else {
    res.json({ manager: "unknown", dependencies: {}, devDependencies: {}, scripts: {} });
  }
});

/* ─── POST /:id/packages/uninstall — uninstall packages with SSE ── */
router.post("/:id/packages/uninstall", async (req, res) => {
  const p = await getProject(Number(req.params.id));
  if (!p) { res.status(404).json({ error: "Not found" }); return; }

  const { packages = [] }: { packages: string[] } = req.body ?? {};
  if (!packages.length) { res.status(400).json({ error: "packages array required" }); return; }

  const send = makeSse(res);
  const isPy = p.language === "python" || p.language === "flask";
  send({ type: "info", data: `📦 Removing ${packages.join(", ")}…` });

  const [cmd, ...args] = isPy
    ? [PYTHON, "-m", "pip", "uninstall", "-y", ...packages]
    : ["npm", "uninstall", ...packages];

  const proc = spawn(cmd, args, { cwd: p.dirPath, env: { ...process.env } });
  proc.stdout.on("data", d => send({ type: "stdout", data: d.toString() }));
  proc.stderr.on("data", d => send({ type: "stderr", data: d.toString() }));
  proc.on("close", code => {
    if (code === 0) send({ type: "success", data: `✓ Removed ${packages.join(", ")}` });
    else send({ type: "error", data: `✗ Failed (exit ${code})` });
    res.end();
  });
  proc.on("error", err => { send({ type: "error", data: err.message }); res.end(); });
  req.on("close", () => { try { proc.kill("SIGTERM"); } catch { /* */ } });
});

/* ─── GET /:id/audit — real npm audit ── */
router.get("/:id/audit", async (req, res) => {
  const p = await getProject(Number(req.params.id));
  if (!p) { res.status(404).json({ error: "Not found" }); return; }

  const pkgPath = path.join(p.dirPath, "package.json");
  if (!fs.existsSync(pkgPath)) {
    res.json({ vulnerabilities: [], metadata: { total: 0 }, error: "No package.json found" });
    return;
  }

  const nodeModules = path.join(p.dirPath, "node_modules");
  if (!fs.existsSync(nodeModules)) {
    res.json({ vulnerabilities: [], metadata: { total: 0 }, error: "Run npm install first to audit packages" });
    return;
  }

  function parseAuditOutput(raw: string) {
    try {
      const data = JSON.parse(raw);
      const vulns = Object.values(data.vulnerabilities ?? {}) as Record<string, unknown>[];
      const formatted = vulns.map(v => {
        const via = Array.isArray(v.via) ? v.via : [];
        const first = typeof via[0] === "object" ? (via[0] as Record<string, string>) : null;
        return {
          id: String(v.name ?? ""),
          pkg: String(v.name ?? ""),
          version: String(v.range ?? "unknown"),
          severity: String(v.severity ?? "moderate"),
          title: first?.title ?? String(v.name ?? ""),
          description: first?.url ?? "",
          fixedIn: (v.fixAvailable as Record<string, string> | undefined)?.version,
          cve: first?.cve ?? undefined,
          url: first?.url ?? undefined,
        };
      });
      const meta = (data.metadata?.vulnerabilities ?? {}) as Record<string, number>;
      return { vulnerabilities: formatted, metadata: meta };
    } catch {
      return { vulnerabilities: [], metadata: { total: 0 }, error: "Could not parse audit results" };
    }
  }

  try {
    const result = execSync("npm audit --json 2>/dev/null", {
      cwd: p.dirPath,
      encoding: "utf-8",
      timeout: 30_000,
      maxBuffer: 5 * 1024 * 1024,
    });
    res.json(parseAuditOutput(result));
  } catch (e) {
    const out = (e as { stdout?: string; stderr?: string }).stdout ?? "";
    if (out.trim().startsWith("{")) {
      res.json(parseAuditOutput(out));
    } else {
      res.json({ vulnerabilities: [], metadata: { total: 0 }, error: String((e as Error).message ?? e) });
    }
  }
});

/* ─── POST /:id/test — run tests with SSE streaming ── */
router.post("/:id/test", async (req, res) => {
  const p = await getProject(Number(req.params.id));
  if (!p) { res.status(404).json({ error: "Not found" }); return; }

  const { script = "test" } = req.body ?? {};
  const send = makeSse(res);

  if (p.language === "python" || p.language === "flask") {
    send({ type: "info", data: "🧪 Running pytest…" });
    const proc = spawn(PYTHON, ["-m", "pytest", "-v", "--tb=short", "--no-header"], {
      cwd: p.dirPath,
      env: { ...process.env },
    });
    let pass = 0, fail = 0;
    const results: { name: string; status: "pass" | "fail"; duration?: number }[] = [];
    proc.stdout.on("data", d => {
      const text = d.toString();
      text.split("\n").forEach(line => {
        if (/PASSED/.test(line)) { pass++; const m = line.match(/(.+?)::/); if (m) results.push({ name: m[0].replace("::", " › "), status: "pass" }); }
        if (/FAILED/.test(line)) { fail++; const m = line.match(/(.+?)::/); if (m) results.push({ name: m[0].replace("::", " › "), status: "fail" }); }
      });
      send({ type: "stdout", data: text });
    });
    proc.stderr.on("data", d => send({ type: "stderr", data: d.toString() }));
    proc.on("close", code => { send({ type: "done", code, pass, fail, results }); res.end(); });
    proc.on("error", err => { send({ type: "error", data: err.message }); res.end(); });
    req.on("close", () => { try { proc.kill(); } catch { /* */ } });
    return;
  }

  const pkgPath = path.join(p.dirPath, "package.json");
  if (!fs.existsSync(pkgPath)) {
    const send2 = makeSse(res);
    send2({ type: "error", data: "No package.json found" });
    send2({ type: "done", code: 1, pass: 0, fail: 0, results: [] });
    res.end();
    return;
  }

  let pkg: Record<string, unknown> = {};
  try { pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8")); } catch { /* */ }

  const scripts = (pkg.scripts ?? {}) as Record<string, string>;
  if (!scripts[script]) {
    send({ type: "error", data: `No "${script}" script in package.json. Add it first.` });
    send({ type: "done", code: 1, pass: 0, fail: 0, results: [] });
    res.end();
    return;
  }

  send({ type: "info", data: `🧪 npm run ${script}` });
  const proc = spawn("npm", ["run", script], {
    cwd: p.dirPath,
    env: { ...process.env, CI: "true", FORCE_COLOR: "0" },
  });

  let pass = 0, fail = 0;
  const results: { name: string; status: "pass" | "fail" }[] = [];

  function parseLine(line: string) {
    if (/✓|✔|✅|PASS/.test(line) && !/FAILED/.test(line)) {
      pass++;
      const m = line.match(/[✓✔✅]\s+(.+?)(?:\s+\d+ms)?$/);
      if (m) results.push({ name: m[1].trim(), status: "pass" });
    }
    if (/✗|×|❌|FAIL|●/.test(line)) {
      fail++;
      const m = line.match(/[✗×❌●]\s+(.+)/);
      if (m) results.push({ name: m[1].trim(), status: "fail" });
    }
  }

  proc.stdout.on("data", d => { const t = d.toString(); t.split("\n").forEach(parseLine); send({ type: "stdout", data: t }); });
  proc.stderr.on("data", d => send({ type: "stderr", data: d.toString() }));
  proc.on("close", code => { send({ type: "done", code, pass, fail, results }); res.end(); });
  proc.on("error", err => { send({ type: "error", data: err.message }); res.end(); });
  req.on("close", () => { try { proc.kill(); } catch { /* */ } });
});

/* ─── POST /:id/coverage — run tests with coverage ── */
router.post("/:id/coverage", async (req, res) => {
  const p = await getProject(Number(req.params.id));
  if (!p) { res.status(404).json({ error: "Not found" }); return; }

  const send = makeSse(res);
  send({ type: "info", data: "📊 Running tests with coverage…" });

  if (p.language === "python" || p.language === "flask") {
    const proc = spawn(PYTHON, ["-m", "pytest", "--cov=.", "--cov-report=term-missing", "-q", "--no-header"], {
      cwd: p.dirPath,
      env: { ...process.env },
    });
    const lines: string[] = [];
    proc.stdout.on("data", d => { const t = d.toString(); lines.push(...t.split("\n")); send({ type: "stdout", data: t }); });
    proc.stderr.on("data", d => send({ type: "stderr", data: d.toString() }));
    proc.on("close", code => {
      const cLines = lines.filter(l => /\d+%/.test(l) && /\.py/.test(l));
      const files = cLines.map(l => {
        const parts = l.trim().split(/\s+/);
        return { file: parts[0] ?? "", stmts: parseInt(parts[1] ?? "0"), miss: parseInt(parts[2] ?? "0"), cover: parseInt((parts[3] ?? "0%").replace("%", "")) };
      }).filter(f => f.file && f.file !== "TOTAL");
      const total = lines.find(l => l.startsWith("TOTAL"));
      const totalCover = parseInt((total?.trim().split(/\s+/)[3] ?? "0%").replace("%", ""));
      send({ type: "done", code, files, totalCover });
      res.end();
    });
    proc.on("error", err => { send({ type: "error", data: err.message }); res.end(); });
    return;
  }

  const proc = spawn("npx", ["--yes", "vitest", "run", "--coverage", "--reporter=verbose"], {
    cwd: p.dirPath,
    env: { ...process.env, CI: "true", FORCE_COLOR: "0" },
  });

  const allLines: string[] = [];
  proc.stdout.on("data", d => { const t = d.toString(); allLines.push(...t.split("\n")); send({ type: "stdout", data: t }); });
  proc.stderr.on("data", d => send({ type: "stderr", data: d.toString() }));
  proc.on("close", code => {
    const tableRegex = /^\s*(\S+)\s*\|\s*([\d.]+)\s*\|\s*([\d.]+)\s*\|\s*([\d.]+)\s*\|\s*([\d.]+)/;
    const files: { file: string; stmts: number; branch: number; funcs: number; lines: number }[] = [];
    allLines.forEach(line => {
      const m = tableRegex.exec(line);
      if (m && m[1] !== "File" && m[1] !== "All") {
        files.push({ file: m[1], stmts: parseFloat(m[2]), branch: parseFloat(m[3]), funcs: parseFloat(m[4]), lines: parseFloat(m[5]) });
      }
    });
    const totalLine = allLines.find(l => /\|\s*\d+\.?\d*\s*\|\s*\d+\.?\d*\s*\|\s*\d+\.?\d*\s*\|\s*\d+\.?\d*/.test(l) && /All\s+files/.test(l));
    const totalMatch = totalLine ? tableRegex.exec(totalLine) : null;
    const totalCover = totalMatch ? parseFloat(totalMatch[5]) : 0;
    send({ type: "done", code, files, totalCover: Math.round(totalCover) });
    res.end();
  });
  proc.on("error", err => { send({ type: "error", data: `No test runner found: ${err.message}` }); res.end(); });
  req.on("close", () => { try { proc.kill(); } catch { /* */ } });
});

/* ─── POST /:id/build — build project and return bundle stats ── */
router.post("/:id/build", async (req, res) => {
  const p = await getProject(Number(req.params.id));
  if (!p) { res.status(404).json({ error: "Not found" }); return; }

  const send = makeSse(res);

  if (p.language === "python" || p.language === "flask") {
    send({ type: "info", data: "ℹ Python projects don't require a build step." });
    send({ type: "done", code: 0, files: [], totalSize: 0 });
    res.end();
    return;
  }

  const pkgPath = path.join(p.dirPath, "package.json");
  if (!fs.existsSync(pkgPath)) {
    send({ type: "error", data: "No package.json found" });
    res.end();
    return;
  }

  let scripts: Record<string, string> = {};
  try { scripts = (JSON.parse(fs.readFileSync(pkgPath, "utf-8")).scripts ?? {}) as Record<string, string>; } catch { /* */ }

  const cmdArgs = scripts.build ? ["npm", "run", "build"] : ["npx", "--yes", "vite", "build"];
  send({ type: "info", data: `🔨 ${cmdArgs.join(" ")}` });

  const proc = spawn(cmdArgs[0], cmdArgs.slice(1), {
    cwd: p.dirPath,
    env: { ...process.env },
  });

  const lines: string[] = [];
  proc.stdout.on("data", d => { const t = d.toString(); lines.push(...t.split("\n")); send({ type: "stdout", data: t }); });
  proc.stderr.on("data", d => { const t = d.toString(); lines.push(...t.split("\n")); send({ type: "stderr", data: t }); });

  proc.on("close", code => {
    const fileRe = /(dist\/[^\s]+)\s+([\d.]+)\s*(kB|B|MB)(?:\s*│\s*gzip:\s*([\d.]+)\s*(kB|B|MB))?/g;
    const files: { name: string; size: number; gzip?: number }[] = [];
    const full = lines.join("\n");
    let m: RegExpExecArray | null;
    const toBytes = (n: string, u: string) => { const v = parseFloat(n); return u === "MB" ? v * 1024 * 1024 : u === "kB" ? v * 1024 : v; };
    while ((m = fileRe.exec(full)) !== null) {
      files.push({ name: m[1], size: toBytes(m[2], m[3]), gzip: m[4] ? toBytes(m[4], m[5]) : undefined });
    }
    const totalSize = files.reduce((a, f) => a + f.size, 0);
    send({ type: "done", code, files, totalSize });
    res.end();
  });
  proc.on("error", err => { send({ type: "error", data: err.message }); res.end(); });
  req.on("close", () => { try { proc.kill(); } catch { /* */ } });
});

/* ─── POST /:id/loadtest — HTTP load test with SSE streaming ── */
router.post("/:id/loadtest", async (req, res) => {
  const { url, concurrency = 10, duration = 10, method = "GET", body: reqBody } = req.body ?? {};
  if (!url) { res.status(400).json({ error: "url required" }); return; }

  const conc  = Math.min(50, Math.max(1, Number(concurrency)));
  const dur   = Math.min(60, Math.max(1, Number(duration)));
  const send  = makeSse(res);

  send({ type: "started", url, concurrency: conc, duration: dur });

  const stats = { total: 0, errors: 0, latencies: [] as number[] };
  const startTime = Date.now();
  const endTime   = startTime + dur * 1000;
  let running = true;

  const ticker = setInterval(() => {
    const elapsed  = (Date.now() - startTime) / 1000;
    const sorted   = [...stats.latencies].sort((a, b) => a - b);
    const avg      = sorted.length ? sorted.reduce((a, b) => a + b, 0) / sorted.length : 0;
    send({
      type: "tick",
      elapsed: Math.round(elapsed * 10) / 10,
      total: stats.total,
      errors: stats.errors,
      rps: Math.round(stats.total / Math.max(elapsed, 0.1) * 10) / 10,
      latency: {
        avg: Math.round(avg),
        p50: sorted[Math.floor(sorted.length * 0.5)] ?? 0,
        p95: sorted[Math.floor(sorted.length * 0.95)] ?? 0,
        p99: sorted[Math.floor(sorted.length * 0.99)] ?? 0,
      },
    });
  }, 1000);

  async function worker() {
    while (running && Date.now() < endTime) {
      const t0 = Date.now();
      try {
        await fetch(url as string, {
          method: method as string,
          signal: AbortSignal.timeout(10_000),
          ...(reqBody ? { body: reqBody as string, headers: { "Content-Type": "application/json" } } : {}),
        });
        stats.latencies.push(Date.now() - t0);
      } catch { stats.errors++; }
      stats.total++;
    }
  }

  await Promise.all(Array.from({ length: conc }, () => worker()));
  clearInterval(ticker);
  running = false;

  const elapsed  = (Date.now() - startTime) / 1000;
  const sorted   = [...stats.latencies].sort((a, b) => a - b);
  const avg      = sorted.length ? sorted.reduce((a, b) => a + b, 0) / sorted.length : 0;
  send({
    type: "done",
    elapsed: Math.round(elapsed * 10) / 10,
    total: stats.total,
    errors: stats.errors,
    rps: Math.round(stats.total / Math.max(elapsed, 0.1) * 10) / 10,
    latency: {
      avg: Math.round(avg),
      p50: sorted[Math.floor(sorted.length * 0.5)] ?? 0,
      p95: sorted[Math.floor(sorted.length * 0.95)] ?? 0,
      p99: sorted[Math.floor(sorted.length * 0.99)] ?? 0,
      min: sorted[0] ?? 0,
      max: sorted[sorted.length - 1] ?? 0,
    },
  });
  res.end();
});

/* ─── GET /:id/i18n — list locale files ── */
router.get("/:id/i18n", async (req, res) => {
  const p = await getProject(Number(req.params.id));
  if (!p) { res.status(404).json({ error: "Not found" }); return; }

  const candidates = [
    path.join(p.dirPath, "locales"),
    path.join(p.dirPath, "src", "locales"),
    path.join(p.dirPath, "public", "locales"),
  ];

  const dir = candidates.find(d => fs.existsSync(d)) ?? candidates[0];
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, "en.json"), JSON.stringify({ greeting: "Hello", farewell: "Goodbye", welcome: "Welcome" }, null, 2));
  }

  const languages = fs
    .readdirSync(dir)
    .filter(f => f.endsWith(".json"))
    .map(f => f.replace(".json", ""));

  res.json({ dir: dir.replace(p.dirPath + "/", ""), languages });
});

/* ─── GET /:id/i18n/:lang — read translation file ── */
router.get("/:id/i18n/:lang", async (req, res) => {
  const p = await getProject(Number(req.params.id));
  if (!p) { res.status(404).json({ error: "Not found" }); return; }

  const lang = req.params.lang.replace(/[^a-z-_]/gi, "");
  const candidates = [
    path.join(p.dirPath, "locales", `${lang}.json`),
    path.join(p.dirPath, "src", "locales", `${lang}.json`),
    path.join(p.dirPath, "public", "locales", lang, "translation.json"),
  ];

  const file = candidates.find(d => fs.existsSync(d));
  if (!file) { res.json({ translations: {} }); return; }

  try {
    res.json({ translations: JSON.parse(fs.readFileSync(file, "utf-8")), file: file.replace(p.dirPath + "/", "") });
  } catch {
    res.json({ translations: {}, error: "Invalid JSON in translation file" });
  }
});

/* ─── PUT /:id/i18n/:lang — save translation file ── */
router.put("/:id/i18n/:lang", async (req, res) => {
  const p = await getProject(Number(req.params.id));
  if (!p) { res.status(404).json({ error: "Not found" }); return; }

  const lang = req.params.lang.replace(/[^a-z-_]/gi, "");
  const { translations } = req.body ?? {};

  const dir = path.join(p.dirPath, "locales");
  fs.mkdirSync(dir, { recursive: true });
  const filePath = path.join(dir, `${lang}.json`);
  fs.writeFileSync(filePath, JSON.stringify(translations, null, 2));
  res.json({ ok: true, file: `locales/${lang}.json` });
});

/* ─── POST /:id/i18n/translate — AI-powered translation ── */
router.post("/:id/i18n/translate", async (req, res) => {
  const { keys, from = "en", to } = req.body ?? {};
  if (!keys || !to) { res.status(400).json({ error: "keys and to required" }); return; }

  try {
    const response = await anthropic.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 2048,
      messages: [{
        role: "user",
        content: `Translate these JSON translation keys from "${from}" to "${to}". Return ONLY a valid JSON object with the same keys but translated values. No markdown fences, no explanation, no comments — just the JSON object.\n\n${JSON.stringify(keys, null, 2)}`,
      }],
    });

    const text = response.content[0]?.type === "text" ? response.content[0].text.trim() : "{}";
    const clean = text.replace(/^```json?\n?/, "").replace(/\n?```$/, "").trim();
    try {
      res.json({ translations: JSON.parse(clean) });
    } catch {
      res.json({ translations: keys, error: "AI returned invalid JSON" });
    }
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

/* ─── POST /:id/diagnostics — TypeScript / Python type errors ── */
router.post("/:id/diagnostics", async (req, res) => {
  const p = await getProject(Number(req.params.id));
  if (!p) { res.status(404).json({ error: "Not found" }); return; }

  if (p.language === "python" || p.language === "flask") {
    try {
      execSync(`${PYTHON} -m py_compile $(find . -name "*.py" ! -path "*/node_modules/*" ! -path "*/.git/*") 2>&1`, {
        cwd: p.dirPath, encoding: "utf-8", timeout: 15_000,
      });
      res.json({ diagnostics: [], language: "python", summary: "No syntax errors found ✓" });
    } catch (e) {
      const output = (e as { stdout?: string; stderr?: string }).stdout ?? (e as { stdout?: string; stderr?: string }).stderr ?? String(e);
      const lines = output.split("\n").filter(Boolean);
      const diagnostics = lines.map(line => {
        const m = line.match(/^(.+?):(\d+):\s*(.+)$/);
        return m ? { file: m[1], line: parseInt(m[2]), col: 1, severity: "error", code: "SyntaxError", message: m[3] } : null;
      }).filter(Boolean);
      res.json({ diagnostics, language: "python" });
    }
    return;
  }

  const tsConfig = path.join(p.dirPath, "tsconfig.json");
  if (!fs.existsSync(tsConfig)) {
    res.json({ diagnostics: [], language: "javascript", summary: "No tsconfig.json (add TypeScript for type checking)" });
    return;
  }

  try {
    execSync("npx tsc --noEmit 2>&1", { cwd: p.dirPath, encoding: "utf-8", timeout: 30_000 });
    res.json({ diagnostics: [], language: "typescript", summary: "No type errors found ✓" });
  } catch (e) {
    const output = (e as { stdout?: string }).stdout ?? String(e);
    const re = /^(.+?)\((\d+),(\d+)\):\s+(error|warning)\s+(TS\d+):\s+(.+)$/gm;
    const diagnostics: { file: string; line: number; col: number; severity: string; code: string; message: string }[] = [];
    let m: RegExpExecArray | null;
    while ((m = re.exec(output)) !== null) {
      diagnostics.push({ file: m[1], line: parseInt(m[2]), col: parseInt(m[3]), severity: m[4], code: m[5], message: m[6] });
    }
    res.json({ diagnostics, language: "typescript" });
  }
});

export default router;
