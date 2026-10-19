import type { CronSchedule, DomSpec, DowSpec } from "./types";

export interface Wall {
  y: number;
  mo: number;
  d: number;
  h: number;
  mi: number;
  s: number;
}

const formatters = new Map<string, Intl.DateTimeFormat>();

function formatter(timeZone: string): Intl.DateTimeFormat {
  let f = formatters.get(timeZone);
  if (!f) {
    f = new Intl.DateTimeFormat("en-US", {
      timeZone,
      hourCycle: "h23",
      year: "numeric",
      month: "numeric",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
      second: "numeric",
    });
    formatters.set(timeZone, f);
  }
  return f;
}

export function isValidTimeZone(timeZone: string): boolean {
  try {
    formatter(timeZone);
    return true;
  } catch {
    return false;
  }
}

/** Wall-clock components of an instant in an IANA time zone. */
export function wallClock(ms: number, timeZone: string): Wall {
  if (timeZone === "UTC") {
    const dt = new Date(ms);
    return {
      y: dt.getUTCFullYear(),
      mo: dt.getUTCMonth() + 1,
      d: dt.getUTCDate(),
      h: dt.getUTCHours(),
      mi: dt.getUTCMinutes(),
      s: dt.getUTCSeconds(),
    };
  }
  const parts: Record<string, number> = {};
  for (const p of formatter(timeZone).formatToParts(new Date(ms))) {
    if (p.type !== "literal") parts[p.type] = Number(p.value);
  }
  return { y: parts.year, mo: parts.month, d: parts.day, h: parts.hour % 24, mi: parts.minute, s: parts.second };
}

function naive(w: Wall): number {
  return Date.UTC(w.y, w.mo - 1, w.d, w.h, w.mi, w.s);
}

function offsetAt(ms: number, timeZone: string): number {
  return naive(wallClock(ms, timeZone)) - Math.floor(ms / 1000) * 1000;
}

/**
 * Convert a wall-clock time in a zone to an instant (ms).
 * Returns null for wall times skipped by a DST gap; for repeated (fall-back) times returns the first occurrence.
 */
export function wallToInstant(w: Wall, timeZone: string): number | null {
  const guess = naive(w);
  if (timeZone === "UTC") return guess;
  const offsets = new Set([offsetAt(guess - 864e5, timeZone), offsetAt(guess, timeZone), offsetAt(guess + 864e5, timeZone)]);
  let best: number | null = null;
  for (const o of offsets) {
    const t = guess - o;
    if (naive(wallClock(t, timeZone)) === guess && (best === null || t < best)) best = t;
  }
  return best;
}

export function daysInMonth(y: number, mo: number): number {
  return new Date(Date.UTC(y, mo, 0)).getUTCDate();
}

function weekday(y: number, mo: number, d: number): number {
  return new Date(Date.UTC(y, mo - 1, d)).getUTCDay();
}

/** Quartz "W": nearest weekday to day n, never leaving the month. Returns -1 if n doesn't exist. */
export function nearestWeekday(y: number, mo: number, n: number): number {
  const dim = daysInMonth(y, mo);
  if (n > dim) return -1;
  const wd = weekday(y, mo, n);
  if (wd === 6) return n === 1 ? 3 : n - 1;
  if (wd === 0) return n === dim ? n - 2 : n + 1;
  return n;
}

export function lastWeekdayOfMonth(y: number, mo: number): number {
  const dim = daysInMonth(y, mo);
  const wd = weekday(y, mo, dim);
  return wd === 6 ? dim - 1 : wd === 0 ? dim - 2 : dim;
}

function domMatches(spec: DomSpec, y: number, mo: number, d: number, dim: number): boolean {
  if (spec.any) return true;
  return (
    spec.days.includes(d) ||
    spec.lastOffsets.some((o) => d === dim - o) ||
    (spec.lastWeekday && d === lastWeekdayOfMonth(y, mo)) ||
    spec.nearestWeekday.some((n) => d === nearestWeekday(y, mo, n))
  );
}

function dowMatches(spec: DowSpec, d: number, wd: number, dim: number): boolean {
  if (spec.any) return true;
  return (
    spec.days.includes(wd) ||
    spec.nth.some((x) => x.day === wd && Math.ceil(d / 7) === x.n) ||
    spec.last.some((x) => x === wd && d + 7 > dim)
  );
}

export function dayMatches(s: CronSchedule, y: number, mo: number, d: number): boolean {
  const dim = daysInMonth(y, mo);
  if (d > dim) return false;
  const a = domMatches(s.dom, y, mo, d, dim);
  const b = dowMatches(s.dow, d, weekday(y, mo, d), dim);
  return s.dayMode === "and" ? a && b : a || b;
}

/** Max DST shift we allow for when pruning by wall-clock time. */
const SLACK = 3 * 3600_000;

/**
 * Next `count` fire times strictly after `from`, evaluated on wall-clock time in `timeZone`.
 * DST: wall times inside a spring-forward gap are skipped; repeated fall-back times fire once (first occurrence).
 */
export function nextRuns(s: CronSchedule, from: Date, count = 10, timeZone = "UTC", horizonYears = 8): Date[] {
  const out: Date[] = [];
  const fromMs = from.getTime();
  const fromNaive = naive(wallClock(fromMs, timeZone));
  const floor = fromNaive - SLACK;
  const startYear = new Date(floor).getUTCFullYear();
  const endYear = s.years ? Math.max(...s.years) : startYear + horizonYears;

  for (let y = startYear; y <= endYear; y++) {
    if (s.years && !s.years.includes(y)) continue;
    for (const mo of s.months) {
      if (Date.UTC(y, mo, 1) <= floor) continue;
      const dim = daysInMonth(y, mo);
      for (let d = 1; d <= dim; d++) {
        if (Date.UTC(y, mo - 1, d + 1) <= floor) continue;
        if (!dayMatches(s, y, mo, d)) continue;
        for (const h of s.hours) {
          if (Date.UTC(y, mo - 1, d, h + 1) <= floor) continue;
          for (const mi of s.minutes) {
            if (Date.UTC(y, mo - 1, d, h, mi + 1) <= floor) continue;
            for (const sec of s.seconds) {
              const t = wallToInstant({ y, mo, d, h, mi, s: sec }, timeZone);
              if (t === null || t <= fromMs) continue;
              out.push(new Date(t));
              if (out.length >= count) return out;
            }
          }
        }
      }
    }
  }
  return out;
}
