interface ToastItem {
  id: number;
  message: string;
}

let toastId = 0;
const listeners: Set<(t: ToastItem) => void> = new Set();

export function toast(message: string) {
  const t = { id: ++toastId, message };
  listeners.forEach((fn) => fn(t));
}

export function subscribe(fn: (t: ToastItem) => void) {
  listeners.add(fn);
  return () => { listeners.delete(fn); };
}
