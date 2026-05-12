import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { ArrowLeft, User, Palette, Bell, Shield, Cpu, Globe, Save, Check, RotateCcw, Moon, Sun, Sliders } from "lucide-react";
import { motion } from "framer-motion";

interface AppSettings {
  username: string;
  email: string;
  theme: "dark" | "system";
  language: string;
  notifications: boolean;
  notifEmail: boolean;
  notifPush: boolean;
  defaultModel: string;
  turboMode: boolean;
  streamingMode: boolean;
  saveHistory: boolean;
  analyticsOptOut: boolean;
  autoImport: boolean;
  codeTheme: string;
}

const DEFAULT: AppSettings = {
  username: "Developer",
  email: "",
  theme: "dark",
  language: "en",
  notifications: true,
  notifEmail: false,
  notifPush: true,
  defaultModel: "claude-3-5-haiku-20241022",
  turboMode: false,
  streamingMode: true,
  saveHistory: true,
  analyticsOptOut: false,
  autoImport: true,
  codeTheme: "github-dark",
};

const STORAGE_KEY = "app-settings-v1";

function load(): AppSettings {
  try { return { ...DEFAULT, ...JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}") }; }
  catch { return { ...DEFAULT }; }
}

function save(s: AppSettings) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  localStorage.setItem("ide-username", s.username);
}

interface ToggleRowProps { label: string; desc?: string; value: boolean; onChange: (v: boolean) => void; }
function ToggleRow({ label, desc, value, onChange }: ToggleRowProps) {
  return (
    <div className="flex items-start justify-between py-3 border-b border-white/5 last:border-0">
      <div>
        <p className="text-sm text-white">{label}</p>
        {desc && <p className="text-xs text-[#8b949e] mt-0.5">{desc}</p>}
      </div>
      <button onClick={() => onChange(!value)}
        className={`relative shrink-0 w-10 h-5.5 rounded-full transition-colors mt-0.5 ${value ? "bg-[#238636]" : "bg-[#30363d]"}`}
        style={{ height: "22px", width: "40px" }}>
        <span className={`absolute top-0.5 left-0.5 h-4.5 w-4.5 rounded-full bg-white transition-transform shadow-sm`}
          style={{ height: "18px", width: "18px", transform: value ? "translateX(18px)" : "translateX(0)" }} />
      </button>
    </div>
  );
}

const SECTIONS = [
  { id: "profile",  label: "Profile",       icon: User },
  { id: "ai",       label: "AI & Models",   icon: Cpu },
  { id: "notifs",   label: "Notifications", icon: Bell },
  { id: "privacy",  label: "Privacy",       icon: Shield },
  { id: "advanced", label: "Advanced",      icon: Sliders },
];

