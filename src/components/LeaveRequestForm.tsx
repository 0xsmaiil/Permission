import { useCallback } from "react";
import { format } from "date-fns";
import { FileText } from "@phosphor-icons/react";
import type { Holiday } from "../lib/holidays";
import { algerianMonths } from "../lib/constants";
import { useT, getDateFnsLocale, getLocale } from "../lib/i18n";
import { toast } from "../lib/toast";

interface Props {
  departureDate: Date;
  returnDate: Date;
  resumeDate: Date;
  durationDays: number;
  overlaps: Holiday[];
}

function f(d: Date) {
  const dfns = getDateFnsLocale();
  const day = format(d, "dd", { locale: dfns });
  const month = algerianMonths[d.getMonth()];
  const year = d.getFullYear();
  return `${day} ${month} ${year}`;
}

export function LeaveRequestForm({ departureDate, returnDate, resumeDate, durationDays, overlaps }: Props) {
  const t = useT();
  const handlePrint = useCallback(() => {
    const w = window.open("", "_blank");
    if (!w) { toast(t("leaveRequest.fail")); return; }
    const loc = getLocale();
    const isAr = loc === "ar";

    w.document.write(`
      <!DOCTYPE html>
      <html dir="${isAr ? "rtl" : "ltr"}" lang="${loc}">
      <head><meta charset="UTF-8"><title>${t("leaveRequest.title")} - Permission</title>
      <link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800&display=swap" rel="stylesheet">
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          font-family: 'Tajawal', Arial, sans-serif;
          padding: 40px;
          color: #1e293b;
          line-height: 1.8;
        }
        .header { text-align: center; margin-bottom: 32px; }
        .header h1 { font-size: 22px; font-weight: 900; margin-bottom: 4px; }
        .header p { font-size: 13px; color: #64748b; }
        .line { border: none; border-top: 2px solid #eab308; margin: 16px 0; }
        .field { margin-bottom: 12px; }
        .field-label { font-size: 11px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px; }
        .field-value { font-size: 16px; font-weight: 700; padding: 6px 0; border-bottom: 1px solid #e2e8f0; }
        .section-title { font-size: 14px; font-weight: 800; margin: 24px 0 12px; color: #eab308; }
        .signature { margin-top: 48px; display: flex; justify-content: space-between; }
        .signature div { width: 45%; }
        .signature p { font-size: 11px; color: #94a3b8; margin-bottom: 4px; }
        .sig-line { border-bottom: 1px solid #1e293b; height: 40px; margin-bottom: 4px; }
        .footer { margin-top: 32px; font-size: 11px; color: #94a3b8; text-align: center; }
        @media print { body { padding: 20px; } }
      </style></head>
      <body>
        <div class="header">
          <h1>${t("leaveRequest.title")}</h1>
          <p>${t("leaveRequest.subtitle")}</p>
        </div>
        <hr class="line">
        <div class="section-title">${t("leaveRequest.section")}</div>
        <div class="field">
          <div class="field-label">${t("leaveRequest.duration")}</div>
          <div class="field-value">${durationDays} ${t("leaveRequest.day")}</div>
        </div>
        <div class="field">
          <div class="field-label">${t("leaveRequest.departure")}</div>
          <div class="field-value">${f(departureDate)}</div>
        </div>
        <div class="field">
          <div class="field-label">${t("leaveRequest.return")}</div>
          <div class="field-value">${f(returnDate)}</div>
        </div>
        <div class="field">
          <div class="field-label">${t("leaveRequest.resume")}</div>
          <div class="field-value">${f(resumeDate)}</div>
        </div>
        ${overlaps.length > 0 ? `
        <div class="section-title">${t("leaveRequest.holidays")}</div>
        ${overlaps.map(h => `<div class="field"><div class="field-value">${h.name} (${h.date})</div></div>`).join("")}
        ` : ""}
        <hr class="line">
        <div class="signature">
          <div>
            <p>${t("leaveRequest.employeeSig")}</p>
            <div class="sig-line"></div>
          </div>
          <div>
            <p>${t("leaveRequest.supervisorSig")}</p>
            <div class="sig-line"></div>
          </div>
        </div>
        <div class="footer">
          ${t("leaveRequest.generatedBy")}
        </div>
      </body></html>
    `);
    w.document.close();
    setTimeout(() => w.print(), 500);
  }, [departureDate, returnDate, resumeDate, durationDays, overlaps]);

  return (
    <div className="results-actions">
      <button type="button" className="btn btn-outline btn-sm" onClick={handlePrint}>
        <FileText size={16} weight="duotone" />
        {t("results.leaveRequest")}
      </button>
    </div>
  );
}
