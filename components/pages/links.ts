import { getDictionary } from "@/lib/i18n";
import { localizedPath, ucfirst, type Locale } from "@/lib/i18n/config";
import { DIALECT_PAGES, everyPath, guidePath, PAGE_PATHS, type DialectPageKey, type HubPageKey } from "@/lib/routes";
import type { EverySlugKey, GuideSlugKey } from "./parts";

export function everyLinks(locale: Locale, slugs: string[]) {
  const d = getDictionary(locale);
  return slugs.map((slug) => ({
    href: localizedPath(locale, everyPath(slug)),
    label: ucfirst(d.every.items[slug as EverySlugKey].name, locale),
  }));
}

export function dialectLinks(locale: Locale, keys: DialectPageKey[] = DIALECT_PAGES.map((p) => p.key)) {
  const d = getDictionary(locale);
  return keys.map((key) => ({ href: localizedPath(locale, PAGE_PATHS[key]), label: d.pages[key].h1 }));
}

export function guideLinks(locale: Locale, slugs: string[]) {
  const d = getDictionary(locale);
  return slugs.map((slug) => ({ href: localizedPath(locale, guidePath(slug)), label: d.guides.items[slug as GuideSlugKey].h1 }));
}

export function hubLinks(locale: Locale, keys: HubPageKey[]) {
  const d = getDictionary(locale);
  return keys.map((key) => ({ href: localizedPath(locale, PAGE_PATHS[key]), label: d.pages[key].h1 }));
}

export function cheatsheetLink(locale: Locale) {
  return { href: localizedPath(locale, PAGE_PATHS.cheatsheet), label: getDictionary(locale).pages.cheatsheet.h1 };
}
