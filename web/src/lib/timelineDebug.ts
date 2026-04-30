/**
 * Timeline Debug Instrumentation
 *
 * Gated behind ?debugTimeline=1 query param.
 * Provides:
 *  - Fixed on-screen HUD with current progress + active module
 *  - Console logs on module/card state transitions (not every frame)
 *  - All thresholds visible at a glance
 *
 * TEMPORARY — remove after timing issues are resolved.
 */

import { MODULE_TIMELINE, type ModuleName, sceneChildRanges, sceneOpacity } from './moduleTimeline';

// ── Debug gate ──────────────────────────────────────────────────────────
let _debugEnabled: boolean | null = null;

export function isTimelineDebugEnabled(): boolean {
  if (_debugEnabled !== null) return _debugEnabled;
  if (typeof window === 'undefined') return false;
  _debugEnabled = new URLSearchParams(window.location.search).has('debugTimeline');
  return _debugEnabled;
}

// ── State tracking for change-based logging ─────────────────────────────
const MODULES: ModuleName[] = ['hero', 'forest', 'camp', 'trailFork', 'alpine', 'summit'];

type ModulePhase = 'before' | 'entering' | 'own' | 'exiting' | 'after';

interface DebugState {
  activeModule: ModuleName | 'none';
  phases: Record<ModuleName, ModulePhase>;
  forestCards: boolean[];
  alpineCards: boolean[];
  lastLogProgress: number;
}

const state: DebugState = {
  activeModule: 'none',
  phases: { hero: 'before', forest: 'before', camp: 'before', trailFork: 'before', alpine: 'before', summit: 'before' },
  forestCards: [false, false, false, false],
  alpineCards: [false, false, false, false],
  lastLogProgress: -1,
};

function getPhase(mod: ModuleName, p: number): ModulePhase {
  const w = MODULE_TIMELINE[mod];
  if (p < w.ownStart) return 'before';
  if (p < w.enterEnd) return 'entering';
  if (p < w.exitStart) return 'own';
  if (p < w.ownEnd) return 'exiting';
  return 'after';
}

function getActiveModule(p: number): ModuleName | 'none' {
  for (const mod of MODULES) {
    const w = MODULE_TIMELINE[mod];
    if (p >= w.ownStart && p < w.ownEnd) return mod;
  }
  return p >= 1.0 ? 'summit' : 'none';
}

function isCardVisible(range: readonly [number, number, number, number], p: number): boolean {
  return p >= range[0] && p <= range[3];
}

// Pre-compute child ranges
const forestRanges = sceneChildRanges('forest', 4);
const alpineRanges = sceneChildRanges('alpine', 4);

// ── Main tick function — call from requestAnimationFrame or useFrame ────
export function tickTimelineDebug(progress: number): void {
  if (!isTimelineDebugEnabled()) return;

  const p = progress;
  const newActive = getActiveModule(p);

  // Check module phase changes
  for (const mod of MODULES) {
    const newPhase = getPhase(mod, p);
    if (newPhase !== state.phases[mod]) {
      console.warn(
        `%c[timeline] ${mod}: ${state.phases[mod]} → ${newPhase} @ progress=${p.toFixed(4)}`,
        `color: ${phaseColor(newPhase)}; font-weight: bold;`,
      );
      state.phases[mod] = newPhase;
    }
  }

  // Check active module change
  if (newActive !== state.activeModule) {
    console.warn(
      `%c[timeline] ACTIVE MODULE: ${state.activeModule} → ${newActive} @ ${p.toFixed(4)}`,
      'color: #f59e0b; font-weight: bold; font-size: 13px;',
    );
    state.activeModule = newActive;
  }

  // Check forest card visibility
  for (let i = 0; i < 4; i++) {
    const vis = isCardVisible(forestRanges[i], p);
    if (vis !== state.forestCards[i]) {
      console.warn(
        `%c[timeline] forest card ${i}: ${vis ? 'VISIBLE' : 'HIDDEN'} @ ${p.toFixed(4)}  range=[${forestRanges[i].map((v) => v.toFixed(3)).join(', ')}]`,
        `color: ${vis ? '#22c55e' : '#ef4444'};`,
      );
      state.forestCards[i] = vis;
    }
  }

  // Check alpine card visibility
  for (let i = 0; i < 4; i++) {
    const vis = isCardVisible(alpineRanges[i], p);
    if (vis !== state.alpineCards[i]) {
      console.warn(
        `%c[timeline] alpine card ${i}: ${vis ? 'VISIBLE' : 'HIDDEN'} @ ${p.toFixed(4)}  range=[${alpineRanges[i].map((v) => v.toFixed(3)).join(', ')}]`,
        `color: ${vis ? '#22c55e' : '#ef4444'};`,
      );
      state.alpineCards[i] = vis;
    }
  }

  // Update HUD
  updateHUD(p);
}

