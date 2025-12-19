import { get, post, edit, del } from "../../utils/axios/request";
export const getAllCompany = async () => {
  const result = await get("companies");
  return result;
};

export const getDetaiCompany = async (id) => {
  const result = await get(`companies/${id}`);
  return result;
};
export const checkExits = async (key, value) => {
  const result = await get(`companies?${key}=${value}`);
  return result;
};

export const createCompany = async (options) => {
  const result = await post(`companies`, options);
  return result;
};
export const loginCompany = async (email, password = "") => {
  // Query by email only, password will be checked on client side
  const result = await get(`companies?email=${email}`);
  return result;
};

export const editCompany = async (id, options) => {
  const result = await edit(`companies/${id}`, options);
  return result;
};

export const deleteCompany = async (id) => {
  const result = await del(`companies/${id}`);
  return result;
};

export const getMyCompany = async () => {
  const result = await get("companies/my-company");
  return result;
};

export const updateMyCompany = async (payload) => {
  const result = await edit("companies/my-company", payload);
  return result;
};
