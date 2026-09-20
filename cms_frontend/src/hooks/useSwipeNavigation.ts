"use client";

import { useCallback, useRef } from "react";

const SWIPE_THRESHOLD = 50;

interface SwipeHandlers {
  onTouchStart: (e: React.TouchEvent) => void;
  onTouchEnd: (e: React.TouchEvent) => void;
  onMouseDown: (e: React.MouseEvent) => void;
  onMouseUp: (e: React.MouseEvent) => void;
  onMouseLeave: (e: React.MouseEvent) => void;
}

export function useSwipeNavigation(
  onPrev: () => void,
  onNext: () => void,
  enabled = true
) {
  const startX = useRef<number | null>(null);
  const startY = useRef<number | null>(null);
  const didSwipe = useRef(false);
  const isMouseDown = useRef(false);

  const reset = useCallback(() => {
    startX.current = null;
    startY.current = null;
    isMouseDown.current = false;
  }, []);

  const handleSwipeEnd = useCallback(
    (deltaX: number, deltaY: number) => {
      if (Math.abs(deltaX) < SWIPE_THRESHOLD) return;
      if (Math.abs(deltaX) <= Math.abs(deltaY)) return;

      didSwipe.current = true;
      if (deltaX < 0) onNext();
      else onPrev();
    },
    [onNext, onPrev]
  );

  const onTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (!enabled) return;
      didSwipe.current = false;
      startX.current = e.touches[0].clientX;
      startY.current = e.touches[0].clientY;
    },
    [enabled]
  );

  const onTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (!enabled || startX.current === null || startY.current === null) return;
      const deltaX = e.changedTouches[0].clientX - startX.current;
      const deltaY = e.changedTouches[0].clientY - startY.current;
      handleSwipeEnd(deltaX, deltaY);
      reset();
    },
    [enabled, handleSwipeEnd, reset]
  );

  const onMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (!enabled) return;
      didSwipe.current = false;
      startX.current = e.clientX;
      isMouseDown.current = true;
    },
    [enabled]
  );

  const onMouseUp = useCallback(
    (e: React.MouseEvent) => {
      if (!enabled || !isMouseDown.current || startX.current === null) return;
      handleSwipeEnd(e.clientX - startX.current, 0);
      reset();
    },
    [enabled, handleSwipeEnd, reset]
  );

  const onMouseLeave = useCallback(() => {
    reset();
  }, [reset]);

  const shouldIgnoreClick = useCallback(() => {
    if (didSwipe.current) {
      didSwipe.current = false;
      return true;
    }
    return false;
  }, []);

  const swipeHandlers: SwipeHandlers = {
    onTouchStart,
    onTouchEnd,
    onMouseDown,
    onMouseUp,
    onMouseLeave,
  };

  return { swipeHandlers, shouldIgnoreClick };
}
