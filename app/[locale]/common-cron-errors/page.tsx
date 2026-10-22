import { HubPage, staticMetadata } from "@/components/pages/StaticPages";
import { prefixedLocale } from "@/lib/i18n/server";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props) {
  return staticMetadata(prefixedLocale((await params).locale), "commonCronErrors");
}

export default async function Page({ params }: Props) {
  return <HubPage locale={prefixedLocale((await params).locale)} page="commonCronErrors" />;
}
