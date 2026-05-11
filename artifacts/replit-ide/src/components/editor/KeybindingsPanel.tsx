import { useState, useEffect } from "react";
import { Keyboard, Search, RotateCcw, Check, X, Edit2 } from "lucide-react";

interface Binding {
  id: string;
  action: string;
  category: string;
  keys: string;
  defaultKeys: string;
  customized?: boolean;
}

const DEFAULT_BINDINGS: Binding[] = [
  { id: "save",           action: "Save File",           category: "File",    keys: "Ctrl+S",       defaultKeys: "Ctrl+S" },
  { id: "new-file",       action: "New File",            category: "File",    keys: "Ctrl+N",       defaultKeys: "Ctrl+N" },
  { id: "close-tab",      action: "Close Tab",           category: "File",    keys: "Ctrl+W",       defaultKeys: "Ctrl+W" },
  { id: "cmd-palette",    action: "Command Palette",     category: "View",    keys: "Ctrl+K",       defaultKeys: "Ctrl+K" },
  { id: "toggle-term",    action: "Toggle Terminal",     category: "View",    keys: "Ctrl+`",       defaultKeys: "Ctrl+`" },
  { id: "split-editor",   action: "Split Editor",        category: "View",    keys: "Ctrl+\\",      defaultKeys: "Ctrl+\\" },
  { id: "toggle-ai",      action: "Toggle AI Panel",     category: "View",    keys: "Ctrl+Shift+A", defaultKeys: "Ctrl+Shift+A" },
  { id: "toggle-preview", action: "Toggle Preview",      category: "View",    keys: "Ctrl+Shift+P", defaultKeys: "Ctrl+Shift+P" },
  { id: "search-files",   action: "Search in Files",    category: "Search",  keys: "Ctrl+Shift+F", defaultKeys: "Ctrl+Shift+F" },
  { id: "find",           action: "Find in Editor",      category: "Search",  keys: "Ctrl+F",       defaultKeys: "Ctrl+F" },
  { id: "find-replace",   action: "Find & Replace",      category: "Search",  keys: "Ctrl+H",       defaultKeys: "Ctrl+H" },
  { id: "run",            action: "Run Project",         category: "Run",     keys: "Ctrl+Enter",   defaultKeys: "Ctrl+Enter" },
  { id: "deploy",         action: "Deploy",              category: "Run",     keys: "Ctrl+Shift+D", defaultKeys: "Ctrl+Shift+D" },
  { id: "comment",        action: "Toggle Line Comment", category: "Editor",  keys: "Ctrl+/",       defaultKeys: "Ctrl+/" },
  { id: "duplicate",      action: "Duplicate Line",      category: "Editor",  keys: "Ctrl+D",       defaultKeys: "Ctrl+D" },
  { id: "move-up",        action: "Move Line Up",        category: "Editor",  keys: "Alt+↑",        defaultKeys: "Alt+↑" },
  { id: "move-down",      action: "Move Line Down",      category: "Editor",  keys: "Alt+↓",        defaultKeys: "Alt+↓" },
  { id: "format",         action: "Format Document",     category: "Editor",  keys: "Ctrl+Shift+I", defaultKeys: "Ctrl+Shift+I" },
  { id: "multi-cursor",   action: "Add Cursor Above",   category: "Editor",  keys: "Ctrl+Alt+↑",   defaultKeys: "Ctrl+Alt+↑" },
  { id: "select-all-occ", action: "Select All Occurrences", category: "Editor", keys: "Ctrl+Shift+L", defaultKeys: "Ctrl+Shift+L" },
];

function KeyChip({ keys }: { keys: string }) {
  return (
    <div className="flex items-center gap-0.5">
      {keys.split("+").map((k, i) => (
        <span key={i} className="text-[10px] px-1.5 py-0.5 rounded bg-[#21262d] border border-[#30363d] text-[#8b949e] font-mono leading-none">
          {k}
        </span>
      ))}
    </div>
  );
}

