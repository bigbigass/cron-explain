import { HubPage, staticMetadata } from "@/components/pages/StaticPages";

export const metadata = staticMetadata("en", "springExamples");

export default function Page() {
  return <HubPage locale="en" page="springExamples" />;
}
