import { useState, useMemo, useCallback, useEffect } from "react";
import { Calendar, Clock, ArrowClockwise, Lightning, Tag } from "@phosphor-icons/react";
import { calculateDates, isHoliday as checkHoliday } from "../lib/holidays";
import { Results } from "./Results";
import { BottomSheet } from "./BottomSheet";
import { DatePicker } from "./DatePicker";
import { addToHistory, saveReminder, saveDepartureReminder, type LeaveType } from "../lib/storage";
import { toLocalDateStr } from "../lib/dates";
import { toast } from "../lib/toast";
import { useT } from "../lib/i18n";

interface Props {
  loadData?: { departure: string; duration: string; leaveType?: string } | null;
  onDataLoaded?: () => void;
  onHistoryChange?: () => void;
}

const CHIPS = [
  { value: "Conge", key: "calc.type.conge" },
  { value: "Permission", key: "calc.type.permission" },
  { value: "Convalescence", key: "calc.type.convalescence" },
  { value: "Absent", key: "calc.type.absent" },
];

export function Calculator({ loadData, onDataLoaded, onHistoryChange }: Props) {
  const t = useT();
  const [duration, setDuration] = useState("");
  const [departureDate, setDepartureDate] = useState("");
  const [leaveType, setLeaveType] = useState<LeaveType>("Conge");
  const [isCustom, setIsCustom] = useState(false);
  const [customName, setCustomName] = useState("");
  const [result, setResult] = useState<ReturnType<typeof calculateDates> | null>(null);
  // Holds an i18n key, not a translated string. Storing translated text here
  // left the message frozen in the language active when it was set.
  const [error, setError] = useState("");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (loadData) {
      setDuration(loadData.duration);
      setDepartureDate(loadData.departure);
      if (loadData.leaveType) {
        const isKnown = CHIPS.some((c) => c.value === loadData.leaveType);
        if (isKnown) {
          setLeaveType(loadData.leaveType!);
          setIsCustom(false);
        } else {
          setIsCustom(true);
          setCustomName(loadData.leaveType!);
        }
      }
      setResult(null);
      setError("");
      onDataLoaded?.();
    }
  }, [loadData, onDataLoaded]);

  const today = useMemo(() => new Date().toISOString().split("T")[0], []);

  const parsedDate = useMemo(() => {
    if (!departureDate) return null;
    const d = new Date(departureDate + "T00:00:00");
    return isNaN(d.getTime()) ? null : d;
  }, [departureDate]);

  const finalLeaveType = isCustom ? (customName.trim() || "other") : leaveType;

  const handleCalculate = useCallback(() => {
    setError("");
    const days = parseInt(duration, 10);

    if (!duration || isNaN(days) || days < 1) {
      setError("calc.duration.error.invalid");
      return;
    }
    if (days > 730) {
      setError("calc.duration.error.max");
      return;
    }
    if (!departureDate || !parsedDate) {
      setError("calc.date.error");
      return;
    }

    const r = calculateDates(parsedDate, days);
    setResult(r);
    setSaved(false);
    setSheetOpen(true);
  }, [duration, departureDate, parsedDate]);

  const handleSave = useCallback(() => {
    if (!result || !parsedDate) return;
    const days = parseInt(duration, 10);
    const ok = addToHistory({
      departureDate: toLocalDateStr(parsedDate),
      durationDays: days,
      returnDate: toLocalDateStr(result.returnDate),
      resumeDate: toLocalDateStr(result.resumeDate),
      overlaps: result.overlaps.length,
      leaveType: finalLeaveType,
    });
    if (ok) {
      saveReminder(toLocalDateStr(result.resumeDate));
      saveDepartureReminder(toLocalDateStr(parsedDate));
      toast(t("calc.saved"));
      setSaved(true);
      setSheetOpen(false);
      onHistoryChange?.();
    } else {
      toast(t("calc.duplicate"));
    }
  }, [result, parsedDate, duration, finalLeaveType, t, onHistoryChange]);

  const handleReset = () => {
    setDuration("");
    setDepartureDate("");
    setResult(null);
    setError("");
    setSaved(false);
    setSheetOpen(false);
  };

  const handleChipClick = (value: string) => {
    setLeaveType(value);
    setIsCustom(false);
    setResult(null);
  };

  return (
    <div className="tab-page calc-page">
      <div className="calc-scroll">
        <div className="section">
          <div className="section-header">
            <Tag size={16} weight="duotone" />
            <label>{t("calc.type.label")}</label>
          </div>
          <div className="chips-grid">
            {CHIPS.map((lt) => (
              <button
                key={lt.value}
                onClick={() => handleChipClick(lt.value)}
                className={`chip ${!isCustom && leaveType === lt.value ? "chip-active" : ""}`}
              >
                {t(lt.key)}
              </button>
            ))}
            <button
              onClick={() => { setIsCustom(true); setResult(null); }}
              className={`chip ${isCustom ? "chip-active" : ""}`}
            >
              {t("calc.type.other")}
            </button>
          </div>
          {isCustom && (
            <>
              <input
                type="text"
                value={customName}
                onChange={(e) => { setCustomName(e.target.value); setResult(null); }}
                placeholder={t("calc.type.other.placeholder")}
                className="input custom-type-input"
                dir="auto"
              />
              {customName.trim() && (
                <div className="custom-type-preview">
                  {t("calc.type.label")}: <span className="leave-type-badge leave-type-other">{customName.trim()}</span>
                </div>
              )}
            </>
          )}
        </div>

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
            max={730}
            value={duration}
            onChange={(e) => {
              setDuration(e.target.value);
              setResult(null);
              setError("");
            }}
            onBlur={(e) => {
              const v = parseInt(e.target.value, 10);
              if (!isNaN(v) && v > 730) setDuration("730");
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
          {error && <p className="error-text">{t(error)}</p>}
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

      <BottomSheet isOpen={sheetOpen} onClose={() => setSheetOpen(false)}>
        {result && parsedDate && (
          <>
            <Results
              returnDate={result.returnDate}
              resumeDate={result.resumeDate}
              overlaps={result.overlaps}
              durationDays={parseInt(duration, 10)}
              departureDate={parsedDate}
              leaveType={leaveType}
              saved={saved}
              onSave={handleSave}
            />
          </>
        )}
      </BottomSheet>
    </div>
  );
}
