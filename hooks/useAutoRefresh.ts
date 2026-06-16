"use client";

import { useEffect, useRef } from "react";

type AutoRefreshOptions = {
  enabled?: boolean;
  intervalMs?: number;
  refetchOnFocus?: boolean;
  refetchOnReconnect?: boolean;
};

export function useAutoRefresh(
  callback: () => void | Promise<void>,
  {
    enabled = true,
    intervalMs = 30_000,
    refetchOnFocus = true,
    refetchOnReconnect = true,
  }: AutoRefreshOptions = {},
) {
  const callbackRef = useRef(callback);
  const isRefreshingRef = useRef(false);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const runRefresh = async () => {
      if (isRefreshingRef.current) {
        return;
      }

      if (typeof document !== "undefined" && document.visibilityState === "hidden") {
        return;
      }

      if (typeof navigator !== "undefined" && !navigator.onLine) {
        return;
      }

      isRefreshingRef.current = true;

      try {
        await callbackRef.current();
      } finally {
        isRefreshingRef.current = false;
      }
    };

    const handleFocus = () => {
      void runRefresh();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void runRefresh();
      }
    };

    const handleReconnect = () => {
      void runRefresh();
    };

    const intervalId = window.setInterval(() => {
      void runRefresh();
    }, intervalMs);

    if (refetchOnFocus) {
      window.addEventListener("focus", handleFocus);
      document.addEventListener("visibilitychange", handleVisibilityChange);
    }

    if (refetchOnReconnect) {
      window.addEventListener("online", handleReconnect);
    }

    return () => {
      window.clearInterval(intervalId);

      if (refetchOnFocus) {
        window.removeEventListener("focus", handleFocus);
        document.removeEventListener("visibilitychange", handleVisibilityChange);
      }

      if (refetchOnReconnect) {
        window.removeEventListener("online", handleReconnect);
      }
    };
  }, [enabled, intervalMs, refetchOnFocus, refetchOnReconnect]);
}
