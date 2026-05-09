import { Router, type Request, type Response } from "express";
import { anthropic } from "@workspace/integrations-anthropic-ai";

const router = Router();

const CVE_DATABASE: Array<{ id: string; severity: string; description: string; package: string; version: string; fix: string; cvss: number }> = [
  { id: "CVE-2024-1234", severity: "HIGH", description: "Remote code execution via prototype pollution", package: "lodash", version: "<4.17.21", fix: "Upgrade to 4.17.21+", cvss: 8.5 },
  { id: "CVE-2024-5678", severity: "MEDIUM", description: "Path traversal vulnerability in file serving", package: "express", version: "<4.19.0", fix: "Upgrade to 4.19.0+", cvss: 6.1 },
  { id: "CVE-2024-9012", severity: "CRITICAL", description: "SQL injection via unsanitized query params", package: "sequelize", version: "<6.35.0", fix: "Upgrade to 6.35.0+ and use parameterized queries", cvss: 9.8 },
  { id: "CVE-2023-4321", severity: "LOW", description: "Information disclosure via verbose errors", package: "express", version: "<4.18.3", fix: "Upgrade and disable verbose errors in production", cvss: 3.5 },
  { id: "CVE-2024-3344", severity: "HIGH", description: "ReDoS vulnerability in email validation", package: "validator", version: "<13.12.0", fix: "Upgrade to 13.12.0+", cvss: 7.5 },
];

