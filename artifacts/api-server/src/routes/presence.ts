import type { WebSocketServer, WebSocket } from "ws";
import { IncomingMessage } from "http";

interface Cursor {
  userId: string;
  username: string;
  color: string;
  line: number;
  column: number;
  file: string;
}

interface Room {
  clients: Map<string, { ws: WebSocket; cursor: Cursor }>;
}

const rooms = new Map<string, Room>();

const COLORS = [
  "#f26207", "#e34c26", "#6e40c9", "#2563eb",
  "#059669", "#dc2626", "#7c3aed", "#0891b2",
  "#d97706", "#db2777", "#16a34a", "#9333ea",
];

function getRoom(projectId: string): Room {
  if (!rooms.has(projectId)) {
    rooms.set(projectId, { clients: new Map() });
  }
  return rooms.get(projectId)!;
}

function broadcast(room: Room, senderId: string, msg: object) {
  const data = JSON.stringify(msg);
  for (const [id, { ws }] of room.clients) {
    if (id !== senderId && (ws as WebSocket & { readyState: number }).readyState === 1) {
      ws.send(data);
    }
  }
}

function broadcastAll(room: Room, msg: object) {
  const data = JSON.stringify(msg);
  for (const [, { ws }] of room.clients) {
    if ((ws as WebSocket & { readyState: number }).readyState === 1) {
      ws.send(data);
    }
  }
}

export function setupPresenceWs(wss: WebSocketServer) {
  wss.on("connection", (ws: WebSocket, req: IncomingMessage) => {
    const url = new URL(req.url ?? "/", "http://localhost");
    const projectId = url.searchParams.get("project") ?? "default";
    const userId    = url.searchParams.get("userId") ?? `user-${Math.random().toString(36).slice(2, 7)}`;
    const username  = url.searchParams.get("username") ?? "Anonymous";

    const room = getRoom(projectId);
    const colorIdx = room.clients.size % COLORS.length;
    const color = COLORS[colorIdx];

    const cursor: Cursor = { userId, username, color, line: 1, column: 1, file: "" };
    room.clients.set(userId, { ws, cursor });

    // Send existing cursors to new joiner
    const existing = Array.from(room.clients.entries())
      .filter(([id]) => id !== userId)
      .map(([, { cursor: c }]) => c);

    ws.send(JSON.stringify({ type: "init", userId, color, cursors: existing }));

    // Notify others about new user
    broadcast(room, userId, { type: "join", cursor });

    ws.on("message", (raw: Buffer | string) => {
      try {
        const msg = JSON.parse(raw.toString());

        if (msg.type === "cursor") {
          cursor.line   = msg.line   ?? cursor.line;
          cursor.column = msg.column ?? cursor.column;
          cursor.file   = msg.file   ?? cursor.file;
          broadcast(room, userId, { type: "cursor", cursor });
        }

        if (msg.type === "edit") {
          // Broadcast file edits to all others
          broadcast(room, userId, {
            type: "edit",
            userId,
            username,
            color,
            file: msg.file,
            content: msg.content,
          });
        }

        if (msg.type === "ping") {
          ws.send(JSON.stringify({ type: "pong" }));
        }
      } catch { /**/ }
    });

    ws.on("close", () => {
      room.clients.delete(userId);
      broadcastAll(room, { type: "leave", userId });
      if (room.clients.size === 0) {
        rooms.delete(projectId);
      }
    });

    ws.on("error", () => {
      room.clients.delete(userId);
    });
  });
}
