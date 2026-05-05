import { useState } from "react";
import { useLocation } from "wouter";
import { WorkspaceLayout } from "@/components/layout/WorkspaceLayout";
import { useToast } from "@/hooks/use-toast";
import {
  Palette, Zap, Keyboard, Bot, Layers, Database,
  Activity, Search, Star, Download, Check, Package,
  Code2, LayoutTemplate, GitBranch, Terminal, RefreshCw,
  Sparkles, ChevronRight, X, Eye, ArrowLeft, CheckCircle2
} from "lucide-react";

type ExtensionCategory = "All" | "Themes" | "Linters" | "Keymaps" | "AI" | "UI Libraries" | "State" | "Animation";

/* ── Theme palette type ── */
interface ThemePalette {
  bg: string;
  sidebar: string;
  editor: string;
  accent: string;
  text: string;
  comment: string;
  keyword: string;
  string: string;
  number: string;
  function: string;
}

const THEME_PALETTES: Record<string, ThemePalette> = {
  cobalt2: {
    bg: "#193549", sidebar: "#122738", editor: "#193549",
    accent: "#ffc600", text: "#ffffff", comment: "#0088ff",
    keyword: "#ff9d00", string: "#a5ff90", number: "#ff628c", function: "#ffc600",
  },
  dracula: {
    bg: "#282a36", sidebar: "#21222c", editor: "#282a36",
    accent: "#bd93f9", text: "#f8f8f2", comment: "#6272a4",
    keyword: "#ff79c6", string: "#f1fa8c", number: "#bd93f9", function: "#50fa7b",
  },
  "solarized-dark": {
    bg: "#002b36", sidebar: "#073642", editor: "#002b36",
    accent: "#268bd2", text: "#839496", comment: "#586e75",
    keyword: "#859900", string: "#2aa198", number: "#d33682", function: "#268bd2",
  },
  "one-dark": {
    bg: "#282c34", sidebar: "#21252b", editor: "#282c34",
    accent: "#61afef", text: "#abb2bf", comment: "#5c6370",
    keyword: "#c678dd", string: "#98c379", number: "#d19a66", function: "#61afef",
  },
  "night-owl": {
    bg: "#011627", sidebar: "#010e1a", editor: "#011627",
    accent: "#82aaff", text: "#d6deeb", comment: "#637777",
    keyword: "#c792ea", string: "#ecc48d", number: "#f78c6c", function: "#82aaff",
  },
  "tokyo-night": {
    bg: "#1a1b26", sidebar: "#16161e", editor: "#1a1b26",
    accent: "#7aa2f7", text: "#c0caf5", comment: "#565f89",
    keyword: "#bb9af7", string: "#9ece6a", number: "#ff9e64", function: "#7aa2f7",
  },
};

const THEME_SAMPLE_CODE = `function greet(name) {
  // Welcome message
  const msg = "Hello, " + name;
  const count = 42;
  return msg;
}`;

interface Extension {
  id: string;
  name: string;
  description: string;
  category: ExtensionCategory;
  author: string;
  stars: number;
  installs: number;
  icon: React.ReactNode;
  iconColor: string;
  iconBg: string;
  tags: string[];
  installed?: boolean;
}

