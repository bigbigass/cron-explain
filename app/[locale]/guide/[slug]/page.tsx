import { GuidePage, guideMetadata } from "@/components/pages/GuidePage";
import { GUIDE_SLUGS } from "@/lib/guides";
import { prefixedLocale } from "@/lib/i18n/server";

type Props = { params: Promise<{ locale: string; slug: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return GUIDE_SLUGS.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props) {
  const { locale, slug } = await params;
  return guideMetadata(prefixedLocale(locale), slug);
}

export default async function Page({ params }: Props) {
  const { locale, slug } = await params;
  return <GuidePage locale={prefixedLocale(locale)} slug={slug} />;
}
