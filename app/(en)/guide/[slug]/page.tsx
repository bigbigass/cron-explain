import { GuidePage, guideMetadata } from "@/components/pages/GuidePage";
import { GUIDE_SLUGS } from "@/lib/guides";

type Props = { params: Promise<{ slug: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return GUIDE_SLUGS.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props) {
  return guideMetadata("en", (await params).slug);
}

export default async function Page({ params }: Props) {
  return <GuidePage locale="en" slug={(await params).slug} />;
}
