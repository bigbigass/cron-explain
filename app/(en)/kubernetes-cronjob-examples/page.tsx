import { HubPage, staticMetadata } from "@/components/pages/StaticPages";

export const metadata = staticMetadata("en", "k8sExamples");

export default function Page() {
  return <HubPage locale="en" page="k8sExamples" />;
}
