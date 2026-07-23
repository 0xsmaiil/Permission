import { useState, useEffect } from "react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { Trash, ArrowLeft, ClipboardText } from "@phosphor-icons/react";
import { algerianMonths } from "../lib/constants";
import { getHistory, clearHistory, type CalculationRecord } from "../lib/storage";

interface Props {
  onLoadCalculation: (departure: string, duration: string) => void;
  onTabChange: (tab: number) => void;
}

export function HistoryTab({ onLoadCalculation, onTabChange }: Props) {
  const [history, setHistory] = useState<CalculationRecord[]>([]);

  useEffect(() => {
    setHistory(getHistory());
  }, []);

  const handleClear = () => {
    clearHistory();
    setHistory([]);
  };

  if (history.length === 0) {
    return (
      <div className="tab-page history-page">
        <div className="empty-state">
          <ClipboardText size={48} weight="duotone" className="empty-icon" />
          <h3>لا توجد عمليات سابقة</h3>
          <p>استخدم الحاسبة لحساب عطلتك وسيظهر السجل هنا</p>
          <button className="btn btn-primary" onClick={() => onTabChange(1)}>
            <Calculator size={18} /> اذهب للحاسبة
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="tab-page history-page">
      <div className="history-header-bar">
        <h2>السجل</h2>
        <button onClick={handleClear} className="btn-text">
          <Trash size={14} /> مسح الكل
        </button>
      </div>

      <div className="history-tab-list">
        {history.map((h) => {
          const depDate = new Date(h.departureDate);
          return (
            <div
              key={h.id}
              className="history-tab-item"
              onClick={() => {
                onLoadCalculation(
                  depDate.toISOString().split("T")[0],
                  String(h.durationDays)
                );
                onTabChange(1);
              }}
            >
              <div className="history-tab-left">
                <div className="history-tab-duration">{h.durationDays}</div>
                <div className="history-tab-info">
                  <span className="history-tab-label">يوم</span>
                  <span className="history-tab-date">
                    {algerianMonths[depDate.getMonth()]} {format(depDate, "dd", { locale: ar })}
                  </span>
                </div>
              </div>
              {h.overlaps > 0 && (
                <span className="history-tab-overlap">+{h.overlaps} عطلة</span>
              )}
              <ArrowLeft size={16} className="history-tab-arrow" />
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Calculator({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 256 256" fill="currentColor">
      <rect x="40" y="40" width="176" height="176" rx="8" fill="none" stroke="currentColor" strokeWidth="16" />
      <line x1="72" y1="92" x2="184" y2="92" stroke="currentColor" strokeWidth="16" strokeLinecap="round" />
      <line x1="72" y1="128" x2="184" y2="128" stroke="currentColor" strokeWidth="16" strokeLinecap="round" />
      <line x1="72" y1="164" x2="184" y2="164" stroke="currentColor" strokeWidth="16" strokeLinecap="round" />
    </svg>
  );
}
