import { useState, useEffect } from "react";
import { Settings, RotateCcw, Check, User, Palette, Type, AlignLeft, Code2, Save } from "lucide-react";

export interface IDESettings {
  fontSize: number;
  fontFamily: string;
  tabSize: number;
  wordWrap: boolean;
  minimap: boolean;
  formatOnSave: boolean;
  lineNumbers: boolean;
  bracketColorization: boolean;
  autoSave: boolean;
  autoSaveDelay: number;
  cursorStyle: "line" | "block" | "underline";
  theme: string;
  username: string;
  renderWhitespace: boolean;
  smoothScrolling: boolean;
  linkedEditing: boolean;
}

export const DEFAULT_SETTINGS: IDESettings = {
  fontSize: 14,
  fontFamily: "JetBrains Mono",
  tabSize: 2,
  wordWrap: false,
  minimap: true,
  formatOnSave: false,
  lineNumbers: true,
  bracketColorization: true,
  autoSave: false,
  autoSaveDelay: 1000,
  cursorStyle: "line",
  theme: "github-dark",
  username: "Anonymous",
  renderWhitespace: false,
  smoothScrolling: true,
  linkedEditing: true,
};

const STORAGE_KEY = "ide-settings-v2";

export function loadSettings(): IDESettings {
  try {
    return { ...DEFAULT_SETTINGS, ...JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}") };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function saveSettings(s: IDESettings) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  window.dispatchEvent(new CustomEvent("ide-settings-change", { detail: s }));
  localStorage.setItem("ide-username", s.username);
}

const FONTS = [
  "JetBrains Mono", "Fira Code", "Cascadia Code", "Consolas",
  "Source Code Pro", "IBM Plex Mono", "Courier New", "Monaco",
];

const THEMES = [
  { id: "github-dark",   label: "GitHub Dark",     preview: "#0d1117" },
  { id: "vs-dark",       label: "VS Dark",          preview: "#1e1e1e" },
  { id: "hc-black",      label: "High Contrast",    preview: "#000000" },
];

interface ToggleProps { label: string; value: boolean; onChange: (v: boolean) => void; desc?: string; }
function Toggle({ label, value, onChange, desc }: ToggleProps) {
  return (
    <div className="flex items-start justify-between gap-3 py-2.5 border-b border-[#21262d] last:border-0">
      <div>
        <p className="text-[12px] text-[#e6edf3]">{label}</p>
        {desc && <p className="text-[10px] text-[#484f58] mt-0.5">{desc}</p>}
      </div>
      <button
        onClick={() => onChange(!value)}
        className={`relative shrink-0 w-9 h-5 rounded-full transition-colors ${value ? "bg-[#238636]" : "bg-[#30363d]"}`}>
        <span className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white transition-transform ${value ? "translate-x-4" : "translate-x-0"}`} />
      </button>
    </div>
  );
}

interface SliderProps { label: string; value: number; min: number; max: number; step?: number; onChange: (v: number) => void; unit?: string; }
function Slider({ label, value, min, max, step = 1, onChange, unit = "" }: SliderProps) {
  return (
    <div className="py-2.5 border-b border-[#21262d] last:border-0">
      <div className="flex items-center justify-between mb-1.5">
        <p className="text-[12px] text-[#e6edf3]">{label}</p>
        <span className="text-[11px] font-mono text-[#58a6ff]">{value}{unit}</span>
      </div>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="w-full h-1.5 rounded-full appearance-none bg-[#30363d] accent-[#238636] cursor-pointer"
      />
      <div className="flex justify-between text-[9px] text-[#484f58] mt-0.5">
        <span>{min}{unit}</span><span>{max}{unit}</span>
      </div>
    </div>
  );
}

export function SettingsPanel() {
  const [settings, setSettings] = useState<IDESettings>(loadSettings);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setSettings(loadSettings());
  }, []);

  const update = (patch: Partial<IDESettings>) => {
    setSettings(prev => {
      const next = { ...prev, ...patch };
      saveSettings(next);
      setSaved(true);
      setTimeout(() => setSaved(false), 1500);
      return next;
    });
  };

  const reset = () => {
    saveSettings(DEFAULT_SETTINGS);
    setSettings(DEFAULT_SETTINGS);
  };

  return (
    <div className="flex flex-col h-full bg-[#0d1117] text-[#e6edf3] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-[#21262d] bg-[#161b22] shrink-0">
        <div className="flex items-center gap-2">
          <Settings className="h-3.5 w-3.5 text-[#8b949e]" />
          <span className="text-[11px] font-semibold text-[#8b949e] uppercase tracking-wider">Settings</span>
        </div>
        <div className="flex items-center gap-2">
          {saved && (
            <span className="flex items-center gap-1 text-[10px] text-[#3fb950]">
              <Check className="h-3 w-3" /> Saved
            </span>
          )}
          <button onClick={reset} title="Reset to defaults" className="flex items-center gap-1 text-[10px] text-[#484f58] hover:text-[#8b949e] transition-colors">
            <RotateCcw className="h-3 w-3" /> Reset
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Profile */}
        <section className="px-3 pt-3 pb-1">
          <div className="flex items-center gap-1.5 mb-2">
            <User className="h-3 w-3 text-[#8b949e]" />
            <p className="text-[10px] font-semibold text-[#8b949e] uppercase tracking-wider">Profile</p>
          </div>
          <div className="py-2">
            <p className="text-[12px] text-[#e6edf3] mb-1">Display Name</p>
            <input
              value={settings.username}
              onChange={e => update({ username: e.target.value })}
              placeholder="Your name (shown to collaborators)"
              className="w-full bg-[#21262d] border border-[#30363d] rounded px-2.5 py-1.5 text-[12px] text-[#e6edf3] placeholder-[#484f58] outline-none focus:border-[#58a6ff] transition-colors"
            />
          </div>
        </section>

        {/* Editor */}
        <section className="px-3 pt-2 pb-1">
          <div className="flex items-center gap-1.5 mb-1">
            <Type className="h-3 w-3 text-[#8b949e]" />
            <p className="text-[10px] font-semibold text-[#8b949e] uppercase tracking-wider">Editor</p>
          </div>
          <Slider label="Font Size" value={settings.fontSize} min={10} max={26} onChange={v => update({ fontSize: v })} unit="px" />
          <div className="py-2.5 border-b border-[#21262d]">
            <p className="text-[12px] text-[#e6edf3] mb-1.5">Font Family</p>
            <select
              value={settings.fontFamily}
              onChange={e => update({ fontFamily: e.target.value })}
              className="w-full bg-[#21262d] border border-[#30363d] rounded px-2 py-1.5 text-[12px] text-[#e6edf3] outline-none focus:border-[#58a6ff] transition-colors">
              {FONTS.map(f => <option key={f} value={f}>{f}</option>)}
            </select>
          </div>
          <div className="py-2.5 border-b border-[#21262d]">
            <p className="text-[12px] text-[#e6edf3] mb-1.5">Tab Size</p>
            <div className="flex gap-1.5">
              {[2, 4, 8].map(n => (
                <button key={n} onClick={() => update({ tabSize: n })}
                  className={`flex-1 py-1 rounded text-[12px] border transition-colors ${settings.tabSize === n ? "bg-[#1f6feb] border-[#1f6feb]/50 text-white" : "text-[#8b949e] border-[#30363d] hover:bg-[#21262d]"}`}>
                  {n} spaces
                </button>
              ))}
            </div>
          </div>
          <div className="py-2.5 border-b border-[#21262d]">
            <p className="text-[12px] text-[#e6edf3] mb-1.5">Cursor Style</p>
            <div className="flex gap-1.5">
              {(["line", "block", "underline"] as const).map(s => (
                <button key={s} onClick={() => update({ cursorStyle: s })}
                  className={`flex-1 py-1 rounded text-[12px] border transition-colors capitalize ${settings.cursorStyle === s ? "bg-[#1f6feb] border-[#1f6feb]/50 text-white" : "text-[#8b949e] border-[#30363d] hover:bg-[#21262d]"}`}>
                  {s}
                </button>
              ))}
            </div>
          </div>
          <Toggle label="Word Wrap" value={settings.wordWrap} onChange={v => update({ wordWrap: v })} desc="Wrap long lines" />
          <Toggle label="Minimap" value={settings.minimap} onChange={v => update({ minimap: v })} desc="Show code minimap on right" />
          <Toggle label="Line Numbers" value={settings.lineNumbers} onChange={v => update({ lineNumbers: v })} />
          <Toggle label="Bracket Colorization" value={settings.bracketColorization} onChange={v => update({ bracketColorization: v })} />
          <Toggle label="Render Whitespace" value={settings.renderWhitespace} onChange={v => update({ renderWhitespace: v })} />
          <Toggle label="Smooth Scrolling" value={settings.smoothScrolling} onChange={v => update({ smoothScrolling: v })} />
          <Toggle label="Linked Editing" value={settings.linkedEditing} onChange={v => update({ linkedEditing: v })} desc="Auto-close/rename HTML tags" />
        </section>

        {/* Save */}
        <section className="px-3 pt-2 pb-1">
          <div className="flex items-center gap-1.5 mb-1">
            <Save className="h-3 w-3 text-[#8b949e]" />
            <p className="text-[10px] font-semibold text-[#8b949e] uppercase tracking-wider">Save</p>
          </div>
          <Toggle label="Format on Save" value={settings.formatOnSave} onChange={v => update({ formatOnSave: v })} desc="Auto-format code on Ctrl+S" />
          <Toggle label="Auto Save" value={settings.autoSave} onChange={v => update({ autoSave: v })} desc="Save automatically after delay" />
          {settings.autoSave && (
            <Slider label="Auto-save Delay" value={settings.autoSaveDelay} min={500} max={5000} step={500} onChange={v => update({ autoSaveDelay: v })} unit="ms" />
          )}
        </section>

        {/* Theme */}
        <section className="px-3 pt-2 pb-3">
          <div className="flex items-center gap-1.5 mb-2">
            <Palette className="h-3 w-3 text-[#8b949e]" />
            <p className="text-[10px] font-semibold text-[#8b949e] uppercase tracking-wider">Theme</p>
          </div>
          <div className="grid grid-cols-1 gap-1.5">
            {THEMES.map(t => (
              <button key={t.id} onClick={() => update({ theme: t.id })}
                className={`flex items-center gap-2.5 px-2.5 py-2 rounded border transition-colors ${settings.theme === t.id ? "border-[#58a6ff] bg-[#1f6feb]/10" : "border-[#30363d] hover:bg-[#21262d]"}`}>
                <div className="h-5 w-5 rounded shrink-0 border border-[#30363d]" style={{ background: t.preview }} />
                <span className="text-[12px] text-[#e6edf3]">{t.label}</span>
                {settings.theme === t.id && <Check className="h-3 w-3 text-[#58a6ff] ml-auto" />}
              </button>
            ))}
          </div>
        </section>

        {/* Code Intelligence */}
        <section className="px-3 pt-2 pb-4">
          <div className="flex items-center gap-1.5 mb-1">
            <Code2 className="h-3 w-3 text-[#8b949e]" />
            <p className="text-[10px] font-semibold text-[#8b949e] uppercase tracking-wider">Intelligence</p>
          </div>
          <div className="bg-[#161b22] rounded border border-[#21262d] p-2.5">
            <p className="text-[11px] text-[#8b949e]">AI completions (Ctrl+Space), inline assist (Cmd+I), and code review are always active.</p>
            <p className="text-[11px] text-[#8b949e] mt-1.5">Powered by Claude claude-haiku-4-5.</p>
          </div>
        </section>
      </div>
    </div>
  );
}
