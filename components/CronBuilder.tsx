"use client";

import { useState } from "react";
import { formatSet } from "@/lib/cron/convert";
import type { Dictionary } from "@/lib/i18n";
import CopyButton from "./CopyButton";

type Mode = "every" | "step" | "specific";

interface FieldState {
  mode: Mode;
  step: number;
  values: number[];
}

interface FieldDef {
  key: "minute" | "hour" | "dayOfMonth" | "month" | "dayOfWeek";
  min: number;
  max: number;
  steps: number[];
  label?: (v: number) => string;
}

interface Props {
  t: Dictionary["tool"];
  common: Dictionary["common"];
  onUse: (expression: string) => void;
}

function fieldText(f: FieldState, d: FieldDef): string {
  if (f.mode === "every") return "*";
  if (f.mode === "step") return `*/${f.step}`;
  if (!f.values.length) return "*";
  const text = formatSet([...f.values].sort((a, b) => a - b), d.min, d.max);
  // Keep explicit lists for the day fields: a leading "*" changes Unix day-of-month/day-of-week semantics.
  const dayField = d.key === "dayOfMonth" || d.key === "dayOfWeek";
  return dayField && text.startsWith("*") && f.values.length < d.max - d.min + 1 ? [...f.values].sort((a, b) => a - b).join(",") : text;
}

export default function CronBuilder({ t, common, onUse }: Props) {
  const defs: FieldDef[] = [
    { key: "minute", min: 0, max: 59, steps: [2, 5, 10, 15, 20, 30] },
    { key: "hour", min: 0, max: 23, steps: [2, 3, 4, 6, 8, 12] },
    { key: "dayOfMonth", min: 1, max: 31, steps: [2, 5, 10, 15] },
    { key: "month", min: 1, max: 12, steps: [2, 3, 4, 6], label: (v) => common.months[v - 1] },
    { key: "dayOfWeek", min: 0, max: 6, steps: [2, 3], label: (v) => common.weekdays[v] },
  ];
  const [state, setState] = useState<Record<FieldDef["key"], FieldState>>({
    minute: { mode: "specific", step: 5, values: [0] },
    hour: { mode: "specific", step: 2, values: [9] },
    dayOfMonth: { mode: "every", step: 2, values: [] },
    month: { mode: "every", step: 3, values: [] },
    dayOfWeek: { mode: "specific", step: 2, values: [1, 2, 3, 4, 5] },
  });

  const expression = defs.map((d) => fieldText(state[d.key], d)).join(" ");
  const update = (key: FieldDef["key"], patch: Partial<FieldState>) =>
    setState((s) => ({ ...s, [key]: { ...s[key], ...patch } }));

  return (
    <section aria-labelledby="builder" className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6 dark:border-slate-700 dark:bg-slate-900">
      <h2 id="builder" className="text-lg font-semibold">
        {t.builder}
      </h2>
      <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{t.builderHint}</p>
      <div className="mt-4 space-y-5">
        {defs.map((d) => {
          const f = state[d.key];
          const name = common.fieldNames[d.key];
          return (
            <fieldset key={d.key} className="rounded-xl border border-slate-200 p-3 dark:border-slate-700">
              <legend className="px-1 text-sm font-semibold">{name}</legend>
              <div className="flex flex-wrap items-center gap-3">
                {(["every", "step", "specific"] as const).map((m) => (
                  <label key={m} className="flex items-center gap-1.5 text-sm">
                    <input
                      type="radio"
                      name={`mode-${d.key}`}
                      checked={f.mode === m}
                      onChange={() => update(d.key, { mode: m })}
                    />
                    {t.modes[m]}
                  </label>
                ))}
                {f.mode === "step" && (
                  <label className="flex items-center gap-1.5 text-sm">
                    <span>{t.interval}</span>
                    <select
                      value={f.step}
                      onChange={(e) => update(d.key, { step: Number(e.target.value) })}
                      className="rounded border border-slate-300 bg-white px-2 py-1 dark:border-slate-600 dark:bg-slate-950"
                    >
                      {d.steps.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </label>
                )}
              </div>
              {f.mode === "specific" && (
                <div className="mt-3 flex flex-wrap gap-1" role="group" aria-label={name}>
                  {Array.from({ length: d.max - d.min + 1 }, (_, i) => d.min + i).map((v) => {
                    const on = f.values.includes(v);
                    return (
                      <button
                        key={v}
                        type="button"
                        aria-pressed={on}
                        onClick={() => update(d.key, { values: on ? f.values.filter((x) => x !== v) : [...f.values, v] })}
                        className={`min-w-9 rounded border px-1.5 py-1 font-mono text-xs ${
                          on
                            ? "border-indigo-600 bg-indigo-600 text-white"
                            : "border-slate-300 hover:border-indigo-500 dark:border-slate-600"
                        }`}
                      >
                        {d.label ? d.label(v) : v}
                      </button>
                    );
                  })}
                </div>
              )}
            </fieldset>
          );
        })}
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <code className="rounded bg-slate-100 px-3 py-1.5 font-mono text-base dark:bg-slate-800">{expression}</code>
        <CopyButton text={expression} label={t.copy} copiedLabel={t.copied} kind="builder" />
        <button
          type="button"
          onClick={() => onUse(expression)}
          className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700"
        >
          {t.useExpression}
        </button>
      </div>
    </section>
  );
}
