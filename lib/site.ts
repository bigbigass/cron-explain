export const SITE_NAME = "CronExplain";

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://cronexplain.top").replace(/\/+$/, "");

export function absoluteUrl(path: string): string {
  return `${SITE_URL}${path}`;
}

export const SISTER_SITES = [
  { key: "contrast", url: "https://contrastcheck.top" },
  { key: "aspect", url: "https://aspectratiocalc.top" },
] as const;
