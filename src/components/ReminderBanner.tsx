import { useState, useEffect, useMemo } from "react";
import { Bell, X } from "@phosphor-icons/react";
import { getMonthName } from "../lib/constants";
import { getReminders, dismissReminder, clearPassedReminders, getDepartureReminders, dismissDepartureReminder } from "../lib/storage";
import { useLocale, useT, getLocale } from "../lib/i18n";

interface ReminderEntry {
  id: string;
  type: "resume" | "departure";
  date: string;
  daysUntil: number;
}

export function ReminderBanner() {
  const t = useT();
  const [locale] = useLocale();
  // Store only raw data. Labels are derived at render time so they follow
  // the active locale; freezing formatted strings in state left reminders
  // stuck in the language active when the component first mounted.
  const [entries, setEntries] = useState<ReminderEntry[]>([]);
  const [dismissed, setDismissed] = useState<Set<string>>(() => new Set());

  useEffect(() => {
    clearPassedReminders();
    const items: ReminderEntry[] = [
      ...getReminders().slice(0, 2).map((r) => ({
        id: r.id,
        type: "resume" as const,
        date: r.resumeDate,
        daysUntil: r.daysUntil,
      })),
      ...getDepartureReminders().slice(0, 2).map((dr) => ({
        id: dr.id,
        type: "departure" as const,
        date: dr.departureDate,
        daysUntil: dr.daysUntil,
      })),
    ];
    setEntries(items);
  }, []);

  const reminders = useMemo(() => {
    // `locale` is not read directly — it is a dependency so labels re-derive
    // when the language changes. getLocale()/t() read the current locale.
    void locale;
    return entries
      .filter((e) => !dismissed.has(e.id))
      .map((e) => {
        const d = new Date(e.date + "T00:00:00");
        const when = `${d.getDate()} ${getMonthName(d.getMonth(), getLocale())}`;
        const label =
          e.type === "resume"
            ? e.daysUntil <= 1
              ? t("reminder.tomorrow", { date: when })
              : t("reminder.upcoming", { days: e.daysUntil, date: when })
            : e.daysUntil <= 1
              ? t("reminder.leavesTomorrow", { date: when })
              : t("reminder.leavesIn", { days: e.daysUntil, date: when });
        return { id: e.id, label, type: e.type };
      });
  }, [entries, dismissed, locale, t]);

  const handleDismiss = (id: string, type: "resume" | "departure") => {
    if (type === "resume") dismissReminder(id);
    else dismissDepartureReminder(id);
    setDismissed((prev) => new Set(prev).add(id));
  };

  if (reminders.length === 0) return null;

  return (
    <div className="reminder-banner">
      <Bell size={18} weight="fill" className="reminder-icon" />
      <div className="reminder-list">
        {reminders.map((r) => (
          <div key={r.id} className="reminder-item">
            <span className="reminder-text">{r.label}</span>
            <button
              type="button"
              className="reminder-dismiss"
              onClick={() => handleDismiss(r.id, r.type)}
              aria-label={t("reminder.dismiss")}
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
