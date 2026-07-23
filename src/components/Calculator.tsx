import { useState, useMemo, useCallback } from "react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { Calendar, Clock, ArrowLeft, ArrowClockwise, Lightning } from "@phosphor-icons/react";
import { calculateDates, getHolidaysForYear, type Holiday } from "../lib/holidays";
import { algerianMonths } from "../lib/constants";
import { Results } from "./Results";
import { BottomSheet } from "./BottomSheet";
import { addToHistory } from "../lib/storage";

export function Calculator() {
  const [duration, setDuration] = useState("");
  const [departureDate, setDepartureDate] = useState("");
  const [result, setResult] = useState<ReturnType<typeof calculateDates> | null>(null);
  const [error, setError] = useState("");
  const [sheetOpen, setSheetOpen] = useState(false);

  const today = useMemo(() => new Date().toISOString().split("T")[0], []);

  const parsedDate = useMemo(() => {
    if (!departureDate) return null;
    const d = new Date(departureDate + "T00:00:00");
    return isNaN(d.getTime()) ? null : d;
  }, [departureDate]);

  const holidays = useMemo(() => {
    const all: Holiday[] = [];
    for (let y = 2024; y <= 2050; y++) all.push(...getHolidaysForYear(y));
    return all;
  }, []);

  const holidayDates = useMemo(() => holidays.map((h) => new Date(h.date)), [holidays]);

  const isHoliday = useCallback(
    (dateStr: string) => holidayDates.some((hd) => hd.toISOString().split("T")[0] === dateStr),
    [holidayDates]
  );

  const handleCalculate = useCallback(() => {
    setError("");
    const days = parseInt(duration, 10);

    if (!duration || isNaN(days) || days < 1) {
      setError("يرجى إدخال مدة صحيحة");
      return;
    }
    if (days > 90) {
      setError("المدة لا تتجاوز 90 يوم");
      return;
    }
    if (!departureDate || !parsedDate) {
      setError("يرجى اختيار تاريخ الذهاب");
      return;
    }

    const r = calculateDates(parsedDate, days);
    setResult(r);
    setSheetOpen(true);

    addToHistory({
      departureDate: parsedDate.toISOString(),
      durationDays: days,
      returnDate: r.returnDate.toISOString(),
      resumeDate: r.resumeDate.toISOString(),
      overlaps: r.overlaps.length,
    });
  }, [duration, departureDate, parsedDate]);

  const handleReset = () => {
    setDuration("");
    setDepartureDate("");
    setResult(null);
    setError("");
  };

  return (
    <div className="tab-page calc-page">
      <div className="calc-scroll">
        <div className="section">
          <div className="section-header">
            <Clock size={16} weight="duotone" />
            <label>مدة العطلة (بالأيام)</label>
          </div>
          <input
            type="number"
            min={1}
            max={90}
            value={duration}
            onChange={(e) => {
              const v = parseInt(e.target.value, 10);
              if (!isNaN(v) && v > 90) return;
              setDuration(e.target.value);
              setResult(null);
              setError("");
            }}
            placeholder="أدخل المدة"
            className="input"
            dir="rtl"
          />
          <div className="chips-grid">
            {[3, 5, 7, 10, 15, 25, 30, 50].map((n) => (
              <button
                key={n}
                onClick={() => { setDuration(String(n)); setResult(null); setError(""); }}
                className={`chip ${duration === String(n) ? "chip-active" : ""}`}
              >
                {n}
              </button>
            ))}
          </div>
          {error && <p className="error-text">{error}</p>}
        </div>

        <div className="section">
          <div className="section-header">
            <Calendar size={16} weight="duotone" />
            <label>تاريخ الذهاب</label>
          </div>
          <input
            type="date"
            value={departureDate}
            onChange={(e) => { setDepartureDate(e.target.value); setResult(null); setError(""); }}
            min={today}
            className={`input ${isHoliday(departureDate) ? "input-error" : ""}`}
            dir="rtl"
          />
          {departureDate && isHoliday(departureDate) && (
            <p className="field-hint error">تنبيه: التاريخ يوافق عطلة رسمية</p>
          )}
        </div>

        <button
          onClick={handleCalculate}
          disabled={!duration || !departureDate}
          className="btn btn-primary btn-lg"
        >
          <Lightning size={20} weight="duotone" />
          احسب
        </button>

        {result && (
          <button onClick={handleReset} className="btn btn-outline btn-lg">
            <ArrowClockwise size={20} weight="duotone" />
            حساب جديد
          </button>
        )}
      </div>

      <BottomSheet open={sheetOpen} onClose={() => setSheetOpen(false)}>
        {result && parsedDate && (
          <Results
            returnDate={result.returnDate}
            resumeDate={result.resumeDate}
            overlaps={result.overlaps}
            durationDays={parseInt(duration, 10)}
            departureDate={parsedDate}
          />
        )}
      </BottomSheet>
    </div>
  );
}
