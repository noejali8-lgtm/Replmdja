import { Router } from "express";
import fs from "fs";
import path from "path";

const router = Router();

const WORKSPACE = path.resolve("/home/runner/workspace");

const SKIP_DIRS  = new Set(["node_modules", ".git", "dist", ".local", ".cache", "__pycache__", ".replit", ".upm", "coverage"]);
const SKIP_FILES = new Set([".DS_Store", ".gitignore.bak"]);
const MAX_DEPTH  = 5;
const MAX_FILE_SIZE = 200 * 1024; // 200 KB

export interface FsNode {
  name:      string;
  path:      string;
  type:      "file" | "dir";
  ext?:      string;
  size?:     number;
  lines?:    number;
  children?: FsNode[];
}

function walkDir(absPath: string, relBase: string, depth: number): FsNode[] {
  if (depth > MAX_DEPTH) return [];
  let entries: fs.Dirent[];
  try {
    entries = fs.readdirSync(absPath, { withFileTypes: true });
  } catch {
    return [];
  }

  const dirs:  FsNode[] = [];
  const files: FsNode[] = [];

  for (const e of entries) {
    if (SKIP_FILES.has(e.name)) continue;

    const relPath = path.join(relBase, e.name);
    const absChild = path.join(absPath, e.name);

    if (e.isDirectory()) {
      if (SKIP_DIRS.has(e.name)) continue;
      dirs.push({
        name: e.name,
        path: relPath,
        type: "dir",
        children: walkDir(absChild, relPath, depth + 1),
      });
    } else if (e.isFile()) {
      let size = 0;
      try { size = fs.statSync(absChild).size; } catch { /**/ }
      const ext = path.extname(e.name).slice(1).toLowerCase();
      files.push({ name: e.name, path: relPath, type: "file", ext, size });
    }
  }

  // dirs first, then files — both alphabetical
  dirs.sort((a, b) => a.name.localeCompare(b.name));
  files.sort((a, b) => a.name.localeCompare(b.name));
  return [...dirs, ...files];
}

/* ── Allowed project roots ── */
const ROOTS: Record<string, string> = {
  "app-builder": "artifacts/app-builder/src",
  "api-server":  "artifacts/api-server/src",
  "lib-db":      "lib/db/src",
  "lib-api":     "lib/api-zod/src",
  "replit-ide":  "artifacts/replit-ide/src",
};

router.get("/roots", (_req, res) => {
  const result = Object.entries(ROOTS).map(([id, rel]) => {
    const abs = path.join(WORKSPACE, rel);
    let fileCount = 0;
    try {
      const all = fs.readdirSync(abs, { recursive: true } as Parameters<typeof fs.readdirSync>[1]) as string[];
      fileCount = all.filter(f => {
        try { return fs.statSync(path.join(abs, f)).isFile(); } catch { return false; }
      }).length;
    } catch { /**/ }
    return { id, label: id, path: rel, fileCount };
  });
  res.json(result);
});

router.get("/tree", (req, res) => {
  const rootId = String(req.query.root ?? "app-builder");
  const rel    = ROOTS[rootId] ?? ROOTS["app-builder"];
  const abs    = path.join(WORKSPACE, rel);

  if (!abs.startsWith(WORKSPACE)) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  const tree = walkDir(abs, rel, 0);
  res.json({ root: rootId, path: rel, tree });
});

router.get("/content", (req, res) => {
  const relPath = String(req.query.path ?? "");
  if (!relPath) { res.status(400).json({ error: "path required" }); return; }

  const abs = path.resolve(WORKSPACE, relPath);
  if (!abs.startsWith(WORKSPACE)) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  let stat: fs.Stats;
  try { stat = fs.statSync(abs); } catch {
    res.status(404).json({ error: "File not found" });
    return;
  }

  if (!stat.isFile()) { res.status(400).json({ error: "Not a file" }); return; }
  if (stat.size > MAX_FILE_SIZE) {
    res.json({ content: `[File too large to display — ${Math.round(stat.size / 1024)} KB]`, size: stat.size, lines: 0, truncated: true });
    return;
  }

  let content = "";
  try { content = fs.readFileSync(abs, "utf-8"); } catch {
    res.status(500).json({ error: "Cannot read file" });
    return;
  }

  const lines = content.split("\n").length;
  const ext   = path.extname(abs).slice(1).toLowerCase();
  res.json({ content, size: stat.size, lines, ext, name: path.basename(abs) });
});

export default router;
