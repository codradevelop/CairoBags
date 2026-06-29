import { NotificationItem } from "./NotificationItem.jsx";
import { Skeleton } from "../ui/Skeleton.jsx";
import { cn } from "../../utils/cn.js";

export function NotificationList({
  notifications = [],
  loading = false,
  onMarkRead,
  userRole,
  className,
  skeletonCount = 4,
}) {
  if (loading) {
    return (
      <div className={cn("space-y-3", className)}>
        {Array.from({ length: skeletonCount }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <div className={cn("space-y-3", className)}>
      {notifications.map((notification) => (
        <NotificationItem
          key={notification.id ?? notification.Id}
          notification={notification}
          onMarkRead={onMarkRead}
          userRole={userRole}
        />
      ))}
    </div>
  );
}
