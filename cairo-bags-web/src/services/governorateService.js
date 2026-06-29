import axiosInstance from "../api/axios.js";
import { ENDPOINTS } from "../constants/endpoints.js";

export async function getGovernorates() {
  const { data } = await axiosInstance.get(ENDPOINTS.governorates.list);
  return Array.isArray(data) ? data : [];
}
