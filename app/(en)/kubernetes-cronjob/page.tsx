import { DialectPage, staticMetadata } from "@/components/pages/StaticPages";

export const metadata = staticMetadata("en", "kubernetes");

export default function Page() {
  return <DialectPage locale="en" page="kubernetes" />;
}
