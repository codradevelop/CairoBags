import { Link } from "react-router-dom";
import { Card, CardBody } from "../ui/Card.jsx";
import { OrderStatusBadge } from "./OrderStatusBadge.jsx";
import { OrderReviewableList } from "./OrderReviewActions.jsx";
import { useLocale } from "../layout/LanguageSwitcher.jsx";
import {
  formatOrderDate,
  getOrderCreatedAt,
  getOrderId,
  getOrderItemsCount,
  getOrderNumber,
  getOrderPrimaryImage,
  getOrderReviewableItems,
  getOrderStatus,
  getOrderTotal,
  getPaymentStatus,
  isOrderReviewEligible,
} from "../../utils/orderHelpers.js";
import { formatPrice } from "../../utils/productHelpers.js";
import { cn } from "../../utils/cn.js";

export function OrderCard({ order, className, onReviewSaved }) {
  const { locale } = useLocale();
  const orderId = getOrderId(order);
  const orderNumber = getOrderNumber(order);
  const imageUrl = getOrderPrimaryImage(order);
  const status = getOrderStatus(order);
  const reviewableItems = getOrderReviewableItems(order);
  const showReviews = isOrderReviewEligible(status) && reviewableItems.length > 0;

  return (
    <Card variant="elevated" className={cn("transition-shadow hover:shadow-soft", className)}>
      <CardBody className="flex gap-4 p-4 sm:p-5">
        <Link to={`/account/orders/${orderId}`} className="h-20 w-16 shrink-0 overflow-hidden rounded-md border border-brand-border bg-brand-secondary sm:h-24 sm:w-20">
          {imageUrl ? (
            <img src={imageUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center font-display text-brand-muted">CB</div>
          )}
        </Link>

        <div className="min-w-0 flex-1">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <Link to={`/account/orders/${orderId}`} className="block min-w-0">
              <p className="font-medium text-brand-text hover:text-brand-accent">{orderNumber}</p>
              <p className="mt-1 text-xs text-brand-muted sm:text-sm">
                {formatOrderDate(getOrderCreatedAt(order), locale)}
              </p>
            </Link>
            <OrderStatusBadge status={status} paymentStatus={getPaymentStatus(order)} />
          </div>

          <Link to={`/account/orders/${orderId}`} className="mt-3 flex items-center justify-between gap-3 text-sm">
            <span className="text-brand-muted">
              {locale === "ar"
                ? `${getOrderItemsCount(order)} منتج`
                : `${getOrderItemsCount(order)} item${getOrderItemsCount(order) === 1 ? "" : "s"}`}
            </span>
            <span className="font-medium text-brand-primary">{formatPrice(getOrderTotal(order), locale)}</span>
          </Link>

          {showReviews ? (
            <OrderReviewableList
              items={reviewableItems}
              locale={locale}
              orderId={orderId}
              onReviewSaved={onReviewSaved}
            />
          ) : null}
        </div>
      </CardBody>
    </Card>
  );
}
