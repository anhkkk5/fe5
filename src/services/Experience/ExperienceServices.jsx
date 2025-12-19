import { get, post, edit, del } from "../../utils/axios/request";
export const getExperienceByCandidate = async () => {
  const result = await get(`experiences`);
  return result;
};

export const createExperience = async (options) => {
  const result = await post(`experiences`, options);
  return result;
};

export const updateExperience = async (id, options) => {
  const result = await edit(`experiences/${id}`, options);
  return result;
};

export const deleteExperience = async (id) => {
  const result = await del(`experiences/${id}`);
  return result;
};