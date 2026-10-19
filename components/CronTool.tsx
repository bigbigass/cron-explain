"use client";

import { track } from "@vercel/analytics";
import { useEffect, useMemo, useState } from "react";
import { convertCron, formatSchedule, type ConvertResult } from "@/lib/cron/convert";
import { describeSchedule } from "@/lib/cron/describe";
import { detectDialect, parseCron } from "@/lib/cron/parse";
import { getEvery } from "@/lib/cron/presets";
import { isValidTimeZone, nextRuns } from "@/lib/cron/schedule";
import { CronError, DIALECTS, type CronSchedule, type Dialect } from "@/lib/cron/types";
import { interpolate, LOCALE_TAGS, type Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n";
import CopyButton from "./CopyButton";
import CronBuilder from "./CronBuilder";

const CONVERT_TARGETS: Dialect[] = ["standard", "quartz", "aws", "spring"];
const UTC_DIALECTS: Dialect[] = ["github", "aws"];
const RUN_COUNT = 10;

export interface Preset {
  slug: string;
  label: string;
}

interface Props {
  locale: Locale;
  t: Dictionary["tool"];
  common: Dictionary["common"];
  initialExpr: string;
  initialDialect?: Dialect | "auto";
  presets: Preset[];
}

type Analysis =
  | { ok: true; schedule: CronSchedule; description: string | null; conversions: [Dialect, ConvertResult][] }
  | { ok: false; message: string };

function localTimeZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return "UTC";
  }
}

