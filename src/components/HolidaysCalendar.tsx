import { CalendarBlank } from "@phosphor-icons/react";
import { getCachedHolidaysForYear } from "../lib/holidays";
import { getCustomHolidays } from "../lib/storage";
import { useT } from "../lib/i18n";

const MONTH_NAMES_AR = [
  "جانفي", "فيفري", "مارس", "أفريل", "ماي", "جوان",
  "جويلية", "أوت", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر",
];

const MONTH_NAMES_FR = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
];

interface HolidayEntry {
  name: string;
  date: string;
  day: number;
  type: "national" | "religious" | "custom";
}

export function HolidaysCalendar() {
  const t = useT();
  const year = new Date().getFullYear();
  const locale = document.documentElement.lang === "fr" ? "fr" : "ar";
  const monthNames = locale === "fr" ? MONTH_NAMES_FR : MONTH_NAMES_AR;

  const official = getCachedHolidaysForYear(year);
  const custom = getCustomHolidays().filter((h) => h.date.startsWith(String(year)));

  const all: HolidayEntry[] = [
    ...official.map((h) => ({ name: h.name, date: h.date, day: parseInt(h.date.split("-")[2], 10), type: h.type })),
    ...custom.map((h) => ({ name: h.name, date: h.date, day: parseInt(h.date.split("-")[2], 10), type: "custom" as const })),
  ];

  const grouped: Record<number, HolidayEntry[]> = {};
  for (const h of all) {
    const month = parseInt(h.date.split("-")[1], 10) - 1;
    if (!grouped[month]) grouped[month] = [];
    grouped[month].push(h);
  }

  const months = Object.keys(grouped)
    .map(Number)
    .sort((a, b) => a - b);

  return (
    <div className="holidays-card">
      <div className="holidays-card-title">
        <CalendarBlank size={18} weight="duotone" />
        <span>{t("home.holidays.title", { year })}</span>
      </div>
      {months.map((m) => (
        <div key={m} className="holidays-month-group">
          <div className="holidays-month-header">{monthNames[m]}</div>
          {grouped[m]
            .sort((a, b) => a.day - b.day)
            .map((h) => (
              <div key={`${h.date}-${h.name}`} className="holidays-row">
                <span className="holidays-row-date">{String(h.day).padStart(2, "0")}</span>
                <span className="holidays-row-name">{h.name}</span>
                {h.type !== "custom" && (
                  <span className={`holidays-row-type holidays-type-${h.type}`}>
                    {t(h.type === "religious" ? "holiday.type.religious" : "holiday.type.national")}
                  </span>
                )}
              </div>
            ))}
        </div>
      ))}
    </div>
  );
}
