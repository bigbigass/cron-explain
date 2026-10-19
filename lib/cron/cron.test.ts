import { describe, expect, it } from "vitest";
import {
  convertCron,
  CronError,
  detectDialect,
  EVERY,
  formatSet,
  isValidCron,
  nearestWeekday,
  nextRuns,
  parseCron,
  wallToInstant,
} from "./index";
import { describeSchedule } from "./describe";

const iso = (dates: Date[]) => dates.map((d) => d.toISOString());

function errorOf(fn: () => unknown): CronError {
  try {
    fn();
  } catch (e) {
    if (e instanceof CronError) return e;
    throw e;
  }
  throw new Error("expected CronError");
}

describe("dialect detection", () => {
  it.each([
    ["*/5 * * * *", "standard"],
    ["@daily", "standard"],
    ["0 */5 * * * *", "seconds"],
    ["0 0 12 ? * MON-FRI", "quartz"],
    ["0 0 12 * * ? 2027", "quartz"],
    ["0 12 * * ? *", "aws"],
    ["cron(0 12 * * ? *)", "aws"],
  ])("%s → %s", (expr, dialect) => {
    expect(detectDialect(expr)).toBe(dialect);
  });
});

describe("parsing", () => {
  it("parses standard fields, steps, ranges and lists", () => {
    const s = parseCron("*/15 9-17 1,15 * 1-5");
    expect(s.minutes).toEqual([0, 15, 30, 45]);
    expect(s.hours).toEqual([9, 10, 11, 12, 13, 14, 15, 16, 17]);
    expect(s.dom.days).toEqual([1, 15]);
    expect(s.dow.days).toEqual([1, 2, 3, 4, 5]);
    expect(s.dayMode).toBe("or");
  });

  it("accepts month and weekday names and 7 = Sunday", () => {
    const s = parseCron("0 0 * JAN,jul SUN,7");
    expect(s.months).toEqual([1, 7]);
    expect(s.dow.days).toEqual([0]);
  });

  it("expands macros", () => {
    expect(parseCron("@hourly").minutes).toEqual([0]);
    expect(parseCron("@weekly").dow.days).toEqual([0]);
    expect(parseCron("@monthly", "spring").fields).toEqual(["0", "0", "0", "1", "*", "*"]);
  });

  it("parses the 6-field seconds dialect", () => {
    const s = parseCron("*/20 0 * * * *", "seconds");
    expect(s.seconds).toEqual([0, 20, 40]);
  });

  it("parses Quartz with 1 = Sunday, L, W, # and year", () => {
    const s = parseCron("0 15 10 ? * 6#3 2027");
    expect(s.dialect).toBe("quartz");
    expect(s.dow.nth).toEqual([{ day: 5, n: 3 }]);
    expect(s.years).toEqual([2027]);
    expect(parseCron("0 0 12 LW * ?").dom.lastWeekday).toBe(true);
    expect(parseCron("0 0 12 L-2 * ?").dom.lastOffsets).toEqual([2]);
    expect(parseCron("0 0 12 15W * ?").dom.nearestWeekday).toEqual([15]);
    expect(parseCron("0 0 12 ? * 6L").dow.last).toEqual([5]);
    expect(parseCron("0 0 12 ? * MON-FRI").dow.days).toEqual([1, 2, 3, 4, 5]);
  });

  it("parses AWS with or without the cron() wrapper", () => {
    const a = parseCron("cron(0/15 8-17 ? * MON-FRI *)");
    const b = parseCron("0/15 8-17 ? * MON-FRI *", "aws");
    expect(a.minutes).toEqual([0, 15, 30, 45]);
    expect(b.dow.days).toEqual(a.dow.days);
  });

  it("parses Spring expressions with 0 = Sunday and AND day semantics", () => {
    const s = parseCron("0 0 9 1-7 * MON", "spring");
    expect(s.dow.days).toEqual([1]);
    expect(s.dayMode).toBe("and");
  });
});

