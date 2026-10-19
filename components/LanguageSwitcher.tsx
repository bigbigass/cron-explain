"use client";

import { track } from "@vercel/analytics";
import { usePathname } from "next/navigation";
import { LOCALES, LOCALE_NAMES, localizedPath, splitLocale, type Locale } from "@/lib/i18n/config";

export default function LanguageSwitcher({ locale, label }: { locale: Locale; label: string }) {
  const pathname = usePathname() ?? "/";

  function onChange(next: Locale) {
    if (next === locale) return;
    track("locale_switch", { from: locale, to: next });
    const { path } = splitLocale(pathname);
    // Different root layout per locale → full navigation; keep ?expr= etc.
    window.location.assign(localizedPath(next, path) + window.location.search);
  }

  return (
    <label className="flex items-center gap-2 text-sm">
      <span className="sr-only">{label}</span>
      <span aria-hidden="true">🌐</span>
      <select
        value={locale}
        onChange={(e) => onChange(e.target.value as Locale)}
        className="rounded-lg border border-slate-300 bg-white px-2 py-1 dark:border-slate-600 dark:bg-slate-900"
      >
        {LOCALES.map((l) => (
          <option key={l} value={l} lang={l}>
            {LOCALE_NAMES[l]}
          </option>
        ))}
      </select>
    </label>
  );
}
