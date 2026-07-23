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
  const wws: WorkWeek[] = ["sun-thu", "sat-wed"];

  it("skips rest days in Sun-Thu work week", () => {
    const dep = new Date(2026, 5, 1);
    const r = calculateDates(dep, 7, "sun-thu");
    expect(fmt(r.returnDate)).toBe("2026-06-09");
    expect(fmt(r.resumeDate)).toBe("2026-06-10");
  });

  it("skips rest days in Sat-Wed work week", () => {
    const dep = new Date(2026, 4, 24);
    const r = calculateDates(dep, 5, "sat-wed");
    expect(fmt(r.returnDate)).toBe("2026-06-01");
    expect(fmt(r.resumeDate)).toBe("2026-06-02");
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

  it("returns different dates for different work weeks", () => {
    const dep = new Date(2026, 9, 8);
    const sunThu = calculateDates(dep, 1, "sun-thu");
    const satWed = calculateDates(dep, 1, "sat-wed");
    expect(fmt(sunThu.returnDate)).not.toBe(fmt(satWed.returnDate));
  });

  it("defaults to Sun-Thu when no work week is given", () => {
    const dep = new Date(2026, 5, 1);
    const explicit = calculateDates(dep, 7, "sun-thu");
    const implicit = calculateDates(dep, 7);
    expect(fmt(explicit.returnDate)).toBe(fmt(implicit.returnDate));
  });

  for (const ww of wws) {
    it(`resume date is never a rest day (${ww})`, () => {
      const dep = new Date(2026, 5, 1);
      const r = calculateDates(dep, 7, ww);
      const day = r.resumeDate.getDay();
      if (ww === "sun-thu") {
        expect(day).not.toBe(5);
        expect(day).not.toBe(6);
      } else {
        expect(day).not.toBe(4);
        expect(day).not.toBe(5);
      }
    });
  }
});
