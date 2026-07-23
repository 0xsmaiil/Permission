import { useRef, useCallback } from "react";

interface SwipeOptions {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  threshold?: number;
}

export function useSwipe({ onSwipeLeft, onSwipeRight, threshold = 60 }: SwipeOptions) {
  const startX = useRef(0);
  const startY = useRef(0);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
    startY.current = e.touches[0].clientY;
  }, []);

  const onTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      const endX = e.changedTouches[0].clientX;
      const endY = e.changedTouches[0].clientY;
      const dx = endX - startX.current;
      const dy = endY - startY.current;

      if (Math.abs(dx) < threshold || Math.abs(dy) > Math.abs(dx)) return;

      if (dx > 0) onSwipeRight?.();
      else onSwipeLeft?.();
    },
    [onSwipeLeft, onSwipeRight, threshold]
  );

  return { onTouchStart, onTouchEnd };
}
