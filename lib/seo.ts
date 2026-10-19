import type { Metadata } from "next";
import { LOCALES, LOCALE_TAGS, localizedPath, type Locale } from "./i18n/config";
import { absoluteUrl, SITE_NAME } from "./site";

export const OG_IMAGE = { url: absoluteUrl("/opengraph-image/"), width: 1200, height: 630, alt: `${SITE_NAME} – cron expression explainer & generator` };

/** hreflang map: all 7 locales + x-default (English), absolute URLs. */
export function languageAlternates(path: string): Record<string, string> {
  const map: Record<string, string> = {};
  for (const l of LOCALES) map[l] = absoluteUrl(localizedPath(l, path));
  map["x-default"] = absoluteUrl(path);
  return map;
}

export function pageMetadata(opts: { locale: Locale; path: string; title: string; description: string }): Metadata {
  const url = absoluteUrl(localizedPath(opts.locale, opts.path));
  return {
    title: { absolute: opts.title },
    description: opts.description,
    alternates: { canonical: url, languages: languageAlternates(opts.path) },
    openGraph: {
      type: "website",
      siteName: SITE_NAME,
      title: opts.title,
      description: opts.description,
      url,
      locale: LOCALE_TAGS[opts.locale].replace("-", "_"),
      images: [OG_IMAGE],
    },
    twitter: { card: "summary_large_image", title: opts.title, description: opts.description, images: [OG_IMAGE.url] },
  };
}
