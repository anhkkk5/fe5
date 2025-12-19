import axios from "axios";
import { getCookie } from "../../helpers/cookie.jsx";

const API_BASE_URL =
  (import.meta.env?.VITE_API_BASE_URL || "").trim() || "https://be-dw0z.onrender.com/";
const NORMALIZED_BASE_URL = API_BASE_URL.endsWith("/")
  ? API_BASE_URL
  : `${API_BASE_URL}/`;

// Centralized Axios instance
const axiosInstance = axios.create({
  baseURL: NORMALIZED_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000,
});

// Add Authorization header if token is present
axiosInstance.interceptors.request.use((config) => {
  try {
    const token = localStorage.getItem("token") || getCookie("token");
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch (_) {}
  return config;
});

// Sử dụng axiosInstance thay vì fetch để nhất quán
export const get = async (path) => {
  try {
    const response = await axiosInstance.get(path);
    return response.data;
  } catch (error) {
    console.error("GET request error:", error);
    throw error;
  }
};

export const post = async (path, data) => {
  try {
    console.log("POST request to:", path, "with data:", data);
    const response = await axiosInstance.post(path, data);
    return response.data;
  } catch (error) {
    console.error("POST request error:", error);
    if (error.response) {
      console.error("Response data:", error.response.data);
      console.error("Response status:", error.response.status);
    }
    throw error;
  }
};

export const postForm = async (path, formData) => {
  try {
    const response = await axiosInstance.post(path, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  } catch (error) {
    console.error("POST FORM request error:", error);
    throw error;
  }
};

export const del = async (path) => {
  try {
    // Gửi yêu cầu DELETE đến API với ID của sản phẩm cần xóa
    const response = await axiosInstance.delete(path);
    return response.data;
  } catch (error) {
    console.error("DELETE request error:", error);
    throw error;
  }
};

export const edit = async (path, options) => {
  try {
    const response = await axiosInstance.patch(path, options);
    return response.data;
  } catch (error) {
    console.error("PATCH request error:", error);
    throw error;
  }
};

export const editForm = async (path, formData) => {
  try {
    const response = await axiosInstance.patch(path, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  } catch (error) {
    console.error("PATCH FORM request error:", error);
    throw error;
  }
};
