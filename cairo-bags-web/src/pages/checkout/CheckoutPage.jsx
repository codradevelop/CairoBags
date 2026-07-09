import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { StoreLayout } from "../../layouts/StoreLayout.jsx";
import { usePageTitle } from "../../hooks/usePageTitle.js";
import { useLocale } from "../../components/layout/LanguageSwitcher.jsx";
import { useCart } from "../../context/CartContext.jsx";
import { useToast } from "../../components/ui/Toast.jsx";
import * as checkoutService from "../../services/checkoutService.js";
import * as couponService from "../../services/couponService.js";
import * as governorateService from "../../services/governorateService.js";
import {
  ShippingAddressSelector,
  PaymentMethodSelector,
  CouponInput,
  OrderSummary,
  CheckoutReview,
} from "../../components/checkout/index.js";
import { EmptyCart } from "../../components/cart/index.js";
import { PAYMENT_METHOD } from "../../constants/paymentMethods.js";
import { isWalletPaymentMethod } from "../../constants/paymentMethodOptions.js";
import { getCouponErrorMessage } from "../../constants/couponHelpers.js";
import { formatCheckoutResponse } from "../../utils/cartHelpers.js";
import { getCartItems } from "../../utils/cartHelpers.js";
import {
  buildCheckoutTotals,
  findGovernorateByName,
  getShippingErrorMessage,
  resolveShippingFee,
} from "../../utils/shippingHelpers.js";
import { Button, Label, Textarea } from "../../components/ui/index.js";

