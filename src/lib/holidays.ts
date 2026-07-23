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

function buildIslamicHolidayMap(): Record<number, Holiday[]> {
  const map: Record<number, Holiday[]> = {};
  for (let y = 2026; y <= 2050; y++) {
    map[y] = getIslamicHolidaysForYear(y);
  }
  return map;
}

const ISLAMIC_HOLIDAY_MAP = buildIslamicHolidayMap();

export function getHolidaysForYear(year: number): Holiday[] {
  const fixed: Holiday[] = FIXED_HOLIDAYS.map((h) => ({
    name: h.name,
    date: `${year}-${String(h.month).padStart(2, "0")}-${String(h.day).padStart(2, "0")}`,
    type: h.type,
  }));

  const religious = ISLAMIC_HOLIDAY_MAP[year] ?? getIslamicHolidaysForYear(year);

  return [...fixed, ...religious];
}

export function calculateDates(departureDate: Date, durationDays: number) {
  const returnDate = new Date(departureDate.getTime());
  returnDate.setDate(returnDate.getDate() + durationDays - 1);

  const resumeDate = new Date(returnDate.getTime());
  resumeDate.setDate(resumeDate.getDate() + 1);

  const year = departureDate.getFullYear();
  const holidays = getHolidaysForYear(year);

  const overlaps = holidays.filter((h) => {
    const [y, m, d] = h.date.split("-").map(Number);
    const hDate = new Date(y, m - 1, d);
    const dep = new Date(departureDate.getFullYear(), departureDate.getMonth(), departureDate.getDate());
    const ret = new Date(returnDate.getFullYear(), returnDate.getMonth(), returnDate.getDate());
    return hDate >= dep && hDate <= ret;
  });

  return { returnDate, resumeDate, overlaps };
}
