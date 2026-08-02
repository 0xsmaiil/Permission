import { addDays, format, parse, startOfDay } from "date-fns";
import { getCustomHolidays } from "./storage";

export interface Holiday {
  name: string;
  date: string;
  type: "national" | "religious";
}

interface FixedHolidayDef {
  name: string;
  month: number;
  day: number;
  type: "national" | "religious";
}

const FIXED_HOLIDAYS: FixedHolidayDef[] = [
  { name: "رأس السنة الميلادية", month: 1, day: 1, type: "national" },
  { name: "رأس السنة الأمازيغية (يناير)", month: 1, day: 12, type: "national" },
  { name: "عيد العمال", month: 5, day: 1, type: "national" },
  { name: "عيد الاستقلال", month: 7, day: 5, type: "national" },
  { name: "عيد الثورة", month: 11, day: 1, type: "national" },
];

interface IslamicHolidayDef {
  name: string;
  month: number;
  day: number;
}

const ISLAMIC_HOLIDAY_DEFS: IslamicHolidayDef[] = [
  { name: "عيد الفطر", month: 10, day: 1 },
  { name: "عيد الفطر (اليوم الثاني)", month: 10, day: 2 },
  { name: "عيد الأضحى", month: 12, day: 10 },
  { name: "عيد الأضحى (اليوم الثاني)", month: 12, day: 11 },
  { name: "أول محرم (رأس السنة الهجرية)", month: 1, day: 1 },
  { name: "عاشوراء", month: 1, day: 10 },
  { name: "المولد النبوي الشريف", month: 3, day: 12 },
];

function isIslamicLeapYear(year: number): boolean {
  return ((year * 11) + 14) % 30 < 11;
}

function islamicMonthDays(year: number, month: number): number {
  if (month === 12) return isIslamicLeapYear(year) ? 30 : 29;
  return month % 2 === 1 ? 30 : 29;
}

function islamicToJdn(year: number, month: number, day: number): number {
  const epoch = 1948439;
  const yearDays = (year - 1) * 354 + Math.floor(((year - 1) * 11 + 3) / 30);
  let monthDays = 0;
  for (let m = 1; m < month; m++) {
    monthDays += islamicMonthDays(year, m);
  }
  return epoch + yearDays + monthDays + (day - 1);
}

function jdnToDate(jdn: number): Date {
  const Z = Math.floor(jdn + 0.5);
  const F = (jdn + 0.5) - Z;
  const alpha = Math.floor((Z - 1867216.25) / 36524.25);
  const A = Z + 1 + alpha - Math.floor(alpha / 4);
  const B = A + 1524;
  const C = Math.floor((B - 122.1) / 365.25);
  const D = Math.floor(365.25 * C);
  const E = Math.floor((B - D) / 30.6001);
  const day = Math.floor(B - D - Math.floor(30.6001 * E) + F);
  const month = E < 14 ? E - 1 : E - 13;
  const year = month > 2 ? C - 4716 : C - 4715;
  return new Date(year, month - 1, day);
}

function islamicToGregorian(year: number, month: number, day: number): Date {
  return jdnToDate(islamicToJdn(year, month, day));
}

function getIslamicHolidaysForYear(gregorianYear: number): Holiday[] {
  const islamicYear = Math.round((gregorianYear - 622) * 1.03125);
  const candidates: Holiday[] = [];

  for (const offset of [-1, 0, 1]) {
    const hy = islamicYear + offset;
    if (hy < 1) continue;

    for (const def of ISLAMIC_HOLIDAY_DEFS) {
      const date = islamicToGregorian(hy, def.month, def.day);
      if (date.getFullYear() === gregorianYear) {
        candidates.push({ name: def.name, date: format(date, "yyyy-MM-dd"), type: "religious" });
      }
    }
  }

  return candidates;
}

const yearCache = new Map<number, Holiday[]>();

