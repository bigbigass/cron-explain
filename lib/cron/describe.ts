import cronstrue from "cronstrue";
import "cronstrue/locales/zh_CN";
import "cronstrue/locales/es";
import "cronstrue/locales/de";
import "cronstrue/locales/fr";
import "cronstrue/locales/ja";
import "cronstrue/locales/pt_BR";
import type { Locale } from "../i18n/config";
import { familyOf } from "./convert";
import type { CronSchedule } from "./types";

const CRONSTRUE_LOCALE: Record<Locale, string> = {
  en: "en",
  zh: "zh_CN",
  es: "es",
  de: "de",
  fr: "fr",
  ja: "ja",
  pt: "pt_BR",
};

/** Plain-language description of a parsed schedule, localized via cronstrue. Returns null if it can't describe it. */
export function describeSchedule(s: CronSchedule, locale: Locale): string | null {
  const family = familyOf(s.dialect);
  // cronstrue reads 6/7 fields as seconds-first; AWS has no seconds, so prepend one.
  const text = family === "aws" ? `0 ${s.fields.join(" ")}` : s.fields.join(" ");
  try {
    return cronstrue.toString(text, {
      locale: CRONSTRUE_LOCALE[locale],
      use24HourTimeFormat: locale !== "en",
      dayOfWeekStartIndexZero: !(family === "quartz" || family === "aws"),
      throwExceptionOnParseError: true,
      verbose: false,
    });
  } catch {
    return null;
  }
}
