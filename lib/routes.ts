import type { Dialect } from "./cron/types";
import { EVERY_SLUGS } from "./cron/presets";

export type DialectPageKey = "quartz" | "aws" | "github" | "kubernetes" | "spring";
export type StaticPageKey = "home" | DialectPageKey | "cheatsheet" | "about" | "privacy";

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
};

export const DIALECT_PAGES: { key: DialectPageKey; dialect: Dialect; example: string }[] = [
  { key: "quartz", dialect: "quartz", example: "0 0 12 ? * MON-FRI" },
  { key: "aws", dialect: "aws", example: "cron(0 12 * * ? *)" },
  { key: "github", dialect: "github", example: "30 5 * * 1-5" },
  { key: "kubernetes", dialect: "kubernetes", example: "0 */6 * * *" },
  { key: "spring", dialect: "spring", example: "0 0 9 * * MON-FRI" },
];

export function everyPath(slug: string): string {
  return `/every/${slug}/`;
}

/** Every locale-independent page path in the site. */
export function allPaths(): string[] {
  return [...Object.values(PAGE_PATHS), ...EVERY_SLUGS.map(everyPath)];
}
