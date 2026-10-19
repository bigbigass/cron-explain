import Link from "next/link";
import type { ReactNode } from "react";
import CronTool from "@/components/CronTool";
import JsonLd from "@/components/JsonLd";
import { PRESET_SLUGS } from "@/lib/cron/presets";
import type { Dialect } from "@/lib/cron/types";
import { getDictionary, type Dictionary } from "@/lib/i18n";
import { localizedPath, ucfirst, type Locale } from "@/lib/i18n/config";
import { breadcrumbList, faqPage } from "@/lib/jsonld";
import { absoluteUrl } from "@/lib/site";

export type EverySlugKey = keyof Dictionary["every"]["items"];

export interface Section {
  h: string;
  p: string[];
}

export function Sections({ sections }: { sections: Section[] }) {
  return (
    <>
      {sections.map((s) => (
        <section key={s.h} className="mt-8">
          <h2 className="text-xl font-semibold">{s.h}</h2>
          {s.p.map((p, i) => (
            <p key={i} className="mt-3 leading-relaxed text-slate-700 dark:text-slate-300">
              {p}
            </p>
          ))}
        </section>
      ))}
    </>
  );
}

export function Faq({ locale, title, faq }: { locale: Locale; title: string; faq: { q: string; a: string }[] }) {
  return (
    <section className="mt-10" aria-labelledby="faq">
      <h2 id="faq" className="text-xl font-semibold">
        {title}
      </h2>
      <dl className="mt-4 space-y-3">
        {faq.map((f) => (
          <div key={f.q} className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
            <dt className="font-medium">{f.q}</dt>
            <dd className="mt-1 text-slate-700 dark:text-slate-300">{f.a}</dd>
          </div>
        ))}
      </dl>
      <JsonLd data={faqPage(locale, faq)} />
    </section>
  );
}

export function Related({ title, links }: { title: string; links: { href: string; label: string }[] }) {
  return (
    <nav className="mt-10" aria-labelledby="related">
      <h2 id="related" className="text-xl font-semibold">
        {title}
      </h2>
      <ul className="mt-3 grid gap-2 sm:grid-cols-2">
        {links.map((l) => (
          <li key={l.href}>
            <Link href={l.href} className="text-indigo-700 hover:underline dark:text-indigo-300">
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

/** Visible breadcrumb + BreadcrumbList JSON-LD. `trail` excludes Home. */
export function Breadcrumbs({ locale, trail }: { locale: Locale; trail: { name: string; path: string }[] }) {
  const d = getDictionary(locale);
  const items = [{ name: d.common.home, path: "/" }, ...trail];
  return (
    <>
      <nav aria-label="Breadcrumb" className="mb-4 text-sm text-slate-500 dark:text-slate-400">
        <ol className="flex flex-wrap gap-1">
          {items.map((it, i) => (
            <li key={it.path} className="flex gap-1">
              {i > 0 && <span aria-hidden="true">/</span>}
              {i < items.length - 1 ? (
                <Link href={localizedPath(locale, it.path)} className="hover:underline">
                  {it.name}
                </Link>
              ) : (
                <span aria-current="page">{it.name}</span>
              )}
            </li>
          ))}
        </ol>
      </nav>
      <JsonLd data={breadcrumbList(items.map((it) => ({ name: it.name, url: absoluteUrl(localizedPath(locale, it.path)) })))} />
    </>
  );
}

export function Tool({ locale, expr, dialect = "auto" }: { locale: Locale; expr: string; dialect?: Dialect | "auto" }) {
  const d = getDictionary(locale);
  const presets = PRESET_SLUGS.map((slug) => ({
    slug,
    label: ucfirst(d.every.items[slug as EverySlugKey].name, locale),
  }));
  return <CronTool locale={locale} t={d.tool} common={d.common} initialExpr={expr} initialDialect={dialect} presets={presets} />;
}

export function PageHeader({ h1, intro, children }: { h1: string; intro: string; children?: ReactNode }) {
  return (
    <header className="mb-6">
      {children}
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{h1}</h1>
      <p className="mt-3 max-w-3xl text-lg text-slate-700 dark:text-slate-300">{intro}</p>
    </header>
  );
}
