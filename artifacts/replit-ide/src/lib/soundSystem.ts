type SoundEvent =
  | "save" | "deploy" | "error" | "success" | "notify"
  | "open" | "close" | "click" | "ai-start" | "ai-done"
  | "git-commit" | "terminal-open" | "tab-switch";

let audioCtx: AudioContext | null = null;
let enabled = localStorage.getItem("ide-sounds") !== "false";

function getCtx(): AudioContext {
  if (!audioCtx) audioCtx = new AudioContext();
  return audioCtx;
}

function playTone(frequency: number, duration: number, type: OscillatorType = "sine", volume = 0.12, delay = 0) {
  if (!enabled) return;
  try {
    const ctx = getCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = type;
    osc.frequency.setValueAtTime(frequency, ctx.currentTime + delay);
    gain.gain.setValueAtTime(0, ctx.currentTime + delay);
    gain.gain.linearRampToValueAtTime(volume, ctx.currentTime + delay + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + duration);
    osc.start(ctx.currentTime + delay);
    osc.stop(ctx.currentTime + delay + duration + 0.05);
  } catch { /* silently ignore in unsupported envs */ }
}

function playChord(notes: [number, number][], type: OscillatorType = "sine", volume = 0.1) {
  notes.forEach(([freq, delay]) => playTone(freq, 0.15, type, volume, delay));
}

const SOUNDS: Record<SoundEvent, () => void> = {
  "save": () => {
    playTone(880, 0.08, "sine", 0.08);
    playTone(1320, 0.08, "sine", 0.06, 0.08);
  },
  "deploy": () => {
    playChord([[523, 0], [659, 0.08], [784, 0.16], [1047, 0.24]], "sine", 0.1);
  },
  "error": () => {
    playTone(220, 0.12, "square", 0.08);
    playTone(180, 0.12, "square", 0.06, 0.14);
  },
  "success": () => {
    playChord([[523, 0], [659, 0.06], [784, 0.12]], "sine", 0.09);
  },
  "notify": () => {
    playTone(880, 0.06, "sine", 0.07);
    playTone(1100, 0.06, "sine", 0.07, 0.09);
  },
  "open": () => {
    playTone(440, 0.06, "sine", 0.06);
  },
  "close": () => {
    playTone(330, 0.06, "sine", 0.06);
  },
  "click": () => {
    playTone(600, 0.03, "sine", 0.04);
  },
  "ai-start": () => {
    playTone(660, 0.04, "sine", 0.05);
    playTone(880, 0.04, "sine", 0.04, 0.06);
    playTone(1100, 0.04, "sine", 0.03, 0.12);
  },
  "ai-done": () => {
    playChord([[440, 0], [554, 0.05], [659, 0.10], [880, 0.15]], "sine", 0.08);
  },
  "git-commit": () => {
    playTone(392, 0.08, "triangle", 0.08);
    playTone(523, 0.08, "triangle", 0.06, 0.10);
    playTone(659, 0.10, "triangle", 0.06, 0.20);
  },
  "terminal-open": () => {
    playTone(220, 0.04, "sawtooth", 0.03);
    playTone(440, 0.06, "sine", 0.05, 0.05);
  },
  "tab-switch": () => {
    playTone(500, 0.04, "sine", 0.04);
  },
};

export const sound = {
  play: (event: SoundEvent) => {
    try { SOUNDS[event]?.(); } catch { /**/ }
  },
  setEnabled: (val: boolean) => {
    enabled = val;
    localStorage.setItem("ide-sounds", val ? "true" : "false");
  },
  isEnabled: () => enabled,
  toggle: () => {
    enabled = !enabled;
    localStorage.setItem("ide-sounds", enabled ? "true" : "false");
    return enabled;
  },
};
