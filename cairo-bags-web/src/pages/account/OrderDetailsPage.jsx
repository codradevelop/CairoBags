import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { AccountLayout } from "../../layouts/AccountLayout.jsx";
import { usePageTitle } from "../../hooks/usePageTitle.js";
import { useLocale } from "../../components/layout/LanguageSwitcher.jsx";
import { useToast } from "../../components/ui/Toast.jsx";
import * as orderService from "../../services/orderService.js";
import * as paymentService from "../../services/paymentService.js";
import { OrderShippingDetailsCard } from "../../components/orders/OrderShippingDetailsCard.jsx";
import { OrderFinancialSummary } from "../../components/orders/OrderFinancialSummary.jsx";
import {
  OrderStatusBadge,
  OrderTimeline,
  OrderPaymentSection,
} from "../../components/account/index.js";
import {
  canCancelOrder,
  formatOrderDate,
  getOrderDetailCoupon,
  getOrderDetailInfo,
  getOrderDetailItems,
  getOrderDetailPayment,
  getOrderDetailShipping,
  getOrderId,
  getOrderItemColor,
  getOrderItemImage,
  getOrderItemName,
  getOrderItemProductId,
  getOrderNumber,
  getOrderStatus,
  getOrderStatusHistory,
  isOrderReviewEligible,
  orderItemHasReviewed,
} from "../../utils/orderHelpers.js";
import { OrderReviewButton } from "../../components/account/OrderReviewButton.jsx";
import { useOrderReviewModal } from "../../components/account/OrderReviewActions.jsx";
import { formatPrice } from "../../utils/productHelpers.js";
import { cn } from "../../utils/cn.js";
import {
  consumePaymentHighlight,
  scrollToPaymentSection,
} from "../../utils/paymentScrollUtils.js";
import {
  scrollToTimelineSection,
  shouldHighlightPayment,
  shouldHighlightTimeline,
} from "../../utils/orderFocusUtils.js";
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  ConfirmModal,
  Skeleton,
} from "../../components/ui/index.js";

