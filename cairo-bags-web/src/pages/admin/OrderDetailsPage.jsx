import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { AdminLayout } from "../../layouts/AdminLayout.jsx";
import { usePageTitle } from "../../hooks/usePageTitle.js";
import { useLocale } from "../../components/layout/LanguageSwitcher.jsx";
import { useToast } from "../../components/ui/Toast.jsx";
import { StatusBadge, CodOrderStatusSelector, CodOrderStatusConfirmModal, CodAdminAuditLog, AdminOrderInvoice } from "../../components/admin/index.js";
import { OrderShippingDetailsCard } from "../../components/orders/OrderShippingDetailsCard.jsx";
import { OrderTimeline } from "../../components/account/index.js";
import * as adminOrderService from "../../services/adminOrderService.js";
import { isCashOnDeliveryOrder } from "../../utils/codOrderHelpers.js";
import {
  formatOrderDate,
  getOrderDetailCoupon,
  getOrderDetailInfo,
  getOrderDetailItems,
  getOrderDetailPayment,
  getOrderDetailShipping,
  getOrderItemColor,
  getOrderItemName,
  getOrderNumber,
  getOrderStatus,
  getOrderStatusHistory,
  getPaymentStatus,
} from "../../utils/orderHelpers.js";
import { formatPrice } from "../../utils/productHelpers.js";
import { cn } from "../../utils/cn.js";
import {
  scrollToPaymentSection,
  scrollToTimelineSection,
  shouldHighlightPayment,
  shouldHighlightTimeline,
} from "../../utils/orderFocusUtils.js";
import { ORDER_STATUS } from "../../constants/orderStatus.js";
import { COD_STATUS_SUCCESS_TOAST } from "../../constants/codOrderStatus.js";
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [action, setAction] = useState(null);
  const [acting, setActing] = useState(false);
  const [pendingCodStatus, setPendingCodStatus] = useState(null);
  const [codUpdating, setCodUpdating] = useState(false);
  const [paymentHighlighted, setPaymentHighlighted] = useState(false);
  const [timelineHighlighted, setTimelineHighlighted] = useState(false);
  const location = useLocation();
  const highlightHandledRef = useRef(false);

  const order = detail ? getOrderDetailInfo(detail) : null;
  const orderNumber = order ? getOrderNumber(order) : "";
  const title = orderNumber
    ? `${locale === "ar" ? "طلب" : "Order"} ${orderNumber}`
    : locale === "ar"
      ? "تفاصيل الطلب"
      : "Order Details";
  usePageTitle(title);

  const loadOrder = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminOrderService.getAdminOrderById(id);
      setDetail(data);
    } catch (err) {
      setError(err);
      setDetail(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadOrder();
  }, [loadOrder]);

  useEffect(() => {
    if (loading || highlightHandledRef.current) return;

    const highlightPayment = shouldHighlightPayment(location);
    const highlightTimeline = shouldHighlightTimeline(location);

    if (!highlightPayment && !highlightTimeline) return;

    highlightHandledRef.current = true;
    const timer = window.setTimeout(() => {
      if (highlightPayment) {
        scrollToPaymentSection();
        setPaymentHighlighted(true);
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
  const payment = detail ? getOrderDetailPayment(detail) : null;
  const coupon = detail ? getOrderDetailCoupon(detail) : null;
  const history = detail ? getOrderStatusHistory(detail) : [];
  const status = order ? getOrderStatus(order) : "";
  const paymentStatus = detail ? getPaymentStatus(detail) : null;
  const isCod = isCashOnDeliveryOrder({ ...detail, payment });

  const actions = isCod
    ? []
    : [
    {
      key: "processing",
      label: locale === "ar" ? "بدء التجهيز" : "Mark Processing",
      variant: "accent",
      show: [ORDER_STATUS.PAYMENT_CONFIRMED].includes(status),
      handler: () => adminOrderService.moveOrderToProcessing(id),
    },
    {
      key: "shipped",
      label: locale === "ar" ? "تم الشحن" : "Mark Shipped",
      variant: "accent",
      show: [ORDER_STATUS.PROCESSING].includes(status),
      handler: () => adminOrderService.moveOrderToShipped(id),
    },
    {
      key: "delivered",
      label: locale === "ar" ? "تم التسليم" : "Mark Delivered",
      variant: "accent",
      show: [ORDER_STATUS.SHIPPED].includes(status),
      handler: () => adminOrderService.moveOrderToDelivered(id),
    },
    {
      key: "cancel",
      label: locale === "ar" ? "إلغاء" : "Cancel",
      variant: "danger",
      show: [
        ORDER_STATUS.PENDING,
        ORDER_STATUS.AWAITING_PAYMENT,
        ORDER_STATUS.PAYMENT_PROOF_SUBMITTED,
        ORDER_STATUS.PAYMENT_UNDER_REVIEW,
        ORDER_STATUS.PAYMENT_CONFIRMED,
        ORDER_STATUS.PROCESSING,
      ].includes(status),
      handler: () => adminOrderService.cancelAdminOrder(id),
    },
    {
      key: "refund",
      label: locale === "ar" ? "استرداد" : "Refund",
      variant: "danger",
      show: [
        ORDER_STATUS.PAYMENT_CONFIRMED,
        ORDER_STATUS.PROCESSING,
        ORDER_STATUS.SHIPPED,
        ORDER_STATUS.DELIVERED,
        ORDER_STATUS.COMPLETED,
      ].includes(status),
      handler: () => adminOrderService.refundAdminOrder(id),
    },
  ].filter((a) => a.show);

  async function applyCodStatusChange(nextStatus) {
    setCodUpdating(true);
    try {
      await adminOrderService.updateCodOrderStatus(id, nextStatus);
      success(COD_STATUS_SUCCESS_TOAST[locale] ?? COD_STATUS_SUCCESS_TOAST.en);
      setPendingCodStatus(null);
      await loadOrder();
    } catch (err) {
      toastError(err.message);
    } finally {
      setCodUpdating(false);
    }
  }

  function handleCodStatusChange(nextStatus) {
    setPendingCodStatus(nextStatus);
  }

  async function handleConfirmAction() {
    if (!action) return;
    setActing(true);
    try {
      await action.handler();
      success(
        locale === "ar" ? "تم تحديث حالة الطلب" : "Order status updated"
      );
      setAction(null);
      await loadOrder();
    } catch (err) {
      toastError(err.message);
    } finally {
      setActing(false);
    }
  }

  if (loading) {
    return (
      <AdminLayout activeKey="orders" title={title}>
        <div className="space-y-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-40 w-full rounded-lg" />
          <Skeleton className="h-56 w-full rounded-lg" />
        </div>
      </AdminLayout>
    );
  }

  if (error || !order) {
    return (
      <AdminLayout activeKey="orders" title={title}>
        <Card variant="flat" padding="lg">
          <CardBody className="text-center">
            <p className="text-brand-muted">
              {error?.message || (locale === "ar" ? "الطلب غير موجود" : "Order not found")}
            </p>
            <Link to="/admin/orders" className="mt-4 inline-block text-sm text-brand-accent">
              {locale === "ar" ? "← العودة للطلبات" : "← Back to orders"}
            </Link>
          </CardBody>
        </Card>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout
      activeKey="orders"
      title={title}
      breadcrumbItems={[
        { label: locale === "ar" ? "الطلبات" : "Orders", href: "/admin/orders" },
        { label: orderNumber },
      ]}
    >
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        {isCod ? (
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-sm font-medium text-brand-muted">
              {locale === "ar" ? "الدفع عند الاستلام" : "Cash on Delivery"}
            </p>
            <CodOrderStatusSelector
              currentStatus={status}
              onStatusChange={handleCodStatusChange}
              loading={codUpdating}
            />
          </div>
        ) : (
          <StatusBadge status={status} paymentStatus={paymentStatus} />
        )}
        {!isCod ? (
          <div className="flex flex-wrap gap-2">
            {actions.map((item) => (
              <Button
                key={item.key}
                type="button"
                variant={item.variant}
                size="sm"
                onClick={() => setAction(item)}
              >
                {item.label}
              </Button>
            ))}
          </div>
        ) : null}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card variant="default" padding="md">
            <CardHeader title={locale === "ar" ? "المنتجات" : "Items"} />
            <CardBody className="divide-y divide-brand-border">
              {items.map((item) => (
                <div
                  key={item.orderItemId ?? item.OrderItemId}
                  className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0"
                >
                  <div>
                    <p className="font-medium text-brand-text">
                      {getOrderItemName(item, locale)}
                    </p>
                    <p className="text-sm text-brand-muted">
                      {getOrderItemColor(item, locale)} · ×{item.quantity ?? item.Quantity}
                    </p>
                  </div>
                  <p className="font-medium">
                    {formatPrice(item.lineTotal ?? item.LineTotal, locale)}
                  </p>
                </div>
              ))}
            </CardBody>
          </Card>

          <Card
            variant="default"
            padding="md"
            id="order-timeline-section"
            className={cn(
              "transition-all duration-500",
              timelineHighlighted && "ring-2 ring-brand-accent/40 ring-offset-2 ring-offset-brand-surface"
            )}
          >
            <CardHeader title={locale === "ar" ? "سجل الحالة" : "Status History"} />
            <CardBody>
              <OrderTimeline history={history} payment={payment} />
            </CardBody>
          </Card>

          {isCod ? (
            <Card variant="default" padding="md">
              <CardHeader title={locale === "ar" ? "سجل التدقيق" : "Audit Log"} />
              <CardBody>
                <CodAdminAuditLog history={history} orderNumber={orderNumber} />
              </CardBody>
            </Card>
          ) : null}
        </div>

        <div className="space-y-6">
          <Card variant="default" padding="md">
            <CardHeader title={locale === "ar" ? "ملخص" : "Summary"} />
            <CardBody className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-brand-muted">{locale === "ar" ? "التاريخ" : "Date"}</span>
                <span>{formatOrderDate(order.createdAt ?? order.CreatedAt, locale)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-brand-muted">{locale === "ar" ? "المجموع الفرعي" : "Subtotal"}</span>
                <span>{formatPrice(order.subTotal ?? order.SubTotal, locale)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-brand-muted">{locale === "ar" ? "الشحن" : "Shipping"}</span>
                <span>{formatPrice(order.shippingFee ?? order.ShippingFee, locale)}</span>
              </div>
              {(order.discountAmount ?? order.DiscountAmount) > 0 ? (
                <div className="flex justify-between text-brand-accent">
                  <span>{locale === "ar" ? "الخصم" : "Discount"}</span>
                  <span>−{formatPrice(order.discountAmount ?? order.DiscountAmount, locale)}</span>
                </div>
              ) : null}
              <div className="flex justify-between border-t border-brand-border pt-2">
                <span className="text-brand-muted">{locale === "ar" ? "الإجمالي" : "Total"}</span>
                <span className="font-medium">
                  {formatPrice(order.totalAmount ?? order.TotalAmount, locale)}
                </span>
              </div>
              {coupon ? (
                <div className="flex justify-between">
                  <span className="text-brand-muted">{locale === "ar" ? "كوبون" : "Coupon"}</span>
                  <span>{coupon.code ?? coupon.Code}</span>
                </div>
              ) : null}
            </CardBody>
          </Card>

          <OrderShippingDetailsCard
            shipping={shipping}
            shippingFee={order.shippingFee ?? order.ShippingFee}
          />

          {payment ? (
            <Card
              variant="default"
              padding="md"
              id="order-payment-section"
              tabIndex={-1}
              className={cn(
                "transition-all duration-500",
                paymentHighlighted && "ring-2 ring-red-400/50 ring-offset-2 ring-offset-brand-surface"
              )}
            >
              <CardHeader title={locale === "ar" ? "الدفع" : "Payment"} />
              <CardBody className="text-sm text-brand-muted">
                <p>
                  {isCod
                    ? locale === "ar"
                      ? "الدفع عند الاستلام"
                      : "Cash on Delivery"
                    : payment.paymentMethod ?? payment.PaymentMethod}
                </p>
                <p>{formatPrice(payment.amount ?? payment.Amount, locale)}</p>
              </CardBody>
            </Card>
          ) : null}
        </div>
      </div>

      <div className="mt-8">
        <AdminOrderInvoice detail={detail} orderNumber={orderNumber} />
      </div>

      <ConfirmModal
        open={Boolean(action)}
        onClose={() => setAction(null)}
        onConfirm={handleConfirmAction}
        loading={acting}
        title={action?.label ?? ""}
        message={
          locale === "ar"
            ? `هل تريد تنفيذ "${action?.label}" على الطلب ${orderNumber}؟`
            : `Apply "${action?.label}" to order ${orderNumber}?`
        }
        confirmLabel={action?.label}
        variant={action?.variant === "danger" ? "danger" : "accent"}
      />

      <CodOrderStatusConfirmModal
        open={Boolean(pendingCodStatus)}
        onClose={() => setPendingCodStatus(null)}
        onConfirm={() => applyCodStatusChange(pendingCodStatus)}
        loading={codUpdating}
        currentStatus={status}
        nextStatus={pendingCodStatus}
        orderNumber={orderNumber}
      />
    </AdminLayout>
  );
}
