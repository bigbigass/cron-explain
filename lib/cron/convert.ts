import { parseCron } from "./parse";
import type { CronSchedule, Dialect } from "./types";

export type ConvertReason = "secondsNotSupported" | "yearNotSupported" | "specialNotSupported" | "domDowBoth";
export type ConvertWarning = "githubMinInterval" | "awsUtc" | "githubUtc";

export type ConvertResult =
  | { ok: true; expression: string; warnings: ConvertWarning[] }
  | { ok: false; reason: ConvertReason };

type Family = "five" | "seconds" | "spring" | "quartz" | "aws";

export function familyOf(d: Dialect): Family {
  if (d === "standard" || d === "github" || d === "kubernetes") return "five";
  return d;
}

const DOW_NAMES = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

/** Compact a sorted value set back into cron syntax (`*`, `*\/n`, `a-b/n`, ranges, lists). */
export function formatSet(values: number[], min: number, max: number): string {
  if (values.length === max - min + 1) return "*";
  if (values.length > 2) {
    const step = values[1] - values[0];
    const isProgression = values.every((v, i) => i === 0 || v - values[i - 1] === step);
    if (isProgression && step > 1 && values[values.length - 1] + step > max) {
      return values[0] === min ? `*/${step}` : `${values[0]}-${values[values.length - 1]}/${step}`;
    }
  }
  return compressRuns(values, String);
}

function compressRuns(values: number[], label: (v: number) => string): string {
  const parts: string[] = [];
  let i = 0;
  while (i < values.length) {
    let j = i;
    while (j + 1 < values.length && values[j + 1] === values[j] + 1) j++;
    if (j - i >= 2) parts.push(`${label(values[i])}-${label(values[j])}`);
    else for (let k = i; k <= j; k++) parts.push(label(values[k]));
    i = j + 1;
  }
  return parts.join(",");
}

function hasSpecials(s: CronSchedule): boolean {
  return (
    s.dom.lastOffsets.length > 0 ||
    s.dom.lastWeekday ||
    s.dom.nearestWeekday.length > 0 ||
    s.dow.nth.length > 0 ||
    s.dow.last.length > 0
  );
}

function formatDom(s: CronSchedule): string {
  if (s.dom.any) return "*";
  const parts: string[] = [];
  if (s.dom.days.length) parts.push(formatSet(s.dom.days, 1, 31));
  for (const o of s.dom.lastOffsets) parts.push(o === 0 ? "L" : `L-${o}`);
  if (s.dom.lastWeekday) parts.push("LW");
  for (const n of s.dom.nearestWeekday) parts.push(`${n}W`);
  return parts.join(",");
}

function formatDow(s: CronSchedule, family: Family): string {
  if (s.dow.any) return "*";
  const base = family === "quartz" || family === "aws" ? 1 : 0;
  const useNames = family !== "five" && family !== "seconds";
  const parts: string[] = [];
  if (s.dow.days.length) {
    parts.push(compressRuns(s.dow.days, (d) => (useNames ? DOW_NAMES[d] : String(d + base))));
  }
  for (const x of s.dow.nth) parts.push(`${x.day + base}#${x.n}`);
  for (const x of s.dow.last) parts.push(`${x + base}L`);
  return parts.join(",");
}

/** Fires more than once within some 5-minute window (GitHub Actions' shortest interval). */
export function firesMoreOftenThan5Min(s: CronSchedule): boolean {
  if (s.minutes.length < 2) return false;
  const m = s.minutes;
  for (let i = 1; i < m.length; i++) if (m[i] - m[i - 1] < 5) return true;
  return s.hours.length > 1 && m[0] + 60 - m[m.length - 1] < 5;
}

/** Render a parsed schedule in another dialect, or explain why it can't be represented. */
export function formatSchedule(s: CronSchedule, target: Dialect): ConvertResult {
  const family = familyOf(target);
  const hasSeconds = family !== "five" && family !== "aws";
  const hasYear = family === "quartz" || family === "aws";
  const secondsOnly0 = s.seconds.length === 1 && s.seconds[0] === 0;

  if (!hasSeconds && !secondsOnly0) return { ok: false, reason: "secondsNotSupported" };
  if (!hasYear && s.years) return { ok: false, reason: "yearNotSupported" };
  if ((family === "five" || family === "seconds") && hasSpecials(s)) return { ok: false, reason: "specialNotSupported" };

  const bothRestricted = !s.dom.any && !s.dow.any;
  let dom = formatDom(s);
  let dow = formatDow(s, family);

  if (bothRestricted) {
    if (family === "quartz" || family === "aws") return { ok: false, reason: "domDowBoth" };
    if (family === "spring" && s.dayMode === "or") return { ok: false, reason: "domDowBoth" };
    // Keep OR semantics: a field starting with "*" would switch Unix crons to AND.
    if (s.dayMode === "or" && dom.startsWith("*")) dom = compressRuns(s.dom.days, String);
    // Unix crons OR the two fields unless one starts with "*": only keep AND semantics if we can.
    if ((family === "five" || family === "seconds") && s.dayMode === "and" && !dom.startsWith("*") && !dow.startsWith("*")) {
      return { ok: false, reason: "domDowBoth" };
    }
  }
  if (family === "quartz" || family === "aws") {
    if (!s.dow.any) dom = "?";
    else dow = "?";
  }

  const sec = formatSet(s.seconds, 0, 59);
  const min = formatSet(s.minutes, 0, 59);
  const hour = formatSet(s.hours, 0, 23);
  const mon = formatSet(s.months, 1, 12);
  const warnings: ConvertWarning[] = [];

  let expression: string;
  switch (family) {
    case "five":
      expression = [min, hour, dom, mon, dow].join(" ");
      break;
    case "seconds":
    case "spring":
      expression = [sec, min, hour, dom, mon, dow].join(" ");
      break;
    case "quartz":
      expression = [sec, min, hour, dom, mon, dow, ...(s.years ? [formatSet(s.years, 1970, 2199)] : [])].join(" ");
      break;
    case "aws":
      expression = `cron(${[min, hour, dom, mon, dow, s.years ? formatSet(s.years, 1970, 2199) : "*"].join(" ")})`;
      warnings.push("awsUtc");
      break;
  }
  if (target === "github") {
    warnings.push("githubUtc");
    if (firesMoreOftenThan5Min(s)) warnings.push("githubMinInterval");
  }
  return { ok: true, expression, warnings };
}

/** Convert an expression from one dialect to another. Throws CronError if the input itself is invalid. */
export function convertCron(expr: string, from: Dialect | "auto", to: Dialect): ConvertResult {
  return formatSchedule(parseCron(expr, from), to);
}
