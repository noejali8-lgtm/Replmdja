import type { WebSocketServer, WebSocket } from "ws";
import { IncomingMessage } from "http";

export function setupTerminalWs(wss: WebSocketServer) {
  wss.on("connection", async (ws: WebSocket, req: IncomingMessage) => {
    const url    = new URL(req.url ?? "/", "http://localhost");
    const rawCwd = url.searchParams.get("cwd") ?? "/home/runner/workspace";
    const WORKSPACE = "/home/runner/workspace";
    const cwd = rawCwd.startsWith(WORKSPACE) ? rawCwd : WORKSPACE;
    const shell = process.env.SHELL ?? "/bin/bash";

    let ptyProcess: import("node-pty").IPty | null = null;

    try {
      const pty = await import("@homebridge/node-pty-prebuilt-multiarch");
      ptyProcess = pty.spawn(shell, [], {
        name: "xterm-256color",
        cols: 80,
        rows: 24,
        cwd,
        env: process.env as Record<string, string>,
      });

      ptyProcess.onData((data: string) => {
        if ((ws as WebSocket & { readyState: number }).readyState === 1) {
          ws.send(JSON.stringify({ type: "output", data }));
        }
      });

      ptyProcess.onExit(({ exitCode }: { exitCode: number }) => {
        if ((ws as WebSocket & { readyState: number }).readyState === 1) {
          ws.send(JSON.stringify({ type: "exit", code: exitCode }));
        }
        ws.close();
      });

    } catch (e) {
      ws.send(JSON.stringify({ type: "error", data: "Terminal unavailable — node-pty not built.\nUse the Run panel to execute code.\n" }));
      ws.close();
      return;
    }

    ws.on("message", (raw: Buffer | string) => {
      try {
        const msg = JSON.parse(raw.toString());
        if (msg.type === "input"  && ptyProcess) ptyProcess.write(msg.data);
        if (msg.type === "resize" && ptyProcess) ptyProcess.resize(Number(msg.cols) || 80, Number(msg.rows) || 24);
        if (msg.type === "ping") ws.send(JSON.stringify({ type: "pong" }));
      } catch { /**/ }
    });

    ws.on("close", () => {
      try { ptyProcess?.kill(); } catch { /**/ }
    });

    ws.on("error", () => {
      try { ptyProcess?.kill(); } catch { /**/ }
    });
  });
}
