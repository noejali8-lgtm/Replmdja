import { Router } from "express";
import { db, projects, projectSecrets } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import fs from "fs";
import path from "path";
import { spawn } from "child_process";

const router = Router();

const PROJECTS_ROOT = path.resolve("/home/runner/workspace/projects");
if (!fs.existsSync(PROJECTS_ROOT)) fs.mkdirSync(PROJECTS_ROOT, { recursive: true });

/* ─── Dynamic port allocator ─────────────────────────── */
const PORT_BASE = 4000;
const PORT_MAX  = 4999;
const usedPorts = new Set<number>();

function allocatePort(): number {
  for (let p = PORT_BASE; p <= PORT_MAX; p++) {
    if (!usedPorts.has(p)) { usedPorts.add(p); return p; }
  }
  return PORT_BASE + Math.floor(Math.random() * (PORT_MAX - PORT_BASE));
}

function releasePort(port: number) { usedPorts.delete(port); }

/* ─── Secret env vars — DB-persisted ─────────────────── */
export async function getProjectEnv(projectId: number): Promise<Record<string, string>> {
  try {
    const rows = await db.select().from(projectSecrets).where(eq(projectSecrets.projectId, projectId));
    return Object.fromEntries(rows.map(r => [r.key, r.value]));
  } catch {
    return {};
  }
}

