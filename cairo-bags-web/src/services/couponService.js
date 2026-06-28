import axiosInstance from "../api/axios.js";
import { ENDPOINTS } from "../constants/endpoints.js";
import { handleServiceCall } from "../utils/index.js";

export async function validateCoupon(payload, config = {}) {
  return handleServiceCall(
    axiosInstance.post(ENDPOINTS.coupons.validate, payload, config).then(({ data }) => data)
  );
}
