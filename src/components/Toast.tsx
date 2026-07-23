import { useEffect, useState } from "react";
import { CheckCircle, X } from "@phosphor-icons/react";
import { subscribe } from "../lib/toast";
import { useT } from "../lib/i18n";

export function ToastContainer() {
  const t = useT();
  const [items, setItems] = useState<Array<{ id: number; message: string }>>([]);

  useEffect(() => {
    const unsub = subscribe((t) => {
      setItems((prev) => [...prev, t]);
      setTimeout(() => {
        setItems((prev) => prev.filter((item) => item.id !== t.id));
      }, 2500);
    });
    return unsub;
  }, []);

  if (items.length === 0) return null;

  return (
    <div className="toast-container" role="alert" aria-live="polite">
      {items.map((item) => (
        <div key={item.id} className="toast">
          <CheckCircle size={16} weight="fill" className="toast-icon" />
          <span className="toast-message">{item.message}</span>
          <button
            className="toast-close"
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
