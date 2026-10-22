import type { Dialect } from "./cron/types";
import { EVERY_SLUGS } from "./cron/presets";
import { GUIDE_SLUGS } from "./guides";

export type DialectPageKey = "quartz" | "aws" | "github" | "kubernetes" | "spring";
/** Top-level comparison, examples and troubleshooting hubs. */
export type HubPageKey = "cronVsQuartz" | "crontabVsGithub" | "commonCronErrors" | "cronInvalid" | "springExamples" | "k8sExamples";
export type StaticPageKey = "home" | DialectPageKey | "cheatsheet" | "about" | "privacy" | HubPageKey;

/** Locale-independent paths (English URLs). */
export const PAGE_PATHS: Record<StaticPageKey, string> = {
  home: "/",
  quartz: "/quartz-cron/",
  aws: "/aws-cron/",
  github: "/github-actions-cron/",
  kubernetes: "/kubernetes-cronjob/",
  spring: "/spring-cron/",
  cheatsheet: "/cron-syntax-cheatsheet/",
  about: "/about/",
  privacy: "/privacy/",
  cronVsQuartz: "/cron-vs-quartz/",
  crontabVsGithub: "/crontab-vs-github-actions/",
  commonCronErrors: "/common-cron-errors/",
  cronInvalid: "/cron-invalid-expression/",
  springExamples: "/spring-scheduled-examples/",
  k8sExamples: "/kubernetes-cronjob-examples/",
};

export const DIALECT_PAGES: { key: DialectPageKey; dialect: Dialect; example: string }[] = [
  { key: "quartz", dialect: "quartz", example: "0 0 12 ? * MON-FRI" },
  { key: "aws", dialect: "aws", example: "cron(0 12 * * ? *)" },
  { key: "github", dialect: "github", example: "30 5 * * 1-5" },
  { key: "kubernetes", dialect: "kubernetes", example: "0 */6 * * *" },
  { key: "spring", dialect: "spring", example: "0 0 9 * * MON-FRI" },
];

export interface HubPage {
  key: HubPageKey;
  /** Expression the embedded tool starts with (error hubs deliberately use a broken one). */
  example: string;
  dialect: Dialect | "auto";
  relatedEvery: string[];
  relatedDialects: DialectPageKey[];
  relatedGuides: string[];
  relatedHubs: HubPageKey[];
}

export const HUB_PAGES: HubPage[] = [
  {
    key: "cronVsQuartz",
    example: "0 0 12 ? * MON-FRI",
    dialect: "quartz",
    relatedEvery: ["every-weekday", "last-day-of-month", "first-monday-of-month", "second-sunday-of-month"],
    relatedDialects: ["quartz", "spring"],
    relatedGuides: ["cron-question-mark", "5-field-vs-6-field-cron", "cron-special-characters"],
    relatedHubs: ["springExamples", "cronInvalid"],
  },
  {
    key: "crontabVsGithub",
    example: "30 5 * * 1-5",
    dialect: "github",
    relatedEvery: ["every-5-minutes", "every-hour", "every-day-at-midnight", "every-weekday-at-8am"],
    relatedDialects: ["github", "kubernetes"],
    relatedGuides: ["cron-timezone", "linux-crontab-guide", "cron-every-n-minutes"],
    relatedHubs: ["k8sExamples", "commonCronErrors"],
  },
  {
    key: "commonCronErrors",
    example: "0 0 31 2 *",
    dialect: "auto",
    relatedEvery: ["every-day-at-midnight", "last-day-of-month", "every-15th-of-month", "every-weekday"],
    relatedDialects: ["quartz", "aws"],
    relatedGuides: ["how-to-test-a-cron-expression", "cron-day-of-week", "cron-timezone"],
    relatedHubs: ["cronInvalid", "crontabVsGithub"],
  },
  {
    key: "cronInvalid",
    example: "0 0 12 * * MON",
    dialect: "quartz",
    relatedEvery: ["every-day-at-noon", "every-monday-at-9am", "every-hour"],
    relatedDialects: ["quartz", "aws"],
    relatedGuides: ["cron-question-mark", "cron-syntax-explained", "how-to-test-a-cron-expression"],
    relatedHubs: ["commonCronErrors", "cronVsQuartz"],
  },
  {
    key: "springExamples",
    example: "0 0 9 * * MON-FRI",
    dialect: "spring",
    relatedEvery: ["every-weekday", "every-hour", "every-day-at-midnight", "every-15-minutes", "last-day-of-month"],
    relatedDialects: ["spring", "quartz"],
    relatedGuides: ["cron-seconds-field", "5-field-vs-6-field-cron", "cron-special-characters"],
    relatedHubs: ["cronVsQuartz", "cronInvalid"],
  },
  {
    key: "k8sExamples",
    example: "0 */6 * * *",
    dialect: "kubernetes",
    relatedEvery: ["every-6-hours", "every-day-at-2am", "every-sunday-at-3am", "every-15-minutes", "every-weekday-at-midnight"],
    relatedDialects: ["kubernetes", "github"],
    relatedGuides: ["cron-timezone", "crontab-examples", "cron-daylight-saving"],
    relatedHubs: ["crontabVsGithub", "commonCronErrors"],
  },
];

export function guidePath(slug: string): string {
  return `/guide/${slug}/`;
}

export function everyPath(slug: string): string {
  return `/every/${slug}/`;
}

/** Every locale-independent page path in the site. */
export function allPaths(): string[] {
  return [...Object.values(PAGE_PATHS), ...EVERY_SLUGS.map(everyPath), ...GUIDE_SLUGS.map(guidePath)];
}
