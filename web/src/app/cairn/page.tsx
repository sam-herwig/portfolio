'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import { useFoundEggs } from '@/lib/eggs/useFoundEggs';

const REGISTER_KEY = 'cairn:register:v1';
const MAX_ENTRIES = 40;

interface Mark {
  initials: string;
  at: number;
}

const listeners = new Set<() => void>();
let cachedSnapshot = '[]';

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

function getSnapshot(): string {
  if (typeof window === 'undefined') return '[]';
  const v = window.localStorage.getItem(REGISTER_KEY) ?? '[]';
  // useSyncExternalStore requires a stable reference for unchanged values.
  if (cachedSnapshot !== v) cachedSnapshot = v;
  return cachedSnapshot;
}

function getServerSnapshot(): string {
  return '[]';
}

function addMark(mark: Mark) {
  if (typeof window === 'undefined') return;
  try {
    const parsed = JSON.parse(window.localStorage.getItem(REGISTER_KEY) ?? '[]');
    const arr: Mark[] = Array.isArray(parsed) ? parsed : [];
    const next = [mark, ...arr].slice(0, MAX_ENTRIES);
    window.localStorage.setItem(REGISTER_KEY, JSON.stringify(next));
    cachedSnapshot = '[]'; // force snapshot re-read on next getSnapshot call
    listeners.forEach((l) => l());
  } catch {
    /* ignore */
  }
}

export default function CairnPage() {
  const raw = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const register: Mark[] = useMemo(() => {
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }, [raw]);

  const [input, setInput] = useState('');
  const [justAdded, setJustAdded] = useState(false);
  const foundIds = useFoundEggs((s) => s.foundIds);
  const allSurfaceFound = (
    ['trailhead', 'owl', 'ember', 'pennant', 'station-stamp', 'margin-note', 'cairn'] as const
  ).every((id) => foundIds.includes(id));

  useEffect(() => {
    useFoundEggs.getState().markFound('cairn');
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const initials = input
      .trim()
      .replace(/[^a-z]/gi, '')
      .slice(0, 3)
      .toUpperCase();
    if (!initials) return;
    addMark({ initials, at: Date.now() });
    setInput('');
    setJustAdded(true);
    window.setTimeout(() => setJustAdded(false), 1600);
  };

  return (
    <main className="relative min-h-screen w-full bg-background px-6 py-20 md:px-16 md:py-28">
      {/* Paper texture */}
      <div className="pointer-events-none fixed inset-0 z-0 opacity-[0.08]" aria-hidden="true">
        <Image src="/notebook/topo-bg.svg" alt="" fill className="object-cover" priority />
      </div>

      <div className="relative z-10 mx-auto max-w-2xl">
        <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.35em] text-foreground/50">
          Unmarked Waypoint · Altitude Unknown
        </p>
        <h1 className="font-instrument text-6xl font-bold leading-none tracking-tight md:text-8xl">The Cairn.</h1>
        <p className="mt-6 max-w-xl font-instrument text-xl italic leading-snug text-foreground/70 md:text-2xl">
          A pile of stones, stacked by the people who came before you to say: there was a path here, you are not the
          first, keep going.
        </p>

        <section className="mt-16">
          <p className="mb-4 font-mono text-[10px] uppercase tracking-[0.35em] text-foreground/50">Leave a mark</p>
          <form onSubmit={handleSubmit} className="flex items-center gap-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="YOUR INITIALS"
              maxLength={3}
              aria-label="Your initials"
              className="w-44 border-b border-foreground/25 bg-transparent px-2 py-2 font-mono text-lg uppercase tracking-[0.25em] placeholder:text-foreground/30 focus:border-foreground/60 focus:outline-none"
            />
            <button
              type="submit"
              className="rounded-full border border-foreground/25 bg-foreground/5 px-5 py-2 font-mono text-xs uppercase tracking-[0.25em] text-foreground/80 transition-colors hover:border-foreground/50 hover:text-foreground"
            >
              Stack a stone
            </button>
          </form>
          {justAdded && (
            <p className="mt-3 font-instrument text-sm italic text-foreground/60">— one more for whoever comes next.</p>
          )}
        </section>

        <section className="mt-16">
          <p className="mb-4 font-mono text-[10px] uppercase tracking-[0.35em] text-foreground/50">Register</p>
          {register.length === 0 ? (
            <p className="font-instrument italic text-foreground/50">No one yet. Go first.</p>
          ) : (
            <ul className="grid grid-cols-3 gap-x-6 gap-y-3 sm:grid-cols-4 md:grid-cols-5">
              {register.map((m, i) => (
                <li
                  key={`${m.at}-${i}`}
                  className="border border-foreground/15 px-3 py-2 text-center font-mono text-sm uppercase tracking-[0.2em] text-foreground/75"
                >
                  {m.initials}
                </li>
              ))}
            </ul>
          )}
        </section>

        <div className="mt-24 flex flex-col gap-6">
          <Link
            href="/"
            className="group inline-flex items-center gap-3 font-mono text-xs uppercase tracking-[0.3em] text-foreground/60 transition-colors hover:text-foreground"
          >
            <span className="relative block h-10 w-[52px]">
              <Image src="/cairn/back-to-trail-marker.svg" alt="" fill className="object-contain" />
            </span>
            Return to trail
          </Link>
          {allSurfaceFound && (
            <p className="font-instrument text-base italic text-foreground/55">
              press{' '}
              <span className="rounded border border-foreground/25 bg-foreground/5 px-1.5 py-0.5 font-mono text-xs not-italic">
                ]
              </span>{' '}
              for the notebook.
            </p>
          )}
        </div>
      </div>
    </main>
  );
}
