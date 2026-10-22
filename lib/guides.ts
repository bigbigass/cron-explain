import type { Dialect } from "./cron/types";
import type { DialectPageKey } from "./routes";

export interface Guide {
  slug: string;
  /** Expression the embedded tool starts with, and its dialect ("auto" lets the tool detect it). */
  expr: string;
  dialect: Dialect | "auto";
  relatedEvery: string[];
  relatedDialects: DialectPageKey[];
  relatedGuides: string[];
}

/** Programmatic `/guide/[slug]/` explainer pages. Copy lives in `guides.items[slug]` of each dictionary. */
export const GUIDES: Guide[] = [
  {
    slug: "what-is-a-cron-expression",
    expr: "30 2 * * 1-5",
    dialect: "auto",
    relatedEvery: ["every-5-minutes", "every-hour", "every-day-at-midnight", "every-weekday"],
    relatedDialects: ["quartz", "github"],
    relatedGuides: ["cron-syntax-explained", "crontab-examples", "how-to-test-a-cron-expression"],
  },
  {
    slug: "cron-syntax-explained",
    expr: "*/15 9-17 * * MON-FRI",
    dialect: "auto",
    relatedEvery: ["every-15-minutes", "every-hour-on-weekdays", "every-weekday-at-8am", "first-day-of-month"],
    relatedDialects: ["quartz", "aws"],
    relatedGuides: ["cron-special-characters", "cron-day-of-week", "what-is-a-cron-expression"],
  },
  {
    slug: "crontab-examples",
    expr: "0 2 * * *",
    dialect: "auto",
    relatedEvery: [
      "every-minute",
      "every-5-minutes",
      "every-30-minutes",
      "every-hour",
      "every-4-hours",
      "every-day-at-2am",
      "twice-a-day",
      "every-weekday-at-8am",
      "every-monday-at-9am",
      "every-friday-at-5pm",
      "every-15th-of-month",
      "first-day-of-month",
    ],
    relatedDialects: ["kubernetes", "github"],
    relatedGuides: ["linux-crontab-guide", "cron-every-n-minutes", "cron-syntax-explained"],
  },
  {
    slug: "5-field-vs-6-field-cron",
    expr: "0 */10 * * * *",
    dialect: "seconds",
    relatedEvery: ["every-minute", "every-10-minutes", "every-day-at-midnight"],
    relatedDialects: ["quartz", "spring", "aws"],
    relatedGuides: ["cron-seconds-field", "cron-syntax-explained", "aws-rate-vs-cron"],
  },
  {
    slug: "cron-seconds-field",
    expr: "*/30 * * * * *",
    dialect: "seconds",
    relatedEvery: ["every-minute", "every-2-minutes", "every-5-minutes"],
    relatedDialects: ["spring", "quartz"],
    relatedGuides: ["5-field-vs-6-field-cron", "cron-special-characters", "how-to-test-a-cron-expression"],
  },
  {
    slug: "cron-special-characters",
    expr: "0 0 12 ? * 6L",
    dialect: "quartz",
    relatedEvery: ["every-15-minutes", "last-day-of-month", "first-monday-of-month", "every-weekday-at-midnight"],
    relatedDialects: ["quartz", "spring", "aws"],
    relatedGuides: ["cron-question-mark", "cron-syntax-explained", "cron-day-of-week"],
  },
  {
    slug: "cron-question-mark",
    expr: "0 0 9 ? * MON-FRI",
    dialect: "quartz",
    relatedEvery: ["every-monday-at-9am", "every-15th-of-month", "second-sunday-of-month"],
    relatedDialects: ["quartz", "aws"],
    relatedGuides: ["cron-special-characters", "aws-rate-vs-cron", "5-field-vs-6-field-cron"],
  },
  {
    slug: "cron-day-of-week",
    expr: "0 18 * * MON-FRI",
    dialect: "auto",
    relatedEvery: ["every-sunday", "every-tuesday", "every-friday", "every-weekend", "every-weekday-at-8am"],
    relatedDialects: ["quartz", "aws"],
    relatedGuides: ["cron-syntax-explained", "cron-question-mark", "cron-special-characters"],
  },
  {
    slug: "cron-timezone",
    expr: "0 9 * * 1-5",
    dialect: "github",
    relatedEvery: ["every-day-at-9am", "every-day-at-midnight", "every-weekday-at-8am"],
    relatedDialects: ["github", "kubernetes", "aws"],
    relatedGuides: ["cron-daylight-saving", "how-to-test-a-cron-expression", "linux-crontab-guide"],
  },
  {
    slug: "cron-daylight-saving",
    expr: "30 2 * * *",
    dialect: "auto",
    relatedEvery: ["every-day-at-1am", "every-day-at-2am", "every-day-at-3am", "every-sunday-at-3am"],
    relatedDialects: ["kubernetes", "quartz"],
    relatedGuides: ["cron-timezone", "how-to-test-a-cron-expression", "linux-crontab-guide"],
  },
  {
    slug: "how-to-test-a-cron-expression",
    expr: "0 6 * * 1-5",
    dialect: "auto",
    relatedEvery: ["every-day-at-6am", "every-hour", "every-15-minutes"],
    relatedDialects: ["github", "quartz"],
    relatedGuides: ["cron-timezone", "linux-crontab-guide", "what-is-a-cron-expression"],
  },
  {
    slug: "linux-crontab-guide",
    expr: "0 3 * * *",
    dialect: "standard",
    relatedEvery: ["every-day-at-3am", "every-hour", "every-sunday-at-3am", "every-5-minutes"],
    relatedDialects: ["kubernetes", "github"],
    relatedGuides: ["crontab-examples", "cron-timezone", "how-to-test-a-cron-expression"],
  },
  {
    slug: "cron-every-n-minutes",
    expr: "*/20 * * * *",
    dialect: "auto",
    relatedEvery: [
      "every-minute",
      "every-2-minutes",
      "every-3-minutes",
      "every-5-minutes",
      "every-10-minutes",
      "every-15-minutes",
      "every-20-minutes",
      "every-30-minutes",
      "every-45-minutes",
    ],
    relatedDialects: ["github", "quartz"],
    relatedGuides: ["crontab-examples", "cron-syntax-explained", "cron-seconds-field"],
  },
  {
    slug: "aws-rate-vs-cron",
    expr: "cron(0 8 ? * MON-FRI *)",
    dialect: "aws",
    relatedEvery: ["every-5-minutes", "every-hour", "every-weekday-at-8am", "first-day-of-month"],
    relatedDialects: ["aws", "quartz"],
    relatedGuides: ["cron-question-mark", "cron-timezone", "5-field-vs-6-field-cron"],
  },
];

export const GUIDE_SLUGS = GUIDES.map((g) => g.slug);

export function getGuide(slug: string): Guide | undefined {
  return GUIDES.find((g) => g.slug === slug);
}
