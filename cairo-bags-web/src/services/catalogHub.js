import { HubConnectionBuilder, HubConnectionState, LogLevel } from "@microsoft/signalr";
import { ENDPOINTS } from "../constants/endpoints.js";
import { normalizeCatalogChangeDetail, publishCatalogChange } from "../utils/catalogEvents.js";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "";

export const CATALOG_EVENTS = {
  CHANGED: "CatalogChanged",
};

/** @type {import("@microsoft/signalr").HubConnection | null} */
let sharedConnection = null;
/** @type {Promise<void> | null} */
let startPromise = null;
let listenerAttached = false;

function buildHubUrl() {
  const base = API_BASE.replace(/\/$/, "");
  return `${base}${ENDPOINTS.signalR.catalog}`;
}

function attachCatalogListener(connection) {
  if (listenerAttached) return;
  listenerAttached = true;

  connection.on(CATALOG_EVENTS.CHANGED, (payload) => {
    const detail = normalizeCatalogChangeDetail(payload);
    if (detail) publishCatalogChange(detail);
  });
}

function buildConnection() {
  // Catalog hub is anonymous — do NOT send JWT (stale tokens break negotiate).
  return new HubConnectionBuilder()
    .withUrl(buildHubUrl(), { withCredentials: true })
    .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
    .configureLogging(import.meta.env.DEV ? LogLevel.Information : LogLevel.Warning)
    .build();
}

export async function ensureCatalogHubConnected() {
  if (!sharedConnection) {
    sharedConnection = buildConnection();
    attachCatalogListener(sharedConnection);
  }

  if (sharedConnection.state === HubConnectionState.Connected) {
    return sharedConnection;
  }

  if (sharedConnection.state === HubConnectionState.Connecting && startPromise) {
    await startPromise;
    return sharedConnection;
  }

  startPromise = sharedConnection
    .start()
    .then(() => {
      if (import.meta.env.DEV) {
        console.info("[catalog-hub] connected");
      }
    })
    .catch((error) => {
      if (import.meta.env.DEV) {
        console.warn("[catalog-hub] connect failed", error);
      }
      throw error;
    })
    .finally(() => {
      startPromise = null;
    });

  await startPromise;
  return sharedConnection;
}

export async function stopCatalogHubConnection() {
  if (!sharedConnection) return;
  if (sharedConnection.state === HubConnectionState.Disconnected) {
    sharedConnection = null;
    listenerAttached = false;
    return;
  }
  await sharedConnection.stop();
  sharedConnection = null;
  listenerAttached = false;
  startPromise = null;
}

if (typeof window !== "undefined") {
  ensureCatalogHubConnected().catch(() => {});
}
