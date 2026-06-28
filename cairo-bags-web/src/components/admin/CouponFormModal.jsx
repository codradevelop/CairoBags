import { useEffect, useMemo, useState } from "react";
import { Modal } from "../ui/Modal.jsx";
import { Button, Input, Label, Select, Textarea } from "../ui/index.js";
import { useLocale } from "../layout/LanguageSwitcher.jsx";
import { COUPON_TYPE, addDurationToDate, toIsoUtc } from "../../constants/couponHelpers.js";

const DURATION_UNITS = [
  { value: "minutes", en: "Minutes", ar: "دقائق" },
  { value: "hours", en: "Hours", ar: "ساعات" },
  { value: "days", en: "Days", ar: "أيام" },
  { value: "weeks", en: "Weeks", ar: "أسابيع" },
  { value: "months", en: "Months", ar: "أشهر" },
];

function toLocalInputValue(date) {
  if (!date) return "";
  const d = new Date(date);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function buildInitialForm(coupon) {
  if (!coupon) {
    const start = new Date();
    const end = addDurationToDate(start, 7, "days");
    return {
      code: "",
      type: COUPON_TYPE.PERCENTAGE,
      value: "",
      minimumOrderAmount: "",
      maximumDiscountAmount: "",
      scheduleMode: "duration",
      durationAmount: "7",
      durationUnit: "days",
      startDate: toLocalInputValue(start),
      endDate: toLocalInputValue(end),
      usageLimit: "",
      perCustomerUsageLimit: "1",
      isActive: true,
      description: "",
    };
  }

  return {
    code: coupon.code ?? coupon.Code ?? "",
    type: coupon.type ?? coupon.Type ?? COUPON_TYPE.PERCENTAGE,
    value: String(coupon.value ?? coupon.Value ?? ""),
    minimumOrderAmount: coupon.minimumOrderAmount ?? coupon.MinimumOrderAmount ?? "",
    maximumDiscountAmount: coupon.maximumDiscountAmount ?? coupon.MaximumDiscountAmount ?? "",
    scheduleMode: "specific",
    durationAmount: "7",
    durationUnit: "days",
    startDate: toLocalInputValue(coupon.startDate ?? coupon.StartDate),
    endDate: toLocalInputValue(coupon.endDate ?? coupon.EndDate),
    usageLimit: coupon.usageLimit ?? coupon.UsageLimit ?? "",
    perCustomerUsageLimit: String(coupon.perCustomerUsageLimit ?? coupon.PerCustomerUsageLimit ?? 1),
    isActive: coupon.isActive ?? coupon.IsActive ?? true,
    description: coupon.description ?? coupon.Description ?? "",
  };
}

export function CouponFormModal({ open, onClose, onSubmit, initialCoupon, loading }) {
  const { locale } = useLocale();
  const isEdit = Boolean(initialCoupon?.id ?? initialCoupon?.Id);
  const [form, setForm] = useState(() => buildInitialForm(initialCoupon));

  useEffect(() => {
    if (open) setForm(buildInitialForm(initialCoupon));
  }, [open, initialCoupon]);

  const title = isEdit
    ? locale === "ar"
      ? "تعديل كود الخصم"
      : "Edit Coupon"
    : locale === "ar"
      ? "إنشاء كود خصم"
      : "Create Coupon";

  const computedDates = useMemo(() => {
    if (form.scheduleMode !== "duration") return null;
    const start = new Date();
    const end = addDurationToDate(start, form.durationAmount, form.durationUnit);
    return { start, end };
  }, [form.scheduleMode, form.durationAmount, form.durationUnit]);

  function updateField(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleSubmit(event) {
    event.preventDefault();
    const start =
      form.scheduleMode === "duration" && computedDates
        ? computedDates.start
        : new Date(form.startDate);
    const end =
      form.scheduleMode === "duration" && computedDates
        ? computedDates.end
        : new Date(form.endDate);

    onSubmit?.({
      code: form.code.trim().toUpperCase(),
      type: Number(form.type),
      value: Number(form.value),
      minimumOrderAmount: form.minimumOrderAmount ? Number(form.minimumOrderAmount) : null,
      maximumDiscountAmount: form.maximumDiscountAmount ? Number(form.maximumDiscountAmount) : null,
      startDate: toIsoUtc(start),
      endDate: toIsoUtc(end),
      usageLimit: form.usageLimit ? Number(form.usageLimit) : null,
      perCustomerUsageLimit: Number(form.perCustomerUsageLimit) || 1,
      isActive: form.isActive,
      description: form.description.trim() || null,
    });
  }

  return (
    <Modal open={open} onClose={onClose} title={title} size="lg">
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <Label htmlFor="coupon-code-input">{locale === "ar" ? "كود الخصم" : "Coupon Code"}</Label>
          <Input
            id="coupon-code-input"
            value={form.code}
            onChange={(e) => updateField("code", e.target.value.toUpperCase())}
            placeholder="WELCOME10"
            required
            className="mt-1.5 uppercase"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label>{locale === "ar" ? "نوع الخصم" : "Discount Type"}</Label>
            <Select
              value={String(form.type)}
              onChange={(e) => updateField("type", e.target.value)}
              className="mt-1.5"
            >
              <option value={COUPON_TYPE.PERCENTAGE}>{locale === "ar" ? "نسبة مئوية" : "Percentage"}</option>
              <option value={COUPON_TYPE.FIXED_AMOUNT}>{locale === "ar" ? "مبلغ ثابت" : "Fixed Amount"}</option>
            </Select>
          </div>
          <div>
            <Label>{locale === "ar" ? "قيمة الخصم" : "Discount Value"}</Label>
            <Input
              type="number"
              min="0.01"
              step="0.01"
              value={form.value}
              onChange={(e) => updateField("value", e.target.value)}
              required
              className="mt-1.5"
            />
          </div>
        </div>

        <div>
          <Label>{locale === "ar" ? "جدولة الكود" : "Coupon Schedule"}</Label>
          <div className="mt-2 flex flex-wrap gap-4 text-sm">
            <label className="inline-flex items-center gap-2">
              <input
                type="radio"
                checked={form.scheduleMode === "duration"}
                onChange={() => updateField("scheduleMode", "duration")}
              />
              {locale === "ar" ? "مدة نسبية" : "Relative duration"}
            </label>
            <label className="inline-flex items-center gap-2">
              <input
                type="radio"
                checked={form.scheduleMode === "specific"}
                onChange={() => updateField("scheduleMode", "specific")}
              />
              {locale === "ar" ? "تواريخ محددة" : "Specific dates"}
            </label>
          </div>
        </div>

        {form.scheduleMode === "duration" ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>{locale === "ar" ? "المدة" : "Duration"}</Label>
              <Input
                type="number"
                min="1"
                value={form.durationAmount}
                onChange={(e) => updateField("durationAmount", e.target.value)}
                className="mt-1.5"
              />
            </div>
            <div>
              <Label>{locale === "ar" ? "الوحدة" : "Unit"}</Label>
              <Select
                value={form.durationUnit}
                onChange={(e) => updateField("durationUnit", e.target.value)}
                className="mt-1.5"
              >
                {DURATION_UNITS.map((unit) => (
                  <option key={unit.value} value={unit.value}>
                    {locale === "ar" ? unit.ar : unit.en}
                  </option>
                ))}
              </Select>
            </div>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>{locale === "ar" ? "تاريخ البداية" : "Start Date"}</Label>
              <Input
                type="datetime-local"
                value={form.startDate}
                onChange={(e) => updateField("startDate", e.target.value)}
                required
                className="mt-1.5"
              />
            </div>
            <div>
              <Label>{locale === "ar" ? "تاريخ الانتهاء" : "Expiration Date"}</Label>
              <Input
                type="datetime-local"
                value={form.endDate}
                onChange={(e) => updateField("endDate", e.target.value)}
                required
                className="mt-1.5"
              />
            </div>
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label>{locale === "ar" ? "الحد الأقصى للاستخدام" : "Maximum Global Uses"}</Label>
            <Input
              type="number"
              min="1"
              value={form.usageLimit}
              onChange={(e) => updateField("usageLimit", e.target.value)}
              placeholder={locale === "ar" ? "مثال: 100" : "e.g. 100"}
              className="mt-1.5"
            />
          </div>
          <div>
            <Label>{locale === "ar" ? "الحد لكل عميل" : "Maximum Uses Per Customer"}</Label>
            <Input
              type="number"
              min="1"
              value={form.perCustomerUsageLimit}
              onChange={(e) => updateField("perCustomerUsageLimit", e.target.value)}
              className="mt-1.5"
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label>{locale === "ar" ? "الحد الأدنى للطلب" : "Minimum Order Amount"}</Label>
            <Input
              type="number"
              min="0"
              step="0.01"
              value={form.minimumOrderAmount}
              onChange={(e) => updateField("minimumOrderAmount", e.target.value)}
              className="mt-1.5"
            />
          </div>
          {Number(form.type) === COUPON_TYPE.PERCENTAGE ? (
            <div>
              <Label>{locale === "ar" ? "الحد الأقصى للخصم" : "Maximum Discount"}</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={form.maximumDiscountAmount}
                onChange={(e) => updateField("maximumDiscountAmount", e.target.value)}
                className="mt-1.5"
              />
            </div>
          ) : null}
        </div>

        <div>
          <Label>{locale === "ar" ? "الحالة" : "Status"}</Label>
          <Select
            value={form.isActive ? "active" : "inactive"}
            onChange={(e) => updateField("isActive", e.target.value === "active")}
            className="mt-1.5"
          >
            <option value="active">{locale === "ar" ? "نشط" : "Active"}</option>
            <option value="inactive">{locale === "ar" ? "غير نشط" : "Inactive"}</option>
          </Select>
        </div>

        <div>
          <Label>{locale === "ar" ? "ملاحظة داخلية" : "Description (internal)"}</Label>
          <Textarea
            rows={3}
            value={form.description}
            onChange={(e) => updateField("description", e.target.value)}
            className="mt-1.5"
          />
        </div>

        <div className="flex justify-end gap-3 border-t border-brand-border pt-4">
          <Button type="button" variant="outline" onClick={onClose}>
            {locale === "ar" ? "إلغاء" : "Cancel"}
          </Button>
          <Button type="submit" variant="accent" loading={loading}>
            {isEdit ? (locale === "ar" ? "حفظ" : "Save") : locale === "ar" ? "إنشاء" : "Create"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
