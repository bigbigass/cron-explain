import type { MetadataRoute } from "next";
import { LOCALES, localizedPath } from "@/lib/i18n/config";
import { allPaths } from "@/lib/routes";
import { languageAlternates } from "@/lib/seo";
import { absoluteUrl } from "@/lib/site";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  return allPaths().flatMap((path) =>
    LOCALES.map((locale) => ({
      url: absoluteUrl(localizedPath(locale, path)),
      lastModified,
      changeFrequency: "monthly" as const,
      priority: path === "/" ? 1 : path.startsWith("/every/") ? 0.6 : 0.8,
      alternates: { languages: languageAlternates(path) },
    })),
  );
}
