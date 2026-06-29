import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { ALL_STORE_EVENTS } from "../constants/storeEvents.js";
import {
  createStoreHubConnection,
  startStoreHub,
  stopStoreHub,
} from "../services/storeHub.js";
import { publishStoreEvent } from "../utils/storeEvents.js";

const StoreContext = createContext(null);

export function StoreProvider({ children }) {
  const connectionRef = useRef(null);
  const [connected, setConnected] = useState(false);
  const [lastEvent, setLastEvent] = useState(null);

  const disconnectHub = useCallback(async () => {
    if (connectionRef.current) {
      await stopStoreHub(connectionRef.current);
      connectionRef.current = null;
    }
    setConnected(false);
  }, []);

  const connectHub = useCallback(async () => {
    await disconnectHub();

    const connection = createStoreHubConnection();

    ALL_STORE_EVENTS.forEach((eventName) => {
      connection.on(eventName, (payload) => {
        setLastEvent({ eventType: eventName, payload, at: Date.now() });
        publishStoreEvent(eventName, payload ?? {});
      });
    });

    connection.onreconnected(() => setConnected(true));
    connection.onclose(() => setConnected(false));

    try {
      await startStoreHub(connection);
      connectionRef.current = connection;
      setConnected(true);
    } catch {
      setConnected(false);
    }
  }, [disconnectHub]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      if (!cancelled) await connectHub();
    })();

    return () => {
      cancelled = true;
      disconnectHub();
    };
  }, [connectHub, disconnectHub]);

  const value = useMemo(
    () => ({
      connected,
      lastEvent,
      reconnect: connectHub,
    }),
    [connected, lastEvent, connectHub]
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) {
    throw new Error("useStore must be used within StoreProvider");
  }
  return ctx;
}
