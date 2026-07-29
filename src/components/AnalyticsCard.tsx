import { useMemo } from "react";
import { ChartBar, CalendarBlank, ClockCounterClockwise, Lightning } from "@phosphor-icons/react";
import type { CalculationRecord, LeaveType } from "../lib/storage";
import { getMonthName } from "../lib/constants";
import { useT, getLocale } from "../lib/i18n";

interface Props {
  history: CalculationRecord[];
  onSelect: (departure: string, duration: string, leaveType: LeaveType) => void;
}

export function AnalyticsCard({ history, onSelect }: Props) {
  const t = useT();
  const locale = getLocale();
  const currentYear = new Date().getFullYear();

  const analytics = useMemo(() => {
    const yearHistory = history.filter((h) => {
      const d = new Date(h.departureDate + (h.departureDate.includes("T") ? "" : "T00:00:00"));
      return d.getFullYear() === currentYear;
    });

    const monthly = Array.from({ length: 12 }, () => 0);
    for (const h of yearHistory) {
      const d = new Date(h.departureDate + (h.departureDate.includes("T") ? "" : "T00:00:00"));
      monthly[d.getMonth()] += h.durationDays;
    }

    const maxVal = Math.max(...monthly, 1);
    const total = yearHistory.length;
    const avg = total > 0 ? Math.round((yearHistory.reduce((s, h) => s + h.durationDays, 0) / total) * 10) / 10 : 0;
    const totalOverlaps = yearHistory.reduce((s, h) => s + h.overlaps, 0);
    const busiestMonth = monthly.reduce((best, val, i) => val > monthly[best] ? i : best, 0);
    const busiestVal = monthly[busiestMonth];

    return { monthly, maxVal, total, avg, totalOverlaps, busiestMonth, busiestVal, hasData: total > 0 };
  }, [history, currentYear]);

  const recent = useMemo(() => history.slice(0, 3), [history]);

  if (!analytics.hasData && recent.length === 0) return null;

  const maxBarHeight = 80;

  return (
    <div className="analytics-section">
      {analytics.hasData && (
        <div className="analytics-chart-card">
          <div className="analytics-chart-header">
            <ChartBar size={18} weight="duotone" />
            <span>{currentYear}</span>
          </div>
          <div className="analytics-chart" role="img" aria-label={t("analytics.chart.label", { year: currentYear })}>
            {analytics.monthly.map((val, i) => (
              <div key={i} className="analytics-bar-col">
                <div
                  className={`analytics-bar ${val > 0 ? "analytics-bar-filled" : ""}`}
                  style={{ height: `${Math.max((val / analytics.maxVal) * maxBarHeight, val > 0 ? 4 : 0)}px` }}
                  title={`${getMonthName(i, locale)}: ${val}`}
                />
                <span className="analytics-bar-label">{getMonthName(i, locale).slice(0, 3)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {analytics.hasData && (
        <div className="analytics-insights">
          <div className="insight-item">
            <CalendarBlank size={18} weight="duotone" />
            <span className="insight-value">{analytics.total}</span>
            <span className="insight-label">{t("analytics.leaves")}</span>
          </div>
          <div className="insight-item">
            <ClockCounterClockwise size={18} weight="duotone" />
            <span className="insight-value">{analytics.avg}</span>
            <span className="insight-label">{t("analytics.avgDays")}</span>
          </div>
          <div className="insight-item">
            <Lightning size={18} weight="duotone" />
            <span className="insight-value">{analytics.totalOverlaps}</span>
            <span className="insight-label">{t("analytics.overlaps")}</span>
          </div>
          <div className="insight-item">
            <ChartBar size={18} weight="duotone" />
            <span className="insight-value">{getMonthName(analytics.busiestMonth, locale).slice(0, 3)}</span>
            <span className="insight-label">{analytics.busiestVal > 0 ? `${analytics.busiestVal} ${t("analytics.topMonth")}` : t("analytics.noData")}</span>
          </div>
        </div>
      )}

      {recent.length > 0 && (
        <div className="analytics-recent">
          <h3 className="analytics-recent-title">{t("analytics.recent")}</h3>
          {recent.map((h) => {
            const d = new Date(h.departureDate + (h.departureDate.includes("T") ? "" : "T00:00:00"));
            return (
              <button
                key={h.id}
                type="button"
                className="analytics-recent-item"
                onClick={() => onSelect(h.departureDate, String(h.durationDays), h.leaveType ?? "annual")}
              >
                <span className="analytics-recent-date">
                  {d.getDate().toString().padStart(2, "0")} {getMonthName(d.getMonth(), locale)} {d.getFullYear()}
                </span>
                <span className="analytics-recent-duration">
                  {h.durationDays} {t("history.day")}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
