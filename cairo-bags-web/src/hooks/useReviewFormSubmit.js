import { useCallback, useState } from "react";
import { useLocale } from "../components/layout/LanguageSwitcher.jsx";
import { useToast } from "../components/ui/Toast.jsx";
import { useProductRatings } from "../context/ProductRatingContext.jsx";
import * as reviewService from "../services/reviewService.js";
import { normalizeReview, normalizeReviewSummary, getReviewSubmitError, getReviewSubmitErrorMessage } from "../utils/reviewHelpers.js";
import { publishReviewChange } from "../utils/reviewEvents.js";

export function useReviewFormSubmit() {
  const { locale } = useLocale();
  const { success, error: toastError } = useToast();
  const { setProductRating } = useProductRatings();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const refreshProductStats = useCallback(
    async (productId) => {
      const summary = normalizeReviewSummary(await reviewService.getProductReviewSummary(productId));
      setProductRating(productId, summary);
      publishReviewChange({ productId, stats: summary, action: "stats" });
      return summary;
    },
    [setProductRating]
  );

  const submitReview = useCallback(
    async ({ productId, orderId, editingReview, rating, title, comment }) => {
      setLoading(true);
      setError(null);
      try {
        let review;
        if (editingReview?.id) {
          review = await reviewService.updateReview(editingReview.id, { rating, title, comment });
          success(locale === "ar" ? "تم تحديث التقييم" : "Review updated");
        } else {
          review = await reviewService.createReview(productId, {
            rating,
            title,
            comment,
            orderId: orderId ?? undefined,
          });
          success(locale === "ar" ? "شكراً على تقييمك" : "Thank you for your review");
        }
        const normalized = normalizeReview(review);
        await refreshProductStats(productId);
        publishReviewChange({
          productId,
          action: editingReview?.id ? "updated" : "created",
          review: normalized,
        });
        return normalized;
      } catch (err) {
        const reviewError = getReviewSubmitError(err, locale);
        setError(reviewError);
        toastError(getReviewSubmitErrorMessage(err, locale));
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [locale, refreshProductStats, success, toastError]
  );

  return { submitReview, loading, error, setError, refreshProductStats };
}
