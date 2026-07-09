import axiosInstance from "../api/axios.js";
import { ENDPOINTS } from "../constants/endpoints.js";
import { handleServiceCall } from "../utils/index.js";

export async function subscribeNewsletter(payload, config = {}) {
  return handleServiceCall(
    axiosInstance.post(ENDPOINTS.newsletter.subscribe, payload, config).then(({ data }) => data)
  );
}

export async function getMyNewsletterStatus(config = {}) {
  return handleServiceCall(
    axiosInstance.get(ENDPOINTS.newsletter.me, config).then(({ data }) => data)
  );
}

export async function unsubscribeNewsletter(token, config = {}) {
  return handleServiceCall(
    axiosInstance.post(ENDPOINTS.newsletter.unsubscribe, { token }, config).then(({ data }) => data)
  );
}
