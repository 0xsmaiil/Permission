import { useState, useCallback, useEffect, useMemo, useId } from "react";
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
}

export function CalculatorTab({ loadData, onDataLoaded, onHistoryChange }: Props) {
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
        const daysSinceReturn = Math.ceil((now.getTime() - ret.getTime()) / 86400000);
        return daysSinceReturn <= 14;
      })
      .sort((a, b) => a.departureDate.localeCompare(b.departureDate));
    return future[0] ?? null;
  }, [refreshKey]);

  const leaveInfo = useMemo(() => {
    if (!nextLeave) return null;
    const now = new Date();
    const dep = new Date(nextLeave.departureDate + "T00:00:00");
    const ret = new Date(nextLeave.returnDate + "T00:00:00");

    if (nextLeave.returnConfirmed && nextLeave.workDays != null) {
      const dayAfterReturn = new Date(nextLeave.returnDate + "T00:00:00");
      dayAfterReturn.setDate(dayAfterReturn.getDate() + 1);
      const daysSinceWorkStart = differenceInCalendarDays(now, dayAfterReturn);
      const remaining = nextLeave.workDays - daysSinceWorkStart;
      return { phase: "working" as const, remaining, leave: nextLeave };
    }
    if (now < dep) {
      const daysUntilLeave = Math.ceil((dep.getTime() - now.getTime()) / 86400000);
      return { phase: "upcoming" as const, daysUntilLeave, leave: nextLeave };
    }
    if (now >= ret) {
      const lateDays = differenceInCalendarDays(now, ret);
      return { phase: "overdue" as const, lateDays, leave: nextLeave };
    }
    const totalMs = ret.getTime() - dep.getTime();
    const elapsed = Math.max(0, now.getTime() - dep.getTime());
    const progress = Math.min(elapsed / totalMs, 1);
    const daysUntilReturn = Math.max(0, Math.ceil((ret.getTime() - now.getTime()) / 86400000));
    return { phase: "active" as const, progress, daysUntilReturn, leave: nextLeave };
  }, [nextLeave]);


  return (
    <div className="max-w-md mx-auto px-5 py-6 min-h-full flex flex-col gap-5">
      <div className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="duration" className="text-sm font-semibold text-foreground/80">{t("calc.duration.label")}</Label>
          <Input
            id="duration"
            type="number"
            min={1}
            max={730}
            placeholder={t("calc.duration.placeholder")}
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            className="h-12 text-base bg-muted/50 border-border/80 rounded-xl focus-visible:ring-primary-500/20"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-semibold text-foreground/80">{t("calc.date.label")}</Label>
          <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
            <PopoverTrigger
              render={
                <Button
                  variant="outline"
                  className="w-full h-12 justify-start text-left font-normal bg-muted/50 border-border/80 rounded-xl hover:bg-muted/80"
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
          <div className="flex gap-2">
            {LEAVE_CHIPS.map((chip) => (
              <Button
                key={chip.value}
                variant={leaveType === chip.value ? "default" : "outline"}
                size="sm"
                onClick={() => setLeaveType(chip.value)}
                className="flex-1 h-10 rounded-lg text-sm font-semibold transition-all"
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

        <Button
          className="w-full h-12 text-base font-bold rounded-xl transition-all active:scale-[0.98]"
          onClick={handleCalculate}
        >
          {t("calc.calculate")}
        </Button>
      </div>

      {leaveInfo && (
        <div className="mt-auto">
          <NextLeaveCard leaveInfo={leaveInfo} t={t} dfnsLocale={dfnsLocale} onConfirmReturn={handleConfirmReturn} />
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

const TAKEOFF_PATH = "M176,216a8,8,0,0,1-8,8H24a8,8,0,0,1,0-16H168A8,8,0,0,1,176,216ZM246.31,86.76,227.67,62.87l-.12-.15a39.82,39.82,0,0,0-51.28-9.12L124.7,84.38,70.76,64.54a8,8,0,0,0-5.59,0L58,67.27l-.32.13a16,16,0,0,0-4.53,26.47L75,115.06l-20.17,12.2-28.26-9.54a8,8,0,0,0-6.08.4l-3,1.47A16,16,0,0,0,13,145.8l36,35.27.12.12a39.78,39.78,0,0,0,27.28,10.87,40.18,40.18,0,0,0,20.26-5.52l147.41-88a8,8,0,0,0,2.21-11.78Z";

function NextLeaveCard({ leaveInfo, t, dfnsLocale, onConfirmReturn }: {
  leaveInfo: { phase: "upcoming" | "active" | "overdue" | "working"; progress?: number; daysUntilLeave?: number; daysUntilReturn?: number; lateDays?: number; remaining?: number; leave: { id: string; departureDate: string; returnDate: string; leaveType: string; durationDays: number; actualReturnDate?: string } };
  t: ReturnType<typeof useT>;
  dfnsLocale: ReturnType<typeof getDateFnsLocale>;
  onConfirmReturn: (id: string, workDays: number) => void;
}) {
  const { phase, leave } = leaveInfo;
  const dep = new Date(leave.departureDate + "T00:00:00");
  const ret = new Date(leave.returnDate + "T00:00:00");
  const progress = phase === "active" ? leaveInfo.progress! : 0;
  const countdown = phase === "active" ? leaveInfo.daysUntilReturn! : (phase === "upcoming" ? leaveInfo.daysUntilLeave! : (phase === "overdue" ? leaveInfo.lateDays! : leaveInfo.remaining!));

  const planeId = useId();
  const clipId = `${planeId}-clip`;

  const waterH = progress * 256;
  const waterY = 256 - waterH;

  const [confirming, setConfirming] = useState(false);
  const [workDaysInput, setWorkDaysInput] = useState("");

  if (phase === "working") {
    return (
      <div className="rounded-xl border border-sky-200 dark:border-sky-900 bg-sky-50/50 dark:bg-sky-950/20 p-4 flex flex-col items-center justify-center text-center gap-3">
        <Briefcase size={48} className="text-sky-500" weight="duotone" />
        <div>
          <div className="text-3xl font-extrabold tabular-nums">{countdown}</div>
          <div className="text-xs text-muted-foreground mt-0.5">{t("calc.work.remaining", { days: countdown })}</div>
          <div className="flex items-center justify-center gap-1 text-[11px] text-muted-foreground mt-1.5">
            <span>{getLeaveTypeLabel(leave.leaveType, t)}</span>
            <span>·</span>
            <span>{format(dep, "d MMM", { locale: dfnsLocale })} → {format(ret, "d MMM", { locale: dfnsLocale })}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border/50 bg-muted/20 p-4 flex flex-col items-center justify-center text-center gap-3">
      <svg viewBox="0 0 256 256" className="h-16 text-foreground" style={{ width: "auto" }}>
        <defs>
          <clipPath id={clipId}>
            <path d={TAKEOFF_PATH} />
          </clipPath>
          <linearGradient id={`${planeId}-water`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.55" />
            <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0.3" />
          </linearGradient>
        </defs>

        <path d={TAKEOFF_PATH} fill="none" className="stroke-muted-foreground/25" strokeWidth="2" />
        {phase === "active" && waterH > 0 && (
          <g clipPath={`url(#${clipId})`}>
            <rect x="0" y={waterY} width="256" height={waterH}
              fill={`url(#${planeId}-water)`}
              style={{ transition: "y 0.6s ease, height 0.6s ease" }}
            />
            <g transform={`translate(0, ${waterY})`}>
              <g className="animate-wave-under" style={{ animationDelay: "-1s" }}>
                <path d="M0 0 Q16 -10 32 0 T64 0 T96 0 T128 0 T160 0 T192 0 T224 0 T256 0 T288 0 T320 0 L320 48 L0 48 Z"
                  className="fill-sky-500 dark:fill-sky-500" opacity="0.3"
                />
              </g>
              <g className="animate-wave-surface" style={{ animationDelay: "-0.5s" }}>
                <path d="M0 0 Q16 -6 32 0 T64 0 T96 0 T128 0 T160 0 T192 0 T224 0 T256 0 T288 0 T320 0 L320 36 L0 36 Z"
                  className="fill-sky-400 dark:fill-sky-400" opacity="0.55"
                />
                <path d="M0 4 Q16 10 32 4 T64 4 T96 4 T128 4 T160 4 T192 4 T224 4 T256 4 T288 4 T320 4 L320 36 L0 36 Z"
                  className="fill-sky-300 dark:fill-sky-300" opacity="0.35"
                  style={{ animationDelay: "-0.8s" }}
                />
              </g>
            </g>
          </g>
        )}
      </svg>

      <div>
        <div className={`text-3xl font-extrabold tabular-nums ${phase === "overdue" ? "text-destructive" : ""}`}>{countdown}</div>
        <div className={`text-xs mt-0.5 ${phase === "overdue" ? "text-destructive font-semibold" : "text-muted-foreground"}`}>
          {phase === "active" ? t("calc.returnIn") : phase === "overdue" ? t("calc.return.overdue", { days: countdown }) : t("calc.leaveIn")} {phase === "upcoming" || phase === "active" ? t("results.days") : ""}
        </div>
        <div className="flex items-center justify-center gap-1 text-[11px] text-muted-foreground mt-1.5">
          <span>{getLeaveTypeLabel(leave.leaveType, t)}</span>
          <span>·</span>
          <span>{format(dep, "d MMM", { locale: dfnsLocale })} → {format(ret, "d MMM", { locale: dfnsLocale })}</span>
        </div>
        {phase === "overdue" && !confirming && (
          <button
            onClick={() => setConfirming(true)}
            className="mt-3 w-full h-10 rounded-xl bg-destructive text-destructive-foreground text-sm font-bold hover:bg-destructive/90 transition-colors"
          >
            {t("calc.return.confirm")}
          </button>
        )}
        {phase === "overdue" && confirming && (
          <div className="mt-3 flex flex-col gap-2 w-full">
            <label className="text-[11px] font-semibold text-muted-foreground text-start">{t("calc.work.inputLabel")}</label>
            <div className="flex gap-2">
              <Input
                type="number"
                min={1}
                value={workDaysInput}
                onChange={(e) => setWorkDaysInput(e.target.value)}
                className="flex-1 h-10 text-sm rounded-lg"
              />
              <Button
                size="sm"
                className="h-10 rounded-lg"
                onClick={() => {
                  const days = parseInt(workDaysInput, 10);
                  if (days > 0) onConfirmReturn(leave.id, days);
                }}
              >
                {t("entitlement.save")}
              </Button>
            </div>
            <button
              onClick={() => { setConfirming(false); setWorkDaysInput(""); }}
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


