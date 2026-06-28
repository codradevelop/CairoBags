export const COUPON_TYPE = {
  PERCENTAGE: 1,
  FIXED_AMOUNT: 2,
  FREE_SHIPPING: 3,
};

export const COUPON_ERROR_MESSAGES = {
  en: {
    coupon_invalid: "Coupon does not exist.",
    coupon_inactive: "This coupon is currently unavailable.",
    coupon_not_started: "This coupon is not active yet.",
    coupon_expired: "This coupon has expired.",
    coupon_usage_limit: "This coupon has reached its maximum usage limit.",
    coupon_user_limit: "You have already used this coupon.",
    coupon_scope_invalid: "Coupon is not valid for this order.",
    coupon_minimum_not_met: "Minimum order amount not reached.",
  },
  ar: {
    coupon_invalid: "كود الخصم غير موجود.",
    coupon_inactive: "هذا الكود غير متاح حالياً.",
    coupon_not_started: "هذا الكود لم يُفعّل بعد.",
    coupon_expired: "انتهت صلاحية هذا الكود.",
    coupon_usage_limit: "وصل هذا الكود للحد الأقصى للاستخدام.",
    coupon_user_limit: "لقد استخدمت هذا الكود من قبل.",
    coupon_scope_invalid: "الكود غير صالح لهذا الطلب.",
    coupon_minimum_not_met: "لم يتم الوصول للحد الأدنى للطلب.",
  },
};

export function getCouponErrorMessage(code, locale = "en", fallback) {
  const map = locale === "ar" ? COUPON_ERROR_MESSAGES.ar : COUPON_ERROR_MESSAGES.en;
  return map[code] || fallback || map.coupon_invalid;
}

export function formatCouponDiscount(coupon, locale = "en") {
  const type = coupon?.type ?? coupon?.Type;
  const value = coupon?.value ?? coupon?.Value ?? 0;
  if (type === COUPON_TYPE.PERCENTAGE) return `${value}%`;
  if (type === COUPON_TYPE.FIXED_AMOUNT) return locale === "ar" ? `${value} جنيه` : `${value} EGP`;
  return locale === "ar" ? "شحن مجاني" : "Free Shipping";
}

export const COUPON_COMPUTED_STATUS = {
  INACTIVE: "Inactive",
  MAX_USES: "Maximum Uses Reached",
  SCHEDULED: "Scheduled",
  EXPIRED: "Expired",
  ACTIVE: "Active",
  DRAFT: "Draft",
};

export function computeCouponStatus(coupon, now = new Date()) {
  if (!coupon) return COUPON_COMPUTED_STATUS.INACTIVE;

  const isActive = coupon.isActive ?? coupon.IsActive;
  if (!isActive) return COUPON_COMPUTED_STATUS.INACTIVE;

  const usageLimit = coupon.usageLimit ?? coupon.UsageLimit;
  const usageCount = coupon.usageCount ?? coupon.UsageCount ?? 0;
  if (usageLimit != null && usageCount >= usageLimit) {
    return COUPON_COMPUTED_STATUS.MAX_USES;
  }

  const startDate = coupon.startDate ?? coupon.StartDate;
  if (startDate && now < new Date(startDate)) {
    return COUPON_COMPUTED_STATUS.SCHEDULED;
  }

  const expirationDate =
    coupon.endDate ?? coupon.EndDate ?? coupon.expirationDate ?? coupon.ExpirationDate;
  if (expirationDate && now > new Date(expirationDate)) {
    return COUPON_COMPUTED_STATUS.EXPIRED;
  }

  return COUPON_COMPUTED_STATUS.ACTIVE;
}

export function matchesCouponStatusFilter(coupon, filterKey, now = new Date()) {
  if (!filterKey) return true;

  const status = computeCouponStatus(coupon, now);
  switch (filterKey.toLowerCase()) {
    case "active":
      return status === COUPON_COMPUTED_STATUS.ACTIVE;
    case "inactive":
      return status === COUPON_COMPUTED_STATUS.INACTIVE;
    case "expired":
      return status === COUPON_COMPUTED_STATUS.EXPIRED;
    case "scheduled":
      return status === COUPON_COMPUTED_STATUS.SCHEDULED;
    case "maximum_uses_reached":
    case "max_uses":
      return status === COUPON_COMPUTED_STATUS.MAX_USES;
    case "draft":
      return status === COUPON_COMPUTED_STATUS.DRAFT;
    default:
      return true;
  }
}