export function CheckoutPage() {
  const { locale } = useLocale();
  const { cart, itemsCount, refreshCart, subTotal: cartSubTotal } = useCart();
  const { success, error: toastError } = useToast();
  const navigate = useNavigate();
  const items = getCartItems(cart);

  const [shippingAddressId, setShippingAddressId] = useState(null);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [governorates, setGovernorates] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState(PAYMENT_METHOD.CASH_ON_DELIVERY);
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [governorateError, setGovernorateError] = useState("");

  usePageTitle(locale === "ar" ? "إتمام الشراء" : "Checkout");

  useEffect(() => {
    governorateService.getGovernorates().then(setGovernorates).catch(() => setGovernorates([]));
  }, []);

  function handleAddressChange(id, address) {
    setShippingAddressId(id);
    setSelectedAddress(address);
    setGovernorateError("");
  }

  useEffect(() => {
    const code = appliedCoupon?.code ?? appliedCoupon?.Code;
    if (!code) return;

    couponService
      .validateCoupon({
        couponCode: code,
        shippingAddressId: shippingAddressId ?? undefined,
      })
      .then((result) => setAppliedCoupon(result))
      .catch(() => setAppliedCoupon(null));
  }, [shippingAddressId]);

  const selectedGovernorate = selectedAddress?.governorate ?? selectedAddress?.Governorate ?? "";
  const hasValidGovernorate = Boolean(findGovernorateByName(governorates, selectedGovernorate));

  const summary = useMemo(() => {
    if (appliedCoupon) {
      const couponSubTotal = appliedCoupon.subTotal ?? appliedCoupon.SubTotal ?? cartSubTotal;
      const discountAmount = appliedCoupon.discountAmount ?? appliedCoupon.DiscountAmount ?? 0;
      const couponShipping = appliedCoupon.shippingFee ?? appliedCoupon.ShippingFee;
      const couponTotal = appliedCoupon.totalAmount ?? appliedCoupon.TotalAmount;

      if (couponShipping != null && couponTotal != null) {
        return {
          subTotal: couponSubTotal,
          discountAmount,
          shippingFee: couponShipping,
          totalAmount: couponTotal,
        };
      }
    }

    const localShipping = resolveShippingFee({
      governorates,
      governorateName: selectedGovernorate,
      appliedCoupon,
    });

    return buildCheckoutTotals({
      subTotal: cartSubTotal,
      discountAmount: appliedCoupon?.discountAmount ?? appliedCoupon?.DiscountAmount ?? 0,
      shippingFee: localShipping,
    });
  }, [appliedCoupon, cartSubTotal, governorates, selectedGovernorate]);

  const canPlaceOrder =
    Boolean(shippingAddressId) &&
    items.length > 0 &&
    hasValidGovernorate &&
    summary.shippingFee != null;

  async function handlePlaceOrder() {
    if (!shippingAddressId) {
      toastError(locale === "ar" ? "اختر عنوان الشحن" : "Please select a shipping address");
      return;
    }
    if (!hasValidGovernorate) {
      const message = getShippingErrorMessage("governorate_required", locale);
      setGovernorateError(message);
      toastError(message);
      return;
    }
    if (items.length === 0) {
      toastError(locale === "ar" ? "السلة فارغة" : "Your cart is empty");
      return;
    }

    setSubmitting(true);
    try {
      const response = await checkoutService.checkout({
        shippingAddressId,
        paymentMethod,
        couponCode: appliedCoupon?.code ?? appliedCoupon?.Code ?? undefined,
        notes: notes.trim() || undefined,
      });
      const result = formatCheckoutResponse(response);
      await refreshCart();
      success(locale === "ar" ? "تم إنشاء الطلب" : "Order placed successfully");

      if (isWalletPaymentMethod(paymentMethod)) {
        navigate(`/checkout/payment/${result.orderId}`, { state: { checkout: result } });
      } else {
        navigate("/checkout/success", { state: { checkout: result } });
      }
    } catch (err) {
      const codeKey = err.code ?? err.errorCode;
      const shippingMessage = getShippingErrorMessage(codeKey, locale);
      const message =
        codeKey === "shipping_unavailable" || codeKey === "governorate_invalid"
          ? shippingMessage
          : getCouponErrorMessage(codeKey, locale, err.message || (locale === "ar" ? "فشل الطلب" : "Checkout failed"));
      toastError(message);
    } finally {
      setSubmitting(false);
    }
  }

  if (items.length === 0) {
    return (
      <StoreLayout>
        <EmptyCart />
        <div className="mt-6 text-center">
          <Link to="/shop">
            <Button variant="accent">{locale === "ar" ? "تسوق الآن" : "Shop Now"}</Button>
          </Link>
        </div>
      </StoreLayout>
    );
  }

  return (
    <StoreLayout contentClassName="!py-6 md:!py-10">
      <h1 className="mb-8 font-display text-3xl font-medium text-brand-text md:text-4xl">
        {locale === "ar" ? "إتمام الشراء" : "Checkout"}
      </h1>

      <div className="grid gap-8 lg:grid-cols-[1fr_22rem]">
        <div className="space-y-8">
          <ShippingAddressSelector value={shippingAddressId} onChange={handleAddressChange} />
          <PaymentMethodSelector value={paymentMethod} onChange={setPaymentMethod} />
          <CouponInput
            shippingAddressId={shippingAddressId}
            appliedCoupon={appliedCoupon}
            onApplied={setAppliedCoupon}
            onRemoved={() => setAppliedCoupon(null)}
          />

          <div>
            <Label htmlFor="order-notes">
              {locale === "ar" ? "ملاحظات الطلب" : "Order notes"}
            </Label>
            <Textarea
              id="order-notes"
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={
                locale === "ar" ? "تعليمات التوصيل (اختياري)" : "Delivery instructions (optional)"
              }
              className="mt-1.5"
            />
          </div>

          <CheckoutReview
            shippingAddress={selectedAddress}
            paymentMethod={paymentMethod}
            couponCode={appliedCoupon?.code ?? appliedCoupon?.Code ?? ""}
            notes={notes}
          />
        </div>

        <div className="space-y-4 lg:sticky lg:top-28 lg:self-start">
          <OrderSummary
            showEstimateNote={summary.shippingFee == null}
            subTotal={summary.subTotal}
            discountAmount={summary.discountAmount}
            shippingFee={summary.shippingFee}
            totalAmount={summary.totalAmount}
            couponCode={appliedCoupon?.code ?? appliedCoupon?.Code}
          />
          {governorateError || (shippingAddressId && !hasValidGovernorate) ? (
            <p className="text-sm text-red-700">
              {governorateError ||
                getShippingErrorMessage(
                  selectedGovernorate ? "shipping_unavailable" : "governorate_required",
                  locale
                )}
            </p>
          ) : null}
          <Button
            type="button"
            variant="accent"
            size="lg"
            className="w-full"
            loading={submitting}
            onClick={handlePlaceOrder}
            disabled={!canPlaceOrder}
          >
            {locale === "ar" ? "تأكيد الطلب" : "Place Order"}
          </Button>
          <p className="text-center text-xs text-brand-muted">
            {locale === "ar"
              ? `${itemsCount} منتج في السلة`
              : `${itemsCount} item${itemsCount === 1 ? "" : "s"} in bag`}
          </p>
        </div>
      </div>
    </StoreLayout>
  );
}