export function getRamadanDatesForYear(gregorianYear: number): Date[] {
  const islamicYear = Math.round((gregorianYear - 622) * 1.03125);
  const dates: Date[] = [];

  for (const offset of [-1, 0, 1]) {
    const hy = islamicYear + offset;
    if (hy < 1) continue;

    const start = islamicToGregorian(hy, 9, 1);
    if (start.getFullYear() !== gregorianYear) continue;

    const monthLen = islamicMonthDays(hy, 9);
    const end = islamicToGregorian(hy, 9, monthLen);
    let cur = start;
    while (cur <= end) {
      dates.push(new Date(cur));
      cur = addDays(cur, 1);
    }
    break;
  }

  return dates;
}

function getRamadanRangesForYear(gregorianYear: number): { start: Date; end: Date }[] {
  const islamicYear = Math.round((gregorianYear - 622) * 1.03125);
  const ranges: { start: Date; end: Date }[] = [];

  for (const offset of [-1, 0, 1]) {
    const hy = islamicYear + offset;
    if (hy < 1) continue;

    const start = islamicToGregorian(hy, 9, 1);
    if (start.getFullYear() !== gregorianYear) continue;

    const monthLen = islamicMonthDays(hy, 9);
    const end = islamicToGregorian(hy, 9, monthLen);
    ranges.push({ start, end });
    break;
  }

  return ranges;
}

export function getCachedHolidaysForYear(year: number): Holiday[] {
  const cached = yearCache.get(year);
  if (cached) return cached;
  const fixed: Holiday[] = FIXED_HOLIDAYS.map((h) => ({
    name: h.name,
    date: `${year}-${String(h.month).padStart(2, "0")}-${String(h.day).padStart(2, "0")}`,
    type: h.type,
  }));
  const religious = getIslamicHolidaysForYear(year);
  const all = [...fixed, ...religious];
  yearCache.set(year, all);
  return all;
}

export function isHoliday(dateStr: string): boolean {
  const [y, m, d] = dateStr.split("-").map(Number);
  if (!y || !m || !d) return false;
  const holidays = getCachedHolidaysForYear(y);
  if (holidays.some((h) => {
    const [hy, hm, hd] = h.date.split("-").map(Number);
    return hy === y && hm === m && hd === d;
  })) return true;
  if (getCustomHolidays().some((h) => h.date === dateStr)) return true;
  const date = new Date(y, m - 1, d);
  return getRamadanRangesForYear(y).some((r) => date >= r.start && date <= r.end);
}

export function calculateDates(departureDate: Date, durationDays: number) {
  const start = startOfDay(departureDate);
  const returnDate = addDays(start, durationDays - 1);

  const holidays: Holiday[] = [];
  const seenHolidays = new Set<string>();

  const firstYear = start.getFullYear();
  const lastYear = returnDate.getFullYear();
  for (let year = firstYear; year <= lastYear; year++) {
    for (const h of getCachedHolidaysForYear(year)) {
      const hDate = parse(h.date, "yyyy-MM-dd", new Date());
      if (hDate >= start && hDate <= returnDate && !seenHolidays.has(h.date)) {
        seenHolidays.add(h.date);
        holidays.push(h);
      }
    }
  }

  for (const h of getCustomHolidays()) {
    const hDate = parse(h.date, "yyyy-MM-dd", new Date());
    if (hDate >= start && hDate <= returnDate && !seenHolidays.has(h.date)) {
      seenHolidays.add(h.date);
      holidays.push({ name: h.name, date: h.date, type: "national" });
    }
  }

  // Check if leave overlaps with Ramadan
  for (let year = firstYear; year <= lastYear; year++) {
    for (const r of getRamadanRangesForYear(year)) {
      if (r.start <= returnDate && r.end >= start && !seenHolidays.has("ramadan-" + year)) {
        seenHolidays.add("ramadan-" + year);
        const overlapStart = r.start > start ? r.start : start;
        const overlapEnd = r.end < returnDate ? r.end : returnDate;
        const ramadanDays = Math.round((overlapEnd.getTime() - overlapStart.getTime()) / 86400000) + 1;
        holidays.push({
          name: `رمضان (${ramadanDays} أيام)`,
          date: format(overlapStart, "yyyy-MM-dd"),
          type: "religious",
        });
      }
    }
  }

  const resumeDate = addDays(returnDate, 1);

  return { returnDate, resumeDate, overlaps: holidays };
}
