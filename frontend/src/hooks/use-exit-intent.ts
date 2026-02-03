"use client";

import { useEffect, useCallback, useRef } from "react";

interface UseExitIntentOptions {
  /** Threshold in pixels from top of viewport to trigger */
  threshold?: number;
  /** Delay in ms before enabling detection (to avoid false positives on page load) */
  delay?: number;
  /** Callback when exit intent is detected */
  onExitIntent: () => void;
}

export function useExitIntent({
  threshold = 10,
  delay = 1000,
  onExitIntent,
}: UseExitIntentOptions) {
  const isEnabledRef = useRef(false);
  const hasTriggeredRef = useRef(false);

  const handleMouseLeave = useCallback(
    (e: MouseEvent) => {
      // Only trigger if enabled and not already triggered
      if (!isEnabledRef.current || hasTriggeredRef.current) {
        return;
      }

      // Check if mouse is leaving through the top of the viewport
      if (e.clientY <= threshold) {
        hasTriggeredRef.current = true;
        onExitIntent();
      }
    },
    [threshold, onExitIntent]
  );

  useEffect(() => {
    // Enable detection after delay
    const timer = setTimeout(() => {
      isEnabledRef.current = true;
    }, delay);

    // Add event listener
    document.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      clearTimeout(timer);
      document.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [delay, handleMouseLeave]);

  // Allow resetting the trigger (e.g., after modal is closed)
  const reset = useCallback(() => {
    hasTriggeredRef.current = false;
  }, []);

  return { reset };
}
