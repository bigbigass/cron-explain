import { DialectPage, staticMetadata } from "@/components/pages/StaticPages";

export const metadata = staticMetadata("en", "github");

export default function Page() {
  return <DialectPage locale="en" page="github" />;
}
