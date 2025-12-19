import { post } from "../../utils/axios/request";

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/";
const AUTH_REGISTER_PATH = import.meta.env.VITE_AUTH_REGISTER_PATH || "api/auth/register";

// If pointing to json-server (port 3002) and no explicit auth path, fallback to collections
const isJsonServer = BASE_URL.includes("3002") && !import.meta.env.VITE_AUTH_REGISTER_PATH;

const postWithFallback = async (path, data) => {
  try {
    return await post(path, data);
  } catch (err) {
    const status = err?.response?.status;
    const text = (err?.response?.data && JSON.stringify(err.response.data)) || "";
    const looksLikeNotFound = status === 404 || status === 405 || /Cannot POST/i.test(text);
    if (!looksLikeNotFound) throw err;

    // Toggle between `api/auth/...` and `auth/...` when not found/method not allowed
    const alt = path.startsWith("api/") ? path.replace(/^api\//, "auth/") : `api/${path}`;
    return await post(alt, data);
  }
};

export const registerCandidate = async (payload) => {
  const { confirmPassword, ...rest } = payload || {};
  const path = isJsonServer ? "Candidates" : AUTH_REGISTER_PATH;
  const data = { ...rest, ...(isJsonServer ? {} : { userType: "candidate" }) };
  const result = await postWithFallback(path, data);
  return result;
};

export const registerCompany = async (payload) => {
  const { confirmPassword, ...rest } = payload || {};
  const path = isJsonServer ? "Companies" : AUTH_REGISTER_PATH;
  const data = { ...rest, ...(isJsonServer ? {} : { userType: "company" }) };
  const result = await postWithFallback(path, data);
  return result;
};
