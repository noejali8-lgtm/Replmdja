import { createServer } from "http";
import { WebSocketServer } from "ws";
import app from "./app";
import { setupTerminalWs } from "./routes/terminal";
import { setupPresenceWs } from "./routes/presence";
import { logger } from "./lib/logger";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error("PORT environment variable is required but was not provided.");
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

const httpServer = createServer(app);

/* ── WebSocket terminal at /api/terminal/ws ── */
const termWss = new WebSocketServer({ server: httpServer, path: "/api/terminal/ws" });
setupTerminalWs(termWss);

/* ── WebSocket presence/collaboration at /api/presence/ws ── */
const presenceWss = new WebSocketServer({ server: httpServer, path: "/api/presence/ws" });
setupPresenceWs(presenceWss);

httpServer.listen(port, () => {
  logger.info({ port }, "Server listening");
});
