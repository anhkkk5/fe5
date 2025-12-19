import { get, post, edit, del } from "../../utils/axios/request";
export const getEducationByCandidate = async () => {
  const result = await get("education");
  return result;
};

export const createEducation = async (options) => {
  const result = await post(`education`, options);
  return result;
};

export const updateEducation = async (id, options) => {
  const result = await edit(`education/${id}`, options);
  return result;
};

export const deleteEducation = async (id) => {
  const result = await del(`education/${id}`);
  return result;
};