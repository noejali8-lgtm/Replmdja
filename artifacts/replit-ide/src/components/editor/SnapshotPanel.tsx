import { useState, useEffect } from "react";
import { Camera, RotateCcw, Copy, Trash2, Plus, Clock, Check, GitFork } from "lucide-react";

interface Snapshot {
  id: string;
  name: string;
  description?: string;
  ts: number;
  fileCount: number;
  data: Record<string, string>; /* path → content */
}

interface SnapshotPanelProps {
  project: string;
  currentFiles: { path: string; content: string }[];
  onRestore?: (files: { path: string; content: string }[]) => void;
}

const STORAGE_KEY = (p: string) => `ide-${p}-snapshots`;

function relTime(ts: number): string {
  const s = Math.round((Date.now() - ts) / 1000);
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.round(s / 60)}m ago`;
  if (s < 86400) return `${Math.round(s / 3600)}h ago`;
  return `${Math.round(s / 86400)}d ago`;
}

export function SnapshotPanel({ project, currentFiles, onRestore }: SnapshotPanelProps) {
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [name, setName]           = useState("");
  const [desc, setDesc]           = useState("");
  const [creating, setCreating]   = useState(false);
  const [restored, setRestored]   = useState<string | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY(project));
      if (raw) setSnapshots(JSON.parse(raw));
    } catch { /**/ }
  }, [project]);

  const save = (snaps: Snapshot[]) => {
    setSnapshots(snaps);
    try { localStorage.setItem(STORAGE_KEY(project), JSON.stringify(snaps)); } catch { /**/ }
  };

  const create = () => {
    if (!name.trim()) return;
    const data: Record<string, string> = {};
    currentFiles.forEach(f => { data[f.path] = f.content; });
    const snap: Snapshot = {
      id: Date.now().toString(),
      name: name.trim(),
      description: desc.trim() || undefined,
      ts: Date.now(),
      fileCount: currentFiles.length,
      data,
    };
    save([snap, ...snapshots]);
    setName(""); setDesc(""); setCreating(false);
  };

  const restore = (snap: Snapshot) => {
    const files = Object.entries(snap.data).map(([path, content]) => ({ path, content }));
    onRestore?.(files);
    setRestored(snap.id);
    setTimeout(() => setRestored(null), 2000);
  };

  const fork = (snap: Snapshot) => {
    const forked: Snapshot = { ...snap, id: Date.now().toString(), name: `Fork of ${snap.name}`, ts: Date.now() };
    save([forked, ...snapshots]);
  };

  const remove = (id: string) => {
    if (!confirm("Delete this snapshot?")) return;
    save(snapshots.filter(s => s.id !== id));
  };

  return (
    <div className="flex flex-col h-full bg-[#0d1117] text-[#e6edf3]">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-[#21262d] bg-[#161b22] shrink-0">
        <Camera className="h-4 w-4 text-[#a371f7]" />
        <span className="text-xs font-semibold flex-1">Snapshots</span>
        <span className="text-[10px] text-[#484f58]">{snapshots.length} saved</span>
        <button onClick={() => setCreating(p => !p)}
          className="h-6 w-6 flex items-center justify-center rounded hover:bg-[#21262d] text-[#8b949e] hover:text-[#e6edf3] transition-colors">
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Create form */}
      {creating && (
        <div className="p-3 border-b border-[#21262d] bg-[#161b22]/50 space-y-2 shrink-0">
          <input value={name} onChange={e => setName(e.target.value)}
            placeholder="Snapshot name…"
            onKeyDown={e => e.key === "Enter" && create()}
            className="w-full bg-[#21262d] border border-[#30363d] rounded-lg px-3 py-1.5 text-xs text-[#e6edf3] placeholder-[#484f58] outline-none focus:border-[#a371f7]" />
          <input value={desc} onChange={e => setDesc(e.target.value)}
            placeholder="Description (optional)"
            className="w-full bg-[#21262d] border border-[#30363d] rounded-lg px-3 py-1.5 text-xs text-[#e6edf3] placeholder-[#484f58] outline-none focus:border-[#a371f7]" />
          <div className="flex gap-2">
            <button onClick={create} disabled={!name.trim()}
              className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-[#a371f7] hover:bg-[#8957e5] text-white text-xs font-medium transition-colors disabled:opacity-40">
              <Camera className="h-3 w-3" /> Save Snapshot
            </button>
            <button onClick={() => setCreating(false)}
              className="px-3 py-1.5 rounded-lg border border-[#30363d] text-[#8b949e] hover:text-[#e6edf3] text-xs transition-colors">
              Cancel
            </button>
          </div>
          <p className="text-[10px] text-[#484f58]">{currentFiles.length} files · {project}</p>
        </div>
      )}

      {/* Snapshot list */}
      <div className="flex-1 overflow-y-auto">
        {snapshots.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-[#484f58]">
            <Camera className="h-10 w-10 opacity-20" />
            <div className="text-center">
              <p className="text-xs font-medium text-[#8b949e] mb-1">No snapshots yet</p>
              <p className="text-[10px]">Save a snapshot to restore your project state at any point</p>
            </div>
            <button onClick={() => setCreating(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#a371f7]/20 text-[#a371f7] border border-[#a371f7]/20 text-xs hover:bg-[#a371f7]/30 transition-colors">
              <Plus className="h-3.5 w-3.5" /> Create Snapshot
            </button>
          </div>
        ) : (
          <div className="divide-y divide-[#21262d]/50">
            {snapshots.map(snap => (
              <div key={snap.id} className="p-3 hover:bg-[#161b22] transition-colors group">
                <div className="flex items-start gap-2 mb-2">
                  <div className="h-8 w-8 rounded-lg bg-[#a371f7]/20 border border-[#a371f7]/20 flex items-center justify-center shrink-0">
                    <Camera className="h-3.5 w-3.5 text-[#a371f7]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-[#e6edf3] truncate">{snap.name}</p>
                    {snap.description && <p className="text-[10px] text-[#8b949e] truncate">{snap.description}</p>}
                    <div className="flex items-center gap-2 mt-0.5">
                      <Clock className="h-2.5 w-2.5 text-[#484f58]" />
                      <span className="text-[9px] text-[#484f58]">{relTime(snap.ts)}</span>
                      <span className="text-[9px] text-[#484f58]">· {snap.fileCount} files</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <button onClick={() => restore(snap)}
                    className={`flex-1 flex items-center justify-center gap-1 py-1 rounded border text-[10px] font-medium transition-all ${restored === snap.id ? "border-green-500/40 text-green-400 bg-green-500/10" : "border-[#30363d] text-[#8b949e] hover:text-[#e6edf3] hover:border-[#484f58]"}`}>
                    {restored === snap.id ? <Check className="h-3 w-3" /> : <RotateCcw className="h-3 w-3" />}
                    {restored === snap.id ? "Restored!" : "Restore"}
                  </button>
                  <button onClick={() => fork(snap)} title="Fork snapshot"
                    className="h-6 w-6 flex items-center justify-center rounded border border-[#30363d] text-[#8b949e] hover:text-[#58a6ff] hover:border-[#58a6ff]/30 transition-colors">
                    <GitFork className="h-3 w-3" />
                  </button>
                  <button onClick={() => remove(snap.id)} title="Delete"
                    className="h-6 w-6 flex items-center justify-center rounded border border-[#30363d] text-[#8b949e] hover:text-[#f85149] hover:border-[#f85149]/30 transition-colors">
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
