import axiosInstance from "../api/axios.js";
import { ENDPOINTS } from "../constants/endpoints.js";
import { handleServiceCall } from "../utils/index.js";

export async function getProducts(params = {}, config = {}) {
  return handleServiceCall(
    axiosInstance.get(ENDPOINTS.products.list, { params, ...config }).then(({ data }) => data)
  );
}

export async function getFeaturedProducts() {
  return handleServiceCall(
    axiosInstance.get(ENDPOINTS.products.featured).then(({ data }) => data)
  );
}

export async function getNewArrivals() {
  return handleServiceCall(
    axiosInstance.get(ENDPOINTS.products.newArrivals).then(({ data }) => data)
  );
}

export async function searchProducts(params = {}) {
  return handleServiceCall(
    axiosInstance.get(ENDPOINTS.products.search, { params }).then(({ data }) => data)
  );
}

export async function getProductById(id, params = {}) {
  return handleServiceCall(
    axiosInstance.get(ENDPOINTS.products.byId(id), { params }).then(({ data }) => data)
  );
}

export async function getProductByIdentifier(identifier, params = {}) {
  const encoded = encodeURIComponent(String(identifier));
  return handleServiceCall(
    axiosInstance.get(ENDPOINTS.products.byId(encoded), { params }).then(({ data }) => data)
  );
}

export async function createProduct(payload) {
  return handleServiceCall(
    axiosInstance.post(ENDPOINTS.products.adminCreate, payload).then(({ data }) => data)
  );
}

export async function updateProduct(id, payload) {
  return handleServiceCall(
    axiosInstance.put(ENDPOINTS.products.adminUpdate(id), payload).then(({ data }) => data)
  );
}

export async function deleteProduct(id) {
  return handleServiceCall(
    axiosInstance.delete(ENDPOINTS.products.adminDelete(id)).then(({ data }) => data)
  );
}
