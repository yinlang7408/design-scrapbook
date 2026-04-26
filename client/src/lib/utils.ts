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

// Local date string — avoids UTC offset shifting the date
export function dateToStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// Today's date string in local time
export function todayStr(): string {
  return dateToStr(new Date());
}

// Get Monday of the ISO week containing date
export function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay(); // 0=Sun ... 6=Sat
  d.setDate(d.getDate() + (day === 0 ? -6 : 1 - day));
  d.setHours(0, 0, 0, 0);
  return d;
}

// ISO week number
export function getWeekNumber(date: Date): number {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
  const week1 = new Date(d.getFullYear(), 0, 4);
  return 1 + Math.round(((d.getTime() - week1.getTime()) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7);
}

// "2025 · 第18周 · 4月28日 — 5月4日"
export function formatWeekRange(weekStart: Date): string {
  const weekEnd = addDays(weekStart, 6);
  const weekNum = getWeekNumber(weekStart);
  const fmt = (d: Date) => `${d.getMonth() + 1}月${d.getDate()}日`;
  return `第${weekNum}周 · ${fmt(weekStart)} — ${fmt(weekEnd)}`;
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
