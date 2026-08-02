export interface AppNotification {
  id: string;
  title: string;
  body: string;
  timestamp: number;
  read: boolean;
}

const NOTIF_KEY = "permission-notifications";

function safeUuid(): string {
  try {
    return crypto.randomUUID();
  } catch {
    return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  }
}

function safeSet(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Storage unavailable (private mode, quota) — fail silently.
  }
}

export function getNotifications(): AppNotification[] {
  try {
    const raw = localStorage.getItem(NOTIF_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function addNotification(notif: Omit<AppNotification, "id" | "read">): AppNotification {
  const list = getNotifications();
  const entry: AppNotification = {
    ...notif,
    id: safeUuid(),
    read: false,
  };
  list.unshift(entry);
  safeSet(NOTIF_KEY, JSON.stringify(list.slice(0, 30)));
  return entry;
}

export function markAllRead(): void {
  const list = getNotifications().map((n) => ({ ...n, read: true }));
  safeSet(NOTIF_KEY, JSON.stringify(list));
}

export function getUnreadCount(): number {
  return getNotifications().filter((n) => !n.read).length;
}
