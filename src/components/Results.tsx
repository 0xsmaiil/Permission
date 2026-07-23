import { useCallback, useMemo } from "react";
import { format } from "date-fns";
import { CopySimple, ShareNetwork, Printer } from "@phosphor-icons/react";
import { LeaveRequestForm } from "./LeaveRequestForm";
import type { Holiday } from "../lib/holidays";
import { algerianMonths } from "../lib/constants";
import { toast } from "../lib/toast";
import { getAnnualEntitlement, getTotalDaysUsed } from "../lib/storage";
import { t, useT, getLocale, getDateFnsLocale } from "../lib/i18n";

interface ResultsProps {
  returnDate: Date;
  resumeDate: Date;
  overlaps: Holiday[];
  durationDays: number;
  departureDate: Date;
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="detail-row">
      <span className="detail-label">{label}</span>
      <span className="detail-value">{value}</span>
    </div>
  );
}

function fmt(d: Date) {
  const dfnsLocale = getDateFnsLocale();
  const dayName = format(d, "EEEE", { locale: dfnsLocale });
  const day = format(d, "dd", { locale: dfnsLocale });
  const month = algerianMonths[d.getMonth()];
  const year = format(d, "yyyy", { locale: dfnsLocale });
  const comma = getLocale() === "fr" ? "," : "،";
  return `${dayName}${comma} ${day} ${month} ${year}`;
}

function fmtShort(d: Date) {
  const dfnsLocale = getDateFnsLocale();
  const day = format(d, "dd", { locale: dfnsLocale });
  const month = algerianMonths[d.getMonth()];
  const year = format(d, "yyyy", { locale: dfnsLocale });
  return `${day} ${month} ${year}`;
}

function generateSummary(departureDate: Date, returnDate: Date, resumeDate: Date, durationDays: number, overlaps: Holiday[]): string {
  const lines: string[] = [];
  lines.push(t("results.summary.title"));
  lines.push("─".repeat(24));
  lines.push(`${t("results.departure")}: ${fmt(departureDate)}`);
  lines.push(`${t("results.returnDate")}: ${fmt(returnDate)}`);
  lines.push(`${t("results.resumeDate")}: ${fmt(resumeDate)}`);
  lines.push(`${t("results.days")}: ${durationDays}`);
  if (overlaps.length > 0) {
    lines.push("");
    lines.push(`${t("results.days")} (${overlaps.length}):`);
    for (const h of overlaps) {
      lines.push(`  • ${h.name} (${fmtShort(new Date(h.date))})`);
    }
  }
  lines.push("");
  lines.push(t("results.disclaimer"));
  return lines.join("\n");
}

export function Results({ returnDate, resumeDate, overlaps, durationDays, departureDate }: ResultsProps) {
  const t = useT();
  const annualInfo = useMemo(() => {
    const entitlement = getAnnualEntitlement();
    if (entitlement === 0) return null;
    const used = getTotalDaysUsed();
    const remaining = Math.max(0, entitlement - used);
    return { used, remaining, entitlement };
  }, []);

  const handleCopy = useCallback(() => {
    const summary = generateSummary(departureDate, returnDate, resumeDate, durationDays, overlaps);
    navigator.clipboard.writeText(summary).then(() => toast(t("results.copied"))).catch(() => toast(t("results.share.fail")));
  }, [departureDate, returnDate, resumeDate, durationDays, overlaps]);

  const handleShare = useCallback(() => {
    const summary = generateSummary(departureDate, returnDate, resumeDate, durationDays, overlaps);
    if (navigator.share) {
      navigator.share({ title: t("results.summary.title"), text: summary }).catch(() => {});
    } else {
      handleCopy();
    }
  }, [departureDate, returnDate, resumeDate, durationDays, overlaps, handleCopy]);

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  return (
    <div className="results">
      <div className="results-grid">
        <div className="result-card">
          <span className="result-label">{t("results.returnDate")}</span>
          <span className="result-number">
            {format(returnDate, "dd", { locale: getDateFnsLocale() })}
            <span className="result-month">{algerianMonths[returnDate.getMonth()]}</span>
          </span>
          <span className="result-full">{fmt(returnDate)}</span>
        </div>
        <div className="result-card">
          <span className="result-label">{t("results.resumeDate")}</span>
          <span className="result-number">
            {format(resumeDate, "dd", { locale: getDateFnsLocale() })}
            <span className="result-month">{algerianMonths[resumeDate.getMonth()]}</span>
          </span>
          <span className="result-full">{fmt(resumeDate)}</span>
        </div>
      </div>

      <div className="details-section">
        <div className="details-header">
          <span>{t("results.period")}</span>
          <span className="duration-badge">{durationDays} {t("results.days")}</span>
        </div>
        <div className="details-body">
          <DetailRow label={t("results.departure")} value={fmt(departureDate)} />
          <div className="divider" />
          <DetailRow label={t("results.returnDate")} value={fmt(returnDate)} />
          <div className="divider" />
          <DetailRow label={t("results.resumeDate")} value={fmt(resumeDate)} />
        </div>
      </div>

      {overlaps.length > 0 ? (
        <div className="overlaps-section">
          <h4>{t("results.overlaps.title", { count: overlaps.length })}</h4>
          <div className="overlaps-list">
            {overlaps.map((h, i) => (
              <div key={`${h.name}-${h.date}-${i}`} className="overlap-item">
                <div className="overlap-info">
                  <span className="overlap-name">{h.name}</span>
                  <span className="overlap-date">
                    {format(new Date(h.date), "dd", { locale: getDateFnsLocale() })} {algerianMonths[new Date(h.date).getMonth()]} {format(new Date(h.date), "yyyy", { locale: getDateFnsLocale() })}
                  </span>
                </div>
                <span className="overlap-badge">{t("results.overlaps.badge")}</span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="no-overlaps">
          <span /> {t("results.overlaps.none")}
        </div>
      )}

      <div className="results-actions">
        <button type="button" className="btn btn-outline btn-sm" onClick={handleCopy}>
          <CopySimple size={16} weight="duotone" />
          {t("results.copy")}
        </button>
        <button type="button" className="btn btn-outline btn-sm" onClick={handleShare}>
          <ShareNetwork size={16} weight="duotone" />
          {t("results.share")}
        </button>
        <button type="button" className="btn btn-outline btn-sm" onClick={handlePrint}>
          <Printer size={16} weight="duotone" />
          {t("results.print")}
        </button>
      </div>
      <LeaveRequestForm
        departureDate={departureDate}
        returnDate={returnDate}
        resumeDate={resumeDate}
        durationDays={durationDays}
        overlaps={overlaps}
      />

      {annualInfo && (
        <div className="results-entitlement">
          <span>{t("results.entitlement.used")}: <strong>{annualInfo.used}</strong></span>
          <span>{t("results.entitlement.remaining")}: <strong>{annualInfo.remaining}</strong></span>
          <span>{t("results.entitlement.total")}: <strong>{annualInfo.entitlement}</strong></span>
        </div>
      )}

      <div className="results-disclaimer">
        {t("results.disclaimer")}
      </div>
    </div>
  );
}
