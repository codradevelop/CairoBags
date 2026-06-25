import axiosInstance from "../api/axios.js";
import { ENDPOINTS } from "../constants/endpoints.js";
import { handleServiceCall } from "../utils/index.js";
import {
  normalizePagedReviews,
  normalizeReview,
  normalizeReviewSummary,
} from "../utils/reviewHelpers.js";

export async function getProductReviews(productId, params = {}, config = {}) {
  return handleServiceCall(
    axiosInstance
      .get(ENDPOINTS.reviews.byProduct(productId), { params, ...config })
      .then(({ data }) => normalizePagedReviews(data))
  );
}

export async function getProductReviewSummary(productId, config = {}) {
  return handleServiceCall(
    axiosInstance
      .get(ENDPOINTS.reviews.summary(productId), config)
      .then(({ data }) => normalizeReviewSummary(data))
  );
}

export async function createReview(productId, payload) {
  return handleServiceCall(
    axiosInstance
      .post(ENDPOINTS.reviews.create(productId), payload)
      .then(({ data }) => normalizeReview(data))
  );
}

export async function updateReview(reviewId, payload) {
  return handleServiceCall(
    axiosInstance
      .put(ENDPOINTS.reviews.update(reviewId), payload)
      .then(({ data }) => normalizeReview(data))
  );
}

export async function deleteReview(reviewId) {
  return handleServiceCall(
    axiosInstance.delete(ENDPOINTS.reviews.delete(reviewId)).then(() => true)
  );
}

export async function markReviewHelpful(reviewId) {
  return handleServiceCall(
    axiosInstance
      .post(ENDPOINTS.reviews.helpful(reviewId))
      .then(({ data }) => ({
        reviewId: data?.reviewId ?? data?.ReviewId ?? reviewId,
        helpfulCount: Number(data?.helpfulCount ?? data?.HelpfulCount ?? 0),
        isHelpfulByCurrentUser: Boolean(data?.isHelpfulByCurrentUser ?? data?.IsHelpfulByCurrentUser),
      }))
  );
}

export async function removeReviewHelpful(reviewId) {
  return handleServiceCall(
    axiosInstance
      .delete(ENDPOINTS.reviews.helpful(reviewId))
      .then(({ data }) => ({
        reviewId: data?.reviewId ?? data?.ReviewId ?? reviewId,
        helpfulCount: Number(data?.helpfulCount ?? data?.HelpfulCount ?? 0),
        isHelpfulByCurrentUser: Boolean(data?.isHelpfulByCurrentUser ?? data?.IsHelpfulByCurrentUser),
      }))
  );
}

export async function adminDeleteReview(reviewId) {
  return handleServiceCall(
    axiosInstance.delete(ENDPOINTS.reviews.adminDelete(reviewId)).then(() => true)
  );
}

export async function adminSetReviewVisibility(reviewId, isVisible) {
  return handleServiceCall(
    axiosInstance
      .patch(ENDPOINTS.reviews.adminVisibility(reviewId), { isVisible })
      .then(({ data }) => normalizeReview(data))
  );
}

export async function getAdminLatestReviews(limit = 5, config = {}) {
  return handleServiceCall(
    axiosInstance
      .get(ENDPOINTS.reviews.adminLatest, { params: { limit }, ...config })
      .then(({ data }) => data)
  );
}
