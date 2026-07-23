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
        const ds = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
        candidates.push({ name: def.name, date: ds, type: "religious" });
      }
    }
  }

  return candidates;
}

const yearCache = new Map<number, Holiday[]>();

function getCachedHolidaysForYear(year: number): Holiday[] {
  if (yearCache.has(year)) return yearCache.get(year)!;
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

export type WorkWeek = "sun-thu" | "sat-wed";

const REST_DAYS: Record<WorkWeek, number[]> = {
  "sun-thu": [5, 6],
  "sat-wed": [4, 5],
};

export function isHoliday(dateStr: string): boolean {
  const [y, m, d] = dateStr.split("-").map(Number);
  if (!y || !m || !d) return false;
  const holidays = getCachedHolidaysForYear(y);
  if (holidays.some((h) => {
    const [hy, hm, hd] = h.date.split("-").map(Number);
    return hy === y && hm === m && hd === d;
  })) return true;
  return getCustomHolidays().some((h) => h.date === dateStr);
}

export function isRestDay(date: Date, workWeek: WorkWeek): boolean {
  return REST_DAYS[workWeek].includes(date.getDay());
}

function dateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function isHolidayDate(d: Date): boolean {
  return isHoliday(dateStr(d));
}

export function calculateDates(departureDate: Date, durationDays: number, workWeek?: WorkWeek) {
  const ww = workWeek ?? "sun-thu";

  const cursor = new Date(departureDate);
  let counted = 0;

  const holidays: Holiday[] = [];
  const seenHolidays = new Set<string>();

  while (counted < durationDays) {
    if (isRestDay(cursor, ww) || isHolidayDate(cursor)) {
      const ds = dateStr(cursor);
      if (isHolidayDate(cursor) && !seenHolidays.has(ds)) {
        seenHolidays.add(ds);
        const hds = dateStr(cursor);
        const found = getCachedHolidaysForYear(cursor.getFullYear()).filter(
          (h) => h.date === hds,
        );
        for (const f of found) {
          if (!holidays.some((x) => x.name === f.name && x.date === f.date)) {
            holidays.push(f);
          }
        }
      }
    } else {
      counted++;
    }
    if (counted < durationDays) {
      cursor.setDate(cursor.getDate() + 1);
    }
  }

  const returnDate = new Date(cursor);

  const resumeDate = new Date(returnDate);
  resumeDate.setDate(resumeDate.getDate() + 1);
  while (isRestDay(resumeDate, ww) || isHolidayDate(resumeDate)) {
    resumeDate.setDate(resumeDate.getDate() + 1);
  }

  return { returnDate, resumeDate, overlaps: holidays };
}
