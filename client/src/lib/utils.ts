import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDateRange(start: Date, end: Date): string {
  const opts: Intl.DateTimeFormatOptions = { month: 'long', day: 'numeric' };
  const startStr = start.toLocaleDateString('zh-CN', opts);
  const endStr = end.toLocaleDateString('zh-CN', opts);
  const year = start.getFullYear();
  return `${year} · ${startStr} — ${endStr}`;
}

export function dateToStr(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function strToDate(s: string): Date {
  // Parse YYYY-MM-DD as local date (not UTC)
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

// Seeded pseudo-random: deterministic given a string seed
export function seededRandom(seed: string): () => number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return () => {
    h += h << 13;
    h ^= h >>> 7;
    h += h << 3;
    h ^= h >>> 17;
    h += h << 5;
    return ((h >>> 0) / 4294967296);
  };
}

export function midnight(): Date {
  const d = new Date();
  d.setHours(24, 0, 0, 0);
  return d;
}

export function secondsUntilMidnight(): number {
  return Math.ceil((midnight().getTime() - Date.now()) / 1000);
}

export function formatCountdown(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}
