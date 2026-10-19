import { EveryPage, everyMetadata } from "@/components/pages/EveryPage";
import { EVERY_SLUGS } from "@/lib/cron/presets";

type Props = { params: Promise<{ slug: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return EVERY_SLUGS.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props) {
  return everyMetadata("en", (await params).slug);
}

export default async function Page({ params }: Props) {
  return <EveryPage locale="en" slug={(await params).slug} />;
}
