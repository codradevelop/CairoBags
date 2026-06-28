import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLocale } from "../layout/LanguageSwitcher.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { useStoreReadOnly } from "../../hooks/useStoreReadOnly.js";
import { useToast } from "../ui/Toast.jsx";
import { Button } from "../ui/Button.jsx";
import { ConfirmModal } from "../ui/Modal.jsx";
import { EmptyState } from "../store/EmptyState.jsx";
import { ReviewSummaryPanel } from "./ReviewSummaryPanel.jsx";
import { ReviewCard } from "./ReviewCard.jsx";
import { ReviewFilters } from "./ReviewFilters.jsx";
import { ReviewFormModal } from "./ReviewFormModal.jsx";
import { ReviewEmptyState } from "./ReviewEmptyState.jsx";
import { ReviewListSkeleton, ReviewSummarySkeleton } from "./ReviewSkeleton.jsx";
import * as reviewService from "../../services/reviewService.js";
import { getReviewSubmitError, normalizeReviewSummary, pinUserReviewFirst } from "../../utils/reviewHelpers.js";
import { consumeReviewsHighlight, consumeReviewHighlight } from "../../utils/reviewScrollUtils.js";
import { subscribeReviewChange, publishReviewChange } from "../../utils/reviewEvents.js";
import { useProductRatings } from "../../context/ProductRatingContext.jsx";
import { getAccessToken, getUserIdFromToken } from "../../utils/index.js";
import { cn } from "../../utils/cn.js";

const PAGE_SIZE = 10;
const HIGHLIGHT_MS = 1000;
const ENTER_ANIMATION_MS = 600;

function getCurrentUserId(user) {
  return user?.id ?? user?.Id ?? getUserIdFromToken(getAccessToken()) ?? null;
}

function extractErrorMessage(error) {
  return (
    error?.message ??
    error?.response?.data?.message ??
    error?.response?.data?.title ??
    "Something went wrong"
  );
}

