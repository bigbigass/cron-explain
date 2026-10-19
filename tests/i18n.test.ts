import { describe, expect, it } from "vitest";
import { EVERY } from "@/lib/cron/presets";
import { dictionaries } from "@/lib/i18n";
import { interpolate, LOCALES, localizedPath, splitLocale } from "@/lib/i18n/config";
import { everyData } from "@/components/pages/EveryPage";

type Json = string | number | boolean | null | Json[] | { [k: string]: Json };

function flatten(value: Json, prefix = "", out: Record<string, string> = {}): Record<string, string> {
  if (Array.isArray(value)) value.forEach((v, i) => flatten(v, `${prefix}[${i}]`, out));
  else if (value !== null && typeof value === "object")
    for (const [k, v] of Object.entries(value)) flatten(v, prefix ? `${prefix}.${k}` : k, out);
  else out[prefix] = String(value);
  return out;
}

const flat = Object.fromEntries(LOCALES.map((l) => [l, flatten(dictionaries[l] as unknown as Json)]));
const enKeys = Object.keys(flat.en).sort();
const placeholders = (s: string) => (s.match(/\{\w+\}/g) ?? []).sort();

describe("dictionaries", () => {
  it.each(LOCALES)("%s has exactly the same keys as en", (l) => {
    expect(Object.keys(flat[l]).sort()).toEqual(enKeys);
  });

  it.each(LOCALES)("%s has no empty strings", (l) => {
    const empty = Object.entries(flat[l]).filter(([, v]) => v.trim() === "");
    expect(empty).toEqual([]);
  });

  it.each(LOCALES.filter((l) => l !== "en"))("%s keeps every {placeholder} of en", (l) => {
    const mismatched = enKeys.filter((k) => placeholders(flat.en[k]).join() !== placeholders(flat[l][k]).join());
    expect(mismatched).toEqual([]);
  });

  it.each(LOCALES.filter((l) => l !== "en"))("%s is actually translated", (l) => {
    const prose = enKeys.filter((k) => /(sections|faq|intro|useCase|description)/.test(k));
    const same = prose.filter((k) => flat[l][k] === flat.en[k]);
    expect(same).toEqual([]);
  });

  it("has copy for every /every/ landing page", () => {
    for (const l of LOCALES) {
      expect(Object.keys(dictionaries[l].every.items).sort()).toEqual(EVERY.map((e) => e.slug).sort());
    }
  });
});

describe("SEO copy lengths", () => {
  const pageKeys = Object.keys(dictionaries.en.pages) as (keyof typeof dictionaries.en.pages)[];

  it.each(LOCALES)("%s: static page titles < 60 and descriptions < 155 chars", (l) => {
    for (const k of pageKeys) {
      const p = dictionaries[l].pages[k];
      expect(p.title.length, `${l} ${k} title: ${p.title}`).toBeLessThan(60);
      expect(p.description.length, `${l} ${k} description`).toBeLessThan(155);
    }
  });

  it.each(LOCALES)("%s: /every/ titles < 60 and descriptions < 155 chars", (l) => {
    for (const e of EVERY) {
      const { d, vars } = everyData(l, e.slug);
      const title = interpolate(d.every.title, vars);
      const description = interpolate(d.every.description, vars);
      expect(title.length, `${l} ${e.slug}: ${title}`).toBeLessThan(60);
      expect(description.length, `${l} ${e.slug}: ${description}`).toBeLessThan(155);
    }
  });

  it("titles are unique per locale", () => {
    for (const l of LOCALES) {
      const titles = [
        ...pageKeys.map((k) => dictionaries[l].pages[k].title),
        ...EVERY.map((e) => {
          const { d, vars } = everyData(l, e.slug);
          return interpolate(d.every.title, vars);
        }),
      ];
      expect(new Set(titles).size).toBe(titles.length);
    }
  });
});

describe("locale paths", () => {
  it("prefixes every locale except English", () => {
    expect(localizedPath("en", "/aws-cron/")).toBe("/aws-cron/");
    expect(localizedPath("ja", "/aws-cron/")).toBe("/ja/aws-cron/");
  });

  it("splits a pathname into locale and path", () => {
    expect(splitLocale("/de/every/every-hour/")).toEqual({ locale: "de", path: "/every/every-hour/" });
    expect(splitLocale("/zh")).toEqual({ locale: "zh", path: "/" });
    expect(splitLocale("/every/every-hour/")).toEqual({ locale: "en", path: "/every/every-hour/" });
    expect(splitLocale("/")).toEqual({ locale: "en", path: "/" });
  });
});
