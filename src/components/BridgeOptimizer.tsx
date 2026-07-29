import { useMemo, useState } from "react";
import { addDays, differenceInCalendarDays, format, getDay, getDaysInMonth, startOfDay, subDays } from "date-fns";
import { getCachedHolidaysForYear } from "../lib/holidays";
import { useT, getDateFnsLocale } from "../lib/i18n";

interface BridgeResult {
  date: string;
  totalDays: number;
}

function isDayOff(date: Date): boolean {
  return getDay(date) === 5 || getDay(date) === 6;
}

export function BridgeOptimizer() {
  const t = useT();
  const dfnsLocale = getDateFnsLocale();
  const [now] = useState(() => new Date());
  const year = now.getFullYear();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth());

  const results = useMemo(() => {
    const holidays = getCachedHolidaysForYear(year);
    const holidaySet = new Set(holidays.map((h) => h.date));

    const candidates: BridgeResult[] = [];
    const daysInMonth = getDaysInMonth(new Date(year, selectedMonth, 1));

    for (let d = 1; d <= daysInMonth; d++) {
      const depart = startOfDay(new Date(year, selectedMonth, d));
      const leaveEnd = addDays(depart, 2);

      let startCheck = depart;
      while (true) {
        startCheck = subDays(startCheck, 1);
        const ds = format(startCheck, "yyyy-MM-dd");
        if (isDayOff(startCheck) || holidaySet.has(ds)) continue;
        startCheck = addDays(startCheck, 1);
        break;
      }

      let endCheck = leaveEnd;
      while (true) {
        endCheck = addDays(endCheck, 1);
        const ds = format(endCheck, "yyyy-MM-dd");
        if (isDayOff(endCheck) || holidaySet.has(ds)) continue;
        endCheck = subDays(endCheck, 1);
        break;
      }

      const totalDays = differenceInCalendarDays(endCheck, startCheck) + 1;
      candidates.push({ date: format(depart, "yyyy-MM-dd"), totalDays });
    }

    candidates.sort((a, b) => b.totalDays - a.totalDays);
    return candidates.slice(0, 5);
  }, [selectedMonth, year]);

  const formatDate = (dateStr: string): string =>
    format(new Date(dateStr + "T00:00:00"), "d MMMM yyyy", { locale: dfnsLocale });

  return (
    <section className="bridge-section">
      <div className="section-header">
        <h2 className="section-title">{t("bridge.title")}</h2>
      </div>
      <div className="bridge-month-select">
        <label className="bridge-label">{t("bridge.month")}</label>
        <select
          className="bridge-select"
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(Number(e.target.value))}
        >
          {Array.from({ length: 12 }, (_, i) => (
            <option key={i} value={i}>{format(new Date(year, i, 1), "MMMM", { locale: dfnsLocale })}</option>
          ))}
        </select>
      </div>
      <div className="bridge-results">
        {results.map((r, i) => (
          <div key={i} className="bridge-card">
            <div className="bridge-rank">#{i + 1}</div>
            <div className="bridge-info">
              <span className="bridge-date">{formatDate(r.date)}</span>
              <span className="bridge-days">
                {t("bridge.result", { date: formatDate(r.date), total: r.totalDays })}
              </span>
            </div>
            <div className="bridge-total">{r.totalDays}</div>
          </div>
        ))}
      </div>
    </section>
  );
}