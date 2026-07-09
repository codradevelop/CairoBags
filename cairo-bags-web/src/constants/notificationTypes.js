export const USER_ROLE = {
  CUSTOMER: "customer",
  ADMIN: "admin",
};

export const NOTIFICATION_TYPE = {
  ORDER_PLACED: "order_placed",
  ORDER_CONFIRMED: "order_confirmed",
  PAYMENT_SUBMITTED: "payment_submitted",
  PAYMENT_CONFIRMED: "payment_confirmed",
  PAYMENT_REJECTED: "payment_rejected",
  ORDER_PROCESSING: "order_processing",
  ORDER_SHIPPED: "order_shipped",
  ORDER_DELIVERED: "order_delivered",
  REVIEW_APPROVED: "review_approved",
  COUPON_ASSIGNED: "coupon_assigned",
  LOW_STOCK_ALERT: "low_stock_alert",
  SYSTEM_ANNOUNCEMENT: "system_announcement",
  ORDER_CANCELLED: "order_cancelled",
  PAYMENT_REFUNDED: "payment_refunded",
  NEW_PRODUCT_REVIEW: "new_product_review",
};

export const NOTIFICATION_TARGET = {
  ORDER: "Order",
  ORDER_PAYMENT: "OrderPayment",
  PRODUCT_REVIEW: "ProductReview",
  COUPON: "Coupon",
  PRODUCT_VARIANT: "ProductVariant",
  SYSTEM: "System",
  ADMIN_PAYMENTS: "AdminPayments",
};
