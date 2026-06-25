import { useState } from "react";
import { AdminSidebar, AdminTopbar } from "../components/layout/AdminSidebar.jsx";
import { Breadcrumbs } from "../components/layout/Breadcrumbs.jsx";
import { LanguageSwitcher } from "../components/layout/LanguageSwitcher.jsx";
import { NotificationDropdown } from "../components/layout/NotificationDropdown.jsx";
import { UserDropdown } from "../components/layout/UserDropdown.jsx";
import { cn } from "../utils/cn.js";

function AdminMobileDrawer({ open, onClose, activeKey }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden" role="presentation">
      <button
        type="button"
        className="absolute inset-0 bg-brand-primary/50"
        aria-label="Close"
        onClick={onClose}
      />
      <div className="absolute inset-y-0 start-0 w-[min(100vw-2rem,18rem)] shadow-modal">
        <AdminSidebar activeKey={activeKey} mobile onToggleCollapse={null} />
      </div>
    </div>
  );
}

export function AdminLayout({
  children,
  activeKey,
  title,
  breadcrumbItems = [],
  className,
  contentClassName,
  topbarActions,
}) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const breadcrumbs =
    breadcrumbItems.length > 0 ? <Breadcrumbs items={breadcrumbItems} className="mb-1" /> : null;

  const topActions = (
    <>
      {topbarActions}
      <LanguageSwitcher />
      <NotificationDropdown adminContext />
      <UserDropdown adminContext />
    </>
  );

  return (
    <div className={cn("flex min-h-screen bg-brand-background", className)}>
      <AdminSidebar
        activeKey={activeKey}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed((v) => !v)}
      />

      <div
        className={cn(
          "flex min-w-0 flex-1 flex-col transition-[padding] duration-200",
          sidebarCollapsed ? "lg:ps-[4.5rem]" : "lg:ps-64"
        )}
      >
        <AdminTopbar
          title={title}
          breadcrumbs={breadcrumbs}
          onOpenMobileNav={() => setMobileNavOpen(true)}
          actions={topActions}
        />

        <main className={cn("flex-1 p-4 md:p-6 lg:p-8", contentClassName)}>{children}</main>
      </div>

      <AdminMobileDrawer
        open={mobileNavOpen}
        onClose={() => setMobileNavOpen(false)}
        activeKey={activeKey}
      />
    </div>
  );
}
