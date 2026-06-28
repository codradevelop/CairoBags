import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import * as notificationService from "../services/notificationService.js";
import {
  createNotificationHubConnection,
  NOTIFICATION_EVENTS,
  startNotificationHub,
  stopNotificationHub,
} from "../services/notificationHub.js";
import {
  parseReviewHighlightFromNotification,
  requestReviewHighlight,
} from "../utils/reviewScrollUtils.js";
import { publishReviewChange } from "../utils/reviewEvents.js";
import { normalizeError } from "../utils/normalizeError.js";
import { useAuth } from "./AuthContext.jsx";

const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
  const { isAuthenticated } = useAuth();
  const connectionRef = useRef(null);

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [pagination, setPagination] = useState({ total: 0, page: 1, pageSize: 20 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [latestPush, setLatestPush] = useState(null);

  const loadNotifications = useCallback(async (page = 1, pageSize = 20) => {
    setLoading(true);
    setError(null);
    try {
      const data = await notificationService.getNotifications({ page, pageSize });
      setNotifications(data.items ?? []);
      setPagination({
        total: data.total ?? 0,
        page: data.page ?? page,
        pageSize: data.pageSize ?? pageSize,
      });
      return data;
    } catch (err) {
      const normalized = normalizeError(err);
      setError(normalized);
      throw normalized;
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshUnreadCount = useCallback(async () => {
    const data = await notificationService.getUnreadCount();
    setUnreadCount(data.count ?? 0);
    return data.count ?? 0;
  }, []);

  const disconnectHub = useCallback(async () => {
    if (connectionRef.current) {
      await stopNotificationHub(connectionRef.current);
      connectionRef.current = null;
    }
  }, []);

  const connectHub = useCallback(async () => {
    await disconnectHub();
    const connection = createNotificationHubConnection();

    connection.on(NOTIFICATION_EVENTS.RECEIVE, (notification) => {
      setLatestPush(notification);
      if (notification?.type === "new_product_review") {
        const reviewId = parseReviewHighlightFromNotification(notification);
        if (reviewId) requestReviewHighlight(reviewId);
        publishReviewChange({ action: "created", notification });
      }
      setNotifications((prev) => {
        const exists = prev.some((n) => n.id === notification.id);
        if (exists) {
          return prev.map((n) => (n.id === notification.id ? notification : n));
        }
        return [notification, ...prev];
      });
      if (!notification.isRead) {
        setUnreadCount((count) => count + 1);
      }
    });

    connection.on(NOTIFICATION_EVENTS.UNREAD_COUNT, (count) => {
      setUnreadCount(count ?? 0);
    });

    await startNotificationHub(connection);
    connectionRef.current = connection;
  }, [disconnectHub]);

  useEffect(() => {
    if (!isAuthenticated) {
      setNotifications([]);
      setUnreadCount(0);
      setLatestPush(null);
      disconnectHub();
      return undefined;
    }

    let cancelled = false;

    (async () => {
      try {
        await loadNotifications();
        await refreshUnreadCount();
        if (!cancelled) {
          await connectHub();
        }
      } catch {
        /* handled in state */
      }
    })();

    return () => {
      cancelled = true;
      disconnectHub();
    };
  }, [isAuthenticated, loadNotifications, refreshUnreadCount, connectHub, disconnectHub]);

  const markAsRead = useCallback(
    async (id) => {
      await notificationService.markNotificationAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => {
          const notificationId = n.id ?? n.Id;
          if (notificationId === id) {
            return { ...n, isRead: true, IsRead: true };
          }
          return n;
        })
      );
      await refreshUnreadCount();
    },
    [refreshUnreadCount]
  );

  const markAllAsRead = useCallback(async () => {
    await notificationService.markAllNotificationsAsRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true, IsRead: true })));
    setUnreadCount(0);
  }, []);

  const value = useMemo(
    () => ({
      notifications,
      unreadCount,
      pagination,
      loading,
      error,
      latestPush,
      loadNotifications,
      refreshUnreadCount,
      markAsRead,
      markAllAsRead,
      connectHub,
      disconnectHub,
    }),
    [
      notifications,
      unreadCount,
      pagination,
      loading,
      error,
      latestPush,
      loadNotifications,
      refreshUnreadCount,
      markAsRead,
      markAllAsRead,
      connectHub,
      disconnectHub,
    ]
  );

  return (
    <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotifications must be used within NotificationProvider");
  }
  return context;
}