export function computeCouponStatsFromList(coupons, now = new Date()) {
  const list = Array.isArray(coupons) ? coupons : [];
  let activeCoupons = 0;
  let expiredCoupons = 0;
  let usedCoupons = 0;

  for (const coupon of list) {
    const status = computeCouponStatus(coupon, now);
    if (status === COUPON_COMPUTED_STATUS.ACTIVE) activeCoupons += 1;
    if (status === COUPON_COMPUTED_STATUS.EXPIRED) expiredCoupons += 1;
    if ((coupon.usageCount ?? coupon.UsageCount ?? 0) > 0) usedCoupons += 1;
  }

  const withLimit = list.filter((coupon) => {
    const limit = coupon.usageLimit ?? coupon.UsageLimit;
    return limit != null && limit > 0;
  });

  const usagePercent =
    withLimit.length === 0
      ? 0
      : Math.round(
          (withLimit.reduce((sum, coupon) => {
            const limit = coupon.usageLimit ?? coupon.UsageLimit;
            const count = coupon.usageCount ?? coupon.UsageCount ?? 0;
            return sum + (count / limit) * 100;
          }, 0) /
            withLimit.length) *
            10
        ) / 10;

  return {
    totalCoupons: list.length,
    activeCoupons,
    expiredCoupons,
    usedCoupons,
    usagePercent,
  };
}

export function getCouponStatusVariant(status) {
  switch (status) {
    case "Active":
      return "success";
    case "Scheduled":
      return "info";
    case "Expired":
    case "Maximum Uses Reached":
      return "warning";
    default:
      return "neutral";
  }
}

export function addDurationToDate(start, amount, unit) {
  const date = new Date(start);
  const value = Number(amount) || 0;
  switch (unit) {
    case "minutes":
      date.setMinutes(date.getMinutes() + value);
      break;
    case "hours":
      date.setHours(date.getHours() + value);
      break;
    case "days":
      date.setDate(date.getDate() + value);
      break;
    case "weeks":
      date.setDate(date.getDate() + value * 7);
      break;
    case "months":
      date.setMonth(date.getMonth() + value);
      break;
    default:
      break;
  }
  return date;
}

export function toIsoUtc(value) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return date.toISOString();
}

export function getCouponStartDate(coupon) {
  const value = coupon?.startDate ?? coupon?.StartDate;
  return value ? new Date(value) : null;
}

export function getCouponExpirationDate(coupon) {
  const value =
    coupon?.endDate ?? coupon?.EndDate ?? coupon?.expirationDate ?? coupon?.ExpirationDate;
  return value ? new Date(value) : null;
}

export function getTimeDifferenceParts(fromDate, toDate) {
  const from = fromDate instanceof Date ? fromDate : new Date(fromDate);
  const to = toDate instanceof Date ? toDate : new Date(toDate);
  const diffMs = Math.max(0, to.getTime() - from.getTime());
  const totalMinutes = Math.floor(diffMs / 60000);
  const days = Math.floor(totalMinutes / (24 * 60));
  const hours = Math.floor((totalMinutes % (24 * 60)) / 60);
  const minutes = totalMinutes % 60;

  return { days, hours, minutes, totalMs: diffMs };
}

export function getCouponCountdownSnapshot(coupon, status, now = new Date()) {
  if (!coupon) return null;

  const startDate = getCouponStartDate(coupon);
  const expirationDate = getCouponExpirationDate(coupon);

  if (status === COUPON_COMPUTED_STATUS.SCHEDULED && startDate) {
    return {
      kind: "starts_in",
      parts: getTimeDifferenceParts(now, startDate),
    };
  }

  if (status === COUPON_COMPUTED_STATUS.ACTIVE && expirationDate) {
    return {
      kind: "ends_in",
      parts: getTimeDifferenceParts(now, expirationDate),
    };
  }

  if (status === COUPON_COMPUTED_STATUS.EXPIRED && expirationDate) {
    return {
      kind: "expired_ago",
      parts: getTimeDifferenceParts(expirationDate, now),
    };
  }

  return null;
}
