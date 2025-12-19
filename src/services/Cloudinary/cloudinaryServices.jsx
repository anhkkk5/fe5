import { post, postForm } from "../../utils/axios/request";
import axios from "axios";
import { getCookie } from "../../helpers/cookie";

const API_BASE_URL =
  (import.meta.env?.VITE_API_BASE_URL || "").trim() || "http://localhost:3000/";
const NORMALIZED_BASE_URL = API_BASE_URL.endsWith("/")
  ? API_BASE_URL
  : `${API_BASE_URL}/`;

const getAxiosInstance = () => {
  const instance = axios.create({
    baseURL: NORMALIZED_BASE_URL,
    headers: {
      "Content-Type": "application/json",
    },
    timeout: 10000,
  });

  instance.interceptors.request.use((config) => {
    try {
      const token = localStorage.getItem("token") || getCookie("token");
      if (token) {
        config.headers = config.headers || {};
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (_) {}
    return config;
  });

  return instance;
};

// Upload 1 ảnh lên Cloudinary
export const uploadImage = async (file, folder = "avatars") => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("folder", folder);
  const result = await postForm("cloudinary/upload", formData);
  return result;
};

// Upload nhiều ảnh lên Cloudinary
export const uploadMultipleImages = async (files, folder = "products") => {
  const formData = new FormData();
  files.forEach((file) => {
    formData.append("files", file);
  });
  formData.append("folder", folder);
  const result = await postForm("cloudinary/upload-multiple", formData);
  return result;
};

// Xóa ảnh từ Cloudinary
export const deleteImage = async (publicId) => {
  const instance = getAxiosInstance();
  const response = await instance.delete("cloudinary/delete", {
    data: { publicId },
  });
  return response.data;
};