describe("validation errors", () => {
  it.each<[string, string, string, string | undefined]>([
    ["", "auto", "empty", undefined],
    ["* * * *", "standard", "fieldCount", undefined],
    ["60 * * * *", "standard", "outOfRange", "minute"],
    ["* 24 * * *", "standard", "outOfRange", "hour"],
    ["* * 0 * *", "standard", "outOfRange", "dayOfMonth"],
    ["* * * 13 *", "standard", "outOfRange", "month"],
    ["* * * * 8", "standard", "outOfRange", "dayOfWeek"],
    ["*/0 * * * *", "standard", "invalidStep", "minute"],
    ["5-1 * * * *", "standard", "invalidRange", "minute"],
    ["abc * * * *", "standard", "invalidValue", "minute"],
    ["0 0 ? * *", "standard", "questionNotAllowed", "dayOfMonth"],
    ["0 0 L * *", "standard", "specialNotAllowed", "dayOfMonth"],
    ["0 0 12 * * *", "quartz", "questionRequired", undefined],
    ["0 0 12 ? * ?", "quartz", "bothQuestion", undefined],
    ["0 0 12 ? * 0", "quartz", "outOfRange", "dayOfWeek"],
    ["@daily", "github", "macroNotSupported", undefined],
    ["@reboot", "standard", "rebootNotSchedulable", undefined],
    ["@sometimes", "standard", "unknownMacro", undefined],
  ])("%s (%s) → %s", (expr, dialect, code, field) => {
    const e = errorOf(() => parseCron(expr, dialect as never));
    expect(e.code).toBe(code);
    expect(e.field).toBe(field);
  });

  it("isValidCron reflects parse success", () => {
    expect(isValidCron("0 9 * * 1-5")).toBe(true);
    expect(isValidCron("0 9 * * 1-5 x y z")).toBe(false);
  });
});

describe("next runs (UTC)", () => {
  const from = new Date("2026-01-01T00:00:00Z");

  it("every 15 minutes", () => {
    expect(iso(nextRuns(parseCron("*/15 * * * *"), from, 3))).toEqual([
      "2026-01-01T00:15:00.000Z",
      "2026-01-01T00:30:00.000Z",
      "2026-01-01T00:45:00.000Z",
    ]);
  });

  it("weekdays at 09:00 (2026-01-01 is a Thursday)", () => {
    expect(iso(nextRuns(parseCron("0 9 * * 1-5"), from, 3))).toEqual([
      "2026-01-01T09:00:00.000Z",
      "2026-01-02T09:00:00.000Z",
      "2026-01-05T09:00:00.000Z",
    ]);
  });

  it("Unix ORs day-of-month and day-of-week when both are restricted", () => {
    const runs = iso(nextRuns(parseCron("0 0 13 * 5"), from, 3));
    // Fri Jan 2, Fri Jan 9, Tue Jan 13
    expect(runs).toEqual(["2026-01-02T00:00:00.000Z", "2026-01-09T00:00:00.000Z", "2026-01-13T00:00:00.000Z"]);
  });

  it("Unix ANDs the fields when one starts with *", () => {
    const runs = iso(nextRuns(parseCron("0 0 */2 * 1"), from, 2));
    // Mondays that are odd days: Jan 5, Jan 19
    expect(runs).toEqual(["2026-01-05T00:00:00.000Z", "2026-01-19T00:00:00.000Z"]);
  });

  it("Quartz last day of month (incl. leap February)", () => {
    const runs = iso(nextRuns(parseCron("0 0 0 L * ?"), new Date("2028-01-15T00:00:00Z"), 2));
    expect(runs).toEqual(["2028-01-31T00:00:00.000Z", "2028-02-29T00:00:00.000Z"]);
  });

  it("Quartz third Friday (6#3) and last weekday (LW)", () => {
    expect(iso(nextRuns(parseCron("0 0 10 ? * 6#3"), from, 1))).toEqual(["2026-01-16T10:00:00.000Z"]);
    // Jan 31 2026 is a Saturday → Friday Jan 30
    expect(iso(nextRuns(parseCron("0 0 10 LW * ?"), from, 1))).toEqual(["2026-01-30T10:00:00.000Z"]);
  });

  it("nearest weekday (W) never leaves the month", () => {
    // 2026-08-01 is a Saturday → Monday Aug 3; 2026-05-31 is a Sunday → Friday May 29
    expect(nearestWeekday(2026, 8, 1)).toBe(3);
    expect(nearestWeekday(2026, 5, 31)).toBe(29);
    expect(nearestWeekday(2026, 2, 30)).toBe(-1);
  });

  it("6-field seconds", () => {
    expect(iso(nextRuns(parseCron("*/20 * * * * *"), from, 2))).toEqual([
      "2026-01-01T00:00:20.000Z",
      "2026-01-01T00:00:40.000Z",
    ]);
  });

  it("AWS year field limits the schedule", () => {
    const runs = nextRuns(parseCron("cron(0 12 1 1 ? 2027-2028)"), from, 5);
    expect(iso(runs)).toEqual(["2027-01-01T12:00:00.000Z", "2028-01-01T12:00:00.000Z"]);
  });

  it("returns nothing for impossible dates", () => {
    expect(nextRuns(parseCron("0 0 31 2 *"), from, 1)).toEqual([]);
  });
});

