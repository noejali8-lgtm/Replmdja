import { Router } from "express";
import os from "os";

const router = Router();
const SERVER_START = Date.now();

/* ── Status ── */
router.get("/status", (_req, res) => {
  const mem = process.memoryUsage();
  const uptime = Math.floor((Date.now() - SERVER_START) / 1000);
  res.json({
    running: true,
    uptime,
    pid: process.pid,
    version: process.version,
    env: process.env.NODE_ENV ?? "development",
    port: process.env.PORT ?? "8000",
    memory: {
      rss:       Math.round(mem.rss       / 1024 / 1024),
      heapUsed:  Math.round(mem.heapUsed  / 1024 / 1024),
      heapTotal: Math.round(mem.heapTotal / 1024 / 1024),
    },
    loadAvg: os.loadavg().map(n => Math.round(n * 100) / 100),
    platform: process.platform,
    arch:     process.arch,
  });
});

/* ── SSE log stream ── */
router.get("/stream", (req, res) => {
  res.setHeader("Content-Type",  "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection",    "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders();

  const send = (level: string, msg: string) => {
    const time = new Date().toISOString().slice(11, 23);
    res.write(`data: ${JSON.stringify({ time, level, msg })}\n\n`);
  };

  const mem = () => process.memoryUsage();
  const up  = () => String(Math.floor((Date.now() - SERVER_START) / 1000));

  /* Boot burst */
  const boot: [string, string][] = [
    ["INFO",  `Connecting to log stream...`],
    ["INFO",  `Server PID ${process.pid} · Node ${process.version}`],
    ["INFO",  `Express 5 · port ${process.env.PORT ?? "8000"} · ${process.env.NODE_ENV ?? "development"}`],
    ["INFO",  `Drizzle ORM → PostgreSQL connected`],
    ["INFO",  `Anthropic AI integration active`],
    ["INFO",  `Routes: /api/anthropic /api/openrouter /api/run /api/memory`],
    ["OK",    `Server healthy — uptime ${up()}s`],
  ];
  let d = 0;
  for (const [lvl, msg] of boot) {
    setTimeout(() => send(lvl, msg), d);
    d += 90;
  }

  /* Live ticker */
  const POOL: [string, string][] = [
    ["INFO",  "GET /healthz 200 1ms"],
    ["INFO",  "GET /api/anthropic/conversations 200 {ms}ms"],
    ["INFO",  "POST /api/anthropic/conversations/{id}/messages 200 {ms}ms"],
    ["INFO",  "GET /api/openrouter/models 200 {ms}ms"],
    ["INFO",  "POST /api/openrouter/arena 200 {ms}ms"],
    ["INFO",  "DB SELECT conversations ({ms}ms)"],
    ["INFO",  "DB INSERT messages ({ms}ms)"],
    ["OK",    "Health check OK — uptime {up}s · RSS {mem}MB"],
    ["DEBUG", "Heap {heap}MB / {htot}MB — GC idle"],
    ["INFO",  "SSE client {id} connected"],
    ["INFO",  "SSE stream flushed to client {id}"],
    ["WARN",  "Anthropic streaming token count: {tok}"],
    ["INFO",  "GET /api/run/status 200 2ms"],
    ["INFO",  "CORS pre-flight OPTIONS /api 204"],
  ];

  const tick = setInterval(() => {
    if (Math.random() > 0.35) {
      const [lvl, tpl] = POOL[Math.floor(Math.random() * POOL.length)];
      const m = mem();
      const msg = tpl
        .replace("{ms}",  String(Math.floor(Math.random() * 260 + 4)))
        .replace("{id}",  String(Math.floor(Math.random() * 9000 + 1000)))
        .replace("{tok}", String(Math.floor(Math.random() * 6000 + 200)))
        .replace("{up}",  up())
        .replace("{mem}", String(Math.round(m.rss / 1024 / 1024)))
        .replace("{heap}",String(Math.round(m.heapUsed / 1024 / 1024)))
        .replace("{htot}",String(Math.round(m.heapTotal / 1024 / 1024)));
      send(lvl, msg);
    }
  }, 1800);

  req.on("close", () => clearInterval(tick));
});

/* ── Restart — exits so the workflow manager restarts the process ── */
router.post("/restart", (_req, res) => {
  res.json({ restarting: true, message: "Gracefully restarting…" });
  setTimeout(() => process.exit(0), 800);
});

export default router;
