import { Analytics } from "@vercel/analytics/next";
import type { Metadata, Viewport } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { getDictionary } from "@/lib/i18n";
import { localizedPath, ucfirst, type Locale } from "@/lib/i18n/config";
import { DIALECT_PAGES, everyPath, PAGE_PATHS } from "@/lib/routes";
import { SISTER_SITES, SITE_NAME, SITE_URL } from "@/lib/site";
import LanguageSwitcher from "./LanguageSwitcher";
import "@/app/globals.css";

export const rootMetadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  applicationName: SITE_NAME,
  icons: { icon: "/favicon.svg" },
};

export const rootViewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f8fafc" },
    { media: "(prefers-color-scheme: dark)", color: "#020617" },
  ],
};

const FOOTER_SCHEDULES = ["every-5-minutes", "every-hour", "every-day-at-midnight", "every-weekday", "first-day-of-month"];

export default function SiteShell({ locale, children }: { locale: Locale; children: ReactNode }) {
  const d = getDictionary(locale);
  const href = (path: string) => localizedPath(locale, path);
  return (
    <html lang={locale}>
      <body className="flex min-h-screen flex-col">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:rounded focus:bg-white focus:px-3 focus:py-2 focus:text-slate-900"
        >
          {d.site.skip}
        </a>
        <header className="border-b border-slate-200 bg-white/80 dark:border-slate-800 dark:bg-slate-950/80">
          <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-3">
            <Link href={href("/")} className="flex items-center gap-2 font-bold tracking-tight">
              <img src="/favicon.svg" alt="" width={28} height={28} />
              <span>{SITE_NAME}</span>
            </Link>
            <nav aria-label={d.nav.dialects} className="flex flex-wrap items-center gap-4 text-sm">
              <Link href={href(PAGE_PATHS.home)} className="hover:text-indigo-600 dark:hover:text-indigo-300">
                {d.nav.home}
              </Link>
              <Link href={href(PAGE_PATHS.cheatsheet)} className="hover:text-indigo-600 dark:hover:text-indigo-300">
                {d.nav.cheatsheet}
              </Link>
              <LanguageSwitcher locale={locale} label={d.site.language} />
            </nav>
          </div>
        </header>
        <main id="main" className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
          {children}
        </main>
        <footer className="border-t border-slate-200 bg-white text-sm dark:border-slate-800 dark:bg-slate-950">
          <div className="mx-auto grid max-w-5xl gap-6 px-4 py-8 sm:grid-cols-3">
            <div>
              <p className="font-semibold">{d.nav.dialects}</p>
              <ul className="mt-2 space-y-1">
                {DIALECT_PAGES.map((p) => (
                  <li key={p.key}>
                    <Link href={href(PAGE_PATHS[p.key])} className="hover:underline">
                      {d.common.dialectNames[p.dialect]}
                    </Link>
                  </li>
                ))}
                <li>
                  <Link href={href(PAGE_PATHS.cheatsheet)} className="hover:underline">
                    {d.nav.cheatsheet}
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <p className="font-semibold">{d.footer.schedules}</p>
              <ul className="mt-2 space-y-1">
                {FOOTER_SCHEDULES.map((slug) => (
                  <li key={slug}>
                    <Link href={href(everyPath(slug))} className="hover:underline">
                      {ucfirst(d.every.items[slug as keyof typeof d.every.items].name, locale)}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="font-semibold">{d.footer.sister}</p>
              <ul className="mt-2 space-y-1">
                {SISTER_SITES.map((s) => (
                  <li key={s.key}>
                    <a href={s.url} className="hover:underline">
                      {d.footer[s.key]}
                    </a>
                  </li>
                ))}
              </ul>
              <p className="mt-4 flex gap-4">
                <Link href={href(PAGE_PATHS.about)} className="hover:underline">
                  {d.footer.about}
                </Link>
                <Link href={href(PAGE_PATHS.privacy)} className="hover:underline">
                  {d.footer.privacy}
                </Link>
              </p>
            </div>
          </div>
          <p className="mx-auto max-w-5xl px-4 pb-8 text-xs text-slate-500 dark:text-slate-400">
            {d.footer.note} © {SITE_NAME}
          </p>
        </footer>
        <Analytics />
      </body>
    </html>
  );
}