export default function SettingsPage() {
  const [, nav] = useLocation();
  const [settings, setSettings] = useState<AppSettings>(load);
  const [saved, setSaved] = useState(false);
  const [section, setSection] = useState("profile");

  useEffect(() => { setSettings(load()); }, []);

  const update = (patch: Partial<AppSettings>) => {
    setSettings(prev => {
      const next = { ...prev, ...patch };
      save(next);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      return next;
    });
  };

  const reset = () => { save(DEFAULT); setSettings(DEFAULT); };

  return (
    <div className="flex flex-col h-screen bg-[#0d1117] text-white">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-white/10 bg-[#161b22] shrink-0">
        <button onClick={() => nav("/")} className="h-8 w-8 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors">
          <ArrowLeft className="h-4 w-4 text-[#8b949e]" />
        </button>
        <span className="font-semibold text-[15px]">Settings</span>
        <div className="flex-1" />
        {saved && (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-1.5 text-xs text-[#3fb950]">
            <Check className="h-3.5 w-3.5" /> Saved
          </motion.div>
        )}
        <button onClick={reset} className="flex items-center gap-1 text-xs text-[#484f58] hover:text-[#8b949e] transition-colors">
          <RotateCcw className="h-3.5 w-3.5" /> Reset
        </button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div className="w-40 shrink-0 border-r border-white/10 bg-[#0d1117] py-2 overflow-y-auto">
          {SECTIONS.map(s => (
            <button key={s.id} onClick={() => setSection(s.id)}
              className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-sm transition-colors ${
                section === s.id ? "bg-[#21262d] text-white" : "text-[#8b949e] hover:bg-[#161b22] hover:text-white"
              }`}>
              <s.icon className="h-4 w-4 shrink-0" />
              {s.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {/* Profile */}
          {section === "profile" && (
            <div className="max-w-md space-y-5">
              <h2 className="text-base font-semibold text-white flex items-center gap-2"><User className="h-4 w-4" /> Profile</h2>

              <div>
                <label className="text-xs text-[#8b949e] mb-1.5 block">Display Name</label>
                <input value={settings.username} onChange={e => update({ username: e.target.value })}
                  className="w-full bg-[#21262d] border border-[#30363d] rounded-lg px-3 py-2 text-sm text-white placeholder-[#484f58] outline-none focus:border-[#58a6ff] transition-colors" />
              </div>

              <div>
                <label className="text-xs text-[#8b949e] mb-1.5 block">Email</label>
                <input value={settings.email} onChange={e => update({ email: e.target.value })}
                  type="email" placeholder="you@example.com"
                  className="w-full bg-[#21262d] border border-[#30363d] rounded-lg px-3 py-2 text-sm text-white placeholder-[#484f58] outline-none focus:border-[#58a6ff] transition-colors" />
              </div>

              <div>
                <label className="text-xs text-[#8b949e] mb-1.5 block">Language</label>
                <select value={settings.language} onChange={e => update({ language: e.target.value })}
                  className="w-full bg-[#21262d] border border-[#30363d] rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-[#58a6ff]">
                  <option value="en">English</option>
                  <option value="ar">العربية</option>
                  <option value="es">Español</option>
                  <option value="fr">Français</option>
                  <option value="de">Deutsch</option>
                  <option value="zh">中文</option>
                  <option value="ja">日本語</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-[#8b949e] mb-2 block">Theme</label>
                <div className="flex gap-3">
                  {([
                    { id: "dark", icon: Moon, label: "Dark" },
                    { id: "system", icon: Sun, label: "System" },
                  ] as const).map(t => (
                    <button key={t.id} onClick={() => update({ theme: t.id })}
                      className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg border text-sm transition-colors ${
                        settings.theme === t.id ? "border-[#58a6ff] bg-[#1f6feb]/10 text-white" : "border-[#30363d] text-[#8b949e] hover:bg-[#21262d]"
                      }`}>
                      <t.icon className="h-4 w-4" /> {t.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* AI & Models */}
          {section === "ai" && (
            <div className="max-w-md space-y-5">
              <h2 className="text-base font-semibold text-white flex items-center gap-2"><Cpu className="h-4 w-4" /> AI & Models</h2>
              <div>
                <label className="text-xs text-[#8b949e] mb-1.5 block">Default Model</label>
                <select value={settings.defaultModel} onChange={e => update({ defaultModel: e.target.value })}
                  className="w-full bg-[#21262d] border border-[#30363d] rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-[#58a6ff]">
                  <option value="claude-3-5-haiku-20241022">Claude Haiku 3.5 (Fast)</option>
                  <option value="claude-opus-4-5">Claude Opus 4.5 (Powerful)</option>
                  <option value="claude-sonnet-4-5">Claude Sonnet 4.5 (Balanced)</option>
                </select>
              </div>
              <div className="bg-[#161b22] rounded-xl border border-white/10 px-4 divide-y divide-white/5">
                <ToggleRow label="Turbo Mode" desc="2.5× faster responses (less context)" value={settings.turboMode} onChange={v => update({ turboMode: v })} />
                <ToggleRow label="Streaming Responses" desc="Show text as it generates" value={settings.streamingMode} onChange={v => update({ streamingMode: v })} />
                <ToggleRow label="Save Chat History" desc="Keep conversation history across sessions" value={settings.saveHistory} onChange={v => update({ saveHistory: v })} />
              </div>
            </div>
          )}

          {/* Notifications */}
          {section === "notifs" && (
            <div className="max-w-md space-y-5">
              <h2 className="text-base font-semibold text-white flex items-center gap-2"><Bell className="h-4 w-4" /> Notifications</h2>
              <div className="bg-[#161b22] rounded-xl border border-white/10 px-4 divide-y divide-white/5">
                <ToggleRow label="Enable Notifications" desc="Receive build, deploy, and agent updates" value={settings.notifications} onChange={v => update({ notifications: v })} />
                <ToggleRow label="Email Notifications" desc="Get summaries via email" value={settings.notifEmail} onChange={v => update({ notifEmail: v })} />
                <ToggleRow label="Push Notifications" desc="Browser push notifications" value={settings.notifPush} onChange={v => update({ notifPush: v })} />
              </div>
            </div>
          )}

          {/* Privacy */}
          {section === "privacy" && (
            <div className="max-w-md space-y-5">
              <h2 className="text-base font-semibold text-white flex items-center gap-2"><Shield className="h-4 w-4" /> Privacy</h2>
              <div className="bg-[#161b22] rounded-xl border border-white/10 px-4 divide-y divide-white/5">
                <ToggleRow label="Opt out of Analytics" desc="Don't send usage data" value={settings.analyticsOptOut} onChange={v => update({ analyticsOptOut: v })} />
              </div>
              <div className="bg-[#da3633]/10 border border-[#da3633]/30 rounded-xl p-4">
                <p className="text-sm font-medium text-[#f85149] mb-1">Danger Zone</p>
                <p className="text-xs text-[#8b949e] mb-3">These actions are permanent and cannot be undone.</p>
                <button className="px-3 py-1.5 rounded-lg bg-[#da3633]/20 border border-[#da3633]/30 text-[#f85149] text-xs hover:bg-[#da3633]/30 transition-colors">
                  Delete All Projects
                </button>
              </div>
            </div>
          )}

          {/* Advanced */}
          {section === "advanced" && (
            <div className="max-w-md space-y-5">
              <h2 className="text-base font-semibold text-white flex items-center gap-2"><Sliders className="h-4 w-4" /> Advanced</h2>
              <div className="bg-[#161b22] rounded-xl border border-white/10 px-4 divide-y divide-white/5">
                <ToggleRow label="Auto-import from GitHub" desc="Detect and import GitHub URLs automatically" value={settings.autoImport} onChange={v => update({ autoImport: v })} />
              </div>
              <div className="bg-[#161b22] rounded-xl border border-white/10 p-4 space-y-2">
                <p className="text-sm font-medium text-[#8b949e]">Storage</p>
                <div className="flex items-center justify-between text-xs text-[#484f58]">
                  <span>App settings</span>
                  <span>{(JSON.stringify(settings).length / 1024).toFixed(1)} KB</span>
                </div>
                <button onClick={() => { localStorage.clear(); setSettings(DEFAULT); }}
                  className="w-full mt-2 py-1.5 rounded-lg bg-[#21262d] border border-[#30363d] text-xs text-[#8b949e] hover:text-[#e6edf3] hover:bg-[#30363d] transition-colors">
                  Clear Local Storage
                </button>
              </div>
              <div className="bg-[#161b22] rounded-xl border border-white/10 p-4">
                <p className="text-sm font-medium text-[#8b949e] mb-2">API</p>
                <p className="text-xs text-[#484f58]">API Server: <span className="font-mono text-[#58a6ff]">/api</span></p>
                <p className="text-xs text-[#484f58] mt-1">WebSocket: <span className="font-mono text-[#58a6ff]">/api/presence/ws</span></p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
