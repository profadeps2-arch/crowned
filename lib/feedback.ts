"use client";

/**
 * Sound and haptics for the key moments in the app. The sounds are made on
 * the spot with the Web Audio API (no audio files), kept very quiet and
 * short. Everything is off when the person turns it off, and it is
 * remembered on the device.
 *
 * Haptics use the Vibration API. Android browsers support it. iPhone Safari
 * does not, so on iPhone only the sound plays.
 */

const KEY = "crowned.feedback";
let enabled: boolean | null = null;
let ctx: AudioContext | null = null;

export function feedbackOn(): boolean {
  if (enabled === null) {
    try {
      enabled = localStorage.getItem(KEY) !== "off";
    } catch {
      enabled = true;
    }
  }
  return enabled;
}

export function setFeedback(on: boolean) {
  enabled = on;
  try {
    localStorage.setItem(KEY, on ? "on" : "off");
  } catch {}
  if (on) pop();
}

function audio(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AC) return null;
  if (!ctx) ctx = new AC();
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

function buzz(pattern: number | number[]) {
  try {
    navigator.vibrate?.(pattern);
  } catch {}
}

function tone(c: AudioContext, freq: number, at: number, dur: number, peak: number, type: OscillatorType = "sine", glideTo?: number) {
  const t = c.currentTime + at;
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  if (glideTo) osc.frequency.exponentialRampToValueAtTime(glideTo, t + dur);
  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.exponentialRampToValueAtTime(peak, t + 0.008);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  osc.connect(gain).connect(c.destination);
  osc.start(t);
  osc.stop(t + dur + 0.02);
}

/** A light tap on any button or tab. */
export function tap() {
  if (!feedbackOn()) return;
  buzz(6);
  const c = audio();
  if (!c) return;
  tone(c, 1150, 0, 0.045, 0.035, "sine", 780);
}

/** Something was saved or switched on. */
export function pop() {
  if (!feedbackOn()) return;
  buzz(12);
  const c = audio();
  if (!c) return;
  tone(c, 520, 0, 0.09, 0.05, "sine", 760);
  tone(c, 880, 0.07, 0.12, 0.045, "sine");
}

/** A look was worn. A small rising chord. */
export function success() {
  if (!feedbackOn()) return;
  buzz([10, 50, 14]);
  const c = audio();
  if (!c) return;
  [523.25, 659.25, 783.99].forEach((f, i) => tone(c, f, i * 0.085, 0.38, 0.045, "triangle"));
  tone(c, 1046.5, 0.26, 0.5, 0.025, "sine");
}

/** Swapping to another outfit. A short soft sweep. */
export function swish() {
  if (!feedbackOn()) return;
  buzz(8);
  const c = audio();
  if (!c) return;
  const t = c.currentTime;
  const len = Math.floor(c.sampleRate * 0.18);
  const buf = c.createBuffer(1, len, c.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
  const src = c.createBufferSource();
  src.buffer = buf;
  const filter = c.createBiquadFilter();
  filter.type = "bandpass";
  filter.Q.value = 1.1;
  filter.frequency.setValueAtTime(500, t);
  filter.frequency.exponentialRampToValueAtTime(2600, t + 0.16);
  const gain = c.createGain();
  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.exponentialRampToValueAtTime(0.05, t + 0.05);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.17);
  src.connect(filter).connect(gain).connect(c.destination);
  src.start(t);
}
