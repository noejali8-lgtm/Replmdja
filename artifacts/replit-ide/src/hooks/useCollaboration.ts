import { useEffect, useRef, useCallback, useState } from "react";

export interface RemoteEdit {
  userId: string;
  username: string;
  color: string;
  file: string;
  content: string;
}

export interface CollabCursor {
  userId: string;
  username: string;
  color: string;
  line: number;
  column: number;
  file: string;
}

interface Options {
  projectId?: string | number;
  userId: string;
  username: string;
  currentFile?: string;
  enabled?: boolean;
  onRemoteEdit?: (edit: RemoteEdit) => void;
  onCursorsChange?: (cursors: CollabCursor[]) => void;
}

export function useCollaboration({
  projectId,
  userId,
  username,
  currentFile,
  enabled = true,
  onRemoteEdit,
  onCursorsChange,
}: Options) {
  const wsRef      = useRef<WebSocket | null>(null);
  const cursorsRef = useRef<Map<string, CollabCursor>>(new Map());
  const [connected, setConnected] = useState(false);
  const [myColor, setMyColor]     = useState("#58a6ff");
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);

  const connect = useCallback(() => {
    if (!enabled || !projectId) return;
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const host     = window.location.host;
    const params   = new URLSearchParams({
      project:  String(projectId),
      userId,
      username,
    });
    const url = `${protocol}//${host}/api/presence/ws?${params}`;

    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => {
      if (mountedRef.current) setConnected(true);
    };

    ws.onclose = () => {
      if (mountedRef.current) {
        setConnected(false);
        // Reconnect after 3s
        reconnectTimer.current = setTimeout(connect, 3000);
      }
    };

    ws.onerror = () => {
      ws.close();
    };

    ws.onmessage = (e: MessageEvent) => {
      try {
        const msg = JSON.parse(e.data as string);

        if (msg.type === "init") {
          setMyColor(msg.color);
          const initialCursors = (msg.cursors ?? []) as CollabCursor[];
          initialCursors.forEach((c: CollabCursor) => cursorsRef.current.set(c.userId, c));
          onCursorsChange?.(Array.from(cursorsRef.current.values()));
        }

        if (msg.type === "join") {
          cursorsRef.current.set(msg.cursor.userId, msg.cursor);
          onCursorsChange?.(Array.from(cursorsRef.current.values()));
        }

        if (msg.type === "leave") {
          cursorsRef.current.delete(msg.userId);
          onCursorsChange?.(Array.from(cursorsRef.current.values()));
        }

        if (msg.type === "cursor") {
          cursorsRef.current.set(msg.cursor.userId, msg.cursor);
          onCursorsChange?.(Array.from(cursorsRef.current.values()));
        }

        if (msg.type === "edit") {
          onRemoteEdit?.({
            userId:   msg.userId,
            username: msg.username,
            color:    msg.color,
            file:     msg.file,
            content:  msg.content,
          });
        }
      } catch { /* */ }
    };
  }, [enabled, projectId, userId, username, onRemoteEdit, onCursorsChange]);

  useEffect(() => {
    mountedRef.current = true;
    connect();
    return () => {
      mountedRef.current = false;
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
      wsRef.current?.close();
    };
  }, [connect]);

  /* Send cursor position */
  const sendCursor = useCallback((line: number, column: number) => {
    if (wsRef.current?.readyState !== WebSocket.OPEN) return;
    wsRef.current.send(JSON.stringify({
      type: "cursor", line, column, file: currentFile ?? "",
    }));
  }, [currentFile]);

  /* Send file content edit */
  const sendEdit = useCallback((file: string, content: string) => {
    if (wsRef.current?.readyState !== WebSocket.OPEN) return;
    wsRef.current.send(JSON.stringify({ type: "edit", file, content }));
  }, []);

  return { connected, myColor, sendCursor, sendEdit };
}
