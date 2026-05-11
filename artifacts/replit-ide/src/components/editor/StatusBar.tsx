import { useState, useEffect } from "react";
import { GitBranch, Circle, Wifi, WifiOff, ChevronRight, AlertTriangle, Cpu, MemoryStick, Volume2, VolumeX } from "lucide-react";
import { sound } from "@/lib/soundSystem";

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

function ResourceMini({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="hidden xl:flex items-center gap-1 opacity-90 hover:opacity-100 transition-opacity" title={`${label}: ${value}%`}>
      <span className="text-[9px] opacity-70">{label}</span>
      <div className="w-14 h-1.5 rounded-full bg-white/20 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-1000"
          style={{ width: `${value}%`, backgroundColor: color }}
        />
      </div>
      <span className="text-[9px] font-mono w-6 text-right">{value}%</span>
    </div>
  );
}

export function StatusBar({
  language = "plaintext", line = 1, column = 1, branch = "main",
  isDirty = false, isConnected = true, fileName, fileSize,
  errors = 0, warnings = 0, onLanguageClick, onBranchClick,
}: StatusBarProps) {
  const langLabel = LANGUAGE_LABELS[language] ?? language;
  const [cpu, setCpu] = useState(18);
  const [mem, setMem] = useState(42);
  const [soundOn, setSoundOn] = useState(sound.isEnabled());

  useEffect(() => {
    const interval = setInterval(() => {
      setCpu(prev => Math.min(95, Math.max(5, prev + (Math.random() - 0.45) * 12)));
      setMem(prev => Math.min(90, Math.max(20, prev + (Math.random() - 0.5) * 4)));
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  const cpuColor = cpu > 80 ? "#f85149" : cpu > 60 ? "#d29922" : "#3fb950";
  const memColor = mem > 80 ? "#f85149" : mem > 60 ? "#d29922" : "#58a6ff";

  const toggleSound = () => {
    const next = sound.toggle();
    setSoundOn(next);
    if (next) sound.play("click");
  };

  return (
    <div className="h-7 flex items-center justify-between px-3 bg-[#e36209] text-white text-[11px] shrink-0 select-none z-10 gap-2">
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

      <div className="flex items-center gap-3 flex-1 justify-center">
        <ResourceMini label="CPU" value={Math.round(cpu)} color={cpuColor} />
        <ResourceMini label="RAM" value={Math.round(mem)} color={memColor} />
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

        <button
          onClick={toggleSound}
          title={soundOn ? "Mute UI sounds" : "Enable UI sounds"}
          className="hover:bg-white/10 p-0.5 rounded transition-colors opacity-80 hover:opacity-100">
          {soundOn ? <Volume2 className="h-3 w-3" /> : <VolumeX className="h-3 w-3" />}
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
