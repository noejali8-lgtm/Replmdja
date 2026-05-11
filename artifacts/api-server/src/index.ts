import { createServer } from "http";
import { WebSocketServer } from "ws";
import app from "./app";
import { setupTerminalWs } from "./routes/terminal";
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
const wss = new WebSocketServer({ server: httpServer, path: "/api/terminal/ws" });
setupTerminalWs(wss);

httpServer.listen(port, () => {
  logger.info({ port }, "Server listening");
});
