import { get, post, edit, del } from "../../utils/axios/request";

export const loginAdmin = async (email, password = "") => {
  // Query by email only, password will be checked on client side
  const result = await get(`Admins?email=${email}`);
  return result;
};

export const getAllAdmins = async () => {
  const result = await get("Admins");
  return result;
};

export const getDetailAdmin = async (id) => {
  const result = await get(`Admins/${id}`);
  return result;
};

export const createAdmin = async (options) => {
  const result = await post(`Admins`, options);
  return result;
};

export const editAdmin = async (id, options) => {
  const result = await edit(`Admins/${id}`, options);
  return result;
};

export const deleteAdmin = async (id) => {
  const result = await del(`Admins/${id}`);
  return result;
};
