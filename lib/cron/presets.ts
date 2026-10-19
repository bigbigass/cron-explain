import type { Dialect } from "./types";

export interface EverySchedule {
  slug: string;
  /** Canonical expression and the dialect it is written in. */
  expr: string;
  dialect: Dialect;
}

/** Programmatic `/every/[slug]/` landing pages. */
export const EVERY: EverySchedule[] = [
  { slug: "every-minute", expr: "* * * * *", dialect: "standard" },
  { slug: "every-5-minutes", expr: "*/5 * * * *", dialect: "standard" },
  { slug: "every-10-minutes", expr: "*/10 * * * *", dialect: "standard" },
  { slug: "every-15-minutes", expr: "*/15 * * * *", dialect: "standard" },
  { slug: "every-30-minutes", expr: "*/30 * * * *", dialect: "standard" },
  { slug: "every-hour", expr: "0 * * * *", dialect: "standard" },
  { slug: "every-2-hours", expr: "0 */2 * * *", dialect: "standard" },
  { slug: "every-6-hours", expr: "0 */6 * * *", dialect: "standard" },
  { slug: "every-12-hours", expr: "0 */12 * * *", dialect: "standard" },
  { slug: "every-day-at-midnight", expr: "0 0 * * *", dialect: "standard" },
  { slug: "every-day-at-noon", expr: "0 12 * * *", dialect: "standard" },
  { slug: "every-day-at-9am", expr: "0 9 * * *", dialect: "standard" },
  { slug: "every-monday", expr: "0 0 * * 1", dialect: "standard" },
  { slug: "every-weekday", expr: "0 9 * * 1-5", dialect: "standard" },
  { slug: "every-weekend", expr: "0 10 * * 0,6", dialect: "standard" },
  { slug: "every-sunday-at-3am", expr: "0 3 * * 0", dialect: "standard" },
  { slug: "first-day-of-month", expr: "0 0 1 * *", dialect: "standard" },
  { slug: "last-day-of-month", expr: "0 0 0 L * ?", dialect: "quartz" },
  { slug: "every-quarter", expr: "0 0 1 */3 *", dialect: "standard" },
  { slug: "every-year", expr: "0 0 1 1 *", dialect: "standard" },
];

export const EVERY_SLUGS = EVERY.map((e) => e.slug);

export function getEvery(slug: string): EverySchedule | undefined {
  return EVERY.find((e) => e.slug === slug);
}

/** Quick presets shown in the tool (subset of EVERY). */
export const PRESET_SLUGS = [
  "every-5-minutes",
  "every-15-minutes",
  "every-hour",
  "every-day-at-midnight",
  "every-weekday",
  "every-sunday-at-3am",
  "first-day-of-month",
  "last-day-of-month",
];
