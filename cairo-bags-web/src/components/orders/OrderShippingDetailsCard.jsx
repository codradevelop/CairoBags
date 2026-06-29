import { useLocale } from "../layout/LanguageSwitcher.jsx";
import { formatPrice } from "../../utils/productHelpers.js";
import { Card, CardBody, CardHeader } from "../ui/Card.jsx";
import { cn } from "../../utils/cn.js";

function DetailRow({ label, value, className }) {
  if (!value) return null;
  return (
    <div className={cn("flex flex-wrap items-start justify-between gap-2", className)}>
      <span className="text-brand-muted">{label}</span>
      <span className="font-medium text-brand-text">{value}</span>
    </div>
  );
}

export function OrderShippingDetailsCard({
  shipping,
  shippingFee,
  className,
  title,
}) {
  const { locale } = useLocale();
  if (!shipping) return null;

  const governorate = shipping.governorate ?? shipping.Governorate;
  const cardTitle = title ?? (locale === "ar" ? "عنوان الشحن" : "Shipping Address");

  return (
    <Card variant="default" padding="md" className={className}>
      <CardHeader title={cardTitle} />
      <CardBody className="space-y-3 text-sm">
        <DetailRow
          label={locale === "ar" ? "الاسم" : "Name"}
          value={shipping.fullName ?? shipping.FullName}
        />
        <DetailRow
          label={locale === "ar" ? "الهاتف" : "Phone"}
          value={shipping.phoneNumber ?? shipping.PhoneNumber}
        />
        <DetailRow
          label={locale === "ar" ? "المحافظة" : "Governorate"}
          value={governorate}
        />
        <DetailRow
          label={locale === "ar" ? "المدينة" : "City"}
          value={shipping.city ?? shipping.City}
        />
        <DetailRow
          label={locale === "ar" ? "العنوان" : "Address"}
          value={shipping.addressLine1 ?? shipping.AddressLine1}
        />
        {shipping.addressLine2 ?? shipping.AddressLine2 ? (
          <DetailRow
            label={locale === "ar" ? "تفاصيل إضافية" : "Address line 2"}
            value={shipping.addressLine2 ?? shipping.AddressLine2}
          />
        ) : null}
        {shippingFee != null ? (
          <DetailRow
            label={locale === "ar" ? "رسوم الشحن" : "Shipping Fee"}
            value={formatPrice(shippingFee, locale)}
            className="border-t border-brand-border pt-3"
          />
        ) : null}
      </CardBody>
    </Card>
  );
}
