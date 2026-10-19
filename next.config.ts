import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  trailingSlash: true,
  // English and the prefixed locales use separate root layouts, so the 404 page needs its own document.
  experimental: { globalNotFound: true },
};

export default nextConfig;
