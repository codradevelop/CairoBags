import axiosInstance from "../api/axios.js";
import { ENDPOINTS } from "../constants/endpoints.js";
import { handleServiceCall } from "../utils/index.js";

export async function getCategories(params = {}, config = {}) {
  return handleServiceCall(
    axiosInstance.get(ENDPOINTS.categories.list, { params, ...config }).then(({ data }) => data)
  );
}

export async function getCategoryTree() {
  return handleServiceCall(
    axiosInstance.get(ENDPOINTS.categories.tree).then(({ data }) => data)
  );
}

export async function getCategoryById(id, params = {}) {
  return handleServiceCall(
    axiosInstance.get(ENDPOINTS.categories.byId(id), { params }).then(({ data }) => data)
  );
}

export async function getCategoryByIdentifier(identifier, params = {}) {
  const encoded = encodeURIComponent(String(identifier));
  return handleServiceCall(
    axiosInstance.get(ENDPOINTS.categories.byId(encoded), { params }).then(({ data }) => data)
  );
}

export async function createCategory(payload) {
  return handleServiceCall(
    axiosInstance.post(ENDPOINTS.categories.adminCreate, payload).then(({ data }) => data)
  );
}

export async function updateCategory(id, payload) {
  return handleServiceCall(
    axiosInstance.put(ENDPOINTS.categories.adminUpdate(id), payload).then(({ data }) => data)
  );
}

export async function deleteCategory(id) {
  return handleServiceCall(
    axiosInstance.delete(ENDPOINTS.categories.adminDelete(id)).then(({ data }) => data)
  );
}
