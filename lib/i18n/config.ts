export const LOCALES = ["en", "zh", "es", "de", "fr", "ja", "pt"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "en";
/** Locales served under a `/xx/` prefix (English lives at the root). */
export const PREFIXED_LOCALES = LOCALES.filter((l) => l !== DEFAULT_LOCALE);

export const LOCALE_NAMES: Record<Locale, string> = {
  en: "English",
  zh: "中文",
  es: "Español",
  de: "Deutsch",
  fr: "Français",
  ja: "日本語",
  pt: "Português",
};

/** BCP 47 tags for Intl / Open Graph. */
export const LOCALE_TAGS: Record<Locale, string> = {
  en: "en-US",
  zh: "zh-CN",
  es: "es-ES",
  de: "de-DE",
  fr: "fr-FR",
  ja: "ja-JP",
  pt: "pt-BR",
};

export function isLocale(value: string): value is Locale {
  return (LOCALES as readonly string[]).includes(value);
}

/** `/every/x/` → `/de/every/x/` (English unchanged). Paths always start and end with "/". */
export function localizedPath(locale: Locale, path: string): string {
  return locale === DEFAULT_LOCALE ? path : `/${locale}${path}`;
}

/** Split a pathname into its locale and the locale-independent path. */
export function splitLocale(pathname: string): { locale: Locale; path: string } {
  const m = /^\/([a-z]{2})(\/.*)?$/.exec(pathname);
  if (m && isLocale(m[1]) && m[1] !== DEFAULT_LOCALE) {
    const rest = m[2] ?? "/";
    return { locale: m[1], path: rest.endsWith("/") ? rest : `${rest}/` };
  }
  return { locale: DEFAULT_LOCALE, path: pathname.endsWith("/") ? pathname : `${pathname}/` };
}

export function interpolate(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (m, k: string) => (k in vars ? String(vars[k]) : m));
}

export function ucfirst(s: string, locale: Locale): string {
  return s.charAt(0).toLocaleUpperCase(locale) + s.slice(1);
}
