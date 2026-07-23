import { useRef, useState, useEffect, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useT } from "../lib/i18n";

interface Props {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
}

export function BottomSheet({ open, onClose, children }: Props) {
  const t = useT();
  const sheetRef = useRef<HTMLDivElement>(null);
  const startY = useRef(0);
  const [dragOffset, setDragOffset] = useState(0);

  useEffect(() => {
    if (!open) return;
    const prev = document.activeElement as HTMLElement | null;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "Tab") {
        const panel = sheetRef.current;
        if (!panel) return;
        const focusable = panel.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", handleKey);
    const t = setTimeout(() => sheetRef.current?.querySelector<HTMLElement>("button")?.focus(), 50);
    return () => {
      document.removeEventListener("keydown", handleKey);
      clearTimeout(t);
      prev?.focus();
    };
  }, [open, onClose]);

  const onTouchStart = (e: React.TouchEvent) => {
    startY.current = e.touches[0].clientY;
  };

  const onTouchMove = (e: React.TouchEvent) => {
    const dy = e.touches[0].clientY - startY.current;
    if (dy > 0) setDragOffset(dy);
  };

  const onTouchEnd = () => {
    if (dragOffset > 120) {
      onClose();
    }
    setDragOffset(0);
  };

  if (!open) return null;

  return createPortal(
    <div className="sheet-backdrop" onClick={onClose}>
      <div
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        aria-label={t("results.period")}
        className="sheet-panel"
        style={{ transform: `translateY(${dragOffset}px)` }}
        onClick={(e) => e.stopPropagation()}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <div className="sheet-handle" />
        <div className="sheet-content">
          {children}
        </div>
      </div>
    </div>,
    document.body,
  );
}
