import { describe, expect, it } from "vitest";
import sitemap from "@/app/sitemap";
import robots from "@/app/robots";
import { staticMetadata } from "@/components/pages/StaticPages";
import { everyMetadata } from "@/components/pages/EveryPage";
import { guideMetadata } from "@/components/pages/GuidePage";
import { parseCron } from "@/lib/cron/parse";
import { EVERY_SLUGS } from "@/lib/cron/presets";
import { GUIDES, GUIDE_SLUGS } from "@/lib/guides";
import { LOCALES, localizedPath } from "@/lib/i18n/config";
import { allPaths, HUB_PAGES, PAGE_PATHS } from "@/lib/routes";
import { languageAlternates } from "@/lib/seo";
import { SITE_URL } from "@/lib/site";

describe("routes", () => {
  it("lists 15 static pages, 48 /every/ pages and 14 /guide/ pages", () => {
    expect(Object.keys(PAGE_PATHS)).toHaveLength(15);
    expect(EVERY_SLUGS).toHaveLength(48);
    expect(GUIDE_SLUGS).toHaveLength(14);
    expect(allPaths()).toHaveLength(77);
    expect(new Set(allPaths()).size).toBe(77);
  });

  it("guides and hubs only link to pages that exist", () => {
    for (const x of [...GUIDES, ...HUB_PAGES]) {
      for (const s of x.relatedEvery) expect(EVERY_SLUGS).toContain(s);
      for (const s of x.relatedGuides) expect(GUIDE_SLUGS).toContain(s);
      expect(x.relatedEvery.length).toBeGreaterThanOrEqual(3);
      expect(x.relatedGuides.length).toBeGreaterThanOrEqual(2);
      expect(x.relatedDialects.length).toBeGreaterThanOrEqual(1);
    }
  });

  it("guide tool seeds are valid expressions", () => {
    for (const g of GUIDES) expect(() => parseCron(g.expr, g.dialect)).not.toThrow();
  });
});

describe("sitemap", () => {
  const entries = sitemap();
  const urls = entries.map((e) => e.url);

  it("contains every page × 7 locales", () => {
    expect(entries).toHaveLength(539);
    expect(entries).toHaveLength(allPaths().length * LOCALES.length);
    for (const path of allPaths()) {
      for (const l of LOCALES) expect(urls).toContain(`${SITE_URL}${localizedPath(l, path)}`);
    }
  });

  it("uses absolute https URLs only", () => {
    for (const e of entries) {
      expect(e.url).toMatch(/^https:\/\//);
      for (const alt of Object.values(e.alternates?.languages ?? {})) expect(alt).toMatch(/^https:\/\//);
    }
  });

  it("gives every entry 7 language alternates + x-default", () => {
    for (const e of entries) {
      expect(Object.keys(e.alternates?.languages ?? {}).sort()).toEqual([...LOCALES, "x-default"].sort());
    }
  });

  it("robots points to the sitemap", () => {
    expect(robots().sitemap).toBe(`${SITE_URL}/sitemap.xml`);
  });
});

describe("metadata", () => {
  it("hreflang map for a sample page has 7 locales + x-default", () => {
    const langs = languageAlternates("/quartz-cron/");
    expect(Object.keys(langs)).toHaveLength(8);
    expect(langs["x-default"]).toBe(`${SITE_URL}/quartz-cron/`);
    expect(langs.en).toBe(`${SITE_URL}/quartz-cron/`);
    expect(langs.zh).toBe(`${SITE_URL}/zh/quartz-cron/`);
  });

  it("static pages have a self-referencing canonical and hreflang", () => {
    const m = staticMetadata("fr", "aws");
    expect(m.alternates?.canonical).toBe(`${SITE_URL}/fr/aws-cron/`);
    expect(Object.keys(m.alternates?.languages ?? {}).sort()).toEqual([...LOCALES, "x-default"].sort());
  });

  it("landing pages have a self-referencing canonical", () => {
    const m = everyMetadata("ja", "every-hour");
    expect(m.alternates?.canonical).toBe(`${SITE_URL}/ja/every/every-hour/`);
    expect(m.openGraph?.url).toBe(`${SITE_URL}/ja/every/every-hour/`);
  });

  it("guide and hub pages have a self-referencing canonical", () => {
    expect(guideMetadata("de", "cron-timezone").alternates?.canonical).toBe(`${SITE_URL}/de/guide/cron-timezone/`);
    expect(guideMetadata("en", "crontab-examples").alternates?.canonical).toBe(`${SITE_URL}/guide/crontab-examples/`);
    expect(staticMetadata("pt", "k8sExamples").alternates?.canonical).toBe(`${SITE_URL}/pt/kubernetes-cronjob-examples/`);
  });

  it("English canonical lives at the root", () => {
    expect(staticMetadata("en", "home").alternates?.canonical).toBe(`${SITE_URL}/`);
  });
});
