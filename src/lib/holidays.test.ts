import { describe, it, expect } from "vitest";
import { isHoliday, calculateDates } from "./holidays";
import type { WorkWeek } from "./storage";

function fmt(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

describe("isHoliday", () => {
  it("detects fixed national holidays", () => {
    expect(isHoliday("2026-05-01")).toBe(true);
    expect(isHoliday("2026-07-05")).toBe(true);
    expect(isHoliday("2026-01-01")).toBe(true);
  });

  it("detects Eid al-Fitr 2026", () => {
    expect(isHoliday("2026-03-19")).toBe(true);
    expect(isHoliday("2026-03-20")).toBe(true);
  });

  it("detects Ashura (2026-06-24)", () => {
    expect(isHoliday("2026-06-24")).toBe(true);
  });

  it("returns false for a non-holiday date", () => {
    expect(isHoliday("2026-06-10")).toBe(false);
  });

  it("returns false for an invalid date string", () => {
    expect(isHoliday("")).toBe(false);
    expect(isHoliday("not-a-date")).toBe(false);
  });

  it("works for far future years (2070)", () => {
    expect(isHoliday("2070-05-01")).toBe(true);
    expect(isHoliday("2070-07-05")).toBe(true);
  });
});

describe("calculateDates", () => {
  it("counts all calendar days (rest days not skipped)", () => {
    // June 1 (Mon) + 7 days = June 7 (Sun). Rest days (Fri/Sat) are counted.
    const dep = new Date(2026, 5, 1);
    const r = calculateDates(dep, 7, "sun-thu");
    expect(fmt(r.returnDate)).toBe("2026-06-07");
    // Resume: June 8 (Mon), no rest-day skip needed
    expect(fmt(r.resumeDate)).toBe("2026-06-08");
  });

  it("resume skips rest days even when return falls on one", () => {
    // June 4 (Thu) + 3 = June 6 (Sat, rest day). Resume skips to June 7 (Sun)
    const dep = new Date(2026, 5, 4);
    const r = calculateDates(dep, 3, "sun-thu");
    expect(fmt(r.returnDate)).toBe("2026-06-06");
    expect(fmt(r.resumeDate)).toBe("2026-06-07");
  });

  it("sat-wed: resume skips rest days", () => {
    // May 26 (Tue) + 3 = May 28 (Thu, rest day). Resume skips to May 30 (Sat)
    const dep = new Date(2026, 4, 26);
    const r = calculateDates(dep, 3, "sat-wed");
    expect(fmt(r.returnDate)).toBe("2026-05-28");
    expect(fmt(r.resumeDate)).toBe("2026-05-30");
  });

  it("both rest days skipped for resume", () => {
    // June 4 (Thu) + 1 = June 4 (Thu). Return on Thu. Resume = June 5 Fri (rest) → June 6 Sat (rest) → June 7 Sun (OK)
    const dep = new Date(2026, 5, 4);
    const r = calculateDates(dep, 1, "sun-thu");
    expect(fmt(r.returnDate)).toBe("2026-06-04");
    expect(fmt(r.resumeDate)).toBe("2026-06-07");
  });

  it("reports no overlaps for a leave with no holidays", () => {
    const dep = new Date(2026, 5, 10);
    const r = calculateDates(dep, 3);
    expect(r.overlaps).toHaveLength(0);
  });

  it("reports an overlap when a holiday falls within the leave", () => {
    const dep = new Date(2026, 5, 22);
    const r = calculateDates(dep, 5);
    expect(r.overlaps.length).toBeGreaterThan(0);
    expect(r.overlaps.some((h) => h.name.includes("عاشوراء"))).toBe(true);
  });

  it("detects holidays in the next year when leave spans year boundary", () => {
    const dep = new Date(2026, 11, 25);
    const r = calculateDates(dep, 15);
    expect(r.returnDate.getFullYear()).toBe(2027);
    expect(r.overlaps.some((h) => h.date.startsWith("2027"))).toBe(true);
  });

  it("handles 1-day leave", () => {
    const dep = new Date(2026, 4, 10);
    const r = calculateDates(dep, 1);
    expect(fmt(r.returnDate)).toBe("2026-05-10");
    expect(fmt(r.resumeDate)).toBe("2026-05-11");
  });

  it("all calendar days count regardless of work week", () => {
    // Same departure + duration = same return regardless of work week
    const dep = new Date(2026, 9, 8);
    const sunThu = calculateDates(dep, 5, "sun-thu");
    const satWed = calculateDates(dep, 5, "sat-wed");
    expect(fmt(sunThu.returnDate)).toBe(fmt(satWed.returnDate));
  });

  it("defaults to Sun-Thu when no work week is given", () => {
    const dep = new Date(2026, 5, 1);
    const r = calculateDates(dep, 7);
    expect(fmt(r.returnDate)).toBe("2026-06-07");
  });

  it("resume date is never a rest day (sun-thu)", () => {
    const dep = new Date(2026, 5, 4);
    const r = calculateDates(dep, 3, "sun-thu");
    const day = r.resumeDate.getDay();
    expect(day).not.toBe(5);
    expect(day).not.toBe(6);
  });

  it("resume date is never a rest day (sat-wed)", () => {
    // July 21 Tue + 2 = July 22 Wed. Resume Jul 23 Thu (rest) → Jul 24 Fri (rest) → Jul 25 Sat
    const dep = new Date(2026, 6, 21);
    const r = calculateDates(dep, 2, "sat-wed");
    expect(fmt(r.returnDate)).toBe("2026-07-22");
    const day = r.resumeDate.getDay();
    expect(day).not.toBe(4);
    expect(day).not.toBe(5);
  });
});