/* ─── Templates ──────────────────────────────────────── */
const TEMPLATES: Record<string, Record<string, string>> = {
  node: {
    "index.js":     `const http = require("http");\nconst PORT = process.env.PORT || 3000;\nhttp.createServer((req, res) => {\n  res.setHeader("Content-Type", "text/html");\n  res.end(\`<h1 style="font-family:sans-serif;padding:2rem">Hello from Node.js! 🚀</h1><p>Running on port \${PORT}</p>\`);\n}).listen(PORT, () => console.log(\`✅ Server on http://localhost:\${PORT}\`));\n`,
    "package.json": `{\n  "name": "my-node-app",\n  "version": "1.0.0",\n  "main": "index.js",\n  "scripts": { "start": "node index.js", "dev": "node --watch index.js" }\n}\n`,
    "README.md":    `# My Node.js App\n\n\`\`\`bash\nnpm start\n\`\`\`\n`,
  },
  python: {
    "main.py":      `from http.server import HTTPServer, BaseHTTPRequestHandler\nimport os\n\nPORT = int(os.environ.get("PORT", 3000))\n\nclass Handler(BaseHTTPRequestHandler):\n    def do_GET(self):\n        self.send_response(200)\n        self.send_header("Content-type", "text/html")\n        self.end_headers()\n        self.wfile.write(b"<h1 style='font-family:sans-serif;padding:2rem'>Hello from Python! 🐍</h1>")\n    def log_message(self, *a): pass\n\nprint(f"✅ Server on http://localhost:{PORT}")\nHTTPServer(("", PORT), Handler).serve_forever()\n`,
    "requirements.txt": `# Add your dependencies here\n`,
    "README.md":    `# My Python App\n\n\`\`\`bash\npython3 main.py\n\`\`\`\n`,
  },
  html: {
    "index.html":   `<!DOCTYPE html>\n<html lang="en">\n<head>\n  <meta charset="UTF-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n  <title>My App</title>\n  <link rel="stylesheet" href="style.css">\n</head>\n<body>\n  <h1>Hello World! 🌍</h1>\n  <p>Welcome to my web app.</p>\n  <script src="app.js"></script>\n</body>\n</html>\n`,
    "style.css":    `* { box-sizing: border-box; margin: 0; padding: 0; }\nbody { font-family: system-ui, sans-serif; background: #0d1117; color: #e6edf3; padding: 2rem; }\nh1 { font-size: 2rem; margin-bottom: 1rem; color: #58a6ff; }\n`,
    "app.js":       `console.log("App loaded! 🚀");\n`,
    "README.md":    `# My HTML App\n\nOpen \`index.html\` in your browser.\n`,
  },
  react: {
    "src/App.tsx":  `import { useState } from "react";\n\nexport default function App() {\n  const [count, setCount] = useState(0);\n  return (\n    <div style={{ minHeight: "100vh", background: "#0d1117", color: "#e6edf3", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontFamily: "system-ui" }}>\n      <h1 style={{ fontSize: "2.5rem", fontWeight: "bold", marginBottom: "2rem" }}>⚡ React App</h1>\n      <button\n        onClick={() => setCount(c => c + 1)}\n        style={{ padding: "0.75rem 2rem", background: "#238636", border: "none", borderRadius: "8px", color: "white", fontSize: "1rem", cursor: "pointer", fontWeight: "bold" }}\n      >\n        Count: {count}\n      </button>\n    </div>\n  );\n}\n`,
    "src/main.tsx": `import React from "react";\nimport ReactDOM from "react-dom/client";\nimport App from "./App";\nimport "./index.css";\n\nReactDOM.createRoot(document.getElementById("root")!).render(\n  <React.StrictMode><App /></React.StrictMode>\n);\n`,
    "src/index.css": `*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }\nbody { background: #0d1117; color: #e6edf3; font-family: system-ui, sans-serif; }\n`,
    "index.html":   `<!DOCTYPE html>\n<html lang="en">\n<head>\n  <meta charset="UTF-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n  <title>React App</title>\n</head>\n<body>\n  <div id="root"></div>\n  <script type="module" src="/src/main.tsx"></script>\n</body>\n</html>\n`,
    "package.json": `{\n  "name": "my-react-app",\n  "version": "0.0.0",\n  "type": "module",\n  "scripts": {\n    "dev": "vite",\n    "build": "tsc -b && vite build",\n    "preview": "vite preview"\n  },\n  "dependencies": {\n    "react": "^19.0.0",\n    "react-dom": "^19.0.0"\n  },\n  "devDependencies": {\n    "@types/react": "^19.0.0",\n    "@types/react-dom": "^19.0.0",\n    "@vitejs/plugin-react": "^4.4.1",\n    "typescript": "~5.7.2",\n    "vite": "^6.3.1"\n  }\n}\n`,
    "vite.config.ts": `import { defineConfig } from "vite";\nimport react from "@vitejs/plugin-react";\n\nexport default defineConfig({\n  plugins: [react()],\n  server: { host: "0.0.0.0", strictPort: false },\n});\n`,
    "tsconfig.json": `{\n  "compilerOptions": {\n    "target": "ES2020",\n    "useDefineForClassFields": true,\n    "lib": ["ES2020", "DOM", "DOM.Iterable"],\n    "module": "ESNext",\n    "skipLibCheck": true,\n    "moduleResolution": "bundler",\n    "allowImportingTsExtensions": true,\n    "isolatedModules": true,\n    "moduleDetection": "force",\n    "noEmit": true,\n    "jsx": "react-jsx",\n    "strict": true\n  },\n  "include": ["src"]\n}\n`,
    "README.md":    `# My React App\n\n\`\`\`bash\nnpm install\nnpm run dev\n\`\`\`\n`,
  },
  flask: {
    "app.py":       `from flask import Flask, jsonify, render_template_string\nimport os\n\napp = Flask(__name__)\nPORT = int(os.environ.get("PORT", 3000))\n\nHTML = """\n<!DOCTYPE html>\n<html><body style="font-family:sans-serif;padding:2rem;background:#0d1117;color:#e6edf3">\n  <h1>🐍 Flask App</h1>\n  <p>Running on port {{ port }}</p>\n</body></html>\n"""\n\n@app.route("/")\ndef index():\n    return render_template_string(HTML, port=PORT)\n\n@app.route("/api/hello")\ndef hello():\n    return jsonify({"message": "Hello from Flask!", "port": PORT})\n\nif __name__ == "__main__":\n    print(f"✅ Flask on http://localhost:{PORT}")\n    app.run(host="0.0.0.0", port=PORT, debug=True)\n`,
    "requirements.txt": `flask>=3.0.0\n`,
    "README.md":    `# Flask App\n\n\`\`\`bash\npip install -r requirements.txt\npython app.py\n\`\`\`\n`,
  },
};

