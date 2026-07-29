import { useMemo } from "react";
import { Article, ChartBar, Lightning, CalendarBlank } from "@phosphor-icons/react";
import type { CalculationRecord } from "../lib/storage";
import { getLeaveTypeLabel } from "../lib/storage";
import { getMonthName } from "../lib/constants";
import { useT, getLocale } from "../lib/i18n";

interface Props {
  history: CalculationRecord[];
}

export function AnnualReport({ history }: Props) {
  const t = useT();
  const locale = getLocale();
  const currentYear = new Date().getFullYear();

  const report = useMemo(() => {
    const yearHistory = history.filter((h) => {
      const d = new Date(h.departureDate + (h.departureDate.includes("T") ? "" : "T00:00:00"));
      return d.getFullYear() === currentYear;
    });

    if (yearHistory.length === 0) return null;

    const byType: Record<string, { count: number; days: number }> = {};
    const monthly = Array.from({ length: 12 }, () => 0);
    let totalOverlaps = 0;

    for (const h of yearHistory) {
      const type = h.leaveType ?? "annual";
      if (!byType[type]) byType[type] = { count: 0, days: 0 };
      byType[type].count++;
      byType[type].days += h.durationDays;
      totalOverlaps += h.overlaps;

      const d = new Date(h.departureDate + (h.departureDate.includes("T") ? "" : "T00:00:00"));
      monthly[d.getMonth()] += h.durationDays;
    }

    const totalDays = yearHistory.reduce((s, h) => s + h.durationDays, 0);
    const avg = Math.round((totalDays / yearHistory.length) * 10) / 10;
    const busiestMonth = monthly.reduce((best, val, i) => val > monthly[best] ? i : best, 0);

    return { totalDays, totalLeaves: yearHistory.length, avg, totalOverlaps, busiestMonth, byType };
  }, [history, currentYear]);

  if (!report) return null;

  return (
    <div className="annual-report">
      <div className="report-header">
        <Article size={18} weight="duotone" />
        <span>{t("report.title")} {currentYear}</span>
      </div>

      <div className="report-stats">
        <div className="report-stat">
          <CalendarBlank size={16} weight="duotone" />
          <span className="report-stat-value">{report.totalLeaves}</span>
          <span className="report-stat-label">{t("report.leaves")}</span>
        </div>
        <div className="report-stat">
          <ChartBar size={16} weight="duotone" />
          <span className="report-stat-value">{report.totalDays}</span>
          <span className="report-stat-label">{t("report.totalDays")}</span>
        </div>
        <div className="report-stat">
          <Lightning size={16} weight="duotone" />
          <span className="report-stat-value">{report.totalOverlaps}</span>
          <span className="report-stat-label">{t("analytics.overlaps")}</span>
        </div>
      </div>

      <div className="report-types">
        <span className="report-types-title">{t("report.byType")}</span>
        {Object.entries(report.byType).map(([type, data]) => (
          <div key={type} className="report-type-row">
            <span className={`leave-type-badge leave-type-${type}`}>
              {getLeaveTypeLabel(type, t)}
            </span>
            <span className="report-type-data">
              {data.count} {t("report.leaves")} · {data.days} {t("results.days")}
            </span>
          </div>
        ))}
      </div>

      <div className="report-footer">
        <span>{t("report.topMonth")}: {getMonthName(report.busiestMonth, locale)}</span>
        <span>{t("analytics.avgDays")}: {report.avg} {t("results.days")}</span>
      </div>
    </div>
  );
}
