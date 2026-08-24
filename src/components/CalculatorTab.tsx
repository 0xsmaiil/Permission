import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import { format, differenceInCalendarDays } from "date-fns";
import { CalendarBlank, ArrowClockwise, Briefcase } from "@phosphor-icons/react";
import { calculateDates, isHoliday as checkHoliday, getCachedHolidaysForYear, getRamadanDatesForYear } from "@/lib/holidays";
import { addToHistory, saveReminder, saveDepartureReminder, confirmReturn, getLeaveTypeLabel, type LeaveType, getHistory } from "@/lib/storage";
import { toLocalDateStr } from "@/lib/dates";
import { toast } from "@/lib/toast";
import { useT, getDateFnsLocale } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { BottomSheet } from "@/components/BottomSheet";
import { ShareButton } from "@/components/ShareButton";

const LEAVE_CHIPS: { value: LeaveType; key: string }[] = [
  { value: "Conge", key: "calc.type.conge" },
  { value: "Permission", key: "calc.type.permission" },
  { value: "Convalescence", key: "calc.type.convalescence" },
  { value: "Absent", key: "calc.type.absent" },
];

interface Props {
  loadData?: { departure: string; duration: string; leaveType?: string } | null;
  onDataLoaded?: () => void;
  onHistoryChange?: () => void;
  active?: boolean;
}

interface NextLeaveSummary {
  id: string;
  departureDate: string;
  returnDate: string;
  leaveType: string;
  durationDays: number;
  actualReturnDate?: string;
  workDays?: number;
}

type LeaveInfo =
  | { phase: "upcoming"; daysUntilLeave: number; leave: NextLeaveSummary }
  | { phase: "active"; progress: number; daysUntilReturn: number; leave: NextLeaveSummary }
  | { phase: "overdue"; lateDays: number; leave: NextLeaveSummary }
  | { phase: "working"; remaining: number; leave: NextLeaveSummary };

