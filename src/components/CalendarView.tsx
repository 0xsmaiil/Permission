import { useMemo } from "react";
import type { CalculationRecord, LeaveType } from "../lib/storage";
import { getCachedHolidaysForYear } from "../lib/holidays";
import { getMonthName } from "../lib/constants";
import { useT, getLocale } from "../lib/i18n";

const LEAVE_TYPE_COLORS: Record<LeaveType, string> = {
  Conge: "var(--primary)",
  Permission: "#3b82f6",
  Convalescence: "#a855f7",
  Absent: "#f97316",
};


interface MonthCellProps {
  day: number;
  leaveType: LeaveType | null;
  isHoliday: boolean;
  isToday: boolean;
}

function MonthCell({ day, leaveType, isHoliday, isToday }: MonthCellProps) {
  if (day === 0) return <div className="cal-empty" />;
  
  return (
    <div
      className={`cal-cell ${leaveType ? "cal-leave" : ""} ${isHoliday ? "cal-holiday" : ""} ${isToday ? "cal-today" : ""}`}
      style={leaveType ? { backgroundColor: LEAVE_TYPE_COLORS[leaveType] } : undefined}
    >
      <span className="cal-day-num">{day}</span>
      {isHoliday && !leaveType && <span className="cal-holiday-dot" />}
    </div>
  );
}

interface MonthCardProps {
  month: number;
  year: number;
  dayMap: Map<string, LeaveType>;
  holidayDates: Set<string>;
  today: string;
  locale: "ar" | "fr";
}

function MonthCard({ month, year, dayMap, holidayDates, today, locale }: MonthCardProps) {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthName = getMonthName(month, locale);

  const weeks = useMemo(() => {
    const result: { day: number; dateStr: string }[][] = [];
    let week: { day: number; dateStr: string }[] = [];
    for (let i = 0; i < firstDay; i++) {
      week.push({ day: 0, dateStr: "" });
    }
    for (let d = 1; d <= daysInMonth; d++) {
      const ds = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      week.push({ day: d, dateStr: ds });
      if (week.length === 7) {
        result.push(week);
        week = [];
      }
    }
    if (week.length > 0) {
      while (week.length < 7) week.push({ day: 0, dateStr: "" });
      result.push(week);
    }
    return result;
  }, [firstDay, daysInMonth, year, month]);

  const dayHeaders = locale === "ar"
    ? ["ح", "ن", "ث", "ر", "خ", "ج", "س"]
    : ["D", "L", "M", "M", "J", "V", "S"];

  return (
    <div className="month-card">
      <div className="month-header">{monthName} {year}</div>
      <div className="month-grid">
        <div className="month-weekdays">
          {dayHeaders.map((h, i) => <div key={i} className="weekday">{h}</div>)}
        </div>
        <div className="month-days">
          {weeks.map((row, wi) => (
            <div key={wi} className="week-row">
              {row.map((cell, ci) => (
                <MonthCell
                  key={ci}
                  day={cell.day}
                  leaveType={dayMap.get(cell.dateStr) ?? null}
                  isHoliday={holidayDates.has(cell.dateStr)}
                  isToday={cell.dateStr === today}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function CalendarView({ history }: { history: CalculationRecord[] }) {
  const t = useT();
  const locale = getLocale();
  const year = new Date().getFullYear();
  const today = new Date().toISOString().split("T")[0];

  const dayMap = useMemo(() => {
    const map = new Map<string, LeaveType>();
    history.forEach((record) => {
      const start = new Date(record.departureDate + "T00:00:00");
      const endDate = new Date(record.returnDate + "T00:00:00");
      for (let d = new Date(start); d <= endDate; d.setDate(d.getDate() + 1)) {
        const ds = d.toISOString().split("T")[0];
        if (!map.has(ds)) map.set(ds, record.leaveType);
      }
    });
    return map;
  }, [history]);

  const holidayDates = useMemo(() => {
    const set = new Set<string>();
    getCachedHolidaysForYear(year).forEach((h) => set.add(h.date));
    return set;
  }, [year]);

  return (
    <section className="calendar-section">
      <div className="section-header">
        <h2 className="section-title">{t("calendar.title")}</h2>
        <span className="calendar-year">{year}</span>
      </div>
      <div className="calendar-grid">
        {Array.from({ length: 12 }, (_, i) => (
          <MonthCard
            key={i}
            month={i}
            year={year}
            dayMap={dayMap}
            holidayDates={holidayDates}
            today={today}
            locale={locale}
          />
        ))}
      </div>
      <div className="calendar-legend">
        <div className="legend-item">
          <span className="legend-color" style={{ background: "var(--primary)" }} />
          <span>{t("leaveType.conge")}</span>
        </div>
        <div className="legend-item">
          <span className="legend-color" style={{ background: "#3b82f6" }} />
          <span>{t("leaveType.permission")}</span>
        </div>
        <div className="legend-item">
          <span className="legend-color" style={{ background: "#a855f7" }} />
          <span>{t("leaveType.convalescence")}</span>
        </div>
        <div className="legend-item">
          <span className="legend-color" style={{ background: "#f97316" }} />
          <span>{t("leaveType.absent")}</span>
        </div>
        <div className="legend-item">
          <span className="legend-dot" />
          <span>{t("results.overlaps.badge")}</span>
        </div>
      </div>
    </section>
  );
}