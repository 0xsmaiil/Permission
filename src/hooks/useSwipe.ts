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

  const onTouchStart = useCallback((e: TouchEvent) => {
    startX.current = e.touches[0].clientX;
    startY.current = e.touches[0].clientY;
  }, []);

  const onTouchMove = useCallback(
    (e: TouchEvent) => {
      if (startY.current === 0 || !onSwipeDown) return;
      const dy = e.touches[0].clientY - startY.current;
      if (dy > threshold) {
        onSwipeDown();
        startX.current = 0;
        startY.current = 0;
      }
    },
    [onSwipeDown, threshold],
  );

  const onTouchEnd = useCallback(
    (e: TouchEvent) => {
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

  return { onTouchStart, onTouchMove, onTouchEnd };
}