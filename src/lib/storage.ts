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
