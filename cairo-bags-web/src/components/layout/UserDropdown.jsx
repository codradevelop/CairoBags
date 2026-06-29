import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "../ui/Button.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { useLocale } from "./LanguageSwitcher.jsx";
import { resolveMediaUrl } from "../../utils/mediaUrl.js";
import { cn } from "../../utils/cn.js";

function UserIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M4 20c0-4 3.58-7 8-7s8 3 8 7"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function UserAvatar({ user, displayName }) {
  const imageUrl = user?.profileImageUrl ?? user?.ProfileImageUrl;
  const resolved = imageUrl ? resolveMediaUrl(imageUrl) : "";

  if (resolved) {
    return (
      <img
        src={resolved}
        alt=""
        className="cb-header-user-avatar"
        loading="lazy"
        decoding="async"
      />
    );
  }

  const initial = (displayName?.trim()?.[0] || "U").toUpperCase();

  return <span className="cb-header-user-avatar cb-header-user-avatar--initial">{initial}</span>;
}

export function UserDropdown({ className, adminContext = false }) {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const { locale } = useLocale();
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);

  useEffect(() => {
    const onDocClick = (event) => {
      if (!rootRef.current?.contains(event.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const labels = {
    account: locale === "ar" ? "حسابي" : "My Account",
    editProfile: locale === "ar" ? "تعديل الملف الشخصي" : "Edit Profile",
    orders: locale === "ar" ? "طلباتي" : "My Orders",
    admin: locale === "ar" ? "لوحة الإدارة" : "Admin Panel",
    login: locale === "ar" ? "تسجيل الدخول" : "Sign In",
    register: locale === "ar" ? "إنشاء حساب" : "Register",
    logout: locale === "ar" ? "تسجيل الخروج" : "Sign Out",
  };

  const displayName = user?.name || user?.userName || user?.email || labels.account;
  const showOrdersLink = !adminContext && !isAdmin;
  const showAdminLink = isAdmin && !adminContext;

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <Button
        type="button"
        variant="ghost"
        size={isAuthenticated ? "md" : "sm"}
        className={cn(
          "cb-header-user-trigger",
          isAuthenticated && "cb-header-user-trigger--auth"
        )}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        {isAuthenticated ? (
          <UserAvatar user={user} displayName={displayName} />
        ) : (
          <UserIcon />
        )}
        <span className="cb-header-user-label hidden max-w-[9rem] truncate sm:inline">
          {isAuthenticated ? displayName : labels.login}
        </span>
      </Button>

      {open ? (
        <div
          className={cn(
            "absolute end-0 z-50 mt-2 min-w-[12rem] overflow-hidden rounded-lg border border-brand-border",
            "bg-brand-surface shadow-soft animate-slide-down"
          )}
          role="menu"
        >
          {isAuthenticated ? (
            <>
              <div className="border-b border-brand-border px-4 py-3">
                <p className="truncate text-sm font-medium text-brand-text">{displayName}</p>
                {user?.email ? (
                  <p className="truncate text-xs text-brand-muted">{user.email}</p>
                ) : null}
              </div>
              <nav className="py-1">
                <Link
                  to="/account"
                  className="block px-4 py-2.5 text-sm hover:bg-brand-secondary"
                  role="menuitem"
                  onClick={() => setOpen(false)}
                >
                  {labels.account}
                </Link>
                {adminContext || isAdmin ? (
                  <Link
                    to="/account/profile"
                    className="block px-4 py-2.5 text-sm hover:bg-brand-secondary"
                    role="menuitem"
                    onClick={() => setOpen(false)}
                  >
                    {labels.editProfile}
                  </Link>
                ) : null}
                {showOrdersLink ? (
                  <Link
                    to="/account/orders"
                    className="block px-4 py-2.5 text-sm hover:bg-brand-secondary"
                    role="menuitem"
                    onClick={() => setOpen(false)}
                  >
                    {labels.orders}
                  </Link>
                ) : null}
                {showAdminLink ? (
                  <Link
                    to="/admin"
                    className="block px-4 py-2.5 text-sm hover:bg-brand-secondary"
                    role="menuitem"
                    onClick={() => setOpen(false)}
                  >
                    {labels.admin}
                  </Link>
                ) : null}
              </nav>
              <div className="border-t border-brand-border p-1">
                <button
                  type="button"
                  className="w-full rounded-md px-4 py-2.5 text-start text-sm text-red-800 hover:bg-red-50 dark:hover:bg-red-950/30"
                  role="menuitem"
                  onClick={() => {
                    setOpen(false);
                    logout();
                  }}
                >
                  {labels.logout}
                </button>
              </div>
            </>
          ) : (
            <nav className="py-1">
              <Link
                to="/login"
                className="block px-4 py-2.5 text-sm hover:bg-brand-secondary"
                role="menuitem"
                onClick={() => setOpen(false)}
              >
                {labels.login}
              </Link>
              <Link
                to="/register"
                className="block px-4 py-2.5 text-sm hover:bg-brand-secondary"
                role="menuitem"
                onClick={() => setOpen(false)}
              >
                {labels.register}
              </Link>
            </nav>
          )}
        </div>
      ) : null}
    </div>
  );
}
