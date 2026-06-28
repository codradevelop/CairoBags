import { useMemo } from "react";
import { computeCouponStatus } from "../constants/couponHelpers.js";

export function useComputedCouponStatus(coupon) {
  return useMemo(
    () => computeCouponStatus(coupon),
    [
      coupon,
      coupon?.isActive,
      coupon?.IsActive,
      coupon?.usageLimit,
      coupon?.UsageLimit,
      coupon?.usageCount,
      coupon?.UsageCount,
      coupon?.startDate,
      coupon?.StartDate,
      coupon?.endDate,
      coupon?.EndDate,
      coupon?.expirationDate,
      coupon?.ExpirationDate,
    ]
  );
}
