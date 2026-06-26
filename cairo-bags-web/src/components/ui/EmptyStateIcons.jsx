const iconProps = {
  width: 28,
  height: 28,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.25,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
};

export function EmptyIconProducts() {
  return (
    <svg {...iconProps}>
      <path d="M6 7h12l-1.5 12H7.5L6 7Z" />
      <path d="M9 7V5a3 3 0 0 1 6 0v2" />
    </svg>
  );
}

export function EmptyIconWishlist() {
  return (
    <svg {...iconProps}>
      <path d="M12 20.5 10.55 19.1C5.4 14.6 3 11.8 3 8.9 3 6.2 5.2 4 7.9 4c1.5 0 2.9.7 3.9 1.8C12.8 4.7 14.2 4 15.7 4 18.4 4 20.6 6.2 20.6 8.9c0 2.9-2.4 5.7-7.55 10.2L12 20.5Z" />
    </svg>
  );
}

export function EmptyIconOrders() {
  return (
    <svg {...iconProps}>
      <path d="M4 6h16v12H4z" />
      <path d="M8 10h8M8 14h5" />
    </svg>
  );
}

export function EmptyIconSearch() {
  return (
    <svg {...iconProps}>
      <circle cx="11" cy="11" r="6.5" />
      <path d="m18 18-3.2-3.2" />
    </svg>
  );
}

export function EmptyIconReviews() {
  return (
    <svg {...iconProps}>
      <path d="M12 3.5 14.1 8h4.6l-3.7 2.7 1.4 4.5L12 13.2 7.6 15.2l1.4-4.5L5.3 8h4.6L12 3.5Z" />
    </svg>
  );
}

export function EmptyIconNotifications() {
  return (
    <svg {...iconProps}>
      <path d="M12 4.5a4 4 0 0 0-4 4v3.2l-1.2 2.4h10.4L16 11.7V8.5a4 4 0 0 0-4-4Z" />
      <path d="M10 18.5a2 2 0 0 0 4 0" />
    </svg>
  );
}

export function EmptyIconCart() {
  return (
    <svg {...iconProps}>
      <path d="M6 7h15l-1.5 9H7.5L6 7Z" />
      <path d="M6 7 5 4H3" />
      <circle cx="9.5" cy="19" r="1.2" fill="currentColor" stroke="none" />
      <circle cx="17" cy="19" r="1.2" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function EmptyIconCategory() {
  return (
    <svg {...iconProps}>
      <rect x="4" y="4" width="7" height="7" rx="1" />
      <rect x="13" y="4" width="7" height="7" rx="1" />
      <rect x="4" y="13" width="7" height="7" rx="1" />
      <rect x="13" y="13" width="7" height="7" rx="1" />
    </svg>
  );
}

export function EmptyIconError() {
  return (
    <svg {...iconProps}>
      <circle cx="12" cy="12" r="8" />
      <path d="M12 8.5v4.5M12 15.8h.01" />
    </svg>
  );
}

const ICON_MAP = {
  products: EmptyIconProducts,
  wishlist: EmptyIconWishlist,
  orders: EmptyIconOrders,
  search: EmptyIconSearch,
  reviews: EmptyIconReviews,
  notifications: EmptyIconNotifications,
  cart: EmptyIconCart,
  category: EmptyIconCategory,
  error: EmptyIconError,
};

export function getEmptyStateIcon(variant) {
  const Icon = ICON_MAP[variant] ?? EmptyIconProducts;
  return <Icon />;
}
