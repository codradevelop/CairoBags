import { HubConnectionBuilder, HubConnectionState, LogLevel } from "@microsoft/signalr";
import { ENDPOINTS } from "../constants/endpoints.js";
import { getAccessToken } from "../utils/authStorage.js";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "";

function buildHubUrl() {
  const base = API_BASE.replace(/\/$/, "");
  return `${base}${ENDPOINTS.signalR.store}`;
}

export function createStoreHubConnection() {
  return new HubConnectionBuilder()
    .withUrl(buildHubUrl(), {
      accessTokenFactory: () => getAccessToken() || "",
    })
    .withAutomaticReconnect()
    .configureLogging(LogLevel.Warning)
    .build();
}

export async function startStoreHub(connection) {
  if (!connection) return;
  if (connection.state === HubConnectionState.Connected) return;
  if (connection.state === HubConnectionState.Connecting) return;
  await connection.start();
}

export async function stopStoreHub(connection) {
  if (!connection) return;
  if (connection.state === HubConnectionState.Disconnected) return;
  await connection.stop();
}
