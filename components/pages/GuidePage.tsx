import { notFound } from "next/navigation";
import JsonLd from "@/components/JsonLd";
import { getGuide } from "@/lib/guides";
import { getDictionary } from "@/lib/i18n";
import { localizedPath, type Locale } from "@/lib/i18n/config";
import { webApplication } from "@/lib/jsonld";
import { guidePath } from "@/lib/routes";
import { pageMetadata } from "@/lib/seo";
import { absoluteUrl } from "@/lib/site";
import { cheatsheetLink, dialectLinks, everyLinks, guideLinks } from "./links";
import { Breadcrumbs, Faq, PageHeader, Related, Sections, Tool, type GuideSlugKey } from "./parts";

/** Config + localized copy for a `/guide/[slug]/` page. */
export function guideData(locale: Locale, slug: string) {
  const g = getGuide(slug);
  if (!g) notFound();
  const d = getDictionary(locale);
  return { g, d, item: d.guides.items[slug as GuideSlugKey] };
}

export function guideMetadata(locale: Locale, slug: string) {
  const { item } = guideData(locale, slug);
  return pageMetadata({ locale, path: guidePath(slug), title: item.title, description: item.description });
}

export function GuidePage({ locale, slug }: { locale: Locale; slug: string }) {
  const { g, d, item } = guideData(locale, slug);
  const path = guidePath(slug);
  return (
    <>
      <PageHeader h1={item.h1} intro={item.intro}>
        <Breadcrumbs locale={locale} trail={[{ name: item.name, path }]} />
      </PageHeader>
      <Tool locale={locale} expr={g.expr} dialect={g.dialect} />
      <article className="mt-4">
        <Sections sections={item.sections} />
        <Faq locale={locale} title={d.common.faqTitle} faq={item.faq} />
        <Related
          title={d.common.related}
          links={[
            ...guideLinks(locale, g.relatedGuides),
            ...everyLinks(locale, g.relatedEvery),
            ...dialectLinks(locale, g.relatedDialects),
            cheatsheetLink(locale),
          ]}
        />
      </article>
      <JsonLd data={webApplication(locale, item.h1, absoluteUrl(localizedPath(locale, path)), item.description)} />
    </>
  );
}