export function ReviewSection({ productId, onStatsChange, className }) {
  const { locale } = useLocale();
  const navigate = useNavigate();
  const { user, isAuthenticated, isCustomer, isAdmin } = useAuth();
  const readOnly = useStoreReadOnly();
  const { success, error: toastError } = useToast();

  const currentUserId = getCurrentUserId(user);

  const [summary, setSummary] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState("newest");
  const [rating, setRating] = useState(null);
  const [verifiedOnly, setVerifiedOnly] = useState(false);

  const [summaryLoading, setSummaryLoading] = useState(true);
  const [listLoading, setListLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [summaryHighlighted, setSummaryHighlighted] = useState(false);
  const [highlightedReviewId, setHighlightedReviewId] = useState(null);

  const { setProductRating } = useProductRatings();

  const [formOpen, setFormOpen] = useState(false);
  const [editingReview, setEditingReview] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState(null);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [adminDeleteTarget, setAdminDeleteTarget] = useState(null);
  const [adminDeleteLoading, setAdminDeleteLoading] = useState(false);

  const [helpfulLoadingId, setHelpfulLoadingId] = useState(null);
  const [removingIds, setRemovingIds] = useState(new Set());
  const [enteringIds, setEnteringIds] = useState(new Set());

  const triggerSummaryHighlight = useCallback(() => {
    setSummaryHighlighted(true);
    window.setTimeout(() => setSummaryHighlighted(false), HIGHLIGHT_MS);
  }, []);

  const refreshSummary = useCallback(async () => {
    const data = await reviewService.getProductReviewSummary(productId);
    const normalized = normalizeReviewSummary(data);
    setSummary(normalized);
    setProductRating(productId, normalized);
    onStatsChange?.(normalized);
    return normalized;
  }, [productId, onStatsChange, setProductRating]);

  const fetchReviews = useCallback(
    async (pageToLoad, append = false) => {
      const params = {
        page: pageToLoad,
        pageSize: PAGE_SIZE,
        sort,
        ...(rating ? { rating } : {}),
        ...(verifiedOnly ? { verifiedOnly: true } : {}),
      };

      const data = await reviewService.getProductReviews(productId, params);
      setTotal(data.total);
      setReviews((prev) => (append ? [...prev, ...data.items] : data.items));
      setPage(data.page);
      return data;
    },
    [productId, sort, rating, verifiedOnly]
  );

  const loadInitial = useCallback(async () => {
    setSummaryLoading(true);
    setListLoading(true);
    try {
      await Promise.all([refreshSummary(), fetchReviews(1, false)]);
    } catch (err) {
      toastError(extractErrorMessage(err));
    } finally {
      setSummaryLoading(false);
      setListLoading(false);
    }
  }, [refreshSummary, fetchReviews, toastError]);

  useEffect(() => {
    if (!productId) return;
    loadInitial();
  }, [productId, sort, rating, verifiedOnly]);

  useEffect(() => {
    if (summaryLoading) return;
    if (consumeReviewsHighlight()) {
      triggerSummaryHighlight();
    }
    const reviewId = consumeReviewHighlight();
    if (reviewId) {
      setHighlightedReviewId(reviewId);
      window.setTimeout(() => setHighlightedReviewId(null), 1000);
    }
  }, [summaryLoading, triggerSummaryHighlight]);

  useEffect(() => {
    return subscribeReviewChange((detail) => {
      if (Number(detail?.productId) === Number(productId)) {
        if (detail.stats) {
          setSummary(detail.stats);
          onStatsChange?.(detail.stats);
        } else {
          refreshSummary();
        }
      }
    });
  }, [productId, onStatsChange, refreshSummary]);

  const ownReview = useMemo(
    () => reviews.find((r) => currentUserId && r.userId === currentUserId) ?? null,
    [reviews, currentUserId]
  );

  const hasOwnReview = Boolean(ownReview);

  const displayedReviews = useMemo(
    () => pinUserReviewFirst(reviews, currentUserId),
    [reviews, currentUserId]
  );

  const canWriteReview = isAuthenticated && isCustomer && !readOnly && !hasOwnReview;
  const canEditReview = isAuthenticated && isCustomer && !readOnly && hasOwnReview;
  const canVoteHelpful = isAuthenticated && isCustomer && !readOnly;

  const canManageOwnReview = isCustomer && !readOnly;

  const hasMore = reviews.length < total;
  const hasReviews = (summary?.reviewCount ?? 0) > 0;

  const handleLoadMore = useCallback(async () => {
    setLoadingMore(true);
    try {
      await fetchReviews(page + 1, true);
    } catch (err) {
      toastError(extractErrorMessage(err));
    } finally {
      setLoadingMore(false);
    }
  }, [fetchReviews, page, toastError]);

  const handleClearFilters = useCallback(() => {
    setSort("newest");
    setRating(null);
    setVerifiedOnly(false);
  }, []);

  const requireLogin = useCallback(() => {
    navigate("/login", { state: { from: window.location.pathname + window.location.hash } });
  }, [navigate]);

  const handleWriteClick = useCallback(() => {
    if (!isAuthenticated) {
      requireLogin();
      return;
    }
    setEditingReview(null);
    setFormError(null);
    setFormOpen(true);
  }, [isAuthenticated, requireLogin]);

  const handleEditOwnClick = useCallback(() => {
    if (!ownReview) return;
    setEditingReview(ownReview);
    setFormError(null);
    setFormOpen(true);
  }, [ownReview]);

  const markReviewEntering = useCallback((reviewId) => {
    setEnteringIds((prev) => new Set(prev).add(reviewId));
    window.setTimeout(() => {
      setEnteringIds((prev) => {
        const next = new Set(prev);
        next.delete(reviewId);
        return next;
      });
    }, ENTER_ANIMATION_MS);
  }, []);

  const handleFormSubmit = useCallback(
    async ({ rating: nextRating, title, comment }) => {
      setFormLoading(true);
      setFormError(null);
      try {
        if (editingReview) {
          const updated = await reviewService.updateReview(editingReview.id, {
            rating: nextRating,
            title,
            comment,
          });
          setReviews((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
          success(locale === "ar" ? "تم تحديث التقييم" : "Review updated");
        } else {
          const created = await reviewService.createReview(productId, {
            rating: nextRating,
            title,
            comment,
          });
          setReviews((prev) => [created, ...prev.filter((r) => r.id !== created.id)]);
          markReviewEntering(created.id);
          success(locale === "ar" ? "شكراً على تقييمك" : "Thank you for your review");
        }
        setFormOpen(false);
        setEditingReview(null);
        const stats = await refreshSummary();
        publishReviewChange({
          productId,
          stats,
          action: editingReview ? "updated" : "created",
        });
      } catch (err) {
        setFormError(getReviewSubmitError(err, locale));
      } finally {
        setFormLoading(false);
      }
    },
    [editingReview, locale, markReviewEntering, productId, refreshSummary, success]
  );

  const animateRemoveReview = useCallback((reviewId) => {
    setRemovingIds((prev) => new Set(prev).add(reviewId));
    window.setTimeout(() => {
      setReviews((prev) => prev.filter((r) => r.id !== reviewId));
      setRemovingIds((prev) => {
        const next = new Set(prev);
        next.delete(reviewId);
        return next;
      });
    }, 280);
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    const targetId = deleteTarget.id;
    try {
      await reviewService.deleteReview(targetId);
      animateRemoveReview(targetId);
      setDeleteTarget(null);
      const stats = await refreshSummary();
      publishReviewChange({ productId, stats, action: "deleted" });
      success(locale === "ar" ? "تم حذف التقييم" : "Review deleted");
    } catch (err) {
      toastError(extractErrorMessage(err));
    } finally {
      setDeleteLoading(false);
    }
  }, [animateRemoveReview, deleteTarget, locale, refreshSummary, success, toastError]);

  const handleAdminDeleteConfirm = useCallback(async () => {
    if (!adminDeleteTarget) return;
    setAdminDeleteLoading(true);
    const targetId = adminDeleteTarget.id;
    try {
      await reviewService.adminDeleteReview(targetId);
      animateRemoveReview(targetId);
      setAdminDeleteTarget(null);
      const stats = await refreshSummary();
      publishReviewChange({ productId, stats, action: "deleted" });
      success(locale === "ar" ? "تم حذف التقييم" : "Review removed");
    } catch (err) {
      toastError(extractErrorMessage(err));
    } finally {
      setAdminDeleteLoading(false);
    }
  }, [adminDeleteTarget, animateRemoveReview, locale, refreshSummary, success, toastError]);

  const handleAdminToggleVisibility = useCallback(
    async (review) => {
      try {
        const updated = await reviewService.adminSetReviewVisibility(review.id, !review.isVisible);
        if (!updated.isVisible) {
          animateRemoveReview(review.id);
        } else {
          setReviews((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
        }
        const stats = await refreshSummary();
        publishReviewChange({ productId, stats, action: updated.isVisible ? "unhidden" : "hidden" });
        success(
          updated.isVisible
            ? locale === "ar"
              ? "تم إظهار التقييم"
              : "Review is now visible"
            : locale === "ar"
              ? "تم إخفاء التقييم"
              : "Review hidden"
        );
      } catch (err) {
        toastError(extractErrorMessage(err));
      }
    },
    [animateRemoveReview, locale, refreshSummary, success, toastError]
  );

  const handleToggleHelpful = useCallback(
    async (review) => {
      if (!isAuthenticated) {
        requireLogin();
        return;
      }
      if (!canVoteHelpful) return;

      const previous = { ...review };
      const optimistic = {
        ...review,
        isHelpfulByCurrentUser: !review.isHelpfulByCurrentUser,
        helpfulCount: review.isHelpfulByCurrentUser
          ? Math.max(0, review.helpfulCount - 1)
          : review.helpfulCount + 1,
      };
      setReviews((prev) => prev.map((r) => (r.id === review.id ? optimistic : r)));
      setHelpfulLoadingId(review.id);

      try {
        const result = review.isHelpfulByCurrentUser
          ? await reviewService.removeReviewHelpful(review.id)
          : await reviewService.markReviewHelpful(review.id);
        setReviews((prev) =>
          prev.map((r) =>
            r.id === review.id
              ? {
                  ...r,
                  helpfulCount: result.helpfulCount,
                  isHelpfulByCurrentUser: result.isHelpfulByCurrentUser,
                }
              : r
          )
        );
      } catch (err) {
        setReviews((prev) => prev.map((r) => (r.id === review.id ? previous : r)));
        toastError(extractErrorMessage(err));
      } finally {
        setHelpfulLoadingId(null);
      }
    },
    [canVoteHelpful, isAuthenticated, requireLogin, toastError]
  );

  const headerAction = canWriteReview ? (
    <Button type="button" variant="accent" size="lg" className="min-w-[10rem] shadow-sm" onClick={handleWriteClick}>
      {locale === "ar" ? "اكتب تقييمًا" : "Write a Review"}
    </Button>
  ) : canEditReview ? (
    <Button type="button" variant="accent" size="lg" className="min-w-[10rem] shadow-sm" onClick={handleEditOwnClick}>
      {locale === "ar" ? "عدّل تقييمك" : "Edit Your Review"}
    </Button>
  ) : null;

  return (
    <section
      id="reviews"
      className={cn("scroll-mt-24 border-t border-brand-border pt-10 md:pt-14 lg:pt-16", className)}
      aria-labelledby="reviews-heading"
    >
      <div className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2
            id="reviews-heading"
            className="font-display text-2xl font-medium text-brand-text md:text-3xl"
          >
            {locale === "ar" ? "التقييمات والمراجعات" : "Reviews & Ratings"}
          </h2>
          {hasReviews && summary ? (
            <p className="mt-1 text-sm text-brand-muted">
              {summary.reviewCount}{" "}
              {locale === "ar"
                ? summary.reviewCount === 1
                  ? "تقييم"
                  : "تقييمات"
                : summary.reviewCount === 1
                  ? "review"
                  : "reviews"}
            </p>
          ) : null}
        </div>
        {headerAction}
      </div>

      {summaryLoading ? <ReviewSummarySkeleton className="mb-6 md:mb-8" /> : null}
      {!summaryLoading && hasReviews && summary ? (
        <ReviewSummaryPanel summary={summary} highlighted={summaryHighlighted} className="mb-6 md:mb-8" />
      ) : null}

      {!summaryLoading && !hasReviews ? (
        <ReviewEmptyState
          className="mb-6 md:mb-8"
          showWriteButton={canWriteReview}
          onWriteReview={handleWriteClick}
        />
      ) : null}

      {hasReviews ? (
        <>
          <ReviewFilters
            sort={sort}
            rating={rating}
            verifiedOnly={verifiedOnly}
            onSortChange={setSort}
            onRatingChange={setRating}
            onVerifiedOnlyChange={setVerifiedOnly}
            onClear={handleClearFilters}
            className="mb-5 md:mb-6"
          />

          {listLoading ? (
            <ReviewListSkeleton count={3} />
          ) : reviews.length === 0 ? (
            <EmptyState
              title={locale === "ar" ? "لا توجد نتائج" : "No matching reviews"}
              description={
                locale === "ar" ? "جرّب تغيير الفلاتر." : "Try adjusting your filters."
              }
              action={
                <Button variant="ghost" onClick={handleClearFilters}>
                  {locale === "ar" ? "مسح الفلاتر" : "Clear Filters"}
                </Button>
              }
            />
          ) : (
            <div className="space-y-4 md:space-y-5">
              {displayedReviews.map((review) => (
                <div
                  key={review.id}
                  className={cn(
                    "transition-all duration-300",
                    removingIds.has(review.id) && "pointer-events-none scale-[0.98] opacity-0"
                  )}
                >
                  <ReviewCard
                    review={review}
                    currentUserId={currentUserId}
                    isAdmin={isAdmin}
                    canVoteHelpful={canVoteHelpful}
                    canManageOwn={canManageOwnReview}
                    helpfulLoading={helpfulLoadingId === review.id}
                    onDelete={setDeleteTarget}
                    onToggleHelpful={handleToggleHelpful}
                    onAdminDelete={setAdminDeleteTarget}
                    onAdminToggleVisibility={handleAdminToggleVisibility}
                    isEntering={enteringIds.has(review.id)}
                    isPinned={Boolean(currentUserId && review.userId === currentUserId)}
                    isHighlighted={highlightedReviewId === review.id}
                  />
                </div>
              ))}
            </div>
          )}

          {hasMore && !listLoading ? (
            <div className="mt-8 flex justify-center md:mt-10">
              <Button variant="outline" loading={loadingMore} onClick={handleLoadMore}>
                {locale === "ar" ? "تحميل المزيد" : "Load More"}
              </Button>
            </div>
          ) : null}
        </>
      ) : null}

      <ReviewFormModal
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          setEditingReview(null);
          setFormError(null);
        }}
        initialValues={editingReview}
        onSubmit={handleFormSubmit}
        loading={formLoading}
        error={formError}
      />

      <ConfirmModal
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        loading={deleteLoading}
        title={locale === "ar" ? "حذف التقييم؟" : "Delete review?"}
        message={
          locale === "ar"
            ? "سيتم حذف تقييمك نهائياً. لا يمكن التراجع عن هذا الإجراء."
            : "Your review will be permanently removed. This cannot be undone."
        }
        confirmLabel={locale === "ar" ? "حذف" : "Delete"}
        cancelLabel={locale === "ar" ? "إلغاء" : "Cancel"}
        variant="danger"
      />

      <ConfirmModal
        open={Boolean(adminDeleteTarget)}
        onClose={() => setAdminDeleteTarget(null)}
        onConfirm={handleAdminDeleteConfirm}
        loading={adminDeleteLoading}
        title={locale === "ar" ? "حذف التقييم (مشرف)؟" : "Delete review (admin)?"}
        message={
          locale === "ar"
            ? "سيتم حذف هذا التقييم نهائياً من المتجر."
            : "This review will be permanently removed from the store."
        }
        confirmLabel={locale === "ar" ? "حذف" : "Delete"}
        cancelLabel={locale === "ar" ? "إلغاء" : "Cancel"}
        variant="danger"
      />
    </section>
  );
}
