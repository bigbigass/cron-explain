import type { Metadata } from "next";
import { LOCALES, LOCALE_NAMES, localizedPath } from "@/lib/i18n/config";
import { SITE_NAME, SITE_URL } from "@/lib/site";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: `404 – Page not found | ${SITE_NAME}`,
  robots: { index: false },
};

export default function GlobalNotFound() {
  return (
    <html lang="en">
      <body className="flex min-h-screen items-center justify-center p-6">
        <main className="max-w-md text-center">
          <h1 className="text-3xl font-bold">404 – Page not found</h1>
          <p className="mt-3 text-slate-600 dark:text-slate-400">This page doesn’t exist. Try the cron expression explainer instead:</p>
          <ul className="mt-6 flex flex-wrap justify-center gap-3">
            {LOCALES.map((l) => (
              <li key={l}>
                <a href={localizedPath(l, "/")} lang={l} className="text-indigo-700 hover:underline dark:text-indigo-300">
                  {LOCALE_NAMES[l]}
                </a>
              </li>
            ))}
          </ul>
        </main>
      </body>
    </html>
  );
}
