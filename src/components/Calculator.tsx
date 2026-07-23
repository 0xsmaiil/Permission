import { useState, useMemo, useCallback } from "react";
import { Calendar, Clock, ArrowClockwise, Lightning, Buildings } from "@phosphor-icons/react";
import { calculateDates, isHoliday as checkHoliday, type WorkWeek } from "../lib/holidays";
import { Results } from "./Results";
import { BottomSheet } from "./BottomSheet";
import { DatePicker } from "./DatePicker";
import { InstallBanner } from "./InstallBanner";
import { addToHistory, saveReminder, getWorkWeek, setWorkWeek } from "../lib/storage";
import { toLocalDateStr } from "../lib/dates";
import { useT } from "../lib/i18n";

export function Calculator() {
  const t = useT();
  const [duration, setDuration] = useState("");
  const [departureDate, setDepartureDate] = useState("");
  const [result, setResult] = useState<ReturnType<typeof calculateDates> | null>(null);
  const [error, setError] = useState("");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [workWeek, setWorkWeekState] = useState<WorkWeek>(getWorkWeek);

  const today = useMemo(() => new Date().toISOString().split("T")[0], []);

  const parsedDate = useMemo(() => {
    if (!departureDate) return null;
    const d = new Date(departureDate + "T00:00:00");
    return isNaN(d.getTime()) ? null : d;
  }, [departureDate]);

  const handleWorkWeekChange = useCallback((ww: WorkWeek) => {
    setWorkWeekState(ww);
    setWorkWeek(ww);
    setResult(null);
  }, []);

  const handleCalculate = useCallback(() => {
    setError("");
    const days = parseInt(duration, 10);

    if (!duration || isNaN(days) || days < 1) {
      setError(t("calc.duration.error.invalid"));
      return;
    }
    if (days > 90) {
      setError(t("calc.duration.error.max"));
      return;
    }
    if (!departureDate || !parsedDate) {
      setError(t("calc.date.error"));
      return;
    }

    const r = calculateDates(parsedDate, days, workWeek);
    setResult(r);
    setSheetOpen(true);

    addToHistory({
      departureDate: toLocalDateStr(parsedDate),
      durationDays: days,
      returnDate: toLocalDateStr(r.returnDate),
      resumeDate: toLocalDateStr(r.resumeDate),
      overlaps: r.overlaps.length,
    });
    saveReminder(toLocalDateStr(r.resumeDate));
  }, [duration, departureDate, parsedDate, workWeek]);

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
            <label htmlFor="duration">{t("calc.duration.label")}</label>
          </div>
          <input
            id="duration"
            name="duration"
            type="number"
            min={1}
            max={90}
            value={duration}
            onChange={(e) => {
              setDuration(e.target.value);
              setResult(null);
              setError("");
            }}
            onBlur={(e) => {
              const v = parseInt(e.target.value, 10);
              if (!isNaN(v) && v > 90) setDuration("90");
              if (!isNaN(v) && v < 1) setDuration("1");
            }}
            placeholder={t("calc.duration.placeholder")}
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
            <Buildings size={16} weight="duotone" />
            <span className="section-header-label">{t("calc.workweek.label")}</span>
          </div>
          <div className="ww-toggle">
            <button
              type="button"
              className={`ww-btn ${workWeek === "sun-thu" ? "ww-btn-active" : ""}`}
              onClick={() => handleWorkWeekChange("sun-thu")}
            >
              <span className="ww-days">{t("calc.workweek.sun-thu")}</span>
              <span className="ww-off">{t("calc.workweek.off.sun-thu")}</span>
            </button>
            <button
              type="button"
              className={`ww-btn ${workWeek === "sat-wed" ? "ww-btn-active" : ""}`}
              onClick={() => handleWorkWeekChange("sat-wed")}
            >
              <span className="ww-days">{t("calc.workweek.sat-wed")}</span>
              <span className="ww-off">{t("calc.workweek.off.sat-wed")}</span>
            </button>
          </div>
        </div>

        <div className="section">
          <div className="section-header">
            <Calendar size={16} weight="duotone" />
            <label htmlFor="departure-date">{t("calc.date.label")}</label>
          </div>
          <DatePicker id="departure-date"
            value={departureDate}
            onChange={(v) => { setDepartureDate(v); setResult(null); setError(""); }}
            min={today}
            isHoliday={checkHoliday}
          />
          {departureDate && checkHoliday(departureDate) && (
            <p className="field-hint error">{t("calc.date.warning")}</p>
          )}
        </div>

        <button
          onClick={handleCalculate}
          disabled={!duration || !departureDate}
          className="btn btn-primary btn-lg"
        >
          <Lightning size={20} weight="duotone" />
          {t("calc.calculate")}
        </button>

        {result && (
          <button onClick={handleReset} className="btn btn-outline btn-lg">
            <ArrowClockwise size={20} weight="duotone" />
            {t("calc.reset")}
          </button>
        )}
      </div>

      <BottomSheet open={sheetOpen} onClose={() => setSheetOpen(false)}>
        {result && parsedDate && (
          <>
            <Results
              returnDate={result.returnDate}
              resumeDate={result.resumeDate}
              overlaps={result.overlaps}
              durationDays={parseInt(duration, 10)}
              departureDate={parsedDate}
            />
            <InstallBanner />
          </>
        )}
      </BottomSheet>
    </div>
  );
}
