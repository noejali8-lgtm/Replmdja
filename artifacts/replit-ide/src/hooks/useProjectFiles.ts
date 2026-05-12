import { useState, useCallback, useRef } from "react";
import type { FileNode } from "@/components/editor/FileTree";

const API = "/api/projects";

export interface ProjectInfo {
  id: number;
  name: string;
  slug: string;
  language: string;
  runCmd: string | null;
  dirPath: string;
}

export interface UseProjectFilesResult {
  projectInfo: ProjectInfo | null;
  loadProject: (id: number) => Promise<{ tree: FileNode[]; firstFile: FileNode | null }>;
  readFile: (path: string) => Promise<string>;
  writeFile: (path: string, content: string) => Promise<void>;
  createFile: (path: string, content?: string) => Promise<void>;
  createDir: (path: string) => Promise<void>;
  deleteFile: (path: string) => Promise<void>;
  renameFile: (oldPath: string, newPath: string, content: string) => Promise<void>;
  runProject: (onOutput: (type: string, data: string) => void) => Promise<() => void>;
  stopProject: () => Promise<void>;
  getPreviewUrl: () => string | null;
  isRealProject: boolean;
}

function apiTreeToFileNodes(items: any[]): FileNode[] {
  return items.map((item: any) => ({
    name: item.name,
    path: item.path,
    type: item.type as "file" | "dir",
    ext: item.type === "file" ? item.name.split(".").pop() ?? "" : undefined,
    children: item.children ? apiTreeToFileNodes(item.children) : undefined,
  }));
}

function flattenNodes(nodes: FileNode[]): FileNode[] {
  return nodes.flatMap(n => n.type === "file" ? [n] : flattenNodes(n.children ?? []));
}

export function useProjectFiles(projectId: number | null): UseProjectFilesResult {
  const [projectInfo, setProjectInfo] = useState<ProjectInfo | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const runningRef = useRef<AbortController | null>(null);

  const isRealProject = projectId !== null;

  const loadProject = useCallback(async (id: number) => {
    const [projRes, filesRes] = await Promise.all([
      fetch(`${API}/${id}`, { credentials: "include" }),
      fetch(`${API}/${id}/files`, { credentials: "include" }),
    ]);

    if (!projRes.ok) throw new Error("Project not found");
    const proj = await projRes.json() as ProjectInfo;
    setProjectInfo(proj);

    const rawTree = await filesRes.json() as any[];
    const tree = apiTreeToFileNodes(rawTree);
    const allFiles = flattenNodes(tree);
    const firstFile = allFiles.find(f => f.type === "file") ?? null;

    return { tree, firstFile };
  }, []);

  const readFile = useCallback(async (filePath: string): Promise<string> => {
    if (!projectId) return "";
    const res = await fetch(`${API}/${projectId}/file?path=${encodeURIComponent(filePath)}`, {
      credentials: "include",
    });
    if (!res.ok) return "";
    const data = await res.json() as { content: string };
    return data.content;
  }, [projectId]);

  const writeFile = useCallback(async (filePath: string, content: string): Promise<void> => {
    if (!projectId) return;
    await fetch(`${API}/${projectId}/file?path=${encodeURIComponent(filePath)}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ content }),
    });
  }, [projectId]);

  const createFile = useCallback(async (filePath: string, content = ""): Promise<void> => {
    if (!projectId) return;
    await fetch(`${API}/${projectId}/file?path=${encodeURIComponent(filePath)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ content }),
    });
  }, [projectId]);

  const createDir = useCallback(async (dirPath: string): Promise<void> => {
    if (!projectId) return;
    await fetch(`${API}/${projectId}/mkdir?path=${encodeURIComponent(dirPath)}`, {
      method: "POST",
      credentials: "include",
    });
  }, [projectId]);

  const deleteFile = useCallback(async (filePath: string): Promise<void> => {
    if (!projectId) return;
    await fetch(`${API}/${projectId}/file?path=${encodeURIComponent(filePath)}`, {
      method: "DELETE",
      credentials: "include",
    });
  }, [projectId]);

  const renameFile = useCallback(async (oldPath: string, newPath: string, content: string): Promise<void> => {
    if (!projectId) return;
    await Promise.all([
      fetch(`${API}/${projectId}/file?path=${encodeURIComponent(newPath)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ content }),
      }),
      fetch(`${API}/${projectId}/file?path=${encodeURIComponent(oldPath)}`, {
        method: "DELETE",
        credentials: "include",
      }),
    ]);
  }, [projectId]);

  const runProject = useCallback(async (onOutput: (type: string, data: string) => void): Promise<() => void> => {
    if (!projectId) return () => {};

    const ctrl = new AbortController();
    runningRef.current = ctrl;

    const res = await fetch(`${API}/${projectId}/run`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      signal: ctrl.signal,
    });

    if (!res.body) {
      onOutput("error", "No response stream");
      return () => {};
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    (async () => {
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";
          for (const line of lines) {
            if (!line.startsWith("data:")) continue;
            try {
              const event = JSON.parse(line.slice(5).trim()) as { type: string; data: string; port?: number };
              onOutput(event.type, event.data);
              if (event.port) {
                setPreviewUrl(`https://${window.location.hostname.replace(/:\d+$/, "")}:${event.port}`);
              }
              if (event.type === "url") {
                setPreviewUrl(event.data);
              }
            } catch { /**/ }
          }
        }
      } catch { /**/ }
    })();

    return () => {
      ctrl.abort();
      fetch(`${API}/${projectId}/run`, { method: "DELETE", credentials: "include" }).catch(() => {});
      setPreviewUrl(null);
    };
  }, [projectId]);

  const stopProject = useCallback(async (): Promise<void> => {
    if (!projectId) return;
    runningRef.current?.abort();
    runningRef.current = null;
    await fetch(`${API}/${projectId}/run`, { method: "DELETE", credentials: "include" });
    setPreviewUrl(null);
  }, [projectId]);

  const getPreviewUrl = useCallback(() => previewUrl, [previewUrl]);

  return {
    projectInfo,
    loadProject,
    readFile,
    writeFile,
    createFile,
    createDir,
    deleteFile,
    renameFile,
    runProject,
    stopProject,
    getPreviewUrl,
    isRealProject,
  };
}
