import { InfoPage, staticMetadata } from "@/components/pages/StaticPages";
import { prefixedLocale } from "@/lib/i18n/server";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props) {
  return staticMetadata(prefixedLocale((await params).locale), "about");
}

export default async function Page({ params }: Props) {
  return <InfoPage locale={prefixedLocale((await params).locale)} page="about" />;
}
