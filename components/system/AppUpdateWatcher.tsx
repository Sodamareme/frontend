"use client";

import { useEffect, useRef } from "react";
import { toast } from "sonner";

const VERSION_CHECK_INTERVAL_MS = 60_000;
const RELOAD_DELAY_MS = 1_500;

export default function AppUpdateWatcher() {
  const hasTriggeredReload = useRef(false);
  const reloadTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const initialVersion = useRef<string | null>(null);

  useEffect(() => {
    initialVersion.current = document.body.dataset.appVersion ?? null;

    const cleanupTimer = () => {
      if (reloadTimer.current) {
        clearTimeout(reloadTimer.current);
        reloadTimer.current = null;
      }
    };

    const triggerReload = (nextVersion: string) => {
      if (hasTriggeredReload.current) {
        return;
      }

      hasTriggeredReload.current = true;

      if (document.visibilityState === "hidden") {
        window.location.reload();
        return;
      }

      toast.info("Nouvelle mise a jour disponible", {
        description: "L'application va se recharger pour afficher la derniere version.",
        duration: RELOAD_DELAY_MS,
      });

      reloadTimer.current = setTimeout(() => {
        console.info(
          `Reloading app to switch from build ${initialVersion.current ?? "unknown"} to ${nextVersion}`,
        );
        window.location.reload();
      }, RELOAD_DELAY_MS);
    };

    const checkVersion = async () => {
      if (hasTriggeredReload.current) {
        return;
      }

      try {
        const response = await fetch(`/api/app-version?t=${Date.now()}`, {
          cache: "no-store",
          headers: {
            "Cache-Control": "no-cache",
          },
        });

        if (!response.ok) {
          return;
        }

        const data = (await response.json()) as { version?: string };
        const latestVersion = data.version;
        const currentVersion = initialVersion.current;

        if (latestVersion && currentVersion && latestVersion !== currentVersion) {
          triggerReload(latestVersion);
        }
      } catch (error) {
        console.warn("Unable to check app version", error);
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void checkVersion();
      }
    };

    const handleFocus = () => {
      void checkVersion();
    };

    const intervalId = window.setInterval(() => {
      void checkVersion();
    }, VERSION_CHECK_INTERVAL_MS);

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleFocus);

    void checkVersion();

    return () => {
      cleanupTimer();
      window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleFocus);
    };
  }, []);

  return null;
}
