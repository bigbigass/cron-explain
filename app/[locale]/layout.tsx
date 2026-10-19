import type { ReactNode } from "react";
import SiteShell, { rootMetadata, rootViewport } from "@/components/SiteShell";
import { prefixedLocale, prefixedLocaleParams } from "@/lib/i18n/server";

export const metadata = rootMetadata;
export const viewport = rootViewport;
export const dynamicParams = false;

export function generateStaticParams() {
  return prefixedLocaleParams();
}

export default async function LocaleLayout({ children, params }: { children: ReactNode; params: Promise<{ locale: string }> }) {
  return <SiteShell locale={prefixedLocale((await params).locale)}>{children}</SiteShell>;
}
