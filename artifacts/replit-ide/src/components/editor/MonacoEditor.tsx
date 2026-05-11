import { useRef, useEffect } from "react";
import Editor, { useMonaco } from "@monaco-editor/react";
import type * as MonacoType from "monaco-editor";

export type CursorPosition = { line: number; column: number };

interface MonacoEditorProps {
  value: string;
  language: string;
  onChange: (value: string) => void;
  onSave?: () => void;
  onCursorChange?: (pos: CursorPosition) => void;
  onInlineAssist?: (selection: string) => void;
  readOnly?: boolean;
  fontSize?: number;
  minimap?: boolean;
  wordWrap?: boolean;
}

export function getLanguage(ext: string): string {
  const map: Record<string, string> = {
    ts: "typescript", tsx: "typescript", js: "javascript", jsx: "javascript",
    py: "python", json: "json", html: "html", css: "css", scss: "scss",
    md: "markdown", mdx: "markdown", sh: "shell", bash: "shell",
    yaml: "yaml", yml: "yaml", xml: "xml", sql: "sql", rs: "rust",
    go: "go", java: "java", cpp: "cpp", c: "c", cs: "csharp",
    rb: "ruby", php: "php", swift: "swift", kt: "kotlin", txt: "plaintext",
    toml: "ini", env: "plaintext", lock: "plaintext", gitignore: "plaintext",
  };
  return map[ext.toLowerCase()] ?? "plaintext";
}

export function MonacoEditorPane({
  value, language, onChange, onSave, onCursorChange, onInlineAssist,
  readOnly = false, fontSize = 14, minimap = true, wordWrap = false,
}: MonacoEditorProps) {
  const monaco = useMonaco();
  const editorRef = useRef<MonacoType.editor.IStandaloneCodeEditor | null>(null);

  useEffect(() => {
    if (!monaco) return;
    monaco.editor.defineTheme("github-dark", {
      base: "vs-dark",
      inherit: true,
      rules: [
        { token: "comment", foreground: "8b949e", fontStyle: "italic" },
        { token: "keyword", foreground: "ff7b72" },
        { token: "string", foreground: "a5d6ff" },
        { token: "number", foreground: "79c0ff" },
        { token: "type", foreground: "ffa657" },
        { token: "class", foreground: "ffa657" },
        { token: "function", foreground: "d2a8ff" },
        { token: "variable", foreground: "e6edf3" },
        { token: "operator", foreground: "ff7b72" },
        { token: "delimiter", foreground: "e6edf3" },
        { token: "tag", foreground: "7ee787" },
        { token: "attribute.name", foreground: "79c0ff" },
        { token: "attribute.value", foreground: "a5d6ff" },
      ],
      colors: {
        "editor.background": "#0d1117",
        "editor.foreground": "#e6edf3",
        "editor.lineHighlightBackground": "#161b22",
        "editor.selectionBackground": "#264f7840",
        "editor.inactiveSelectionBackground": "#264f7820",
        "editorLineNumber.foreground": "#484f58",
        "editorLineNumber.activeForeground": "#8b949e",
        "editorCursor.foreground": "#58a6ff",
        "editor.findMatchBackground": "#f2cc6040",
        "editor.findMatchHighlightBackground": "#f2cc6020",
        "editorWidget.background": "#161b22",
        "editorWidget.border": "#30363d",
        "editorSuggestWidget.background": "#161b22",
        "editorSuggestWidget.border": "#30363d",
        "editorSuggestWidget.selectedBackground": "#21262d",
        "editorSuggestWidget.foreground": "#e6edf3",
        "editorSuggestWidget.highlightForeground": "#58a6ff",
        "editorHoverWidget.background": "#161b22",
        "editorHoverWidget.border": "#30363d",
        "editorGutter.background": "#0d1117",
        "editorIndentGuide.background1": "#21262d",
        "editorIndentGuide.activeBackground1": "#30363d",
        "scrollbar.shadow": "#00000040",
        "scrollbarSlider.background": "#484f5840",
        "scrollbarSlider.hoverBackground": "#484f5860",
        "scrollbarSlider.activeBackground": "#484f5880",
        "minimap.background": "#0d1117",
        "minimapSlider.background": "#484f5830",
        "minimapSlider.hoverBackground": "#484f5850",
        "minimapSlider.activeBackground": "#484f5870",
        "statusBar.background": "#e36209",
        "statusBar.foreground": "#ffffff",
        "titleBar.activeBackground": "#161b22",
        "titleBar.activeForeground": "#e6edf3",
      },
    });
    monaco.editor.setTheme("github-dark");
  }, [monaco]);

  const handleMount = (editor: MonacoType.editor.IStandaloneCodeEditor) => {
    editorRef.current = editor;

    editor.onDidChangeCursorPosition((e) => {
      onCursorChange?.({
        line: e.position.lineNumber,
        column: e.position.column,
      });
    });

    editor.addCommand(
      (monaco?.KeyMod.CtrlCmd ?? 0) | (monaco?.KeyCode.KeyS ?? 0),
      () => onSave?.()
    );

    editor.addCommand(
      (monaco?.KeyMod.CtrlCmd ?? 0) | (monaco?.KeyCode.KeyI ?? 0),
      () => {
        const selection = editor.getSelection();
        if (selection && !selection.isEmpty()) {
          const text = editor.getModel()?.getValueInRange(selection) ?? "";
          onInlineAssist?.(text);
        } else {
          onInlineAssist?.("");
        }
      }
    );

    editor.focus();
  };

  return (
    <Editor
      height="100%"
      language={language}
      theme="github-dark"
      value={value}
      onChange={(val) => onChange(val ?? "")}
      onMount={handleMount}
      options={{
        fontSize,
        fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
        fontLigatures: true,
        lineHeight: 1.6,
        minimap: { enabled: minimap, scale: 1, showSlider: "mouseover" },
        wordWrap: wordWrap ? "on" : "off",
        readOnly,
        scrollBeyondLastLine: false,
        automaticLayout: true,
        tabSize: 2,
        insertSpaces: true,
        detectIndentation: true,
        smoothScrolling: true,
        cursorBlinking: "smooth",
        cursorSmoothCaretAnimation: "on",
        renderWhitespace: "selection",
        bracketPairColorization: { enabled: true },
        guides: { bracketPairs: true, indentation: true },
        suggestOnTriggerCharacters: true,
        quickSuggestions: { other: true, comments: false, strings: false },
        parameterHints: { enabled: true },
        hover: { enabled: true },
        formatOnPaste: true,
        formatOnType: false,
        links: true,
        contextmenu: true,
        multiCursorModifier: "alt",
        occurrencesHighlight: "singleFile",
        selectionHighlight: true,
        padding: { top: 12, bottom: 12 },
        scrollbar: {
          verticalScrollbarSize: 8,
          horizontalScrollbarSize: 8,
          useShadows: false,
        },
        lineNumbers: "on",
        glyphMargin: true,
        folding: true,
        foldingHighlight: true,
        showFoldingControls: "mouseover",
        renderLineHighlight: "line",
        renderLineHighlightOnlyWhenFocus: false,
      }}
      loading={
        <div className="flex items-center justify-center h-full bg-[#0d1117]">
          <div className="flex items-center gap-2 text-[#8b949e] text-sm">
            <div className="h-4 w-4 border-2 border-[#58a6ff]/30 border-t-[#58a6ff] rounded-full animate-spin" />
            Loading editor…
          </div>
        </div>
      }
    />
  );
}
