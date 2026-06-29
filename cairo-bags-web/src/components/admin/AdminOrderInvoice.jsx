import { useLocale } from "../layout/LanguageSwitcher.jsx";
import { Button } from "../ui/Button.jsx";
import { OrderShippingDetailsCard } from "../orders/OrderShippingDetailsCard.jsx";
import { OrderFinancialSummary } from "../orders/OrderFinancialSummary.jsx";
import { formatOrderDate, getOrderDetailInfo, getOrderDetailShipping, getOrderDetailCoupon } from "../../utils/orderHelpers.js";

export function AdminOrderInvoice({ detail, orderNumber }) {
  const { locale } = useLocale();
  const order = getOrderDetailInfo(detail);
  const shipping = getOrderDetailShipping(detail);
  const coupon = getOrderDetailCoupon(detail);

  if (!order) return null;

  return (
    <section className="space-y-4">
      <div className="flex justify-end print:hidden">
        <Button type="button" variant="outline" size="sm" onClick={() => window.print()}>
          {locale === "ar" ? "طباعة الفاتورة" : "Print Invoice"}
        </Button>
      </div>

      <div id="admin-order-invoice" className="rounded-lg border border-brand-border bg-brand-surface p-6 print:border-0 print:p-0">
        <div className="mb-6 border-b border-brand-border pb-4">
          <p className="text-xs font-medium uppercase tracking-wider text-brand-muted">
            {locale === "ar" ? "فاتورة" : "Invoice"}
          </p>
          <h2 className="mt-1 font-display text-2xl font-medium text-brand-text">{orderNumber}</h2>
          <p className="mt-1 text-sm text-brand-muted">
            {formatOrderDate(order.createdAt ?? order.CreatedAt, locale)}
          </p>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <OrderShippingDetailsCard
            shipping={shipping}
            shippingFee={order.shippingFee ?? order.ShippingFee}
          />
          <OrderFinancialSummary order={order} coupon={coupon} />
        </div>

        <div className="mt-6 text-xs text-brand-muted">
          {locale === "ar"
            ? "رسوم الشحن والمحافظة محفوظة كما كانت عند إنشاء الطلب."
            : "Shipping fee and governorate are stored as captured at checkout."}
        </div>
      </div>
    </section>
  );
}