const EXTENSIONS: Extension[] = [
  {
    id: "cobalt2",
    name: "Cobalt2 Theme",
    description: "A dark blue inspired theme with vibrant colors and comfortable contrast.",
    category: "Themes",
    author: "Wes Bos",
    stars: 4.9,
    installs: 128000,
    icon: <Palette className="h-5 w-5" />,
    iconColor: "text-blue-400",
    iconBg: "bg-blue-400/10",
    tags: ["dark", "blue", "popular"],
  },
  {
    id: "dracula",
    name: "Dracula Official",
    description: "A dark theme for code editors with purple and pink highlights.",
    category: "Themes",
    author: "Dracula Theme",
    stars: 4.8,
    installs: 95000,
    icon: <Palette className="h-5 w-5" />,
    iconColor: "text-purple-400",
    iconBg: "bg-purple-400/10",
    tags: ["dark", "purple", "popular"],
  },
  {
    id: "solarized-dark",
    name: "Solarized Dark",
    description: "Precision colors designed for use with both terminal and GUI applications.",
    category: "Themes",
    author: "Ethan Schoonover",
    stars: 4.7,
    installs: 72000,
    icon: <Palette className="h-5 w-5" />,
    iconColor: "text-yellow-400",
    iconBg: "bg-yellow-400/10",
    tags: ["dark", "classic"],
  },
  {
    id: "one-dark",
    name: "One Dark Pro",
    description: "Atom's iconic One Dark theme ported to editors. Most downloaded theme ever.",
    category: "Themes",
    author: "binaryify",
    stars: 4.9,
    installs: 310000,
    icon: <Palette className="h-5 w-5" />,
    iconColor: "text-cyan-400",
    iconBg: "bg-cyan-400/10",
    tags: ["dark", "atom", "popular"],
  },
  {
    id: "night-owl",
    name: "Night Owl",
    description: "A VS Code theme for night owls. Fine-tuned for people who love late-night coding.",
    category: "Themes",
    author: "Sarah Drasner",
    stars: 4.8,
    installs: 88000,
    icon: <Palette className="h-5 w-5" />,
    iconColor: "text-blue-300",
    iconBg: "bg-blue-300/10",
    tags: ["dark", "night", "accessible"],
  },
  {
    id: "tokyo-night",
    name: "Tokyo Night",
    description: "A clean, dark theme that celebrates the lights of downtown Tokyo at night.",
    category: "Themes",
    author: "enkia",
    stars: 4.9,
    installs: 195000,
    icon: <Palette className="h-5 w-5" />,
    iconColor: "text-indigo-400",
    iconBg: "bg-indigo-400/10",
    tags: ["dark", "minimal", "popular"],
  },
  {
    id: "eslint",
    name: "ESLint",
    description: "Find and fix problems in your JavaScript code. Supports JSX and TypeScript.",
    category: "Linters",
    author: "ESLint Team",
    stars: 4.9,
    installs: 215000,
    icon: <Zap className="h-5 w-5" />,
    iconColor: "text-yellow-400",
    iconBg: "bg-yellow-400/10",
    tags: ["javascript", "typescript", "linting"],
    installed: true,
  },
  {
    id: "prettier",
    name: "Prettier",
    description: "An opinionated code formatter that supports many languages.",
    category: "Linters",
    author: "Prettier",
    stars: 4.8,
    installs: 198000,
    icon: <Code2 className="h-5 w-5" />,
    iconColor: "text-pink-400",
    iconBg: "bg-pink-400/10",
    tags: ["formatter", "javascript", "css"],
    installed: true,
  },
  {
    id: "pylint",
    name: "Pylint",
    description: "A Python static code analysis tool that checks for errors and enforces standards.",
    category: "Linters",
    author: "PyCQA",
    stars: 4.6,
    installs: 87000,
    icon: <Zap className="h-5 w-5" />,
    iconColor: "text-green-400",
    iconBg: "bg-green-400/10",
    tags: ["python", "linting"],
  },
  {
    id: "vscode-keymap",
    name: "VS Code Keymap",
    description: "Use all the familiar VS Code keyboard shortcuts you already know.",
    category: "Keymaps",
    author: "Replit",
    stars: 4.9,
    installs: 142000,
    icon: <Keyboard className="h-5 w-5" />,
    iconColor: "text-blue-400",
    iconBg: "bg-blue-400/10",
    tags: ["vscode", "shortcuts", "popular"],
    installed: true,
  },
  {
    id: "vim-keymap",
    name: "Vim Keymap",
    description: "Full Vim emulation including motions, visual mode, and command mode.",
    category: "Keymaps",
    author: "Replit",
    stars: 4.7,
    installs: 63000,
    icon: <Keyboard className="h-5 w-5" />,
    iconColor: "text-green-400",
    iconBg: "bg-green-400/10",
    tags: ["vim", "emulation"],
  },
  {
    id: "emacs-keymap",
    name: "Emacs Keymap",
    description: "Emacs-style key bindings for navigation and text editing.",
    category: "Keymaps",
    author: "Community",
    stars: 4.4,
    installs: 18000,
    icon: <Keyboard className="h-5 w-5" />,
    iconColor: "text-orange-400",
    iconBg: "bg-orange-400/10",
    tags: ["emacs"],
  },
  {
    id: "ghostwriter",
    name: "Ghostwriter AI",
    description: "Real-time AI code completion. Suggests entire lines as you type.",
    category: "AI",
    author: "Replit",
    stars: 5.0,
    installs: 320000,
    icon: <Sparkles className="h-5 w-5" />,
    iconColor: "text-purple-400",
    iconBg: "bg-purple-400/10",
    tags: ["ai", "autocomplete", "official"],
    installed: true,
  },
  {
    id: "explain-code",
    name: "Explain Code",
    description: "Highlight any code and get an instant AI explanation in plain language.",
    category: "AI",
    author: "Replit",
    stars: 4.8,
    installs: 175000,
    icon: <Bot className="h-5 w-5" />,
    iconColor: "text-cyan-400",
    iconBg: "bg-cyan-400/10",
    tags: ["ai", "documentation", "official"],
  },
  {
    id: "ai-chat",
    name: "AI Chat Assistant",
    description: "A side panel chat powered by Claude. Ask questions about your codebase.",
    category: "AI",
    author: "Replit",
    stars: 4.9,
    installs: 289000,
    icon: <Bot className="h-5 w-5" />,
    iconColor: "text-blue-400",
    iconBg: "bg-blue-400/10",
    tags: ["ai", "chat", "official"],
    installed: true,
  },
  {
    id: "tailwindcss",
    name: "Tailwind CSS IntelliSense",
    description: "Autocomplete, syntax highlighting, and linting for Tailwind CSS classes.",
    category: "UI Libraries",
    author: "Tailwind Labs",
    stars: 4.9,
    installs: 245000,
    icon: <LayoutTemplate className="h-5 w-5" />,
    iconColor: "text-cyan-400",
    iconBg: "bg-cyan-400/10",
    tags: ["css", "tailwind", "popular"],
    installed: true,
  },
  {
    id: "shadcn-ui",
    name: "shadcn/ui Components",
    description: "Re-usable components built with Radix UI and Tailwind CSS.",
    category: "UI Libraries",
    author: "shadcn",
    stars: 4.9,
    installs: 189000,
    icon: <Layers className="h-5 w-5" />,
    iconColor: "text-white",
    iconBg: "bg-white/10",
    tags: ["components", "react", "popular"],
  },
  {
    id: "lucide",
    name: "Lucide React Icons",
    description: "Beautiful & consistent icon toolkit. 1000+ icons for your React app.",
    category: "UI Libraries",
    author: "Lucide Contributors",
    stars: 4.8,
    installs: 133000,
    icon: <Star className="h-5 w-5" />,
    iconColor: "text-yellow-400",
    iconBg: "bg-yellow-400/10",
    tags: ["icons", "react"],
    installed: true,
  },
  {
    id: "zustand",
    name: "Zustand",
    description: "A small, fast, and scalable state management solution for React.",
    category: "State",
    author: "pmndrs",
    stars: 4.8,
    installs: 112000,
    icon: <Database className="h-5 w-5" />,
    iconColor: "text-orange-400",
    iconBg: "bg-orange-400/10",
    tags: ["state", "react", "lightweight"],
  },
  {
    id: "react-query",
    name: "TanStack Query",
    description: "Powerful async data fetching, caching, and synchronization for React.",
    category: "State",
    author: "TanStack",
    stars: 4.9,
    installs: 167000,
    icon: <RefreshCw className="h-5 w-5" />,
    iconColor: "text-red-400",
    iconBg: "bg-red-400/10",
    tags: ["state", "data fetching", "popular"],
    installed: true,
  },
  {
    id: "redux-toolkit",
    name: "Redux Toolkit",
    description: "The official toolset for efficient Redux development with less boilerplate.",
    category: "State",
    author: "Redux Team",
    stars: 4.7,
    installs: 98000,
    icon: <Database className="h-5 w-5" />,
    iconColor: "text-purple-400",
    iconBg: "bg-purple-400/10",
    tags: ["state", "redux", "react"],
  },
  {
    id: "framer-motion",
    name: "Framer Motion",
    description: "A production-ready motion library for React with fluid animations.",
    category: "Animation",
    author: "Framer",
    stars: 5.0,
    installs: 156000,
    icon: <Activity className="h-5 w-5" />,
    iconColor: "text-pink-400",
    iconBg: "bg-pink-400/10",
    tags: ["animation", "react", "popular"],
    installed: true,
  },
  {
    id: "aos",
    name: "AOS – Animate on Scroll",
    description: "Animate elements as you scroll down the page with zero configuration.",
    category: "Animation",
    author: "Michał Sajnóg",
    stars: 4.6,
    installs: 74000,
    icon: <Activity className="h-5 w-5" />,
    iconColor: "text-green-400",
    iconBg: "bg-green-400/10",
    tags: ["animation", "scroll"],
  },
  {
    id: "lottie",
    name: "Lottie React",
    description: "Render Adobe After Effects animations natively in React with Lottie.",
    category: "Animation",
    author: "Airbnb",
    stars: 4.7,
    installs: 61000,
    icon: <Activity className="h-5 w-5" />,
    iconColor: "text-yellow-400",
    iconBg: "bg-yellow-400/10",
    tags: ["animation", "lottie", "after effects"],
  },
];