export function CalculatorTab({ loadData, onDataLoaded, onHistoryChange, active = true }: Props) {
  const t = useT();
  const dfnsLocale = getDateFnsLocale();
  const [duration, setDuration] = useState("");
  const [departureDate, setDepartureDate] = useState<Date | undefined>(undefined);
  const [leaveType, setLeaveType] = useState<LeaveType>("Conge");
  const [result, setResult] = useState<ReturnType<typeof calculateDates> | null>(null);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);


  useEffect(() => {
    if (loadData) {
      setDuration(loadData.duration);
      setDepartureDate(new Date(loadData.departure + "T00:00:00"));
      if (loadData.leaveType) setLeaveType(loadData.leaveType as LeaveType);
      setResult(null);
      setError("");
      setSaved(false);
      onDataLoaded?.();
    }
  }, [loadData, onDataLoaded]);

  const handleCalculate = useCallback(() => {
    const days = parseInt(duration, 10);
    if (!days || days < 1) {
      setError("calc.duration.error.invalid");
      return;
    }
    if (days > 730) {
      setError("calc.duration.error.max");
      return;
    }
    if (!departureDate) {
      setError("calc.date.error");
      return;
    }
    setError("");
    const res = calculateDates(departureDate, days);
    setResult(res);
    setSaved(false);
    setSheetOpen(true);
  }, [duration, departureDate]);

  const handleSave = useCallback(() => {
    if (!result || !departureDate) return;
    const days = parseInt(duration, 10);
    const ok = addToHistory({
      departureDate: toLocalDateStr(departureDate),
      durationDays: days,
      returnDate: toLocalDateStr(result.returnDate),
      resumeDate: toLocalDateStr(result.resumeDate),
      overlaps: result.overlaps.length,
      leaveType,
    });
    if (ok) {
      saveReminder(toLocalDateStr(result.resumeDate));
      saveDepartureReminder(toLocalDateStr(departureDate));
      toast(t("calc.saved"));
      setSaved(true);
      setSheetOpen(false);
      setRefreshKey((k) => k + 1);
      onHistoryChange?.();
    } else {
      toast(t("calc.duplicate"));
    }
  }, [result, departureDate, duration, leaveType, t, onHistoryChange]);

  const handleReset = () => {
    setDuration("");
    setDepartureDate(undefined);
    setLeaveType("Conge");
    setResult(null);
    setError("");
    setSaved(false);
    setSheetOpen(false);
  };

  const handleConfirmReturn = useCallback((id: string, workDays: number) => {
    confirmReturn(id, workDays);
    setRefreshKey((k) => k + 1);
    onHistoryChange?.();
  }, [onHistoryChange]);

  const departureStr = departureDate ? toLocalDateStr(departureDate) : "";
  const departureIsHoliday = departureStr ? checkHoliday(departureStr) : false;

  const holidayDates = useMemo(() => {
    const year = new Date().getFullYear();
    const result: Date[] = [];
    for (let y = year - 1; y <= year + 1; y++) {
      for (const h of getCachedHolidaysForYear(y)) {
        result.push(new Date(h.date + "T00:00:00"));
      }
    }
    return result;
  }, []);

  const ramadanDates = useMemo(() => {
    const year = new Date().getFullYear();
    const result: Date[] = [];
    for (let y = year - 1; y <= year + 1; y++) {
      result.push(...getRamadanDatesForYear(y));
    }
    return result;
  }, []);

  const nextLeave = useMemo(() => {
    const all = getHistory();
    const now = new Date();
    const future = all
      .filter((h) => {
        if (h.returnConfirmed && h.workDays != null) {
          const dayAfterReturn = new Date(h.returnDate + "T00:00:00");
          dayAfterReturn.setDate(dayAfterReturn.getDate() + 1);
          const daysSinceWorkStart = differenceInCalendarDays(now, dayAfterReturn);
          const remaining = h.workDays - daysSinceWorkStart;
          return remaining > 0;
        }
        if (h.returnConfirmed) return false;
        const ret = new Date(h.returnDate + "T00:00:00");
        const daysSinceReturn = differenceInCalendarDays(now, ret);
        return daysSinceReturn <= 14;
      })
      .sort((a, b) => a.departureDate.localeCompare(b.departureDate));
    return future[0] ?? null;
  }, [refreshKey]);

  const leaveInfo = useMemo<LeaveInfo | null>(() => {
    if (!nextLeave) return null;
    const now = new Date();
    const dep = new Date(nextLeave.departureDate + "T00:00:00");
    const ret = new Date(nextLeave.returnDate + "T00:00:00");

    if (nextLeave.returnConfirmed && nextLeave.workDays != null) {
      const dayAfterReturn = new Date(nextLeave.returnDate + "T00:00:00");
      dayAfterReturn.setDate(dayAfterReturn.getDate() + 1);
      const daysSinceWorkStart = differenceInCalendarDays(now, dayAfterReturn);
      const remaining = nextLeave.workDays - daysSinceWorkStart;
      return { phase: "working", remaining, leave: nextLeave };
    }
    if (now < dep) {
      const daysUntilLeave = Math.ceil((dep.getTime() - now.getTime()) / 86400000);
      return { phase: "upcoming", daysUntilLeave, leave: nextLeave };
    }
    if (now >= ret) {
      const lateDays = differenceInCalendarDays(now, ret);
      return { phase: "overdue", lateDays, leave: nextLeave };
    }
    const totalMs = ret.getTime() - dep.getTime();
    const elapsed = Math.max(0, now.getTime() - dep.getTime());
    const progress = Math.min(elapsed / totalMs, 1);
    const daysUntilReturn = Math.max(0, Math.ceil((ret.getTime() - now.getTime()) / 86400000));
    return { phase: "active", progress, daysUntilReturn, leave: nextLeave };
  }, [nextLeave]);


  return (
    <div className="max-w-md mx-auto px-5 py-6 min-h-full flex flex-col gap-5">
      <div className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="duration" className="text-sm font-semibold text-foreground/80">{t("calc.duration.label")}</Label>
          <p id="duration-help" className="text-xs text-muted-foreground">{t("calc.duration.help")}</p>
          <Input
            id="duration"
            type="number"
            min={1}
            max={730}
            step={1}
            inputMode="numeric"
            aria-describedby="duration-help"
            placeholder={t("calc.duration.placeholder")}
            value={duration}
            onChange={(e) => {
              const v = e.target.value;
              if (v.includes(".") || v.includes(",") || v.includes("e") || v.includes("E")) {
                setDuration(v.replace(/[.,eE].*$/, ""));
              } else {
                setDuration(v);
              }
            }}
            className="h-12 text-base bg-card border-border rounded-xl focus-visible:ring-primary-500/20"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-semibold text-foreground/80">{t("calc.date.label")}</Label>
          <p id="date-help" className="text-xs text-muted-foreground">{t("calc.date.help")}</p>
          <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
            <PopoverTrigger
              render={
                <Button
                  variant="outline"
                  className="w-full h-12 justify-start text-left font-normal bg-card border-border rounded-xl hover:bg-muted/60"
                  aria-describedby="date-help"
                >
                  <CalendarBlank className="me-2.5 h-[18px] w-[18px] text-muted-foreground" />
                  {departureDate ? (
                    <span className="font-medium">{format(departureDate, "EEEE d MMMM yyyy", { locale: dfnsLocale })}</span>
                  ) : (
                    <span className="text-muted-foreground/60">{t("calc.date.placeholder")}</span>
                  )}
                </Button>
              }
            />
            <PopoverContent className="w-auto p-0 shadow-lg" align="start">
              <Calendar
                mode="single"
                selected={departureDate}
                onSelect={(d) => {
                  setDepartureDate(d);
                  setCalendarOpen(false);
                }}
                ISOWeek
                locale={getDateFnsLocale()}
                modifiers={{ holiday: holidayDates, ramadan: ramadanDates }}
                modifiersClassNames={{ ramadan: "bg-amber-500/8" }}
              />
            </PopoverContent>
          </Popover>
          {departureIsHoliday && (
            <p className="text-sm font-medium text-warning">{t("calc.date.warning")}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-semibold text-foreground/80">{t("calc.type.label")}</Label>
          <p id="type-help" className="text-xs text-muted-foreground">{t("calc.type.help")}</p>
          <div className="flex gap-2" aria-describedby="type-help">
            {LEAVE_CHIPS.map((chip) => (
              <Button
                key={chip.value}
                variant={leaveType === chip.value ? "default" : "outline"}
                size="sm"
                onClick={() => setLeaveType(chip.value)}
                className="flex-1 h-10 rounded-lg text-xs transition-all"
              >
                {t(chip.key)}
              </Button>
            ))}
          </div>
        </div>

        {error && (
          <p className="text-sm font-medium text-destructive bg-destructive-foreground px-3 py-2 rounded-lg border border-destructive/20">
            {t(error)}
          </p>
        )}

        <div aria-hidden="true" className="mt-4 flex items-center gap-3">
          <span className="h-px flex-1 bg-gradient-to-r from-transparent via-border to-border" />
          <span className="h-2 w-2 rotate-45 rounded-[2px] bg-primary-500/40" />
          <span className="h-px flex-1 bg-gradient-to-l from-transparent via-border to-border" />
        </div>

        <Button
          className="w-full h-12 text-base font-bold rounded-xl transition-all active:scale-[0.98]"
          onClick={handleCalculate}
        >
          {t("calc.calculate")}
        </Button>
      </div>

      {leaveInfo && (
        <div className="mt-auto">
          <NextLeaveCard leaveInfo={leaveInfo} t={t} dfnsLocale={dfnsLocale} onConfirmReturn={handleConfirmReturn} active={active} />
        </div>
      )}

      {result && (
        <BottomSheet isOpen={sheetOpen} onClose={() => setSheetOpen(false)}>
          <div className="px-6 pb-6 space-y-5">
            <div className="flex items-center justify-between pt-1">
              <span className="text-lg font-extrabold text-foreground">
                {t("results.title")}
              </span>
              <Badge variant="secondary" className="text-xs font-bold px-3 py-1 rounded-full">
                {getLeaveTypeLabel(leaveType, t)}
              </Badge>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between py-2.5 px-4 bg-muted/40 rounded-xl">
                <span className="text-sm text-muted-foreground">{t("results.departure")}</span>
                <span className="text-sm font-semibold">
                  {departureDate && format(departureDate, "EEEE d MMMM yyyy", { locale: dfnsLocale })}
                </span>
              </div>

              <div className="flex items-center justify-between py-3.5 px-4 bg-muted/40 rounded-xl">
                <span className="text-sm text-muted-foreground">{t("results.returnDate")}</span>
                <span className="text-base font-extrabold">
                  {format(result.returnDate, "EEEE d MMMM", { locale: dfnsLocale })}
                </span>
              </div>

              <div className="flex items-center justify-between py-3.5 px-4 bg-primary-50 dark:bg-primary-950/30 rounded-xl border border-primary-200 dark:border-primary-800">
                <span className="text-sm font-semibold text-primary-700 dark:text-primary-300">{t("results.resumeDate")}</span>
                <span className="text-base font-extrabold text-primary-700 dark:text-primary-300">
                  {format(result.resumeDate, "EEEE d MMMM", { locale: dfnsLocale })}
                </span>
              </div>

              <div className="flex items-center justify-between py-2 px-4 bg-muted/20 rounded-xl">
                <span className="text-sm text-muted-foreground">{t("results.days")}</span>
                <Badge variant="secondary" className="font-bold text-sm px-3 py-0.5 rounded-full">
                  {parseInt(duration, 10)}
                </Badge>
              </div>
            </div>

            {result.overlaps.length > 0 && (
              <div className="space-y-2.5">
                <p className="text-xs font-bold text-warning uppercase tracking-widest">
                  {t("results.overlaps.title", { count: result.overlaps.length })}
                </p>
                <div className="flex flex-wrap gap-2">
                  {result.overlaps.map((h, i) => (
                    <Badge key={i} variant="outline" className="text-xs font-semibold px-2.5 py-1 rounded-full border-warning/30 text-warning bg-warning/5">
                      {h.name}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-2.5 pt-1">
              <Button
                variant="outline"
                size="sm"
                onClick={handleReset}
                className="flex-1 h-11 rounded-xl text-sm font-semibold border-border/80"
              >
                <ArrowClockwise className="me-1.5 h-4 w-4" />
                {t("calc.reset")}
              </Button>
              <ShareButton
                data={{
                  leaveType: getLeaveTypeLabel(leaveType, t),
                  startDate: departureDate ? format(departureDate, "d MMMM yyyy", { locale: dfnsLocale }) : "",
                  duration: parseInt(duration, 10),
                  returnDate: format(result.returnDate, "d MMMM yyyy", { locale: dfnsLocale }),
                  resumeDate: format(result.resumeDate, "d MMMM yyyy", { locale: dfnsLocale }),
                }}
              />
              <Button
                size="sm"
                onClick={handleSave}
                disabled={saved}
                className={`flex-1 h-11 rounded-xl text-sm font-bold transition-all ${
                  saved
                    ? "border-success/30 bg-success/10 text-success"
                    : ""
                }`}
              >
                {saved ? t("results.saved") : t("results.save")}
              </Button>
            </div>
          </div>
        </BottomSheet>
      )}
    </div>
  );
}

const AIRPLANE_VIEWBOX = 1024;

const RUNWAY_X1 = 102.5;
const RUNWAY_X2 = 926.5;
const RUNWAY_Y = 949.7;
const RUNWAY_STROKE = 28;

const AIRPLANE_SHAPES: { fill: string; d: string }[] = [
  { fill: "#FFEB4D", d: "M200.5 484.7H77.4l-0.9-168h43.8z" },
  { fill: "#DAE5FF", d: "M897 652.7H245.5c-92.8 0-168-75.2-168-168h725.6c93.4 0 146.4 51.7 146.4 115.4 0 29-23.5 52.6-52.5 52.6z" },
  { fill: "#FFACC2", d: "M124.4 600.7c30.6 31.8 73.5 51.6 121.2 51.6H897c28.7 0 52-23 52.5-51.6H124.4z" },
  { fill: "#FFFFFF", d: "M776.5 513.7h32v42h-32z" },
  { fill: "#9A2D2F", d: "M808.5 562.7h-32c-4.4 0-8-3.1-8-7v-42c0-3.9 3.6-7 8-7h32c4.4 0 8 3.1 8 7v42c0 3.8-3.5 7-8 7z m-24-14h16v-28h-16v28z" },
  { fill: "#FFFFFF", d: "M214.5 555.7h-20c-3.3 0-6-2.7-6-6v-30c0-3.3 2.7-6 6-6h20c3.3 0 6 2.7 6 6v30c0 3.3-2.6 6-6 6z" },
  { fill: "#9A2D2F", d: "M214.5 562.7h-20c-7.7 0-14-5.5-14-12.2V519c0-6.8 6.3-12.2 14-12.2h20c7.7 0 14 5.5 14 12.2v31.5c0 6.7-6.2 12.2-14 12.2z m-18-14h16v-28h-16v28zM731.5 521.7h-4c-3.3 0-6 2.7-6 6v8c0 3.3 2.7 6 6 6h4c3.3 0 6-2.7 6-6v-8c0-3.3-2.6-6-6-6zM700.5 521.7h-4c-3.3 0-6 2.2-6 5v10c0 2.8 2.7 5 6 5h4c3.3 0 6-2.2 6-5v-10c0-2.8-2.6-5-6-5zM669.5 521.7h-4c-3.3 0-6 2.2-6 5v10c0 2.8 2.7 5 6 5h4c3.3 0 6-2.2 6-5v-10c0-2.8-2.6-5-6-5zM638.5 521.7h-4c-3.3 0-6 2.2-6 5v10c0 2.8 2.7 5 6 5h4c3.3 0 6-2.2 6-5v-10c0-2.8-2.6-5-6-5zM607.5 521.7h-4c-3.3 0-6 2.2-6 5v10c0 2.8 2.7 5 6 5h4c3.3 0 6-2.2 6-5v-10c0-2.8-2.6-5-6-5zM577.5 521.7h-4c-3.3 0-6 2.2-6 5v10c0 2.8 2.7 5 6 5h4c3.3 0 6-2.2 6-5v-10c0-2.8-2.6-5-6-5zM546.5 521.7h-4c-3.3 0-6 2.2-6 5v10c0 2.8 2.7 5 6 5h4c3.3 0 6-2.2 6-5v-10c0-2.8-2.6-5-6-5zM515.5 521.7h-4c-3.3 0-6 2.2-6 5v10c0 2.8 2.7 5 6 5h4c3.3 0 6-2.2 6-5v-10c0-2.8-2.6-5-6-5zM298.5 521.7h-4c-3.3 0-6 2.2-6 5v10c0 2.8 2.7 5 6 5h4c3.3 0 6-2.2 6-5v-10c0-2.8-2.6-5-6-5zM267.5 521.7h-4c-3.3 0-6 2.7-6 6v8c0 3.3 2.7 6 6 6h4c3.3 0 6-2.7 6-6v-8c0-3.3-2.6-6-6-6z" },
  { fill: "#9A2D2F", d: "M950.5 821.7c-13.8 0-20.7-9.8-25.7-17-5.1-7.3-7.7-10.2-12.7-10.2s-7.5 3-12.7 10.2c-5.1 7.2-12 17-25.7 17-13.8 0-20.7-9.8-25.7-17-5.1-7.3-7.7-10.2-12.7-10.2s-7.5 3-12.7 10.2c-5.1 7.2-12 17-25.7 17-13.8 0-20.7-9.8-25.7-17-5.1-7.3-7.7-10.2-12.7-10.2-4.4 0-8-3.6-8-8s3.6-8 8-8c13.8 0 20.7 9.8 25.7 17 5.1 7.3 7.7 10.2 12.7 10.2 5 0 7.5-3 12.7-10.2 5.1-7.2 12-17 25.7-17s20.7 9.8 25.7 17c5.1 7.3 7.7 10.2 12.7 10.2 5 0 7.5-3 12.7-10.2 5.1-7.2 12-17 25.7-17s20.7 9.8 25.7 17c5.1 7.3 7.7 10.2 12.7 10.2 4.4 0 8 3.6 8 8s-3.5 8-8 8zM950.5 771.7c-13.8 0-20.7-9.8-25.7-17-5.1-7.3-7.7-10.2-12.7-10.2s-7.5 3-12.7 10.2c-5.1 7.2-12 17-25.7 17-13.8 0-20.7-9.8-25.7-17-5.1-7.3-7.7-10.2-12.7-10.2s-7.5 3-12.7 10.2c-5.1 7.2-12 17-25.7 17-13.8 0-20.7-9.8-25.7-17-5.1-7.3-7.7-10.2-12.7-10.2-4.4 0-8-3.6-8-8s3.6-8 8-8c13.8 0 20.7 9.8 25.7 17 5.1 7.3 7.7 10.2 12.7 10.2 5 0 7.5-3 12.7-10.2 5.1-7.2 12-17 25.7-17s20.7 9.8 25.7 17c5.1 7.3 7.7 10.2 12.7 10.2 5 0 7.5-3 12.7-10.2 5.1-7.2 12-17 25.7-17s20.7 9.8 25.7 17c5.1 7.3 7.7 10.2 12.7 10.2 4.4 0 8 3.6 8 8s-3.5 8-8 8zM241.6 259.6c-12.9 0-19.2-10.1-23.8-17.4-4.3-6.9-6.5-9.9-10.2-9.9s-5.9 3-10.2 9.9c-4.6 7.3-10.9 17.4-23.8 17.4s-19.2-10.1-23.8-17.4c-4.3-6.9-6.5-9.9-10.2-9.9s-5.9 3-10.2 9.9c-4.6 7.3-10.9 17.4-23.8 17.4s-19.2-10.1-23.8-17.4c-4.3-6.9-6.5-9.9-10.2-9.9-4.4 0-8-3.6-8-8s3.6-8 8-8c12.9 0 19.2 10.1 23.8 17.4 4.3 6.9 6.5 9.9 10.2 9.9s5.9-3 10.2-9.9c4.6-7.3 10.9-17.4 23.8-17.4s19.2 10.1 23.8 17.4c4.3 6.9 6.5 9.9 10.2 9.9 3.7 0 5.9-3 10.2-9.9 4.6-7.3 10.9-17.4 23.8-17.4s19.2 10.1 23.8 17.4c4.3 6.9 6.5 9.9 10.2 9.9 4.4 0 8 3.6 8 8s-3.6 8-8 8zM263.5 209.6c-13.8 0-20.7-9.8-25.7-17-5.1-7.3-7.7-10.2-12.7-10.2-5 0-7.5 3-12.7 10.2-5.1 7.2-12 17-25.7 17-13.8 0-20.7-9.8-25.7-17-5.1-7.3-7.7-10.2-12.7-10.2s-7.5 3-12.7 10.2c-5.1 7.2-12 17-25.7 17-13.8 0-20.7-9.8-25.7-17-5.1-7.3-7.7-10.2-12.7-10.2-4.4 0-8-3.6-8-8s3.6-8 8-8c13.8 0 20.7 9.8 25.7 17 5.1 7.3 7.7 10.2 12.7 10.2 5 0 7.5-3 12.7-10.2 5.1-7.2 12-17 25.7-17s20.7 9.8 25.7 17c5.1 7.3 7.7 10.2 12.7 10.2 5 0 7.5-3 12.7-10.2 5.1-7.2 12-17 25.7-17s20.7 9.8 25.7 17c5.1 7.3 7.7 10.2 12.7 10.2 4.4 0 8 3.6 8 8s-3.5 8-8 8z" },
  { fill: "#FFEB4D", d: "M350.1 82m-32 0a32 32 0 1 0 64 0 32 32 0 1 0-64 0Z" },
  { fill: "#9A2D2F", d: "M350.1 122c-22.1 0-40-17.9-40-40s17.9-40 40-40 40 17.9 40 40-17.9 40-40 40z m0-64c-13.2 0-24 10.8-24 24s10.8 24 24 24 24-10.8 24-24-10.7-24-24-24z" },
  { fill: "#FFFFFF", d: "M233 492.7c4 9.7 20 21.4 47.5 19.2 65.5-5.2 131.9-13.6 204-9.2 136.5 8.2 231.1 1.5 272.6-2 15.8-1.3 48.4-3.5 62.9-7.4-5.5-0.4-11.1-0.6-16.9-0.6H233z" },
  { fill: "#FFACC2", d: "M656.3 652.2H456.4l-194.1-203h56.3z" },
  { fill: "#CAE8FF", d: "M701.3 684.7h-70c-8.8 0-16-7.2-16-16v-28c0-8.8 7.2-16 16-16h70c8.8 0 16 7.2 16 16v28c0 8.8-7.2 16-16 16z" },
  { fill: "#9A2D2F", d: "M916.5 512.4c-27.9-23.3-67.1-35.7-113.4-35.7H379.9l-57.1-34.4c-1.2-0.7-2.7-1.1-4.1-1.1h-56.3c-3.2 0-6.1 1.9-7.4 4.9-1.3 2.9-0.6 6.4 1.6 8.7l21 22h-72.2l-78-163.8c-1.4-2.6-4.1-4.2-7-4.2H76.5c-2.1 0-4.2 0.8-5.7 2.4-1.5 1.5-2.3 3.6-2.3 5.7l0.9 168c0 0.4 0 0.8 0.1 1.2 0.7 96.5 79.4 174.8 176 174.8h361.8v8c0 13.2 10.8 24 24 24h70c13.2 0 24-10.8 24-24v-8H897c33.4 0 60.6-27.2 60.6-60.6-0.1-34.6-14.6-65.8-41.1-87.9z m-113.4-19.7c42.5 0 78.2 11 103.1 31.9 20.9 17.5 33.1 41.4 35 68.1H572.8l-85.7-51.5c2-0.8 3.4-2.5 3.4-4.5v-10c0-2.8-2.7-5-6-5h-4c-3.3 0-6 2.2-6 5v6.9l-68-40.9h396.6z m-718.5-168h31l71.6 152H85.4l-0.8-152z m1.1 168H292.8l28.9 30.2c-1.3 0.9-2.1 2.3-2.1 3.8v10c0 2.8 2.7 5 6 5h4c3.1 0 5.6-1.9 5.9-4.4l53 55.4H127.6c-24.4-26.7-40-61.6-41.9-100z m222.6 151.6h-62.8c-37.2 0-72.3-12.5-100.7-35.6h258.8l34.2 35.7-129.5-0.1z m299-3.6v3.5H459.8L281 457.2h35.4l292.2 175.7c-0.8 2.4-1.3 5-1.3 7.8z m102 28c0 4.4-3.6 8-8 8h-70c-4.4 0-8-3.6-8-8v-28c0-4.4 3.6-8 8-8h70c4.4 0 8 3.6 8 8v28zM897 644.3l-171.7 0.4v-4c0-13.2-10.8-24-24-24h-70c-4.6 0-8.9 1.3-12.6 3.6l-19.3-11.6h341.1c-4.1 20.2-22.2 35.6-43.5 35.6z" },
];

function LeaveRange({ dep, ret, locale }: { dep: Date; ret: Date; locale: ReturnType<typeof getDateFnsLocale> }) {
  const iso = (s: string) => `${"\u2067"}${s}${"\u2069"}`;
  const isRtl = locale.code === "ar-DZ";
  const num = (d: Date) => <span>{iso(format(d, "d", { locale }))}</span>;
  const mon = (d: Date) => <span>{iso(format(d, "MMM", { locale }))}</span>;
  const sep = <span>{"\u00A0"}</span>;
  const day = <span className="text-xs font-semibold text-muted-foreground">{iso(format(ret, "EEEE", { locale }))}</span>;
  const depDate = isRtl ? <>{mon(dep)}{sep}{num(dep)}</> : <>{num(dep)}{sep}{mon(dep)}</>;
  const retDate = isRtl ? <>{mon(ret)}{sep}{num(ret)}{sep}{day}</> : <>{day}{sep}{num(ret)}{sep}{mon(ret)}</>;
  return (
    <>
      <span className="whitespace-nowrap">{depDate}</span>
      <span aria-hidden="true"> → </span>
      <span className="whitespace-nowrap font-bold text-base">{retDate}</span>
    </>
  );
}

function NextLeaveCard({ leaveInfo, t, dfnsLocale, onConfirmReturn, active = true }: {
  leaveInfo: LeaveInfo;
  t: ReturnType<typeof useT>;
  dfnsLocale: ReturnType<typeof getDateFnsLocale>;
  onConfirmReturn: (id: string, workDays: number) => void;
  active?: boolean;
}) {
  const { phase, leave } = leaveInfo;
  const dep = new Date(leave.departureDate + "T00:00:00");
  const ret = new Date(leave.returnDate + "T00:00:00");
  const countdown = phase === "active" ? leaveInfo.daysUntilReturn : phase === "upcoming" ? leaveInfo.daysUntilLeave : phase === "overdue" ? leaveInfo.lateDays : leaveInfo.remaining;
  const targetPct = Math.round((phase === "active" ? leaveInfo.progress : phase === "overdue" ? 1 : 0) * 100);
  const [displayPct, setDisplayPct] = useState(0);
  const rafRef = useRef(0);
  const shownPctRef = useRef(0);
  const prevActiveRef = useRef(active);

  useEffect(() => {
    if (!active) {
      prevActiveRef.current = active;
      return;
    }
    const justActivated = !prevActiveRef.current;
    prevActiveRef.current = active;
    cancelAnimationFrame(rafRef.current);
    const from = justActivated ? 0 : shownPctRef.current;
    const duration = 3000;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      const value = Math.round(from + (targetPct - from) * eased);
      shownPctRef.current = value;
      setDisplayPct(value);
      if (t < 1) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [active, targetPct]);

  const [confirming, setConfirming] = useState(false);
  const [workDaysInput, setWorkDaysInput] = useState("");
  const [workDaysError, setWorkDaysError] = useState(false);
  const maxWorkDays = Math.max(leave.durationDays, 1) * 3;

  if (phase === "working") {
    const nextLeaveStart = new Date(leave.returnDate + "T00:00:00");
    nextLeaveStart.setDate(nextLeaveStart.getDate() + 1 + (leave.workDays ?? 0));
    return (
      <div className="rounded-xl border border-sky-200 dark:border-sky-900 bg-sky-50/50 dark:bg-sky-950/20 p-5 flex flex-col items-center justify-center text-center gap-4">
        <Briefcase size={48} className="text-sky-500" weight="duotone" />
        <div>
          <div className="text-4xl font-extrabold tabular-nums leading-[1.3] pb-0.5">{countdown}</div>
          <div className="text-sm text-muted-foreground mt-0.5">{t("calc.work.remaining", { days: countdown })}</div>
          <div className="flex flex-wrap items-center justify-center gap-x-1.5 gap-y-0.5 text-sm text-muted-foreground mt-1.5">
            <span className="whitespace-nowrap">{t("calc.nextLeave.label")}</span>
            <span className="marker-highlight whitespace-nowrap">
              {format(nextLeaveStart, "EEEE d MMMM", { locale: dfnsLocale })}
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div dir="ltr" className="rounded-xl border border-border/50 bg-muted/20 p-5 flex items-center gap-4">
      <div className="relative inline-block shrink-0">
        <svg viewBox={`0 0 ${AIRPLANE_VIEWBOX} ${AIRPLANE_VIEWBOX}`} className="h-28 text-foreground" style={{ width: "auto" }}>
          {AIRPLANE_SHAPES.map((s, i) => (
            <path key={i} d={s.d} fill={s.fill} />
          ))}
          <line x1={RUNWAY_X1} y1={RUNWAY_Y} x2={RUNWAY_X2} y2={RUNWAY_Y} strokeWidth={RUNWAY_STROKE} strokeLinecap="round" className="stroke-muted-foreground/20" />
          <line x1={RUNWAY_X1} y1={RUNWAY_Y} x2={RUNWAY_X2} y2={RUNWAY_Y} strokeWidth={RUNWAY_STROKE} strokeLinecap="round"
            pathLength={100} strokeDasharray="100" strokeDashoffset={100 - targetPct}
            className="stroke-sky-500 dark:stroke-sky-400"
            style={{ transition: "stroke-dashoffset 0.6s ease" }}
          />
        </svg>
        <span className="absolute left-1/2 top-[86%] -translate-x-1/2 -translate-y-1/2 text-sm font-bold text-sky-600 dark:text-sky-400 tabular-nums">
          {displayPct}%
        </span>
      </div>

      <div className="flex-1 min-w-0 text-center pl-3">
        <div className={`text-sm ${phase === "overdue" ? "text-destructive font-semibold" : "text-muted-foreground"}`}>
          {phase === "active" ? t("calc.returnIn") : phase === "overdue" ? t("calc.return.overdue", { days: countdown }) : t("calc.leaveIn")} {phase === "upcoming" || phase === "active" ? t("results.days") : ""}
        </div>
        <div className={`text-4xl font-extrabold tabular-nums leading-[1.3] mt-0.5 ${phase === "overdue" ? "text-destructive" : ""}`}>{countdown}</div>
        <div className="flex flex-wrap items-center justify-center gap-x-1.5 gap-y-0.5 text-sm text-muted-foreground mt-1.5">
          <span className="whitespace-nowrap">{getLeaveTypeLabel(leave.leaveType, t)}<span aria-hidden="true"> ·</span></span>
          <span className="whitespace-nowrap"><LeaveRange dep={dep} ret={ret} locale={dfnsLocale} /></span>
        </div>
        {phase === "overdue" && !confirming && (
          <button
            onClick={() => setConfirming(true)}
            className="mt-3 w-full h-12 rounded-xl bg-destructive text-destructive-foreground text-base font-bold hover:bg-destructive/90 transition-colors"
          >
            {t("calc.return.confirm")}
          </button>
        )}
        {phase === "overdue" && confirming && (
          <div className="mt-3 flex flex-col gap-2 w-full">
            <label className="text-xs font-semibold text-muted-foreground text-start">{t("calc.work.inputLabel")}</label>
            <div className="flex gap-2">
              <Input
                type="number"
                min={1}
                max={maxWorkDays}
                step={1}
                value={workDaysInput}
                onChange={(e) => {
                  setWorkDaysInput(e.target.value);
                  setWorkDaysError(false);
                }}
                className={`flex-1 h-10 text-sm rounded-lg ${workDaysError ? "border-destructive" : ""}`}
                aria-invalid={workDaysError}
              />
              <Button
                size="sm"
                className="h-10 rounded-lg"
                onClick={() => {
                  const days = parseInt(workDaysInput, 10);
                  if (!Number.isFinite(days) || days < 1 || days > maxWorkDays) {
                    setWorkDaysError(true);
                    return;
                  }
                  onConfirmReturn(leave.id, days);
                }}
              >
                {t("entitlement.save")}
              </Button>
            </div>
            {workDaysError && (
              <p className="text-xs font-semibold text-destructive text-start">
                {t("calc.work.inputError", { max: maxWorkDays })}
              </p>
            )}
            <button
              onClick={() => { setConfirming(false); setWorkDaysInput(""); setWorkDaysError(false); }}
              className="text-[11px] text-muted-foreground hover:text-foreground transition-colors"
            >
              {t("common.cancel")}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}


