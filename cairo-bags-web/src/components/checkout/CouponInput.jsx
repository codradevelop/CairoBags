import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocale } from "../layout/LanguageSwitcher.jsx";
import { useToast } from "../ui/Toast.jsx";
import { STORE_EVENTS } from "../../constants/storeEvents.js";
import { useStoreSync } from "../../hooks/useStoreSync.js";
import { Button } from "../ui/Button.jsx";
import { Input } from "../ui/Input.jsx";
import { cn } from "../../utils/cn.js";
import * as couponService from "../../services/couponService.js";
import { getCouponErrorMessage } from "../../constants/couponHelpers.js";
import { formatPrice } from "../../utils/productHelpers.js";

export function CouponInput({
  shippingAddressId,
  appliedCoupon,
  onApplied,
  onRemoved,
  className,
}) {
  const { locale } = useLocale();
  const { info } = useToast();
  const [draft, setDraft] = useState("");
  const [expanded, setExpanded] = useState(Boolean(appliedCoupon));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const appliedRef = useRef(appliedCoupon);
  appliedRef.current = appliedCoupon;

  useStoreSync(
    [STORE_EVENTS.CouponUpdated, STORE_EVENTS.CouponDeleted],
    (payload) => {
      const applied = appliedRef.current;
      if (!applied) return;
      const appliedCode = (applied.code ?? applied.Code ?? "").trim().toUpperCase();
      const eventCode = (payload?.code ?? payload?.Code ?? "").trim().toUpperCase();
      if (!appliedCode || appliedCode !== eventCode) return;
      if (payload?.isActive === false || payload?.IsActive === false) {
        onRemoved?.();
        setError(
          locale === "ar" ? "لم يعد هذا الكود متاحاً." : "This coupon is no longer available."
        );
      }
    }
  );

  async function applyCoupon() {
    const code = draft.trim().toUpperCase();
    if (!code || loading) return;

    const appliedCode = (appliedCoupon?.code ?? appliedCoupon?.Code ?? "").trim().toUpperCase();
    if (appliedCode && appliedCode === code) {
      info(locale === "ar" ? "تم تطبيق هذا الكود مسبقاً." : "This coupon is already applied.");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const result = await couponService.validateCoupon({
        couponCode: code,
        shippingAddressId: shippingAddressId ?? undefined,
      });
      onApplied?.(result);
      setExpanded(true);
    } catch (err) {
      const codeKey = err.code ?? err.errorCode;
      setError(getCouponErrorMessage(codeKey, locale, err.message));
      onRemoved?.();
    } finally {
      setLoading(false);
    }
  }

  function removeCoupon() {
    setDraft("");
    setError("");
    onRemoved?.();
  }

  return (
    <div className={cn("rounded-xl border border-brand-border bg-brand-surface p-4", className)}>
      {!expanded && !appliedCoupon ? (
        <button
          type="button"
          className="flex w-full items-center justify-between text-sm font-medium text-brand-text"
          onClick={() => setExpanded(true)}
        >
          <span>{locale === "ar" ? "هل لديك كود خصم؟" : "Have a Coupon?"}</span>
          <span className="text-brand-accent">{locale === "ar" ? "إضافة" : "Add"}</span>
        </button>
      ) : (
        <div className="space-y-3">
          <p className="text-sm font-medium text-brand-text">
            {locale === "ar" ? "كود الخصم" : "Coupon Code"}
          </p>

          {!appliedCoupon ? (
            <div className="flex gap-2">
              <Input
                value={draft}
                onChange={(e) => setDraft(e.target.value.toUpperCase())}
                placeholder={locale === "ar" ? "أدخل الكود" : "Enter code"}
                aria-label={locale === "ar" ? "كود الخصم" : "Coupon code"}
                className="flex-1 uppercase"
              />
              <Button type="button" variant="accent" onClick={applyCoupon} loading={loading} disabled={!draft.trim()}>
                {locale === "ar" ? "تطبيق" : "Apply"}
              </Button>
            </div>
          ) : null}

          <AnimatePresence mode="wait">
            {appliedCoupon ? (
              <motion.div
                key="applied"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="rounded-xl border border-brand-accent/25 bg-gradient-to-br from-brand-accent/10 to-brand-surface p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-accent">
                      {locale === "ar" ? "تم تطبيق الكود بنجاح" : "Coupon Applied Successfully"}
                    </p>
                    <p className="mt-2 font-display text-2xl font-medium text-brand-text">
                      {appliedCoupon.code ?? appliedCoupon.Code}
                    </p>
                    <p className="mt-1 text-sm text-brand-muted">
                      {appliedCoupon.discountLabel ?? appliedCoupon.DiscountLabel}
                    </p>
                  </div>
                  <Button type="button" variant="outline" size="sm" onClick={removeCoupon}>
                    {locale === "ar" ? "إزالة" : "Remove"}
                  </Button>
                </div>
                <div className="mt-4 border-t border-brand-accent/15 pt-3">
                  <p className="text-sm text-brand-muted">
                    {locale === "ar" ? "وفرت:" : "You Saved:"}
                  </p>
                  <p className="font-display text-xl font-medium text-brand-accent">
                    {formatPrice(appliedCoupon.discountAmount ?? appliedCoupon.DiscountAmount ?? 0, locale)}
                  </p>
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>

          {error ? <p className="text-sm text-red-600" role="alert">{error}</p> : null}
        </div>
      )}
    </div>
  );
}
