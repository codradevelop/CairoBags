import { useEffect, useRef } from "react";
import { ensureCatalogHubConnected } from "../services/catalogHub.js";

const RETRY_MS = 5000;

export function CatalogRealtimeProvider({ children }) {
  const cancelledRef = useRef(false);
  const retryTimerRef = useRef(null);

  useEffect(() => {
    cancelledRef.current = false;

    async function connect() {
      try {
        await ensureCatalogHubConnected();
      } catch {
        if (cancelledRef.current) return;
        retryTimerRef.current = window.setTimeout(connect, RETRY_MS);
      }
    }

    connect();

    function handleVisibilityChange() {
      if (document.visibilityState !== "visible") return;
      ensureCatalogHubConnected().catch(() => {});
    }

    function handleOnline() {
      ensureCatalogHubConnected().catch(() => {});
    }

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("online", handleOnline);

    return () => {
      cancelledRef.current = true;
      if (retryTimerRef.current != null) {
        window.clearTimeout(retryTimerRef.current);
      }
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("online", handleOnline);
    };
  }, []);

  return children;
}
