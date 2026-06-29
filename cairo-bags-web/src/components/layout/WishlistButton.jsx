import { Link } from "react-router-dom";
import { useWishlist } from "../../context/WishlistContext.jsx";
import { Badge } from "../ui/Badge.jsx";
import { cn } from "../../utils/cn.js";

function HeartIcon({ filled = false }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden="true"
    >
      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
    </svg>
  );
}

export function WishlistHeaderButton({ className }) {
  const { count } = useWishlist();
  const displayCount = count ?? 0;

  return (
    <Link
      to="/wishlist"
      className={cn(
        "relative inline-flex h-10 w-10 items-center justify-center rounded-full",
        "text-brand-text transition-all duration-normal",
        className
      )}
      aria-label={`Wishlist${displayCount > 0 ? `, ${displayCount} items` : ""}`}
    >
      <HeartIcon />
      {displayCount > 0 ? (
        <Badge
          size="sm"
          variant="accent"
          className={cn(
            "absolute -end-1 -top-1 min-w-[1.25rem] justify-center px-1",
            "transition-transform duration-300 animate-scale-in"
          )}
        >
          {displayCount > 99 ? "99+" : displayCount}
        </Badge>
      ) : null}
    </Link>
  );
}
