import { GitBranch, Circle, Wifi, WifiOff, ChevronRight, AlertTriangle } from "lucide-react";

interface StatusBarProps {
  language?: string;
  line?: number;
  column?: number;
  branch?: string;
  isDirty?: boolean;
  isConnected?: boolean;
  fileName?: string;
  fileSize?: number;
  errors?: number;
  warnings?: number;
  onLanguageClick?: () => void;
  onBranchClick?: () => void;
}

const LANGUAGE_LABELS: Record<string, string> = {
  typescript: "TypeScript", javascript: "JavaScript", python: "Python",
  json: "JSON", html: "HTML", css: "CSS", scss: "SCSS", markdown: "Markdown",
  shell: "Shell", yaml: "YAML", xml: "XML", sql: "SQL", rust: "Rust",
  go: "Go", java: "Java", cpp: "C++", c: "C", csharp: "C#", ruby: "Ruby",
  php: "PHP", swift: "Swift", kotlin: "Kotlin", plaintext: "Plain Text",
};

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function StatusBar({
  language = "plaintext", line = 1, column = 1, branch = "main",
  isDirty = false, isConnected = true, fileName, fileSize,
  errors = 0, warnings = 0, onLanguageClick, onBranchClick,
}: StatusBarProps) {
  const langLabel = LANGUAGE_LABELS[language] ?? language;

  return (
    <div className="h-7 flex items-center justify-between px-3 bg-[#e36209] text-white text-[11px] shrink-0 select-none z-10">
      <div className="flex items-center gap-3">
        <button
          onClick={onBranchClick}
          className="flex items-center gap-1 hover:bg-white/10 px-1.5 py-0.5 rounded transition-colors">
          <GitBranch className="h-3 w-3" />
          <span>{branch}</span>
        </button>

        {isDirty && (
          <div className="flex items-center gap-1 opacity-80">
            <Circle className="h-2 w-2 fill-white" />
            <span>Unsaved</span>
          </div>
        )}

        {(errors > 0 || warnings > 0) && (
          <div className="flex items-center gap-2">
            {errors > 0 && (
              <span className="flex items-center gap-0.5">
                <AlertTriangle className="h-3 w-3 text-red-200" />
                <span>{errors}</span>
              </span>
            )}
            {warnings > 0 && (
              <span className="flex items-center gap-0.5">
                <AlertTriangle className="h-3 w-3 text-yellow-200" />
                <span>{warnings}</span>
              </span>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center gap-3">
        {fileName && (
          <span className="hidden md:block opacity-70 truncate max-w-[200px]">{fileName}</span>
        )}

        <span className="flex items-center gap-0.5 opacity-80">
          <span>Ln {line}</span>
          <ChevronRight className="h-2.5 w-2.5" />
          <span>Col {column}</span>
        </span>

        {fileSize !== undefined && (
          <span className="hidden lg:block opacity-70">{formatBytes(fileSize)}</span>
        )}

        <span className="hidden lg:block opacity-70">UTF-8</span>
        <span className="hidden lg:block opacity-70">LF</span>

        <button
          onClick={onLanguageClick}
          className="hover:bg-white/10 px-1.5 py-0.5 rounded transition-colors font-medium">
          {langLabel}
        </button>

        <div className="flex items-center gap-1 opacity-80" title={isConnected ? "Server connected" : "Disconnected"}>
          {isConnected
            ? <Wifi className="h-3 w-3" />
            : <WifiOff className="h-3 w-3 text-red-200" />
          }
        </div>
      </div>
    </div>
  );
}
