import { useState, useRef, useCallback, useEffect } from "react";
import { Mic, MicOff, Volume2 } from "lucide-react";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SpeechRecognitionInstance = any;

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    SpeechRecognition: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    webkitSpeechRecognition: any;
  }
}

export type VoiceCommandAction =
  | "save"    | "run"      | "stop"      | "new-file"
  | "toggle-terminal" | "toggle-ai" | "toggle-search" | "deploy"
  | "split-editor" | "close-tab" | "zoom-in" | "zoom-out";

interface VoiceCommandProps {
  onCommand: (action: VoiceCommandAction, raw: string) => void;
}

const COMMANDS: { patterns: string[]; action: VoiceCommandAction; label: string }[] = [
  { patterns: ["save", "save file", "save the file"],             action: "save",             label: "Save file" },
  { patterns: ["run", "run code", "start", "play"],               action: "run",              label: "Run project" },
  { patterns: ["stop", "stop running", "halt"],                   action: "stop",             label: "Stop running" },
  { patterns: ["new file", "create file", "add file"],            action: "new-file",         label: "New file" },
  { patterns: ["terminal", "toggle terminal", "show terminal"],   action: "toggle-terminal",  label: "Toggle terminal" },
  { patterns: ["ai", "open ai", "show ai", "assistant"],          action: "toggle-ai",        label: "Toggle AI panel" },
  { patterns: ["search", "find", "open search"],                  action: "toggle-search",    label: "Toggle search" },
  { patterns: ["deploy", "publish"],                              action: "deploy",            label: "Deploy" },
  { patterns: ["split", "split editor", "split view"],            action: "split-editor",     label: "Split editor" },
  { patterns: ["close tab", "close file"],                        action: "close-tab",        label: "Close tab" },
];

function matchCommand(transcript: string): { action: VoiceCommandAction; label: string } | null {
  const lower = transcript.toLowerCase().trim();
  for (const cmd of COMMANDS) {
    if (cmd.patterns.some(p => lower.includes(p))) {
      return { action: cmd.action, label: cmd.label };
    }
  }
  return null;
}

export function VoiceCommand({ onCommand }: VoiceCommandProps) {
  const [listening, setListening]   = useState(false);
  const [supported, setSupported]   = useState(false);
  const [lastText, setLastText]      = useState("");
  const [lastAction, setLastAction]  = useState("");
  const [showHelp, setShowHelp]      = useState(false);
  const recogRef = useRef<SpeechRecognitionInstance | null>(null);

  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    setSupported(!!SR);
  }, []);

  const start = useCallback(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;

    const recog = new SR();
    recog.lang = "en-US";
    recog.interimResults = false;
    recog.maxAlternatives = 3;
    recogRef.current = recog;

    recog.onstart  = () => setListening(true);
    recog.onend    = () => setListening(false);
    recog.onerror  = () => setListening(false);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recog.onresult = (e: any) => {
      for (let i = 0; i < e.results[0].length; i++) {
        const t = e.results[0][i].transcript;
        setLastText(t);
        const match = matchCommand(t);
        if (match) {
          setLastAction(match.label);
          onCommand(match.action, t);
          setTimeout(() => setLastAction(""), 3000);
          return;
        }
      }
      setLastAction("❓ Command not recognized");
      setTimeout(() => setLastAction(""), 2000);
    };

    recog.start();
  }, [onCommand]);

  const stop = useCallback(() => {
    recogRef.current?.stop();
    setListening(false);
  }, []);

  const toggle = () => listening ? stop() : start();

  if (!supported) return null;

  return (
    <div className="relative">
      <button
        onClick={toggle}
        onContextMenu={e => { e.preventDefault(); setShowHelp(p => !p); }}
        title={`Voice commands (right-click for help) ${listening ? "— Listening…" : ""}`}
        className={`h-8 w-8 flex items-center justify-center rounded transition-all border ${
          listening
            ? "bg-[#f85149]/20 border-[#f85149]/30 text-[#f85149] shadow-[0_0_8px_rgba(248,81,73,0.4)]"
            : "border-[#30363d] text-[#8b949e] hover:text-[#e6edf3] hover:bg-[#21262d]"
        }`}>
        {listening
          ? <Volume2 className="h-4 w-4 animate-pulse" />
          : <Mic className="h-4 w-4" />}
      </button>

      {/* Toast feedback */}
      {(lastAction || lastText) && (
        <div className="absolute bottom-10 right-0 bg-[#161b22] border border-[#30363d] rounded-lg px-3 py-2 shadow-xl text-[11px] whitespace-nowrap z-50 min-w-[180px]">
          {lastText && <p className="text-[#8b949e] mb-0.5">"{lastText}"</p>}
          {lastAction && <p className="text-[#3fb950] font-medium">→ {lastAction}</p>}
        </div>
      )}

      {/* Listening ring */}
      {listening && (
        <span className="absolute -top-0.5 -right-0.5 flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#f85149] opacity-50" />
          <span className="relative inline-flex rounded-full h-3 w-3 bg-[#f85149]" />
        </span>
      )}

      {/* Help popup */}
      {showHelp && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setShowHelp(false)} />
          <div className="absolute bottom-10 right-0 z-50 w-64 bg-[#161b22] border border-[#30363d] rounded-xl shadow-2xl p-3">
            <div className="flex items-center gap-1.5 mb-2">
              <Mic className="h-3.5 w-3.5 text-[#58a6ff]" />
              <span className="text-xs font-semibold">Voice Commands</span>
            </div>
            <div className="space-y-0.5">
              {COMMANDS.map(c => (
                <div key={c.action} className="flex items-center gap-2 text-[10px] py-0.5">
                  <span className="text-[#484f58] w-16 shrink-0">{c.label}</span>
                  <span className="text-[#8b949e]">"{c.patterns[0]}"</span>
                </div>
              ))}
            </div>
            <p className="text-[9px] text-[#484f58] mt-2 pt-2 border-t border-[#21262d]">Click mic to start · Right-click for this menu</p>
          </div>
        </>
      )}
    </div>
  );
}
