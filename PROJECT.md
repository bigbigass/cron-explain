# CronExplain — Cron Expression Explainer & Generator (multi-platform)

Slug/repo: `cron-explain` · Target: Vercel `cron-explain.vercel.app` (owner deploys; do not deploy). Free, client-side-only tool site for overseas (Google) SEO. Primary keyword: **cron expression generator/explainer**.

## Core tool
- Paste a cron expression → plain-language description (localized in all 7 languages, not just English) + next 10 run times in the user's local timezone and selectable IANA timezone (use `Intl`, no tz library required; `cron-parser` / `cronstrue` npm packages allowed if MIT and bundled client-side; cronstrue has locales for all 7).
- Dialects: standard 5-field (crontab/Linux), 6-field with seconds, Quartz (Java/Spring, `?`, `L`, `W`, `#`), AWS EventBridge (`cron(0 12 * * ? *)`, year field), GitHub Actions (UTC, min 5-min note), Kubernetes CronJob. Auto-detect dialect with override.
- Visual builder: per-field dropdowns/checkbox grids → expression; presets (every 5 min, hourly, daily midnight, weekdays 9am, first of month, etc.).
- Converter: translate between standard ↔ Quartz ↔ AWS where possible, with warnings when not representable.
- Validation with field-specific error messages. Shareable URL (`?expr=`).
- Logic in `lib/cron/*` with tests: parsing each dialect, next-run computation (DST edge cases using fixed dates), conversion round-trips, invalid input errors.

## Pages (each in 7 locales)
- `/` explainer + builder
- `/quartz-cron/`, `/aws-cron/`, `/github-actions-cron/`, `/kubernetes-cronjob/`, `/spring-cron/` dialect landings
- Programmatic `/every/[slug]/` (every-minute, every-5-minutes, every-15-minutes, every-hour, every-day-at-midnight, every-monday, every-weekday, first-day-of-month, every-sunday-at-3am, ~20 total) with expression for each dialect side by side
- `/cron-syntax-cheatsheet/`, `/about/`, `/privacy/`

## i18n (mandatory)
- Locales: en (default, served at `/`), zh, es, de, fr, ja, pt — served at `/zh/`, `/es/`, `/de/`, `/fr/`, `/ja/`, `/pt/`.
- App Router structure: `app/[locale]/...` with `generateStaticParams` for all locales; English rendered at root via middleware/`proxy` rewrite OR a duplicated root route group (no redirect for `/`). All pages statically generated (SSG), no server runtime needed.
- Dictionaries: `lib/i18n/dictionaries/{locale}.json`, typed via the `en.json` shape; every key must exist in every locale (enforced by a test). Native-quality translations of UI, H1, meta title/description, FAQ, and landing-page copy (not just UI chrome).
- `<html lang>` set per locale. Language switcher in header that keeps the current path.
- Every page: `alternates.languages` in `generateMetadata` producing `<link rel="alternate" hreflang="xx">` for all 7 locales + `x-default` (→ English), and a self-referencing canonical.
- `app/sitemap.ts`: every page × every locale, each entry with `alternates.languages`. `app/robots.ts` pointing to sitemap.
- Base URL from `NEXT_PUBLIC_SITE_URL` (fallback `https://cronexplain.top`).

## SEO
- Unique title (<60 chars) and meta description (<155 chars) per page per locale; OG + Twitter tags; generated OG image via `app/opengraph-image.tsx` (static).
- JSON-LD: `WebApplication` (price 0) on tool pages, `FAQPage` on pages with FAQ, `BreadcrumbList` on landing pages.
- Each page: one H1, 300–700 words of genuinely useful explanatory content below the tool, 4–6 FAQs, internal links to related landing pages.
- Core Web Vitals: no layout shift, tool interactive client component, content server-rendered. Lighthouse SEO/Accessibility ≥ 95.
- Footer: About, Privacy (states all processing is in-browser; Vercel Analytics is cookieless), link to sister sites (ContrastCheck https://contrastcheck.top, Aspect Ratio Calculator https://aspectratiocalc.top).

## Analytics
- `@vercel/analytics` `<Analytics />` in root layout. Custom events via `track()`: `copy_output`, `preset_click`, `locale_switch`.

## Tech
- Next.js (latest, App Router) + TypeScript strict + Tailwind CSS v4, same stack as github.com/bigbigass/contrast-check. Vitest for tests. No backend, no DB, no paid APIs, no external runtime requests. Dark mode via `prefers-color-scheme`.

## Tests (Vitest, `npm test`)
- Core logic unit tests (see feature section) — at least 25 cases.
- i18n test: all locale dictionaries have identical key sets, no empty strings.
- Sitemap test: contains every page × 7 locales, all URLs absolute.
- Metadata test: hreflang map for a sample page has 7 locales + x-default.

## Acceptance
- `npm test` and `npm run build` pass with zero errors; build output shows all routes as static (○/●).
