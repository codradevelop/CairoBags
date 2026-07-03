import { HubConnectionBuilder, HubConnectionState, LogLevel } from "@microsoft/signalr";
import { ENDPOINTS } from "../constants/endpoints.js";
import { getAccessToken } from "../utils/authStorage.js";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "";

function buildHubUrl() {
  const base = API_BASE.replace(/\/$/, "");
  return `${base}${ENDPOINTS.signalR.notifications}`;
}

export function createNotificationHubConnection() {
  return new HubConnectionBuilder()
    .withUrl(buildHubUrl(), {
      accessTokenFactory: () => getAccessToken() || "",
      withCredentials: true,
    })
    .withAutomaticReconnect()
    .configureLogging(LogLevel.Information)
    .build();
}

export async function startNotificationHub(connection) {
  if (!connection) return;
  if (connection.state === HubConnectionState.Connected) return;
  if (connection.state === HubConnectionState.Connecting) return;
  await connection.start();
}

export async function stopNotificationHub(connection) {
  if (!connection) return;
  if (connection.state === HubConnectionState.Disconnected) return;
  await connection.stop();
}

export const NOTIFICATION_EVENTS = {
  RECEIVE: "ReceiveNotification",
  UNREAD_COUNT: "UnreadCountUpdated",
};
