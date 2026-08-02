import { useRef, useCallback, type TouchEvent } from "react";

interface SwipeOptions {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeDown?: () => void;
  threshold?: number;
}

export function useSwipe({ onSwipeLeft, onSwipeRight, onSwipeDown, threshold = 60 }: SwipeOptions) {
  const startX = useRef(0);
  const startY = useRef(0);
  const started = useRef(false);
  const consumed = useRef(false);

  const onTouchStart = useCallback((e: TouchEvent) => {
    const touch = e.touches[0];
    if (!touch) return;
    startX.current = touch.clientX;
    startY.current = touch.clientY;
    started.current = true;
    consumed.current = false;
  }, []);

  const onTouchMove = useCallback(
    (e: TouchEvent) => {
      if (!started.current || consumed.current || !onSwipeDown) return;
      const touch = e.touches[0];
      if (!touch) return;
      const dy = touch.clientY - startY.current;
      if (dy > threshold) {
        consumed.current = true;
        onSwipeDown();
      }
    },
    [onSwipeDown, threshold],
  );

  const onTouchEnd = useCallback(
    (e: TouchEvent) => {
      const touch = e.changedTouches[0];
      const wasStarted = started.current;
      started.current = false;
      if (!touch || !wasStarted || consumed.current) return;

      const dx = touch.clientX - startX.current;
      const dy = touch.clientY - startY.current;

      if (Math.abs(dx) < threshold || Math.abs(dy) > Math.abs(dx)) return;

      if (dx > 0) onSwipeRight?.();
      else onSwipeLeft?.();
    },
    [onSwipeLeft, onSwipeRight, threshold],
  );

  return { onTouchStart, onTouchMove, onTouchEnd };
}
