import { useState, useEffect } from "react";
import { Lock, Plus, Eye, EyeOff, Trash2, Save, RefreshCw, Copy, Check, ShieldCheck, AlertTriangle } from "lucide-react";

interface Secret {
  key: string;
  hasValue: boolean;
  preview: string;
}

interface SecretsPanelProps {
  projectId?: number;
}

export function SecretsPanel({ projectId }: SecretsPanelProps) {
  const [secrets, setSecrets] = useState<Secret[]>([]);
  const [loading, setLoading] = useState(false);
  const [newKey, setNewKey] = useState("");
  const [newValue, setNewValue] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [showEditValue, setShowEditValue] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [error, setError] = useState("");

  const fetchSecrets = async () => {
    if (!projectId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/secrets`, { credentials: "include" });
      if (res.ok) {
        const data = await res.json() as { secrets: Secret[] };
        setSecrets(data.secrets);
      }
    } catch { /**/ } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSecrets(); }, [projectId]);

  const handleAdd = async () => {
    if (!newKey.trim() || !projectId) return;
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/projects/${projectId}/secrets/${newKey.trim()}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ value: newValue }),
      });
      if (!res.ok) { setError("Failed to save secret"); return; }
      setNewKey(""); setNewValue(""); setShowNew(false);
      await fetchSecrets();
    } catch { setError("Network error"); } finally { setSaving(false); }
  };

  const handleDelete = async (key: string) => {
    if (!projectId || !confirm(`Delete secret "${key}"?`)) return;
    try {
      await fetch(`/api/projects/${projectId}/secrets/${key}`, {
        method: "DELETE",
        credentials: "include",
      });
      await fetchSecrets();
    } catch { /**/ }
  };

  const handleEdit = async (key: string) => {
    if (!projectId) return;
    const res = await fetch(`/api/projects/${projectId}/secrets/${key}`, { credentials: "include" });
    if (res.ok) {
      const data = await res.json() as { key: string; value: string };
      setEditingKey(key);
      setEditValue(data.value);
      setShowEditValue(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!editingKey || !projectId) return;
    setSaving(true);
    try {
      await fetch(`/api/projects/${projectId}/secrets/${editingKey}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ value: editValue }),
      });
      setEditingKey(null);
      await fetchSecrets();
    } catch { /**/ } finally { setSaving(false); }
  };

  const copyKey = (key: string) => {
    navigator.clipboard.writeText(`process.env.${key}`).catch(() => {});
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="flex flex-col h-full bg-[#0d1117] text-[#e6edf3]">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-[#21262d] bg-[#161b22] shrink-0">
        <Lock className="h-3.5 w-3.5 text-[#58a6ff]" />
        <span className="text-[10px] font-semibold text-[#8b949e] uppercase tracking-widest flex-1">Secrets</span>
        <button onClick={fetchSecrets} className="text-[#484f58] hover:text-[#8b949e] transition-colors">
          <RefreshCw className="h-3 w-3" />
        </button>
      </div>

      {!projectId ? (
        <div className="flex flex-col items-center justify-center gap-3 p-6 text-center flex-1">
          <AlertTriangle className="h-8 w-8 text-[#484f58]" />
          <p className="text-[11px] text-[#484f58]">Open a real project to manage secrets</p>
        </div>
      ) : (
        <>
          {/* Security notice */}
          <div className="mx-2 mt-2 mb-1 px-3 py-2 rounded-lg bg-[#1c2128] border border-[#21262d] shrink-0">
            <div className="flex items-start gap-2">
              <ShieldCheck className="h-3.5 w-3.5 text-[#3fb950] mt-0.5 shrink-0" />
              <div>
                <p className="text-[10px] text-[#3fb950] font-semibold mb-0.5">Encrypted & Secure</p>
                <p className="text-[9px] text-[#484f58] leading-relaxed">
                  Secrets are injected as <code className="text-[#58a6ff]">process.env</code> variables at runtime. Never committed to git.
                </p>
              </div>
            </div>
          </div>

          {/* Secret list */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
            {loading ? (
              <div className="flex justify-center py-6">
                <RefreshCw className="h-4 w-4 animate-spin text-[#484f58]" />
              </div>
            ) : secrets.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-2 py-8 text-center">
                <Lock className="h-7 w-7 text-[#30363d]" />
                <p className="text-[11px] text-[#484f58]">No secrets yet</p>
                <p className="text-[9px] text-[#30363d]">Add API keys and sensitive config here</p>
              </div>
            ) : (
              secrets.map(s => (
                <div key={s.key} className="bg-[#161b22] border border-[#21262d] rounded-lg overflow-hidden">
                  {editingKey === s.key ? (
                    <div className="p-2.5 space-y-2">
                      <p className="text-[10px] font-mono text-[#58a6ff]">{s.key}</p>
                      <div className="relative">
                        <input
                          type={showEditValue ? "text" : "password"}
                          value={editValue}
                          onChange={e => setEditValue(e.target.value)}
                          className="w-full bg-[#0d1117] border border-[#30363d] rounded px-2 py-1.5 text-[11px] font-mono text-[#e6edf3] outline-none focus:border-[#58a6ff] pr-8"
                          autoFocus
                        />
                        <button onClick={() => setShowEditValue(p => !p)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-[#484f58] hover:text-[#8b949e]">
                          {showEditValue ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                        </button>
                      </div>
                      <div className="flex gap-1.5">
                        <button onClick={handleSaveEdit} disabled={saving}
                          className="flex-1 flex items-center justify-center gap-1 py-1 rounded bg-[#238636] hover:bg-[#2ea043] text-white text-[10px] font-medium transition-colors">
                          <Save className="h-2.5 w-2.5" /> Save
                        </button>
                        <button onClick={() => setEditingKey(null)}
                          className="px-3 py-1 rounded border border-[#30363d] text-[#8b949e] text-[10px] hover:bg-[#21262d] transition-colors">
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 px-2.5 py-2">
                      <Lock className="h-3 w-3 text-[#484f58] shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-mono text-[#e6edf3] truncate">{s.key}</p>
                        <p className="text-[9px] font-mono text-[#484f58]">{s.preview}</p>
                      </div>
                      <div className="flex items-center gap-0.5 shrink-0">
                        <button onClick={() => copyKey(s.key)} title="Copy process.env.KEY"
                          className="h-6 w-6 flex items-center justify-center rounded text-[#484f58] hover:text-[#8b949e] hover:bg-[#21262d] transition-colors">
                          {copiedKey === s.key ? <Check className="h-2.5 w-2.5 text-[#3fb950]" /> : <Copy className="h-2.5 w-2.5" />}
                        </button>
                        <button onClick={() => handleEdit(s.key)} title="Edit"
                          className="h-6 w-6 flex items-center justify-center rounded text-[#484f58] hover:text-[#8b949e] hover:bg-[#21262d] transition-colors">
                          <Eye className="h-2.5 w-2.5" />
                        </button>
                        <button onClick={() => handleDelete(s.key)} title="Delete"
                          className="h-6 w-6 flex items-center justify-center rounded text-[#484f58] hover:text-[#f85149] hover:bg-[#f85149]/10 transition-colors">
                          <Trash2 className="h-2.5 w-2.5" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Add new secret */}
          {showNew ? (
            <div className="border-t border-[#21262d] p-2 space-y-2 shrink-0 bg-[#161b22]">
              <p className="text-[10px] text-[#8b949e] font-semibold uppercase tracking-wide">New Secret</p>
              <input
                value={newKey}
                onChange={e => setNewKey(e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, "_"))}
                placeholder="KEY_NAME"
                className="w-full bg-[#0d1117] border border-[#30363d] rounded px-2.5 py-1.5 text-[11px] font-mono text-[#e6edf3] placeholder-[#484f58] outline-none focus:border-[#58a6ff] transition-colors"
              />
              <input
                type="password"
                value={newValue}
                onChange={e => setNewValue(e.target.value)}
                placeholder="value"
                className="w-full bg-[#0d1117] border border-[#30363d] rounded px-2.5 py-1.5 text-[11px] font-mono text-[#e6edf3] placeholder-[#484f58] outline-none focus:border-[#58a6ff] transition-colors"
              />
              {error && <p className="text-[10px] text-[#f85149]">{error}</p>}
              <div className="flex gap-1.5">
                <button onClick={handleAdd} disabled={!newKey.trim() || saving}
                  className="flex-1 py-1.5 rounded bg-[#238636] hover:bg-[#2ea043] disabled:opacity-40 text-white text-[10px] font-medium transition-colors flex items-center justify-center gap-1">
                  <Save className="h-2.5 w-2.5" /> Add Secret
                </button>
                <button onClick={() => { setShowNew(false); setNewKey(""); setNewValue(""); setError(""); }}
                  className="px-3 py-1.5 rounded border border-[#30363d] text-[#8b949e] text-[10px] hover:bg-[#21262d] transition-colors">
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="border-t border-[#21262d] p-2 shrink-0">
              <button onClick={() => setShowNew(true)}
                className="w-full flex items-center justify-center gap-2 py-2 rounded border border-dashed border-[#30363d] text-[10px] text-[#484f58] hover:text-[#8b949e] hover:border-[#484f58] transition-colors">
                <Plus className="h-3 w-3" /> Add Secret
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
