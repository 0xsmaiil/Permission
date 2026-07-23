import { format } from "date-fns";
import { ar } from "date-fns/locale";
import type { Holiday } from "../lib/holidays";
import { algerianMonths } from "../lib/constants";

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

export function Results({ returnDate, resumeDate, overlaps, durationDays, departureDate }: ResultsProps) {
  const fmt = (d: Date) => {
    const dayName = format(d, "EEEE", { locale: ar });
    const day = format(d, "dd", { locale: ar });
    const month = algerianMonths[d.getMonth()];
    const year = format(d, "yyyy", { locale: ar });
    return `${dayName}، ${day} ${month} ${year}`;
  };

  return (
    <div className="results">
      <div className="results-grid">
        <div className="result-card">
          <span className="result-label">تاريخ العودة</span>
          <span className="result-number">
            {format(returnDate, "dd", { locale: ar })}
            <span className="result-month">{algerianMonths[returnDate.getMonth()]}</span>
          </span>
          <span className="result-full">{fmt(returnDate)}</span>
        </div>
        <div className="result-card">
          <span className="result-label">تاريخ الاستئناف</span>
          <span className="result-number">
            {format(resumeDate, "dd", { locale: ar })}
            <span className="result-month">{algerianMonths[resumeDate.getMonth()]}</span>
          </span>
          <span className="result-full">{fmt(resumeDate)}</span>
        </div>
      </div>

      <div className="details-section">
        <div className="details-header">
          <span>تفاصيل الفترة</span>
          <span className="duration-badge">{durationDays} أيام</span>
        </div>
        <div className="details-body">
          <DetailRow label="تاريخ الانطلاق" value={fmt(departureDate)} />
          <div className="divider" />
          <DetailRow label="تاريخ العودة" value={fmt(returnDate)} />
          <div className="divider" />
          <DetailRow label="تاريخ الاستئناف" value={fmt(resumeDate)} />
        </div>
      </div>

      {overlaps.length > 0 ? (
        <div className="overlaps-section">
          <h4>تنبيه: تداخل مع الأعياد ({overlaps.length})</h4>
          <div className="overlaps-list">
            {overlaps.map((h, i) => (
              <div key={`${h.name}-${h.date}-${i}`} className="overlap-item">
                <div className="overlap-info">
                  <span className="overlap-name">{h.name}</span>
                  <span className="overlap-date">
                    {format(new Date(h.date), "dd", { locale: ar })} {algerianMonths[new Date(h.date).getMonth()]} {format(new Date(h.date), "yyyy", { locale: ar })}
                  </span>
                </div>
                <span className="overlap-badge">عطلة رسمية</span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="no-overlaps">
          <span /> لا توجد أعياد رسمية خلال هذه الفترة
        </div>
      )}
    </div>
  );
}
