import axiosInstance from "../api/axios.js";
import { ENDPOINTS } from "../constants/endpoints.js";
import { handleServiceCall } from "../utils/index.js";

export async function getHomeStatistics(config = {}) {
  return handleServiceCall(
    axiosInstance.get(ENDPOINTS.home.statistics, config).then(({ data }) => data)
  );
}
