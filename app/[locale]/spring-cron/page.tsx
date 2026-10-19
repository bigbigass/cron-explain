import { DialectPage, staticMetadata } from "@/components/pages/StaticPages";
import { prefixedLocale } from "@/lib/i18n/server";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props) {
  return staticMetadata(prefixedLocale((await params).locale), "spring");
}

export default async function Page({ params }: Props) {
  return <DialectPage locale={prefixedLocale((await params).locale)} page="spring" />;
}
