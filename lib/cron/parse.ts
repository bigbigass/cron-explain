import { CronError, type CronSchedule, type Dialect, type DomSpec, type DowSpec, type FieldName } from "./types";

interface FieldDef {
  name: FieldName;
  min: number;
  max: number;
  names?: Record<string, number>;
}

const MONTH_NAMES: Record<string, number> = {
  JAN: 1, FEB: 2, MAR: 3, APR: 4, MAY: 5, JUN: 6, JUL: 7, AUG: 8, SEP: 9, OCT: 10, NOV: 11, DEC: 12,
};
const DOW_ABBR = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

function dowNames(offset: number): Record<string, number> {
  return Object.fromEntries(DOW_ABBR.map((n, i) => [n, i + offset]));
}

const F = {
  second: { name: "second", min: 0, max: 59 },
  minute: { name: "minute", min: 0, max: 59 },
  hour: { name: "hour", min: 0, max: 23 },
  dayOfMonth: { name: "dayOfMonth", min: 1, max: 31 },
  month: { name: "month", min: 1, max: 12, names: MONTH_NAMES },
  /** Unix / Spring numbering: 0–7, 0 and 7 = Sunday. */
  dowZero: { name: "dayOfWeek", min: 0, max: 7, names: dowNames(0) },
  /** Quartz / AWS numbering: 1–7, 1 = Sunday. */
  dowOne: { name: "dayOfWeek", min: 1, max: 7, names: dowNames(1) },
  year: { name: "year", min: 1970, max: 2199 },
} satisfies Record<string, FieldDef>;

interface DialectRules {
  /** Field layout, in order. */
  layout: FieldName[];
  /** Optional trailing year field (Quartz). */
  optionalYear?: boolean;
  dowBase: 0 | 1;
  question: "none" | "optional" | "required";
  specials: boolean;
  macros: boolean;
  dayMode: "vixie" | "and";
}

const FIVE: FieldName[] = ["minute", "hour", "dayOfMonth", "month", "dayOfWeek"];
const SIX_SEC: FieldName[] = ["second", ...FIVE];

export const RULES: Record<Dialect, DialectRules> = {
  standard: { layout: FIVE, dowBase: 0, question: "none", specials: false, macros: true, dayMode: "vixie" },
  github: { layout: FIVE, dowBase: 0, question: "none", specials: false, macros: false, dayMode: "vixie" },
  kubernetes: { layout: FIVE, dowBase: 0, question: "none", specials: false, macros: true, dayMode: "vixie" },
  seconds: { layout: SIX_SEC, dowBase: 0, question: "none", specials: false, macros: false, dayMode: "vixie" },
  spring: { layout: SIX_SEC, dowBase: 0, question: "optional", specials: true, macros: true, dayMode: "and" },
  quartz: { layout: SIX_SEC, optionalYear: true, dowBase: 1, question: "required", specials: true, macros: false, dayMode: "and" },
  aws: { layout: [...FIVE, "year"], dowBase: 1, question: "required", specials: true, macros: false, dayMode: "and" },
};

const MACROS: Record<string, string> = {
  "@yearly": "0 0 1 1 *",
  "@annually": "0 0 1 1 *",
  "@monthly": "0 0 1 * *",
  "@weekly": "0 0 * * 0",
  "@daily": "0 0 * * *",
  "@midnight": "0 0 * * *",
  "@hourly": "0 * * * *",
};

export function normalizeExpression(expr: string): string {
  return expr.trim().replace(/\s+/g, " ");
}

/** Strip an AWS `cron(...)` wrapper if present. */
export function stripAwsWrapper(expr: string): string {
  const m = /^cron\((.*)\)$/i.exec(normalizeExpression(expr));
  return m ? normalizeExpression(m[1]) : normalizeExpression(expr);
}

function parseNumber(token: string, def: FieldDef): number {
  const upper = token.toUpperCase();
  if (def.names && upper in def.names) return def.names[upper];
  if (!/^\d+$/.test(token)) throw new CronError("invalidValue", def.name, { value: token });
  const n = Number(token);
  if (n < def.min || n > def.max) {
    throw new CronError("outOfRange", def.name, { value: token, min: def.min, max: def.max });
  }
  return n;
}

