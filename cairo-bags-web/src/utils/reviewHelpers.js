export const REVIEW_COMMENT_MAX = 2000;
export const REVIEW_TITLE_MAX = 200;

export function normalizeReviewSummary(data) {
  if (!data) {
    return {
      averageRating: 0,
      reviewCount: 0,
      verifiedReviewCount: 0,
      fiveStarCount: 0,
      fourStarCount: 0,
      threeStarCount: 0,
      twoStarCount: 0,
      oneStarCount: 0,
    };
  }

  return {
    averageRating: Number(data.averageRating ?? data.AverageRating ?? 0),
    reviewCount: Number(data.reviewCount ?? data.ReviewCount ?? 0),
    verifiedReviewCount: Number(data.verifiedReviewCount ?? data.VerifiedReviewCount ?? 0),
    fiveStarCount: Number(data.fiveStarCount ?? data.FiveStarCount ?? 0),
    fourStarCount: Number(data.fourStarCount ?? data.FourStarCount ?? 0),
    threeStarCount: Number(data.threeStarCount ?? data.ThreeStarCount ?? 0),
    twoStarCount: Number(data.twoStarCount ?? data.TwoStarCount ?? 0),
    oneStarCount: Number(data.oneStarCount ?? data.OneStarCount ?? 0),
  };
}

export function normalizeReview(data) {
  if (!data) return null;

  return {
    id: data.id ?? data.Id,
    productId: data.productId ?? data.ProductId,
    userId: data.userId ?? data.UserId ?? "",
    reviewerName: data.reviewerName ?? data.ReviewerName ?? "Customer",
    orderId: data.orderId ?? data.OrderId ?? null,
    rating: Number(data.rating ?? data.Rating ?? 0),
    title: data.title ?? data.Title ?? "",
    comment: data.comment ?? data.Comment ?? "",
    isVerifiedPurchase: Boolean(data.isVerifiedPurchase ?? data.IsVerifiedPurchase),
    isVisible: Boolean(data.isVisible ?? data.IsVisible ?? true),
    helpfulCount: Number(data.helpfulCount ?? data.HelpfulCount ?? 0),
    isHelpfulByCurrentUser: Boolean(data.isHelpfulByCurrentUser ?? data.IsHelpfulByCurrentUser),
    createdAt: data.createdAt ?? data.CreatedAt,
    updatedAt: data.updatedAt ?? data.UpdatedAt,
  };
}

export function normalizePagedReviews(data) {
  const items = (data?.items ?? data?.Items ?? []).map(normalizeReview).filter(Boolean);
  return {
    total: Number(data?.total ?? data?.Total ?? 0),
    page: Number(data?.page ?? data?.Page ?? 1),
    pageSize: Number(data?.pageSize ?? data?.PageSize ?? 10),
    items,
  };
}

export function getRatingDistribution(summary) {
  const total = summary?.reviewCount ?? 0;
  const rows = [
    { stars: 5, count: summary?.fiveStarCount ?? 0 },
    { stars: 4, count: summary?.fourStarCount ?? 0 },
    { stars: 3, count: summary?.threeStarCount ?? 0 },
    { stars: 2, count: summary?.twoStarCount ?? 0 },
    { stars: 1, count: summary?.oneStarCount ?? 0 },
  ];

  return rows.map((row) => ({
    ...row,
    percent: total > 0 ? Math.round((row.count / total) * 100) : 0,
  }));
}

export function formatReviewDate(value, locale = "en") {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-EG" : "en-GB", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}

export function getProductRatingStats(product) {
  return {
    averageRating: Number(product?.averageRating ?? product?.AverageRating ?? 0),
    reviewCount: Number(product?.reviewCount ?? product?.ReviewCount ?? 0),
    verifiedReviewCount: Number(product?.verifiedReviewCount ?? product?.VerifiedReviewCount ?? 0),
  };
}

export function pinUserReviewFirst(reviews, userId) {
  if (!userId || !reviews?.length) return reviews ?? [];
  const own = reviews.find((r) => r.userId === userId);
  if (!own) return reviews;
  return [own, ...reviews.filter((r) => r.userId !== userId)];
}
