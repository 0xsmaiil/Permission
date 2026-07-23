import { useState, useEffect, useRef } from "react";
import { Bell, X } from "@phosphor-icons/react";
import { algerianMonths } from "../lib/constants";
import { getReminders, dismissReminder, clearPassedReminders } from "../lib/storage";
import { useT } from "../lib/i18n";

export function ReminderBanner() {
  const t = useT();
  const [visible, setVisible] = useState(false);
  const [reminders, setReminders] = useState<{ id: string; label: string }[]>([]);
  const loaded = useRef(false);

  useEffect(() => {
    if (loaded.current) return;
    loaded.current = true;
    clearPassedReminders();
    const items = getReminders();
    if (items.length === 0) return;

    const upcoming = items.slice(0, 3).map((r) => {
      const d = new Date(r.resumeDate + "T00:00:00");
      const day = d.getDate();
      const month = algerianMonths[d.getMonth()];
      const label = r.daysUntil <= 1
        ? t("reminder.tomorrow", { date: `${day} ${month}` })
        : t("reminder.upcoming", { days: r.daysUntil, date: `${day} ${month}` });
      return { id: r.id, label };
    });

    setReminders(upcoming);
    setVisible(true);
  }, []);

  useEffect(() => {
    if (reminders.length === 0) setVisible(false);
  }, [reminders]);

  const handleDismiss = (id: string) => {
    dismissReminder(id);
    setReminders((prev) => prev.filter((r) => r.id !== id));
  };

  if (!visible || reminders.length === 0) return null;

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
              onClick={() => handleDismiss(r.id)}
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
