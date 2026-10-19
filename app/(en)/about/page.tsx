import { InfoPage, staticMetadata } from "@/components/pages/StaticPages";

export const metadata = staticMetadata("en", "about");

export default function Page() {
  return <InfoPage locale="en" page="about" />;
}
