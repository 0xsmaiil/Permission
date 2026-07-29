import { useEffect, useState } from "react";
import { CheckCircle, X } from "@phosphor-icons/react";
import { subscribe } from "@/lib/toast";
import { useT } from "@/lib/i18n";

export function ToastContainer() {
  const t = useT();
  const [items, setItems] = useState<Array<{ id: number; message: string }>>([]);

  useEffect(() => {
    const unsub = subscribe((toast) => {
      setItems((prev) => [...prev, toast]);
      setTimeout(() => {
        setItems((prev) => prev.filter((item) => item.id !== toast.id));
      }, 2500);
    });
    return unsub;
  }, []);

  if (items.length === 0) return null;

  return (
    <div className="fixed bottom-24 inset-x-0 z-50 flex flex-col items-center gap-2 pointer-events-none" role="alert" aria-live="polite">
      {items.map((item) => (
        <div
          key={item.id}
          className="pointer-events-auto flex items-center gap-2 px-4 py-2.5 bg-card border border-border rounded-xl shadow-lg"
        >
          <CheckCircle size={16} weight="fill" className="text-emerald-500" />
          <span className="text-sm font-medium">{item.message}</span>
          <button
            className="ml-1 p-0.5 rounded-lg hover:bg-muted"
            aria-label={t("toast.close")}
            onClick={() => setItems((prev) => prev.filter((t) => t.id !== item.id))}
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}
