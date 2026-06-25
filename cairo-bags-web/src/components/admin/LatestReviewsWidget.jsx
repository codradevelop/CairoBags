import { memo, useCallback, useEffect, useState } from "react";
import { useLocale } from "../layout/LanguageSwitcher.jsx";
import { Card, CardBody, CardHeader, Skeleton } from "../ui/index.js";
import { LatestReviewRow } from "./LatestReviewRow.jsx";
import * as reviewService from "../../services/reviewService.js";
import { subscribeReviewChange } from "../../utils/reviewEvents.js";

function normalizeLatestReview(data) {
  if (!data) return null;
  return {
    id: data.id ?? data.Id,
    productId: data.productId ?? data.ProductId,
    productName: data.productName ?? data.ProductName ?? "",
    customerName: data.customerName ?? data.CustomerName ?? "Customer",
    rating: Number(data.rating ?? data.Rating ?? 0),
    title: data.title ?? data.Title ?? "",
    isVerifiedPurchase: Boolean(data.isVerifiedPurchase ?? data.IsVerifiedPurchase),
    createdAt: data.createdAt ?? data.CreatedAt,
  };
}

export const LatestReviewsWidget = memo(function LatestReviewsWidget({ className }) {
  const { locale } = useLocale();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadReviews = useCallback(async () => {
    setLoading(true);
    try {
      const data = await reviewService.getAdminLatestReviews(5);
      setReviews((Array.isArray(data) ? data : []).map(normalizeLatestReview).filter(Boolean));
    } catch {
      setReviews([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadReviews();
    return subscribeReviewChange(() => {
      loadReviews();
    });
  }, [loadReviews]);

  return (
    <Card variant="default" padding="md" className={className}>
      <CardHeader title={locale === "ar" ? "أحدث التقييمات" : "Latest Reviews"} />
      <CardBody className="space-y-3">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)
        ) : reviews.length === 0 ? (
          <div className="rounded-xl border border-dashed border-brand-border px-6 py-10 text-center">
            <p className="font-display text-lg text-brand-text">
              {locale === "ar" ? "لا توجد تقييمات بعد" : "No reviews yet"}
            </p>
            <p className="mt-1 text-sm text-brand-muted">
              {locale === "ar"
                ? "ستظهر تقييمات العملاء هنا."
                : "Customer reviews will appear here."}
            </p>
          </div>
        ) : (
          reviews.map((review) => <LatestReviewRow key={review.id} review={review} />)
        )}
      </CardBody>
    </Card>
  );
});
