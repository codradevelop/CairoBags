import { Link } from "react-router-dom";
import { useCart } from "../../context/CartContext.jsx";
import { Badge } from "../ui/Badge.jsx";
import { cn } from "../../utils/cn.js";

function CartIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M6 6h15l-1.5 9h-12L6 6ZM6 6 5 3H2"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="9" cy="20" r="1" fill="currentColor" />
      <circle cx="18" cy="20" r="1" fill="currentColor" />
    </svg>
  );
}

export function CartButton({ className }) {
  const { itemsCount } = useCart();
  const count = itemsCount ?? 0;

  return (
    <Link
      to="/cart"
      className={cn(
        "relative inline-flex h-10 w-10 items-center justify-center rounded-md",
        "text-brand-text transition-colors hover:bg-brand-secondary",
        className
      )}
      aria-label={`Cart${count > 0 ? `, ${count} items` : ""}`}
    >
      <CartIcon />
      {count > 0 ? (
        <Badge
          size="sm"
          variant="accent"
          className="absolute -end-1 -top-1 min-w-[1.25rem] justify-center px-1"
        >
          {count > 99 ? "99+" : count}
        </Badge>
      ) : null}
    </Link>
  );
}
