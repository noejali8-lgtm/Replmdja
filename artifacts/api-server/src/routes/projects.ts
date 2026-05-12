import { Router } from "express";
import { db, projects } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import fs from "fs";
import path from "path";
import { spawn } from "child_process";

const router = Router();

const PROJECTS_ROOT = path.resolve("/home/runner/workspace/projects");
if (!fs.existsSync(PROJECTS_ROOT)) fs.mkdirSync(PROJECTS_ROOT, { recursive: true });

const TEMPLATES: Record<string, Record<string, string>> = {
  node: {
    "index.js":    `const http = require("http");\nconst PORT = process.env.PORT || 3000;\nhttp.createServer((req, res) => {\n  res.end("Hello from Node.js!");\n}).listen(PORT, () => console.log(\`Server on port \${PORT}\`));\n`,
    "package.json": `{\n  "name": "my-app",\n  "version": "1.0.0",\n  "main": "index.js",\n  "scripts": { "start": "node index.js" }\n}\n`,
    "README.md":   `# My Node.js App\n\nRun: \`node index.js\`\n`,
  },
  python: {
    "main.py":     `def greet(name):\n    return f"Hello, {name}!"\n\nif __name__ == "__main__":\n    print(greet("World"))\n`,
    "README.md":   `# My Python App\n\nRun: \`python3 main.py\`\n`,
  },
  html: {
    "index.html":  `<!DOCTYPE html>\n<html lang="en">\n<head>\n  <meta charset="UTF-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n  <title>My App</title>\n  <style>body { font-family: sans-serif; padding: 2rem; }</style>\n</head>\n<body>\n  <h1>Hello World!</h1>\n  <p>Welcome to my app.</p>\n  <script>\n    console.log("App loaded");\n  </script>\n</body>\n</html>\n`,
    "style.css":   `body { margin: 0; font-family: sans-serif; background: #f5f5f5; }\n`,
  },
  react: {
    "index.html":  `<!DOCTYPE html>\n<html><head><meta charset="UTF-8"><title>React App</title></head><body><div id="root"></div><script src="https://unpkg.com/react@18/umd/react.development.js"></script><script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script><script src="https://unpkg.com/@babel/standalone/babel.min.js"></script><script type="text/babel" src="App.jsx"></script></body></html>\n`,
    "App.jsx":     `function App() {\n  const [count, setCount] = React.useState(0);\n  return (\n    <div style={{ padding: "2rem", fontFamily: "sans-serif" }}>\n      <h1>React App</h1>\n      <button onClick={() => setCount(c => c + 1)}>Count: {count}</button>\n    </div>\n  );\n}\nReactDOM.createRoot(document.getElementById("root")).render(<App />);\n`,
    "style.css":   `body { margin: 0; background: #0d1117; color: #c9d1d9; font-family: sans-serif; }\n`,
  },
};

function slugify(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") +
    "-" + Math.random().toString(36).slice(2, 7);
}

/* ── List projects ── */
router.get("/", async (req, res) => {
  const userId = req.session?.userId;
  try {
    const rows = userId
      ? await db.select().from(projects).where(eq(projects.userId, userId)).orderBy(projects.createdAt)
      : await db.select().from(projects).orderBy(projects.createdAt);
    res.json(rows);
  } catch {
    res.status(500).json({ error: "Failed to fetch projects" });
  }
});

/* ── Create project ── */
router.post("/", async (req, res) => {
  const { name, description, language = "node", template = "blank" } = req.body ?? {};
  if (!name) { res.status(400).json({ error: "name required" }); return; }
  const slug    = slugify(name);
  const dirPath = path.join(PROJECTS_ROOT, slug);
  try {
    fs.mkdirSync(dirPath, { recursive: true });
    const files = TEMPLATES[language] ?? TEMPLATES.node;
    for (const [fname, content] of Object.entries(files)) {
      fs.writeFileSync(path.join(dirPath, fname), content, "utf-8");
    }
    const entryMap: Record<string, string> = { node: "index.js", python: "main.py", html: "index.html", react: "index.html" };
    const PYTHON = "/nix/store/h097imm3w6dpx10qynrd2sz9fks2wbq8-python3-3.12.11/bin/python3";
    const runMap: Record<string, string> = { node: "node index.js", python: `${PYTHON} main.py`, html: "", react: "" };
    const [project] = await db.insert(projects).values({
      userId:    req.session?.userId ?? null,
      name, slug, description: description ?? "", language,
      template, dirPath,
      entryFile: entryMap[language] ?? "index.js",
      runCmd:    runMap[language] ?? "",
    }).returning();
    res.status(201).json(project);
  } catch (err) {
    res.status(500).json({ error: "Failed to create project" });
  }
});

