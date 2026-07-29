export interface AppNotification {
  id: string;
  title: string;
  body: string;
  timestamp: number;
  read: boolean;
}

const NOTIF_KEY = "permission-notifications";

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
    id: crypto.randomUUID(),
    read: false,
  };
  list.unshift(entry);
  localStorage.setItem(NOTIF_KEY, JSON.stringify(list.slice(0, 30)));
  return entry;
}

export function markAllRead(): void {
  const list = getNotifications().map((n) => ({ ...n, read: true }));
  localStorage.setItem(NOTIF_KEY, JSON.stringify(list));
}

export function getUnreadCount(): number {
  return getNotifications().filter((n) => !n.read).length;
}

export function clearNotifications(): void {
  localStorage.removeItem(NOTIF_KEY);
}
