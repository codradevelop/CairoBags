import { useCallback, useState } from "react";
import { ReviewFormModal } from "../reviews/ReviewFormModal.jsx";
import { OrderReviewButton } from "./OrderReviewButton.jsx";
import { useReviewFormSubmit } from "../../hooks/useReviewFormSubmit.js";
import { getOrderItemName } from "../../utils/orderHelpers.js";

export function useOrderReviewModal({ orderId, onReviewSaved }) {
  const [open, setOpen] = useState(false);
  const [target, setTarget] = useState(null);
  const { submitReview, loading, error, setError } = useReviewFormSubmit();

  const openForItem = useCallback((item) => {
    const productId = item?.productId ?? item?.ProductId;
    const hasReviewed = Boolean(item?.hasReviewed ?? item?.HasReviewed);
    const reviewId = item?.reviewId ?? item?.ReviewId;
    setTarget({
      productId,
      item,
      initialValues: hasReviewed
        ? {
            id: reviewId,
            rating: Number(item?.reviewRating ?? item?.ReviewRating ?? 0),
            title: item?.reviewTitle ?? item?.ReviewTitle ?? "",
            comment: item?.reviewComment ?? item?.ReviewComment ?? "",
          }
        : null,
    });
    setError(null);
    setOpen(true);
  }, [setError]);

  const handleClose = useCallback(() => {
    setOpen(false);
    setTarget(null);
    setError(null);
  }, [setError]);

  const handleSubmit = useCallback(
    async (values) => {
      if (!target?.productId) return;
      const review = await submitReview({
        productId: target.productId,
        orderId: Number(orderId),
        editingReview: target.initialValues,
        ...values,
      });
      handleClose();
      onReviewSaved?.(target.productId, review);
    },
    [handleClose, onReviewSaved, orderId, submitReview, target]
  );

  return {
    openForItem,
    modal: (
      <ReviewFormModal
        open={open}
        onClose={handleClose}
        initialValues={target?.initialValues}
        onSubmit={handleSubmit}
        loading={loading}
        error={error}
      />
    ),
  };
}

export function OrderItemReviewAction({ item, locale, onOpen }) {
  const hasReviewed = Boolean(item?.hasReviewed ?? item?.HasReviewed);
  return (
    <div className="mt-2">
      <OrderReviewButton hasReviewed={hasReviewed} onClick={() => onOpen(item)} />
    </div>
  );
}

export function OrderReviewableList({ items, locale, orderId, onReviewSaved }) {
  const { openForItem, modal } = useOrderReviewModal({ orderId, onReviewSaved });

  if (!items?.length) return null;

  return (
    <>
      <div className="mt-3 flex flex-wrap gap-2 border-t border-brand-border/60 pt-3">
        {items.map((item) => (
          <div key={item.productId ?? item.ProductId} className="min-w-0">
            <p className="mb-1 truncate text-xs text-brand-muted">
              {getOrderItemName(item, locale)}
            </p>
            <OrderReviewButton
              hasReviewed={Boolean(item?.hasReviewed ?? item?.HasReviewed)}
              onClick={() => openForItem(item)}
            />
          </div>
        ))}
      </div>
      {modal}
    </>
  );
}