describe("next runs with time zones and DST", () => {
  it("evaluates wall-clock time in the target zone", () => {
    const runs = nextRuns(parseCron("0 9 * * *"), new Date("2026-01-01T00:00:00Z"), 1, "Asia/Tokyo");
    // 09:00 JST = 00:00Z; the run exactly at `from` is excluded
    expect(iso(runs)).toEqual(["2026-01-02T00:00:00.000Z"]);
  });

  it("skips times inside the spring-forward gap (New York, 2026-03-08)", () => {
    const runs = iso(nextRuns(parseCron("30 2 * * *"), new Date("2026-03-07T12:00:00Z"), 2, "America/New_York"));
    // Mar 7 02:30 EST already passed; Mar 8 02:30 doesn't exist; Mar 9 02:30 EDT
    expect(runs).toEqual(["2026-03-09T06:30:00.000Z", "2026-03-10T06:30:00.000Z"]);
  });

  it("fires once for repeated fall-back times (New York, 2026-11-01)", () => {
    const runs = iso(nextRuns(parseCron("30 1 * * *"), new Date("2026-10-31T12:00:00Z"), 2, "America/New_York"));
    // First 01:30 is EDT (UTC-4)
    expect(runs).toEqual(["2026-11-01T05:30:00.000Z", "2026-11-02T06:30:00.000Z"]);
  });

  it("hourly schedule across the spring-forward gap in Berlin", () => {
    const runs = iso(nextRuns(parseCron("0 * * * *"), new Date("2026-03-29T00:30:00Z"), 3, "Europe/Berlin"));
    // 01:30 local CET; next local 02:00 is skipped, 03:00 CEST = 01:00Z
    expect(runs).toEqual(["2026-03-29T01:00:00.000Z", "2026-03-29T02:00:00.000Z", "2026-03-29T03:00:00.000Z"]);
  });

  it("wallToInstant returns null in a gap and the first instant when ambiguous", () => {
    expect(wallToInstant({ y: 2026, mo: 3, d: 8, h: 2, mi: 30, s: 0 }, "America/New_York")).toBeNull();
    expect(wallToInstant({ y: 2026, mo: 11, d: 1, h: 1, mi: 30, s: 0 }, "America/New_York")).toBe(
      Date.parse("2026-11-01T05:30:00Z"),
    );
  });
});

