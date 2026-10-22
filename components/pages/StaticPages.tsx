import JsonLd from "@/components/JsonLd";
import { getDictionary } from "@/lib/i18n";
import { localizedPath, type Locale } from "@/lib/i18n/config";
import { webApplication } from "@/lib/jsonld";
import { DIALECT_PAGES, HUB_PAGES, PAGE_PATHS, type DialectPageKey, type HubPageKey, type StaticPageKey } from "@/lib/routes";
import { pageMetadata } from "@/lib/seo";
import { absoluteUrl } from "@/lib/site";
import { cheatsheetLink, dialectLinks, everyLinks, guideLinks, hubLinks } from "./links";
import { Breadcrumbs, Faq, PageHeader, Related, Sections, Tool } from "./parts";

type PageKey = Exclude<StaticPageKey, never>;

export function staticMetadata(locale: Locale, key: PageKey) {
  const p = getDictionary(locale).pages[key];
  return pageMetadata({ locale, path: PAGE_PATHS[key], title: p.title, description: p.description });
}

const POPULAR = ["every-5-minutes", "every-hour", "every-day-at-midnight", "every-weekday", "first-day-of-month", "last-day-of-month"];

const POPULAR_GUIDES = ["what-is-a-cron-expression", "crontab-examples", "cron-timezone", "how-to-test-a-cron-expression"];
const HUBS: HubPageKey[] = ["cronVsQuartz", "crontabVsGithub", "commonCronErrors"];

/** Comparison / examples hub (or guide) that belongs to each dialect landing. */
const DIALECT_EXTRAS: Record<DialectPageKey, { hubs: HubPageKey[]; guides: string[] }> = {
  quartz: { hubs: ["cronVsQuartz"], guides: ["cron-question-mark"] },
  aws: { hubs: [], guides: ["aws-rate-vs-cron", "cron-question-mark"] },
  github: { hubs: ["crontabVsGithub"], guides: ["cron-timezone"] },
  kubernetes: { hubs: ["k8sExamples"], guides: ["cron-timezone"] },
  spring: { hubs: ["springExamples"], guides: ["cron-seconds-field"] },
};

const allDialects = DIALECT_PAGES.map((p) => p.key);

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
            cheatsheetLink(locale),
            ...everyLinks(locale, POPULAR),
            ...guideLinks(locale, POPULAR_GUIDES),
            ...hubLinks(locale, HUBS),
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
            ...dialectLinks(locale, allDialects.filter((k) => k !== page)),
            cheatsheetLink(locale),
            ...hubLinks(locale, DIALECT_EXTRAS[page].hubs),
            ...guideLinks(locale, DIALECT_EXTRAS[page].guides),
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
          links={[
            { href: localizedPath(locale, "/"), label: d.pages.home.h1 },
            ...dialectLinks(locale),
            ...everyLinks(locale, POPULAR),
            ...guideLinks(locale, ["cron-syntax-explained", "cron-special-characters", "cron-day-of-week", "crontab-examples"]),
            ...hubLinks(locale, HUBS),
          ]}
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
            cheatsheetLink(locale),
            { href: localizedPath(locale, PAGE_PATHS[page === "about" ? "privacy" : "about"]), label: d.pages[page === "about" ? "privacy" : "about"].h1 },
          ]}
        />
      </article>
    </>
  );
}

/** Top-level comparison / examples / troubleshooting hub (Batch C pages). */
export function HubPage({ locale, page }: { locale: Locale; page: HubPageKey }) {
  const d = getDictionary(locale);
  const p = d.pages[page];
  const cfg = HUB_PAGES.find((x) => x.key === page)!;
  const path = PAGE_PATHS[page];
  return (
    <>
      <PageHeader h1={p.h1} intro={p.intro}>
        <Breadcrumbs locale={locale} trail={[{ name: p.name, path }]} />
      </PageHeader>
      <Tool locale={locale} expr={cfg.example} dialect={cfg.dialect} />
      <article className="mt-4">
        <Sections sections={p.sections} />
        <Faq locale={locale} title={d.common.faqTitle} faq={p.faq} />
        <Related
          title={d.common.related}
          links={[
            ...dialectLinks(locale, cfg.relatedDialects),
            cheatsheetLink(locale),
            ...guideLinks(locale, cfg.relatedGuides),
            ...hubLinks(locale, cfg.relatedHubs),
            ...everyLinks(locale, cfg.relatedEvery),
          ]}
        />
      </article>
      <JsonLd data={webApplication(locale, p.h1, absoluteUrl(localizedPath(locale, path)), p.description)} />
    </>
  );
}
