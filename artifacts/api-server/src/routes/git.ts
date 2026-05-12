import { Router } from "express";
import { db, projects } from "@workspace/db";
import { eq } from "drizzle-orm";
import path from "path";
import fs from "fs";
import simpleGit from "simple-git";

const router = Router({ mergeParams: true });

async function getProject(id: number) {
  const [p] = await db.select().from(projects).where(eq(projects.id, id)).limit(1);
  return p ?? null;
}

function git(dirPath: string) {
  return simpleGit(dirPath);
}

/* ── Init repo ── */
router.post("/:id/git/init", async (req, res) => {
  const p = await getProject(Number(req.params.id));
  if (!p) { res.status(404).json({ error: "Project not found" }); return; }

  try {
    const g = git(p.dirPath);
    await g.init();
    await g.addConfig("user.name",  req.session?.username ?? "Replit User");
    await g.addConfig("user.email", "user@replit.com");
    res.json({ ok: true, message: "Git repository initialised" });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

/* ── Status ── */
router.get("/:id/git/status", async (req, res) => {
  const p = await getProject(Number(req.params.id));
  if (!p) { res.status(404).json({ error: "Project not found" }); return; }

  const gitDir = path.join(p.dirPath, ".git");
  if (!fs.existsSync(gitDir)) {
    res.json({ initialized: false, files: [], branch: null, ahead: 0, behind: 0 });
    return;
  }

  try {
    const g = git(p.dirPath);
    const status = await g.status();
    const files = [
      ...status.modified.map(f => ({ path: f, status: "M", staged: false })),
      ...status.created.map(f => ({ path: f, status: "A", staged: false })),
      ...status.deleted.map(f => ({ path: f, status: "D", staged: false })),
      ...status.renamed.map(f => ({ path: f.to, from: f.from, status: "R", staged: false })),
      ...status.staged.map(f => ({ path: f, status: "M", staged: true })),
      ...status.not_added.map(f => ({ path: f, status: "?", staged: false })),
    ];
    // deduplicate — staged entries take priority
    const seen = new Map<string, typeof files[0]>();
    for (const f of files) {
      if (!seen.has(f.path) || f.staged) seen.set(f.path, f);
    }
    res.json({
      initialized: true,
      files: [...seen.values()],
      branch: status.current ?? "main",
      ahead:  status.ahead,
      behind: status.behind,
      tracking: status.tracking,
    });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

/* ── Stage files ── */
router.post("/:id/git/stage", async (req, res) => {
  const p = await getProject(Number(req.params.id));
  if (!p) { res.status(404).json({ error: "Project not found" }); return; }

  const { paths = [] }: { paths: string[] } = req.body ?? {};
  try {
    const g = git(p.dirPath);
    if (paths.length === 0) {
      await g.add(".");
    } else {
      await g.add(paths);
    }
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

/* ── Unstage files ── */
router.post("/:id/git/unstage", async (req, res) => {
  const p = await getProject(Number(req.params.id));
  if (!p) { res.status(404).json({ error: "Project not found" }); return; }

  const { paths = [] }: { paths: string[] } = req.body ?? {};
  try {
    const g = git(p.dirPath);
    await g.reset(["HEAD", "--", ...(paths.length ? paths : ["."])]);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

/* ── Commit ── */
router.post("/:id/git/commit", async (req, res) => {
  const p = await getProject(Number(req.params.id));
  if (!p) { res.status(404).json({ error: "Project not found" }); return; }

  const { message, authorName, authorEmail } = req.body ?? {};
  if (!message?.trim()) { res.status(400).json({ error: "commit message required" }); return; }

  try {
    const g = git(p.dirPath);
    if (authorName) await g.addConfig("user.name",  authorName);
    if (authorEmail) await g.addConfig("user.email", authorEmail);
    const result = await g.commit(message.trim());
    res.json({ ok: true, hash: result.commit, summary: result.summary });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

/* ── Log (recent commits) ── */
router.get("/:id/git/log", async (req, res) => {
  const p = await getProject(Number(req.params.id));
  if (!p) { res.status(404).json({ error: "Project not found" }); return; }

  const gitDir = path.join(p.dirPath, ".git");
  if (!fs.existsSync(gitDir)) { res.json({ commits: [] }); return; }

  try {
    const g = git(p.dirPath);
    const log = await g.log({ maxCount: 20 });
    res.json({ commits: log.all });
  } catch {
    res.json({ commits: [] });
  }
});

/* ── Set remote ── */
router.post("/:id/git/remote", async (req, res) => {
  const p = await getProject(Number(req.params.id));
  if (!p) { res.status(404).json({ error: "Project not found" }); return; }

  const { url } = req.body ?? {};
  if (!url) { res.status(400).json({ error: "url required" }); return; }

  try {
    const g = git(p.dirPath);
    const remotes = await g.getRemotes(false);
    if (remotes.find(r => r.name === "origin")) {
      await g.removeRemote("origin");
    }
    await g.addRemote("origin", url);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

/* ── Push ── */
router.post("/:id/git/push", async (req, res) => {
  const p = await getProject(Number(req.params.id));
  if (!p) { res.status(404).json({ error: "Project not found" }); return; }

  const { token, branch = "main" } = req.body ?? {};
  try {
    const g = git(p.dirPath);
    const status = await g.status();
    const currentBranch = status.current ?? branch;

    // Inject token into remote URL if provided
    if (token) {
      const remotes = await g.getRemotes(true);
      const origin = remotes.find(r => r.name === "origin");
      if (origin?.refs?.push) {
        const authedUrl = origin.refs.push.replace("https://", `https://${token}@`);
        await g.removeRemote("origin");
        await g.addRemote("origin", authedUrl);
      }
    }

    await g.push("origin", currentBranch, ["--set-upstream"]);
    res.json({ ok: true, branch: currentBranch });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

/* ── Pull ── */
router.post("/:id/git/pull", async (req, res) => {
  const p = await getProject(Number(req.params.id));
  if (!p) { res.status(404).json({ error: "Project not found" }); return; }

  try {
    const g = git(p.dirPath);
    const result = await g.pull();
    res.json({ ok: true, summary: result.summary });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

/* ── List branches ── */
router.get("/:id/git/branches", async (req, res) => {
  const p = await getProject(Number(req.params.id));
  if (!p) { res.status(404).json({ error: "Project not found" }); return; }

  const gitDir = path.join(p.dirPath, ".git");
  if (!fs.existsSync(gitDir)) { res.json({ branches: [], current: null }); return; }

  try {
    const g = git(p.dirPath);
    const summary = await g.branchLocal();
    res.json({ branches: summary.all, current: summary.current });
  } catch {
    res.json({ branches: [], current: null });
  }
});

/* ── Create / switch branch ── */
router.post("/:id/git/branch", async (req, res) => {
  const p = await getProject(Number(req.params.id));
  if (!p) { res.status(404).json({ error: "Project not found" }); return; }

  const { name, create = false } = req.body ?? {};
  if (!name) { res.status(400).json({ error: "branch name required" }); return; }

  try {
    const g = git(p.dirPath);
    if (create) {
      await g.checkoutLocalBranch(name);
    } else {
      await g.checkout(name);
    }
    res.json({ ok: true, branch: name });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

/* ── AI commit message ── */
router.post("/:id/git/ai-message", async (req, res) => {
  const p = await getProject(Number(req.params.id));
  if (!p) { res.status(404).json({ error: "Project not found" }); return; }

  const gitDir = path.join(p.dirPath, ".git");
  if (!fs.existsSync(gitDir)) { res.json({ message: "chore: initial commit" }); return; }

  try {
    const g = git(p.dirPath);
    const diff = await g.diff(["--cached", "--stat"]).catch(() => "");
    const status = await g.status();

    const { anthropic } = await import("@workspace/integrations-anthropic-ai");
    const prompt = `Generate a concise, conventional commit message for these changes:

Staged files:
${status.staged.join("\n") || "(none)"}

Modified files:
${status.modified.join("\n") || "(none)"}

Diff summary:
${diff.slice(0, 1500) || "(no diff)"}

Reply with ONLY the commit message (e.g. "feat: add user authentication"). No explanation.`;

    const response = await anthropic.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 100,
      messages: [{ role: "user", content: prompt }],
    });
    const msg = response.content[0]?.type === "text" ? response.content[0].text.trim() : "chore: update files";
    res.json({ message: msg });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

export default router;
