import { differenceInCalendarDays, format, parse } from "date-fns";

export type LeaveType = "Conge" | "Permission" | "Convalescence" | "Absent" | (string & {});

export interface CalculationRecord {
  id: string;
  departureDate: string;
  durationDays: number;
  returnDate: string;
  resumeDate: string;
  overlaps: number;
  leaveType: LeaveType;
  createdAt: string;
  actualReturnDate?: string;
  returnConfirmed?: boolean;
  workDays?: number;
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

export function addToHistory(record: Omit<CalculationRecord, "id" | "createdAt">): boolean {
  const history = getHistory();
  const isDuplicate = history.some(
    (h) => h.departureDate === record.departureDate && h.durationDays === record.durationDays
  );
  if (isDuplicate) return false;
  history.unshift({
    ...record,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  });
  localStorage.setItem(STORAGE_KEY, JSON.stringify(history.slice(0, 50)));
  return true;
}

export function confirmReturn(id: string, workDays: number): void {
  const history = getHistory();
  const today = format(new Date(), "yyyy-MM-dd");
  const updated = history.map((h) =>
    h.id === id ? { ...h, actualReturnDate: today, returnConfirmed: true, workDays } : h
  );
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
}

export function getLeaveTypeLabel(type: string, t: (key: string) => string): string {
  const map: Record<string, string> = {
    // new types
    Conge: t("leaveType.conge"),
    Permission: t("leaveType.permission"),
    Convalescence: t("leaveType.convalescence"),
    Absent: t("leaveType.absent"),
    // backward compat for old history entries
    annual: t("leaveType.annual"),
    sick: t("leaveType.sick"),
    monthly: t("leaveType.monthly"),
    other: t("leaveType.other"),
  };
  return map[type] ?? type;
}

export function clearHistory(): void {
  localStorage.removeItem(STORAGE_KEY);
}

export function clearAllData(): void {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(ENTITLEMENT_KEY);
  localStorage.removeItem(REMINDER_KEY);
  localStorage.removeItem(DEPARTURE_REMINDER_KEY);
  localStorage.removeItem(CUSTOM_HOLIDAY_KEY);
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
  const resume = parse(resumeDate, "yyyy-MM-dd", new Date());
  const diff = differenceInCalendarDays(resume, today);
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
  const today = format(new Date(), "yyyy-MM-dd");
  const reminders = getReminders().filter(
    (r) => r.resumeDate >= today
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

const DEPARTURE_REMINDER_KEY = "permission-departure-reminders";

export interface DepartureReminder {
  id: string;
  departureDate: string;
  daysUntil: number;
  createdAt: string;
  dismissed: boolean;
}

export function saveDepartureReminder(departureDate: string): void {
  const reminders = getDepartureRemindersRaw();
  const existing = reminders.find((r) => r.departureDate === departureDate);
  if (existing) return;
  const today = new Date();
  const departure = parse(departureDate, "yyyy-MM-dd", new Date());
  const diff = differenceInCalendarDays(departure, today);
  reminders.push({
    id: crypto.randomUUID(),
    departureDate,
    daysUntil: diff,
    createdAt: new Date().toISOString(),
    dismissed: false,
  });
  localStorage.setItem(DEPARTURE_REMINDER_KEY, JSON.stringify(reminders));
}

function getDepartureRemindersRaw(): DepartureReminder[] {
  try {
    const raw = localStorage.getItem(DEPARTURE_REMINDER_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function getDepartureReminders(): DepartureReminder[] {
  const today = format(new Date(), "yyyy-MM-dd");
  return getDepartureRemindersRaw().filter(
    (r) => r.departureDate >= today && !r.dismissed
  );
}

export function dismissDepartureReminder(id: string): void {
  const reminders = getDepartureRemindersRaw().map((r) =>
    r.id === id ? { ...r, dismissed: true } : r
  );
  localStorage.setItem(DEPARTURE_REMINDER_KEY, JSON.stringify(reminders));
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