export function OrderDetailsPage() {
  const { id } = useParams();
  const { locale } = useLocale();
  const { success, error: toastError } = useToast();

  const [detail, setDetail] = useState(null);
  const [payment, setPayment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [paymentHighlighted, setPaymentHighlighted] = useState(false);
  const [timelineHighlighted, setTimelineHighlighted] = useState(false);
  const location = useLocation();
  const highlightHandledRef = useRef(false);

  const order = detail ? getOrderDetailInfo(detail) : null;
  const orderNumber = order ? getOrderNumber(order) : "";
  usePageTitle(orderNumber ? `${locale === "ar" ? "طلب" : "Order"} ${orderNumber}` : titleFallback(locale));

  const loadOrder = useCallback(async ({ silent = false } = {}) => {
    if (!silent) {
      setLoading(true);
    }
    setError(null);
    try {
      const [orderData, paymentData] = await Promise.all([
        orderService.getOrderById(id),
        paymentService.getPaymentByOrder(id).catch(() => null),
      ]);
      setDetail(orderData);
      setPayment(paymentData);
    } catch (err) {
      setError(err);
      if (!silent) {
        setDetail(null);
      }
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  }, [id]);

  useEffect(() => {
    loadOrder();
  }, [loadOrder]);

  useEffect(() => {
    if (loading || highlightHandledRef.current) return;

    const highlightPayment = shouldHighlightPayment(location) || consumePaymentHighlight();
    const highlightTimeline = shouldHighlightTimeline(location);

    if (!highlightPayment && !highlightTimeline) return;

    highlightHandledRef.current = true;
    const timer = window.setTimeout(() => {
      if (highlightPayment) {
        scrollToPaymentSection();
        setPaymentHighlighted(true);
        document.getElementById("order-payment-section")?.focus({ preventScroll: true });
        window.setTimeout(() => setPaymentHighlighted(false), 1400);
      }
      if (highlightTimeline) {
        scrollToTimelineSection();
        setTimelineHighlighted(true);
        window.setTimeout(() => setTimelineHighlighted(false), 1400);
      }
    }, 150);

    return () => window.clearTimeout(timer);
  }, [loading, location]);

  const items = detail ? getOrderDetailItems(detail) : [];
  const shipping = detail ? getOrderDetailShipping(detail) : null;
  const orderPayment = detail ? getOrderDetailPayment(detail) : null;
  const coupon = detail ? getOrderDetailCoupon(detail) : null;
  const history = detail ? getOrderStatusHistory(detail) : [];
  const status = order ? getOrderStatus(order) : "";
  const cancellable = canCancelOrder(status);
  const reviewEligible = isOrderReviewEligible(status);

  function patchItemReviewState(productId, review) {
    setDetail((current) => {
      if (!current) return current;
      const items = (current.items ?? current.Items ?? []).map((item) => {
        const itemProductId = getOrderItemProductId(item);
        if (Number(itemProductId) !== Number(productId)) return item;
        return {
          ...item,
          hasReviewed: true,
          HasReviewed: true,
          reviewId: review?.id,
          ReviewId: review?.id,
          reviewRating: review?.rating,
          ReviewRating: review?.rating,
          reviewTitle: review?.title,
          ReviewTitle: review?.title,
          reviewComment: review?.comment,
          ReviewComment: review?.comment,
        };
      });
      return { ...current, items, Items: items };
    });
  }

  const { openForItem, modal: reviewModal } = useOrderReviewModal({
    orderId: id,
    onReviewSaved: (productId, review) => patchItemReviewState(productId, review),
  });

  async function handleCancel() {
    setCancelling(true);
    try {
      await orderService.cancelOrder(id);
      success(locale === "ar" ? "تم إلغاء الطلب" : "Order cancelled");
      setCancelOpen(false);
      await loadOrder();
    } catch (err) {
      toastError(err.message);
    } finally {
      setCancelling(false);
    }
  }

  if (loading) {
    return (
      <AccountLayout activeKey="orders" title={locale === "ar" ? "تفاصيل الطلب" : "Order Details"}>
        <div className="space-y-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-40 w-full rounded-lg" />
          <Skeleton className="h-56 w-full rounded-lg" />
        </div>
      </AccountLayout>
    );
  }

  if (error || !order) {
    return (
      <AccountLayout activeKey="orders" title={locale === "ar" ? "تفاصيل الطلب" : "Order Details"}>
        <Card variant="flat" padding="lg">
          <CardBody className="text-center">
            <p className="text-brand-muted">
              {error?.message || (locale === "ar" ? "الطلب غير موجود" : "Order not found")}
            </p>
            <Link to="/account/orders" className="mt-4 inline-block text-sm text-brand-accent">
              {locale === "ar" ? "← العودة للطلبات" : "← Back to orders"}
            </Link>
          </CardBody>
        </Card>
      </AccountLayout>
    );
  }

  const paymentInfo = payment || orderPayment;

  return (
    <AccountLayout activeKey="orders" title={orderNumber}>
      <nav className="mb-6 text-sm text-brand-muted">
        <Link to="/account/orders" className="hover:text-brand-accent">
          {locale === "ar" ? "طلباتي" : "My Orders"}
        </Link>
        <span className="mx-2">/</span>
        <span className="text-brand-text">{orderNumber}</span>
      </nav>

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="font-display text-2xl font-medium text-brand-text">{orderNumber}</h2>
          <p className="mt-1 text-sm text-brand-muted">
            {formatOrderDate(order.createdAt ?? order.CreatedAt, locale)}
          </p>
          <OrderStatusBadge
            className="mt-3"
            status={status}
            paymentStatus={orderPayment?.paymentStatus ?? orderPayment?.PaymentStatus}
          />
        </div>
        {cancellable ? (
          <Button type="button" variant="outline" onClick={() => setCancelOpen(true)}>
            {locale === "ar" ? "إلغاء الطلب" : "Cancel Order"}
          </Button>
        ) : null}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
        <div className="space-y-6">
          <Card variant="default" padding="md">
            <CardHeader title={locale === "ar" ? "المنتجات" : "Products"} />
            <CardBody className="space-y-4">
              {items.map((item) => {
                const imageUrl = getOrderItemImage(item);
                return (
                <div
                  key={item.orderItemId ?? item.OrderItemId}
                  className="flex gap-4 border-b border-brand-border pb-4 last:border-b-0 last:pb-0"
                >
                  <div className="h-20 w-16 shrink-0 overflow-hidden rounded-md border border-brand-border bg-brand-secondary">
                    {imageUrl ? (
                      <img
                        src={imageUrl}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : null}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-brand-text">
                      {getOrderItemName(item, locale)}
                    </p>
                    <p className="text-sm text-brand-muted">{getOrderItemColor(item, locale)}</p>
                    <p className="mt-2 text-sm text-brand-muted">
                      {locale === "ar" ? "الكمية" : "Qty"}: {item.quantity ?? item.Quantity}
                    </p>
                    {reviewEligible ? (
                      <div className="mt-3">
                        <OrderReviewButton
                          hasReviewed={orderItemHasReviewed(item)}
                          onClick={() => openForItem(item)}
                        />
                      </div>
                    ) : null}
                  </div>
                  <p className="font-medium text-brand-primary">
                    {formatPrice(item.lineTotal ?? item.LineTotal, locale)}
                  </p>
                </div>
                );
              })}
            </CardBody>
          </Card>

          <OrderShippingDetailsCard
            shipping={shipping}
            shippingFee={order.shippingFee ?? order.ShippingFee}
          />

          {paymentInfo ? (
            <OrderPaymentSection
              order={order}
              payment={paymentInfo}
              highlighted={paymentHighlighted}
            />
          ) : null}

          {coupon ? (
            <Card variant="flat" padding="md">
              <CardHeader title={locale === "ar" ? "الكوبون" : "Coupon"} />
              <CardBody className="text-sm">
                <p className="text-brand-text">{coupon.code ?? coupon.Code}</p>
                <p className="mt-1 text-brand-muted">
                  {locale === "ar" ? "الخصم: " : "Discount: "}
                  {formatPrice(coupon.discountAmount ?? coupon.DiscountAmount, locale)}
                </p>
              </CardBody>
            </Card>
          ) : null}
        </div>

        <div className="space-y-6">
          <OrderFinancialSummary order={order} coupon={coupon} />

          <Card
            variant="default"
            padding="md"
            id="order-timeline-section"
            className={cn(
              "transition-all duration-500",
              timelineHighlighted && "ring-2 ring-brand-accent/40 ring-offset-2 ring-offset-brand-surface"
            )}
          >
            <CardHeader title={locale === "ar" ? "سجل الحالة" : "Order Timeline"} />
            <CardBody>
              <OrderTimeline history={history} payment={paymentInfo} />
            </CardBody>
          </Card>
        </div>
      </div>

      <ConfirmModal
        open={cancelOpen}
        onClose={() => setCancelOpen(false)}
        onConfirm={handleCancel}
        loading={cancelling}
        title={locale === "ar" ? "إلغاء الطلب؟" : "Cancel Order?"}
        message={
          locale === "ar"
            ? "هل أنت متأكد من إلغاء هذا الطلب؟ لا يمكن التراجع عن هذا الإجراء."
            : "Are you sure you want to cancel this order? This action cannot be undone."
        }
        confirmLabel={locale === "ar" ? "إلغاء الطلب" : "Cancel Order"}
        cancelLabel={locale === "ar" ? "الاحتفاظ بالطلب" : "Keep Order"}
      />
      {reviewModal}
    </AccountLayout>
  );
}

function titleFallback(locale) {
  return locale === "ar" ? "تفاصيل الطلب" : "Order Details";
}
