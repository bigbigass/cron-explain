# CronExplain — Cron Expression Explainer & Generator

Free, client-side-only tool that explains cron expressions in plain language (7 languages), lists the next 10 run times in any IANA time zone, converts between cron dialects and builds expressions visually. Statically generated Next.js site, no backend.

Spec: [PROJECT.md](PROJECT.md) · Build instructions: [BUILD.md](BUILD.md)

## Features

- **Dialects:** standard crontab (5 fields), 6-field with seconds, Quartz (`?`, `L`, `W`, `#`, optional year), Spring `@Scheduled`, AWS EventBridge (`cron(...)`, year field), GitHub Actions (UTC, 5-minute minimum), Kubernetes CronJob (macros). Auto-detection with manual override.
- **Explainer:** localized description (via [cronstrue](https://github.com/bradymholt/cRonstrue), MIT), field-specific validation errors in all 7 languages.
- **Next runs:** computed on wall-clock time in the chosen zone with `Intl` only (no tz library). DST: times in a spring-forward gap are skipped, repeated fall-back times fire once.
- **Converter:** standard ↔ Quartz ↔ AWS ↔ Spring, with an explanation when a schedule is not representable.
- **Visual builder + presets**, shareable URL (`?expr=…&dialect=…&tz=…`).
- **Analytics:** `@vercel/analytics` with custom events `copy_output`, `preset_click`, `locale_switch`.

## Development

```bash
npm install
npm run dev      # http://localhost:3000
npm test         # Vitest (cron logic, i18n, sitemap, metadata)
npm run build    # static production build
```

### Environment

| Variable | Default | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | `https://cronexplain.top` | Absolute base URL for canonical, hreflang, sitemap, robots, OG and JSON-LD |

## Pages

Every page exists in 7 locales: English at the root, others under `/zh/`, `/es/`, `/de/`, `/fr/`, `/ja/`, `/pt/`.

| Path | Content |
| --- | --- |
| `/` | Explainer + builder |
| `/quartz-cron/`, `/aws-cron/`, `/github-actions-cron/`, `/kubernetes-cronjob/`, `/spring-cron/` | Dialect landing pages |
| `/every/[slug]/` | 20 schedule pages (every-minute … every-year) with the expression in every dialect |
| `/cron-syntax-cheatsheet/` | Syntax reference |
| `/about/`, `/privacy/` | About, privacy policy |

29 pages × 7 locales = **203 static pages**, plus `/sitemap.xml`, `/robots.txt`, `/opengraph-image/` and a global 404.

## Structure

```
app/(en)/…            English routes at the root (own root layout, <html lang="en">)
app/[locale]/…        zh/es/de/fr/ja/pt routes (generateStaticParams, dynamicParams = false)
app/sitemap.ts        every page × locale with hreflang alternates
app/robots.ts
app/opengraph-image/  static OG PNG (next/og)
app/global-not-found.tsx
components/           CronTool (client), CronBuilder, LanguageSwitcher, page templates
lib/cron/             parse, schedule (next runs), convert, describe, presets — pure, unit-tested
lib/i18n/             config + dictionaries/{en,zh,es,de,fr,ja,pt}.json (typed from en.json)
lib/seo.ts, lib/jsonld.ts
tests/                i18n, sitemap and metadata tests
```

English is served at `/` through a duplicated route group rather than middleware, so the whole site is static and needs no server runtime. Each page sets a self-referencing canonical, hreflang links for all 7 locales plus `x-default` (English), Open Graph/Twitter tags, and JSON-LD (`WebApplication`, `FAQPage`, `BreadcrumbList`).

## Deploying

Import the repository in Vercel (framework preset: Next.js) and optionally set `NEXT_PUBLIC_SITE_URL`. Vercel Web Analytics must be enabled in the project for the analytics events to be recorded.