describe("conversion", () => {
  it("standard → Quartz → standard round-trips", () => {
    const q = convertCron("*/15 9-17 * * 1-5", "standard", "quartz");
    expect(q).toEqual({ ok: true, expression: "0 */15 9-17 ? * MON-FRI", warnings: [] });
    const back = convertCron(q.ok ? q.expression : "", "quartz", "standard");
    expect(back.ok && back.expression).toBe("*/15 9-17 * * 1-5");
  });

  it("standard → AWS → standard round-trips", () => {
    const a = convertCron("0 12 1 * *", "standard", "aws");
    expect(a.ok && a.expression).toBe("cron(0 12 1 * ? *)");
    const back = convertCron(a.ok ? a.expression : "", "aws", "standard");
    expect(back.ok && back.expression).toBe("0 12 1 * *");
  });

  it("Quartz ↔ AWS keeps 1 = Sunday numbering for # and L", () => {
    const a = convertCron("0 0 10 ? * 6#3", "quartz", "aws");
    expect(a.ok && a.expression).toBe("cron(0 10 ? * 6#3 *)");
    const q = convertCron("cron(0 10 ? * 6L *)", "aws", "quartz");
    expect(q.ok && q.expression).toBe("0 0 10 ? * 6L");
  });

  it("reports what can't be represented", () => {
    expect(convertCron("0 0 0 L * ?", "quartz", "standard")).toEqual({ ok: false, reason: "specialNotSupported" });
    expect(convertCron("30 0 12 * * ?", "quartz", "aws")).toEqual({ ok: false, reason: "secondsNotSupported" });
    expect(convertCron("0 0 12 * * ? 2027", "quartz", "standard")).toEqual({ ok: false, reason: "yearNotSupported" });
    expect(convertCron("0 0 13 * 5", "standard", "quartz")).toEqual({ ok: false, reason: "domDowBoth" });
  });

  it("keeps Unix OR semantics when formatting", () => {
    const r = convertCron("0 0 1-31 * 1", "standard", "standard");
    expect(r.ok && r.expression).toBe("0 0 1-31 * 1");
  });

  it("warns about GitHub's 5-minute minimum and UTC", () => {
    const r = convertCron("* * * * *", "standard", "github");
    expect(r.ok && r.warnings).toEqual(["githubUtc", "githubMinInterval"]);
    const ok = convertCron("*/5 * * * *", "standard", "github");
    expect(ok.ok && ok.warnings).toEqual(["githubUtc"]);
  });

  it("formatSet compacts values", () => {
    expect(formatSet([0, 15, 30, 45], 0, 59)).toBe("*/15");
    expect(formatSet([5, 20, 35, 50], 0, 59)).toBe("5-50/15");
    expect(formatSet([1, 2, 3, 5], 1, 31)).toBe("1-3,5");
    expect(formatSet([3, 4], 0, 23)).toBe("3,4");
  });

  it("every landing schedule is valid in its own dialect and converts to Quartz and AWS", () => {
    for (const e of EVERY) {
      expect(isValidCron(e.expr, e.dialect)).toBe(true);
      expect(convertCron(e.expr, e.dialect, "quartz").ok).toBe(true);
      expect(convertCron(e.expr, e.dialect, "aws").ok).toBe(true);
    }
  });
});

describe("descriptions", () => {
  it("describes in all 7 languages", () => {
    const s = parseCron("0 9 * * 1-5");
    expect(describeSchedule(s, "en")).toBe("At 09:00 AM, Monday through Friday");
    expect(describeSchedule(s, "de")).toContain("Montag");
    expect(describeSchedule(s, "fr")).toContain("lundi");
    expect(describeSchedule(s, "es")).toContain("lunes");
    expect(describeSchedule(s, "pt")).toContain("segunda");
    expect(describeSchedule(s, "zh")).toContain("星期一");
    expect(describeSchedule(s, "ja")).toContain("月曜日");
  });

  it("uses 1 = Sunday numbering for Quartz and AWS", () => {
    expect(describeSchedule(parseCron("0 0 12 ? * 2"), "en")).toContain("Monday");
    expect(describeSchedule(parseCron("cron(0 12 ? * 2 *)"), "en")).toContain("Monday");
  });
});
