import { useState, useEffect, useRef, type ReactNode } from "react";
import { useSwipe } from "@/hooks/useSwipe";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
}

export function BottomSheet({ isOpen, onClose, children }: Props) {
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useEffect(() => {
    if (isOpen) {
      setMounted(true);
      requestAnimationFrame(() => setVisible(true));
    } else {
      setVisible(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen && mounted) {
      const timer = setTimeout(() => setMounted(false), 150);
      return () => clearTimeout(timer);
    }
  }, [isOpen, mounted]);

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeRef.current();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [isOpen]);

  const { onTouchStart, onTouchMove, onTouchEnd } = useSwipe({
    onSwipeDown: () => closeRef.current(),
    threshold: 80,
  });

  if (!mounted) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div
        className={`absolute inset-0 bg-black/40 transition-opacity duration-150 ease-out ${
          visible ? "opacity-100" : "opacity-0"
        }`}
        onClick={() => closeRef.current()}
      />
      <div
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        className={`relative flex w-full flex-col bg-card dark:bg-zinc-950 rounded-t-3xl max-h-[85vh] shadow-[0_-8px_30px_rgba(0,0,0,0.12)] transition-transform duration-150 ease-out ${
          visible ? "translate-y-0" : "translate-y-full"
        }`}
      >
        <div className="flex justify-center pt-3 pb-0 shrink-0">
          <div className="w-12 h-1.5 rounded-full bg-muted-foreground/20" />
        </div>
        <div className="flex-1 overflow-y-auto pb-6">{children}</div>
      </div>
    </div>
  );
}