/** Parse a plain numeric list field: `*`, `5`, `1-5`, `*\/15`, `10/5`, `1-30/2`, `MON,WED`. */
export function parseList(text: string, def: FieldDef): number[] {
  const values = new Set<number>();
  for (const part of text.split(",")) {
    if (part === "") throw new CronError("invalidValue", def.name, { value: text });
    const pieces = part.split("/");
    if (pieces.length > 2) throw new CronError("invalidStep", def.name, { value: part });
    const [rangePart, stepPart] = pieces;
    let step = 1;
    if (stepPart !== undefined) {
      if (!/^\d+$/.test(stepPart) || Number(stepPart) === 0) {
        throw new CronError("invalidStep", def.name, { value: part });
      }
      step = Number(stepPart);
    }
    let start: number;
    let end: number;
    if (rangePart === "*") {
      start = def.min;
      end = def.max;
    } else if (rangePart.includes("-")) {
      const bounds = rangePart.split("-");
      if (bounds.length !== 2) throw new CronError("invalidValue", def.name, { value: part });
      start = parseNumber(bounds[0], def);
      end = parseNumber(bounds[1], def);
      if (start > end) throw new CronError("invalidRange", def.name, { value: part });
    } else {
      start = parseNumber(rangePart, def);
      end = stepPart !== undefined ? def.max : start;
    }
    for (let v = start; v <= end; v += step) values.add(v);
  }
  return [...values].sort((a, b) => a - b);
}

function range(min: number, max: number): number[] {
  return Array.from({ length: max - min + 1 }, (_, i) => min + i);
}

function parseDom(text: string, rules: DialectRules): DomSpec {
  const spec: DomSpec = {
    any: false,
    star: text.startsWith("*"),
    question: false,
    days: [],
    lastOffsets: [],
    lastWeekday: false,
    nearestWeekday: [],
  };
  if (text === "?") {
    if (rules.question === "none") throw new CronError("questionNotAllowed", "dayOfMonth");
    return { ...spec, any: true, question: true, days: range(1, 31) };
  }
  if (text === "*") return { ...spec, any: true, days: range(1, 31) };
  const plain: string[] = [];
  for (const part of text.split(",")) {
    const upper = part.toUpperCase();
    const special = upper === "L" || upper === "LW" || /^L-\d+$/.test(upper) || /^\d+W$/.test(upper);
    if (!special) {
      plain.push(part);
      continue;
    }
    if (!rules.specials) throw new CronError("specialNotAllowed", "dayOfMonth", { value: part });
    if (upper === "L") spec.lastOffsets.push(0);
    else if (upper === "LW") spec.lastWeekday = true;
    else if (upper.startsWith("L-")) {
      const off = Number(upper.slice(2));
      if (off < 1 || off > 30) throw new CronError("outOfRange", "dayOfMonth", { value: part, min: 1, max: 30 });
      spec.lastOffsets.push(off);
    } else {
      spec.nearestWeekday.push(parseNumber(upper.slice(0, -1), F.dayOfMonth));
    }
  }
  if (plain.length) spec.days = parseList(plain.join(","), F.dayOfMonth);
  return spec;
}

function parseDow(text: string, rules: DialectRules): DowSpec {
  const def = rules.dowBase === 0 ? F.dowZero : F.dowOne;
  const norm = (v: number) => (rules.dowBase === 0 ? v % 7 : v - 1);
  const spec: DowSpec = { any: false, star: text.startsWith("*"), question: false, days: [], nth: [], last: [] };
  if (text === "?") {
    if (rules.question === "none") throw new CronError("questionNotAllowed", "dayOfWeek");
    return { ...spec, any: true, question: true, days: range(0, 6) };
  }
  if (text === "*") return { ...spec, any: true, days: range(0, 6) };
  const plain: string[] = [];
  for (const part of text.split(",")) {
    const upper = part.toUpperCase();
    const nth = /^(\w+)#(\d+)$/.exec(upper);
    const last = /^(\w*)L$/.exec(upper);
    if (!nth && !last) {
      plain.push(part);
      continue;
    }
    if (!rules.specials) throw new CronError("specialNotAllowed", "dayOfWeek", { value: part });
    if (nth) {
      const n = Number(nth[2]);
      if (n < 1 || n > 5) throw new CronError("outOfRange", "dayOfWeek", { value: part, min: 1, max: 5 });
      spec.nth.push({ day: norm(parseNumber(nth[1], def)), n });
    } else if (last) {
      // A bare "L" in the day-of-week field means the last day of the week (Saturday).
      spec.last.push(last[1] === "" ? 6 : norm(parseNumber(last[1], def)));
    }
  }
  if (plain.length) {
    spec.days = [...new Set(parseList(plain.join(","), def).map(norm))].sort((a, b) => a - b);
  }
  return spec;
}