/* ── Get project ── */
router.get("/:id", async (req, res) => {
  const [p] = await db.select().from(projects).where(eq(projects.id, Number(req.params.id))).limit(1);
  if (!p) { res.status(404).json({ error: "Not found" }); return; }
  res.json(p);
});

/* ── Update project metadata ── */
router.patch("/:id", async (req, res) => {
  const { name, description, runCmd, entryFile } = req.body ?? {};
  const [p] = await db.update(projects).set({
    ...(name        && { name }),
    ...(description !== undefined && { description }),
    ...(runCmd      !== undefined && { runCmd }),
    ...(entryFile   && { entryFile }),
    updatedAt: new Date(),
  }).where(eq(projects.id, Number(req.params.id))).returning();
  res.json(p);
});

/* ── Delete project ── */
router.delete("/:id", async (req, res) => {
  const [p] = await db.select().from(projects).where(eq(projects.id, Number(req.params.id))).limit(1);
  if (!p) { res.status(404).json({ error: "Not found" }); return; }
  try { fs.rmSync(p.dirPath, { recursive: true, force: true }); } catch { /**/ }
  await db.delete(projects).where(eq(projects.id, Number(req.params.id)));
  res.json({ ok: true });
});

/* ── List files in project ── */
router.get("/:id/files", async (req, res) => {
  const [p] = await db.select().from(projects).where(eq(projects.id, Number(req.params.id))).limit(1);
  if (!p) { res.status(404).json({ error: "Not found" }); return; }
  function walk(dir: string, base = ""): object[] {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    return entries.flatMap(e => {
      const relPath = base ? `${base}/${e.name}` : e.name;
      if (e.isDirectory()) return [{ name: e.name, path: relPath, type: "dir", children: walk(path.join(dir, e.name), relPath) }];
      const size = fs.statSync(path.join(dir, e.name)).size;
      return [{ name: e.name, path: relPath, type: "file", size }];
    });
  }
  res.json(walk(p.dirPath));
});

/* ── Read file  GET /api/projects/:id/file?path=src/App.tsx ── */
router.get("/:id/file", async (req, res) => {
  const [p] = await db.select().from(projects).where(eq(projects.id, Number(req.params.id))).limit(1);
  if (!p) { res.status(404).json({ error: "Not found" }); return; }
  const rel      = String(req.query.path ?? "");
  if (!rel)      { res.status(400).json({ error: "path required" }); return; }
  const filePath = path.resolve(p.dirPath, rel);
  if (!filePath.startsWith(p.dirPath)) { res.status(403).json({ error: "Forbidden" }); return; }
  if (!fs.existsSync(filePath))        { res.status(404).json({ error: "File not found" }); return; }
  const content = fs.readFileSync(filePath, "utf-8");
  res.json({ content, path: rel, name: path.basename(filePath) });
});

/* ── Write file  PUT /api/projects/:id/file?path=src/App.tsx ── */
router.put("/:id/file", async (req, res) => {
  const [p] = await db.select().from(projects).where(eq(projects.id, Number(req.params.id))).limit(1);
  if (!p) { res.status(404).json({ error: "Not found" }); return; }
  const rel      = String(req.query.path ?? "");
  if (!rel)      { res.status(400).json({ error: "path required" }); return; }
  const filePath = path.resolve(p.dirPath, rel);
  if (!filePath.startsWith(p.dirPath)) { res.status(403).json({ error: "Forbidden" }); return; }
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, req.body.content ?? "", "utf-8");
  await db.update(projects).set({ updatedAt: new Date() }).where(eq(projects.id, Number(req.params.id)));
  res.json({ ok: true });
});

/* ── Delete file  DELETE /api/projects/:id/file?path=src/App.tsx ── */
router.delete("/:id/file", async (req, res) => {
  const [p] = await db.select().from(projects).where(eq(projects.id, Number(req.params.id))).limit(1);
  if (!p) { res.status(404).json({ error: "Not found" }); return; }
  const rel      = String(req.query.path ?? "");
  if (!rel)      { res.status(400).json({ error: "path required" }); return; }
  const filePath = path.resolve(p.dirPath, rel);
  if (!filePath.startsWith(p.dirPath)) { res.status(403).json({ error: "Forbidden" }); return; }
  if (fs.existsSync(filePath)) fs.rmSync(filePath);
  res.json({ ok: true });
});

