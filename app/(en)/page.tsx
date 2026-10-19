import { HomePage, staticMetadata } from "@/components/pages/StaticPages";

export const metadata = staticMetadata("en", "home");

export default function Page() {
  return <HomePage locale="en" />;
}