function slugify(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") +
    "-" + Math.random().toString(36).slice(2, 7);
}

/* ── Running processes: { proc, port } ── */
const runningProcs = new Map<number, { proc: ReturnType<typeof spawn>; port: number }>();

/* ── Public explore (MUST be before /:id) ── */
router.get("/explore", async (req, res) => {
  try {
    const rows = await db.select().from(projects)
      .where(eq(projects.isPublic, true))
      .orderBy(projects.updatedAt)
      .limit(60);
    res.json(rows);
  } catch {
    res.status(500).json({ error: "Failed to fetch public projects" });
  }
});

/* ── Import from GitHub (clone) ── */
router.post("/import", async (req, res) => {
  const { githubUrl, name, token } = req.body ?? {};
  if (!githubUrl) { res.status(400).json({ error: "githubUrl required" }); return; }

  const repoName = name ?? githubUrl.split("/").pop()?.replace(/\.git$/, "") ?? "imported-repo";
  const slug     = slugify(repoName);
  const dirPath  = path.join(PROJECTS_ROOT, slug);

  try {
    fs.mkdirSync(dirPath, { recursive: true });
    const { default: simpleGit } = await import("simple-git");
    const git = simpleGit();

    let cloneUrl = githubUrl;
    if (token && githubUrl.includes("github.com")) {
      cloneUrl = githubUrl.replace("https://", `https://${token}@`);
    }
    await git.clone(cloneUrl, dirPath, ["--depth", "1"]);

    const files = fs.existsSync(dirPath) ? fs.readdirSync(dirPath) : [];
    let language = "node";
    if (files.some(f => f === "requirements.txt" || f === "pyproject.toml")) language = "python";
    else if (files.some(f => f === "index.html")) language = "html";

    const PYTHON = "/nix/store/h097imm3w6dpx10qynrd2sz9fks2wbq8-python3-3.12.11/bin/python3";
    const runMap: Record<string, string> = {
      node: "node index.js", python: `${PYTHON} main.py`, html: "", react: "npm run dev",
    };

    const [project] = await db.insert(projects).values({
      userId: req.session?.userId ?? null,
      name: repoName, slug,
      description: `Imported from ${githubUrl}`,
      language, dirPath,
      entryFile: language === "python" ? "main.py" : "index.js",
      runCmd: runMap[language] ?? "node index.js",
      isPublic: false,
    }).returning();
    res.status(201).json(project);
  } catch (err) {
    try { fs.rmSync(dirPath, { recursive: true, force: true }); } catch { /**/ }
    console.error("Import error:", err);
    res.status(500).json({ error: String((err as Error).message ?? "Failed to import repository") });
  }
});

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
      const fullPath = path.join(dirPath, fname);
      fs.mkdirSync(path.dirname(fullPath), { recursive: true });
      fs.writeFileSync(fullPath, content, "utf-8");
    }
    const PYTHON = "/nix/store/h097imm3w6dpx10qynrd2sz9fks2wbq8-python3-3.12.11/bin/python3";
    const runMap: Record<string, string> = {
      node:   "node index.js",
      python: `${PYTHON} main.py`,
      html:   "",
      react:  "npm run dev",
      flask:  `${PYTHON} app.py`,
    };
    const entryMap: Record<string, string> = {
      node: "index.js", python: "main.py", html: "index.html",
      react: "src/App.tsx", flask: "app.py",
    };
    const [project] = await db.insert(projects).values({
      userId:    req.session?.userId ?? null,
      name, slug, description: description ?? "", language,
      template, dirPath,
      entryFile: entryMap[language] ?? "index.js",
      runCmd:    runMap[language] ?? "",
    }).returning();
    res.status(201).json(project);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create project" });
  }
});

