import { useEffect, useRef, useState, useCallback } from "react";

export interface RemoteCursor {
  userId: string;
  username: string;
  color: string;
  line: number;
  column: number;
  file: string;
}

interface UsePresenceOptions {
  projectId: string | number;
  userId: string;
  username: string;
  currentFile?: string;
  currentLine?: number;
  currentColumn?: number;
}

interface UsePresenceResult {
  connected: boolean;
  cursors: RemoteCursor[];
  myColor: string;
  sendCursor: (line: number, column: number, file: string) => void;
  sendEdit: (file: string, content: string) => void;
}

const WS_BASE = (() => {
  const proto = window.location.protocol === "https:" ? "wss:" : "ws:";
  const host = window.location.hostname;
  return `${proto}//${host}:8000`;
})();

export function usePresence(opts: UsePresenceOptions): UsePresenceResult {
  const { projectId, userId, username } = opts;
  const wsRef = useRef<WebSocket | null>(null);
  const [connected, setConnected] = useState(false);
  const [cursors, setCursors] = useState<RemoteCursor[]>([]);
  const [myColor, setMyColor] = useState("#58a6ff");
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const connect = useCallback(() => {
    try {
      const url = `${WS_BASE}/api/presence/ws?project=${encodeURIComponent(projectId)}&userId=${encodeURIComponent(userId)}&username=${encodeURIComponent(username)}`;
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => setConnected(true);

      ws.onmessage = (ev) => {
        try {
          const msg = JSON.parse(ev.data);
          if (msg.type === "init") {
            setMyColor(msg.color);
            setCursors(msg.cursors ?? []);
          } else if (msg.type === "join") {
            setCursors(prev => {
              const exists = prev.find(c => c.userId === msg.cursor.userId);
              return exists ? prev : [...prev, msg.cursor];
            });
          } else if (msg.type === "cursor") {
            setCursors(prev => prev.map(c =>
              c.userId === msg.cursor.userId ? msg.cursor : c
            ));
          } else if (msg.type === "leave") {
            setCursors(prev => prev.filter(c => c.userId !== msg.userId));
          }
        } catch { /**/ }
      };

      ws.onclose = () => {
        setConnected(false);
        reconnectTimer.current = setTimeout(connect, 3000);
      };

      ws.onerror = () => {
        ws.close();
      };
    } catch { /**/ }
  }, [projectId, userId, username]);

  useEffect(() => {
    connect();
    const ping = setInterval(() => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: "ping" }));
      }
    }, 30000);
    return () => {
      clearInterval(ping);
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
      wsRef.current?.close();
    };
  }, [connect]);

  const sendCursor = useCallback((line: number, column: number, file: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "cursor", line, column, file }));
    }
  }, []);

  const sendEdit = useCallback((file: string, content: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "edit", file, content }));
    }
  }, []);

  return { connected, cursors, myColor, sendCursor, sendEdit };
}
