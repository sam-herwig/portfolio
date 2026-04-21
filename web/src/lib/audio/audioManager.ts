/**
 * Section-tied ambient audio manager (Web Audio API).
 *
 * Five sections share four files (Summit reuses Alpine at lower gain).
 * Each track loops once enabled; per-section gain crossfades are driven by
 * scroll progress via setMix().
 *
 * Web Audio (vs. raw audio.volume) gives reliable concurrent playback across
 * Safari/Chrome, smooth linear gain ramps, and a single AudioContext.resume()
 * gate instead of N separate .play() autoplay-policy gambles.
 *
 * Lifecycle:
 *   - First setEnabled(true) lazily builds the AudioContext + graph (must be
 *     in a user gesture; the toggle button satisfies that).
 *   - Tab hidden → pause; visible → resume.
 *   - State persists via localStorage; default OFF.
 */

export type SectionId = 'hero' | 'forest' | 'camp' | 'alpine' | 'summit';

const TRACKS: Record<SectionId, string> = {
  hero: '/audio/hero-breeze.mp3',
  forest: '/audio/forest-canopy.mp3',
  camp: '/audio/camp-fire.mp3',
  alpine: '/audio/alpine-wind.mp3',
  summit: '/audio/alpine-wind.mp3',
};

// Per-section ceiling — Summit is the rarefied air mix
const SECTION_MAX_VOL: Record<SectionId, number> = {
  hero: 0.55,
  forest: 0.7,
  camp: 0.7,
  alpine: 0.6,
  summit: 0.25,
};

const RAMP_SECONDS = 0.18;
const STORAGE_KEY = 'sh-audio-enabled';

interface Track {
  audio: HTMLAudioElement;
  gain: GainNode;
}

type AudioCtor = typeof AudioContext;

class AudioManager {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private tracks = new Map<SectionId, Track>();
  private mix: Record<SectionId, number> = { hero: 0, forest: 0, camp: 0, alpine: 0, summit: 0 };
  private enabled = false;
  private listeners = new Set<() => void>();

  constructor() {
    this.enabled = window.localStorage.getItem(STORAGE_KEY) === 'true';
    document.addEventListener('visibilitychange', this.handleVisibility);
  }

  private handleVisibility = () => {
    if (!this.enabled || !this.ctx) return;
    if (document.hidden) {
      this.tracks.forEach(({ audio }) => audio.pause());
    } else {
      this.tracks.forEach(({ audio }) => {
        audio.play().catch((err) => console.warn('[audio] resume failed', err));
      });
    }
  };

  private initGraph() {
    if (this.ctx) return;
    const Ctor = (window.AudioContext ??
      (window as unknown as { webkitAudioContext?: AudioCtor }).webkitAudioContext) as AudioCtor | undefined;
    if (!Ctor) {
      console.warn('[audio] Web Audio API not supported');
      return;
    }
    this.ctx = new Ctor();
    this.master = this.ctx.createGain();
    this.master.gain.value = 1;
    this.master.connect(this.ctx.destination);

    (Object.keys(TRACKS) as SectionId[]).forEach((id) => {
      const audio = new Audio(TRACKS[id]);
      audio.loop = true;
      audio.crossOrigin = 'anonymous';
      audio.preload = 'auto';
      audio.load();

      const source = this.ctx!.createMediaElementSource(audio);
      const gain = this.ctx!.createGain();
      gain.gain.value = 0;
      source.connect(gain).connect(this.master!);

      this.tracks.set(id, { audio, gain });
    });
  }

  setEnabled(on: boolean) {
    this.enabled = on;
    window.localStorage.setItem(STORAGE_KEY, String(on));

    if (on) {
      this.initGraph();
      if (this.ctx?.state === 'suspended') {
        this.ctx.resume().catch((err) => console.warn('[audio] resume failed', err));
      }
      this.tracks.forEach(({ audio }) => {
        audio.play().catch((err) => console.warn('[audio] play failed', err));
      });
      this.applyMix();
    } else {
      this.tracks.forEach(({ audio }) => audio.pause());
    }

    this.notify();
  }

  setMix(next: Partial<Record<SectionId, number>>) {
    (Object.keys(next) as SectionId[]).forEach((id) => {
      this.mix[id] = next[id] ?? 0;
    });
    this.applyMix();
  }

  private applyMix() {
    if (!this.ctx || !this.enabled) return;
    const now = this.ctx.currentTime;
    this.tracks.forEach(({ gain }, id) => {
      const target = Math.max(0, Math.min(1, this.mix[id] * SECTION_MAX_VOL[id]));
      gain.gain.cancelScheduledValues(now);
      gain.gain.setValueAtTime(gain.gain.value, now);
      gain.gain.linearRampToValueAtTime(target, now + RAMP_SECONDS);
    });
  }

  isEnabled() {
    return this.enabled;
  }

  /**
   * Briefly boost a section's gain above its baseline for `duration` seconds.
   * No-op when audio is disabled or context isn't built. Used for egg stingers
   * — gives audio feedback off the already-loaded ambient loops.
   */
  boostSection(id: SectionId, duration = 0.9) {
    if (!this.ctx || !this.enabled) return;
    const track = this.tracks.get(id);
    if (!track) return;
    const now = this.ctx.currentTime;
    const base = Math.max(0, Math.min(1, this.mix[id] * SECTION_MAX_VOL[id]));
    const peak = Math.min(1, base + 0.35);
    track.gain.gain.cancelScheduledValues(now);
    track.gain.gain.setValueAtTime(track.gain.gain.value, now);
    track.gain.gain.linearRampToValueAtTime(peak, now + 0.05);
    track.gain.gain.linearRampToValueAtTime(base, now + duration);
  }

  subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    this.listeners.forEach((l) => l());
  }
}

let instance: AudioManager | null = null;

export function getAudioManager(): AudioManager | null {
  if (typeof window === 'undefined') return null;
  if (!instance) instance = new AudioManager();
  return instance;
}
