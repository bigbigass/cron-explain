import { renderOgImage } from "@/components/OgImage";

// Served as a static PNG at /opengraph-image/ and referenced explicitly from every page's metadata.
// (A file-convention opengraph-image.tsx can't be shared across the two root layouts without per-group URLs.)
export const dynamic = "force-static";

export function GET() {
  return renderOgImage();
}
