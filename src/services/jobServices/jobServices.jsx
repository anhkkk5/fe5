import { get, del, post, edit } from "../../utils/axios/request";
export const getAlljob = async (params = {}) => {
  // Xây dựng query string từ params
  const queryParams = new URLSearchParams();
  if (params.city) queryParams.append("city", params.city);
  if (params.keyword) queryParams.append("keyword", params.keyword);
  if (params.position) queryParams.append("position", params.position);

  const queryString = queryParams.toString();
  const url = queryString ? `jobs?${queryString}` : "jobs";
  const result = await get(url);
  return result;
};
export const getDetaiJob = async (id) => {
  const result = await get(`jobs/${id}`);
  return result;
};
export const getListJob = async (companyId) => {
  const list = await get(`jobs`);
  if (!companyId) return list;
  return Array.isArray(list)
    ? list.filter((j) => j.company_id === companyId)
    : [];
};

export const deleteJob = async (id) => {
  const result = await del(`jobs/${id}`);
  return result;
};
export const createJob = async (options) => {
  const result = await post("jobs", options);
  return result;
};

export const updateJob = async (id, options) => {
  const result = await edit(`jobs/${id}`, options);
  return result;
};
