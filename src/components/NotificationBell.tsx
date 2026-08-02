import { useState, useEffect, useCallback, useRef } from "react";
import { Bell, X, BellRinging } from "@phosphor-icons/react";
import { format, differenceInCalendarDays, parse } from "date-fns";
import { getUnreadCount, getNotifications, markAllRead, type AppNotification } from "@/lib/notifications";
import { getReminders, getDepartureReminders, dismissReminder, dismissDepartureReminder } from "@/lib/storage";
import { usePushSubscription } from "@/hooks/usePushSubscription";
import { useT, getDateFnsLocale } from "@/lib/i18n";

interface ReminderEntry {
  id: string;
  type: "departure" | "resume";
  date: string;
  daysUntil: number;
}

function loadActiveReminders(): ReminderEntry[] {
  const now = new Date();
  const today = format(now, "yyyy-MM-dd");
  const resume = getReminders().filter((r) => !r.dismissed && r.resumeDate >= today);
  const departures = getDepartureReminders();
  return [
    ...resume.map((r) => ({
      id: r.id,
      type: "resume" as const,
      date: r.resumeDate,
      daysUntil: differenceInCalendarDays(parse(r.resumeDate, "yyyy-MM-dd", now), now),
    })),
    ...departures.map((r) => ({
      id: r.id,
      type: "departure" as const,
      date: r.departureDate,
      daysUntil: differenceInCalendarDays(parse(r.departureDate, "yyyy-MM-dd", now), now),
    })),
  ].sort((a, b) => a.date.localeCompare(b.date));
}

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifs, setNotifs] = useState<AppNotification[]>([]);
  const [reminderEntries, setReminderEntries] = useState<ReminderEntry[]>([]);
  const [badgeCount, setBadgeCount] = useState(0);
  const { isSubscribed, permissionState, subscribe } = usePushSubscription();
  const t = useT();
  const panelRef = useRef<HTMLDivElement>(null);
  const prevOpen = useRef(open);
  const openRef = useRef(open);
  openRef.current = open;

  const recalcBadge = useCallback(() => {
    const unread = getUnreadCount();
    const reminders = loadActiveReminders();
    setBadgeCount(unread + reminders.length);
  }, []);

  const handleToggle = useCallback(() => {
    if (!open) {
      setNotifs(getNotifications());
      setReminderEntries(loadActiveReminders());
    }
    setOpen((prev) => !prev);
  }, [open]);

  const handleDismissReminder = useCallback((id: string, type: "departure" | "resume") => {
    setReminderEntries((prev) => prev.filter((r) => r.id !== id));
    if (type === "resume") dismissReminder(id);
    else dismissDepartureReminder(id);
    recalcBadge();
  }, [recalcBadge]);

  useEffect(() => {
    if (prevOpen.current && !open) {
      if (badgeCount > 0) markAllRead();
      recalcBadge();
    }
    prevOpen.current = open;
  }, [open, badgeCount, recalcBadge]);

  useEffect(() => {
    function update() {
      const unread = getUnreadCount();
      const reminders = loadActiveReminders();
      setBadgeCount(unread + reminders.length);
      if (openRef.current) {
        setNotifs(getNotifications());
        setReminderEntries(loadActiveReminders());
      }
    }
    update();
    const handler = () => update();
    window.addEventListener("notification-received", handler);
    return () => window.removeEventListener("notification-received", handler);
  }, []);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div className="relative">
      <button className="relative p-2 rounded-lg hover:bg-muted transition-colors" onClick={handleToggle} aria-label={t("common.notifications")}>
        <Bell size={18} weight={badgeCount > 0 ? "fill" : "duotone"} />
        {badgeCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center w-4 h-4 rounded-full bg-red-500 text-white text-[10px] font-bold">
            {badgeCount > 9 ? "9+" : badgeCount}
          </span>
        )}
      </button>
      {open && (
        <div ref={panelRef} className="absolute end-0 top-full mt-2 w-72 bg-card border border-border rounded-xl shadow-xl z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <span className="font-semibold text-sm">{t("common.notifications")}</span>
            <button className="p-1 rounded-lg hover:bg-muted" onClick={() => setOpen(false)} aria-label={t("common.close")}>
              <X size={14} />
            </button>
          </div>
          <div className="max-h-96 overflow-y-auto">
            {reminderEntries.length > 0 && (
              <>
                <div className="px-3 py-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider border-b border-border/30">
                  {t("dashboard.reminders.title")}
                </div>
                {reminderEntries.map((r) => {
                  const daysLabel = r.daysUntil <= 0
                    ? t("dashboard.reminders.today")
                    : r.daysUntil === 1
                    ? t("dashboard.reminders.tomorrow")
                    : t("dashboard.reminders.inDays", { days: r.daysUntil });
                  return (
                    <div key={r.id} className="flex items-center gap-2 px-4 py-2.5 border-b border-border/30 hover:bg-muted/50">
                      <span className="text-xs font-bold text-muted-foreground tabular-nums w-14 shrink-0">
                        {format(new Date(r.date + "T00:00:00"), "d MMM", { locale: getDateFnsLocale() })}
                      </span>
                      <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full whitespace-nowrap ${
                        r.type === "departure"
                          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                          : "bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300"
                      }`}>
                        {r.type === "departure" ? t("dashboard.reminders.departure") : t("dashboard.reminders.return")}
                      </span>
                      <span className="flex-1 text-[11px] text-muted-foreground">{daysLabel}</span>
                      <button
                        type="button"
                        onClick={() => handleDismissReminder(r.id, r.type)}
                        className="size-5 flex items-center justify-center rounded-full text-muted-foreground/40 hover:text-foreground hover:bg-muted transition-colors shrink-0"
                        aria-label={t("common.dismiss")}
                      >
                        <X className="size-3" />
                      </button>
                    </div>
                  );
                })}
              </>
            )}
            {notifs.length === 0 && reminderEntries.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-muted-foreground">{t("common.noNotifications")}</div>
            ) : notifs.length > 0 ? (
              <>
                {reminderEntries.length > 0 && (
                  <div className="px-3 py-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider border-b border-border/30">
                    {t("common.push")}
                  </div>
                )}
                {notifs.slice(0, 10).map((n) => (
                  <div key={n.id} className={`flex gap-3 px-4 py-3 border-b border-border/50 hover:bg-muted/50 ${!n.read ? "bg-primary/5" : ""}`}>
                    <div className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${!n.read ? "bg-primary" : "bg-transparent"}`} />
                    <div className="min-w-0">
                      <div className="text-sm font-medium truncate">{n.title}</div>
                      <div className="text-xs text-muted-foreground">{n.body}</div>
                      <div className="text-xs text-muted-foreground/60 mt-0.5">{new Date(n.timestamp).toLocaleString()}</div>
                    </div>
                  </div>
                ))}
              </>
            ) : null}
          </div>
          {!isSubscribed && (
            <button
              className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium text-primary hover:bg-primary/5 transition-colors border-t border-border"
              onClick={() => { subscribe(); setOpen(false); }}
              disabled={permissionState === "loading"}
            >
              <BellRinging size={16} />
              {permissionState === "loading" ? t("pushGate.subscribing") : t("pushGate.subscribe")}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