/* ── Create new file  POST /api/projects/:id/file?path=src/newFile.ts ── */
router.post("/:id/file", async (req, res) => {
  const [p] = await db.select().from(projects).where(eq(projects.id, Number(req.params.id))).limit(1);
  if (!p) { res.status(404).json({ error: "Not found" }); return; }
  const rel      = String(req.query.path ?? "");
  if (!rel)      { res.status(400).json({ error: "path required" }); return; }
  const filePath = path.resolve(p.dirPath, rel);
  if (!filePath.startsWith(p.dirPath)) { res.status(403).json({ error: "Forbidden" }); return; }
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  if (!fs.existsSync(filePath)) fs.writeFileSync(filePath, req.body.content ?? "", "utf-8");
  res.status(201).json({ ok: true, path: rel });
});

/* ── Run project (SSE stream) ── */
const runningProcs = new Map<number, ReturnType<typeof spawn>>();

router.post("/:id/run", async (req, res) => {
  const [p] = await db.select().from(projects).where(eq(projects.id, Number(req.params.id))).limit(1);
  if (!p) { res.status(404).json({ error: "Not found" }); return; }

  const prev = runningProcs.get(p.id);
  if (prev) { try { prev.kill("SIGTERM"); } catch { /**/ } }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders();

  const send = (type: string, data: string) =>
    res.write(`data: ${JSON.stringify({ type, data, ts: Date.now() })}\n\n`);

  const cmd   = p.runCmd || (p.language === "python" ? "python3 main.py" : "node index.js");
  const parts = cmd.split(" ");
  send("info", `▶ Running: ${cmd}`);
  send("info", `📁 Directory: ${p.dirPath}`);

  const proc = spawn(parts[0], parts.slice(1), {
    cwd: p.dirPath,
    env: { ...process.env, PORT: "3001" },
    stdio: ["pipe", "pipe", "pipe"],
  });

  runningProcs.set(p.id, proc);

  proc.stdout.on("data", d => send("stdout", d.toString()));
  proc.stderr.on("data", d => send("stderr", d.toString()));
  proc.on("close", code => {
    send("exit", `Process exited with code ${code}`);
    runningProcs.delete(p.id);
    res.end();
  });
  proc.on("error", err => {
    send("error", `Failed to start: ${err.message}`);
    res.end();
  });

  req.on("close", () => { try { proc.kill("SIGTERM"); } catch { /**/ } });
});

/* ── Stop running project ── */
router.delete("/:id/run", async (req, res) => {
  const proc = runningProcs.get(Number(req.params.id));
  if (proc) { proc.kill("SIGTERM"); runningProcs.delete(Number(req.params.id)); }
  res.json({ ok: true });
});

/* ── Install packages (npm / pip) via SSE stream ── */
router.post("/:id/install", async (req, res) => {
  const [p] = await db.select().from(projects).where(eq(projects.id, Number(req.params.id))).limit(1);
  if (!p) { res.status(404).json({ error: "Not found" }); return; }

  const { packages = [], manager = "npm" } = req.body ?? {};
  if (!packages.length) { res.status(400).json({ error: "packages array required" }); return; }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders();

  const send = (type: string, data: string) =>
    res.write(`data: ${JSON.stringify({ type, data, ts: Date.now() })}\n\n`);

  let cmd: string;
  let args: string[];

  if (manager === "pip") {
    const PYTHON = "/nix/store/h097imm3w6dpx10qynrd2sz9fks2wbq8-python3-3.12.11/bin/python3";
    cmd = PYTHON;
    args = ["-m", "pip", "install", "--user", ...packages];
    send("info", `📦 Installing Python packages: ${packages.join(", ")}`);
  } else {
    cmd = "npm";
    args = ["install", ...packages];
    send("info", `📦 Installing npm packages: ${packages.join(", ")}`);
  }

  send("info", `$ ${cmd} ${args.join(" ")}`);

  const proc = spawn(cmd, args, {
    cwd: p.dirPath,
    env: { ...process.env },
    stdio: ["pipe", "pipe", "pipe"],
  });

  proc.stdout.on("data", d => send("stdout", d.toString()));
  proc.stderr.on("data", d => send("stderr", d.toString()));
  proc.on("close", code => {
    if (code === 0) {
      send("success", `✓ Packages installed successfully`);
    } else {
      send("error", `✗ Installation failed with code ${code}`);
    }
    res.end();
  });
  proc.on("error", err => {
    send("error", `Failed to run installer: ${err.message}`);
    res.end();
  });

  req.on("close", () => { try { proc.kill("SIGTERM"); } catch { /**/ } });
});

/* ── Get project run status ── */
router.get("/:id/status", async (req, res) => {
  const id = Number(req.params.id);
  const isRunning = runningProcs.has(id);
  res.json({ running: isRunning });
});

export default router;
