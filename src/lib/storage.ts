export interface CalculationRecord {
  id: string;
  departureDate: string;
  durationDays: number;
  returnDate: string;
  resumeDate: string;
  overlaps: number;
  createdAt: string;
}

const STORAGE_KEY = "permission-calculations";

export function getHistory(): CalculationRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function addToHistory(record: Omit<CalculationRecord, "id" | "createdAt">): void {
  const history = getHistory();
  history.unshift({
    ...record,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  });
  localStorage.setItem(STORAGE_KEY, JSON.stringify(history.slice(0, 50)));
}

export function clearHistory(): void {
  localStorage.removeItem(STORAGE_KEY);
}

const REMINDER_KEY = "permission-reminders";

export interface Reminder {
  id: string;
  resumeDate: string;
  daysUntil: number;
  createdAt: string;
  dismissed: boolean;
}

export function saveReminder(resumeDate: string): void {
  const reminders = getReminders();
  const existing = reminders.find((r) => r.resumeDate === resumeDate);
  if (existing) return;
  const today = new Date();
  const resume = new Date(resumeDate + "T00:00:00");
  const diff = Math.ceil((resume.getTime() - today.getTime()) / 86400000);
  reminders.push({
    id: crypto.randomUUID(),
    resumeDate,
    daysUntil: diff,
    createdAt: new Date().toISOString(),
    dismissed: false,
  });
  localStorage.setItem(REMINDER_KEY, JSON.stringify(reminders));
}

export function getReminders(): Reminder[] {
  try {
    const raw = localStorage.getItem(REMINDER_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function dismissReminder(id: string): void {
  const reminders = getReminders().map((r) =>
    r.id === id ? { ...r, dismissed: true } : r
  );
  localStorage.setItem(REMINDER_KEY, JSON.stringify(reminders));
}

export function clearPassedReminders(): void {
  const today = new Date().toISOString().split("T")[0];
  const reminders = getReminders().filter(
    (r) => r.resumeDate >= today && !r.dismissed
  );
  localStorage.setItem(REMINDER_KEY, JSON.stringify(reminders));
}

const ENTITLEMENT_KEY = "permission-entitlement";

export function getAnnualEntitlement(): number {
  try {
    return parseInt(localStorage.getItem(ENTITLEMENT_KEY) ?? "0", 10) || 0;
  } catch {
    return 0;
  }
}

export function setAnnualEntitlement(days: number): void {
  localStorage.setItem(ENTITLEMENT_KEY, String(days));
}

export function getTotalDaysUsed(): number {
  return getHistory().reduce((sum, r) => sum + r.durationDays, 0);
}

const WORK_WEEK_KEY = "permission-work-week";

export type WorkWeek = "sun-thu" | "sat-wed";

export function getWorkWeek(): WorkWeek {
  const v = localStorage.getItem(WORK_WEEK_KEY);
  if (v === "sat-wed") return "sat-wed";
  return "sun-thu";
}

export function setWorkWeek(ww: WorkWeek): void {
  localStorage.setItem(WORK_WEEK_KEY, ww);
}

const CUSTOM_HOLIDAY_KEY = "permission-custom-holidays";

export interface CustomHoliday {
  id: string;
  name: string;
  date: string;
}

export function getCustomHolidays(): CustomHoliday[] {
  try {
    const raw = localStorage.getItem(CUSTOM_HOLIDAY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function addCustomHoliday(name: string, date: string): void {
  const list = getCustomHolidays();
  list.push({ id: crypto.randomUUID(), name, date });
  localStorage.setItem(CUSTOM_HOLIDAY_KEY, JSON.stringify(list));
}

export function removeCustomHoliday(id: string): void {
  const list = getCustomHolidays().filter((h) => h.id !== id);
  localStorage.setItem(CUSTOM_HOLIDAY_KEY, JSON.stringify(list));
}