export function KeybindingsPanel() {
  const [bindings, setBindings] = useState<Binding[]>(DEFAULT_BINDINGS);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [editing, setEditing] = useState<string | null>(null);
  const [recording, setRecording] = useState(false);
  const [recordedKeys, setRecordedKeys] = useState("");
  const [saved, setSaved] = useState<string | null>(null);

  const categories = ["all", ...Array.from(new Set(DEFAULT_BINDINGS.map(b => b.category)))];

  const filtered = bindings.filter(b =>
    (category === "all" || b.category === category) &&
    (!search || b.action.toLowerCase().includes(search.toLowerCase()) || b.keys.toLowerCase().includes(search.toLowerCase()))
  );

  const startEdit = (id: string) => {
    setEditing(id);
    setRecording(true);
    setRecordedKeys("Press a key combination…");
  };

  useEffect(() => {
    if (!recording || !editing) return;
    const handler = (e: KeyboardEvent) => {
      e.preventDefault();
      const parts: string[] = [];
      if (e.ctrlKey || e.metaKey) parts.push("Ctrl");
      if (e.altKey) parts.push("Alt");
      if (e.shiftKey) parts.push("Shift");
      const key = e.key.length === 1 ? e.key.toUpperCase() : e.key;
      if (!["Control", "Alt", "Shift", "Meta"].includes(key)) parts.push(key);
      if (parts.length > 0) setRecordedKeys(parts.join("+"));
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [recording, editing]);

  const saveBinding = (id: string) => {
    if (recordedKeys && !recordedKeys.startsWith("Press")) {
      setBindings(prev => prev.map(b => b.id === id ? { ...b, keys: recordedKeys, customized: true } : b));
      setSaved(id);
      setTimeout(() => setSaved(null), 1500);
    }
    setEditing(null);
    setRecording(false);
    setRecordedKeys("");
  };

  const resetBinding = (id: string) => {
    setBindings(prev => prev.map(b => b.id === id ? { ...b, keys: b.defaultKeys, customized: false } : b));
    if (editing === id) { setEditing(null); setRecording(false); }
  };

  const resetAll = () => {
    setBindings(DEFAULT_BINDINGS.map(b => ({ ...b, customized: false })));
  };

  return (
    <div className="flex flex-col h-full bg-[#0d1117] text-[#e6edf3]">
      <div className="flex items-center gap-2 px-3 py-2 border-b border-[#21262d] bg-[#161b22] shrink-0">
        <Keyboard className="h-3.5 w-3.5 text-[#58a6ff]" />
        <span className="text-[10px] font-semibold text-[#8b949e] uppercase tracking-widest flex-1">Keybindings</span>
        <button onClick={resetAll} className="flex items-center gap-1 text-[10px] text-[#484f58] hover:text-[#d29922] transition-colors">
          <RotateCcw className="h-3 w-3" /> Reset all
        </button>
      </div>

      <div className="px-3 py-2 border-b border-[#21262d] space-y-2 shrink-0">
        <div className="flex items-center gap-1.5 bg-[#21262d] border border-[#30363d] rounded px-2 py-1">
          <Search className="h-3 w-3 text-[#484f58] shrink-0" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search keybindings…"
            className="flex-1 bg-transparent text-xs text-[#e6edf3] placeholder-[#484f58] outline-none" />
        </div>
        <div className="flex gap-1 flex-wrap">
          {categories.map(cat => (
            <button key={cat} onClick={() => setCategory(cat)}
              className={`text-[9px] px-1.5 py-0.5 rounded border capitalize transition-colors ${
                category === cat ? "bg-[#1f6feb]/20 text-[#58a6ff] border-[#1f6feb]/30" : "text-[#484f58] border-[#30363d] hover:border-[#484f58]"
              }`}>
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 gap-2 text-[#484f58]">
            <Keyboard className="h-8 w-8 opacity-20" />
            <p className="text-xs">No keybindings found</p>
          </div>
        ) : (
          <div className="py-1">
            {filtered.map(binding => {
              const isEditing = editing === binding.id;
              return (
                <div key={binding.id}
                  className={`flex items-center gap-2 px-3 py-2 hover:bg-[#161b22] group transition-colors ${isEditing ? "bg-[#1f6feb]/5" : ""}`}>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-[#e6edf3] truncate">{binding.action}</span>
                      {binding.customized && (
                        <span className="text-[9px] px-1 rounded bg-[#d29922]/20 text-[#d29922] border border-[#d29922]/20 shrink-0">custom</span>
                      )}
                    </div>
                    <span className="text-[9px] text-[#484f58]">{binding.category}</span>
                  </div>

                  {isEditing ? (
                    <div className="flex items-center gap-1.5">
                      <div className={`flex items-center gap-0.5 px-2 py-1 rounded border ${recordedKeys.startsWith("Press") ? "border-[#58a6ff]/30 bg-[#1f6feb]/10" : "border-[#3fb950]/30 bg-[#238636]/10"} text-[10px] font-mono min-w-[80px] text-center justify-center`}>
                        <span className={recordedKeys.startsWith("Press") ? "text-[#484f58]" : "text-[#3fb950]"}>
                          {recordedKeys}
                        </span>
                      </div>
                      <button onClick={() => saveBinding(binding.id)}
                        className="h-6 w-6 flex items-center justify-center rounded bg-[#238636]/20 hover:bg-[#238636]/40 text-[#3fb950] transition-colors">
                        <Check className="h-3 w-3" />
                      </button>
                      <button onClick={() => { setEditing(null); setRecording(false); setRecordedKeys(""); }}
                        className="h-6 w-6 flex items-center justify-center rounded hover:bg-[#21262d] text-[#484f58] hover:text-[#f85149] transition-colors">
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      {saved === binding.id ? (
                        <span className="text-[10px] text-[#3fb950] flex items-center gap-1"><Check className="h-3 w-3" />Saved</span>
                      ) : (
                        <KeyChip keys={binding.keys} />
                      )}
                      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => startEdit(binding.id)}
                          className="h-5 w-5 flex items-center justify-center rounded text-[#484f58] hover:text-[#58a6ff] hover:bg-[#21262d] transition-colors">
                          <Edit2 className="h-2.5 w-2.5" />
                        </button>
                        {binding.customized && (
                          <button onClick={() => resetBinding(binding.id)}
                            className="h-5 w-5 flex items-center justify-center rounded text-[#484f58] hover:text-[#d29922] hover:bg-[#21262d] transition-colors">
                            <RotateCcw className="h-2.5 w-2.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
