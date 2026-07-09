import axiosInstance from "../api/axios.js";
import { ENDPOINTS } from "../constants/endpoints.js";
import { handleServiceCall } from "../utils/index.js";

export async function getNewsletterStats(config = {}) {
  return handleServiceCall(
    axiosInstance.get(ENDPOINTS.adminNewsletter.stats, config).then(({ data }) => data)
  );
}

export async function getNewsletterSubscribers(params = {}, config = {}) {
  return handleServiceCall(
    axiosInstance.get(ENDPOINTS.adminNewsletter.list, { params, ...config }).then(({ data }) => data)
  );
}

export async function exportNewsletterCsv(params = {}) {
  const response = await axiosInstance.get(ENDPOINTS.adminNewsletter.exportCsv, {
    params,
    responseType: "blob",
  });
  return response.data;
}

export async function exportNewsletterExcel(params = {}) {
  const response = await axiosInstance.get(ENDPOINTS.adminNewsletter.exportExcel, {
    params,
    responseType: "blob",
  });
  return response.data;
}
