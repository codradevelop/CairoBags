import axiosInstance from "../api/axios.js";
import { ENDPOINTS } from "../constants/endpoints.js";
import { handleServiceCall } from "../utils/index.js";

export async function getWishlist(config = {}) {
  return handleServiceCall(
    axiosInstance.get(ENDPOINTS.wishlist.list, config).then(({ data }) => data)
  );
}

export async function toggleWishlist(productId) {
  return handleServiceCall(
    axiosInstance.post(ENDPOINTS.wishlist.toggle(productId)).then(({ data }) => data)
  );
}

export async function removeWishlistItem(productId) {
  return handleServiceCall(
    axiosInstance.delete(ENDPOINTS.wishlist.remove(productId)).then(({ data }) => data)
  );
}

export async function getWishlistCount(config = {}) {
  return handleServiceCall(
    axiosInstance.get(ENDPOINTS.wishlist.count, config).then(({ data }) => data)
  );
}