/** Guess the dialect from the shape of the expression. Never returns spring/github/kubernetes (same syntax as others). */
export function detectDialect(expr: string): Dialect {
  const t = normalizeExpression(expr);
  if (/^cron\(/i.test(t)) return "aws";
  if (t.startsWith("@")) return "standard";
  const n = t.split(" ").length;
  if (n === 7) return "quartz";
  if (n === 6) {
    if (/[?LW#]/i.test(t)) {
      for (const d of ["quartz", "aws"] as const) {
        try {
          parseCron(t, d);
          return d;
        } catch {
          /* try next */
        }
      }
      return "quartz";
    }
    return "seconds";
  }
  return "standard";
}

/** Parse an expression in the given dialect (or auto-detect). Throws CronError with a field-specific code. */
export function parseCron(expr: string, dialect: Dialect | "auto" = "auto"): CronSchedule {
  const d: Dialect = dialect === "auto" ? detectDialect(expr) : dialect;
  const rules = RULES[d];
  let text = d === "aws" ? stripAwsWrapper(expr) : normalizeExpression(expr);
  if (text === "") throw new CronError("empty");

  if (text.startsWith("@")) {
    const macro = text.toLowerCase();
    if (macro === "@reboot") throw new CronError("rebootNotSchedulable");
    if (!(macro in MACROS)) throw new CronError("unknownMacro", undefined, { value: text });
    if (!rules.macros) throw new CronError("macroNotSupported", undefined, { value: text });
    text = (rules.layout[0] === "second" ? "0 " : "") + MACROS[macro];
  }

  const fields = text.split(" ");
  const expected = rules.layout.length;
  const allowed = rules.optionalYear ? [expected, expected + 1] : [expected];
  if (!allowed.includes(fields.length)) {
    throw new CronError("fieldCount", undefined, { expected: allowed.join("–"), got: fields.length });
  }
  const layout: FieldName[] = fields.length > expected ? [...rules.layout, "year"] : rules.layout;
  const get = (name: FieldName) => {
    const i = layout.indexOf(name);
    return i === -1 ? undefined : fields[i];
  };

  for (const name of ["second", "minute", "hour", "month", "year"] as const) {
    if (get(name) === "?") throw new CronError("questionNotAllowed", name);
  }

  const secText = get("second");
  const yearText = get("year");
  const dom = parseDom(get("dayOfMonth")!, rules);
  const dow = parseDow(get("dayOfWeek")!, rules);

  if (rules.question === "required") {
    if (dom.question && dow.question) throw new CronError("bothQuestion");
    if (!dom.question && !dow.question) throw new CronError("questionRequired");
  }

  return {
    dialect: d,
    fields,
    seconds: secText === undefined ? [0] : parseList(secText, F.second),
    minutes: parseList(get("minute")!, F.minute),
    hours: parseList(get("hour")!, F.hour),
    months: parseList(get("month")!, F.month),
    years: yearText === undefined || yearText === "*" ? null : parseList(yearText, F.year),
    dom,
    dow,
    dayMode: rules.dayMode === "and" || dom.star || dow.star ? "and" : "or",
  };
}

export function isValidCron(expr: string, dialect: Dialect | "auto" = "auto"): boolean {
  try {
    parseCron(expr, dialect);
    return true;
  } catch {
    return false;
  }
}
