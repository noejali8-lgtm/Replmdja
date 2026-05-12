import { useState, useEffect, useCallback } from "react";
import { Languages, Plus, Trash2, Save, Sparkles, Loader2, Globe, ChevronDown, Check } from "lucide-react";

interface Props {
  projectId?: number;
}

const LANG_NAMES: Record<string, string> = {
  en: "English", es: "Spanish", fr: "French", de: "German", it: "Italian",
  pt: "Portuguese", ru: "Russian", ja: "Japanese", ko: "Korean", zh: "Chinese",
  ar: "Arabic", hi: "Hindi", nl: "Dutch", pl: "Polish", tr: "Turkish",
  "pt-BR": "Portuguese (BR)", "zh-TW": "Chinese (TW)",
};

export function I18nManagerPanel({ projectId }: Props) {
  const [langs, setLangs] = useState<string[]>([]);
  const [activeLang, setActiveLang] = useState("en");
  const [translations, setTranslations] = useState<Record<string, string>>({});
  const [dirty, setDirty] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [translating, setTranslating] = useState(false);
  const [newKey, setNewKey] = useState("");
  const [newVal, setNewVal] = useState("");
  const [addingLang, setAddingLang] = useState(false);
  const [newLang, setNewLang] = useState("es");
  const [search, setSearch] = useState("");
  const [savedOk, setSavedOk] = useState(false);

  const baseUrl = projectId ? `/api/projects/${projectId}` : null;

  const loadLangs = useCallback(async () => {
    if (!baseUrl) return;
    try {
      const r = await fetch(`${baseUrl}/i18n`, { credentials: "include" });
      const data = await r.json() as { languages?: string[] };
      const ls = data.languages ?? ["en"];
      setLangs(ls);
      if (!ls.includes(activeLang)) setActiveLang(ls[0] ?? "en");
    } catch { /* */ }
  }, [baseUrl, activeLang]);

  const loadTranslations = useCallback(async (lang: string) => {
    if (!baseUrl) return;
    setLoading(true);
    try {
      const r = await fetch(`${baseUrl}/i18n/${lang}`, { credentials: "include" });
      const data = await r.json() as { translations?: Record<string, string> };
      setTranslations(data.translations ?? {});
      setDirty(false);
    } catch { /* */ }
    finally { setLoading(false); }
  }, [baseUrl]);

  useEffect(() => { loadLangs(); }, [loadLangs]);
  useEffect(() => { if (activeLang) loadTranslations(activeLang); }, [activeLang, loadTranslations]);

  const save = async () => {
    if (!baseUrl || !dirty) return;
    setSaving(true);
    try {
      await fetch(`${baseUrl}/i18n/${activeLang}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ translations }),
      });
      setDirty(false);
      setSavedOk(true);
      setTimeout(() => setSavedOk(false), 2000);
    } catch { /* */ }
    finally { setSaving(false); }
  };

  const addKey = () => {
    if (!newKey.trim()) return;
    setTranslations(p => ({ ...p, [newKey.trim()]: newVal }));
    setNewKey(""); setNewVal(""); setDirty(true);
  };

  const deleteKey = (key: string) => {
    setTranslations(p => { const n = { ...p }; delete n[key]; return n; });
    setDirty(true);
  };

  const updateVal = (key: string, val: string) => {
    setTranslations(p => ({ ...p, [key]: val }));
    setDirty(true);
  };

  const aiTranslate = async () => {
    if (!baseUrl) return;
    const enKeys = activeLang !== "en" ? translations : {};
    if (Object.keys(enKeys).length === 0 && Object.keys(translations).length === 0) return;

    setTranslating(true);
    try {
      const r = await fetch(`${baseUrl}/i18n/translate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ keys: translations, from: activeLang, to: activeLang === "en" ? "es" : "en" }),
      });
      const data = await r.json() as { translations?: Record<string, string> };
      if (data.translations) {
        const targetLang = activeLang === "en" ? "es" : "en";
        if (!langs.includes(targetLang)) {
          setLangs(p => [...p, targetLang]);
        }
        await fetch(`${baseUrl}/i18n/${targetLang}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ translations: data.translations }),
        });
        await loadLangs();
      }
    } catch { /* */ }
    finally { setTranslating(false); }
  };

  const addLang = async () => {
    if (!baseUrl || !newLang.trim() || langs.includes(newLang.trim())) return;
    const code = newLang.trim();
    await fetch(`${baseUrl}/i18n/${code}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ translations: {} }),
    });
    setLangs(p => [...p, code]);
    setActiveLang(code);
    setAddingLang(false);
    setNewLang("es");
  };

  const filtered = Object.entries(translations).filter(([k, v]) =>
    !search || k.toLowerCase().includes(search.toLowerCase()) || v.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full bg-[#0d1117] text-[#e6edf3] overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-[#21262d] bg-[#161b22] shrink-0">
        <Languages className="h-4 w-4 text-[#a371f7]" />
        <span className="text-xs font-semibold flex-1">i18n Manager</span>
        {dirty && !saving && (
          <button onClick={save} className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded bg-[#238636] text-white hover:bg-[#2ea043] transition-colors">
            <Save className="h-2.5 w-2.5" /> Save
          </button>
        )}
        {saving && <Loader2 className="h-3.5 w-3.5 animate-spin text-[#8b949e]" />}
        {savedOk && <Check className="h-3.5 w-3.5 text-[#3fb950]" />}
      </div>

      {/* Lang tabs */}
      <div className="px-2 py-1.5 border-b border-[#21262d] flex items-center gap-1 flex-wrap shrink-0">
        {langs.map(lang => (
          <button
            key={lang}
            onClick={() => setActiveLang(lang)}
            className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium transition-colors ${activeLang === lang ? "bg-[#21262d] text-[#e6edf3]" : "text-[#8b949e] hover:text-[#e6edf3] hover:bg-[#161b22]"}`}
          >
            <Globe className="h-2.5 w-2.5" />
            {lang.toUpperCase()}
          </button>
        ))}
        {addingLang ? (
          <div className="flex items-center gap-1">
            <input
              value={newLang}
              onChange={e => setNewLang(e.target.value)}
              className="w-12 bg-[#161b22] border border-[#30363d] rounded px-1.5 py-0.5 text-[10px] text-[#e6edf3] outline-none"
              placeholder="fr"
              onKeyDown={e => { if (e.key === "Enter") addLang(); if (e.key === "Escape") setAddingLang(false); }}
              autoFocus
            />
            <button onClick={addLang} className="text-[10px] px-1.5 py-0.5 rounded bg-[#21262d] text-[#3fb950] hover:bg-[#30363d]">✓</button>
            <button onClick={() => setAddingLang(false)} className="text-[10px] px-1.5 py-0.5 rounded bg-[#21262d] text-[#ff7b72] hover:bg-[#30363d]">✗</button>
          </div>
        ) : (
          <button onClick={() => setAddingLang(true)}
            className="flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] text-[#484f58] hover:text-[#8b949e] hover:bg-[#161b22] transition-colors">
            <Plus className="h-2.5 w-2.5" /> Add
          </button>
        )}
      </div>

      {/* AI translate bar */}
      {projectId && (
        <div className="px-3 py-1.5 border-b border-[#21262d] flex items-center gap-2 shrink-0">
          <Sparkles className="h-3 w-3 text-[#a371f7]" />
          <span className="text-[10px] text-[#8b949e] flex-1">AI auto-translate to {activeLang === "en" ? "Spanish" : "English"}</span>
          <button
            onClick={aiTranslate}
            disabled={translating || Object.keys(translations).length === 0}
            className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] bg-[#a371f7]/20 text-[#a371f7] border border-[#a371f7]/30 hover:bg-[#a371f7]/30 transition-colors disabled:opacity-40"
          >
            {translating ? <Loader2 className="h-2.5 w-2.5 animate-spin" /> : <Sparkles className="h-2.5 w-2.5" />}
            Translate
          </button>
        </div>
      )}

      {/* Search */}
      <div className="px-3 py-1.5 border-b border-[#21262d] shrink-0">
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full bg-[#161b22] border border-[#30363d] rounded px-2 py-1 text-[11px] text-[#e6edf3] placeholder-[#484f58] outline-none focus:border-[#58a6ff] transition-colors"
          placeholder="Search keys or values…"
        />
      </div>

      {/* Key-value list */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-8 text-[#484f58] text-xs">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading translations…
          </div>
        ) : !projectId ? (
          <div className="flex flex-col items-center justify-center py-10 text-[#484f58] text-xs gap-2 px-3 text-center">
            <Languages className="h-8 w-8 opacity-30" />
            <p className="text-xs font-medium">Open a real project</p>
            <p className="text-[10px]">i18n files are created in your project's locales/ directory</p>
          </div>
        ) : filtered.length === 0 && !search ? (
          <div className="flex flex-col items-center justify-center py-8 text-[#484f58] gap-2 px-3 text-center">
            <Languages className="h-6 w-6 opacity-30" />
            <p className="text-[11px]">No translation keys yet.</p>
            <p className="text-[10px]">Add keys below.</p>
          </div>
        ) : (
          filtered.map(([key, val]) => (
            <div key={key} className="group px-3 py-2 border-b border-[#21262d]/50 hover:bg-[#161b22] transition-colors">
              <div className="flex items-center gap-1 mb-1">
                <span className="text-[10px] font-mono text-[#58a6ff] flex-1 truncate">{key}</span>
                <button onClick={() => deleteKey(key)}
                  className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-[#f85149]/20 hover:text-[#ff7b72] text-[#484f58] transition-all">
                  <Trash2 className="h-2.5 w-2.5" />
                </button>
              </div>
              <input
                value={val}
                onChange={e => updateVal(key, e.target.value)}
                className="w-full bg-[#0d1117] border border-[#21262d] rounded px-2 py-1 text-[11px] text-[#e6edf3] outline-none focus:border-[#30363d] transition-colors"
              />
            </div>
          ))
        )}
      </div>

      {/* Add new key */}
      {projectId && (
        <div className="border-t border-[#21262d] px-3 py-2 shrink-0 space-y-1.5">
          <p className="text-[9px] text-[#484f58] uppercase tracking-widest">Add key</p>
          <div className="flex items-center gap-1.5">
            <input
              value={newKey}
              onChange={e => setNewKey(e.target.value)}
              onKeyDown={e => e.key === "Enter" && addKey()}
              className="flex-1 min-w-0 bg-[#161b22] border border-[#30363d] rounded px-2 py-1 text-[11px] text-[#e6edf3] placeholder-[#484f58] outline-none focus:border-[#58a6ff] transition-colors"
              placeholder="key.name"
            />
            <input
              value={newVal}
              onChange={e => setNewVal(e.target.value)}
              onKeyDown={e => e.key === "Enter" && addKey()}
              className="flex-1 min-w-0 bg-[#161b22] border border-[#30363d] rounded px-2 py-1 text-[11px] text-[#e6edf3] placeholder-[#484f58] outline-none focus:border-[#58a6ff] transition-colors"
              placeholder="Value"
            />
            <button onClick={addKey} disabled={!newKey.trim()}
              className="p-1.5 rounded bg-[#21262d] hover:bg-[#30363d] text-[#58a6ff] disabled:opacity-40 transition-colors shrink-0">
              <Plus className="h-3 w-3" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
