import { useEffect, useState } from "react";
import { useLocale } from "../layout/LanguageSwitcher.jsx";
import { Modal } from "../ui/Modal.jsx";
import { Button } from "../ui/Button.jsx";
import { InteractiveStarRating } from "./StarRating.jsx";
import { REVIEW_COMMENT_MAX, REVIEW_TITLE_MAX } from "../../utils/reviewHelpers.js";
import { cn } from "../../utils/cn.js";

export function ReviewFormModal({
  open,
  onClose,
  onSubmit,
  initialValues,
  loading = false,
  error,
}) {
  const { locale } = useLocale();
  const isEdit = Boolean(initialValues?.id);
  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState("");
  const [comment, setComment] = useState("");

  useEffect(() => {
    if (!open) return;
    setRating(initialValues?.rating ?? 0);
    setTitle(initialValues?.title ?? "");
    setComment(initialValues?.comment ?? "");
  }, [open, initialValues]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    await onSubmit?.({ rating, title: title.trim(), comment: comment.trim() });
  };

  const titleChars = title.length;
  const commentChars = comment.length;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? (locale === "ar" ? "تعديل التقييم" : "Edit Review") : locale === "ar" ? "اكتب تقييمًا" : "Write a Review"}
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={loading}>
            {locale === "ar" ? "إلغاء" : "Cancel"}
          </Button>
          <Button
            onClick={handleSubmit}
            loading={loading}
            disabled={rating < 1 || !comment.trim()}
          >
            {isEdit ? (locale === "ar" ? "حفظ" : "Save") : locale === "ar" ? "نشر" : "Submit"}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <p className="mb-3 text-sm font-medium text-brand-text">
            {locale === "ar" ? "تقييمك" : "Your rating"}
          </p>
          <InteractiveStarRating
            value={rating}
            onChange={setRating}
            label={locale === "ar" ? "اختر التقييم" : "Select rating"}
          />
        </div>

        <div>
          <label htmlFor="review-title" className="mb-2 block text-sm font-medium text-brand-text">
            {locale === "ar" ? "العنوان" : "Title"}
          </label>
          <input
            id="review-title"
            type="text"
            value={title}
            maxLength={REVIEW_TITLE_MAX}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-lg border border-brand-border bg-brand-surface px-4 py-2.5 text-sm text-brand-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent"
            placeholder={locale === "ar" ? "عنوان مختصر" : "Short headline"}
          />
          <p className="mt-1 text-end text-xs text-brand-muted">
            {titleChars}/{REVIEW_TITLE_MAX}
          </p>
        </div>

        <div>
          <label htmlFor="review-comment" className="mb-2 block text-sm font-medium text-brand-text">
            {locale === "ar" ? "تعليقك" : "Your review"}
          </label>
          <textarea
            id="review-comment"
            value={comment}
            rows={5}
            maxLength={REVIEW_COMMENT_MAX}
            onChange={(e) => setComment(e.target.value)}
            required
            className="w-full resize-y rounded-lg border border-brand-border bg-brand-surface px-4 py-2.5 text-sm text-brand-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent"
            placeholder={locale === "ar" ? "شاركنا تجربتك مع هذا المنتج" : "Share your experience with this product"}
          />
          <p
            className={cn(
              "mt-1 text-end text-xs",
              commentChars >= REVIEW_COMMENT_MAX ? "text-red-600" : "text-brand-muted"
            )}
          >
            {commentChars}/{REVIEW_COMMENT_MAX}
          </p>
        </div>

        {error ? (
          <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
            {error}
          </p>
        ) : null}
      </form>
    </Modal>
  );
}
