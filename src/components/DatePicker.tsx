import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { CaretLeft, CaretRight } from "@phosphor-icons/react";
import { algerianMonths } from "../lib/constants";
import { useT, getLocale, getDateFnsLocale } from "../lib/i18n";
import { format } from "date-fns";

interface Props {
  id?: string;
  value: string;
  onChange: (val: string) => void;
  min: string;
  isHoliday: (dateStr: string) => boolean;
}

const DAYS_AR = ["ح", "ن", "ث", "ر", "خ", "ج", "س"];
const DAYS_FR = ["D", "L", "M", "M", "J", "V", "S"];

function toDateStr(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function daysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function startDay(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

export function DatePicker({ id, value, onChange, min, isHoliday: checkHoliday }: Props) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const [viewYear, setViewYear] = useState(new Date().getFullYear());
  const [viewMonth, setViewMonth] = useState(new Date().getMonth());
  const [focusDay, setFocusDay] = useState<number | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (value) {
      const d = new Date(value + "T00:00:00");
      setViewYear(d.getFullYear());
      setViewMonth(d.getMonth());
    }
  }, [value]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  useEffect(() => {
    if (open) {
      const d = value ? new Date(value + "T00:00:00") : new Date();
      if (d.getMonth() === viewMonth && d.getFullYear() === viewYear) {
        setFocusDay(d.getDate());
      } else {
        setFocusDay(null);
      }
      gridRef.current?.focus();
    }
  }, [open, viewMonth, viewYear, value]);

  const todayStr = useMemo(() => toDateStr(new Date()), []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (focusDay === null) return;
    let newDay = focusDay;
    const maxDay = daysInMonth(viewYear, viewMonth);

    switch (e.key) {
      case "ArrowLeft":
        newDay = focusDay - 1;
        break;
      case "ArrowRight":
        newDay = focusDay + 1;
        break;
      case "ArrowUp":
        newDay = focusDay - 7;
        break;
      case "ArrowDown":
        newDay = focusDay + 7;
        break;
      case "Enter":
      case " ":
        e.preventDefault();
        if (focusDay >= 1 && focusDay <= maxDay) {
          const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(focusDay).padStart(2, "0")}`;
          if (dateStr >= todayStr || dateStr >= min) {
            onChange(dateStr);
            setOpen(false);
          }
        }
        return;
      case "Escape":
        setOpen(false);
        return;
      default:
        return;
    }

    e.preventDefault();
    if (newDay < 1) {
      if (viewMonth === 0) {
        setViewYear((y) => y - 1);
        setViewMonth(11);
      } else {
        setViewMonth((m) => m - 1);
      }
      newDay = daysInMonth(viewMonth === 0 ? viewYear - 1 : viewYear, viewMonth === 0 ? 11 : viewMonth - 1) + newDay;
    } else if (newDay > maxDay) {
      if (viewMonth === 11) {
        setViewYear((y) => y + 1);
        setViewMonth(0);
      } else {
        setViewMonth((m) => m + 1);
      }
      newDay = newDay - maxDay;
    }
    setFocusDay(Math.max(1, Math.min(newDay, daysInMonth(viewYear, viewMonth))));
  }, [focusDay, viewYear, viewMonth, onChange, todayStr, min]);

  const prevMonth = useCallback(() => {
    if (viewMonth === 0) {
      setViewYear((y) => y - 1);
      setViewMonth(11);
    } else {
      setViewMonth((m) => m - 1);
    }
  }, [viewMonth]);

  const nextMonth = useCallback(() => {
    if (viewMonth === 11) {
      setViewYear((y) => y + 1);
      setViewMonth(0);
    } else {
      setViewMonth((m) => m + 1);
    }
  }, [viewMonth]);

  const days = daysInMonth(viewYear, viewMonth);
  const start = startDay(viewYear, viewMonth);
  const rows: (number | null)[][] = [];
  let row: (number | null)[] = [];

  for (let i = 0; i < start; i++) {
    row.push(null);
  }
  for (let d = 1; d <= days; d++) {
    row.push(d);
    if (row.length === 7) {
      rows.push(row);
      row = [];
    }
  }
  if (row.length > 0) {
    while (row.length < 7) row.push(null);
    rows.push(row);
  }

  const parsed = value ? new Date(value + "T00:00:00") : null;
  const locale = getLocale();
  const dfnsLocale = getDateFnsLocale();
  const dayHeaders = locale === "fr" ? DAYS_FR : DAYS_AR;
  const displayDate = parsed
    ? locale === "fr"
      ? format(parsed, "MMMM yyyy", { locale: dfnsLocale })
      : `${algerianMonths[parsed.getMonth()]} ${parsed.getFullYear()}`
    : "";

  return (
    <div className="dp-wrap" ref={ref}>
      <button
        type="button"
        id={id}
        role="combobox"
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label={t("calc.date.placeholder")}
        className={`dp-trigger ${value ? "dp-filled" : ""} ${value && checkHoliday(value) ? "dp-error" : ""}`}
        onClick={() => setOpen((o) => !o)}
      >
        {value ? (
          <span className="dp-trigger-text">
            {parsed?.getDate()} {displayDate}
          </span>
        ) : (
          <span className="dp-placeholder">{t("calc.date.placeholder")}</span>
        )}
      </button>

      {open && (
        <div className="dp-dropdown" ref={gridRef} tabIndex={-1} onKeyDown={handleKeyDown}>
          <div className="dp-nav">
            <button type="button" className="dp-nav-btn" onClick={prevMonth} aria-label={t("dp.prev")}>
              <CaretRight size={16} />
            </button>
            <span className="dp-nav-label" aria-live="polite">
              {locale === "fr"
                ? format(new Date(viewYear, viewMonth), "MMMM yyyy", { locale: dfnsLocale })
                : `${algerianMonths[viewMonth]} ${viewYear}`}
            </span>
            <button type="button" className="dp-nav-btn" onClick={nextMonth} aria-label={t("dp.next")}>
              <CaretLeft size={16} />
            </button>
          </div>

          <div className="dp-grid">
            {dayHeaders.map((d) => (
              <div key={d} className="dp-day-header">{d}</div>
            ))}
            {rows.flatMap((week, wi) =>
              week.map((d, di) => {
                if (d === null) return <div key={`${wi}-${di}`} className="dp-cell dp-empty" />;

                const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
                const isPast = dateStr < todayStr && dateStr < min;
                const isSelected = dateStr === value;
                const isToday = dateStr === todayStr;
                const isHoli = checkHoliday(dateStr);
                const isFocused = focusDay === d;

                return (
                  <button
                    key={`${wi}-${di}`}
                    type="button"
                    className={`dp-cell ${isSelected ? "dp-selected" : ""} ${isToday ? "dp-today" : ""} ${isHoli ? "dp-holiday" : ""} ${isPast ? "dp-disabled" : ""} ${isFocused && open ? "dp-focused" : ""}`}
                    disabled={isPast}
                    onClick={() => {
                      if (!isPast) {
                        onChange(dateStr);
                        setOpen(false);
                      }
                    }}
                    onMouseEnter={() => setFocusDay(d)}
                  >
                    {d}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
