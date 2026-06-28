import axiosInstance from "../api/axios.js";
import { ENDPOINTS } from "../constants/endpoints.js";
import { handleServiceCall } from "../utils/index.js";

export async function getCouponStats(config = {}) {
  return handleServiceCall(
    axiosInstance.get(ENDPOINTS.adminCoupons.stats, config).then(({ data }) => data)
  );
}

export async function getCoupons(params = {}, config = {}) {
  return handleServiceCall(
    axiosInstance.get(ENDPOINTS.adminCoupons.list, { params, ...config }).then(({ data }) => data)
  );
}

export async function getCouponById(id, config = {}) {
  return handleServiceCall(
    axiosInstance.get(ENDPOINTS.adminCoupons.byId(id), config).then(({ data }) => data)
  );
}

export async function getCouponUsage(id, params = {}, config = {}) {
  return handleServiceCall(
    axiosInstance.get(ENDPOINTS.adminCoupons.usage(id), { params, ...config }).then(({ data }) => data)
  );
}

export async function createCoupon(payload, config = {}) {
  return handleServiceCall(
    axiosInstance.post(ENDPOINTS.adminCoupons.create, payload, config).then(({ data }) => data)
  );
}

export async function updateCoupon(id, payload, config = {}) {
  return handleServiceCall(
    axiosInstance.put(ENDPOINTS.adminCoupons.update(id), payload, config).then(({ data }) => data)
  );
}

export async function deleteCoupon(id, config = {}) {
  return handleServiceCall(
    axiosInstance.delete(ENDPOINTS.adminCoupons.delete(id), config).then(({ data }) => data)
  );
}

export async function activateCoupon(id, config = {}) {
  return handleServiceCall(
    axiosInstance.post(ENDPOINTS.adminCoupons.activate(id), null, config).then(({ data }) => data)
  );
}

export async function deactivateCoupon(id, config = {}) {
  return handleServiceCall(
    axiosInstance.post(ENDPOINTS.adminCoupons.deactivate(id), null, config).then(({ data }) => data)
  );
}

export async function duplicateCoupon(id, config = {}) {
  return handleServiceCall(
    axiosInstance.post(ENDPOINTS.adminCoupons.duplicate(id), null, config).then(({ data }) => data)
  );
}
