import axios from "axios";
import { API_BASE_URL } from "@/constants/api";
import { getAuthSession } from "@/utils/storage";

export const BASE_URI = API_BASE_URL;

const axiosInstance = axios.create({
  baseURL: BASE_URI,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
  timeout: 15000,
});

// Request interceptor: automatically inject auth token
axiosInstance.interceptors.request.use(
  async (config) => {
    try {
      const session = await getAuthSession();
      if (session?.token) {
        config.headers.Authorization = `Bearer ${session.token}`;
      }
    } catch (err) {
      console.warn("Failed to retrieve token for axios request:", err);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Response interceptor: extract friendly error messages
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.message ||
      error.message ||
      "An unexpected network error occurred";
    console.log(message);
    return Promise.reject(new Error(message));
  },
);

export { axiosInstance as api };
export default axiosInstance;
