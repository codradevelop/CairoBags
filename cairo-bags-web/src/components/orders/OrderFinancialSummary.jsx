import { useLocale } from "../layout/LanguageSwitcher.jsx";
import { formatPrice } from "../../utils/productHelpers.js";
import { Card, CardBody, CardHeader } from "../ui/Card.jsx";
import { cn } from "../../utils/cn.js";

export function OrderFinancialSummary({
  order,
  coupon,
  className,
  title,
  id,
}) {
  const { locale } = useLocale();
  if (!order) return null;

  const subTotal = order.subTotal ?? order.SubTotal ?? 0;
  const shippingFee = order.shippingFee ?? order.ShippingFee ?? 0;
  const discountAmount = order.discountAmount ?? order.DiscountAmount ?? 0;
  const totalAmount = order.totalAmount ?? order.TotalAmount ?? 0;
  const couponCode = coupon?.code ?? coupon?.Code;

  return (
    <Card variant="default" padding="md" className={className} id={id}>
      <CardHeader title={title ?? (locale === "ar" ? "ملخص الفاتورة" : "Invoice Summary")} />
      <CardBody className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-brand-muted">{locale === "ar" ? "المجموع الفرعي" : "Subtotal"}</span>
          <span>{formatPrice(subTotal, locale)}</span>
        </div>
        {discountAmount > 0 ? (
          <div className="flex justify-between text-brand-accent">
            <span>
              {locale === "ar" ? "الخصم" : "Discount"}
              {couponCode ? ` (${couponCode})` : ""}
            </span>
            <span>−{formatPrice(discountAmount, locale)}</span>
          </div>
        ) : null}
        <div className="flex justify-between">
          <span className="text-brand-muted">{locale === "ar" ? "الشحن" : "Shipping"}</span>
          <span>{formatPrice(shippingFee, locale)}</span>
        </div>
        <div className={cn("flex justify-between border-t border-brand-border pt-2 font-medium")}>
          <span>{locale === "ar" ? "الإجمالي" : "Total"}</span>
          <span className="font-display text-lg">{formatPrice(totalAmount, locale)}</span>
        </div>
      </CardBody>
    </Card>
  );
}
