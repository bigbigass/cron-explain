# Week-1 SEO Landing Page Expansion — SPEC for Claude Code

**Status:** Ready to implement. Do **not** deploy to Vercel. Do **not** buy domains.  
**Repo:** `/workspace/cron-explain` (live: https://cronexplain.top)  
**Owner rule:** Assistants research + write this SPEC only; **Claude Code / Grok Build** write application code.  
**Primary locale:** English first (copy quality). Then mirror all 7 locales (en, zh, es, de, fr, ja, pt) with native-quality translations — same rule as PROJECT.md.

---

## 0. Current inventory (live sitemap, 2026-10-22)

Fetched `https://cronexplain.top/sitemap.xml` (203 `<loc>` URLs).

| Category | Unique EN paths | ×7 locales | Notes |
| --- | ---: | ---: | --- |
| Home `/` | 1 | 7 | Tool + builder |
| Dialect landings | 5 | 35 | quartz, aws, github-actions, kubernetes, spring |
| `/every/[slug]/` schedules | 20 | 140 | See list below |
| Cheatsheet | 1 | 7 | `/cron-syntax-cheatsheet/` |
| About / Privacy | 2 | 14 | |
| **Total** | **29** | **203** | Matches README |

**Existing `/every/` slugs (do not recreate):**  
`every-minute`, `every-5-minutes`, `every-10-minutes`, `every-15-minutes`, `every-30-minutes`, `every-hour`, `every-2-hours`, `every-6-hours`, `every-12-hours`, `every-day-at-midnight`, `every-day-at-noon`, `every-day-at-9am`, `every-monday`, `every-weekday`, `every-weekend`, `every-sunday-at-3am`, `first-day-of-month`, `last-day-of-month`, `every-quarter`, `every-year`.

**Sister benchmark:** aspectratiocalc.top ≈ 387 sitemap URLs (more programmatic density). Goal: grow cronexplain toward that order of magnitude with **distinct intent**, not thin duplicates.

---

## 1. Goal (Week 1)

Add **48 new English path bases** (high-intent SEO landings) that are **not** in the current sitemap:

| Batch | Count | Route pattern | Effort |
| --- | ---: | --- | --- |
| A — more schedule pages | 28 | Extend `/every/[slug]/` | Lowest (reuse `EveryPage`) |
| B — guide / explainer pages | 14 | New `/guide/[slug]/` | Medium (new template) |
| C — FAQ / error / compare hubs | 6 | New top-level static paths | Medium (like cheatsheet) |
| **Total new EN paths** | **48** | | |
| After i18n | **+336** sitemap URLs | 48 × 7 | |
| **Expected sitemap total** | **539** | 29+48 = 77 paths × 7 | |

Each page must have: unique search intent, unique H1/title/description, 300–700 words useful body (or equivalent via sections), 4–6 FAQs where the template supports FAQ, internal links to related `/every/`, dialect, cheatsheet, and sibling guides. No keyword-spam near-duplicates (e.g. do not add both `every-day-at-9:00` and `every-day-at-9am`).

---

## 2. Existing patterns to follow (read these first)

| Concern | Canonical files |
| --- | --- |
| Spec / product rules | `PROJECT.md`, `BUILD.md`, `README.md` |
| Every-schedule data | `lib/cron/presets.ts` (`EVERY`, `EVERY_SLUGS`, `getEvery`) |
| Route registry / sitemap inputs | `lib/routes.ts` (`PAGE_PATHS`, `allPaths`, `everyPath`) |
| Every page UI + metadata | `components/pages/EveryPage.tsx` |
| Dialect / home / cheatsheet / about | `components/pages/StaticPages.tsx` |
| Shared chrome (Sections, Faq, Related, Breadcrumbs, Tool) | `components/pages/parts.tsx` |
| EN route shells | `app/(en)/every/[slug]/page.tsx`, `app/(en)/quartz-cron/page.tsx`, … |
| Prefixed locales | `app/[locale]/…` mirrors (same components, `locale` param) |
| Dictionaries | `lib/i18n/dictionaries/{en,zh,es,de,fr,ja,pt}.json` — **identical key sets** |
| SEO helpers | `lib/seo.ts`, `lib/jsonld.ts`, `app/sitemap.ts`, `app/robots.ts` |
| Tests that encode counts | `tests/seo.test.ts` (currently asserts 9 static + 20 every = 29), `tests/i18n.test.ts` |

**Every-page template (keep):**

- Data: `{ slug, expr, dialect }` in `EVERY`.
- Copy: shared `every.title` / `h1` / `description` / `sections` / `faq` with `{name,expr,…}` interpolation; per-slug `every.items[slug].{name,useCase}`.
- UI: dialect conversion table → `<Tool>` → sections → FAQ → Related (neighbour every + dialects + cheatsheet).
- Routes: thin `page.tsx` in both `(en)` and `[locale]` calling `EveryPage` / `everyMetadata`.
- `generateStaticParams` from `EVERY_SLUGS`; `dynamicParams = false`.

**Dialect/static template (keep for Batch C):**  
`PAGE_PATHS` + `d.pages[key]` with `title`, `description`, `h1`, `intro`, `sections[]`, `faq[]` → `DialectPage`-like or new `GuideStaticPage`.

---

## 3. Batch A — 28 new `/every/[slug]/` pages

### 3.1 Implementation steps

1. Append 28 entries to `EVERY` in `lib/cron/presets.ts` (expressions below). Prefer `dialect: "standard"` unless the schedule needs Quartz-only features (`L`, `#`, `?` on day-of-week/month).
2. Add matching `every.items.<slug>.{ name, useCase }` in **all 7** dictionaries (EN first, then translate).
3. No new React page files required if `generateStaticParams` already maps `EVERY_SLUGS`.
4. Update `tests/seo.test.ts` expected counts (`EVERY_SLUGS` length 48 = 20+28; `allPaths()` 77 = 29+48 once B+C land — or update stepwise).
5. Optionally extend `PRESET_SLUGS` / `POPULAR` in `StaticPages.tsx` with 2–3 new high-traffic slugs (e.g. `every-monday-at-9am`, `twice-a-day`) for internal linking — not required for acceptance.

### 3.2 Page list (slug → expr → dialect → EN title intent)

| # | slug | expr | dialect | Primary intent (EN title angle) |
| ---: | --- | --- | --- | --- |
| 1 | `every-2-minutes` | `*/2 * * * *` | standard | Cron for every 2 minutes |
| 2 | `every-3-minutes` | `*/3 * * * *` | standard | Cron for every 3 minutes |
| 3 | `every-20-minutes` | `*/20 * * * *` | standard | Cron for every 20 minutes |
| 4 | `every-45-minutes` | `*/45 * * * *` | standard | Cron for every 45 minutes |
| 5 | `every-3-hours` | `0 */3 * * *` | standard | Cron for every 3 hours |
| 6 | `every-4-hours` | `0 */4 * * *` | standard | Cron for every 4 hours |
| 7 | `every-8-hours` | `0 */8 * * *` | standard | Cron for every 8 hours |
| 8 | `every-day-at-1am` | `0 1 * * *` | standard | Cron every day at 1 AM |
| 9 | `every-day-at-2am` | `0 2 * * *` | standard | Cron every day at 2 AM (backup window) |
| 10 | `every-day-at-3am` | `0 3 * * *` | standard | Cron every day at 3 AM |
| 11 | `every-day-at-6am` | `0 6 * * *` | standard | Cron every day at 6 AM |
| 12 | `every-day-at-8am` | `0 8 * * *` | standard | Cron every day at 8 AM |
| 13 | `every-day-at-10pm` | `0 22 * * *` | standard | Cron every day at 10 PM |
| 14 | `every-tuesday` | `0 0 * * 2` | standard | Cron every Tuesday |
| 15 | `every-wednesday` | `0 0 * * 3` | standard | Cron every Wednesday |
| 16 | `every-thursday` | `0 0 * * 4` | standard | Cron every Thursday |
| 17 | `every-friday` | `0 0 * * 5` | standard | Cron every Friday |
| 18 | `every-saturday` | `0 0 * * 6` | standard | Cron every Saturday |
| 19 | `every-sunday` | `0 0 * * 0` | standard | Cron every Sunday (note 0 vs 7 in FAQ via shared template) |
| 20 | `every-monday-at-9am` | `0 9 * * 1` | standard | Cron every Monday at 9 AM |
| 21 | `every-friday-at-5pm` | `0 17 * * 5` | standard | Cron every Friday at 5 PM |
| 22 | `every-weekday-at-8am` | `0 8 * * 1-5` | standard | Cron weekdays at 8 AM |
| 23 | `every-weekday-at-midnight` | `0 0 * * 1-5` | standard | Cron weekdays at midnight |
| 24 | `every-hour-on-weekdays` | `0 * * * 1-5` | standard | Cron every hour on weekdays |
| 25 | `twice-a-day` | `0 0,12 * * *` | standard | Cron twice a day (midnight & noon) |
| 26 | `every-15th-of-month` | `0 0 15 * *` | standard | Cron on the 15th of every month |
| 27 | `first-monday-of-month` | `0 0 ? * 2#1` | quartz | First Monday of month (Quartz `#`) |
| 28 | `second-sunday-of-month` | `0 0 ? * 1#2` | quartz | Second Sunday of month (Quartz `#`) |

**Name / useCase guidance (EN):**  
- `name`: short phrase used inside existing templates (e.g. `"every 2 minutes"`, `"the first Monday of the month"`).  
- `useCase`: 1–2 sentences on *why* people schedule this (monitoring, payroll, weekly reports, DST-safe backups, etc.) — must differ per slug.

**Do not add** near-duplicates of existing pages (e.g. `every-day-at-9:00`, `weekdays-at-9am` when `every-weekday` already is `0 9 * * 1-5`).

---

## 4. Batch B — 14 new `/guide/[slug]/` pages

### 4.1 Why a new pattern

Guides need **unique body sections per slug** (not one shared interpolated template). Mirror the every-route mechanics but with richer dictionary items.

### 4.2 Files to create / touch

| Action | Path |
| --- | --- |
| Create | `lib/guides.ts` — `GUIDES: { slug, relatedEvery?: string[], relatedDialects?: DialectPageKey[] }[]`, `GUIDE_SLUGS`, `getGuide` |
| Create | `components/pages/GuidePage.tsx` — `guideMetadata`, `GuidePage` (PageHeader + optional Tool with a sensible default expr + Sections + Faq + Related + JsonLd WebApplication + BreadcrumbList) |
| Create | `app/(en)/guide/[slug]/page.tsx` |
| Create | `app/[locale]/guide/[slug]/page.tsx` |
| Edit | `lib/routes.ts` — add `guidePath(slug)`, include `GUIDE_SLUGS.map(guidePath)` in `allPaths()` |
| Edit | All 7 dictionaries — add top-level `guides: { items: { [slug]: GuideItem } }` (plus any shared chrome strings if needed) |
| Edit | `tests/seo.test.ts`, `tests/i18n.test.ts` as needed |
| Edit | Footer / Related on home & cheatsheet: link 3–5 popular guides (optional but recommended) |

### 4.3 `GuideItem` dictionary shape (per slug, all locales)

```ts
{
  name: string;          // short nav label
  title: string;         // <60 chars
  description: string;   // <155 chars
  h1: string;
  intro: string;         // 1–2 sentences under H1
  defaultExpr?: string;  // optional Tool seed, e.g. "0 9 * * 1-5"
  defaultDialect?: string; // "standard" | "quartz" | … | omit for auto
  sections: { h: string; p: string[] }[];  // 3–5 sections, total ~300–700 words EN
  faq: { q: string; a: string }[];         // 4–6 items
}
```

Reuse `pageMetadata`, `Sections`, `Faq`, `Related`, `Breadcrumbs`, `Tool`, `webApplication` from existing code. Breadcrumb trail: Home → this guide. **No separate guides index required in Week 1.**

### 4.4 Guide page list

| # | slug | EN title (target) | Search intent |
| ---: | --- | --- | --- |
| 1 | `what-is-a-cron-expression` | What Is a Cron Expression? | Beginner definition + 5-field overview |
| 2 | `cron-syntax-explained` | Cron Syntax Explained (Fields & Special Characters) | Field-by-field syntax deep dive (link cheatsheet) |
| 3 | `crontab-examples` | Crontab Examples (Copy-Paste Schedules) | Curated examples hub → link many `/every/` pages |
| 4 | `5-field-vs-6-field-cron` | 5-Field vs 6-Field Cron (With Seconds) | Standard vs seconds-capable formats |
| 5 | `cron-seconds-field` | Cron Seconds Field Explained | When/why 6-field; Quartz/Spring |
| 6 | `cron-special-characters` | Cron Special Characters: star slash comma dash ? L W # | Symbol reference with examples |
| 7 | `cron-question-mark` | What Does ? Mean in Cron? | Quartz/AWS day-of-month vs day-of-week |
| 8 | `cron-day-of-week` | Cron Day of Week: 0–7, SUN–SAT, and Ranges | 0 vs 7 Sunday; MON-FRI |
| 9 | `cron-timezone` | Cron Time Zones: UTC vs Local | Scheduler TZ pitfalls (GitHub UTC, K8s, crontab) |
| 10 | `cron-daylight-saving` | Cron and Daylight Saving Time (DST) | Skipped/repeated hours; how this site handles DST |
| 11 | `how-to-test-a-cron-expression` | How to Test a Cron Expression | Next-run preview, dry-run tips |
| 12 | `linux-crontab-guide` | Linux Crontab Guide: Edit, List, and Debug | crontab -e, user vs system, logs |
| 13 | `cron-every-n-minutes` | How to Run Cron Every N Minutes | */n patterns; link 2/3/5/10/15/20/30-min every pages |
| 14 | `aws-rate-vs-cron` | AWS EventBridge: rate() vs cron() | When to use rate; year field; ? rules |

**Internal linking rules for guides:**  
- Each guide Related block: ≥3 `/every/` links + ≥1 dialect + cheatsheet + ≥2 sibling guides.  
- `crontab-examples` and `cron-every-n-minutes` should be dense hubs into Batch A.

---

## 5. Batch C — 6 top-level FAQ / compare / error hubs

These are **static** pages (unique URL keywords people type). Prefer top-level paths (same style as `/cron-syntax-cheatsheet/`), not under `/guide/`, so SERP URLs stay short.

### 5.1 Implementation steps

1. Extend `StaticPageKey` / `PAGE_PATHS` in `lib/routes.ts` with the 6 paths below.
2. Add `d.pages.<key>` entries in all 7 dictionaries (same shape as `pages.quartz`: title, description, h1, intro, sections, faq).
3. Add thin route files under `app/(en)/<path>/page.tsx` and `app/[locale]/<path>/page.tsx`.
4. Implement via a small reusable component, e.g. export `ContentPage({ locale, page })` in `StaticPages.tsx` (same structure as `DialectPage` but Tool optional — include Tool with a relevant example for error pages).
5. Wire Related links from home, cheatsheet, and dialect pages to these hubs (at least home + cheatsheet).

### 5.2 Page list

| # | path | `PAGE_PATHS` key | EN title (target) | Intent |
| ---: | --- | --- | --- | --- |
| 1 | `/cron-vs-quartz/` | `cronVsQuartz` | Cron vs Quartz: Syntax Differences | Compare 5-field crontab vs Quartz (?, L, #, seconds, year) |
| 2 | `/crontab-vs-github-actions/` | `crontabVsGithub` | Crontab vs GitHub Actions schedule | UTC-only, 5-minute minimum, YAML quotes |
| 3 | `/common-cron-errors/` | `commonCronErrors` | Common Cron Errors and How to Fix Them | Validation failures, out-of-range fields, unreachable schedules |
| 4 | `/cron-invalid-expression/` | `cronInvalid` | Invalid Cron Expression? Debug Checklist | Intent: “cron expression invalid” / parser errors |
| 5 | `/spring-scheduled-examples/` | `springExamples` | Spring @Scheduled Cron Examples | Java/Spring schedules; link `/spring-cron/` + every pages |
| 6 | `/kubernetes-cronjob-examples/` | `k8sExamples` | Kubernetes CronJob Schedule Examples | schedule field; link `/kubernetes-cronjob/` |

**Avoid cannibalizing** existing dialect landings: Batch C pages are **comparison / examples / troubleshooting** hubs that link *to* dialect pages, not replacements.

---

## 6. i18n requirements

1. Locales: **en, zh, es, de, fr, ja, pt** — every new key in every dictionary; empty strings forbidden (`tests/i18n.test.ts`).
2. English is source of truth for meaning; other locales must be **native-quality**, not machine-garbled UI chrome only. Translate titles, descriptions, H1, intros, sections, FAQs, `every.items.*.name/useCase`, guide items.
3. URL slugs stay **English** in all locales (existing convention: `/zh/every/every-5-minutes/`, not translated slugs).
4. Each page: `alternates.languages` for all 7 + `x-default` → English; self-referencing canonical via `pageMetadata`.
5. `<html lang>` already handled by layouts — do not break `(en)` vs `[locale]` split.
6. Title < 60 chars, meta description < 155 chars **per locale** (translate, don’t leave English in zh/ja/etc.).

---

## 7. SEO / content quality bar (non-negotiable)

- One H1; sections as H2; no keyword stuffing.
- FAQPage JSON-LD when FAQ present; WebApplication on tool-bearing pages; BreadcrumbList on landings.
- Internal links: every new page links out; home/cheatsheet gain a few inbound links to new hubs.
- Distinct intent: if two pages would rank for the same head term, merge or drop one.
- Client tool stays SSG; no runtime network; no new paid deps.
- Optional: add 1–2 cron unit tests if new Quartz `#` presets expose convert/describe edge cases (`first-monday-of-month`, `second-sunday-of-month`).

---

## 8. Acceptance criteria

| Check | Pass condition |
| --- | --- |
| Build | `npm test` and `npm run build` pass with zero errors |
| Static | Build output shows new routes as static (○/●); no new server-only routes |
| Counts | `EVERY_SLUGS.length === 48` (20+28); guides 14; new static paths 6; `allPaths().length === 77` |
| Sitemap | `sitemap()` length === `77 * 7 === 539`; all absolute `https://` URLs; each entry 7 hreflang + x-default |
| i18n | All locale dictionaries identical key sets; no empty strings |
| Live file | Do **not** deploy; owner deploys. After owner deploy, live `/sitemap.xml` should list 539 `<loc>` (or document any intentional exclusion) |
| Docs | Update `README.md` page table / route counts to match |
| Git | Commit with clear messages; push to `main` only if BUILD.md session rules say so — **still no Vercel deploy** |

---

## 9. Out of scope (Week 1)

- Writing this SPEC’s application code in a chat assistant session (Claude Code / Grok Build only).
- Deploying, DNS, Search Console submission (owner).
- New locales beyond the 7.
- Translated URL slugs.
- Thin “cron for HH:MM” pages for every hour of the day.
- Competitive “vs crontab.guru” attack pages.
- Blog/MDX system, CMS, or backend.
- Changing core parser behavior except as needed for new Quartz `#` presets.

---

## 10. Suggested Claude Code implementation order

1. Batch A (`presets.ts` + dictionary `every.items` + fix tests for every-count).  
2. Verify `npm test` / build for every-only expansion.  
3. Batch B (`lib/guides.ts` + `GuidePage` + routes + dictionaries + `allPaths`).  
4. Batch C (`PAGE_PATHS` + `ContentPage` + routes + dictionaries).  
5. Cross-link Related/home/cheatsheet; update README counts; final `npm test` && `npm run build`.  
6. Commit; **stop before deploy**.

---

## 11. Blockers / notes for implementer

| Item | Status |
| --- | --- |
| Existing every + dialect + dictionary patterns | Clear; documented above |
| `/guide/` pattern | **New** — must be created (no prior files) |
| Hard-coded test counts | `tests/seo.test.ts` expects 9 static + 20 every — **must update** |
| Live sitemap via some fetch providers | Occasional HTTP 500; `curl` succeeds — not a code blocker |
| License | `cronstrue` MIT already in use; no new license risk expected |
| Duplicate intent risk | Follow “do not add” notes in §3.2; Batch C must link to, not replace, dialect landings |
| Owner deploy | Out of scope |

---

## 12. Quick reference — target URL samples (EN)

```
/every/every-2-minutes/
/every/twice-a-day/
/every/first-monday-of-month/
/guide/what-is-a-cron-expression/
/guide/cron-timezone/
/guide/aws-rate-vs-cron/
/cron-vs-quartz/
/common-cron-errors/
/kubernetes-cronjob-examples/
```

Mirrored e.g. `/zh/guide/cron-timezone/`, `/de/every/twice-a-day/`, etc.

---

**End of SPEC.** Implement exactly this batch unless the owner revises the page list. Prefer dropping a thin page over shipping duplicate intent.
