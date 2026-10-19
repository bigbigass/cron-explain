import { notFound } from "next/navigation";
import { isLocale, PREFIXED_LOCALES, type Locale } from "./config";

/** Resolve a `[locale]` route param; English is served at the root, so "en" is not a valid prefix. */
export function prefixedLocale(value: string): Locale {
  if (!isLocale(value) || !(PREFIXED_LOCALES as string[]).includes(value)) notFound();
  return value;
}

export function prefixedLocaleParams() {
  return PREFIXED_LOCALES.map((locale) => ({ locale }));
}
