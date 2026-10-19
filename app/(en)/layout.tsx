import type { ReactNode } from "react";
import SiteShell, { rootMetadata, rootViewport } from "@/components/SiteShell";

export const metadata = rootMetadata;
export const viewport = rootViewport;

export default function EnglishLayout({ children }: { children: ReactNode }) {
  return <SiteShell locale="en">{children}</SiteShell>;
}
