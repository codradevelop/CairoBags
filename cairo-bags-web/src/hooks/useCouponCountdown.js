import { useEffect, useMemo, useState } from "react";
import { getCouponCountdownSnapshot } from "../constants/couponHelpers.js";

export function useCouponCountdown(coupon, status) {
  const [now, setNow] = useState(() => new Date());

  const snapshot = useMemo(
    () => getCouponCountdownSnapshot(coupon, status, now),
    [coupon, status, now]
  );

  useEffect(() => {
    if (!snapshot) return undefined;

    const intervalMs = snapshot.kind === "expired_ago" ? 3600000 : 60000;
    const interval = setInterval(() => setNow(new Date()), intervalMs);
    return () => clearInterval(interval);
  }, [snapshot?.kind]);

  return snapshot;
}
