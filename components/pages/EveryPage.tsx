import { notFound } from "next/navigation";
import CopyButton from "@/components/CopyButton";
import JsonLd from "@/components/JsonLd";
import { formatSchedule, type ConvertResult } from "@/lib/cron/convert";
import { describeSchedule } from "@/lib/cron/describe";
import { parseCron } from "@/lib/cron/parse";
import { EVERY, getEvery } from "@/lib/cron/presets";
import { DIALECTS, type Dialect } from "@/lib/cron/types";
import { getDictionary } from "@/lib/i18n";
import { interpolate, localizedPath, ucfirst, type Locale } from "@/lib/i18n/config";
import { webApplication } from "@/lib/jsonld";
import { DIALECT_PAGES, everyPath, PAGE_PATHS } from "@/lib/routes";
import { pageMetadata } from "@/lib/seo";
import { absoluteUrl } from "@/lib/site";
import { Breadcrumbs, Faq, PageHeader, Related, Sections, Tool, type EverySlugKey } from "./parts";

/** All data an `/every/[slug]/` page needs, in one place so metadata and page agree. */
export function everyData(locale: Locale, slug: string) {
  const e = getEvery(slug);
  if (!e) notFound();
  const d = getDictionary(locale);
  const schedule = parseCron(e.expr, e.dialect);
  const conversions = DIALECTS.map((dialect) => [dialect, formatSchedule(schedule, dialect)] as [Dialect, ConvertResult]);
  const get = (dialect: Dialect) => {
    const r = conversions.find(([x]) => x === dialect)![1];
    return r.ok ? r.expression : null;
  };
  const headline = get("standard") ?? e.expr;
  const item = d.every.items[slug as EverySlugKey];
  const vars = {
    name: item.name,
    expr: headline,
    dialect: d.common.dialectNames[e.dialect],
    meaning: describeSchedule(schedule, locale) ?? "",
    standard: get("standard") ?? d.every.unsupported,
    quartz: get("quartz") ?? d.every.unsupported,
    aws: get("aws") ?? d.every.unsupported,
  };
  return { e, d, item, vars, conversions, headline };
}

export function everyMetadata(locale: Locale, slug: string) {
  const { d, vars } = everyData(locale, slug);
  return pageMetadata({
    locale,
    path: everyPath(slug),
    title: interpolate(d.every.title, vars),
    description: interpolate(d.every.description, vars),
  });
}

export function EveryPage({ locale, slug }: { locale: Locale; slug: string }) {
  const { e, d, item, vars, conversions } = everyData(locale, slug);
  const h1 = interpolate(d.every.h1, vars);
  const path = everyPath(slug);
  const idx = EVERY.findIndex((x) => x.slug === slug);
  const neighbours = [1, 2, 3, 4, 5, 6].map((k) => EVERY[(idx + k) % EVERY.length].slug);
  const sections = d.every.sections.map((s) => ({ h: s.h, p: s.p.map((p) => interpolate(p, vars)) }));
  const faq = d.every.faq.map((f) => ({ q: interpolate(f.q, vars), a: interpolate(f.a, vars) }));
  return (
    <>
      <PageHeader h1={h1} intro={item.useCase}>
        <Breadcrumbs locale={locale} trail={[{ name: ucfirst(item.name, locale), path }]} />
      </PageHeader>
      <section aria-labelledby="dialect-table" className="mb-6">
        <h2 id="dialect-table" className="text-xl font-semibold">
          {d.every.tableTitle}
        </h2>
        <div className="mt-3 overflow-x-auto rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/60">
              <tr>
                <th scope="col" className="px-3 py-2 font-semibold">
                  {d.every.tableDialect}
                </th>
                <th scope="col" className="px-3 py-2 font-semibold">
                  {d.every.tableExpr}
                </th>
              </tr>
            </thead>
            <tbody>
              {conversions.map(([dialect, r]) => (
                <tr key={dialect} className="border-t border-slate-100 dark:border-slate-800">
                  <th scope="row" className="px-3 py-2 font-medium">
                    {d.common.dialectNames[dialect]}
                  </th>
                  <td className="px-3 py-2">
                    {r.ok ? (
                      <span className="flex flex-wrap items-center gap-2">
                        <code className="rounded bg-slate-100 px-2 py-0.5 font-mono dark:bg-slate-800">{r.expression}</code>
                        <CopyButton text={r.expression} label={d.tool.copy} copiedLabel={d.tool.copied} kind={`every_${dialect}`} small />
                      </span>
                    ) : (
                      <span className="text-slate-500 dark:text-slate-400">{d.tool.reasons[r.reason]}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <Tool locale={locale} expr={e.expr} dialect={e.dialect === "standard" ? "auto" : e.dialect} />
      <article className="mt-4">
        <Sections sections={sections} />
        <Faq locale={locale} title={d.common.faqTitle} faq={faq} />
        <Related
          title={d.common.related}
          links={[
            ...neighbours.map((s) => ({
              href: localizedPath(locale, everyPath(s)),
              label: ucfirst(d.every.items[s as EverySlugKey].name, locale),
            })),
            ...DIALECT_PAGES.map((p) => ({ href: localizedPath(locale, PAGE_PATHS[p.key]), label: d.pages[p.key].h1 })),
            { href: localizedPath(locale, PAGE_PATHS.cheatsheet), label: d.pages.cheatsheet.h1 },
          ]}
        />
      </article>
      <JsonLd data={webApplication(locale, h1, absoluteUrl(localizedPath(locale, path)), interpolate(d.every.description, vars))} />
    </>
  );
}