export default function CronTool({ locale, t, common, initialExpr, initialDialect = "auto", presets }: Props) {
  const [expr, setExpr] = useState(initialExpr);
  const [dialectChoice, setDialectChoice] = useState<Dialect | "auto">(initialDialect);
  const [tz, setTz] = useState("UTC");
  const [localTz, setLocalTz] = useState("UTC");
  const [zones, setZones] = useState<string[]>(["UTC"]);
  const [now, setNow] = useState<number | null>(null);
  const [ready, setReady] = useState(false);

  const effectiveDialect: Dialect = dialectChoice === "auto" ? detectDialect(expr) : dialectChoice;

  // Read shareable state from the URL and browser-only values after mount (keeps SSR output deterministic).
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const qExpr = params.get("expr");
    const qDialect = params.get("dialect");
    const qTz = params.get("tz");
    const startExpr = qExpr ?? initialExpr;
    const startDialect =
      qDialect && (DIALECTS as readonly string[]).includes(qDialect) ? (qDialect as Dialect) : qExpr ? "auto" : initialDialect;
    const local = localTimeZone();
    const resolved = startDialect === "auto" ? detectDialect(startExpr) : startDialect;
    let list: string[] = [];
    try {
      list = Intl.supportedValuesOf("timeZone");
    } catch {
      list = [];
    }
    if (!list.includes("UTC")) list = ["UTC", ...list];
    if (!list.includes(local)) list = [local, ...list];
    /* eslint-disable react-hooks/set-state-in-effect -- one-time hydration from URL / browser APIs */
    setExpr(startExpr);
    setDialectChoice(startDialect);
    setLocalTz(local);
    setZones(list);
    setTz(qTz && isValidTimeZone(qTz) ? qTz : UTC_DIALECTS.includes(resolved) ? "UTC" : local);
    setNow(Date.now());
    setReady(true);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [initialExpr, initialDialect]);

  // Keep the URL shareable.
  useEffect(() => {
    if (!ready) return;
    const params = new URLSearchParams();
    params.set("expr", expr);
    if (dialectChoice !== "auto") params.set("dialect", dialectChoice);
    if (tz !== localTz) params.set("tz", tz);
    window.history.replaceState(null, "", `${window.location.pathname}?${params.toString()}`);
  }, [ready, expr, dialectChoice, tz, localTz]);

  const analysis: Analysis = useMemo(() => {
    try {
      const schedule = parseCron(expr, effectiveDialect);
      const conversions = CONVERT_TARGETS.filter((d) => d !== effectiveDialect).map(
        (d) => [d, formatSchedule(schedule, d)] as [Dialect, ConvertResult],
      );
      return { ok: true, schedule, description: describeSchedule(schedule, locale), conversions };
    } catch (e) {
      if (!(e instanceof CronError)) throw e;
      const vars: Record<string, string | number> = { ...e.params };
      if (e.field) vars.field = common.fieldNames[e.field];
      return { ok: false, message: interpolate(t.errors[e.code], vars) };
    }
  }, [expr, effectiveDialect, locale, t, common]);

  const runs = useMemo(() => {
    if (!analysis.ok || now === null) return null;
    return nextRuns(analysis.schedule, new Date(now), RUN_COUNT, tz);
  }, [analysis, now, tz]);

  const showSeconds = analysis.ok && (analysis.schedule.seconds.length > 1 || analysis.schedule.seconds[0] !== 0);
  const fmt = useMemo(() => {
    const opts: Intl.DateTimeFormatOptions = {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      ...(showSeconds ? { second: "2-digit" } : {}),
      timeZoneName: "short",
    };
    return {
      zone: new Intl.DateTimeFormat(LOCALE_TAGS[locale], { ...opts, timeZone: tz }),
      local: new Intl.DateTimeFormat(LOCALE_TAGS[locale], { ...opts, timeZone: localTz }),
    };
  }, [locale, tz, localTz, showSeconds]);

  function applyExpression(source: string, from: Dialect) {
    const target = effectiveDialect;
    const res = convertCron(source, from, target);
    if (res.ok) {
      setExpr(res.expression);
    } else {
      setExpr(source);
      setDialectChoice(from === "standard" ? "auto" : from);
    }
  }

  function onPreset(slug: string) {
    const p = getEvery(slug);
    if (!p) return;
    track("preset_click", { preset: slug });
    applyExpression(p.expr, p.dialect);
  }

  function onDialectChange(value: string) {
    const next = value as Dialect | "auto";
    setDialectChoice(next);
    const resolved = next === "auto" ? detectDialect(expr) : next;
    if (UTC_DIALECTS.includes(resolved)) setTz("UTC");
  }

  const shareUrl = () => (typeof window === "undefined" ? "" : window.location.href);
  const dialectNotes = t.notes[effectiveDialect];

  return (
    <div className="space-y-6">
      <section aria-labelledby="explainer" className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6 dark:border-slate-700 dark:bg-slate-900">
        <h2 id="explainer" className="sr-only">
          {t.meaning}
        </h2>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1">
            <label htmlFor="cron-input" className="mb-1 block text-sm font-medium">
              {t.label}
            </label>
            <input
              id="cron-input"
              value={expr}
              onChange={(e) => setExpr(e.target.value)}
              placeholder={t.placeholder}
              spellCheck={false}
              autoCapitalize="off"
              autoComplete="off"
              aria-invalid={!analysis.ok}
              aria-describedby="cron-status"
              className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2.5 font-mono text-lg tracking-wide focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 dark:border-slate-600 dark:bg-slate-950"
            />
          </div>
          <div className="sm:w-56">
            <label htmlFor="dialect" className="mb-1 block text-sm font-medium">
              {t.dialect}
            </label>
            <select
              id="dialect"
              value={dialectChoice}
              onChange={(e) => onDialectChange(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 dark:border-slate-600 dark:bg-slate-950"
            >
              <option value="auto">{t.auto}</option>
              {DIALECTS.map((d) => (
                <option key={d} value={d}>
                  {common.dialectNames[d]}
                </option>
              ))}
            </select>
          </div>
        </div>

        <p className="mt-2 min-h-5 text-xs text-slate-500 dark:text-slate-400">
          {dialectChoice === "auto" && <span className="font-medium">{interpolate(t.detected, { dialect: common.dialectNames[effectiveDialect] })} · </span>}
          {dialectNotes}
        </p>

        <div id="cron-status" aria-live="polite" className="mt-4 min-h-20 rounded-xl bg-slate-50 p-4 dark:bg-slate-800/60">
          {analysis.ok ? (
            <>
              <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-400">
                ✓ {t.valid} · {t.meaning}
              </p>
              <p className="mt-1 text-lg font-medium">{analysis.description ?? t.noDescription}</p>
            </>
          ) : (
            <>
              <p className="text-xs font-semibold uppercase tracking-wide text-red-700 dark:text-red-400">✕ {t.invalid}</p>
              <p className="mt-1 text-base">{analysis.message}</p>
            </>
          )}
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <CopyButton text={expr} label={t.copy} copiedLabel={t.copied} kind="expression" />
          <CopyButton text={shareUrl} label={t.share} copiedLabel={t.copied} kind="share_link" />
        </div>

        <div className="mt-5">
          <h3 className="mb-2 text-sm font-semibold">{t.presets}</h3>
          <div className="flex flex-wrap gap-2">
            {presets.map((p) => (
              <button
                key={p.slug}
                type="button"
                onClick={() => onPreset(p.slug)}
                className="rounded-full border border-slate-300 px-3 py-1 text-sm hover:border-indigo-500 hover:text-indigo-700 dark:border-slate-600 dark:hover:text-indigo-300"
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section aria-labelledby="next-runs" className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6 dark:border-slate-700 dark:bg-slate-900">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <h2 id="next-runs" className="text-lg font-semibold">
            {t.nextRuns}
          </h2>
          <div>
            <label htmlFor="tz" className="mb-1 block text-sm font-medium">
              {t.timezone}
            </label>
            <select
              id="tz"
              value={tz}
              onChange={(e) => setTz(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 sm:w-64 dark:border-slate-600 dark:bg-slate-950"
            >
              {zones.map((z) => (
                <option key={z} value={z}>
                  {z}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 dark:border-slate-700 dark:text-slate-400">
                <th scope="col" className="w-8 py-2 pr-2 font-medium">
                  #
                </th>
                <th scope="col" className="py-2 pr-4 font-medium">
                  {interpolate(t.colZone, { tz })}
                </th>
                <th scope="col" className="py-2 font-medium">
                  {t.colLocal}
                </th>
              </tr>
            </thead>
            <tbody className="font-mono tabular-nums">
              {runs && runs.length === 0 ? (
                <tr>
                  <td colSpan={3} className="py-3 font-sans">
                    {t.noRuns}
                  </td>
                </tr>
              ) : (
                Array.from({ length: RUN_COUNT }, (_, i) => {
                  const r = runs?.[i];
                  return (
                    <tr key={i} className="h-9 border-b border-slate-100 last:border-0 dark:border-slate-800">
                      <td className="pr-2 text-slate-400">{i + 1}</td>
                      <td className="pr-4">{r ? fmt.zone.format(r) : "—"}</td>
                      <td className="text-slate-600 dark:text-slate-300">{r ? fmt.local.format(r) : "—"}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section aria-labelledby="converter" className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6 dark:border-slate-700 dark:bg-slate-900">
        <h2 id="converter" className="text-lg font-semibold">
          {t.converter}
        </h2>
        <ul className="mt-3 divide-y divide-slate-100 dark:divide-slate-800">
          {(analysis.ok ? analysis.conversions : CONVERT_TARGETS.filter((d) => d !== effectiveDialect).map((d) => [d, null] as const)).map(
            ([d, res]) => (
              <li key={d} className="flex min-h-12 flex-col gap-1 py-2 sm:flex-row sm:items-center sm:gap-4">
                <span className="text-sm font-medium sm:w-44">{common.dialectNames[d]}</span>
                {res === null ? (
                  <span className="text-sm text-slate-400">—</span>
                ) : res.ok ? (
                  <span className="flex flex-1 flex-wrap items-center gap-2">
                    <code className="rounded bg-slate-100 px-2 py-1 font-mono text-sm dark:bg-slate-800">{res.expression}</code>
                    <CopyButton text={res.expression} label={t.copy} copiedLabel={t.copied} kind={`convert_${d}`} small />
                    {res.warnings.map((w) => (
                      <span key={w} className="text-xs text-amber-700 dark:text-amber-400">
                        {t.warnings[w]}
                      </span>
                    ))}
                  </span>
                ) : (
                  <span className="flex-1 text-sm text-slate-500 dark:text-slate-400">{t.reasons[res.reason]}</span>
                )}
              </li>
            ),
          )}
        </ul>
      </section>

      <CronBuilder t={t} common={common} onUse={(e) => applyExpression(e, "standard")} />
    </div>
  );
}
