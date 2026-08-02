import { format, differenceInCalendarDays, parse } from "date-fns";
import { getReminders, getDepartureReminders } from "./storage";
import { getLocale, getDateFnsLocale } from "./i18n";

const NOTIFIED_KEY = "permission-reminder-notified";

interface NotifiedEntry {
  reminderId: string;
  date: string;
}

function getNotified(): NotifiedEntry[] {
  try {
    return JSON.parse(localStorage.getItem(NOTIFIED_KEY) || "[]");
  } catch {
    return [];
  }
}

function isNotifiedToday(reminderId: string): boolean {
  const today = format(new Date(), "yyyy-MM-dd");
  return getNotified().some((n) => n.reminderId === reminderId && n.date === today);
}

function markNotified(reminderId: string): void {
  const today = format(new Date(), "yyyy-MM-dd");
  const list = getNotified();
  list.push({ reminderId, date: today });
  try {
    localStorage.setItem(NOTIFIED_KEY, JSON.stringify(list));
  } catch {
    // Storage unavailable (private mode, quota) — fail silently.
  }
}

function cleanupOldEntries(): void {
  const today = format(new Date(), "yyyy-MM-dd");
  const list = getNotified().filter((n) => n.date === today);
  try {
    localStorage.setItem(NOTIFIED_KEY, JSON.stringify(list));
  } catch {
    // Storage unavailable (private mode, quota) — fail silently.
  }
}

function getReminderBody(type: "departure" | "resume", daysUntil: number, dateStr: string): string {
  const locale = getLocale();
  if (locale === "fr") {
    if (type === "departure") {
      if (daysUntil === 0) return `Départ aujourd'hui (${dateStr})`;
      return `Départ dans ${daysUntil} jour${daysUntil > 1 ? "s" : ""} (${dateStr})`;
    }
    if (daysUntil === 0) return `Retour aujourd'hui (${dateStr})`;
    return `Retour dans ${daysUntil} jour${daysUntil > 1 ? "s" : ""} (${dateStr})`;
  }
  if (type === "departure") {
    if (daysUntil === 0) return `الذهاب اليوم (${dateStr})`;
    if (daysUntil === 1) return `الذهاب غداً (${dateStr})`;
    return `الذهاب بعد ${daysUntil} أيام (${dateStr})`;
  }
  if (daysUntil === 0) return `العودة اليوم (${dateStr})`;
  if (daysUntil === 1) return `العودة غداً (${dateStr})`;
  return `العودة بعد ${daysUntil} أيام (${dateStr})`;
}

export async function checkReminders(): Promise<void> {
  try {
    if (typeof window === "undefined") return;
    await checkRemindersInner();
  } catch (err) {
    console.error("[reminders] check failed:", err);
  }
}

async function checkRemindersInner(): Promise<void> {
  const now = new Date();
  if (now.getHours() < 10) return;

  if (!("Notification" in window) || Notification.permission !== "granted") return;
  if (!navigator.serviceWorker?.ready) return;

  cleanupOldEntries();

  const today = format(now, "yyyy-MM-dd");
  const resume = getReminders().filter((r) => !r.dismissed && r.resumeDate >= today);
  const departures = getDepartureReminders();

  const due: { id: string; type: "departure" | "resume"; date: string; daysUntil: number }[] = [];

  for (const r of resume) {
    const days = differenceInCalendarDays(parse(r.resumeDate, "yyyy-MM-dd", now), now);
    if (days >= 0 && days <= 5 && !isNotifiedToday(r.id)) {
      markNotified(r.id);
      due.push({ id: r.id, type: "resume", date: r.resumeDate, daysUntil: days });
    }
  }

  for (const r of departures) {
    const days = differenceInCalendarDays(parse(r.departureDate, "yyyy-MM-dd", now), now);
    if (days >= 0 && days <= 5 && !isNotifiedToday(r.id)) {
      markNotified(r.id);
      due.push({ id: r.id, type: "departure", date: r.departureDate, daysUntil: days });
    }
  }

  if (due.length === 0) return;

  const sw = await navigator.serviceWorker.ready;

  for (const r of due) {
    const dateStr = format(parse(r.date, "yyyy-MM-dd", now), "d MMMM", { locale: getDateFnsLocale() });
    const body = getReminderBody(r.type, r.daysUntil, dateStr);
    sw.active?.postMessage({ type: "SHOW_REMINDER", title: "Permission", body, id: r.id });
  }
}

export function startReminderScheduler(): () => void {
  void checkReminders();
  const id = setInterval(() => void checkReminders(), 60000);
  return () => clearInterval(id);
}