/* ── Get project ── */
router.get("/:id", async (req, res) => {
  const [p] = await db.select().from(projects).where(eq(projects.id, Number(req.params.id))).limit(1);
  if (!p) { res.status(404).json({ error: "Not found" }); return; }
  const running = runningProcs.get(p.id);
  res.json({ ...p, running: !!running, port: running?.port ?? null });
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

/* ── Toggle public/private ── */
router.patch("/:id/visibility", async (req, res) => {
  const { isPublic } = req.body ?? {};
  try {
    const [p] = await db.update(projects)
      .set({ isPublic: Boolean(isPublic), updatedAt: new Date() })
      .where(eq(projects.id, Number(req.params.id)))
      .returning();
    res.json(p);
  } catch {
    res.status(500).json({ error: "Failed to update visibility" });
  }
});

/* ── Fork project ── */
router.post("/:id/fork", async (req, res) => {
  const [source] = await db.select().from(projects).where(eq(projects.id, Number(req.params.id))).limit(1);
  if (!source) { res.status(404).json({ error: "Not found" }); return; }

  const forkName = `${source.name}-fork`;
  const slug     = slugify(forkName);
  const dirPath  = path.join(PROJECTS_ROOT, slug);

  try {
    fs.mkdirSync(dirPath, { recursive: true });
    copyDirRecursive(source.dirPath, dirPath);

    const [forked] = await db.insert(projects).values({
      userId:    req.session?.userId ?? null,
      name:      forkName, slug,
      description: `Forked from ${source.name}`,
      language:  source.language,
      template:  source.template,
      dirPath,
      entryFile: source.entryFile,
      runCmd:    source.runCmd,
      isPublic:  false,
    }).returning();
    res.status(201).json(forked);
  } catch (err) {
    try { fs.rmSync(dirPath, { recursive: true, force: true }); } catch { /**/ }
    console.error("Fork error:", err);
    res.status(500).json({ error: "Failed to fork project" });
  }
});

function copyDirRecursive(src: string, dest: string) {
  if (!fs.existsSync(src)) return;
  const SKIP = new Set(["node_modules", ".git", "__pycache__", ".venv", "dist", ".next", "build"]);
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    if (SKIP.has(entry.name)) continue;
    const srcPath  = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      fs.mkdirSync(destPath, { recursive: true });
      copyDirRecursive(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

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
  const SKIP = new Set(["node_modules", ".git", "__pycache__", ".venv", "dist", ".next", "build"]);
  function walk(dir: string, base = ""): object[] {
    if (!fs.existsSync(dir)) return [];
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    return entries.flatMap(e => {
      if (SKIP.has(e.name) || e.name.startsWith(".") && e.name !== ".env") return [];
      const relPath = base ? `${base}/${e.name}` : e.name;
      if (e.isDirectory()) return [{ name: e.name, path: relPath, type: "dir", children: walk(path.join(dir, e.name), relPath) }];
      const size = fs.statSync(path.join(dir, e.name)).size;
      const ext = e.name.split(".").pop() ?? "";
      return [{ name: e.name, path: relPath, type: "file", size, ext }];
    });
  }
  res.json(walk(p.dirPath));
});

/* ── Read file ── */
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

/* ── Write file ── */
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

/* ── Delete file ── */
router.delete("/:id/file", async (req, res) => {
  const [p] = await db.select().from(projects).where(eq(projects.id, Number(req.params.id))).limit(1);
  if (!p) { res.status(404).json({ error: "Not found" }); return; }
  const rel      = String(req.query.path ?? "");
  if (!rel)      { res.status(400).json({ error: "path required" }); return; }
  const filePath = path.resolve(p.dirPath, rel);
  if (!filePath.startsWith(p.dirPath)) { res.status(403).json({ error: "Forbidden" }); return; }
  if (fs.existsSync(filePath)) fs.rmSync(filePath, { recursive: true, force: true });
  res.json({ ok: true });
});

/* ── Create file ── */
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

/* ── Make directory ── */
router.post("/:id/mkdir", async (req, res) => {
  const [p] = await db.select().from(projects).where(eq(projects.id, Number(req.params.id))).limit(1);
  if (!p) { res.status(404).json({ error: "Not found" }); return; }
  const rel      = String(req.query.path ?? "");
  if (!rel)      { res.status(400).json({ error: "path required" }); return; }
  const dirPath = path.resolve(p.dirPath, rel);
  if (!dirPath.startsWith(p.dirPath)) { res.status(403).json({ error: "Forbidden" }); return; }
  fs.mkdirSync(dirPath, { recursive: true });
  res.json({ ok: true });
});

/* ── Run project (SSE stream) with real dynamic ports ── */
router.post("/:id/run", async (req, res) => {
  const [p] = await db.select().from(projects).where(eq(projects.id, Number(req.params.id))).limit(1);
  if (!p) { res.status(404).json({ error: "Not found" }); return; }

  /* Kill existing process */
  const prev = runningProcs.get(p.id);
  if (prev) {
    try { prev.proc.kill("SIGTERM"); } catch { /**/ }
    releasePort(prev.port);
    runningProcs.delete(p.id);
  }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders();

  const send = (type: string, data: string) =>
    res.write(`data: ${JSON.stringify({ type, data, ts: Date.now() })}\n\n`);

  const port  = allocatePort();
  const PYTHON = "/nix/store/h097imm3w6dpx10qynrd2sz9fks2wbq8-python3-3.12.11/bin/python3";

  /* Determine run command */
  let cmd = p.runCmd ?? "";
  if (!cmd) {
    if (p.language === "python" || p.language === "flask") cmd = `${PYTHON} ${p.entryFile ?? "main.py"}`;
    else if (p.language === "node") cmd = `node ${p.entryFile ?? "index.js"}`;
    else if (p.language === "react") cmd = "npm run dev";
    else cmd = `node ${p.entryFile ?? "index.js"}`;
  }

  /* For React/Vite, patch the port into vite config */
  if (p.language === "react" || cmd.includes("vite")) {
    cmd = `npx vite --port ${port} --host 0.0.0.0`;
  }

  const parts = cmd.split(" ");

  send("info", `▶  Running: ${cmd}`);
  send("info", `📁 Directory: ${p.dirPath}`);
  send("info", `🔌 Port: ${port}`);

  /* Inject project secrets as env vars */
  const secrets = await getProjectEnv(p.id);

  const proc = spawn(parts[0], parts.slice(1), {
    cwd: p.dirPath,
    env: {
      ...process.env,
      ...secrets,
      PORT: String(port),
      HOST: "0.0.0.0",
      VITE_PORT: String(port),
    },
    stdio: ["pipe", "pipe", "pipe"],
  });

  runningProcs.set(p.id, { proc, port });

  let started = false;
  const tryDetectStart = (data: string) => {
    if (started) return;
    const lower = data.toLowerCase();
    if (
      lower.includes("localhost:") || lower.includes(`port ${port}`) ||
      lower.includes("listening on") || lower.includes("ready in") ||
      lower.includes("server running") || lower.includes("➜") ||
      lower.includes("✅")
    ) {
      started = true;
      const devDomain = process.env.REPLIT_DEV_DOMAIN ?? process.env.REPLIT_DOMAINS?.split(",")[0] ?? "";
      const previewUrl = devDomain
        ? `https://${devDomain.replace(/^[^.]+/, `repl-${port}`)}`
        : `http://localhost:${port}`;
      send("url", previewUrl);
      send("port", String(port));
      send("ready", `✅ App running at port ${port}`);
    }
  };

  proc.stdout.on("data", d => {
    const text = d.toString();
    send("stdout", text);
    tryDetectStart(text);
  });
  proc.stderr.on("data", d => {
    const text = d.toString();
    send("stderr", text);
    tryDetectStart(text);
  });
  proc.on("close", code => {
    releasePort(port);
    runningProcs.delete(p.id);
    send("exit", `Process exited with code ${code}`);
    res.end();
  });
  proc.on("error", err => {
    releasePort(port);
    runningProcs.delete(p.id);
    send("error", `Failed to start: ${err.message}`);
    res.end();
  });

  req.on("close", () => { try { proc.kill("SIGTERM"); } catch { /**/ } });
});

/* ── Stop running project ── */
router.delete("/:id/run", async (req, res) => {
  const entry = runningProcs.get(Number(req.params.id));
  if (entry) {
    try { entry.proc.kill("SIGTERM"); } catch { /**/ }
    releasePort(entry.port);
    runningProcs.delete(Number(req.params.id));
  }
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

  const PYTHON = "/nix/store/h097imm3w6dpx10qynrd2sz9fks2wbq8-python3-3.12.11/bin/python3";
  const [cmd, ...args] = manager === "pip"
    ? [PYTHON, "-m", "pip", "install", "--user", ...packages]
    : ["npm", "install", ...packages];

  send("info", `📦 ${manager === "pip" ? "pip" : "npm"} install ${packages.join(" ")}`);

  const proc = spawn(cmd, args, {
    cwd: p.dirPath,
    env: { ...process.env },
    stdio: ["pipe", "pipe", "pipe"],
  });

  proc.stdout.on("data", d => send("stdout", d.toString()));
  proc.stderr.on("data", d => send("stderr", d.toString()));
  proc.on("close", code => {
    if (code === 0) send("success", "✓ Packages installed successfully");
    else send("error", `✗ Installation failed (code ${code})`);
    res.end();
  });
  proc.on("error", err => { send("error", `Failed: ${err.message}`); res.end(); });
  req.on("close", () => { try { proc.kill("SIGTERM"); } catch { /**/ } });
});

/* ── Get project run status ── */
router.get("/:id/status", async (req, res) => {
  const entry = runningProcs.get(Number(req.params.id));
  res.json({ running: !!entry, port: entry?.port ?? null });
});

/* ── Secrets routes (DB-persisted) ── */
router.get("/:id/secrets", async (req, res) => {
  const id = Number(req.params.id);
  const [p] = await db.select().from(projects).where(eq(projects.id, id)).limit(1);
  if (!p) { res.status(404).json({ error: "Not found" }); return; }
  const rows = await db.select().from(projectSecrets).where(eq(projectSecrets.projectId, id));
  const secrets = rows.map(r => ({
    key: r.key,
    hasValue: r.value !== "",
    preview: (r.value.slice(0, 3) || "•••") + "***",
  }));
  res.json({ secrets });
});

router.get("/:id/secrets/:key", async (req, res) => {
  const id = Number(req.params.id);
  const [p] = await db.select().from(projects).where(eq(projects.id, id)).limit(1);
  if (!p) { res.status(404).json({ error: "Not found" }); return; }
  const [row] = await db.select().from(projectSecrets)
    .where(and(eq(projectSecrets.projectId, id), eq(projectSecrets.key, req.params.key))).limit(1);
  if (!row) { res.status(404).json({ error: "Secret not found" }); return; }
  res.json({ key: row.key, value: row.value });
});

router.put("/:id/secrets/:key", async (req, res) => {
  const id = Number(req.params.id);
  const [p] = await db.select().from(projects).where(eq(projects.id, id)).limit(1);
  if (!p) { res.status(404).json({ error: "Not found" }); return; }
  const { value = "" } = req.body ?? {};
  const key = req.params.key.toUpperCase().replace(/[^A-Z0-9_]/g, "_");
  const [existing] = await db.select().from(projectSecrets)
    .where(and(eq(projectSecrets.projectId, id), eq(projectSecrets.key, key))).limit(1);
  if (existing) {
    await db.update(projectSecrets).set({ value: String(value), updatedAt: new Date() })
      .where(and(eq(projectSecrets.projectId, id), eq(projectSecrets.key, key)));
  } else {
    await db.insert(projectSecrets).values({ projectId: id, key, value: String(value) });
  }
  res.json({ ok: true, key });
});

router.delete("/:id/secrets/:key", async (req, res) => {
  const id = Number(req.params.id);
  await db.delete(projectSecrets)
    .where(and(eq(projectSecrets.projectId, id), eq(projectSecrets.key, req.params.key)));
  res.json({ ok: true });
});

export default router;
