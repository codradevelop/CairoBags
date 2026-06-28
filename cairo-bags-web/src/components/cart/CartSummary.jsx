import { useLocale } from "../layout/LanguageSwitcher.jsx";
import { formatPrice } from "../../utils/productHelpers.js";
import { Card, CardBody, CardHeader } from "../ui/Card.jsx";
import { cn } from "../../utils/cn.js";
import { motion } from "framer-motion";

export function CartSummary({
  subTotal,
  shippingFee,
  discountAmount,
  totalAmount,
  itemCount,
  className,
  showEstimateNote = false,
  couponCode,
}) {
  const { locale } = useLocale();
  const title = locale === "ar" ? "ملخص الطلب" : "Order Summary";
  const displayTotal = totalAmount ?? subTotal ?? 0;

  const rows = [
    {
      label: locale === "ar" ? "المجموع الفرعي" : "Subtotal",
      value: formatPrice(subTotal ?? 0, locale),
    },
  ];

  if (discountAmount != null && discountAmount > 0) {
    rows.push({
      label: locale === "ar" ? "الخصم" : "Discount",
      value: `−${formatPrice(discountAmount, locale)}`,
      accent: true,
    });
  }

  if (shippingFee != null) {
    rows.push({
      label: locale === "ar" ? "الشحن" : "Shipping",
      value: shippingFee === 0 ? (locale === "ar" ? "مجاني" : "Free") : formatPrice(shippingFee, locale),
    });
  }

  return (
    <Card variant="elevated" padding="md" className={cn("h-fit", className)}>
      <CardHeader title={title} />
      <CardBody className="space-y-3">
        {itemCount != null ? (
          <p className="text-sm text-brand-muted">
            {locale === "ar"
              ? `${itemCount} منتج`
              : `${itemCount} item${itemCount === 1 ? "" : "s"}`}
          </p>
        ) : null}

        {rows.map((row) => (
          <div key={row.label} className="flex items-center justify-between text-sm">
            <span className="text-brand-muted">{row.label}</span>
            <span className={cn("font-medium", row.accent && "text-brand-accent")}>{row.value}</span>
          </div>
        ))}

        {couponCode ? (
          <div className="inline-flex rounded-full bg-brand-accent/10 px-3 py-1 text-xs font-medium text-brand-accent">
            {couponCode} {locale === "ar" ? "مُطبّق" : "Applied"}
          </div>
        ) : null}

        <div className="flex items-center justify-between border-t border-brand-border pt-3">
          <span className="font-medium text-brand-text">
            {locale === "ar" ? "الإجمالي" : "Total"}
          </span>
          <motion.span
            key={displayTotal}
            initial={{ opacity: 0.6, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="font-display text-xl font-medium text-brand-primary"
          >
            {formatPrice(displayTotal, locale)}
          </motion.span>
        </div>

        {showEstimateNote ? (
          <p className="text-xs text-brand-muted">
            {locale === "ar"
              ? "رسوم الشحن والخصم تُحسب عند إتمام الطلب"
              : "Shipping and discounts are calculated when you place your order"}
          </p>
        ) : null}
      </CardBody>
    </Card>
  );
}
