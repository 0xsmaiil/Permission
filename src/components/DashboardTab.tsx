import { useEffect, useMemo, useState, useCallback } from "react";
import { CalendarBlank, CalendarCheck, Trash, Clock } from "@phosphor-icons/react";
import { format } from "date-fns";
import type { CalculationRecord } from "@/lib/storage";
import { clearHistory, getLeaveTypeLabel, clearAllData } from "@/lib/storage";
import { toLocalDateStr } from "@/lib/dates";
import { useT, getDateFnsLocale } from "@/lib/i18n";
import { getCachedHolidaysForYear } from "@/lib/holidays";
import { getCustomHolidays } from "@/lib/storage";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";

interface Props {
  history: CalculationRecord[];
  onLoadCalculation: (departure: string, duration: string, leaveType: string) => void;
  onHistoryChange?: () => void;
}

export function DashboardTab({ history, onLoadCalculation, onHistoryChange }: Props) {
  const t = useT();
  const dfnsLocale = getDateFnsLocale();
  const [resetOpen, setResetOpen] = useState(false);
  const [clearOpen, setClearOpen] = useState(false);

  const handleReset = () => {
    clearAllData();
    window.location.reload();
  };

  const handleClearHistory = () => {
    clearHistory();
    onHistoryChange?.();
    setClearOpen(false);
  };

  const yearlyStats = useMemo(() => {
    const thisYear = new Date().getFullYear();
    let totalDays = 0;
    let leaveCount = 0;
    const byType: Record<string, { count: number; days: number }> = {};
    const monthlyLeaves = Array.from<number>({ length: 12 }, () => 0);
    for (const h of history) {
      const d = new Date(h.departureDate + "T00:00:00");
      if (d.getFullYear() === thisYear) {
        totalDays += h.durationDays;
        leaveCount++;
        monthlyLeaves[d.getMonth()]++;
        if (!byType[h.leaveType]) byType[h.leaveType] = { count: 0, days: 0 };
        byType[h.leaveType].count++;
        byType[h.leaveType].days += h.durationDays;
      }
    }
    return { totalDays, leaveCount, byType, monthlyLeaves };
  }, [history]);

  const monthHolidays = useMemo(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const prefix = `${year}-${String(month).padStart(2, "0")}`;
    const nextMonth = month === 12 ? 1 : month + 1;
    const nextYear = month === 12 ? year + 1 : year;
    const nextMonthPrefix = `${nextYear}-${String(nextMonth).padStart(2, "0")}`;

    const official = getCachedHolidaysForYear(year);
    const officialNext = nextYear !== year ? getCachedHolidaysForYear(nextYear) : official;
    const custom = getCustomHolidays();

    const current = [
      ...official.filter((h) => h.date.startsWith(prefix)).map((h) => ({ name: h.name, date: h.date, day: parseInt(h.date.split("-")[2], 10), type: h.type, isCustom: false })),
      ...custom.filter((h) => h.date.startsWith(prefix)).map((h) => ({ name: h.name, date: h.date, day: parseInt(h.date.split("-")[2], 10), type: "custom" as const, isCustom: true })),
    ].sort((a, b) => a.day - b.day);

    const next = [
      ...officialNext.filter((h) => h.date.startsWith(nextMonthPrefix)).map((h) => ({ name: h.name, date: h.date, day: parseInt(h.date.split("-")[2], 10), type: h.type, isCustom: false })),
      ...custom.filter((h) => h.date.startsWith(nextMonthPrefix)).map((h) => ({ name: h.name, date: h.date, day: parseInt(h.date.split("-")[2], 10), type: "custom" as const, isCustom: true })),
    ].sort((a, b) => a.day - b.day);

    return { current, next };
  }, []);

  return (
    <div className="max-w-md mx-auto px-5 py-6 space-y-6">
      <Card className="border-border/60 shadow-card rounded-2xl overflow-hidden">
        <div className="p-5 space-y-3">
          <div className="flex items-center gap-2 text-sm font-bold text-foreground/70">
            <CalendarBlank className="h-4 w-4" />
            {t("dashboard.holidays.thisMonth")}
          </div>

          {monthHolidays.current.length > 0 ? (
            <div className="space-y-2">
              {monthHolidays.current.map((h) => (
                <div key={`${h.date}-${h.name}`} className="flex items-center gap-3 text-sm">
                  <span className="text-xs font-bold text-muted-foreground tabular-nums w-16 shrink-0">
                    {format(new Date(h.date + "T00:00:00"), "d MMM", { locale: getDateFnsLocale() })}
                  </span>
                  <span className="flex-1 font-medium">{h.name}</span>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap ${
                    h.type === "national"
                      ? "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
                      : h.type === "religious"
                      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                      : "bg-muted text-muted-foreground"
                  }`}>
                    {h.type === "national"
                      ? t("holiday.type.national")
                      : h.type === "religious"
                      ? t("holiday.type.religious")
                      : t("holiday.type.custom")}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">{t("dashboard.holidays.none")}</p>
          )}

          {monthHolidays.next.length > 0 && (
            <div className="pt-3 border-t border-border/50">
              <p className="text-xs font-semibold text-muted-foreground mb-2">
                {t("dashboard.holidays.nextMonth", { count: monthHolidays.next.length })}
              </p>
              <div className="space-y-2">
                {monthHolidays.next.map((h) => (
                  <div key={`${h.date}-${h.name}`} className="flex items-center gap-3 text-sm">
                    <span className="text-xs font-bold text-muted-foreground tabular-nums w-16 shrink-0">
                      {format(new Date(h.date + "T00:00:00"), "d MMM", { locale: getDateFnsLocale() })}
                    </span>
                    <span className="flex-1 font-medium">{h.name}</span>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap ${
                      h.type === "national"
                        ? "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
                        : h.type === "religious"
                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                        : "bg-muted text-muted-foreground"
                    }`}>
                      {h.type === "national"
                        ? t("holiday.type.national")
                        : h.type === "religious"
                        ? t("holiday.type.religious")
                        : t("holiday.type.custom")}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </Card>

      <DonutChart totalDays={yearlyStats.totalDays} byType={yearlyStats.byType} monthlyLeaves={yearlyStats.monthlyLeaves} />

      <Card className="border-border/60 shadow-card rounded-2xl overflow-hidden">
        <div className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-foreground/70 flex items-center gap-2">
              <Clock className="h-4 w-4" />
              {t("history.title")}
            </h2>
            {history.length > 0 && (
              <Dialog open={clearOpen} onOpenChange={setClearOpen}>
                <DialogTrigger
                  render={
                    <Button variant="ghost" size="sm" className="h-7 text-[11px] font-semibold text-muted-foreground hover:text-destructive gap-1 rounded-lg">
                      <Trash className="h-3.5 w-3.5" />
                      {t("history.clear")}
                    </Button>
                  }
                />
                <DialogContent className="rounded-2xl">
                  <DialogHeader>
                    <DialogTitle className="text-lg font-bold">{t("history.clearConfirm")}</DialogTitle>
                    <DialogDescription className="text-sm text-muted-foreground">{t("history.clearConfirmDesc")}</DialogDescription>
                  </DialogHeader>
                  <DialogFooter>
                    <Button variant="outline" className="rounded-lg" onClick={() => setClearOpen(false)}>{t("common.cancel")}</Button>
                    <Button variant="destructive" className="rounded-lg" onClick={handleClearHistory}>{t("history.clearConfirmYes")}</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </div>

          {history.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">{t("history.empty.title")}</p>
          ) : (
            <div className="space-y-2.5">
              {history.map((h) => {
                const raw = new Date(h.departureDate + "T00:00:00");
                const returnDate = new Date(h.returnDate + "T00:00:00");
                return (
                  <Card
                    key={h.id}
                    className="cursor-pointer hover:bg-muted/50 active:scale-[0.99] transition-all duration-150 border-border/60 shadow-card rounded-xl overflow-hidden"
                    onClick={() => onLoadCalculation(toLocalDateStr(raw), String(h.durationDays), h.leaveType)}
                  >
                    <div className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                            <CalendarBlank className="h-4 w-4 text-primary-600 dark:text-primary-400" />
                          </div>
                          <span className="font-bold text-sm">
                            {format(raw, "d MMMM yyyy", { locale: dfnsLocale })}
                          </span>
                        </div>
                        <Badge
                          variant="secondary"
                          className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${
                            h.leaveType === "Convalescence" ? "bg-warning text-warning-foreground dark:bg-warning-foreground dark:text-warning" : ""
                          }`}
                        >
                          {getLeaveTypeLabel(h.leaveType, t)}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="font-semibold text-foreground/80">
                          {h.durationDays} <span className="font-normal text-muted-foreground">{t("history.day")}</span>
                        </span>
                        <span className="flex items-center gap-1">
                          <CalendarCheck className="h-3.5 w-3.5" />
                          <span>
                            {format(returnDate, "d MMM", { locale: dfnsLocale })}
                          </span>
                        </span>
                        {h.overlaps > 0 && (
                          <Badge variant="outline" className="text-[11px] border-warning/30 text-warning font-medium rounded-full">
                            +{h.overlaps} {t("history.overlap")}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </Card>

      <div className="pt-4 border-t border-border/50">
        <Dialog open={resetOpen} onOpenChange={setResetOpen}>
          <DialogTrigger
            render={
              <Button variant="destructive" size="sm" className="w-full h-10 text-xs font-semibold gap-1.5 rounded-xl">
                <Trash className="h-4 w-4" />
                {t("dashboard.resetData")}
              </Button>
            }
          />
          <DialogContent className="rounded-2xl pt-6" showCloseButton={false}>
            <DialogHeader>
              <DialogTitle className="text-lg font-bold">{t("dashboard.resetData")}</DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground">{t("dashboard.resetConfirm")}</DialogDescription>
            </DialogHeader>
            <DialogFooter className="flex-row">
              <Button variant="outline" className="rounded-lg" onClick={() => setResetOpen(false)}>{t("common.cancel")}</Button>
              <Button variant="destructive" className="rounded-lg" onClick={handleReset}>{t("dashboard.resetConfirmYes")}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

const TYPE_COLORS: Record<string, string> = {
  Conge: "#f59e0b",
  Permission: "#3b82f6",
  Convalescence: "#10b981",
  Absent: "#ef4444",
};
const FALLBACK_COLOR = "#8b5cf6";

function DonutChart({ totalDays, byType, monthlyLeaves }: { totalDays: number; byType: Record<string, { count: number; days: number }>; monthlyLeaves: number[] }) {
  const t = useT();
  const entries = Object.entries(byType).sort((a, b) => b[1].days - a[1].days);
  const r = 36;
  const circumference = 2 * Math.PI * r;
  const [revealed, setRevealed] = useState(0);

  const revealNext = useCallback(() => {
    setRevealed((prev) => Math.min(prev + 1, entries.length));
  }, [entries.length]);

  useEffect(() => {
    setRevealed(0);
    const t0 = setTimeout(revealNext, 100);
    return () => clearTimeout(t0);
  }, [revealNext]);

  useEffect(() => {
    if (revealed < entries.length) {
      const t0 = setTimeout(revealNext, 200);
      return () => clearTimeout(t0);
    }
  }, [revealed, entries.length, revealNext]);

  let cumOffset = 0;

  return (
    <Card className="border-border/60 shadow-card rounded-2xl overflow-hidden">
      <div className="p-5">
        <div className="flex items-center gap-5">
          <svg viewBox="0 0 100 100" className="w-28 h-28 shrink-0">
            <g transform="rotate(-90 50 50)">
              <circle cx="50" cy="50" r={r}
                fill="none" className="stroke-muted" strokeWidth="9"
              />
              {entries.map(([type, data], i) => {
                const segLen = totalDays > 0 ? (data.days / totalDays) * circumference : 0;
                const offset = -cumOffset;
                cumOffset += segLen;
                return (
                  <circle key={type} cx="50" cy="50" r={r}
                    fill="none"
                    stroke={TYPE_COLORS[type] ?? FALLBACK_COLOR}
                    strokeWidth="9"
                    strokeDasharray={`${segLen} ${circumference - segLen}`}
                    strokeDashoffset={i < revealed ? offset : circumference}
                    style={{ transition: "stroke-dashoffset 0.5s ease-out" }}
                  />
                );
              })}
            </g>
            <text x="50" y="54" textAnchor="middle"
              className="fill-foreground text-2xl font-extrabold tabular-nums"
            >
              {totalDays}
            </text>
            <text x="50" y="63" textAnchor="middle"
              className="fill-muted-foreground text-[8px] font-semibold"
            >
              {t("results.days")}
            </text>
          </svg>

          <div className="flex-1 space-y-1.5 min-w-0">
            {entries.map(([type, data]) => (
              <div key={type} className="flex items-center gap-2 text-xs">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: TYPE_COLORS[type] ?? FALLBACK_COLOR }}
                />
                <span className="text-foreground/80 font-medium truncate flex-1">
                  {getLeaveTypeLabel(type, t)}
                </span>
                <span className="font-bold tabular-nums text-foreground">
                  {data.days}
                </span>
                <span className="text-muted-foreground/60">({data.count})</span>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-border/50">
          <div className="flex items-center justify-between px-0.5">
            {monthlyLeaves.map((count, i) => (
              <div key={i} className="flex flex-col items-center gap-0.5">
                <span className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  count > 0
                    ? "bg-primary-500 dark:bg-primary-400"
                    : "bg-muted-foreground/20 dark:bg-muted-foreground/10"
                }`} />
                <span className="text-[8px] font-medium text-muted-foreground/50">
                  {i + 1}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
}