import { EveryPage, everyMetadata } from "@/components/pages/EveryPage";
import { EVERY_SLUGS } from "@/lib/cron/presets";
import { prefixedLocale } from "@/lib/i18n/server";

type Props = { params: Promise<{ locale: string; slug: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return EVERY_SLUGS.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props) {
  const { locale, slug } = await params;
  return everyMetadata(prefixedLocale(locale), slug);
}

export default async function Page({ params }: Props) {
  const { locale, slug } = await params;
  return <EveryPage locale={prefixedLocale(locale)} slug={slug} />;
}