function phaseColor(phase: ModulePhase): string {
  switch (phase) {
    case 'before':
      return '#6b7280';
    case 'entering':
      return '#3b82f6';
    case 'own':
      return '#22c55e';
    case 'exiting':
      return '#f59e0b';
    case 'after':
      return '#6b7280';
  }
}

// ── On-screen HUD ───────────────────────────────────────────────────────
let hudEl: HTMLDivElement | null = null;

function ensureHUD(): HTMLDivElement {
  if (hudEl) return hudEl;
  hudEl = document.createElement('div');
  hudEl.id = 'timeline-debug-hud';
  Object.assign(hudEl.style, {
    position: 'fixed',
    top: '8px',
    left: '8px',
    zIndex: '99999',
    background: 'rgba(0,0,0,0.88)',
    color: '#e5e7eb',
    fontFamily: 'ui-monospace, monospace',
    fontSize: '11px',
    lineHeight: '1.5',
    padding: '10px 14px',
    borderRadius: '8px',
    pointerEvents: 'none',
    maxWidth: '340px',
    backdropFilter: 'blur(8px)',
    border: '1px solid rgba(255,255,255,0.1)',
  });
  document.body.appendChild(hudEl);
  return hudEl;
}

function updateHUD(p: number): void {
  const el = ensureHUD();

  const bar = (mod: ModuleName): string => {
    const w = MODULE_TIMELINE[mod];
    const phase = state.phases[mod];
    const sOp = sceneOpacity(mod, p);
    const dot = phase === 'own' ? '🟢' : phase === 'entering' ? '🔵' : phase === 'exiting' ? '🟡' : '⚫';
    return `${dot} ${mod.padEnd(7)} ${w.ownStart.toFixed(2)}–${w.ownEnd.toFixed(2)}  [${phase}] op:${sOp.toFixed(2)}`;
  };

  const cardLine = (
    label: string,
    ranges: ReadonlyArray<readonly [number, number, number, number]>,
    visArr: boolean[],
  ): string => {
    return ranges
      .map((r, i) => {
        const vis = visArr[i];
        return `  ${vis ? '✅' : '❌'} ${label}[${i}] ${r[0].toFixed(3)}–${r[3].toFixed(3)}`;
      })
      .join('\n');
  };

  const summitW = MODULE_TIMELINE.summit;
  const summitRevealStart = summitW.enterStart + (summitW.ownEnd - summitW.ownStart) * 0.45;
  const summitRevealEnd = summitRevealStart + (summitW.ownEnd - summitW.ownStart) * 0.2;

  el.innerHTML =
    `<pre style="margin:0;white-space:pre;">` +
    `<b style="color:#f59e0b;">TIMELINE DEBUG</b>  progress: <b>${p.toFixed(4)}</b>\n` +
    `active: <b style="color:#22c55e;">${state.activeModule}</b>\n` +
    `─────────────────────────────\n` +
    MODULES.map(bar).join('\n') +
    '\n' +
    `─────────────────────────────\n` +
    `<b>Forest cards:</b>\n` +
    cardLine('forest', forestRanges, state.forestCards) +
    '\n' +
    `<b>Alpine cards:</b>\n` +
    cardLine('alpine', alpineRanges, state.alpineCards) +
    '\n' +
    `<b>Camp:</b>  own ${MODULE_TIMELINE.camp.ownStart.toFixed(2)}–${MODULE_TIMELINE.camp.ownEnd.toFixed(2)}\n` +
    `<b>Summit:</b> reveal ${summitRevealStart.toFixed(3)}–${summitRevealEnd.toFixed(3)}\n` +
    `</pre>`;
}

// ── Dump full timeline to console (call once) ───────────────────────────
export function dumpTimeline(): void {
  if (!isTimelineDebugEnabled()) return;
  console.warn('%c[timeline] MODULE_TIMELINE contract', 'color: #a78bfa; font-weight: bold; font-size: 14px;');
  for (const mod of MODULES) {
    const w = MODULE_TIMELINE[mod];
    console.warn(
      `%c${mod}%c  own: ${w.ownStart.toFixed(2)}–${w.ownEnd.toFixed(2)}  enter: ${w.enterStart.toFixed(2)}–${w.enterEnd.toFixed(2)}  exit: ${w.exitStart.toFixed(2)}–${w.exitEnd.toFixed(2)}`,
      'color: #22d3ee; font-weight: bold;',
      'color: inherit;',
    );
  }
  console.warn(
    '%cForest child ranges:',
    'font-weight: bold;',
    forestRanges.map((r, i) => `[${i}] ${r.map((v) => v.toFixed(3)).join(', ')}`),
  );
  console.warn(
    '%cAlpine child ranges:',
    'font-weight: bold;',
    alpineRanges.map((r, i) => `[${i}] ${r.map((v) => v.toFixed(3)).join(', ')}`),
  );
  // group end
}

// ── Cleanup (call on unmount) ───────────────────────────────────────────
export function destroyTimelineDebug(): void {
  if (hudEl) {
    hudEl.remove();
    hudEl = null;
  }
}
