// Synthesised wooden "tok" for each seed drop, so no audio assets are needed.

const STORAGE_KEY = "oware.sound";

let context = null;
let enabled = true;
try {
  enabled = localStorage.getItem(STORAGE_KEY) !== "off";
} catch {
  // Storage unavailable (private mode); keep the default.
}

export const isSoundOn = () => enabled;

export const setSoundOn = (on) => {
  enabled = on;
  try {
    localStorage.setItem(STORAGE_KEY, on ? "on" : "off");
  } catch {
    // Ignore; the setting just won't persist.
  }
};

// Must first run inside a user gesture for browsers to allow audio.
export const unlockAudio = () => {
  if (!context && typeof AudioContext !== "undefined") context = new AudioContext();
  if (context?.state === "suspended") context.resume();
};

export const playTok = (intensity = 1) => {
  if (!enabled || !context || context.state !== "running") return;
  const t = context.currentTime;
  const osc = context.createOscillator();
  const gain = context.createGain();
  osc.type = "triangle";
  osc.frequency.setValueAtTime(520 + Math.random() * 160, t);
  osc.frequency.exponentialRampToValueAtTime(180, t + 0.07);
  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.exponentialRampToValueAtTime(0.16 * intensity, t + 0.005);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.1);
  osc.connect(gain).connect(context.destination);
  osc.start(t);
  osc.stop(t + 0.12);
};
