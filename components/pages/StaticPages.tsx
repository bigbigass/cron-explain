import JsonLd from "@/components/JsonLd";
import { getDictionary } from "@/lib/i18n";
import { localizedPath, ucfirst, type Locale } from "@/lib/i18n/config";
import { webApplication } from "@/lib/jsonld";
import { DIALECT_PAGES, everyPath, PAGE_PATHS, type DialectPageKey, type StaticPageKey } from "@/lib/routes";
import { pageMetadata } from "@/lib/seo";
import { absoluteUrl } from "@/lib/site";
import { Breadcrumbs, Faq, PageHeader, Related, Sections, Tool, type EverySlugKey } from "./parts";

type PageKey = Exclude<StaticPageKey, never>;

export function staticMetadata(locale: Locale, key: PageKey) {
  const p = getDictionary(locale).pages[key];
  return pageMetadata({ locale, path: PAGE_PATHS[key], title: p.title, description: p.description });
}

const POPULAR = ["every-5-minutes", "every-hour", "every-day-at-midnight", "every-weekday", "first-day-of-month", "last-day-of-month"];

function everyLinks(locale: Locale, slugs: string[]) {
  const d = getDictionary(locale);
  return slugs.map((slug) => ({
    href: localizedPath(locale, everyPath(slug)),
    label: ucfirst(d.every.items[slug as EverySlugKey].name, locale),
  }));
}

function dialectLinks(locale: Locale, exclude?: DialectPageKey) {
  const d = getDictionary(locale);
  return DIALECT_PAGES.filter((p) => p.key !== exclude).map((p) => ({
    href: localizedPath(locale, PAGE_PATHS[p.key]),
    label: d.pages[p.key].h1,
  }));
}

export function HomePage({ locale }: { locale: Locale }) {
  const d = getDictionary(locale);
  const p = d.pages.home;
  return (
    <>
      <PageHeader h1={p.h1} intro={p.intro} />
      <Tool locale={locale} expr="*/15 9-17 * * 1-5" />
      <article className="mt-4">
        <Sections sections={p.sections} />
        <Faq locale={locale} title={d.common.faqTitle} faq={p.faq} />
        <Related
          title={d.common.related}
          links={[
            ...dialectLinks(locale),
            { href: localizedPath(locale, PAGE_PATHS.cheatsheet), label: d.pages.cheatsheet.h1 },
            ...everyLinks(locale, POPULAR),
          ]}
        />
      </article>
      <JsonLd data={webApplication(locale, p.h1, absoluteUrl(localizedPath(locale, "/")), p.description)} />
    </>
  );
}

export function DialectPage({ locale, page }: { locale: Locale; page: DialectPageKey }) {
  const d = getDictionary(locale);
  const p = d.pages[page];
  const cfg = DIALECT_PAGES.find((x) => x.key === page)!;
  const path = PAGE_PATHS[page];
  return (
    <>
      <PageHeader h1={p.h1} intro={p.intro}>
        <Breadcrumbs locale={locale} trail={[{ name: d.common.dialectNames[cfg.dialect], path }]} />
      </PageHeader>
      <Tool locale={locale} expr={cfg.example} dialect={cfg.dialect} />
      <article className="mt-4">
        <Sections sections={p.sections} />
        <Faq locale={locale} title={d.common.faqTitle} faq={p.faq} />
        <Related
          title={d.common.related}
          links={[
            { href: localizedPath(locale, "/"), label: d.pages.home.h1 },
            ...dialectLinks(locale, page),
            { href: localizedPath(locale, PAGE_PATHS.cheatsheet), label: d.pages.cheatsheet.h1 },
            ...everyLinks(locale, POPULAR.slice(0, 4)),
          ]}
        />
      </article>
      <JsonLd data={webApplication(locale, p.h1, absoluteUrl(localizedPath(locale, path)), p.description)} />
    </>
  );
}

function Table({ head, rows, mono = [] }: { head: string[]; rows: string[][]; mono?: number[] }) {
  return (
    <div className="mt-3 overflow-x-auto rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
      <table className="w-full text-left text-sm">
        <thead className="bg-slate-50 dark:bg-slate-800/60">
          <tr>
            {head.map((h) => (
              <th key={h} scope="col" className="px-3 py-2 font-semibold">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.join("|")} className="border-t border-slate-100 dark:border-slate-800">
              {r.map((c, i) => (
                <td key={i} className={`px-3 py-2 ${mono.includes(i) ? "font-mono" : ""}`}>
                  {c}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function CheatsheetPage({ locale }: { locale: Locale }) {
  const d = getDictionary(locale);
  const p = d.pages.cheatsheet;
  return (
    <>
      <PageHeader h1={p.h1} intro={p.intro}>
        <Breadcrumbs locale={locale} trail={[{ name: d.nav.cheatsheet, path: PAGE_PATHS.cheatsheet }]} />
      </PageHeader>
      <article>
        <section>
          <h2 className="text-xl font-semibold">{p.fieldsTitle}</h2>
          <Table head={p.fieldsHead} rows={p.fields} mono={[1]} />
        </section>
        <section className="mt-8">
          <h2 className="text-xl font-semibold">{p.symbolsTitle}</h2>
          <Table head={p.symbolsHead} rows={p.symbols} mono={[0]} />
        </section>
        <section className="mt-8">
          <h2 className="text-xl font-semibold">{p.macrosTitle}</h2>
          <Table head={[p.macrosTitle, d.common.dialectNames.standard]} rows={p.macros} mono={[0, 1]} />
        </section>
        <Sections sections={p.sections} />
        <Faq locale={locale} title={d.common.faqTitle} faq={p.faq} />
        <Related
          title={d.common.related}
          links={[{ href: localizedPath(locale, "/"), label: d.pages.home.h1 }, ...dialectLinks(locale), ...everyLinks(locale, POPULAR)]}
        />
      </article>
    </>
  );
}

export function InfoPage({ locale, page }: { locale: Locale; page: "about" | "privacy" }) {
  const d = getDictionary(locale);
  const p = d.pages[page];
  return (
    <>
      <PageHeader h1={p.h1} intro={p.intro}>
        <Breadcrumbs locale={locale} trail={[{ name: d.footer[page], path: PAGE_PATHS[page] }]} />
      </PageHeader>
      <article>
        <Sections sections={p.sections} />
        <Faq locale={locale} title={d.common.faqTitle} faq={p.faq} />
        <Related
          title={d.common.related}
          links={[
            { href: localizedPath(locale, "/"), label: d.pages.home.h1 },
            { href: localizedPath(locale, PAGE_PATHS.cheatsheet), label: d.pages.cheatsheet.h1 },
            { href: localizedPath(locale, PAGE_PATHS[page === "about" ? "privacy" : "about"]), label: d.pages[page === "about" ? "privacy" : "about"].h1 },
          ]}
        />
      </article>
    </>
  );
}
