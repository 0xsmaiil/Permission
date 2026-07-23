import { useState, useEffect, useCallback } from "react";
import { format } from "date-fns";
import { Trash, ArrowLeft, Calculator, Download } from "@phosphor-icons/react";
import { algerianMonths } from "../lib/constants";
import { getHistory, clearHistory, type CalculationRecord } from "../lib/storage";
import { toLocalDateStr } from "../lib/dates";
import { useT, getDateFnsLocale } from "../lib/i18n";

interface Props {
  onLoadCalculation: (departure: string, duration: string) => void;
  onTabChange: (tab: number) => void;
}

export function HistoryTab({ onLoadCalculation, onTabChange }: Props) {
  const t = useT();
  const [history, setHistory] = useState<CalculationRecord[]>([]);

  useEffect(() => {
    setHistory(getHistory());
  }, []);

  const handleClear = () => {
    clearHistory();
    setHistory([]);
  };

  const handleExportCSV = useCallback(() => {
    const rows = [["id", "departureDate", "durationDays", "returnDate", "resumeDate", "overlaps", "createdAt"]];
    for (const h of history) {
      rows.push([h.id, h.departureDate, String(h.durationDays), h.returnDate, h.resumeDate, String(h.overlaps), h.createdAt]);
    }
    const csv = rows.map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `permission-history-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [history]);

  if (history.length === 0) {
    return (
      <div className="tab-page history-page">
        <div className="empty-state">
          <svg className="empty-illustration" width="160" height="120" viewBox="0 0 160 120" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="30" y="16" width="100" height="88" rx="8" stroke="#94a3b8" strokeWidth="2" fill="#f8f9fc" />
            <rect x="46" y="8" width="68" height="16" rx="4" fill="#eab308" />
            <rect x="46" y="38" width="16" height="4" rx="2" fill="#cbd5e1" />
            <rect x="46" y="50" width="48" height="4" rx="2" fill="#cbd5e1" />
            <rect x="46" y="62" width="36" height="4" rx="2" fill="#cbd5e1" />
            <rect x="46" y="74" width="56" height="4" rx="2" fill="#cbd5e1" />
            <rect x="98" y="38" width="16" height="4" rx="2" fill="#cbd5e1" />
            <rect x="98" y="50" width="16" height="4" rx="2" fill="#cbd5e1" />
            <rect x="82" y="62" width="16" height="4" rx="2" fill="#cbd5e1" />
            <rect x="74" y="74" width="16" height="4" rx="2" fill="#cbd5e1" />
            <circle cx="80" cy="104" r="16" fill="#eab308" opacity="0.15" />
            <path d="M74 106l4 4 8-8" stroke="#eab308" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <h3>{t("history.empty.title")}</h3>
          <p>{t("history.empty.desc")}</p>
          <button className="btn btn-primary" onClick={() => onTabChange(1)}>
            <Calculator size={18} weight="duotone" /> {t("history.empty.action")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="tab-page history-page">
      <div className="history-header-bar">
        <h2>{t("history.title")}</h2>
        <div className="history-header-actions">
          <button onClick={handleExportCSV} className="btn-text">
            <Download size={14} /> CSV
          </button>
          <button onClick={handleClear} className="btn-text">
            <Trash size={14} /> {t("history.clear")}
          </button>
        </div>
      </div>

      <div className="history-tab-list">
        {history.map((h) => {
          const raw = h.departureDate.includes("T")
            ? new Date(h.departureDate)
            : new Date(h.departureDate + "T00:00:00");
          if (isNaN(raw.getTime())) return null;
          return (
            <div
              key={h.id}
              role="button"
              tabIndex={0}
              className="history-tab-item"
              onClick={() => {
                onLoadCalculation(
                  toLocalDateStr(raw),
                  String(h.durationDays)
                );
                onTabChange(1);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onLoadCalculation(toLocalDateStr(raw), String(h.durationDays));
                  onTabChange(1);
                }
              }}
            >
              <div className="history-tab-left">
                <div className="history-tab-duration">{h.durationDays}</div>
                <div className="history-tab-info">
                  <span className="history-tab-label">{t("history.day")}</span>
                  <span className="history-tab-date">
                    {algerianMonths[raw.getMonth()]} {format(raw, "dd", { locale: getDateFnsLocale() })}
                  </span>
                </div>
              </div>
              {h.overlaps > 0 && (
                <span className="history-tab-overlap">+{h.overlaps} {t("history.overlap")}</span>
              )}
              <ArrowLeft size={16} className="history-tab-arrow" />
            </div>
          );
        })}
      </div>
    </div>
  );
}