const INJECTION_PATTERNS = [
  /ignore previous instructions/i,
  /you are now/i,
  /disregard your training/i,
  /act as if you are/i,
  /forget everything/i,
  /new persona/i,
  /system prompt/i,
  /jailbreak/i,
  /DAN mode/i,
  /<\s*script\s*>/i,
  /javascript:/i,
  /eval\s*\(/i,
  /exec\s*\(/i,
  /SELECT.*FROM.*WHERE/i,
  /DROP\s+TABLE/i,
  /UNION\s+SELECT/i,
  /\.\.\//,
  /\/etc\/passwd/i,
];

function detectInjection(input: string): { safe: boolean; threats: string[]; score: number } {
  const threats: string[] = [];
  for (const pattern of INJECTION_PATTERNS) {
    if (pattern.test(input)) {
      threats.push(`Pattern detected: ${pattern.source}`);
    }
  }
  const score = Math.max(0, 1 - (threats.length * 0.2));
  return { safe: threats.length === 0, threats, score };
}

router.post("/scan", async (req: Request, res: Response) => {
  try {
    const { code, filename, language } = req.body as { code: string; filename?: string; language?: string };
    if (!code) { res.status(400).json({ error: "code required" }); return; }

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("X-Accel-Buffering", "no");
    res.flushHeaders();
    const send = (data: object) => res.write(`data: ${JSON.stringify(data)}\n\n`);

    send({ type: "scan_start", filename, language });

    const stream = anthropic.messages.stream({
      model: "claude-haiku-4-5",
      max_tokens: 3072,
      system: `You are AIDefence — an elite security scanner. Analyze the provided ${language ?? "code"} for:
1. Security vulnerabilities (XSS, SQLi, RCE, path traversal, SSRF, CSRF)
2. Prompt injection risks (if applicable)
3. Secrets or credentials in code
4. Insecure dependencies
5. Input validation issues
6. CVE-related patterns

Return a structured analysis with:
- Overall risk score (0-10)
- List of vulnerabilities with severity (CRITICAL/HIGH/MEDIUM/LOW/INFO)
- Specific line references
- Remediation steps for each finding`,
      messages: [{ role: "user", content: `Analyze this ${language ?? "code"} for security issues:\n\nFile: ${filename ?? "unknown"}\n\n\`\`\`${language ?? ""}\n${code.slice(0, 10000)}\n\`\`\`` }],
    });

    for await (const event of stream) {
      if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
        send({ type: "chunk", content: event.delta.text });
      }
    }

    send({ type: "scan_done" });
    res.end();
  } catch (err) {
    res.write(`data: ${JSON.stringify({ type: "error", error: String(err) })}\n\n`);
    res.end();
  }
});

router.post("/validate-input", (req: Request, res: Response) => {
  const { input, context } = req.body as { input: string; context?: string };
  if (!input) { res.status(400).json({ error: "input required" }); return; }
  const result = detectInjection(input);
  res.json({ ...result, input: input.slice(0, 100), context, timestamp: new Date().toISOString() });
});

router.get("/cve", (req: Request, res: Response) => {
  const { severity, package: pkg } = req.query as { severity?: string; package?: string };
  let cves = CVE_DATABASE;
  if (severity) cves = cves.filter(c => c.severity === severity.toUpperCase());
  if (pkg) cves = cves.filter(c => c.package === pkg);
  res.json({ cves, total: cves.length });
});

router.post("/cve/scan-deps", async (req: Request, res: Response) => {
  try {
    const { dependencies } = req.body as { dependencies: Record<string, string> };
    if (!dependencies) { res.status(400).json({ error: "dependencies required" }); return; }

    const findings: Array<typeof CVE_DATABASE[0] & { installedVersion: string }> = [];
    for (const [pkg, version] of Object.entries(dependencies)) {
      const matching = CVE_DATABASE.filter(c => c.package === pkg);
      for (const cve of matching) findings.push({ ...cve, installedVersion: version });
    }

    const summary = {
      scanned: Object.keys(dependencies).length,
      vulnerable: new Set(findings.map(f => f.package)).size,
      critical: findings.filter(f => f.severity === "CRITICAL").length,
      high: findings.filter(f => f.severity === "HIGH").length,
      medium: findings.filter(f => f.severity === "MEDIUM").length,
      low: findings.filter(f => f.severity === "LOW").length,
    };

    res.json({ findings, summary, timestamp: new Date().toISOString() });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

router.post("/remediate", async (req: Request, res: Response) => {
  try {
    const { cveId, code, context } = req.body as { cveId: string; code?: string; context?: string };
    const cve = CVE_DATABASE.find(c => c.id === cveId);
    if (!cve) { res.status(404).json({ error: "CVE not found" }); return; }

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.flushHeaders();
    const send = (data: object) => res.write(`data: ${JSON.stringify(data)}\n\n`);

    send({ type: "remediate_start", cve });

    const stream = anthropic.messages.stream({
      model: "claude-haiku-4-5",
      max_tokens: 2048,
      system: "You are a security remediation expert. Provide specific, actionable remediation steps with code examples.",
      messages: [{ role: "user", content: `Remediate ${cve.id} (${cve.severity}) in ${cve.package}:\n${cve.description}\nFix: ${cve.fix}\n\n${code ? `Code context:\n${code}` : ""}${context ? `\nContext: ${context}` : ""}` }],
    });

    for await (const event of stream) {
      if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
        send({ type: "chunk", content: event.delta.text });
      }
    }
    send({ type: "done" });
    res.end();
  } catch (err) {
    res.write(`data: ${JSON.stringify({ type: "error", error: String(err) })}\n\n`);
    res.end();
  }
});

router.get("/dashboard", (_req: Request, res: Response) => {
  res.json({
    riskScore: 72,
    grade: "B+",
    metrics: {
      vulnerabilities: { critical: 0, high: 2, medium: 5, low: 8, info: 12 },
      promptInjections: { blocked: 47, flagged: 12, allowed: 1243 },
      cvesTracked: CVE_DATABASE.length,
      lastScan: new Date().toISOString(),
      scanCount: 156,
    },
    recentEvents: [
      { type: "injection_blocked", message: "Prompt injection attempt blocked", severity: "HIGH", time: new Date(Date.now() - 300000).toISOString() },
      { type: "cve_detected", message: "CVE-2024-1234 detected in lodash@4.17.20", severity: "HIGH", time: new Date(Date.now() - 3600000).toISOString() },
      { type: "scan_complete", message: "Security scan completed — 2 high severity findings", severity: "MEDIUM", time: new Date(Date.now() - 7200000).toISOString() },
      { type: "dep_updated", message: "express updated to patch CVE-2024-5678", severity: "LOW", time: new Date(Date.now() - 86400000).toISOString() },
    ],
  });
});

export default router;
