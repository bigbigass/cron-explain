export const DIALECTS = ["standard", "seconds", "quartz", "spring", "aws", "github", "kubernetes"] as const;
export type Dialect = (typeof DIALECTS)[number];

export type FieldName = "second" | "minute" | "hour" | "dayOfMonth" | "month" | "dayOfWeek" | "year";

export type CronErrorCode =
  | "empty"
  | "fieldCount"
  | "invalidValue"
  | "outOfRange"
  | "invalidStep"
  | "invalidRange"
  | "questionNotAllowed"
  | "questionRequired"
  | "bothQuestion"
  | "specialNotAllowed"
  | "unknownMacro"
  | "macroNotSupported"
  | "rebootNotSchedulable";

export type CronErrorParams = Record<string, string | number>;

export class CronError extends Error {
  readonly code: CronErrorCode;
  readonly field?: FieldName;
  readonly params: CronErrorParams;

  constructor(code: CronErrorCode, field?: FieldName, params: CronErrorParams = {}) {
    super(`${code}${field ? ` (${field})` : ""}${Object.keys(params).length ? ` ${JSON.stringify(params)}` : ""}`);
    this.name = "CronError";
    this.code = code;
    this.field = field;
    this.params = params;
  }
}

/** Day-of-month field. `any` = matches every day ("*" or "?"). `star` = text starts with "*" (Vixie rule). */
export interface DomSpec {
  any: boolean;
  star: boolean;
  question: boolean;
  days: number[];
  /** L = 0, L-3 = 3 (days before the last day of the month). */
  lastOffsets: number[];
  lastWeekday: boolean;
  nearestWeekday: number[];
}

/** Day-of-week field, values normalized to 0 = Sunday … 6 = Saturday. */
export interface DowSpec {
  any: boolean;
  star: boolean;
  question: boolean;
  days: number[];
  nth: { day: number; n: number }[];
  last: number[];
}

export type DayMode = "and" | "or";

export interface CronSchedule {
  dialect: Dialect;
  /** Field texts after macro expansion / wrapper stripping, in the dialect's own order. */
  fields: string[];
  seconds: number[];
  minutes: number[];
  hours: number[];
  months: number[];
  /** null = every year. */
  years: number[] | null;
  dom: DomSpec;
  dow: DowSpec;
  dayMode: DayMode;
}
