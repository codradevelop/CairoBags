import { HubConnectionBuilder, HubConnectionState, LogLevel } from "@microsoft/signalr";
import { ENDPOINTS } from "../constants/endpoints.js";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "";

export const STATISTICS_EVENTS = {
  UPDATED: "StatisticsUpdated",
};

/** @type {import("@microsoft/signalr").HubConnection | null} */
let sharedConnection = null;
/** @type {Promise<void> | null} */
let startPromise = null;
let listenerAttached = false;
/** @type {Set<(payload: object) => void>} */
const listeners = new Set();

function buildHubUrl() {
  const base = API_BASE.replace(/\/$/, "");
  return `${base}${ENDPOINTS.signalR.statistics}`;
}

export function normalizeStatisticsPayload(payload) {
  if (!payload || typeof payload !== "object") return null;

  const read = (camelKey, pascalKey) => {
    const raw = payload[camelKey] ?? payload[pascalKey];
    const value = Number(raw);
    return Number.isFinite(value) ? value : null;
  };

  const registeredCustomers = read("registeredCustomers", "RegisteredCustomers");
  const premiumProducts = read("premiumProducts", "PremiumProducts");
  const completedOrders = read("completedOrders", "CompletedOrders");
  const customerSatisfaction = read("customerSatisfaction", "CustomerSatisfaction");

  if (
    registeredCustomers === null ||
    premiumProducts === null ||
    completedOrders === null ||
    customerSatisfaction === null
  ) {
    return null;
  }

  return {
    registeredCustomers,
    premiumProducts,
    completedOrders,
    customerSatisfaction,
  };
}

function publishStatisticsUpdate(payload) {
  const normalized = normalizeStatisticsPayload(payload);
  if (!normalized) return;
  listeners.forEach((listener) => listener(normalized));
}

function attachStatisticsListener(connection) {
  if (listenerAttached) return;
  listenerAttached = true;

  connection.on(STATISTICS_EVENTS.UPDATED, (payload) => {
    publishStatisticsUpdate(payload);
  });
}

function buildConnection() {
  return new HubConnectionBuilder()
    .withUrl(buildHubUrl(), { withCredentials: true })
    .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
    .configureLogging(import.meta.env.DEV ? LogLevel.Information : LogLevel.Warning)
    .build();
}

export function subscribeStatisticsUpdates(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export async function ensureStatisticsHubConnected() {
  if (!sharedConnection) {
    sharedConnection = buildConnection();
    attachStatisticsListener(sharedConnection);
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
        console.info("[statistics-hub] connected");
      }
    })
    .catch((error) => {
      if (import.meta.env.DEV) {
        console.warn("[statistics-hub] connect failed", error);
      }
      throw error;
    })
    .finally(() => {
      startPromise = null;
    });

  await startPromise;
  return sharedConnection;
}

export async function stopStatisticsHubConnection() {
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