const CATEGORIES: { id: ExtensionCategory; label: string; icon: React.ReactNode }[] = [
  { id: "All", label: "All", icon: <Package className="h-4 w-4" /> },
  { id: "Themes", label: "Themes", icon: <Palette className="h-4 w-4" /> },
  { id: "Linters", label: "Linters", icon: <Zap className="h-4 w-4" /> },
  { id: "Keymaps", label: "Keymaps", icon: <Keyboard className="h-4 w-4" /> },
  { id: "AI", label: "AI Tools", icon: <Bot className="h-4 w-4" /> },
  { id: "UI Libraries", label: "UI Libraries", icon: <LayoutTemplate className="h-4 w-4" /> },
  { id: "State", label: "State Mgmt", icon: <Database className="h-4 w-4" /> },
  { id: "Animation", label: "Animation", icon: <Activity className="h-4 w-4" /> },
];

function formatCount(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(0)}k`;
  return String(n);
}

/* ── Theme Preview Panel ── */
function ThemePreviewPanel({
  ext,
  onClose,
  onToggle,
}: {
  ext: Extension;
  onClose: () => void;
  onToggle: (id: string) => void;
}) {
  const palette = THEME_PALETTES[ext.id];
  const [applied, setApplied] = useState(ext.installed ?? false);

  const handleApply = () => {
    setApplied(true);
    if (!ext.installed) onToggle(ext.id);
  };

  // Tokenise the sample code into colored spans
  const tokenize = (code: string, p: ThemePalette) => {
    return code.split("\n").map((line, li) => {
      const parts: React.ReactNode[] = [];
      let remaining = line;
      let ki = 0;

      const push = (text: string, color: string) => {
        parts.push(<span key={ki++} style={{ color }}>{text}</span>);
      };

      while (remaining.length) {
        // comment
        if (remaining.startsWith("//")) { push(remaining, p.comment); remaining = ""; continue; }
        // string
        const sq = remaining.match(/^(".*?"|'.*?')/);
        if (sq) { push(sq[0], p.string); remaining = remaining.slice(sq[0].length); continue; }
        // number
        const nq = remaining.match(/^(\d+)/);
        if (nq) { push(nq[0], p.number); remaining = remaining.slice(nq[0].length); continue; }
        // keyword
        const kw = ["function", "const", "return", "let", "var"].find(k => remaining.startsWith(k) && !/\w/.test(remaining[k.length] ?? ""));
        if (kw) { push(kw, p.keyword); remaining = remaining.slice(kw.length); continue; }
        // function name
        const fn = remaining.match(/^(\w+)(?=\()/);
        if (fn) { push(fn[0], p.function); remaining = remaining.slice(fn[0].length); continue; }
        // plain
        const plain = remaining.match(/^[^\w"'\/0-9]+|\w+/);
        if (plain) { push(plain[0], p.text); remaining = remaining.slice(plain[0].length); continue; }
        push(remaining[0], p.text); remaining = remaining.slice(1);
      }
      return <div key={li} className="leading-6">{parts.length ? parts : <span>&nbsp;</span>}</div>;
    });
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
      data-testid="theme-preview-backdrop"
    >
      <div
        className="w-full max-w-3xl rounded-t-2xl overflow-hidden shadow-2xl"
        style={{ background: palette?.bg ?? "#1e1e2e" }}
        onClick={e => e.stopPropagation()}
        data-testid={`theme-preview-${ext.id}`}
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
          <button
            onClick={onClose}
            className="flex items-center gap-1.5 text-sm opacity-60 hover:opacity-100 transition-opacity"
            style={{ color: palette?.text ?? "#ffffff" }}
            data-testid="button-close-theme-preview"
          >
            <ArrowLeft className="h-4 w-4" /> Back
          </button>
          <div className={`h-8 w-8 rounded-lg ${ext.iconBg} flex items-center justify-center shrink-0 ${ext.iconColor}`}>
            {ext.icon}
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-semibold" style={{ color: palette?.text ?? "#fff" }}>{ext.name}</h3>
            <p className="text-xs opacity-50" style={{ color: palette?.text ?? "#fff" }}>by {ext.author}</p>
          </div>
          <div className="flex items-center gap-2">
            {/* Color swatches */}
            {palette && [palette.keyword, palette.string, palette.number, palette.function, palette.comment].map((c, i) => (
              <div key={i} className="w-4 h-4 rounded-full border border-white/10" style={{ background: c }} title={c} />
            ))}
          </div>
        </div>

        {/* Editor mock */}
        {palette ? (
          <div className="flex" style={{ minHeight: "220px" }}>
            {/* Sidebar */}
            <div className="w-10 shrink-0" style={{ background: palette.sidebar }} />
            {/* Line numbers + code */}
            <div className="flex flex-1 overflow-hidden">
              <div className="px-3 py-3 text-right select-none" style={{ color: palette.comment, fontSize: "12px", lineHeight: "24px", minWidth: "36px" }}>
                {THEME_SAMPLE_CODE.split("\n").map((_, i) => <div key={i}>{i + 1}</div>)}
              </div>
              <pre className="flex-1 py-3 px-2 overflow-x-auto" style={{ background: palette.editor, fontFamily: "monospace", fontSize: "13px" }}>
                {tokenize(THEME_SAMPLE_CODE, palette)}
              </pre>
            </div>
          </div>
        ) : (
          <div className="h-48 flex items-center justify-center opacity-40" style={{ color: "#aaa" }}>
            No preview available
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center gap-3 px-5 py-4 border-t" style={{ borderColor: "rgba(255,255,255,0.08)", background: palette?.sidebar ?? "#1a1a2e" }}>
          <div className="flex gap-2 flex-1 flex-wrap">
            {ext.tags.map(t => (
              <span key={t} className="px-2 py-0.5 rounded-full text-[10px] font-medium" style={{ background: "rgba(255,255,255,0.08)", color: palette?.accent ?? "#aaa" }}>
                {t}
              </span>
            ))}
          </div>
          <button
            onClick={handleApply}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all"
            style={{
              background: applied ? "rgba(50,215,75,0.15)" : palette?.accent ?? "#6366f1",
              color: applied ? "#3fb950" : (palette ? "#000" : "#fff"),
              border: applied ? "1px solid rgba(50,215,75,0.3)" : "1px solid transparent",
            }}
            data-testid={`button-apply-theme-${ext.id}`}
          >
            {applied ? <><CheckCircle2 className="h-4 w-4" /> Applied</> : <><Palette className="h-4 w-4" /> Apply Theme</>}
          </button>
        </div>
      </div>
    </div>
  );
}

function ExtensionCard({ ext, onToggle, onPreview }: { ext: Extension; onToggle: (id: string) => void; onPreview?: (id: string) => void }) {
  const isTheme = ext.category === "Themes";
  return (
    <div
      className="group p-4 rounded-xl bg-[#161b22] border border-[#21262d] hover:border-[#30363d] transition-all"
      data-testid={`extension-card-${ext.id}`}
    >
      <div className="flex items-start gap-3">
        <div className={`h-10 w-10 rounded-lg ${ext.iconBg} flex items-center justify-center shrink-0 ${ext.iconColor}`}>
          {ext.icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <div>
              <h3 className="text-sm font-semibold text-[#e6edf3] leading-tight">{ext.name}</h3>
              <p className="text-[11px] text-[#484f58] mt-0.5">by {ext.author}</p>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              {isTheme && THEME_PALETTES[ext.id] && (
                <button
                  onClick={() => onPreview?.(ext.id)}
                  className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-medium bg-[#21262d] text-[#8b949e] border border-[#30363d] hover:text-[#e6edf3] hover:border-[#8b949e] transition-all"
                  data-testid={`button-preview-${ext.id}`}
                >
                  <Eye className="h-3 w-3" /> Preview
                </button>
              )}
            <button
              onClick={() => onToggle(ext.id)}
              className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                ext.installed
                  ? "bg-[#238636]/20 text-[#3fb950] border border-[#238636]/30 hover:bg-[#f85149]/10 hover:text-[#f85149] hover:border-[#f85149]/30"
                  : "bg-[#1f6feb]/20 text-[#58a6ff] border border-[#1f6feb]/30 hover:bg-[#1f6feb]/30"
              }`}
              data-testid={`button-${ext.installed ? "uninstall" : "install"}-${ext.id}`}
            >
              {ext.installed ? (
                <><Check className="h-3 w-3" /> Installed</>
              ) : (
                <><Download className="h-3 w-3" /> Install</>
              )}
            </button>
            </div>
          </div>
          <p className="text-xs text-[#8b949e] leading-relaxed mb-3">{ext.description}</p>
          <div className="flex items-center gap-3 text-[11px] text-[#484f58]">
            <span className="flex items-center gap-1">
              <Star className="h-3 w-3 text-yellow-400 fill-yellow-400" />
              {ext.stars}
            </span>
            <span className="flex items-center gap-1">
              <Download className="h-3 w-3" />
              {formatCount(ext.installs)}
            </span>
            <div className="flex gap-1.5 flex-wrap">
              {ext.tags.slice(0, 2).map(tag => (
                <span key={tag} className="px-1.5 py-0.5 rounded bg-[#21262d] text-[#8b949e] border border-[#30363d]">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Extensions() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [activeCategory, setActiveCategory] = useState<ExtensionCategory>("All");
  const [search, setSearch] = useState("");
  const [extensions, setExtensions] = useState<Extension[]>(EXTENSIONS);
  const [previewThemeId, setPreviewThemeId] = useState<string | null>(null);

  const filtered = extensions.filter(ext => {
    const matchCat = activeCategory === "All" || ext.category === activeCategory;
    const matchSearch = !search ||
      ext.name.toLowerCase().includes(search.toLowerCase()) ||
      ext.description.toLowerCase().includes(search.toLowerCase()) ||
      ext.tags.some(t => t.toLowerCase().includes(search.toLowerCase()));
    return matchCat && matchSearch;
  });

  const installedCount = extensions.filter(e => e.installed).length;

  const handleToggle = (id: string) => {
    setExtensions(prev => prev.map(ext => {
      if (ext.id !== id) return ext;
      const nowInstalled = !ext.installed;
      toast({
        title: nowInstalled ? `${ext.name} installed` : `${ext.name} removed`,
        description: nowInstalled
          ? "Reload your editor to activate this extension."
          : "Extension has been removed.",
      });
      return { ...ext, installed: nowInstalled };
    }));
  };

  return (
    <WorkspaceLayout>
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6 pb-24">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#e6edf3] flex items-center gap-2" data-testid="heading-extensions">
              <Package className="h-6 w-6 text-[#a371f7]" />
              Extensions Store
            </h1>
            <p className="text-sm text-[#8b949e] mt-1">
              Extend your workspace with themes, tools, and AI features
            </p>
          </div>
          <div className="text-right">
            <span className="text-xs text-[#8b949e]">{installedCount} installed</span>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#484f58]" />
          <input
            type="text"
            placeholder="Search extensions..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-9 py-2.5 text-sm bg-[#161b22] border border-[#30363d] rounded-lg text-[#e6edf3] placeholder-[#484f58] outline-none focus:border-[#58a6ff]/50 transition-colors"
            data-testid="input-search-extensions"
          />
          {search && (
            <button onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#484f58] hover:text-[#8b949e]">
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Category chips */}
        <div className="flex gap-2 flex-wrap">
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                activeCategory === cat.id
                  ? "bg-[#a371f7] text-white"
                  : "bg-[#161b22] text-[#8b949e] border border-[#30363d] hover:text-[#e6edf3] hover:border-[#8b949e]"
              }`}
              data-testid={`category-${cat.id.toLowerCase().replace(/\s+/g, "-")}`}
            >
              {cat.icon}
              {cat.label}
            </button>
          ))}
        </div>

        {/* Installed section */}
        {activeCategory === "All" && !search && (
          <section>
            <h2 className="text-xs font-semibold text-[#8b949e] uppercase tracking-widest mb-3 flex items-center gap-2">
              <Check className="h-3.5 w-3.5 text-[#3fb950]" /> Installed
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {extensions.filter(e => e.installed).map(ext => (
                <ExtensionCard key={ext.id} ext={ext} onToggle={handleToggle} onPreview={setPreviewThemeId} />
              ))}
            </div>
          </section>
        )}

        {/* All / filtered results */}
        <section>
          {activeCategory === "All" && !search && (
            <h2 className="text-xs font-semibold text-[#8b949e] uppercase tracking-widest mb-3">
              Discover
            </h2>
          )}
          {filtered.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {filtered
                .filter(ext => activeCategory !== "All" || search || !ext.installed)
                .map(ext => (
                  <ExtensionCard key={ext.id} ext={ext} onToggle={handleToggle} onPreview={setPreviewThemeId} />
                ))}
            </div>
          ) : (
            <div className="py-16 text-center">
              <Package className="h-12 w-12 mx-auto mb-3 text-[#484f58] opacity-40" />
              <p className="text-[#484f58] text-sm">No extensions found for "{search}"</p>
            </div>
          )}
        </section>

      </div>

      {/* Theme Preview Modal */}
      {previewThemeId && (() => {
        const ext = extensions.find(e => e.id === previewThemeId);
        if (!ext) return null;
        return (
          <ThemePreviewPanel
            ext={ext}
            onClose={() => setPreviewThemeId(null)}
            onToggle={handleToggle}
          />
        );
      })()}

    </WorkspaceLayout>
  );
}
