import axiosInstance from "../api/axios.js";
import { ENDPOINTS } from "../constants/endpoints.js";
import { handleServiceCall } from "../utils/index.js";

export async function getAdminOrders(params = {}, config = {}) {
  return handleServiceCall(
    axiosInstance.get(ENDPOINTS.adminOrders.list, { params, ...config }).then(({ data }) => data)
  );
}

export async function getAdminOrderById(id) {
  return handleServiceCall(
    axiosInstance.get(ENDPOINTS.adminOrders.byId(id)).then(({ data }) => data)
  );
}

export async function moveOrderToProcessing(id) {
  return handleServiceCall(
    axiosInstance.post(ENDPOINTS.adminOrders.processing(id)).then(({ data }) => data)
  );
}

export async function moveOrderToShipped(id) {
  return handleServiceCall(
    axiosInstance.post(ENDPOINTS.adminOrders.shipped(id)).then(({ data }) => data)
  );
}

export async function moveOrderToDelivered(id) {
  return handleServiceCall(
    axiosInstance.post(ENDPOINTS.adminOrders.delivered(id)).then(({ data }) => data)
  );
}

export async function cancelAdminOrder(id) {
  return handleServiceCall(
    axiosInstance.post(ENDPOINTS.adminOrders.cancel(id)).then(({ data }) => data)
  );
}

export async function refundAdminOrder(id) {
  return handleServiceCall(
    axiosInstance.post(ENDPOINTS.adminOrders.refund(id)).then(({ data }) => data)
  );
}

export async function updateCodOrderStatus(id, status) {
  return handleServiceCall(
    axiosInstance
      .post(ENDPOINTS.adminOrders.codStatus(id), { status })
      .then(({ data }) => data)
  );
}
